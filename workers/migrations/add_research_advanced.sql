-- Research Lab Phase 4: Advanced Analytics & Publishing
-- Run this migration to add advanced features

-- Research Milestones (timeline tracking)
CREATE TABLE IF NOT EXISTS research_milestones (
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
  dependencies TEXT, -- JSON array of milestone IDs
  deliverables TEXT, -- JSON array of expected outputs
  notes TEXT,
  created_by_id TEXT NOT NULL REFERENCES users(id),
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
  structure TEXT NOT NULL, -- JSON: phases, milestones, note types, etc.
  default_objectives TEXT, -- JSON array
  suggested_literature TEXT, -- JSON array of topics
  estimated_duration_days INTEGER,
  difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  usage_count INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  created_by_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON research_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_methodology ON research_templates(methodology);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON research_templates(is_featured);

-- Research Exports (generated documents)
CREATE TABLE IF NOT EXISTS research_exports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'docx', 'latex', 'html', 'markdown', 'bibtex')),
  format_style TEXT DEFAULT 'apa' CHECK (format_style IN ('apa', 'mla', 'chicago', 'harvard', 'ieee', 'custom')),
  title TEXT NOT NULL,
  content_sections TEXT NOT NULL, -- JSON: which sections to include
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

CREATE INDEX IF NOT EXISTS idx_exports_project ON research_exports(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON research_exports(status);

-- Research Analytics Snapshots (periodic metrics)
CREATE TABLE IF NOT EXISTS research_analytics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  snapshot_date TEXT NOT NULL,
  metrics TEXT NOT NULL, -- JSON with various metrics
  -- Core metrics stored as columns for efficient querying
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_project_date ON research_analytics(project_id, snapshot_date);

-- Team Contributions (track individual contributions)
CREATE TABLE IF NOT EXISTS research_contributions (
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
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES research_tags(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (project_id, tag_id)
);

-- Seed some default templates
INSERT OR IGNORE INTO research_templates (id, name, description, category, methodology, structure, default_objectives, estimated_duration_days, difficulty_level, is_featured, is_public) VALUES
(
  'tpl_policy_analysis',
  'Policy Analysis Framework',
  'Comprehensive framework for analyzing public policies in Ghana''s civil service context',
  'policy',
  'mixed',
  '{"phases":["problem_definition","stakeholder_analysis","policy_options","impact_assessment","recommendations"],"milestones":["Literature Review","Stakeholder Mapping","Options Analysis","Draft Report","Final Submission"],"noteTypes":["methodology","findings","discussion"]}',
  '["Analyze current policy landscape","Identify key stakeholders","Evaluate policy alternatives","Provide evidence-based recommendations"]',
  90,
  'intermediate',
  1,
  1
),
(
  'tpl_case_study',
  'Case Study Research',
  'In-depth analysis of specific cases within Ghana''s public sector',
  'governance',
  'qualitative',
  '{"phases":["case_selection","data_collection","analysis","cross_case_comparison","conclusions"],"milestones":["Case Selection","Interview Protocol","Data Collection","Analysis","Report Writing"],"noteTypes":["methodology","findings","appendix"]}',
  '["Select representative cases","Develop data collection instruments","Conduct thorough analysis","Draw meaningful conclusions"]',
  120,
  'advanced',
  1,
  1
),
(
  'tpl_survey_research',
  'Survey Research Design',
  'Structured approach for conducting surveys across government departments',
  'service_delivery',
  'quantitative',
  '{"phases":["design","sampling","data_collection","analysis","reporting"],"milestones":["Survey Design","Pilot Testing","Data Collection","Statistical Analysis","Report"],"noteTypes":["methodology","findings","conclusion"]}',
  '["Design valid survey instrument","Ensure representative sampling","Collect quality data","Apply appropriate statistical methods"]',
  60,
  'intermediate',
  1,
  1
),
(
  'tpl_literature_review',
  'Systematic Literature Review',
  'Methodical review of existing research and documentation',
  'reform',
  'qualitative',
  '{"phases":["protocol_development","search","screening","extraction","synthesis"],"milestones":["Search Strategy","Initial Screening","Full-text Review","Data Extraction","Synthesis"],"noteTypes":["methodology","findings","discussion"]}',
  '["Define clear research questions","Develop comprehensive search strategy","Apply rigorous screening criteria","Synthesize findings systematically"]',
  45,
  'beginner',
  1,
  1
),
(
  'tpl_evaluation',
  'Program Evaluation',
  'Evaluate effectiveness of government programs and initiatives',
  'service_delivery',
  'mixed',
  '{"phases":["evaluation_design","baseline","implementation","outcome_assessment","recommendations"],"milestones":["Evaluation Framework","Baseline Data","Mid-term Review","Final Evaluation","Report"],"noteTypes":["methodology","findings","recommendations"]}',
  '["Establish evaluation criteria","Collect baseline data","Monitor implementation","Assess outcomes and impact"]',
  180,
  'advanced',
  0,
  1
);

