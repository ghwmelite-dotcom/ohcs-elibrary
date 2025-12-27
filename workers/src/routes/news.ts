import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const news = new Hono<{ Bindings: Env }>();

// Get all news articles with filtering and pagination
news.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const {
      category,
      source,
      search,
      isBreaking,
      isFeatured,
      limit = '20',
      offset = '0'
    } = c.req.query();

    let query = `
      SELECT
        a.*,
        s.name as sourceName,
        s.logoUrl as sourceLogoUrl,
        s.url as sourceUrl
      FROM news_articles a
      LEFT JOIN news_sources s ON a.sourceId = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ` AND a.category = ?`;
      params.push(category);
    }

    if (source) {
      query += ` AND a.sourceId = ?`;
      params.push(source);
    }

    if (search) {
      query += ` AND (a.title LIKE ? OR a.summary LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (isBreaking === 'true') {
      query += ` AND a.isBreaking = 1`;
    }

    if (isFeatured === 'true') {
      query += ` AND a.isFeatured = 1`;
    }

    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Add sorting and pagination
    query += ` ORDER BY a.isBreaking DESC, a.publishedAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const articles = await db.prepare(query).bind(...params).all();

    // Parse tags JSON for each article and include new fields
    const parsedArticles = articles.results?.map((article: any) => ({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : [],
      readingTimeMinutes: article.readingTimeMinutes || 1,
      sentiment: article.sentiment || 'neutral',
      aiSummary: article.aiSummary || null,
      source: {
        id: article.sourceId,
        name: article.sourceName,
        logoUrl: article.sourceLogoUrl,
        url: article.sourceUrl
      }
    })) || [];

    return c.json({
      articles: parsedArticles,
      total,
      hasMore: parseInt(offset) + parsedArticles.length < total
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return c.json({ error: 'Failed to fetch news articles' }, 500);
  }
});

// Get breaking news
news.get('/breaking', async (c) => {
  try {
    const db = c.env.DB;

    const articles = await db.prepare(`
      SELECT
        a.*,
        s.name as sourceName,
        s.logoUrl as sourceLogoUrl
      FROM news_articles a
      LEFT JOIN news_sources s ON a.sourceId = s.id
      WHERE a.isBreaking = 1
      ORDER BY a.publishedAt DESC
      LIMIT 5
    `).all();

    const parsedArticles = articles.results?.map((article: any) => ({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : [],
      readingTimeMinutes: article.readingTimeMinutes || 1,
      sentiment: article.sentiment || 'neutral',
      aiSummary: article.aiSummary || null,
      source: {
        id: article.sourceId,
        name: article.sourceName,
        logoUrl: article.sourceLogoUrl
      }
    })) || [];

    return c.json({ articles: parsedArticles });
  } catch (error) {
    console.error('Error fetching breaking news:', error);
    return c.json({ error: 'Failed to fetch breaking news' }, 500);
  }
});

// Get news categories
news.get('/categories', async (c) => {
  try {
    const db = c.env.DB;

    // Get categories with article counts
    const categories = await db.prepare(`
      SELECT
        c.*,
        COUNT(a.id) as articleCount
      FROM news_categories c
      LEFT JOIN news_articles a ON c.slug = a.category
      WHERE c.isActive = 1
      GROUP BY c.id
      ORDER BY c.sortOrder ASC
    `).all();

    return c.json({ categories: categories.results || [] });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// Get news sources
news.get('/sources', async (c) => {
  try {
    const db = c.env.DB;

    const sources = await db.prepare(`
      SELECT
        s.*,
        COUNT(a.id) as articleCount
      FROM news_sources s
      LEFT JOIN news_articles a ON s.id = a.sourceId
      WHERE s.isActive = 1
      GROUP BY s.id
      ORDER BY s.name ASC
    `).all();

    return c.json({ sources: sources.results || [] });
  } catch (error) {
    console.error('Error fetching sources:', error);
    return c.json({ error: 'Failed to fetch sources' }, 500);
  }
});

// Get user's bookmarked articles (requires auth) - MUST be before /:id route
news.get('/bookmarks/list', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.get('userId');
    const { limit = '20', offset = '0' } = c.req.query();

    const bookmarks = await db.prepare(`
      SELECT
        a.*,
        s.name as sourceName,
        s.logoUrl as sourceLogoUrl,
        b.createdAt as bookmarkedAt
      FROM news_bookmarks b
      JOIN news_articles a ON b.articleId = a.id
      LEFT JOIN news_sources s ON a.sourceId = s.id
      WHERE b.userId = ?
      ORDER BY b.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(userId, parseInt(limit), parseInt(offset)).all();

    const parsedBookmarks = bookmarks.results?.map((article: any) => ({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : [],
      source: {
        id: article.sourceId,
        name: article.sourceName,
        logoUrl: article.sourceLogoUrl
      }
    })) || [];

    return c.json({ articles: parsedBookmarks });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return c.json({ error: 'Failed to fetch bookmarks' }, 500);
  }
});

// Get single article by ID
news.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');

    // Increment view count
    await db.prepare(`
      UPDATE news_articles SET viewCount = viewCount + 1 WHERE id = ?
    `).bind(id).run();

    const article = await db.prepare(`
      SELECT
        a.*,
        s.name as sourceName,
        s.logoUrl as sourceLogoUrl,
        s.url as sourceUrl
      FROM news_articles a
      LEFT JOIN news_sources s ON a.sourceId = s.id
      WHERE a.id = ?
    `).bind(id).first();

    if (!article) {
      return c.json({ error: 'Article not found' }, 404);
    }

    return c.json({
      ...article,
      tags: article.tags ? JSON.parse(article.tags as string) : [],
      readingTimeMinutes: (article as any).readingTimeMinutes || 1,
      sentiment: (article as any).sentiment || 'neutral',
      source: {
        id: article.sourceId,
        name: article.sourceName,
        logoUrl: article.sourceLogoUrl,
        url: article.sourceUrl
      }
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return c.json({ error: 'Failed to fetch article' }, 500);
  }
});

