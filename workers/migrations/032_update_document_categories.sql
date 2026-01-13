-- Update Document Categories to match new folder-based structure
-- Also clears existing Google Drive documents to prepare for local document import

-- Step 1: Remove old categories
DELETE FROM document_categories;

-- Step 2: Insert new categories based on Document Library folder structure
INSERT INTO document_categories (id, name, slug, description, icon, color, sortOrder, isActive) VALUES
  ('cat-administrative', 'Administrative Instruments', 'administrative', 'Official administrative documents, instructions, and instruments', 'gavel', '#006B3F', 1, 1),
  ('cat-compliance', 'Compliance & Legal', 'compliance', 'Client service charters, compliance reports, and RTI manuals', 'shield-check', '#10B981', 2, 1),
  ('cat-induction', 'Induction Materials', 'induction', 'Induction presentations, administrative writing skills, and orientation materials', 'graduation-cap', '#3B82F6', 3, 1),
  ('cat-newsletters', 'Newsletters & Bulletins', 'newsletters', 'Monthly newsletters and special bulletins', 'newspaper', '#F59E0B', 4, 1),
  ('cat-performance', 'Performance Management', 'performance', 'Annual performance reports, appraisal instruments, and performance agreements', 'chart-line', '#CE1126', 5, 1),
  ('cat-policies', 'Policies & Guidelines', 'policies', 'Code of conduct, mentorship programs, onboarding, and study leave policies', 'book-open', '#FCD116', 6, 1),
  ('cat-recruitment', 'Recruitment & Examination', 'recruitment', 'Examination guidelines, nomination forms, and results', 'users', '#8B5CF6', 7, 1),
  ('cat-research', 'Research & Surveys', 'research', 'Research papers and survey reports', 'search', '#EC4899', 8, 1),
  ('cat-strategic', 'Strategic Planning', 'strategic', 'Action plans, monitoring & evaluation reports, and strategic plans', 'target', '#14B8A6', 9, 1),
  ('cat-templates', 'Templates & Forms', 'templates', 'Application forms, standardized templates, and document templates', 'file-plus', '#6366F1', 10, 1),
  ('cat-training', 'Training & Development', 'training', 'Knowledge sharing presentations, training plans, and training reports', 'award', '#EF4444', 11, 1);

-- Step 3: Clear all existing documents (Google Drive documents will be replaced with local files)
-- First delete related records to maintain referential integrity
DELETE FROM document_views WHERE documentId IN (SELECT id FROM documents);
DELETE FROM document_ratings WHERE documentId IN (SELECT id FROM documents);
DELETE FROM bookmarks WHERE documentId IN (SELECT id FROM documents);
DELETE FROM document_chat_history WHERE documentId IN (SELECT id FROM documents);
DELETE FROM document_ai_analysis WHERE documentId IN (SELECT id FROM documents);
DELETE FROM embedding_queue WHERE documentId IN (SELECT id FROM documents);

-- Now delete all documents
DELETE FROM documents;

-- Step 4: Delete Google Drive connections since we're moving to local storage
DELETE FROM google_drive_connections;
