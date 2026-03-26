/**
 * Audit Log API Routes
 * Admin endpoints for viewing and managing audit logs
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  queryAuditLogs,
  getAuditStats,
  cleanupAuditLogs,
  logFromContext,
  AuditActions,
  type AuditLogQuery,
} from '../services/auditService';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

const auditRoutes = new Hono<{ Bindings: Env }>();

// All routes require admin authentication
auditRoutes.use('/*', authMiddleware);
auditRoutes.use('/*', requireRole(['admin', 'director', 'super_admin']));

/**
 * GET /audit/logs - Query audit logs
 */
auditRoutes.get('/logs', async (c) => {
  try {
    const query: AuditLogQuery = {
      userId: c.req.query('userId'),
      action: c.req.query('action'),
      category: c.req.query('category') as AuditLogQuery['category'],
      severity: c.req.query('severity') as AuditLogQuery['severity'],
      resourceType: c.req.query('resourceType'),
      resourceId: c.req.query('resourceId'),
      status: c.req.query('status') as AuditLogQuery['status'],
      ipAddress: c.req.query('ipAddress'),
      startDate: c.req.query('startDate'),
      endDate: c.req.query('endDate'),
      search: c.req.query('search'),
      page: parseInt(c.req.query('page') || '1'),
      limit: parseInt(c.req.query('limit') || '50'),
    };

    const result = await queryAuditLogs(c.env, query);

    // Log this access (non-blocking — don't fail the response if logging fails)
    logFromContext(c, 'admin.audit_logs_view', 'admin', {
      metadata: { query },
    }).catch((e) => console.error('Failed to log audit access:', e));

    return c.json(result);
  } catch (error) {
    console.error('Error querying audit logs:', error);
    return c.json({ error: 'Failed to fetch audit logs' }, 500);
  }
});

/**
 * GET /audit/logs/:id - Get single audit log entry
 */
auditRoutes.get('/logs/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const log = await c.env.DB.prepare(`
      SELECT * FROM audit_logs WHERE id = ?
    `).bind(id).first();

    if (!log) {
      return c.json({ error: 'Audit log not found' }, 404);
    }

    // Parse JSON fields
    const parsedLog = {
      ...log,
      oldValue: log.oldValue ? JSON.parse(log.oldValue as string) : null,
      newValue: log.newValue ? JSON.parse(log.newValue as string) : null,
      changes: log.changes ? JSON.parse(log.changes as string) : null,
      requestParams: log.requestParams ? JSON.parse(log.requestParams as string) : null,
      metadata: log.metadata ? JSON.parse(log.metadata as string) : null,
    };

    return c.json(parsedLog);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return c.json({ error: 'Failed to fetch audit log' }, 500);
  }
});

/**
 * GET /audit/stats - Get audit log statistics
 */
auditRoutes.get('/stats', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');

    const stats = await getAuditStats(c.env, days);

    return c.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return c.json({ error: 'Failed to fetch audit stats' }, 500);
  }
});

/**
 * GET /audit/actions - Get available audit actions
 */
auditRoutes.get('/actions', async (c) => {
  // Group actions by category
  const grouped: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(AuditActions)) {
    const category = value.split('.')[0];
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(value);
  }

  return c.json({
    actions: AuditActions,
    grouped,
    categories: ['auth', 'user', 'document', 'forum', 'group', 'admin', 'security', 'system', 'api'],
    severities: ['debug', 'info', 'warning', 'error', 'critical'],
    statuses: ['success', 'failure', 'error'],
  });
});

/**
 * GET /audit/user/:userId - Get audit logs for specific user
 */
auditRoutes.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');

    const result = await queryAuditLogs(c.env, {
      userId,
      page,
      limit,
    });

    // Get user info
    const user = await c.env.DB.prepare(`
      SELECT id, email, displayName, role FROM users WHERE id = ?
    `).bind(userId).first();

    return c.json({
      user,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    return c.json({ error: 'Failed to fetch user audit logs' }, 500);
  }
});

/**
 * GET /audit/resource/:type/:id - Get audit logs for specific resource
 */
auditRoutes.get('/resource/:type/:id', async (c) => {
  try {
    const resourceType = c.req.param('type');
    const resourceId = c.req.param('id');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');

    const result = await queryAuditLogs(c.env, {
      resourceType,
      resourceId,
      page,
      limit,
    });

    return c.json(result);
  } catch (error) {
    console.error('Error fetching resource audit logs:', error);
    return c.json({ error: 'Failed to fetch resource audit logs' }, 500);
  }
});

/**
 * GET /audit/security - Get security-related logs
 */
auditRoutes.get('/security', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const severity = c.req.query('severity');

    const conditions = ['category IN (?, ?)'];
    const params: any[] = ['security', 'auth'];

    if (severity) {
      conditions.push('severity = ?');
      params.push(severity);
    }

    // Only show warnings and above for security logs
    if (!severity) {
      conditions.push('severity IN (?, ?, ?)');
      params.push('warning', 'error', 'critical');
    }

    const offset = (page - 1) * limit;

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM audit_logs WHERE ${conditions.join(' AND ')}
    `).bind(...params).first<{ count: number }>();

    const logsResult = await c.env.DB.prepare(`
      SELECT * FROM audit_logs
      WHERE ${conditions.join(' AND ')}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    return c.json({
      logs: logsResult.results || [],
      total: countResult?.count || 0,
      page,
      limit,
      totalPages: Math.ceil((countResult?.count || 0) / limit),
    });
  } catch (error) {
    console.error('Error fetching security audit logs:', error);
    return c.json({ error: 'Failed to fetch security audit logs' }, 500);
  }
});

/**
 * GET /audit/activity/:userId - Get recent activity for user
 */
auditRoutes.get('/activity/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const limit = parseInt(c.req.query('limit') || '20');

    const logsResult = await c.env.DB.prepare(`
      SELECT action, category, resourceType, resourceName, status, createdAt
      FROM audit_logs
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return c.json({
      activities: logsResult.results || [],
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return c.json({ error: 'Failed to fetch user activity' }, 500);
  }
});

