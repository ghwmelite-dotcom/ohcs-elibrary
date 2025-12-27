-- User Settings Enhancement Migration
-- Comprehensive settings system with security, preferences, and analytics

-- =====================================================
-- USER SESSIONS (Real session/device management)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  deviceName TEXT NOT NULL,
  deviceType TEXT DEFAULT 'desktop', -- desktop, mobile, tablet
  browser TEXT,
  browserVersion TEXT,
  os TEXT,
  osVersion TEXT,
  ipAddress TEXT,
  location TEXT,
  country TEXT,
  city TEXT,
  isCurrent INTEGER DEFAULT 0,
  isRevoked INTEGER DEFAULT 0,
  lastActiveAt TEXT DEFAULT (datetime('now')),
  createdAt TEXT DEFAULT (datetime('now')),
  expiresAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_sessions_user ON user_sessions(userId);
CREATE INDEX idx_user_sessions_active ON user_sessions(userId, isRevoked, expiresAt);

-- =====================================================
-- TWO-FACTOR AUTHENTICATION
-- =====================================================
CREATE TABLE IF NOT EXISTS user_2fa (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  secret TEXT NOT NULL, -- TOTP secret (encrypted)
  isEnabled INTEGER DEFAULT 0,
  backupCodes TEXT, -- JSON array of hashed backup codes
  backupCodesUsed INTEGER DEFAULT 0,
  lastUsedAt TEXT,
  enabledAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- USER SETTINGS (Comprehensive preferences)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,

  -- Appearance
  theme TEXT DEFAULT 'system', -- light, dark, system
  accentColor TEXT DEFAULT 'green', -- green, blue, purple, orange, red
  fontSize TEXT DEFAULT 'medium', -- small, medium, large, xlarge
  fontFamily TEXT DEFAULT 'system', -- system, inter, roboto, open-sans
  compactMode INTEGER DEFAULT 0,
  reducedMotion INTEGER DEFAULT 0,
  highContrast INTEGER DEFAULT 0,

  -- Reading Preferences
  readingLineHeight TEXT DEFAULT 'normal', -- compact, normal, relaxed
  readingMaxWidth TEXT DEFAULT 'medium', -- narrow, medium, wide, full
  autoScroll INTEGER DEFAULT 0,
  autoScrollSpeed INTEGER DEFAULT 50,
  highlightLinks INTEGER DEFAULT 1,
  showPageNumbers INTEGER DEFAULT 1,

  -- AI Preferences
  aiEnabled INTEGER DEFAULT 1,
  aiSuggestions INTEGER DEFAULT 1,
  aiSummarization INTEGER DEFAULT 1,
  aiWritingAssist INTEGER DEFAULT 0,
  aiVoice TEXT DEFAULT 'default', -- default, professional, friendly
  aiResponseLength TEXT DEFAULT 'balanced', -- concise, balanced, detailed
  aiAutoComplete INTEGER DEFAULT 0,

  -- Privacy & Security
  profileVisibility TEXT DEFAULT 'public', -- public, connections, private
  showEmail INTEGER DEFAULT 0,
  showActivity INTEGER DEFAULT 1,
  allowMessages TEXT DEFAULT 'all', -- all, connections, none
  allowTagging INTEGER DEFAULT 1,
  showOnlineStatus INTEGER DEFAULT 1,

  -- Language & Region
  language TEXT DEFAULT 'en-US',
  timezone TEXT DEFAULT 'Africa/Accra',
  dateFormat TEXT DEFAULT 'DD/MM/YYYY',
  timeFormat TEXT DEFAULT '12h', -- 12h, 24h
  weekStartsOn TEXT DEFAULT 'monday', -- sunday, monday

  -- Downloads & Storage
  downloadLocation TEXT DEFAULT 'default',
  autoDownload INTEGER DEFAULT 0,
  downloadQuality TEXT DEFAULT 'original', -- original, optimized, compressed
  clearCacheOnLogout INTEGER DEFAULT 0,

  -- Sounds & Haptics
  soundEnabled INTEGER DEFAULT 1,
  soundVolume INTEGER DEFAULT 50,
  notificationSound TEXT DEFAULT 'default',
  messageSound TEXT DEFAULT 'default',
  hapticFeedback INTEGER DEFAULT 1,

  -- Experimental Features
  betaFeatures INTEGER DEFAULT 0,
  developerMode INTEGER DEFAULT 0,

  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- KEYBOARD SHORTCUTS
-- =====================================================
CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g., 'search', 'new_document', 'toggle_theme'
  shortcut TEXT NOT NULL, -- e.g., 'Ctrl+K', 'Cmd+N'
  isCustom INTEGER DEFAULT 1,
  isEnabled INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, action)
);

CREATE INDEX idx_keyboard_shortcuts_user ON keyboard_shortcuts(userId);

