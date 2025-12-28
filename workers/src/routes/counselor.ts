/**
 * AI Counselor "Ayo" Routes
 * Wellness counseling API endpoints
 */

import { Hono } from 'hono';
import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import {
  getCounselorResponse,
  analyzeForEscalation,
  generateSessionSummary,
  getPersonalizedTips,
  CounselorMessage
} from '../services/aiCounselor';

interface Env {
  DB: D1Database;
  AI: any;
  JWT_SECRET: string;
}

interface Variables {
  userId?: string;
  userRole?: string;
  userName?: string;
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export const counselorRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Optional auth middleware - allows anonymous sessions
async function optionalAuth(c: AppContext, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = await verify(token, c.env.JWT_SECRET);

      if (payload?.sub) {
        c.set('userId', payload.sub as string);
        c.set('userRole', (payload.role as string) || 'user');

        // Get user's name for personalization
        const user = await c.env.DB.prepare(
          'SELECT firstName FROM users WHERE id = ?'
        ).bind(payload.sub).first<{ firstName: string }>();

        c.set('userName', user?.firstName || undefined);
      }
    } catch {
      // Token invalid, continue as anonymous
    }
  }

  await next();
}

// Required auth middleware
async function requireAuth(c: AppContext, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);

    if (!payload?.sub) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    c.set('userId', payload.sub as string);
    c.set('userRole', (payload.role as string) || 'user');

    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

// Admin middleware
async function requireAdmin(c: AppContext, next: Next) {
  const role = c.get('userRole');
  if (!['super_admin', 'admin', 'director'].includes(role || '')) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
}

// Apply optional auth to all routes
counselorRoutes.use('*', optionalAuth);

// ============================================
// SESSION ROUTES
// ============================================

/**
 * Create new counseling session
 * POST /counselor/sessions
 */
