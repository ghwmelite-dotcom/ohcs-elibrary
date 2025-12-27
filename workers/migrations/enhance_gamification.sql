-- Enhanced Gamification System Migration
-- Adds weekly challenges, achievements, MDA competitions, and milestones

-- ============================================
-- WEEKLY CHALLENGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  targetType TEXT NOT NULL, -- 'documents_read', 'forum_posts', 'xp_earned', 'logins', 'badges'
  targetValue INTEGER NOT NULL,
  xpReward INTEGER NOT NULL DEFAULT 100,
  badgeReward TEXT, -- Optional badge ID
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- User challenge progress
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  challengeId TEXT NOT NULL,
  currentProgress INTEGER DEFAULT 0,
  isCompleted INTEGER DEFAULT 0,
  completedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  UNIQUE(userId, challengeId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (challengeId) REFERENCES weekly_challenges(id)
);

-- ============================================
-- ACHIEVEMENTS/MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- 'reading', 'community', 'streak', 'level', 'special'
  triggerType TEXT NOT NULL, -- 'documents_read', 'forum_posts', 'xp_total', 'streak_days', 'badges_earned', 'level_reached'
  triggerValue INTEGER NOT NULL,
  xpReward INTEGER NOT NULL DEFAULT 50,
  rarity TEXT DEFAULT 'common', -- common, uncommon, rare, epic, legendary
  isHidden INTEGER DEFAULT 0, -- Hidden until earned
  createdAt TEXT DEFAULT (datetime('now'))
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  achievementId TEXT NOT NULL,
  earnedAt TEXT DEFAULT (datetime('now')),
  isNew INTEGER DEFAULT 1,
  UNIQUE(userId, achievementId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (achievementId) REFERENCES achievements(id)
);

-- ============================================
-- MDA STATS TABLE (For MDA Competition)
-- ============================================
CREATE TABLE IF NOT EXISTS mda_stats (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mdaId TEXT NOT NULL,
  totalXp INTEGER DEFAULT 0,
  avgXpPerUser INTEGER DEFAULT 0,
  activeUsers INTEGER DEFAULT 0,
  documentsUploaded INTEGER DEFAULT 0,
  documentsRead INTEGER DEFAULT 0,
  forumContributions INTEGER DEFAULT 0,
  weeklyXp INTEGER DEFAULT 0,
  monthlyXp INTEGER DEFAULT 0,
  lastUpdated TEXT DEFAULT (datetime('now')),
  UNIQUE(mdaId),
  FOREIGN KEY (mdaId) REFERENCES mdas(id)
);