// Bookmark an article (requires auth)
news.post('/:id/bookmark', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const articleId = c.req.param('id');
    const userId = c.get('userId');

    // Check if article exists
    const article = await db.prepare(`
      SELECT id FROM news_articles WHERE id = ?
    `).bind(articleId).first();

    if (!article) {
      return c.json({ error: 'Article not found' }, 404);
    }

    // Check if already bookmarked
    const existing = await db.prepare(`
      SELECT id FROM news_bookmarks WHERE articleId = ? AND userId = ?
    `).bind(articleId, userId).first();

    if (existing) {
      return c.json({ message: 'Article already bookmarked', bookmarked: true });
    }

    // Create bookmark
    const bookmarkId = `bm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await db.prepare(`
      INSERT INTO news_bookmarks (id, articleId, userId) VALUES (?, ?, ?)
    `).bind(bookmarkId, articleId, userId).run();

    return c.json({ message: 'Article bookmarked', bookmarked: true, id: bookmarkId });
  } catch (error) {
    console.error('Error bookmarking article:', error);
    return c.json({ error: 'Failed to bookmark article' }, 500);
  }
});

// Remove bookmark (requires auth)
news.delete('/:id/bookmark', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const articleId = c.req.param('id');
    const userId = c.get('userId');

    await db.prepare(`
      DELETE FROM news_bookmarks WHERE articleId = ? AND userId = ?
    `).bind(articleId, userId).run();

    return c.json({ message: 'Bookmark removed', bookmarked: false });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return c.json({ error: 'Failed to remove bookmark' }, 500);
  }
});

// Check if article is bookmarked (requires auth)
news.get('/:id/bookmark/status', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const articleId = c.req.param('id');
    const userId = c.get('userId');

    const bookmark = await db.prepare(`
      SELECT id FROM news_bookmarks WHERE articleId = ? AND userId = ?
    `).bind(articleId, userId).first();

    return c.json({ bookmarked: !!bookmark });
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return c.json({ error: 'Failed to check bookmark status' }, 500);
  }
});

// Admin: Create article
news.post('/', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const { title, summary, content, url, imageUrl, sourceId, category, tags, isBreaking, isFeatured, publishedAt } = body;

    if (!title || !url || !sourceId || !category) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const articleId = `art_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    await db.prepare(`
      INSERT INTO news_articles (id, title, summary, content, url, imageUrl, sourceId, category, tags, isBreaking, isFeatured, publishedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      articleId,
      title,
      summary || null,
      content || null,
      url,
      imageUrl || null,
      sourceId,
      category,
      tags ? JSON.stringify(tags) : null,
      isBreaking ? 1 : 0,
      isFeatured ? 1 : 0,
      publishedAt || new Date().toISOString()
    ).run();

    return c.json({ message: 'Article created', id: articleId }, 201);
  } catch (error) {
    console.error('Error creating article:', error);
    return c.json({ error: 'Failed to create article' }, 500);
  }
});

// Admin: Update article
news.put('/:id', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { title, summary, content, url, imageUrl, sourceId, category, tags, isBreaking, isFeatured, publishedAt } = body;

    const existing = await db.prepare(`SELECT id FROM news_articles WHERE id = ?`).bind(id).first();
    if (!existing) {
      return c.json({ error: 'Article not found' }, 404);
    }

    await db.prepare(`
      UPDATE news_articles SET
        title = COALESCE(?, title),
        summary = COALESCE(?, summary),
        content = COALESCE(?, content),
        url = COALESCE(?, url),
        imageUrl = COALESCE(?, imageUrl),
        sourceId = COALESCE(?, sourceId),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        isBreaking = COALESCE(?, isBreaking),
        isFeatured = COALESCE(?, isFeatured),
        publishedAt = COALESCE(?, publishedAt)
      WHERE id = ?
    `).bind(
      title || null,
      summary || null,
      content || null,
      url || null,
      imageUrl || null,
      sourceId || null,
      category || null,
      tags ? JSON.stringify(tags) : null,
      isBreaking !== undefined ? (isBreaking ? 1 : 0) : null,
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
      publishedAt || null,
      id
    ).run();

    return c.json({ message: 'Article updated' });
  } catch (error) {
    console.error('Error updating article:', error);
    return c.json({ error: 'Failed to update article' }, 500);
  }
});

// Admin: Delete article
news.delete('/:id', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');

    await db.prepare(`DELETE FROM news_articles WHERE id = ?`).bind(id).run();

    return c.json({ message: 'Article deleted' });
  } catch (error) {
    console.error('Error deleting article:', error);
    return c.json({ error: 'Failed to delete article' }, 500);
  }
});

// Admin: Manage sources
news.post('/sources', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const { name, url, logoUrl, description } = body;

    if (!name || !url) {
      return c.json({ error: 'Name and URL are required' }, 400);
    }

    const sourceId = `src_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    await db.prepare(`
      INSERT INTO news_sources (id, name, url, logoUrl, description)
      VALUES (?, ?, ?, ?, ?)
    `).bind(sourceId, name, url, logoUrl || null, description || null).run();

    return c.json({ message: 'Source created', id: sourceId }, 201);
  } catch (error) {
    console.error('Error creating source:', error);
    return c.json({ error: 'Failed to create source' }, 500);
  }
});

export const newsRoutes = news;
