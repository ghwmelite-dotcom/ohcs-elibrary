# OHCS E-Library - Deployment Guide

**Version:** 1.0.0
**Last Updated:** December 28, 2025
**Author:** Osborn Hodges

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cloudflare Account Setup](#cloudflare-account-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Database Setup](#database-setup)
6. [Storage Configuration](#storage-configuration)
7. [Email Service Setup](#email-service-setup)
8. [Environment Configuration](#environment-configuration)
9. [Domain Configuration](#domain-configuration)
10. [SSL/TLS Configuration](#ssltls-configuration)
11. [Monitoring & Logging](#monitoring--logging)
12. [Troubleshooting](#troubleshooting)
13. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Accounts
- **Cloudflare Account** - Free or paid plan
- **GitHub Account** - For source code repository
- **Google Cloud Account** - For Gmail API (optional)
- **Resend Account** - For email service (optional fallback)

### Required Tools
```bash
# Node.js 18+
node --version  # v18.0.0 or higher

# npm 9+
npm --version   # 9.0.0 or higher

# Git
git --version

# Wrangler CLI (Cloudflare)
npm install -g wrangler
wrangler --version
```

### Local Development
Ensure you can build the project locally before deploying:

```bash
# Clone repository
git clone https://github.com/ghwmelite-dotcom/ohcs-elibrary.git
cd ohcs-elibrary

# Install dependencies
npm install
cd workers && npm install && cd ..

# Test build
npm run build
```

---

## Cloudflare Account Setup

### 1. Create Cloudflare Account
1. Visit [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up with your organization email
3. Verify email address

### 2. Authenticate Wrangler
```bash
# Login to Cloudflare via CLI
wrangler login

# Verify authentication
wrangler whoami
```

### 3. Create API Token (Optional)
For CI/CD pipelines:
1. Go to **Profile** → **API Tokens**
2. Click **Create Token**
3. Use "Edit Cloudflare Workers" template
4. Add permissions:
   - Account: Cloudflare Pages (Edit)
   - Account: Workers R2 Storage (Edit)
   - Account: D1 (Edit)
   - Account: Workers KV Storage (Edit)
5. Save the token securely

---

## Frontend Deployment

### Option 1: Manual Deployment

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=ohcs-elibrary
```

### Option 2: Cloudflare Pages Dashboard

1. Go to **Workers & Pages** in Cloudflare Dashboard
2. Click **Create Application** → **Pages**
3. Connect to GitHub repository
4. Configure build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave empty)
5. Set environment variables:
   ```
   NODE_VERSION=18
   VITE_API_URL=https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1
   ```
6. Click **Save and Deploy**

### Option 3: GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ohcs-elibrary
          directory: dist
```

---

## Backend Deployment

### 1. Configure wrangler.toml

```toml
name = "ohcs-elibrary-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Account configuration
account_id = "your-account-id"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "ohcs-elibrary"
database_id = "your-database-id"

# R2 Storage binding
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "ohcs-elibrary-storage"

# KV Namespace binding
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# AI binding
[ai]
binding = "AI"

# Environment variables
[vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://ohcs-elibrary.pages.dev"
```

### 2. Create Resources

```bash
cd workers

# Create D1 database
wrangler d1 create ohcs-elibrary
# Copy the database_id to wrangler.toml

# Create R2 bucket
wrangler r2 bucket create ohcs-elibrary-storage

# Create KV namespace
wrangler kv:namespace create CACHE
# Copy the id to wrangler.toml
```

### 3. Set Secrets

```bash
# JWT Secret (generate a secure random string)
wrangler secret put JWT_SECRET
# Enter your secret when prompted

# Gmail API credentials (if using Gmail)
wrangler secret put GMAIL_CLIENT_ID
wrangler secret put GMAIL_CLIENT_SECRET
wrangler secret put GMAIL_REFRESH_TOKEN

# Resend API key (if using Resend)
wrangler secret put RESEND_API_KEY
```

### 4. Deploy Worker

```bash
# Deploy to production
npm run deploy
# or
wrangler deploy
```

### 5. Verify Deployment

```bash
# Check worker status
wrangler tail

# Test health endpoint
curl https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1/health
```

---

## Database Setup

### 1. Run Schema Migration

```bash
cd workers

# Apply main schema
wrangler d1 execute ohcs-elibrary --remote --file=schema.sql

# Apply additional migrations
wrangler d1 execute ohcs-elibrary --remote --file=migrations/0001_initial.sql
wrangler d1 execute ohcs-elibrary --remote --file=migrations/0002_add_email_verification_columns.sql
```

### 2. Verify Tables

```bash
# List tables
wrangler d1 execute ohcs-elibrary --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check users table structure
wrangler d1 execute ohcs-elibrary --remote --command="PRAGMA table_info(users);"
```

### 3. Create Initial Admin User

```bash
# Generate password hash (use the application's hash function)
# Then insert via D1

wrangler d1 execute ohcs-elibrary --remote --command="
INSERT INTO users (id, email, passwordHash, firstName, lastName, role, status, emailVerified, createdAt)
VALUES (
  'admin-001',
  'admin@ohcs.gov.gh',
  'YOUR_HASHED_PASSWORD',
  'Admin',
  'User',
  'super_admin',
  'active',
  1,
  datetime('now')
);"
```

### 4. Database Backup

```bash
# Export database
wrangler d1 export ohcs-elibrary --remote --output=backup.sql

# Import database (restore)
wrangler d1 execute ohcs-elibrary --remote --file=backup.sql
```

---

## Storage Configuration

### R2 Bucket Setup

```bash
# Create bucket
wrangler r2 bucket create ohcs-elibrary-storage

# Configure CORS (if needed for direct uploads)
wrangler r2 bucket cors put ohcs-elibrary-storage --rules='[
  {
    "allowedOrigins": ["https://ohcs-elibrary.pages.dev"],
    "allowedMethods": ["GET", "PUT", "POST"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]'
```

### Storage Structure

```
ohcs-elibrary-storage/
├── documents/           # Document files
│   ├── {document-id}/
│   │   └── {filename}
├── avatars/             # User profile pictures
│   └── {user-id}.jpg
├── groups/              # Group files
│   ├── {group-id}/
│   │   └── {filename}
└── chat/                # Chat attachments
    └── {room-id}/
        └── {filename}
```

---

## Email Service Setup

### Option 1: Gmail API (Recommended)

#### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "OHCS E-Library"
3. Enable Gmail API

#### 2. Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **Internal** (for organization) or **External**
3. Fill in application details
4. Add scope: `https://www.googleapis.com/auth/gmail.send`

#### 3. Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Create **OAuth client ID**
3. Application type: **Web application**
4. Add authorized redirect URI: `https://developers.google.com/oauthplayground`
5. Save Client ID and Client Secret

#### 4. Get Refresh Token
1. Go to [OAuth Playground](https://developers.google.com/oauthplayground)
2. Click settings gear → Enable "Use your own OAuth credentials"
3. Enter Client ID and Secret
4. Select scope: `https://www.googleapis.com/auth/gmail.send`
5. Authorize and exchange code for tokens
6. Copy the Refresh Token

#### 5. Configure Worker
```bash
wrangler secret put GMAIL_CLIENT_ID
wrangler secret put GMAIL_CLIENT_SECRET
wrangler secret put GMAIL_REFRESH_TOKEN
```

### Option 2: Resend API (Fallback)

1. Sign up at [resend.com](https://resend.com)
2. Create API key
3. Verify sending domain (optional)
4. Configure worker:
```bash
wrangler secret put RESEND_API_KEY
```

---

## Environment Configuration

### Production Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name | `production` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://ohcs-elibrary.pages.dev` |
| `JWT_SECRET` | JWT signing secret | (secure random string) |
| `GMAIL_CLIENT_ID` | Gmail OAuth client ID | `xxxxxx.apps.googleusercontent.com` |
| `GMAIL_CLIENT_SECRET` | Gmail OAuth secret | `GOCSPX-xxxxx` |
| `GMAIL_REFRESH_TOKEN` | Gmail refresh token | `1//xxxxx` |
| `RESEND_API_KEY` | Resend API key | `re_xxxxx` |

### Frontend Environment Variables

Create `.env.production`:
```env
VITE_API_URL=https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1
```

---

## Domain Configuration

### 1. Add Custom Domain (Pages)

1. Go to **Workers & Pages** → **ohcs-elibrary**
2. Click **Custom domains**
3. Add domain: `library.ohcs.gov.gh`
4. Update DNS records as instructed

### 2. Add Custom Domain (Workers)

1. Go to **Workers & Pages** → **ohcs-elibrary-api**
2. Click **Triggers** → **Custom Domains**
3. Add domain: `api.library.ohcs.gov.gh`

### 3. DNS Configuration

Add these DNS records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | library | ohcs-elibrary.pages.dev | Yes |
| CNAME | api.library | ohcs-elibrary-api.ghwmelite.workers.dev | Yes |

---

## SSL/TLS Configuration

Cloudflare provides automatic SSL/TLS:

1. Go to **SSL/TLS** in Cloudflare dashboard
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

### Edge Certificates
- Automatically provisioned and renewed
- Universal SSL included free

---

## Monitoring & Logging

### 1. Worker Analytics

Access via Cloudflare Dashboard:
- **Workers & Pages** → **ohcs-elibrary-api** → **Metrics**
- View: Requests, CPU time, Duration, Errors

### 2. Real-time Logs

```bash
# Tail worker logs
wrangler tail

# Filter by status
wrangler tail --status=error

# Filter by search term
wrangler tail --search="auth"
```

### 3. Custom Logging

The application logs to console, viewable via `wrangler tail`:

```typescript
// Logs are automatically captured
console.log('User logged in:', userId);
console.error('Authentication failed:', error);
```

### 4. Uptime Monitoring

Set up health checks:
- Endpoint: `https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1/health`
- Frequency: Every 5 minutes
- Alert on: Status != 200

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

#### 2. Worker Deployment Errors

```bash
# Check wrangler configuration
wrangler whoami
wrangler config

# Verify bindings
wrangler d1 list
wrangler r2 bucket list
wrangler kv:namespace list
```

#### 3. Database Connection Issues

```bash
# Test database connection
wrangler d1 execute ohcs-elibrary --remote --command="SELECT 1;"

# Check database exists
wrangler d1 list
```

#### 4. CORS Errors

Verify CORS configuration in worker:
```typescript
// Ensure CORS_ORIGIN matches frontend URL exactly
app.use('*', cors({
  origin: env.CORS_ORIGIN || 'https://ohcs-elibrary.pages.dev',
  credentials: true,
}));
```

#### 5. Email Delivery Issues

Gmail API troubleshooting:
```bash
# Verify credentials are set
wrangler secret list

# Check refresh token validity
# If expired, regenerate via OAuth Playground
```

### Logs and Debugging

```bash
# Real-time worker logs
wrangler tail --format=pretty

# Filter errors only
wrangler tail --status=error

# Search for specific patterns
wrangler tail --search="database error"
```

---

## Rollback Procedures

### Frontend Rollback

```bash
# List deployments
wrangler pages deployment list --project-name=ohcs-elibrary

# Rollback to specific deployment
wrangler pages deployment rollback --project-name=ohcs-elibrary --deployment-id=<id>
```

### Worker Rollback

```bash
# Workers automatically keep versions
# Rollback via dashboard or redeploy previous commit

git checkout <previous-commit>
cd workers
wrangler deploy
```

### Database Rollback

```bash
# Restore from backup
wrangler d1 execute ohcs-elibrary --remote --file=backup.sql
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally
- [ ] Build completes without errors
- [ ] Environment variables configured
- [ ] Secrets set in Cloudflare
- [ ] Database migrations applied
- [ ] R2 bucket created and configured
- [ ] KV namespace created
- [ ] CORS origins updated
- [ ] Custom domains configured
- [ ] SSL/TLS enabled
- [ ] Health endpoint accessible
- [ ] Email service tested
- [ ] Admin user created
- [ ] Monitoring configured

---

## Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://ohcs-elibrary.pages.dev |
| API | https://ohcs-elibrary-api.ghwmelite.workers.dev |
| Health Check | https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1/health |

---

**Document Version:** 1.0.0
**Last Updated:** December 28, 2025
**Maintained by:** Osborn Hodges (davies.hodges@ohcs.gov.gh)
