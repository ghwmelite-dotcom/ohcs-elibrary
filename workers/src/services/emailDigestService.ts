/**
 * Email Digest Service
 * Handles scheduled email digests for users based on their notification preferences
 * Uses Gmail API exclusively for email delivery
 */

interface Env {
  DB: D1Database;
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;
}

interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface UserDigestData {
  userId: string;
  email: string;
  displayName: string;
  digestFrequency: 'instant' | 'daily' | 'weekly';
  digestTime: string;
  notifications: NotificationForDigest[];
}

interface NotificationForDigest {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  priority: string;
  createdAt: string;
  actorName: string | null;
}

interface DigestResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

// Admin notification email (also the Gmail sender)
const ADMIN_EMAIL = 'ohcselibrary@gmail.com';

/**
 * Get access token from Gmail OAuth refresh token
 */
async function getGmailAccessToken(credentials: GmailCredentials): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get access token: ${error.error_description || error.error}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

/**
 * Create a simple MIME email message
 */
function createMimeMessage(options: { to: string; from: string; subject: string; html: string }): string {
  const message = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    options.html,
  ].join('\r\n');

  return message;
}

/**
 * Base64url encode a string (UTF-8 safe)
 */
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Send an email using Gmail API
 */
async function sendEmailViaGmail(
  credentials: GmailCredentials,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken) {
      console.error('Gmail credentials not configured');
      return false;
    }

    const accessToken = await getGmailAccessToken(credentials);

    const mimeMessage = createMimeMessage({
      to,
      from: `OHCS E-Library <${ADMIN_EMAIL}>`,
      subject,
      html,
    });

    const encodedMessage = base64UrlEncode(mimeMessage);

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Gmail API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Gmail send error:', error);
    return false;
  }
}

/**
 * Process and send email digests for users
 * Should be called by cron job (daily or as needed based on frequency)
 */
export async function processEmailDigests(env: Env, frequency: 'daily' | 'weekly' = 'daily'): Promise<DigestResult> {
  const result: DigestResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get current hour for digest time matching
    const now = new Date();
    const currentHour = now.getUTCHours().toString().padStart(2, '0') + ':00';

    // Get users who have email digest enabled and match the frequency
    const usersQuery = await env.DB.prepare(`
      SELECT
        u.id as userId,
        u.email,
        u.displayName,
        np.emailDigestFrequency as digestFrequency,
        np.emailDigestTime as digestTime,
        np.quietHoursEnabled,
        np.quietHoursStart,
        np.quietHoursEnd
      FROM users u
      INNER JOIN notification_preferences np ON u.id = np.userId
      WHERE np.emailEnabled = 1
        AND np.emailDigestEnabled = 1
        AND np.emailDigestFrequency = ?
        AND u.isActive = 1
        AND u.email IS NOT NULL
    `).bind(frequency).all();

    const users = usersQuery.results || [];
    result.processed = users.length;

    console.log(`Processing ${frequency} digest for ${users.length} users at ${currentHour} UTC`);

    const gmailCreds: GmailCredentials = {
      clientId: env.GMAIL_CLIENT_ID || '',
      clientSecret: env.GMAIL_CLIENT_SECRET || '',
      refreshToken: env.GMAIL_REFRESH_TOKEN || '',
    };

    // Check if Gmail is configured
    if (!gmailCreds.clientId || !gmailCreds.clientSecret || !gmailCreds.refreshToken) {
      console.warn('Gmail credentials not configured, skipping email digests');
      result.errors.push('Gmail credentials not configured');
      return result;
    }

    for (const user of users) {
      const userData = user as any;

      // Skip if not the right time (within 1 hour window)
      const userDigestHour = (userData.digestTime || '08:00').split(':')[0];
      const currentUTCHour = now.getUTCHours().toString().padStart(2, '0');
      if (userDigestHour !== currentUTCHour) {
        result.skipped++;
        continue;
      }

      // Skip if in quiet hours
      if (userData.quietHoursEnabled && isInQuietHours(now, userData.quietHoursStart, userData.quietHoursEnd)) {
        result.skipped++;
        continue;
      }

      try {
        // Get unread notifications since last digest
        const lookbackHours = frequency === 'daily' ? 24 : 168; // 1 day or 7 days
        const notifications = await getUnreadNotifications(env, userData.userId, lookbackHours);

        if (notifications.length === 0) {
          result.skipped++;
          continue;
        }

        // Generate and send digest email
        const emailHtml = generateDigestEmailHtml({
          userId: userData.userId,
          email: userData.email,
          displayName: userData.displayName,
          digestFrequency: userData.digestFrequency,
          digestTime: userData.digestTime,
          notifications,
        });

        const subject = frequency === 'daily'
          ? `Your Daily OHCS E-Library Digest - ${notifications.length} new notification${notifications.length > 1 ? 's' : ''}`
          : `Your Weekly OHCS E-Library Digest - ${notifications.length} new notification${notifications.length > 1 ? 's' : ''}`;

        const success = await sendEmailViaGmail(
          gmailCreds,
          userData.email,
          subject,
          emailHtml
        );

        if (success) {
          result.sent++;
          // Mark notifications as included in digest
          await markNotificationsDigested(env, userData.userId, notifications.map(n => n.id));
          // Log successful digest
          await logDigest(env, userData.userId, frequency, notifications.length, 'sent');
        } else {
          result.failed++;
          result.errors.push(`Failed to send email to ${userData.email}`);
          await logDigest(env, userData.userId, frequency, notifications.length, 'failed', 'Email send failed');
        }
      } catch (userError: any) {
        result.failed++;
        result.errors.push(`Error processing user ${userData.userId}: ${userError.message}`);
        await logDigest(env, userData.userId, frequency, 0, 'failed', userError.message);
      }
    }

    console.log(`Digest processing complete: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`);
    return result;
  } catch (error: any) {
    console.error('Email digest processing error:', error);
    result.errors.push(`Global error: ${error.message}`);
    return result;
  }
}

