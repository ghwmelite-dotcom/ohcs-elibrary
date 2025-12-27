-- Notifications System Migration
-- Comprehensive notification infrastructure for the OHCS E-Library platform

-- Main notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL, -- message, document, forum_reply, forum_mention, group_invite, group_post, badge_earned, level_up, xp_earned, system, announcement, like, follow, security, challenge_complete, streak
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  actorId TEXT, -- User who triggered the notification
  actorName TEXT,
  actorAvatar TEXT,
  resourceId TEXT, -- ID of related resource (document, post, group, etc.)
  resourceType TEXT, -- Type of resource
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  isRead INTEGER DEFAULT 0,
  isArchived INTEGER DEFAULT 0,
  metadata TEXT, -- JSON for additional data
  expiresAt TEXT, -- Optional expiration
  createdAt TEXT DEFAULT (datetime('now')),
  readAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  -- Global settings
  emailEnabled INTEGER DEFAULT 1,
  pushEnabled INTEGER DEFAULT 1,
  inAppEnabled INTEGER DEFAULT 1,
  soundEnabled INTEGER DEFAULT 1,
  -- Quiet hours
  quietHoursEnabled INTEGER DEFAULT 0,
  quietHoursStart TEXT DEFAULT '22:00',
  quietHoursEnd TEXT DEFAULT '07:00',
  -- Email digest
  emailDigestEnabled INTEGER DEFAULT 1,
  emailDigestFrequency TEXT DEFAULT 'daily', -- instant, daily, weekly, never
  emailDigestTime TEXT DEFAULT '08:00',
  -- Category preferences (JSON)
  categoryPreferences TEXT DEFAULT '{}',
  -- Updated timestamp
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  userAgent TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  lastUsedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, endpoint)
);

-- Email digest queue
CREATE TABLE IF NOT EXISTS notification_digest_queue (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  notificationId TEXT NOT NULL,
  scheduledFor TEXT NOT NULL,
  sentAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (notificationId) REFERENCES notifications(id) ON DELETE CASCADE
);

-- Notification templates (for admin customization)
CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL UNIQUE,
  titleTemplate TEXT NOT NULL,
  messageTemplate TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  defaultPriority TEXT DEFAULT 'normal',
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(userId, isRead) WHERE isRead = 0;
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(userId, type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(userId, priority);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_digest_queue_scheduled ON notification_digest_queue(scheduledFor);

-- Insert default notification templates
INSERT OR IGNORE INTO notification_templates (id, type, titleTemplate, messageTemplate, icon, color, defaultPriority) VALUES
  ('tmpl_message', 'message', 'New Message', '{actorName} sent you a message', 'MessageSquare', 'primary', 'normal'),
  ('tmpl_document', 'document', 'New Document', 'A new document "{resourceName}" was added', 'FileText', 'info', 'normal'),
  ('tmpl_forum_reply', 'forum_reply', 'New Reply', '{actorName} replied to your topic', 'MessageCircle', 'purple', 'normal'),
  ('tmpl_forum_mention', 'forum_mention', 'You were mentioned', '{actorName} mentioned you in a discussion', 'AtSign', 'purple', 'high'),
  ('tmpl_group_invite', 'group_invite', 'Group Invitation', '{actorName} invited you to join "{resourceName}"', 'UserPlus', 'secondary', 'high'),
  ('tmpl_group_post', 'group_post', 'New Group Post', '{actorName} posted in "{resourceName}"', 'Users', 'secondary', 'low'),
  ('tmpl_badge_earned', 'badge_earned', 'Badge Earned!', 'You earned the "{resourceName}" badge', 'Award', 'accent', 'normal'),
  ('tmpl_level_up', 'level_up', 'Level Up!', 'Congratulations! You reached Level {level}', 'TrendingUp', 'accent', 'high'),
  ('tmpl_xp_earned', 'xp_earned', 'XP Earned', 'You earned {amount} XP for {reason}', 'Zap', 'success', 'low'),
  ('tmpl_like', 'like', 'Post Liked', '{actorName} liked your post', 'Heart', 'error', 'low'),
  ('tmpl_follow', 'follow', 'New Follower', '{actorName} started following you', 'UserPlus', 'primary', 'normal'),
  ('tmpl_announcement', 'announcement', 'Announcement', '{message}', 'AlertCircle', 'warning', 'high'),
  ('tmpl_security', 'security', 'Security Alert', '{message}', 'Shield', 'error', 'urgent'),
  ('tmpl_challenge_complete', 'challenge_complete', 'Challenge Complete!', 'You completed "{resourceName}" and earned {amount} XP', 'Target', 'success', 'high'),
  ('tmpl_streak', 'streak', 'Streak Milestone!', 'Amazing! You''re on a {days} day streak', 'Flame', 'warning', 'normal'),
  ('tmpl_welcome', 'welcome', 'Welcome to OHCS E-Library!', 'Start exploring Ghana''s premier civil service knowledge platform', 'Sparkles', 'primary', 'high'),
  ('tmpl_document_approved', 'document_approved', 'Document Approved', 'Your document "{resourceName}" has been approved', 'CheckCircle', 'success', 'normal'),
  ('tmpl_document_rejected', 'document_rejected', 'Document Needs Revision', 'Your document "{resourceName}" needs changes', 'XCircle', 'error', 'high');
