import { Hono } from 'hono';
import type { Context } from 'hono';
import { verify } from 'hono/jwt';
import { blacklistToken } from '../middleware/auth';

interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
}

interface Variables {
  userId: string;
  userRole: string;
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export const adminUsersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// All available permissions
const ALL_PERMISSIONS = [
  // Dashboard
  'view_admin_dashboard',
  // Users
  'view_users',
  'create_users',
  'edit_users',
  'delete_users',
  'manage_user_roles',
  // Documents
  'view_documents',
  'upload_documents',
  'edit_documents',
  'delete_documents',
  'approve_documents',
  // Forum
  'view_forum_admin',
  'moderate_forum',
  'delete_forum_posts',
  'manage_forum_categories',
  // Chat
  'view_chat_admin',
  'moderate_chat',
  'delete_chat_messages',
  // Groups
  'view_groups_admin',
  'create_groups',
  'edit_groups',
  'delete_groups',
  // News
  'view_news_admin',
  'manage_news_sources',
  'edit_articles',
  'delete_articles',
  // Analytics
  'view_analytics',
  'export_reports',
  // Settings
  'view_settings',
  'edit_settings',
  // Backup
  'manage_backups',
  'restore_backups',
  // Audit
  'view_audit_logs',
  // Wellness/Counselor
  'view_wellness_admin',
  'manage_wellness_resources',
  'view_escalations',
  'manage_counselors',
];

// Check if user is admin
function requireAdmin(c: AppContext): boolean {
  const user = c.get('user') as { role?: string } | undefined;
  const role = user?.role;
  return typeof role === 'string' && ['admin', 'super_admin', 'director'].includes(role);
}

// Check if user has a specific permission
async function hasPermission(db: D1Database, userId: string, permission: string): Promise<boolean> {
  const result = await db.prepare(
    'SELECT 1 FROM user_permissions WHERE userId = ? AND permission = ? AND granted = 1'
  ).bind(userId, permission).first();
  return !!result;
}

// Log an audit event
async function logAudit(
  db: D1Database,
  c: AppContext,
  action: string,
  category: string,
  severity: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    const adminUser = c.get('user') as { id?: string; email?: string; role?: string } | undefined;
    await db.prepare(`
      INSERT INTO audit_logs (id, userId, userEmail, userRole, action, category, severity, resourceType, resourceId, metadata, ipAddress, userAgent, requestMethod, requestPath, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      adminUser?.id || c.get('userId') || null,
      adminUser?.email || null,
      adminUser?.role || null,
      action,
      category,
      severity,
      resourceType,
      resourceId,
      JSON.stringify(details),
      c.req.header('cf-connecting-ip') || 'unknown',
      c.req.header('user-agent') || 'unknown',
      c.req.method,
      c.req.path
    ).run();
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// GET /admin/users - List all users with pagination
adminUsersRoutes.get('/', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const { DB } = c.env;
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const role = url.searchParams.get('role') || 'all';
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (u.displayName LIKE ? OR u.email LIKE ? OR u.firstName LIKE ? OR u.lastName LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status !== 'all') {
      if (status === 'active') {
        whereClause += ' AND u.isActive = 1';
      } else if (status === 'inactive') {
        whereClause += ' AND u.isActive = 0';
      } else if (status === 'suspended') {
        whereClause += ' AND u.isSuspended = 1';
      } else if (status === 'pending') {
        whereClause += ' AND u.isVerified = 0';
      }
    }

    if (role !== 'all') {
      whereClause += ' AND u.role = ?';
      params.push(role);
    }

    // Get total count
    const countResult = await DB.prepare(`
      SELECT COUNT(*) as total FROM users u WHERE ${whereClause}
    `).bind(...params).first();

    // Get users
    const { results: users } = await DB.prepare(`
      SELECT
        u.id, u.email, u.displayName, u.firstName, u.lastName,
        u.avatar, u.role, u.department, u.jobTitle,
        u.isActive, u.isVerified, u.isSuspended,
        u.lastLoginAt, u.createdAt,
        m.name as mdaName,
        COALESCE(x.xp, 0) as xp,
        COALESCE(x.level, 1) as level
      FROM users u
      LEFT JOIN mdas m ON u.mdaId = m.id
      LEFT JOIN user_xp x ON u.id = x.userId
      WHERE ${whereClause}
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    // Get permissions for each user
    const usersWithPermissions = await Promise.all(
      users.map(async (user: any) => {
        const { results: permissions } = await DB.prepare(`
          SELECT permission, granted FROM user_permissions WHERE userId = ?
        `).bind(user.id).all();

        return {
          ...user,
          name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
          mda: user.mdaName || 'Not assigned',
          title: user.jobTitle,
          status: user.isSuspended ? 'suspended' : !user.isVerified ? 'pending' : user.isActive ? 'active' : 'inactive',
          lastLogin: user.lastLoginAt || user.createdAt,
          permissions: permissions.reduce((acc: Record<string, boolean>, p: any) => {
            acc[p.permission] = !!p.granted;
            return acc;
          }, {}),
        };
      })
    );

    return c.json({
      users: usersWithPermissions,
      pagination: {
        page,
        limit,
        total: (countResult as any)?.total || 0,
        totalPages: Math.ceil(((countResult as any)?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// GET /admin/users/:id - Get single user details
adminUsersRoutes.get('/:id', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const { DB } = c.env;
    const userId = c.req.param('id');

    const user = await DB.prepare(`
      SELECT
        u.id, u.email, u.displayName, u.firstName, u.lastName,
        u.avatar, u.role, u.department, u.jobTitle, u.bio,
        u.phone, u.location, u.gradeLevel,
        u.isActive, u.isVerified, u.isSuspended,
        u.lastLoginAt, u.createdAt, u.updatedAt,
        m.name as mdaName, m.id as mdaId,
        COALESCE(x.xp, 0) as xp,
        COALESCE(x.level, 1) as level
      FROM users u
      LEFT JOIN mdas m ON u.mdaId = m.id
      LEFT JOIN user_xp x ON u.id = x.userId
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get permissions
    const { results: permissions } = await DB.prepare(`
      SELECT permission, granted, grantedBy, createdAt
      FROM user_permissions WHERE userId = ?
    `).bind(userId).all();

    return c.json({
      ...user,
      permissions: permissions.reduce((acc: Record<string, boolean>, p: any) => {
        acc[p.permission] = !!p.granted;
        return acc;
      }, {}),
      permissionsList: permissions,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// PUT /admin/users/:id - Update user
adminUsersRoutes.put('/:id', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const { DB } = c.env;
    const userId = c.req.param('id');
    const body = await c.req.json();
    const adminId = c.get('userId');
    const user = c.get('user') as any;

    // Permission check - super_admin bypasses
    if (user.role !== 'super_admin') {
      const permitted = await hasPermission(DB, user.id, 'edit_users');
      if (!permitted) return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const { role, isActive, isSuspended, permissions, ...profileData } = body;

    // Update basic profile fields
    const allowedFields = ['displayName', 'firstName', 'lastName', 'department', 'jobTitle', 'bio', 'phone', 'location', 'gradeLevel'];
    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(profileData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    // Update role if provided
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    // Update status flags
    if (isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(isActive ? 1 : 0);
    }

    if (isSuspended !== undefined) {
      updates.push('isSuspended = ?');
      values.push(isSuspended ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = datetime("now")');
      values.push(userId);

      await DB.prepare(`
        UPDATE users SET ${updates.join(', ')} WHERE id = ?
      `).bind(...values).run();
    }

    // Update permissions if provided
    if (permissions && typeof permissions === 'object') {
      // Delete existing permissions
      await DB.prepare('DELETE FROM user_permissions WHERE userId = ?').bind(userId).run();

      // Insert new permissions
      for (const [permission, granted] of Object.entries(permissions)) {
        if (ALL_PERMISSIONS.includes(permission)) {
          await DB.prepare(`
            INSERT INTO user_permissions (id, userId, permission, granted, grantedBy)
            VALUES (?, ?, ?, ?, ?)
          `).bind(
            crypto.randomUUID(),
            userId,
            permission,
            granted ? 1 : 0,
            adminId
          ).run();
        }
      }
    }

    await logAudit(DB, c, 'user_profile_updated', 'user_management', 'info', 'user', userId, {
      updatedFields: Object.keys(profileData).filter(k => allowedFields.includes(k)),
      roleChanged: role !== undefined,
      permissionsUpdated: !!permissions,
    });

    return c.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// POST /admin/users/:id/role - Change user role
adminUsersRoutes.post('/:id/role', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const { DB } = c.env;
    const userId = c.req.param('id');
    const adminUser = c.get('user') as any;

    // Permission check - super_admin bypasses
    if (adminUser.role !== 'super_admin') {
      const permitted = await hasPermission(DB, adminUser.id, 'manage_user_roles');
      if (!permitted) return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const { role } = await c.req.json();

    const validRoles = ['guest', 'user', 'contributor', 'moderator', 'librarian', 'counselor', 'admin', 'director', 'super_admin'];
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Fetch old role for audit log
    const targetUser = await DB.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first() as { role: string } | null;
    const oldRole = targetUser?.role || 'unknown';

    await DB.prepare(`
      UPDATE users SET role = ?, updatedAt = datetime('now') WHERE id = ?
    `).bind(role, userId).run();

    await logAudit(DB, c, 'user_role_changed', 'user_management', 'warning', 'user', userId, {
      oldRole,
      newRole: role,
    });

    return c.json({ success: true, message: 'Role updated' });
  } catch (error) {
    console.error('Error changing role:', error);
    return c.json({ error: 'Failed to change role' }, 500);
  }
});

// POST /admin/users/:id/suspend - Suspend/unsuspend user
adminUsersRoutes.post('/:id/suspend', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const { DB } = c.env;
    const userId = c.req.param('id');
    const adminUser = c.get('user') as any;

    // Permission check - super_admin bypasses
    if (adminUser.role !== 'super_admin') {
      const permitted = await hasPermission(DB, adminUser.id, 'edit_users');
      if (!permitted) return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const { suspend, reason } = await c.req.json();

    await DB.prepare(`
      UPDATE users SET isSuspended = ?, updatedAt = datetime('now') WHERE id = ?
    `).bind(suspend ? 1 : 0, userId).run();

    // When suspending, blacklist all active session tokens for the user
    if (suspend && c.env.CACHE) {
      try {
        const sessions = await DB.prepare(`
          SELECT token FROM sessions WHERE userId = ? AND expiresAt > datetime('now')
        `).bind(userId).all();

        for (const session of sessions.results || []) {
          if (session.token) {
            try {
              const sessionPayload = await verify(session.token as string, c.env.JWT_SECRET);
              if (sessionPayload.exp) {
                const remainingTtl = Math.max(0, (sessionPayload.exp as number) - Math.floor(Date.now() / 1000));
                await blacklistToken(c.env.CACHE, session.token as string, remainingTtl);
              }
            } catch (_) {
              // Token already expired or invalid
            }
          }
        }

        // Also delete the sessions from DB
        await DB.prepare(`DELETE FROM sessions WHERE userId = ?`).bind(userId).run();
      } catch (e) {
        console.error('Failed to blacklist sessions on suspend:', e);
      }
    }

    await logAudit(DB, c, suspend ? 'user_suspended' : 'user_unsuspended', 'user_management', 'warning', 'user', userId, {
      suspended: !!suspend,
      reason: reason || null,
    });

    return c.json({ success: true, message: suspend ? 'User suspended' : 'User unsuspended' });
  } catch (error) {
    console.error('Error suspending user:', error);
    return c.json({ error: 'Failed to suspend user' }, 500);
  }
});

// DELETE /admin/users/:id - Delete user
adminUsersRoutes.delete('/:id', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const { DB } = c.env;
    const userId = c.req.param('id');
    const adminId = c.get('userId');
    const adminUser = c.get('user') as any;

    // Permission check - super_admin bypasses
    if (adminUser.role !== 'super_admin') {
      const permitted = await hasPermission(DB, adminUser.id, 'delete_users');
      if (!permitted) return c.json({ error: 'Insufficient permissions' }, 403);
    }

    // Don't allow deleting yourself
    if (userId === adminId) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    // Fetch user info for audit before soft-deleting
    const targetUser = await DB.prepare('SELECT email, displayName, role FROM users WHERE id = ?').bind(userId).first() as { email: string; displayName: string; role: string } | null;

    // Soft delete - just deactivate
    await DB.prepare(`
      UPDATE users SET isActive = 0, isSuspended = 1, updatedAt = datetime('now') WHERE id = ?
    `).bind(userId).run();

    await logAudit(DB, c, 'user_deleted', 'user_management', 'warning', 'user', userId, {
      deletedUserEmail: targetUser?.email || 'unknown',
      deletedUserName: targetUser?.displayName || 'unknown',
      deletedUserRole: targetUser?.role || 'unknown',
    });

    return c.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// POST /admin/users/invite - Invite new admin user
adminUsersRoutes.post('/invite', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const { DB, RESEND_API_KEY } = c.env;
    const adminId = c.get('userId');
    const { email, role, permissions } = await c.req.json();

    const adminUser = c.get('user') as any;

    // Permission check - super_admin bypasses
    if (adminUser.role !== 'super_admin') {
      const permitted = await hasPermission(DB, adminUser.id, 'create_users');
      if (!permitted) return c.json({ error: 'Insufficient permissions' }, 403);
    }

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Check if user already exists
    const existingUser = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 400);
    }

    // Check for existing pending invitation
    const existingInvite = await DB.prepare(`
      SELECT id FROM admin_invitations WHERE email = ? AND status = 'pending'
    `).bind(email).first();
    if (existingInvite) {
      return c.json({ error: 'Invitation already sent to this email' }, 400);
    }

    // Generate invitation token
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Create invitation
    await DB.prepare(`
      INSERT INTO admin_invitations (id, email, role, permissions, invitedBy, token, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      email,
      role || 'admin',
      permissions ? JSON.stringify(permissions) : null,
      adminId,
      token,
      expiresAt
    ).run();

    // Send invitation email using Resend
    const inviteUrl = `https://ohcs-elibrary.pages.dev/accept-invite?token=${token}`;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'OHCS E-Library <noreply@ohcs-elibrary.pages.dev>',
          to: email,
          subject: 'You\'ve been invited to OHCS E-Library as an Admin',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #006B3F, #004d2d); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">OHCS E-Library</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333;">You're Invited!</h2>
                <p style="color: #666; line-height: 1.6;">
                  You've been invited to join the OHCS E-Library platform as an <strong>${role || 'Admin'}</strong>.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  Click the button below to accept your invitation and set up your account:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteUrl}" style="background: #006B3F; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Accept Invitation
                  </a>
                </div>
                <p style="color: #999; font-size: 12px;">
                  This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request, invitation is still created
    }

    await logAudit(DB, c, 'user_invited', 'user_management', 'info', 'invitation', email, {
      invitedEmail: email,
      assignedRole: role || 'admin',
    });

    return c.json({
      success: true,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return c.json({ error: 'Failed to send invitation' }, 500);
  }
});

// GET /admin/users/invitations - List pending invitations
adminUsersRoutes.get('/invitations/list', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const { DB } = c.env;

    const { results: invitations } = await DB.prepare(`
      SELECT
        i.id, i.email, i.role, i.permissions, i.status,
        i.expiresAt, i.acceptedAt, i.createdAt,
        u.displayName as invitedByName
      FROM admin_invitations i
      LEFT JOIN users u ON i.invitedBy = u.id
      ORDER BY i.createdAt DESC
    `).all();

    return c.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return c.json({ error: 'Failed to fetch invitations' }, 500);
  }
});

// DELETE /admin/users/invitations/:id - Revoke invitation
adminUsersRoutes.delete('/invitations/:id', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const { DB } = c.env;
    const inviteId = c.req.param('id');

    await DB.prepare(`
      UPDATE admin_invitations SET status = 'revoked' WHERE id = ?
    `).bind(inviteId).run();

    return c.json({ success: true, message: 'Invitation revoked' });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return c.json({ error: 'Failed to revoke invitation' }, 500);
  }
});

// GET /admin/users/permissions/list - Get all available permissions
adminUsersRoutes.get('/permissions/list', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Group permissions by category
  const permissionGroups = {
    dashboard: ['view_admin_dashboard'],
    users: ['view_users', 'create_users', 'edit_users', 'delete_users', 'manage_user_roles'],
    documents: ['view_documents', 'upload_documents', 'edit_documents', 'delete_documents', 'approve_documents'],
    forum: ['view_forum_admin', 'moderate_forum', 'delete_forum_posts', 'manage_forum_categories'],
    chat: ['view_chat_admin', 'moderate_chat', 'delete_chat_messages'],
    groups: ['view_groups_admin', 'create_groups', 'edit_groups', 'delete_groups'],
    news: ['view_news_admin', 'manage_news_sources', 'edit_articles', 'delete_articles'],
    analytics: ['view_analytics', 'export_reports'],
    settings: ['view_settings', 'edit_settings'],
    backup: ['manage_backups', 'restore_backups'],
    audit: ['view_audit_logs'],
    wellness: ['view_wellness_admin', 'manage_wellness_resources', 'view_escalations', 'manage_counselors'],
  };

  return c.json({
    permissions: ALL_PERMISSIONS,
    groups: permissionGroups,
  });
});

// GET /admin/users/stats - Get user statistics
adminUsersRoutes.get('/stats/summary', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  try {
    const { DB } = c.env;

    const stats = await DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN isActive = 1 AND isSuspended = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN isSuspended = 1 THEN 1 ELSE 0 END) as suspended,
        SUM(CASE WHEN isVerified = 0 THEN 1 ELSE 0 END) as pending
      FROM users
    `).first();

    const roleStats = await DB.prepare(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `).all();

    return c.json({
      stats,
      byRole: roleStats.results,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});
