/**
 * Global Search API Routes
 * Unified search across all content types: documents, forum, users, groups, events, courses
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware, optionalAuth } from '../middleware/auth';

interface SearchResult {
  id: string;
  type: 'document' | 'topic' | 'user' | 'group' | 'event' | 'course' | 'news';
  title: string;
  description: string;
  url: string;
  metadata: Record<string, any>;
  score: number;
  highlights: string[];
  createdAt: string;
}

const searchRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /search - Global unified search
 * Query params:
 * - q: search query (required)
 * - types: comma-separated list of types to search (optional, defaults to all)
 * - limit: max results per type (optional, default 10)
 * - page: page number (optional, default 1)
 */
searchRoutes.get('/', async (c) => {
  const query = c.req.query('q')?.trim();
  const typesParam = c.req.query('types');
  const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);
  const page = Math.max(parseInt(c.req.query('page') || '1'), 1);
  const offset = (page - 1) * limit;

  if (!query || query.length < 2) {
    return c.json({ error: 'Search query must be at least 2 characters' }, 400);
  }

  // Determine which types to search
  const allTypes = ['document', 'topic', 'user', 'group', 'event', 'course', 'news'];
  const types = typesParam ? typesParam.split(',').filter(t => allTypes.includes(t)) : allTypes;

  const searchTerm = `%${query}%`;
  const results: SearchResult[] = [];

  try {
    // Search Documents
    if (types.includes('document')) {
      const docs = await c.env.DB.prepare(`
        SELECT
          d.id,
          d.title,
          d.description,
          d.category,
          d.fileType,
          d.downloads,
          d.createdAt,
          u.displayName as authorName
        FROM documents d
        LEFT JOIN users u ON d.authorId = u.id
        WHERE d.status = 'published'
          AND (d.title LIKE ? OR d.description LIKE ? OR d.category LIKE ?)
        ORDER BY
          CASE WHEN d.title LIKE ? THEN 1 ELSE 2 END,
          d.downloads DESC
        LIMIT ? OFFSET ?
      `).bind(searchTerm, searchTerm, searchTerm, searchTerm, limit, offset).all();

      for (const doc of docs.results || []) {
        const d = doc as any;
        results.push({
          id: d.id,
          type: 'document',
          title: d.title,
          description: d.description || '',
          url: `/library/${d.id}`,
          metadata: {
            category: d.category,
            format: d.fileType?.toUpperCase(),
            downloads: d.downloads,
            author: d.authorName,
          },
          score: d.title?.toLowerCase().includes(query.toLowerCase()) ? 0.9 : 0.7,
          highlights: extractHighlights(query, d.title, d.description),
          createdAt: d.createdAt,
        });
      }
    }

    // Search Forum Topics
    if (types.includes('topic')) {
      const topics = await c.env.DB.prepare(`
        SELECT
          t.id,
          t.title,
          t.content,
          t.views,
          t.createdAt,
          u.displayName as authorName,
          c.name as categoryName,
          (SELECT COUNT(*) FROM forum_posts WHERE topicId = t.id) as replyCount
        FROM forum_topics t
        LEFT JOIN users u ON t.authorId = u.id
        LEFT JOIN forum_categories c ON t.categoryId = c.id
        WHERE t.title LIKE ? OR t.content LIKE ?
        ORDER BY
          CASE WHEN t.title LIKE ? THEN 1 ELSE 2 END,
          t.views DESC
        LIMIT ? OFFSET ?
      `).bind(searchTerm, searchTerm, searchTerm, limit, offset).all();

      for (const topic of topics.results || []) {
        const t = topic as any;
        results.push({
          id: t.id,
          type: 'topic',
          title: t.title,
          description: truncateText(stripHtml(t.content), 150),
          url: `/forum/topic/${t.id}`,
          metadata: {
            category: t.categoryName,
            replies: t.replyCount,
            views: t.views,
            author: t.authorName,
          },
          score: t.title?.toLowerCase().includes(query.toLowerCase()) ? 0.85 : 0.65,
          highlights: extractHighlights(query, t.title, t.content),
          createdAt: t.createdAt,
        });
      }
    }

    // Search Users
    if (types.includes('user')) {
      const users = await c.env.DB.prepare(`
        SELECT
          u.id,
          u.displayName,
          u.firstName,
          u.lastName,
          u.department,
          u.jobTitle,
          u.avatar,
          u.role
        FROM users u
        WHERE u.isActive = 1
          AND (u.displayName LIKE ? OR u.firstName LIKE ? OR u.lastName LIKE ? OR u.department LIKE ? OR u.jobTitle LIKE ?)
        ORDER BY
          CASE WHEN u.displayName LIKE ? THEN 1 ELSE 2 END
        LIMIT ? OFFSET ?
      `).bind(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset).all();

      for (const user of users.results || []) {
        const u = user as any;
        const fullName = u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown User';
        results.push({
          id: u.id,
          type: 'user',
          title: fullName,
          description: `${u.jobTitle || ''} ${u.department ? `at ${u.department}` : ''}`.trim() || 'Civil Servant',
          url: `/profile/${u.id}`,
          metadata: {
            department: u.department,
            title: u.jobTitle,
            role: u.role,
            avatar: u.avatar,
          },
          score: fullName.toLowerCase().includes(query.toLowerCase()) ? 0.9 : 0.6,
          highlights: extractHighlights(query, fullName, u.department),
          createdAt: '',
        });
      }
    }

    // Search Groups
    if (types.includes('group')) {
      const groups = await c.env.DB.prepare(`
        SELECT
          g.id,
          g.name,
          g.description,
          g.avatar,
          g.memberCount,
          g.type,
          g.createdAt
        FROM groups g
        WHERE (g.name LIKE ? OR g.description LIKE ?) AND g.isArchived = 0
        ORDER BY
          CASE WHEN g.name LIKE ? THEN 1 ELSE 2 END,
          g.memberCount DESC
        LIMIT ? OFFSET ?
      `).bind(searchTerm, searchTerm, searchTerm, limit, offset).all();

      for (const group of groups.results || []) {
        const g = group as any;
        results.push({
          id: g.id,
          type: 'group',
          title: g.name,
          description: g.description || '',
          url: `/groups/${g.id}`,
          metadata: {
            members: g.memberCount,
            groupType: g.type,
            avatar: g.avatar,
          },
          score: g.name?.toLowerCase().includes(query.toLowerCase()) ? 0.85 : 0.65,
          highlights: extractHighlights(query, g.name, g.description),
          createdAt: g.createdAt,
        });
      }
    }

    // Search Calendar Events
    if (types.includes('event')) {
      const events = await c.env.DB.prepare(`
        SELECT
          e.id,
          e.title,
          e.description,
          e.startDate,
          e.endDate,
          e.location,
          e.isVirtual,
          e.eventType,
          c.name as categoryName,
          c.color as categoryColor
        FROM calendar_events e
        LEFT JOIN calendar_categories c ON e.categoryId = c.id
        WHERE e.status IN ('scheduled', 'live')
          AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)
        ORDER BY
          CASE WHEN e.title LIKE ? THEN 1 ELSE 2 END,
          e.startDate ASC
        LIMIT ? OFFSET ?
      `).bind(searchTerm, searchTerm, searchTerm, searchTerm, limit, offset).all();

      for (const event of events.results || []) {
        const ev = event as any;
        results.push({
          id: ev.id,
          type: 'event',
          title: ev.title,
          description: ev.description || '',
          url: `/calendar/event/${ev.id}`,
          metadata: {
            category: ev.categoryName,
            categoryColor: ev.categoryColor,
            eventType: ev.eventType,
            startDate: ev.startDate,
            location: ev.location,
            isVirtual: ev.isVirtual,
          },
          score: ev.title?.toLowerCase().includes(query.toLowerCase()) ? 0.85 : 0.65,
          highlights: extractHighlights(query, ev.title, ev.description),
          createdAt: ev.startDate,
        });
      }
    }

    // Search Courses
    if (types.includes('course')) {
      const courses = await c.env.DB.prepare(`
        SELECT
          c.id,
          c.title,
          c.description,
          c.thumbnailUrl,
          c.level,
          c.estimatedDuration,
          c.status,
          c.createdAt,
          c.enrollmentCount,
          u.displayName as instructorName
        FROM lms_courses c
        LEFT JOIN users u ON c.instructorId = u.id
        WHERE c.status = 'published'
          AND (c.title LIKE ? OR c.description LIKE ?)
        ORDER BY
          CASE WHEN c.title LIKE ? THEN 1 ELSE 2 END
        LIMIT ? OFFSET ?
      `).bind(searchTerm, searchTerm, searchTerm, limit, offset).all();

      for (const course of courses.results || []) {
        const co = course as any;
        results.push({
          id: co.id,
          type: 'course',
          title: co.title,
          description: co.description || '',
          url: `/courses/${co.id}`,
          metadata: {
            level: co.level,
            duration: co.estimatedDuration,
            instructor: co.instructorName,
            enrollments: co.enrollmentCount,
            thumbnail: co.thumbnailUrl,
          },
          score: co.title?.toLowerCase().includes(query.toLowerCase()) ? 0.9 : 0.7,
          highlights: extractHighlights(query, co.title, co.description),
          createdAt: co.createdAt,
        });
      }
    }

    // Search News Articles
    if (types.includes('news')) {
      const news = await c.env.DB.prepare(`
        SELECT
          a.id,
          a.title,
          a.summary,
          a.imageUrl,
          a.publishedAt,
          a.createdAt,
          s.name as sourceName
        FROM news_articles a
        LEFT JOIN news_sources s ON a.sourceId = s.id
        WHERE a.title LIKE ? OR a.summary LIKE ?
        ORDER BY
          CASE WHEN a.title LIKE ? THEN 1 ELSE 2 END,
          a.publishedAt DESC
        LIMIT ? OFFSET ?
      `).bind(searchTerm, searchTerm, searchTerm, limit, offset).all();

      for (const article of news.results || []) {
        const n = article as any;
        results.push({
          id: n.id,
          type: 'news',
          title: n.title,
          description: n.summary || '',
          url: `/news/${n.id}`,
          metadata: {
            source: n.sourceName,
            image: n.imageUrl,
          },
          score: n.title?.toLowerCase().includes(query.toLowerCase()) ? 0.8 : 0.6,
          highlights: extractHighlights(query, n.title, n.summary),
          createdAt: n.publishedAt || n.createdAt,
        });
      }
    }

    // Sort all results by score
    results.sort((a, b) => b.score - a.score);

    // Get counts per type
    const counts: Record<string, number> = {};
    for (const result of results) {
      counts[result.type] = (counts[result.type] || 0) + 1;
    }

    return c.json({
      query,
      total: results.length,
      page,
      limit,
      counts,
      results,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return c.json({
      error: 'Search failed',
      details: error?.message || String(error)
    }, 500);
  }
});

/**
 * GET /search/suggestions - Get search suggestions (autocomplete)
 */
searchRoutes.get('/suggestions', async (c) => {
  const query = c.req.query('q')?.trim();

  if (!query || query.length < 2) {
    return c.json({ suggestions: [] });
  }

  const searchTerm = `${query}%`;
  const suggestions: string[] = [];

  try {
    // Get document titles
    const docs = await c.env.DB.prepare(`
      SELECT DISTINCT title FROM documents
      WHERE status = 'published' AND title LIKE ?
      LIMIT 5
    `).bind(searchTerm).all();

    for (const doc of docs.results || []) {
      suggestions.push((doc as any).title);
    }

    // Get topic titles
    const topics = await c.env.DB.prepare(`
      SELECT DISTINCT title FROM forum_topics
      WHERE title LIKE ?
      LIMIT 5
    `).bind(searchTerm).all();

    for (const topic of topics.results || []) {
      suggestions.push((topic as any).title);
    }

    // Get course titles
    const courses = await c.env.DB.prepare(`
      SELECT DISTINCT title FROM lms_courses
      WHERE status = 'published' AND title LIKE ?
      LIMIT 5
    `).bind(searchTerm).all();

    for (const course of courses.results || []) {
      suggestions.push((course as any).title);
    }

    // Get user names
    const users = await c.env.DB.prepare(`
      SELECT DISTINCT displayName FROM users
      WHERE isActive = 1 AND displayName LIKE ?
      LIMIT 3
    `).bind(searchTerm).all();

    for (const user of users.results || []) {
      suggestions.push((user as any).displayName);
    }

    // Dedupe and limit
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 10);

    return c.json({ suggestions: uniqueSuggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    return c.json({ suggestions: [] });
  }
});

/**
 * GET /search/recent - Get user's recent searches
 */
searchRoutes.get('/recent', optionalAuth, async (c) => {
  const user = c.get('user');

  if (!user?.id) {
    return c.json({ searches: [] });
  }

  try {
    const searches = await c.env.DB.prepare(`
      SELECT id, query, resultCount, createdAt
      FROM search_history
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT 10
    `).bind(user.id).all();

    return c.json({
      searches: (searches.results || []).map((s: any) => ({
        id: s.id,
        query: s.query,
        resultCount: s.resultCount,
        searchedAt: s.createdAt,
      }))
    });
  } catch (error) {
    console.error('Recent searches error:', error);
    return c.json({ searches: [] });
  }
});

/**
 * POST /search/history - Save search to history
 */
searchRoutes.post('/history', authMiddleware, async (c) => {
  const user = c.get('user');

  if (!user?.id) {
    return c.json({ success: false }, 401);
  }

  try {
    const { query, resultCount } = await c.req.json();

    if (!query || query.trim().length < 2) {
      return c.json({ success: false }, 400);
    }

    // Check if this query already exists for the user (avoid duplicates)
    const existing = await c.env.DB.prepare(`
      SELECT id FROM search_history
      WHERE userId = ? AND query = ?
    `).bind(user.id, query.trim()).first();

    if (existing) {
      // Update the timestamp
      await c.env.DB.prepare(`
        UPDATE search_history
        SET resultCount = ?, createdAt = datetime('now')
        WHERE id = ?
      `).bind(resultCount || 0, (existing as any).id).run();
    } else {
      // Insert new search
      await c.env.DB.prepare(`
        INSERT INTO search_history (id, userId, query, resultCount, createdAt)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(crypto.randomUUID(), user.id, query.trim(), resultCount || 0).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Save search error:', error);
    return c.json({ success: false }, 500);
  }
});

/**
 * DELETE /search/history - Clear search history
 */
searchRoutes.delete('/history', authMiddleware, async (c) => {
  const user = c.get('user');

  if (!user?.id) {
    return c.json({ success: false }, 401);
  }

  try {
    await c.env.DB.prepare(`
      DELETE FROM search_history WHERE userId = ?
    `).bind(user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Clear history error:', error);
    return c.json({ success: false }, 500);
  }
});

/**
 * DELETE /search/history/:id - Delete specific search from history
 */
searchRoutes.delete('/history/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const searchId = c.req.param('id');

  if (!user?.id) {
    return c.json({ success: false }, 401);
  }

  try {
    await c.env.DB.prepare(`
      DELETE FROM search_history WHERE id = ? AND userId = ?
    `).bind(searchId, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete search error:', error);
    return c.json({ success: false }, 500);
  }
});

// Helper functions
function extractHighlights(query: string, ...texts: (string | null | undefined)[]): string[] {
  const highlights: string[] = [];
  const queryLower = query.toLowerCase();

  for (const text of texts) {
    if (!text) continue;

    const words = text.split(/\s+/);
    for (const word of words) {
      if (word.toLowerCase().includes(queryLower) && !highlights.includes(word)) {
        highlights.push(word);
        if (highlights.length >= 5) break;
      }
    }
    if (highlights.length >= 5) break;
  }

  return highlights;
}

function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + '...';
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default searchRoutes;
