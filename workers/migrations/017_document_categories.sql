-- Document Categories Table
-- Allows admins to manage document categories dynamically

CREATE TABLE IF NOT EXISTS document_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#006B3F',
  sortOrder INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  documentCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_document_categories_sort ON document_categories(sortOrder, name);
CREATE INDEX IF NOT EXISTS idx_document_categories_active ON document_categories(isActive);

-- Insert default categories
INSERT OR IGNORE INTO document_categories (id, name, slug, description, icon, color, sortOrder) VALUES
  ('cat-policy', 'Policy Documents', 'policy-documents', 'Official policy documents and directives', 'file-text', '#006B3F', 1),
  ('cat-reports', 'Reports', 'reports', 'Annual reports, quarterly reports, and assessments', 'bar-chart-2', '#3B82F6', 2),
  ('cat-training', 'Training Materials', 'training-materials', 'Training guides, manuals, and educational content', 'book-open', '#8B5CF6', 3),
  ('cat-guidelines', 'Guidelines', 'guidelines', 'Procedural guidelines and best practices', 'clipboard-list', '#10B981', 4),
  ('cat-forms', 'Forms & Templates', 'forms-templates', 'Official forms and document templates', 'file-plus', '#F59E0B', 5),
  ('cat-legislation', 'Legislation', 'legislation', 'Laws, acts, and regulatory documents', 'scale', '#CE1126', 6),
  ('cat-research', 'Research Papers', 'research-papers', 'Research publications and academic papers', 'search', '#6366F1', 7),
  ('cat-circulars', 'Circulars & Memos', 'circulars-memos', 'Official circulars and memoranda', 'mail', '#EC4899', 8),
  ('cat-other', 'Other', 'other', 'Miscellaneous documents', 'folder', '#6B7280', 99);
