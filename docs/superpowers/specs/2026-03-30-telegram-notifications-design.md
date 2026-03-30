# Telegram Notification System — Design Specification

**Date:** 2026-03-30
**Status:** Approved
**Approach:** Webhook-based, integrated into existing Cloudflare Worker

---

## 1. Overview

Add Telegram as a notification delivery channel for the OHCS E-Library platform. Users connect their Telegram account via a bot and receive notifications directly in Telegram, with per-category control.

**Audience:** Both admins/staff (Phase 1) and all users (Phase 2)
**Bot name:** `OHCSELibraryBot` (register via BotFather)
**Architecture:** Webhook-based — Telegram pushes updates to the existing Worker, Worker sends messages via Bot API

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                   OHCS E-Library Worker              │
│                                                      │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │ Existing  │   │  Telegram    │   │  Telegram    │ │
│  │ Notif.    │──▶│  Delivery    │──▶│  Bot API     │─┼──▶ User's Telegram
│  │ Service   │   │  Service     │   │  (external)  │ │
│  └──────────┘   └──────────────┘   └──────────────┘ │
│                                                      │
│  ┌──────────────┐   ┌──────────────┐                 │
│  │  Webhook     │◀──│  Telegram    │                 │
│  │  Handler     │   │  Servers     │◀────────────────┼── User sends /start
│  │  /api/v1/    │   │              │                 │
│  │  telegram/   │   └──────────────┘                 │
│  └──────┬───────┘                                    │
│         │                                            │
│         ▼                                            │
│  ┌──────────────┐   ┌──────────────┐                 │
│  │  D1 Database │   │  KV Cache    │                 │
│  │  (link tokens│   │  (rate limit, │                │
│  │   chat_ids)  │   │   bot state)  │                │
│  └──────────────┘   └──────────────┘                 │
└─────────────────────────────────────────────────────┘
```

**Key components:**

1. **Telegram Delivery Service** (`workers/src/services/telegramService.ts`) — formats and sends messages via Bot API, handles retries, respects rate limits
2. **Webhook Handler** (`workers/src/routes/telegram.ts`) — receives updates from Telegram (commands, callback queries), validates with bot secret
3. **Account Linking** — one-time token flow: frontend generates token → user clicks link → bot receives `/start <token>` → stores `chat_id` in D1
4. **Notification Hook** — integrates into existing notification creation flow — when a notification is created, checks if user has Telegram enabled for that category and dispatches

**New secrets (via `wrangler secret put`):**
- `TELEGRAM_BOT_TOKEN` — from BotFather
- `TELEGRAM_WEBHOOK_SECRET` — random string to validate incoming webhooks

---

## 3. Account Linking Flow

1. User navigates to **Notification Settings** on the platform
2. Clicks **"Connect Telegram"** button
3. Frontend calls `POST /api/v1/telegram/link` → backend generates a UUID token, stores in `telegram_link_tokens` with `userId` and 10-minute expiry
4. Backend returns deep link: `https://t.me/OHCSELibraryBot?start=<token>`
5. Frontend displays the link as a clickable button + QR code
6. User opens the link → Telegram opens the bot → bot receives `/start <token>`
7. Webhook handler validates the token against `telegram_link_tokens`, confirms not expired
8. Stores the user's `chatId` in `telegram_accounts`, marks as `active`
9. Deletes the used token
10. Bot sends welcome message: "Connected to OHCS E-Library as [displayName]. You'll receive notifications here."
11. Frontend polls `GET /api/v1/telegram/status` every 3 seconds (up to 10 minutes) to detect link completion

**Unlinking:**
- From platform: `DELETE /api/v1/telegram/link` → removes record, bot sends farewell message
- From Telegram: `/stop` → webhook handler deactivates the link, confirms in chat

**Security:**
- Tokens are single-use and expire in 10 minutes
- Webhook validated via `X-Telegram-Bot-Api-Secret-Token` header
- Only the authenticated user who generated the token can complete the link
- Rate limit on token generation: max 5 per hour per user

---

