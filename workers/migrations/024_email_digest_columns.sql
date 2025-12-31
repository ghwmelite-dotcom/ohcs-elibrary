-- ============================================
-- EMAIL DIGEST SYSTEM
-- Migration: 024_email_digest_columns.sql
-- Adds digestSentAt column to notifications for tracking email digests
-- ============================================

-- Add digestSentAt column to notifications table
ALTER TABLE notifications ADD COLUMN digestSentAt TEXT;

-- Create index for efficient digest queries
CREATE INDEX IF NOT EXISTS idx_notifications_digest ON notifications(userId, isRead, isArchived, digestSentAt);

-- Create email digest logs table for tracking digest history
CREATE TABLE IF NOT EXISTS email_digest_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  digestType TEXT DEFAULT 'daily', -- daily, weekly, instant
  notificationCount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  sentAt TEXT,
  errorMessage TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for digest log queries
CREATE INDEX IF NOT EXISTS idx_digest_logs_user ON email_digest_logs(userId);
CREATE INDEX IF NOT EXISTS idx_digest_logs_status ON email_digest_logs(status);
