import { Hono } from 'hono';
import { authMiddleware, optionalAuth } from '../middleware/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const recognition = new Hono<{ Bindings: Env }>();

// XP Configuration
const XP_CONFIG = {
  ENDORSEMENT_BONUS_RECEIVER: 25,
  ENDORSEMENT_XP_ENDORSER: 10,
  MONTHLY_LIMIT: 10,
};

// Helper to check user role for endorsement eligibility
const canEndorse = (userRole: string): boolean => {
  const endorserRoles = ['admin', 'director', 'super_admin', 'moderator', 'counselor'];
  return endorserRoles.includes(userRole);
};

// Helper to generate UUID
const generateId = () => crypto.randomUUID();

// =============================================
// GET /recognition/categories - Get all active categories
// =============================================
recognition.get('/categories', async (c) => {
  const db = c.env.DB;

  try {
    const { results } = await db.prepare(`
      SELECT * FROM recognition_categories WHERE isActive = 1 ORDER BY sortOrder
    `).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// =============================================
// GET /recognition - Get recognition feed
// =============================================
recognition.get('/', optionalAuth, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;
  const { categoryId, receiverId, giverId, mdaId, period, page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let whereClause = 'WHERE r.isPublic = 1';
    const params: any[] = [];

    if (categoryId) {
      whereClause += ' AND r.categoryId = ?';
      params.push(categoryId);
    }
    if (receiverId) {
      whereClause += ' AND r.receiverId = ?';
      params.push(receiverId);
    }
    if (giverId) {
      whereClause += ' AND r.giverId = ?';
      params.push(giverId);
    }
    if (mdaId) {
      whereClause += ' AND (giver.mdaId = ? OR receiver.mdaId = ?)';
      params.push(mdaId, mdaId);
    }
    if (period) {
      const periodMap: Record<string, string> = {
        today: "date('now')",
        week: "date('now', '-7 days')",
        month: "date('now', '-30 days')",
        quarter: "date('now', '-90 days')",
        year: "date('now', '-365 days')",
      };
      if (periodMap[period]) {
        whereClause += ` AND r.createdAt >= ${periodMap[period]}`;
      }
    }

    const query = `
      SELECT
        r.*,
        giver.displayName as giverName, giver.avatar as giverAvatar, giver.jobTitle as giverTitle, giver.department as giverDepartment,
        receiver.displayName as receiverName, receiver.avatar as receiverAvatar, receiver.jobTitle as receiverTitle, receiver.department as receiverDepartment,
        rc.name as categoryName, rc.slug as categorySlug, rc.icon as categoryIcon, rc.color as categoryColor, rc.description as categoryDescription,
        (SELECT COUNT(*) FROM recognition_endorsements WHERE recognitionId = r.id) as endorsementCount
      FROM recognitions r
      JOIN users giver ON r.giverId = giver.id
      JOIN users receiver ON r.receiverId = receiver.id
      JOIN recognition_categories rc ON r.categoryId = rc.id
      ${whereClause}
      ORDER BY r.isHighlighted DESC, r.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);
    const { results } = await db.prepare(query).bind(...params).all();

    // Get total count
    const countParams = params.slice(0, -2);
    const countQuery = `
      SELECT COUNT(*) as total FROM recognitions r
      JOIN users giver ON r.giverId = giver.id
      JOIN users receiver ON r.receiverId = receiver.id
      ${whereClause}
    `;
    const countResult = await db.prepare(countQuery).bind(...countParams).first();

    // Format results
    const recognitions = (results || []).map((r: any) => ({
      id: r.id,
      message: r.message,
      isPublic: !!r.isPublic,
      isHighlighted: !!r.isHighlighted,
      xpAwarded: r.xpAwarded,
      giverXpAwarded: r.giverXpAwarded,
      endorsementCount: r.endorsementCount || 0,
      createdAt: r.createdAt,
      giver: {
        id: r.giverId,
        displayName: r.giverName,
        avatar: r.giverAvatar,
        title: r.giverTitle,
        department: r.giverDepartment,
      },
      receiver: {
        id: r.receiverId,
        displayName: r.receiverName,
        avatar: r.receiverAvatar,
        title: r.receiverTitle,
        department: r.receiverDepartment,
      },
      category: {
        id: r.categoryId,
        name: r.categoryName,
        slug: r.categorySlug,
        icon: r.categoryIcon,
        color: r.categoryColor,
        description: r.categoryDescription,
      },
    }));

    return c.json({
      recognitions,
      page: parseInt(page),
      limit: parseInt(limit),
      total: (countResult as any)?.total || 0,
      hasMore: recognitions.length === parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching recognitions:', error);
    return c.json({ error: 'Failed to fetch recognitions' }, 500);
  }
});
// =============================================
// POST /recognition - Give recognition
// =============================================
recognition.post('/', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;
  const userRole = user?.role || 'user';

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const { receiverId, categoryId, message, isPublic = true } = body;

  if (!receiverId || !categoryId || !message) {
    return c.json({ error: 'receiverId, categoryId, and message are required' }, 400);
  }

  if (message.length < 10) {
    return c.json({ error: 'Message must be at least 10 characters' }, 400);
  }

  if (message.length > 500) {
    return c.json({ error: 'Message cannot exceed 500 characters' }, 400);
  }

  if (receiverId === userId) {
    return c.json({ error: 'You cannot recognize yourself' }, 400);
  }

  try {
    // Check if receiver exists
    const receiver = await db.prepare(`
      SELECT id, displayName, avatar FROM users WHERE id = ? AND isActive = 1
    `).bind(receiverId).first();

    if (!receiver) {
      return c.json({ error: 'Recipient not found' }, 404);
    }

    // Check monthly limits
    const currentMonth = new Date().toISOString().slice(0, 7);
    const limitCheck = await db.prepare(`
      SELECT recognitionsGiven FROM recognition_limits
      WHERE userId = ? AND periodType = 'monthly' AND periodStart LIKE ?
    `).bind(userId, currentMonth + '%').first();

    const monthlyGiven = (limitCheck as any)?.recognitionsGiven || 0;
    if (monthlyGiven >= XP_CONFIG.MONTHLY_LIMIT) {
      return c.json({
        error: 'Monthly recognition limit reached',
        limit: XP_CONFIG.MONTHLY_LIMIT,
        used: monthlyGiven,
      }, 429);
    }

    // Get category info
    const category = await db.prepare(`
      SELECT * FROM recognition_categories WHERE id = ? AND isActive = 1
    `).bind(categoryId).first();

    if (!category) {
      return c.json({ error: 'Invalid category' }, 400);
    }

    const recognitionId = generateId();
    const xpReceiver = (category as any).xpRewardReceiver;
    const xpGiver = (category as any).xpRewardGiver;

    // Get giver info
    const giver = await db.prepare(`
      SELECT displayName, avatar FROM users WHERE id = ?
    `).bind(userId).first();

    // Create recognition
    await db.prepare(`
      INSERT INTO recognitions (id, giverId, receiverId, categoryId, message, isPublic, xpAwarded, giverXpAwarded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      recognitionId,
      userId,
      receiverId,
      categoryId,
      message,
      isPublic ? 1 : 0,
      xpReceiver,
      xpGiver
    ).run();

    // Create wall post for recognition
    const wallPostId = generateId();
    const postContent = `🏆 Recognized @${(receiver as any).displayName} for **${(category as any).name}**\n\n"${message}"`;

    await db.prepare(`
      INSERT INTO wall_posts (id, authorId, content, visibility, postType, mentionedUserIds)
      VALUES (?, ?, ?, 'public', 'recognition', ?)
    `).bind(wallPostId, userId, postContent, JSON.stringify([receiverId])).run();

    // Link wall post to recognition
    await db.prepare(`
      UPDATE recognitions SET wallPostId = ? WHERE id = ?
    `).bind(wallPostId, recognitionId).run();

    // Award XP to receiver
    await db.prepare(`
      INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId)
      VALUES (?, ?, ?, ?, 'recognition', ?)
    `).bind(generateId(), receiverId, xpReceiver, `Recognized for ${(category as any).name}`, recognitionId).run();

    // Award XP to giver
    await db.prepare(`
      INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId)
      VALUES (?, ?, ?, 'Gave peer recognition', 'recognition', ?)
    `).bind(generateId(), userId, xpGiver, recognitionId).run();

    // Update user_stats for both users
    await db.prepare(`
      UPDATE user_stats SET totalXp = totalXp + ? WHERE userId = ?
    `).bind(xpReceiver, receiverId).run();

    await db.prepare(`
      UPDATE user_stats SET totalXp = totalXp + ? WHERE userId = ?
    `).bind(xpGiver, userId).run();

    // Update recognition stats for giver
    await db.prepare(`
      INSERT INTO user_recognition_stats (userId, recognitionsGiven, lastGivenAt)
      VALUES (?, 1, datetime('now'))
      ON CONFLICT(userId) DO UPDATE SET
        recognitionsGiven = recognitionsGiven + 1,
        currentMonthGiven = currentMonthGiven + 1,
        lastGivenAt = datetime('now'),
        updatedAt = datetime('now')
    `).bind(userId).run();

    // Update recognition stats for receiver
    await db.prepare(`
      INSERT INTO user_recognition_stats (userId, recognitionsReceived, totalXpFromRecognition, lastReceivedAt)
      VALUES (?, 1, ?, datetime('now'))
      ON CONFLICT(userId) DO UPDATE SET
        recognitionsReceived = recognitionsReceived + 1,
        totalXpFromRecognition = totalXpFromRecognition + ?,
        lastReceivedAt = datetime('now'),
        updatedAt = datetime('now')
    `).bind(receiverId, xpReceiver, xpReceiver).run();

    // Update monthly limits
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db.prepare(`
      INSERT INTO recognition_limits (id, userId, periodType, periodStart, periodEnd, recognitionsGiven, maxAllowed)
      VALUES (?, ?, 'monthly', ?, ?, 1, ?)
      ON CONFLICT(userId, periodType, periodStart) DO UPDATE SET
        recognitionsGiven = recognitionsGiven + 1
    `).bind(
      generateId(),
      userId,
      periodStart.toISOString().slice(0, 10),
      periodEnd.toISOString().slice(0, 10),
      XP_CONFIG.MONTHLY_LIMIT
    ).run();

    // Create notification for receiver
    await db.prepare(`
      INSERT INTO notifications (id, userId, type, title, message, actorId, actorName, actorAvatar, link, resourceId, resourceType, priority)
      VALUES (?, ?, 'recognition_received', ?, ?, ?, ?, ?, ?, ?, 'recognition', 'high')
    `).bind(
      generateId(),
      receiverId,
      `You were recognized for ${(category as any).name}!`,
      `${(giver as any)?.displayName || 'A colleague'} recognized you: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
      userId,
      (giver as any)?.displayName,
      (giver as any)?.avatar,
      `/recognition?highlight=${recognitionId}`,
      recognitionId
    ).run();

    // Check for badge milestones (giver)
    const giverStats = await db.prepare(`
      SELECT recognitionsGiven FROM user_recognition_stats WHERE userId = ?
    `).bind(userId).first();

    const givenCount = (giverStats as any)?.recognitionsGiven || 1;

    // Award badges based on milestones
    if (givenCount === 1) {
      await db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, userId, badgeId, earnedAt)
        VALUES (?, ?, 'badge-first-recognition', datetime('now'))
      `).bind(generateId(), userId).run();
    } else if (givenCount === 5) {
      await db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, userId, badgeId, earnedAt)
        VALUES (?, ?, 'badge-recognition-giver-5', datetime('now'))
      `).bind(generateId(), userId).run();
    } else if (givenCount === 25) {
      await db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, userId, badgeId, earnedAt)
        VALUES (?, ?, 'badge-recognition-giver-25', datetime('now'))
      `).bind(generateId(), userId).run();
    } else if (givenCount === 100) {
      await db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, userId, badgeId, earnedAt)
        VALUES (?, ?, 'badge-recognition-giver-100', datetime('now'))
      `).bind(generateId(), userId).run();
    }

    // Check for badge milestones (receiver)
    const receiverStats = await db.prepare(`
      SELECT recognitionsReceived FROM user_recognition_stats WHERE userId = ?
    `).bind(receiverId).first();

    const receivedCount = (receiverStats as any)?.recognitionsReceived || 1;

    if (receivedCount === 1) {
      await db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, userId, badgeId, earnedAt)
        VALUES (?, ?, 'badge-first-received', datetime('now'))
      `).bind(generateId(), receiverId).run();
    } else if (receivedCount === 10) {
      await db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, userId, badgeId, earnedAt)
        VALUES (?, ?, 'badge-recognition-received-10', datetime('now'))
      `).bind(generateId(), receiverId).run();
    } else if (receivedCount === 50) {
      await db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, userId, badgeId, earnedAt)
        VALUES (?, ?, 'badge-recognition-received-50', datetime('now'))
      `).bind(generateId(), receiverId).run();
    } else if (receivedCount === 100) {
      await db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, userId, badgeId, earnedAt)
        VALUES (?, ?, 'badge-recognition-received-100', datetime('now'))
      `).bind(generateId(), receiverId).run();
    }

    // Check for multi-category badge
    const categoryCount = await db.prepare(`
      SELECT COUNT(DISTINCT categoryId) as count FROM recognitions WHERE receiverId = ?
    `).bind(receiverId).first();

    if ((categoryCount as any)?.count >= 5) {
      await db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, userId, badgeId, earnedAt)
        VALUES (?, ?, 'badge-multi-category', datetime('now'))
      `).bind(generateId(), receiverId).run();
    }

    return c.json({
      recognition: {
        id: recognitionId,
        message,
        isPublic,
        xpAwarded: xpReceiver,
        giverXpAwarded: xpGiver,
        wallPostId,
        createdAt: new Date().toISOString(),
        giver: {
          id: userId,
          displayName: (giver as any)?.displayName,
          avatar: (giver as any)?.avatar,
        },
        receiver: {
          id: receiverId,
          displayName: (receiver as any)?.displayName,
          avatar: (receiver as any)?.avatar,
        },
        category: {
          id: categoryId,
          name: (category as any).name,
          slug: (category as any).slug,
          icon: (category as any).icon,
          color: (category as any).color,
        },
      },
      remaining: XP_CONFIG.MONTHLY_LIMIT - monthlyGiven - 1,
    }, 201);
  } catch (error) {
    console.error('Error creating recognition:', error);
    return c.json({ error: 'Failed to create recognition' }, 500);
  }
});