## 4. Message Formatting & Delivery

**Format:** Telegram MarkdownV2

**Example:**
```
📄 *Document Approved*
━━━━━━━━━━━━━━━━━━━

Your document has been approved and is now live\.

*Title:* 2024 Civil Service Training Manual
*Approved by:* Dr\. Kwame Mensah
*Category:* Training Materials

[View Document](https://ohcs-elibrary.gov.gh/documents/abc123)
```

**Icons per notification type:**

| Type | Icon | Includes |
|---|---|---|
| System/Security | 🔒 | Action required, severity level, platform link |
| Document approved | ✅ | Document title, approver name, direct link |
| Document rejected | ❌ | Document title, rejection reason, resubmit link |
| Announcement | 📢 | Full announcement text, issuer, link |
| Forum reply/mention | 💬 | Thread title, reply snippet (first 200 chars), thread link |
| Group invite | 👥 | Group name, inviter, accept link |
| Badge earned | 🏆 | Badge name, description, profile link |
| Level up | ⭐ | New level, XP progress, profile link |

**Delivery logic:**

1. Notification is created via existing `POST /api/v1/notifications` flow
2. After in-app storage, check `telegram_accounts` for an active link
3. Check `notification_preferences` — is Telegram enabled for this category?
4. Check quiet hours — if active, queue to KV with TTL and deliver after quiet hours end
5. Check `mutedUntil` — if muted, skip delivery
6. Call `telegramService.send()`:
   - Format message using template for that notification type
   - Call `sendMessage` with `parse_mode: MarkdownV2`
   - On `429 Too Many Requests` — respect `retry_after`, queue to KV
   - On `403 Forbidden` (user blocked bot) — mark account as `inactive` in D1
   - Log delivery status to `telegram_delivery_logs`

**Rate limiting:**
- Telegram allows 30 messages/second globally, 1 message/second per chat
- Bulk announcements use staggered queue via KV (batches of 25 with 1-second delays)

---

## 5. Bot Commands

| Command | Description | Auth Required |
|---|---|---|
| `/start <token>` | Link your OHCS account | No (token validates) |
| `/stop` | Unlink account and stop notifications | Yes (must be linked) |
| `/status` | Show linked account info and notification stats | Yes |
| `/mute <duration>` | Temporarily mute (e.g., `/mute 2h`, `/mute 30m`) | Yes |
| `/unmute` | Resume notifications early | Yes |
| `/settings` | Get link to notification settings page | Yes |
| `/help` | List available commands | No |

**Webhook handler flow (`POST /api/v1/telegram/webhook`):**

```
Incoming update
    │
    ├─ Validate X-Telegram-Bot-Api-Secret-Token header
    │  (reject if invalid → 401)
    │
    ├─ Parse update type
    │
    ├─ If message.text starts with "/"
    │  ├─ /start <token> → validate token, link account
    │  ├─ /stop → lookup chatId, deactivate link
    │  ├─ /status → lookup chatId, return account info
    │  ├─ /mute <dur> → set mute expiry in telegram_accounts
    │  ├─ /unmute → clear mute expiry
    │  ├─ /settings → return platform URL
    │  ├─ /help → return command list
    │  └─ unknown → "Unknown command. Try /help"
    │
    ├─ If callback_query (Phase 3 — inline buttons)
    │  └─ acknowledge and ignore for now
    │
    └─ Return 200 OK (always, within 50ms CPU budget)
```

Heavy work (DB writes, external calls) uses `ctx.executionCtx.waitUntil()` to avoid blocking the response.

---

## 6. Database Schema

### New tables

