// Route module exports
// Each route handles a specific domain of the API

export { authRoutes } from './auth';
export { documentsRoutes } from './documents';
export { bookmarksRoutes } from './bookmarks';
export { forumRoutes } from './forum';
export { gamificationRoutes } from './gamification';
export { chatRoutes } from './chat';
export { groupsRoutes } from './groups';
export { newsRoutes } from './news';
export { default as notificationsRoutes } from './notifications';
export { default as settingsRoutes } from './settings';
export { default as broadcastsRoutes } from './broadcasts';
export { counselorRoutes } from './counselor';
export { backupRoutes, createScheduledBackup } from './backup';
export { adminUsersRoutes } from './admin-users';
export { researchRoutes } from './research';

// Phase 1 Social Networking Routes
export { default as socialRoutes } from './social';
export { default as wallRoutes } from './wall';
export { default as dmRoutes } from './dm';
export { default as presenceRoutes } from './presence';

// Peer Recognition System
export { default as recognitionRoutes } from './recognition';

// AI Knowledge Assistant "Kwame"
export { default as kwameRoutes } from './kwame';

// Learning Management System (LMS)
export { default as lmsRoutes } from './lms';

// Placeholder exports - implement full functionality as needed
import { Hono } from 'hono';

// Users routes
export const usersRoutes = new Hono<{ Bindings: any }>();

