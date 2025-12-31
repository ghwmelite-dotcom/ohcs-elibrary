-- System Settings Table
-- Stores platform-wide configuration settings

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now')),
  updatedBy TEXT,
  FOREIGN KEY (updatedBy) REFERENCES users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_updated ON system_settings(updatedAt);

-- Insert default settings
INSERT OR IGNORE INTO system_settings (key, value) VALUES
  ('siteName', 'OHCS E-Library'),
  ('siteDescription', 'Digital knowledge platform for Ghana Civil Service - Empowering public servants with accessible information'),
  ('supportEmail', 'support@ohcs.gov.gh'),
  ('siteUrl', 'https://elibrary.ohcs.gov.gh'),
  ('timezone', 'Africa/Accra'),
  ('language', 'en'),
  ('allowRegistration', 'true'),
  ('requireEmailVerification', 'true'),
  ('allowPublicAccess', 'false'),
  ('maintenanceMode', 'false'),
  ('restrictToGovEmail', 'true'),
  ('sessionTimeout', '60'),
  ('maxLoginAttempts', '5'),
  ('lockoutDuration', '15'),
  ('passwordMinLength', '12'),
  ('requireTwoFactor', 'false'),
  ('requireUppercase', 'true'),
  ('requireNumbers', 'true'),
  ('requireSymbols', 'true'),
  ('passwordExpiry', '90'),
  ('emailNotifications', 'true'),
  ('pushNotifications', 'true'),
  ('smsNotifications', 'false'),
  ('digestFrequency', 'daily'),
  ('notifyNewUsers', 'true'),
  ('notifyNewDocuments', 'true'),
  ('notifySecurityAlerts', 'true'),
  ('maxUploadSize', '50'),
  ('allowedFileTypes', 'pdf,doc,docx,xls,xlsx,ppt,pptx'),
  ('compressUploads', 'true'),
  ('primaryColor', '#006B3F'),
  ('accentColor', '#FCD116'),
  ('darkModeDefault', 'false'),
  ('showFooter', 'true');
