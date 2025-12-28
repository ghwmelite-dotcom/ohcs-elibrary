-- Add AI analysis caching for documents
-- Run: npx wrangler d1 execute ohcs-elibrary --file=./migrations/add_document_ai.sql --remote

-- Table to cache AI analysis results
CREATE TABLE IF NOT EXISTS document_ai_analysis (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL UNIQUE,
  summary TEXT,
  keyPoints TEXT, -- JSON array of key points
  topics TEXT, -- JSON array of topics
  complexity TEXT CHECK(complexity IN ('basic', 'intermediate', 'advanced')),
  readingTime INTEGER DEFAULT 5,
  recommendations TEXT, -- JSON array of related document titles
  extractedText TEXT, -- Cached extracted text from document
  sentiment TEXT CHECK(sentiment IN ('positive', 'neutral', 'negative', 'informative')),
  language TEXT DEFAULT 'en',
  wordCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
);

-- Table for document Q&A chat history
CREATE TABLE IF NOT EXISTS document_chat_history (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  helpful INTEGER DEFAULT NULL, -- 1 = helpful, 0 = not helpful, NULL = no feedback
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doc_ai_document ON document_ai_analysis(documentId);
CREATE INDEX IF NOT EXISTS idx_doc_chat_document ON document_chat_history(documentId);
CREATE INDEX IF NOT EXISTS idx_doc_chat_user ON document_chat_history(userId);
CREATE INDEX IF NOT EXISTS idx_doc_chat_created ON document_chat_history(createdAt);
