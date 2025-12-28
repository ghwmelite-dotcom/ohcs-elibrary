-- ============================================================================
-- Research Lab Database Migration
-- Creates tables for the AI-powered research platform
-- ============================================================================

-- Research Projects Table
CREATE TABLE IF NOT EXISTS research_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  research_question TEXT NOT NULL,
  hypothesis TEXT,
  objectives TEXT, -- JSON array
  methodology TEXT NOT NULL DEFAULT 'qualitative',
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'draft',
  phase TEXT NOT NULL DEFAULT 'ideation',
  tags TEXT, -- JSON array

  -- Team
  created_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_lead_id TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Progress
  progress INTEGER NOT NULL DEFAULT 0,
  start_date TEXT,
  target_end_date TEXT,
  completed_at TEXT,

  -- Metadata
  is_public INTEGER NOT NULL DEFAULT 0,
  mda_id TEXT REFERENCES mdas(id) ON DELETE SET NULL,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Research Team Members Table
CREATE TABLE IF NOT EXISTS research_team_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'researcher',
  permissions TEXT, -- JSON array
  contribution TEXT,
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(project_id, user_id)
);

-- Research Literature Table (documents linked to projects)
CREATE TABLE IF NOT EXISTS research_literature (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,

  -- External source fields
  external_title TEXT,
  external_url TEXT,
  external_authors TEXT,
  external_year INTEGER,
  external_source TEXT,

  -- Research fields
  citation_key TEXT NOT NULL,
  relevance_score REAL DEFAULT 0.5,
  notes TEXT,
  tags TEXT, -- JSON array

  -- Tracking
  added_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TEXT
);

