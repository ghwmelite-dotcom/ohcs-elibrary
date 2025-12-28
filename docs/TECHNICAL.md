# Technical Architecture Documentation

**OHCS E-Library - Technical Specification**

**Version:** 1.0.0
**Date:** December 28, 2025
**Author:** Osborn Hodges

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Design](#database-design)
5. [Authentication System](#authentication-system)
6. [Email Service](#email-service)
7. [File Storage](#file-storage)
8. [AI Integration](#ai-integration)
9. [Caching Strategy](#caching-strategy)
10. [Security Architecture](#security-architecture)
11. [Performance Optimization](#performance-optimization)
12. [Monitoring & Logging](#monitoring--logging)

---

## System Overview

### Architecture Pattern

The OHCS E-Library follows a **JAMstack architecture** with:
- **J**avaScript: React frontend with TypeScript
- **A**PIs: RESTful API on Cloudflare Workers
- **M**arkup: Pre-rendered static content

### Infrastructure

```
                    ┌─────────────────────┐
                    │   Cloudflare CDN    │
                    │   (Global Edge)     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Cloudflare      │ │ Cloudflare  │ │ Cloudflare  │
    │ Pages           │ │ Workers     │ │ R2          │
    │ (Frontend)      │ │ (API)       │ │ (Storage)   │
    └─────────────────┘ └──────┬──────┘ └─────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
    │ D1 Database     │ │ KV Store    │ │ Workers AI  │
    │ (SQLite)        │ │ (Cache)     │ │ (Analysis)  │
    └─────────────────┘ └─────────────┘ └─────────────┘
```

### Key Design Decisions

1. **Edge Computing**: All backend logic runs on Cloudflare's edge network for low latency
2. **Serverless**: No traditional servers to manage; fully serverless architecture
3. **Single Page Application**: React SPA with client-side routing
4. **Type Safety**: Full TypeScript coverage for reliability
5. **Component-Based**: Modular, reusable UI components

---

## Frontend Architecture

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React | 18.2.0 |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 5.4.x |
| Styling | Tailwind CSS | 3.4.x |
| Animation | Framer Motion | 11.x |
| State | Zustand | 4.x |
| Routing | React Router | 6.x |
| Forms | React Hook Form | 7.x |
| Validation | Zod | 3.x |

### State Management

Zustand stores are organized by domain:

```typescript
// Store Structure
src/stores/
├── authStore.ts        // Authentication state
├── libraryStore.ts     // Document library state
├── forumStore.ts       // Forum discussions state
├── chatStore.ts        // Chat/messaging state
├── groupsStore.ts      // Groups state
├── gamificationStore.ts // XP, badges, levels
├── newsStore.ts        // News aggregation state
├── notificationStore.ts // Notifications
├── themeStore.ts       // Theme preferences
└── settingsStore.ts    // User settings
```

### Component Architecture

```
src/components/
├── ui/                 # Base UI primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Card.tsx
│   └── ...
├── common/             # Shared components
│   ├── EmptyState.tsx
│   ├── LoadingSpinner.tsx
│   ├── Pagination.tsx
│   └── ...
├── layout/             # Layout components
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── MainLayout.tsx
└── [feature]/          # Feature-specific components
    ├── auth/
    ├── documents/
    ├── forum/
    ├── chat/
    └── groups/
```

### Routing Structure

```typescript
// Route Hierarchy
/                       // Landing page
├── /dashboard          // User dashboard
├── /library            // Document library
│   ├── /library/:id    // Document view
│   └── /library/upload // Upload document
├── /forum              // Forum home
│   ├── /forum/category/:id
│   └── /forum/topic/:id
├── /chat               // Chat interface
├── /groups             // Groups list
│   └── /groups/:id     // Group detail
├── /news               // News feed
├── /leaderboard        // Gamification
├── /profile/:id        // User profile
├── /settings           // User settings
│   ├── /settings/profile
│   ├── /settings/security
│   └── /settings/notifications
├── /admin              // Admin panel
│   ├── /admin/dashboard
│   ├── /admin/users
│   ├── /admin/documents
│   └── /admin/...
├── /reset-password     // Password reset
└── /verify-email       // Email verification
```

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress' }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'animation': ['framer-motion'],
          'forms': ['react-hook-form', '@hookform/resolvers'],
          'state': ['zustand'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
});
```

---

## Backend Architecture

### Cloudflare Workers

The API is built on Cloudflare Workers using the Hono framework:

```typescript
// Worker Structure
workers/src/
├── index.ts            // Entry point, middleware setup
├── middleware/
│   ├── auth.ts         // JWT authentication
│   └── rateLimit.ts    // Rate limiting
├── routes/
│   ├── auth.ts         // Authentication endpoints
│   ├── documents.ts    // Document management
│   ├── forum.ts        // Forum endpoints
│   ├── chat.ts         // Chat endpoints
│   ├── groups.ts       // Groups endpoints
│   ├── news.ts         // News aggregation
│   ├── notifications.ts
│   ├── settings.ts
│   └── gamification.ts
└── services/
    ├── emailService.ts // Email delivery
    └── newsAggregator.ts // News scraping
```

### Request Flow

```
Request → CORS → Logger → Rate Limiter → Auth → Route Handler → Response
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │   D1/R2/KV  │
                                    │  (Storage)  │
                                    └─────────────┘
```

### Middleware Stack

1. **Logger**: Request/response logging
2. **CORS**: Cross-origin resource sharing
3. **Rate Limiter**: Request rate limiting
4. **Auth Middleware**: JWT verification
5. **Error Handler**: Global error handling

### API Response Format

```typescript
// Success Response
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}

// Error Response
{
  "error": "Error Type",
  "message": "Human-readable message",
  "code": "ERROR_CODE"
}
```

---

## Database Design

### D1 Database (SQLite)

#### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   documents  │       │    mdas      │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │    ┌──│ id (PK)      │
│ email        │  │    │ title        │    │  │ name         │
│ passwordHash │  │    │ description  │    │  │ code         │
│ displayName  │  ├────│ uploadedBy   │    │  │ type         │
│ role         │  │    │ mdaId        │────┘  └──────────────┘
│ mdaId        │──┘    │ categoryId   │────┐
│ ...          │       │ ...          │    │  ┌──────────────┐
└──────────────┘       └──────────────┘    └──│  categories  │
       │                                      ├──────────────┤
       │                                      │ id (PK)      │
       │               ┌──────────────┐       │ name         │
       │               │ forum_topics │       │ description  │
       │               ├──────────────┤       └──────────────┘
       └───────────────│ authorId     │
                       │ categoryId   │
                       │ title        │
                       │ ...          │
                       └──────────────┘
```

#### Core Tables

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  displayName TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  avatar TEXT,
  bio TEXT,
  role TEXT DEFAULT 'civil_servant',
  mdaId TEXT REFERENCES mdas(id),
  department TEXT,
  jobTitle TEXT,
  gradeLevel TEXT,
  phone TEXT,
  location TEXT,
  isVerified INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  verificationCode TEXT,
  verificationExpires TEXT,
  resetCode TEXT,
  resetToken TEXT,
  resetExpires TEXT,
  lastLoginAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  fileName TEXT NOT NULL,
  fileSize INTEGER,
  mimeType TEXT,
  storagePath TEXT NOT NULL,
  categoryId TEXT REFERENCES document_categories(id),
  mdaId TEXT REFERENCES mdas(id),
  uploadedBy TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  accessLevel TEXT DEFAULT 'internal',
  viewCount INTEGER DEFAULT 0,
  downloadCount INTEGER DEFAULT 0,
  aiSummary TEXT,
  aiKeyPoints TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id),
  token TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Two-Factor Authentication
CREATE TABLE user_2fa (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE REFERENCES users(id),
  secret TEXT NOT NULL,
  isEnabled INTEGER DEFAULT 0,
  backupCodes TEXT,
  backupCodesUsed INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_documents_category ON documents(categoryId);
CREATE INDEX idx_documents_mda ON documents(mdaId);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(userId);
```

---

## Authentication System

### JWT Token Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────▶│  Login  │────▶│  Server │
└─────────┘     └─────────┘     └────┬────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │ Validate │    │ Generate │    │  Store   │
              │ Password │    │   JWT    │    │ Session  │
              └──────────┘    └──────────┘    └──────────┘
                                     │
                                     ▼
                              ┌──────────┐
                              │  Return  │
                              │  Tokens  │
                              └──────────┘
```

### Token Structure

```typescript
// Access Token Payload
{
  sub: "user-id",
  email: "user@example.gov.gh",
  role: "civil_servant",
  exp: 1234567890  // 24 hours
}

// Refresh Token Payload
{
  sub: "user-id",
  type: "refresh",
  exp: 1234567890  // 7 days
}
```

### Two-Factor Authentication

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Login  │────▶│ Check   │────▶│ 2FA     │
│         │     │  2FA    │     │ Required│
└─────────┘     └─────────┘     └────┬────┘
                                     │
                              ┌──────┴──────┐
                              │             │
                              ▼             ▼
                        ┌──────────┐  ┌──────────┐
                        │   TOTP   │  │  Backup  │
                        │   Code   │  │   Code   │
                        └──────────┘  └──────────┘
                              │             │
                              └──────┬──────┘
                                     ▼
                              ┌──────────┐
                              │  Verify  │
                              │ & Login  │
                              └──────────┘
```

### Password Requirements

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## Email Service

### Gmail API Integration

```typescript
// Email Service Flow
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────▶│   Gmail     │────▶│   Resend    │
│   Email     │     │   API       │     │   Fallback  │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                    ┌──────┴──────┐     ┌──────┴──────┐
                    │   OAuth2    │     │   API Key   │
                    │   Token     │     │   Auth      │
                    └─────────────┘     └─────────────┘
```

### Email Templates

| Template | Purpose |
|----------|---------|
| Verification | Email verification with 6-digit code |
| Password Reset | Password reset with code and link |
| Welcome | New user welcome email |
| Login Notification | New login alert |
| Admin Notification | New user registration alert |

### MIME Format

```
From: OHCS E-Library <ohcselibrary@gmail.com>
To: user@example.gov.gh
Subject: Your Password Reset Code
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

[HTML Content]
```

---

## File Storage

### R2 Bucket Structure

```
ohcs-documents/
├── documents/
│   ├── {document-id}/
│   │   ├── original.pdf
│   │   └── thumbnail.png
├── avatars/
│   └── {user-id}.jpg
├── chat/
│   └── {room-id}/
│       └── {message-id}.{ext}
└── groups/
    └── {group-id}/
        └── {post-id}/
            └── {attachment-id}.{ext}
```

### Upload Process

```
Client → Presigned URL → R2 Upload → DB Record → Response
   │                                      │
   └──────────────────────────────────────┘
         File metadata & validation
```

### Supported File Types

| Category | Extensions | Max Size |
|----------|------------|----------|
| Documents | PDF, DOC, DOCX | 50MB |
| Spreadsheets | XLS, XLSX | 25MB |
| Presentations | PPT, PPTX | 50MB |
| Images | JPG, PNG, GIF | 10MB |
| Audio | MP3, WAV | 25MB |

---

## AI Integration

### Workers AI

Used for document analysis and summarization:

```typescript
// AI Analysis Flow
Document Upload → Text Extraction → AI Processing → Store Results
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │ Summary     │
                                   │ Key Points  │
                                   │ Categories  │
                                   └─────────────┘
```

### AI Features

1. **Document Summarization**: Generate concise summaries
2. **Key Point Extraction**: Identify main points
3. **Category Suggestion**: Auto-categorize documents
4. **News Summarization**: Summarize news articles

---

## Caching Strategy

### KV Namespace

```typescript
// Cache Keys
session:{token}         // Session data (7 days)
rate:{ip}:{endpoint}    // Rate limit counters (1 minute)
user:{id}               // User profile cache (1 hour)
news:articles           // News articles cache (15 minutes)
```

### Cache Invalidation

- **Time-based**: TTL expiration
- **Event-based**: Invalidate on updates
- **Manual**: Admin clear cache option

---

## Security Architecture

### Defense Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare DDoS Protection                │
├─────────────────────────────────────────────────────────────┤
│                    Rate Limiting                             │
├─────────────────────────────────────────────────────────────┤
│                    CORS Policy                               │
├─────────────────────────────────────────────────────────────┤
│                    JWT Authentication                        │
├─────────────────────────────────────────────────────────────┤
│                    Role-Based Access Control                 │
├─────────────────────────────────────────────────────────────┤
│                    Input Validation (Zod)                    │
├─────────────────────────────────────────────────────────────┤
│                    Parameterized Queries                     │
└─────────────────────────────────────────────────────────────┘
```

### Security Headers

```typescript
// Security headers applied
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': '...'
}
```

---

## Performance Optimization

### Frontend

1. **Code Splitting**: Route-based lazy loading
2. **Compression**: Gzip and Brotli
3. **Image Optimization**: WebP format, lazy loading
4. **Caching**: Service worker, browser cache

### Backend

1. **Edge Computing**: Global edge deployment
2. **Database Indexes**: Optimized queries
3. **Response Caching**: KV-based caching
4. **Connection Pooling**: D1 connection reuse

### Metrics

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| API Response Time | < 200ms |
| Lighthouse Score | > 90 |

---

## Monitoring & Logging

### Logging Strategy

```typescript
// Log Levels
console.log()   // Info
console.warn()  // Warning
console.error() // Error
```

### Audit Logging

```sql
-- Account activity logging
CREATE TABLE account_activity (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  description TEXT,
  status TEXT,
  riskLevel TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);
```

### Monitored Events

| Event | Risk Level |
|-------|------------|
| Successful Login | Low |
| Failed Login | Medium |
| Password Change | Medium |
| 2FA Enabled/Disabled | Medium |
| Role Change | High |
| Account Deactivation | High |

---

## Appendix

### Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | JWT signing secret |
| `GMAIL_CLIENT_ID` | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Google OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | Gmail API refresh token |
| `RESEND_API_KEY` | Resend API key (fallback) |
| `ENVIRONMENT` | development/staging/production |

### Cloudflare Bindings

| Binding | Type | Purpose |
|---------|------|---------|
| `DB` | D1 | Primary database |
| `DOCUMENTS` | R2 | File storage |
| `CACHE` | KV | Caching layer |
| `AI` | AI | AI features |

---

*Document Version: 1.0.0*
*Last Updated: December 28, 2025*
*Author: Osborn Hodges*
