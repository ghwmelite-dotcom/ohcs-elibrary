-- Migration: Add Forum and Gamification Tables
-- Run this to add new tables without affecting existing data

-- ============================================
-- FORUM TABLES
-- ============================================

-- Forum categories table
CREATE TABLE IF NOT EXISTS forum_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT 'MessageSquare',
  color TEXT DEFAULT '#006B3F',
  sortOrder INTEGER DEFAULT 0,
  isLocked INTEGER DEFAULT 0,
  topicCount INTEGER DEFAULT 0,
  postCount INTEGER DEFAULT 0,
  lastActivityAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Forum topics table
CREATE TABLE IF NOT EXISTS forum_topics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  isPinned INTEGER DEFAULT 0,
  isLocked INTEGER DEFAULT 0,
  isAnswered INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  postCount INTEGER DEFAULT 0,
  lastPostAt TEXT,
  lastPostBy TEXT,
  tags TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (categoryId) REFERENCES forum_categories(id),
  FOREIGN KEY (authorId) REFERENCES users(id)
);

-- Forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  topicId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  content TEXT NOT NULL,
  parentId TEXT,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  isBestAnswer INTEGER DEFAULT 0,
  isEdited INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (topicId) REFERENCES forum_topics(id) ON DELETE CASCADE,
  FOREIGN KEY (authorId) REFERENCES users(id),
  FOREIGN KEY (parentId) REFERENCES forum_posts(id)
);

-- Forum votes table
CREATE TABLE IF NOT EXISTS forum_votes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  postId TEXT NOT NULL,
  userId TEXT NOT NULL,
  voteType TEXT NOT NULL CHECK (voteType IN ('up', 'down')),
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(postId, userId),
  FOREIGN KEY (postId) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Forum subscriptions table
