import { Hono } from 'hono';
import type { Env } from '../index';
import { authMiddleware } from '../middleware/auth';

const presence = new Hono<{ Bindings: Env }>();

// ============================================================================
// Heartbeat & Status
// ============================================================================

// Send heartbeat (update online status)
presence.post('/heartbeat', authMiddleware, async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const userId = c.get('user')?.id;
  const body = await c.req.json().catch(() => ({}));
  const { status = 'online', currentActivity } = body;

  try {
    // Update presence in database
    await db.prepare(`
      INSERT INTO user_presence (userId, status, lastSeenAt, currentActivity)
      VALUES (?, ?, datetime('now'), ?)
      ON CONFLICT (userId) DO UPDATE SET
        status = ?,
        lastSeenAt = datetime('now'),
        currentActivity = ?
    `).bind(userId, status, currentActivity || null, status, currentActivity || null).run();

    // Also cache in KV for faster access (expires in 2 minutes)
    await cache.put(`presence:${userId}`, JSON.stringify({
      status,
      lastSeenAt: new Date().toISOString(),
      currentActivity,
    }), { expirationTtl: 120 });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating presence:', error);
    return c.json({ error: 'Failed to update presence' }, 500);
  }
});

// Set status
presence.put('/status', authMiddleware, async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const userId = c.get('user')?.id;
  const body = await c.req.json();
  const { status } = body;

  if (!['online', 'away', 'busy', 'offline'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  try {
    await db.prepare(`
      INSERT INTO user_presence (userId, status, lastSeenAt)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT (userId) DO UPDATE SET
        status = ?,
        lastSeenAt = datetime('now')
    `).bind(userId, status, status).run();

    // Update cache
    await cache.put(`presence:${userId}`, JSON.stringify({
      status,
      lastSeenAt: new Date().toISOString(),
    }), { expirationTtl: 120 });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error setting status:', error);
    return c.json({ error: 'Failed to set status' }, 500);
  }
});

// Get presence for multiple users
presence.get('/users', authMiddleware, async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const { userIds } = c.req.query();

  if (!userIds) {
    return c.json({ error: 'userIds query parameter is required' }, 400);
  }

  const ids = userIds.split(',').filter(Boolean);

  if (ids.length === 0) {
    return c.json({ presence: {} });
  }

  if (ids.length > 50) {
    return c.json({ error: 'Maximum 50 users at a time' }, 400);
  }

  try {
    const presenceMap: Record<string, any> = {};

    // Try to get from cache first
    for (const id of ids) {
      const cached = await cache.get(`presence:${id}`);
      if (cached) {
        presenceMap[id] = JSON.parse(cached);
      }
    }

    // Get uncached from database
    const uncachedIds = ids.filter(id => !presenceMap[id]);

    if (uncachedIds.length > 0) {
      const placeholders = uncachedIds.map(() => '?').join(',');
      const dbPresence = await db.prepare(`
        SELECT userId, status, lastSeenAt, currentActivity
        FROM user_presence
        WHERE userId IN (${placeholders})
      `).bind(...uncachedIds).all();

      for (const p of (dbPresence.results || []) as any[]) {
        presenceMap[p.userId] = {
          status: p.status,
          lastSeenAt: p.lastSeenAt,
          currentActivity: p.currentActivity,
        };
      }
    }

    // Mark missing users as offline
    for (const id of ids) {
      if (!presenceMap[id]) {
        presenceMap[id] = { status: 'offline', lastSeenAt: null };
      }
    }

    return c.json({ presence: presenceMap });
  } catch (error) {
    console.error('Error fetching presence:', error);
    return c.json({ error: 'Failed to fetch presence' }, 500);
  }
});

// Get single user presence
presence.get('/users/:userId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const targetUserId = c.req.param('userId');

  try {
    // Try cache first
    const cached = await cache.get(`presence:${targetUserId}`);
    if (cached) {
      return c.json({ presence: JSON.parse(cached) });
    }

    // Get from database
    const dbPresence = await db.prepare(`
      SELECT status, lastSeenAt, currentActivity
      FROM user_presence WHERE userId = ?
    `).bind(targetUserId).first();

    if (dbPresence) {
      return c.json({
        presence: {
          status: dbPresence.status,
          lastSeenAt: dbPresence.lastSeenAt,
          currentActivity: dbPresence.currentActivity,
        },
      });
    }

    return c.json({ presence: { status: 'offline', lastSeenAt: null } });
  } catch (error) {
    console.error('Error fetching user presence:', error);
    return c.json({ error: 'Failed to fetch presence' }, 500);
  }
});

// ============================================================================
// Typing Indicators
// ============================================================================

// Broadcast typing indicator
presence.post('/typing', authMiddleware, async (c) => {
  const cache = c.env.CACHE;
  const userId = c.get('user')?.id;
  const body = await c.req.json();
  const { roomId, roomType } = body;

  if (!roomId || !roomType) {
    return c.json({ error: 'roomId and roomType are required' }, 400);
  }

  try {
    const key = `typing:${roomType}:${roomId}`;

    // Get current typing users
    const currentTyping = await cache.get(key);
    let typingUsers: Record<string, string> = currentTyping ? JSON.parse(currentTyping) : {};

    // Add/update current user with timestamp
    typingUsers[userId] = new Date().toISOString();

    // Remove stale entries (older than 5 seconds)
    const now = Date.now();
    for (const [uid, timestamp] of Object.entries(typingUsers)) {
      if (now - new Date(timestamp).getTime() > 5000) {
        delete typingUsers[uid];
      }
    }

    // Store in cache (expires in 10 seconds)
    await cache.put(key, JSON.stringify(typingUsers), { expirationTtl: 10 });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error broadcasting typing:', error);
    return c.json({ error: 'Failed to broadcast typing' }, 500);
  }
});

