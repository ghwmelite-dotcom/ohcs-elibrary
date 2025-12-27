-- Group Reactions Migration
-- Adds emoji reaction support for posts and comments

-- Post reactions (emoji-based, replacing simple likes)
CREATE TABLE IF NOT EXISTS group_post_reactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  postId TEXT NOT NULL,
  userId TEXT NOT NULL,
  emoji TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (postId) REFERENCES group_posts(id) ON DELETE CASCADE,
  UNIQUE(postId, userId, emoji)
);

-- Comment reactions
CREATE TABLE IF NOT EXISTS group_comment_reactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  commentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  emoji TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (commentId) REFERENCES group_comments(id) ON DELETE CASCADE,
  UNIQUE(commentId, userId, emoji)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON group_post_reactions(postId);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON group_post_reactions(userId);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON group_comment_reactions(commentId);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON group_comment_reactions(userId);
