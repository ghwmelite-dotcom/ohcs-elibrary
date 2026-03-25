-- Migration 036: Fix Research Table Constraints
--
-- Problem: Tables created by add_research_phase4.sql lack FK constraints,
-- CHECK constraints, and some indexes. add_research_advanced.sql has the
-- correct schemas but CREATE TABLE IF NOT EXISTS is a no-op since tables
-- already exist.
--
-- Solution: Recreate 6 tables (research_tags is already correct) using
-- SQLite's create-copy-drop-rename pattern to add proper constraints.
--
-- Tables fixed:
--   1. research_milestones   — Add FK to research_projects/users, CHECK on milestone_type/status
--   2. research_templates    — Add FK to users, CHECK on difficulty_level, idx_templates_featured
--   3. research_exports      — Add FK to research_projects/users, CHECK on export_type/format_style/status
--   4. research_analytics    — Add FK to research_projects, unique index on (project_id, snapshot_date)
--   5. research_contributions — Add FK to research_projects/users, CHECK on contribution_type
--   6. research_project_tags — Add FK to research_projects/research_tags with ON DELETE CASCADE

-- ============================================================
-- 1. Fix research_milestones
-- ============================================================
CREATE TABLE IF NOT EXISTS research_milestones_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT DEFAULT 'custom' CHECK (milestone_type IN (
    'kickoff', 'literature_review', 'data_collection', 'analysis',
    'draft_complete', 'peer_review', 'revision', 'final_submission',
    'publication', 'presentation', 'custom'
  )),
  target_date TEXT,
  completed_date TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')),
  priority INTEGER DEFAULT 0,
  assigned_to_id TEXT REFERENCES users(id),
  dependencies TEXT,
  deliverables TEXT,
  notes TEXT,
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO research_milestones_new SELECT * FROM research_milestones;
DROP TABLE research_milestones;
ALTER TABLE research_milestones_new RENAME TO research_milestones;

CREATE INDEX IF NOT EXISTS idx_milestones_project ON research_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON research_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_target ON research_milestones(target_date);

-- ============================================================
-- 2. Fix research_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS research_templates_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  methodology TEXT NOT NULL,
  structure TEXT NOT NULL,
  default_objectives TEXT,
  suggested_literature TEXT,
  estimated_duration_days INTEGER,
  difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  usage_count INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  created_by_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO research_templates_new SELECT * FROM research_templates;
DROP TABLE research_templates;
ALTER TABLE research_templates_new RENAME TO research_templates;

CREATE INDEX IF NOT EXISTS idx_templates_category ON research_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_methodology ON research_templates(methodology);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON research_templates(is_featured);

-- ============================================================
-- 3. Fix research_exports
-- ============================================================
CREATE TABLE IF NOT EXISTS research_exports_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'docx', 'latex', 'html', 'markdown', 'bibtex')),
  format_style TEXT DEFAULT 'apa' CHECK (format_style IN ('apa', 'mla', 'chicago', 'harvard', 'ieee', 'custom')),
  title TEXT NOT NULL,
  content_sections TEXT NOT NULL,
  include_citations INTEGER DEFAULT 1,
  include_appendices INTEGER DEFAULT 0,
  file_url TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  generated_by_id TEXT NOT NULL REFERENCES users(id),
  generated_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO research_exports_new SELECT * FROM research_exports;
DROP TABLE research_exports;
ALTER TABLE research_exports_new RENAME TO research_exports;

CREATE INDEX IF NOT EXISTS idx_exports_project ON research_exports(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON research_exports(status);

-- ============================================================
-- 4. Fix research_analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS research_analytics_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  snapshot_date TEXT NOT NULL,
  metrics TEXT NOT NULL,
  total_notes INTEGER DEFAULT 0,
  total_citations INTEGER DEFAULT 0,
  total_discussions INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  literature_count INTEGER DEFAULT 0,
  insight_count INTEGER DEFAULT 0,
  brief_count INTEGER DEFAULT 0,
  team_activity_count INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO research_analytics_new SELECT * FROM research_analytics;
DROP TABLE research_analytics;
ALTER TABLE research_analytics_new RENAME TO research_analytics;

CREATE INDEX IF NOT EXISTS idx_analytics_project ON research_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON research_analytics(snapshot_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_project_date ON research_analytics(project_id, snapshot_date);

-- ============================================================
-- 5. Fix research_contributions
-- ============================================================
CREATE TABLE IF NOT EXISTS research_contributions_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  contribution_date TEXT NOT NULL,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN (
    'note_created', 'note_edited', 'citation_added', 'literature_added',
    'discussion_started', 'discussion_replied', 'review_submitted',
    'insight_generated', 'brief_generated', 'milestone_completed'
  )),
  contribution_count INTEGER DEFAULT 1,
  points_earned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO research_contributions_new SELECT * FROM research_contributions;
DROP TABLE research_contributions;
ALTER TABLE research_contributions_new RENAME TO research_contributions;

CREATE INDEX IF NOT EXISTS idx_contributions_project ON research_contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user ON research_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON research_contributions(contribution_date);

-- ============================================================
-- 6. Fix research_project_tags
-- ============================================================
CREATE TABLE IF NOT EXISTS research_project_tags_new (
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES research_tags(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (project_id, tag_id)
);

INSERT INTO research_project_tags_new SELECT * FROM research_project_tags;
DROP TABLE research_project_tags;
ALTER TABLE research_project_tags_new RENAME TO research_project_tags;