// Stop typing indicator
presence.delete('/typing', authMiddleware, async (c) => {
  const cache = c.env.CACHE;
  const userId = c.get('user')?.id;
  const body = await c.req.json();
  const { roomId, roomType } = body;

  if (!roomId || !roomType) {
    return c.json({ error: 'roomId and roomType are required' }, 400);
  }

  try {
    const key = `typing:${roomType}:${roomId}`;

    // Get current typing users
    const currentTyping = await cache.get(key);
    if (currentTyping) {
      const typingUsers: Record<string, string> = JSON.parse(currentTyping);
      delete typingUsers[userId];

      if (Object.keys(typingUsers).length > 0) {
        await cache.put(key, JSON.stringify(typingUsers), { expirationTtl: 10 });
      } else {
        await cache.delete(key);
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error stopping typing:', error);
    return c.json({ error: 'Failed to stop typing' }, 500);
  }
});

// Get who's typing in a room
presence.get('/typing/:roomType/:roomId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const userId = c.get('user')?.id;
  const roomType = c.req.param('roomType');
  const roomId = c.req.param('roomId');

  try {
    const key = `typing:${roomType}:${roomId}`;

    // Get typing users from cache
    const currentTyping = await cache.get(key);
    if (!currentTyping) {
      return c.json({ typingUsers: [] });
    }

    const typingUsers: Record<string, string> = JSON.parse(currentTyping);

    // Remove stale entries and current user
    const now = Date.now();
    const activeTypingUserIds: string[] = [];

    for (const [uid, timestamp] of Object.entries(typingUsers)) {
      if (uid !== userId && now - new Date(timestamp).getTime() <= 5000) {
        activeTypingUserIds.push(uid);
      }
    }

    if (activeTypingUserIds.length === 0) {
      return c.json({ typingUsers: [] });
    }

    // Get user details
    const placeholders = activeTypingUserIds.map(() => '?').join(',');
    const users = await db.prepare(`
      SELECT id, displayName, avatar FROM users WHERE id IN (${placeholders})
    `).bind(...activeTypingUserIds).all();

    return c.json({
      typingUsers: users.results || [],
    });
  } catch (error) {
    console.error('Error fetching typing users:', error);
    return c.json({ error: 'Failed to fetch typing users' }, 500);
  }
});

// ============================================================================
// Online Friends/Following
// ============================================================================

// Get online users from following list
presence.get('/online-following', authMiddleware, async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  const userId = c.get('user')?.id;

  try {
    // Get users the current user follows
    const following = await db.prepare(`
      SELECT followingId FROM user_follows WHERE followerId = ?
    `).bind(userId).all();

    const followingIds = (following.results || []).map((f: any) => f.followingId);

    if (followingIds.length === 0) {
      return c.json({ onlineUsers: [] });
    }

    // Check presence for each (use cache)
    const onlineUsers: any[] = [];

    for (const fId of followingIds) {
      const cached = await cache.get(`presence:${fId}`);
      if (cached) {
        const presence = JSON.parse(cached);
        if (presence.status !== 'offline') {
          onlineUsers.push({ userId: fId, ...presence });
        }
      }
    }

    if (onlineUsers.length === 0) {
      return c.json({ onlineUsers: [] });
    }

    // Get user details
    const onlineIds = onlineUsers.map(u => u.userId);
    const placeholders = onlineIds.map(() => '?').join(',');
    const users = await db.prepare(`
      SELECT id, displayName, avatar FROM users WHERE id IN (${placeholders})
    `).bind(...onlineIds).all();

    const userMap = (users.results || []).reduce((acc: any, u: any) => {
      acc[u.id] = u;
      return acc;
    }, {});

    return c.json({
      onlineUsers: onlineUsers.map(u => ({
        ...userMap[u.userId],
        status: u.status,
        lastSeenAt: u.lastSeenAt,
        currentActivity: u.currentActivity,
      })),
    });
  } catch (error) {
    console.error('Error fetching online following:', error);
    return c.json({ error: 'Failed to fetch online users' }, 500);
  }
});

// ============================================================================
// Cleanup (called periodically)
// ============================================================================

// Mark stale users as offline (users who haven't sent heartbeat in 2+ minutes)
// Restricted to admin roles only — prevents unauthenticated callers from wiping presence
presence.post('/cleanup', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  const db = c.env.DB;

  try {
    await db.prepare(`
      UPDATE user_presence
      SET status = 'offline'
      WHERE status != 'offline'
      AND lastSeenAt < datetime('now', '-2 minutes')
    `).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error cleaning up presence:', error);
    return c.json({ error: 'Failed to cleanup' }, 500);
  }
});

export default presence;
