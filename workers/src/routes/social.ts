import { Hono } from 'hono';
import type { Env } from '../index';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const social = new Hono<{ Bindings: Env }>();

// ============================================================================
// Following System
// ============================================================================

// Get users I'm following
social.get('/following', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const { page = '1', limit = '20', search } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = `
      SELECT
        u.id, u.displayName, u.firstName, u.lastName, u.avatar, u.jobTitle, u.bio,
        u.xp, u.level, m.name as mdaName,
        uf.createdAt as followedAt
      FROM user_follows uf
      JOIN users u ON uf.followingId = u.id
      LEFT JOIN mdas m ON u.mdaId = m.id
      WHERE uf.followerId = ?
    `;
    const params: any[] = [userId];

    if (search) {
      query += ` AND (u.displayName LIKE ? OR u.firstName LIKE ? OR u.lastName LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY uf.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const following = await db.prepare(query).bind(...params).all();

    // Get total count
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM user_follows WHERE followerId = ?
    `).bind(userId).first();

    return c.json({
      following: following.results || [],
      total: (countResult?.total as number) || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching following:', error);
    return c.json({ error: 'Failed to fetch following' }, 500);
  }
});

// Get my followers
social.get('/followers', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const { page = '1', limit = '20', search } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = `
      SELECT
        u.id, u.displayName, u.firstName, u.lastName, u.avatar, u.jobTitle, u.bio,
        u.xp, u.level, m.name as mdaName,
        uf.createdAt as followedAt,
        CASE WHEN uf2.id IS NOT NULL THEN 1 ELSE 0 END as isFollowingBack
      FROM user_follows uf
      JOIN users u ON uf.followerId = u.id
      LEFT JOIN mdas m ON u.mdaId = m.id
      LEFT JOIN user_follows uf2 ON uf2.followerId = ? AND uf2.followingId = u.id
      WHERE uf.followingId = ?
    `;
    const params: any[] = [userId, userId];

    if (search) {
      query += ` AND (u.displayName LIKE ? OR u.firstName LIKE ? OR u.lastName LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY uf.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const followers = await db.prepare(query).bind(...params).all();

    // Get total count
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM user_follows WHERE followingId = ?
    `).bind(userId).first();

    return c.json({
      followers: (followers.results || []).map((f: any) => ({
        ...f,
        isFollowingBack: !!f.isFollowingBack,
      })),
      total: (countResult?.total as number) || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return c.json({ error: 'Failed to fetch followers' }, 500);
  }
});

// Get a specific user's followers
social.get('/users/:id/followers', optionalAuth, async (c) => {
  const db = c.env.DB;
  const targetUserId = c.req.param('id');
  const currentUserId = c.get('user')?.id;
  const { page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const query = `
      SELECT
        u.id, u.displayName, u.firstName, u.lastName, u.avatar, u.jobTitle,
        uf.createdAt as followedAt,
        CASE WHEN uf2.id IS NOT NULL THEN 1 ELSE 0 END as isFollowing
      FROM user_follows uf
      JOIN users u ON uf.followerId = u.id
      LEFT JOIN user_follows uf2 ON uf2.followerId = ? AND uf2.followingId = u.id
      WHERE uf.followingId = ?
      ORDER BY uf.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const followers = await db.prepare(query)
      .bind(currentUserId || '', targetUserId, parseInt(limit), offset)
      .all();

    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM user_follows WHERE followingId = ?
    `).bind(targetUserId).first();

    return c.json({
      followers: (followers.results || []).map((f: any) => ({
        ...f,
        isFollowing: !!f.isFollowing,
      })),
      total: (countResult?.total as number) || 0,
    });
  } catch (error) {
    console.error('Error fetching user followers:', error);
    return c.json({ error: 'Failed to fetch followers' }, 500);
  }
});

