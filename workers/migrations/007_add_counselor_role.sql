-- Migration 007: Add counselor role and assignments table
-- This migration adds support for counselor management in the wellness system

-- Add counselor role (id=9)
INSERT OR IGNORE INTO roles (id, name, description)
VALUES (9, 'counselor', 'Wellness counselor with patient report access');

-- Counselor assignments table - links users with counselor role to wellness system
CREATE TABLE IF NOT EXISTS counselor_assignments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  counselorId TEXT NOT NULL,
  assignedById TEXT NOT NULL,
  specializations TEXT, -- JSON array: ['work_stress', 'career', 'relationships', 'personal', 'financial', 'general']
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'on_leave'
  maxCaseload INTEGER DEFAULT 50,
  currentCaseload INTEGER DEFAULT 0,
  bio TEXT, -- Counselor's professional bio
  qualifications TEXT, -- Professional qualifications
  availableHours TEXT, -- JSON object with availability
  notes TEXT, -- Internal admin notes
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (counselorId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignedById) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_counselor_assignments_counselorId ON counselor_assignments(counselorId);
CREATE INDEX IF NOT EXISTS idx_counselor_assignments_status ON counselor_assignments(status);

-- Update counselor_escalations to support assigned counselor tracking
-- Add column for counselor notes on escalations if not exists
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we check with a try
