/**
 * Telegram Delivery Service
 * Handles Telegram Bot API client, message formatting, and notification delivery
 * Uses Telegram Bot API for direct message delivery to linked user accounts
 */

// Use a local minimal Env interface since types.ts does not exist yet.
// TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET are accessed via (env as any) until
// the main Env interface in index.ts is updated in a later task.
interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface TelegramAccount {
  id: string;
  userId: string;
  chatId: string;
  telegramUsername: string | null;
  status: string;        // 'active' | 'inactive' | 'blocked'
  mutedUntil: string | null; // ISO datetime or null
}

interface NotificationInput {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  priority?: string;
  actorName?: string;
}

interface NotificationPreferences {
  telegramEnabled: number;
  quietHoursEnabled: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  categoryPreferences: string | null; // JSON string
}

interface SendResult {
  ok: boolean;
  messageId?: number;
  error?: string;
  retryAfter?: number;
}

interface TelegramAPIResponse {
  ok: boolean;
  result?: { message_id: number };
  error_code?: number;
  description?: string;
  parameters?: { retry_after?: number };
}

interface DeliveryResult {
  delivered: number;
  failed: number;
  skipped: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Type-icon mapping
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<string, string> = {
  system:             '🔒',
  security:           '🔒',
  document_approved:  '✅',
  document_rejected:  '❌',
  document:           '📄',
  announcement:       '📢',
  forum_reply:        '💬',
  forum_mention:      '💬',
  group_invite:       '👥',
  group_post:         '👥',
  badge_earned:       '🏆',
  challenge_complete: '🏆',
  level_up:           '⭐',
  xp_earned:          '⭐',
  message:            '✉️',
  like:               '❤️',
  follow:             '👤',
  welcome:            '👋',
  streak:             '🔥',
};

const DEFAULT_ICON = '🔔';

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

const TYPE_TO_CATEGORY: Record<string, string> = {
  message:            'messages',
  like:               'messages',
  follow:             'messages',
  document:           'documents',
  document_approved:  'documents',
  document_rejected:  'documents',
  forum_reply:        'forum',
  forum_mention:      'forum',
  group_invite:       'groups',
  group_post:         'groups',
  badge_earned:       'achievements',
  level_up:           'achievements',
  xp_earned:          'achievements',
  challenge_complete: 'achievements',
  streak:             'achievements',
  system:             'system',
  announcement:       'system',
  security:           'system',
  welcome:            'system',
};

/**
 * Map a notification type to its preference category key.
 * Returns 'system' as the safe fallback.
 */
export function mapTypeToCategory(type: string): string {
  return TYPE_TO_CATEGORY[type] ?? 'system';
}

// ---------------------------------------------------------------------------
// ID generator
// ---------------------------------------------------------------------------

/**
 * Generate a time-sortable random ID (similar pattern to the email digest service).
 */
export function generateId(prefix = 'tg'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ---------------------------------------------------------------------------
// MarkdownV2 escaping
// ---------------------------------------------------------------------------

/**
 * Escape all MarkdownV2 special characters as required by the Telegram Bot API.
 * Special chars: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
export function escapeMarkdownV2(text: string): string {
  if (!text) return '';
  // Order matters — backslash must be escaped first to avoid double-escaping.
  return text
    .replace(/\\/g, '\\\\')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

// ---------------------------------------------------------------------------
// Message formatter
// ---------------------------------------------------------------------------

const PLATFORM_URL = 'https://ohcs-elibrary.pages.dev';

/**
 * Format a notification into a Telegram MarkdownV2 message.
 * Structure:
 *   {icon} *{title}*
 *   ─────────────────
 *   {message}
 *   👤 {actorName}   (if present)
 *   🔗 [View on platform]({link})  (if present)
 */
export function formatTelegramMessage(notification: NotificationInput): string {
  const icon = TYPE_ICONS[notification.type] ?? DEFAULT_ICON;
  const title = escapeMarkdownV2(notification.title);
  const body  = escapeMarkdownV2(notification.message ?? '');

  const lines: string[] = [
    `${icon} *${title}*`,
    '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-',
    body,
  ];

  if (notification.actorName) {
    lines.push(`👤 ${escapeMarkdownV2(notification.actorName)}`);
  }

  if (notification.link) {
    const fullUrl = notification.link.startsWith('http')
      ? notification.link
      : `${PLATFORM_URL}${notification.link}`;
    // URLs inside []() must not have MarkdownV2 escaping applied inside the ()
    lines.push(`🔗 [View on platform](${fullUrl})`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Bot API client
// ---------------------------------------------------------------------------

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * Low-level Telegram Bot API caller.
 */
async function callTelegramAPI(
  botToken: string,
  method: string,
  body: Record<string, unknown>
): Promise<TelegramAPIResponse> {
  const url = `${TELEGRAM_API_BASE}/bot${botToken}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json() as TelegramAPIResponse;
  return data;
}

// ---------------------------------------------------------------------------
// Send message
// ---------------------------------------------------------------------------

/**
 * Send a message to a Telegram chat.
 * Returns { ok, messageId?, error?, retryAfter? }.
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  parseMode: 'MarkdownV2' | 'HTML' | 'plain' = 'MarkdownV2'
): Promise<SendResult> {
  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    };

    if (parseMode !== 'plain') {
      body.parse_mode = parseMode;
    }

    const data = await callTelegramAPI(botToken, 'sendMessage', body);

    if (data.ok && data.result) {
      return { ok: true, messageId: data.result.message_id };
    }

    const retryAfter = data.parameters?.retry_after;
    return {
      ok: false,
      error: data.description ?? 'Unknown Telegram API error',
      retryAfter,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Quiet-hours helper
// ---------------------------------------------------------------------------

/**
 * Returns true if the current UTC time falls within the quiet-hours window.
 * Supports overnight ranges (e.g. 22:00–06:00).
 */
export function isInQuietHours(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;

  const now = new Date();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin]     = end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes   = endHour   * 60 + endMin;

  if (startMinutes <= endMinutes) {
    // Same-day range (e.g. 09:00–17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight range (e.g. 22:00–06:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

// ---------------------------------------------------------------------------
// Delivery logger
// ---------------------------------------------------------------------------

/**
 * Insert a row into telegram_delivery_logs.
 */
export async function logDelivery(
  env: Env,
  params: {
    userId: string;
    chatId: string;
    notificationId: string;
    messageId: number | null;
    status: 'delivered' | 'failed' | 'skipped';
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const id = generateId('tdl');
    await env.DB.prepare(`
      INSERT INTO telegram_delivery_logs
        (id, userId, chatId, notificationId, telegramMessageId, status, errorMessage, sentAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      params.userId,
      params.chatId,
      params.notificationId,
      params.messageId ?? null,
      params.status,
      params.errorMessage ?? null,
    ).run();
  } catch (err) {
    // Non-fatal — log to console but never throw.
    console.error('telegram: failed to write delivery log', err);
  }
}

// ---------------------------------------------------------------------------
// Delivery orchestrator — single user
// ---------------------------------------------------------------------------

/**
 * Deliver a single notification to a user via Telegram.
 *
 * Steps:
 *  1. Look up the user's linked Telegram account (must be active).
 *  2. Check mute status.
 *  3. Check notification_preferences (telegramEnabled + per-category toggle).
 *  4. Check quiet hours.
 *  5. Format and send. Falls back to plain text if MarkdownV2 parse fails (400).
 *  6. On 403 (bot blocked) mark the account inactive.
 *  7. Write to telegram_delivery_logs.
 */
export async function deliverTelegramNotification(
  env: Env,
  userId: string,
  notification: NotificationInput
): Promise<SendResult> {
  const botToken: string = (env as any).TELEGRAM_BOT_TOKEN ?? '';

  if (!botToken) {
    console.warn('telegram: TELEGRAM_BOT_TOKEN not configured');
    return { ok: false, error: 'Bot token not configured' };
  }

  // 1. Fetch the user's linked Telegram account.
  const account = await env.DB.prepare(`
    SELECT id, userId, chatId, telegramUsername, status, mutedUntil
    FROM telegram_accounts
    WHERE userId = ? AND status = 'active'
    LIMIT 1
  `).bind(userId).first() as TelegramAccount | null;

  if (!account) {
    return { ok: false, error: 'No active Telegram account linked' };
  }

  const chatId = account.chatId;

  // 2. Check mute status.
  if (account.mutedUntil && new Date(account.mutedUntil) > new Date()) {
    await logDelivery(env, {
      userId,
      chatId,
      notificationId: notification.id,
      messageId: null,
      status: 'skipped',
      errorMessage: 'Account is muted',
    });
    return { ok: false, error: 'Account is muted' };
  }

  // 3. Check notification preferences.
  const prefs = await env.DB.prepare(`
    SELECT
      telegramEnabled,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      categoryPreferences
    FROM notification_preferences
    WHERE userId = ?
    LIMIT 1
  `).bind(userId).first() as NotificationPreferences | null;

  if (!prefs || prefs.telegramEnabled !== 1) {
    await logDelivery(env, {
      userId,
      chatId,
      notificationId: notification.id,
      messageId: null,
      status: 'skipped',
      errorMessage: 'Telegram notifications disabled',
    });
    return { ok: false, error: 'Telegram notifications disabled' };
  }

  // Check per-category preference toggle from categoryPreferences JSON.
  const category = mapTypeToCategory(notification.type);
  if (prefs.categoryPreferences) {
    try {
      const cats = JSON.parse(prefs.categoryPreferences);
      if (cats[category] && cats[category].telegram === false) {
        await logDelivery(env, {
          userId,
          chatId,
          notificationId: notification.id,
          messageId: null,
          status: 'skipped',
          errorMessage: `Category '${category}' disabled`,
        });
        return { ok: false, error: `Category '${category}' disabled` };
      }
    } catch {
      // Invalid JSON — deliver anyway
    }
  }

  // 4. Check quiet hours.
  if (prefs.quietHoursEnabled === 1 && notification.priority !== 'urgent') {
    if (isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)) {
      await logDelivery(env, {
        userId,
        chatId,
        notificationId: notification.id,
        messageId: null,
        status: 'skipped',
        errorMessage: 'Quiet hours active',
      });
      return { ok: false, error: 'Quiet hours active' };
    }
  }

  // 5. Format and attempt to send with MarkdownV2.
  const markdownText = formatTelegramMessage(notification);
  let result = await sendTelegramMessage(botToken, chatId, markdownText, 'MarkdownV2');

  // Fallback: if Telegram rejected the parse (likely malformed markdown), retry as plain text.
  if (!result.ok && result.error?.includes('can\'t parse')) {
    const plainText = [
      `${TYPE_ICONS[notification.type] ?? DEFAULT_ICON} ${notification.title}`,
      '-----------------',
      notification.message ?? '',
      notification.actorName ? `From: ${notification.actorName}` : '',
      notification.link
        ? `Link: ${notification.link.startsWith('http') ? notification.link : PLATFORM_URL + notification.link}`
        : '',
    ].filter(Boolean).join('\n');

    result = await sendTelegramMessage(botToken, chatId, plainText, 'plain');
  }

  // 6. Handle bot-blocked (403) — mark the account inactive.
  if (!result.ok && result.error?.includes('403')) {
    try {
      await env.DB.prepare(`
        UPDATE telegram_accounts SET status = 'inactive', updatedAt = datetime('now') WHERE userId = ?
      `).bind(userId).run();
      console.warn(`telegram: bot blocked by user ${userId}, account marked inactive`);
    } catch (dbErr) {
      console.error('telegram: failed to mark account inactive', dbErr);
    }
  }

  // 7. Log the outcome.
  await logDelivery(env, {
    userId,
    chatId,
    notificationId: notification.id,
    messageId: result.messageId ?? null,
    status: result.ok ? 'delivered' : 'failed',
    errorMessage: result.error,
  });

  return result;
}

// ---------------------------------------------------------------------------
// Bulk delivery orchestrator
// ---------------------------------------------------------------------------

const BULK_BATCH_SIZE = 25;

/**
 * Deliver a notification to multiple users in batches of 25.
 * Telegram's Bot API rate limit is ~30 messages/second globally;
 * processing in small batches keeps us well within that envelope.
 */
export async function deliverBulkTelegramNotification(
  env: Env,
  notification: NotificationInput,
  userIds: string[]
): Promise<DeliveryResult> {
  const result: DeliveryResult = { delivered: 0, failed: 0, skipped: 0, errors: [] };

  for (let i = 0; i < userIds.length; i += BULK_BATCH_SIZE) {
    const batch = userIds.slice(i, i + BULK_BATCH_SIZE);

    await Promise.all(
      batch.map(async (userId) => {
        try {
          const send = await deliverTelegramNotification(env, userId, notification);
          if (send.ok) {
            result.delivered++;
          } else if (
            send.error === 'No active Telegram account linked' ||
            send.error === 'Account is muted' ||
            send.error?.startsWith('Telegram notifications disabled') ||
            send.error?.startsWith('Category ') ||
            send.error === 'Quiet hours active'
          ) {
            result.skipped++;
          } else {
            result.failed++;
            if (send.error) result.errors.push(`${userId}: ${send.error}`);
          }
        } catch (err: unknown) {
          result.failed++;
          const msg = err instanceof Error ? err.message : String(err);
          result.errors.push(`${userId}: ${msg}`);
        }
      })
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Webhook & bot commands setup
// ---------------------------------------------------------------------------

/**
 * Register a webhook URL with the Telegram Bot API.
 * The secret_token is verified on incoming webhook requests.
 */
export async function setupWebhook(
  botToken: string,
  webhookUrl: string,
  secret: string
): Promise<TelegramAPIResponse> {
  return callTelegramAPI(botToken, 'setWebhook', {
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });
}

/**
 * Set the bot's command menu visible in Telegram clients.
 */
export async function setBotCommands(botToken: string): Promise<TelegramAPIResponse> {
  return callTelegramAPI(botToken, 'setMyCommands', {
    commands: [
      { command: 'start',       description: 'Link your OHCS E-Library account' },
      { command: 'stop',        description: 'Unlink and stop notifications' },
      { command: 'mute',        description: 'Mute all notifications temporarily' },
      { command: 'unmute',      description: 'Resume notifications' },
      { command: 'status',      description: 'Show your current notification status' },
      { command: 'settings',    description: 'Open notification settings' },
      { command: 'help',        description: 'Show available commands' },
    ],
  });
}

// ---------------------------------------------------------------------------
// Cron cleanup
// ---------------------------------------------------------------------------

/**
 * Periodic maintenance:
 *  - Delete expired telegram_link_tokens (past their expiresAt date).
 *  - Delete telegram_delivery_logs older than 30 days.
 */
export async function cleanupTelegramData(env: Env): Promise<{ tokensDeleted: number; logsDeleted: number }> {
  let tokensDeleted = 0;
  let logsDeleted = 0;

  try {
    const tokenResult = await env.DB.prepare(`
      DELETE FROM telegram_link_tokens
      WHERE expiresAt < datetime('now')
    `).run();
    tokensDeleted = tokenResult.meta?.changes ?? 0;
  } catch (err) {
    console.error('telegram: token cleanup failed', err);
  }

  try {
    const logResult = await env.DB.prepare(`
      DELETE FROM telegram_delivery_logs
      WHERE sentAt < datetime('now', '-30 days')
    `).run();
    logsDeleted = logResult.meta?.changes ?? 0;
  } catch (err) {
    console.error('telegram: log cleanup failed', err);
  }

  console.log(`telegram: cleanup — ${tokensDeleted} tokens, ${logsDeleted} logs deleted`);
  return { tokensDeleted, logsDeleted };
}
