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

import {
  getConnection,
  getValidAccessToken,
  getFileContent,
  extractTextFromDriveFile,
  GOOGLE_EXPORT_MIMES,
} from '../services/googleDrive';

interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
  JWT_SECRET: string;
  GOOGLE_DRIVE_CLIENT_ID: string;
  GOOGLE_DRIVE_CLIENT_SECRET: string;
  GOOGLE_DRIVE_REDIRECT_URI: string;
}

interface Variables {
  userId?: string;
  userRole?: string;
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// Optional auth middleware - sets user if token provided, but doesn't require it
// Supports both Authorization header and query parameter (for iframe/embed use cases)
async function optionalAuth(c: AppContext, next: Next) {
  const authHeader = c.req.header('Authorization');
  const url = new URL(c.req.url);
  const queryToken = url.searchParams.get('token');

  // Try Authorization header first, then query parameter
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : queryToken;

  if (token) {
    try {
      const { verify } = await import('hono/jwt');
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

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper to check if user is admin
function isAdmin(c: AppContext): boolean {
  const role = c.get('userRole');
  return role === 'admin' || role === 'super_admin';
}

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

// GET /documents/categories - Get all categories with document counts
documentsRoutes.get('/categories', async (c: AppContext) => {
  try {
    const { DB } = c.env;

    // Get categories from database with document counts
    const { results } = await DB.prepare(`
      SELECT
        dc.*,
        COALESCE(
          (SELECT COUNT(*) FROM documents d
           WHERE d.category = dc.slug AND d.status = 'published'),
          0
        ) as documentCount
      FROM document_categories dc
      WHERE dc.isActive = 1
      ORDER BY dc.sortOrder ASC, dc.name ASC
    `).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json([]);
  }
});

// GET /documents/category-counts - Get document counts grouped by category field
documentsRoutes.get('/category-counts', async (c: AppContext) => {
  try {
    const { DB } = c.env;

    // Count documents grouped by their actual category field value
    const { results } = await DB.prepare(`
      SELECT
        category as id,
        category as name,
        COUNT(*) as count
      FROM documents
      WHERE status = 'published'
      GROUP BY category
      ORDER BY count DESC
    `).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching category counts:', error);
    return c.json([]);
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

// Allowed file types for upload (MIME types and extensions)
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/vnd.ms-powerpoint': ['ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
};

// Max file size: 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Validate file type by checking both MIME type and extension
function validateFileType(file: File): { valid: boolean; error?: string } {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  // Check if MIME type is allowed
  if (!ALLOWED_FILE_TYPES[mimeType]) {
    return {
      valid: false,
      error: `File type "${mimeType}" is not allowed. Allowed types: PDF, Word, Excel, PowerPoint.`
    };
  }

  // Check if extension matches the MIME type
  const allowedExtensions = ALLOWED_FILE_TYPES[mimeType];
  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File extension ".${ext}" does not match the file type "${mimeType}".`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds the maximum allowed size (500MB).`
    };
  }

  return { valid: true };
}

// POST /documents - Upload new document (admin only)
documentsRoutes.post('/', requireAuth, async (c: AppContext) => {
  try {
    // Only admins can upload documents
    if (!isAdmin(c)) {
      return c.json({ error: 'Forbidden', message: 'Admin access required to upload documents' }, 403);
    }

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

    // Server-side file type validation
    const fileValidation = validateFileType(file);
    if (!fileValidation.valid) {
      return c.json({ error: 'Invalid file', message: fileValidation.error }, 400);
    }

    // Generate unique filename with validated extension
    const ext = file.name.split('.').pop()?.toLowerCase();
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

    // Add to Ozzy embedding queue for RAG processing
    try {
      await DB.prepare(`
        INSERT INTO embedding_queue (id, documentId, status, priority, createdAt)
        VALUES (?, ?, 'pending', 0, datetime('now'))
      `).bind(crypto.randomUUID(), documentId).run();
    } catch (e) {
      // Queue insertion is non-critical, log but don't fail upload
      console.log('Could not add document to embedding queue:', e);
    }

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
// Supports both local R2 files and Google Drive files
documentsRoutes.post('/:id/analyze', requireAuth, async (c: AppContext) => {
  try {
    const documentId = c.req.param('id');
    const { refresh } = await c.req.json().catch(() => ({ refresh: false }));

    const document = await c.env.DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first() as any;

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

    // Extract text from document (handle both local and Google Drive files)
    let extractedText = await getCachedText(c.env, documentId);
    if (!extractedText) {
      // Check if this is a Google Drive file
      if (document.source === 'google_drive' && document.externalFileId && document.driveConnectionId) {
        try {
          const connection = await getConnection(c.env, document.driveConnectionId);
          if (connection && connection.isActive) {
            const accessToken = await getValidAccessToken(c.env, connection);
            extractedText = await extractTextFromDriveFile(
              accessToken,
              document.externalFileId,
              document.externalMimeType || document.fileType
            );
          }
        } catch (driveError) {
          console.error('Error extracting text from Drive file:', driveError);
        }
      }

      // Fallback to local R2 extraction
      if (!extractedText) {
        extractedText = await extractTextFromDocument(
          c.env,
          document.fileUrl as string,
          document.fileType as string
        );
      }
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
// Supports both local R2 files and Google Drive files
documentsRoutes.post('/:id/chat', requireAuth, async (c: AppContext) => {
  try {
    const documentId = c.req.param('id');
    const userId = c.get('userId') || 'guest';
    const { question } = await c.req.json();

    if (!question || question.trim().length < 3) {
      return c.json({ error: 'Question is required and must be at least 3 characters' }, 400);
    }

    const document = await c.env.DB.prepare(`
      SELECT id, title, description, category, fileUrl, fileType, source, externalFileId, externalMimeType, driveConnectionId FROM documents WHERE id = ?
    `).bind(documentId).first() as any;

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Get or extract document text (handle both local and Google Drive files)
    let extractedText = await getCachedText(c.env, documentId);
    if (!extractedText) {
      // Check if this is a Google Drive file
      if (document.source === 'google_drive' && document.externalFileId && document.driveConnectionId) {
        try {
          const connection = await getConnection(c.env, document.driveConnectionId);
          if (connection && connection.isActive) {
            const accessToken = await getValidAccessToken(c.env, connection);
            extractedText = await extractTextFromDriveFile(
              accessToken,
              document.externalFileId,
              document.externalMimeType || document.fileType
            );
          }
        } catch (driveError) {
          console.error('Error extracting text from Drive file:', driveError);
        }
      }

      // Fallback to local R2 extraction
      if (!extractedText) {
        extractedText = await extractTextFromDocument(
          c.env,
          document.fileUrl as string,
          document.fileType as string
        );
      }

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
documentsRoutes.post('/:id/chat/:messageId/feedback', requireAuth, async (c: AppContext) => {
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

// Allowed origins for CORS (document viewing)
const ALLOWED_ORIGINS = [
  'https://ohcs-elibrary.pages.dev',
  'https://ohcs-elibrary.gov.gh',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Check if origin is allowed (including Cloudflare Pages preview deployments)
function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow Cloudflare Pages preview deployments
  if (origin.match(/^https:\/\/[a-z0-9]+\.ohcs-elibrary\.pages\.dev$/)) return true;
  return false;
}

// Check if user can access document based on access level
function canAccessDocument(accessLevel: string, userId: string, userRole: string): boolean {
  // Public documents are accessible to everyone
  if (accessLevel === 'public') return true;

  // All other access levels require authentication
  if (!userId || userId === 'guest') return false;

  // Internal documents are accessible to any authenticated user
  if (accessLevel === 'internal') return true;

  // Restricted, confidential, secret require higher roles
  if (accessLevel === 'restricted') {
    return ['admin', 'moderator', 'staff'].includes(userRole);
  }

  if (accessLevel === 'confidential' || accessLevel === 'secret') {
    return ['admin', 'superadmin'].includes(userRole);
  }

  return false;
}

// GET /documents/:id/view - View document (returns file for in-browser viewing)
// Supports both local R2 files and Google Drive files
documentsRoutes.get('/:id/view', async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const documentId = c.req.param('id');
    const userId = c.get('userId') || 'guest';
    const userRole = c.get('userRole') || 'guest';

    const document = await DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first<{
      fileUrl: string;
      fileName: string;
      fileType: string;
      accessLevel: string;
      source?: string;
      externalFileId?: string;
      externalMimeType?: string;
      driveConnectionId?: string;
    }>();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Check access level permissions
    if (!canAccessDocument(document.accessLevel, userId, userRole)) {
      return c.json({
        error: 'Access denied',
        message: 'You do not have permission to view this document. Please log in or request access.'
      }, 403);
    }

    let responseBody: ReadableStream | ArrayBuffer | null = null;
    let contentType = document.fileType;

    // Handle Google Drive files
    if (document.source === 'google_drive' && document.externalFileId && document.driveConnectionId) {
      try {
        const connection = await getConnection(c.env, document.driveConnectionId);
        if (!connection || !connection.isActive) {
          return c.json({ error: 'Drive connection not found or inactive' }, 404);
        }

        const accessToken = await getValidAccessToken(c.env, connection);
        const mimeType = document.externalMimeType || document.fileType;
        // Export Office files as PDF for viewing in browser
        const { response, contentType: exportedContentType } = await getFileContent(
          accessToken,
          document.externalFileId,
          mimeType,
          true // Export Office files as PDF for viewing
        );

        contentType = exportedContentType;
        responseBody = response.body;
      } catch (driveError) {
        console.error('Error fetching from Google Drive:', driveError);
        return c.json({ error: 'Failed to fetch file from Google Drive' }, 500);
      }
    } else {
      // Handle local R2 files
      const object = await DOCUMENTS.get(document.fileUrl);
      if (!object) {
        return c.json({ error: 'File not found' }, 404);
      }
      responseBody = object.body;
    }

    if (!responseBody) {
      return c.json({ error: 'File content not available' }, 404);
    }

    // Return file for in-browser viewing with proper headers for iframe embedding
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${document.fileName}"`);
    headers.set('Cache-Control', 'private, max-age=3600'); // Private cache for authenticated content

    // Allow embedding in iframes from our frontend domains
    headers.set('Content-Security-Policy', "frame-ancestors 'self' https://ohcs-elibrary.pages.dev https://*.ohcs-elibrary.pages.dev https://ohcs-elibrary.gov.gh http://localhost:5173 http://localhost:3000");
    headers.set('X-Frame-Options', 'ALLOWALL');

    // CORS headers - restrict to allowed origins only
    const origin = c.req.header('Origin') || '';
    if (origin && isAllowedOrigin(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
    } else if (!origin) {
      // Direct browser access (no Origin header) - use primary domain
      headers.set('Access-Control-Allow-Origin', 'https://ohcs-elibrary.pages.dev');
    }
    // Note: If origin is not allowed, we don't set CORS headers (browser will block)

    return new Response(responseBody, { headers });
  } catch (error) {
    console.error('Error viewing document:', error);
    return c.json({ error: 'Failed to view document' }, 500);
  }
});

// GET /documents/:id/download - Download document
// Supports both local R2 files and Google Drive files
documentsRoutes.get('/:id/download', async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId') || 'guest';
    const userRole = c.get('userRole') || 'guest';
    const documentId = c.req.param('id');

    const document = await DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first<{
      fileUrl: string;
      fileName: string;
      fileType: string;
      isDownloadable: number;
      accessLevel: string;
      source?: string;
      externalFileId?: string;
      externalMimeType?: string;
      driveConnectionId?: string;
    }>();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Check access level permissions first
    if (!canAccessDocument(document.accessLevel, userId, userRole)) {
      return c.json({
        error: 'Access denied',
        message: 'You do not have permission to download this document. Please log in or request access.'
      }, 403);
    }

    // Check if document is downloadable
    if (!document.isDownloadable) {
      return c.json({
        error: 'Download restricted',
        message: 'This document is not available for download'
      }, 403);
    }

    let responseBody: ReadableStream | ArrayBuffer | null = null;
    let contentType = document.fileType;

    // Handle Google Drive files
    if (document.source === 'google_drive' && document.externalFileId && document.driveConnectionId) {
      try {
        const connection = await getConnection(c.env, document.driveConnectionId);
        if (!connection || !connection.isActive) {
          return c.json({ error: 'Drive connection not found or inactive' }, 404);
        }

        const accessToken = await getValidAccessToken(c.env, connection);
        const mimeType = document.externalMimeType || document.fileType;
        // Download original format (not exported as PDF)
        const { response, contentType: downloadContentType } = await getFileContent(
          accessToken,
          document.externalFileId,
          mimeType,
          false // Keep original format for downloads
        );

        contentType = downloadContentType;
        responseBody = response.body;
      } catch (driveError) {
        console.error('Error fetching from Google Drive:', driveError);
        return c.json({ error: 'Failed to fetch file from Google Drive' }, 500);
      }
    } else {
      // Handle local R2 files
      const object = await DOCUMENTS.get(document.fileUrl);
      if (!object) {
        return c.json({ error: 'File not found' }, 404);
      }
      responseBody = object.body;
    }

    if (!responseBody) {
      return c.json({ error: 'File content not available' }, 404);
    }

    // Increment download count
    await DB.prepare(`
      UPDATE documents SET downloads = downloads + 1 WHERE id = ?
    `).bind(documentId).run();

    // Return file with proper CORS headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`);

    // CORS headers for download
    const origin = c.req.header('Origin') || '';
    if (origin && isAllowedOrigin(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return new Response(responseBody, { headers });
  } catch (error) {
    console.error('Error downloading document:', error);
    return c.json({ error: 'Failed to download document' }, 500);
  }
});

// ============================================================================
// ADMIN CATEGORY MANAGEMENT ENDPOINTS
// ============================================================================

// GET /documents/categories/admin - Get all categories (including inactive) for admin
documentsRoutes.get('/categories/admin', requireAuth, async (c: AppContext) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
    }

    const { DB } = c.env;

    const { results } = await DB.prepare(`
      SELECT
        dc.*,
        COALESCE(
          (SELECT COUNT(*) FROM documents d
           WHERE d.category = dc.slug AND d.status = 'published'),
          0
        ) as documentCount
      FROM document_categories dc
      ORDER BY dc.sortOrder ASC, dc.name ASC
    `).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// POST /documents/categories - Create a new category (admin only)
documentsRoutes.post('/categories', requireAuth, async (c: AppContext) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
    }

    const { DB } = c.env;
    const body = await c.req.json();
    const { name, description, icon, color } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Category name is required' }, 400);
    }

    const slug = generateSlug(name.trim());
    const id = `cat-${slug}-${Date.now()}`;

    // Check for duplicate name or slug
    const existing = await DB.prepare(`
      SELECT id FROM document_categories WHERE name = ? OR slug = ?
    `).bind(name.trim(), slug).first();

    if (existing) {
      return c.json({ error: 'A category with this name already exists' }, 400);
    }

    // Get max sort order
    const maxOrder = await DB.prepare(`
      SELECT COALESCE(MAX(sortOrder), 0) + 1 as nextOrder FROM document_categories
    `).first<{ nextOrder: number }>();

    await DB.prepare(`
      INSERT INTO document_categories (id, name, slug, description, icon, color, sortOrder)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      name.trim(),
      slug,
      description || null,
      icon || 'folder',
      color || '#006B3F',
      maxOrder?.nextOrder || 1
    ).run();

    const newCategory = await DB.prepare(`
      SELECT * FROM document_categories WHERE id = ?
    `).bind(id).first();

    return c.json(newCategory, 201);
  } catch (error) {
    console.error('Error creating category:', error);
    return c.json({ error: 'Failed to create category' }, 500);
  }
});

// PUT /documents/categories/:id - Update a category (admin only)
documentsRoutes.put('/categories/:id', requireAuth, async (c: AppContext) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
    }

    const { DB } = c.env;
    const categoryId = c.req.param('id');
    const body = await c.req.json();
    const { name, description, icon, color, sortOrder, isActive } = body;

    // Check category exists
    const existing = await DB.prepare(`
      SELECT * FROM document_categories WHERE id = ?
    `).bind(categoryId).first();

    if (!existing) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      const newSlug = generateSlug(name.trim());
      // Check for duplicate
      const duplicate = await DB.prepare(`
        SELECT id FROM document_categories WHERE (name = ? OR slug = ?) AND id != ?
      `).bind(name.trim(), newSlug, categoryId).first();

      if (duplicate) {
        return c.json({ error: 'A category with this name already exists' }, 400);
      }

      updates.push('name = ?', 'slug = ?');
      values.push(name.trim(), newSlug);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }

    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }

    if (sortOrder !== undefined) {
      updates.push('sortOrder = ?');
      values.push(sortOrder);
    }

    if (isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updates.push('updatedAt = datetime("now")');
    values.push(categoryId);

    await DB.prepare(`
      UPDATE document_categories SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    const updated = await DB.prepare(`
      SELECT * FROM document_categories WHERE id = ?
    `).bind(categoryId).first();

    return c.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    return c.json({ error: 'Failed to update category' }, 500);
  }
});

// DELETE /documents/categories/:id - Delete a category (admin only)
documentsRoutes.delete('/categories/:id', requireAuth, async (c: AppContext) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
    }

    const { DB } = c.env;
    const categoryId = c.req.param('id');

    // Check category exists
    const existing = await DB.prepare(`
      SELECT * FROM document_categories WHERE id = ?
    `).bind(categoryId).first<any>();

    if (!existing) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Check if any documents use this category
    const docCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM documents WHERE category = ?
    `).bind(existing.slug).first<{ count: number }>();

    if (docCount && docCount.count > 0) {
      return c.json({
        error: 'Cannot delete category',
        message: `This category is used by ${docCount.count} document(s). Please reassign them first.`,
        documentCount: docCount.count
      }, 400);
    }

    await DB.prepare(`
      DELETE FROM document_categories WHERE id = ?
    `).bind(categoryId).run();

    return c.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

// PUT /documents/categories/reorder - Reorder categories (admin only)
documentsRoutes.put('/categories/reorder', requireAuth, async (c: AppContext) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
    }

    const { DB } = c.env;
    const body = await c.req.json();
    const { categories } = body;

    if (!Array.isArray(categories)) {
      return c.json({ error: 'Categories array is required' }, 400);
    }

    // Update sort order for each category
    for (let i = 0; i < categories.length; i++) {
      await DB.prepare(`
        UPDATE document_categories SET sortOrder = ?, updatedAt = datetime("now") WHERE id = ?
      `).bind(i + 1, categories[i]).run();
    }

    return c.json({ success: true, message: 'Categories reordered successfully' });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return c.json({ error: 'Failed to reorder categories' }, 500);
  }
});

// ============================================================
// Document Comments API
// ============================================================

// GET /documents/:id/comments - List comments for a document (paginated, newest first)
documentsRoutes.get('/:id/comments', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const documentId = c.req.param('id');
    const userId = c.get('userId') || 'guest';

    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Get total count of top-level comments
    const countResult = await DB.prepare(`
      SELECT COUNT(*) as total FROM document_comments
      WHERE documentId = ? AND parentId IS NULL
    `).bind(documentId).first<{ total: number }>();
    const totalCount = countResult?.total || 0;

    // Get top-level comments with author info and user like status
    const { results: comments } = await DB.prepare(`
      SELECT
        dc.*,
        u.displayName as authorName,
        u.avatar as authorAvatar,
        (SELECT COUNT(*) FROM document_comment_likes dcl WHERE dcl.commentId = dc.id AND dcl.userId = ?) as isLiked
      FROM document_comments dc
      LEFT JOIN users u ON dc.userId = u.id
      WHERE dc.documentId = ? AND dc.parentId IS NULL
      ORDER BY dc.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(userId, documentId, limit, offset).all();

    // Get replies for each top-level comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment: any) => {
        const { results: replies } = await DB.prepare(`
          SELECT
            dc.*,
            u.displayName as authorName,
            u.avatar as authorAvatar,
            (SELECT COUNT(*) FROM document_comment_likes dcl WHERE dcl.commentId = dc.id AND dcl.userId = ?) as isLiked
          FROM document_comments dc
          LEFT JOIN users u ON dc.userId = u.id
          WHERE dc.parentId = ?
          ORDER BY dc.createdAt ASC
        `).bind(userId, comment.id).all();

        return {
          ...comment,
          isLiked: comment.isLiked > 0,
          author: comment.authorName ? {
            id: comment.userId,
            displayName: comment.authorName,
            avatar: comment.authorAvatar,
          } : undefined,
          replies: (replies || []).map((reply: any) => ({
            ...reply,
            isLiked: reply.isLiked > 0,
            author: reply.authorName ? {
              id: reply.userId,
              displayName: reply.authorName,
              avatar: reply.authorAvatar,
            } : undefined,
          })),
        };
      })
    );

    return c.json({
      comments: commentsWithReplies,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return c.json({ error: 'Failed to fetch comments' }, 500);
  }
});

// POST /documents/:id/comments - Add a comment (auth required)
documentsRoutes.post('/:id/comments', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const documentId = c.req.param('id');
    const userId = c.get('userId')!;
    const body = await c.req.json();
    const { content, parentId } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return c.json({ error: 'Comment content is required' }, 400);
    }

    // Verify document exists
    const doc = await DB.prepare(`SELECT id FROM documents WHERE id = ?`).bind(documentId).first();
    if (!doc) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // If replying, verify parent comment exists and belongs to same document
    if (parentId) {
      const parent = await DB.prepare(`
        SELECT id FROM document_comments WHERE id = ? AND documentId = ?
      `).bind(parentId, documentId).first();
      if (!parent) {
        return c.json({ error: 'Parent comment not found' }, 404);
      }
    }

    const commentId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO document_comments (id, documentId, userId, parentId, content, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(commentId, documentId, userId, parentId || null, content.trim()).run();

    // Fetch the created comment with author info
    const comment = await DB.prepare(`
      SELECT dc.*, u.displayName as authorName, u.avatar as authorAvatar
      FROM document_comments dc
      LEFT JOIN users u ON dc.userId = u.id
      WHERE dc.id = ?
    `).bind(commentId).first();

    return c.json({
      ...comment,
      isLiked: false,
      author: comment?.authorName ? {
        id: comment.userId,
        displayName: comment.authorName,
        avatar: comment.authorAvatar,
      } : undefined,
      replies: [],
    }, 201);
  } catch (error) {
    console.error('Error creating comment:', error);
    return c.json({ error: 'Failed to create comment' }, 500);
  }
});

// DELETE /documents/:id/comments/:commentId - Delete own comment or admin delete
documentsRoutes.delete('/:id/comments/:commentId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const documentId = c.req.param('id');
    const commentId = c.req.param('commentId');
    const userId = c.get('userId')!;

    // Get the comment
    const comment = await DB.prepare(`
      SELECT id, userId FROM document_comments WHERE id = ? AND documentId = ?
    `).bind(commentId, documentId).first<{ id: string; userId: string }>();

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    // Only the comment author or an admin can delete
    if (comment.userId !== userId && !isAdmin(c)) {
      return c.json({ error: 'Forbidden', message: 'You can only delete your own comments' }, 403);
    }

    // Delete the comment (CASCADE will handle likes and child replies)
    await DB.prepare(`DELETE FROM document_comments WHERE id = ?`).bind(commentId).run();

    return c.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return c.json({ error: 'Failed to delete comment' }, 500);
  }
});

// POST /documents/:id/comments/:commentId/like - Toggle like on a comment
documentsRoutes.post('/:id/comments/:commentId/like', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const documentId = c.req.param('id');
    const commentId = c.req.param('commentId');
    const userId = c.get('userId')!;

    // Verify comment exists and belongs to document
    const comment = await DB.prepare(`
      SELECT id FROM document_comments WHERE id = ? AND documentId = ?
    `).bind(commentId, documentId).first();

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    // Check if already liked
    const existingLike = await DB.prepare(`
      SELECT id FROM document_comment_likes WHERE commentId = ? AND userId = ?
    `).bind(commentId, userId).first();

    if (existingLike) {
      // Unlike
      await DB.prepare(`DELETE FROM document_comment_likes WHERE commentId = ? AND userId = ?`).bind(commentId, userId).run();
      await DB.prepare(`UPDATE document_comments SET likesCount = MAX(0, likesCount - 1) WHERE id = ?`).bind(commentId).run();
      return c.json({ liked: false });
    } else {
      // Like
      const likeId = crypto.randomUUID();
      await DB.prepare(`
        INSERT INTO document_comment_likes (id, commentId, userId, createdAt) VALUES (?, ?, ?, datetime('now'))
      `).bind(likeId, commentId, userId).run();
      await DB.prepare(`UPDATE document_comments SET likesCount = likesCount + 1 WHERE id = ?`).bind(commentId).run();
      return c.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return c.json({ error: 'Failed to toggle like' }, 500);
  }
});

// ============================================================
// Document Collections API
// ============================================================

// GET /documents/collections - List user's collections
// Note: This route is registered after /:id routes but Hono matches literal segments first
documentsRoutes.get('/collections', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;

    const { results } = await DB.prepare(`
      SELECT * FROM document_collections
      WHERE userId = ?
      ORDER BY updatedAt DESC
    `).bind(userId).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return c.json({ error: 'Failed to fetch collections' }, 500);
  }
});

// POST /documents/collections - Create a collection
documentsRoutes.post('/collections', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const body = await c.req.json();
    const { name, description, isPublic } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return c.json({ error: 'Collection name is required' }, 400);
    }

    const collectionId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO document_collections (id, userId, name, description, isPublic, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(collectionId, userId, name.trim(), description || null, isPublic ? 1 : 0).run();

    const collection = await DB.prepare(`SELECT * FROM document_collections WHERE id = ?`).bind(collectionId).first();
    return c.json(collection, 201);
  } catch (error) {
    console.error('Error creating collection:', error);
    return c.json({ error: 'Failed to create collection' }, 500);
  }
});

