-- Add email verification and password reset columns to users table
-- Run this migration to update the existing database

-- Verification columns
ALTER TABLE users ADD COLUMN verificationCode TEXT;
ALTER TABLE users ADD COLUMN verificationExpires TEXT;

-- Password reset columns
ALTER TABLE users ADD COLUMN resetCode TEXT;
ALTER TABLE users ADD COLUMN resetToken TEXT;
ALTER TABLE users ADD COLUMN resetExpires TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verificationCode);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(resetToken);
