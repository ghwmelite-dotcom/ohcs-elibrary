/**
 * Kwame AI Knowledge Assistant Routes
 * /api/v1/kwame/*
 */

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import {
  getKwameResponse,
  getSuggestedQuestions,
  incrementQuestionUsage,
  processDocumentForEmbedding,
  processEmbeddingQueue,
  queueDocumentForEmbedding,
  getEmbeddingStats,
  KwameMessage,
  SessionContext,
} from '../services/aiKwame';

interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
  JWT_SECRET: string;
}

const kwame = new Hono<{ Bindings: Env }>();

// Rate limiting config
const DAILY_MESSAGE_LIMIT = 50;
const MAX_ACTIVE_SESSIONS = 10;

// Helper to generate UUID
const generateId = () => crypto.randomUUID();

// =============================================
// POST /kwame/sessions - Create new session
// =============================================
kwame.post('/sessions', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const { topic = 'general', title } = body;

    // Check active session count
    const { results: activeSessions } = await db.prepare(`
      SELECT COUNT(*) as count FROM kwame_sessions
      WHERE userId = ? AND status = 'active'
    `).bind(userId).all();

    const activeCount = (activeSessions?.[0] as any)?.count || 0;
    if (activeCount >= MAX_ACTIVE_SESSIONS) {
      return c.json({
        error: `You have reached the maximum of ${MAX_ACTIVE_SESSIONS} active sessions. Please complete or close some sessions.`
      }, 400);
    }

    const sessionId = generateId();
    const sessionTitle = title || `Chat ${new Date().toLocaleDateString()}`;

    await db.prepare(`
      INSERT INTO kwame_sessions (id, userId, title, topic, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `).bind(sessionId, userId, sessionTitle, topic).run();

    // Get suggested questions for this topic
    const context: SessionContext = {
      userName: user.displayName,
      userRole: user.role,
      userDepartment: user.department,
      sessionTopic: topic,
    };
    const suggestions = await getSuggestedQuestions(c.env, context);

    return c.json({
      id: sessionId,
      title: sessionTitle,
      topic,
      status: 'active',
      messageCount: 0,
      suggestions,
      createdAt: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('Error creating session:', error);
    return c.json({ error: 'Failed to create session' }, 500);
  }
});

