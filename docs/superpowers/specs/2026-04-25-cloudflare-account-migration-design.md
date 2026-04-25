# Cloudflare Account Migration — OHCS E-Library

**Date:** 2026-04-25
**Status:** Approved design, pending implementation plan
**Author:** Brainstorming session, ohwpstudios@gmail.com

## Summary

Migrate the OHCS E-Library platform from Cloudflare account `ghwmelite@gmail.com` to `ohcsghana.main@gmail.com` (account ID `f4f236a6cd8fbddf397c6e9de17d8113`). Preserve all production data (users, documents, content). Make the platform account-independent by binding it to the custom domain `ohcselibrary.xyz` at cutover. Establish GitHub-driven auto-deployment for both frontend (Pages) and backend (Worker). Delete old account resources after a verification period.

## Goals

1. Zero data loss — every user, document, post, course, research entry preserved.
2. Best-effort minimal downtime cutover (~12 minute target window, no maintenance page beyond a brief 503).
3. Custom domain `ohcselibrary.xyz` becomes the canonical URL, replacing `*.pages.dev` and `*.workers.dev` subdomain dependencies.
4. Automatic deploys: every `git push origin master` builds and ships to the new account without manual `wrangler` commands.
5. Old account fully decommissioned after a 3–7 day verification window.

## Non-Goals

- No feature changes during migration. Code touches are limited to URL constants, config, and CI/CD setup.
- No re-architecture of services. Same Worker, same Pages project, same database schema.
- No Gmail email path during migration — Resend handles all email. Gmail can be re-added later as a follow-up.
- The old Cloudflare account itself is not deleted (only its OHCS resources). An empty account costs nothing.

---

## Section 1 — Target Architecture

Everything currently hangs off `.pages.dev` and `.workers.dev` subdomains, both of which are account-scoped and change between accounts. The migration is the moment to flip the canonical URLs to the custom domain so future moves are non-events.

| Surface | Current | Post-migration |
|---|---|---|
| Frontend canonical | `ohcs-elibrary.pages.dev` | `ohcselibrary.xyz` (apex) |
| Frontend `www.` | unused | `www.ohcselibrary.xyz` → 301 redirects to apex |
| API | `ohcs-elibrary-api.ghwmelite.workers.dev` | `api.ohcselibrary.xyz` |
| Email FROM | `noreply@notify.ohcselibrary.xyz` (already) | unchanged |
| Telegram webhook | old Worker URL | `api.ohcselibrary.xyz/api/v1/telegram/webhook` |
| Paystack callback | `ohcselibrary.xyz/shop/...` (already) | unchanged |
| Google Drive OAuth redirect | `ohcs-elibrary.pages.dev/admin/...` | `ohcselibrary.xyz/admin/integrations/google-drive/callback` |

**Why apex over www:** Google Cloud Console's OAuth consent screen treats `www.ohcselibrary.xyz` as a separate domain rather than a subdomain of the verified `ohcselibrary.xyz`, blocking the www redirect URI. Apex is the path of least resistance and matches existing code (Paystack callback, CORS allowlist).

---

## Section 2 — Resource Recreation in New Account

All resources are created fresh in account `f4f236a6cd8fbddf397c6e9de17d8113`. New IDs replace the old ones in `workers/wrangler.toml`.

### Resources to create

| Resource | Name | Notes |
|---|---|---|
| D1 database | `ohcs-elibrary` | New UUID — replaces `database_id` (`workers/wrangler.toml:18`) |
| R2 bucket | `ohcs-documents` | Same name; empty until data sync |
| KV namespace | `CACHE` | New ID — replaces `id` (`workers/wrangler.toml:28`) |
| Worker | `ohcs-elibrary-api` | Same name; new `*.workers.dev` subdomain assigned by CF |
| Pages project | `ohcs-elibrary` | Same name; binds `ohcselibrary.xyz` + `www.ohcselibrary.xyz` |
| Workers AI | `AI` binding | Account-level, zero config |
| Cron triggers | `0 * * * *` and `*/15 * * * *` | Re-declared via wrangler.toml |

