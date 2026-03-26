-- Document Comments
CREATE TABLE IF NOT EXISTS document_comments (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parentId TEXT REFERENCES document_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likesCount INTEGER DEFAULT 0,
  isEdited INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_doc_comments_document ON document_comments(documentId);
CREATE INDEX IF NOT EXISTS idx_doc_comments_parent ON document_comments(parentId);

-- Comment Likes
CREATE TABLE IF NOT EXISTS document_comment_likes (
  id TEXT PRIMARY KEY,
  commentId TEXT NOT NULL REFERENCES document_comments(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(commentId, userId)
);

-- Document Collections
CREATE TABLE IF NOT EXISTS document_collections (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  isPublic INTEGER DEFAULT 0,
  documentCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_doc_collections_user ON document_collections(userId);

-- Collection Items
CREATE TABLE IF NOT EXISTS document_collection_items (
  id TEXT PRIMARY KEY,
  collectionId TEXT NOT NULL REFERENCES document_collections(id) ON DELETE CASCADE,
  documentId TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  addedAt TEXT DEFAULT (datetime('now')),
  UNIQUE(collectionId, documentId)
);
CREATE INDEX IF NOT EXISTS idx_doc_collection_items ON document_collection_items(collectionId);
