-- Kwame AI Knowledge Assistant Migration
-- RAG-powered Q&A system for civil service documents

-- Kwame Sessions (conversation threads)
CREATE TABLE IF NOT EXISTS kwame_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT,
  topic TEXT,  -- 'policy', 'hr', 'procedures', 'regulations', 'training', 'general'
  status TEXT DEFAULT 'active',  -- 'active', 'completed'
  messageCount INTEGER DEFAULT 0,
  lastMessageAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kwame_sessions_userId ON kwame_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_kwame_sessions_status ON kwame_sessions(status);
CREATE INDEX IF NOT EXISTS idx_kwame_sessions_lastMessage ON kwame_sessions(lastMessageAt DESC);

-- Kwame Messages with Citations
CREATE TABLE IF NOT EXISTS kwame_messages (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  role TEXT NOT NULL,  -- 'user' or 'assistant'
  content TEXT NOT NULL,
  citations TEXT,  -- JSON array of citation objects
  helpful INTEGER,  -- NULL, 0 (not helpful), 1 (helpful)
  processingTimeMs INTEGER,  -- Response generation time
  chunksUsed INTEGER,  -- Number of document chunks used
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sessionId) REFERENCES kwame_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kwame_messages_sessionId ON kwame_messages(sessionId);
CREATE INDEX IF NOT EXISTS idx_kwame_messages_role ON kwame_messages(role);

-- Document Chunks for RAG (vector storage)
CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL,
  chunkIndex INTEGER NOT NULL,
  content TEXT NOT NULL,
  startChar INTEGER,  -- Position in original document
  endChar INTEGER,
  embedding TEXT,  -- JSON array of 768 floats (bge-base-en-v1.5)
  tokenCount INTEGER,
  metadata TEXT,  -- JSON: {page, section, headers}
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE(documentId, chunkIndex)
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_documentId ON document_chunks(documentId);
CREATE INDEX IF NOT EXISTS idx_document_chunks_hasEmbedding ON document_chunks(embedding IS NOT NULL);

-- Embedding Queue (for batch processing)
CREATE TABLE IF NOT EXISTS embedding_queue (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
  priority INTEGER DEFAULT 0,  -- Higher = more urgent
  attempts INTEGER DEFAULT 0,
  error TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  processedAt TEXT,
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_embedding_queue_status ON embedding_queue(status);
CREATE INDEX IF NOT EXISTS idx_embedding_queue_priority ON embedding_queue(priority DESC);

-- Suggested Questions (personalized by user context)
CREATE TABLE IF NOT EXISTS kwame_suggested_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  category TEXT,  -- 'policy', 'hr', 'procedures', 'regulations', 'training', 'general'
  targetRole TEXT,  -- NULL for all, or specific role
  targetDepartment TEXT,  -- NULL for all, or specific MDA
  usageCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kwame_suggestions_category ON kwame_suggested_questions(category);
CREATE INDEX IF NOT EXISTS idx_kwame_suggestions_active ON kwame_suggested_questions(isActive);

-- Kwame Usage Statistics (daily aggregation)
CREATE TABLE IF NOT EXISTS kwame_usage_stats (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,  -- YYYY-MM-DD
  totalSessions INTEGER DEFAULT 0,
  totalMessages INTEGER DEFAULT 0,
  uniqueUsers INTEGER DEFAULT 0,
  avgResponseTimeMs INTEGER DEFAULT 0,
  helpfulCount INTEGER DEFAULT 0,
  notHelpfulCount INTEGER DEFAULT 0,
  topTopics TEXT,  -- JSON array of top topics
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(date)
);

-- Seed Default Suggested Questions
INSERT OR IGNORE INTO kwame_suggested_questions (id, question, category, isActive) VALUES
  ('sq-leave-policy', 'What are the current leave policies for civil servants?', 'hr', 1),
  ('sq-transfer', 'How do I apply for a transfer between MDAs?', 'procedures', 1),
  ('sq-promotion', 'What is the process for promotion in the civil service?', 'hr', 1),
  ('sq-training', 'What training opportunities are available for my grade level?', 'training', 1),
  ('sq-pension', 'How do I access my pension information?', 'hr', 1),
  ('sq-code-conduct', 'What are the key points of the civil service code of conduct?', 'policy', 1),
  ('sq-grievance', 'How do I file a grievance or complaint?', 'procedures', 1),
  ('sq-performance', 'How does the performance evaluation system work?', 'hr', 1),
  ('sq-allowances', 'What allowances am I entitled to as a civil servant?', 'hr', 1),
  ('sq-retirement', 'What are the retirement age and benefits for civil servants?', 'policy', 1);
