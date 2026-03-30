-- 045_telegram_notifications.sql
-- Telegram notification system tables

-- Links OHCS users to their Telegram accounts
CREATE TABLE IF NOT EXISTS telegram_accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE,
    chatId TEXT NOT NULL UNIQUE,
    telegramUsername TEXT,
    telegramFirstName TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    mutedUntil TEXT,
    linkedAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Temporary tokens for account linking (auto-cleanup via cron)
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiresAt TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Delivery tracking for debugging and analytics
CREATE TABLE IF NOT EXISTS telegram_delivery_logs (
    id TEXT PRIMARY KEY,
    notificationId TEXT,
    userId TEXT NOT NULL,
    chatId TEXT NOT NULL,
    status TEXT NOT NULL,
    errorMessage TEXT,
    telegramMessageId TEXT,
    sentAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Add telegram toggle to notification_preferences
ALTER TABLE notification_preferences ADD COLUMN telegramEnabled INTEGER NOT NULL DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telegram_accounts_userId ON telegram_accounts(userId);
CREATE INDEX IF NOT EXISTS idx_telegram_accounts_chatId ON telegram_accounts(chatId);
CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_token ON telegram_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_expiresAt ON telegram_link_tokens(expiresAt);
CREATE INDEX IF NOT EXISTS idx_telegram_delivery_logs_userId ON telegram_delivery_logs(userId);
CREATE INDEX IF NOT EXISTS idx_telegram_delivery_logs_sentAt ON telegram_delivery_logs(sentAt);
