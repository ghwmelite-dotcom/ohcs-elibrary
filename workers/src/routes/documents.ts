import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import {
  extractTextFromDocument,
  generateDocumentAnalysis,
  answerDocumentQuestion,
  getCachedAnalysis,
  cacheAnalysis,
  getCachedText,
  saveChatMessage,
  getChatHistory,
} from '../services/documentAI';

interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
  JWT_SECRET: string;
}

interface Variables {
  userId?: string;
  userRole?: string;
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// Optional auth middleware - sets user if token provided, but doesn't require it
async function optionalAuth(c: AppContext, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { verify } = await import('hono/jwt');
      const token = authHeader.substring(7);
      const payload = await verify(token, c.env.JWT_SECRET);

      if (payload?.sub) {
        c.set('userId', payload.sub as string);
        c.set('userRole', (payload.role as string) || 'user');
      }
    } catch {
      // Token invalid, continue as unauthenticated
    }
  }

  // Set default guest user for unauthenticated requests
  if (!c.get('userId')) {
    c.set('userId', 'guest');
    c.set('userRole', 'guest');
  }

  await next();
}

// Require auth middleware for write operations
async function requireAuth(c: AppContext, next: Next) {
  const userId = c.get('userId');
  if (!userId || userId === 'guest') {
    return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
  }
  await next();
}

export const documentsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply optional auth to all document routes
documentsRoutes.use('*', optionalAuth);

// Document categories (static data)
const CATEGORIES = [
  { id: 'circulars', name: 'Circulars & Directives' },
  { id: 'policies', name: 'Policies & Guidelines' },
  { id: 'training', name: 'Training Materials' },
  { id: 'reports', name: 'Reports & Publications' },
  { id: 'forms', name: 'Forms & Templates' },
  { id: 'legal', name: 'Legal Documents' },
  { id: 'research', name: 'Research Papers' },
  { id: 'general', name: 'General Resources' },
];