### Secrets to set in new account

Migration uses Resend for email exclusively. Gmail OAuth secrets are skipped — code in `workers/src/routes/auth.ts:66` automatically falls through to Resend when `GMAIL_*` vars are missing.

| Secret | Source |
|---|---|
| `JWT_SECRET` | Generated fresh: `openssl rand -base64 48`. Forces all current sessions to re-login once. |
| `CRON_SECRET` | Generated fresh: `openssl rand -base64 48`. Only affects cron endpoints; CF's built-in cron triggers don't depend on it. |
| `RESEND_API_KEY` | New key generated in Resend dashboard. Old key kept active until D+3 to D+7 verification. |
| `PAYSTACK_SECRET_KEY` | Copied from Paystack dashboard (live key). |
| `PAYSTACK_PUBLIC_KEY` | Copied from Paystack dashboard (live key). |
| `GOOGLE_DRIVE_CLIENT_ID` | Copied from Google Cloud Console (visible). |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Newly rotated secret (Reset Secret was performed in Google Cloud Console). Old secret kept active until D+3 to D+7 verification. |

### Code changes

Repository-level changes merged before cutover:

| File | Change |
|---|---|
| `workers/wrangler.toml:8` | `GOOGLE_DRIVE_REDIRECT_URI` → `https://ohcselibrary.xyz/admin/integrations/google-drive/callback` |
| `workers/wrangler.toml:18` | `database_id` → new D1 UUID |
| `workers/wrangler.toml:28` | KV `id` → new namespace ID |
| `.env.production` | `VITE_API_URL` → `https://api.ohcselibrary.xyz` |
| `src/hooks/useResearchApi.ts:3` | Fallback URL → `https://api.ohcselibrary.xyz` |
| `src/pages/instructor/QuizBuilder.tsx:701` | Fallback URL → `https://api.ohcselibrary.xyz` |
| `workers/src/services/telegramService.ts:179` | `PLATFORM_URL` → `https://ohcselibrary.xyz` (drop `www.`) |
| `workers/src/routes/telegram.ts:322` | Apex domain in deep link |
| `workers/src/routes/telegram.ts:646` | Apex domain in deep link |

CORS allowlist (`workers/src/index.ts:105-106`) already includes both apex and www; no change needed.

---

## Section 3 — Data Migration

### D1 — Relational data

**Tooling:** `wrangler d1 export` produces a SQL file containing schema + data. `wrangler d1 execute --remote --file=...` against the new database imports it.

**Sequence:**

1. **Pre-cutover dry-run** (D-1 or earlier, no production impact): export old D1, import into new D1, verify schema and row counts. Throw away the dry-run data; old account untouched.
2. **At cutover**, with old Worker in maintenance mode: final `wrangler d1 export` from old, then import into new. Typical window: 30–90 seconds for a few-hundred-MB DB.
3. **Verify**: `SELECT COUNT(*)` on 8 critical tables on both old and new — must match exactly. Tables: `users`, `documents`, `research_entries`, `lms_courses`, `career_paths`, `forum_posts`, `chat_messages`, `notifications`.

**Caveats:**

- **FTS5 virtual tables** (Research Hub) — schema export includes `CREATE VIRTUAL TABLE`; index re-creates correctly on import. Verified by running a search query post-import.
- **Migration tracking table** — carried over by export. Do NOT run `wrangler d1 migrations apply` on the new DB after import; that would double-apply.
- **Foreign keys** — D1 export disables FK checks during import (`PRAGMA foreign_keys = OFF`); insertion order doesn't matter.

### R2 — Documents bucket

**Tooling:** `rclone` configured with two S3-compatible remotes (`r2-old`, `r2-new`) pointing at each account's R2 endpoint. Each remote needs an Access Key + Secret Key generated in the respective account's R2 dashboard (separate from Cloudflare API tokens).

**Sequence:**

