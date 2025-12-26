-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create index for sessions if not exists
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_userId ON user_sessions(user_id);

-- Insert default roles
INSERT OR REPLACE INTO roles (id, name, description) VALUES
  (1, 'super_admin', 'Full system access'),
  (2, 'civil_servant', 'Standard civil servant user'),
  (3, 'admin', 'Administrative access'),
  (4, 'director', 'Director level access'),
  (5, 'librarian', 'Document management access'),
  (6, 'moderator', 'Forum and chat moderation'),
  (7, 'contributor', 'Can upload documents'),
  (8, 'guest', 'Read-only access');

-- Add role_id column to users if not exists (SQLite doesn't support IF NOT EXISTS for columns)
-- We'll handle this in the application code

-- Add demo admin user (password: Admin123!@#)
-- SHA-256 hash of 'Admin123!@#'
INSERT OR REPLACE INTO users (id, email, password_hash, name, firstName, lastName, displayName, role_id, status, email_verified)
VALUES (
  'demo-admin-001',
  'admin@ohcs.gov.gh',
  'a34fbf9b44adf2e6f142b45fea2ab4d1ce1ddf33ad00702e4a7a3da99ec1ed7f',
  'Demo Admin',
  'Demo',
  'Admin',
  'Demo Admin',
  1,
  'active',
  1
);

-- Add demo civil servant user (password: User123456!)
INSERT OR REPLACE INTO users (id, email, password_hash, name, firstName, lastName, displayName, role_id, status, email_verified)
VALUES (
  'demo-user-001',
  'user@mof.gov.gh',
  'b8ae20b7eb5e4e62bc8d78d32621e3c7a8aeb67c4c2e3a3e79d8b7a9c8b7d6e5',
  'Demo User',
  'Demo',
  'User',
  'Demo User',
  2,
  'active',
  1
);
