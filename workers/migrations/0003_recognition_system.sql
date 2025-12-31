-- Recognition System Migration
-- Peer Recognition Tables and Seed Data

-- Recognition Categories Table
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
INSERT OR IGNORE INTO recognition_categories (id, name, slug, description, icon, color, xpRewardReceiver, xpRewardGiver, sortOrder) VALUES
  ('cat-innovation', 'Innovation & Creativity', 'innovation', 'Recognizing creative solutions and innovative approaches to challenges', 'Lightbulb', '#8B5CF6', 75, 15, 1),
  ('cat-teamwork', 'Teamwork & Collaboration', 'teamwork', 'Celebrating excellent collaboration and team spirit', 'Users', '#3B82F6', 60, 12, 2),
  ('cat-service', 'Service Excellence', 'service-excellence', 'Outstanding service delivery and citizen-focused work', 'Award', '#006B3F', 75, 15, 3),
  ('cat-leadership', 'Leadership', 'leadership', 'Demonstrating exceptional leadership qualities', 'Crown', '#CE1126', 80, 16, 4),
  ('cat-problem-solving', 'Problem Solving', 'problem-solving', 'Creative and effective problem-solving abilities', 'Target', '#F59E0B', 65, 13, 5),
  ('cat-knowledge', 'Knowledge Sharing', 'knowledge-sharing', 'Willingness to share expertise and help others learn', 'BookOpen', '#10B981', 55, 11, 6),
  ('cat-mentorship', 'Mentorship', 'mentorship', 'Dedication to guiding and developing colleagues', 'GraduationCap', '#EC4899', 70, 14, 7),
  ('cat-above-beyond', 'Going Above & Beyond', 'above-beyond', 'Exceeding expectations and showing exceptional commitment', 'Rocket', '#FCD116', 85, 17, 8);

-- Recognition Badges (Milestone Awards)
INSERT OR IGNORE INTO badges (id, name, description, icon, category, xpReward, rarity) VALUES
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