// GET /documents/collections/:id - Get collection with its documents
documentsRoutes.get('/collections/:id', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const collectionId = c.req.param('id');
    const userId = c.get('userId') || 'guest';

    const collection = await DB.prepare(`
      SELECT dc.*, u.displayName as ownerName
      FROM document_collections dc
      LEFT JOIN users u ON dc.userId = u.id
      WHERE dc.id = ?
    `).bind(collectionId).first();

    if (!collection) {
      return c.json({ error: 'Collection not found' }, 404);
    }

    // Only owner or public collections are viewable
    if (!collection.isPublic && collection.userId !== userId && !isAdmin(c)) {
      return c.json({ error: 'Forbidden', message: 'This collection is private' }, 403);
    }

    // Get documents in collection
    const { results: documents } = await DB.prepare(`
      SELECT d.*, dci.addedAt,
        u.displayName as authorName,
        u.avatar as authorAvatar
      FROM document_collection_items dci
      INNER JOIN documents d ON dci.documentId = d.id
      LEFT JOIN users u ON d.authorId = u.id
      WHERE dci.collectionId = ?
      ORDER BY dci.addedAt DESC
    `).bind(collectionId).all();

    return c.json({
      ...collection,
      owner: collection.ownerName ? {
        id: collection.userId,
        displayName: collection.ownerName,
      } : undefined,
      documents: (documents || []).map((doc: any) => ({
        ...doc,
        tags: doc.tags ? JSON.parse(doc.tags) : [],
        author: doc.authorName ? {
          id: doc.authorId,
          displayName: doc.authorName,
          avatar: doc.authorAvatar,
        } : undefined,
      })),
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return c.json({ error: 'Failed to fetch collection' }, 500);
  }
});

