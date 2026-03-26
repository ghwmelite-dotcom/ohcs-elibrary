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

  if (!c.get('userId')) {
    c.set('userId', 'guest');
    c.set('userRole', 'guest');
  }

  await next();
}

async function requireAuth(c: AppContext, next: Next) {
  const userId = c.get('userId');
  if (!userId || userId === 'guest') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
}

// Level thresholds
const LEVELS = [
  { level: 1, xpRequired: 0, title: 'Newcomer' },
  { level: 2, xpRequired: 100, title: 'Learner' },
  { level: 3, xpRequired: 300, title: 'Contributor' },
  { level: 4, xpRequired: 600, title: 'Active Member' },
  { level: 5, xpRequired: 1000, title: 'Rising Star' },
  { level: 6, xpRequired: 1500, title: 'Established' },
  { level: 7, xpRequired: 2500, title: 'Expert' },
  { level: 8, xpRequired: 4000, title: 'Mentor' },
  { level: 9, xpRequired: 6000, title: 'Master' },
  { level: 10, xpRequired: 10000, title: 'Grandmaster' },
];

function getLevelFromXp(xp: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) {
      level = l;
    } else {
      break;
    }
  }
  return level;
}

function getNextLevel(currentLevel: number) {
  return LEVELS.find((l) => l.level === currentLevel + 1) || LEVELS[LEVELS.length - 1];
}

export const gamificationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

gamificationRoutes.use('*', optionalAuth);

// GET /gamification/stats - Get user's gamification stats
gamificationRoutes.get('/stats', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;

    // Get or create user stats
    let stats = await DB.prepare(`
      SELECT * FROM user_stats WHERE userId = ?
    `).bind(userId).first();

    if (!stats) {
      // Create default stats
      await DB.prepare(`
        INSERT INTO user_stats (userId, totalXp, level, documentsRead, forumPosts, forumTopics, bestAnswers, badgesEarned)
        VALUES (?, 0, 1, 0, 0, 0, 0, 0)
      `).bind(userId).run();

      stats = {
        userId,
        totalXp: 0,
        level: 1,
        documentsRead: 0,
        forumPosts: 0,
        forumTopics: 0,
        bestAnswers: 0,
        badgesEarned: 0,
      };
    }

    // Get streak info
    let streak = await DB.prepare(`
      SELECT * FROM user_streaks WHERE userId = ?
    `).bind(userId).first();

    if (!streak) {
      await DB.prepare(`
        INSERT INTO user_streaks (userId, currentStreak, longestStreak, lastActivityDate)
        VALUES (?, 0, 0, date('now'))
      `).bind(userId).run();

      streak = {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString().split('T')[0],
      };
    }

    // Get badge count
    const badgeCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM user_badges WHERE userId = ?
    `).bind(userId).first<{ count: number }>();

    // Calculate level info
    const levelInfo = getLevelFromXp(stats.totalXp as number);
    const nextLevel = getNextLevel(levelInfo.level);
    const xpForCurrentLevel = levelInfo.xpRequired;
    const xpForNextLevel = nextLevel.xpRequired;
    const xpProgress = stats.totalXp as number - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    return c.json({
      ...stats,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      nextLevelTitle: nextLevel.title,
      xpProgress,
      xpNeeded,
      progressPercent: Math.min(100, Math.round((xpProgress / xpNeeded) * 100)),
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      badgesEarned: badgeCount?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// GET /gamification/leaderboard - Get leaderboard
gamificationRoutes.get('/leaderboard', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const period = c.req.query('period') || 'all';
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);

    let dateFilter = '';
    if (period === 'daily') {
      dateFilter = "AND xt.createdAt >= date('now')";
    } else if (period === 'weekly') {
      dateFilter = "AND xt.createdAt >= date('now', '-7 days')";
    } else if (period === 'monthly') {
      dateFilter = "AND xt.createdAt >= date('now', '-30 days')";
    }

    let query: string;
    if (period === 'all') {
      query = `
        SELECT
          u.id,
          u.displayName,
          u.avatar,
          us.totalXp as xp,
          us.level,
          us.badgesEarned
        FROM user_stats us
        INNER JOIN users u ON us.userId = u.id
        ORDER BY us.totalXp DESC
        LIMIT ?
      `;
    } else {
      query = `
        SELECT
          u.id,
          u.displayName,
          u.avatar,
          COALESCE(SUM(xt.amount), 0) as xp,
          us.level,
          us.badgesEarned
        FROM users u
        LEFT JOIN xp_transactions xt ON u.id = xt.userId ${dateFilter}
        LEFT JOIN user_stats us ON u.id = us.userId
        GROUP BY u.id
        HAVING xp > 0
        ORDER BY xp DESC
        LIMIT ?
      `;
    }

    const { results } = await DB.prepare(query).bind(limit).all();

    const leaderboard = (results || []).map((user: any, index: number) => ({
      rank: index + 1,
      ...user,
      levelInfo: getLevelFromXp(user.xp || 0),
    }));

    return c.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json([]);
  }
});

// GET /gamification/badges - Get all badges
gamificationRoutes.get('/badges', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');

    const { results } = await DB.prepare(`
      SELECT
        b.*,
        ub.earnedAt,
        CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as earned
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badgeId AND ub.userId = ?
      ORDER BY b.category, b.rarity DESC
    `).bind(userId === 'guest' ? '' : userId).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return c.json([]);
  }
});

// GET /gamification/badges/user - Get user's earned badges
gamificationRoutes.get('/badges/user', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;

    const { results } = await DB.prepare(`
      SELECT b.*, ub.earnedAt
      FROM user_badges ub
      INNER JOIN badges b ON ub.badgeId = b.id
      WHERE ub.userId = ?
      ORDER BY ub.earnedAt DESC
    `).bind(userId).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return c.json([]);
  }
});

// GET /gamification/xp-history - Get XP transaction history
gamificationRoutes.get('/xp-history', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

    const { results } = await DB.prepare(`
      SELECT * FROM xp_transactions
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching XP history:', error);
    return c.json([]);
  }
});

