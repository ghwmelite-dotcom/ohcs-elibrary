import { Hono } from 'hono';
import type { Context, Next } from 'hono';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface Variables {
  userId?: string;
  userRole?: string;
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// Auth middleware
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
      // Token invalid
    }
  }

  await next();
}

async function requireAuth(c: AppContext, next: Next) {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
}

export const chatRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

chatRoutes.use('*', optionalAuth);

// GET /chat/rooms - Get all chat rooms
chatRoutes.get('/rooms', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;

    // Get all rooms with membership status
    const { results } = await DB.prepare(`
      SELECT
        r.*,
        CASE WHEN crm.userId IS NOT NULL THEN 1 ELSE 0 END as isJoined,
        crm.role as memberRole,
        crm.lastReadAt,
        (
          SELECT COUNT(*) FROM chat_messages cm
          WHERE cm.roomId = r.id
          AND cm.createdAt > COALESCE(crm.lastReadAt, '1970-01-01')
          AND cm.senderId != ?
        ) as unreadCount
      FROM chat_rooms r
      LEFT JOIN chat_room_members crm ON r.id = crm.roomId AND crm.userId = ?
      WHERE r.isArchived = 0
      ORDER BY r.lastMessageAt DESC NULLS LAST, r.createdAt DESC
    `).bind(userId, userId).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return c.json([]);
  }
});

// GET /chat/rooms/:id - Get single room
chatRoutes.get('/rooms/:id', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const roomId = c.req.param('id');

    const room = await DB.prepare(`
      SELECT
        r.*,
        CASE WHEN crm.userId IS NOT NULL THEN 1 ELSE 0 END as isJoined,
        crm.role as memberRole
      FROM chat_rooms r
      LEFT JOIN chat_room_members crm ON r.id = crm.roomId AND crm.userId = ?
      WHERE r.id = ?
    `).bind(userId, roomId).first();

    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    return c.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    return c.json({ error: 'Failed to fetch room' }, 500);
  }
});

// POST /chat/rooms - Create a new room
chatRoutes.post('/rooms', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const body = await c.req.json();

    const { name, description, type = 'public' } = body;

    if (!name || name.trim().length < 2) {
      return c.json({ error: 'Room name must be at least 2 characters' }, 400);
    }

    const roomId = crypto.randomUUID();

    // Create the room
    await DB.prepare(`
      INSERT INTO chat_rooms (id, name, description, type, createdById, memberCount)
      VALUES (?, ?, ?, ?, ?, 1)
    `).bind(roomId, name.trim(), description || null, type, userId).run();

    // Add creator as owner
    await DB.prepare(`
      INSERT INTO chat_room_members (roomId, userId, role)
      VALUES (?, ?, 'owner')
    `).bind(roomId, userId).run();

    const room = await DB.prepare(`
      SELECT * FROM chat_rooms WHERE id = ?
    `).bind(roomId).first();

    return c.json(room, 201);
  } catch (error) {
    console.error('Error creating room:', error);
    return c.json({ error: 'Failed to create room' }, 500);
  }
});

