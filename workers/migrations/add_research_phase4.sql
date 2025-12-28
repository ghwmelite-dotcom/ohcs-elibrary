-- Research Lab Phase 4: Advanced Analytics & Publishing
-- Run this migration to add advanced features

-- Research Milestones (timeline tracking)
CREATE TABLE IF NOT EXISTS research_milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT DEFAULT 'custom',
  target_date TEXT,
  completed_date TEXT,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  assigned_to_id TEXT,
  dependencies TEXT,
  deliverables TEXT,
  notes TEXT,
  created_by_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON research_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON research_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_target ON research_milestones(target_date);

-- Research Templates (pre-built project structures)
CREATE TABLE IF NOT EXISTS research_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  methodology TEXT NOT NULL,
  structure TEXT NOT NULL,
  default_objectives TEXT,
  suggested_literature TEXT,
  estimated_duration_days INTEGER,
  difficulty_level TEXT DEFAULT 'intermediate',
  usage_count INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  created_by_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON research_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_methodology ON research_templates(methodology);

-- Research Exports (generated documents)
CREATE TABLE IF NOT EXISTS research_exports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  export_type TEXT NOT NULL,
  format_style TEXT DEFAULT 'apa',
  title TEXT NOT NULL,
  content_sections TEXT NOT NULL,
  include_citations INTEGER DEFAULT 1,
  include_appendices INTEGER DEFAULT 0,
  file_url TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  generated_by_id TEXT NOT NULL,
  generated_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_exports_project ON research_exports(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON research_exports(status);

-- Research Analytics Snapshots (periodic metrics)
CREATE TABLE IF NOT EXISTS research_analytics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_analytics_project ON research_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON research_analytics(snapshot_date);

-- Team Contributions (track individual contributions)
CREATE TABLE IF NOT EXISTS research_contributions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  contribution_date TEXT NOT NULL,
  contribution_type TEXT NOT NULL,
  contribution_count INTEGER DEFAULT 1,
  points_earned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contributions_project ON research_contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user ON research_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON research_contributions(contribution_date);

-- Research Tags (enhanced tagging system)
CREATE TABLE IF NOT EXISTS research_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  usage_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON research_tags(slug);

-- Project-Tag associations
CREATE TABLE IF NOT EXISTS research_project_tags (
  project_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (project_id, tag_id)
);