// GET /gamification/activity - Get activity feed
gamificationRoutes.get('/activity', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);

    const { results } = await DB.prepare(`
      SELECT * FROM activity_log
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return c.json([]);
  }
});

// GET /gamification/levels - Get all levels info
gamificationRoutes.get('/levels', (c: AppContext) => {
  return c.json(LEVELS);
});

// GET /gamification/achievements - Get all achievements with user progress
gamificationRoutes.get('/achievements', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');

    const { results } = await DB.prepare(`
      SELECT
        a.*,
        ua.earnedAt,
        ua.isNew,
        CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as earned
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievementId AND ua.userId = ?
      WHERE a.isHidden = 0 OR ua.id IS NOT NULL
      ORDER BY a.category, a.triggerValue
    `).bind(userId === 'guest' ? '' : userId).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return c.json([]);
  }
});

// GET /gamification/challenges - Get active weekly challenges
gamificationRoutes.get('/challenges', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');
    const today = new Date().toISOString().split('T')[0];

    const { results } = await DB.prepare(`
      SELECT
        wc.*,
        COALESCE(ucp.currentProgress, 0) as currentProgress,
        COALESCE(ucp.isCompleted, 0) as isCompleted,
        ucp.completedAt
      FROM weekly_challenges wc
      LEFT JOIN user_challenge_progress ucp ON wc.id = ucp.challengeId AND ucp.userId = ?
      WHERE wc.isActive = 1
        AND wc.startDate <= ?
        AND wc.endDate >= ?
      ORDER BY wc.endDate
    `).bind(userId === 'guest' ? '' : userId, today, today).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return c.json([]);
  }
});

// POST /gamification/challenges/:id/progress - Update challenge progress
gamificationRoutes.post('/challenges/:id/progress', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const challengeId = c.req.param('id');
    const { progress } = await c.req.json();

    // Get challenge details
    const challenge = await DB.prepare(`
      SELECT * FROM weekly_challenges WHERE id = ?
    `).bind(challengeId).first<{ targetValue: number; xpReward: number }>();

    if (!challenge) {
      return c.json({ error: 'Challenge not found' }, 404);
    }

    const isCompleted = progress >= challenge.targetValue;

    await DB.prepare(`
      INSERT INTO user_challenge_progress (userId, challengeId, currentProgress, isCompleted, completedAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(userId, challengeId) DO UPDATE SET
        currentProgress = ?,
        isCompleted = ?,
        completedAt = CASE WHEN ? = 1 AND isCompleted = 0 THEN datetime('now') ELSE completedAt END,
        updatedAt = datetime('now')
    `).bind(
      userId, challengeId, progress, isCompleted ? 1 : 0, isCompleted ? new Date().toISOString() : null,
      progress, isCompleted ? 1 : 0, isCompleted ? 1 : 0
    ).run();

    // Award XP if just completed
    if (isCompleted) {
      // Check if XP was already awarded
      const existing = await DB.prepare(`
        SELECT id FROM xp_transactions
        WHERE userId = ? AND referenceId = ? AND referenceType = 'challenge'
      `).bind(userId, challengeId).first();

      if (!existing) {
        await DB.prepare(`
          INSERT INTO xp_transactions (id, userId, amount, reason, referenceId, referenceType)
          VALUES (?, ?, ?, 'Challenge completed', ?, 'challenge')
        `).bind(crypto.randomUUID(), userId, challenge.xpReward, challengeId).run();

        await DB.prepare(`
          UPDATE user_stats SET totalXp = totalXp + ? WHERE userId = ?
        `).bind(challenge.xpReward, userId).run();
      }
    }

    return c.json({ success: true, isCompleted, progress });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return c.json({ error: 'Failed to update progress' }, 500);
  }
});

// GET /gamification/mda-leaderboard - Get MDA rankings
gamificationRoutes.get('/mda-leaderboard', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);

    // Calculate MDA stats from user data
    const { results } = await DB.prepare(`
      SELECT
        m.id as mdaId,
        m.name as mdaName,
        m.abbreviation,
        COUNT(DISTINCT u.id) as memberCount,
        COALESCE(SUM(us.totalXp), 0) as totalXp,
        COALESCE(AVG(us.totalXp), 0) as avgXp,
        COALESCE(SUM(us.documentsRead), 0) as documentsRead,
        COALESCE(SUM(us.forumPosts + us.forumTopics), 0) as forumActivity
      FROM mdas m
      LEFT JOIN users u ON u.mdaId = m.id
      LEFT JOIN user_stats us ON u.id = us.userId
      GROUP BY m.id
      HAVING memberCount > 0
      ORDER BY totalXp DESC
      LIMIT ?
    `).bind(limit).all();

    const leaderboard = (results || []).map((entry: any, index: number) => ({
      rank: index + 1,
      ...entry,
      avgXp: Math.round(entry.avgXp || 0),
    }));

    return c.json(leaderboard);
  } catch (error) {
    console.error('Error fetching MDA leaderboard:', error);
    return c.json([]);
  }
});

// GET /gamification/user-rank - Get user's rank with change tracking
gamificationRoutes.get('/user-rank', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const scope = c.req.query('scope') || 'national'; // 'national' or 'mda'

    // Get user's current rank
    let rankQuery: string;
    if (scope === 'mda') {
      const user = await DB.prepare(`
        SELECT mdaId FROM users WHERE id = ?
      `).bind(userId).first<{ mdaId: string }>();

      if (!user?.mdaId) {
        return c.json({ rank: 0, totalUsers: 0, change: 0, percentile: 0 });
      }

      rankQuery = `
        SELECT COUNT(*) + 1 as rank
        FROM user_stats us
        INNER JOIN users u ON us.userId = u.id
        WHERE u.mdaId = ? AND us.totalXp > (
          SELECT COALESCE(totalXp, 0) FROM user_stats WHERE userId = ?
        )
      `;
      const rankResult = await DB.prepare(rankQuery).bind(user.mdaId, userId).first<{ rank: number }>();
      const totalResult = await DB.prepare(`
        SELECT COUNT(*) as total FROM users WHERE mdaId = ?
      `).bind(user.mdaId).first<{ total: number }>();

      const rank = rankResult?.rank || 1;
      const total = totalResult?.total || 1;
      const percentile = Math.round(((total - rank + 1) / total) * 100);

      return c.json({
        rank,
        totalUsers: total,
        change: 0,
        percentile,
        scope: 'mda',
      });
    } else {
      rankQuery = `
        SELECT COUNT(*) + 1 as rank
        FROM user_stats
        WHERE totalXp > (
          SELECT COALESCE(totalXp, 0) FROM user_stats WHERE userId = ?
        )
      `;
      const rankResult = await DB.prepare(rankQuery).bind(userId).first<{ rank: number }>();
      const totalResult = await DB.prepare(`
        SELECT COUNT(*) as total FROM user_stats
      `).first<{ total: number }>();

      const rank = rankResult?.rank || 1;
      const total = totalResult?.total || 1;
      const percentile = Math.round(((total - rank + 1) / total) * 100);

      return c.json({
        rank,
        totalUsers: total,
        change: 0,
        percentile,
        scope: 'national',
      });
    }
  } catch (error) {
    console.error('Error fetching user rank:', error);
    return c.json({ rank: 0, totalUsers: 0, change: 0, percentile: 0 });
  }
});

// GET /gamification/activity-heatmap - Get user activity for last 90 days
gamificationRoutes.get('/activity-heatmap', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;

    // Get activity for last 90 days
    const { results } = await DB.prepare(`
      SELECT
        date(createdAt) as date,
        SUM(amount) as xpEarned,
        COUNT(*) as activityCount
      FROM xp_transactions
      WHERE userId = ?
        AND createdAt >= date('now', '-90 days')
      GROUP BY date(createdAt)
      ORDER BY date ASC
    `).bind(userId).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching activity heatmap:', error);
    return c.json([]);
  }
});

// GET /gamification/quick-stats - Get quick overview stats
gamificationRoutes.get('/quick-stats', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;

    // Get various quick stats in parallel
    const [stats, streak, badges, xpToday, rank] = await Promise.all([
      DB.prepare(`SELECT * FROM user_stats WHERE userId = ?`).bind(userId).first(),
      DB.prepare(`SELECT currentStreak, longestStreak FROM user_streaks WHERE userId = ?`).bind(userId).first(),
      DB.prepare(`SELECT COUNT(*) as count FROM user_badges WHERE userId = ?`).bind(userId).first(),
      DB.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM xp_transactions
        WHERE userId = ? AND date(createdAt) = date('now')
      `).bind(userId).first(),
      DB.prepare(`
        SELECT COUNT(*) + 1 as rank FROM user_stats
        WHERE totalXp > (SELECT COALESCE(totalXp, 0) FROM user_stats WHERE userId = ?)
      `).bind(userId).first(),
    ]);

    const totalXp = (stats as any)?.totalXp || 0;
    const levelInfo = getLevelFromXp(totalXp);
    const nextLevel = getNextLevel(levelInfo.level);

    return c.json({
      totalXp,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      xpToNextLevel: nextLevel.xpRequired - totalXp,
      xpProgress: Math.round(((totalXp - levelInfo.xpRequired) / (nextLevel.xpRequired - levelInfo.xpRequired)) * 100),
      currentStreak: (streak as any)?.currentStreak || 0,
      longestStreak: (streak as any)?.longestStreak || 0,
      badgesEarned: (badges as any)?.count || 0,
      xpToday: (xpToday as any)?.total || 0,
      rank: (rank as any)?.rank || 1,
      documentsRead: (stats as any)?.documentsRead || 0,
      forumPosts: ((stats as any)?.forumPosts || 0) + ((stats as any)?.forumTopics || 0),
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    return c.json({});
  }
});

