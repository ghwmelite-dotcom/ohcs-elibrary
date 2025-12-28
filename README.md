# OHCS E-Library

**AI-Powered Knowledge Management Platform for Ghana's Civil Service**

[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/ghwmelite-dotcom/ohcs-elibrary)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](#license)
[![Platform](https://img.shields.io/badge/platform-Cloudflare-orange.svg)](https://ohcs-elibrary.pages.dev)

---

## Overview

The OHCS E-Library is a comprehensive digital knowledge management platform designed specifically for Ghana's Office of the Head of Civil Service (OHCS). It provides civil servants with a centralized hub for accessing official documents, sharing knowledge, collaborating with colleagues, and staying informed about government news and policies.

### Key Features

- **Digital Document Library** - Centralized repository for official documents, policies, circulars, and guidelines with AI-powered search and summarization
- **AI-Powered Analysis** - Intelligent document search, automatic summarization, and content analysis using advanced AI
- **Community Forums** - Discussion boards for knowledge sharing, Q&A, and professional discourse
- **Real-Time Chat** - Instant messaging with voice messages, file sharing, and group conversations
- **Groups & Collaboration** - Create and join professional groups for team collaboration
- **Gamification System** - XP points, badges, levels, and leaderboards to encourage engagement
- **News Aggregation** - Curated news from Ghanaian sources relevant to civil service
- **Comprehensive Admin Panel** - Full administrative control over users, content, and system settings

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [System Architecture](#system-architecture)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Features Overview](#features-overview)
6. [API Documentation](#api-documentation)
7. [Deployment](#deployment)
8. [Security](#security)
9. [Contributing](#contributing)
10. [License](#license)
11. [Contact](#contact)

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework with concurrent features |
| TypeScript | Type-safe JavaScript |
| Vite 5 | Build tool and dev server |
| Tailwind CSS | Utility-first CSS framework |
| Framer Motion | Animation library |
| Zustand | State management |
| React Router v6 | Client-side routing |
| React Hook Form | Form handling |
| Zod | Schema validation |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| Cloudflare Workers | Serverless edge computing |
| Hono | Lightweight web framework |
| D1 Database | SQLite-based serverless database |
| R2 Storage | Object storage for documents |
| KV Namespace | Key-value caching |
| Workers AI | AI-powered features |

### Email Services
| Technology | Purpose |
|------------|---------|
| Gmail API | Primary email delivery (OAuth2) |
| Resend API | Fallback email service |

### Design System
- **Primary Colors**: Ghana flag colors (Green #006B3F, Gold #FCD116, Red #CE1126)
- **Accent**: Black Star motif
- **Typography**: System fonts with fallbacks
- **Theme**: Light/Dark mode support

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 React SPA (Vite)                         │    │
│  │  • Pages & Components                                    │    │
│  │  • Zustand State Management                              │    │
│  │  • React Router Navigation                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE LAYER (Cloudflare)                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Cloudflare Pages (Frontend)                 │    │
│  │  • Static asset hosting                                  │    │
│  │  • Global CDN distribution                               │    │
│  │  • Automatic HTTPS                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Cloudflare Workers (API)                    │    │
│  │  • Hono framework                                        │    │
│  │  • JWT authentication                                    │    │
│  │  • Rate limiting                                         │    │
│  │  • CORS handling                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  D1 Database │  │  R2 Storage  │  │  KV Cache    │          │
│  │  (SQLite)    │  │  (Documents) │  │  (Sessions)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │  Workers AI  │  │  Gmail API   │                             │
│  │  (Analysis)  │  │  (Email)     │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Cloudflare account (for deployment)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ghwmelite-dotcom/ohcs-elibrary.git
   cd ohcs-elibrary
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install worker dependencies**
   ```bash
   cd workers
   npm install
   cd ..
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Start worker locally** (in separate terminal)
   ```bash
   cd workers
   npm run dev
   ```

The application will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8787/api/v1
```

For workers, configure `workers/wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "development"
JWT_SECRET = "your-secret-key"
GMAIL_CLIENT_ID = "your-gmail-client-id"
GMAIL_CLIENT_SECRET = "your-gmail-client-secret"
GMAIL_REFRESH_TOKEN = "your-gmail-refresh-token"
RESEND_API_KEY = "your-resend-api-key"
```

---

## Project Structure

```
ohcs-elibrary/
├── public/                     # Static assets
│   ├── icons/                  # App icons (PWA)
│   ├── screenshots/            # App screenshots
│   └── manifest.json           # PWA manifest
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── auth/               # Authentication components
│   │   ├── chat/               # Chat components
│   │   ├── common/             # Shared components
│   │   ├── documents/          # Document components
│   │   ├── forum/              # Forum components
│   │   ├── groups/             # Groups components
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # Base UI components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   ├── pages/                  # Page components
│   │   ├── admin/              # Admin pages
│   │   └── settings/           # Settings pages
│   ├── services/               # API service layers
│   ├── stores/                 # Zustand state stores
│   ├── types/                  # TypeScript type definitions
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles
├── workers/
│   ├── src/
│   │   ├── middleware/         # API middleware
│   │   ├── routes/             # API route handlers
│   │   ├── services/           # Backend services
│   │   └── index.ts            # Worker entry point
│   ├── migrations/             # Database migrations
│   ├── schema.sql              # Database schema
│   └── wrangler.toml           # Cloudflare configuration
├── docs/                       # Documentation
├── package.json                # Frontend dependencies
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
└── README.md                   # This file
```

---

## Features Overview

### 1. Authentication & Authorization

- **Registration** - Email-based registration with .gov.gh domain validation
- **Login** - Secure JWT-based authentication
- **Two-Factor Authentication** - TOTP-based 2FA with backup codes
- **Password Reset** - Email-based or on-screen code reset
- **Role-Based Access Control** - Multiple user roles with granular permissions

#### User Roles
| Role | Description |
|------|-------------|
| `super_admin` | Full system access |
| `admin` | Administrative access |
| `director` | Department director access |
| `librarian` | Document management access |
| `moderator` | Forum/chat moderation access |
| `contributor` | Content creation access |
| `civil_servant` | Standard user access |
| `guest` | Limited read-only access |

### 2. Document Library

- **Upload & Storage** - Support for PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Categorization** - Organize by category, MDA, document type
- **Search** - Full-text search with filters
- **AI Analysis** - Automatic summarization and key point extraction
- **Bookmarks** - Save documents for quick access
- **Version History** - Track document versions

### 3. Forum & Discussions

- **Categories** - Organized discussion categories
- **Topics & Threads** - Create and participate in discussions
- **Voting** - Upvote/downvote system
- **Moderation** - Admin moderation tools
- **Rich Text** - Formatted posts with mentions

### 4. Chat & Messaging

- **Direct Messages** - Private conversations
- **Group Chats** - Multi-user chat rooms
- **Voice Messages** - Record and send voice notes
- **File Sharing** - Share documents in chat
- **Emoji & GIF** - Rich message content
- **Real-time** - Instant message delivery

### 5. Groups & Collaboration

- **Create Groups** - Form professional groups
- **Group Types** - Public, private, or secret groups
- **Posts & Comments** - Group discussion feed
- **Member Management** - Invite and manage members
- **Group Roles** - Owner, admin, moderator, member

### 6. Gamification

- **XP Points** - Earn points for activities
- **Levels** - Progress through levels
- **Badges** - Unlock achievement badges
- **Leaderboard** - Compete with colleagues
- **Challenges** - Complete challenges for rewards

### 7. News Aggregation

- **Ghanaian Sources** - News from local media
- **Categories** - Filter by topic
- **AI Summaries** - Quick article summaries
- **Bookmarking** - Save articles
- **Sharing** - Share with colleagues

### 8. Admin Panel

- **Dashboard** - System overview and analytics
- **User Management** - Manage all users
- **Document Management** - Approve and manage documents
- **Forum Moderation** - Moderate discussions
- **Analytics** - Usage statistics
- **System Settings** - Configure platform settings
- **Audit Log** - Track all system activities

---

## API Documentation

The API is RESTful and follows standard conventions. Base URL: `/api/v1`

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/logout` | User logout |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with code |
| POST | `/auth/verify-email` | Verify email address |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user |
| PUT | `/users/me` | Update current user |
| GET | `/users/:id` | Get user by ID |

### Document Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | List documents |
| POST | `/documents` | Upload document |
| GET | `/documents/:id` | Get document |
| PUT | `/documents/:id` | Update document |
| DELETE | `/documents/:id` | Delete document |
| GET | `/documents/:id/download` | Download document |
| POST | `/documents/:id/analyze` | AI analysis |

### Forum Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/forum/categories` | List categories |
| GET | `/forum/topics` | List topics |
| POST | `/forum/topics` | Create topic |
| GET | `/forum/topics/:id` | Get topic |
| POST | `/forum/topics/:id/replies` | Add reply |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chat/rooms` | List chat rooms |
| POST | `/chat/rooms` | Create room |
| GET | `/chat/rooms/:id/messages` | Get messages |
| POST | `/chat/rooms/:id/messages` | Send message |

### Groups Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/groups` | List groups |
| POST | `/groups` | Create group |
| GET | `/groups/:id` | Get group |
| POST | `/groups/:id/join` | Join group |
| POST | `/groups/:id/posts` | Create post |

For complete API documentation, see [docs/API.md](docs/API.md)

---

## Deployment

### Frontend (Cloudflare Pages)

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages**
   ```bash
   npx wrangler pages deploy dist --project-name=ohcs-elibrary
   ```

### Backend (Cloudflare Workers)

1. **Configure wrangler.toml** with your bindings

2. **Deploy the worker**
   ```bash
   cd workers
   npm run deploy
   ```

3. **Run database migrations**
   ```bash
   npx wrangler d1 execute ohcs-elibrary --file=schema.sql
   npx wrangler d1 execute ohcs-elibrary --file=migrations/0002_add_email_verification_columns.sql
   ```

For complete deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## Security

### Authentication
- JWT-based authentication with secure token handling
- Password hashing using SHA-256
- Two-factor authentication (TOTP)
- Secure session management

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- API endpoint protection

### Data Protection
- HTTPS encryption in transit
- Encrypted storage at rest
- Secure file upload handling
- Input validation and sanitization

### Best Practices
- CORS configuration
- Rate limiting
- SQL injection prevention
- XSS protection
- CSRF protection

---

## Contributing

This is a proprietary project for the Office of the Head of Civil Service, Ghana. Contributions are limited to authorized personnel only.

### Development Guidelines

1. Follow TypeScript best practices
2. Write clean, documented code
3. Follow the existing code style
4. Test thoroughly before committing
5. Use meaningful commit messages

---

## License

**Proprietary License**

Copyright (c) 2025 Office of the Head of Civil Service, Ghana. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, modification, or use of this software, via any medium, is strictly prohibited without the express written permission of the Office of the Head of Civil Service, Ghana.

---

## Contact

**Developer:** Osborn Hodges
**Role:** Full Stack Developer
**Email:** davies.hodges@ohcs.gov.gh

**Organization:** Office of the Head of Civil Service
**Location:** Accra, Ghana
**Website:** [https://ohcs-elibrary.pages.dev](https://ohcs-elibrary.pages.dev)

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | December 28, 2025 | Initial release |

For detailed changelog, see [CHANGELOG.md](CHANGELOG.md)

---

*Built with pride for Ghana's Civil Service*
