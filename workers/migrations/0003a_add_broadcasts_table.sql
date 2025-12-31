-- Emergency Broadcast System
-- Allows admins to send alerts to all users

CREATE TABLE IF NOT EXISTS broadcasts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
  target_audience TEXT DEFAULT 'all', -- 'all', 'admins', 'staff', or comma-separated role IDs
  is_active INTEGER DEFAULT 1,
  requires_acknowledgment INTEGER DEFAULT 0,
  scheduled_at DATETIME,
  expires_at DATETIME,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Track which users have seen/acknowledged broadcasts
CREATE TABLE IF NOT EXISTS broadcast_acknowledgments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  broadcast_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(broadcast_id, user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_broadcasts_active ON broadcasts(is_active, severity);
CREATE INDEX IF NOT EXISTS idx_broadcasts_scheduled ON broadcasts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_acks_user ON broadcast_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_acks_broadcast ON broadcast_acknowledgments(broadcast_id);
