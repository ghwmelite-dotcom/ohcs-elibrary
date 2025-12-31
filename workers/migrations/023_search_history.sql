-- Search History Table
-- Stores user search history for recent searches and personalization

CREATE TABLE IF NOT EXISTS search_history (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  query TEXT NOT NULL,
  resultCount INTEGER DEFAULT 0,
  types TEXT, -- JSON array of searched types
  createdAt TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(userId);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(createdAt);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
