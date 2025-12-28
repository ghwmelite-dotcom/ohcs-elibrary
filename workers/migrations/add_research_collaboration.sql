-- Research Lab Phase 3: Collaboration Features
-- Run this migration to add collaboration tables

-- Research Notes (collaborative documents within projects)
CREATE TABLE IF NOT EXISTS research_notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'methodology', 'findings', 'discussion', 'conclusion', 'appendix')),
  is_pinned INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  last_edited_by_id TEXT REFERENCES users(id),
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_research_notes_project ON research_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_type ON research_notes(note_type);

-- Note Version History (for tracking changes)
CREATE TABLE IF NOT EXISTS research_note_versions (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES research_notes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  edited_by_id TEXT NOT NULL REFERENCES users(id),
  change_summary TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_note_versions_note ON research_note_versions(note_id);

-- Literature Annotations (highlights and comments on literature)
CREATE TABLE IF NOT EXISTS research_annotations (
  id TEXT PRIMARY KEY,
  literature_id TEXT NOT NULL REFERENCES research_literature(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  annotation_type TEXT DEFAULT 'highlight' CHECK (annotation_type IN ('highlight', 'comment', 'question', 'important', 'methodology', 'finding')),
  content TEXT NOT NULL,
  quote TEXT,
  color TEXT DEFAULT '#FFEB3B',
  page_number INTEGER,
  position_data TEXT,
  is_private INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_annotations_literature ON research_annotations(literature_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user ON research_annotations(user_id);

-- Peer Review Workflow
CREATE TABLE IF NOT EXISTS research_reviews (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES users(id),
  requested_by_id TEXT NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'changes_requested')),
  review_type TEXT DEFAULT 'full' CHECK (review_type IN ('full', 'methodology', 'findings', 'writing', 'final')),
  deadline TEXT,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  summary TEXT,
  strengths TEXT,
  weaknesses TEXT,
  recommendations TEXT,
  is_anonymous INTEGER DEFAULT 0,
  submitted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_project ON research_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON research_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON research_reviews(status);

-- Review Comments (inline feedback on specific sections)
CREATE TABLE IF NOT EXISTS research_review_comments (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES research_reviews(id) ON DELETE CASCADE,
  section TEXT,
  line_reference TEXT,
  comment_type TEXT DEFAULT 'suggestion' CHECK (comment_type IN ('suggestion', 'correction', 'question', 'praise', 'critical')),
  content TEXT NOT NULL,
  is_resolved INTEGER DEFAULT 0,
  resolved_by_id TEXT REFERENCES users(id),
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_review_comments_review ON research_review_comments(review_id);

-- Citations (bibliography management)
CREATE TABLE IF NOT EXISTS research_citations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  literature_id TEXT REFERENCES research_literature(id) ON DELETE SET NULL,
  citation_key TEXT NOT NULL,
  citation_type TEXT DEFAULT 'article' CHECK (citation_type IN ('article', 'book', 'chapter', 'conference', 'thesis', 'report', 'website', 'other')),
  title TEXT NOT NULL,
  authors TEXT,
  year INTEGER,
  journal TEXT,
  volume TEXT,
  issue TEXT,
  pages TEXT,
  publisher TEXT,
  doi TEXT,
  url TEXT,
  abstract TEXT,
  keywords TEXT,
  notes TEXT,
  apa_format TEXT,
  mla_format TEXT,
  chicago_format TEXT,
  harvard_format TEXT,
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_citations_project ON research_citations(project_id);
CREATE INDEX IF NOT EXISTS idx_citations_key ON research_citations(citation_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_citations_project_key ON research_citations(project_id, citation_key);

-- Discussion Threads (conversations on project sections)
CREATE TABLE IF NOT EXISTS research_discussions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  context_type TEXT DEFAULT 'general' CHECK (context_type IN ('general', 'note', 'literature', 'methodology', 'findings', 'review')),
  context_id TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  is_pinned INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TEXT,
  last_reply_by_id TEXT REFERENCES users(id),
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_discussions_project ON research_discussions(project_id);
CREATE INDEX IF NOT EXISTS idx_discussions_context ON research_discussions(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_discussions_status ON research_discussions(status);

-- Discussion Replies
CREATE TABLE IF NOT EXISTS research_discussion_replies (
  id TEXT PRIMARY KEY,
  discussion_id TEXT NOT NULL REFERENCES research_discussions(id) ON DELETE CASCADE,
  parent_reply_id TEXT REFERENCES research_discussion_replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion ON research_discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_parent ON research_discussion_replies(parent_reply_id);

-- Discussion Reactions (emoji reactions to replies)
CREATE TABLE IF NOT EXISTS research_discussion_reactions (
  id TEXT PRIMARY KEY,
  reply_id TEXT NOT NULL REFERENCES research_discussion_replies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  reaction TEXT NOT NULL CHECK (reaction IN ('thumbsup', 'thumbsdown', 'heart', 'celebrate', 'thinking', 'eyes')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(reply_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_discussion_reactions_reply ON research_discussion_reactions(reply_id);

-- Team Activity Feed (notifications for team collaboration)
CREATE TABLE IF NOT EXISTS research_team_activities (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'note_created', 'note_updated', 'note_deleted',
    'annotation_added', 'annotation_updated',
    'review_requested', 'review_submitted', 'review_approved', 'review_rejected',
    'citation_added', 'citation_updated',
    'discussion_started', 'discussion_replied', 'discussion_resolved',
    'member_joined', 'member_left', 'phase_changed'
  )),
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_team_activities_project ON research_team_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_user ON research_team_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_created ON research_team_activities(created_at DESC);

-- Add collaboration counts to projects (for quick access)
-- Note: These would be updated via triggers or application logic
