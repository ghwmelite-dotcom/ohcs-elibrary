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

// Optional auth middleware - sets user if token provided
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
      // Token invalid, continue as unauthenticated
    }
  }

  if (!c.get('userId')) {
    c.set('userId', 'guest');
    c.set('userRole', 'guest');
  }

  await next();
}

// Require auth middleware
async function requireAuth(c: AppContext, next: Next) {
  const userId = c.get('userId');
  if (!userId || userId === 'guest') {
    return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
  }
  await next();
}

// Helper to create URL-friendly slug
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

export const forumRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply optional auth to all routes
forumRoutes.use('*', optionalAuth);

// ============================================
// CATEGORY ROUTES
// ============================================

// GET /forum/categories - List all categories
forumRoutes.get('/categories', async (c: AppContext) => {
  try {
    const { DB } = c.env;

    const { results } = await DB.prepare(`
      SELECT
        fc.*,
        (SELECT COUNT(*) FROM forum_topics ft WHERE ft.categoryId = fc.id) as topicCount,
        (SELECT COUNT(*) FROM forum_posts fp
         INNER JOIN forum_topics ft ON fp.topicId = ft.id
         WHERE ft.categoryId = fc.id) as postCount,
        (SELECT MAX(fp.createdAt) FROM forum_posts fp
         INNER JOIN forum_topics ft ON fp.topicId = ft.id
         WHERE ft.categoryId = fc.id) as lastActivityAt
      FROM forum_categories fc
      ORDER BY fc.sortOrder ASC
    `).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// GET /forum/categories/:id - Get single category
forumRoutes.get('/categories/:id', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const categoryId = c.req.param('id');

    const category = await DB.prepare(`
      SELECT
        fc.*,
        (SELECT COUNT(*) FROM forum_topics ft WHERE ft.categoryId = fc.id) as topicCount,
        (SELECT COUNT(*) FROM forum_posts fp
         INNER JOIN forum_topics ft ON fp.topicId = ft.id
         WHERE ft.categoryId = fc.id) as postCount
      FROM forum_categories fc
      WHERE fc.id = ? OR fc.slug = ?
    `).bind(categoryId, categoryId).first();

    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    return c.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return c.json({ error: 'Failed to fetch category' }, 500);
  }
});

// ============================================
// TOPIC ROUTES
// ============================================

// GET /forum/topics - List topics with filtering
forumRoutes.get('/topics', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');

    // Parse query parameters
    const url = new URL(c.req.url);
    const categoryId = url.searchParams.get('categoryId');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'latest';
    const filter = url.searchParams.get('filter') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '15'), 50);
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (categoryId) {
      whereClause += ' AND ft.categoryId = ?';
      params.push(categoryId);
    }

    if (search) {
      whereClause += ' AND (ft.title LIKE ? OR ft.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filter options
    if (filter === 'unanswered') {
      whereClause += ' AND ft.isAnswered = 0 AND ft.postCount = 0';
    } else if (filter === 'solved') {
      whereClause += ' AND ft.isAnswered = 1';
    } else if (filter === 'pinned') {
      whereClause += ' AND ft.isPinned = 1';
    }

    // Count query
    const countResult = await DB.prepare(`
      SELECT COUNT(*) as total FROM forum_topics ft ${whereClause}
    `).bind(...params).first<{ total: number }>();

    // Sort options
    let orderClause = 'ORDER BY ft.isPinned DESC, ';
    switch (sortBy) {
      case 'popular':
        orderClause += 'ft.views DESC';
        break;
      case 'replies':
        orderClause += 'ft.postCount DESC';
        break;
      case 'unanswered':
        orderClause += 'ft.postCount ASC, ft.createdAt DESC';
        break;
      default:
        orderClause += 'ft.createdAt DESC';
    }

    // Main query
    const { results } = await DB.prepare(`
      SELECT
        ft.*,
        fc.name as categoryName,
        fc.color as categoryColor,
        fc.slug as categorySlug,
        u.displayName as authorName,
        u.avatar as authorAvatar,
        (SELECT fs.id FROM forum_subscriptions fs WHERE fs.topicId = ft.id AND fs.userId = ?) as isSubscribed
      FROM forum_topics ft
      LEFT JOIN forum_categories fc ON ft.categoryId = fc.id
      LEFT JOIN users u ON ft.authorId = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `).bind(userId, ...params, limit, offset).all();

    // Transform results
    const topics = (results || []).map((topic: any) => ({
      ...topic,
      tags: topic.tags ? JSON.parse(topic.tags) : [],
      isSubscribed: !!topic.isSubscribed,
      category: {
        id: topic.categoryId,
        name: topic.categoryName,
        color: topic.categoryColor,
        slug: topic.categorySlug,
      },
      author: {
        id: topic.authorId,
        displayName: topic.authorName,
        avatar: topic.authorAvatar,
      },
    }));

    return c.json({
      topics,
      totalCount: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return c.json({ error: 'Failed to fetch topics' }, 500);
  }
});

