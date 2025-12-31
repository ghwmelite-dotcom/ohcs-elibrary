-- Audit Logging System
-- Migration: 026_audit_logging.sql

-- Main audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,

  -- Actor information
  userId TEXT,
  userEmail TEXT,
  userRole TEXT,
  ipAddress TEXT,
  userAgent TEXT,

  -- Action details
  action TEXT NOT NULL,
  category TEXT NOT NULL, -- auth, user, document, admin, security, system
  severity TEXT DEFAULT 'info', -- debug, info, warning, error, critical

  -- Resource information
  resourceType TEXT, -- user, document, forum_post, group, etc.
  resourceId TEXT,
  resourceName TEXT,

  -- Change tracking
  oldValue TEXT, -- JSON of previous state
  newValue TEXT, -- JSON of new state
  changes TEXT, -- JSON array of changed fields

  -- Request context
  requestMethod TEXT,
  requestPath TEXT,
  requestParams TEXT, -- JSON of query params (sanitized)

  -- Result
  status TEXT DEFAULT 'success', -- success, failure, error
  errorMessage TEXT,

  -- Metadata
  metadata TEXT, -- JSON for additional context
  sessionId TEXT,

  -- Timestamps
  createdAt TEXT DEFAULT (datetime('now')),

  -- Foreign key (nullable for system events)
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(userId);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resourceType, resourceId);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(createdAt);
CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_logs(ipAddress);

-- Audit log retention settings
CREATE TABLE IF NOT EXISTS audit_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  retentionDays INTEGER DEFAULT 365,
  logLevel TEXT DEFAULT 'info', -- minimum level to log
  enabledCategories TEXT DEFAULT '["auth","user","document","admin","security","system"]',
  excludedActions TEXT DEFAULT '[]', -- actions to not log
  anonymizeAfterDays INTEGER DEFAULT 90, -- anonymize user data after X days
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Insert default settings
INSERT OR IGNORE INTO audit_settings (id) VALUES ('default');

-- Audit log summary for quick stats (updated periodically)
CREATE TABLE IF NOT EXISTS audit_log_summary (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  successCount INTEGER DEFAULT 0,
  failureCount INTEGER DEFAULT 0,
  uniqueUsers INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),

  UNIQUE(date, category, action)
);

CREATE INDEX IF NOT EXISTS idx_audit_summary_date ON audit_log_summary(date);