/**
 * Send an immediate notification email for high-priority notifications
 */
export async function sendImmediateNotificationEmail(
  env: Env,
  userId: string,
  notification: NotificationForDigest
): Promise<boolean> {
  try {
    // Check if user has email enabled and not in quiet hours
    const prefs = await env.DB.prepare(`
      SELECT
        np.emailEnabled,
        np.emailDigestFrequency,
        np.quietHoursEnabled,
        np.quietHoursStart,
        np.quietHoursEnd,
        u.email,
        u.displayName
      FROM notification_preferences np
      INNER JOIN users u ON np.userId = u.id
      WHERE np.userId = ?
    `).bind(userId).first() as any;

    if (!prefs || !prefs.emailEnabled) {
      return false;
    }

    // Skip if user prefers digests (not instant)
    if (prefs.emailDigestFrequency !== 'instant' && notification.priority !== 'urgent') {
      return false;
    }

    // Skip if in quiet hours (unless urgent)
    const now = new Date();
    if (prefs.quietHoursEnabled && notification.priority !== 'urgent') {
      if (isInQuietHours(now, prefs.quietHoursStart, prefs.quietHoursEnd)) {
        return false;
      }
    }

    const gmailCreds: GmailCredentials = {
      clientId: env.GMAIL_CLIENT_ID || '',
      clientSecret: env.GMAIL_CLIENT_SECRET || '',
      refreshToken: env.GMAIL_REFRESH_TOKEN || '',
    };

    if (!gmailCreds.clientId || !gmailCreds.clientSecret || !gmailCreds.refreshToken) {
      console.warn('Gmail credentials not configured');
      return false;
    }

    // Generate email
    const emailHtml = generateImmediateNotificationEmailHtml(notification, prefs.displayName);

    return await sendEmailViaGmail(
      gmailCreds,
      prefs.email,
      notification.title,
      emailHtml
    );
  } catch (error) {
    console.error('Immediate notification email error:', error);
    return false;
  }
}

/**
 * Get unread notifications for a user within the lookback period
 */