// =============================================
// POST /recognition/:id/endorse - Manager endorsement
// =============================================
recognition.post('/:id/endorse', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;
  const userRole = user?.role || 'user';
  const recognitionId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { comment } = body;

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!canEndorse(userRole)) {
    return c.json({ error: 'Only managers and directors can endorse recognitions' }, 403);
  }

  try {
    // Check recognition exists
    const recognition = await db.prepare(`
      SELECT * FROM recognitions WHERE id = ?
    `).bind(recognitionId).first();

    if (!recognition) {
      return c.json({ error: 'Recognition not found' }, 404);
    }

    // Check not already endorsed by this user
    const existing = await db.prepare(`
      SELECT id FROM recognition_endorsements WHERE recognitionId = ? AND endorserId = ?
    `).bind(recognitionId, userId).first();

    if (existing) {
      return c.json({ error: 'You have already endorsed this recognition' }, 400);
    }

    // Cannot endorse own recognition
    if ((recognition as any).giverId === userId || (recognition as any).receiverId === userId) {
      return c.json({ error: 'You cannot endorse your own recognition' }, 400);
    }

    const endorsementId = generateId();
    const bonusXp = XP_CONFIG.ENDORSEMENT_BONUS_RECEIVER;

    // Get endorser info
    const endorser = await db.prepare(`
      SELECT displayName, avatar FROM users WHERE id = ?
    `).bind(userId).first();

    // Create endorsement
    await db.prepare(`
      INSERT INTO recognition_endorsements (id, recognitionId, endorserId, endorserRole, comment, bonusXpAwarded)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(endorsementId, recognitionId, userId, userRole, comment || null, bonusXp).run();

    // Award bonus XP to receiver
    await db.prepare(`
      INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId)
      VALUES (?, ?, ?, 'Manager endorsement bonus', 'endorsement', ?)
    `).bind(generateId(), (recognition as any).receiverId, bonusXp, endorsementId).run();

    await db.prepare(`
      UPDATE user_stats SET totalXp = totalXp + ? WHERE userId = ?
    `).bind(bonusXp, (recognition as any).receiverId).run();

    // Update recognition stats
    await db.prepare(`
      UPDATE user_recognition_stats SET
        endorsementsReceived = endorsementsReceived + 1,
        totalXpFromRecognition = totalXpFromRecognition + ?
      WHERE userId = ?
    `).bind(bonusXp, (recognition as any).receiverId).run();

    // Notify receiver
    await db.prepare(`
      INSERT INTO notifications (id, userId, type, title, message, actorId, actorName, actorAvatar, link, resourceId, resourceType, priority)
      VALUES (?, ?, 'recognition_endorsed', ?, ?, ?, ?, ?, ?, ?, 'recognition', 'high')
    `).bind(
      generateId(),
      (recognition as any).receiverId,
      'Your recognition was endorsed!',
      `${(endorser as any)?.displayName || 'A manager'} endorsed your recognition (+${bonusXp} XP bonus)`,
      userId,
      (endorser as any)?.displayName,
      (endorser as any)?.avatar,
      `/recognition?highlight=${recognitionId}`,
      recognitionId
    ).run();

    // Check for endorsement badge
    const endorsementCount = await db.prepare(`
      SELECT endorsementsReceived FROM user_recognition_stats WHERE userId = ?
    `).bind((recognition as any).receiverId).first();

    if ((endorsementCount as any)?.endorsementsReceived === 1) {
      await db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, userId, badgeId, earnedAt)
        VALUES (?, ?, 'badge-endorsed', datetime('now'))
      `).bind(generateId(), (recognition as any).receiverId).run();
    }

    return c.json({
      endorsement: {
        id: endorsementId,
        recognitionId,
        endorserRole: userRole,
        comment,
        bonusXpAwarded: bonusXp,
        createdAt: new Date().toISOString(),
        endorser: {
          id: userId,
          displayName: (endorser as any)?.displayName,
          avatar: (endorser as any)?.avatar,
        },
      },
    }, 201);
  } catch (error) {
    console.error('Error endorsing recognition:', error);
    return c.json({ error: 'Failed to endorse recognition' }, 500);
  }
});