// PUT /documents/collections/:id - Update a collection
documentsRoutes.put('/collections/:id', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const collectionId = c.req.param('id');
    const userId = c.get('userId')!;
    const body = await c.req.json();
    const { name, description, isPublic } = body;

    // Verify ownership
    const collection = await DB.prepare(`
      SELECT id, userId FROM document_collections WHERE id = ?
    `).bind(collectionId).first<{ id: string; userId: string }>();

    if (!collection) {
      return c.json({ error: 'Collection not found' }, 404);
    }
    if (collection.userId !== userId) {
      return c.json({ error: 'Forbidden', message: 'You can only update your own collections' }, 403);
    }

    await DB.prepare(`
      UPDATE document_collections
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          isPublic = COALESCE(?, isPublic),
          updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      name?.trim() || null,
      description !== undefined ? description : null,
      isPublic !== undefined ? (isPublic ? 1 : 0) : null,
      collectionId
    ).run();

    const updated = await DB.prepare(`SELECT * FROM document_collections WHERE id = ?`).bind(collectionId).first();
    return c.json(updated);
  } catch (error) {
    console.error('Error updating collection:', error);
    return c.json({ error: 'Failed to update collection' }, 500);
  }
});

// DELETE /documents/collections/:id - Delete a collection (owner only)
documentsRoutes.delete('/collections/:id', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const collectionId = c.req.param('id');
    const userId = c.get('userId')!;

    const collection = await DB.prepare(`
      SELECT id, userId FROM document_collections WHERE id = ?
    `).bind(collectionId).first<{ id: string; userId: string }>();

    if (!collection) {
      return c.json({ error: 'Collection not found' }, 404);
    }
    if (collection.userId !== userId) {
      return c.json({ error: 'Forbidden', message: 'You can only delete your own collections' }, 403);
    }

    // CASCADE will handle collection items
    await DB.prepare(`DELETE FROM document_collections WHERE id = ?`).bind(collectionId).run();

    return c.json({ success: true, message: 'Collection deleted' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return c.json({ error: 'Failed to delete collection' }, 500);
  }
});

// POST /documents/collections/:id/documents - Add document to collection
documentsRoutes.post('/collections/:id/documents', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const collectionId = c.req.param('id');
    const userId = c.get('userId')!;
    const body = await c.req.json();
    const { documentId } = body;

    if (!documentId) {
      return c.json({ error: 'documentId is required' }, 400);
    }

    // Verify collection ownership
    const collection = await DB.prepare(`
      SELECT id, userId FROM document_collections WHERE id = ?
    `).bind(collectionId).first<{ id: string; userId: string }>();

    if (!collection) {
      return c.json({ error: 'Collection not found' }, 404);
    }
    if (collection.userId !== userId) {
      return c.json({ error: 'Forbidden', message: 'You can only add to your own collections' }, 403);
    }

    // Verify document exists
    const doc = await DB.prepare(`SELECT id FROM documents WHERE id = ?`).bind(documentId).first();
    if (!doc) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Add to collection (UNIQUE constraint prevents duplicates)
    const itemId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO document_collection_items (id, collectionId, documentId, addedAt)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(itemId, collectionId, documentId).run();

    // Update document count
    await DB.prepare(`
      UPDATE document_collections
      SET documentCount = (SELECT COUNT(*) FROM document_collection_items WHERE collectionId = ?),
          updatedAt = datetime('now')
      WHERE id = ?
    `).bind(collectionId, collectionId).run();

    return c.json({ success: true, message: 'Document added to collection' }, 201);
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      return c.json({ error: 'Document already in collection' }, 409);
    }
    console.error('Error adding document to collection:', error);
    return c.json({ error: 'Failed to add document to collection' }, 500);
  }
});

// DELETE /documents/collections/:id/documents/:documentId - Remove document from collection
documentsRoutes.delete('/collections/:id/documents/:documentId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const collectionId = c.req.param('id');
    const documentId = c.req.param('documentId');
    const userId = c.get('userId')!;

    // Verify collection ownership
    const collection = await DB.prepare(`
      SELECT id, userId FROM document_collections WHERE id = ?
    `).bind(collectionId).first<{ id: string; userId: string }>();

    if (!collection) {
      return c.json({ error: 'Collection not found' }, 404);
    }
    if (collection.userId !== userId) {
      return c.json({ error: 'Forbidden', message: 'You can only remove from your own collections' }, 403);
    }

    await DB.prepare(`
      DELETE FROM document_collection_items WHERE collectionId = ? AND documentId = ?
    `).bind(collectionId, documentId).run();

    // Update document count
    await DB.prepare(`
      UPDATE document_collections
      SET documentCount = (SELECT COUNT(*) FROM document_collection_items WHERE collectionId = ?),
          updatedAt = datetime('now')
      WHERE id = ?
    `).bind(collectionId, collectionId).run();

    return c.json({ success: true, message: 'Document removed from collection' });
  } catch (error) {
    console.error('Error removing document from collection:', error);
    return c.json({ error: 'Failed to remove document from collection' }, 500);
  }
});
