import { Hono } from 'hono';
import type { Env } from '../index';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const groups = new Hono<{ Bindings: Env }>();

// Helper to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// Get group categories
groups.get('/categories', async (c) => {
  const db = c.env.DB;

  try {
    const categories = await db.prepare(`
      SELECT gc.*, COUNT(g.id) as groupCount
      FROM group_categories gc
      LEFT JOIN groups g ON g.categoryId = gc.id AND g.isArchived = 0
      GROUP BY gc.id
      ORDER BY gc.sortOrder ASC
    `).all();

    return c.json({ categories: categories.results || [] });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// Get group stats
groups.get('/stats', optionalAuth, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;

  try {
    // Get total groups count
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total FROM groups WHERE isArchived = 0
    `).first();

    // Get my groups count (if authenticated)
    let myGroupsCount = 0;
    if (userId) {
      const myResult = await db.prepare(`
        SELECT COUNT(*) as count FROM group_members WHERE userId = ? AND status = 'active'
      `).bind(userId).first();
      myGroupsCount = (myResult?.count as number) || 0;
    }

    // Get trending (groups with most recent activity)
    const trendingResult = await db.prepare(`
      SELECT COUNT(*) as count FROM groups
      WHERE isArchived = 0
      AND updatedAt >= datetime('now', '-7 days')
    `).first();

    // Get new this week
    const newThisWeekResult = await db.prepare(`
      SELECT COUNT(*) as count FROM groups
      WHERE isArchived = 0
      AND createdAt >= datetime('now', '-7 days')
    `).first();

    return c.json({
      totalGroups: (totalResult?.total as number) || 0,
      myGroups: myGroupsCount,
      trending: (trendingResult?.count as number) || 0,
      newThisWeek: (newThisWeekResult?.count as number) || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Get all groups (public, with optional auth for joined status)
groups.get('/', optionalAuth, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const { type, search, joined, category } = c.req.query();

  try {
    let query = `
      SELECT
        g.*,
        gc.name as categoryName,
        gc.icon as categoryIcon,
        GROUP_CONCAT(gt.tag) as tags
      FROM groups g
      LEFT JOIN group_tags gt ON g.id = gt.groupId
      LEFT JOIN group_categories gc ON g.categoryId = gc.id
      WHERE g.isArchived = 0
    `;
    const params: any[] = [];

    if (type) {
      query += ` AND g.type = ?`;
      params.push(type);
    }

    if (category) {
      query += ` AND g.categoryId = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (g.name LIKE ? OR g.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY g.id ORDER BY g.memberCount DESC, g.createdAt DESC`;

    const groups = await db.prepare(query).bind(...params).all();

    // Get membership status for each group if user is authenticated
    let membershipMap: Record<string, { isJoined: boolean; memberRole: string; isPendingApproval: boolean }> = {};
    if (userId) {
      const memberships = await db.prepare(`
        SELECT groupId, role, status FROM group_members WHERE userId = ?
      `).bind(userId).all();

      membershipMap = (memberships.results || []).reduce((acc: any, m: any) => {
        acc[m.groupId] = {
          isJoined: m.status === 'active',
          memberRole: m.role,
          isPendingApproval: m.status === 'pending',
        };
        return acc;
      }, {});
    }

    // Transform results - coverImage might contain a color value (starts with #)
    let results = (groups.results || []).map((g: any) => {
      const isColorValue = g.coverImage?.startsWith('#');
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        slug: g.slug,
        type: g.type,
        categoryId: g.categoryId,
        categoryName: g.categoryName,
        categoryIcon: g.categoryIcon,
        coverImage: isColorValue ? null : g.coverImage,
        coverColor: isColorValue ? g.coverImage : null,
        avatar: g.avatar,
        createdById: g.createdById,
        memberCount: g.memberCount || 0,
        postCount: g.postCount || 0,
        tags: g.tags ? g.tags.split(',') : [],
        isJoined: membershipMap[g.id]?.isJoined || false,
        memberRole: membershipMap[g.id]?.memberRole,
        isPendingApproval: membershipMap[g.id]?.isPendingApproval || false,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      };
    });

    // Filter by joined if requested
    if (joined === 'true' && userId) {
      results = results.filter((g: any) => g.isJoined);
    }

    return c.json({ groups: results });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return c.json({ error: 'Failed to fetch groups' }, 500);
  }
});

// Get single group by ID
groups.get('/:id', optionalAuth, async (c) => {
  const db = c.env.DB;
  const groupId = c.req.param('id');
  const userId = c.get('user')?.id;

  try {
    const group = await db.prepare(`
      SELECT g.*, GROUP_CONCAT(gt.tag) as tags
      FROM groups g
      LEFT JOIN group_tags gt ON g.id = gt.groupId
      WHERE g.id = ? AND g.isArchived = 0
      GROUP BY g.id
    `).bind(groupId).first();

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Get membership status
    let membership = null;
    if (userId) {
      membership = await db.prepare(`
        SELECT role, status FROM group_members WHERE groupId = ? AND userId = ?
      `).bind(groupId, userId).first();
    }

    const isColorValue = (group.coverImage as string)?.startsWith('#');
    return c.json({
      id: group.id,
      name: group.name,
      description: group.description,
      slug: group.slug,
      type: group.type,
      coverImage: isColorValue ? null : group.coverImage,
      coverColor: isColorValue ? group.coverImage : null,
      avatar: group.avatar,
      createdById: group.createdById,
      memberCount: group.memberCount || 0,
      postCount: group.postCount || 0,
      tags: group.tags ? (group.tags as string).split(',') : [],
      isJoined: membership?.status === 'active',
      memberRole: membership?.role,
      isPendingApproval: membership?.status === 'pending',
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return c.json({ error: 'Failed to fetch group' }, 500);
  }
});

// Create group (requires auth)
groups.post('/', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;
  const body = await c.req.json();
  const { name, description, type, categoryId, tags, coverColor } = body;

  if (!name) {
    return c.json({ error: 'Group name is required' }, 400);
  }

  if (!userId) {
    return c.json({ error: 'User not authenticated' }, 401);
  }

  try {
    const groupId = `grp-${Date.now().toString(36)}`;
    let slug = generateSlug(name);

    // Check if slug exists and make it unique
    const existingSlug = await db.prepare(`SELECT id FROM groups WHERE slug = ?`).bind(slug).first();
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Create the group - ensure no undefined values (D1 requires null, not undefined)
    await db.prepare(`
      INSERT INTO groups (id, name, description, slug, type, categoryId, coverImage, createdById, memberCount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      groupId,
      name,
      description ?? '',
      slug,
      type ?? 'open',
      categoryId ?? null,
      coverColor ?? null,
      userId
    ).run();

    // Add creator as owner
    const memberId = `gm-${Date.now().toString(36)}`;
    await db.prepare(`
      INSERT INTO group_members (id, groupId, userId, role, status)
      VALUES (?, ?, ?, 'owner', 'active')
    `).bind(memberId, groupId, userId).run();

    // Add tags
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        await db.prepare(`
          INSERT OR IGNORE INTO group_tags (groupId, tag) VALUES (?, ?)
        `).bind(groupId, tag.toLowerCase()).run();
      }
    }

    // Fetch the created group
    const group = await db.prepare(`SELECT * FROM groups WHERE id = ?`).bind(groupId).first();

    return c.json({
      ...group,
      tags: tags || [],
      isJoined: true,
      memberRole: 'owner',
    }, 201);
  } catch (error: any) {
    console.error('Error creating group:', error);
    return c.json({
      error: 'Failed to create group',
      details: error?.message || 'Unknown error',
      cause: error?.cause?.message
    }, 500);
  }
});

// Update group (requires owner/admin)
groups.put('/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const groupId = c.req.param('id');
  const userId = c.get('user')?.id;
  const body = await c.req.json();

  try {
    // Check if user is owner or admin
    const membership = await db.prepare(`
      SELECT role FROM group_members WHERE groupId = ? AND userId = ? AND status = 'active'
    `).bind(groupId, userId).first();

    if (!membership || !['owner', 'admin'].includes(membership.role as string)) {
      return c.json({ error: 'Not authorized to update this group' }, 403);
    }

    const { name, description, type, coverImage, avatar } = body;
    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (type) {
      updates.push('type = ?');
      params.push(type);
    }
    if (coverImage !== undefined) {
      updates.push('coverImage = ?');
      params.push(coverImage);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(avatar);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = datetime("now")');
      params.push(groupId);
      await db.prepare(`UPDATE groups SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    }

    const group = await db.prepare(`SELECT * FROM groups WHERE id = ?`).bind(groupId).first();
    return c.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    return c.json({ error: 'Failed to update group' }, 500);
  }
});

// Join group
groups.post('/:id/join', authMiddleware, async (c) => {
  const db = c.env.DB;
  const groupId = c.req.param('id');
  const userId = c.get('user')?.id;

  try {
    const group = await db.prepare(`SELECT * FROM groups WHERE id = ? AND isArchived = 0`).bind(groupId).first();
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Check if already a member
    const existingMember = await db.prepare(`
      SELECT * FROM group_members WHERE groupId = ? AND userId = ?
    `).bind(groupId, userId).first();

    if (existingMember) {
      return c.json({ error: 'Already a member or pending approval' }, 400);
    }

    // Determine status based on group type
    const status = group.type === 'open' || group.type === 'official' ? 'active' : 'pending';

    const joinMemberId = `gm-${Date.now().toString(36)}`;
    await db.prepare(`
      INSERT INTO group_members (id, groupId, userId, role, status)
      VALUES (?, ?, ?, 'member', ?)
    `).bind(joinMemberId, groupId, userId, status).run();

    // Update member count only if active
    if (status === 'active') {
      await db.prepare(`UPDATE groups SET memberCount = memberCount + 1 WHERE id = ?`).bind(groupId).run();
    }

    return c.json({
      success: true,
      status,
      message: status === 'pending' ? 'Join request sent' : 'Joined successfully',
    });
  } catch (error) {
    console.error('Error joining group:', error);
    return c.json({ error: 'Failed to join group' }, 500);
  }
});

// Leave group
groups.post('/:id/leave', authMiddleware, async (c) => {
  const db = c.env.DB;
  const groupId = c.req.param('id');
  const userId = c.get('user')?.id;

  try {
    const membership = await db.prepare(`
      SELECT * FROM group_members WHERE groupId = ? AND userId = ?
    `).bind(groupId, userId).first();

    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 400);
    }

    if (membership.role === 'owner') {
      return c.json({ error: 'Owner cannot leave the group. Transfer ownership first.' }, 400);
    }

    await db.prepare(`DELETE FROM group_members WHERE groupId = ? AND userId = ?`).bind(groupId, userId).run();

    // Update member count only if was active
    if (membership.status === 'active') {
      await db.prepare(`UPDATE groups SET memberCount = CASE WHEN memberCount > 0 THEN memberCount - 1 ELSE 0 END WHERE id = ?`).bind(groupId).run();
    }

    return c.json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    console.error('Error leaving group:', error);
    return c.json({ error: 'Failed to leave group' }, 500);
  }
});

// Get group members
groups.get('/:id/members', optionalAuth, async (c) => {
  const db = c.env.DB;
  const groupId = c.req.param('id');

  try {
    const members = await db.prepare(`
      SELECT
        gm.id, gm.userId, gm.role, gm.status, gm.joinedAt,
        u.displayName, u.firstName, u.lastName, u.avatar
      FROM group_members gm
      LEFT JOIN users u ON gm.userId = u.id
      WHERE gm.groupId = ? AND gm.status = 'active'
      ORDER BY
        CASE gm.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'moderator' THEN 3
          ELSE 4
        END,
        gm.joinedAt ASC
    `).bind(groupId).all();

    return c.json({ members: (members.results || []).map((m: any) => ({
      id: m.userId,
      displayName: m.displayName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'User',
      avatar: m.avatar,
      role: m.role,
      joinedAt: m.joinedAt,
    })) });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return c.json({ error: 'Failed to fetch members', details: error?.message || String(error) }, 500);
  }
});

// Get group posts
groups.get('/:id/posts', optionalAuth, async (c) => {
  const db = c.env.DB;
  const groupId = c.req.param('id');
  const userId = c.get('user')?.id;

  try {
    // Enforce membership for non-open groups
    const group = await db.prepare(`SELECT type FROM groups WHERE id = ? AND isArchived = 0`).bind(groupId).first();
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    if (group.type !== 'open' && group.type !== 'official') {
      if (!userId) {
        return c.json({ error: 'Authentication required to view this group\'s posts' }, 401);
      }
      const membership = await db.prepare(`
        SELECT id FROM group_members WHERE groupId = ? AND userId = ? AND status = 'active'
      `).bind(groupId, userId).first();
      if (!membership) {
        return c.json({ error: 'Must be a member to view posts in this group' }, 403);
      }
    }

    const posts = await db.prepare(`
      SELECT
        p.*,
        u.displayName as authorName, u.firstName, u.lastName, u.avatar as authorAvatar
      FROM group_posts p
      LEFT JOIN users u ON p.authorId = u.id
      WHERE p.groupId = ? AND p.isDeleted = 0
      ORDER BY p.isPinned DESC, p.createdAt DESC
    `).bind(groupId).all();

    const postIds = (posts.results || []).map((p: any) => p.id);

    // Get reactions for all posts
    let reactionsMap: Record<string, any[]> = {};
    if (postIds.length > 0) {
      const reactions = await db.prepare(`
        SELECT postId, emoji, userId FROM group_post_reactions
        WHERE postId IN (${postIds.map(() => '?').join(',')})
      `).bind(...postIds).all();

      // Group reactions by post and emoji
      (reactions.results || []).forEach((r: any) => {
        if (!reactionsMap[r.postId]) reactionsMap[r.postId] = [];
        const existing = reactionsMap[r.postId].find((e: any) => e.emoji === r.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(r.userId);
          if (r.userId === userId) existing.hasReacted = true;
        } else {
          reactionsMap[r.postId].push({
            emoji: r.emoji,
            count: 1,
            users: [r.userId],
            hasReacted: r.userId === userId,
          });
        }
      });
    }

    // Get like status for each post if user is authenticated (legacy support)
    let likeMap: Record<string, boolean> = {};
    if (userId && postIds.length > 0) {
      const likes = await db.prepare(`
        SELECT postId FROM group_post_likes WHERE userId = ? AND postId IN (${postIds.map(() => '?').join(',')})
      `).bind(userId, ...postIds).all();

      likeMap = (likes.results || []).reduce((acc: any, l: any) => {
        acc[l.postId] = true;
        return acc;
      }, {});
    }

    return c.json({ posts: (posts.results || []).map((p: any) => ({
      id: p.id,
      groupId: p.groupId,
      authorId: p.authorId,
      authorName: p.authorName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'User',
      authorAvatar: p.authorAvatar,
      content: p.content,
      attachments: p.attachments ? JSON.parse(p.attachments) : [],
      likes: p.likes || 0,
      commentCount: p.commentCount || 0,
      isLiked: likeMap[p.id] || false,
      isPinned: p.isPinned === 1,
      reactions: reactionsMap[p.id] || [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })) });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// Create post in group
groups.post('/:id/posts', authMiddleware, async (c) => {
  const db = c.env.DB;
  const groupId = c.req.param('id');
  const userId = c.get('user')?.id;
  const body = await c.req.json();
  const { content, attachments } = body;

  if (!content?.trim()) {
    return c.json({ error: 'Content is required' }, 400);
  }

  try {
    // Check if user is a member
    const membership = await db.prepare(`
      SELECT role FROM group_members WHERE groupId = ? AND userId = ? AND status = 'active'
    `).bind(groupId, userId).first();

    if (!membership) {
      return c.json({ error: 'Must be a member to post' }, 403);
    }

    const postId = `post-${Date.now().toString(36)}`;

    await db.prepare(`
      INSERT INTO group_posts (id, groupId, authorId, content, attachments)
      VALUES (?, ?, ?, ?, ?)
    `).bind(postId, groupId, userId, content.trim(), attachments ? JSON.stringify(attachments) : null).run();

    // Update post count
    await db.prepare(`UPDATE groups SET postCount = postCount + 1, updatedAt = datetime('now') WHERE id = ?`).bind(groupId).run();

    // Get the created post with author info
    const post = await db.prepare(`
      SELECT p.*, u.displayName as authorName, u.firstName, u.lastName, u.avatar as authorAvatar
      FROM group_posts p
      LEFT JOIN users u ON p.authorId = u.id
      WHERE p.id = ?
    `).bind(postId).first();

    return c.json({
      id: post?.id,
      groupId: post?.groupId,
      authorId: post?.authorId,
      authorName: post?.authorName || `${post?.firstName || ''} ${post?.lastName || ''}`.trim() || 'User',
      authorAvatar: post?.authorAvatar,
      content: post?.content,
      attachments: [],
      likes: 0,
      commentCount: 0,
      isLiked: false,
      isPinned: false,
      createdAt: post?.createdAt,
      updatedAt: post?.updatedAt,
    }, 201);
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

// Like/unlike post
groups.post('/posts/:postId/like', authMiddleware, async (c) => {
  const db = c.env.DB;
  const postId = c.req.param('postId');
  const userId = c.get('user')?.id;

  try {
    // Check if already liked
    const existingLike = await db.prepare(`
      SELECT id FROM group_post_likes WHERE postId = ? AND userId = ?
    `).bind(postId, userId).first();

    if (existingLike) {
      // Unlike
      await db.prepare(`DELETE FROM group_post_likes WHERE postId = ? AND userId = ?`).bind(postId, userId).run();
      await db.prepare(`UPDATE group_posts SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END WHERE id = ?`).bind(postId).run();
      return c.json({ action: 'unliked' });
    } else {
      // Like
      await db.prepare(`INSERT INTO group_post_likes (postId, userId) VALUES (?, ?)`).bind(postId, userId).run();
      await db.prepare(`UPDATE group_posts SET likes = likes + 1 WHERE id = ?`).bind(postId).run();
      return c.json({ action: 'liked' });
    }
  } catch (error) {
    console.error('Error liking post:', error);
    return c.json({ error: 'Failed to like post' }, 500);
  }
});

// Get comments for a post
groups.get('/posts/:postId/comments', optionalAuth, async (c) => {
  const db = c.env.DB;
  const postId = c.req.param('postId');
  const userId = c.get('user')?.id;

  try {
    // Enforce membership for non-open groups
    const post = await db.prepare(`
      SELECT p.groupId, g.type as groupType
      FROM group_posts p
      JOIN groups g ON p.groupId = g.id
      WHERE p.id = ? AND p.isDeleted = 0
    `).bind(postId).first();
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    if (post.groupType !== 'open' && post.groupType !== 'official') {
      if (!userId) {
        return c.json({ error: 'Authentication required to view comments in this group' }, 401);
      }
      const membership = await db.prepare(`
        SELECT id FROM group_members WHERE groupId = ? AND userId = ? AND status = 'active'
      `).bind(post.groupId, userId).first();
      if (!membership) {
        return c.json({ error: 'Must be a member to view comments in this group' }, 403);
      }
    }

    const comments = await db.prepare(`
      SELECT
        c.*,
        u.displayName as authorName, u.firstName, u.lastName, u.avatar as authorAvatar
      FROM group_comments c
      LEFT JOIN users u ON c.authorId = u.id
      WHERE c.postId = ? AND c.isDeleted = 0
      ORDER BY c.createdAt ASC
    `).bind(postId).all();

    // Get like status if authenticated
    let likeMap: Record<string, boolean> = {};
    if (userId && comments.results?.length) {
      const likes = await db.prepare(`
        SELECT commentId FROM group_comment_likes WHERE userId = ? AND commentId IN (${comments.results.map(() => '?').join(',')})
      `).bind(userId, ...comments.results.map((c: any) => c.id)).all();

      likeMap = (likes.results || []).reduce((acc: any, l: any) => {
        acc[l.commentId] = true;
        return acc;
      }, {});
    }

    return c.json({ comments: (comments.results || []).map((c: any) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      authorName: c.authorName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'User',
      authorAvatar: c.authorAvatar,
      content: c.content,
      parentId: c.parentId,
      likes: c.likes || 0,
      isLiked: likeMap[c.id] || false,
      createdAt: c.createdAt,
    })) });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return c.json({ error: 'Failed to fetch comments' }, 500);
  }
});

// Add comment to post
groups.post('/posts/:postId/comments', authMiddleware, async (c) => {
  const db = c.env.DB;
  const postId = c.req.param('postId');
  const userId = c.get('user')?.id;
  const body = await c.req.json();
  const { content, parentId } = body;

  if (!content?.trim()) {
    return c.json({ error: 'Content is required' }, 400);
  }

  try {
    const commentId = `cmt-${Date.now().toString(36)}`;

    await db.prepare(`
      INSERT INTO group_comments (id, postId, authorId, content, parentId)
      VALUES (?, ?, ?, ?, ?)
    `).bind(commentId, postId, userId, content.trim(), parentId || null).run();

    // Update comment count
    await db.prepare(`UPDATE group_posts SET commentCount = commentCount + 1 WHERE id = ?`).bind(postId).run();

    // Get the created comment with author info
    const comment = await db.prepare(`
      SELECT c.*, u.displayName as authorName, u.firstName, u.lastName, u.avatar as authorAvatar
      FROM group_comments c
      LEFT JOIN users u ON c.authorId = u.id
      WHERE c.id = ?
    `).bind(commentId).first();

    return c.json({
      id: comment?.id,
      postId: comment?.postId,
      authorId: comment?.authorId,
      authorName: comment?.authorName || `${comment?.firstName || ''} ${comment?.lastName || ''}`.trim() || 'User',
      authorAvatar: comment?.authorAvatar,
      content: comment?.content,
      parentId: comment?.parentId,
      likes: 0,
      isLiked: false,
      createdAt: comment?.createdAt,
    }, 201);
  } catch (error) {
    console.error('Error creating comment:', error);
    return c.json({ error: 'Failed to create comment' }, 500);
  }
});

// Delete post (author or admin only)
groups.delete('/posts/:postId', authMiddleware, async (c) => {
  const db = c.env.DB;
  const postId = c.req.param('postId');
  const userId = c.get('user')?.id;

  try {
    const post = await db.prepare(`SELECT * FROM group_posts WHERE id = ?`).bind(postId).first();
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    // Check if user is author or group admin
    const membership = await db.prepare(`
      SELECT role FROM group_members WHERE groupId = ? AND userId = ? AND status = 'active'
    `).bind(post.groupId, userId).first();

    if (post.authorId !== userId && !['owner', 'admin', 'moderator'].includes(membership?.role as string)) {
      return c.json({ error: 'Not authorized to delete this post' }, 403);
    }

    await db.prepare(`UPDATE group_posts SET isDeleted = 1 WHERE id = ?`).bind(postId).run();
    await db.prepare(`UPDATE groups SET postCount = CASE WHEN postCount > 0 THEN postCount - 1 ELSE 0 END WHERE id = ?`).bind(post.groupId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// Upload file for group post
groups.post('/:id/upload', authMiddleware, async (c) => {
  const db = c.env.DB;
  const DOCUMENTS = c.env.DOCUMENTS;
  const groupId = c.req.param('id');
  const userId = c.get('user')?.id;

  try {
    // Check if user is a member
    const membership = await db.prepare(`
      SELECT role FROM group_members WHERE groupId = ? AND userId = ? AND status = 'active'
    `).bind(groupId, userId).first();

    if (!membership) {
      return c.json({ error: 'Must be a member to upload files' }, 403);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file size (10MB max for images, 50MB for other files)
    const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` }, 400);
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const fileKey = `groups/${groupId}/${fileName}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await DOCUMENTS.put(fileKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Determine attachment type
    let attachmentType = 'file';
    if (file.type.startsWith('image/')) attachmentType = 'image';
    else if (file.type.startsWith('audio/')) attachmentType = 'audio';
    else if (file.type.startsWith('video/')) attachmentType = 'video';

    return c.json({
      url: fileKey,
      name: file.name,
      size: file.size,
      type: attachmentType,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// Toggle post reaction
groups.post('/posts/:postId/reactions', authMiddleware, async (c) => {
  const db = c.env.DB;
  const postId = c.req.param('postId');
  const userId = c.get('user')?.id;
  const body = await c.req.json();
  const { emoji } = body;

  if (!emoji) {
    return c.json({ error: 'Emoji is required' }, 400);
  }

  try {
    // Check if post exists
    const post = await db.prepare(`SELECT groupId FROM group_posts WHERE id = ? AND isDeleted = 0`).bind(postId).first();
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    // Check existing reaction
    const existing = await db.prepare(`
      SELECT id FROM group_post_reactions WHERE postId = ? AND userId = ? AND emoji = ?
    `).bind(postId, userId, emoji).first();

    if (existing) {
      // Remove reaction
      await db.prepare(`DELETE FROM group_post_reactions WHERE id = ?`).bind(existing.id).run();
      return c.json({ action: 'removed', emoji });
    } else {
      // Add reaction
      const reactionId = `reaction-${Date.now().toString(36)}`;
      await db.prepare(`
        INSERT INTO group_post_reactions (id, postId, userId, emoji) VALUES (?, ?, ?, ?)
      `).bind(reactionId, postId, userId, emoji).run();
      return c.json({ action: 'added', emoji });
    }
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return c.json({ error: 'Failed to toggle reaction' }, 500);
  }
});

// Toggle comment reaction
groups.post('/comments/:commentId/reactions', authMiddleware, async (c) => {
  const db = c.env.DB;
  const commentId = c.req.param('commentId');
  const userId = c.get('user')?.id;
  const body = await c.req.json();
  const { emoji } = body;

  if (!emoji) {
    return c.json({ error: 'Emoji is required' }, 400);
  }

  try {
    // Check if comment exists
    const comment = await db.prepare(`SELECT id FROM group_comments WHERE id = ? AND isDeleted = 0`).bind(commentId).first();
    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    // Check existing reaction
    const existing = await db.prepare(`
      SELECT id FROM group_comment_reactions WHERE commentId = ? AND userId = ? AND emoji = ?
    `).bind(commentId, userId, emoji).first();

    if (existing) {
      // Remove reaction
      await db.prepare(`DELETE FROM group_comment_reactions WHERE id = ?`).bind(existing.id).run();
      return c.json({ action: 'removed', emoji });
    } else {
      // Add reaction
      const reactionId = `reaction-${Date.now().toString(36)}`;
      await db.prepare(`
        INSERT INTO group_comment_reactions (id, commentId, userId, emoji) VALUES (?, ?, ?, ?)
      `).bind(reactionId, commentId, userId, emoji).run();
      return c.json({ action: 'added', emoji });
    }
  } catch (error) {
    console.error('Error toggling comment reaction:', error);
    return c.json({ error: 'Failed to toggle reaction' }, 500);
  }
});

// Get file from R2 (for group attachments)
groups.get('/files/:groupId/:fileName', async (c) => {
  const DOCUMENTS = c.env.DOCUMENTS;
  const groupId = c.req.param('groupId');
  const fileName = c.req.param('fileName');
  const fileKey = `groups/${groupId}/${fileName}`;

  try {
    const object = await DOCUMENTS.get(fileKey);
    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error fetching file:', error);
    return c.json({ error: 'Failed to fetch file' }, 500);
  }
});

export const groupsRoutes = groups;
