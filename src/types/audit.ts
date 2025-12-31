/**
 * Audit Log Types
 */

export type AuditCategory = 'auth' | 'user' | 'document' | 'forum' | 'group' | 'admin' | 'security' | 'system' | 'api';
export type AuditSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type AuditStatus = 'success' | 'failure' | 'error';

export interface AuditLog {
  id: string;

  // Actor information
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;

  // Action details
  action: string;
  category: AuditCategory;
  severity: AuditSeverity;

  // Resource information
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;

  // Change tracking
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  changes: string[] | null;

  // Request context
  requestMethod: string | null;
  requestPath: string | null;
  requestParams: Record<string, unknown> | null;

  // Result
  status: AuditStatus;
  errorMessage: string | null;

  // Metadata
  metadata: Record<string, unknown> | null;
  sessionId: string | null;

  // Timestamps
  createdAt: string;
}

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

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditStats {
  totalLogs: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; userEmail: string; count: number }>;
}

export interface AuditSettings {
  retentionDays: number;
  logLevel: AuditSeverity;
  enabledCategories: AuditCategory[];
  excludedActions: string[];
  anonymizeAfterDays: number;
}