// GET /forum/topics/:id - Get single topic with posts
forumRoutes.get('/topics/:id', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');
    const topicId = c.req.param('id');

    // Get topic
    const topic = await DB.prepare(`
      SELECT
        ft.*,
        fc.name as categoryName,
        fc.color as categoryColor,
        fc.slug as categorySlug,
        u.displayName as authorName,
        u.avatar as authorAvatar,
        (SELECT fs.id FROM forum_subscriptions fs WHERE fs.topicId = ft.id AND fs.userId = ?) as isSubscribed
      FROM forum_topics ft
      LEFT JOIN forum_categories fc ON ft.categoryId = fc.id
      LEFT JOIN users u ON ft.authorId = u.id
      WHERE ft.id = ? OR ft.slug = ?
    `).bind(userId, topicId, topicId).first();

    if (!topic) {
      return c.json({ error: 'Topic not found' }, 404);
    }

    // Increment views
    try {
      await DB.prepare(`
        UPDATE forum_topics SET views = views + 1 WHERE id = ?
      `).bind(topic.id).run();
    } catch (e) {
      console.log('Could not increment views:', e);
    }

    // Get posts
    const { results: posts } = await DB.prepare(`
      SELECT
        fp.*,
        u.displayName as authorName,
        u.avatar as authorAvatar,
        (SELECT fv.voteType FROM forum_votes fv WHERE fv.postId = fp.id AND fv.userId = ?) as userVote
      FROM forum_posts fp
      LEFT JOIN users u ON fp.authorId = u.id
      WHERE fp.topicId = ?
      ORDER BY fp.isBestAnswer DESC, fp.createdAt ASC
    `).bind(userId, topic.id).all();

    return c.json({
      ...topic,
      tags: topic.tags ? JSON.parse(topic.tags as string) : [],
      isSubscribed: !!topic.isSubscribed,
      category: {
        id: topic.categoryId,
        name: topic.categoryName,
        color: topic.categoryColor,
        slug: topic.categorySlug,
      },
      author: {
        id: topic.authorId,
        displayName: topic.authorName,
        avatar: topic.authorAvatar,
      },
      posts: (posts || []).map((post: any) => ({
        ...post,
        author: {
          id: post.authorId,
          displayName: post.authorName,
          avatar: post.authorAvatar,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching topic:', error);
    return c.json({ error: 'Failed to fetch topic' }, 500);
  }
});

// POST /forum/topics - Create new topic
forumRoutes.post('/topics', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const { title, content, categoryId, tags } = await c.req.json();

    if (!title || !content || !categoryId) {
      return c.json({ error: 'Title, content, and category are required' }, 400);
    }

    // Verify category exists
    const category = await DB.prepare(`
      SELECT id, isLocked FROM forum_categories WHERE id = ?
    `).bind(categoryId).first();

    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    if (category.isLocked) {
      return c.json({ error: 'This category is locked' }, 403);
    }

    const topicId = crypto.randomUUID();
    const slug = createSlug(title) + '-' + topicId.substring(0, 8);

    await DB.prepare(`
      INSERT INTO forum_topics (id, title, slug, content, categoryId, authorId, tags, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      topicId,
      title,
      slug,
      content,
      categoryId,
      userId,
      JSON.stringify(tags || [])
    ).run();

    // Award XP for creating topic
    try {
      await DB.prepare(`
        INSERT INTO xp_transactions (id, userId, amount, reason, referenceId, referenceType, createdAt)
        VALUES (?, ?, 25, 'topic_created', ?, 'topic', datetime('now'))
      `).bind(crypto.randomUUID(), userId, topicId).run();

      await DB.prepare(`
        UPDATE user_stats SET totalXp = totalXp + 25, forumTopics = forumTopics + 1, updatedAt = datetime('now')
        WHERE userId = ?
      `).bind(userId).run();
    } catch (e) {
      console.log('Could not award XP:', e);
    }

    // Log activity
    try {
      await DB.prepare(`
        INSERT INTO activity_log (userId, activityType, title, description, xpEarned, referenceId, referenceType, createdAt)
        VALUES (?, 'topic_created', ?, ?, 25, ?, 'topic', datetime('now'))
      `).bind(userId, `Created topic: ${title}`, `Started a new discussion in the forum`, topicId).run();
    } catch (e) {
      console.log('Could not log activity:', e);
    }

    const topic = await DB.prepare(`
      SELECT * FROM forum_topics WHERE id = ?
    `).bind(topicId).first();

    return c.json(topic, 201);
  } catch (error) {
    console.error('Error creating topic:', error);
    return c.json({ error: 'Failed to create topic' }, 500);
  }
});

// POST /forum/topics/:id/posts - Reply to topic
forumRoutes.post('/topics/:id/posts', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const topicId = c.req.param('id');
    const { content, parentId } = await c.req.json();

    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }

    // Verify topic exists and not locked
    const topic = await DB.prepare(`
      SELECT id, isLocked, authorId FROM forum_topics WHERE id = ?
    `).bind(topicId).first();

    if (!topic) {
      return c.json({ error: 'Topic not found' }, 404);
    }

    if (topic.isLocked) {
      return c.json({ error: 'This topic is locked' }, 403);
    }

    const postId = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO forum_posts (id, topicId, authorId, content, parentId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(postId, topicId, userId, content, parentId || null).run();

    // Update topic stats
    await DB.prepare(`
      UPDATE forum_topics
      SET postCount = postCount + 1,
          lastPostAt = datetime('now'),
          lastPostBy = ?,
          updatedAt = datetime('now')
      WHERE id = ?
    `).bind(userId, topicId).run();

    // Award XP for posting
    try {
      await DB.prepare(`
        INSERT INTO xp_transactions (id, userId, amount, reason, referenceId, referenceType, createdAt)
        VALUES (?, ?, 10, 'forum_post', ?, 'post', datetime('now'))
      `).bind(crypto.randomUUID(), userId, postId).run();

      await DB.prepare(`
        UPDATE user_stats SET totalXp = totalXp + 10, forumPosts = forumPosts + 1, updatedAt = datetime('now')
        WHERE userId = ?
      `).bind(userId).run();
    } catch (e) {
      console.log('Could not award XP:', e);
    }

    const post = await DB.prepare(`
      SELECT fp.*, u.displayName as authorName, u.avatar as authorAvatar
      FROM forum_posts fp
      LEFT JOIN users u ON fp.authorId = u.id
      WHERE fp.id = ?
    `).bind(postId).first();

    return c.json({
      ...post,
      author: {
        id: post?.authorId,
        displayName: post?.authorName,
        avatar: post?.authorAvatar,
      },
    }, 201);
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

// POST /forum/posts/:id/vote - Vote on post
forumRoutes.post('/posts/:id/vote', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const postId = c.req.param('id');
    const { voteType } = await c.req.json();

    if (!['up', 'down'].includes(voteType)) {
      return c.json({ error: 'Invalid vote type' }, 400);
    }

    // Check existing vote
    const existingVote = await DB.prepare(`
      SELECT id, voteType FROM forum_votes WHERE postId = ? AND userId = ?
    `).bind(postId, userId).first<{ id: string; voteType: string }>();

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote
        await DB.prepare(`DELETE FROM forum_votes WHERE id = ?`).bind(existingVote.id).run();

        // Update post counts
        if (voteType === 'up') {
          await DB.prepare(`UPDATE forum_posts SET likes = likes - 1 WHERE id = ?`).bind(postId).run();
        } else {
          await DB.prepare(`UPDATE forum_posts SET dislikes = dislikes - 1 WHERE id = ?`).bind(postId).run();
        }

        return c.json({ message: 'Vote removed', voteType: null });
      } else {
        // Change vote
        await DB.prepare(`UPDATE forum_votes SET voteType = ? WHERE id = ?`).bind(voteType, existingVote.id).run();

        // Update post counts
        if (voteType === 'up') {
          await DB.prepare(`UPDATE forum_posts SET likes = likes + 1, dislikes = dislikes - 1 WHERE id = ?`).bind(postId).run();
        } else {
          await DB.prepare(`UPDATE forum_posts SET likes = likes - 1, dislikes = dislikes + 1 WHERE id = ?`).bind(postId).run();
        }

        return c.json({ message: 'Vote changed', voteType });
      }
    }

    // Create new vote
    await DB.prepare(`
      INSERT INTO forum_votes (id, postId, userId, voteType, createdAt)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(crypto.randomUUID(), postId, userId, voteType).run();

    // Update post counts
    if (voteType === 'up') {
      await DB.prepare(`UPDATE forum_posts SET likes = likes + 1 WHERE id = ?`).bind(postId).run();
    } else {
      await DB.prepare(`UPDATE forum_posts SET dislikes = dislikes + 1 WHERE id = ?`).bind(postId).run();
    }

    return c.json({ message: 'Vote recorded', voteType });
  } catch (error) {
    console.error('Error voting:', error);
    return c.json({ error: 'Failed to vote' }, 500);
  }
});

// POST /forum/posts/:id/best-answer - Mark as best answer
forumRoutes.post('/posts/:id/best-answer', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const postId = c.req.param('id');

    // Get post and topic
    const post = await DB.prepare(`
      SELECT fp.*, ft.authorId as topicAuthorId, ft.id as topicId
      FROM forum_posts fp
      INNER JOIN forum_topics ft ON fp.topicId = ft.id
      WHERE fp.id = ?
    `).bind(postId).first();

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    // Only topic author can mark best answer
    if (post.topicAuthorId !== userId) {
      return c.json({ error: 'Only the topic author can mark best answer' }, 403);
    }

    // Remove existing best answer
    await DB.prepare(`
      UPDATE forum_posts SET isBestAnswer = 0 WHERE topicId = ?
    `).bind(post.topicId).run();

    // Mark new best answer
    await DB.prepare(`
      UPDATE forum_posts SET isBestAnswer = 1 WHERE id = ?
    `).bind(postId).run();

    // Mark topic as answered
    await DB.prepare(`
      UPDATE forum_topics SET isAnswered = 1, updatedAt = datetime('now') WHERE id = ?
    `).bind(post.topicId).run();

    // Award XP to post author
    try {
      await DB.prepare(`
        INSERT INTO xp_transactions (id, userId, amount, reason, referenceId, referenceType, createdAt)
        VALUES (?, ?, 50, 'best_answer', ?, 'post', datetime('now'))
      `).bind(crypto.randomUUID(), post.authorId, postId).run();

      await DB.prepare(`
        UPDATE user_stats SET totalXp = totalXp + 50, bestAnswers = bestAnswers + 1, updatedAt = datetime('now')
        WHERE userId = ?
      `).bind(post.authorId).run();
    } catch (e) {
      console.log('Could not award XP:', e);
    }

    return c.json({ message: 'Best answer marked' });
  } catch (error) {
    console.error('Error marking best answer:', error);
    return c.json({ error: 'Failed to mark best answer' }, 500);
  }
});

// POST /forum/topics/:id/subscribe - Subscribe to topic
forumRoutes.post('/topics/:id/subscribe', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const topicId = c.req.param('id');

    // Check existing subscription
    const existing = await DB.prepare(`
      SELECT id FROM forum_subscriptions WHERE topicId = ? AND userId = ?
    `).bind(topicId, userId).first();

    if (existing) {
      // Unsubscribe
      await DB.prepare(`DELETE FROM forum_subscriptions WHERE id = ?`).bind(existing.id).run();
      return c.json({ subscribed: false });
    }

    // Subscribe
    await DB.prepare(`
      INSERT INTO forum_subscriptions (topicId, userId, createdAt)
      VALUES (?, ?, datetime('now'))
    `).bind(topicId, userId).run();

    return c.json({ subscribed: true });
  } catch (error) {
    console.error('Error subscribing:', error);
    return c.json({ error: 'Failed to subscribe' }, 500);
  }
});

// GET /forum/stats - Get forum statistics
forumRoutes.get('/stats', async (c: AppContext) => {
  try {
    const { DB } = c.env;

    const stats = await DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM forum_topics) as totalTopics,
        (SELECT COUNT(*) FROM forum_posts) as totalPosts,
        (SELECT COUNT(DISTINCT authorId) FROM forum_posts WHERE createdAt >= datetime('now', '-30 days')) as activeMembers,
        (SELECT COUNT(*) FROM forum_topics WHERE createdAt >= datetime('now', '-24 hours')) as todayTopics
    `).first();

    return c.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({
      totalTopics: 0,
      totalPosts: 0,
      activeMembers: 0,
      todayTopics: 0,
    });
  }
});
