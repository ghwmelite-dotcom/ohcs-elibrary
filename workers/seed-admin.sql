-- Update or insert admin user with password: angels2G9@84?
-- SHA-256 hash: 112d1840648942f62c233340cdb47ac4dfef4bc8dc4ce778d880537c3246cbe2

-- Delete existing admin user if exists (to avoid conflicts)
DELETE FROM users WHERE email = 'admin@ohcs.gov.gh';

-- Insert admin user with correct password hash (using deployed DB column names)
INSERT INTO users (id, email, passwordHash, displayName, firstName, lastName, role, isActive, isVerified)
VALUES (
  'admin-001',
  'admin@ohcs.gov.gh',
  '112d1840648942f62c233340cdb47ac4dfef4bc8dc4ce778d880537c3246cbe2',
  'System Admin',
  'System',
  'Admin',
  'super_admin',
  1,
  1
);
