-- Migration: Add Chat Tables
-- Chat rooms and messaging system

-- ============================================
-- CHAT TABLES
-- ============================================

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private', 'mda')),
  mdaId TEXT,
  createdById TEXT NOT NULL,
  isArchived INTEGER DEFAULT 0,
  memberCount INTEGER DEFAULT 0,
  lastMessageAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

-- Chat room members table
CREATE TABLE IF NOT EXISTS chat_room_members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  roomId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joinedAt TEXT DEFAULT (datetime('now')),
  lastReadAt TEXT,
  UNIQUE(roomId, userId),
  FOREIGN KEY (roomId) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  roomId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  replyToId TEXT,
  isEdited INTEGER DEFAULT 0,
  isDeleted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (roomId) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES users(id),
  FOREIGN KEY (replyToId) REFERENCES chat_messages(id)
);

-- Message reactions table
CREATE TABLE IF NOT EXISTS chat_reactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  messageId TEXT NOT NULL,
  userId TEXT NOT NULL,
  emoji TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(messageId, userId, emoji),
  FOREIGN KEY (messageId) REFERENCES chat_messages(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Direct messages / Conversations table
CREATE TABLE IF NOT EXISTS dm_conversations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user1Id TEXT NOT NULL,
  user2Id TEXT NOT NULL,
  lastMessageAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(user1Id, user2Id),
  FOREIGN KEY (user1Id) REFERENCES users(id),
  FOREIGN KEY (user2Id) REFERENCES users(id)
);

-- Direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversationId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
  isRead INTEGER DEFAULT 0,
  isDeleted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversationId) REFERENCES dm_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES users(id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_createdById ON chat_rooms(createdById);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_roomId ON chat_room_members(roomId);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_userId ON chat_room_members(userId);
CREATE INDEX IF NOT EXISTS idx_chat_messages_roomId ON chat_messages(roomId);
CREATE INDEX IF NOT EXISTS idx_chat_messages_senderId ON chat_messages(senderId);
CREATE INDEX IF NOT EXISTS idx_chat_messages_createdAt ON chat_messages(createdAt);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_messageId ON chat_reactions(messageId);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user1Id ON dm_conversations(user1Id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user2Id ON dm_conversations(user2Id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversationId ON direct_messages(conversationId);

-- ============================================
-- SEED DATA - Default Chat Rooms
-- ============================================

INSERT OR IGNORE INTO chat_rooms (id, name, description, type, createdById, memberCount) VALUES
  ('room-general', 'General Discussion', 'Open chat for all civil servants to connect and discuss', 'public', 'admin-001', 0),
  ('room-announcements', 'Announcements', 'Official announcements from OHCS', 'public', 'admin-001', 0),
  ('room-help', 'Help & Support', 'Get help with using the E-Library platform', 'public', 'admin-001', 0);
