/**
 * Telegram Webhook Handler & Account Linking Routes
 *
 * Routes:
 *   POST /webhook        — public, Telegram-signed webhook receiver
 *   POST /link           — authenticated, generate deep-link token
 *   DELETE /link         — authenticated, unlink Telegram account
 *   GET  /status         — authenticated, check link status
 *   POST /setup-webhook  — admin only, register webhook with Telegram
 */

import { Hono } from 'hono';
import { Env } from '../types';
import {
  sendTelegramMessage,
  setupWebhook,
  setBotCommands,
  escapeMarkdownV2,
} from '../services/telegramService';

const app = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// ID generator (local — avoids importing the private generateId from service)
// ---------------------------------------------------------------------------

function generateTgId(): string {
  return `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ---------------------------------------------------------------------------
// POST /webhook — public, validated by Telegram secret header
// ---------------------------------------------------------------------------

app.post('/webhook', async (c) => {
  const env = c.env as any;
  const secret = c.req.header('X-Telegram-Bot-Api-Secret-Token');

  if (!secret || secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  let update: any;
  try {
    update = await c.req.json();
  } catch {
    return c.json({ ok: true }); // malformed body — ack anyway so Telegram stops retrying
  }

  // Offload all heavy processing so we return 200 immediately
  c.executionCtx.waitUntil(handleUpdate(c.env as any, update));

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /link — authenticated, generate a 10-minute deep-link token
// ---------------------------------------------------------------------------

app.post('/link', async (c) => {
  const user = c.get('user');
  if (!user?.id) return c.json({ error: 'Unauthorized' }, 401);

  const userId = user.id;
  const env = c.env;

  try {
    // Rate limit: max 5 tokens per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM telegram_link_tokens
      WHERE userId = ? AND createdAt > ?
    `).bind(userId, oneHourAgo).first() as { count: number } | null;

    if ((countResult?.count ?? 0) >= 5) {
      return c.json({ error: 'Rate limit exceeded. Try again later.' }, 429);
    }

    // Check if already linked (schema uses 'active' as default status)
    const existing = await env.DB.prepare(`
      SELECT id FROM telegram_accounts
      WHERE userId = ? AND status = 'active'
      LIMIT 1
    `).bind(userId).first();

    if (existing) {
      return c.json({ error: 'Account already linked to Telegram' }, 409);
    }

    // Generate token and store it
    const token = crypto.randomUUID();
    const tokenId = generateTgId();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    await env.DB.prepare(`
      INSERT INTO telegram_link_tokens (id, userId, token, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(tokenId, userId, token, expiresAt).run();

    const deepLink = `https://t.me/OHCSELibraryBot?start=${token}`;

    return c.json({ deepLink, token, expiresAt });
  } catch (error) {
    console.error('telegram /link error:', error);
    return c.json({ error: 'Failed to generate link token' }, 500);
  }
});

// ---------------------------------------------------------------------------
// DELETE /link — authenticated, unlink Telegram account
// ---------------------------------------------------------------------------

