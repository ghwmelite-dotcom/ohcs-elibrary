import { Hono } from 'hono';
import type { Env } from '../index';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const wall = new Hono<{ Bindings: Env }>();

// ============================================================================
// Feed Endpoints
// ============================================================================

// Get personalized feed (balanced algorithm)
wall.get('/feed', optionalAuth, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const { type = 'forYou', page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = '';
    const params: any[] = [];

    if (type === 'following' && userId) {
      // Posts from users I follow
      query = `
        SELECT
          wp.*,
          u.displayName as authorName, u.avatar as authorAvatar, u.jobTitle as authorTitle,
          m.name as authorMda,
          CASE WHEN wpl.postId IS NOT NULL THEN 1 ELSE 0 END as isLiked,
          CASE WHEN wb.postId IS NOT NULL THEN 1 ELSE 0 END as isBookmarked
        FROM wall_posts wp
        JOIN users u ON wp.authorId = u.id
        LEFT JOIN mdas m ON u.mdaId = m.id
        LEFT JOIN wall_post_likes wpl ON wp.id = wpl.postId AND wpl.userId = ?
        LEFT JOIN wall_bookmarks wb ON wp.id = wb.postId AND wb.userId = ?
        WHERE wp.isDeleted = 0
        AND wp.authorId IN (SELECT followingId FROM user_follows WHERE followerId = ?)
        AND wp.authorId NOT IN (SELECT blockedId FROM user_blocks WHERE blockerId = ?)
        AND (wp.visibility = 'public' OR wp.visibility = 'network')
        ORDER BY wp.createdAt DESC
        LIMIT ? OFFSET ?
      `;
      params.push(userId, userId, userId, userId, parseInt(limit), offset);
    } else if (type === 'mda' && userId) {
      // Posts from same MDA
      const currentUser = await db.prepare(`SELECT mdaId FROM users WHERE id = ?`).bind(userId).first();
      query = `
        SELECT
          wp.*,
          u.displayName as authorName, u.avatar as authorAvatar, u.jobTitle as authorTitle,
          m.name as authorMda,
          CASE WHEN wpl.postId IS NOT NULL THEN 1 ELSE 0 END as isLiked,
          CASE WHEN wb.postId IS NOT NULL THEN 1 ELSE 0 END as isBookmarked
        FROM wall_posts wp
        JOIN users u ON wp.authorId = u.id
        LEFT JOIN mdas m ON u.mdaId = m.id
        LEFT JOIN wall_post_likes wpl ON wp.id = wpl.postId AND wpl.userId = ?
        LEFT JOIN wall_bookmarks wb ON wp.id = wb.postId AND wb.userId = ?
        WHERE wp.isDeleted = 0
        AND u.mdaId = ?
        AND wp.authorId NOT IN (SELECT blockedId FROM user_blocks WHERE blockerId = ?)
        AND (wp.visibility IN ('public', 'network', 'mda'))
        ORDER BY wp.createdAt DESC
        LIMIT ? OFFSET ?
      `;
      params.push(userId, userId, currentUser?.mdaId || '', userId, parseInt(limit), offset);
    } else if (type === 'trending') {
      // Trending posts (high engagement recently)
      query = `
        SELECT
          wp.*,
          u.displayName as authorName, u.avatar as authorAvatar, u.jobTitle as authorTitle,
          m.name as authorMda,
          CASE WHEN wpl.postId IS NOT NULL THEN 1 ELSE 0 END as isLiked,
          CASE WHEN wb.postId IS NOT NULL THEN 1 ELSE 0 END as isBookmarked,
          (wp.likesCount + wp.commentsCount * 2 + wp.sharesCount * 3) as engagementScore
        FROM wall_posts wp
        JOIN users u ON wp.authorId = u.id
        LEFT JOIN mdas m ON u.mdaId = m.id
        LEFT JOIN wall_post_likes wpl ON wp.id = wpl.postId AND wpl.userId = ?
        LEFT JOIN wall_bookmarks wb ON wp.id = wb.postId AND wb.userId = ?
        WHERE wp.isDeleted = 0
        AND wp.visibility = 'public'
        AND wp.createdAt >= datetime('now', '-7 days')
        ${userId ? `AND wp.authorId NOT IN (SELECT blockedId FROM user_blocks WHERE blockerId = ?)` : ''}
        ORDER BY engagementScore DESC, wp.createdAt DESC
        LIMIT ? OFFSET ?
      `;
      params.push(userId || '', userId || '');
      if (userId) params.push(userId);
      params.push(parseInt(limit), offset);
    } else {
      // "For You" - balanced algorithm
      // Mix of: network relevance, engagement, and recency
      query = `
        SELECT
          wp.*,
          u.displayName as authorName, u.avatar as authorAvatar, u.jobTitle as authorTitle,
          m.name as authorMda,
          CASE WHEN wpl.postId IS NOT NULL THEN 1 ELSE 0 END as isLiked,
          CASE WHEN wb.postId IS NOT NULL THEN 1 ELSE 0 END as isBookmarked,
          CASE WHEN uf.followingId IS NOT NULL THEN 30 ELSE 0 END as networkScore,
          (wp.likesCount + wp.commentsCount * 2) as engagementScore,
          CAST((julianday('now') - julianday(wp.createdAt)) * -10 AS INTEGER) as recencyScore
        FROM wall_posts wp
        JOIN users u ON wp.authorId = u.id
        LEFT JOIN mdas m ON u.mdaId = m.id
        LEFT JOIN wall_post_likes wpl ON wp.id = wpl.postId AND wpl.userId = ?
        LEFT JOIN wall_bookmarks wb ON wp.id = wb.postId AND wb.userId = ?
        LEFT JOIN user_follows uf ON uf.followingId = wp.authorId AND uf.followerId = ?
        WHERE wp.isDeleted = 0
        AND wp.visibility = 'public'
        ${userId ? `AND wp.authorId NOT IN (SELECT blockedId FROM user_blocks WHERE blockerId = ?)` : ''}
        ORDER BY (networkScore + engagementScore + recencyScore) DESC
        LIMIT ? OFFSET ?
      `;
      params.push(userId || '', userId || '', userId || '');
      if (userId) params.push(userId);
      params.push(parseInt(limit), offset);
    }

    const posts = await db.prepare(query).bind(...params).all();

    // Get reactions for each post
    const postsWithReactions = await Promise.all(
      (posts.results || []).map(async (post: any) => {
        const reactions = await db.prepare(`
          SELECT emoji, COUNT(*) as count,
            GROUP_CONCAT(userId) as userIds
          FROM wall_post_reactions
          WHERE postId = ?
          GROUP BY emoji
        `).bind(post.id).all();

        return {
          ...post,
          isLiked: !!post.isLiked,
          isBookmarked: !!post.isBookmarked,
          attachments: post.attachments ? JSON.parse(post.attachments) : [],
          mentionedUserIds: post.mentionedUserIds ? JSON.parse(post.mentionedUserIds) : [],
          reactions: (reactions.results || []).map((r: any) => ({
            emoji: r.emoji,
            count: r.count,
            users: r.userIds ? r.userIds.split(',') : [],
            hasReacted: userId ? r.userIds?.includes(userId) : false,
          })),
        };
      })
    );

    return c.json({
      posts: postsWithReactions,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: postsWithReactions.length === parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return c.json({ error: 'Failed to fetch feed' }, 500);
  }
});

// Get user's posts
wall.get('/users/:userId/posts', optionalAuth, async (c) => {
  const db = c.env.DB;
  const targetUserId = c.req.param('userId');
  const currentUserId = c.get('user')?.id;
  const { page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Check visibility permissions
    let visibilityFilter = `wp.visibility = 'public'`;
    if (currentUserId === targetUserId) {
      visibilityFilter = '1=1'; // Show all own posts
    } else if (currentUserId) {
      // Check if following
      const isFollowing = await db.prepare(`
        SELECT 1 FROM user_follows WHERE followerId = ? AND followingId = ?
      `).bind(currentUserId, targetUserId).first();

      if (isFollowing) {
        visibilityFilter = `wp.visibility IN ('public', 'network')`;
      }
    }

    const posts = await db.prepare(`
      SELECT
        wp.*,
        u.displayName as authorName, u.avatar as authorAvatar, u.jobTitle as authorTitle,
        CASE WHEN wpl.postId IS NOT NULL THEN 1 ELSE 0 END as isLiked,
        CASE WHEN wb.postId IS NOT NULL THEN 1 ELSE 0 END as isBookmarked
      FROM wall_posts wp
      JOIN users u ON wp.authorId = u.id
      LEFT JOIN wall_post_likes wpl ON wp.id = wpl.postId AND wpl.userId = ?
      LEFT JOIN wall_bookmarks wb ON wp.id = wb.postId AND wb.userId = ?
      WHERE wp.authorId = ? AND wp.isDeleted = 0 AND ${visibilityFilter}
      ORDER BY wp.isPinned DESC, wp.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(currentUserId || '', currentUserId || '', targetUserId, parseInt(limit), offset).all();

    return c.json({
      posts: (posts.results || []).map((p: any) => ({
        ...p,
        isLiked: !!p.isLiked,
        isBookmarked: !!p.isBookmarked,
        attachments: p.attachments ? JSON.parse(p.attachments) : [],
        mentionedUserIds: p.mentionedUserIds ? JSON.parse(p.mentionedUserIds) : [],
      })),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// ============================================================================
// Post CRUD
// ============================================================================

// Get single post
wall.get('/posts/:id', optionalAuth, async (c) => {
  const db = c.env.DB;
  const postId = c.req.param('id');
  const userId = c.get('user')?.id;

  try {
    const post = await db.prepare(`
      SELECT
        wp.*,
        u.displayName as authorName, u.avatar as authorAvatar, u.jobTitle as authorTitle,
        m.name as authorMda,
        CASE WHEN wpl.postId IS NOT NULL THEN 1 ELSE 0 END as isLiked,
        CASE WHEN wb.postId IS NOT NULL THEN 1 ELSE 0 END as isBookmarked
      FROM wall_posts wp
      JOIN users u ON wp.authorId = u.id
      LEFT JOIN mdas m ON u.mdaId = m.id
      LEFT JOIN wall_post_likes wpl ON wp.id = wpl.postId AND wpl.userId = ?
      LEFT JOIN wall_bookmarks wb ON wp.id = wb.postId AND wb.userId = ?
      WHERE wp.id = ? AND wp.isDeleted = 0
    `).bind(userId || '', userId || '', postId).first();

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    // Get reactions
    const reactions = await db.prepare(`
      SELECT emoji, COUNT(*) as count, GROUP_CONCAT(userId) as userIds
      FROM wall_post_reactions WHERE postId = ? GROUP BY emoji
    `).bind(postId).all();

    // Get comments
    const comments = await db.prepare(`
      SELECT
        wc.*,
        u.displayName as authorName, u.avatar as authorAvatar,
        CASE WHEN wcl.commentId IS NOT NULL THEN 1 ELSE 0 END as isLiked
      FROM wall_comments wc
      JOIN users u ON wc.authorId = u.id
      LEFT JOIN wall_comment_likes wcl ON wc.id = wcl.commentId AND wcl.userId = ?
      WHERE wc.postId = ? AND wc.isDeleted = 0 AND wc.parentId IS NULL
      ORDER BY wc.createdAt ASC
    `).bind(userId || '', postId).all();

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments.results || []).map(async (comment: any) => {
        const replies = await db.prepare(`
          SELECT
            wc.*,
            u.displayName as authorName, u.avatar as authorAvatar,
            CASE WHEN wcl.commentId IS NOT NULL THEN 1 ELSE 0 END as isLiked
          FROM wall_comments wc
          JOIN users u ON wc.authorId = u.id
          LEFT JOIN wall_comment_likes wcl ON wc.id = wcl.commentId AND wcl.userId = ?
          WHERE wc.parentId = ? AND wc.isDeleted = 0
          ORDER BY wc.createdAt ASC
        `).bind(userId || '', comment.id).all();

        return {
          ...comment,
          isLiked: !!comment.isLiked,
          replies: (replies.results || []).map((r: any) => ({ ...r, isLiked: !!r.isLiked })),
        };
      })
    );

    return c.json({
      post: {
        ...post,
        isLiked: !!post.isLiked,
        isBookmarked: !!post.isBookmarked,
        attachments: post.attachments ? JSON.parse(post.attachments as string) : [],
        mentionedUserIds: post.mentionedUserIds ? JSON.parse(post.mentionedUserIds as string) : [],
        reactions: (reactions.results || []).map((r: any) => ({
          emoji: r.emoji,
          count: r.count,
          users: r.userIds ? r.userIds.split(',') : [],
          hasReacted: userId ? r.userIds?.includes(userId) : false,
        })),
        comments: commentsWithReplies,
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return c.json({ error: 'Failed to fetch post' }, 500);
  }
});

// Create post
wall.post('/posts', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const body = await c.req.json();
  const {
    content,
    visibility = 'public',
    customListId,
    postType = 'status',
    attachments = [],
    mentionedUserIds = [],
    sharedPostId,
    sharedDocumentId,
  } = body;

  if (!content?.trim()) {
    return c.json({ error: 'Content is required' }, 400);
  }

  try {
    const id = crypto.randomUUID();

    await db.prepare(`
      INSERT INTO wall_posts (
        id, authorId, content, visibility, customListId, postType,
        attachments, mentionedUserIds, sharedPostId, sharedDocumentId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId,
      content,
      visibility,
      customListId || null,
      postType,
      JSON.stringify(attachments),
      JSON.stringify(mentionedUserIds),
      sharedPostId || null,
      sharedDocumentId || null
    ).run();

    // Award XP for creating post
    const xpId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId)
      VALUES (?, ?, 15, 'created_wall_post', 'wall_post', ?)
    `).bind(xpId, userId, id).run();

    // Create notifications for mentioned users
    if (mentionedUserIds.length > 0) {
      const currentUser = await db.prepare(`
        SELECT displayName, avatar FROM users WHERE id = ?
      `).bind(userId).first();

      for (const mentionedId of mentionedUserIds) {
        if (mentionedId !== userId) {
          const notifId = crypto.randomUUID();
          await db.prepare(`
            INSERT INTO notifications (id, userId, type, title, message, actorId, actorName, actorAvatar, link, resourceId, resourceType, priority)
            VALUES (?, ?, 'wall_mention', ?, ?, ?, ?, ?, ?, ?, 'wall_post', 'normal')
          `).bind(
            notifId,
            mentionedId,
            'You were mentioned',
            `${currentUser?.displayName || 'Someone'} mentioned you in a post`,
            userId,
            currentUser?.displayName,
            currentUser?.avatar,
            `/wall/post/${id}`,
            id
          ).run();
        }
      }
    }

    // Get created post
    const post = await db.prepare(`
      SELECT wp.*, u.displayName as authorName, u.avatar as authorAvatar
      FROM wall_posts wp
      JOIN users u ON wp.authorId = u.id
      WHERE wp.id = ?
    `).bind(id).first();

    return c.json({
      post: {
        ...post,
        attachments: JSON.parse((post?.attachments as string) || '[]'),
        mentionedUserIds: JSON.parse((post?.mentionedUserIds as string) || '[]'),
        reactions: [],
      },
    }, 201);
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

// Edit post
wall.put('/posts/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const postId = c.req.param('id');
  const body = await c.req.json();
  const { content } = body;

  if (!content?.trim()) {
    return c.json({ error: 'Content is required' }, 400);
  }

  try {
    const post = await db.prepare(`SELECT authorId FROM wall_posts WHERE id = ?`).bind(postId).first();

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    if (post.authorId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    await db.prepare(`
      UPDATE wall_posts SET content = ?, isEdited = 1, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(content.trim(), postId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error editing post:', error);
    return c.json({ error: 'Failed to edit post' }, 500);
  }
});

// Delete post
wall.delete('/posts/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const postId = c.req.param('id');

  try {
    const post = await db.prepare(`SELECT authorId FROM wall_posts WHERE id = ?`).bind(postId).first();

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    if (post.authorId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    await db.prepare(`
      UPDATE wall_posts SET isDeleted = 1, updatedAt = datetime('now') WHERE id = ?
    `).bind(postId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// ============================================================================
// Likes & Reactions
// ============================================================================

// Like post
wall.post('/posts/:id/like', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const postId = c.req.param('id');

  try {
    const existing = await db.prepare(`
      SELECT 1 FROM wall_post_likes WHERE postId = ? AND userId = ?
    `).bind(postId, userId).first();

    if (existing) {
      return c.json({ error: 'Already liked' }, 400);
    }

    await db.prepare(`
      INSERT INTO wall_post_likes (postId, userId) VALUES (?, ?)
    `).bind(postId, userId).run();

    await db.prepare(`
      UPDATE wall_posts SET likesCount = likesCount + 1 WHERE id = ?
    `).bind(postId).run();

    // Create notification
    const post = await db.prepare(`SELECT authorId FROM wall_posts WHERE id = ?`).bind(postId).first();
    if (post && post.authorId !== userId) {
      const currentUser = await db.prepare(`SELECT displayName, avatar FROM users WHERE id = ?`).bind(userId).first();
      const notifId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO notifications (id, userId, type, title, message, actorId, actorName, actorAvatar, link, resourceId, resourceType, priority)
        VALUES (?, ?, 'wall_like', ?, ?, ?, ?, ?, ?, ?, 'wall_post', 'low')
      `).bind(
        notifId,
        post.authorId,
        'Post liked',
        `${currentUser?.displayName || 'Someone'} liked your post`,
        userId,
        currentUser?.displayName,
        currentUser?.avatar,
        `/wall/post/${postId}`,
        postId
      ).run();

      // Award XP for getting liked
      const xpId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId)
        VALUES (?, ?, 2, 'post_liked', 'wall_post', ?)
      `).bind(xpId, post.authorId, postId).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error liking post:', error);
    return c.json({ error: 'Failed to like post' }, 500);
  }
});

// Unlike post
wall.delete('/posts/:id/like', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const postId = c.req.param('id');

  try {
    const result = await db.prepare(`
      DELETE FROM wall_post_likes WHERE postId = ? AND userId = ?
    `).bind(postId, userId).run();

    if (result.meta.changes > 0) {
      await db.prepare(`
        UPDATE wall_posts SET likesCount = MAX(0, likesCount - 1) WHERE id = ?
      `).bind(postId).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error unliking post:', error);
    return c.json({ error: 'Failed to unlike post' }, 500);
  }
});

// Toggle reaction
wall.post('/posts/:id/reaction', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const postId = c.req.param('id');
  const body = await c.req.json();
  const { emoji } = body;

  if (!emoji) {
    return c.json({ error: 'Emoji is required' }, 400);
  }

  try {
    const existing = await db.prepare(`
      SELECT id FROM wall_post_reactions WHERE postId = ? AND userId = ? AND emoji = ?
    `).bind(postId, userId, emoji).first();

    if (existing) {
      // Remove reaction
      await db.prepare(`DELETE FROM wall_post_reactions WHERE id = ?`).bind(existing.id).run();
      return c.json({ success: true, action: 'removed' });
    } else {
      // Add reaction
      const id = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO wall_post_reactions (id, postId, userId, emoji) VALUES (?, ?, ?, ?)
      `).bind(id, postId, userId, emoji).run();
      return c.json({ success: true, action: 'added' });
    }
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return c.json({ error: 'Failed to toggle reaction' }, 500);
  }
});

// ============================================================================
// Comments
// ============================================================================

// Get comments for post
wall.get('/posts/:id/comments', optionalAuth, async (c) => {
  const db = c.env.DB;
  const postId = c.req.param('id');
  const userId = c.get('user')?.id;

  try {
    const comments = await db.prepare(`
      SELECT
        wc.*,
        u.displayName as authorName, u.avatar as authorAvatar,
        CASE WHEN wcl.commentId IS NOT NULL THEN 1 ELSE 0 END as isLiked
      FROM wall_comments wc
      JOIN users u ON wc.authorId = u.id
      LEFT JOIN wall_comment_likes wcl ON wc.id = wcl.commentId AND wcl.userId = ?
      WHERE wc.postId = ? AND wc.isDeleted = 0 AND wc.parentId IS NULL
      ORDER BY wc.createdAt ASC
    `).bind(userId || '', postId).all();

    // Get replies
    const commentsWithReplies = await Promise.all(
      (comments.results || []).map(async (comment: any) => {
        const replies = await db.prepare(`
          SELECT
            wc.*,
            u.displayName as authorName, u.avatar as authorAvatar,
            CASE WHEN wcl.commentId IS NOT NULL THEN 1 ELSE 0 END as isLiked
          FROM wall_comments wc
          JOIN users u ON wc.authorId = u.id
          LEFT JOIN wall_comment_likes wcl ON wc.id = wcl.commentId AND wcl.userId = ?
          WHERE wc.parentId = ? AND wc.isDeleted = 0
          ORDER BY wc.createdAt ASC
        `).bind(userId || '', comment.id).all();

        return {
          ...comment,
          isLiked: !!comment.isLiked,
          replies: (replies.results || []).map((r: any) => ({ ...r, isLiked: !!r.isLiked })),
        };
      })
    );

    return c.json({ comments: commentsWithReplies });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return c.json({ error: 'Failed to fetch comments' }, 500);
  }
});

// Add comment
wall.post('/posts/:id/comments', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const postId = c.req.param('id');
  const body = await c.req.json();
  const { content, parentId } = body;

  if (!content?.trim()) {
    return c.json({ error: 'Content is required' }, 400);
  }

  try {
    const id = crypto.randomUUID();

    await db.prepare(`
      INSERT INTO wall_comments (id, postId, authorId, parentId, content)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, postId, userId, parentId || null, content).run();

    // Update post comment count
    await db.prepare(`
      UPDATE wall_posts SET commentsCount = commentsCount + 1 WHERE id = ?
    `).bind(postId).run();

    // Create notification
    const post = await db.prepare(`SELECT authorId FROM wall_posts WHERE id = ?`).bind(postId).first();
    if (post && post.authorId !== userId) {
      const currentUser = await db.prepare(`SELECT displayName, avatar FROM users WHERE id = ?`).bind(userId).first();
      const notifId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO notifications (id, userId, type, title, message, actorId, actorName, actorAvatar, link, resourceId, resourceType, priority)
        VALUES (?, ?, 'wall_comment', ?, ?, ?, ?, ?, ?, ?, 'wall_post', 'normal')
      `).bind(
        notifId,
        post.authorId,
        'New comment',
        `${currentUser?.displayName || 'Someone'} commented on your post`,
        userId,
        currentUser?.displayName,
        currentUser?.avatar,
        `/wall/post/${postId}`,
        postId
      ).run();
    }

    // Award XP
    const xpId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId)
      VALUES (?, ?, 5, 'wall_comment', 'wall_comment', ?)
    `).bind(xpId, userId, id).run();

    // Get created comment
    const comment = await db.prepare(`
      SELECT wc.*, u.displayName as authorName, u.avatar as authorAvatar
      FROM wall_comments wc
      JOIN users u ON wc.authorId = u.id
      WHERE wc.id = ?
    `).bind(id).first();

    return c.json({ comment: { ...comment, isLiked: false, replies: [] } }, 201);
  } catch (error) {
    console.error('Error adding comment:', error);
    return c.json({ error: 'Failed to add comment' }, 500);
  }
});

// Edit comment
wall.put('/comments/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const commentId = c.req.param('id');
  const body = await c.req.json();
  const { content } = body;

  if (!content?.trim()) {
    return c.json({ error: 'Content is required' }, 400);
  }

  try {
    const comment = await db.prepare(`SELECT authorId FROM wall_comments WHERE id = ?`).bind(commentId).first();

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    if (comment.authorId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    await db.prepare(`
      UPDATE wall_comments SET content = ?, isEdited = 1, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(content.trim(), commentId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error editing comment:', error);
    return c.json({ error: 'Failed to edit comment' }, 500);
  }
});

// Delete comment
wall.delete('/comments/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const commentId = c.req.param('id');

  try {
    const comment = await db.prepare(`SELECT authorId, postId FROM wall_comments WHERE id = ?`).bind(commentId).first();

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    if (comment.authorId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    await db.prepare(`UPDATE wall_comments SET isDeleted = 1 WHERE id = ?`).bind(commentId).run();

    // Update post comment count
    await db.prepare(`
      UPDATE wall_posts SET commentsCount = MAX(0, commentsCount - 1) WHERE id = ?
    `).bind(comment.postId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return c.json({ error: 'Failed to delete comment' }, 500);
  }
});

// Like comment
wall.post('/comments/:id/like', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const commentId = c.req.param('id');

  try {
    const existing = await db.prepare(`
      SELECT 1 FROM wall_comment_likes WHERE commentId = ? AND userId = ?
    `).bind(commentId, userId).first();

    if (existing) {
      // Unlike
      await db.prepare(`DELETE FROM wall_comment_likes WHERE commentId = ? AND userId = ?`).bind(commentId, userId).run();
      await db.prepare(`UPDATE wall_comments SET likesCount = MAX(0, likesCount - 1) WHERE id = ?`).bind(commentId).run();
      return c.json({ success: true, action: 'unliked' });
    } else {
      // Like
      await db.prepare(`INSERT INTO wall_comment_likes (commentId, userId) VALUES (?, ?)`).bind(commentId, userId).run();
      await db.prepare(`UPDATE wall_comments SET likesCount = likesCount + 1 WHERE id = ?`).bind(commentId).run();
      return c.json({ success: true, action: 'liked' });
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return c.json({ error: 'Failed to toggle like' }, 500);
  }
});

// ============================================================================
// Bookmarks
// ============================================================================

// Get bookmarks
wall.get('/bookmarks', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const { page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const bookmarks = await db.prepare(`
      SELECT
        wp.*,
        u.displayName as authorName, u.avatar as authorAvatar,
        wb.createdAt as bookmarkedAt,
        1 as isBookmarked,
        CASE WHEN wpl.postId IS NOT NULL THEN 1 ELSE 0 END as isLiked
      FROM wall_bookmarks wb
      JOIN wall_posts wp ON wb.postId = wp.id
      JOIN users u ON wp.authorId = u.id
      LEFT JOIN wall_post_likes wpl ON wp.id = wpl.postId AND wpl.userId = ?
      WHERE wb.userId = ? AND wp.isDeleted = 0
      ORDER BY wb.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(userId, userId, parseInt(limit), offset).all();

    return c.json({
      bookmarks: (bookmarks.results || []).map((b: any) => ({
        ...b,
        isLiked: !!b.isLiked,
        isBookmarked: true,
        attachments: b.attachments ? JSON.parse(b.attachments) : [],
      })),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return c.json({ error: 'Failed to fetch bookmarks' }, 500);
  }
});

// Bookmark post
wall.post('/posts/:id/bookmark', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const postId = c.req.param('id');

  try {
    const existing = await db.prepare(`
      SELECT 1 FROM wall_bookmarks WHERE postId = ? AND userId = ?
    `).bind(postId, userId).first();

    if (existing) {
      return c.json({ error: 'Already bookmarked' }, 400);
    }

    await db.prepare(`INSERT INTO wall_bookmarks (postId, userId) VALUES (?, ?)`).bind(postId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    return c.json({ error: 'Failed to bookmark post' }, 500);
  }
});

// Remove bookmark
wall.delete('/posts/:id/bookmark', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const postId = c.req.param('id');

  try {
    await db.prepare(`DELETE FROM wall_bookmarks WHERE postId = ? AND userId = ?`).bind(postId, userId).run();
    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return c.json({ error: 'Failed to remove bookmark' }, 500);
  }
});

// ============================================================================
// Share/Repost
// ============================================================================

wall.post('/posts/:id/share', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const postId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { comment, visibility = 'public' } = body;

  try {
    const originalPost = await db.prepare(`SELECT * FROM wall_posts WHERE id = ?`).bind(postId).first();

    if (!originalPost) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO wall_posts (id, authorId, content, visibility, postType, sharedPostId)
      VALUES (?, ?, ?, ?, 'share', ?)
    `).bind(id, userId, comment || '', visibility, postId).run();

    // Update original post share count
    await db.prepare(`UPDATE wall_posts SET sharesCount = sharesCount + 1 WHERE id = ?`).bind(postId).run();

    // Notify original author
    if (originalPost.authorId !== userId) {
      const currentUser = await db.prepare(`SELECT displayName, avatar FROM users WHERE id = ?`).bind(userId).first();
      const notifId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO notifications (id, userId, type, title, message, actorId, actorName, actorAvatar, link, resourceId, resourceType, priority)
        VALUES (?, ?, 'wall_share', ?, ?, ?, ?, ?, ?, ?, 'wall_post', 'normal')
      `).bind(
        notifId,
        originalPost.authorId,
        'Post shared',
        `${currentUser?.displayName || 'Someone'} shared your post`,
        userId,
        currentUser?.displayName,
        currentUser?.avatar,
        `/wall/post/${id}`,
        postId
      ).run();
    }

    return c.json({ success: true, postId: id }, 201);
  } catch (error) {
    console.error('Error sharing post:', error);
    return c.json({ error: 'Failed to share post' }, 500);
  }
});

// ============================================================================
// Audience Lists
// ============================================================================

// Get user's audience lists
wall.get('/audience-lists', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;

  try {
    const lists = await db.prepare(`
      SELECT * FROM audience_lists WHERE userId = ? ORDER BY name ASC
    `).bind(userId).all();

    return c.json({ lists: lists.results || [] });
  } catch (error) {
    console.error('Error fetching audience lists:', error);
    return c.json({ error: 'Failed to fetch lists' }, 500);
  }
});

// Create audience list
wall.post('/audience-lists', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const body = await c.req.json();
  const { name, listType = 'custom' } = body;

  if (!name?.trim()) {
    return c.json({ error: 'Name is required' }, 400);
  }

  try {
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO audience_lists (id, userId, name, listType) VALUES (?, ?, ?, ?)
    `).bind(id, userId, name, listType).run();

    return c.json({ list: { id, userId, name, listType, memberCount: 0 } }, 201);
  } catch (error) {
    console.error('Error creating audience list:', error);
    return c.json({ error: 'Failed to create list' }, 500);
  }
});

// Update audience list
wall.put('/audience-lists/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const listId = c.req.param('id');
  const body = await c.req.json();
  const { name } = body;

  try {
    const list = await db.prepare(`SELECT userId FROM audience_lists WHERE id = ?`).bind(listId).first();

    if (!list || list.userId !== userId) {
      return c.json({ error: 'List not found' }, 404);
    }

    await db.prepare(`
      UPDATE audience_lists SET name = ?, updatedAt = datetime('now') WHERE id = ?
    `).bind(name, listId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating audience list:', error);
    return c.json({ error: 'Failed to update list' }, 500);
  }
});

// Delete audience list
wall.delete('/audience-lists/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const listId = c.req.param('id');

  try {
    const result = await db.prepare(`
      DELETE FROM audience_lists WHERE id = ? AND userId = ?
    `).bind(listId, userId).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'List not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting audience list:', error);
    return c.json({ error: 'Failed to delete list' }, 500);
  }
});

// Get list members
wall.get('/audience-lists/:id/members', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const listId = c.req.param('id');

  try {
    const list = await db.prepare(`SELECT userId FROM audience_lists WHERE id = ?`).bind(listId).first();

    if (!list || list.userId !== userId) {
      return c.json({ error: 'List not found' }, 404);
    }

    const members = await db.prepare(`
      SELECT u.id, u.displayName, u.avatar, alm.addedAt
      FROM audience_list_members alm
      JOIN users u ON alm.memberId = u.id
      WHERE alm.listId = ?
      ORDER BY alm.addedAt DESC
    `).bind(listId).all();

    return c.json({ members: members.results || [] });
  } catch (error) {
    console.error('Error fetching list members:', error);
    return c.json({ error: 'Failed to fetch members' }, 500);
  }
});

// Add member to list
wall.post('/audience-lists/:id/members', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const listId = c.req.param('id');
  const body = await c.req.json();
  const { memberId } = body;

  try {
    const list = await db.prepare(`SELECT userId FROM audience_lists WHERE id = ?`).bind(listId).first();

    if (!list || list.userId !== userId) {
      return c.json({ error: 'List not found' }, 404);
    }

    await db.prepare(`
      INSERT OR IGNORE INTO audience_list_members (listId, memberId) VALUES (?, ?)
    `).bind(listId, memberId).run();

    // Update member count
    await db.prepare(`
      UPDATE audience_lists SET memberCount = (
        SELECT COUNT(*) FROM audience_list_members WHERE listId = ?
      ) WHERE id = ?
    `).bind(listId, listId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error adding member:', error);
    return c.json({ error: 'Failed to add member' }, 500);
  }
});

// Remove member from list
wall.delete('/audience-lists/:id/members/:memberId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const listId = c.req.param('id');
  const memberId = c.req.param('memberId');

  try {
    const list = await db.prepare(`SELECT userId FROM audience_lists WHERE id = ?`).bind(listId).first();

    if (!list || list.userId !== userId) {
      return c.json({ error: 'List not found' }, 404);
    }

    await db.prepare(`
      DELETE FROM audience_list_members WHERE listId = ? AND memberId = ?
    `).bind(listId, memberId).run();

    // Update member count
    await db.prepare(`
      UPDATE audience_lists SET memberCount = (
        SELECT COUNT(*) FROM audience_list_members WHERE listId = ?
      ) WHERE id = ?
    `).bind(listId, listId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// ============================================================================
// File Upload (for post attachments)
// ============================================================================

wall.post('/upload', authMiddleware, async (c) => {
  const userId = c.get('user')?.id;

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file size (10MB for images, 50MB for others)
    const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: 'File too large' }, 400);
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const fileKey = `wall/${userId}/${fileName}`;

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

export default wall;
