-- Fix broadcast_acknowledgments to support anonymous users
-- The current table has a FOREIGN KEY on user_id which breaks anonymous acknowledgments

-- Create new table without the user_id foreign key constraint
CREATE TABLE IF NOT EXISTS broadcast_acknowledgments_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  broadcast_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  anonymous_id TEXT,
  FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id) ON DELETE CASCADE,
  UNIQUE(broadcast_id, user_id)
);

-- Copy existing data
INSERT OR IGNORE INTO broadcast_acknowledgments_new (id, broadcast_id, user_id, acknowledged_at, anonymous_id)
SELECT id, broadcast_id, user_id, acknowledged_at, anonymous_id FROM broadcast_acknowledgments;

-- Drop old table
DROP TABLE IF EXISTS broadcast_acknowledgments;

-- Rename new table
ALTER TABLE broadcast_acknowledgments_new RENAME TO broadcast_acknowledgments;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_broadcast_acks_broadcast ON broadcast_acknowledgments(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_acks_user ON broadcast_acknowledgments(user_id);