// POST /gamification/streak - Update streak (called on login)
gamificationRoutes.post('/streak', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const today = new Date().toISOString().split('T')[0];

    // Get current streak
    const streak = await DB.prepare(`
      SELECT * FROM user_streaks WHERE userId = ?
    `).bind(userId).first<{
      currentStreak: number;
      longestStreak: number;
      lastActivityDate: string;
    }>();

    if (!streak) {
      // Create new streak
      await DB.prepare(`
        INSERT INTO user_streaks (userId, currentStreak, longestStreak, lastActivityDate)
        VALUES (?, 1, 1, ?)
      `).bind(userId, today).run();

      return c.json({ currentStreak: 1, longestStreak: 1 });
    }

    const lastDate = new Date(streak.lastActivityDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = streak.currentStreak;
    let longestStreak = streak.longestStreak;

    if (diffDays === 0) {
      // Already logged in today
      return c.json({ currentStreak: newStreak, longestStreak });
    } else if (diffDays === 1) {
      // Consecutive day
      newStreak += 1;
      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }
    } else {
      // Streak broken
      newStreak = 1;
    }

    await DB.prepare(`
      UPDATE user_streaks
      SET currentStreak = ?, longestStreak = ?, lastActivityDate = ?, updatedAt = datetime('now')
      WHERE userId = ?
    `).bind(newStreak, longestStreak, today, userId).run();

    // Award streak badges
    if (newStreak === 7) {
      try {
        await DB.prepare(`
          INSERT OR IGNORE INTO user_badges (userId, badgeId, earnedAt)
          VALUES (?, 'badge-7-streak', datetime('now'))
        `).bind(userId).run();
      } catch (e) {
        console.log('Could not award streak badge:', e);
      }
    } else if (newStreak === 30) {
      try {
        await DB.prepare(`
          INSERT OR IGNORE INTO user_badges (userId, badgeId, earnedAt)
          VALUES (?, 'badge-30-streak', datetime('now'))
        `).bind(userId).run();
      } catch (e) {
        console.log('Could not award streak badge:', e);
      }
    }

    return c.json({ currentStreak: newStreak, longestStreak });
  } catch (error) {
    console.error('Error updating streak:', error);
    return c.json({ error: 'Failed to update streak' }, 500);
  }
});