// POST /chat/rooms/:id/join - Join a room
chatRoutes.post('/rooms/:id/join', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const roomId = c.req.param('id');

    // Check if room exists
    const room = await DB.prepare(`
      SELECT * FROM chat_rooms WHERE id = ? AND isArchived = 0
    `).bind(roomId).first();

    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    // Check if already a member
    const existing = await DB.prepare(`
      SELECT * FROM chat_room_members WHERE roomId = ? AND userId = ?
    `).bind(roomId, userId).first();

    if (existing) {
      return c.json({ message: 'Already a member' });
    }

    // Add as member
    await DB.prepare(`
      INSERT INTO chat_room_members (roomId, userId, role)
      VALUES (?, ?, 'member')
    `).bind(roomId, userId).run();

    // Update member count
    await DB.prepare(`
      UPDATE chat_rooms SET memberCount = memberCount + 1, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(roomId).run();

    return c.json({ message: 'Joined room successfully' });
  } catch (error) {
    console.error('Error joining room:', error);
    return c.json({ error: 'Failed to join room' }, 500);
  }
});

// POST /chat/rooms/:id/leave - Leave a room
chatRoutes.post('/rooms/:id/leave', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const roomId = c.req.param('id');

    // Check membership
    const membership = await DB.prepare(`
      SELECT * FROM chat_room_members WHERE roomId = ? AND userId = ?
    `).bind(roomId, userId).first();

    if (!membership) {
      return c.json({ error: 'Not a member of this room' }, 400);
    }

    // Remove from room
    await DB.prepare(`
      DELETE FROM chat_room_members WHERE roomId = ? AND userId = ?
    `).bind(roomId, userId).run();

    // Update member count
    await DB.prepare(`
      UPDATE chat_rooms SET memberCount = MAX(0, memberCount - 1), updatedAt = datetime('now')
      WHERE id = ?
    `).bind(roomId).run();

    return c.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    return c.json({ error: 'Failed to leave room' }, 500);
  }
});

// GET /chat/rooms/:id/messages - Get messages for a room
chatRoutes.get('/rooms/:id/messages', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const roomId = c.req.param('id');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const before = c.req.query('before'); // For pagination

    // Check if user is a member (for private rooms)
    const room = await DB.prepare(`
      SELECT r.*, crm.userId as isMember
      FROM chat_rooms r
      LEFT JOIN chat_room_members crm ON r.id = crm.roomId AND crm.userId = ?
      WHERE r.id = ?
    `).bind(userId, roomId).first<any>();

    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    if (room.type === 'private' && !room.isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    let query = `
      SELECT
        m.*,
        u.displayName as senderName,
        u.avatar as senderAvatar
      FROM chat_messages m
      LEFT JOIN users u ON m.senderId = u.id
      WHERE m.roomId = ? AND m.isDeleted = 0
    `;
    const params: any[] = [roomId];

    if (before) {
      query += ` AND m.createdAt < ?`;
      params.push(before);
    }

    query += ` ORDER BY m.createdAt DESC LIMIT ?`;
    params.push(limit);

    const { results } = await DB.prepare(query).bind(...params).all();

    // Get reactions for messages
    const messageIds = (results || []).map((m: any) => m.id);
    let reactions: any[] = [];

    if (messageIds.length > 0) {
      const placeholders = messageIds.map(() => '?').join(',');
      const { results: reactionResults } = await DB.prepare(`
        SELECT messageId, emoji, COUNT(*) as count,
               GROUP_CONCAT(userId) as userIds
        FROM chat_reactions
        WHERE messageId IN (${placeholders})
        GROUP BY messageId, emoji
      `).bind(...messageIds).all();
      reactions = reactionResults || [];
    }

    // Attach reactions to messages
    const messagesWithReactions = (results || []).map((msg: any) => ({
      ...msg,
      reactions: reactions
        .filter((r: any) => r.messageId === msg.id)
        .map((r: any) => ({
          emoji: r.emoji,
          count: r.count,
          users: r.userIds ? r.userIds.split(',') : [],
        })),
    }));

    // Update last read timestamp
    await DB.prepare(`
      UPDATE chat_room_members
      SET lastReadAt = datetime('now')
      WHERE roomId = ? AND userId = ?
    `).bind(roomId, userId).run();

    // Return in chronological order
    return c.json(messagesWithReactions.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json([]);
  }
});

// POST /chat/rooms/:id/messages - Send a message
chatRoutes.post('/rooms/:id/messages', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const roomId = c.req.param('id');
    const body = await c.req.json();

    const { content, type = 'text', replyToId } = body;

    if (!content || content.trim().length === 0) {
      return c.json({ error: 'Message content is required' }, 400);
    }

    // Check room exists and user can post
    const room = await DB.prepare(`
      SELECT r.*, crm.userId as isMember
      FROM chat_rooms r
      LEFT JOIN chat_room_members crm ON r.id = crm.roomId AND crm.userId = ?
      WHERE r.id = ?
    `).bind(userId, roomId).first<any>();

    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    // For public rooms, auto-join if not a member
    if (room.type === 'public' && !room.isMember) {
      await DB.prepare(`
        INSERT OR IGNORE INTO chat_room_members (roomId, userId, role)
        VALUES (?, ?, 'member')
      `).bind(roomId, userId).run();

      await DB.prepare(`
        UPDATE chat_rooms SET memberCount = memberCount + 1 WHERE id = ?
      `).bind(roomId).run();
    } else if (room.type !== 'public' && !room.isMember) {
      return c.json({ error: 'You must join this room to send messages' }, 403);
    }

    const messageId = crypto.randomUUID();

    // Insert message
    await DB.prepare(`
      INSERT INTO chat_messages (id, roomId, senderId, content, type, replyToId)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(messageId, roomId, userId, content.trim(), type, replyToId || null).run();

    // Update room's last message timestamp
    await DB.prepare(`
      UPDATE chat_rooms SET lastMessageAt = datetime('now'), updatedAt = datetime('now')
      WHERE id = ?
    `).bind(roomId).run();

    // Get the created message with sender info
    const message = await DB.prepare(`
      SELECT
        m.*,
        u.displayName as senderName,
        u.avatar as senderAvatar
      FROM chat_messages m
      LEFT JOIN users u ON m.senderId = u.id
      WHERE m.id = ?
    `).bind(messageId).first();

    return c.json({ ...message, reactions: [] }, 201);
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// DELETE /chat/messages/:id - Delete a message
chatRoutes.delete('/messages/:id', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const messageId = c.req.param('id');

    // Check if user owns the message
    const message = await DB.prepare(`
      SELECT * FROM chat_messages WHERE id = ? AND senderId = ?
    `).bind(messageId, userId).first();

    if (!message) {
      return c.json({ error: 'Message not found or unauthorized' }, 404);
    }

    // Soft delete
    await DB.prepare(`
      UPDATE chat_messages
      SET isDeleted = 1, content = 'This message was deleted', updatedAt = datetime('now')
      WHERE id = ?
    `).bind(messageId).run();

    return c.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});

// PUT /chat/messages/:id - Edit a message
chatRoutes.put('/messages/:id', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const messageId = c.req.param('id');
    const body = await c.req.json();

    const { content } = body;

    if (!content || content.trim().length === 0) {
      return c.json({ error: 'Message content is required' }, 400);
    }

    // Check if user owns the message
    const message = await DB.prepare(`
      SELECT * FROM chat_messages WHERE id = ? AND senderId = ? AND isDeleted = 0
    `).bind(messageId, userId).first();

    if (!message) {
      return c.json({ error: 'Message not found or unauthorized' }, 404);
    }

    // Update message
    await DB.prepare(`
      UPDATE chat_messages
      SET content = ?, isEdited = 1, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(content.trim(), messageId).run();

    return c.json({ message: 'Message updated' });
  } catch (error) {
    console.error('Error editing message:', error);
    return c.json({ error: 'Failed to edit message' }, 500);
  }
});

// POST /chat/messages/:id/reactions - Add reaction
chatRoutes.post('/messages/:id/reactions', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const messageId = c.req.param('id');
    const body = await c.req.json();

    const { emoji } = body;

    if (!emoji) {
      return c.json({ error: 'Emoji is required' }, 400);
    }

    // Check message exists
    const message = await DB.prepare(`
      SELECT * FROM chat_messages WHERE id = ? AND isDeleted = 0
    `).bind(messageId).first();

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    // Toggle reaction (add if not exists, remove if exists)
    const existing = await DB.prepare(`
      SELECT * FROM chat_reactions WHERE messageId = ? AND userId = ? AND emoji = ?
    `).bind(messageId, userId, emoji).first();

    if (existing) {
      await DB.prepare(`
        DELETE FROM chat_reactions WHERE messageId = ? AND userId = ? AND emoji = ?
      `).bind(messageId, userId, emoji).run();
      return c.json({ action: 'removed' });
    } else {
      await DB.prepare(`
        INSERT INTO chat_reactions (messageId, userId, emoji)
        VALUES (?, ?, ?)
      `).bind(messageId, userId, emoji).run();
      return c.json({ action: 'added' });
    }
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return c.json({ error: 'Failed to update reaction' }, 500);
  }
});

// GET /chat/rooms/:id/members - Get room members
chatRoutes.get('/rooms/:id/members', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const roomId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT
        u.id,
        u.displayName,
        u.avatar,
        crm.role,
        crm.joinedAt
      FROM chat_room_members crm
      JOIN users u ON crm.userId = u.id
      WHERE crm.roomId = ?
      ORDER BY
        CASE crm.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          ELSE 3
        END,
        crm.joinedAt ASC
    `).bind(roomId).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching members:', error);
    return c.json([]);
  }
});
