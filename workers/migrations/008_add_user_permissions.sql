-- User permissions table for granular access control
CREATE TABLE IF NOT EXISTS user_permissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted INTEGER DEFAULT 1,
  grantedBy TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (grantedBy) REFERENCES users(id),
  UNIQUE(userId, permission)
);

-- Admin invitations table
CREATE TABLE IF NOT EXISTS admin_invitations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions TEXT, -- JSON array of permissions
  invitedBy TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expiresAt TEXT NOT NULL,
  acceptedAt TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'revoked'
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (invitedBy) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_userId ON user_permissions(userId);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON admin_invitations(email);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_token ON admin_invitations(token);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_status ON admin_invitations(status);