counselorRoutes.post('/sessions', async (c: AppContext) => {
  const { DB } = c.env;
  const userId = c.get('userId');

  try {
    const body = await c.req.json().catch(() => ({}));
    const { topic, mood, isAnonymous } = body;

    const sessionId = crypto.randomUUID();
    const anonymousId = isAnonymous ? crypto.randomUUID() : null;

    await DB.prepare(`
      INSERT INTO counselor_sessions (id, userId, anonymousId, topic, mood, isAnonymous, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      sessionId,
      isAnonymous ? null : userId,
      anonymousId,
      topic || 'general',
      mood || null,
      isAnonymous ? 1 : 0
    ).run();

    return c.json({
      id: sessionId,
      anonymousId: isAnonymous ? anonymousId : undefined,
      topic: topic || 'general',
      mood,
      isAnonymous: !!isAnonymous,
      status: 'active',
      messageCount: 0,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create session error:', error);
    return c.json({ error: 'Failed to create session' }, 500);
  }
});

/**
 * List user's sessions
 * GET /counselor/sessions
 */
counselorRoutes.get('/sessions', requireAuth, async (c: AppContext) => {
  const { DB } = c.env;
  const userId = c.get('userId')!;

  try {
    const { results } = await DB.prepare(`
      SELECT id, title, topic, status, messageCount, mood, lastMessageAt, createdAt
      FROM counselor_sessions
      WHERE userId = ? AND isAnonymous = 0
      ORDER BY updatedAt DESC
      LIMIT 50
    `).bind(userId).all();

    return c.json({ sessions: results || [] });
  } catch (error) {
    console.error('List sessions error:', error);
    return c.json({ error: 'Failed to fetch sessions' }, 500);
  }
});

/**
 * Get session with messages
 * GET /counselor/sessions/:id
 */
counselorRoutes.get('/sessions/:id', async (c: AppContext) => {
  const { DB } = c.env;
  const sessionId = c.req.param('id');
  const userId = c.get('userId');

  try {
    // Get session
    const session = await DB.prepare(`
      SELECT * FROM counselor_sessions WHERE id = ?
    `).bind(sessionId).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Verify access (owner or anonymous with correct ID)
    const anonymousId = c.req.header('X-Anonymous-Id');
    if (session.isAnonymous) {
      if (session.anonymousId !== anonymousId) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    } else if (session.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Get messages
    const { results: messages } = await DB.prepare(`
      SELECT id, sessionId, role, content, helpful, createdAt
      FROM counselor_messages
      WHERE sessionId = ?
      ORDER BY createdAt ASC
    `).bind(sessionId).all();

    return c.json({
      session: {
        id: session.id,
        topic: session.topic,
        status: session.status,
        mood: session.mood,
        messageCount: session.messageCount,
        isAnonymous: !!session.isAnonymous,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      },
      messages: messages || []
    });
  } catch (error) {
    console.error('Get session error:', error);
    return c.json({ error: 'Failed to fetch session' }, 500);
  }
});

/**
 * Send message and get AI response
 * POST /counselor/sessions/:id/messages
 */
counselorRoutes.post('/sessions/:id/messages', async (c: AppContext) => {
  const { DB, AI } = c.env;
  const sessionId = c.req.param('id');
  const userId = c.get('userId');
  const userName = c.get('userName');

  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content?.trim()) {
      return c.json({ error: 'Message content required' }, 400);
    }

    // Get session
    const session = await DB.prepare(`
      SELECT * FROM counselor_sessions WHERE id = ?
    `).bind(sessionId).first<any>();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Verify access
    const anonymousId = c.req.header('X-Anonymous-Id');
    if (session.isAnonymous) {
      if (session.anonymousId !== anonymousId) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    } else if (session.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Get conversation history
    const { results: historyResults } = await DB.prepare(`
      SELECT id, sessionId, role, content, createdAt
      FROM counselor_messages
      WHERE sessionId = ?
      ORDER BY createdAt ASC
    `).bind(sessionId).all();

    const conversationHistory: CounselorMessage[] = (historyResults || []).map((m: any) => ({
      id: m.id,
      sessionId: m.sessionId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt
    }));

    // Save user message
    const userMessageId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO counselor_messages (id, sessionId, role, content, createdAt)
      VALUES (?, ?, 'user', ?, datetime('now'))
    `).bind(userMessageId, sessionId, content.trim()).run();

    // Get AI response
    const aiResponse = await getCounselorResponse(
      { DB, AI } as any,
      sessionId,
      content.trim(),
      conversationHistory,
      {
        topic: session.topic,
        mood: session.mood,
        isAnonymous: !!session.isAnonymous,
        userName
      }
    );

    // Save AI response
    const aiMessageId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO counselor_messages (id, sessionId, role, content, createdAt)
      VALUES (?, ?, 'assistant', ?, datetime('now'))
    `).bind(aiMessageId, sessionId, aiResponse).run();

    // Update session
    await DB.prepare(`
      UPDATE counselor_sessions
      SET messageCount = messageCount + 2,
          lastMessageAt = datetime('now'),
          updatedAt = datetime('now')
      WHERE id = ?
    `).bind(sessionId).run();

    // Check for escalation
    const escalation = await analyzeForEscalation(
      { DB, AI } as any,
      content.trim(),
      [...conversationHistory, { id: userMessageId, sessionId, role: 'user' as const, content: content.trim(), createdAt: new Date().toISOString() }]
    );

    return c.json({
      userMessage: {
        id: userMessageId,
        sessionId,
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString()
      },
      aiMessage: {
        id: aiMessageId,
        sessionId,
        role: 'assistant',
        content: aiResponse,
        createdAt: new Date().toISOString()
      },
      escalation: escalation.shouldEscalate ? {
        urgency: escalation.urgency,
        suggested: true
      } : undefined
    });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

/**
 * Rate AI response
 * POST /counselor/sessions/:id/feedback
 */
counselorRoutes.post('/sessions/:id/feedback', async (c: AppContext) => {
  const { DB } = c.env;
  const sessionId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { messageId, helpful } = body;

    if (!messageId || helpful === undefined) {
      return c.json({ error: 'messageId and helpful required' }, 400);
    }

    await DB.prepare(`
      UPDATE counselor_messages
      SET helpful = ?
      WHERE id = ? AND sessionId = ?
    `).bind(helpful ? 1 : 0, messageId, sessionId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return c.json({ error: 'Failed to save feedback' }, 500);
  }
});

/**
 * Request human counselor (escalation)
 * POST /counselor/sessions/:id/escalate
 */
counselorRoutes.post('/sessions/:id/escalate', async (c: AppContext) => {
  const { DB } = c.env;
  const sessionId = c.req.param('id');
  const userId = c.get('userId');

  try {
    const body = await c.req.json().catch(() => ({}));
    const { reason, urgency } = body;

    // Get session to verify access
    const session = await DB.prepare(`
      SELECT * FROM counselor_sessions WHERE id = ?
    `).bind(sessionId).first<any>();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Create escalation
    const escalationId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO counselor_escalations (id, sessionId, userId, reason, urgency, status, createdAt)
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(
      escalationId,
      sessionId,
      session.isAnonymous ? null : (userId || session.userId),
      reason || null,
      urgency || 'normal'
    ).run();

    // Update session status
    await DB.prepare(`
      UPDATE counselor_sessions
      SET status = 'escalated', updatedAt = datetime('now')
      WHERE id = ?
    `).bind(sessionId).run();

    return c.json({
      escalationId,
      message: 'Your request has been sent to our counseling team. They will reach out to you soon.',
      status: 'pending'
    });
  } catch (error) {
    console.error('Escalation error:', error);
    return c.json({ error: 'Failed to create escalation' }, 500);
  }
});

/**
 * End/complete session
 * PATCH /counselor/sessions/:id
 */
counselorRoutes.patch('/sessions/:id', async (c: AppContext) => {
  const { DB } = c.env;
  const sessionId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { status, title } = body;

    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No updates provided' }, 400);
    }

    updates.push('updatedAt = datetime(\'now\')');
    params.push(sessionId);

    await DB.prepare(`
      UPDATE counselor_sessions
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update session error:', error);
    return c.json({ error: 'Failed to update session' }, 500);
  }
});

// ============================================
// MOOD ROUTES
// ============================================

/**
 * Log mood entry
 * POST /counselor/mood
 */