// =============================================
// GET /recognition/stats - Get current user's stats
// =============================================
recognition.get('/stats/me', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    let stats = await db.prepare(`
      SELECT urs.*, rc.name as mostReceivedCategoryName, rc.icon as mostReceivedCategoryIcon
      FROM user_recognition_stats urs
      LEFT JOIN recognition_categories rc ON urs.mostReceivedCategoryId = rc.id
      WHERE urs.userId = ?
    `).bind(userId).first();

    if (!stats) {
      stats = {
        userId,
        recognitionsGiven: 0,
        recognitionsReceived: 0,
        endorsementsReceived: 0,
        totalXpFromRecognition: 0,
        currentMonthGiven: 0,
      };
    }

    // Get category breakdown for received recognitions
    const { results: breakdown } = await db.prepare(`
      SELECT rc.id, rc.name, rc.slug, rc.icon, rc.color, COUNT(*) as count
      FROM recognitions r
      JOIN recognition_categories rc ON r.categoryId = rc.id
      WHERE r.receiverId = ?
      GROUP BY r.categoryId
      ORDER BY count DESC
    `).bind(userId).all();

    return c.json({
      ...stats,
      categoryBreakdown: breakdown || [],
    });
  } catch (error) {
    console.error('Error fetching recognition stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// =============================================
// GET /recognition/stats/:userId - Get user's public stats
// =============================================
recognition.get('/stats/:userId', optionalAuth, async (c) => {
  const db = c.env.DB;
  const targetUserId = c.req.param('userId');

  try {
    const stats = await db.prepare(`
      SELECT
        urs.recognitionsGiven,
        urs.recognitionsReceived,
        urs.endorsementsReceived,
        rc.name as mostReceivedCategoryName,
        rc.icon as mostReceivedCategoryIcon
      FROM user_recognition_stats urs
      LEFT JOIN recognition_categories rc ON urs.mostReceivedCategoryId = rc.id
      WHERE urs.userId = ?
    `).bind(targetUserId).first();

    if (!stats) {
      return c.json({
        userId: targetUserId,
        recognitionsGiven: 0,
        recognitionsReceived: 0,
        endorsementsReceived: 0,
      });
    }

    // Get category breakdown
    const { results: breakdown } = await db.prepare(`
      SELECT rc.id, rc.name, rc.slug, rc.icon, rc.color, COUNT(*) as count
      FROM recognitions r
      JOIN recognition_categories rc ON r.categoryId = rc.id
      WHERE r.receiverId = ?
      GROUP BY r.categoryId
      ORDER BY count DESC
      LIMIT 5
    `).bind(targetUserId).all();

    return c.json({
      ...stats,
      categoryBreakdown: breakdown || [],
    });
  } catch (error) {
    console.error('Error fetching user recognition stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// =============================================
// GET /recognition/limits - Get current user's limits
// =============================================
recognition.get('/limits', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = c.get('user')?.id;

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const limit = await db.prepare(`
      SELECT * FROM recognition_limits
      WHERE userId = ? AND periodType = 'monthly' AND periodStart >= ?
    `).bind(userId, periodStart.toISOString().slice(0, 10)).first();

    const recognitionsGiven = (limit as any)?.recognitionsGiven || 0;
    const maxAllowed = XP_CONFIG.MONTHLY_LIMIT;

    return c.json({
      userId,
      periodType: 'monthly',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      recognitionsGiven,
      maxAllowed,
      remaining: Math.max(0, maxAllowed - recognitionsGiven),
    });
  } catch (error) {
    console.error('Error fetching limits:', error);
    return c.json({ error: 'Failed to fetch limits' }, 500);
  }
});

// =============================================
// GET /recognition/leaderboard - Recognition leaderboard
// =============================================
recognition.get('/leaderboard', optionalAuth, async (c) => {
  const db = c.env.DB;
  const type = c.req.query('type') || 'received';
  const period = c.req.query('period') || 'monthly';
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

  try {
    let dateFilter = '';
    if (period === 'weekly') {
      dateFilter = "AND r.createdAt >= date('now', '-7 days')";
    } else if (period === 'monthly') {
      dateFilter = "AND r.createdAt >= date('now', '-30 days')";
    } else if (period === 'quarterly') {
      dateFilter = "AND r.createdAt >= date('now', '-90 days')";
    }
    // allTime = no filter

    const column = type === 'received' ? 'receiverId' : 'giverId';

    const query = `
      SELECT
        u.id as userId,
        u.displayName,
        u.avatar,
        u.jobTitle as title,
        u.department,
        m.name as mdaName,
        COUNT(*) as count
      FROM recognitions r
      JOIN users u ON r.${column} = u.id
      LEFT JOIN mdas m ON u.mdaId = m.id
      WHERE 1=1 ${dateFilter}
      GROUP BY r.${column}
      ORDER BY count DESC
      LIMIT ?
    `;

    const { results } = await db.prepare(query).bind(limit).all();

    return c.json({
      type,
      period,
      entries: (results || []).map((entry: any, index: number) => ({
        rank: index + 1,
        userId: entry.userId,
        count: entry.count,
        user: {
          id: entry.userId,
          displayName: entry.displayName,
          avatar: entry.avatar,
          title: entry.title,
          department: entry.department,
          mda: entry.mdaName,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json({ type, period, entries: [] });
  }
});

// =============================================
// GET /recognition/summary - Wall summary stats
// =============================================
recognition.get('/summary', optionalAuth, async (c) => {
  const db = c.env.DB;

  try {
    // Total counts
    const total = await db.prepare(`SELECT COUNT(*) as count FROM recognitions`).first();
    const thisWeek = await db.prepare(`
      SELECT COUNT(*) as count FROM recognitions WHERE createdAt >= date('now', '-7 days')
    `).first();
    const thisMonth = await db.prepare(`
      SELECT COUNT(*) as count FROM recognitions WHERE createdAt >= date('now', '-30 days')
    `).first();

    // Top categories this month
    const { results: topCategories } = await db.prepare(`
      SELECT rc.id, rc.name, rc.slug, rc.icon, rc.color, COUNT(*) as count
      FROM recognitions r
      JOIN recognition_categories rc ON r.categoryId = rc.id
      WHERE r.createdAt >= date('now', '-30 days')
      GROUP BY r.categoryId
      ORDER BY count DESC
      LIMIT 5
    `).all();

    // Recent highlighted recognitions
    const { results: highlights } = await db.prepare(`
      SELECT
        r.*,
        giver.displayName as giverName, giver.avatar as giverAvatar,
        receiver.displayName as receiverName, receiver.avatar as receiverAvatar,
        rc.name as categoryName, rc.icon as categoryIcon, rc.color as categoryColor
      FROM recognitions r
      JOIN users giver ON r.giverId = giver.id
      JOIN users receiver ON r.receiverId = receiver.id
      JOIN recognition_categories rc ON r.categoryId = rc.id
      WHERE r.isHighlighted = 1
      ORDER BY r.createdAt DESC
      LIMIT 5
    `).all();

    return c.json({
      totalRecognitions: (total as any)?.count || 0,
      totalThisWeek: (thisWeek as any)?.count || 0,
      totalThisMonth: (thisMonth as any)?.count || 0,
      topCategories: (topCategories || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        count: cat.count,
      })),
      recentHighlights: (highlights || []).map((r: any) => ({
        id: r.id,
        message: r.message,
        createdAt: r.createdAt,
        giver: { displayName: r.giverName, avatar: r.giverAvatar },
        receiver: { displayName: r.receiverName, avatar: r.receiverAvatar },
        category: { name: r.categoryName, icon: r.categoryIcon, color: r.categoryColor },
      })),
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return c.json({
      totalRecognitions: 0,
      totalThisWeek: 0,
      totalThisMonth: 0,
      topCategories: [],
      recentHighlights: [],
    });
  }
});

// =============================================
// GET /recognition/:id - Get single recognition
// NOTE: This route MUST come after all other specific GET routes to avoid catching them as IDs
// =============================================
recognition.get('/:id', optionalAuth, async (c) => {
  const db = c.env.DB;
  const recognitionId = c.req.param('id');

  try {
    const r = await db.prepare(`
      SELECT
        r.*,
        giver.displayName as giverName, giver.avatar as giverAvatar, giver.jobTitle as giverTitle,
        receiver.displayName as receiverName, receiver.avatar as receiverAvatar, receiver.jobTitle as receiverTitle,
        rc.name as categoryName, rc.slug as categorySlug, rc.icon as categoryIcon, rc.color as categoryColor
      FROM recognitions r
      JOIN users giver ON r.giverId = giver.id
      JOIN users receiver ON r.receiverId = receiver.id
      JOIN recognition_categories rc ON r.categoryId = rc.id
      WHERE r.id = ?
    `).bind(recognitionId).first();

    if (!r) {
      return c.json({ error: 'Recognition not found' }, 404);
    }

    // Get endorsements
    const { results: endorsements } = await db.prepare(`
      SELECT
        re.*,
        u.displayName as endorserName, u.avatar as endorserAvatar, u.jobTitle as endorserTitle
      FROM recognition_endorsements re
      JOIN users u ON re.endorserId = u.id
      WHERE re.recognitionId = ?
      ORDER BY re.createdAt DESC
    `).bind(recognitionId).all();

    return c.json({
      id: r.id,
      message: r.message,
      isPublic: !!r.isPublic,
      isHighlighted: !!r.isHighlighted,
      xpAwarded: r.xpAwarded,
      giverXpAwarded: r.giverXpAwarded,
      createdAt: r.createdAt,
      giver: {
        id: r.giverId,
        displayName: r.giverName,
        avatar: r.giverAvatar,
        title: r.giverTitle,
      },
      receiver: {
        id: r.receiverId,
        displayName: r.receiverName,
        avatar: r.receiverAvatar,
        title: r.receiverTitle,
      },
      category: {
        id: r.categoryId,
        name: r.categoryName,
        slug: r.categorySlug,
        icon: r.categoryIcon,
        color: r.categoryColor,
      },
      endorsements: (endorsements || []).map((e: any) => ({
        id: e.id,
        endorserRole: e.endorserRole,
        comment: e.comment,
        bonusXpAwarded: e.bonusXpAwarded,
        createdAt: e.createdAt,
        endorser: {
          id: e.endorserId,
          displayName: e.endorserName,
          avatar: e.endorserAvatar,
          title: e.endorserTitle,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching recognition:', error);
    return c.json({ error: 'Failed to fetch recognition' }, 500);
  }
});

// =============================================
// POST /recognition/:id/highlight - Toggle highlight
// =============================================
recognition.post('/:id/highlight', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const userId = user?.id;
  const userRole = user?.role || 'user';
  const recognitionId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Only admins can highlight
  if (!['admin', 'super_admin', 'director'].includes(userRole)) {
    return c.json({ error: 'Only administrators can highlight recognitions' }, 403);
  }

  try {
    const recognition = await db.prepare(`
      SELECT id, isHighlighted FROM recognitions WHERE id = ?
    `).bind(recognitionId).first();

    if (!recognition) {
      return c.json({ error: 'Recognition not found' }, 404);
    }

    const newHighlighted = (recognition as any).isHighlighted ? 0 : 1;

    await db.prepare(`
      UPDATE recognitions SET isHighlighted = ? WHERE id = ?
    `).bind(newHighlighted, recognitionId).run();

    return c.json({
      id: recognitionId,
      isHighlighted: !!newHighlighted,
    });
  } catch (error) {
    console.error('Error toggling highlight:', error);
    return c.json({ error: 'Failed to update highlight' }, 500);
  }
});

export default recognition;
