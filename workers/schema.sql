-- OHCS E-Library Database Schema
-- D1 SQLite Database

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS document_views;
DROP TABLE IF EXISTS document_ratings;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Roles table
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  displayName TEXT,
  avatar TEXT,
  role_id INTEGER DEFAULT 2,
  mda_id TEXT,
  department TEXT,
  title TEXT,
  gradeLevel TEXT,
  bio TEXT,
  status TEXT DEFAULT 'pending',
  email_verified INTEGER DEFAULT 0,
  email_verification_token TEXT,
  password_reset_token TEXT,
  password_reset_expires TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TEXT,
  last_login TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- User sessions table
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT,
  fileName TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  fileType TEXT NOT NULL,
  thumbnailUrl TEXT,
  accessLevel TEXT DEFAULT 'internal',
  status TEXT DEFAULT 'published',
  authorId TEXT,
  mdaId TEXT,
  version INTEGER DEFAULT 1,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  averageRating REAL DEFAULT 0,
  totalRatings INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (authorId) REFERENCES users(id)
);

-- Bookmarks table
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  documentId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(userId, documentId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (documentId) REFERENCES documents(id)
);

-- Document ratings table
CREATE TABLE document_ratings (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(documentId, userId),
  FOREIGN KEY (documentId) REFERENCES documents(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Document views tracking
CREATE TABLE document_views (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  documentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  viewedAt TEXT DEFAULT (datetime('now')),
  UNIQUE(documentId, userId),
  FOREIGN KEY (documentId) REFERENCES documents(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_authorId ON documents(authorId);
CREATE INDEX idx_documents_createdAt ON documents(createdAt);
CREATE INDEX idx_bookmarks_userId ON bookmarks(userId);
CREATE INDEX idx_bookmarks_documentId ON bookmarks(documentId);
CREATE INDEX idx_document_ratings_documentId ON document_ratings(documentId);
CREATE INDEX idx_document_views_userId ON document_views(userId);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_userId ON user_sessions(user_id);

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES
  (1, 'super_admin', 'Full system access'),
  (2, 'civil_servant', 'Standard civil servant user'),
  (3, 'admin', 'Administrative access'),
  (4, 'director', 'Director level access'),
  (5, 'librarian', 'Document management access'),
  (6, 'moderator', 'Forum and chat moderation'),
  (7, 'contributor', 'Can upload documents'),
  (8, 'guest', 'Read-only access');

-- Insert demo admin user (password: Admin123!@#)
-- SHA-256 hash of 'Admin123!@#'
INSERT INTO users (id, email, password_hash, name, firstName, lastName, displayName, role_id, status, email_verified)
VALUES (
  'demo-admin-001',
  'admin@ohcs.gov.gh',
  '7c4a8d09ca3762af61e59520943dc26494f8941b',
  'Demo Admin',
  'Demo',
  'Admin',
  'Demo Admin',
  1,
  'active',
  1
);

-- Insert demo civil servant user (password: User123456!)
INSERT INTO users (id, email, password_hash, name, firstName, lastName, displayName, role_id, status, email_verified)
VALUES (
  'demo-user-001',
  'user@mof.gov.gh',
  'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
  'Demo User',
  'Demo',
  'User',
  'Demo User',
  2,
  'active',
  1
);