async function getUnreadNotifications(
  env: Env,
  userId: string,
  lookbackHours: number
): Promise<NotificationForDigest[]> {
  const result = await env.DB.prepare(`
    SELECT
      n.id,
      n.type,
      n.title,
      n.message,
      n.link,
      n.priority,
      n.createdAt,
      n.actorName
    FROM notifications n
    WHERE n.userId = ?
      AND n.isRead = 0
      AND n.isArchived = 0
      AND n.digestSentAt IS NULL
      AND n.createdAt >= datetime('now', '-' || ? || ' hours')
    ORDER BY n.priority DESC, n.createdAt DESC
    LIMIT 50
  `).bind(userId, lookbackHours).all();

  return (result.results || []) as NotificationForDigest[];
}

/**
 * Mark notifications as having been included in a digest
 */
async function markNotificationsDigested(
  env: Env,
  userId: string,
  notificationIds: string[]
): Promise<void> {
  if (notificationIds.length === 0) return;

  // SQLite doesn't support array binding, so we need to do this differently
  const placeholders = notificationIds.map(() => '?').join(',');
  await env.DB.prepare(`
    UPDATE notifications
    SET digestSentAt = datetime('now')
    WHERE id IN (${placeholders}) AND userId = ?
  `).bind(...notificationIds, userId).run();
}

/**
 * Log digest attempt
 */