// Get a specific user's following
social.get('/users/:id/following', optionalAuth, async (c) => {
  const db = c.env.DB;
  const targetUserId = c.req.param('id');
  const currentUserId = c.get('user')?.id;
  const { page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const query = `
      SELECT
        u.id, u.displayName, u.firstName, u.lastName, u.avatar, u.jobTitle,
        uf.createdAt as followedAt,
        CASE WHEN uf2.id IS NOT NULL THEN 1 ELSE 0 END as isFollowing
      FROM user_follows uf
      JOIN users u ON uf.followingId = u.id
      LEFT JOIN user_follows uf2 ON uf2.followerId = ? AND uf2.followingId = u.id
      WHERE uf.followerId = ?
      ORDER BY uf.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const following = await db.prepare(query)
      .bind(currentUserId || '', targetUserId, parseInt(limit), offset)
      .all();

    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM user_follows WHERE followerId = ?
    `).bind(targetUserId).first();

    return c.json({
      following: (following.results || []).map((f: any) => ({
        ...f,
        isFollowing: !!f.isFollowing,
      })),
      total: (countResult?.total as number) || 0,
    });
  } catch (error) {
    console.error('Error fetching user following:', error);
    return c.json({ error: 'Failed to fetch following' }, 500);
  }
});

// Follow a user
social.post('/follow/:userId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUserId = c.get('user')?.id;
  const targetUserId = c.req.param('userId');

  if (currentUserId === targetUserId) {
    return c.json({ error: 'Cannot follow yourself' }, 400);
  }

  try {
    // Check if user exists
    const targetUser = await db.prepare('SELECT id FROM users WHERE id = ?')
      .bind(targetUserId).first();

    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if blocked
    const blocked = await db.prepare(`
      SELECT id FROM user_blocks
      WHERE (blockerId = ? AND blockedId = ?) OR (blockerId = ? AND blockedId = ?)
    `).bind(currentUserId, targetUserId, targetUserId, currentUserId).first();

    if (blocked) {
      return c.json({ error: 'Cannot follow this user' }, 403);
    }

    // Check if already following
    const existing = await db.prepare(`
      SELECT id FROM user_follows WHERE followerId = ? AND followingId = ?
    `).bind(currentUserId, targetUserId).first();

    if (existing) {
      return c.json({ error: 'Already following this user' }, 400);
    }

    // Create follow
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO user_follows (id, followerId, followingId) VALUES (?, ?, ?)
    `).bind(id, currentUserId, targetUserId).run();

    // Create notification
    const notifId = crypto.randomUUID();
    const currentUser = await db.prepare(`
      SELECT displayName, avatar FROM users WHERE id = ?
    `).bind(currentUserId).first();

    await db.prepare(`
      INSERT INTO notifications (id, userId, type, title, message, actorId, actorName, actorAvatar, link, priority)
      VALUES (?, ?, 'follow', ?, ?, ?, ?, ?, ?, 'normal')
    `).bind(
      notifId,
      targetUserId,
      'New Follower',
      `${currentUser?.displayName || 'Someone'} started following you`,
      currentUserId,
      currentUser?.displayName,
      currentUser?.avatar,
      `/profile/${currentUserId}`
    ).run();

    // Award XP for following
    const xpId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId)
      VALUES (?, ?, 5, 'followed_user', 'user', ?)
    `).bind(xpId, currentUserId, targetUserId).run();

    return c.json({ success: true, message: 'Now following user' }, 201);
  } catch (error) {
    console.error('Error following user:', error);
    return c.json({ error: 'Failed to follow user' }, 500);
  }
});

// Unfollow a user
social.delete('/follow/:userId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUserId = c.get('user')?.id;
  const targetUserId = c.req.param('userId');

  try {
    const result = await db.prepare(`
      DELETE FROM user_follows WHERE followerId = ? AND followingId = ?
    `).bind(currentUserId, targetUserId).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Not following this user' }, 400);
    }

    return c.json({ success: true, message: 'Unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return c.json({ error: 'Failed to unfollow user' }, 500);
  }
});

// ============================================================================
// Connections System
// ============================================================================

