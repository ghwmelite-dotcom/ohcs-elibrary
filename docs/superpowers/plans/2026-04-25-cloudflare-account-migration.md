# Cloudflare Account Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the OHCS E-Library platform from Cloudflare account `ghwmelite@gmail.com` to `ohcsghana.main@gmail.com` (`f4f236a6cd8fbddf397c6e9de17d8113`), bind it to custom domain `ohcselibrary.xyz`, set up GitHub auto-deploy, and decommission the old account after a verification window.

**Architecture:** Build new home → migrate data → flip address → verify → delete old. Custom domain becomes canonical, freeing the platform from `*.workers.dev` and `*.pages.dev` subdomains. Resend handles all email; Gmail OAuth is dropped from the migration scope. The cutover window is ~12 minutes with the old Worker in maintenance mode during data freeze.

**Tech Stack:** Cloudflare Workers, Cloudflare Pages, D1 (SQLite), R2 (object storage), KV, Workers AI. Tooling: `wrangler` v3+, `rclone` (for R2 S3-compat sync), `git`, `openssl` (secret generation), GitHub Actions (`cloudflare/wrangler-action@v3`).

**Reference spec:** `docs/superpowers/specs/2026-04-25-cloudflare-account-migration-design.md`

**Step legend:**
- **[USER]** — User must perform this action (dashboard click, OAuth flow, paste a value)
- **[CMD]** — Command run via Bash (assistant or user, via terminal)
- **[FILE]** — File edit committed to repo

---

## Pre-flight requirements

Before starting Phase 0, confirm:

- [ ] User has admin access to old Cloudflare account `ghwmelite@gmail.com`
- [ ] User has admin access to new Cloudflare account `ohcsghana.main@gmail.com` (account ID `f4f236a6cd8fbddf397c6e9de17d8113`)
- [ ] User has access to the registrar where `ohcselibrary.xyz` is registered (to update nameservers at cutover)
- [ ] Repo working tree is clean (`git status` shows no unstaged changes besides the spec already committed)
- [ ] Node 20+ available locally
- [ ] `wrangler` CLI available (`npx wrangler --version` works)
- [ ] `rclone` will be installed in Task 0.4 if not present
- [ ] `openssl` available for secret generation

---

## PHASE 0 — Local environment & token setup

### Task 0.1: Generate Cloudflare API tokens (both accounts)

**Files:** None — this is dashboard work.

- [ ] **Step 1: User generates new account API token**

[USER] Open new account dashboard (`ohcsghana.main@gmail.com`) → My Profile → API Tokens → Create Token → "Custom token" → Permissions:

- Account → Account Settings → Read
- Account → Workers Scripts → Edit
- Account → Workers KV Storage → Edit
- Account → Workers R2 Storage → Edit
- Account → D1 → Edit
- Account → Cloudflare Pages → Edit
- Account → Workers AI → Edit
- Zone → Zone Settings → Edit
- Zone → DNS → Edit
- Zone → Page Rules → Edit
- Zone → Workers Routes → Edit

Account Resources: Include → Specific account → `ohcsghana.main@gmail.com's Account` (`f4f236a6cd8fbddf397c6e9de17d8113`)
Zone Resources: Include → All zones from an account → same account

Save token name as `migration-new-account`. Copy the token value immediately.

- [ ] **Step 2: User generates old account API token**

[USER] Open old account dashboard (`ghwmelite@gmail.com`) → My Profile → API Tokens → Create Token → "Custom token" → Permissions:

- Account → Workers Scripts → Edit (need Edit to deploy maintenance Worker and later delete)
- Account → Workers KV Storage → Read
- Account → Workers R2 Storage → Read
- Account → D1 → Read
- Account → Cloudflare Pages → Edit (for later deletion)
- Zone → DNS → Read

Account Resources: Include → Specific account → old account.
Zone Resources: Include → Specific zone → `ohcselibrary.xyz`

Save token name as `migration-old-account`. Copy the token value immediately.

- [ ] **Step 3: User pastes both tokens to assistant**

[USER] Paste both token values in the chat. Assistant stores them in working memory only (not persisted to disk).

- [ ] **Step 4: Verify tokens with curl**

[CMD] Test new account token:

```bash
curl -s -H "Authorization: Bearer <NEW_TOKEN>" https://api.cloudflare.com/client/v4/accounts/f4f236a6cd8fbddf397c6e9de17d8113 | grep -o '"success":[^,]*'
```

Expected: `"success":true`

[CMD] Test old account token (account ID will need to be looked up):

```bash
curl -s -H "Authorization: Bearer <OLD_TOKEN>" https://api.cloudflare.com/client/v4/accounts | grep -oE '"id":"[a-f0-9]+","name":"[^"]+"' | head -3
```

Expected: list of accounts the token has access to. Note the old account's ID for later use.

---

### Task 0.2: Generate R2 API credentials (both accounts)

R2 uses S3-compatible API access keys, separate from Cloudflare API tokens. Required for `rclone`.

- [ ] **Step 1: User generates old account R2 token**

[USER] Old CF dashboard → R2 → "Manage R2 API tokens" → Create API token →

