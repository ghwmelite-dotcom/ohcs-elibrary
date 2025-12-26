-- OHCS E-Library Database Schema
-- D1 SQLite Database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  displayName TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  mdaId TEXT,
  jobTitle TEXT,
  department TEXT,
  isActive INTEGER DEFAULT 1,
  isVerified INTEGER DEFAULT 0,
  lastLoginAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT, -- JSON array
  fileName TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  fileType TEXT NOT NULL,
  thumbnailUrl TEXT,
  accessLevel TEXT DEFAULT 'internal',
  status TEXT DEFAULT 'pending',
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
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  documentId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(userId, documentId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (documentId) REFERENCES documents(id)
);

-- Document ratings table
CREATE TABLE IF NOT EXISTS document_ratings (
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
CREATE TABLE IF NOT EXISTS document_views (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  documentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  viewedAt TEXT DEFAULT (datetime('now')),
  UNIQUE(documentId, userId),
  FOREIGN KEY (documentId) REFERENCES documents(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Sessions table for auth
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_authorId ON documents(authorId);
CREATE INDEX IF NOT EXISTS idx_documents_createdAt ON documents(createdAt);
CREATE INDEX IF NOT EXISTS idx_bookmarks_userId ON bookmarks(userId);
CREATE INDEX IF NOT EXISTS idx_bookmarks_documentId ON bookmarks(documentId);
CREATE INDEX IF NOT EXISTS idx_document_ratings_documentId ON document_ratings(documentId);
CREATE INDEX IF NOT EXISTS idx_document_views_userId ON document_views(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
