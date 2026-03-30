# Telegram Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Telegram as a notification delivery channel with bot account linking, formatted message delivery, and per-category user preferences.

**Architecture:** Webhook-based Telegram bot integrated into the existing Cloudflare Worker. New Hono route group handles bot commands, a delivery service sends formatted messages via Bot API, and the frontend gets a TelegramConnect component in notification settings.

**Tech Stack:** Hono (routes), D1 (database), KV (rate limiting/queuing), Telegram Bot API, React + Zustand (frontend), qrcode (npm package for QR generation)

**Spec:** `docs/superpowers/specs/2026-03-30-telegram-notifications-design.md`

---

## File Structure

### New Files (Backend)
| File | Responsibility |
|---|---|
| `workers/migrations/045_telegram_notifications.sql` | New tables: telegram_accounts, telegram_link_tokens, telegram_delivery_logs + ALTER notification_preferences |
| `workers/src/services/telegramService.ts` | Bot API client: send messages, format notifications, handle rate limits, log delivery |
| `workers/src/routes/telegram.ts` | Webhook handler + account linking API endpoints |

### New Files (Frontend)
| File | Responsibility |
|---|---|
| `src/components/notifications/TelegramConnect.tsx` | Connection card: QR code, link button, status display, disconnect |

### Modified Files
| File | Change |
|---|---|
| `workers/src/routes/index.ts` | Export telegramRoutes |
| `workers/src/index.ts` | Register telegram routes (webhook public, link/status protected), add cron cleanup |
| `workers/src/routes/notifications.ts` | Hook into notification creation to dispatch Telegram delivery |
| `src/stores/notificationStore.ts` | Add telegram state: status, link/unlink actions, fetch status |
| `src/components/notifications/NotificationSettings.tsx` | Add Telegram global toggle + TG column in category grid + TelegramConnect component |

---

## Task 1: Database Migration

**Files:**
- Create: `workers/migrations/045_telegram_notifications.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Apply the migration locally**

Run: `cd workers && npx wrangler d1 execute ohcs-elibrary --local --file=migrations/045_telegram_notifications.sql`
Expected: "Executed X queries"

- [ ] **Step 3: Commit**

```bash
git add workers/migrations/045_telegram_notifications.sql
git commit -m "feat(telegram): add database migration for telegram notification tables"
```

---

## Task 2: Telegram Delivery Service

**Files:**
- Create: `workers/src/services/telegramService.ts`

- [ ] **Step 1: Create the Telegram service with Bot API client and message formatter**

```typescript
// workers/src/services/telegramService.ts
import { Env } from '../types';

// --- Types ---

interface TelegramSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  retryAfter?: number;
}

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  actorName?: string;
  priority?: string;
  metadata?: Record<string, any>;
}

// --- MarkdownV2 Escaping ---