```sql
-- Links OHCS users to their Telegram accounts
CREATE TABLE telegram_accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE,
    chatId TEXT NOT NULL UNIQUE,
    telegramUsername TEXT,
    telegramFirstName TEXT,
    status TEXT NOT NULL DEFAULT 'active',  -- active, inactive, blocked
    mutedUntil TEXT,                         -- ISO timestamp, null = not muted
    linkedAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Temporary tokens for account linking (auto-cleanup via cron)
CREATE TABLE telegram_link_tokens (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiresAt TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Delivery tracking for debugging and analytics
CREATE TABLE telegram_delivery_logs (
    id TEXT PRIMARY KEY,
    notificationId TEXT,
    userId TEXT NOT NULL,
    chatId TEXT NOT NULL,
    status TEXT NOT NULL,        -- sent, failed, blocked, rate_limited, muted, quiet_hours
    errorMessage TEXT,
    telegramMessageId TEXT,      -- returned by Bot API on success
    sentAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Indexes

```sql
CREATE INDEX idx_telegram_accounts_userId ON telegram_accounts(userId);
CREATE INDEX idx_telegram_accounts_chatId ON telegram_accounts(chatId);
CREATE INDEX idx_telegram_link_tokens_token ON telegram_link_tokens(token);
CREATE INDEX idx_telegram_link_tokens_expiresAt ON telegram_link_tokens(expiresAt);
CREATE INDEX idx_telegram_delivery_logs_userId ON telegram_delivery_logs(userId);
CREATE INDEX idx_telegram_delivery_logs_sentAt ON telegram_delivery_logs(sentAt);
```

### Modifications to existing tables

```sql
-- Add telegram toggle to notification_preferences
ALTER TABLE notification_preferences
    ADD COLUMN telegramEnabled INTEGER NOT NULL DEFAULT 0;

