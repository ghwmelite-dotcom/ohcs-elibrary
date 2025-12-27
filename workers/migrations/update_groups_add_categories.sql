-- Add categories table and categoryId to groups
-- Run this migration to add categories functionality

-- Group categories table
CREATE TABLE IF NOT EXISTS group_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📁',
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Add categoryId column to groups table if it doesn't exist
-- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we handle errors gracefully
ALTER TABLE groups ADD COLUMN categoryId TEXT REFERENCES group_categories(id);

-- Insert seed data for group categories
INSERT OR IGNORE INTO group_categories (id, name, description, icon, sortOrder) VALUES
  ('cat-professional', 'Professional', 'Professional development and career-focused groups', '💼', 1),
  ('cat-mda', 'MDA Groups', 'Groups organized by Ministry, Department or Agency', '🏛️', 2),
  ('cat-training', 'Training', 'Training, learning and skill development groups', '📚', 3),
  ('cat-social', 'Social', 'Social and recreational groups', '🎉', 4),
  ('cat-technology', 'Technology', 'Technology and innovation focused groups', '💻', 5),
  ('cat-regional', 'Regional', 'Regional and district office groups', '📍', 6);

-- Update existing groups with categories
UPDATE groups SET categoryId = 'cat-technology' WHERE id = 'grp-digital-transform' AND categoryId IS NULL;
UPDATE groups SET categoryId = 'cat-professional' WHERE id = 'grp-young-professionals' AND categoryId IS NULL;
UPDATE groups SET categoryId = 'cat-technology' WHERE id = 'grp-it-professionals' AND categoryId IS NULL;
UPDATE groups SET categoryId = 'cat-professional' WHERE id = 'grp-policy-research' AND categoryId IS NULL;
UPDATE groups SET categoryId = 'cat-professional' WHERE id = 'grp-financial-mgmt' AND categoryId IS NULL;