const MD_V2_SPECIAL = /([_*\[\]()~`>#+\-=|{}.!\\])/g;

function escapeMarkdownV2(text: string): string {
  return text.replace(MD_V2_SPECIAL, '\\$1');
}

// --- Message Formatting ---

const TYPE_ICONS: Record<string, string> = {
  system: '\u{1F512}',           // lock
  security: '\u{1F512}',
  document_approved: '\u{2705}', // check
  document_rejected: '\u{274C}', // cross
  document: '\u{1F4C4}',        // page
  announcement: '\u{1F4E2}',    // megaphone
  forum_reply: '\u{1F4AC}',     // speech
  forum_mention: '\u{1F4AC}',
  group_invite: '\u{1F465}',    // people
  group_post: '\u{1F465}',
  badge_earned: '\u{1F3C6}',    // trophy
  level_up: '\u{2B50}',         // star
  xp_earned: '\u{2B50}',
  message: '\u{1F4E9}',         // envelope
  like: '\u{2764}',             // heart
  follow: '\u{1F464}',          // person
  welcome: '\u{1F44B}',         // wave
  challenge_complete: '\u{1F3C6}',
  streak: '\u{1F525}',          // fire
};

function getIcon(type: string): string {
  return TYPE_ICONS[type] || '\u{1F514}'; // default bell
}

export function formatTelegramMessage(notification: NotificationPayload): string {
  const icon = getIcon(notification.type);
  const title = escapeMarkdownV2(notification.title);
  const message = escapeMarkdownV2(notification.message);
  const divider = '\u{2500}'.repeat(18);

  let text = `${icon} *${title}*\n${divider}\n\n${message}`;

  if (notification.actorName) {
    text += `\n\n*By:* ${escapeMarkdownV2(notification.actorName)}`;
  }

  if (notification.link) {
    // Links in MarkdownV2: [text](url) — url must not be escaped
    const linkLabel = escapeMarkdownV2('View on OHCS E-Library');
    text += `\n\n[${linkLabel}](${notification.link})`;
  }

  return text;
}

// --- Bot API Client ---

async function callTelegramAPI(
  botToken: string,
  method: string,
  body: Record<string, any>
): Promise<any> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  parseMode: 'MarkdownV2' | 'HTML' | undefined = 'MarkdownV2'
): Promise<TelegramSendResult> {
  try {
    const result = await callTelegramAPI(botToken, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: false,
    });

    if (result.ok) {
      return { ok: true, messageId: String(result.result.message_id) };
    }

    // Rate limited
    if (result.error_code === 429) {
      return {
        ok: false,
        error: 'rate_limited',
        retryAfter: result.parameters?.retry_after || 5,
      };
    }

    // User blocked the bot
    if (result.error_code === 403) {
      return { ok: false, error: 'blocked' };
    }

    return { ok: false, error: result.description || 'Unknown error' };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// --- Delivery Orchestrator ---

export async function deliverTelegramNotification(
  env: Env,
  userId: string,
  notification: NotificationPayload
): Promise<void> {
  const botToken = (env as any).TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  // 1. Check if user has an active Telegram link
  const account = await env.DB.prepare(
    'SELECT chatId, status, mutedUntil FROM telegram_accounts WHERE userId = ? AND status = ?'
  ).bind(userId, 'active').first<{ chatId: string; status: string; mutedUntil: string | null }>();

  if (!account) return;

  // 2. Check if muted
  if (account.mutedUntil && new Date(account.mutedUntil) > new Date()) return;

  // 3. Check user preferences — is telegram enabled globally and for this category?
  const prefs = await env.DB.prepare(
    'SELECT telegramEnabled, categoryPreferences, quietHoursEnabled, quietHoursStart, quietHoursEnd FROM notification_preferences WHERE userId = ?'
  ).bind(userId).first<{
    telegramEnabled: number;
    categoryPreferences: string | null;
    quietHoursEnabled: number;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
  }>();

  // If no prefs row or telegram not enabled globally, skip
  if (!prefs || !prefs.telegramEnabled) return;

  // Check category preference
  if (prefs.categoryPreferences) {
    try {
      const cats = JSON.parse(prefs.categoryPreferences);
      const categoryKey = mapTypeToCategory(notification.type);
      if (cats[categoryKey] && cats[categoryKey].telegram === false) return;
    } catch {
      // Invalid JSON — deliver anyway
    }
  }

  // 4. Check quiet hours
  if (prefs.quietHoursEnabled && prefs.quietHoursStart && prefs.quietHoursEnd) {
    if (notification.priority !== 'urgent' && isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)) {
      await logDelivery(env, notification.id, userId, account.chatId, 'quiet_hours', null, null);
      return;
    }
  }

  // 5. Format and send
  const text = formatTelegramMessage(notification);
  let result = await sendTelegramMessage(botToken, account.chatId, text);

  // Fallback to plain text if MarkdownV2 fails (escaping edge case)
  if (!result.ok && result.error && !['blocked', 'rate_limited'].includes(result.error)) {
    const plainText = `${getIcon(notification.type)} ${notification.title}\n\n${notification.message}${notification.link ? `\n\n${notification.link}` : ''}`;
    result = await sendTelegramMessage(botToken, account.chatId, plainText, undefined);
  }

  // 6. Handle result
  if (result.ok) {
    await logDelivery(env, notification.id, userId, account.chatId, 'sent', null, result.messageId || null);
  } else if (result.error === 'blocked') {
    // Mark account as inactive
    await env.DB.prepare(
      "UPDATE telegram_accounts SET status = 'inactive', updatedAt = datetime('now') WHERE userId = ?"
    ).bind(userId).run();
    await logDelivery(env, notification.id, userId, account.chatId, 'blocked', 'User blocked the bot', null);
  } else if (result.error === 'rate_limited') {
    await logDelivery(env, notification.id, userId, account.chatId, 'rate_limited', `Retry after ${result.retryAfter}s`, null);
  } else {
    await logDelivery(env, notification.id, userId, account.chatId, 'failed', result.error || 'Unknown error', null);
  }
}

// --- Bulk Delivery (for announcements) ---

export async function deliverBulkTelegramNotification(
  env: Env,
  notification: NotificationPayload,
  userIds: string[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Process in batches of 25 to respect Telegram rate limits
  for (let i = 0; i < userIds.length; i += 25) {
    const batch = userIds.slice(i, i + 25);
    const promises = batch.map(async (uid) => {
      try {
        await deliverTelegramNotification(env, uid, notification);
        sent++;
      } catch {
        failed++;
      }
    });
    await Promise.all(promises);

    // Stagger: if more batches remain, wait ~1 second via KV write (Workers have no sleep)
    if (i + 25 < userIds.length) {
      await env.CACHE.put('telegram:rate_pause', '1', { expirationTtl: 1 });
    }
  }

  return { sent, failed };
}

// --- Webhook Setup ---

export async function setupWebhook(botToken: string, webhookUrl: string, secret: string): Promise<any> {
  return callTelegramAPI(botToken, 'setWebhook', {
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
  });
}

export async function setBotCommands(botToken: string): Promise<any> {
  return callTelegramAPI(botToken, 'setMyCommands', {
    commands: [
      { command: 'start', description: 'Link your OHCS E-Library account' },
      { command: 'stop', description: 'Unlink account and stop notifications' },
      { command: 'status', description: 'Show linked account info' },
      { command: 'mute', description: 'Temporarily mute notifications (e.g. /mute 2h)' },
      { command: 'unmute', description: 'Resume notifications' },
      { command: 'settings', description: 'Open notification settings' },
      { command: 'help', description: 'List available commands' },
    ],
  });
}

// --- Helpers ---

function mapTypeToCategory(type: string): string {
  const map: Record<string, string> = {
    message: 'messages',
    document: 'documents',
    document_approved: 'documents',
    document_rejected: 'documents',
    forum_reply: 'forum',
    forum_mention: 'forum',
    group_invite: 'groups',
    group_post: 'groups',
    badge_earned: 'achievements',
    level_up: 'achievements',
    xp_earned: 'achievements',
    challenge_complete: 'achievements',
    streak: 'achievements',
    system: 'system',
    announcement: 'system',
    security: 'system',
    welcome: 'system',
    like: 'messages',
    follow: 'messages',
  };
  return map[type] || 'system';
}

function isInQuietHours(start: string, end: string): boolean {
  const now = new Date();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Same day: e.g., 09:00 - 17:00
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight: e.g., 22:00 - 07:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

function generateId(): string {
  return `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function logDelivery(
  env: Env,
  notificationId: string | null,
  userId: string,
  chatId: string,
  status: string,
  errorMessage: string | null,
  telegramMessageId: string | null
): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO telegram_delivery_logs (id, notificationId, userId, chatId, status, errorMessage, telegramMessageId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(generateId(), notificationId, userId, chatId, status, errorMessage, telegramMessageId).run();
  } catch {
    // Never fail the main flow for logging
  }
}

// --- Cron: Cleanup expired tokens and old logs ---

export async function cleanupTelegramData(env: Env): Promise<{ tokensDeleted: number; logsDeleted: number }> {
  let tokensDeleted = 0;
  let logsDeleted = 0;

  try {
    const tokenResult = await env.DB.prepare(
      "DELETE FROM telegram_link_tokens WHERE expiresAt < datetime('now')"
    ).run();
    tokensDeleted = tokenResult.meta?.changes || 0;
  } catch { /* ignore */ }

  try {
    const logResult = await env.DB.prepare(
      "DELETE FROM telegram_delivery_logs WHERE sentAt < datetime('now', '-30 days')"
    ).run();
    logsDeleted = logResult.meta?.changes || 0;
  } catch { /* ignore */ }

  return { tokensDeleted, logsDeleted };
}
```

- [ ] **Step 2: Commit**

```bash
git add workers/src/services/telegramService.ts
git commit -m "feat(telegram): add delivery service with Bot API client, formatter, and rate limiting"
```

---

## Task 3: Webhook Handler & Account Linking API Routes

**Files:**
- Create: `workers/src/routes/telegram.ts`

- [ ] **Step 1: Create the Telegram route file with webhook handler and linking endpoints**

```typescript
// workers/src/routes/telegram.ts
import { Hono } from 'hono';
import { Env } from '../types';
import {
  sendTelegramMessage,
  setupWebhook,
  setBotCommands,
} from '../services/telegramService';

const app = new Hono<{ Bindings: Env }>();

// --- Helper ---
function generateId(): string {
  return `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// --- POST /telegram/webhook — Receives updates from Telegram ---
app.post('/webhook', async (c) => {
  // Validate secret token
  const secret = c.req.header('X-Telegram-Bot-Api-Secret-Token');
  const expectedSecret = (c.env as any).TELEGRAM_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const update = await c.req.json();

  // Always return 200 quickly — do heavy work in waitUntil
  c.executionCtx.waitUntil(handleUpdate(c.env, update));

  return c.json({ ok: true });
});

// --- POST /telegram/link — Generate a link token (authenticated) ---
app.post('/link', async (c) => {
  const user = c.get('user');
  if (!user?.id) return c.json({ error: 'Unauthorized' }, 401);

  // Rate limit: max 5 tokens per hour
  const recentTokens = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM telegram_link_tokens WHERE userId = ? AND createdAt > datetime('now', '-1 hour')"
  ).bind(user.id).first<{ count: number }>();

  if (recentTokens && recentTokens.count >= 5) {
    return c.json({ error: 'Too many link attempts. Try again later.' }, 429);
  }

  // Check if already linked
  const existing = await c.env.DB.prepare(
    "SELECT id FROM telegram_accounts WHERE userId = ? AND status = 'active'"
  ).bind(user.id).first();

  if (existing) {
    return c.json({ error: 'Telegram already linked. Unlink first to re-link.' }, 409);
  }

  // Generate token
  const token = crypto.randomUUID();
  const id = generateId();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  await c.env.DB.prepare(
    'INSERT INTO telegram_link_tokens (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)'
  ).bind(id, user.id, token, expiresAt).run();

  // Bot username — should match your BotFather registration
  const deepLink = `https://t.me/OHCSELibraryBot?start=${token}`;

  return c.json({ deepLink, token, expiresAt });
});

