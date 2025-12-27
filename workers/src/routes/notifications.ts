import { Hono } from 'hono';
import { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Helper to generate unique IDs
function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET /notifications - Get user notifications with pagination and filtering
app.get('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const filter = c.req.query('filter') || 'all'; // all, unread, archived
  const type = c.req.query('type'); // Optional type filter
  const priority = c.req.query('priority'); // Optional priority filter

  try {
    let whereClause = 'WHERE userId = ?';
    const params: any[] = [userId];

    if (filter === 'unread') {
      whereClause += ' AND isRead = 0';
    } else if (filter === 'archived') {
      whereClause += ' AND isArchived = 1';
    } else {
      whereClause += ' AND isArchived = 0';
    }

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (priority) {
      whereClause += ' AND priority = ?';
      params.push(priority);
    }

    // Get notifications
    const notifications = await c.env.DB.prepare(`
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 0
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 3
        END,
        createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM notifications ${whereClause}
    `).bind(...params).first();

    // Get unread count
    const unreadResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as unread FROM notifications
      WHERE userId = ? AND isRead = 0 AND isArchived = 0
    `).bind(userId).first();

    return c.json({
      notifications: notifications.results.map((n: any) => ({
        ...n,
        isRead: Boolean(n.isRead),
        isArchived: Boolean(n.isArchived),
        metadata: n.metadata ? JSON.parse(n.metadata) : null
      })),
      pagination: {
        page,
        limit,
        total: (countResult as any)?.total || 0,
        totalPages: Math.ceil(((countResult as any)?.total || 0) / limit)
      },
      unreadCount: (unreadResult as any)?.unread || 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// GET /notifications/summary - Get notification summary/stats
app.get('/summary', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Total unread
    const unreadTotal = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE userId = ? AND isRead = 0 AND isArchived = 0
    `).bind(userId).first();

    // Unread by type
    const unreadByType = await c.env.DB.prepare(`
      SELECT type, COUNT(*) as count FROM notifications
      WHERE userId = ? AND isRead = 0 AND isArchived = 0
      GROUP BY type
    `).bind(userId).all();

    // Unread by priority
    const unreadByPriority = await c.env.DB.prepare(`
      SELECT priority, COUNT(*) as count FROM notifications
      WHERE userId = ? AND isRead = 0 AND isArchived = 0
      GROUP BY priority
    `).bind(userId).all();

    // Recent activity (last 7 days)
    const recentActivity = await c.env.DB.prepare(`
      SELECT DATE(createdAt) as date, COUNT(*) as count FROM notifications
      WHERE userId = ? AND createdAt >= datetime('now', '-7 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `).bind(userId).all();

    // Today's notifications
    const todayCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE userId = ? AND DATE(createdAt) = DATE('now')
    `).bind(userId).first();

    // This week's notifications
    const weekCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE userId = ? AND createdAt >= datetime('now', '-7 days')
    `).bind(userId).first();

    return c.json({
      unreadTotal: (unreadTotal as any)?.count || 0,
      unreadByType: unreadByType.results.reduce((acc: any, item: any) => {
        acc[item.type] = item.count;
        return acc;
      }, {}),
      unreadByPriority: unreadByPriority.results.reduce((acc: any, item: any) => {
        acc[item.priority] = item.count;
        return acc;
      }, {}),
      recentActivity: recentActivity.results,
      todayCount: (todayCount as any)?.count || 0,
      weekCount: (weekCount as any)?.count || 0
    });
  } catch (error) {
    console.error('Error fetching notification summary:', error);
    return c.json({ error: 'Failed to fetch summary' }, 500);
  }
});

// POST /notifications - Create a notification (internal use)
app.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const {
    targetUserId,
    type,
    title,
    message,
    link,
    actorId,
    actorName,
    actorAvatar,
    resourceId,
    resourceType,
    priority = 'normal',
    metadata,
    expiresAt
  } = body;

  // Only allow creating notifications for self or if admin
  const targetId = targetUserId || userId;

  try {
    const id = generateId();

    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, userId, type, title, message, link, actorId, actorName, actorAvatar,
        resourceId, resourceType, priority, metadata, expiresAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, targetId, type, title, message, link || null,
      actorId || null, actorName || null, actorAvatar || null,
      resourceId || null, resourceType || null, priority,
      metadata ? JSON.stringify(metadata) : null,
      expiresAt || null
    ).run();

    return c.json({ success: true, id });
  } catch (error) {
    console.error('Error creating notification:', error);
    return c.json({ error: 'Failed to create notification' }, 500);
  }
});