-- ============================================
-- USER WEEKLY ACTIVITY (For activity heatmap)
-- ============================================
CREATE TABLE IF NOT EXISTS user_daily_activity (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  activityDate TEXT NOT NULL,
  xpEarned INTEGER DEFAULT 0,
  documentsRead INTEGER DEFAULT 0,
  forumPosts INTEGER DEFAULT 0,
  loginCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(userId, activityDate),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_active ON weekly_challenges(isActive);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_dates ON weekly_challenges(startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_userId ON user_challenge_progress(userId);
CREATE INDEX IF NOT EXISTS idx_user_achievements_userId ON user_achievements(userId);
CREATE INDEX IF NOT EXISTS idx_mda_stats_totalXp ON mda_stats(totalXp DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_userId ON user_daily_activity(userId);
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_date ON user_daily_activity(activityDate);

-- ============================================
-- INSERT DEFAULT BADGES
-- ============================================
INSERT OR IGNORE INTO badges (id, name, description, icon, category, xpReward, rarity) VALUES
-- Onboarding Badges
('badge-welcome', 'Welcome!', 'Complete your profile setup', '👋', 'onboarding', 50, 'common'),
('badge-first-doc', 'First Read', 'Read your first document', '📖', 'reading', 25, 'common'),
('badge-first-upload', 'Contributor', 'Upload your first document', '📤', 'community', 100, 'uncommon'),
('badge-first-post', 'Voice Heard', 'Create your first forum post', '💬', 'community', 50, 'common'),

-- Streak Badges
('badge-7-streak', 'Week Warrior', '7-day login streak', '🔥', 'streak', 100, 'uncommon'),
('badge-14-streak', 'Fortnight Fighter', '14-day login streak', '🌟', 'streak', 200, 'rare'),
('badge-30-streak', 'Monthly Master', '30-day login streak', '👑', 'streak', 500, 'epic'),
('badge-100-streak', 'Legendary Dedication', '100-day login streak', '💎', 'streak', 1000, 'legendary'),

-- Reading Badges
('badge-reader-10', 'Avid Reader', 'Read 10 documents', '📚', 'reading', 100, 'uncommon'),
('badge-reader-50', 'Scholar', 'Read 50 documents', '🎓', 'reading', 250, 'rare'),
('badge-reader-100', 'Wisdom Seeker', 'Read 100 documents', '🦉', 'reading', 500, 'epic'),
('badge-reader-500', 'Knowledge Master', 'Read 500 documents', '📜', 'reading', 1000, 'legendary'),

-- Community Badges
('badge-helper-10', 'Helpful Hand', 'Receive 10 upvotes', '👍', 'community', 100, 'uncommon'),
('badge-helper-50', 'Community Star', 'Receive 50 upvotes', '⭐', 'community', 250, 'rare'),
('badge-helper-100', 'Thought Leader', 'Receive 100 upvotes', '🏆', 'community', 500, 'epic'),
('badge-best-answer-5', 'Problem Solver', 'Get 5 best answers', '✅', 'community', 200, 'rare'),
('badge-best-answer-25', 'Expert Advisor', 'Get 25 best answers', '🎯', 'community', 500, 'epic'),

-- Level Badges
('badge-level-5', 'Rising Star', 'Reach level 5', '🌟', 'level', 200, 'uncommon'),
('badge-level-7', 'Expert', 'Reach level 7', '🏅', 'level', 300, 'rare'),
('badge-level-10', 'Grandmaster', 'Reach level 10', '👑', 'level', 500, 'legendary'),

-- Special Badges
('badge-early-adopter', 'Early Adopter', 'Joined in the first month', '🚀', 'special', 100, 'epic'),
('badge-nightowl', 'Night Owl', 'Active after midnight', '🦉', 'special', 50, 'uncommon'),
('badge-weekend-warrior', 'Weekend Warrior', 'Active on weekends', '🏖️', 'special', 50, 'uncommon');

-- ============================================
-- INSERT DEFAULT ACHIEVEMENTS
-- ============================================
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, triggerType, triggerValue, xpReward, rarity) VALUES
-- XP Milestones
('ach-xp-100', 'Getting Started', 'Earn 100 XP', '🌱', 'level', 'xp_total', 100, 25, 'common'),
('ach-xp-500', 'Making Progress', 'Earn 500 XP', '📈', 'level', 'xp_total', 500, 50, 'common'),
('ach-xp-1000', 'Dedicated Learner', 'Earn 1,000 XP', '⚡', 'level', 'xp_total', 1000, 100, 'uncommon'),
('ach-xp-5000', 'Knowledge Enthusiast', 'Earn 5,000 XP', '🔥', 'level', 'xp_total', 5000, 250, 'rare'),
('ach-xp-10000', 'XP Legend', 'Earn 10,000 XP', '💎', 'level', 'xp_total', 10000, 500, 'epic'),

-- Reading Milestones
('ach-read-5', 'Curious Mind', 'Read 5 documents', '👀', 'reading', 'documents_read', 5, 25, 'common'),
('ach-read-25', 'Information Seeker', 'Read 25 documents', '🔍', 'reading', 'documents_read', 25, 100, 'uncommon'),
('ach-read-100', 'Research Pro', 'Read 100 documents', '🧪', 'reading', 'documents_read', 100, 300, 'rare'),

-- Forum Milestones
('ach-posts-10', 'Discussion Starter', 'Create 10 forum posts', '💭', 'community', 'forum_posts', 10, 50, 'common'),
('ach-posts-50', 'Active Contributor', 'Create 50 forum posts', '🗣️', 'community', 'forum_posts', 50, 200, 'uncommon'),
('ach-posts-100', 'Forum Champion', 'Create 100 forum posts', '🏆', 'community', 'forum_posts', 100, 400, 'rare'),

-- Streak Milestones
('ach-streak-3', 'Getting Consistent', '3-day streak', '📅', 'streak', 'streak_days', 3, 25, 'common'),
('ach-streak-7', 'Week Strong', '7-day streak', '💪', 'streak', 'streak_days', 7, 50, 'uncommon'),
('ach-streak-30', 'Monthly Dedication', '30-day streak', '🌙', 'streak', 'streak_days', 30, 200, 'rare'),

-- Badge Collection
('ach-badges-5', 'Collector', 'Earn 5 badges', '🎖️', 'special', 'badges_earned', 5, 100, 'uncommon'),
('ach-badges-10', 'Badge Hunter', 'Earn 10 badges', '🏅', 'special', 'badges_earned', 10, 250, 'rare'),
('ach-badges-20', 'Trophy Master', 'Earn 20 badges', '🏆', 'special', 'badges_earned', 20, 500, 'epic');

-- ============================================
-- INSERT FIRST WEEKLY CHALLENGE
-- ============================================
INSERT OR IGNORE INTO weekly_challenges (id, title, description, icon, targetType, targetValue, xpReward, startDate, endDate) VALUES
('challenge-week-1', 'Knowledge Sprint', 'Read 5 documents this week', '📚', 'documents_read', 5, 150, date('now', 'weekday 0', '-7 days'), date('now', 'weekday 0')),
('challenge-week-2', 'Community Voice', 'Create 3 forum posts this week', '💬', 'forum_posts', 3, 100, date('now', 'weekday 0', '-7 days'), date('now', 'weekday 0')),
('challenge-week-3', 'XP Hunter', 'Earn 200 XP this week', '⚡', 'xp_earned', 200, 75, date('now', 'weekday 0', '-7 days'), date('now', 'weekday 0'));