app.delete('/link', async (c) => {
  const user = c.get('user');
  if (!user?.id) return c.json({ error: 'Unauthorized' }, 401);

  const userId = user.id;
  const env = c.env as any;

  try {
    const account = await env.DB.prepare(`
      SELECT id, chatId FROM telegram_accounts
      WHERE userId = ?
      LIMIT 1
    `).bind(userId).first() as { id: string; chatId: string } | null;

    if (!account) {
      return c.json({ error: 'No linked Telegram account found' }, 404);
    }

    // Delete the account record
    await env.DB.prepare(`
      DELETE FROM telegram_accounts WHERE id = ?
    `).bind(account.id).run();

    // Disable Telegram in notification preferences
    await env.DB.prepare(`
      UPDATE notification_preferences
      SET telegramEnabled = 0
      WHERE userId = ?
    `).bind(userId).run();

    // Fire-and-forget farewell message
    const botToken: string = env.TELEGRAM_BOT_TOKEN ?? '';
    if (botToken && account.chatId) {
      const farewell =
        'Your OHCS E\\-Library account has been unlinked\\. ' +
        'You will no longer receive notifications here\\. ' +
        'Use /start with a new link token to reconnect\\.';
      sendTelegramMessage(botToken, account.chatId, farewell, 'MarkdownV2').catch(() => {
        // Non-fatal
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('telegram DELETE /link error:', error);
    return c.json({ error: 'Failed to unlink Telegram account' }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /status — authenticated, check link status
// ---------------------------------------------------------------------------

app.get('/status', async (c) => {
  const user = c.get('user');
  if (!user?.id) return c.json({ error: 'Unauthorized' }, 401);

  const userId = user.id;

  try {
    const account = await c.env.DB.prepare(`
      SELECT status, telegramUsername, telegramFirstName, mutedUntil, linkedAt
      FROM telegram_accounts
      WHERE userId = ?
      LIMIT 1
    `).bind(userId).first() as {
      status: string;
      telegramUsername: string | null;
      telegramFirstName: string | null;
      mutedUntil: string | null;
      linkedAt: string;
    } | null;

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
  } catch (error) {
    console.error('telegram GET /status error:', error);
    return c.json({ error: 'Failed to fetch Telegram status' }, 500);
  }
});

// ---------------------------------------------------------------------------
// POST /setup-webhook — admin only
// ---------------------------------------------------------------------------

app.post('/setup-webhook', async (c) => {
  const user = c.get('user');
  if (!user?.id) return c.json({ error: 'Unauthorized' }, 401);

  if (!['super_admin', 'admin'].includes(user.role)) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const env = c.env as any;
  const botToken: string = env.TELEGRAM_BOT_TOKEN ?? '';
  const webhookSecret: string = env.TELEGRAM_WEBHOOK_SECRET ?? '';

  if (!botToken) {
    return c.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, 500);
  }

  try {
    const body = await c.req.json().catch(() => ({})) as { webhookUrl?: string };
    const webhookUrl =
      body.webhookUrl ?? `https://api.ohcs-elibrary.workers.dev/api/v1/telegram/webhook`;

    const [webhookResult, commandsResult] = await Promise.all([
      setupWebhook(botToken, webhookUrl, webhookSecret),
      setBotCommands(botToken),
    ]);

    return c.json({ webhook: webhookResult, commands: commandsResult });
  } catch (error) {
    console.error('telegram POST /setup-webhook error:', error);
    return c.json({ error: 'Failed to setup webhook' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Internal: webhook update dispatcher
// ---------------------------------------------------------------------------

async function handleUpdate(env: any, update: any): Promise<void> {
  try {
    if (update.message) {
      await handleMessage(env, update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(env, update.callback_query);
    }
  } catch (err) {
    console.error('telegram: unhandled update error', err);
  }
}

// ---------------------------------------------------------------------------
// Internal: handle incoming message
// ---------------------------------------------------------------------------

async function handleMessage(env: any, message: any): Promise<void> {
  const chatId = String(message.chat?.id ?? '');
  const text: string = message.text ?? '';
  const botToken: string = env.TELEGRAM_BOT_TOKEN ?? '';

  if (!chatId || !botToken) return;

  const [command, ...argParts] = text.split(' ');
  const arg = argParts.join(' ').trim();

  switch (command) {
    case '/start':
      await handleStart(env, botToken, chatId, message, arg);
      break;
    case '/stop':
      await handleStop(env, botToken, chatId);
      break;
    case '/status':
      await handleStatusCommand(env, botToken, chatId);
      break;
    case '/mute':
      await handleMute(env, botToken, chatId, arg);
      break;
    case '/unmute':
      await handleUnmute(env, botToken, chatId);
      break;
    case '/settings':
      await handleSettings(botToken, chatId);
      break;
    case '/help':
      await handleHelp(botToken, chatId);
      break;
    default:
      if (text.startsWith('/')) {
        await sendTelegramMessage(
          botToken,
          chatId,
          'Unknown command\\. Try /help',
          'MarkdownV2',
        );
      }
  }
}

// ---------------------------------------------------------------------------
// /start <token>
// ---------------------------------------------------------------------------

async function handleStart(
  env: any,
  botToken: string,
  chatId: string,
  message: any,
  token: string,
): Promise<void> {
  if (!token) {
    const welcome =
      '👋 *Welcome to OHCS E\\-Library Bot\\!*\n\n' +
      'To receive notifications here, link your account on the platform:\n' +
      '1\\. Sign in at [ohcselibrary\\.xyz](https://www.ohcselibrary.xyz)\n' +
      '2\\. Go to *Settings → Notifications → Telegram*\n' +
      '3\\. Click *Connect Telegram* to get a link token';
    await sendTelegramMessage(botToken, chatId, welcome, 'MarkdownV2');
    return;
  }

  // Validate token
  const now = new Date().toISOString();
  const linkToken = await env.DB.prepare(`
    SELECT id, userId, expiresAt
    FROM telegram_link_tokens
    WHERE token = ? AND expiresAt > ?
    LIMIT 1
  `).bind(token, now).first() as { id: string; userId: string; expiresAt: string } | null;

  if (!linkToken) {
    await sendTelegramMessage(
      botToken,
      chatId,
      '❌ This link token is invalid or has expired\\. Please generate a new one from the platform\\.',
      'MarkdownV2',
    );
    return;
  }

  // Check chatId not already linked to another account
  const existingChat = await env.DB.prepare(`
    SELECT id, userId FROM telegram_accounts
    WHERE chatId = ? AND status = 'active'
    LIMIT 1
  `).bind(chatId).first() as { id: string; userId: string } | null;

  if (existingChat && existingChat.userId !== linkToken.userId) {
    await sendTelegramMessage(
      botToken,
      chatId,
      '⚠️ This Telegram account is already linked to a different OHCS account\\. Use /stop first to unlink it\\.',
      'MarkdownV2',
    );
    return;
  }

  if (existingChat && existingChat.userId === linkToken.userId) {
    await sendTelegramMessage(
      botToken,
      chatId,
      '✅ Your account is already linked\\! Use /status to see your notification settings\\.',
      'MarkdownV2',
    );
    // Clean up the used token anyway
    await env.DB.prepare(`DELETE FROM telegram_link_tokens WHERE id = ?`).bind(linkToken.id).run();
    return;
  }

  // Create telegram_accounts record
  const telegramUsername: string | null = message.from?.username ?? null;
  const telegramFirstName: string | null = message.from?.first_name ?? null;
  const accountId = generateTgId();

  await env.DB.prepare(`
    INSERT INTO telegram_accounts
      (id, userId, chatId, telegramUsername, telegramFirstName, status, linkedAt)
    VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))
  `).bind(accountId, linkToken.userId, chatId, telegramUsername, telegramFirstName).run();

  // Enable Telegram in notification_preferences (upsert)
  await env.DB.prepare(`
    INSERT INTO notification_preferences (id, userId, telegramEnabled)
    VALUES (?, ?, 1)
    ON CONFLICT (userId) DO UPDATE SET telegramEnabled = 1
  `).bind(generateTgId(), linkToken.userId).run();

  // Delete used token
  await env.DB.prepare(`DELETE FROM telegram_link_tokens WHERE id = ?`).bind(linkToken.id).run();

  // Fetch user display name
  const userRow = await env.DB.prepare(`
    SELECT displayName, firstName FROM users WHERE id = ? LIMIT 1
  `).bind(linkToken.userId).first() as { displayName: string | null; firstName: string | null } | null;

  const rawName = userRow?.displayName ?? userRow?.firstName ?? 'there';
  const safeName = escapeMarkdownV2(rawName);

  const welcomeMsg =
    `✅ *Account Linked Successfully\\!*\n\n` +
    `Hello, ${safeName}\\! Your OHCS E\\-Library account is now connected\\.\n\n` +
    `You will receive notifications here for:\n` +
    `• New documents & approvals\n` +
    `• Forum replies & mentions\n` +
    `• Group activity\n` +
    `• Achievements & badges\n\n` +
    `Use /help to see available commands\\.`;

  await sendTelegramMessage(botToken, chatId, welcomeMsg, 'MarkdownV2');
}

// ---------------------------------------------------------------------------
// /stop
// ---------------------------------------------------------------------------

async function handleStop(env: any, botToken: string, chatId: string): Promise<void> {
  const account = await env.DB.prepare(`
    SELECT id, userId FROM telegram_accounts
    WHERE chatId = ? AND status = 'active'
    LIMIT 1
  `).bind(chatId).first() as { id: string; userId: string } | null;

  if (!account) {
    await sendTelegramMessage(
      botToken,
      chatId,
      'ℹ️ No linked account found\\. Use /start with a token to connect\\.',
      'MarkdownV2',
    );
    return;
  }

  await env.DB.prepare(`DELETE FROM telegram_accounts WHERE id = ?`).bind(account.id).run();

  await env.DB.prepare(`
    UPDATE notification_preferences SET telegramEnabled = 0 WHERE userId = ?
  `).bind(account.userId).run();

  await sendTelegramMessage(
    botToken,
    chatId,
    '👋 Your OHCS E\\-Library account has been unlinked\\. You will no longer receive notifications here\\. Use /start to reconnect anytime\\.',
    'MarkdownV2',
  );
}

// ---------------------------------------------------------------------------
// /status
// ---------------------------------------------------------------------------

async function handleStatusCommand(env: any, botToken: string, chatId: string): Promise<void> {
  const row = await env.DB.prepare(`
    SELECT ta.userId, ta.status, ta.mutedUntil, ta.linkedAt,
           u.displayName, u.email
    FROM telegram_accounts ta
    JOIN users u ON u.id = ta.userId
    WHERE ta.chatId = ?
    LIMIT 1
  `).bind(chatId).first() as {
    userId: string;
    status: string;
    mutedUntil: string | null;
    linkedAt: string;
    displayName: string | null;
    email: string;
  } | null;

  if (!row) {
    await sendTelegramMessage(
      botToken,
      chatId,
      'ℹ️ No linked account found\\. Use /start with a token from the platform to connect\\.',
      'MarkdownV2',
    );
    return;
  }

  // 7-day delivery stats
  const stats = await env.DB.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped
    FROM telegram_delivery_logs
    WHERE userId = ? AND sentAt >= datetime('now', '-7 days')
  `).bind(row.userId).first() as {
    total: number;
    delivered: number;
    failed: number;
    skipped: number;
  } | null;

  const safeName = escapeMarkdownV2(row.displayName ?? 'N/A');
  // Mask email for privacy (e.g., k***e@example.com)
  const email = row.email ?? 'N/A';
  const maskedEmail = email.includes('@')
    ? email[0] + '***' + email.slice(email.indexOf('@') - 1)
    : email;
  const safeEmail = escapeMarkdownV2(maskedEmail);
  const safeLinkedAt = escapeMarkdownV2(row.linkedAt ?? 'N/A');
  const statusEmoji = row.status === 'active' ? '🟢' : '🔴';

  let msg =
    `*Your Notification Status*\n\n` +
    `👤 *Name:* ${safeName}\n` +
    `📧 *Email:* ${safeEmail}\n` +
    `${statusEmoji} *Status:* ${escapeMarkdownV2(row.status)}\n` +
    `📅 *Linked:* ${safeLinkedAt}\n`;

  if (row.mutedUntil) {
    const mutedDate = new Date(row.mutedUntil);
    const now = new Date();
    if (mutedDate > now) {
      msg += `🔇 *Muted until:* ${escapeMarkdownV2(row.mutedUntil)}\n`;
    }
  }

  if (stats) {
    msg +=
      `\n📊 *Last 7 days:*\n` +
      `  ✅ Delivered: ${stats.delivered ?? 0}\n` +
      `  ⏭ Skipped: ${stats.skipped ?? 0}\n` +
      `  ❌ Failed: ${stats.failed ?? 0}\n`;
  }

  await sendTelegramMessage(botToken, chatId, msg, 'MarkdownV2');
}

// ---------------------------------------------------------------------------
// /mute <duration>
// ---------------------------------------------------------------------------

async function handleMute(
  env: any,
  botToken: string,
  chatId: string,
  arg: string,
): Promise<void> {
  const account = await env.DB.prepare(`
    SELECT id FROM telegram_accounts
    WHERE chatId = ? AND status = 'active'
    LIMIT 1
  `).bind(chatId).first() as { id: string } | null;

  if (!account) {
    await sendTelegramMessage(
      botToken,
      chatId,
      'ℹ️ No linked account found\\. Use /start with a token to connect\\.',
      'MarkdownV2',
    );
    return;
  }

  // Parse duration: 2h, 30m, 1d
  const match = arg.match(/^(\d+)(m|h|d)$/i);
  if (!match) {
    await sendTelegramMessage(
      botToken,
      chatId,
      '⚠️ Usage: /mute \\<duration\\> — e\\.g\\. `/mute 2h`, `/mute 30m`, `/mute 1d`',
      'MarkdownV2',
    );
    return;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  let durationMs: number;
  if (unit === 'm') durationMs = value * 60 * 1000;
  else if (unit === 'h') durationMs = value * 60 * 60 * 1000;
  else durationMs = value * 24 * 60 * 60 * 1000;

  // Cap at 7 days
  const maxMs = 7 * 24 * 60 * 60 * 1000;
  const clampedMs = Math.min(durationMs, maxMs);

  const mutedUntil = new Date(Date.now() + clampedMs).toISOString();

  await env.DB.prepare(`
    UPDATE telegram_accounts SET mutedUntil = ? WHERE id = ?
  `).bind(mutedUntil, account.id).run();

  const capped = clampedMs < durationMs ? ' \\(capped at 7 days\\)' : '';
  const safeUntil = escapeMarkdownV2(mutedUntil);

  await sendTelegramMessage(
    botToken,
    chatId,
    `🔇 Notifications muted until *${safeUntil}*${capped}\\. Use /unmute to resume early\\.`,
    'MarkdownV2',
  );
}

// ---------------------------------------------------------------------------
// /unmute
// ---------------------------------------------------------------------------

async function handleUnmute(env: any, botToken: string, chatId: string): Promise<void> {
  const account = await env.DB.prepare(`
    SELECT id FROM telegram_accounts
    WHERE chatId = ? AND status = 'active'
    LIMIT 1
  `).bind(chatId).first() as { id: string } | null;

  if (!account) {
    await sendTelegramMessage(
      botToken,
      chatId,
      'ℹ️ No linked account found\\. Use /start with a token to connect\\.',
      'MarkdownV2',
    );
    return;
  }

  await env.DB.prepare(`
    UPDATE telegram_accounts SET mutedUntil = NULL WHERE id = ?
  `).bind(account.id).run();

  await sendTelegramMessage(
    botToken,
    chatId,
    '🔔 Notifications resumed\\! You will now receive updates from OHCS E\\-Library\\.',
    'MarkdownV2',
  );
}

// ---------------------------------------------------------------------------
// /settings
// ---------------------------------------------------------------------------

async function handleSettings(botToken: string, chatId: string): Promise<void> {
  await sendTelegramMessage(
    botToken,
    chatId,
    '⚙️ Manage your notification settings on the platform:\n' +
    '[Open Notification Settings](https://www.ohcselibrary.xyz/settings/notifications)',
    'MarkdownV2',
  );
}

// ---------------------------------------------------------------------------
// /help
// ---------------------------------------------------------------------------

async function handleHelp(botToken: string, chatId: string): Promise<void> {
  const help =
    '*OHCS E\\-Library Bot — Commands*\n\n' +
    '/start \\<token\\> — Link your OHCS account\n' +
    '/stop — Unlink and stop all notifications\n' +
    '/status — Show your notification status and stats\n' +
    '/mute \\<30m\\|2h\\|1d\\> — Mute notifications temporarily\n' +
    '/unmute — Resume notifications\n' +
    '/settings — Open notification settings on the platform\n' +
    '/help — Show this help message';

  await sendTelegramMessage(botToken, chatId, help, 'MarkdownV2');
}

// ---------------------------------------------------------------------------
// Internal: handle callback_query (Phase 3 stub)
// ---------------------------------------------------------------------------

async function handleCallbackQuery(env: any, callbackQuery: any): Promise<void> {
  const botToken: string = env.TELEGRAM_BOT_TOKEN ?? '';
  const chatId = String(callbackQuery.message?.chat?.id ?? '');

  if (!botToken || !chatId) return;

  // Acknowledge with stub response
  await sendTelegramMessage(
    botToken,
    chatId,
    'Interactive features coming soon\\!',
    'MarkdownV2',
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default app;
export { app as telegramRoutes };
