-- Two-Factor Authentication (2FA) System
-- Migration: 025_two_factor_auth.sql

-- Add 2FA columns to users table
ALTER TABLE users ADD COLUMN twoFactorEnabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN twoFactorSecret TEXT;
ALTER TABLE users ADD COLUMN twoFactorBackupCodes TEXT; -- JSON array of hashed codes
ALTER TABLE users ADD COLUMN twoFactorEnabledAt TEXT;

-- 2FA verification attempts tracking
CREATE TABLE IF NOT EXISTS two_factor_attempts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  attemptType TEXT DEFAULT 'totp', -- totp, backup_code
  success INTEGER DEFAULT 0,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 2FA trusted devices (remember this device)
CREATE TABLE IF NOT EXISTS two_factor_trusted_devices (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  deviceToken TEXT UNIQUE NOT NULL,
  deviceName TEXT,
  lastUsedAt TEXT DEFAULT (datetime('now')),
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_2fa_attempts_user ON two_factor_attempts(userId, createdAt);
CREATE INDEX IF NOT EXISTS idx_2fa_trusted_user ON two_factor_trusted_devices(userId);
CREATE INDEX IF NOT EXISTS idx_2fa_trusted_token ON two_factor_trusted_devices(deviceToken);
CREATE INDEX IF NOT EXISTS idx_users_2fa ON users(twoFactorEnabled);