// GET /documents - List documents with filtering and pagination
documentsRoutes.get('/', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';

    // Parse query parameters
    const url = new URL(c.req.url);
    const category = url.searchParams.get('category');
    const accessLevel = url.searchParams.get('accessLevel');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = `WHERE d.status = 'published'`;
    const countParams: any[] = [];
    const queryParams: any[] = [userId, userId];

    if (category) {
      whereClause += ` AND d.category = ?`;
      countParams.push(category);
      queryParams.push(category);
    }

    if (accessLevel) {
      whereClause += ` AND d.accessLevel = ?`;
      countParams.push(accessLevel);
      queryParams.push(accessLevel);
    }

    if (search) {
      whereClause += ` AND (d.title LIKE ? OR d.description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Get total count (simple query)
    const countQuery = `SELECT COUNT(*) as total FROM documents d ${whereClause}`;
    const countResult = await DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();
    const totalCount = countResult?.total || 0;

    // Build main query with sorting
    const validSortFields = ['title', 'createdAt', 'updatedAt', 'views', 'downloads', 'averageRating'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const query = `
      SELECT
        d.*,
        u.displayName as authorName,
        u.avatar as authorAvatar,
        (SELECT COUNT(*) FROM bookmarks b WHERE b.documentId = d.id AND b.userId = ?) as isBookmarked,
        (SELECT rating FROM document_ratings r WHERE r.documentId = d.id AND r.userId = ?) as userRating
      FROM documents d
      LEFT JOIN users u ON d.authorId = u.id
      ${whereClause}
      ORDER BY d.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    queryParams.push(limit, offset);

    // Execute query
    const { results } = await DB.prepare(query).bind(...queryParams).all();

    // Transform results
    const documents = (results || []).map((doc: any) => ({
      ...doc,
      tags: doc.tags ? JSON.parse(doc.tags) : [],
      isBookmarked: doc.isBookmarked > 0,
      author: doc.authorName ? {
        id: doc.authorId,
        displayName: doc.authorName,
        avatar: doc.authorAvatar,
      } : undefined,
    }));

    return c.json({
      documents,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

// GET /documents/categories - Get category counts
documentsRoutes.get('/categories', async (c: AppContext) => {
  try {
    const { DB } = c.env;

    const { results } = await DB.prepare(`
      SELECT category, COUNT(*) as count
      FROM documents
      WHERE status = 'published'
      GROUP BY category
    `).all();

    const categoryCounts = CATEGORIES.map((cat) => ({
      ...cat,
      count: results.find((r: any) => r.category === cat.id)?.count || 0,
    }));

    return c.json(categoryCounts);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json(CATEGORIES.map((cat) => ({ ...cat, count: 0 })));
  }
});

// GET /documents/stats - Get library statistics
documentsRoutes.get('/stats', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');

    // Get total documents
    const totalResult = await DB.prepare(`
      SELECT COUNT(*) as total FROM documents WHERE status = 'published'
    `).first<{ total: number }>();

    // Get monthly uploads
    const monthlyResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM documents
      WHERE status = 'published'
      AND createdAt >= datetime('now', '-30 days')
    `).first<{ count: number }>();

    // Get user bookmarks count
    const bookmarksResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM bookmarks WHERE userId = ?
    `).bind(userId).first<{ count: number }>();

    // Get trending count (documents with views in last 24h)
    const trendingResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM documents
      WHERE status = 'published'
      AND views > 0
      AND updatedAt >= datetime('now', '-1 day')
    `).first<{ count: number }>();

    return c.json({
      totalDocuments: totalResult?.total || 0,
      monthlyUploads: monthlyResult?.count || 0,
      userBookmarks: bookmarksResult?.count || 0,
      trendingCount: trendingResult?.count || 0,
      recentlyViewed: 0, // This would come from user session/local storage
      lastViewedAt: null,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({
      totalDocuments: 0,
      monthlyUploads: 0,
      userBookmarks: 0,
      trendingCount: 0,
      recentlyViewed: 0,
      lastViewedAt: null,
    });
  }
});

// GET /documents/search - Search documents
documentsRoutes.get('/search', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const query = c.req.query('q') || '';

    if (!query.trim()) {
      return c.json([]);
    }

    const { results } = await DB.prepare(`
      SELECT id, title, description, category, thumbnailUrl
      FROM documents
      WHERE status = 'published'
      AND (title LIKE ? OR description LIKE ?)
      LIMIT 10
    `).bind(`%${query}%`, `%${query}%`).all();

    return c.json(results);
  } catch (error) {
    console.error('Error searching documents:', error);
    return c.json([]);
  }
});

// GET /documents/recently-viewed - Get recently viewed documents for user
documentsRoutes.get('/recently-viewed', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');

    const { results } = await DB.prepare(`
      SELECT d.*
      FROM documents d
      INNER JOIN document_views v ON d.id = v.documentId
      WHERE v.userId = ?
      ORDER BY v.viewedAt DESC
      LIMIT 20
    `).bind(userId).all();

    return c.json(results);
  } catch (error) {
    console.error('Error fetching recently viewed:', error);
    return c.json([]);
  }
});

// GET /documents/:id - Get single document
documentsRoutes.get('/:id', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');
    const documentId = c.req.param('id');

    // First, get the basic document with author info (simpler query that won't fail)
    const document = await DB.prepare(`
      SELECT
        d.*,
        u.displayName as authorName,
        u.avatar as authorAvatar
      FROM documents d
      LEFT JOIN users u ON d.authorId = u.id
      WHERE d.id = ?
    `).bind(documentId).first();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Try to get bookmark status (non-blocking)
    let isBookmarked = false;
    try {
      const bookmark = await DB.prepare(`
        SELECT 1 FROM bookmarks WHERE documentId = ? AND userId = ?
      `).bind(documentId, userId).first();
      isBookmarked = !!bookmark;
    } catch (e) {
      console.log('Could not check bookmark status:', e);
    }

    // Try to get user rating (non-blocking)
    let userRating = null;
    try {
      const rating = await DB.prepare(`
        SELECT rating FROM document_ratings WHERE documentId = ? AND userId = ?
      `).bind(documentId, userId).first<{ rating: number }>();
      userRating = rating?.rating || null;
    } catch (e) {
      console.log('Could not check user rating:', e);
    }

    // Increment view count and record view (non-blocking, don't fail if tables don't exist)
    try {
      await DB.prepare(`
        UPDATE documents SET views = views + 1 WHERE id = ?
      `).bind(documentId).run();
    } catch (e) {
      console.log('Could not update view count:', e);
    }

    try {
      await DB.prepare(`
        INSERT OR REPLACE INTO document_views (documentId, userId, viewedAt)
        VALUES (?, ?, datetime('now'))
      `).bind(documentId, userId).run();
    } catch (e) {
      console.log('Could not record view:', e);
    }

    return c.json({
      ...document,
      tags: document.tags ? JSON.parse(document.tags as string) : [],
      isBookmarked,
      userRating,
      author: document.authorName ? {
        id: document.authorId,
        displayName: document.authorName,
        avatar: document.authorAvatar,
      } : undefined,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return c.json({ error: 'Failed to fetch document' }, 500);
  }
});

// POST /documents - Upload new document (requires auth)
documentsRoutes.post('/', requireAuth, async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId');
    const userRole = c.get('userRole');

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const accessLevel = formData.get('accessLevel') as string || 'internal';
    const tags = formData.get('tags') as string;
    const isDownloadable = formData.get('isDownloadable') !== 'false'; // Default true

    if (!file || !title || !category) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const fileKey = `documents/${fileName}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await DOCUMENTS.put(fileKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Auto-publish for admins, librarians, and contributors; pending for regular users
    const privilegedRoles = ['super_admin', 'admin', 'librarian', 'contributor'];
    const status = privilegedRoles.includes(userRole || '') ? 'published' : 'pending';

    // Create document record
    const documentId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO documents (
        id, title, description, category, tags,
        fileName, fileUrl, fileSize, fileType,
        accessLevel, status, authorId, isDownloadable,
        views, downloads, averageRating, totalRatings, version,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 1, datetime('now'), datetime('now'))
    `).bind(
      documentId,
      title,
      description || '',
      category,
      JSON.stringify(tags ? tags.split(',').map((t: string) => t.trim()) : []),
      file.name,
      fileKey,
      file.size,
      file.type,
      accessLevel,
      status,
      userId,
      isDownloadable ? 1 : 0
    ).run();

    const document = await DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first();

    return c.json(document, 201);
  } catch (error) {
    console.error('Error uploading document:', error);
    return c.json({ error: 'Failed to upload document' }, 500);
  }
});

// PATCH /documents/:id - Update document (requires auth)
documentsRoutes.patch('/:id', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');
    const documentId = c.req.param('id');
    const updates = await c.req.json();

    // Check ownership or admin role
    const document = await DB.prepare(`
      SELECT authorId FROM documents WHERE id = ?
    `).bind(documentId).first<{ authorId: string }>();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    const userRole = c.get('userRole');
    if (document.authorId !== userId && !['super_admin', 'admin', 'librarian'].includes(userRole)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Build update query
    const allowedFields = ['title', 'description', 'category', 'tags', 'accessLevel', 'status', 'isDownloadable'];
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fieldsToUpdate.push(`${key} = ?`);
        values.push(key === 'tags' ? JSON.stringify(value) : value);
      }
    }

    if (fieldsToUpdate.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    fieldsToUpdate.push('updatedAt = datetime("now")');
    values.push(documentId);

    await DB.prepare(`
      UPDATE documents SET ${fieldsToUpdate.join(', ')} WHERE id = ?
    `).bind(...values).run();

    const updated = await DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first();

    return c.json(updated);
  } catch (error) {
    console.error('Error updating document:', error);
    return c.json({ error: 'Failed to update document' }, 500);
  }
});

// DELETE /documents/:id - Delete document (requires auth)
documentsRoutes.delete('/:id', requireAuth, async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId');
    const documentId = c.req.param('id');

    // Check ownership or admin role
    const document = await DB.prepare(`
      SELECT authorId, fileUrl FROM documents WHERE id = ?
    `).bind(documentId).first<{ authorId: string; fileUrl: string }>();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    const userRole = c.get('userRole');
    if (document.authorId !== userId && !['super_admin', 'admin', 'librarian'].includes(userRole)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Delete from R2
    if (document.fileUrl) {
      await DOCUMENTS.delete(document.fileUrl);
    }

    // Delete from database
    await DB.prepare(`DELETE FROM documents WHERE id = ?`).bind(documentId).run();
    await DB.prepare(`DELETE FROM bookmarks WHERE documentId = ?`).bind(documentId).run();
    await DB.prepare(`DELETE FROM document_ratings WHERE documentId = ?`).bind(documentId).run();
    await DB.prepare(`DELETE FROM document_views WHERE documentId = ?`).bind(documentId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return c.json({ error: 'Failed to delete document' }, 500);
  }
});

// POST /documents/:id/rate - Rate a document (requires auth)
documentsRoutes.post('/:id/rate', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');
    const documentId = c.req.param('id');
    const { rating, review } = await c.req.json();

    if (rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }

    // Upsert rating
    await DB.prepare(`
      INSERT INTO document_ratings (id, documentId, userId, rating, review, createdAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(documentId, userId) DO UPDATE SET rating = ?, review = ?, createdAt = datetime('now')
    `).bind(crypto.randomUUID(), documentId, userId, rating, review || null, rating, review || null).run();

    // Update document average rating
    const avgResult = await DB.prepare(`
      SELECT AVG(rating) as avg, COUNT(*) as count
      FROM document_ratings
      WHERE documentId = ?
    `).bind(documentId).first<{ avg: number; count: number }>();

    await DB.prepare(`
      UPDATE documents SET averageRating = ?, totalRatings = ? WHERE id = ?
    `).bind(avgResult?.avg || 0, avgResult?.count || 0, documentId).run();

    return c.json({
      averageRating: avgResult?.avg || 0,
      totalRatings: avgResult?.count || 0,
    });
  } catch (error) {
    console.error('Error rating document:', error);
    return c.json({ error: 'Failed to rate document' }, 500);
  }
});

// POST /documents/:id/analyze - AI analysis (production-ready)
documentsRoutes.post('/:id/analyze', async (c: AppContext) => {
  try {
    const documentId = c.req.param('id');
    const { refresh } = await c.req.json().catch(() => ({ refresh: false }));

    const document = await c.env.DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Check for cached analysis (unless refresh requested)
    if (!refresh) {
      const cached = await getCachedAnalysis(c.env, documentId);
      if (cached) {
        return c.json({
          ...cached,
          cached: true,
        });
      }
    }

    // Extract text from document
    let extractedText = await getCachedText(c.env, documentId);
    if (!extractedText) {
      extractedText = await extractTextFromDocument(
        c.env,
        document.fileUrl as string,
        document.fileType as string
      );
    }

    // Generate AI analysis
    const analysis = await generateDocumentAnalysis(
      c.env,
      documentId,
      document.title as string,
      document.description as string || '',
      document.category as string,
      extractedText
    );

    // Cache the analysis
    await cacheAnalysis(c.env, documentId, analysis, extractedText);

    return c.json({
      ...analysis,
      cached: false,
    });
  } catch (error) {
    console.error('Error analyzing document:', error);
    return c.json({ error: 'Failed to analyze document' }, 500);
  }
});

// GET /documents/:id/analysis - Get cached analysis (quick endpoint)
documentsRoutes.get('/:id/analysis', async (c: AppContext) => {
  try {
    const documentId = c.req.param('id');

    // Check for cached analysis first
    const cached = await getCachedAnalysis(c.env, documentId);
    if (cached) {
      return c.json({
        ...cached,
        cached: true,
        available: true,
      });
    }

    // No cached analysis - return indicator that analysis is needed
    const document = await c.env.DB.prepare(`
      SELECT title, description, category FROM documents WHERE id = ?
    `).bind(documentId).first();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    return c.json({
      available: false,
      message: 'AI analysis not yet generated. Use POST /analyze to generate.',
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return c.json({ error: 'Failed to fetch analysis' }, 500);
  }
});

// POST /documents/:id/chat - Ask questions about the document
documentsRoutes.post('/:id/chat', async (c: AppContext) => {
  try {
    const documentId = c.req.param('id');
    const userId = c.get('userId') || 'guest';
    const { question } = await c.req.json();

    if (!question || question.trim().length < 3) {
      return c.json({ error: 'Question is required and must be at least 3 characters' }, 400);
    }

    const document = await c.env.DB.prepare(`
      SELECT id, title, description, category, fileUrl, fileType FROM documents WHERE id = ?
    `).bind(documentId).first();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Get or extract document text
    let extractedText = await getCachedText(c.env, documentId);
    if (!extractedText) {
      extractedText = await extractTextFromDocument(
        c.env,
        document.fileUrl as string,
        document.fileType as string
      );

      // Cache the extracted text if we had to extract it
      if (extractedText) {
        try {
          await c.env.DB.prepare(`
            INSERT INTO document_ai_analysis (id, documentId, extractedText, createdAt, updatedAt)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(documentId) DO UPDATE SET extractedText = ?, updatedAt = datetime('now')
          `).bind(crypto.randomUUID(), documentId, extractedText, extractedText).run();
        } catch (e) {
          console.log('Could not cache extracted text:', e);
        }
      }
    }

    // Get chat history for context
    let chatHistory: any[] = [];
    try {
      chatHistory = await getChatHistory(c.env, documentId, userId, 5);
    } catch (e) {
      console.log('Could not fetch chat history:', e);
    }

    // Generate answer using AI
    const answer = await answerDocumentQuestion(
      c.env,
      documentId,
      document.title as string,
      extractedText || document.description as string || '',
      question,
      chatHistory
    );

    // Save chat message
    let messageId = '';
    try {
      messageId = await saveChatMessage(c.env, documentId, userId, question, answer);
    } catch (e) {
      console.log('Could not save chat message:', e);
      messageId = crypto.randomUUID();
    }

    return c.json({
      id: messageId,
      question,
      answer,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in document chat:', error);
    return c.json({ error: 'Failed to process question' }, 500);
  }
});

// GET /documents/:id/chat - Get chat history for a document
documentsRoutes.get('/:id/chat', async (c: AppContext) => {
  try {
    const documentId = c.req.param('id');
    const userId = c.get('userId') || 'guest';
    const limit = parseInt(c.req.query('limit') || '20');

    const document = await c.env.DB.prepare(`
      SELECT id FROM documents WHERE id = ?
    `).bind(documentId).first();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    let messages: any[] = [];
    try {
      messages = await getChatHistory(c.env, documentId, userId, limit);
    } catch (e) {
      console.log('Could not fetch chat history:', e);
    }

    return c.json({ messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return c.json({ error: 'Failed to fetch chat history' }, 500);
  }
});

// POST /documents/:id/chat/:messageId/feedback - Rate a chat answer
documentsRoutes.post('/:id/chat/:messageId/feedback', async (c: AppContext) => {
  try {
    const messageId = c.req.param('messageId');
    const { helpful } = await c.req.json();

    if (typeof helpful !== 'boolean') {
      return c.json({ error: 'Helpful must be a boolean' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE document_chat_history SET helpful = ? WHERE id = ?
    `).bind(helpful ? 1 : 0, messageId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return c.json({ error: 'Failed to save feedback' }, 500);
  }
});

// GET /documents/:id/view - View document (returns file for in-browser viewing)
documentsRoutes.get('/:id/view', async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const documentId = c.req.param('id');

    const document = await DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first<{ fileUrl: string; fileName: string; fileType: string }>();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Get file from R2
    const object = await DOCUMENTS.get(document.fileUrl);
    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Return file for in-browser viewing with proper headers for iframe embedding
    const headers = new Headers();
    headers.set('Content-Type', document.fileType);
    headers.set('Content-Disposition', `inline; filename="${document.fileName}"`);
    headers.set('Cache-Control', 'public, max-age=3600');

    // Allow embedding in iframes from our frontend domains
    // Include wildcard for Cloudflare Pages preview deployments
    headers.set('Content-Security-Policy', "frame-ancestors 'self' https://ohcs-elibrary.pages.dev https://*.ohcs-elibrary.pages.dev https://ohcs-elibrary.gov.gh http://localhost:5173 http://localhost:3000");
    headers.set('X-Frame-Options', 'ALLOWALL'); // Deprecated but some browsers still check it

    // CORS headers for cross-origin access - be permissive for document viewing
    const origin = c.req.header('Origin') || '';
    if (origin) {
      // Allow any origin that requested the document - PDFs need this for cross-origin viewing
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
    } else {
      // No origin header - allow all (for direct browser access)
      headers.set('Access-Control-Allow-Origin', '*');
    }

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error viewing document:', error);
    return c.json({ error: 'Failed to view document' }, 500);
  }
});

// GET /documents/:id/download - Download document
documentsRoutes.get('/:id/download', async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId');
    const documentId = c.req.param('id');

    const document = await DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first<{ fileUrl: string; fileName: string; fileType: string; isDownloadable: number }>();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Check if document is downloadable
    if (!document.isDownloadable) {
      return c.json({
        error: 'Download restricted',
        message: 'This document is not available for download'
      }, 403);
    }

    // Get file from R2
    const object = await DOCUMENTS.get(document.fileUrl);
    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Increment download count
    await DB.prepare(`
      UPDATE documents SET downloads = downloads + 1 WHERE id = ?
    `).bind(documentId).run();

    // Return file
    const headers = new Headers();
    headers.set('Content-Type', document.fileType);
    headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`);

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error downloading document:', error);
    return c.json({ error: 'Failed to download document' }, 500);
  }
});
