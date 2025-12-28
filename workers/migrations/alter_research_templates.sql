-- Alter research_templates to add missing Phase 4 columns
ALTER TABLE research_templates ADD COLUMN structure TEXT;
ALTER TABLE research_templates ADD COLUMN suggested_literature TEXT;
ALTER TABLE research_templates ADD COLUMN estimated_duration_days INTEGER;
ALTER TABLE research_templates ADD COLUMN difficulty_level TEXT DEFAULT 'intermediate';
ALTER TABLE research_templates ADD COLUMN is_featured INTEGER DEFAULT 0;
ALTER TABLE research_templates ADD COLUMN is_public INTEGER DEFAULT 1;
ALTER TABLE research_templates ADD COLUMN created_by_id TEXT;
ALTER TABLE research_templates ADD COLUMN updated_at TEXT;