// Get my connections
social.get('/connections', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const { status = 'accepted', type, page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = `
      SELECT
        uc.*,
        u.id as connectedUserId, u.displayName, u.firstName, u.lastName,
        u.avatar, u.jobTitle, u.bio, m.name as mdaName
      FROM user_connections uc
      JOIN users u ON (
        CASE
          WHEN uc.userId = ? THEN uc.connectedUserId = u.id
          ELSE uc.userId = u.id
        END
      )
      LEFT JOIN mdas m ON u.mdaId = m.id
      WHERE (uc.userId = ? OR uc.connectedUserId = ?)
      AND uc.status = ?
    `;
    const params: any[] = [userId, userId, userId, status];

    if (type) {
      query += ` AND uc.connectionType = ?`;
      params.push(type);
    }

    query += ` ORDER BY uc.respondedAt DESC, uc.requestedAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const connections = await db.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total FROM user_connections
      WHERE (userId = ? OR connectedUserId = ?) AND status = ?
    `;
    const countParams: any[] = [userId, userId, status];
    if (type) {
      countQuery += ` AND connectionType = ?`;
      countParams.push(type);
    }

    const countResult = await db.prepare(countQuery).bind(...countParams).first();

    return c.json({
      connections: connections.results || [],
      total: (countResult?.total as number) || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return c.json({ error: 'Failed to fetch connections' }, 500);
  }
});

// Get pending connection requests (received)
social.get('/connections/pending', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;

  try {
    const pending = await db.prepare(`
      SELECT
        uc.*,
        u.id as requesterId, u.displayName, u.firstName, u.lastName,
        u.avatar, u.jobTitle, m.name as mdaName
      FROM user_connections uc
      JOIN users u ON uc.userId = u.id
      LEFT JOIN mdas m ON u.mdaId = m.id
      WHERE uc.connectedUserId = ? AND uc.status = 'pending'
      ORDER BY uc.requestedAt DESC
    `).bind(userId).all();

    return c.json({ requests: pending.results || [] });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return c.json({ error: 'Failed to fetch requests' }, 500);
  }
});

// Get sent connection requests
social.get('/connections/sent', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;

  try {
    const sent = await db.prepare(`
      SELECT
        uc.*,
        u.id as recipientId, u.displayName, u.firstName, u.lastName,
        u.avatar, u.jobTitle, m.name as mdaName
      FROM user_connections uc
      JOIN users u ON uc.connectedUserId = u.id
      LEFT JOIN mdas m ON u.mdaId = m.id
      WHERE uc.userId = ? AND uc.status = 'pending'
      ORDER BY uc.requestedAt DESC
    `).bind(userId).all();

    return c.json({ requests: sent.results || [] });
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    return c.json({ error: 'Failed to fetch requests' }, 500);
  }
});

// Send connection request
social.post('/connect/:userId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUserId = c.get('user')?.id;
  const targetUserId = c.req.param('userId');
  const body = await c.req.json().catch(() => ({}));
  const connectionType = body.connectionType || 'colleague';

  if (currentUserId === targetUserId) {
    return c.json({ error: 'Cannot connect with yourself' }, 400);
  }

  try {
    // Check if target user exists
    const targetUser = await db.prepare('SELECT id FROM users WHERE id = ?')
      .bind(targetUserId).first();

    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if blocked
    const blocked = await db.prepare(`
      SELECT id FROM user_blocks
      WHERE (blockerId = ? AND blockedId = ?) OR (blockerId = ? AND blockedId = ?)
    `).bind(currentUserId, targetUserId, targetUserId, currentUserId).first();

    if (blocked) {
      return c.json({ error: 'Cannot connect with this user' }, 403);
    }

    // Check for existing connection (in either direction)
    const existing = await db.prepare(`
      SELECT id, status FROM user_connections
      WHERE (userId = ? AND connectedUserId = ?) OR (userId = ? AND connectedUserId = ?)
    `).bind(currentUserId, targetUserId, targetUserId, currentUserId).first();

    if (existing) {
      if (existing.status === 'pending') {
        return c.json({ error: 'Connection request already pending' }, 400);
      } else if (existing.status === 'accepted') {
        return c.json({ error: 'Already connected' }, 400);
      }
    }

    // Create connection request
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO user_connections (id, userId, connectedUserId, connectionType, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(id, currentUserId, targetUserId, connectionType).run();

    // Create notification
    const notifId = crypto.randomUUID();
    const currentUser = await db.prepare(`
      SELECT displayName, avatar FROM users WHERE id = ?
    `).bind(currentUserId).first();

    await db.prepare(`
      INSERT INTO notifications (id, userId, type, title, message, actorId, actorName, actorAvatar, link, priority)
      VALUES (?, ?, 'connection_request', ?, ?, ?, ?, ?, ?, 'normal')
    `).bind(
      notifId,
      targetUserId,
      'Connection Request',
      `${currentUser?.displayName || 'Someone'} wants to connect with you`,
      currentUserId,
      currentUser?.displayName,
      currentUser?.avatar,
      `/network?tab=requests`
    ).run();

    return c.json({ success: true, message: 'Connection request sent' }, 201);
  } catch (error) {
    console.error('Error sending connection request:', error);
    return c.json({ error: 'Failed to send request' }, 500);
  }
});