// =============================================
// GET /kwame/sessions - List user's sessions
// =============================================
kwame.get('/sessions', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const status = c.req.query('status'); // 'active', 'completed', or all
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
    const offset = parseInt(c.req.query('offset') || '0');

    let query = `
      SELECT id, title, topic, status, messageCount, lastMessageAt, createdAt, updatedAt
      FROM kwame_sessions
      WHERE userId = ?
    `;
    const params: any[] = [userId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY updatedAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results: sessions } = await db.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM kwame_sessions WHERE userId = ?`;
    const countParams: any[] = [userId];
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    const countResult = await db.prepare(countQuery).bind(...countParams).first();
    const total = (countResult as any)?.count || 0;

    return c.json({
      sessions: sessions || [],
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return c.json({ error: 'Failed to fetch sessions' }, 500);
  }
});

// =============================================
// GET /kwame/sessions/:id - Get session with messages
// =============================================
kwame.get('/sessions/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;
  const sessionId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get session
    const session = await db.prepare(`
      SELECT id, title, topic, status, messageCount, lastMessageAt, createdAt, updatedAt
      FROM kwame_sessions
      WHERE id = ? AND userId = ?
    `).bind(sessionId, userId).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Get messages
    const { results: messages } = await db.prepare(`
      SELECT id, role, content, citations, helpful, processingTimeMs, chunksUsed, createdAt
      FROM kwame_messages
      WHERE sessionId = ?
      ORDER BY createdAt ASC
    `).bind(sessionId).all();

    // Parse citations JSON
    const parsedMessages = (messages || []).map((m: any) => ({
      ...m,
      citations: m.citations ? JSON.parse(m.citations) : [],
    }));

    return c.json({
      ...session,
      messages: parsedMessages,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return c.json({ error: 'Failed to fetch session' }, 500);
  }
});

// =============================================
// POST /kwame/sessions/:id/messages - Send message
// =============================================
kwame.post('/sessions/:id/messages', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;
  const sessionId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return c.json({ error: 'Message content is required' }, 400);
    }

    if (content.length > 2000) {
      return c.json({ error: 'Message is too long (max 2000 characters)' }, 400);
    }

    // Verify session exists and belongs to user
    const session = await db.prepare(`
      SELECT id, status, topic FROM kwame_sessions
      WHERE id = ? AND userId = ?
    `).bind(sessionId, userId).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.status === 'completed') {
      return c.json({ error: 'This session has been completed' }, 400);
    }

    // Check daily message limit
    const today = new Date().toISOString().split('T')[0];
    const messageCount = await db.prepare(`
      SELECT COUNT(*) as count FROM kwame_messages m
      JOIN kwame_sessions s ON m.sessionId = s.id
      WHERE s.userId = ? AND m.role = 'user' AND DATE(m.createdAt) = ?
    `).bind(userId, today).first();

    if ((messageCount as any)?.count >= DAILY_MESSAGE_LIMIT) {
      return c.json({
        error: `You have reached your daily limit of ${DAILY_MESSAGE_LIMIT} messages. Please try again tomorrow.`
      }, 429);
    }

    // Get conversation history for context
    const { results: history } = await db.prepare(`
      SELECT id, role, content, citations FROM kwame_messages
      WHERE sessionId = ?
      ORDER BY createdAt DESC
      LIMIT 10
    `).bind(sessionId).all();

    const conversationHistory: KwameMessage[] = (history || [])
      .reverse()
      .map((m: any) => ({
        id: m.id,
        sessionId,
        role: m.role,
        content: m.content,
        citations: m.citations ? JSON.parse(m.citations) : [],
        createdAt: m.createdAt,
      }));

    // Save user message
    const userMessageId = generateId();
    await db.prepare(`
      INSERT INTO kwame_messages (id, sessionId, role, content, createdAt)
      VALUES (?, ?, 'user', ?, datetime('now'))
    `).bind(userMessageId, sessionId, content.trim()).run();

    // Build context
    const context: SessionContext = {
      userName: user.displayName,
      userRole: user.role,
      userDepartment: user.department,
      sessionTopic: session.topic as string,
    };

    // Check if this matches a suggested question (for analytics)
    await incrementQuestionUsage(c.env, content.trim());

    // Get AI response
    const aiResult = await getKwameResponse(
      c.env,
      sessionId,
      content.trim(),
      conversationHistory,
      context
    );

    // Save assistant message
    const assistantMessageId = generateId();
    await db.prepare(`
      INSERT INTO kwame_messages (
        id, sessionId, role, content, citations, processingTimeMs, chunksUsed, createdAt
      ) VALUES (?, ?, 'assistant', ?, ?, ?, ?, datetime('now'))
    `).bind(
      assistantMessageId,
      sessionId,
      aiResult.response,
      JSON.stringify(aiResult.citations),
      aiResult.processingTimeMs,
      aiResult.chunksUsed
    ).run();

    // Update session
    await db.prepare(`
      UPDATE kwame_sessions
      SET messageCount = messageCount + 2, lastMessageAt = datetime('now'), updatedAt = datetime('now')
      WHERE id = ?
    `).bind(sessionId).run();

    // Auto-generate title from first message if not set
    if (conversationHistory.length === 0) {
      const autoTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await db.prepare(`
        UPDATE kwame_sessions SET title = ? WHERE id = ? AND title LIKE 'Chat %'
      `).bind(autoTitle, sessionId).run();
    }

    return c.json({
      userMessage: {
        id: userMessageId,
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      },
      assistantMessage: {
        id: assistantMessageId,
        role: 'assistant',
        content: aiResult.response,
        citations: aiResult.citations,
        processingTimeMs: aiResult.processingTimeMs,
        chunksUsed: aiResult.chunksUsed,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ error: 'Failed to process message' }, 500);
  }
});

// =============================================
// POST /kwame/messages/:id/feedback - Rate message
// =============================================
kwame.post('/messages/:id/feedback', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;
  const messageId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { helpful } = body;

    if (typeof helpful !== 'boolean') {
      return c.json({ error: 'helpful must be a boolean' }, 400);
    }

    // Verify message belongs to user's session
    const message = await db.prepare(`
      SELECT m.id, s.userId FROM kwame_messages m
      JOIN kwame_sessions s ON m.sessionId = s.id
      WHERE m.id = ? AND s.userId = ?
    `).bind(messageId, userId).first();

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    await db.prepare(`
      UPDATE kwame_messages SET helpful = ? WHERE id = ?
    `).bind(helpful ? 1 : 0, messageId).run();

    return c.json({ success: true, helpful });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return c.json({ error: 'Failed to update feedback' }, 500);
  }
});

// =============================================
// PATCH /kwame/sessions/:id - Update/end session
// =============================================
kwame.patch('/sessions/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;
  const sessionId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { title, status } = body;

    // Verify session belongs to user
    const session = await db.prepare(`
      SELECT id FROM kwame_sessions WHERE id = ? AND userId = ?
    `).bind(sessionId, userId).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }

    if (status && ['active', 'completed'].includes(status)) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = datetime(\'now\')');
      params.push(sessionId);

      await db.prepare(`
        UPDATE kwame_sessions SET ${updates.join(', ')} WHERE id = ?
      `).bind(...params).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return c.json({ error: 'Failed to update session' }, 500);
  }
});

// =============================================
// DELETE /kwame/sessions/:id - Delete session
// =============================================
kwame.delete('/sessions/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;
  const sessionId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Verify session belongs to user
    const session = await db.prepare(`
      SELECT id FROM kwame_sessions WHERE id = ? AND userId = ?
    `).bind(sessionId, userId).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Delete messages first (cascade should handle this, but being explicit)
    await db.prepare(`DELETE FROM kwame_messages WHERE sessionId = ?`).bind(sessionId).run();
    await db.prepare(`DELETE FROM kwame_sessions WHERE id = ?`).bind(sessionId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return c.json({ error: 'Failed to delete session' }, 500);
  }
});

// =============================================
// GET /kwame/suggestions - Get suggested questions
// =============================================
kwame.get('/suggestions', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const context: SessionContext = {
      userName: user?.displayName,
      userRole: user?.role,
      userDepartment: user?.department,
    };

    const suggestions = await getSuggestedQuestions(c.env, context);
    return c.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return c.json({ suggestions: [] });
  }
});

// =============================================
// GET /kwame/stats - Get usage statistics
// =============================================
kwame.get('/stats', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // User stats
    const userStats = await db.prepare(`
      SELECT
        COUNT(DISTINCT s.id) as totalSessions,
        SUM(s.messageCount) as totalMessages,
        (SELECT COUNT(*) FROM kwame_messages m
         JOIN kwame_sessions s2 ON m.sessionId = s2.id
         WHERE s2.userId = ? AND m.helpful = 1) as helpfulResponses
      FROM kwame_sessions s
      WHERE s.userId = ?
    `).bind(userId, userId).first();

    // Today's usage
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = await db.prepare(`
      SELECT COUNT(*) as count FROM kwame_messages m
      JOIN kwame_sessions s ON m.sessionId = s.id
      WHERE s.userId = ? AND m.role = 'user' AND DATE(m.createdAt) = ?
    `).bind(userId, today).first();

    return c.json({
      totalSessions: (userStats as any)?.totalSessions || 0,
      totalMessages: (userStats as any)?.totalMessages || 0,
      helpfulResponses: (userStats as any)?.helpfulResponses || 0,
      todayMessages: (todayUsage as any)?.count || 0,
      dailyLimit: DAILY_MESSAGE_LIMIT,
      remainingToday: DAILY_MESSAGE_LIMIT - ((todayUsage as any)?.count || 0),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// =============================================
// ADMIN ROUTES
// =============================================

// POST /kwame/admin/embed/:documentId - Trigger embedding for document
kwame.post('/admin/embed/:documentId', authMiddleware, async (c) => {
  const user = c.get('user');
  const userRole = user?.role || 'user';

  // Only admins can trigger embedding
  if (!['admin', 'super_admin', 'director'].includes(userRole)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const documentId = c.req.param('documentId');

  try {
    const result = await processDocumentForEmbedding(c.env, documentId);

    if (result.success) {
      return c.json({
        success: true,
        chunksCreated: result.chunksCreated,
        message: `Successfully created ${result.chunksCreated} embeddings for document`,
      });
    } else {
      return c.json({
        success: false,
        error: result.error,
      }, 400);
    }
  } catch (error) {
    console.error('Error processing document:', error);
    return c.json({ error: 'Failed to process document' }, 500);
  }
});

// POST /kwame/admin/embed-all - Process embedding queue
kwame.post('/admin/embed-all', authMiddleware, async (c) => {
  const user = c.get('user');
  const userRole = user?.role || 'user';

  if (!['admin', 'super_admin', 'director'].includes(userRole)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const maxDocs = Math.min(parseInt(body.limit) || 10, 50);

    const result = await processEmbeddingQueue(c.env, maxDocs);

    return c.json({
      success: true,
      ...result,
      message: `Processed ${result.processed} documents: ${result.succeeded} succeeded, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('Error processing queue:', error);
    return c.json({ error: 'Failed to process queue' }, 500);
  }
});