- Token name: `migration-rclone-old`
- Permissions: Object Read only
- Specify bucket: `ohcs-documents`
- TTL: 7 days (we'll be done before then)

Save: Access Key ID, Secret Access Key, S3 endpoint (e.g., `https://<account-hash>.r2.cloudflarestorage.com`).

- [ ] **Step 2: User generates new account R2 token**

[USER] New CF dashboard → R2 → "Manage R2 API tokens" → Create API token →

- Token name: `migration-rclone-new`
- Permissions: Object Read & Write
- Apply to all buckets in this account
- TTL: 7 days

Save same three values.

- [ ] **Step 3: User pastes R2 credentials to assistant**

[USER] Paste both sets of credentials (Access Key, Secret, Endpoint) in chat. Stored in working memory only.

---

### Task 0.3: Install and configure rclone

**Files:** None — local tool config.

- [ ] **Step 1: Check if rclone is installed**

[CMD]

```bash
rclone --version 2>/dev/null || echo "NOT_INSTALLED"
```

If `NOT_INSTALLED`: install via `winget install Rclone.Rclone` (Windows) or `brew install rclone` / `apt install rclone` (macOS/Linux).

- [ ] **Step 2: Configure r2-old remote**

[CMD] Generate the rclone config block in memory and append:

```bash
rclone config create r2-old s3 \
  provider=Cloudflare \
  access_key_id=<OLD_R2_ACCESS_KEY> \
  secret_access_key=<OLD_R2_SECRET> \
  endpoint=<OLD_R2_ENDPOINT> \
  region=auto \
  acl=private
```

- [ ] **Step 3: Configure r2-new remote**

[CMD]

```bash
rclone config create r2-new s3 \
  provider=Cloudflare \
  access_key_id=<NEW_R2_ACCESS_KEY> \
  secret_access_key=<NEW_R2_SECRET> \
  endpoint=<NEW_R2_ENDPOINT> \
  region=auto \
  acl=private
```

- [ ] **Step 4: Verify both remotes work**

[CMD]

```bash
rclone lsd r2-old:
```

Expected: lists `ohcs-documents` bucket.

```bash
rclone lsd r2-new:
```

Expected: empty list (no buckets yet — we create one in Phase 2).

---

### Task 0.4: Set up wrangler authentication

`wrangler` reads `CLOUDFLARE_API_TOKEN` from env. We need to swap between accounts during the migration.

- [ ] **Step 1: Create local helper aliases (one-shot, not committed)**

[CMD] Set up two shell functions for the duration of this migration. Do NOT commit these — they contain tokens.

```bash
# In current shell only:
export NEW_CF_TOKEN="<NEW_TOKEN>"
export OLD_CF_TOKEN="<OLD_TOKEN>"
export NEW_CF_ACCOUNT_ID="f4f236a6cd8fbddf397c6e9de17d8113"
export OLD_CF_ACCOUNT_ID="<from Task 0.1 step 4>"
```

To run wrangler against new account:

```bash
CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID npx wrangler <cmd>
```

Against old account:

```bash
CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID npx wrangler <cmd>
```

- [ ] **Step 2: Verify wrangler works against new account**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID npx wrangler whoami
```

Expected: shows the new account.

- [ ] **Step 3: Verify wrangler works against old account**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID npx wrangler whoami
```

Expected: shows the old account.

---

## PHASE 1 — Code changes (URL constants, env vars)

These changes are safe to merge to `master` immediately. They do not depend on new resource IDs.

### Task 1.1: Update telegramService.ts to use apex domain

**Files:** Modify `workers/src/services/telegramService.ts:179`

- [ ] **Step 1: Edit the file**

Replace:

```typescript
const PLATFORM_URL = 'https://www.ohcselibrary.xyz';
```

With:

```typescript
const PLATFORM_URL = 'https://ohcselibrary.xyz';
```

- [ ] **Step 2: Verify no other references to www in this file**

[CMD]

```bash
grep -n "www.ohcselibrary" workers/src/services/telegramService.ts
```

Expected: no output (no remaining matches).

---

### Task 1.2: Update telegram.ts deep links to apex

**Files:** Modify `workers/src/routes/telegram.ts:322` and `workers/src/routes/telegram.ts:646`

- [ ] **Step 1: Edit line 322**

Replace `[ohcselibrary\\.xyz](https://www.ohcselibrary.xyz)` with `[ohcselibrary\\.xyz](https://ohcselibrary.xyz)`.

- [ ] **Step 2: Edit line 646**

Replace `[Open Notification Settings](https://www.ohcselibrary.xyz/settings/notifications)` with `[Open Notification Settings](https://ohcselibrary.xyz/settings/notifications)`.

- [ ] **Step 3: Verify**

[CMD]

```bash
grep -n "www.ohcselibrary" workers/src/routes/telegram.ts
```

Expected: no output.

---

### Task 1.3: Update useResearchApi.ts fallback URL

**Files:** Modify `src/hooks/useResearchApi.ts:3`

- [ ] **Step 1: Edit the file**

Replace:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'https://ohcs-elibrary-api.ghwmelite.workers.dev';
```

With:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.ohcselibrary.xyz';
```

---

### Task 1.4: Update QuizBuilder.tsx fallback URL

**Files:** Modify `src/pages/instructor/QuizBuilder.tsx:701`

- [ ] **Step 1: Edit the file**

Replace:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://ohcs-elibrary-api.ghwmelite.workers.dev';
```

With:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://api.ohcselibrary.xyz';
```

---

### Task 1.5: Update .env.production canonical API URL

**Files:** Modify `.env.production`

- [ ] **Step 1: Edit the file**

Replace:

```
VITE_API_URL=https://ohcs-elibrary-api.ghwmelite.workers.dev
```

With:

```
VITE_API_URL=https://api.ohcselibrary.xyz
```

This is the **canonical** value. During Phase 4 we deploy with a temporary override (workers.dev URL) for pre-cutover testing, but committed default is the custom domain.

---

### Task 1.6: Update wrangler.toml redirect URI to apex

**Files:** Modify `workers/wrangler.toml:8`

- [ ] **Step 1: Edit the file**

Replace:

```toml
GOOGLE_DRIVE_REDIRECT_URI = "https://ohcs-elibrary.pages.dev/admin/integrations/google-drive/callback"
```

With:

```toml
GOOGLE_DRIVE_REDIRECT_URI = "https://ohcselibrary.xyz/admin/integrations/google-drive/callback"
```

---

### Task 1.7: Update CORS default origin to apex

**Files:** Modify `workers/src/index.ts:100` and `workers/src/index.ts:115`

The CORS middleware falls back to `https://ohcs-elibrary.pages.dev` for missing or non-matching origins. This was the canonical URL pre-migration; after cutover it should be the custom domain.

- [ ] **Step 1: Edit line 100**

Replace:

```typescript
    if (!origin) return 'https://ohcs-elibrary.pages.dev';
```

With:

```typescript
    if (!origin) return 'https://ohcselibrary.xyz';
```

- [ ] **Step 2: Edit line 115**

Replace:

```typescript
    return 'https://ohcs-elibrary.pages.dev';
```

With:

```typescript
    return 'https://ohcselibrary.xyz';
```

- [ ] **Step 3: Verify the allowlist still includes both old and new domains**

The allowlist (lines 102-109) should retain `https://ohcs-elibrary.pages.dev` so requests during the cutover window (when the old Pages URL is briefly still cached) are not blocked. Verify:

```bash
grep -A 8 "allowedOrigins = \[" workers/src/index.ts
```

Expected: includes both `ohcs-elibrary.pages.dev` and `ohcselibrary.xyz` and `www.ohcselibrary.xyz`. No edits needed if so.

---

### Task 1.8: Local verification — typecheck and build

**Files:** None

- [ ] **Step 1: TypeScript check at repo root**

[CMD]

```bash
npm run typecheck
```

Expected: exits 0, no errors.

- [ ] **Step 2: Build frontend**

[CMD]

```bash
npm run build
```

Expected: build succeeds, `dist/` populated.

- [ ] **Step 3: Verify built JS contains the new API URL**

[CMD]

```bash
grep -r "api.ohcselibrary.xyz" dist/ | head -3
```

Expected: matches in built JS bundles.

```bash
grep -r "ohcs-elibrary-api.ghwmelite" dist/ | head -3
```

Expected: no output (no leftover old URL).

- [ ] **Step 4: TypeScript check workers/**

[CMD]

```bash
cd workers && npx tsc --noEmit
```

Expected: exits 0.

---

### Task 1.9: Commit Phase 1 code changes

**Files:** All Phase 1 modifications

- [ ] **Step 1: Stage and commit**

[CMD]

```bash
git add workers/src/services/telegramService.ts workers/src/routes/telegram.ts \
  workers/src/index.ts src/hooks/useResearchApi.ts src/pages/instructor/QuizBuilder.tsx \
  .env.production workers/wrangler.toml
git commit -m "$(cat <<'EOF'
refactor(urls): point all canonical URLs at ohcselibrary.xyz

Migration prep: replaces .pages.dev/.workers.dev/www. references with
the apex custom domain across worker services, frontend fallbacks,
CORS default origin, and the Google Drive redirect URI in
wrangler.toml.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 2: Verify commit**

[CMD]

```bash
git log -1 --stat
```

Expected: 7 files changed.

**Note:** Do NOT push yet. Pushing triggers nothing right now (no auto-deploy set up), but we keep all changes local until Phase 4 to allow rollback by `git reset` if needed.

---

## PHASE 2 — Create resources in new account

All commands run with `CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID`.

### Task 2.1: Create D1 database in new account

**Files:** None (`wrangler.toml` updated in Task 3.1)

- [ ] **Step 1: Create D1**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 create ohcs-elibrary
```

Expected output includes:

```
[[d1_databases]]
binding = "DB"
database_name = "ohcs-elibrary"
database_id = "<new-uuid>"
```

- [ ] **Step 2: Capture the new database UUID**

Save the new `database_id` value. Will be used in Task 3.1.

---

### Task 2.2: Create KV namespace in new account

- [ ] **Step 1: Create KV**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler kv namespace create CACHE
```

Expected output:

```
[[kv_namespaces]]
binding = "CACHE"
id = "<new-id>"
```

- [ ] **Step 2: Capture the new KV namespace ID**

Save the new `id` value. Will be used in Task 3.1.

---

### Task 2.3: Create R2 bucket in new account

- [ ] **Step 1: Create R2 bucket**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler r2 bucket create ohcs-documents
```

Expected: `Created bucket 'ohcs-documents'.`

- [ ] **Step 2: Verify via rclone**

[CMD]

```bash
rclone lsd r2-new:
```

Expected: shows `ohcs-documents`.

---

### Task 2.4: Create Pages project in new account

- [ ] **Step 1: Create Pages project**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler pages project create ohcs-elibrary --production-branch=master
```

Expected: project created. Note the assigned `*.pages.dev` URL (e.g., `ohcs-elibrary.<new-id>.pages.dev`).

- [ ] **Step 2: Capture the new Pages preview URL**

Save the URL. Will be used in Phase 4 for pre-cutover testing.

---

### Task 2.5: Generate fresh JWT_SECRET and CRON_SECRET

**Files:** None — values held in working memory.

- [ ] **Step 1: Generate JWT_SECRET**

[CMD]

```bash
openssl rand -base64 48
```

Save output as `JWT_SECRET`.

- [ ] **Step 2: Generate CRON_SECRET**

[CMD]

```bash
openssl rand -base64 48
```

Save output as `CRON_SECRET`.

---

### Task 2.6: Set all secrets in new account Worker

The Worker doesn't exist yet (deploy is Task 4.1), but `wrangler secret put` creates the Worker as a side-effect if missing. Better: deploy a placeholder Worker first. Actually we'll do secrets immediately AFTER first deploy in Task 4.1 — but they need to be set before the Worker can serve traffic correctly.

Re-ordering: deploy a stub Worker first (Task 4.1 step 1), then set secrets (Task 4.1 step 2+). For clarity, this task is folded into Task 4.1 below. **Skip Task 2.6 — it merges into Task 4.1.**

---

### Task 2.7: Apply D1 schema migrations to new database

The repo's `workers/migrations/` directory contains the SQL migrations. We apply them to the empty new D1 to create the schema. Data import in Phase 5 then populates rows. (Note: at cutover, full export+import will overwrite; but schema-applied first lets us test the new Worker against an empty-but-valid DB in Phase 4.)

- [ ] **Step 1: List existing migration files**

[CMD]

```bash
ls workers/migrations/
```

Expected: list of `*.sql` files (001 through whatever the latest is).

- [ ] **Step 2: Apply migrations to new D1**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 migrations apply ohcs-elibrary --remote
```

Expected: prompt confirming migrations to apply, then "Migrations applied".

**WARNING:** After this, do NOT run `migrations apply` again on this DB. The cutover D1 import (Phase 6) brings the migration tracking table from old → new; running migrations again post-import would attempt to re-apply already-applied migrations.

- [ ] **Step 3: Verify schema exists**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 execute ohcs-elibrary --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" | head -30
```

Expected: list of tables (`users`, `documents`, `research_entries`, etc.).

---

## PHASE 3 — Update wrangler.toml with new IDs

### Task 3.1: Apply new D1 and KV IDs to wrangler.toml

**Files:** Modify `workers/wrangler.toml:18` and `workers/wrangler.toml:28`

- [ ] **Step 1: Edit line 18 — D1 database_id**

Replace:

```toml
database_id = "2aa38a9e-e5e1-4e7a-a48e-f8edf7cc741d"
```

With:

```toml
database_id = "<new-uuid-from-task-2.1>"
```

- [ ] **Step 2: Edit line 28 — KV id**

Replace:

```toml
id = "747355109d8a4b63a45a116b9c3208b1"
```

With:

```toml
id = "<new-id-from-task-2.2>"
```

- [ ] **Step 3: Verify the file**

[CMD]

```bash
grep -E "database_id|^id =" workers/wrangler.toml
```

Expected: shows new IDs only, no old ones.

- [ ] **Step 4: Commit**

[CMD]

```bash
git add workers/wrangler.toml
git commit -m "$(cat <<'EOF'
config(wrangler): point bindings at new Cloudflare account resources

Updates D1 database_id and KV namespace id to the values created in
the new account ohcsghana.main@gmail.com.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## PHASE 4 — First Worker + Pages deploy to new account

### Task 4.1: Deploy Worker to new account and set secrets

- [ ] **Step 1: Deploy initial Worker (still pre-cutover, runs against empty D1)**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler deploy
```

Expected output: deployed to `https://ohcs-elibrary-api.<new-account-subdomain>.workers.dev`. Note this URL.

- [ ] **Step 2: Set JWT_SECRET**

[CMD]

```bash
cd workers && echo "<JWT_SECRET_VALUE>" | CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler secret put JWT_SECRET
```

- [ ] **Step 3: Set CRON_SECRET**

[CMD]

```bash
cd workers && echo "<CRON_SECRET_VALUE>" | CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler secret put CRON_SECRET
```

- [ ] **Step 4: Set RESEND_API_KEY**

[CMD]

```bash
cd workers && echo "<RESEND_API_KEY>" | CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler secret put RESEND_API_KEY
```

- [ ] **Step 5: Set PAYSTACK_SECRET_KEY**

[CMD]

```bash
cd workers && echo "<PAYSTACK_SECRET_KEY>" | CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler secret put PAYSTACK_SECRET_KEY
```

- [ ] **Step 6: Set PAYSTACK_PUBLIC_KEY**

[CMD]

```bash
cd workers && echo "<PAYSTACK_PUBLIC_KEY>" | CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler secret put PAYSTACK_PUBLIC_KEY
```

- [ ] **Step 7: Set GOOGLE_DRIVE_CLIENT_ID**

[CMD]

```bash
cd workers && echo "<GOOGLE_DRIVE_CLIENT_ID>" | CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler secret put GOOGLE_DRIVE_CLIENT_ID
```

- [ ] **Step 8: Set GOOGLE_DRIVE_CLIENT_SECRET**

[CMD]

```bash
cd workers && echo "<GOOGLE_DRIVE_CLIENT_SECRET>" | CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler secret put GOOGLE_DRIVE_CLIENT_SECRET
```

- [ ] **Step 9: Set TELEGRAM_BOT_TOKEN**

The bot is `@ohcselibrarybot` per project memory. The bot token is held only in the old account's Worker secrets — unrecoverable like all CF secrets. Two options:

**Option A (preferred): Reuse existing token by retrieving from BotFather.** Telegram's BotFather can re-send the token to the bot owner.

[USER] Open Telegram, message `@BotFather` → `/mybots` → select OHCS E-Library Bot → "API Token" → BotFather displays the token. Copy it.

**Option B: Generate new token via BotFather.** This invalidates the old token, so the OLD account's Worker stops working immediately — only do this when ready to switch over (acceptable since old Worker is in maintenance during cutover, but webhook calls before cutover still need the old token).

[USER] In BotFather: `/mybots` → bot → "API Token" → "Revoke current token" → confirms new token. Use the new token.

[CMD] Set the secret:

```bash
cd workers && echo "<TELEGRAM_BOT_TOKEN>" | CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler secret put TELEGRAM_BOT_TOKEN
```

- [ ] **Step 10: Set TELEGRAM_WEBHOOK_SECRET**

This is a random string used to validate incoming Telegram webhook requests. Generate fresh — the old value is irrelevant since the new webhook URL needs to be registered with Telegram anyway in Task 6.10.

[CMD] Generate and set:

```bash
TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "$TELEGRAM_WEBHOOK_SECRET" | CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  cd workers && npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

Save the value for Task 6.10 (used in `setWebhook` call).

- [ ] **Step 11: Verify all secrets set**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler secret list
```

Expected: 9 secrets listed: `JWT_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`.

- [ ] **Step 12: Re-deploy Worker so secrets take effect**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler deploy
```

Expected: redeploy succeeds.

- [ ] **Step 13: Health check**

[CMD]

```bash
curl -s https://ohcs-elibrary-api.<new-subdomain>.workers.dev/api/v1/health
```

Expected: 200 response (the actual response body depends on the health route).

---

### Task 4.2: Build and deploy Pages with TEMPORARY workers.dev API URL

Pre-cutover, the Pages build needs to point at the new Worker's `.workers.dev` URL since `api.ohcselibrary.xyz` doesn't resolve yet (DNS not flipped).

- [ ] **Step 1: Temporarily override VITE_API_URL for build**

[CMD]

```bash
VITE_API_URL=https://ohcs-elibrary-api.<new-subdomain>.workers.dev npm run build
```

Expected: build succeeds.

- [ ] **Step 2: Verify built bundle has the workers.dev URL**

[CMD]

```bash
grep -r "ohcs-elibrary-api.<new-subdomain>.workers.dev" dist/ | head -1
```

Expected: at least one match.

- [ ] **Step 3: Deploy to new account Pages**

[CMD]

```bash
CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler pages deploy dist --project-name=ohcs-elibrary --branch=master
```

Expected: deploy succeeds, returns the `*.pages.dev` URL.

- [ ] **Step 4: Verify Pages deployment**

[USER] Open the new Pages URL (`ohcs-elibrary.<new-id>.pages.dev`) in a browser.

Expected: app loads (will appear empty since D1 has no data yet — that's expected).

---

### Task 4.3: Smoke test new account stack on .pages.dev

The new stack is fully wired but has no production data. We're testing wiring, not data integrity.

- [ ] **Step 1: Open the new Pages URL in incognito**

[USER] Open `https://ohcs-elibrary.<new-id>.pages.dev`.

- [ ] **Step 2: Verify auth endpoint reachable**

[CMD]

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://ohcs-elibrary-api.<new-subdomain>.workers.dev/api/v1/auth/me
```

Expected: `401` (unauthenticated, but endpoint is reachable).

- [ ] **Step 3: Register a test account**

[USER] Sign up with a throwaway email on the new Pages URL. Verify the account creates successfully.

- [ ] **Step 4: Inspect D1 for the test row**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 execute ohcs-elibrary --remote --command="SELECT id, email FROM users ORDER BY id DESC LIMIT 5"
```

Expected: shows the just-created test user.

- [ ] **Step 5: Delete test data BEFORE cutover**

The test data must NOT survive into production. We'll wipe it just before the final import. Note the test user IDs for cleanup — at Phase 6 Task 6.4, the full export+import overwrites everything anyway, so this cleanup is automatic.

---

## PHASE 5 — Pre-cutover data sync (D-1)

### Task 5.1: Export DNS records from old account

**Files:** None — produces a local BIND file.

- [ ] **Step 1: User exports DNS via dashboard**

[USER] Old CF dashboard → `ohcselibrary.xyz` → DNS → Records → "Export DNS records" (button on the right). Save the resulting BIND file as `migration/ohcselibrary-old-dns.bind` in the project root (do NOT commit — it may contain DKIM secrets).

- [ ] **Step 2: Verify the file**

[CMD]

```bash
test -s migration/ohcselibrary-old-dns.bind && head -20 migration/ohcselibrary-old-dns.bind
```

Expected: file exists, contains BIND-format DNS records (`ohcselibrary.xyz. ... IN ...`).

- [ ] **Step 3: Add migration/ to .gitignore**

[CMD]

```bash
echo "" >> .gitignore && echo "# Migration scratch (DNS BIND export, etc.)" >> .gitignore && echo "migration/" >> .gitignore
git add .gitignore && git commit -m "chore(gitignore): exclude migration/ scratch directory"
```

---

### Task 5.2: D1 dry-run export and import

Validates the export/import path works against the real schema before the cutover window.

- [ ] **Step 1: Export old D1**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
  npx wrangler d1 export ohcs-elibrary --remote --output=../migration/d1-dryrun.sql
```

Expected: SQL file created, size shown.

- [ ] **Step 2: Inspect the export**

[CMD]

```bash
wc -l migration/d1-dryrun.sql && head -5 migration/d1-dryrun.sql && grep -c "^INSERT INTO" migration/d1-dryrun.sql
```

Expected: line count, schema CREATE statements at top, INSERT count > 0.

- [ ] **Step 3: Drop and recreate new D1 to clear schema and dry-run the full import**

The new D1 currently has schema only (from Task 2.7). To dry-run the full export/import path, drop it and let the import recreate everything.

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 delete ohcs-elibrary
```

Confirm `y` when prompted.

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 create ohcs-elibrary
```

Capture the new UUID. **If different from before**, update `workers/wrangler.toml:18` again and re-deploy the Worker:

```bash
# Update wrangler.toml line 18 with new UUID
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler deploy
```

- [ ] **Step 4: Import dry-run SQL into new D1**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 execute ohcs-elibrary --remote --file=../migration/d1-dryrun.sql
```

Expected: all statements execute successfully. Note any errors — FTS5 issues or FK errors would surface here.

- [ ] **Step 5: Verify row counts match between old and new**

[CMD]

```bash
cd workers
for table in users documents research_entries lms_courses career_paths forum_posts notifications; do
  OLD=$(CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
    npx wrangler d1 execute ohcs-elibrary --remote --json --command="SELECT COUNT(*) AS n FROM $table" 2>/dev/null \
    | grep -oE '"n":[0-9]+' | head -1 | cut -d: -f2)
  NEW=$(CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
    npx wrangler d1 execute ohcs-elibrary --remote --json --command="SELECT COUNT(*) AS n FROM $table" 2>/dev/null \
    | grep -oE '"n":[0-9]+' | head -1 | cut -d: -f2)
  printf "%-20s OLD=%s NEW=%s %s\n" "$table" "$OLD" "$NEW" "$([ "$OLD" = "$NEW" ] && echo OK || echo MISMATCH)"
done
cd ..
```

Expected: every line ends with `OK`. Any `MISMATCH` indicates a serious import problem — investigate before proceeding.

- [ ] **Step 6: Run a search query on FTS5 to verify**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 execute ohcs-elibrary --remote --command="SELECT COUNT(*) FROM research_entries_fts WHERE research_entries_fts MATCH 'governance'" 2>/dev/null
```

Expected: returns a count (possibly 0, but not a syntax error). Confirms FTS5 schema imported correctly.

---

### Task 5.3: R2 initial bulk sync

This step runs unattended for as long as it takes. For thousands of small documents, expect 30 min – several hours.

- [ ] **Step 1: Estimate transfer size**

[CMD]

```bash
rclone size r2-old:ohcs-documents
```

Expected: shows total object count and total bytes.

- [ ] **Step 2: Start bulk sync**

[CMD]

```bash
rclone sync r2-old:ohcs-documents r2-new:ohcs-documents \
  --progress \
  --transfers=16 \
  --checkers=32 \
  --retries=10 \
  --log-file=migration/rclone-initial.log
```

Expected: `--progress` shows transfer rate. Final summary: `Transferred: <count> objects, <size>`.

- [ ] **Step 3: Verify counts match after initial sync**

[CMD]

```bash
echo "OLD:" && rclone size r2-old:ohcs-documents
echo "NEW:" && rclone size r2-new:ohcs-documents
```

Expected: object counts equal, total size within 1KB (R2 metadata may differ slightly).

---

## PHASE 6 — Cutover (T-zero, ~12 minutes)

**Critical:** all steps in this phase run sequentially. Do NOT run in parallel. The `T+` annotations are guidance, not hard deadlines.

### Task 6.1: Confirm ready for cutover (T-5 min)

- [ ] **Step 1: Pre-cutover checklist**

Verify all of these are TRUE before proceeding:

- [ ] Phase 1 code commits exist on `master` (not yet pushed — push happens Phase 7)
- [ ] Phase 2 resources exist in new account
- [ ] Phase 3 wrangler.toml has new IDs
- [ ] Phase 4 Worker deployed and Pages deployed; smoke test passed on `.pages.dev`
- [ ] Phase 5 DNS BIND file exported, D1 dry-run successful, R2 initial sync completed with matching counts
- [ ] User is at the registrar's dashboard, ready to update nameservers (in another tab)
- [ ] User has the new Worker's `.workers.dev` URL handy
- [ ] User has Cloudflare new account dashboard open

- [ ] **Step 2: User confirms ready**

[USER] Reply "ready" to proceed. Cutover begins on confirmation.

---

### Task 6.2: Deploy maintenance-mode Worker to OLD account (T+0:00)

Freezes writes to old D1 and old R2 by intercepting all requests with a 503.

**Files:** Create `migration/maintenance-worker.ts`, `migration/maintenance-wrangler.toml`

- [ ] **Step 1: Create the maintenance Worker source**

[FILE] `migration/maintenance-worker.ts`:

```typescript
const HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Maintenance — OHCS E-Library</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:4rem 1rem;color:#333;background:#f8fafc}
h1{color:#1a4d8c;font-size:2rem;margin-bottom:0.5rem}
.spinner{display:inline-block;width:40px;height:40px;border:4px solid #e5e7eb;border-top:4px solid #1a4d8c;border-radius:50%;animation:spin 1s linear infinite;margin:1.5rem 0}
@keyframes spin{to{transform:rotate(360deg)}}
p{max-width:480px;margin:0 auto;line-height:1.6;color:#555}
</style></head>
<body><h1>OHCS E-Library</h1><div class="spinner"></div>
<p>Brief platform maintenance is in progress. Service will return automatically within a few minutes. No action required on your part.</p>
</body></html>`;

export default {
  async fetch(): Promise<Response> {
    return new Response(HTML, {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Retry-After': '900',
        'Cache-Control': 'no-store',
      },
    });
  },
};
```

- [ ] **Step 2: Create maintenance wrangler config**

[FILE] `migration/maintenance-wrangler.toml`:

```toml
name = "ohcs-elibrary-api"
main = "maintenance-worker.ts"
compatibility_date = "2024-01-01"
workers_dev = true
```

- [ ] **Step 3: Deploy maintenance Worker to OLD account**

[CMD]

```bash
cd migration && CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
  npx wrangler deploy --config maintenance-wrangler.toml
```

Expected: deploys, replacing the live `ohcs-elibrary-api` Worker with the maintenance stub.

- [ ] **Step 4: Verify maintenance is live**

[CMD]

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1/health
```

Expected: `503`.

[CMD]

```bash
curl -s https://ohcs-elibrary.pages.dev/ | head -5
```

The Pages site still loads but its API calls all return 503. Frontend will show errors — this is expected and brief.

---

### Task 6.3: Final R2 delta sync (T+0:30)

- [ ] **Step 1: Run delta sync**

[CMD]

```bash
rclone sync r2-old:ohcs-documents r2-new:ohcs-documents \
  --progress \
  --transfers=16 \
  --checkers=32 \
  --retries=10 \
  --log-file=migration/rclone-delta.log
```

Expected: very few transfers (only objects added/changed since initial sync).

- [ ] **Step 2: Verify final counts match**

[CMD]

```bash
echo "OLD:" && rclone size r2-old:ohcs-documents
echo "NEW:" && rclone size r2-new:ohcs-documents
```

Expected: object counts equal.

---

### Task 6.4: Final D1 export and import (T+1:30)

- [ ] **Step 1: Export old D1**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
  npx wrangler d1 export ohcs-elibrary --remote --output=../migration/d1-final.sql
```

Expected: SQL file created.

- [ ] **Step 2: Drop and recreate new D1 (clean import)**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 delete ohcs-elibrary
```

Confirm `y`. Then recreate:

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 create ohcs-elibrary
```

If the UUID changes, update `workers/wrangler.toml:18` accordingly and remember to re-deploy Worker after import (Step 4).

- [ ] **Step 3: Import final SQL into new D1**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler d1 execute ohcs-elibrary --remote --file=../migration/d1-final.sql
```

Expected: all statements succeed.

- [ ] **Step 4: Re-deploy Worker if D1 UUID changed**

If Step 2 produced a new UUID and `wrangler.toml` was updated:

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler deploy
```

---

### Task 6.5: Row-count verification (T+3:00)

If any mismatch >0.1%, **abort and roll back** per Section 7 of the spec.

- [ ] **Step 1: Compare critical table counts**

[CMD]

```bash
cd workers
TABLES="users documents research_entries lms_courses career_paths forum_posts chat_messages notifications"
ALL_MATCH=true
for t in $TABLES; do
  OLD=$(CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
    npx wrangler d1 execute ohcs-elibrary --remote --json --command="SELECT COUNT(*) AS n FROM $t" 2>/dev/null \
    | grep -oE '"n":[0-9]+' | head -1 | cut -d: -f2)
  NEW=$(CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
    npx wrangler d1 execute ohcs-elibrary --remote --json --command="SELECT COUNT(*) AS n FROM $t" 2>/dev/null \
    | grep -oE '"n":[0-9]+' | head -1 | cut -d: -f2)
  printf "%-20s OLD=%s NEW=%s\n" "$t" "$OLD" "$NEW"
  [ "$OLD" = "$NEW" ] || ALL_MATCH=false
done
cd ..
$ALL_MATCH && echo "ALL_MATCH" || echo "MISMATCH — ABORT"
```

Expected: `ALL_MATCH`. If `MISMATCH`, halt cutover and roll back per Section 7 of the spec — restore old Worker via:

```bash
cd workers && CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
  npx wrangler deploy
```

(deploys current code from `workers/src/index.ts` back to the old account, replacing the maintenance stub).

---

### Task 6.6: Move zone to new account (T+4:00)

- [ ] **Step 1: User removes zone from old account**

[USER] Old CF dashboard → `ohcselibrary.xyz` → Overview → bottom of page → "Remove Site". Confirm.

After removal, the domain temporarily has no Cloudflare zone — but DNS still resolves via cached records (TTL).

- [ ] **Step 2: User adds zone to new account**

[USER] New CF dashboard → "Add a Site" → enter `ohcselibrary.xyz` → choose Free plan → click Continue.

Cloudflare assigns nameservers (typically 2 names like `xxx.ns.cloudflare.com` and `yyy.ns.cloudflare.com`). **Note these new nameservers** — they will be different from what the old account had.

- [ ] **Step 3: Skip auto-scan (we'll import BIND manually)**

[USER] On the DNS records screen for the new zone, click "Continue" or skip auto-scan.

---

### Task 6.7: Configure Pages custom domains and Worker route (T+5:00)

- [ ] **Step 1: Bind apex custom domain to Pages**

[USER] New CF dashboard → Workers & Pages → `ohcs-elibrary` → Custom domains → "Set up a custom domain" → enter `ohcselibrary.xyz` → "Activate domain". Cloudflare auto-creates the necessary DNS records.

- [ ] **Step 2: Bind www custom domain to Pages**

[USER] Same screen → "Set up a custom domain" → enter `www.ohcselibrary.xyz` → "Activate domain".

- [ ] **Step 3: Add Worker route for api.ohcselibrary.xyz**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler deploy --route "api.ohcselibrary.xyz/*"
```

This deploys the Worker AND adds the route binding. Alternatively, dashboard: Workers → `ohcs-elibrary-api` → Triggers → Add custom domain → `api.ohcselibrary.xyz`.

- [ ] **Step 4: Import remaining DNS records from BIND file**

[USER] New CF dashboard → DNS → Records → "Import and Export" → Import → upload `migration/ohcselibrary-old-dns.bind`.

Cloudflare will skip records that conflict with auto-created ones (apex/www from Pages). It will import the Resend DKIM/SPF/MX records and any other records.

- [ ] **Step 5: Verify DNS records present**

[USER] In DNS records list, confirm:

- Apex `ohcselibrary.xyz` → Pages (CNAME flattened to A)
- `www.ohcselibrary.xyz` → CNAME to Pages
- `api.ohcselibrary.xyz` → CNAME flattened (auto-created by Worker route)
- `notify.ohcselibrary.xyz` → MX (Resend)
- DKIM TXT records (`resend._domainkey`, etc.)
- SPF TXT record (`v=spf1 include:resend.com ~all`)

If `notify.ohcselibrary.xyz` MX/DKIM/SPF records are missing from BIND import, manually re-add them by copying from old account (you took a screenshot or notes per Phase 5 prep).

---

### Task 6.8: Update nameservers at registrar (T+8:00)

- [ ] **Step 1: User logs into registrar**

[USER] Open registrar dashboard (Namecheap/GoDaddy/etc.) → manage `ohcselibrary.xyz` → Nameservers section.

- [ ] **Step 2: Replace nameservers**

[USER] Replace existing nameservers (the OLD account's CF nameservers) with the NEW account's CF nameservers from Task 6.6 Step 2. Save.

- [ ] **Step 3: Wait for propagation**

[CMD] Repeatedly check NS resolution:

```bash
dig +short NS ohcselibrary.xyz @8.8.8.8
```

Expected (eventually): the new nameservers. Typically 5–30 min.

- [ ] **Step 4: Verify HTTPS works on apex**

Once NS propagation begins, test:

[CMD]

```bash
curl -s -o /dev/null -w "%{http_code}\n" -L https://ohcselibrary.xyz/
```

Expected: `200`.

[CMD]

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.ohcselibrary.xyz/api/v1/health
```

Expected: `200`.

If still resolving stale, wait and retry.

---

### Task 6.9: Re-deploy Pages with canonical API URL (T+9:00)

The Pages bundle currently has the temporary `.workers.dev` URL baked in. Now that `api.ohcselibrary.xyz` works, rebuild with the canonical URL.

- [ ] **Step 1: Build with canonical URL**

[CMD]

```bash
VITE_API_URL=https://api.ohcselibrary.xyz npm run build
```

- [ ] **Step 2: Verify build**

[CMD]

```bash
grep -r "api.ohcselibrary.xyz" dist/ | head -1
grep -r "ohcs-elibrary-api.<new-subdomain>.workers.dev" dist/ | head -1
```

First grep: should match. Second grep: should be empty.

- [ ] **Step 3: Deploy**

[CMD]

```bash
CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler pages deploy dist --project-name=ohcs-elibrary --branch=master
```

---

### Task 6.10: Reconfigure external integrations (T+11:00)

- [ ] **Step 1: Update Telegram webhook**

Use the same `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` values set in Task 4.1 Steps 9 and 10.

[CMD] Register the new webhook URL with Telegram:

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://api.ohcselibrary.xyz/api/v1/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
  -d 'allowed_updates=["message","callback_query"]'
```

Expected: `{"ok":true,"result":true,"description":"Webhook was set"}`.

[CMD] Verify:

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

Expected: `url` field shows `https://api.ohcselibrary.xyz/api/v1/telegram/webhook`, `has_custom_certificate: false`, `pending_update_count: 0`.

[USER] Smoke-test: send a message to `@ohcselibrarybot` from your own Telegram account → verify the bot responds. If the bot doesn't respond, check the new Worker logs (`npx wrangler tail`) for incoming webhook requests.

- [ ] **Step 2: Verify Paystack webhook URL**

[USER] Paystack dashboard → Settings → API Keys & Webhooks → confirm webhook URL is `https://ohcselibrary.xyz/...` (apex). If still points at `pages.dev`, update it. The shop-orders.ts code already constructs callbacks via apex, so the dashboard webhook just needs to match.

- [ ] **Step 3: Verify Resend domain still verified**

[USER] Resend dashboard → Domains → `notify.ohcselibrary.xyz` → status should still show "Verified" (since DKIM/SPF/MX records were imported intact in Task 6.7).

If status shows "Pending" or "Failed": click "Verify" — should succeed within seconds since records are present in new zone.

---

### Task 6.11: End-to-end smoke test (T+12:00)

- [ ] **Step 1: Login flow**

[USER] Open `https://ohcselibrary.xyz` in incognito → log in with a real production account → verify dashboard loads with user's data.

- [ ] **Step 2: Document download**

[USER] Open a document from the library → verify PDF loads from R2.

- [ ] **Step 3: Send a test email**

[USER] Trigger an email-generating flow (e.g., password reset for a test account) → verify email arrives from `noreply@notify.ohcselibrary.xyz`.

- [ ] **Step 4: Worker logs check**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler tail --format=pretty &
TAIL_PID=$!
sleep 30
kill $TAIL_PID
```

Expected: live logs showing requests being served. Should see no 5xx errors during normal traffic.

- [ ] **Step 5: Cron trigger verification**

[USER] Wait until the next 15-minute mark (`*/15 * * * *` cron). Check Workers → `ohcs-elibrary-api` → Logs → confirm a cron-triggered execution appears.

- [ ] **Step 6: Cutover complete**

If all of the above pass, cutover is complete. The old account's resources still exist but receive zero traffic. Move to Phase 7.

---

## PHASE 7 — GitHub auto-deploy (T+24h)

Wait at least 24h after cutover before automating deploys. This ensures any issues that surface in the first day are fixed manually before automation locks in.

### Task 7.1: Connect Pages to GitHub via native integration

- [ ] **Step 1: User connects repo**

[USER] New CF dashboard → Workers & Pages → `ohcs-elibrary` → Settings → Builds & deployments → "Connect to Git" → Authorize Cloudflare's GitHub app → Select repo `ghwmelite-dotcom/ohcs-elibrary` → Production branch: `master`.

- [ ] **Step 2: Configure build settings**

[USER] Build configuration:

- Framework preset: None (or Vite if listed)
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/` (project root)

Environment variables (Production):

- `VITE_API_URL` = `https://api.ohcselibrary.xyz`
- `NODE_VERSION` = `20`

- [ ] **Step 3: Save and trigger first auto-build**

[USER] Save settings. Make a trivial commit to `master` (e.g., a comment in README) to trigger first auto-build, OR click "Retry deployment" if the connection auto-triggers a build.

- [ ] **Step 4: Verify auto-build succeeds**

[USER] Watch the Pages deployment → ensure build succeeds → visit `https://ohcselibrary.xyz` → confirm the latest version is live.

---

### Task 7.2: Set up GitHub Actions for Worker auto-deploy

**Files:** Create `.github/workflows/deploy-worker.yml`

- [ ] **Step 1: Create workflow file**

[FILE] `.github/workflows/deploy-worker.yml`:

```yaml
name: Deploy Worker

on:
  push:
    branches: [master]
    paths:
      - 'workers/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: workers
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: workers/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: workers
          command: deploy
```

- [ ] **Step 2: Add GitHub repo secrets**

[USER] GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

- `CLOUDFLARE_API_TOKEN` = the new account API token (same one stored as `$NEW_CF_TOKEN`)
- `CLOUDFLARE_ACCOUNT_ID` = `f4f236a6cd8fbddf397c6e9de17d8113`

- [ ] **Step 3: Commit the workflow**

[CMD]

```bash
git add .github/workflows/deploy-worker.yml
git commit -m "$(cat <<'EOF'
ci(workers): auto-deploy Worker on push to master

Adds GitHub Actions workflow using cloudflare/wrangler-action@v3.
Triggers only when files under workers/ change, keeping frontend-only
commits from churning the Worker.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin master
```

- [ ] **Step 4: Verify workflow runs**

[USER] GitHub repo → Actions tab → confirm "Deploy Worker" run started and succeeded. Check the Worker version in CF dashboard matches the latest commit SHA.

---

### Task 7.3: Test end-to-end auto-deploy

- [ ] **Step 1: Make a trivial worker change**

[CMD]

```bash
# Add a harmless comment to a worker file
cd workers/src
sed -i.bak '1i\
// Auto-deploy test '"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'
' index.ts
rm index.ts.bak
cd ../..
git add workers/src/index.ts
git commit -m "test(ci): verify auto-deploy pipeline"
git push origin master
```

- [ ] **Step 2: Watch the deploy**

[USER] GitHub Actions → confirm "Deploy Worker" workflow triggered, ran, succeeded.

[CMD]

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.ohcselibrary.xyz/api/v1/health
```

Expected: `200`.

- [ ] **Step 3: Test Pages auto-deploy**

[CMD]

```bash
# Trivial frontend change
sed -i.bak '1i\
<!-- Auto-deploy test '"$(date -u +%Y-%m-%dT%H:%M:%SZ)"' -->
' index.html
rm index.html.bak
git add index.html
git commit -m "test(ci): verify Pages auto-deploy"
git push origin master
```

- [ ] **Step 4: Watch Pages deploy**

[USER] CF dashboard → Pages → `ohcs-elibrary` → Deployments → confirm new deployment triggered, building, succeeded.

---

## PHASE 8 — Verification window (D+1 to D+7)

### Task 8.1: Daily smoke test for 7 days

- [ ] **Step 1: Run daily checks**

For each of the 7 days following cutover, the user runs:

[USER]

- Log in to `https://ohcselibrary.xyz`
- Open at least one document
- Send at least one in-app notification (or trigger one)
- Check email arrives

[CMD]

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://ohcselibrary.xyz/
curl -s -o /dev/null -w "%{http_code}\n" https://api.ohcselibrary.xyz/api/v1/health
```

Both expected: `200`.

[CMD] Check Worker logs for errors over the day:

```bash
cd workers && CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  npx wrangler tail --format=pretty &
sleep 60 && kill %1
```

Expected: no 5xx during normal traffic.

---

## PHASE 9 — Old account decommissioning (D+7)

Only proceed if all 7 daily checks in Phase 8 passed cleanly.

### Task 9.1: Final pre-deletion checklist

- [ ] No errors in new account Worker logs for 48+ hours
- [ ] Email delivery confirmed (test send → arrived)
- [ ] Document upload + download tested end-to-end on new account
- [ ] Cron triggers verified running (CF dashboard → Workers → Logs filter `cron`)
- [ ] Telegram bot responding via new webhook URL
- [ ] Paystack test transaction processed successfully (or live transaction observed)
- [ ] Resend domain (`notify.ohcselibrary.xyz`) showing "verified" in new Resend account
- [ ] DNS records resolving correctly (`dig api.ohcselibrary.xyz +short`)

User confirms ALL of above before any deletion.

---

### Task 9.2: Delete old Worker

- [ ] **Step 1: Confirm with user**

[USER] Reply "DELETE OLD WORKER" to authorize.

- [ ] **Step 2: Delete**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
  npx wrangler delete --name ohcs-elibrary-api
```

Confirm deletion at the prompt.

- [ ] **Step 3: Verify**

[CMD]

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://ohcs-elibrary-api.ghwmelite.workers.dev/
```

Expected: `404` or connection refused (Worker no longer exists).

---

### Task 9.3: Delete old Pages project

- [ ] **Step 1: Confirm**

[USER] Reply "DELETE OLD PAGES" to authorize.

- [ ] **Step 2: Delete**

[CMD]

```bash
CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
  npx wrangler pages project delete ohcs-elibrary
```

Confirm deletion.

---

### Task 9.4: Delete old KV namespace

- [ ] **Step 1: Confirm**

[USER] Reply "DELETE OLD KV" to authorize.

- [ ] **Step 2: Delete**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
  npx wrangler kv namespace delete --namespace-id=747355109d8a4b63a45a116b9c3208b1
```

---

### Task 9.5: Empty and delete old R2 bucket

- [ ] **Step 1: Confirm**

[USER] Reply "DELETE OLD R2" to authorize. **This is irreversible** — old R2 bucket contents permanently lost.

- [ ] **Step 2: Empty bucket**

[CMD]

```bash
rclone purge r2-old:ohcs-documents
```

- [ ] **Step 3: Delete bucket**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
  npx wrangler r2 bucket delete ohcs-documents
```

---

### Task 9.6: Delete old D1 database

- [ ] **Step 1: Confirm — final, irreversible step**

[USER] Reply "DELETE OLD D1 — I HAVE A LOCAL EXPORT" to authorize. The `migration/d1-final.sql` file in the project still exists as a local backup.

- [ ] **Step 2: Verify local backup exists and is valid**

[CMD]

```bash
test -s migration/d1-final.sql && wc -l migration/d1-final.sql
```

Expected: file exists, has substantial line count.

- [ ] **Step 3: Delete**

[CMD]

```bash
cd workers && CLOUDFLARE_API_TOKEN=$OLD_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$OLD_CF_ACCOUNT_ID \
  npx wrangler d1 delete ohcs-elibrary
```

Confirm deletion.

---

### Task 9.7: Clean up OAuth and Resend

- [ ] **Step 1: Remove pages.dev redirect URIs from Google Cloud Console**

[USER] Google Cloud Console → APIs & Services → Credentials → OHCS E-Library Web Client → Authorized redirect URIs → remove URI #1 (`https://ohcs-elibrary.pages.dev/admin/...`) and URI #2 (`http://localhost:5173/admin/...` if not needed). Save.

- [ ] **Step 2: Delete old Google Drive OAuth client secret**

[USER] Same screen → Client secrets section → click trash icon next to old secret `****_jhv` → confirm.

- [ ] **Step 3: Revoke old Resend API key**

[USER] Resend dashboard → API Keys → click trash icon next to the old key (the one created before April 25, 2026) → confirm.

- [ ] **Step 4: Optional — final secret rotation**

[USER] If desired, rotate Paystack secret key once more (since it appeared in this chat transcript): Paystack dashboard → Settings → API Keys & Webhooks → Reveal & Regenerate Secret Key. Then run:

```bash
echo "<NEW_PAYSTACK_SECRET>" | CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN CLOUDFLARE_ACCOUNT_ID=$NEW_CF_ACCOUNT_ID \
  cd workers && npx wrangler secret put PAYSTACK_SECRET_KEY
```

Same for Resend (already done by virtue of new API key).

---

### Task 9.8: Clean up local migration scratch

- [ ] **Step 1: Securely delete migration files**

[CMD]

```bash
rm -rf migration/
```

(Was in `.gitignore`; not in repo.)

- [ ] **Step 2: Unset shell env vars**

[CMD]

```bash
unset NEW_CF_TOKEN OLD_CF_TOKEN NEW_CF_ACCOUNT_ID OLD_CF_ACCOUNT_ID
```

- [ ] **Step 3: Migration complete commit**

[CMD]

```bash
git commit --allow-empty -m "$(cat <<'EOF'
chore(migration): Cloudflare account migration complete

OHCS E-Library has been fully migrated from ghwmelite@gmail.com to
ohcsghana.main@gmail.com. Old account resources deleted.
ohcselibrary.xyz is the canonical domain. Pages and Worker auto-deploy
from this repo on push to master.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin master
```

---

## Self-review checklist

After plan execution, verify:

- [ ] `https://ohcselibrary.xyz` loads, login works, documents accessible
- [ ] `https://api.ohcselibrary.xyz/api/v1/health` returns 200
- [ ] `git push origin master` triggers Pages build AND Worker deploy automatically
- [ ] No errors in Worker logs for 7+ days post-cutover
- [ ] Email delivery confirmed via Resend
- [ ] Old account: `wrangler whoami` against old token shows zero workers, zero pages projects, zero D1, zero R2, zero KV in OHCS-related namespaces
- [ ] Spec acceptance criteria all checked

---

## Coverage check against spec

- Section 1 (Target architecture): Tasks 6.6, 6.7, 6.9 implement domain bindings ✓
- Section 2 (Resource recreation): Tasks 2.1–2.7, 4.1 ✓
- Section 3 (Data migration): Tasks 5.2, 5.3, 6.3, 6.4, 6.5 ✓
- Section 4 (Cutover): Phase 6 ✓
- Section 5 (GitHub auto-deploy): Phase 7 ✓
- Section 6 (Old account decommissioning): Phase 9 ✓
- Section 7 (Rollback): Implicit — abort criteria stated in Tasks 6.5 and 6.11; rollback procedures in spec apply if triggered

---

## Out-of-scope follow-ups (post-migration)

- Re-add Gmail email path (`GMAIL_*` secrets) via OAuth flow — separate plan
- Remove `localhost:5173` redirect URIs from production OAuth client (move to a separate dev OAuth client)
- Add staging environment for safer pre-prod testing
- Convert this plan into a runbook for any future account migrations