// --- DELETE /telegram/link — Unlink Telegram account (authenticated) ---
app.delete('/link', async (c) => {
  const user = c.get('user');
  if (!user?.id) return c.json({ error: 'Unauthorized' }, 401);

  const account = await c.env.DB.prepare(
    'SELECT chatId FROM telegram_accounts WHERE userId = ?'
  ).bind(user.id).first<{ chatId: string }>();

  if (!account) {
    return c.json({ error: 'No Telegram account linked' }, 404);
  }

  // Delete the link
  await c.env.DB.prepare('DELETE FROM telegram_accounts WHERE userId = ?').bind(user.id).run();

  // Disable telegram in preferences
  await c.env.DB.prepare(
    "UPDATE notification_preferences SET telegramEnabled = 0, updatedAt = datetime('now') WHERE userId = ?"
  ).bind(user.id).run();

  // Send farewell message (fire-and-forget)
  const botToken = (c.env as any).TELEGRAM_BOT_TOKEN;
  if (botToken) {
    c.executionCtx.waitUntil(
      sendTelegramMessage(
        botToken,
        account.chatId,
        'Your OHCS E\\-Library account has been unlinked\\. You will no longer receive notifications here\\.\n\nTo reconnect, visit your notification settings on the platform\\.',
      )
    );
  }

  return c.json({ success: true });
});

// --- GET /telegram/status — Check link status (authenticated) ---
app.get('/status', async (c) => {
  const user = c.get('user');
  if (!user?.id) return c.json({ error: 'Unauthorized' }, 401);

  const account = await c.env.DB.prepare(
    'SELECT chatId, telegramUsername, telegramFirstName, status, mutedUntil, linkedAt FROM telegram_accounts WHERE userId = ?'
  ).bind(user.id).first();

  if (!account) {
    return c.json({ linked: false });
  }

  return c.json({
    linked: true,
    status: account.status,
    username: account.telegramUsername,
    firstName: account.telegramFirstName,
    mutedUntil: account.mutedUntil,
    linkedAt: account.linkedAt,
  });
});

// --- POST /telegram/setup-webhook — One-time webhook registration (admin only) ---
app.post('/setup-webhook', async (c) => {
  const user = c.get('user');
  if (!user?.id || !['super_admin', 'admin'].includes(user.role)) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const botToken = (c.env as any).TELEGRAM_BOT_TOKEN;
  const webhookSecret = (c.env as any).TELEGRAM_WEBHOOK_SECRET;

  if (!botToken || !webhookSecret) {
    return c.json({ error: 'TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET must be set as secrets' }, 500);
  }

  // Determine webhook URL from request origin
  const workerUrl = new URL(c.req.url);
  const webhookUrl = `${workerUrl.origin}/api/v1/telegram/webhook`;

  const [webhookResult, commandsResult] = await Promise.all([
    setupWebhook(botToken, webhookUrl, webhookSecret),
    setBotCommands(botToken),
  ]);

  return c.json({
    webhook: webhookResult,
    commands: commandsResult,
    webhookUrl,
  });
});

// --- Webhook Update Handler ---