// GET /users/me - Get current user profile
usersRoutes.get('/me', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userData = await c.env.DB.prepare(`
      SELECT
        u.id, u.email, u.displayName, u.firstName, u.lastName,
        u.avatar, u.bio, u.role, u.department, u.jobTitle as title,
        u.phone, u.location, u.website, u.gradeLevel,
        u.isVerified, u.isActive, u.createdAt,
        m.name as mdaName
      FROM users u
      LEFT JOIN mdas m ON u.mdaId = m.id
      WHERE u.id = ?
    `).bind(user.id).first();

    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: userData.id,
      email: userData.email,
      displayName: userData.displayName,
      firstName: userData.firstName,
      lastName: userData.lastName,
      avatar: userData.avatar,
      bio: userData.bio,
      role: userData.role,
      department: userData.department,
      title: userData.title,
      phone: userData.phone,
      location: userData.location,
      website: userData.website,
      gradeLevel: userData.gradeLevel,
      mda: userData.mdaName,
      isVerified: !!userData.isVerified,
      isActive: !!userData.isActive,
      createdAt: userData.createdAt
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// PUT /users/me - Update current user profile
usersRoutes.put('/me', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();

    // Build dynamic update query
    const allowedFields = [
      'displayName', 'firstName', 'lastName', 'bio', 'department',
      'jobTitle', 'phone', 'location', 'website', 'gradeLevel'
    ];

    // Map frontend field names to DB field names
    const fieldMapping: Record<string, string> = {
      name: 'displayName',
      title: 'jobTitle'
    };

    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(body)) {
      const dbField = fieldMapping[key] || key;
      if (allowedFields.includes(dbField) && value !== undefined) {
        updates.push(`${dbField} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updates.push('updatedAt = datetime("now")');
    values.push(user.id);

    await c.env.DB.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status)
      VALUES (?, ?, 'profile_update', 'Updated profile information', 'success')
    `).bind(crypto.randomUUID(), user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// GET /users/:id - Get user by ID (public profile)
usersRoutes.get('/:id', async (c) => {
  const userId = c.req.param('id');

  try {
    const userData = await c.env.DB.prepare(`
      SELECT
        u.id, u.displayName, u.avatar, u.bio, u.role,
        u.department, u.jobTitle as title, u.gradeLevel, u.createdAt,
        m.name as mdaName
      FROM users u
      LEFT JOIN mdas m ON u.mdaId = m.id
      WHERE u.id = ? AND u.isActive = 1
    `).bind(userId).first();

    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: userData.id,
      displayName: userData.displayName,
      avatar: userData.avatar,
      bio: userData.bio,
      role: userData.role,
      department: userData.department,
      title: userData.title,
      gradeLevel: userData.gradeLevel,
      mda: userData.mdaName,
      createdAt: userData.createdAt
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

usersRoutes.get('/', (c) => c.json({ message: 'Users endpoint' }));
usersRoutes.put('/:id', (c) => c.json({ message: 'Update user' }));
usersRoutes.get('/:id/activity', (c) => c.json({ message: 'User activity' }));
usersRoutes.get('/:id/badges', (c) => c.json({ message: 'User badges' }));

// Admin routes
export const adminRoutes = new Hono<{ Bindings: any }>();

// GET /admin/stats - Get dashboard statistics
adminRoutes.get('/stats', async (c) => {
  try {
    // Get total users count
    const usersResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE isActive = 1
    `).first();
    const totalUsers = (usersResult as any)?.count || 0;

    // Get users registered this month
    const usersThisMonth = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE isActive = 1 AND createdAt >= date('now', 'start of month')
    `).first();

    // Get users registered last month
    const usersLastMonth = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE isActive = 1
      AND createdAt >= date('now', 'start of month', '-1 month')
      AND createdAt < date('now', 'start of month')
    `).first();

    // Calculate users change percentage
    const thisMonthUsers = (usersThisMonth as any)?.count || 0;
    const lastMonthUsers = (usersLastMonth as any)?.count || 1;
    const usersChange = Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100);

    // Get total documents count
    const docsResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM documents WHERE status = 'published'
    `).first();
    const totalDocuments = (docsResult as any)?.count || 0;

    // Get documents this month
    const docsThisMonth = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM documents
      WHERE status = 'published' AND createdAt >= date('now', 'start of month')
    `).first();

    // Get documents last month
    const docsLastMonth = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM documents
      WHERE status = 'published'
      AND createdAt >= date('now', 'start of month', '-1 month')
      AND createdAt < date('now', 'start of month')
    `).first();

    const thisMonthDocs = (docsThisMonth as any)?.count || 0;
    const lastMonthDocs = (docsLastMonth as any)?.count || 1;
    const documentsChange = Math.round(((thisMonthDocs - lastMonthDocs) / lastMonthDocs) * 100);

    // Get total forum posts count
    const postsResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM forum_posts
    `).first();
    const forumPosts = (postsResult as any)?.count || 0;

    // Get forum posts this month
    const postsThisMonth = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM forum_posts
      WHERE createdAt >= date('now', 'start of month')
    `).first();

    // Get forum posts last month
    const postsLastMonth = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM forum_posts
      WHERE createdAt >= date('now', 'start of month', '-1 month')
      AND createdAt < date('now', 'start of month')
    `).first();

    const thisMonthPosts = (postsThisMonth as any)?.count || 0;
    const lastMonthPosts = (postsLastMonth as any)?.count || 1;
    const postsChange = Math.round(((thisMonthPosts - lastMonthPosts) / lastMonthPosts) * 100);

    // Get active users today (users who logged in today)
    const activeResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE isActive = 1 AND lastLoginAt >= date('now')
    `).first();
    const activeUsers = (activeResult as any)?.count || 0;

    // Get active users yesterday
    const activeYesterday = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE isActive = 1
      AND lastLoginAt >= date('now', '-1 day')
      AND lastLoginAt < date('now')
    `).first();

    const yesterdayActive = (activeYesterday as any)?.count || 1;
    const activeChange = Math.round(((activeUsers - yesterdayActive) / yesterdayActive) * 100);

    // Get monthly user growth data (last 12 months)
    const monthlyGrowth = await c.env.DB.prepare(`
      SELECT
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as count
      FROM users
      WHERE isActive = 1 AND createdAt >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month ASC
    `).all();

    // Get users by role
    const usersByRole = await c.env.DB.prepare(`
      SELECT role, COUNT(*) as count FROM users
      WHERE isActive = 1
      GROUP BY role
    `).all();

    // Get recent activity
    const recentActivity = await c.env.DB.prepare(`
      SELECT
        aa.action,
        aa.description,
        aa.createdAt,
        u.displayName
      FROM account_activity aa
      LEFT JOIN users u ON aa.userId = u.id
      ORDER BY aa.createdAt DESC
      LIMIT 10
    `).all();

    // Get top departments (MDAs)
    const topMDAs = await c.env.DB.prepare(`
      SELECT
        COALESCE(u.department, 'Unassigned') as name,
        COUNT(DISTINCT u.id) as users,
        COUNT(DISTINCT d.id) as documents
      FROM users u
      LEFT JOIN documents d ON d.authorId = u.id AND d.status = 'published'
      WHERE u.isActive = 1
      GROUP BY u.department
      ORDER BY users DESC
      LIMIT 5
    `).all();

    return c.json({
      stats: {
        totalUsers,
        usersChange: isNaN(usersChange) ? 0 : usersChange,
        totalDocuments,
        documentsChange: isNaN(documentsChange) ? 0 : documentsChange,
        forumPosts,
        postsChange: isNaN(postsChange) ? 0 : postsChange,
        activeUsers,
        activeChange: isNaN(activeChange) ? 0 : activeChange,
      },
      monthlyGrowth: monthlyGrowth.results || [],
      usersByRole: (usersByRole.results || []).map((r: any) => ({
        label: r.role || 'User',
        value: r.count,
        color: r.role === 'admin' ? '#006B3F' :
               r.role === 'director' ? '#FCD116' :
               r.role === 'staff' ? '#3B82F6' : '#10B981'
      })),
      recentActivity: (recentActivity.results || []).map((a: any) => ({
        type: a.action?.includes('user') ? 'user' :
              a.action?.includes('document') ? 'document' :
              a.action?.includes('forum') ? 'forum' :
              a.action?.includes('badge') ? 'badge' : 'alert',
        message: `${a.displayName || 'User'} ${a.description || a.action}`,
        time: a.createdAt ? new Date(a.createdAt).toLocaleString() : 'Recently'
      })),
      topMDAs: (topMDAs.results || []).map((m: any) => ({
        name: m.name || 'Unknown MDA',
        users: m.users || 0,
        documents: m.documents || 0
      }))
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return c.json({
      error: 'Failed to fetch statistics',
      details: error?.message || String(error),
      stats: {
        totalUsers: 0,
        usersChange: 0,
        totalDocuments: 0,
        documentsChange: 0,
        forumPosts: 0,
        postsChange: 0,
        activeUsers: 0,
        activeChange: 0,
      },
      monthlyGrowth: [],
      usersByRole: [],
      recentActivity: [],
      topMDAs: []
    }, 500);
  }
});

adminRoutes.get('/dashboard', (c) => c.json({ message: 'Admin dashboard' }));
adminRoutes.get('/users', (c) => c.json({ message: 'Manage users' }));
adminRoutes.get('/documents', (c) => c.json({ message: 'Manage documents' }));
adminRoutes.get('/forum', (c) => c.json({ message: 'Manage forum' }));
adminRoutes.get('/analytics', (c) => c.json({ message: 'Analytics' }));
adminRoutes.get('/audit-log', (c) => c.json({ message: 'Audit log' }));
adminRoutes.get('/settings', (c) => c.json({ message: 'System settings' }));
