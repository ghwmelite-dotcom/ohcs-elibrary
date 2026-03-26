-- ============================================================================
-- OHCS E-Library Gamification Tables Migration
-- Creates core gamification tables: badges, xp_transactions, user_badges,
-- user_stats, user_streaks, activity_log, achievements, user_achievements,
-- weekly_challenges, and user_challenge_progress.
-- ============================================================================

-- ============================================================================
-- BADGES (Badge definitions catalog)
-- Referenced by: gamification.ts, recognition.ts, lms.ts, 016_lms_badges.sql,
--                0003_recognition_system.sql
-- ============================================================================
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT NOT NULL DEFAULT 'general', -- general, learning, social, achievement
    xpReward INTEGER DEFAULT 0,
    rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);

-- ============================================================================
-- USER_STATS (Aggregated gamification stats per user)
-- Referenced by: gamification.ts, recognition.ts, forum.ts, lms.ts
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_stats (
    userId TEXT PRIMARY KEY,
    totalXp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    documentsRead INTEGER DEFAULT 0,
    forumPosts INTEGER DEFAULT 0,
    forumTopics INTEGER DEFAULT 0,
    bestAnswers INTEGER DEFAULT 0,
    badgesEarned INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_stats_totalXp ON user_stats(totalXp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(level);

-- ============================================================================
-- USER_STREAKS (Daily login/activity streak tracking)
-- Referenced by: gamification.ts
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_streaks (
    userId TEXT PRIMARY KEY,
    currentStreak INTEGER DEFAULT 0,
    longestStreak INTEGER DEFAULT 0,
    lastActivityDate TEXT NOT NULL DEFAULT (date('now')),
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- XP_TRANSACTIONS (XP earning event log)
-- Referenced by: gamification.ts, recognition.ts, forum.ts, lms.ts
-- ============================================================================
CREATE TABLE IF NOT EXISTS xp_transactions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT,
    referenceId TEXT,
    referenceType TEXT, -- 'recognition', 'endorsement', 'topic', 'post', 'challenge', 'learning', etc.
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_userId ON xp_transactions(userId);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_createdAt ON xp_transactions(createdAt);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_reference ON xp_transactions(userId, referenceId, referenceType);

-- ============================================================================
-- USER_BADGES (Badges earned by users)
-- Referenced by: gamification.ts, recognition.ts, lms.ts
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL,
    badgeId TEXT NOT NULL,
    earnedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badgeId) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE(userId, badgeId)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_userId ON user_badges(userId);
CREATE INDEX IF NOT EXISTS idx_user_badges_badgeId ON user_badges(badgeId);
CREATE INDEX IF NOT EXISTS idx_user_badges_earnedAt ON user_badges(earnedAt DESC);

-- ============================================================================
-- ACTIVITY_LOG (General user activity feed)
-- Referenced by: gamification.ts, forum.ts
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL,
    activityType TEXT NOT NULL, -- 'topic_created', 'forum_post', 'document_read', etc.
    title TEXT,
    description TEXT,
    xpEarned INTEGER DEFAULT 0,
    referenceId TEXT,
    referenceType TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_log_userId ON activity_log(userId);
CREATE INDEX IF NOT EXISTS idx_activity_log_createdAt ON activity_log(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_activityType ON activity_log(activityType);

-- ============================================================================
-- ACHIEVEMENTS (Achievement definitions)
-- Referenced by: gamification.ts (/gamification/achievements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT NOT NULL DEFAULT 'general', -- general, learning, social, streak, etc.
    triggerType TEXT, -- 'documents_read', 'forum_posts', 'streak', 'xp_total', etc.
    triggerValue INTEGER DEFAULT 0, -- Threshold value to earn this achievement
    xpReward INTEGER DEFAULT 0,
    isHidden INTEGER DEFAULT 0, -- Hidden until earned
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_triggerType ON achievements(triggerType);
CREATE INDEX IF NOT EXISTS idx_achievements_isHidden ON achievements(isHidden);

-- ============================================================================
-- USER_ACHIEVEMENTS (Achievements earned by users)
-- Referenced by: gamification.ts (/gamification/achievements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL,
    achievementId TEXT NOT NULL,
    earnedAt TEXT DEFAULT (datetime('now')),
    isNew INTEGER DEFAULT 1, -- 1 = not yet seen by user
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievementId) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE(userId, achievementId)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_userId ON user_achievements(userId);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievementId ON user_achievements(achievementId);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earnedAt ON user_achievements(earnedAt DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_isNew ON user_achievements(userId, isNew);

-- ============================================================================
-- WEEKLY_CHALLENGES (Challenge definitions with active date range)
-- Referenced by: gamification.ts (/gamification/challenges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_challenges (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    challengeType TEXT, -- 'documents_read', 'forum_posts', 'logins', 'xp_earned', etc.
    targetValue INTEGER NOT NULL DEFAULT 1,
    xpReward INTEGER DEFAULT 0,
    startDate TEXT NOT NULL, -- YYYY-MM-DD
    endDate TEXT NOT NULL,   -- YYYY-MM-DD
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_weekly_challenges_active ON weekly_challenges(isActive, startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_dates ON weekly_challenges(startDate, endDate);

-- ============================================================================
-- USER_CHALLENGE_PROGRESS (Per-user progress on weekly challenges)
-- Referenced by: gamification.ts (/gamification/challenges and /challenges/:id/progress)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_challenge_progress (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL,
    challengeId TEXT NOT NULL,
    currentProgress INTEGER DEFAULT 0,
    isCompleted INTEGER DEFAULT 0,
    completedAt TEXT,
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challengeId) REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    UNIQUE(userId, challengeId)
);

CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_userId ON user_challenge_progress(userId);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challengeId ON user_challenge_progress(challengeId);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_completed ON user_challenge_progress(isCompleted);

-- ============================================================================
-- SEED: Default badges referenced by gamification.ts and streak logic
-- ============================================================================
INSERT OR IGNORE INTO badges (id, name, description, icon, category, xpReward, rarity) VALUES
    ('badge-7-streak',  'Week Warrior',   'Maintained a 7-day login streak',   'Flame',  'streak',      150, 'common'),
    ('badge-30-streak', 'Monthly Master', 'Maintained a 30-day login streak',  'Trophy', 'streak',      500, 'rare');