async function handleUpdate(env: Env, update: any): Promise<void> {
  const botToken = (env as any).TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  // Handle message updates (bot commands)
  if (update.message?.text) {
    const chatId = String(update.message.chat.id);
    const text = update.message.text.trim();
    const from = update.message.from;

    if (text.startsWith('/start')) {
      await handleStart(env, botToken, chatId, text, from);
    } else if (text === '/stop') {
      await handleStop(env, botToken, chatId);
    } else if (text === '/status') {
      await handleStatus(env, botToken, chatId);
    } else if (text.startsWith('/mute')) {
      await handleMute(env, botToken, chatId, text);
    } else if (text === '/unmute') {
      await handleUnmute(env, botToken, chatId);
    } else if (text === '/settings') {
      await handleSettings(botToken, chatId);
    } else if (text === '/help') {
      await handleHelp(botToken, chatId);
    } else {
      await sendTelegramMessage(
        botToken,
        chatId,
        'Unknown command\\. Type /help to see available commands\\.'
      );
    }
  }

  // Callback queries (Phase 3 — acknowledge and ignore)
  if (update.callback_query) {
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: update.callback_query.id,
          text: 'Interactive features coming soon!',
        }),
      });
    } catch { /* ignore */ }
  }
}

// --- Command Handlers ---

async function handleStart(
  env: Env,
  botToken: string,
  chatId: string,
  text: string,
  from: any
): Promise<void> {
  const parts = text.split(' ');
  const token = parts[1];

  if (!token) {
    await sendTelegramMessage(
      botToken,
      chatId,
      'Welcome to OHCS E\\-Library Bot\\! \u{1F4DA}\n\nTo link your account, go to *Notification Settings* on the platform and click *Connect Telegram*\\.\n\nType /help to see available commands\\.'
    );
    return;
  }

  // Validate token
  const linkToken = await env.DB.prepare(
    'SELECT id, userId, expiresAt FROM telegram_link_tokens WHERE token = ?'
  ).bind(token).first<{ id: string; userId: string; expiresAt: string }>();

  if (!linkToken) {
    await sendTelegramMessage(botToken, chatId, 'Invalid or already used link\\. Please generate a new link from your notification settings\\.');
    return;
  }

  if (new Date(linkToken.expiresAt) < new Date()) {
    // Clean up expired token
    await env.DB.prepare('DELETE FROM telegram_link_tokens WHERE id = ?').bind(linkToken.id).run();
    await sendTelegramMessage(botToken, chatId, 'This link has expired\\. Please generate a new link from your notification settings\\.');
    return;
  }

  // Check if this chatId is already linked to another account
  const existingChat = await env.DB.prepare(
    'SELECT userId FROM telegram_accounts WHERE chatId = ?'
  ).bind(chatId).first();

  if (existingChat) {
    await sendTelegramMessage(botToken, chatId, 'This Telegram account is already linked to an OHCS account\\. Use /stop to unlink first\\.');
    return;
  }

  // Check if user already has a linked account
  const existingUser = await env.DB.prepare(
    'SELECT chatId FROM telegram_accounts WHERE userId = ?'
  ).bind(linkToken.userId).first();

  if (existingUser) {
    // Replace existing link
    await env.DB.prepare('DELETE FROM telegram_accounts WHERE userId = ?').bind(linkToken.userId).run();
  }

  // Create the link
  const id = `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await env.DB.prepare(`
    INSERT INTO telegram_accounts (id, userId, chatId, telegramUsername, telegramFirstName, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).bind(id, linkToken.userId, chatId, from?.username || null, from?.first_name || null).run();

  // Enable telegram in notification preferences
  await env.DB.prepare(`
    UPDATE notification_preferences SET telegramEnabled = 1, updatedAt = datetime('now') WHERE userId = ?
  `).bind(linkToken.userId).run();

  // If no preferences row exists, create one with telegram enabled
  const prefsExist = await env.DB.prepare(
    'SELECT id FROM notification_preferences WHERE userId = ?'
  ).bind(linkToken.userId).first();

  if (!prefsExist) {
    const prefsId = `np_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await env.DB.prepare(`
      INSERT INTO notification_preferences (id, userId, telegramEnabled) VALUES (?, ?, 1)
    `).bind(prefsId, linkToken.userId).run();
  }

  // Delete the used token
  await env.DB.prepare('DELETE FROM telegram_link_tokens WHERE id = ?').bind(linkToken.id).run();

  // Get user display name for welcome message
  const user = await env.DB.prepare(
    'SELECT displayName, firstName FROM users WHERE id = ?'
  ).bind(linkToken.userId).first<{ displayName: string | null; firstName: string | null }>();
  const displayName = user?.displayName || user?.firstName || 'there';

  await sendTelegramMessage(
    botToken,
    chatId,
    `\u{2705} *Account Linked Successfully\\!*\n\nConnected to OHCS E\\-Library as *${escapeMarkdownV2(displayName)}*\\.\n\nYou'll receive notifications here based on your preferences\\. Use /settings to manage them on the platform\\.\n\nType /help to see all available commands\\.`
  );
}

function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

async function handleStop(env: Env, botToken: string, chatId: string): Promise<void> {
  const account = await env.DB.prepare(
    'SELECT userId FROM telegram_accounts WHERE chatId = ?'
  ).bind(chatId).first<{ userId: string }>();

  if (!account) {
    await sendTelegramMessage(botToken, chatId, 'No linked account found\\. Nothing to unlink\\.');
    return;
  }

  await env.DB.prepare('DELETE FROM telegram_accounts WHERE chatId = ?').bind(chatId).run();
  await env.DB.prepare(
    "UPDATE notification_preferences SET telegramEnabled = 0, updatedAt = datetime('now') WHERE userId = ?"
  ).bind(account.userId).run();

  await sendTelegramMessage(
    botToken,
    chatId,
    '\u{1F44B} Account unlinked\\. You will no longer receive notifications here\\.\n\nTo reconnect, visit your notification settings on the OHCS E\\-Library platform\\.'
  );
}