// Accept or decline connection request
social.put('/connect/:userId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUserId = c.get('user')?.id;
  const requesterId = c.req.param('userId');
  const body = await c.req.json();
  const { accept } = body;

  try {
    const connection = await db.prepare(`
      SELECT * FROM user_connections
      WHERE userId = ? AND connectedUserId = ? AND status = 'pending'
    `).bind(requesterId, currentUserId).first();

    if (!connection) {
      return c.json({ error: 'Connection request not found' }, 404);
    }

    if (accept) {
      await db.prepare(`
        UPDATE user_connections
        SET status = 'accepted', respondedAt = datetime('now')
        WHERE id = ?
      `).bind(connection.id).run();

      // Create notification for requester
      const notifId = crypto.randomUUID();
      const currentUser = await db.prepare(`
        SELECT displayName, avatar FROM users WHERE id = ?
      `).bind(currentUserId).first();

      await db.prepare(`
        INSERT INTO notifications (id, userId, type, title, message, actorId, actorName, actorAvatar, link, priority)
        VALUES (?, ?, 'connection_accepted', ?, ?, ?, ?, ?, ?, 'normal')
      `).bind(
        notifId,
        requesterId,
        'Connection Accepted',
        `${currentUser?.displayName || 'Someone'} accepted your connection request`,
        currentUserId,
        currentUser?.displayName,
        currentUser?.avatar,
        `/profile/${currentUserId}`
      ).run();

      return c.json({ success: true, message: 'Connection accepted' });
    } else {
      await db.prepare(`
        UPDATE user_connections
        SET status = 'declined', respondedAt = datetime('now')
        WHERE id = ?
      `).bind(connection.id).run();

      return c.json({ success: true, message: 'Connection declined' });
    }
  } catch (error) {
    console.error('Error responding to connection:', error);
    return c.json({ error: 'Failed to respond to request' }, 500);
  }
});

// Remove connection
social.delete('/connect/:userId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUserId = c.get('user')?.id;
  const connectedUserId = c.req.param('userId');

  try {
    const result = await db.prepare(`
      DELETE FROM user_connections
      WHERE ((userId = ? AND connectedUserId = ?) OR (userId = ? AND connectedUserId = ?))
      AND status = 'accepted'
    `).bind(currentUserId, connectedUserId, connectedUserId, currentUserId).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    return c.json({ success: true, message: 'Connection removed' });
  } catch (error) {
    console.error('Error removing connection:', error);
    return c.json({ error: 'Failed to remove connection' }, 500);
  }
});

// ============================================================================
// Blocking System
// ============================================================================

