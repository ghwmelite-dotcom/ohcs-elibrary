import { Hono } from 'hono';
import type { Context, Next } from 'hono';

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

    const document = await DB.prepare(`
      SELECT
        d.*,
        u.displayName as authorName,
        u.avatar as authorAvatar,
        (SELECT COUNT(*) FROM bookmarks b WHERE b.documentId = d.id AND b.userId = ?) as isBookmarked,
        (SELECT rating FROM document_ratings r WHERE r.documentId = d.id AND r.userId = ?) as userRating
      FROM documents d
      LEFT JOIN users u ON d.authorId = u.id
      WHERE d.id = ?
    `).bind(userId, userId, documentId).first();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Increment view count
    await DB.prepare(`
      UPDATE documents SET views = views + 1 WHERE id = ?
    `).bind(documentId).run();

    // Record view
    await DB.prepare(`
      INSERT OR REPLACE INTO document_views (documentId, userId, viewedAt)
      VALUES (?, ?, datetime('now'))
    `).bind(documentId, userId).run();

    return c.json({
      ...document,
      tags: document.tags ? JSON.parse(document.tags as string) : [],
      isBookmarked: (document.isBookmarked as number) > 0,
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

    // Create document record
    const documentId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO documents (
        id, title, description, category, tags,
        fileName, fileUrl, fileSize, fileType,
        accessLevel, status, authorId,
        views, downloads, averageRating, totalRatings, version,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, 0, 0, 0, 1, datetime('now'), datetime('now'))
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
      userId
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
    if (document.authorId !== userId && !['admin', 'librarian'].includes(userRole)) {
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
    if (document.authorId !== userId && !['admin', 'librarian'].includes(userRole)) {
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

// POST /documents/:id/analyze - AI analysis
documentsRoutes.post('/:id/analyze', async (c: AppContext) => {
  try {
    const { DB, AI, DOCUMENTS } = c.env;
    const documentId = c.req.param('id');

    const document = await DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // For now, return a placeholder analysis
    // In production, this would use Workers AI to analyze the document
    const analysis = {
      summary: `This document "${document.title}" contains important information related to ${document.category}. A detailed AI-powered summary will be available once the document analysis service is fully configured.`,
      keyPoints: [
        'Document analysis is being processed',
        'Key points will be extracted from the content',
        'Related topics and themes will be identified',
        'Suggested actions and next steps will be provided',
      ],
      topics: document.tags ? JSON.parse(document.tags as string) : [],
      suggestedTags: ['civil service', 'governance', 'policy'],
      relatedDocuments: [],
      readingTime: Math.ceil((document.fileSize as number) / 100000) * 5,
    };

    return c.json(analysis);
  } catch (error) {
    console.error('Error analyzing document:', error);
    return c.json({ error: 'Failed to analyze document' }, 500);
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

    // Return file for in-browser viewing
    const headers = new Headers();
    headers.set('Content-Type', document.fileType);
    headers.set('Content-Disposition', `inline; filename="${document.fileName}"`);
    headers.set('Cache-Control', 'public, max-age=3600');

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
