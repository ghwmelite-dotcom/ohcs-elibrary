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
export { counselorRoutes } from './counselor';
export { backupRoutes, createScheduledBackup } from './backup';
export { adminUsersRoutes } from './admin-users';

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
export const adminRoutes = new Hono();
adminRoutes.get('/dashboard', (c) => c.json({ message: 'Admin dashboard' }));
adminRoutes.get('/users', (c) => c.json({ message: 'Manage users' }));
adminRoutes.get('/documents', (c) => c.json({ message: 'Manage documents' }));
adminRoutes.get('/forum', (c) => c.json({ message: 'Manage forum' }));
adminRoutes.get('/analytics', (c) => c.json({ message: 'Analytics' }));
adminRoutes.get('/audit-log', (c) => c.json({ message: 'Audit log' }));
adminRoutes.get('/settings', (c) => c.json({ message: 'System settings' }));
