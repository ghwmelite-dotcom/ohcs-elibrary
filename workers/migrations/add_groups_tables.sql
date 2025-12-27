-- Groups Tables Migration
-- Run this migration to add groups functionality

-- Group categories table
CREATE TABLE IF NOT EXISTS group_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📁',
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'open' CHECK (type IN ('open', 'closed', 'private', 'official')),
  categoryId TEXT,
  coverImage TEXT,
  avatar TEXT,
  createdById TEXT,
  mdaId TEXT,
  memberCount INTEGER DEFAULT 0,
  postCount INTEGER DEFAULT 0,
  isArchived INTEGER DEFAULT 0,
  settings TEXT, -- JSON for group settings
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (categoryId) REFERENCES group_categories(id)
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  groupId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),
  joinedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE(groupId, userId)
);

-- Group posts table
CREATE TABLE IF NOT EXISTS group_posts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  groupId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT, -- JSON array of attachments
  likes INTEGER DEFAULT 0,
  commentCount INTEGER DEFAULT 0,
  isPinned INTEGER DEFAULT 0,
  isDeleted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE
);

-- Group post likes table
CREATE TABLE IF NOT EXISTS group_post_likes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  postId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (postId) REFERENCES group_posts(id) ON DELETE CASCADE,
  UNIQUE(postId, userId)
);

-- Group comments table
CREATE TABLE IF NOT EXISTS group_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  postId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  content TEXT NOT NULL,
  parentId TEXT, -- For nested comments
  likes INTEGER DEFAULT 0,
  isDeleted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (postId) REFERENCES group_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parentId) REFERENCES group_comments(id)
);

-- Group comment likes table
CREATE TABLE IF NOT EXISTS group_comment_likes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  commentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (commentId) REFERENCES group_comments(id) ON DELETE CASCADE,
  UNIQUE(commentId, userId)
);

-- Group invitations table
CREATE TABLE IF NOT EXISTS group_invitations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  groupId TEXT NOT NULL,
  inviterId TEXT NOT NULL,
  inviteeId TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  createdAt TEXT DEFAULT (datetime('now')),
  respondedAt TEXT,
  FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE(groupId, inviteeId)
);

-- Group tags table
CREATE TABLE IF NOT EXISTS group_tags (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  groupId TEXT NOT NULL,
  tag TEXT NOT NULL,
  FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE(groupId, tag)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type);
CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups(slug);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(createdById);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(groupId);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(userId);
CREATE INDEX IF NOT EXISTS idx_group_posts_group ON group_posts(groupId);
CREATE INDEX IF NOT EXISTS idx_group_posts_author ON group_posts(authorId);
CREATE INDEX IF NOT EXISTS idx_group_comments_post ON group_comments(postId);
CREATE INDEX IF NOT EXISTS idx_group_tags_group ON group_tags(groupId);

-- Insert seed data for group categories
INSERT OR IGNORE INTO group_categories (id, name, description, icon, sortOrder) VALUES
  ('cat-professional', 'Professional', 'Professional development and career-focused groups', '💼', 1),
  ('cat-mda', 'MDA Groups', 'Groups organized by Ministry, Department or Agency', '🏛️', 2),
  ('cat-training', 'Training', 'Training, learning and skill development groups', '📚', 3),
  ('cat-social', 'Social', 'Social and recreational groups', '🎉', 4),
  ('cat-technology', 'Technology', 'Technology and innovation focused groups', '💻', 5),
  ('cat-regional', 'Regional', 'Regional and district office groups', '📍', 6);

-- Insert seed data for groups
INSERT OR IGNORE INTO groups (id, name, description, slug, type, categoryId, createdById, memberCount, postCount)
VALUES
  ('grp-digital-transform', 'Digital Transformation Committee', 'Official committee for driving digital transformation across the Ghana Civil Service. We discuss strategies, share best practices, and coordinate initiatives.', 'digital-transformation', 'official', 'cat-technology', NULL, 0, 0),
  ('grp-young-professionals', 'Young Professionals Network', 'A community for young professionals in the civil service to network, share opportunities, and support each other''s career development.', 'young-professionals', 'open', 'cat-professional', NULL, 0, 0),
  ('grp-it-professionals', 'IT Professionals Hub', 'A group for IT professionals working in government. Discuss technical challenges, share solutions, and stay updated on tech trends.', 'it-professionals', 'closed', 'cat-technology', NULL, 0, 0),
  ('grp-policy-research', 'Public Policy Research', 'For civil servants interested in public policy research and analysis. Share papers, discuss methodologies, and collaborate on research projects.', 'policy-research', 'open', 'cat-professional', NULL, 0, 0),
  ('grp-financial-mgmt', 'Financial Management Network', 'Connect with colleagues involved in financial management across MDAs. Discuss best practices, regulations, and professional development.', 'financial-management', 'open', 'cat-professional', NULL, 0, 0);

-- Insert tags for seed groups
INSERT OR IGNORE INTO group_tags (groupId, tag) VALUES
  ('grp-digital-transform', 'digital'),
  ('grp-digital-transform', 'technology'),
  ('grp-digital-transform', 'innovation'),
  ('grp-digital-transform', 'official'),
  ('grp-young-professionals', 'networking'),
  ('grp-young-professionals', 'career'),
  ('grp-young-professionals', 'youth'),
  ('grp-it-professionals', 'IT'),
  ('grp-it-professionals', 'technology'),
  ('grp-it-professionals', 'programming'),
  ('grp-policy-research', 'research'),
  ('grp-policy-research', 'policy'),
  ('grp-policy-research', 'analysis'),
  ('grp-financial-mgmt', 'finance'),
  ('grp-financial-mgmt', 'accounting'),
  ('grp-financial-mgmt', 'budget');