async function handleStatus(env: Env, botToken: string, chatId: string): Promise<void> {
  const account = await env.DB.prepare(
    'SELECT userId, telegramUsername, status, mutedUntil, linkedAt FROM telegram_accounts WHERE chatId = ?'
  ).bind(chatId).first<{ userId: string; telegramUsername: string | null; status: string; mutedUntil: string | null; linkedAt: string }>();

  if (!account) {
    await sendTelegramMessage(botToken, chatId, 'No linked account\\. Visit your OHCS notification settings to connect\\.');
    return;
  }

  const user = await env.DB.prepare(
    'SELECT displayName, firstName, email FROM users WHERE id = ?'
  ).bind(account.userId).first<{ displayName: string | null; firstName: string | null; email: string }>();

  const name = escapeMarkdownV2(user?.displayName || user?.firstName || 'Unknown');
  const email = escapeMarkdownV2(user?.email || 'N/A');
  const linkedDate = escapeMarkdownV2(new Date(account.linkedAt).toLocaleDateString('en-GB'));

  let statusText = `\u{1F4CB} *Account Status*\n\n`;
  statusText += `*Name:* ${name}\n`;
  statusText += `*Email:* ${email}\n`;
  statusText += `*Status:* ${escapeMarkdownV2(account.status)}\n`;
  statusText += `*Linked:* ${linkedDate}\n`;

  if (account.mutedUntil && new Date(account.mutedUntil) > new Date()) {
    const muteEnd = escapeMarkdownV2(new Date(account.mutedUntil).toLocaleTimeString('en-GB'));
    statusText += `\n\u{1F507} *Muted until:* ${muteEnd}`;
  }

  // Get delivery stats
  const stats = await env.DB.prepare(
    "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent FROM telegram_delivery_logs WHERE userId = ? AND sentAt > datetime('now', '-7 days')"
  ).bind(account.userId).first<{ total: number; sent: number }>();

  if (stats) {
    statusText += `\n\n*Last 7 days:* ${stats.sent || 0} notifications delivered`;
  }

  await sendTelegramMessage(botToken, chatId, statusText);
}

async function handleMute(env: Env, botToken: string, chatId: string, text: string): Promise<void> {
  const account = await env.DB.prepare(
    'SELECT userId FROM telegram_accounts WHERE chatId = ?'
  ).bind(chatId).first<{ userId: string }>();

  if (!account) {
    await sendTelegramMessage(botToken, chatId, 'No linked account\\. Visit your OHCS notification settings to connect\\.');
    return;
  }

  // Parse duration: /mute 2h, /mute 30m, /mute 1d
  const match = text.match(/\/mute\s+(\d+)(m|h|d)/i);
  if (!match) {
    await sendTelegramMessage(botToken, chatId, 'Usage: `/mute <duration>`\n\nExamples:\n`/mute 30m` \\- 30 minutes\n`/mute 2h` \\- 2 hours\n`/mute 1d` \\- 1 day');
    return;
  }

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  let ms = 0;

  if (unit === 'm') ms = amount * 60 * 1000;
  else if (unit === 'h') ms = amount * 60 * 60 * 1000;
  else if (unit === 'd') ms = amount * 24 * 60 * 60 * 1000;

  // Cap at 7 days
  ms = Math.min(ms, 7 * 24 * 60 * 60 * 1000);

  const mutedUntil = new Date(Date.now() + ms).toISOString();
  await env.DB.prepare(
    "UPDATE telegram_accounts SET mutedUntil = ?, updatedAt = datetime('now') WHERE chatId = ?"
  ).bind(mutedUntil, chatId).run();

  const durationText = escapeMarkdownV2(
    unit === 'm' ? `${amount} minute${amount > 1 ? 's' : ''}` :
    unit === 'h' ? `${amount} hour${amount > 1 ? 's' : ''}` :
    `${amount} day${amount > 1 ? 's' : ''}`
  );

  await sendTelegramMessage(botToken, chatId, `\u{1F507} Notifications muted for ${durationText}\\.\n\nUse /unmute to resume earlier\\.`);
}

async function handleUnmute(env: Env, botToken: string, chatId: string): Promise<void> {
  const account = await env.DB.prepare(
    'SELECT userId FROM telegram_accounts WHERE chatId = ?'
  ).bind(chatId).first<{ userId: string }>();

  if (!account) {
    await sendTelegramMessage(botToken, chatId, 'No linked account\\. Visit your OHCS notification settings to connect\\.');
    return;
  }

  await env.DB.prepare(
    "UPDATE telegram_accounts SET mutedUntil = NULL, updatedAt = datetime('now') WHERE chatId = ?"
  ).bind(chatId).run();

  await sendTelegramMessage(botToken, chatId, '\u{1F514} Notifications resumed\\!');
}

async function handleSettings(botToken: string, chatId: string): Promise<void> {
  await sendTelegramMessage(
    botToken,
    chatId,
    '\u{2699} Manage your notification preferences on the platform:\n\n[Open Notification Settings](https://ohcs\\-elibrary\\.pages\\.dev/settings/notifications)'
  );
}

async function handleHelp(botToken: string, chatId: string): Promise<void> {
  await sendTelegramMessage(
    botToken,
    chatId,
    `\u{1F4DA} *OHCS E\\-Library Bot Commands*\n\n/start \\- Link your account\n/stop \\- Unlink and stop notifications\n/status \\- View account info & stats\n/mute \\<duration\\> \\- Mute \\(e\\.g\\. /mute 2h\\)\n/unmute \\- Resume notifications\n/settings \\- Open notification settings\n/help \\- Show this message`
  );
}

export default app;
export { app as telegramRoutes };
```

- [ ] **Step 2: Commit**

```bash
git add workers/src/routes/telegram.ts
git commit -m "feat(telegram): add webhook handler and account linking API routes"
```

---

## Task 4: Register Routes & Update Env Type

**Files:**
- Modify: `workers/src/routes/index.ts`
- Modify: `workers/src/index.ts`

- [ ] **Step 1: Add telegramRoutes export to routes/index.ts**

At the end of `workers/src/routes/index.ts`, add:

```typescript
// Telegram Notifications
export { telegramRoutes } from './telegram';
```

- [ ] **Step 2: Import telegramRoutes in index.ts**

In `workers/src/index.ts`, add to the imports block (around line 12-66):

```typescript
  // Telegram Notifications
  telegramRoutes,
