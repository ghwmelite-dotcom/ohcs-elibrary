-- =============================================
-- OHCS E-Library: Social Networking Phase 1
-- Migration: 014_social_networking_phase1.sql
-- Features: Social Graph, Social Wall, Direct Messaging, Presence
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
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);

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

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blockerId);

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

CREATE INDEX IF NOT EXISTS idx_audience_lists_user ON audience_lists(userId);

CREATE TABLE IF NOT EXISTS audience_list_members (
  listId TEXT NOT NULL,
  memberId TEXT NOT NULL,
  addedAt TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (listId, memberId),
  FOREIGN KEY (listId) REFERENCES audience_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (memberId) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- SOCIAL WALL: Posts
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
  FOREIGN KEY (customListId) REFERENCES audience_lists(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wall_posts_author ON wall_posts(authorId);
CREATE INDEX IF NOT EXISTS idx_wall_posts_visibility ON wall_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_wall_posts_created ON wall_posts(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_wall_posts_type ON wall_posts(postType);

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
-- DIRECT MESSAGES: Conversations
-- =============================================
CREATE TABLE IF NOT EXISTS dm_conversations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  participant1Id TEXT NOT NULL,
  participant2Id TEXT NOT NULL,
  lastMessageId TEXT,
  lastMessageAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (participant1Id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant2Id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(participant1Id, participant2Id)
);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_p1 ON dm_conversations(participant1Id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_p2 ON dm_conversations(participant2Id);

-- =============================================
-- DIRECT MESSAGES: Messages
-- =============================================
CREATE TABLE IF NOT EXISTS direct_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversationId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT,
  replyToId TEXT,
  isRead INTEGER DEFAULT 0,
  readAt TEXT,
  isEdited INTEGER DEFAULT 0,
  isDeleted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversationId) REFERENCES dm_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (replyToId) REFERENCES direct_messages(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversationId);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(senderId);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(createdAt DESC);

-- =============================================
-- DIRECT MESSAGES: Reactions
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

CREATE INDEX IF NOT EXISTS idx_dm_reactions_message ON dm_reactions(messageId);

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

CREATE INDEX IF NOT EXISTS idx_suggested_connections_user ON suggested_connections(userId);