-- categoryPreferences JSON gets a "telegram" key per category:
-- { "messages": { "email": true, "push": true, "inApp": true, "telegram": false }, ... }
```

### Cron additions
- Clean expired link tokens every 15 minutes (piggyback on existing `*/15 * * * *`)
- Clean delivery logs older than 30 days (piggyback on daily midnight cron)

---

## 7. Notification Categories & Telegram Defaults

| Category | Telegram Default | Rationale |
|---|---|---|
| System/Security | ON | Account alerts, login from new device, password changes |
| Document approval/rejection | ON | Time-sensitive for both uploaders and reviewers |
| Announcements | ON | Org-wide important updates |
| Forum replies/mentions | OFF | Can be noisy, user opts in |
| Group invites/posts | OFF | Lower urgency |
| Achievements (badges, level up, XP) | OFF | Fun but not critical |
| Messages | OFF | Already handled by in-app chat |
| Likes/follows | OFF | Social noise |

---

## 8. Frontend Integration

### New files
- `src/components/notifications/TelegramConnect.tsx` — connection card with QR code, link button, status display, disconnect
- `src/services/telegramService.ts` — API calls for link/unlink/status

### Modified files
- `src/stores/notificationStore.ts` — add `telegramStatus`, `linkTelegram()`, `unlinkTelegram()`, `fetchTelegramStatus()`
- `src/components/notifications/NotificationSettings.tsx` — integrate TelegramConnect component, add TG column to category preferences grid
- `src/types/` — extend `NotificationPreferences` with `telegramEnabled` and per-category `telegram` toggle

### UI states

**Not connected:**
```
┌─────────────────────────────────────────┐
│  Connect your Telegram account to       │
│  receive notifications directly in      │
│  Telegram.                              │
│                                         │
│  [🔗 Connect Telegram]                  │
│                                         │
│  ┌─────────┐  Scan QR code or click    │
│  │ QR CODE │  the button above to      │
│  │         │  open in Telegram.         │
│  └─────────┘                            │
└─────────────────────────────────────────┘
```

**Connected:**
```
┌─────────────────────────────────────────┐
│  Status: ● Connected as @kwame_mensah   │
│  [Disconnect]                           │
└─────────────────────────────────────────┘
```

**Category preferences grid** adds a TG column alongside App, Email, Push.

### QR code
- Use `qrcode` npm package (lightweight, client-side rendering)
- Renders `t.me/OHCSELibraryBot?start=<token>` as QR

### Link completion detection
- Frontend polls `GET /api/v1/telegram/status` every 3 seconds for up to 10 minutes

---

## 9. API Endpoints Summary

### New routes (`/api/v1/telegram/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/telegram/webhook` | Telegram secret | Receive bot updates |
| `POST` | `/telegram/link` | JWT | Generate link token, return deep link |
| `DELETE` | `/telegram/link` | JWT | Unlink Telegram account |
| `GET` | `/telegram/status` | JWT | Get link status and Telegram info |
| `POST` | `/telegram/setup-webhook` | Admin JWT | Register webhook URL with Telegram (one-time setup) |

### Modified routes
- `GET /notifications/preferences` — response includes `telegramEnabled` and per-category telegram toggles
- `PUT /notifications/preferences` — accepts `telegramEnabled` and per-category telegram toggles

---

## 10. Phased Rollout

### Phase 1 — Admin/Staff Alerts (Core)
- Telegram bot creation and webhook setup
- Account linking flow (token-based)
- Bot commands (`/start`, `/stop`, `/status`, `/mute`, `/unmute`, `/settings`, `/help`)
- Delivery service with formatting, rate limiting, retry logic
- Database migrations (3 new tables + 1 ALTER)
- Notification hook integration for admin-relevant categories:
  - Document uploaded (pending approval)
  - Flagged content
  - System errors / health alerts
  - Payment confirmations (Paystack)
  - New user registrations
- Admin-only Telegram section in settings
- Delivery logging

### Phase 2 — All Users
- Open Telegram connection to all user roles
- Full category preferences grid (TG column)
- QR code linking UI
- All notification types delivered (documents, forum, groups, achievements, announcements, social)
- Quiet hours enforcement for Telegram
- Bulk announcement staggered delivery
- Delivery analytics in admin dashboard

### Phase 3 — Interactive Features (Future)

| Feature | Description | Complexity |
|---|---|---|
| **Inline keyboard buttons** | Approve/Reject/View buttons on document approval notifications | Medium |
| **Quick reply to forum** | "Reply" button opens inline reply, posts to forum thread | Medium |
| **`/approve <id>`** | Approve documents via command with confirmation prompt | Medium |
| **`/reject <id> <reason>`** | Reject with reason, notifies uploader | Medium |
| **`/pending`** | List documents awaiting approval with action buttons | Low |
| **`/recent`** | List 5 latest documents with download links | Low |
| **`/search <query>`** | Search library, return results with buttons | High |
| **`/stats`** | Admin dashboard summary (users, uploads, pending) | Low |
| **Callback query handler** | Process inline button presses with auth verification | High |
| **Conversation state** | Multi-step flows (e.g., reject → ask reason → confirm) | High |

**Phase 3 prerequisites:**
- Auth verification per action (validate linked `chatId` → `userId` has permission)
- Callback query state management via KV (pending action context, 5-minute expiry)
- Confirmation prompts before destructive actions
- Audit logging for all Telegram-initiated actions (who, what, when)

---

## 11. Error Handling

| Scenario | Handling |
|---|---|
| Telegram API down | Log failure, notification stays in-app/email — Telegram is best-effort |
| User blocks bot | `403 Forbidden` → mark `telegram_accounts.status = 'inactive'` |
| Rate limited (429) | Respect `retry_after`, queue to KV, retry via cron |
| Invalid/expired token | Return "Link expired. Please generate a new link from your settings." |
| Webhook secret mismatch | Return 401, log attempt |
| DB write fails | Log error, return 200 to Telegram (avoid retries), alert admin |
| MarkdownV2 escape failure | Fallback to plain text `sendMessage` without parse_mode |

---

## 12. Security Considerations

- **Webhook validation:** Every incoming request verified via `X-Telegram-Bot-Api-Secret-Token`
- **Token expiry:** Link tokens expire in 10 minutes, single-use, cleaned by cron
- **No sensitive data in messages:** Notifications include titles and links, never passwords, tokens, or PII beyond display names
- **Rate limiting:** Token generation capped at 5/hour/user, message sending respects Telegram limits
- **Bot token protection:** Stored as Cloudflare secret, never exposed to frontend
- **HTTPS only:** All Telegram Bot API calls over HTTPS, webhook URL must be HTTPS