```

- [ ] **Step 3: Add Telegram secrets to the Env interface**

In `workers/src/index.ts`, add to the `Env` interface (around line 68-85):

```typescript
  // Telegram Bot
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
```

- [ ] **Step 4: Register Telegram routes — webhook is public, link/status are protected**

In `workers/src/index.ts`, add after the Paystack webhook route registration (around line 319, after the `webhookRoutes` line) — the webhook endpoint must NOT have auth middleware since Telegram calls it:

```typescript
// Telegram Bot — webhook is public (validated by secret header), link/status require auth
app.use('/api/v1/telegram/link', authMiddleware);
app.use('/api/v1/telegram/status', authMiddleware);
app.use('/api/v1/telegram/setup-webhook', authMiddleware);
app.route('/api/v1/telegram', telegramRoutes);
```

- [ ] **Step 5: Add Telegram cleanup to the scheduled handler**

In `workers/src/index.ts`, inside the `scheduled()` function (around line 504, after the anonymous session cleanup block), add:

```typescript
          // Cleanup expired Telegram link tokens and old delivery logs
          try {
            const { cleanupTelegramData } = await import('./services/telegramService');
            const telegramCleanup = await cleanupTelegramData(env);
            if (telegramCleanup.tokensDeleted > 0 || telegramCleanup.logsDeleted > 0) {
              console.log('Telegram cleanup completed:', telegramCleanup);
            }
          } catch (telegramCleanupError) {
            console.error('Telegram cleanup failed:', telegramCleanupError);
          }
```

- [ ] **Step 6: Commit**

```bash
git add workers/src/routes/index.ts workers/src/index.ts
git commit -m "feat(telegram): register routes, add env types, add cron cleanup"
```

---

## Task 5: Hook Telegram Delivery into Notification Creation

**Files:**
- Modify: `workers/src/routes/notifications.ts`

- [ ] **Step 1: Add Telegram delivery to the notification creation endpoint**

In `workers/src/routes/notifications.ts`, find the `POST /` handler that creates notifications. After the notification is inserted into the database (the `INSERT INTO notifications` query), add the Telegram delivery as a fire-and-forget call.

Locate the block where the notification insert returns successfully and `return c.json(...)` is called. Just before that return, add:

```typescript
    // Fire-and-forget: deliver via Telegram if enabled
    c.executionCtx.waitUntil(
      (async () => {
        try {
          const { deliverTelegramNotification } = await import('../services/telegramService');
          await deliverTelegramNotification(c.env, targetUserId, {
            id: notifId,
            type: body.type || 'system',
            title: body.title,
            message: body.message,
            link: body.link || undefined,
            actorName: body.actorName || undefined,
            priority: body.priority || 'normal',
            metadata: body.metadata || undefined,
          });
        } catch (err) {
          console.error('Telegram delivery failed:', err);
        }
      })()
    );
```

Where `targetUserId` is the userId the notification was created for (either `userId` from auth or the admin-specified `body.userId`), and `notifId` is the generated notification ID.

- [ ] **Step 2: Add Telegram delivery to the bulk notification endpoint**

In the `POST /bulk` handler, after bulk notifications are inserted, add:

```typescript
    // Fire-and-forget: deliver bulk via Telegram
    c.executionCtx.waitUntil(
      (async () => {
        try {
          const { deliverBulkTelegramNotification } = await import('../services/telegramService');
          await deliverBulkTelegramNotification(c.env, {
            id: `bulk_${Date.now()}`,
            type: body.type || 'announcement',
            title: body.title,
            message: body.message,
            link: body.link || undefined,
            priority: body.priority || 'normal',
          }, insertedUserIds);
        } catch (err) {
          console.error('Telegram bulk delivery failed:', err);
        }
      })()
    );
```

Where `insertedUserIds` is the array of user IDs that received the notification.

- [ ] **Step 3: Update the GET /preferences endpoint to include telegramEnabled**

In the preferences fetch handler, add `telegramEnabled` to the returned defaults and the query result mapping. The existing query already selects `*` from `notification_preferences`, so the column will be included automatically. Update the default object:

```typescript
    // In the defaults object when no preferences exist:
    const defaults = {
      // ...existing defaults...
      telegramEnabled: false,
    };
```

- [ ] **Step 4: Update the PUT /preferences endpoint to handle telegramEnabled**

In the preferences update handler, add `telegramEnabled` to the UPDATE statement. Add it to the list of columns being updated:

```typescript
    const telegramEnabled = body.telegramEnabled !== undefined ? (body.telegramEnabled ? 1 : 0) : undefined;
```

And include it in the UPDATE query if defined.

- [ ] **Step 5: Commit**

```bash
git add workers/src/routes/notifications.ts
git commit -m "feat(telegram): hook delivery into notification creation and bulk endpoints"
```

---

## Task 6: Frontend — Notification Store Updates

**Files:**
- Modify: `src/stores/notificationStore.ts`

- [ ] **Step 1: Add Telegram state and actions to the notification store**

Add the following state fields to the store interface and implementation:

```typescript
  // Telegram
  telegramStatus: {
    linked: boolean;
    status?: string;
    username?: string;
    firstName?: string;
    mutedUntil?: string;
    linkedAt?: string;
  } | null;
  isTelegramLoading: boolean;

  // Telegram actions
  fetchTelegramStatus: () => Promise<void>;
  linkTelegram: () => Promise<{ deepLink: string; token: string; expiresAt: string } | null>;
  unlinkTelegram: () => Promise<void>;
