-- LMS Settings Table for certificate settings and other configurations
-- Migration: 021_lms_settings.sql

CREATE TABLE IF NOT EXISTS lms_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Insert default certificate settings
INSERT OR IGNORE INTO lms_settings (key, value, updatedAt) VALUES (
  'certificate_settings',
  '{"autoGenerate":true,"requireMinGrade":true,"minGradeThreshold":70,"expirationEnabled":false,"expirationMonths":24,"signatureEnabled":true,"signatureName":"Director, OHCS","signatureTitle":"Office of the Head of Civil Service","logoUrl":"","primaryColor":"#006B3F","secondaryColor":"#FCD116"}',
  datetime('now')
);