-- =====================================================
-- ACCOUNT ACTIVITY LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS account_activity (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL, -- login, logout, password_change, 2fa_enabled, settings_update, etc.
  description TEXT,
  ipAddress TEXT,
  location TEXT,
  deviceInfo TEXT,
  metadata TEXT, -- JSON for additional context
  status TEXT DEFAULT 'success', -- success, failed, blocked
  riskLevel TEXT DEFAULT 'low', -- low, medium, high, critical
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_account_activity_user ON account_activity(userId, createdAt DESC);
CREATE INDEX idx_account_activity_action ON account_activity(action);

-- =====================================================
-- CONNECTED ACCOUNTS (OAuth/Social)
-- =====================================================
CREATE TABLE IF NOT EXISTS connected_accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  provider TEXT NOT NULL, -- google, microsoft, github, linkedin
  providerUserId TEXT NOT NULL,
  email TEXT,
  displayName TEXT,
  avatar TEXT,
  accessToken TEXT,
  refreshToken TEXT,
  tokenExpiresAt TEXT,
  scopes TEXT, -- JSON array of granted scopes
  isActive INTEGER DEFAULT 1,
  lastUsedAt TEXT,
  connectedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, provider)
);

CREATE INDEX idx_connected_accounts_user ON connected_accounts(userId);

-- =====================================================
-- DATA EXPORT REQUESTS
-- =====================================================
CREATE TABLE IF NOT EXISTS data_exports (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT DEFAULT 'full', -- full, profile, documents, activity
  format TEXT DEFAULT 'zip', -- zip, json, pdf
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, expired
  progress INTEGER DEFAULT 0, -- 0-100
  fileUrl TEXT,
  fileSize INTEGER,
  expiresAt TEXT,
  requestedAt TEXT DEFAULT (datetime('now')),
  completedAt TEXT,
  downloadedAt TEXT,
  errorMessage TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_data_exports_user ON data_exports(userId, requestedAt DESC);

-- =====================================================
-- STORAGE USAGE TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS storage_usage (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  totalBytes INTEGER DEFAULT 0,
  documentsBytes INTEGER DEFAULT 0,
  attachmentsBytes INTEGER DEFAULT 0,
  avatarBytes INTEGER DEFAULT 0,
  cacheBytes INTEGER DEFAULT 0,
  quotaBytes INTEGER DEFAULT 1073741824, -- 1GB default
  lastCalculatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- BLOCKED USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  blockedUserId TEXT NOT NULL,
  reason TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blockedUserId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, blockedUserId)
);

CREATE INDEX idx_blocked_users ON blocked_users(userId);

-- =====================================================
-- DEFAULT KEYBOARD SHORTCUTS (System defaults)
-- =====================================================
CREATE TABLE IF NOT EXISTS default_shortcuts (
  action TEXT PRIMARY KEY,
  shortcut TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL -- navigation, documents, forum, chat, general
);

INSERT OR IGNORE INTO default_shortcuts (action, shortcut, description, category) VALUES
-- Navigation
('go_home', 'G H', 'Go to Dashboard', 'navigation'),
('go_library', 'G L', 'Go to Library', 'navigation'),
('go_forum', 'G F', 'Go to Forum', 'navigation'),
('go_chat', 'G C', 'Go to Chat', 'navigation'),
('go_groups', 'G G', 'Go to Groups', 'navigation'),
('go_settings', 'G S', 'Go to Settings', 'navigation'),
('go_notifications', 'G N', 'Go to Notifications', 'navigation'),

-- General
('search', 'Ctrl+K', 'Open Search', 'general'),
('toggle_theme', 'Ctrl+Shift+T', 'Toggle Theme', 'general'),
('toggle_sidebar', 'Ctrl+B', 'Toggle Sidebar', 'general'),
('show_shortcuts', 'Ctrl+/', 'Show Keyboard Shortcuts', 'general'),
('escape', 'Escape', 'Close Modal / Cancel', 'general'),

-- Documents
('new_document', 'Ctrl+N', 'Upload New Document', 'documents'),
('download_document', 'Ctrl+D', 'Download Current Document', 'documents'),
('zoom_in', 'Ctrl+Plus', 'Zoom In Document', 'documents'),
('zoom_out', 'Ctrl+Minus', 'Zoom Out Document', 'documents'),
('zoom_reset', 'Ctrl+0', 'Reset Zoom', 'documents'),

-- Forum
('new_post', 'N', 'Create New Post (in Forum)', 'forum'),
('reply', 'R', 'Reply to Post', 'forum'),
('upvote', 'U', 'Upvote Post', 'forum'),
('bookmark', 'B', 'Bookmark Post', 'forum'),

-- Chat
('focus_message', 'M', 'Focus Message Input', 'chat'),
('send_message', 'Enter', 'Send Message', 'chat'),
('new_line', 'Shift+Enter', 'New Line in Message', 'chat'),
('emoji_picker', 'Ctrl+E', 'Open Emoji Picker', 'chat');