// PATCH /notifications/:id/read - Mark notification as read
app.patch('/:id/read', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE notifications
      SET isRead = 1, readAt = datetime('now')
      WHERE id = ? AND userId = ?
    `).bind(id, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// PATCH /notifications/read-all - Mark all notifications as read
app.patch('/read-all', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const result = await c.env.DB.prepare(`
      UPDATE notifications
      SET isRead = 1, readAt = datetime('now')
      WHERE userId = ? AND isRead = 0
    `).bind(userId).run();

    return c.json({
      success: true,
      count: result.meta.changes
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    return c.json({ error: 'Failed to mark all as read' }, 500);
  }
});

// PATCH /notifications/:id/archive - Archive notification
app.patch('/:id/archive', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE notifications
      SET isArchived = 1
      WHERE id = ? AND userId = ?
    `).bind(id, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error archiving notification:', error);
    return c.json({ error: 'Failed to archive' }, 500);
  }
});

// DELETE /notifications/:id - Delete notification
app.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await c.env.DB.prepare(`
      DELETE FROM notifications WHERE id = ? AND userId = ?
    `).bind(id, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return c.json({ error: 'Failed to delete' }, 500);
  }
});

// DELETE /notifications - Clear all notifications
app.delete('/', async (c) => {
  const userId = c.get('userId');
  const archived = c.req.query('archived') === 'true';

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    let query = 'DELETE FROM notifications WHERE userId = ?';
    if (archived) {
      query += ' AND isArchived = 1';
    }

    const result = await c.env.DB.prepare(query).bind(userId).run();

    return c.json({
      success: true,
      count: result.meta.changes
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return c.json({ error: 'Failed to clear' }, 500);
  }
});

// GET /notifications/preferences - Get notification preferences
app.get('/preferences', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    let prefs = await c.env.DB.prepare(`
      SELECT * FROM notification_preferences WHERE userId = ?
    `).bind(userId).first();

    if (!prefs) {
      // Create default preferences
      const id = `pref_${userId}`;
      const defaultCategoryPrefs = JSON.stringify({
        messages: { email: true, push: true, inApp: true },
        documents: { email: true, push: false, inApp: true },
        forum: { email: false, push: true, inApp: true },
        groups: { email: true, push: true, inApp: true },
        achievements: { email: false, push: true, inApp: true },
        system: { email: true, push: true, inApp: true }
      });

      await c.env.DB.prepare(`
        INSERT INTO notification_preferences (
          id, userId, categoryPreferences
        ) VALUES (?, ?, ?)
      `).bind(id, userId, defaultCategoryPrefs).run();

      prefs = await c.env.DB.prepare(`
        SELECT * FROM notification_preferences WHERE userId = ?
      `).bind(userId).first();
    }

    return c.json({
      ...prefs,
      emailEnabled: Boolean((prefs as any).emailEnabled),
      pushEnabled: Boolean((prefs as any).pushEnabled),
      inAppEnabled: Boolean((prefs as any).inAppEnabled),
      soundEnabled: Boolean((prefs as any).soundEnabled),
      quietHoursEnabled: Boolean((prefs as any).quietHoursEnabled),
      emailDigestEnabled: Boolean((prefs as any).emailDigestEnabled),
      categoryPreferences: JSON.parse((prefs as any).categoryPreferences || '{}')
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return c.json({ error: 'Failed to fetch preferences' }, 500);
  }
});

// PUT /notifications/preferences - Update notification preferences
app.put('/preferences', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const {
    emailEnabled,
    pushEnabled,
    inAppEnabled,
    soundEnabled,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    emailDigestEnabled,
    emailDigestFrequency,
    emailDigestTime,
    categoryPreferences
  } = body;

  try {
    // Check if preferences exist
    const existing = await c.env.DB.prepare(`
      SELECT id FROM notification_preferences WHERE userId = ?
    `).bind(userId).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE notification_preferences SET
          emailEnabled = ?,
          pushEnabled = ?,
          inAppEnabled = ?,
          soundEnabled = ?,
          quietHoursEnabled = ?,
          quietHoursStart = ?,
          quietHoursEnd = ?,
          emailDigestEnabled = ?,
          emailDigestFrequency = ?,
          emailDigestTime = ?,
          categoryPreferences = ?,
          updatedAt = datetime('now')
        WHERE userId = ?
      `).bind(
        emailEnabled ? 1 : 0,
        pushEnabled ? 1 : 0,
        inAppEnabled ? 1 : 0,
        soundEnabled ? 1 : 0,
        quietHoursEnabled ? 1 : 0,
        quietHoursStart || '22:00',
        quietHoursEnd || '07:00',
        emailDigestEnabled ? 1 : 0,
        emailDigestFrequency || 'daily',
        emailDigestTime || '08:00',
        JSON.stringify(categoryPreferences || {}),
        userId
      ).run();
    } else {
      const id = `pref_${userId}`;
      await c.env.DB.prepare(`
        INSERT INTO notification_preferences (
          id, userId, emailEnabled, pushEnabled, inAppEnabled, soundEnabled,
          quietHoursEnabled, quietHoursStart, quietHoursEnd,
          emailDigestEnabled, emailDigestFrequency, emailDigestTime,
          categoryPreferences
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, userId,
        emailEnabled ? 1 : 0,
        pushEnabled ? 1 : 0,
        inAppEnabled ? 1 : 0,
        soundEnabled ? 1 : 0,
        quietHoursEnabled ? 1 : 0,
        quietHoursStart || '22:00',
        quietHoursEnd || '07:00',
        emailDigestEnabled ? 1 : 0,
        emailDigestFrequency || 'daily',
        emailDigestTime || '08:00',
        JSON.stringify(categoryPreferences || {})
      ).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return c.json({ error: 'Failed to update preferences' }, 500);
  }
});

