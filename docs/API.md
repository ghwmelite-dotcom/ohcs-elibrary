# API Documentation

**OHCS E-Library RESTful API Reference**

**Version:** 1.0.0
**Base URL:** `https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1`
**Date:** December 28, 2025
**Author:** Osborn Hodges

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
   - [Auth](#auth-endpoints)
   - [Users](#user-endpoints)
   - [Documents](#document-endpoints)
   - [Forum](#forum-endpoints)
   - [Chat](#chat-endpoints)
   - [Groups](#group-endpoints)
   - [News](#news-endpoints)
   - [Gamification](#gamification-endpoints)
   - [Notifications](#notification-endpoints)
   - [Settings](#settings-endpoints)
   - [Admin](#admin-endpoints)

---

## Overview

The OHCS E-Library API is a RESTful API that provides access to all platform features. All requests and responses use JSON format.

### Base URL

```
Production: https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1
Development: http://localhost:8787/api/v1
```

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `Authorization` | For protected routes | `Bearer {access_token}` |

### Response Format

All responses follow this structure:

```json
// Success
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}

// Single item
{
  "id": "...",
  "field": "value",
  ...
}

// Error
{
  "error": "Error Type",
  "message": "Human-readable description"
}
```

---

## Authentication

### JWT Tokens

The API uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Short-lived (24 hours), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### Authentication Flow

```
1. POST /auth/login → Receive access_token + refresh_token
2. Use access_token in Authorization header
3. When expired, POST /auth/refresh with refresh_token
4. Receive new access_token
```

### Protected Routes

Most endpoints require authentication. Include the token in the header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| General API | 100 requests | 1 minute |
| File Upload | 10 requests | 1 minute |

### Rate Limit Response

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Response

```json
{
  "error": "Validation Error",
  "message": "Email is required",
  "code": "VALIDATION_ERROR"
}
```

---

## Endpoints

---

## Auth Endpoints

### Register

Create a new user account.

```http
POST /auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@mda.gov.gh",
  "password": "SecurePass123!@#",
  "mda": "mda-id-optional"
}
```

**Validation:**
- `email`: Must be a valid .gov.gh email address
- `password`: Min 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char

**Response (201):**

```json
{
  "message": "Registration successful! Welcome to OHCS E-Library.",
  "user": {
    "id": "uuid",
    "email": "john.doe@mda.gov.gh",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "role": "civil_servant"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### Login

Authenticate user and receive tokens.

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "john.doe@mda.gov.gh",
  "password": "SecurePass123!@#",
  "totpCode": "123456"  // Optional, for 2FA
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "john.doe@mda.gov.gh",
    "name": "John Doe",
    "displayName": "John Doe",
    "avatar": "https://...",
    "role": "civil_servant",
    "department": "IT",
    "title": "Developer"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**2FA Required Response (200):**

```json
{
  "requires2FA": true,
  "tempToken": "eyJ...",
  "message": "Two-factor authentication required"
}
```

---

### Verify 2FA

Complete login with 2FA code.

```http
POST /auth/login/verify-2fa
```

**Request Body:**

```json
{
  "tempToken": "eyJ...",
  "code": "123456",
  "useBackupCode": false
}
```

**Response (200):** Same as login success response.

---

### Forgot Password

Request password reset code.

```http
POST /auth/forgot-password
```

**Request Body:**

```json
{
  "email": "john.doe@mda.gov.gh"
}
```

**Response (200):**

```json
{
  "message": "Your password reset code is ready.",
  "resetCode": "123456",
  "email": "john.doe@mda.gov.gh",
  "expiresIn": "1 hour",
  "emailSent": true
}
```

---

### Reset Password

Reset password with code.

```http
POST /auth/reset-password
```

**Request Body:**

```json
{
  "email": "john.doe@mda.gov.gh",
  "code": "123456",
  "password": "NewSecurePass123!@#"
}
```

**Response (200):**

```json
{
  "message": "Password reset successfully! You can now log in with your new password."
}
```

---

### Verify Email

Verify email address with code.

```http
POST /auth/verify-email
```

**Request Body:**

```json
{
  "email": "john.doe@mda.gov.gh",
  "code": "123456"
}
```

**Response (200):**

```json
{
  "message": "Email verified successfully! Welcome to OHCS E-Library.",
  "user": { ... },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### Resend Verification

Resend email verification code.

```http
POST /auth/resend-verification
```

**Request Body:**

```json
{
  "email": "john.doe@mda.gov.gh"
}
```

**Response (200):**

```json
{
  "message": "If an unverified account exists, a new code will be sent."
}
```

---

### Refresh Token

Get new access token using refresh token.

```http
POST /auth/refresh
```

**Headers:**

```
Authorization: Bearer {refresh_token}
```

**Response (200):**

```json
{
  "accessToken": "eyJ..."
}
```

---

### Logout

Invalidate current session.

```http
POST /auth/logout
```

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

## User Endpoints

### Get Current User

Get authenticated user's profile.

```http
GET /users/me
```

**Response (200):**

```json
{
  "id": "uuid",
  "email": "john.doe@mda.gov.gh",
  "displayName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://...",
  "bio": "Software developer...",
  "role": "civil_servant",
  "department": "IT",
  "title": "Senior Developer",
  "phone": "+233...",
  "location": "Accra",
  "gradeLevel": "Deputy Director",
  "mda": "Ministry of Communications",
  "isVerified": true,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### Update Current User

Update authenticated user's profile.

```http
PUT /users/me
```

**Request Body:**

```json
{
  "displayName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Updated bio",
  "department": "IT Department",
  "jobTitle": "Senior Developer",
  "phone": "+233123456789",
  "location": "Accra, Ghana"
}
```

**Response (200):**

```json
{
  "success": true
}
```

---

### Get User by ID

Get public profile of a user.

```http
GET /users/:id
```

**Response (200):**

```json
{
  "id": "uuid",
  "displayName": "John Doe",
  "avatar": "https://...",
  "bio": "...",
  "role": "civil_servant",
  "department": "IT",
  "title": "Senior Developer",
  "gradeLevel": "Deputy Director",
  "mda": "Ministry of Communications",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

## Document Endpoints

### List Documents

Get paginated list of documents.

```http
GET /documents
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `category` | string | Filter by category ID |
| `mda` | string | Filter by MDA ID |
| `search` | string | Search query |
| `status` | string | Filter by status |
| `sort` | string | Sort field |
| `order` | string | asc or desc |

**Response (200):**

```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "Document Title",
      "description": "...",
      "fileName": "document.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "category": "Policies",
      "mda": "OHCS",
      "uploadedBy": {
        "id": "uuid",
        "displayName": "John Doe"
      },
      "status": "approved",
      "viewCount": 150,
      "downloadCount": 50,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### Get Document

Get single document details.

```http
GET /documents/:id
```

**Response (200):**

```json
{
  "id": "uuid",
  "title": "Document Title",
  "description": "Full description...",
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "storagePath": "documents/uuid/original.pdf",
  "category": {
    "id": "uuid",
    "name": "Policies"
  },
  "mda": {
    "id": "uuid",
    "name": "OHCS"
  },
  "uploadedBy": {
    "id": "uuid",
    "displayName": "John Doe",
    "avatar": "https://..."
  },
  "status": "approved",
  "accessLevel": "internal",
  "viewCount": 150,
  "downloadCount": 50,
  "aiSummary": "This document covers...",
  "aiKeyPoints": ["Point 1", "Point 2"],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

---

### Upload Document

Upload a new document.

```http
POST /documents
Content-Type: multipart/form-data
```

**Form Data:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Document file |
| `title` | string | Document title |
| `description` | string | Document description |
| `categoryId` | string | Category ID |
| `accessLevel` | string | public, internal, restricted |

**Response (201):**

```json
{
  "id": "uuid",
  "title": "New Document",
  "message": "Document uploaded successfully"
}
```

---

### Download Document

Get download URL for document.

```http
GET /documents/:id/download
```

**Response (200):**

```json
{
  "url": "https://...",
  "expiresAt": "2025-01-01T01:00:00Z"
}
```

---

### Analyze Document

Run AI analysis on document.

```http
POST /documents/:id/analyze
```

**Response (200):**

```json
{
  "summary": "This document discusses...",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "suggestedCategories": ["Policy", "Guidelines"]
}
```

---

### Get Categories

Get document categories.

```http
GET /documents/categories
```

**Response (200):**

```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Policies",
      "description": "Official policies",
      "documentCount": 45
    }
  ]
}
```

---

## Forum Endpoints

### Get Categories

Get forum categories.

```http
GET /forum/categories
```

**Response (200):**

```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "General Discussion",
      "description": "General topics",
      "icon": "MessageSquare",
      "color": "#006B3F",
      "topicCount": 150,
      "postCount": 1200
    }
  ]
}
```

---

### Get Topics

Get topics in a category.

```http
GET /forum/topics
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | string | Filter by category |
| `page` | number | Page number |
| `limit` | number | Items per page |
| `sort` | string | latest, popular, unanswered |

**Response (200):**

```json
{
  "topics": [
    {
      "id": "uuid",
      "title": "Topic Title",
      "content": "Topic content...",
      "author": {
        "id": "uuid",
        "displayName": "John Doe",
        "avatar": "https://..."
      },
      "category": {
        "id": "uuid",
        "name": "General"
      },
      "replyCount": 25,
      "viewCount": 500,
      "voteCount": 15,
      "isPinned": false,
      "isLocked": false,
      "lastReplyAt": "2025-01-01T00:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### Create Topic

Create new forum topic.

```http
POST /forum/topics
```

**Request Body:**

```json
{
  "title": "Topic Title",
  "content": "Topic content with details...",
  "categoryId": "uuid",
  "tags": ["tag1", "tag2"]
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "title": "Topic Title",
  "message": "Topic created successfully"
}
```

---

### Get Topic Details

Get topic with replies.

```http
GET /forum/topics/:id
```

**Response (200):**

```json
{
  "topic": {
    "id": "uuid",
    "title": "Topic Title",
    "content": "Full content...",
    "author": { ... },
    "category": { ... },
    "replyCount": 25,
    "viewCount": 501,
    "voteCount": 15,
    "userVote": 1,
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "replies": [
    {
      "id": "uuid",
      "content": "Reply content...",
      "author": { ... },
      "voteCount": 5,
      "userVote": 0,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Add Reply

Add reply to topic.

```http
POST /forum/topics/:id/replies
```

**Request Body:**

```json
{
  "content": "Reply content..."
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "message": "Reply added successfully"
}
```

---

### Vote on Topic/Reply

Vote on a topic or reply.

```http
POST /forum/topics/:id/vote
POST /forum/replies/:id/vote
```

**Request Body:**

```json
{
  "vote": 1  // 1 for upvote, -1 for downvote, 0 to remove
}
```

**Response (200):**

```json
{
  "voteCount": 16,
  "userVote": 1
}
```

---

## Chat Endpoints

### Get Rooms

Get user's chat rooms.

```http
GET /chat/rooms
```

**Response (200):**

```json
{
  "rooms": [
    {
      "id": "uuid",
      "name": "Project Discussion",
      "type": "group",
      "avatar": "https://...",
      "lastMessage": {
        "content": "Last message...",
        "sender": "John",
        "timestamp": "2025-01-01T00:00:00Z"
      },
      "unreadCount": 5,
      "members": 10
    }
  ]
}
```

---

### Create Room

Create new chat room.

```http
POST /chat/rooms
```

**Request Body:**

```json
{
  "name": "Room Name",
  "type": "group",
  "members": ["user-id-1", "user-id-2"],
  "description": "Room description"
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "name": "Room Name",
  "type": "group"
}
```

---

### Get Messages

Get messages in a room.

```http
GET /chat/rooms/:id/messages
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `before` | string | Message ID for pagination |
| `limit` | number | Number of messages |

**Response (200):**

```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "Message content",
      "type": "text",
      "sender": {
        "id": "uuid",
        "displayName": "John Doe",
        "avatar": "https://..."
      },
      "attachments": [],
      "reactions": [],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "hasMore": true
}
```

---

### Send Message

Send message to room.

```http
POST /chat/rooms/:id/messages
```

**Request Body:**

```json
{
  "content": "Message content",
  "type": "text",
  "attachments": []
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "content": "Message content",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

## Group Endpoints

### List Groups

Get all groups.

```http
GET /groups
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | public, private |
| `search` | string | Search query |
| `joined` | boolean | Only joined groups |

**Response (200):**

```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "Group Name",
      "description": "Group description",
      "avatar": "https://...",
      "type": "public",
      "memberCount": 50,
      "postCount": 200,
      "isJoined": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Group

Create new group.

```http
POST /groups
```

**Request Body:**

```json
{
  "name": "Group Name",
  "description": "Group description",
  "type": "public",
  "avatar": "https://..."
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "name": "Group Name",
  "message": "Group created successfully"
}
```

---

### Get Group

Get group details.

```http
GET /groups/:id
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "Group Name",
  "description": "Full description",
  "avatar": "https://...",
  "banner": "https://...",
  "type": "public",
  "memberCount": 50,
  "postCount": 200,
  "isJoined": true,
  "role": "member",
  "owner": {
    "id": "uuid",
    "displayName": "Owner Name"
  },
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### Join/Leave Group

```http
POST /groups/:id/join
POST /groups/:id/leave
```

**Response (200):**

```json
{
  "message": "Successfully joined group"
}
```

---

### Get Group Posts

```http
GET /groups/:id/posts
```

**Response (200):**

```json
{
  "posts": [
    {
      "id": "uuid",
      "content": "Post content",
      "author": { ... },
      "likeCount": 10,
      "commentCount": 5,
      "isLiked": true,
      "attachments": [],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Post

```http
POST /groups/:id/posts
```

**Request Body:**

```json
{
  "content": "Post content",
  "attachments": []
}
```

---

## News Endpoints

### Get Articles

```http
GET /news/articles
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Category slug |
| `source` | string | Source ID |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response (200):**

```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "Article Title",
      "summary": "Article summary...",
      "content": "Full content...",
      "source": {
        "id": "uuid",
        "name": "Ghana News"
      },
      "category": "Politics",
      "imageUrl": "https://...",
      "publishedAt": "2025-01-01T00:00:00Z",
      "aiSummary": "AI-generated summary..."
    }
  ],
  "pagination": { ... }
}
```

---

### Get Categories

```http
GET /news/categories
```

---

### Get Sources

```http
GET /news/sources
```

---

## Gamification Endpoints

### Get User Stats

```http
GET /gamification/stats
```

**Response (200):**

```json
{
  "xp": 2500,
  "level": 5,
  "rank": 42,
  "badges": [
    {
      "id": "uuid",
      "name": "First Post",
      "description": "Created first forum post",
      "icon": "Award",
      "earnedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "streak": 7,
  "activeDays": 30
}
```

---

### Get Leaderboard

```http
GET /gamification/leaderboard
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | weekly, monthly, allTime |
| `limit` | number | Number of users |

**Response (200):**

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user": {
        "id": "uuid",
        "displayName": "Top User",
        "avatar": "https://..."
      },
      "xp": 5000,
      "level": 10
    }
  ]
}
```

---

## Notification Endpoints

### Get Notifications

```http
GET /notifications
```

**Response (200):**

```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "forum_reply",
      "title": "New Reply",
      "message": "Someone replied to your topic",
      "link": "/forum/topic/uuid",
      "isRead": false,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

---

### Mark as Read

```http
PUT /notifications/:id/read
PUT /notifications/read-all
```

---

## Settings Endpoints

### Get Settings

```http
GET /settings
```

**Response (200):**

```json
{
  "notifications": {
    "email": true,
    "push": true,
    "forumReplies": true,
    "chatMessages": true,
    "documentUpdates": true
  },
  "privacy": {
    "profileVisibility": "public",
    "showEmail": false,
    "showPhone": false
  },
  "display": {
    "theme": "light",
    "language": "en"
  }
}
```

---

### Update Settings

```http
PUT /settings
```

**Request Body:**

```json
{
  "notifications": {
    "email": true,
    "push": false
  }
}
```

---

### Two-Factor Authentication

```http
POST /settings/2fa/setup     // Get QR code
POST /settings/2fa/verify    // Verify and enable
POST /settings/2fa/disable   // Disable 2FA
GET  /settings/2fa/backup    // Get backup codes
```

---

### Sessions

```http
GET    /settings/sessions    // List active sessions
DELETE /settings/sessions/:id // Revoke session
```

---

## Admin Endpoints

*Requires admin role*

### Dashboard

```http
GET /admin/dashboard
```

**Response (200):**

```json
{
  "stats": {
    "totalUsers": 500,
    "activeUsers": 120,
    "totalDocuments": 1000,
    "pendingDocuments": 15,
    "forumTopics": 300,
    "totalPosts": 5000
  },
  "recentActivity": [ ... ],
  "trends": { ... }
}
```

---

### User Management

```http
GET    /admin/users              // List users
GET    /admin/users/:id          // Get user
PUT    /admin/users/:id          // Update user
PUT    /admin/users/:id/role     // Change role
PUT    /admin/users/:id/status   // Activate/deactivate
DELETE /admin/users/:id          // Delete user
```

---

### Document Management

```http
GET    /admin/documents              // List all documents
PUT    /admin/documents/:id/status   // Approve/reject
DELETE /admin/documents/:id          // Delete document
```

---

### Audit Log

```http
GET /admin/audit-log
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Filter by user |
| `action` | string | Filter by action |
| `from` | date | Start date |
| `to` | date | End date |

---

## Webhooks

*Coming soon*

---

## SDKs

*Coming soon*

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 28, 2025 | Initial release |

---

*API Documentation v1.0.0*
*Last Updated: December 28, 2025*
*Author: Osborn Hodges*
