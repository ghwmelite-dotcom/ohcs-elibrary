-- ============================================
-- RESEARCH HUB ENHANCEMENTS
-- Migration: 035_research_hub_enhancements.sql
-- ============================================

-- 1. FTS5 standalone tables (NOT content-sync, since source tables use TEXT PRIMARY KEY)
-- These must be manually kept in sync via INSERT/DELETE in application code.
CREATE VIRTUAL TABLE IF NOT EXISTS research_projects_fts USING fts5(
  id UNINDEXED, title, research_question, hypothesis, methodology
);

CREATE VIRTUAL TABLE IF NOT EXISTS research_notes_fts USING fts5(
  id UNINDEXED, project_id UNINDEXED, title, content
);

CREATE VIRTUAL TABLE IF NOT EXISTS research_literature_fts USING fts5(
  id UNINDEXED, project_id UNINDEXED, external_title, external_authors, notes
);

-- Populate FTS tables from existing data
INSERT INTO research_projects_fts(id, title, research_question, hypothesis, methodology)
  SELECT id, title, COALESCE(research_question,''), COALESCE(hypothesis,''), COALESCE(methodology,'')
  FROM research_projects;

INSERT INTO research_notes_fts(id, project_id, title, content)
  SELECT id, project_id, COALESCE(title,''), COALESCE(content,'')
  FROM research_notes;

INSERT INTO research_literature_fts(id, project_id, external_title, external_authors, notes)
  SELECT id, project_id, COALESCE(external_title,''), COALESCE(external_authors,''), COALESCE(notes,'')
  FROM research_literature;

-- 2. Research file attachments table
CREATE TABLE IF NOT EXISTS research_attachments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  uploaded_by_id TEXT NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general', 'data', 'survey', 'instrument', 'literature', 'report', 'image', 'other'
  )),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_research_attachments_project ON research_attachments(project_id);

-- 3. Research notification templates
INSERT OR IGNORE INTO notification_templates (id, type, titleTemplate, messageTemplate, icon, color, defaultPriority) VALUES
  ('tpl-research-review-request', 'research_review_request', 'Review Requested', 'You have been asked to review a research project.', 'ClipboardCheck', '#8B5CF6', 'high'),
  ('tpl-research-review-complete', 'research_review_complete', 'Review Completed', 'A reviewer has completed their review of your project.', 'CheckCircle', '#10B981', 'normal'),
  ('tpl-research-discussion-reply', 'research_discussion_reply', 'New Discussion Reply', 'Someone replied to a research discussion.', 'MessageSquare', '#3B82F6', 'normal'),
  ('tpl-research-mention', 'research_mention', 'You Were Mentioned', 'You were mentioned in a research discussion.', 'AtSign', '#8B5CF6', 'normal'),
  ('tpl-research-milestone-due', 'research_milestone_due', 'Milestone Due Soon', 'A research milestone is approaching its deadline.', 'Clock', '#F59E0B', 'high'),
  ('tpl-research-phase-approval', 'research_phase_approval', 'Phase Approval Required', 'A project phase needs your approval to proceed.', 'ShieldCheck', '#006B3F', 'high'),
  ('tpl-research-phase-approved', 'research_phase_approved', 'Phase Approved', 'Your project phase has been approved.', 'CheckCircle', '#10B981', 'normal');

-- 4. Phase approval tracking
CREATE TABLE IF NOT EXISTS research_phase_approvals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  requested_by_id TEXT NOT NULL REFERENCES users(id),
  approved_by_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  requested_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_phase_approvals_project ON research_phase_approvals(project_id);

-- 5. Ethics approval tracking
CREATE TABLE IF NOT EXISTS research_ethics_approvals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  approval_body TEXT NOT NULL,
  reference_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'expired')),
  submitted_date TEXT,
  approval_date TEXT,
  expiry_date TEXT,
  conditions TEXT,
  document_r2_key TEXT,
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ethics_approvals_project ON research_ethics_approvals(project_id);