// POST /kwame/admin/queue/:documentId - Add document to queue
kwame.post('/admin/queue/:documentId', authMiddleware, async (c) => {
  const user = c.get('user');
  const userRole = user?.role || 'user';

  if (!['admin', 'super_admin', 'director'].includes(userRole)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const documentId = c.req.param('documentId');
  const body = await c.req.json().catch(() => ({}));
  const priority = parseInt(body.priority) || 0;

  try {
    await queueDocumentForEmbedding(c.env, documentId, priority);
    return c.json({ success: true, message: 'Document queued for embedding' });
  } catch (error) {
    console.error('Error queuing document:', error);
    return c.json({ error: 'Failed to queue document' }, 500);
  }
});

// POST /kwame/admin/reprocess-all - Clear and reprocess ALL document embeddings
kwame.post('/admin/reprocess-all', authMiddleware, async (c) => {
  const user = c.get('user');
  const userRole = user?.role || 'user';

  if (!['admin', 'super_admin'].includes(userRole)) {
    return c.json({ error: 'Unauthorized - super_admin required' }, 403);
  }

  const db = c.env.DB;

  try {
    // 1. Clear ALL existing document chunks
    await db.prepare(`DELETE FROM document_chunks`).run();

    // 2. Clear embedding queue
    await db.prepare(`DELETE FROM embedding_queue`).run();

    // 3. Get all published documents
    const { results: documents } = await db.prepare(`
      SELECT id, title FROM documents WHERE status = 'published'
    `).all();

    if (!documents || documents.length === 0) {
      return c.json({ success: true, message: 'No documents to process', queued: 0 });
    }

    // 4. Queue all documents for embedding with high priority
    for (const doc of documents) {
      await queueDocumentForEmbedding(c.env, doc.id as string, 10);
    }

    // 5. Start processing immediately (first batch)
    const body = await c.req.json().catch(() => ({}));
    const processNow = body.processNow !== false;
    let processed = { processed: 0, succeeded: 0, failed: 0 };

    if (processNow) {
      processed = await processEmbeddingQueue(c.env, 10);
    }

    return c.json({
      success: true,
      message: `Cleared all chunks and queued ${documents.length} documents for re-embedding`,
      totalDocuments: documents.length,
      queued: documents.length,
      immediatelyProcessed: processed,
    });
  } catch (error) {
    console.error('Error reprocessing documents:', error);
    return c.json({ error: 'Failed to reprocess documents' }, 500);
  }
});

// GET /kwame/admin/embedding-stats - Get embedding statistics
kwame.get('/admin/embedding-stats', authMiddleware, async (c) => {
  const user = c.get('user');
  const userRole = user?.role || 'user';

  if (!['admin', 'super_admin', 'director'].includes(userRole)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const stats = await getEmbeddingStats(c.env);
    return c.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// GET /kwame/admin/dashboard - Admin dashboard stats
kwame.get('/admin/dashboard', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userRole = user?.role || 'user';

  if (!['admin', 'super_admin', 'director'].includes(userRole)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [totalSessions, totalMessages, todayMessages, weekMessages, activeUsers, embeddingStats, feedbackStats] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as count FROM kwame_sessions`).first(),
      db.prepare(`SELECT COUNT(*) as count FROM kwame_messages`).first(),
      db.prepare(`SELECT COUNT(*) as count FROM kwame_messages WHERE DATE(createdAt) = ?`).bind(today).first(),
      db.prepare(`SELECT COUNT(*) as count FROM kwame_messages WHERE DATE(createdAt) >= ?`).bind(weekAgo).first(),
      db.prepare(`SELECT COUNT(DISTINCT userId) as count FROM kwame_sessions WHERE DATE(createdAt) >= ?`).bind(weekAgo).first(),
      getEmbeddingStats(c.env),
      db.prepare(`
        SELECT
          SUM(CASE WHEN helpful = 1 THEN 1 ELSE 0 END) as helpful,
          SUM(CASE WHEN helpful = 0 THEN 1 ELSE 0 END) as notHelpful,
          COUNT(CASE WHEN helpful IS NOT NULL THEN 1 END) as total
        FROM kwame_messages WHERE role = 'assistant'
      `).first(),
    ]);

    return c.json({
      sessions: {
        total: (totalSessions as any)?.count || 0,
      },
      messages: {
        total: (totalMessages as any)?.count || 0,
        today: (todayMessages as any)?.count || 0,
        thisWeek: (weekMessages as any)?.count || 0,
      },
      users: {
        activeThisWeek: (activeUsers as any)?.count || 0,
      },
      embeddings: embeddingStats,
      feedback: {
        helpful: (feedbackStats as any)?.helpful || 0,
        notHelpful: (feedbackStats as any)?.notHelpful || 0,
        total: (feedbackStats as any)?.total || 0,
        helpfulRate: (feedbackStats as any)?.total > 0
          ? Math.round(((feedbackStats as any)?.helpful / (feedbackStats as any)?.total) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return c.json({ error: 'Failed to fetch dashboard' }, 500);
  }
});

export default kwame;