/**
 * POST /audit/cleanup - Cleanup old audit logs (super_admin only)
 */
auditRoutes.post('/cleanup', requireRole(['super_admin']), async (c) => {
  const deletedCount = await cleanupAuditLogs(c.env);

  // Log the cleanup action
  await logFromContext(c, 'admin.audit_cleanup', 'admin', {
    metadata: { deletedCount },
  });

  return c.json({
    success: true,
    deletedCount,
    message: `Cleaned up ${deletedCount} old audit log entries`,
  });
});

/**
 * GET /audit/settings - Get audit log settings
 */
auditRoutes.get('/settings', async (c) => {
  try {
    const settings = await c.env.DB.prepare(`
      SELECT * FROM audit_settings WHERE id = 'default'
    `).first();

    if (!settings) {
      return c.json({
        retentionDays: 365,
        logLevel: 'info',
        enabledCategories: ['auth', 'user', 'document', 'admin', 'security', 'system'],
        excludedActions: [],
        anonymizeAfterDays: 90,
      });
    }

    return c.json({
      retentionDays: settings.retentionDays,
      logLevel: settings.logLevel,
      enabledCategories: JSON.parse(settings.enabledCategories as string),
      excludedActions: JSON.parse(settings.excludedActions as string),
      anonymizeAfterDays: settings.anonymizeAfterDays,
    });
  } catch (error) {
    console.error('Error fetching audit settings:', error);
    return c.json({ error: 'Failed to fetch audit settings' }, 500);
  }
});

/**
 * PUT /audit/settings - Update audit log settings (super_admin only)
 */
auditRoutes.put('/settings', requireRole(['super_admin']), async (c) => {
  const schema = z.object({
    retentionDays: z.number().min(30).max(3650).optional(),
    logLevel: z.enum(['debug', 'info', 'warning', 'error', 'critical']).optional(),
    enabledCategories: z.array(z.string()).optional(),
    excludedActions: z.array(z.string()).optional(),
    anonymizeAfterDays: z.number().min(7).max(365).optional(),
  });

  const body = await c.req.json();
  const validation = schema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Invalid settings', details: validation.error.issues }, 400);
  }

  const updates = validation.data;
  const setClauses: string[] = ['updatedAt = datetime("now")'];
  const params: any[] = [];

  if (updates.retentionDays !== undefined) {
    setClauses.push('retentionDays = ?');
    params.push(updates.retentionDays);
  }

  if (updates.logLevel !== undefined) {
    setClauses.push('logLevel = ?');
    params.push(updates.logLevel);
  }

  if (updates.enabledCategories !== undefined) {
    setClauses.push('enabledCategories = ?');
    params.push(JSON.stringify(updates.enabledCategories));
  }

  if (updates.excludedActions !== undefined) {
    setClauses.push('excludedActions = ?');
    params.push(JSON.stringify(updates.excludedActions));
  }

  if (updates.anonymizeAfterDays !== undefined) {
    setClauses.push('anonymizeAfterDays = ?');
    params.push(updates.anonymizeAfterDays);
  }

  await c.env.DB.prepare(`
    UPDATE audit_settings SET ${setClauses.join(', ')} WHERE id = 'default'
  `).bind(...params).run();

  // Log the settings change
  await logFromContext(c, AuditActions.ADMIN_SETTINGS_UPDATE, 'admin', {
    resourceType: 'audit_settings',
    newValue: updates,
  });

  return c.json({ success: true });
});

/**
 * GET /audit/export - Export audit logs (super_admin only)
 */
auditRoutes.get('/export', requireRole(['super_admin']), async (c) => {
  const format = c.req.query('format') || 'json';
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');

  const conditions: string[] = [];
  const params: any[] = [];

  if (startDate) {
    conditions.push('createdAt >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('createdAt <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const logsResult = await c.env.DB.prepare(`
    SELECT * FROM audit_logs ${whereClause} ORDER BY createdAt DESC LIMIT 10000
  `).bind(...params).all();

  const logs = logsResult.results || [];

  // Log the export
  await logFromContext(c, 'admin.audit_export', 'admin', {
    metadata: { format, count: logs.length, startDate, endDate },
  });

  if (format === 'csv') {
    const headers = [
      'id', 'userId', 'userEmail', 'action', 'category', 'severity',
      'resourceType', 'resourceId', 'status', 'ipAddress', 'createdAt'
    ];

    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = headers.map(h => {
        const value = (log as any)[h];
        if (value === null || value === undefined) return '';
        const str = String(value);
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      });
      csvRows.push(row.join(','));
    }

    return new Response(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return c.json({
    logs,
    exportedAt: new Date().toISOString(),
    count: logs.length,
  });
});

export { auditRoutes };