counselorRoutes.post('/mood', requireAuth, async (c: AppContext) => {
  const { DB } = c.env;
  const userId = c.get('userId')!;

  try {
    const body = await c.req.json();
    const { mood, factors, notes } = body;

    if (!mood || mood < 1 || mood > 5) {
      return c.json({ error: 'Mood must be between 1 and 5' }, 400);
    }

    const entryId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO mood_entries (id, userId, mood, factors, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      entryId,
      userId,
      mood,
      factors ? JSON.stringify(factors) : null,
      notes || null
    ).run();

    return c.json({
      id: entryId,
      mood,
      factors,
      notes,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Log mood error:', error);
    return c.json({ error: 'Failed to log mood' }, 500);
  }
});

/**
 * Get mood history
 * GET /counselor/mood
 */
counselorRoutes.get('/mood', requireAuth, async (c: AppContext) => {
  const { DB } = c.env;
  const userId = c.get('userId')!;
  const url = new URL(c.req.url);
  const days = parseInt(url.searchParams.get('days') || '30');

  try {
    const { results } = await DB.prepare(`
      SELECT id, mood, factors, notes, createdAt
      FROM mood_entries
      WHERE userId = ?
        AND createdAt >= datetime('now', '-' || ? || ' days')
      ORDER BY createdAt DESC
    `).bind(userId, days).all();

    // Parse factors JSON
    const entries = (results || []).map((e: any) => ({
      ...e,
      factors: e.factors ? JSON.parse(e.factors) : []
    }));

    // Calculate average and trends
    const moods = entries.map((e: any) => e.mood);
    const average = moods.length > 0
      ? moods.reduce((a: number, b: number) => a + b, 0) / moods.length
      : null;

    return c.json({
      entries,
      stats: {
        average: average ? Math.round(average * 10) / 10 : null,
        count: entries.length,
        trend: calculateTrend(moods)
      }
    });
  } catch (error) {
    console.error('Get mood error:', error);
    return c.json({ error: 'Failed to fetch mood history' }, 500);
  }
});

// ============================================
// RESOURCE ROUTES
// ============================================

/**
 * List wellness resources
 * GET /counselor/resources
 */
counselorRoutes.get('/resources', async (c: AppContext) => {
  const { DB } = c.env;
  const userId = c.get('userId');
  const url = new URL(c.req.url);

  const category = url.searchParams.get('category');
  const type = url.searchParams.get('type');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE isPublished = 1';
    const params: any[] = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    // Get resources
    const { results } = await DB.prepare(`
      SELECT id, title, description, type, category, thumbnailUrl, duration, difficulty, views, likes, createdAt
      FROM wellness_resources
      ${whereClause}
      ORDER BY views DESC, createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    // Get total count
    const countResult = await DB.prepare(`
      SELECT COUNT(*) as count FROM wellness_resources ${whereClause}
    `).bind(...params).first<{ count: number }>();

    // Get bookmarks if authenticated
    let bookmarkedIds: string[] = [];
    if (userId) {
      const { results: bookmarks } = await DB.prepare(`
        SELECT resourceId FROM wellness_bookmarks WHERE userId = ?
      `).bind(userId).all();
      bookmarkedIds = (bookmarks || []).map((b: any) => b.resourceId);
    }

    const resources = (results || []).map((r: any) => ({
      ...r,
      isBookmarked: bookmarkedIds.includes(r.id)
    }));

    return c.json({
      resources,
      totalCount: countResult?.count || 0,
      totalPages: Math.ceil((countResult?.count || 0) / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('List resources error:', error);
    return c.json({ error: 'Failed to fetch resources' }, 500);
  }
});

/**
 * Get single resource
 * GET /counselor/resources/:id
 */
counselorRoutes.get('/resources/:id', async (c: AppContext) => {
  const { DB } = c.env;
  const resourceId = c.req.param('id');
  const userId = c.get('userId');

  try {
    const resource = await DB.prepare(`
      SELECT * FROM wellness_resources WHERE id = ? AND isPublished = 1
    `).bind(resourceId).first();

    if (!resource) {
      return c.json({ error: 'Resource not found' }, 404);
    }

    // Increment views
    await DB.prepare(`
      UPDATE wellness_resources SET views = views + 1 WHERE id = ?
    `).bind(resourceId).run();

    // Check bookmark status
    let isBookmarked = false;
    if (userId) {
      const bookmark = await DB.prepare(`
        SELECT id FROM wellness_bookmarks WHERE userId = ? AND resourceId = ?
      `).bind(userId, resourceId).first();
      isBookmarked = !!bookmark;
    }

    return c.json({
      ...resource,
      isBookmarked
    });
  } catch (error) {
    console.error('Get resource error:', error);
    return c.json({ error: 'Failed to fetch resource' }, 500);
  }
});

/**
 * Toggle resource bookmark
 * POST /counselor/resources/:id/bookmark
 */
counselorRoutes.post('/resources/:id/bookmark', requireAuth, async (c: AppContext) => {
  const { DB } = c.env;
  const resourceId = c.req.param('id');
  const userId = c.get('userId')!;

  try {
    // Check if already bookmarked
    const existing = await DB.prepare(`
      SELECT id FROM wellness_bookmarks WHERE userId = ? AND resourceId = ?
    `).bind(userId, resourceId).first();

    if (existing) {
      // Remove bookmark
      await DB.prepare(`
        DELETE FROM wellness_bookmarks WHERE userId = ? AND resourceId = ?
      `).bind(userId, resourceId).run();

      return c.json({ bookmarked: false });
    } else {
      // Add bookmark
      const bookmarkId = crypto.randomUUID();
      await DB.prepare(`
        INSERT INTO wellness_bookmarks (id, userId, resourceId, createdAt)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(bookmarkId, userId, resourceId).run();

      return c.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Bookmark error:', error);
    return c.json({ error: 'Failed to toggle bookmark' }, 500);
  }
});

/**
 * Get bookmarked resources
 * GET /counselor/bookmarks
 */
counselorRoutes.get('/bookmarks', requireAuth, async (c: AppContext) => {
  const { DB } = c.env;
  const userId = c.get('userId')!;

  try {
    const { results } = await DB.prepare(`
      SELECT r.id, r.title, r.description, r.type, r.category, r.thumbnailUrl, r.duration, r.difficulty, r.views, r.createdAt
      FROM wellness_resources r
      INNER JOIN wellness_bookmarks b ON r.id = b.resourceId
      WHERE b.userId = ? AND r.isPublished = 1
      ORDER BY b.createdAt DESC
    `).bind(userId).all();

    return c.json({
      resources: (results || []).map((r: any) => ({
        ...r,
        isBookmarked: true
      }))
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    return c.json({ error: 'Failed to fetch bookmarks' }, 500);
  }
});

/**
 * Get personalized tips
 * GET /counselor/tips
 */
counselorRoutes.get('/tips', requireAuth, async (c: AppContext) => {
  const { DB, AI } = c.env;
  const userId = c.get('userId')!;

  try {
    const tips = await getPersonalizedTips({ DB, AI } as any, userId);
    return c.json({ tips });
  } catch (error) {
    console.error('Get tips error:', error);
    return c.json({ tips: [
      'Take a few deep breaths right now',
      'Stay hydrated throughout the day',
      'Take a short walk if you can'
    ] });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * Get admin dashboard stats
 * GET /counselor/admin/dashboard
 */
counselorRoutes.get('/admin/dashboard', requireAuth, requireAdmin, async (c: AppContext) => {
  const { DB } = c.env;

  try {
    // Get session stats
    const sessionStats = await DB.prepare(`
      SELECT
        COUNT(*) as totalSessions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeSessions,
        SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as escalatedSessions,
        SUM(CASE WHEN createdAt >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as weeklyNew
      FROM counselor_sessions
    `).first();

    // Get escalation stats
    const escalationStats = await DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN urgency = 'high' OR urgency = 'crisis' THEN 1 ELSE 0 END) as urgent
      FROM counselor_escalations
    `).first();

    // Get mood average
    const moodStats = await DB.prepare(`
      SELECT AVG(mood) as avgMood
      FROM mood_entries
      WHERE createdAt >= datetime('now', '-7 days')
    `).first<{ avgMood: number }>();

    // Get top topics
    const { results: topTopics } = await DB.prepare(`
      SELECT topic, COUNT(*) as count
      FROM counselor_sessions
      WHERE topic IS NOT NULL
      GROUP BY topic
      ORDER BY count DESC
      LIMIT 5
    `).all();

    // Get resource stats
    const resourceStats = await DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(views) as totalViews
      FROM wellness_resources
      WHERE isPublished = 1
    `).first();

    return c.json({
      sessions: sessionStats,
      escalations: escalationStats,
      avgMood: moodStats?.avgMood ? Math.round(moodStats.avgMood * 10) / 10 : null,
      topTopics: topTopics || [],
      resources: resourceStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

/**
 * Get escalations list
 * GET /counselor/admin/escalations
 */
counselorRoutes.get('/admin/escalations', requireAuth, requireAdmin, async (c: AppContext) => {
  const { DB } = c.env;
  const url = new URL(c.req.url);
  const status = url.searchParams.get('status');

  try {
    let whereClause = '1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND e.status = ?';
      params.push(status);
    }

    const { results } = await DB.prepare(`
      SELECT
        e.*,
        s.topic as sessionTopic,
        s.messageCount as sessionMessages,
        u.displayName as userName,
        u.email as userEmail,
        ac.displayName as assignedCounselorName
      FROM counselor_escalations e
      LEFT JOIN counselor_sessions s ON e.sessionId = s.id
      LEFT JOIN users u ON e.userId = u.id
      LEFT JOIN users ac ON e.assignedCounselorId = ac.id
      WHERE ${whereClause}
      ORDER BY
        CASE e.urgency
          WHEN 'crisis' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          ELSE 4
        END,
        e.createdAt DESC
      LIMIT 100
    `).bind(...params).all();

    return c.json({ escalations: results || [] });
  } catch (error) {
    console.error('List escalations error:', error);
    return c.json({ error: 'Failed to fetch escalations' }, 500);
  }
});

/**
 * Update escalation
 * PATCH /counselor/admin/escalations/:id
 */
counselorRoutes.patch('/admin/escalations/:id', requireAuth, requireAdmin, async (c: AppContext) => {
  const { DB } = c.env;
  const escalationId = c.req.param('id');
  const adminId = c.get('userId')!;

  try {
    const body = await c.req.json();
    const { status, notes, scheduledAt, assignedCounselorId } = body;

    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);

      if (status === 'resolved') {
        updates.push('resolvedAt = datetime(\'now\')');
      }
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (scheduledAt) {
      updates.push('scheduledAt = ?');
      params.push(scheduledAt);
    }

    if (assignedCounselorId) {
      updates.push('assignedCounselorId = ?');
      params.push(assignedCounselorId);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No updates provided' }, 400);
    }

    params.push(escalationId);

    await DB.prepare(`
      UPDATE counselor_escalations
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update escalation error:', error);
    return c.json({ error: 'Failed to update escalation' }, 500);
  }
});

/**
 * Create wellness resource (admin)
 * POST /counselor/admin/resources
 */
counselorRoutes.post('/admin/resources', requireAuth, requireAdmin, async (c: AppContext) => {
  const { DB } = c.env;
  const userId = c.get('userId')!;

  try {
    const body = await c.req.json();
    const { title, description, content, type, category, thumbnailUrl, mediaUrl, duration, difficulty } = body;

    if (!title || !type || !category) {
      return c.json({ error: 'title, type, and category required' }, 400);
    }

    const resourceId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO wellness_resources (
        id, title, description, content, type, category,
        thumbnailUrl, mediaUrl, duration, difficulty, createdById, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      resourceId,
      title,
      description || null,
      content || null,
      type,
      category,
      thumbnailUrl || null,
      mediaUrl || null,
      duration || null,
      difficulty || 'beginner',
      userId
    ).run();

    return c.json({
      id: resourceId,
      title,
      type,
      category,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create resource error:', error);
    return c.json({ error: 'Failed to create resource' }, 500);
  }
});

/**
 * Update wellness resource (admin)
 * PUT /counselor/admin/resources/:id
 */
counselorRoutes.put('/admin/resources/:id', requireAuth, requireAdmin, async (c: AppContext) => {
  const { DB } = c.env;
  const resourceId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { title, description, content, type, category, thumbnailUrl, mediaUrl, duration, difficulty, isPublished } = body;

    await DB.prepare(`
      UPDATE wellness_resources
      SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        content = COALESCE(?, content),
        type = COALESCE(?, type),
        category = COALESCE(?, category),
        thumbnailUrl = COALESCE(?, thumbnailUrl),
        mediaUrl = COALESCE(?, mediaUrl),
        duration = COALESCE(?, duration),
        difficulty = COALESCE(?, difficulty),
        isPublished = COALESCE(?, isPublished),
        updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      title || null,
      description || null,
      content || null,
      type || null,
      category || null,
      thumbnailUrl || null,
      mediaUrl || null,
      duration || null,
      difficulty || null,
      isPublished !== undefined ? (isPublished ? 1 : 0) : null,
      resourceId
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update resource error:', error);
    return c.json({ error: 'Failed to update resource' }, 500);
  }
});

/**
 * Delete wellness resource (admin)
 * DELETE /counselor/admin/resources/:id
 */
counselorRoutes.delete('/admin/resources/:id', requireAuth, requireAdmin, async (c: AppContext) => {
  const { DB } = c.env;
  const resourceId = c.req.param('id');

  try {
    await DB.prepare(`
      DELETE FROM wellness_resources WHERE id = ?
    `).bind(resourceId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete resource error:', error);
    return c.json({ error: 'Failed to delete resource' }, 500);
  }
});

// ============================================
// COUNSELOR MANAGEMENT ROUTES (Super Admin)
// ============================================

// Super admin middleware
async function requireSuperAdmin(c: AppContext, next: Next) {
  const role = c.get('userRole');
  if (role !== 'super_admin') {
    return c.json({ error: 'Super admin access required' }, 403);
  }
  await next();
}

// Counselor middleware (counselor, admin, or super_admin)
async function requireCounselor(c: AppContext, next: Next) {
  const role = c.get('userRole');
  if (!['super_admin', 'admin', 'director', 'counselor'].includes(role || '')) {
    return c.json({ error: 'Counselor access required' }, 403);
  }
  await next();
}

/**
 * List all counselors
 * GET /counselor/admin/counselors
 */
counselorRoutes.get('/admin/counselors', requireAuth, requireSuperAdmin, async (c: AppContext) => {
  const { DB } = c.env;
  const url = new URL(c.req.url);
  const status = url.searchParams.get('status');

  try {
    let whereClause = '1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND ca.status = ?';
      params.push(status);
    }

    const { results } = await DB.prepare(`
      SELECT
        ca.*,
        u.displayName as counselorName,
        u.email as counselorEmail,
        u.avatar as counselorAvatar,
        u.title as counselorTitle,
        ab.displayName as assignedByName
      FROM counselor_assignments ca
      INNER JOIN users u ON ca.counselorId = u.id
      LEFT JOIN users ab ON ca.assignedById = ab.id
      WHERE ${whereClause}
      ORDER BY ca.createdAt DESC
    `).bind(...params).all();

    return c.json({ counselors: results || [] });
  } catch (error) {
    console.error('List counselors error:', error);
    return c.json({ error: 'Failed to fetch counselors' }, 500);
  }
});

/**
 * Get counselor dashboard stats
 * GET /counselor/admin/counselors/stats
 */
counselorRoutes.get('/admin/counselors/stats', requireAuth, requireSuperAdmin, async (c: AppContext) => {
  const { DB } = c.env;

  try {
    const stats = await DB.prepare(`
      SELECT
        COUNT(*) as totalCounselors,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCounselors,
        SUM(currentCaseload) as totalAssignedCases,
        AVG(currentCaseload) as averageCaseload
      FROM counselor_assignments
    `).first();

    const pendingEscalations = await DB.prepare(`
      SELECT COUNT(*) as count FROM counselor_escalations WHERE status = 'pending'
    `).first<{ count: number }>();

    const resolvedThisWeek = await DB.prepare(`
      SELECT COUNT(*) as count FROM counselor_escalations
      WHERE status = 'resolved' AND resolvedAt >= datetime('now', '-7 days')
    `).first<{ count: number }>();

    return c.json({
      totalCounselors: stats?.totalCounselors || 0,
      activeCounselors: stats?.activeCounselors || 0,
      totalAssignedCases: stats?.totalAssignedCases || 0,
      averageCaseload: stats?.averageCaseload ? Math.round(stats.averageCaseload * 10) / 10 : 0,
      pendingEscalations: pendingEscalations?.count || 0,
      resolvedThisWeek: resolvedThisWeek?.count || 0
    });
  } catch (error) {
    console.error('Counselor stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

/**
 * Assign user as counselor
 * POST /counselor/admin/counselors
 */
counselorRoutes.post('/admin/counselors', requireAuth, requireSuperAdmin, async (c: AppContext) => {
  const { DB } = c.env;
  const adminId = c.get('userId')!;

  try {
    const body = await c.req.json();
    const { userId, specializations, maxCaseload, bio, qualifications, notes } = body;

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    // Check if user exists
    const user = await DB.prepare(`
      SELECT id, displayName, email, role_id FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if already a counselor
    const existing = await DB.prepare(`
      SELECT id FROM counselor_assignments WHERE counselorId = ?
    `).bind(userId).first();

    if (existing) {
      return c.json({ error: 'User is already a counselor' }, 409);
    }

    // Update user role to counselor (role_id = 9)
    await DB.prepare(`
      UPDATE users SET role_id = 9 WHERE id = ?
    `).bind(userId).run();

    // Create counselor assignment
    const assignmentId = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO counselor_assignments (
        id, counselorId, assignedById, specializations, status,
        maxCaseload, bio, qualifications, notes, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      assignmentId,
      userId,
      adminId,
      specializations ? JSON.stringify(specializations) : null,
      maxCaseload || 50,
      bio || null,
      qualifications || null,
      notes || null
    ).run();

    return c.json({
      id: assignmentId,
      counselorId: userId,
      status: 'active',
      message: 'Counselor assigned successfully'
    });
  } catch (error) {
    console.error('Assign counselor error:', error);
    return c.json({ error: 'Failed to assign counselor' }, 500);
  }
});

/**
 * Update counselor
 * PUT /counselor/admin/counselors/:id
 */
counselorRoutes.put('/admin/counselors/:id', requireAuth, requireSuperAdmin, async (c: AppContext) => {
  const { DB } = c.env;
  const assignmentId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { specializations, status, maxCaseload, bio, qualifications, notes } = body;

    const updates: string[] = [];
    const params: any[] = [];

    if (specializations !== undefined) {
      updates.push('specializations = ?');
      params.push(JSON.stringify(specializations));
    }

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (maxCaseload !== undefined) {
      updates.push('maxCaseload = ?');
      params.push(maxCaseload);
    }

    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }

    if (qualifications !== undefined) {
      updates.push('qualifications = ?');
      params.push(qualifications);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No updates provided' }, 400);
    }

    updates.push('updatedAt = datetime(\'now\')');
    params.push(assignmentId);

    await DB.prepare(`
      UPDATE counselor_assignments
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update counselor error:', error);
    return c.json({ error: 'Failed to update counselor' }, 500);
  }
});

/**
 * Remove counselor assignment
 * DELETE /counselor/admin/counselors/:id
 */
counselorRoutes.delete('/admin/counselors/:id', requireAuth, requireSuperAdmin, async (c: AppContext) => {
  const { DB } = c.env;
  const assignmentId = c.req.param('id');

  try {
    // Get counselor info first
    const assignment = await DB.prepare(`
      SELECT counselorId FROM counselor_assignments WHERE id = ?
    `).bind(assignmentId).first<{ counselorId: string }>();

    if (!assignment) {
      return c.json({ error: 'Counselor assignment not found' }, 404);
    }

    // Remove assignment
    await DB.prepare(`
      DELETE FROM counselor_assignments WHERE id = ?
    `).bind(assignmentId).run();

    // Reset user role to regular user (role_id = 2 for civil_servant)
    await DB.prepare(`
      UPDATE users SET role_id = 2 WHERE id = ?
    `).bind(assignment.counselorId).run();

    return c.json({ success: true, message: 'Counselor removed' });
  } catch (error) {
    console.error('Remove counselor error:', error);
    return c.json({ error: 'Failed to remove counselor' }, 500);
  }
});

// ============================================
// REPORT DATA ROUTES (Counselor Access)
// ============================================

/**
 * Search users for reporting
 * GET /counselor/reports/users
 */
counselorRoutes.get('/reports/users', requireAuth, requireCounselor, async (c: AppContext) => {
  const { DB } = c.env;
  const url = new URL(c.req.url);
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
  const offset = (page - 1) * limit;

  try {
    // Get users who have wellness sessions
    const { results } = await DB.prepare(`
      SELECT DISTINCT
        u.id,
        u.displayName,
        u.email,
        u.title,
        u.department,
        (SELECT COUNT(*) FROM counselor_sessions WHERE userId = u.id) as sessionCount,
        (SELECT AVG(mood) FROM mood_entries WHERE userId = u.id) as avgMood
      FROM users u
      INNER JOIN counselor_sessions cs ON cs.userId = u.id
      WHERE (u.displayName LIKE ? OR u.email LIKE ?)
      ORDER BY sessionCount DESC
      LIMIT ? OFFSET ?
    `).bind(`%${search}%`, `%${search}%`, limit, offset).all();

    const countResult = await DB.prepare(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      INNER JOIN counselor_sessions cs ON cs.userId = u.id
      WHERE (u.displayName LIKE ? OR u.email LIKE ?)
    `).bind(`%${search}%`, `%${search}%`).first<{ count: number }>();

    return c.json({
      users: results || [],
      total: countResult?.count || 0,
      page,
      totalPages: Math.ceil((countResult?.count || 0) / limit)
    });
  } catch (error) {
    console.error('Search users error:', error);
    return c.json({ error: 'Failed to search users' }, 500);
  }
});

/**
 * Get individual user wellness report data
 * GET /counselor/reports/user/:userId
 */
counselorRoutes.get('/reports/user/:userId', requireAuth, requireCounselor, async (c: AppContext) => {
  const { DB } = c.env;
  const userId = c.req.param('userId');
  const counselorName = c.get('userName') || 'Counselor';

  try {
    // Get user info
    const user = await DB.prepare(`
      SELECT id, displayName as name, email, department, title FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get session summary
    const sessionSummary = await DB.prepare(`
      SELECT
        COUNT(*) as totalSessions,
        SUM(messageCount) as totalMessages,
        MIN(createdAt) as firstSessionAt,
        MAX(createdAt) as lastSessionAt,
        SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as escalationCount
      FROM counselor_sessions
      WHERE userId = ?
    `).bind(userId).first();

    // Get mood stats
    const moodStats = await DB.prepare(`
      SELECT
        AVG(mood) as averageMood,
        COUNT(*) as moodCount
      FROM mood_entries
      WHERE userId = ?
    `).bind(userId).first();

    // Get most common topic
    const topTopic = await DB.prepare(`
      SELECT topic, COUNT(*) as count
      FROM counselor_sessions
      WHERE userId = ? AND topic IS NOT NULL
      GROUP BY topic
      ORDER BY count DESC
      LIMIT 1
    `).bind(userId).first<{ topic: string; count: number }>();

    // Get sessions list
    const { results: sessions } = await DB.prepare(`
      SELECT id, topic, messageCount, mood, status, createdAt
      FROM counselor_sessions
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT 50
    `).bind(userId).all();

    // Get mood history
    const { results: moodHistory } = await DB.prepare(`
      SELECT mood, factors, createdAt as date
      FROM mood_entries
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT 30
    `).bind(userId).all();

    // Calculate trend
    const moods = (moodHistory || []).map((m: any) => m.mood);
    const moodTrend = calculateTrend(moods);

    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        mda: user.title
      },
      summary: {
        totalSessions: sessionSummary?.totalSessions || 0,
        totalMessages: sessionSummary?.totalMessages || 0,
        averageMood: moodStats?.averageMood ? Math.round(moodStats.averageMood * 10) / 10 : null,
        moodTrend,
        mostCommonTopic: topTopic?.topic || null,
        escalationCount: sessionSummary?.escalationCount || 0,
        firstSessionAt: sessionSummary?.firstSessionAt || null,
        lastSessionAt: sessionSummary?.lastSessionAt || null
      },
      sessions: (sessions || []).map((s: any) => ({
        id: s.id,
        date: s.createdAt,
        topic: s.topic,
        messageCount: s.messageCount,
        mood: s.mood,
        status: s.status
      })),
      moodHistory: (moodHistory || []).map((m: any) => ({
        date: m.date,
        mood: m.mood,
        factors: m.factors ? JSON.parse(m.factors) : []
      })),
      generatedAt: new Date().toISOString(),
      generatedBy: counselorName
    });
  } catch (error) {
    console.error('Get user report error:', error);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});

/**
 * Get aggregate wellness report data
 * GET /counselor/reports/aggregate
 */
counselorRoutes.get('/reports/aggregate', requireAuth, requireCounselor, async (c: AppContext) => {
  const { DB } = c.env;
  const url = new URL(c.req.url);
  const counselorName = c.get('userName') || 'Counselor';

  const fromDate = url.searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const toDate = url.searchParams.get('to') || new Date().toISOString();

  try {
    // Overview stats
    const overview = await DB.prepare(`
      SELECT
        COUNT(DISTINCT userId) as totalUsers,
        COUNT(*) as totalSessions,
        SUM(messageCount) as totalMessages,
        AVG(messageCount) as averageSessionLength,
        SUM(CASE WHEN status = 'escalated' THEN 1.0 ELSE 0 END) / NULLIF(COUNT(*), 0) * 100 as escalationRate,
        SUM(CASE WHEN isAnonymous = 1 THEN 1.0 ELSE 0 END) / NULLIF(COUNT(*), 0) * 100 as anonymousSessionRate
      FROM counselor_sessions
      WHERE createdAt BETWEEN ? AND ?
    `).bind(fromDate, toDate).first();

    // Topic breakdown
    const { results: topicBreakdown } = await DB.prepare(`
      SELECT
        topic,
        COUNT(*) as count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM counselor_sessions WHERE createdAt BETWEEN ? AND ?) as percentage
      FROM counselor_sessions
      WHERE createdAt BETWEEN ? AND ? AND topic IS NOT NULL
      GROUP BY topic
      ORDER BY count DESC
    `).bind(fromDate, toDate, fromDate, toDate).all();

    // Mood analytics
    const moodStats = await DB.prepare(`
      SELECT AVG(mood) as averageMood
      FROM mood_entries
      WHERE createdAt BETWEEN ? AND ?
    `).bind(fromDate, toDate).first<{ averageMood: number }>();

    const { results: moodDistribution } = await DB.prepare(`
      SELECT mood, COUNT(*) as count
      FROM mood_entries
      WHERE createdAt BETWEEN ? AND ?
      GROUP BY mood
      ORDER BY mood
    `).bind(fromDate, toDate).all();

    const { results: moodTrend } = await DB.prepare(`
      SELECT
        date(createdAt) as date,
        AVG(mood) as average,
        COUNT(*) as count
      FROM mood_entries
      WHERE createdAt BETWEEN ? AND ?
      GROUP BY date(createdAt)
      ORDER BY date
    `).bind(fromDate, toDate).all();

    // Escalation analytics
    const escalationStats = await DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN urgency = 'low' THEN 1 ELSE 0 END) as urgencyLow,
        SUM(CASE WHEN urgency = 'normal' THEN 1 ELSE 0 END) as urgencyNormal,
        SUM(CASE WHEN urgency = 'high' THEN 1 ELSE 0 END) as urgencyHigh,
        SUM(CASE WHEN urgency = 'crisis' THEN 1 ELSE 0 END) as urgencyCrisis,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as statusPending,
        SUM(CASE WHEN status = 'acknowledged' THEN 1 ELSE 0 END) as statusAcknowledged,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as statusScheduled,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as statusResolved
      FROM counselor_escalations
      WHERE createdAt BETWEEN ? AND ?
    `).bind(fromDate, toDate).first();

    // Peak usage
    const { results: busiestDays } = await DB.prepare(`
      SELECT strftime('%w', createdAt) as day, COUNT(*) as count
      FROM counselor_sessions
      WHERE createdAt BETWEEN ? AND ?
      GROUP BY day
      ORDER BY count DESC
      LIMIT 3
    `).bind(fromDate, toDate).all();

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return c.json({
      period: { from: fromDate, to: toDate },
      overview: {
        totalUsers: overview?.totalUsers || 0,
        totalSessions: overview?.totalSessions || 0,
        totalMessages: overview?.totalMessages || 0,
        averageSessionLength: overview?.averageSessionLength ? Math.round(overview.averageSessionLength * 10) / 10 : 0,
        escalationRate: overview?.escalationRate ? Math.round(overview.escalationRate * 10) / 10 : 0,
        anonymousSessionRate: overview?.anonymousSessionRate ? Math.round(overview.anonymousSessionRate * 10) / 10 : 0
      },
      topicBreakdown: (topicBreakdown || []).map((t: any) => ({
        topic: t.topic,
        count: t.count,
        percentage: Math.round(t.percentage * 10) / 10
      })),
      moodAnalytics: {
        averageMood: moodStats?.averageMood ? Math.round(moodStats.averageMood * 10) / 10 : null,
        moodDistribution: Object.fromEntries((moodDistribution || []).map((m: any) => [m.mood, m.count])),
        trendOverTime: (moodTrend || []).map((m: any) => ({
          date: m.date,
          average: Math.round(m.average * 10) / 10,
          count: m.count
        }))
      },
      escalationAnalytics: {
        total: escalationStats?.total || 0,
        byUrgency: {
          low: escalationStats?.urgencyLow || 0,
          normal: escalationStats?.urgencyNormal || 0,
          high: escalationStats?.urgencyHigh || 0,
          crisis: escalationStats?.urgencyCrisis || 0
        },
        byStatus: {
          pending: escalationStats?.statusPending || 0,
          acknowledged: escalationStats?.statusAcknowledged || 0,
          scheduled: escalationStats?.statusScheduled || 0,
          resolved: escalationStats?.statusResolved || 0
        },
        averageResolutionTime: null // Would need more complex calculation
      },
      peakUsageTimes: {
        busiestDays: (busiestDays || []).map((d: any) => dayNames[parseInt(d.day)]),
        busiestHours: [9, 10, 14, 15] // Typical office hours - would need real data
      },
      generatedAt: new Date().toISOString(),
      generatedBy: counselorName
    });
  } catch (error) {
    console.error('Get aggregate report error:', error);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});

// Helper functions

function calculateTrend(moods: number[]): 'improving' | 'declining' | 'stable' | null {
  if (moods.length < 3) return null;

  const recent = moods.slice(0, Math.min(5, moods.length));
  const older = moods.slice(Math.min(5, moods.length));

  if (older.length === 0) return null;

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const diff = recentAvg - olderAvg;

  if (diff > 0.3) return 'improving';
  if (diff < -0.3) return 'declining';
  return 'stable';
}

export default counselorRoutes;