-- Research Annotations Table
CREATE TABLE IF NOT EXISTS research_annotations (
  id TEXT PRIMARY KEY,
  literature_id TEXT NOT NULL REFERENCES research_literature(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  page_number INTEGER,
  highlight TEXT,
  color TEXT DEFAULT '#FBBF24',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Research Insights Table (AI-generated and manual)
CREATE TABLE IF NOT EXISTS research_insights (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'key_finding',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence REAL DEFAULT 0.8,
  sources TEXT, -- JSON array of document/literature IDs

  -- Generation tracking
  is_ai_generated INTEGER NOT NULL DEFAULT 1,
  is_verified INTEGER NOT NULL DEFAULT 0,
  verified_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  verified_at TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Research Briefs Table
CREATE TABLE IF NOT EXISTS research_briefs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  executive_summary TEXT NOT NULL,
  background TEXT,
  methodology TEXT,
  key_findings TEXT, -- JSON array
  recommendations TEXT, -- JSON array
  conclusion TEXT,
  limitations TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,

  -- Generation
  is_ai_generated INTEGER NOT NULL DEFAULT 0,
  generated_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- Review
  reviewed_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  review_notes TEXT,

  -- Publication
  published_at TEXT,
  published_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Research Templates Table
CREATE TABLE IF NOT EXISTS research_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  methodology TEXT NOT NULL,
  default_objectives TEXT, -- JSON array
  suggested_phases TEXT, -- JSON array
  guideline_url TEXT,
  is_official INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Research Activity Log Table
CREATE TABLE IF NOT EXISTS research_activities (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Research Comments Table
CREATE TABLE IF NOT EXISTS research_comments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id TEXT REFERENCES research_comments(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_research_projects_status ON research_projects(status);
CREATE INDEX IF NOT EXISTS idx_research_projects_category ON research_projects(category);
CREATE INDEX IF NOT EXISTS idx_research_projects_created_by ON research_projects(created_by_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_team_lead ON research_projects(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_mda ON research_projects(mda_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_phase ON research_projects(phase);
CREATE INDEX IF NOT EXISTS idx_research_projects_public ON research_projects(is_public);

CREATE INDEX IF NOT EXISTS idx_research_team_members_project ON research_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_research_team_members_user ON research_team_members(user_id);

CREATE INDEX IF NOT EXISTS idx_research_literature_project ON research_literature(project_id);
CREATE INDEX IF NOT EXISTS idx_research_literature_document ON research_literature(document_id);

CREATE INDEX IF NOT EXISTS idx_research_insights_project ON research_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_research_insights_type ON research_insights(type);

CREATE INDEX IF NOT EXISTS idx_research_briefs_project ON research_briefs(project_id);
CREATE INDEX IF NOT EXISTS idx_research_briefs_status ON research_briefs(status);

CREATE INDEX IF NOT EXISTS idx_research_activities_project ON research_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_research_activities_user ON research_activities(user_id);

CREATE INDEX IF NOT EXISTS idx_research_comments_project ON research_comments(project_id);

-- ============================================================================
-- Seed Research Templates
-- ============================================================================

INSERT OR IGNORE INTO research_templates (id, name, description, category, methodology, default_objectives, suggested_phases, is_official, created_at) VALUES
(
  'tmpl-policy-impact',
  'Policy Impact Assessment',
  'Evaluate the effects and outcomes of proposed or existing policies on stakeholders and service delivery.',
  'policy_impact',
  'mixed_methods',
  '["Assess current policy effectiveness", "Identify stakeholder impacts", "Measure outcome indicators", "Recommend improvements"]',
  '["ideation", "literature_review", "methodology", "data_collection", "analysis", "writing", "peer_review"]',
  1,
  CURRENT_TIMESTAMP
),
(
  'tmpl-performance-audit',
  'Performance Audit',
  'Systematically examine ministry or department performance against established standards and objectives.',
  'performance_audit',
  'quantitative',
  '["Define performance criteria", "Collect performance data", "Benchmark against standards", "Identify gaps and recommendations"]',
  '["ideation", "methodology", "data_collection", "analysis", "writing", "peer_review"]',
  1,
  CURRENT_TIMESTAMP
),
(
  'tmpl-capacity-needs',
  'Capacity Needs Assessment',
  'Identify training and skill development needs across civil service units.',
  'capacity_assessment',
  'survey',
  '["Map current competencies", "Identify skill gaps", "Prioritize training needs", "Develop capacity plan"]',
  '["ideation", "literature_review", "methodology", "data_collection", "analysis", "writing"]',
  1,
  CURRENT_TIMESTAMP
),
(
  'tmpl-citizen-feedback',
  'Citizen Feedback Analysis',
  'Analyze and synthesize citizen feedback on public services to improve service delivery.',
  'citizen_feedback',
  'qualitative',
  '["Collect feedback data", "Categorize feedback themes", "Analyze sentiment patterns", "Generate actionable insights"]',
  '["ideation", "methodology", "data_collection", "analysis", "writing", "peer_review"]',
  1,
  CURRENT_TIMESTAMP
),
(
  'tmpl-budget-efficiency',
  'Budget Efficiency Study',
  'Analyze resource allocation and spending patterns to identify optimization opportunities.',
  'budget_analysis',
  'quantitative',
  '["Review budget allocations", "Analyze spending patterns", "Identify inefficiencies", "Propose optimization strategies"]',
  '["ideation", "literature_review", "data_collection", "analysis", "writing", "peer_review"]',
  1,
  CURRENT_TIMESTAMP
),
(
  'tmpl-digital-readiness',
  'Digital Readiness Assessment',
  'Evaluate organizational readiness for digital transformation initiatives.',
  'digital_transformation',
  'mixed_methods',
  '["Assess current digital maturity", "Identify infrastructure gaps", "Evaluate staff digital skills", "Develop transformation roadmap"]',
  '["ideation", "literature_review", "methodology", "data_collection", "analysis", "writing"]',
  1,
  CURRENT_TIMESTAMP
),
(
  'tmpl-comparative-policy',
  'Comparative Policy Analysis',
  'Compare Ghana''s policies with international best practices and standards.',
  'governance',
  'comparative',
  '["Select comparison countries", "Map policy frameworks", "Identify best practices", "Adapt recommendations for Ghana"]',
  '["ideation", "literature_review", "methodology", "analysis", "writing", "peer_review", "publication"]',
  1,
  CURRENT_TIMESTAMP
);
