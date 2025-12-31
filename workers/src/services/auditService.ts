/**
 * Audit Logging Service
 * Comprehensive logging for security, compliance, and debugging
 */

import type { Context } from 'hono';

// Types
export type AuditCategory = 'auth' | 'user' | 'document' | 'forum' | 'group' | 'admin' | 'security' | 'system' | 'api';
export type AuditSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type AuditStatus = 'success' | 'failure' | 'error';

export interface AuditLogEntry {
  // Actor
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;

  // Action
  action: string;
  category: AuditCategory;
  severity?: AuditSeverity;

  // Resource
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;

  // Changes
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  changes?: string[];

  // Request context
  requestMethod?: string;
  requestPath?: string;
  requestParams?: Record<string, unknown>;

  // Result
  status?: AuditStatus;
  errorMessage?: string;

  // Additional metadata
  metadata?: Record<string, unknown>;
  sessionId?: string;
}

// Predefined audit actions
export const AuditActions = {
  // Auth
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REGISTER: 'auth.register',
  AUTH_PASSWORD_RESET_REQUEST: 'auth.password_reset_request',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_PASSWORD_CHANGE: 'auth.password_change',
  AUTH_EMAIL_VERIFY: 'auth.email_verify',
  AUTH_2FA_ENABLE: 'auth.2fa_enable',
  AUTH_2FA_DISABLE: 'auth.2fa_disable',
  AUTH_2FA_VERIFY: 'auth.2fa_verify',
  AUTH_2FA_FAILED: 'auth.2fa_failed',
  AUTH_TOKEN_REFRESH: 'auth.token_refresh',
  AUTH_SESSION_REVOKE: 'auth.session_revoke',

  // User
  USER_PROFILE_UPDATE: 'user.profile_update',
  USER_AVATAR_UPDATE: 'user.avatar_update',
  USER_SETTINGS_UPDATE: 'user.settings_update',
  USER_DELETE: 'user.delete',
  USER_SUSPEND: 'user.suspend',
  USER_ACTIVATE: 'user.activate',

  // Document
  DOC_CREATE: 'document.create',
  DOC_UPDATE: 'document.update',
  DOC_DELETE: 'document.delete',
  DOC_VIEW: 'document.view',
  DOC_DOWNLOAD: 'document.download',
  DOC_PUBLISH: 'document.publish',
  DOC_ARCHIVE: 'document.archive',
  DOC_SHARE: 'document.share',

  // Forum
  FORUM_POST_CREATE: 'forum.post_create',
  FORUM_POST_UPDATE: 'forum.post_update',
  FORUM_POST_DELETE: 'forum.post_delete',
  FORUM_TOPIC_CREATE: 'forum.topic_create',
  FORUM_TOPIC_LOCK: 'forum.topic_lock',

  // Group
  GROUP_CREATE: 'group.create',
  GROUP_UPDATE: 'group.update',
  GROUP_DELETE: 'group.delete',
  GROUP_JOIN: 'group.join',
  GROUP_LEAVE: 'group.leave',
  GROUP_MEMBER_ADD: 'group.member_add',
  GROUP_MEMBER_REMOVE: 'group.member_remove',
  GROUP_ROLE_CHANGE: 'group.role_change',

  // Admin
  ADMIN_USER_CREATE: 'admin.user_create',
  ADMIN_USER_UPDATE: 'admin.user_update',
  ADMIN_USER_DELETE: 'admin.user_delete',
  ADMIN_USER_ROLE_CHANGE: 'admin.user_role_change',
  ADMIN_SETTINGS_UPDATE: 'admin.settings_update',
  ADMIN_BACKUP_CREATE: 'admin.backup_create',
  ADMIN_BACKUP_RESTORE: 'admin.backup_restore',
  ADMIN_BROADCAST_SEND: 'admin.broadcast_send',

  // Security
  SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  SECURITY_RATE_LIMIT_EXCEEDED: 'security.rate_limit_exceeded',
  SECURITY_INVALID_TOKEN: 'security.invalid_token',
  SECURITY_PERMISSION_DENIED: 'security.permission_denied',
  SECURITY_BRUTE_FORCE_ATTEMPT: 'security.brute_force_attempt',

  // System
  SYSTEM_ERROR: 'system.error',
  SYSTEM_STARTUP: 'system.startup',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  SYSTEM_CRON_RUN: 'system.cron_run',
  SYSTEM_MIGRATION: 'system.migration',

  // API
  API_REQUEST: 'api.request',
  API_ERROR: 'api.error',
} as const;