// Block a user
social.post('/block/:userId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUserId = c.get('user')?.id;
  const targetUserId = c.req.param('userId');
  const body = await c.req.json().catch(() => ({}));
  const reason = body.reason;

  if (currentUserId === targetUserId) {
    return c.json({ error: 'Cannot block yourself' }, 400);
  }

  try {
    // Check if already blocked
    const existing = await db.prepare(`
      SELECT id FROM user_blocks WHERE blockerId = ? AND blockedId = ?
    `).bind(currentUserId, targetUserId).first();

    if (existing) {
      return c.json({ error: 'User already blocked' }, 400);
    }

    // Block user
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO user_blocks (id, blockerId, blockedId, reason) VALUES (?, ?, ?, ?)
    `).bind(id, currentUserId, targetUserId, reason || null).run();

    // Remove any follows
    await db.prepare(`
      DELETE FROM user_follows
      WHERE (followerId = ? AND followingId = ?) OR (followerId = ? AND followingId = ?)
    `).bind(currentUserId, targetUserId, targetUserId, currentUserId).run();

    // Remove any connections
    await db.prepare(`
      DELETE FROM user_connections
      WHERE (userId = ? AND connectedUserId = ?) OR (userId = ? AND connectedUserId = ?)
    `).bind(currentUserId, targetUserId, targetUserId, currentUserId).run();

    return c.json({ success: true, message: 'User blocked' }, 201);
  } catch (error) {
    console.error('Error blocking user:', error);
    return c.json({ error: 'Failed to block user' }, 500);
  }
});

// Unblock a user
social.delete('/block/:userId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUserId = c.get('user')?.id;
  const targetUserId = c.req.param('userId');

  try {
    const result = await db.prepare(`
      DELETE FROM user_blocks WHERE blockerId = ? AND blockedId = ?
    `).bind(currentUserId, targetUserId).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'User not blocked' }, 400);
    }

    return c.json({ success: true, message: 'User unblocked' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return c.json({ error: 'Failed to unblock user' }, 500);
  }
});

// Get blocked users
social.get('/blocked', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;

  try {
    const blocked = await db.prepare(`
      SELECT
        ub.id, ub.reason, ub.createdAt,
        u.id as userId, u.displayName, u.avatar
      FROM user_blocks ub
      JOIN users u ON ub.blockedId = u.id
      WHERE ub.blockerId = ?
      ORDER BY ub.createdAt DESC
    `).bind(userId).all();

    return c.json({ blocked: blocked.results || [] });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return c.json({ error: 'Failed to fetch blocked users' }, 500);
  }
});

// ============================================================================
// Suggestions ("People You May Know")
// ============================================================================

social.get('/suggestions', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const { limit = '10' } = c.req.query();

  try {
    // Get current user's MDA
    const currentUser = await db.prepare(`
      SELECT mdaId FROM users WHERE id = ?
    `).bind(userId).first();

    // Get suggestions based on:
    // 1. Same MDA
    // 2. Mutual connections
    // 3. Active in same groups
    // Excluding: already following, connected, or blocked
    const suggestions = await db.prepare(`
      SELECT DISTINCT
        u.id, u.displayName, u.firstName, u.lastName, u.avatar, u.jobTitle, u.bio,
        m.name as mdaName,
        CASE WHEN u.mdaId = ? THEN 'same_mda' ELSE 'active_user' END as reason,
        (SELECT COUNT(*) FROM user_follows WHERE followerId = u.id) as followerCount
      FROM users u
      LEFT JOIN mdas m ON u.mdaId = m.id
      WHERE u.id != ?
      AND u.status = 'active'
      AND u.id NOT IN (SELECT followingId FROM user_follows WHERE followerId = ?)
      AND u.id NOT IN (SELECT connectedUserId FROM user_connections WHERE userId = ? AND status IN ('pending', 'accepted'))
      AND u.id NOT IN (SELECT userId FROM user_connections WHERE connectedUserId = ? AND status IN ('pending', 'accepted'))
      AND u.id NOT IN (SELECT blockedId FROM user_blocks WHERE blockerId = ?)
      AND u.id NOT IN (SELECT blockerId FROM user_blocks WHERE blockedId = ?)
      AND u.id NOT IN (SELECT suggestedUserId FROM suggested_connections WHERE userId = ? AND isHidden = 1)
      ORDER BY
        CASE WHEN u.mdaId = ? THEN 0 ELSE 1 END,
        followerCount DESC
      LIMIT ?
    `).bind(
      currentUser?.mdaId || '',
      userId,
      userId,
      userId,
      userId,
      userId,
      userId,
      userId,
      currentUser?.mdaId || '',
      parseInt(limit)
    ).all();

    // Calculate mutual connections for each suggestion
    const suggestionsWithMutual = await Promise.all(
      (suggestions.results || []).map(async (s: any) => {
        const mutualResult = await db.prepare(`
          SELECT COUNT(*) as count FROM user_follows uf1
          JOIN user_follows uf2 ON uf1.followingId = uf2.followingId
          WHERE uf1.followerId = ? AND uf2.followerId = ?
        `).bind(userId, s.id).first();

        return {
          ...s,
          mutualCount: (mutualResult?.count as number) || 0,
        };
      })
    );

    return c.json({ suggestions: suggestionsWithMutual });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return c.json({ error: 'Failed to fetch suggestions' }, 500);
  }
});

// Hide suggestion
social.post('/suggestions/:userId/hide', authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUserId = c.get('user')?.id;
  const suggestedUserId = c.req.param('userId');

  try {
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO suggested_connections (id, userId, suggestedUserId, isHidden, reason)
      VALUES (?, ?, ?, 1, 'hidden_by_user')
      ON CONFLICT (userId, suggestedUserId) DO UPDATE SET isHidden = 1
    `).bind(id, currentUserId, suggestedUserId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error hiding suggestion:', error);
    return c.json({ error: 'Failed to hide suggestion' }, 500);
  }
});