1. **D-1 initial bulk sync** — `rclone sync r2-old:ohcs-documents r2-new:ohcs-documents --progress --transfers=16`. Runs unattended overnight; old account stays live.
2. **At cutover, after Worker maintenance mode** — re-run the same `rclone sync`. Only changed/new objects since D-1 transfer. Typically <60 seconds.
3. **Verify**: `rclone size r2-old:ohcs-documents` vs `rclone size r2-new:ohcs-documents` — object count and total size match. Sample 3–5 documents and confirm download from new bucket.

**Cost note:** R2 has no egress fees. Class A operations (writes) cost ~$4.50 per million — typically cents for a document library.

### KV — Cache

`CACHE` namespace is repopulated on first cache miss in the new account. **Not migrated.** New namespace starts empty.

### Required credentials

| Need | Source | Use |
|---|---|---|
| Old account R2 credentials | Old CF dashboard → R2 → Manage R2 API tokens (read-only) | Source for rclone |
| New account R2 credentials | New CF dashboard → R2 → Manage R2 API tokens (read+write) | Destination for rclone |
| Old account API token | Old CF dashboard → My Profile → API Tokens (Account + Workers + D1 read) | `wrangler d1 export` against old |
| New account API token | New CF dashboard → API Tokens (Account + Workers + D1 + R2 + KV write) | All `wrangler` ops against new |

Four tokens total. Generated immediately before execution begins, not earlier.

---

## Section 4 — Cutover Sequence

Single ~12-minute window for the actual flip. Everything before is prep that fails safely; everything after is verification.

### T-minus prep (D-7 to D-1)

| When | Action |
|---|---|
| **D-7** | New account API tokens generated. New Worker, Pages, D1 schema, R2 bucket, KV namespace created. All secrets set. AI binding enabled. Dry-run D1 import tested. |
| **D-7** | DNS records exported from old account as BIND file: Dashboard → ohcselibrary.xyz → DNS → "Export DNS records". Captures Resend's DKIM/SPF/MX records to avoid email re-verification. |
| **D-1** | Code changes merged to `master`: updated `workers/wrangler.toml`, `.env.production`, telegram URLs, fallback URLs. |
| **D-1** | R2 initial bulk sync kicked off via rclone — runs unattended. |
| **D-1** | New Pages built and deployed with **temporary** `VITE_API_URL=https://<new-worker>.workers.dev` — verifies the full stack works at `<new-id>.pages.dev` before DNS is touched. |
| **D-0, T-1h** | Final smoke test on new account's `.pages.dev` + `.workers.dev`: login, list docs, view a document, post in forum, run a search. |

### T-zero cutover window

| T+ | Step | What happens |
|---|---|---|
| **0:00** | Old Worker maintenance mode | Deploy a 5-line override returning 503 + maintenance HTML for all routes. New writes frozen. In-flight requests complete naturally. |
| **0:30** | R2 final delta sync | `rclone sync r2-old:ohcs-documents r2-new:ohcs-documents`. Only changed objects since D-1. <60s. |
| **1:30** | D1 final export + import | `wrangler d1 export` (old) → `wrangler d1 execute --file` (new). <90s for a few-hundred-MB DB. |
| **3:00** | Row-count verification | `SELECT COUNT(*)` on 8 critical tables, old vs new. Any mismatch → abort and roll back (Section 7). |
| **4:00** | Zone move | Old account: Remove Site → confirm `ohcselibrary.xyz`. New account: Add Site → confirm. CF assigns new nameservers. |
| **5:00** | DNS records | New account Pages → Custom domains → add apex + www. New account Worker → Triggers → add route `api.ohcselibrary.xyz/*`. Import BIND file from D-7, then update apex/www to point at new Pages, `api` CNAME to new Worker, leave Resend DKIM/SPF/MX as-is. |
| **8:00** | Registrar nameserver update | User logs into registrar, replaces old CF nameservers with new ones. CF nameservers respond within seconds; upstream DNS caches drain in 5–30 min. |
| **9:00** | Pages re-deploy with canonical API URL | Rebuild Pages with `VITE_API_URL=https://api.ohcselibrary.xyz`. Frontend now account-independent. |
| **11:00** | External integrations re-pointed | Telegram bot: `setWebhook` to `https://api.ohcselibrary.xyz/api/v1/telegram/webhook`. Paystack: confirm webhook URL still uses `ohcselibrary.xyz`. |
| **12:00** | Cutover complete | Hit `https://ohcselibrary.xyz` from incognito browser, log in, verify a few flows end-to-end. |