async function logDigest(
  env: Env,
  userId: string,
  digestType: string,
  notificationCount: number,
  status: string,
  errorMessage?: string
): Promise<void> {
  try {
    const id = `digest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await env.DB.prepare(`
      INSERT INTO email_digest_logs (id, userId, digestType, notificationCount, status, sentAt, errorMessage)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
    `).bind(id, userId, digestType, notificationCount, status, errorMessage || null).run();
  } catch (error) {
    console.error('Failed to log digest:', error);
  }
}

/**
 * Check if current time is within quiet hours
 */
function isInQuietHours(now: Date, start: string | null, end: string | null): boolean {
  if (!start || !end) return false;

  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes <= endMinutes) {
    // Same day range (e.g., 22:00 - 08:00 would NOT be this)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight range (e.g., 22:00 - 08:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

/**
 * Generate HTML email for digest
 */
function generateDigestEmailHtml(data: UserDigestData): string {
  const { displayName, notifications, digestFrequency } = data;
  const periodText = digestFrequency === 'daily' ? 'today' : 'this week';

  // Group notifications by type
  const grouped: Record<string, NotificationForDigest[]> = {};
  for (const n of notifications) {
    if (!grouped[n.type]) grouped[n.type] = [];
    grouped[n.type].push(n);
  }

  const typeLabels: Record<string, string> = {
    message: 'Messages',
    document: 'Documents',
    forum_reply: 'Forum Replies',
    forum_mention: 'Forum Mentions',
    group_invite: 'Group Invitations',
    group_post: 'Group Posts',
    badge_earned: 'Badges Earned',
    level_up: 'Level Up',
    xp_earned: 'XP Earned',
    system: 'System Notifications',
    announcement: 'Announcements',
    like: 'Likes',
    follow: 'New Followers',
    security: 'Security Alerts',
    connection_request: 'Connection Requests',
    connection_accepted: 'Connections Accepted',
    post_comment: 'Post Comments',
    post_like: 'Post Likes',
    recognition: 'Recognition',
    course_enrolled: 'Course Enrollments',
    course_completed: 'Course Completions',
    event_reminder: 'Event Reminders',
  };

  const typeIcons: Record<string, string> = {
    message: '💬',
    document: '📄',
    forum_reply: '💭',
    forum_mention: '@',
    group_invite: '👥',
    group_post: '📝',
    badge_earned: '🏆',
    level_up: '⬆️',
    xp_earned: '✨',
    system: '🔔',
    announcement: '📢',
    like: '❤️',
    follow: '👤',
    security: '🔒',
    connection_request: '🤝',
    connection_accepted: '✅',
    post_comment: '💬',
    post_like: '❤️',
    recognition: '🌟',
    course_enrolled: '📚',
    course_completed: '🎓',
    event_reminder: '📅',
  };

  let notificationsHtml = '';
  for (const [type, items] of Object.entries(grouped)) {
    const label = typeLabels[type] || type;
    const icon = typeIcons[type] || '📌';

    notificationsHtml += `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #006B3F; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #FCD116; padding-bottom: 5px;">
          ${icon} ${label} (${items.length})
        </h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${items.slice(0, 5).map(item => `
            <li style="padding: 10px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px;">
              <div style="font-weight: 600; color: #333;">${escapeHtml(item.title)}</div>
              <div style="color: #666; font-size: 14px; margin-top: 4px;">${escapeHtml(item.message || '')}</div>
              ${item.link ? `<a href="https://ohcs-elibrary.pages.dev${item.link}" style="color: #006B3F; font-size: 13px; margin-top: 6px; display: inline-block;">View details →</a>` : ''}
            </li>
          `).join('')}
          ${items.length > 5 ? `<li style="padding: 10px; color: #666; font-style: italic;">...and ${items.length - 5} more</li>` : ''}
        </ul>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #006B3F 0%, #004026 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">OHCS E-Library</h1>
      <p style="color: #FCD116; margin: 10px 0 0 0;">Your ${digestFrequency === 'daily' ? 'Daily' : 'Weekly'} Digest</p>
    </div>

    <!-- Ghana Flag Stripe -->
    <div style="height: 4px; background: linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #FCD116 33.33%, #FCD116 66.66%, #006B3F 66.66%, #006B3F 100%);"></div>

    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
        Hello ${escapeHtml(displayName || 'there')},
      </p>
      <p style="color: #666; margin-bottom: 25px;">
        Here's what happened on OHCS E-Library ${periodText}:
      </p>

      <!-- Notification Summary -->
      <div style="background: linear-gradient(135deg, #006B3F 0%, #004026 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 36px; color: #FCD116; font-weight: bold;">${notifications.length}</div>
        <div style="color: white; font-size: 14px;">New Notification${notifications.length > 1 ? 's' : ''}</div>
      </div>

      <!-- Grouped Notifications -->
      ${notificationsHtml}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://ohcs-elibrary.pages.dev/notifications"
           style="background: #006B3F; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          View All Notifications
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 3px solid #FCD116;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        You're receiving this because you enabled email digests.
        <br>
        <a href="https://ohcs-elibrary.pages.dev/settings?section=notifications" style="color: #006B3F;">Manage your notification preferences</a>
      </p>
      <p style="color: #999; font-size: 11px; margin-top: 15px;">
        Office of the Head of Civil Service, Ghana
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML email for immediate notification
 */
function generateImmediateNotificationEmailHtml(notification: NotificationForDigest, displayName: string): string {
  const priorityColors: Record<string, string> = {
    urgent: '#CE1126',
    high: '#FCD116',
    normal: '#006B3F',
    low: '#666',
  };

  const priorityColor = priorityColors[notification.priority] || priorityColors.normal;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #006B3F 0%, #004026 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">OHCS E-Library</h1>
    </div>

    <!-- Ghana Flag Stripe -->
    <div style="height: 4px; background: linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #FCD116 33.33%, #FCD116 66.66%, #006B3F 66.66%, #006B3F 100%);"></div>

    <!-- Priority Indicator -->
    ${notification.priority === 'urgent' || notification.priority === 'high' ? `
    <div style="background: ${priorityColor}; color: white; padding: 8px; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
      ${notification.priority} Priority
    </div>
    ` : ''}

    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
        Hello ${escapeHtml(displayName || 'there')},
      </p>

      <div style="background: #f8f9fa; border-left: 4px solid ${priorityColor}; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
        <h2 style="color: #333; font-size: 18px; margin: 0 0 10px 0;">${escapeHtml(notification.title)}</h2>
        <p style="color: #666; margin: 0;">${escapeHtml(notification.message || '')}</p>
        ${notification.actorName ? `<p style="color: #999; font-size: 13px; margin-top: 10px;">From: ${escapeHtml(notification.actorName)}</p>` : ''}
      </div>

      ${notification.link ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://ohcs-elibrary.pages.dev${notification.link}"
           style="background: #006B3F; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          View Details
        </a>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 3px solid #FCD116;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        <a href="https://ohcs-elibrary.pages.dev/settings?section=notifications" style="color: #006B3F;">Manage notification preferences</a>
      </p>
      <p style="color: #999; font-size: 11px; margin-top: 15px;">
        Office of the Head of Civil Service, Ghana
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