// Sensitive fields to redact
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'secret',
  'twoFactorSecret',
  'backupCodes',
  'apiKey',
  'authorization',
  'cookie',
];

/**
 * Sanitize object by removing sensitive fields
 */
function sanitizeObject(obj: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!obj) return undefined;

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Get client IP from request
 */
function getClientIP(c: Context): string {
  return (
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0].trim() ||
    c.req.header('X-Real-IP') ||
    'unknown'
  );
}

/**
 * Get user agent from request
 */
function getUserAgent(c: Context): string {
  const ua = c.req.header('User-Agent') || 'unknown';
  // Truncate long user agents
  return ua.length > 255 ? ua.substring(0, 255) + '...' : ua;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  env: { DB: D1Database },
  entry: AuditLogEntry
): Promise<string | null> {
  try {
    const id = crypto.randomUUID();

    // Sanitize values
    const sanitizedOld = sanitizeObject(entry.oldValue);
    const sanitizedNew = sanitizeObject(entry.newValue);
    const sanitizedParams = sanitizeObject(entry.requestParams);
    const sanitizedMetadata = sanitizeObject(entry.metadata);

    await env.DB.prepare(`
      INSERT INTO audit_logs (
        id, userId, userEmail, userRole, ipAddress, userAgent,
        action, category, severity,
        resourceType, resourceId, resourceName,
        oldValue, newValue, changes,
        requestMethod, requestPath, requestParams,
        status, errorMessage, metadata, sessionId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      entry.userId || null,
      entry.userEmail || null,
      entry.userRole || null,
      entry.ipAddress || null,
      entry.userAgent || null,
      entry.action,
      entry.category,
      entry.severity || 'info',
      entry.resourceType || null,
      entry.resourceId || null,
      entry.resourceName || null,
      sanitizedOld ? JSON.stringify(sanitizedOld) : null,
      sanitizedNew ? JSON.stringify(sanitizedNew) : null,
      entry.changes ? JSON.stringify(entry.changes) : null,
      entry.requestMethod || null,
      entry.requestPath || null,
      sanitizedParams ? JSON.stringify(sanitizedParams) : null,
      entry.status || 'success',
      entry.errorMessage || null,
      sanitizedMetadata ? JSON.stringify(sanitizedMetadata) : null,
      entry.sessionId || null
    ).run();

    return id;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}

/**
 * Create audit log from Hono context
 */
export async function logFromContext(
  c: Context<{ Bindings: { DB: D1Database } }>,
  action: string,
  category: AuditCategory,
  options: Partial<AuditLogEntry> = {}
): Promise<string | null> {
  const user = c.get('user') as { id?: string; email?: string; role?: string } | undefined;

  const entry: AuditLogEntry = {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    ipAddress: getClientIP(c),
    userAgent: getUserAgent(c),
    action,
    category,
    requestMethod: c.req.method,
    requestPath: c.req.path,
    ...options,
  };

  return createAuditLog(c.env, entry);
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  env: { DB: D1Database },
  action: string,
  options: {
    userId?: string;
    userEmail?: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await createAuditLog(env, {
    action,
    category: 'auth',
    severity: options.success ? 'info' : 'warning',
    status: options.success ? 'success' : 'failure',
    userId: options.userId,
    userEmail: options.userEmail,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    errorMessage: options.errorMessage,
    metadata: options.metadata,
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  env: { DB: D1Database },
  action: string,
  severity: AuditSeverity,
  options: {
    userId?: string;
    ipAddress: string;
    userAgent?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await createAuditLog(env, {
    action,
    category: 'security',
    severity,
    status: 'failure',
    userId: options.userId,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    errorMessage: options.message,
    metadata: options.metadata,
  });
}

/**
 * Log resource change
 */
export async function logResourceChange(
  env: { DB: D1Database },
  action: string,
  category: AuditCategory,
  options: {
    userId?: string;
    userEmail?: string;
    resourceType: string;
    resourceId: string;
    resourceName?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    changes?: string[];
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  await createAuditLog(env, {
    action,
    category,
    severity: 'info',
    status: 'success',
    ...options,
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  c: Context<{ Bindings: { DB: D1Database } }>,
  action: string,
  options: {
    resourceType?: string;
    resourceId?: string;
    resourceName?: string;
    description?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
  }
): Promise<void> {
  await logFromContext(c, action, 'admin', {
    severity: 'info',
    ...options,
    metadata: options.description ? { description: options.description } : undefined,
  });
}

/**
 * Query audit logs with filters
 */
export interface AuditLogQuery {
  userId?: string;
  action?: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  status?: AuditStatus;
  ipAddress?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function queryAuditLogs(
  env: { DB: D1Database },
  query: AuditLogQuery
): Promise<{
  logs: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 50, 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];

  if (query.userId) {
    conditions.push('userId = ?');
    params.push(query.userId);
  }

  if (query.action) {
    conditions.push('action = ?');
    params.push(query.action);
  }

  if (query.category) {
    conditions.push('category = ?');
    params.push(query.category);
  }

  if (query.severity) {
    conditions.push('severity = ?');
    params.push(query.severity);
  }

  if (query.resourceType) {
    conditions.push('resourceType = ?');
    params.push(query.resourceType);
  }

  if (query.resourceId) {
    conditions.push('resourceId = ?');
    params.push(query.resourceId);
  }

  if (query.status) {
    conditions.push('status = ?');
    params.push(query.status);
  }

  if (query.ipAddress) {
    conditions.push('ipAddress = ?');
    params.push(query.ipAddress);
  }

  if (query.startDate) {
    conditions.push('createdAt >= ?');
    params.push(query.startDate);
  }

  if (query.endDate) {
    conditions.push('createdAt <= ?');
    params.push(query.endDate);
  }

  if (query.search) {
    conditions.push('(action LIKE ? OR resourceName LIKE ? OR userEmail LIKE ? OR errorMessage LIKE ?)');
    const searchTerm = `%${query.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM audit_logs ${whereClause}
  `).bind(...params).first<{ count: number }>();

  const total = countResult?.count || 0;

  // Get logs
  const logsResult = await env.DB.prepare(`
    SELECT * FROM audit_logs
    ${whereClause}
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return {
    logs: logsResult.results || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(
  env: { DB: D1Database },
  days: number = 30
): Promise<{
  totalLogs: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; userEmail: string; count: number }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Total logs
  const totalResult = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM audit_logs WHERE createdAt >= ?
  `).bind(startDateStr).first<{ count: number }>();

  // By category
  const categoryResult = await env.DB.prepare(`
    SELECT category, COUNT(*) as count FROM audit_logs
    WHERE createdAt >= ?
    GROUP BY category
  `).bind(startDateStr).all();

  // By severity
  const severityResult = await env.DB.prepare(`
    SELECT severity, COUNT(*) as count FROM audit_logs
    WHERE createdAt >= ?
    GROUP BY severity
  `).bind(startDateStr).all();

  // By status
  const statusResult = await env.DB.prepare(`
    SELECT status, COUNT(*) as count FROM audit_logs
    WHERE createdAt >= ?
    GROUP BY status
  `).bind(startDateStr).all();

  // Recent activity by day
  const activityResult = await env.DB.prepare(`
    SELECT DATE(createdAt) as date, COUNT(*) as count FROM audit_logs
    WHERE createdAt >= ?
    GROUP BY DATE(createdAt)
    ORDER BY date DESC
    LIMIT 30
  `).bind(startDateStr).all();

  // Top actions
  const actionsResult = await env.DB.prepare(`
    SELECT action, COUNT(*) as count FROM audit_logs
    WHERE createdAt >= ?
    GROUP BY action
    ORDER BY count DESC
    LIMIT 10
  `).bind(startDateStr).all();

  // Top users
  const usersResult = await env.DB.prepare(`
    SELECT userId, userEmail, COUNT(*) as count FROM audit_logs
    WHERE createdAt >= ? AND userId IS NOT NULL
    GROUP BY userId
    ORDER BY count DESC
    LIMIT 10
  `).bind(startDateStr).all();

  return {
    totalLogs: totalResult?.count || 0,
    byCategory: Object.fromEntries(
      (categoryResult.results || []).map((r: any) => [r.category, r.count])
    ),
    bySeverity: Object.fromEntries(
      (severityResult.results || []).map((r: any) => [r.severity, r.count])
    ),
    byStatus: Object.fromEntries(
      (statusResult.results || []).map((r: any) => [r.status, r.count])
    ),
    recentActivity: (activityResult.results || []).map((r: any) => ({
      date: r.date,
      count: r.count,
    })),
    topActions: (actionsResult.results || []).map((r: any) => ({
      action: r.action,
      count: r.count,
    })),
    topUsers: (usersResult.results || []).map((r: any) => ({
      userId: r.userId,
      userEmail: r.userEmail,
      count: r.count,
    })),
  };
}

/**
 * Clean up old audit logs based on retention policy
 */
export async function cleanupAuditLogs(env: { DB: D1Database }): Promise<number> {
  // Get retention settings
  const settings = await env.DB.prepare(`
    SELECT retentionDays, anonymizeAfterDays FROM audit_settings WHERE id = 'default'
  `).first<{ retentionDays: number; anonymizeAfterDays: number }>();

  const retentionDays = settings?.retentionDays || 365;
  const anonymizeDays = settings?.anonymizeAfterDays || 90;

  // Delete old logs
  const deleteDate = new Date();
  deleteDate.setDate(deleteDate.getDate() - retentionDays);

  const deleteResult = await env.DB.prepare(`
    DELETE FROM audit_logs WHERE createdAt < ?
  `).bind(deleteDate.toISOString()).run();

  // Anonymize user data in older logs
  const anonymizeDate = new Date();
  anonymizeDate.setDate(anonymizeDate.getDate() - anonymizeDays);

  await env.DB.prepare(`
    UPDATE audit_logs
    SET userEmail = '[anonymized]', ipAddress = '[anonymized]', userAgent = '[anonymized]'
    WHERE createdAt < ? AND userEmail != '[anonymized]'
  `).bind(anonymizeDate.toISOString()).run();

  return deleteResult.meta.changes || 0;
}

/**
 * Export helper function for route integration
 */
export function auditMiddleware(action: string, category: AuditCategory) {
  return async (c: Context<{ Bindings: { DB: D1Database } }>, next: () => Promise<void>) => {
    const startTime = Date.now();

    try {
      await next();

      // Log successful request
      const responseStatus = c.res.status;
      const isSuccess = responseStatus >= 200 && responseStatus < 400;

      await logFromContext(c, action, category, {
        status: isSuccess ? 'success' : 'failure',
        severity: isSuccess ? 'info' : 'warning',
        metadata: {
          responseStatus,
          duration: Date.now() - startTime,
        },
      });
    } catch (error: any) {
      // Log error
      await logFromContext(c, action, category, {
        status: 'error',
        severity: 'error',
        errorMessage: error.message,
        metadata: {
          duration: Date.now() - startTime,
        },
      });
      throw error;
    }
  };
}