### Failure modes during cutover

- **D1 import fails** → drop new D1, recreate, retry. Old Worker still in maintenance, recoverable: redeploy old Worker to un-maintenance, abort. Time lost: 5 min.
- **R2 final sync fails** → rclone with `--retries=10`. Worst case: re-run from scratch (still <2 min for delta).
- **DNS doesn't propagate fast enough** → users see stale DNS up to 30 min. New Worker also serves on `.workers.dev` URL, so Telegram bot keeps working. Apex/www traffic recovers as caches drain.
- **Critical bug post-cutover** → roll back per Section 7.

### Out of scope for the cutover window

- Deleting old account resources (D+3 to D+7, Section 6)
- Removing `pages.dev` OAuth redirect URIs from Google Console
- Deleting old Resend API key and old Google Drive client secret

---

## Section 5 — GitHub Auto-Deploy Setup

Two systems, two mechanisms. Both run off `master` branch in `github.com/ghwmelite-dotcom/ohcs-elibrary`. Set up immediately after cutover (T+24h or so, once new account is verified stable).

### Frontend → Cloudflare Pages (native Git integration)

1. New account dashboard → Workers & Pages → `ohcs-elibrary` → Settings → Builds & deployments → **Connect to Git**
2. Authorize Cloudflare's GitHub app for `ghwmelite-dotcom/ohcs-elibrary`
3. Production branch: `master`
4. Build command: `npm run build`
5. Build output directory: `dist`
6. Build environment variables:
   - `VITE_API_URL` = `https://api.ohcselibrary.xyz`
   - `NODE_VERSION` = `20`
7. Preview branches: enable for `feature/*` and `develop` — every PR gets a preview URL

After this: `git push origin master` → Pages builds → live in 2–4 min. Zero CI config in the repo.

### Backend → Workers via GitHub Actions

Cloudflare's Workers Builds Git integration is less mature than Pages. Use the standard pattern: `cloudflare/wrangler-action@v3`.

**New file: `.github/workflows/deploy-worker.yml`**

```yaml
name: Deploy Worker
on:
  push:
    branches: [master]
    paths: ['workers/**']
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: workers
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: workers
          command: deploy
```

**GitHub repo secrets needed** (Settings → Secrets → Actions):

- `CLOUDFLARE_API_TOKEN` — new account's API token (Workers Edit + D1 + R2 + KV scopes)
- `CLOUDFLARE_ACCOUNT_ID` — `f4f236a6cd8fbddf397c6e9de17d8113`

**Path filter (`paths: ['workers/**']`)** — frontend-only changes don't trigger Worker redeploys.

End state: edit code → push → Pages auto-builds frontend, Action auto-deploys Worker, both live within ~4 min. No more manual `wrangler deploy` or `wrangler pages deploy`.

---

## Section 6 — Old Account Decommissioning

Wait period: **minimum D+3, ideal D+7** after cutover.

### Pre-deletion checklist

- [ ] No errors in new account Worker logs for 48+ hours
- [ ] Email delivery confirmed (test send, verify arrival)
- [ ] Document upload + download tested end-to-end on new account
- [ ] Cron triggers verified running on new account (Workers → Logs)
- [ ] Telegram bot responding via new webhook URL
- [ ] Paystack test transaction processed successfully
- [ ] Resend domain (`notify.ohcselibrary.xyz`) showing "verified" in new Resend account
- [ ] DNS records resolving correctly (`dig api.ohcselibrary.xyz` from a fresh terminal)

### Deletion order

Each step destructive and irreversible. Explicit user confirmation required before each.

