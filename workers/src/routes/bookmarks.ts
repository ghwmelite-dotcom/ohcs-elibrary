import { Hono } from 'hono';
import type { Context } from 'hono';

interface Env {
  DB: D1Database;
}

interface Variables {
  userId: string;
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export const bookmarksRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /bookmarks - Get user's bookmarks
bookmarksRoutes.get('/', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');

    const { results } = await DB.prepare(`
      SELECT
        b.id,
        b.documentId,
        b.notes,
        b.createdAt,
        d.title,
        d.description,
        d.category,
        d.thumbnailUrl,
        d.fileType,
        d.accessLevel
      FROM bookmarks b
      INNER JOIN documents d ON b.documentId = d.id
      WHERE b.userId = ?
      ORDER BY b.createdAt DESC
    `).bind(userId).all();

    const bookmarks = results.map((b: any) => ({
      id: b.id,
      documentId: b.documentId,
      notes: b.notes,
      createdAt: b.createdAt,
      document: {
        id: b.documentId,
        title: b.title,
        description: b.description,
        category: b.category,
        thumbnailUrl: b.thumbnailUrl,
        fileType: b.fileType,
        accessLevel: b.accessLevel,
      },
    }));

    return c.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return c.json([]);
  }
});

// POST /bookmarks - Add bookmark
bookmarksRoutes.post('/', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');
    const { documentId, notes } = await c.req.json();

    if (!documentId) {
      return c.json({ error: 'Document ID is required' }, 400);
    }

    // Check if document exists
    const document = await DB.prepare(`
      SELECT id FROM documents WHERE id = ?
    `).bind(documentId).first();

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Check if already bookmarked
    const existing = await DB.prepare(`
      SELECT id FROM bookmarks WHERE documentId = ? AND userId = ?
    `).bind(documentId, userId).first();

    if (existing) {
      return c.json({ error: 'Document already bookmarked' }, 409);
    }

    // Create bookmark
    const bookmarkId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO bookmarks (id, documentId, userId, notes, createdAt)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(bookmarkId, documentId, userId, notes || null).run();

    const bookmark = await DB.prepare(`
      SELECT * FROM bookmarks WHERE id = ?
    `).bind(bookmarkId).first();

    return c.json(bookmark, 201);
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return c.json({ error: 'Failed to create bookmark' }, 500);
  }
});

// DELETE /bookmarks/:documentId - Remove bookmark
bookmarksRoutes.delete('/:documentId', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');
    const documentId = c.req.param('documentId');

    const result = await DB.prepare(`
      DELETE FROM bookmarks WHERE documentId = ? AND userId = ?
    `).bind(documentId, userId).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Bookmark not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return c.json({ error: 'Failed to remove bookmark' }, 500);
  }
});

// PATCH /bookmarks/:documentId - Update bookmark notes
bookmarksRoutes.patch('/:documentId', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');
    const documentId = c.req.param('documentId');
    const { notes } = await c.req.json();

    const result = await DB.prepare(`
      UPDATE bookmarks SET notes = ? WHERE documentId = ? AND userId = ?
    `).bind(notes, documentId, userId).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Bookmark not found' }, 404);
    }

    const bookmark = await DB.prepare(`
      SELECT * FROM bookmarks WHERE documentId = ? AND userId = ?
    `).bind(documentId, userId).first();

    return c.json(bookmark);
  } catch (error) {
    console.error('Error updating bookmark:', error);
    return c.json({ error: 'Failed to update bookmark' }, 500);
  }
});