CREATE TABLE IF NOT EXISTS forum_subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  topicId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(topicId, userId),
  FOREIGN KEY (topicId) REFERENCES forum_topics(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- ============================================
-- GAMIFICATION TABLES
-- ============================================

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  xpReward INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common',
  createdAt TEXT DEFAULT (datetime('now'))
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  badgeId TEXT NOT NULL,
  earnedAt TEXT DEFAULT (datetime('now')),
  UNIQUE(userId, badgeId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (badgeId) REFERENCES badges(id)
);

-- XP transactions table
CREATE TABLE IF NOT EXISTS xp_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  referenceId TEXT,
  referenceType TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- User streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT UNIQUE NOT NULL,
  currentStreak INTEGER DEFAULT 0,
  longestStreak INTEGER DEFAULT 0,
  lastActivityDate TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT UNIQUE NOT NULL,
  totalXp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  documentsRead INTEGER DEFAULT 0,
  forumPosts INTEGER DEFAULT 0,
  forumTopics INTEGER DEFAULT 0,
  bestAnswers INTEGER DEFAULT 0,
  badgesEarned INTEGER DEFAULT 0,
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  activityType TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xpEarned INTEGER DEFAULT 0,
  referenceId TEXT,
  referenceType TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Document views table (if not exists)
CREATE TABLE IF NOT EXISTS document_views (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  documentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  viewedAt TEXT DEFAULT (datetime('now')),
  UNIQUE(documentId, userId),
  FOREIGN KEY (documentId) REFERENCES documents(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Forum indexes
CREATE INDEX IF NOT EXISTS idx_forum_topics_categoryId ON forum_topics(categoryId);
CREATE INDEX IF NOT EXISTS idx_forum_topics_authorId ON forum_topics(authorId);
CREATE INDEX IF NOT EXISTS idx_forum_topics_createdAt ON forum_topics(createdAt);
CREATE INDEX IF NOT EXISTS idx_forum_topics_isPinned ON forum_topics(isPinned);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topicId ON forum_posts(topicId);
CREATE INDEX IF NOT EXISTS idx_forum_posts_authorId ON forum_posts(authorId);
CREATE INDEX IF NOT EXISTS idx_forum_votes_postId ON forum_votes(postId);
CREATE INDEX IF NOT EXISTS idx_forum_subscriptions_userId ON forum_subscriptions(userId);

-- Gamification indexes
CREATE INDEX IF NOT EXISTS idx_xp_transactions_userId ON xp_transactions(userId);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_createdAt ON xp_transactions(createdAt);
CREATE INDEX IF NOT EXISTS idx_user_badges_userId ON user_badges(userId);
CREATE INDEX IF NOT EXISTS idx_activity_log_userId ON activity_log(userId);
CREATE INDEX IF NOT EXISTS idx_activity_log_createdAt ON activity_log(createdAt);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert forum categories (ignore if exist)
INSERT OR IGNORE INTO forum_categories (id, name, description, slug, icon, color, sortOrder) VALUES
  ('cat-general', 'General Discussion', 'General topics and announcements for all civil servants', 'general', 'MessageSquare', '#006B3F', 1),
  ('cat-policy', 'Policy & Procedures', 'Discussions about government policies, procedures, and guidelines', 'policy', 'FileText', '#3B82F6', 2),
  ('cat-training', 'Training & Development', 'Share and discuss training opportunities, certifications, and professional development', 'training', 'GraduationCap', '#8B5CF6', 3),
  ('cat-technology', 'Technology & Innovation', 'IT systems, digital transformation, and technological solutions', 'technology', 'Laptop', '#10B981', 4),
  ('cat-hr', 'Human Resources', 'HR policies, benefits, leave management, and career progression', 'hr', 'Users', '#F59E0B', 5),
  ('cat-regional', 'Regional Offices', 'Discussions specific to regional and district offices', 'regional', 'MapPin', '#EC4899', 6),
  ('cat-announcements', 'Official Announcements', 'Official communications from OHCS leadership', 'announcements', 'Megaphone', '#CE1126', 7),
  ('cat-feedback', 'Feedback & Suggestions', 'Share your ideas for improving the civil service', 'feedback', 'Lightbulb', '#FCD116', 8);

-- Insert badges (ignore if exist)
INSERT OR IGNORE INTO badges (id, name, description, icon, category, xpReward, rarity) VALUES
  ('badge-first-login', 'Welcome Aboard', 'Completed your first login to the E-Library', 'LogIn', 'achievement', 50, 'common'),
  ('badge-first-doc', 'Curious Reader', 'Read your first document', 'BookOpen', 'learning', 100, 'common'),
  ('badge-10-docs', 'Avid Reader', 'Read 10 documents', 'Books', 'learning', 250, 'rare'),
  ('badge-50-docs', 'Scholar', 'Read 50 documents', 'GraduationCap', 'learning', 500, 'epic'),
  ('badge-first-post', 'First Voice', 'Created your first forum post', 'MessageSquare', 'community', 100, 'common'),
  ('badge-10-posts', 'Active Contributor', 'Created 10 forum posts', 'MessageCircle', 'community', 250, 'rare'),
  ('badge-first-answer', 'Helpful Hand', 'Your answer was marked as best answer', 'ThumbsUp', 'community', 200, 'rare'),
  ('badge-5-answers', 'Problem Solver', 'Had 5 answers marked as best', 'Award', 'community', 500, 'epic'),
  ('badge-7-streak', 'Week Warrior', 'Maintained a 7-day login streak', 'Flame', 'achievement', 200, 'rare'),
  ('badge-30-streak', 'Monthly Master', 'Maintained a 30-day login streak', 'Zap', 'achievement', 500, 'epic'),
  ('badge-level-5', 'Rising Star', 'Reached level 5', 'Star', 'achievement', 300, 'rare'),
  ('badge-level-10', 'Expert', 'Reached level 10', 'Crown', 'achievement', 500, 'epic'),
  ('badge-100-upvotes', 'Community Favorite', 'Received 100 upvotes on your posts', 'Heart', 'community', 400, 'epic'),
  ('badge-early-adopter', 'Early Adopter', 'Joined during the platform launch period', 'Rocket', 'special', 300, 'legendary');