| # | Resource | Mechanism |
|---|---|---|
| 1 | Old `ohcs-elibrary-api` Worker | `wrangler delete` (in `workers/`, with old account token) |
| 2 | Old `ohcs-elibrary` Pages project | Dashboard delete or `wrangler pages project delete ohcs-elibrary` |
| 3 | Old `CACHE` KV namespace (`747355109d8a4b63a45a116b9c3208b1`) | `wrangler kv namespace delete --namespace-id=...` |
| 4 | Old `ohcs-documents` R2 bucket | Empty first: `rclone delete r2-old:ohcs-documents`, then `wrangler r2 bucket delete ohcs-documents` |
| 5 | Old `ohcs-elibrary` D1 database (`2aa38a9e-e5e1-4e7a-a48e-f8edf7cc741d`) | `wrangler d1 delete ohcs-elibrary` — last and most permanent, kept until D+7 |
| 6 | OAuth `pages.dev` redirect URIs | Manual cleanup in Google Cloud Console |
| 7 | Old Google Drive OAuth secret `****_jhv` | Delete in Google Cloud Console |
| 8 | Old Resend API key | Revoke in Resend dashboard |

### Out of scope

GitHub repo, Google Cloud project (only OAuth client cleanup within), Paystack account, Resend account, Telegram bot — all account-independent. The empty old Cloudflare account itself is left untouched (zero-cost fallback).

---

## Section 7 — Rollback Plan

Rollback time-decays. Truthful map:

| Time after cutover | Feasibility | Method |
|---|---|---|
| **0–5 min** (during cutover) | Trivial | Re-deploy old Worker (un-maintenance), keep zone in old account, abort. Zero data loss. |
| **5 min – 1 hour** | Easy | Move zone back, redeploy old Worker, revert frontend. Lose any writes to new account in that hour. |
| **1 hour – 24 hours** | Painful but doable | Above + reverse data migration: export new D1 → import old, reverse rclone sync. New writes preserved. |
| **24+ hours** | Effectively impossible without data loss | Don't roll back; fix forward. |

### Rollback triggers

- D1 row counts mismatch by >0.1% post-import (abort before flipping DNS)
- New Worker errors >5% of requests during T+0 to T+15 verification
- DNS doesn't propagate within 30 min and users report sustained outage
- Authentication broken on new account

### Not rollback triggers (fix forward instead)

- Single-feature regressions (e.g., one cron not firing)
- Email delivery delays (DKIM warming up)
- One specific user reporting an issue

---

## Open Items / Out-of-Scope Follow-ups

- **Gmail email path** — re-add `GMAIL_*` secrets after running OAuth flow once. Tracked as a post-migration task.
- **Final secret rotations** — after migration is verified stable, rotate Paystack `sk_live_*` and Resend API key one final time so any values that touched chat transcripts are dead.
- **Custom domain SSL** — Cloudflare provisions Universal SSL automatically when the zone is added. Verify HTTPS is green at T+15.
- **Backup strategy** — current backups (per Backup module) live on old account R2 if any. If applicable, the `ohcs-documents` migration covers it; otherwise add explicit backup migration step during plan creation.

## Acceptance Criteria

Migration is complete when all the following are true:

- `https://ohcselibrary.xyz` loads the application via the new account's Pages project
- `https://api.ohcselibrary.xyz/api/v1/health` (or equivalent health endpoint) returns 200 from the new account's Worker
- A test login + document download succeeds on the new account
- Cron triggers fire on schedule in the new account (verified in logs)
- A test email sends successfully via Resend with FROM `noreply@notify.ohcselibrary.xyz`
- A test Telegram message routes through the new webhook
- A test Paystack callback hits the new account
- `git push origin master` triggers automatic Pages build and Worker deploy
- All resources confirmed deleted from old account (after D+7)

## References

- Old account: `ghwmelite@gmail.com`
- New account: `ohcsghana.main@gmail.com`, ID `f4f236a6cd8fbddf397c6e9de17d8113`
- Repo: `github.com/ghwmelite-dotcom/ohcs-elibrary`
- Domain: `ohcselibrary.xyz` (registered at 3rd-party registrar, currently using Cloudflare nameservers via old account)