// POST /notifications/subscribe - Subscribe to push notifications
app.post('/subscribe', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { endpoint, keys, userAgent } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return c.json({ error: 'Invalid subscription data' }, 400);
  }

  try {
    const id = `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO push_subscriptions (
        id, userId, endpoint, p256dh, auth, userAgent
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, userId, endpoint, keys.p256dh, keys.auth, userAgent || null).run();

    return c.json({ success: true, id });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return c.json({ error: 'Failed to subscribe' }, 500);
  }
});

// DELETE /notifications/subscribe - Unsubscribe from push notifications
app.delete('/subscribe', async (c) => {
  const userId = c.get('userId');
  const { endpoint } = await c.req.json();

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await c.env.DB.prepare(`
      DELETE FROM push_subscriptions WHERE userId = ? AND endpoint = ?
    `).bind(userId, endpoint).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return c.json({ error: 'Failed to unsubscribe' }, 500);
  }
});

// GET /notifications/templates - Get notification templates (admin)
app.get('/templates', async (c) => {
  try {
    const templates = await c.env.DB.prepare(`
      SELECT * FROM notification_templates WHERE isActive = 1 ORDER BY type
    `).all();

    return c.json({ templates: templates.results });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return c.json({ error: 'Failed to fetch templates' }, 500);
  }
});

// Helper endpoint to create welcome notification for new users
app.post('/welcome', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = generateId();

    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, userId, type, title, message, priority
      ) VALUES (?, ?, 'welcome', 'Welcome to OHCS E-Library!', 'Start exploring Ghana''s premier civil service knowledge platform. Check out the library, join discussions, and earn XP!', 'high')
    `).bind(id, userId).run();

    return c.json({ success: true, id });
  } catch (error) {
    console.error('Error creating welcome notification:', error);
    return c.json({ error: 'Failed to create welcome notification' }, 500);
  }
});

// Bulk create notifications (for system announcements)
app.post('/bulk', async (c) => {
  const body = await c.req.json();
  const { userIds, type, title, message, link, priority = 'normal', metadata } = body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return c.json({ error: 'userIds array required' }, 400);
  }

  try {
    const notifications = userIds.map(userId => ({
      id: generateId(),
      userId,
      type,
      title,
      message,
      link: link || null,
      priority,
      metadata: metadata ? JSON.stringify(metadata) : null
    }));

    // Insert in batches
    for (const notif of notifications) {
      await c.env.DB.prepare(`
        INSERT INTO notifications (id, userId, type, title, message, link, priority, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        notif.id, notif.userId, notif.type, notif.title,
        notif.message, notif.link, notif.priority, notif.metadata
      ).run();
    }

    return c.json({ success: true, count: notifications.length });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return c.json({ error: 'Failed to create notifications' }, 500);
  }
});

export default app;
