-- =============================================
-- SOCIAL NETWORKING PHASE 1 MIGRATION (Fixed)
-- Skips dm_conversations and direct_messages as they already exist
-- =============================================

-- =============================================
-- SOCIAL GRAPH: Following System
-- =============================================
CREATE TABLE IF NOT EXISTS user_follows (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  followerId TEXT NOT NULL,
  followingId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (followerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followingId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(followerId, followingId)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(followerId);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(followingId);

-- =============================================
-- SOCIAL GRAPH: User Connections (Colleagues)
-- =============================================
CREATE TABLE IF NOT EXISTS user_connections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  connectedUserId TEXT NOT NULL,
  connectionType TEXT DEFAULT 'colleague',
  status TEXT DEFAULT 'pending',
  requestedAt TEXT DEFAULT (datetime('now')),
  respondedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (connectedUserId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, connectedUserId)
);

CREATE INDEX IF NOT EXISTS idx_user_connections_user ON user_connections(userId);
CREATE INDEX IF NOT EXISTS idx_user_connections_connected ON user_connections(connectedUserId);

-- =============================================
-- SOCIAL GRAPH: User Blocks
-- =============================================
CREATE TABLE IF NOT EXISTS user_blocks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  blockerId TEXT NOT NULL,
  blockedId TEXT NOT NULL,
  reason TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (blockerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blockedId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(blockerId, blockedId)
);

-- =============================================
-- SOCIAL WALL: Custom Audience Lists
-- =============================================
CREATE TABLE IF NOT EXISTS audience_lists (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  listType TEXT DEFAULT 'custom',
  memberCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audience_list_members (
  listId TEXT NOT NULL,
  memberId TEXT NOT NULL,
  addedAt TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (listId, memberId),
  FOREIGN KEY (listId) REFERENCES audience_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (memberId) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- SOCIAL WALL: Posts (Full Privacy Control)
-- =============================================
CREATE TABLE IF NOT EXISTS wall_posts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  authorId TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT DEFAULT 'public',
  customListId TEXT,
  postType TEXT DEFAULT 'status',
  sharedPostId TEXT,
  sharedDocumentId TEXT,
  attachments TEXT,
  mentionedUserIds TEXT,
  likesCount INTEGER DEFAULT 0,
  commentsCount INTEGER DEFAULT 0,
  sharesCount INTEGER DEFAULT 0,
  isPinned INTEGER DEFAULT 0,
  isEdited INTEGER DEFAULT 0,
  isDeleted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sharedPostId) REFERENCES wall_posts(id) ON DELETE SET NULL,
  FOREIGN KEY (sharedDocumentId) REFERENCES documents(id) ON DELETE SET NULL,
  FOREIGN KEY (customListId) REFERENCES audience_lists(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wall_posts_author ON wall_posts(authorId);
CREATE INDEX IF NOT EXISTS idx_wall_posts_visibility ON wall_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_wall_posts_created ON wall_posts(createdAt DESC);

-- =============================================
-- SOCIAL WALL: Post Likes
-- =============================================
CREATE TABLE IF NOT EXISTS wall_post_likes (
  postId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (postId, userId),
  FOREIGN KEY (postId) REFERENCES wall_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- SOCIAL WALL: Post Reactions (Emoji)
-- =============================================
CREATE TABLE IF NOT EXISTS wall_post_reactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  postId TEXT NOT NULL,
  userId TEXT NOT NULL,
  emoji TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (postId) REFERENCES wall_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(postId, userId, emoji)
);

CREATE INDEX IF NOT EXISTS idx_wall_post_reactions_post ON wall_post_reactions(postId);

-- =============================================
-- SOCIAL WALL: Comments
-- =============================================
CREATE TABLE IF NOT EXISTS wall_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  postId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  parentId TEXT,
  content TEXT NOT NULL,
  likesCount INTEGER DEFAULT 0,
  isEdited INTEGER DEFAULT 0,
  isDeleted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (postId) REFERENCES wall_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parentId) REFERENCES wall_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wall_comments_post ON wall_comments(postId);
CREATE INDEX IF NOT EXISTS idx_wall_comments_parent ON wall_comments(parentId);

-- =============================================
-- SOCIAL WALL: Comment Likes
-- =============================================
CREATE TABLE IF NOT EXISTS wall_comment_likes (
  commentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (commentId, userId),
  FOREIGN KEY (commentId) REFERENCES wall_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- SOCIAL WALL: Bookmarks/Saves
-- =============================================
CREATE TABLE IF NOT EXISTS wall_bookmarks (
  postId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (postId, userId),
  FOREIGN KEY (postId) REFERENCES wall_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- DIRECT MESSAGES: Reactions (extends existing dm tables)
-- =============================================
CREATE TABLE IF NOT EXISTS dm_reactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  messageId TEXT NOT NULL,
  userId TEXT NOT NULL,
  emoji TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (messageId) REFERENCES direct_messages(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(messageId, userId, emoji)
);

-- =============================================
-- REAL-TIME: Presence & Typing
-- =============================================
CREATE TABLE IF NOT EXISTS user_presence (
  userId TEXT PRIMARY KEY,
  status TEXT DEFAULT 'offline',
  lastSeenAt TEXT DEFAULT (datetime('now')),
  currentActivity TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- SOCIAL: People You May Know Cache
-- =============================================
CREATE TABLE IF NOT EXISTS suggested_connections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  suggestedUserId TEXT NOT NULL,
  score REAL DEFAULT 0,
  reason TEXT,
  isHidden INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  expiresAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (suggestedUserId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, suggestedUserId)
);
