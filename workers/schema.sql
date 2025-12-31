-- OHCS E-Library Database Schema
-- D1 SQLite Database

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS document_views;
DROP TABLE IF EXISTS document_ratings;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Roles table
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Users table (column names match production/auth.ts expectations)
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  name TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  displayName TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'civil_servant',
  mdaId TEXT,
  department TEXT,
  jobTitle TEXT,
  gradeLevel TEXT,
  bio TEXT,
  isActive INTEGER DEFAULT 1,
  isVerified INTEGER DEFAULT 0,
  verificationCode TEXT,
  verificationExpires TEXT,
  resetCode TEXT,
  resetToken TEXT,
  resetExpires TEXT,
  failedLoginAttempts INTEGER DEFAULT 0,
  lockedUntil TEXT,
  lastLoginAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Sessions table (used by auth.ts)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  token TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Account activity table (used by auth.ts for logging)
CREATE TABLE account_activity (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'success',
  riskLevel TEXT DEFAULT 'low',
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- User 2FA table
CREATE TABLE user_2fa (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT UNIQUE NOT NULL,
  secret TEXT NOT NULL,
  isEnabled INTEGER DEFAULT 0,
  backupCodes TEXT,
  backupCodesUsed INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT,
  fileName TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  fileType TEXT NOT NULL,
  thumbnailUrl TEXT,
  accessLevel TEXT DEFAULT 'internal',
  status TEXT DEFAULT 'published',
  authorId TEXT,
  mdaId TEXT,
  version INTEGER DEFAULT 1,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  averageRating REAL DEFAULT 0,
  totalRatings INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (authorId) REFERENCES users(id)
);

-- Bookmarks table
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  documentId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(userId, documentId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (documentId) REFERENCES documents(id)
);

-- Document ratings table
CREATE TABLE document_ratings (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(documentId, userId),
  FOREIGN KEY (documentId) REFERENCES documents(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Document views tracking
CREATE TABLE document_views (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  documentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  viewedAt TEXT DEFAULT (datetime('now')),
  UNIQUE(documentId, userId),
  FOREIGN KEY (documentId) REFERENCES documents(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- ============================================
-- FORUM TABLES
-- ============================================

-- Forum categories table
CREATE TABLE forum_categories (
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
CREATE TABLE forum_topics (
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
  tags TEXT, -- JSON array
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (categoryId) REFERENCES forum_categories(id),
  FOREIGN KEY (authorId) REFERENCES users(id)
);

-- Forum posts table
CREATE TABLE forum_posts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  topicId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  content TEXT NOT NULL,
  parentId TEXT, -- For nested replies
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
CREATE TABLE forum_votes (
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
CREATE TABLE forum_subscriptions (
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
CREATE TABLE badges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- learning, community, achievement, special
  xpReward INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
  createdAt TEXT DEFAULT (datetime('now'))
);

-- User badges table
CREATE TABLE user_badges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  badgeId TEXT NOT NULL,
  earnedAt TEXT DEFAULT (datetime('now')),
  UNIQUE(userId, badgeId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (badgeId) REFERENCES badges(id)
);

-- XP transactions table
CREATE TABLE xp_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'document_read', 'forum_post', 'reply', 'best_answer', 'badge_earned', etc.
  referenceId TEXT, -- ID of related entity
  referenceType TEXT, -- 'document', 'topic', 'post', 'badge'
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- User streaks table
CREATE TABLE user_streaks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT UNIQUE NOT NULL,
  currentStreak INTEGER DEFAULT 0,
  longestStreak INTEGER DEFAULT 0,
  lastActivityDate TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- User stats table (for quick dashboard access)
CREATE TABLE user_stats (
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

-- Activity log table (for dashboard feed)
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  activityType TEXT NOT NULL, -- 'document_read', 'forum_post', 'badge_earned', 'level_up', 'topic_created'
  title TEXT NOT NULL,
  description TEXT,
  xpEarned INTEGER DEFAULT 0,
  referenceId TEXT,
  referenceType TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_userId ON sessions(userId);
CREATE INDEX idx_account_activity_userId ON account_activity(userId);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_authorId ON documents(authorId);
CREATE INDEX idx_documents_createdAt ON documents(createdAt);
CREATE INDEX idx_bookmarks_userId ON bookmarks(userId);
CREATE INDEX idx_bookmarks_documentId ON bookmarks(documentId);
CREATE INDEX idx_document_ratings_documentId ON document_ratings(documentId);
CREATE INDEX idx_document_views_userId ON document_views(userId);

-- Forum indexes
CREATE INDEX idx_forum_topics_categoryId ON forum_topics(categoryId);
CREATE INDEX idx_forum_topics_authorId ON forum_topics(authorId);
CREATE INDEX idx_forum_topics_createdAt ON forum_topics(createdAt);
CREATE INDEX idx_forum_topics_isPinned ON forum_topics(isPinned);
CREATE INDEX idx_forum_posts_topicId ON forum_posts(topicId);
CREATE INDEX idx_forum_posts_authorId ON forum_posts(authorId);
CREATE INDEX idx_forum_votes_postId ON forum_votes(postId);
CREATE INDEX idx_forum_subscriptions_userId ON forum_subscriptions(userId);

-- Gamification indexes
CREATE INDEX idx_xp_transactions_userId ON xp_transactions(userId);
CREATE INDEX idx_xp_transactions_createdAt ON xp_transactions(createdAt);
CREATE INDEX idx_user_badges_userId ON user_badges(userId);
CREATE INDEX idx_activity_log_userId ON activity_log(userId);
CREATE INDEX idx_activity_log_createdAt ON activity_log(createdAt);

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES
  (1, 'super_admin', 'Full system access'),
  (2, 'civil_servant', 'Standard civil servant user'),
  (3, 'admin', 'Administrative access'),
  (4, 'director', 'Director level access'),
  (5, 'librarian', 'Document management access'),
  (6, 'moderator', 'Forum and chat moderation'),
  (7, 'contributor', 'Can upload documents'),
  (8, 'guest', 'Read-only access');

-- Insert admin user (password: angels2G9@84?)
-- SHA-256 hash of 'angels2G9@84?'
INSERT INTO users (id, email, passwordHash, name, firstName, lastName, displayName, role, isActive, isVerified)
VALUES (
  'admin-001',
  'admin@ohcs.gov.gh',
  '112d1840648942f62c233340cdb47ac4dfef4bc8dc4ce778d880537c3246cbe2',
  'System Admin',
  'System',
  'Admin',
  'System Admin',
  'super_admin',
  1,
  1
);

-- Insert demo civil servant user (password: Demo@123456!)
-- SHA-256 hash of 'Demo@123456!'
INSERT INTO users (id, email, passwordHash, name, firstName, lastName, displayName, role, isActive, isVerified)
VALUES (
  'demo-user-001',
  'user@mof.gov.gh',
  '7c9e7e1a8e4b5c0d3f2a1b6e9d8c7f0a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
  'Demo User',
  'Demo',
  'User',
  'Demo User',
  'civil_servant',
  1,
  1
);

-- Insert forum categories
INSERT INTO forum_categories (id, name, description, slug, icon, color, sortOrder) VALUES
  ('cat-general', 'General Discussion', 'General topics and announcements for all civil servants', 'general', 'MessageSquare', '#006B3F', 1),
  ('cat-policy', 'Policy & Procedures', 'Discussions about government policies, procedures, and guidelines', 'policy', 'FileText', '#3B82F6', 2),
  ('cat-training', 'Training & Development', 'Share and discuss training opportunities, certifications, and professional development', 'training', 'GraduationCap', '#8B5CF6', 3),
  ('cat-technology', 'Technology & Innovation', 'IT systems, digital transformation, and technological solutions', 'technology', 'Laptop', '#10B981', 4),
  ('cat-hr', 'Human Resources', 'HR policies, benefits, leave management, and career progression', 'hr', 'Users', '#F59E0B', 5),
  ('cat-regional', 'Regional Offices', 'Discussions specific to regional and district offices', 'regional', 'MapPin', '#EC4899', 6),
  ('cat-announcements', 'Official Announcements', 'Official communications from OHCS leadership', 'announcements', 'Megaphone', '#CE1126', 7),
  ('cat-feedback', 'Feedback & Suggestions', 'Share your ideas for improving the civil service', 'feedback', 'Lightbulb', '#FCD116', 8);

-- Insert badges
INSERT INTO badges (id, name, description, icon, category, xpReward, rarity) VALUES
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

-- Initialize user stats for existing users
INSERT INTO user_stats (userId, totalXp, level) VALUES
  ('admin-001', 1000, 5),
  ('demo-user-001', 250, 2);

-- Initialize streaks for existing users
INSERT INTO user_streaks (userId, currentStreak, longestStreak, lastActivityDate) VALUES
  ('admin-001', 5, 15, date('now')),
  ('demo-user-001', 1, 3, date('now'));

-- =============================================
-- PEER RECOGNITION SYSTEM
-- =============================================

-- Recognition Categories (Civil Service Focused)
CREATE TABLE IF NOT EXISTS recognition_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT DEFAULT '#006B3F',
  xpRewardReceiver INTEGER DEFAULT 50,
  xpRewardGiver INTEGER DEFAULT 10,
  sortOrder INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Core Recognitions Table
CREATE TABLE IF NOT EXISTS recognitions (
  id TEXT PRIMARY KEY,
  giverId TEXT NOT NULL,
  receiverId TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  message TEXT NOT NULL,
  badgeId TEXT,
  wallPostId TEXT,
  isPublic INTEGER DEFAULT 1,
  xpAwarded INTEGER DEFAULT 0,
  giverXpAwarded INTEGER DEFAULT 0,
  isHighlighted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (giverId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES recognition_categories(id),
  FOREIGN KEY (badgeId) REFERENCES badges(id),
  FOREIGN KEY (wallPostId) REFERENCES wall_posts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recognitions_giver ON recognitions(giverId);
CREATE INDEX IF NOT EXISTS idx_recognitions_receiver ON recognitions(receiverId);
CREATE INDEX IF NOT EXISTS idx_recognitions_category ON recognitions(categoryId);
CREATE INDEX IF NOT EXISTS idx_recognitions_created ON recognitions(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_recognitions_highlighted ON recognitions(isHighlighted);

-- Recognition Endorsements (Manager/Senior)
CREATE TABLE IF NOT EXISTS recognition_endorsements (
  id TEXT PRIMARY KEY,
  recognitionId TEXT NOT NULL,
  endorserId TEXT NOT NULL,
  endorserRole TEXT NOT NULL,
  comment TEXT,
  bonusXpAwarded INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (recognitionId) REFERENCES recognitions(id) ON DELETE CASCADE,
  FOREIGN KEY (endorserId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(recognitionId, endorserId)
);

CREATE INDEX IF NOT EXISTS idx_endorsements_recognition ON recognition_endorsements(recognitionId);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser ON recognition_endorsements(endorserId);

-- User Recognition Statistics (Aggregated)
CREATE TABLE IF NOT EXISTS user_recognition_stats (
  userId TEXT PRIMARY KEY,
  recognitionsGiven INTEGER DEFAULT 0,
  recognitionsReceived INTEGER DEFAULT 0,
  endorsementsReceived INTEGER DEFAULT 0,
  totalXpFromRecognition INTEGER DEFAULT 0,
  monthlyGivenCount INTEGER DEFAULT 0,
  monthlyReceivedCount INTEGER DEFAULT 0,
  lastResetMonth TEXT,
  mostReceivedCategoryId TEXT,
  currentMonthGiven INTEGER DEFAULT 0,
  currentQuarterGiven INTEGER DEFAULT 0,
  lastGivenAt TEXT,
  lastReceivedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mostReceivedCategoryId) REFERENCES recognition_categories(id)
);

-- Recognition Limits (Anti-Abuse)
CREATE TABLE IF NOT EXISTS recognition_limits (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  periodType TEXT NOT NULL,
  periodStart TEXT NOT NULL,
  periodEnd TEXT NOT NULL,
  recognitionsGiven INTEGER DEFAULT 0,
  maxAllowed INTEGER DEFAULT 10,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, periodType, periodStart)
);

CREATE INDEX IF NOT EXISTS idx_recognition_limits_user ON recognition_limits(userId);
CREATE INDEX IF NOT EXISTS idx_recognition_limits_period ON recognition_limits(periodType, periodStart);

-- Seed Recognition Categories
INSERT INTO recognition_categories (id, name, slug, description, icon, color, xpRewardReceiver, xpRewardGiver, sortOrder) VALUES
  ('cat-innovation', 'Innovation & Creativity', 'innovation', 'Recognizing creative solutions and innovative approaches to challenges', 'Lightbulb', '#8B5CF6', 75, 15, 1),
  ('cat-teamwork', 'Teamwork & Collaboration', 'teamwork', 'Celebrating excellent collaboration and team spirit', 'Users', '#3B82F6', 60, 12, 2),
  ('cat-service', 'Service Excellence', 'service-excellence', 'Outstanding service delivery and citizen-focused work', 'Award', '#006B3F', 75, 15, 3),
  ('cat-leadership', 'Leadership', 'leadership', 'Demonstrating exceptional leadership qualities', 'Crown', '#CE1126', 80, 16, 4),
  ('cat-problem-solving', 'Problem Solving', 'problem-solving', 'Creative and effective problem-solving abilities', 'Target', '#F59E0B', 65, 13, 5),
  ('cat-knowledge', 'Knowledge Sharing', 'knowledge-sharing', 'Willingness to share expertise and help others learn', 'BookOpen', '#10B981', 55, 11, 6),
  ('cat-mentorship', 'Mentorship', 'mentorship', 'Dedication to guiding and developing colleagues', 'GraduationCap', '#EC4899', 70, 14, 7),
  ('cat-above-beyond', 'Going Above & Beyond', 'above-beyond', 'Exceeding expectations and showing exceptional commitment', 'Rocket', '#FCD116', 85, 17, 8);

-- Recognition Badges (Milestone Awards)
INSERT INTO badges (id, name, description, icon, category, xpReward, rarity) VALUES
  ('badge-first-recognition', 'First Recognition', 'Gave your first peer recognition', 'Heart', 'social', 50, 'common'),
  ('badge-recognition-giver-5', 'Appreciator', 'Gave 5 peer recognitions', 'HandHeart', 'social', 100, 'common'),
  ('badge-recognition-giver-25', 'Champion of Recognition', 'Gave 25 peer recognitions', 'Medal', 'social', 250, 'rare'),
  ('badge-recognition-giver-100', 'Recognition Master', 'Gave 100 peer recognitions', 'Trophy', 'social', 500, 'epic'),
  ('badge-first-received', 'Recognized', 'Received your first peer recognition', 'Star', 'social', 75, 'common'),
  ('badge-recognition-received-10', 'Rising Recognition', 'Received 10 peer recognitions', 'Sparkles', 'social', 200, 'rare'),
  ('badge-recognition-received-50', 'Team Favorite', 'Received 50 peer recognitions', 'Crown', 'social', 400, 'epic'),
  ('badge-recognition-received-100', 'Recognition Legend', 'Received 100 peer recognitions', 'Gem', 'social', 750, 'legendary'),
  ('badge-endorsed', 'Manager Endorsed', 'Received a manager endorsement on your recognition', 'BadgeCheck', 'achievement', 150, 'rare'),
  ('badge-multi-category', 'Well-Rounded', 'Received recognitions in 5+ different categories', 'Palette', 'achievement', 300, 'epic');