```

Implementation:

```typescript
  telegramStatus: null,
  isTelegramLoading: false,

  fetchTelegramStatus: async () => {
    try {
      set({ isTelegramLoading: true });
      const res = await authFetch(`${API_URL}/api/v1/telegram/status`);
      if (res.ok) {
        const data = await res.json();
        set({ telegramStatus: data });
      }
    } catch (err) {
      console.error('Failed to fetch Telegram status:', err);
    } finally {
      set({ isTelegramLoading: false });
    }
  },

  linkTelegram: async () => {
    try {
      set({ isTelegramLoading: true });
      const res = await authFetch(`${API_URL}/api/v1/telegram/link`, {
        method: 'POST',
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error('Failed to generate Telegram link:', err);
      return null;
    } finally {
      set({ isTelegramLoading: false });
    }
  },

  unlinkTelegram: async () => {
    try {
      set({ isTelegramLoading: true });
      const res = await authFetch(`${API_URL}/api/v1/telegram/link`, {
        method: 'DELETE',
      });
      if (res.ok) {
        set({ telegramStatus: { linked: false } });
      }
    } catch (err) {
      console.error('Failed to unlink Telegram:', err);
    } finally {
      set({ isTelegramLoading: false });
    }
  },
```

Where `authFetch` is the existing helper already in the store and `API_URL` is the existing base URL constant.

- [ ] **Step 2: Commit**

```bash
git add src/stores/notificationStore.ts
git commit -m "feat(telegram): add telegram state and actions to notification store"
```

---

## Task 7: Frontend — TelegramConnect Component

**Files:**
- Create: `src/components/notifications/TelegramConnect.tsx`

- [ ] **Step 1: Install qrcode dependency**

Run: `npm install qrcode @types/qrcode`

- [ ] **Step 2: Create the TelegramConnect component**

```tsx
// src/components/notifications/TelegramConnect.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Link2, Unlink, Loader2, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { cn } from '@/utils/cn';

interface TelegramStatus {
  linked: boolean;
  status?: string;
  username?: string;
  firstName?: string;
  mutedUntil?: string;
  linkedAt?: string;
}

interface TelegramConnectProps {
  telegramStatus: TelegramStatus | null;
  isLoading: boolean;
  onLink: () => Promise<{ deepLink: string; token: string; expiresAt: string } | null>;
  onUnlink: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
}

export function TelegramConnect({
  telegramStatus,
  isLoading,
  onLink,
  onUnlink,
  onRefreshStatus,
}: TelegramConnectProps) {
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Stop polling when linked
  useEffect(() => {
    if (telegramStatus?.linked) {
      stopPolling();
      setIsLinking(false);
      setDeepLink(null);
      setQrDataUrl(null);
    }
  }, [telegramStatus?.linked, stopPolling]);

  const handleConnect = async () => {
    setError(null);
    setIsLinking(true);

    const result = await onLink();
    if (!result) {
      setError('Failed to generate link. Please try again.');
      setIsLinking(false);
      return;
    }

    setDeepLink(result.deepLink);

    // Generate QR code
    try {
      const dataUrl = await QRCode.toDataURL(result.deepLink, {
        width: 200,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
    } catch {
      // QR generation failed — link still works
    }

    // Poll for link completion every 3 seconds
    stopPolling();
    const expiresAt = new Date(result.expiresAt).getTime();
    pollingRef.current = setInterval(async () => {
      if (Date.now() > expiresAt) {
        stopPolling();
        setIsLinking(false);
        setDeepLink(null);
        setQrDataUrl(null);
        setError('Link expired. Please try again.');
        return;
      }
      await onRefreshStatus();
    }, 3000);
  };

  const handleDisconnect = async () => {
    setError(null);
    await onUnlink();
  };

  const isLinked = telegramStatus?.linked && telegramStatus?.status === 'active';

  return (
    <section className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
      <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-[#0088cc]" />
        Telegram Notifications
      </h3>

      <AnimatePresence mode="wait">
        {isLinked ? (
          /* Connected State */
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Connected
                  {telegramStatus?.username && (
                    <span className="ml-1 text-green-600 dark:text-green-400">
                      @{telegramStatus.username}
                    </span>
                  )}
                </p>
                {telegramStatus?.linkedAt && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    Linked {new Date(telegramStatus.linkedAt).toLocaleDateString('en-GB')}
                  </p>
                )}
              </div>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Unlink className="w-4 h-4" />
                Disconnect
              </button>
            </div>

            {telegramStatus?.mutedUntil && new Date(telegramStatus.mutedUntil) > new Date() && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Muted until {new Date(telegramStatus.mutedUntil).toLocaleTimeString('en-GB')}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          /* Disconnected / Linking State */
          <motion.div
            key="disconnected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Connect your Telegram account to receive notifications directly in Telegram.
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {!isLinking ? (
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
                  'bg-[#0088cc] text-white hover:bg-[#0077b3]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Connect Telegram
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-surface-50 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600 rounded-lg">
                  {qrDataUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={qrDataUrl}
                        alt="Scan to connect Telegram"
                        className="w-[160px] h-[160px] rounded-lg"
                      />
                    </div>
                  )}
                  <div className="text-center sm:text-left space-y-3">
                    <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                      <QrCode className="w-4 h-4" />
                      Scan the QR code or click the button below
                    </div>
                    <a
                      href={deepLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
                        'bg-[#0088cc] text-white hover:bg-[#0077b3]'
                      )}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open in Telegram
                    </a>
                    <div className="flex items-center gap-2 text-xs text-surface-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Waiting for connection...
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    stopPolling();
                    setIsLinking(false);
                    setDeepLink(null);
                    setQrDataUrl(null);
                  }}
                  className="text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/notifications/TelegramConnect.tsx
git commit -m "feat(telegram): add TelegramConnect component with QR code and polling"
```

---

## Task 8: Frontend — Update NotificationSettings

**Files:**
- Modify: `src/components/notifications/NotificationSettings.tsx`

- [ ] **Step 1: Add telegram to the NotificationPreferences interface**

Update the interface at the top of the file:

```typescript
interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sound: boolean;
  telegram: boolean;  // NEW
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    messages: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    documents: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    forum: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    groups: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    achievements: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    system: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
  };
}
```

- [ ] **Step 2: Update the default preferences state**

In the `useState` initial value, add `telegram: false` to the top level and `telegram: false` or `telegram: true` to each category default (matching the agreed defaults):

```typescript
    initialPreferences || {
      email: true,
      push: true,
      inApp: true,
      sound: true,
      telegram: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
      categories: {
        messages: { email: true, push: true, inApp: true, telegram: false },
        documents: { email: true, push: false, inApp: true, telegram: true },
        forum: { email: false, push: true, inApp: true, telegram: false },
        groups: { email: true, push: true, inApp: true, telegram: false },
        achievements: { email: false, push: true, inApp: true, telegram: false },
        system: { email: true, push: true, inApp: true, telegram: true },
      },
    }
```

- [ ] **Step 3: Add Telegram to the Global Settings delivery methods grid**

Change the grid from `grid-cols-1 sm:grid-cols-3` to `grid-cols-1 sm:grid-cols-4` and add the Telegram checkbox after the In-App one:

```tsx
            <label className="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences.telegram}
                onChange={(e) => updatePreference('telegram', e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <MessageCircle className="w-5 h-5 text-[#0088cc]" />
              <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                Telegram
              </span>
            </label>
```

Add `import { MessageCircle } from 'lucide-react'` to the existing Lucide import at the top of the file.

- [ ] **Step 4: Add TG column to the Category Preferences grid**

Change the header grid from `grid-cols-4` to `grid-cols-5` and add the TG column header:

```tsx
          <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-surface-50 dark:bg-surface-700/50 text-xs font-medium text-surface-500 uppercase">
            <div>Category</div>
            <div className="text-center">Email</div>
            <div className="text-center">Push</div>
            <div className="text-center">In-App</div>
            <div className="text-center">TG</div>
          </div>
```

In each category row, change `grid-cols-4` to `grid-cols-5` and add the Telegram checkbox column after the In-App column:

```tsx
                <div className="text-center">
                  <input
                    type="checkbox"
                    checked={prefs.telegram}
                    onChange={(e) =>
                      updatePreference(`categories.${category.id}.telegram`, e.target.checked)
                    }
                    className="w-4 h-4 rounded border-surface-300 text-[#0088cc] focus:ring-[#0088cc]/50"
                  />
                </div>
```

- [ ] **Step 5: Add TelegramConnect component import and placement**

Import the TelegramConnect component and the notification store at the top:

```typescript
import { TelegramConnect } from './TelegramConnect';
import { useNotificationStore } from '@/stores/notificationStore';
```

Inside the component function, add the store hooks:

```typescript
  const { telegramStatus, isTelegramLoading, fetchTelegramStatus, linkTelegram, unlinkTelegram } = useNotificationStore();

  // Fetch Telegram status on mount
  useEffect(() => {
    fetchTelegramStatus();
  }, [fetchTelegramStatus]);
```

Add `import { useState, useEffect } from 'react'` (add `useEffect` to existing import).

Place the `<TelegramConnect>` component between the Global Settings and Quiet Hours sections:

```tsx
      {/* Telegram Connection */}
      <TelegramConnect
        telegramStatus={telegramStatus}
        isLoading={isTelegramLoading}
        onLink={linkTelegram}
        onUnlink={unlinkTelegram}
        onRefreshStatus={fetchTelegramStatus}
      />
```

- [ ] **Step 6: Commit**

```bash
git add src/components/notifications/NotificationSettings.tsx
git commit -m "feat(telegram): add TG column to settings, integrate TelegramConnect component"
```

---

## Task 9: Set Secrets & Deploy

- [ ] **Step 1: Create the Telegram bot via BotFather**

1. Open Telegram, search for `@BotFather`
2. Send `/newbot`
3. Name: `OHCS E-Library Notifications`
4. Username: `OHCSELibraryBot` (or available variant)
5. Copy the bot token

- [ ] **Step 2: Set Cloudflare secrets**

```bash
cd workers
npx wrangler secret put TELEGRAM_BOT_TOKEN
# Paste the bot token from BotFather

npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
# Generate and paste a random string, e.g.: openssl rand -hex 32
```

- [ ] **Step 3: Apply the migration to production**

```bash
npx wrangler d1 execute ohcs-elibrary --file=migrations/045_telegram_notifications.sql
```

- [ ] **Step 4: Deploy the worker**

```bash
npx wrangler deploy
```

- [ ] **Step 5: Register the webhook with Telegram**

Call the setup endpoint (as an admin user):

```bash
curl -X POST https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1/telegram/setup-webhook \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "webhook": { "ok": true, "result": true },
  "commands": { "ok": true, "result": true },
  "webhookUrl": "https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1/telegram/webhook"
}
```

- [ ] **Step 6: Deploy the frontend**

```bash
cd .. && npm run build
# Deploy to Cloudflare Pages
```

- [ ] **Step 7: Commit any config changes**

```bash
git add -A
git commit -m "chore(telegram): deployment configuration"
```

---

## Task 10: End-to-End Testing

- [ ] **Step 1: Test account linking**

1. Log in to the platform as a test user
2. Navigate to Notification Settings
3. Click "Connect Telegram"
4. Verify QR code appears and deep link works
5. Click "Open in Telegram" or scan QR
6. Verify bot sends welcome message
7. Verify platform UI updates to "Connected" state

- [ ] **Step 2: Test bot commands**

1. In Telegram, send `/status` — verify account info displays
2. Send `/mute 1h` — verify mute confirmation
3. Send `/unmute` — verify unmute confirmation
4. Send `/settings` — verify link to platform
5. Send `/help` — verify command list
6. Send `/stop` — verify unlink confirmation
7. Verify platform UI updates to disconnected state

- [ ] **Step 3: Test notification delivery**

1. Re-link the account
2. Create a test notification via the admin panel or API
3. Verify the Telegram message arrives with correct formatting
4. Verify the notification icon matches the type
5. Verify the "View on OHCS E-Library" link works

- [ ] **Step 4: Test preference controls**

1. Disable Telegram for a specific category (e.g., Forum)
2. Create a forum notification — verify it does NOT arrive on Telegram
3. Create a system notification — verify it DOES arrive
4. Disable Telegram globally — verify no notifications arrive
5. Re-enable — verify delivery resumes

- [ ] **Step 5: Test edge cases**

1. Block the bot in Telegram — create a notification — verify account marked inactive
2. Generate a link token, wait 10+ minutes — verify expired message
3. Try `/start` with no token — verify welcome prompt
4. Try `/start` with an invalid token — verify error message
5. Test quiet hours: set quiet hours to current time — verify notifications are held

- [ ] **Step 6: Commit test results documentation**

```bash
git commit --allow-empty -m "test(telegram): end-to-end testing complete"
```