// ============================================================================
// Mutual Connections
// ============================================================================

social.get('/mutual/:userId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUserId = c.get('user')?.id;
  const targetUserId = c.req.param('userId');
  const { limit = '10' } = c.req.query();

  try {
    // Get users that both current user and target user follow
    const mutual = await db.prepare(`
      SELECT
        u.id, u.displayName, u.firstName, u.lastName, u.avatar, u.jobTitle
      FROM user_follows uf1
      JOIN user_follows uf2 ON uf1.followingId = uf2.followingId
      JOIN users u ON u.id = uf1.followingId
      WHERE uf1.followerId = ? AND uf2.followerId = ?
      LIMIT ?
    `).bind(currentUserId, targetUserId, parseInt(limit)).all();

    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM user_follows uf1
      JOIN user_follows uf2 ON uf1.followingId = uf2.followingId
      WHERE uf1.followerId = ? AND uf2.followerId = ?
    `).bind(currentUserId, targetUserId).first();

    return c.json({
      mutual: mutual.results || [],
      total: (countResult?.total as number) || 0,
    });
  } catch (error) {
    console.error('Error fetching mutual connections:', error);
    return c.json({ error: 'Failed to fetch mutual connections' }, 500);
  }
});

// ============================================================================
// Social Stats for User Profile
// ============================================================================

social.get('/stats/:userId', optionalAuth, async (c) => {
  const db = c.env.DB;
  const targetUserId = c.req.param('userId');
  const currentUserId = c.get('user')?.id;

  try {
    // Get follower count
    const followersResult = await db.prepare(`
      SELECT COUNT(*) as count FROM user_follows WHERE followingId = ?
    `).bind(targetUserId).first();

    // Get following count
    const followingResult = await db.prepare(`
      SELECT COUNT(*) as count FROM user_follows WHERE followerId = ?
    `).bind(targetUserId).first();

    // Get connections count
    const connectionsResult = await db.prepare(`
      SELECT COUNT(*) as count FROM user_connections
      WHERE (userId = ? OR connectedUserId = ?) AND status = 'accepted'
    `).bind(targetUserId, targetUserId).first();

    // Get posts count
    const postsResult = await db.prepare(`
      SELECT COUNT(*) as count FROM wall_posts WHERE authorId = ? AND isDeleted = 0
    `).bind(targetUserId).first();

    // Check relationship with current user
    let isFollowing = false;
    let isFollowedBy = false;
    let connectionStatus = null;
    let isBlocked = false;

    if (currentUserId && currentUserId !== targetUserId) {
      const followCheck = await db.prepare(`
        SELECT followerId FROM user_follows
        WHERE followerId = ? AND followingId = ?
      `).bind(currentUserId, targetUserId).first();
      isFollowing = !!followCheck;

      const followedByCheck = await db.prepare(`
        SELECT followerId FROM user_follows
        WHERE followerId = ? AND followingId = ?
      `).bind(targetUserId, currentUserId).first();
      isFollowedBy = !!followedByCheck;

      const connectionCheck = await db.prepare(`
        SELECT status FROM user_connections
        WHERE (userId = ? AND connectedUserId = ?) OR (userId = ? AND connectedUserId = ?)
      `).bind(currentUserId, targetUserId, targetUserId, currentUserId).first();
      connectionStatus = connectionCheck?.status || null;

      const blockCheck = await db.prepare(`
        SELECT id FROM user_blocks WHERE blockerId = ? AND blockedId = ?
      `).bind(currentUserId, targetUserId).first();
      isBlocked = !!blockCheck;
    }

    return c.json({
      followersCount: (followersResult?.count as number) || 0,
      followingCount: (followingResult?.count as number) || 0,
      connectionsCount: (connectionsResult?.count as number) || 0,
      postsCount: (postsResult?.count as number) || 0,
      isFollowing,
      isFollowedBy,
      connectionStatus,
      isBlocked,
    });
  } catch (error) {
    console.error('Error fetching social stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

export default social;
