# OHCS E-Library - Administrator Guide

**Version:** 1.0.0
**Last Updated:** December 28, 2025
**Author:** Osborn Hodges

---

## Overview

This guide is for administrators responsible for managing the OHCS E-Library platform. It covers user management, content moderation, system configuration, and maintenance procedures.

---

## Table of Contents

1. [Admin Roles & Permissions](#admin-roles--permissions)
2. [Accessing the Admin Panel](#accessing-the-admin-panel)
3. [Dashboard Overview](#dashboard-overview)
4. [User Management](#user-management)
5. [Document Management](#document-management)
6. [Forum Moderation](#forum-moderation)
7. [Chat & Groups Management](#chat--groups-management)
8. [Gamification Management](#gamification-management)
9. [System Settings](#system-settings)
10. [Analytics & Reports](#analytics--reports)
11. [Audit Logs](#audit-logs)
12. [Email Management](#email-management)
13. [Security Management](#security-management)
14. [Backup & Recovery](#backup--recovery)
15. [Troubleshooting](#troubleshooting)

---

## Admin Roles & Permissions

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| `super_admin` | 1 | Full system access, can manage other admins |
| `admin` | 2 | Administrative access, can manage users and content |
| `director` | 3 | Department-level access, can manage department users |
| `librarian` | 4 | Document management access |
| `moderator` | 5 | Forum and chat moderation access |
| `contributor` | 6 | Content creation access |
| `civil_servant` | 7 | Standard user access |
| `guest` | 8 | Limited read-only access |

### Permission Matrix

| Permission | Super Admin | Admin | Director | Librarian | Moderator |
|------------|:-----------:|:-----:|:--------:|:---------:|:---------:|
| Manage all users | ✓ | ✓ | - | - | - |
| Manage department users | ✓ | ✓ | ✓ | - | - |
| Manage admins | ✓ | - | - | - | - |
| Manage documents | ✓ | ✓ | ✓ | ✓ | - |
| Approve documents | ✓ | ✓ | ✓ | ✓ | - |
| Delete documents | ✓ | ✓ | - | - | - |
| Moderate forums | ✓ | ✓ | ✓ | - | ✓ |
| Moderate chat | ✓ | ✓ | - | - | ✓ |
| Manage groups | ✓ | ✓ | ✓ | - | ✓ |
| System settings | ✓ | ✓ | - | - | - |
| View analytics | ✓ | ✓ | ✓ | ✓ | - |
| View audit logs | ✓ | ✓ | - | - | - |
| Manage gamification | ✓ | ✓ | - | - | - |

---

## Accessing the Admin Panel

### URL
```
https://ohcs-elibrary.pages.dev/admin
```

### Requirements
- Active admin account (role: super_admin, admin, director, librarian, or moderator)
- Valid session (logged in)

### Navigation
1. Log in to the main application
2. Click on your profile avatar
3. Select **Admin Panel** from the dropdown
4. Or navigate directly to `/admin`

---

## Dashboard Overview

The admin dashboard provides a high-level overview of platform activity.

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Total Users** | All registered users |
| **Active Users** | Users active in last 30 days |
| **Documents** | Total documents in library |
| **Pending Approvals** | Documents awaiting review |
| **Forum Topics** | Total discussion topics |
| **Active Groups** | Groups with recent activity |

### Charts & Graphs

- **User Growth**: New registrations over time
- **Document Uploads**: Upload trends by week/month
- **Engagement**: Forum posts, chat messages, group activity
- **Popular Content**: Most viewed documents and discussions

### Quick Actions

From the dashboard, quickly:
- Approve pending documents
- Review flagged content
- View new user registrations
- Access system alerts

---

## User Management

### Viewing Users

1. Navigate to **Admin** → **Users**
2. View user list with:
   - Name and email
   - Role and status
   - Registration date
   - Last login
   - XP and level

### Filtering Users

Filter by:
- **Status**: Active, Inactive, Suspended, Pending
- **Role**: Any role
- **Department/MDA**: Specific department
- **Date Range**: Registration date

### Searching Users

Search by:
- Email address
- First or last name
- User ID

### User Actions

#### View User Profile
1. Click on user name or **View** button
2. See complete user information
3. View activity history

#### Edit User
1. Click **Edit** on user row
2. Modify:
   - Personal information
   - Role assignment
   - Department/MDA
   - Status
3. Click **Save Changes**

#### Change User Role
1. Click **Edit** on user row
2. Select new role from dropdown
3. Confirm role change
4. User receives notification

#### Suspend User
1. Click **Actions** → **Suspend**
2. Enter suspension reason
3. Select duration (temporary or permanent)
4. Confirm suspension
5. User cannot log in during suspension

#### Activate User
1. Click **Actions** → **Activate**
2. Confirm activation
3. User can now log in

#### Delete User
1. Click **Actions** → **Delete**
2. Confirm deletion (irreversible)
3. User data is anonymized per policy

#### Reset User Password
1. Click **Actions** → **Reset Password**
2. New password is generated or sent via email
3. User must change on next login

### Bulk Actions

1. Select multiple users via checkboxes
2. Choose action from **Bulk Actions** dropdown:
   - Activate selected
   - Suspend selected
   - Change role
   - Send notification
3. Confirm action

### Creating Users

1. Click **Add User**
2. Enter user details:
   - Email (required)
   - First name (required)
   - Last name (required)
   - Role
   - Department/MDA
3. Choose:
   - Send welcome email
   - Set temporary password
   - Require email verification
4. Click **Create User**

---

## Document Management

### Document Queue

1. Navigate to **Admin** → **Documents**
2. View tabs:
   - **All Documents**: Complete library
   - **Pending Review**: Awaiting approval
   - **Flagged**: Reported documents
   - **Rejected**: Previously rejected

### Approving Documents

1. Go to **Pending Review** tab
2. Click on document to preview
3. Review:
   - Document content
   - Metadata accuracy
   - Category appropriateness
   - File quality
4. Click **Approve** or **Reject**
5. If rejecting, provide reason

### Document Details

View and edit:
- **Title**: Document name
- **Description**: Summary
- **Category**: Classification
- **MDA**: Associated department
- **Tags**: Search keywords
- **Access Level**: Public, Department, Restricted

### Document Actions

| Action | Description |
|--------|-------------|
| **View** | Open document viewer |
| **Download** | Download original file |
| **Edit** | Modify metadata |
| **Feature** | Pin to homepage |
| **Archive** | Move to archive |
| **Delete** | Permanently remove |

### Managing Categories

1. Navigate to **Admin** → **Documents** → **Categories**
2. View existing categories
3. Add new category:
   - Name
   - Description
   - Parent category (optional)
   - Icon
4. Edit or delete categories

### Document Analytics

View per document:
- View count
- Download count
- Bookmark count
- AI analysis requests
- User feedback

---

## Forum Moderation

### Moderation Queue

1. Navigate to **Admin** → **Forum**
2. View:
   - **All Topics**: All discussions
   - **Reported**: Flagged content
   - **Spam**: Auto-detected spam

### Moderating Topics

#### Pin Topic
1. Click **Actions** → **Pin**
2. Topic stays at top of category

#### Lock Topic
1. Click **Actions** → **Lock**
2. No new replies allowed

#### Move Topic
1. Click **Actions** → **Move**
2. Select destination category

#### Delete Topic
1. Click **Actions** → **Delete**
2. Confirm deletion
3. All replies are also deleted

### Moderating Replies

1. Click on topic to view replies
2. For each reply:
   - **Edit**: Modify content
   - **Delete**: Remove reply
   - **Warn User**: Send warning

### Handling Reports

1. View reported content in queue
2. Review the report:
   - Original content
   - Reporter's reason
   - Context
3. Take action:
   - **Dismiss**: Report unfounded
   - **Warn**: Issue warning to author
   - **Remove**: Delete content
   - **Ban**: Suspend author from forum

### Managing Categories

1. Navigate to **Admin** → **Forum** → **Categories**
2. Add, edit, or delete categories
3. Set category permissions:
   - Who can view
   - Who can post
   - Who can moderate

---

## Chat & Groups Management

### Chat Moderation

1. Navigate to **Admin** → **Chat**
2. View reported messages
3. Actions:
   - Delete message
   - Warn user
   - Mute user (temporary)
   - Ban from chat

### Groups Management

1. Navigate to **Admin** → **Groups**
2. View all groups with:
   - Name and type
   - Member count
   - Activity level
   - Creation date

### Group Actions

| Action | Description |
|--------|-------------|
| **View** | See group details and members |
| **Edit** | Modify group settings |
| **Feature** | Promote on discover page |
| **Archive** | Make read-only |
| **Delete** | Remove group permanently |

### Managing Group Members

1. Open group details
2. View member list
3. Actions:
   - Change member role
   - Remove member
   - Transfer ownership

---

## Gamification Management

### XP Configuration

1. Navigate to **Admin** → **Gamification** → **XP Settings**
2. Configure XP for activities:

| Activity | Default XP | Configurable |
|----------|-----------|--------------|
| Daily login | 10 | ✓ |
| Document upload | 50 | ✓ |
| Document approved | 25 | ✓ |
| Forum topic | 25 | ✓ |
| Forum reply | 10 | ✓ |
| Upvote received | 5 | ✓ |
| Badge earned | 100 | ✓ |

### Badge Management

1. Navigate to **Admin** → **Gamification** → **Badges**
2. View all badges
3. Create new badge:
   - Name
   - Description
   - Icon
   - Criteria (automatic or manual)
   - XP reward

### Award Manual Badge

1. Go to **Users** → Select user
2. Click **Award Badge**
3. Select badge
4. Add note (optional)
5. Confirm

### Leaderboard Settings

Configure:
- Leaderboard visibility
- Time periods (daily, weekly, monthly, all-time)
- Categories to include
- Reset schedule

---

## System Settings

### General Settings

1. Navigate to **Admin** → **Settings** → **General**
2. Configure:
   - Site name
   - Site description
   - Default language
   - Timezone
   - Date format

### Email Settings

Configure email service:
- Primary method (Gmail API)
- Fallback method (Resend)
- From address
- Reply-to address
- Email templates

### Security Settings

1. Navigate to **Admin** → **Settings** → **Security**
2. Configure:
   - Password requirements
   - Session timeout
   - Two-factor authentication
   - Login attempt limits
   - IP restrictions

### Feature Toggles

Enable/disable features:
- Forum
- Chat
- Groups
- Gamification
- AI features
- Document uploads

### Maintenance Mode

1. Navigate to **Admin** → **Settings** → **Maintenance**
2. Enable maintenance mode:
   - Set message to display
   - Allow admin access
   - Set expected duration
3. Disable when maintenance complete

---

## Analytics & Reports

### User Analytics

View:
- Registration trends
- Active users over time
- User retention rates
- Role distribution
- Department breakdown

### Content Analytics

View:
- Document upload trends
- Most viewed documents
- Download statistics
- Category popularity
- Search analytics

### Engagement Analytics

View:
- Forum activity
- Chat usage
- Group engagement
- Feature adoption

### Generating Reports

1. Navigate to **Admin** → **Analytics** → **Reports**
2. Select report type:
   - User activity report
   - Content report
   - Engagement report
   - Custom report
3. Set parameters:
   - Date range
   - Filters
   - Metrics to include
4. Click **Generate**
5. Download as CSV/PDF

---

## Audit Logs

### Viewing Logs

1. Navigate to **Admin** → **Audit Logs**
2. View chronological list of system events

### Log Types

| Type | Events Logged |
|------|---------------|
| **Authentication** | Login, logout, password reset |
| **User Management** | Create, update, delete, role changes |
| **Content** | Document upload, approval, deletion |
| **Moderation** | Content removal, user warnings |
| **System** | Settings changes, maintenance |

### Log Details

Each log entry includes:
- Timestamp
- Action type
- User who performed action
- Target (user, document, etc.)
- IP address
- Details/notes

### Filtering Logs

Filter by:
- Date range
- Action type
- User
- Target
- IP address

### Exporting Logs

1. Apply desired filters
2. Click **Export**
3. Choose format (CSV, JSON)
4. Download file

---

## Email Management

### Email Templates

1. Navigate to **Admin** → **Email** → **Templates**
2. Available templates:
   - Welcome email
   - Password reset
   - Email verification
   - Document approved
   - Document rejected
   - Weekly digest
   - Notification

### Editing Templates

1. Select template
2. Edit:
   - Subject line
   - Body content
   - Variables: `{{userName}}`, `{{siteName}}`, etc.
3. Preview
4. Save changes

### Email Logs

1. Navigate to **Admin** → **Email** → **Logs**
2. View sent emails:
   - Recipient
   - Subject
   - Status (sent, failed, bounced)
   - Timestamp

### Bulk Email

1. Navigate to **Admin** → **Email** → **Compose**
2. Select recipients:
   - All users
   - By role
   - By department
   - Custom list
3. Compose message
4. Preview
5. Send (or schedule)

---

## Security Management

### Active Sessions

1. Navigate to **Admin** → **Security** → **Sessions**
2. View all active sessions
3. Terminate suspicious sessions

### Failed Logins

1. Navigate to **Admin** → **Security** → **Failed Logins**
2. View failed login attempts
3. Identify potential attacks
4. Block IP addresses if needed

### IP Blocking

1. Navigate to **Admin** → **Security** → **IP Blocking**
2. View blocked IPs
3. Add new blocks:
   - Single IP
   - IP range
   - Temporary or permanent
4. Remove blocks

### Two-Factor Authentication

View 2FA adoption:
- Users with 2FA enabled
- Users without 2FA
- Require 2FA for specific roles

---

## Backup & Recovery

### Manual Backup

```bash
# Database backup
wrangler d1 export ohcs-elibrary --remote --output=backup.sql

# R2 storage backup
# Use Cloudflare dashboard or rclone
```

### Scheduled Backups

Configure in Cloudflare:
1. Go to D1 database settings
2. Enable automatic backups
3. Set retention period

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
wrangler d1 execute ohcs-elibrary --remote --file=backup.sql
```

#### User Data Recovery
1. Navigate to **Admin** → **Recovery**
2. Search for deleted content
3. Restore if within retention period

---

## Troubleshooting

### Common Issues

#### Users Cannot Log In
1. Check user status (not suspended)
2. Verify email is verified
3. Check password requirements
4. Review failed login logs

#### Documents Not Uploading
1. Check file size limit (50MB)
2. Verify file type is allowed
3. Check R2 storage status
4. Review error logs

#### Emails Not Sending
1. Check email service configuration
2. Verify API credentials
3. Check email logs for errors
4. Test with manual send

#### Performance Issues
1. Check Cloudflare analytics
2. Review worker CPU usage
3. Check database query performance
4. Consider caching adjustments

### Checking System Health

1. Navigate to **Admin** → **System** → **Health**
2. View status of:
   - API server
   - Database
   - Storage
   - Email service
   - AI service

### Contacting Support

For technical issues:
- Email: support@ohcs.gov.gh
- Include: Error messages, timestamps, steps to reproduce

---

## Administrative Best Practices

### Daily Tasks
- Review pending document approvals
- Check moderation queue
- Monitor system alerts

### Weekly Tasks
- Review user analytics
- Check audit logs for anomalies
- Process user requests

### Monthly Tasks
- Generate usage reports
- Review security logs
- Update system settings as needed
- Verify backup integrity

### Security Guidelines
- Use strong passwords
- Enable 2FA for all admin accounts
- Regularly review user access
- Monitor audit logs
- Keep credentials confidential

---

**Document Version:** 1.0.0
**Last Updated:** December 28, 2025
**Maintained by:** Osborn Hodges (davies.hodges@ohcs.gov.gh)
