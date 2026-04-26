import { Hono } from 'hono';
import type { Env } from '../index';
import { authMiddleware } from '../middleware/auth';

const dm = new Hono<{ Bindings: Env }>();

// ============================================================================
// Conversations
// ============================================================================

// Get all conversations
dm.get('/conversations', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const { search } = c.req.query();

  try {
    let query = `
      SELECT
        dc.*,
        CASE
          WHEN dc.user1Id = ? THEN dc.user2Id
          ELSE dc.user1Id
        END as otherUserId,
        u.displayName, u.firstName, u.lastName, u.avatar, u.jobTitle,
        up.status as presenceStatus, up.lastSeenAt,
        (
          SELECT COUNT(*)
          FROM direct_messages dm
          WHERE dm.conversationId = dc.id
          AND dm.senderId != ?
          AND dm.isRead = 0
          AND dm.isDeleted = 0
        ) as unreadCount,
        (
          SELECT dm.content
          FROM direct_messages dm
          WHERE dm.conversationId = dc.id AND dm.isDeleted = 0
          ORDER BY dm.createdAt DESC LIMIT 1
        ) as lastMessageContent,
        (
          SELECT dm.senderId
          FROM direct_messages dm
          WHERE dm.conversationId = dc.id AND dm.isDeleted = 0
          ORDER BY dm.createdAt DESC LIMIT 1
        ) as lastMessageSenderId
      FROM dm_conversations dc
      JOIN users u ON u.id = CASE
        WHEN dc.user1Id = ? THEN dc.user2Id
        ELSE dc.user1Id
      END
      LEFT JOIN user_presence up ON up.userId = u.id
      WHERE (dc.user1Id = ? OR dc.user2Id = ?)
    `;
    const params: any[] = [userId, userId, userId, userId, userId];

    if (search) {
      query += ` AND (u.displayName LIKE ? OR u.firstName LIKE ? OR u.lastName LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY COALESCE(dc.lastMessageAt, dc.createdAt) DESC`;

    const conversations = await db.prepare(query).bind(...params).all();

    return c.json({
      conversations: (conversations.results || []).map((conv: any) => ({
        id: conv.id,
        participant: {
          id: conv.otherUserId,
          displayName: conv.displayName,
          firstName: conv.firstName,
          lastName: conv.lastName,
          avatar: conv.avatar,
          title: conv.title,
          presenceStatus: conv.presenceStatus || 'offline',
          lastSeenAt: conv.lastSeenAt,
        },
        lastMessage: conv.lastMessageContent ? {
          content: conv.lastMessageContent,
          senderId: conv.lastMessageSenderId,
          createdAt: conv.lastMessageAt,
        } : null,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount || 0,
        createdAt: conv.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

// Get or create conversation with a user
dm.get('/conversations/:userId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUserId = c.get('user')?.id;
  const targetUserId = c.req.param('userId');

  if (currentUserId === targetUserId) {
    return c.json({ error: 'Cannot message yourself' }, 400);
  }

  try {
    // Check if blocked
    const blocked = await db.prepare(`
      SELECT id FROM user_blocks
      WHERE (blockerId = ? AND blockedId = ?) OR (blockerId = ? AND blockedId = ?)
    `).bind(currentUserId, targetUserId, targetUserId, currentUserId).first();

    if (blocked) {
      return c.json({ error: 'Cannot message this user' }, 403);
    }

    // Check for existing conversation (in either direction)
    let conversation = await db.prepare(`
      SELECT * FROM dm_conversations
      WHERE (user1Id = ? AND user2Id = ?)
      OR (user1Id = ? AND user2Id = ?)
    `).bind(currentUserId, targetUserId, targetUserId, currentUserId).first();

    if (!conversation) {
      // Create new conversation
      const id = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO dm_conversations (id, user1Id, user2Id)
        VALUES (?, ?, ?)
      `).bind(id, currentUserId, targetUserId).run();

      conversation = { id, user1Id: currentUserId, user2Id: targetUserId };
    }

    // Get participant info
    const participant = await db.prepare(`
      SELECT id, displayName, firstName, lastName, avatar, title
      FROM users WHERE id = ?
    `).bind(targetUserId).first();

    // Get presence
    const presence = await db.prepare(`
      SELECT status, lastSeenAt FROM user_presence WHERE userId = ?
    `).bind(targetUserId).first();

    return c.json({
      conversation: {
        id: conversation.id,
        participant: {
          ...participant,
          presenceStatus: presence?.status || 'offline',
          lastSeenAt: presence?.lastSeenAt,
        },
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    return c.json({ error: 'Failed to get conversation' }, 500);
  }
});

// ============================================================================
// Messages
// ============================================================================

// Get messages in a conversation
dm.get('/messages/:conversationId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const conversationId = c.req.param('conversationId');
  const { page = '1', limit = '50', before } = c.req.query();
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
  const offset = (parsedPage - 1) * parsedLimit;

  try {
    // Verify user is part of conversation
    const conversation = await db.prepare(`
      SELECT * FROM dm_conversations WHERE id = ?
      AND (user1Id = ? OR user2Id = ?)
    `).bind(conversationId, userId, userId).first();

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    let query = `
      SELECT
        dm.*,
        u.displayName as senderName, u.avatar as senderAvatar
      FROM direct_messages dm
      JOIN users u ON dm.senderId = u.id
      WHERE dm.conversationId = ? AND dm.isDeleted = 0
    `;
    const params: any[] = [conversationId];

    if (before) {
      query += ` AND dm.createdAt < ?`;
      params.push(before);
    }

    query += ` ORDER BY dm.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parsedLimit, offset);

    const messages = await db.prepare(query).bind(...params).all();

    // Get reactions for each message
    const messagesWithReactions = await Promise.all(
      (messages.results || []).map(async (msg: any) => {
        const reactions = await db.prepare(`
          SELECT emoji, COUNT(*) as count, GROUP_CONCAT(userId) as userIds
          FROM dm_reactions WHERE messageId = ? GROUP BY emoji
        `).bind(msg.id).all();

        return {
          ...msg,
          attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
          reactions: (reactions.results || []).map((r: any) => ({
            emoji: r.emoji,
            count: r.count,
            users: r.userIds ? r.userIds.split(',') : [],
            hasReacted: r.userIds?.includes(userId),
          })),
        };
      })
    );

    // Reverse to get chronological order
    messagesWithReactions.reverse();

    return c.json({
      messages: messagesWithReactions,
      page: parsedPage,
      limit: parsedLimit,
      hasMore: messagesWithReactions.length === parsedLimit,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// Send message
dm.post('/messages', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const body = await c.req.json();
  const { conversationId, recipientId, content, attachments = [], replyToId } = body;

  if (!content?.trim() && attachments.length === 0) {
    return c.json({ error: 'Content or attachment is required' }, 400);
  }

  try {
    let convId = conversationId;

    // If no conversation ID, create one with recipientId
    if (!convId && recipientId) {
      // Check if blocked
      const blocked = await db.prepare(`
        SELECT id FROM user_blocks
        WHERE (blockerId = ? AND blockedId = ?) OR (blockerId = ? AND blockedId = ?)
      `).bind(userId, recipientId, recipientId, userId).first();

      if (blocked) {
        return c.json({ error: 'Cannot message this user' }, 403);
      }

      // Find or create conversation
      let conv = await db.prepare(`
        SELECT id FROM dm_conversations
        WHERE (user1Id = ? AND user2Id = ?)
        OR (user1Id = ? AND user2Id = ?)
      `).bind(userId, recipientId, recipientId, userId).first();

      if (!conv) {
        convId = crypto.randomUUID();
        await db.prepare(`
          INSERT INTO dm_conversations (id, user1Id, user2Id)
          VALUES (?, ?, ?)
        `).bind(convId, userId, recipientId).run();
      } else {
        convId = conv.id;
      }
    }

    // Verify user is part of conversation
    const conversation = await db.prepare(`
      SELECT * FROM dm_conversations WHERE id = ?
      AND (user1Id = ? OR user2Id = ?)
    `).bind(convId, userId, userId).first();

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Create message
    const messageId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO direct_messages (id, conversationId, senderId, content, attachments, replyToId)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      messageId,
      convId,
      userId,
      content || '',
      JSON.stringify(attachments),
      replyToId || null
    ).run();

    // Update conversation
    await db.prepare(`
      UPDATE dm_conversations SET lastMessageId = ?, lastMessageAt = datetime('now')
      WHERE id = ?
    `).bind(messageId, convId).run();

    // Get recipient ID and create notification
    const recipId = conversation.user1Id === userId
      ? conversation.user2Id
      : conversation.user1Id;

    const currentUser = await db.prepare(`
      SELECT displayName, avatar FROM users WHERE id = ?
    `).bind(userId).first();

    const notifId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO notifications (id, userId, type, title, message, actorId, actorName, actorAvatar, link, resourceId, resourceType, priority)
      VALUES (?, ?, 'dm_message', ?, ?, ?, ?, ?, ?, ?, 'dm_conversation', 'high')
    `).bind(
      notifId,
      recipId,
      'New message',
      `${currentUser?.displayName || 'Someone'}: ${content?.substring(0, 50) || 'Sent an attachment'}${content?.length > 50 ? '...' : ''}`,
      userId,
      currentUser?.displayName,
      currentUser?.avatar,
      `/messages/${userId}`,
      convId
    ).run();

    // Get created message
    const message = await db.prepare(`
      SELECT dm.*, u.displayName as senderName, u.avatar as senderAvatar
      FROM direct_messages dm
      JOIN users u ON dm.senderId = u.id
      WHERE dm.id = ?
    `).bind(messageId).first();

    return c.json({
      message: {
        ...message,
        attachments: JSON.parse((message?.attachments as string) || '[]'),
        reactions: [],
      },
      conversationId: convId,
    }, 201);
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Edit message
dm.put('/messages/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const messageId = c.req.param('id');
  const body = await c.req.json();
  const { content } = body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return c.json({ error: 'Message content is required' }, 400);
  }

  try {
    const message = await db.prepare(`
      SELECT senderId FROM direct_messages WHERE id = ? AND isDeleted = 0
    `).bind(messageId).first();

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    if (message.senderId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    await db.prepare(`
      UPDATE direct_messages SET content = ?, isEdited = 1, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(content.trim(), messageId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error editing message:', error);
    return c.json({ error: 'Failed to edit message' }, 500);
  }
});

// Delete message
dm.delete('/messages/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const messageId = c.req.param('id');

  try {
    const message = await db.prepare(`
      SELECT senderId FROM direct_messages WHERE id = ?
    `).bind(messageId).first();

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    if (message.senderId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    await db.prepare(`
      UPDATE direct_messages SET isDeleted = 1, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(messageId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});

// ============================================================================
// Reactions
// ============================================================================

// Toggle reaction on message
dm.post('/messages/:id/reaction', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const messageId = c.req.param('id');
  const body = await c.req.json();
  const { emoji } = body;

  if (!emoji) {
    return c.json({ error: 'Emoji is required' }, 400);
  }

  try {
    // Verify the message exists and the user is a participant in its conversation
    const messageCheck = await db.prepare(`
      SELECT dm.id
      FROM direct_messages dm
      JOIN dm_conversations dc ON dm.conversationId = dc.id
      WHERE dm.id = ? AND dm.isDeleted = 0
      AND (dc.user1Id = ? OR dc.user2Id = ?)
    `).bind(messageId, userId, userId).first();

    if (!messageCheck) {
      return c.json({ error: 'Message not found or access denied' }, 404);
    }

    const existing = await db.prepare(`
      SELECT id FROM dm_reactions WHERE messageId = ? AND userId = ? AND emoji = ?
    `).bind(messageId, userId, emoji).first();

    if (existing) {
      await db.prepare(`DELETE FROM dm_reactions WHERE id = ?`).bind(existing.id).run();
      return c.json({ success: true, action: 'removed' });
    } else {
      const id = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO dm_reactions (id, messageId, userId, emoji) VALUES (?, ?, ?, ?)
      `).bind(id, messageId, userId, emoji).run();
      return c.json({ success: true, action: 'added' });
    }
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return c.json({ error: 'Failed to toggle reaction' }, 500);
  }
});

// ============================================================================
// Read Status
// ============================================================================

// Mark message as read
dm.put('/messages/:id/read', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const messageId = c.req.param('id');

  try {
    // Only mark as read if user is recipient
    const message = await db.prepare(`
      SELECT dm.*, dc.user1Id, dc.user2Id
      FROM direct_messages dm
      JOIN dm_conversations dc ON dm.conversationId = dc.id
      WHERE dm.id = ?
    `).bind(messageId).first();

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    // Check if user is in conversation and not the sender
    const isParticipant = message.user1Id === userId || message.user2Id === userId;
    if (!isParticipant || message.senderId === userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    await db.prepare(`
      UPDATE direct_messages SET isRead = 1, readAt = datetime('now')
      WHERE id = ? AND senderId != ?
    `).bind(messageId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// Mark all messages in conversation as read
dm.put('/conversations/:id/read', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const conversationId = c.req.param('id');

  try {
    // Verify user is part of conversation
    const conversation = await db.prepare(`
      SELECT * FROM dm_conversations WHERE id = ?
      AND (user1Id = ? OR user2Id = ?)
    `).bind(conversationId, userId, userId).first();

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    await db.prepare(`
      UPDATE direct_messages
      SET isRead = 1, readAt = datetime('now')
      WHERE conversationId = ? AND senderId != ? AND isRead = 0
    `).bind(conversationId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// Get total unread count
dm.get('/unread-count', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;

  try {
    const result = await db.prepare(`
      SELECT COUNT(*) as count
      FROM direct_messages dm
      JOIN dm_conversations dc ON dm.conversationId = dc.id
      WHERE (dc.user1Id = ? OR dc.user2Id = ?)
      AND dm.senderId != ?
      AND dm.isRead = 0
      AND dm.isDeleted = 0
    `).bind(userId, userId, userId).first();

    return c.json({ unreadCount: (result?.count as number) || 0 });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return c.json({ error: 'Failed to get unread count' }, 500);
  }
});

// ============================================================================
// File Upload
// ============================================================================

dm.post('/upload', authMiddleware, async (c) => {
  const userId = c.get('user')?.id;

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file size (10MB for images, 25MB for others)
    const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: 'File too large' }, 400);
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const fileKey = `dm/${userId}/${fileName}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.DOCUMENTS.put(fileKey, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    return c.json({
      url: fileKey,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

export default dm;
