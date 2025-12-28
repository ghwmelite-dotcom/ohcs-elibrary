/**
 * Email Service for OHCS E-Library
 * Uses Gmail API for email delivery (better deliverability to government servers)
 * Falls back to Resend API if Gmail fails
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: 'gmail' | 'resend';
}

export interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

// Admin notification email (also the Gmail sender)
const ADMIN_EMAIL = 'ohcselibrary@gmail.com';
const FROM_EMAIL = 'OHCS E-Library <noreply@notify.ohcselibrary.xyz>';

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

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a simple MIME email message (HTML only for simplicity)
 */
function createMimeMessage(options: EmailOptions & { from: string }): string {
  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

  // Simple email format - works better with Gmail API
  const message = [
    `From: ${options.from}`,
    `To: ${to}`,
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
  // Convert to UTF-8 bytes
  const utf8Bytes = new TextEncoder().encode(str);
  // Convert bytes to base64
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  // Convert to base64url
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Send an email using Gmail API
 */
async function sendViaGmail(
  credentials: GmailCredentials,
  options: EmailOptions
): Promise<EmailResult> {
  try {
    const accessToken = await getGmailAccessToken(credentials);

    const mimeMessage = createMimeMessage({
      ...options,
      from: `OHCS E-Library <${ADMIN_EMAIL}>`,
    });

    // Base64url encode the message (UTF-8 safe)
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
      return {
        success: false,
        error: error.error?.message || 'Failed to send via Gmail',
        provider: 'gmail',
      };
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.id,
      provider: 'gmail',
    };
  } catch (error) {
    console.error('Gmail send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Gmail error',
      provider: 'gmail',
    };
  }
}

/**
 * Send an email using Resend API (fallback)
 */
async function sendViaResend(
  apiKey: string,
  options: EmailOptions
): Promise<EmailResult> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo || ADMIN_EMAIL,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send via Resend',
        provider: 'resend',
      };
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.id,
      provider: 'resend',
    };
  } catch (error) {
    console.error('Resend send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'resend',
    };
  }
}

/**
 * Send an email - tries Gmail first, falls back to Resend
 */
export async function sendEmail(
  apiKey: string,
  options: EmailOptions,
  gmailCredentials?: GmailCredentials
): Promise<EmailResult> {
  // Try Gmail first if credentials are provided
  if (gmailCredentials?.clientId && gmailCredentials?.clientSecret && gmailCredentials?.refreshToken) {
    console.log('Attempting to send via Gmail API...');
    const gmailResult = await sendViaGmail(gmailCredentials, options);

    if (gmailResult.success) {
      console.log('Email sent successfully via Gmail');
      return gmailResult;
    }

    console.warn('Gmail failed, falling back to Resend:', gmailResult.error);
  }

  // Fall back to Resend
  if (apiKey) {
    console.log('Sending via Resend...');
    return sendViaResend(apiKey, options);
  }

  return {
    success: false,
    error: 'No email provider configured',
  };
}

/**
 * Send email verification code
 */
export async function sendVerificationEmail(
  apiKey: string,
  email: string,
  displayName: string,
  verificationCode: string,
  gmailCredentials?: GmailCredentials
): Promise<EmailResult> {
  const html = generateVerificationEmailTemplate(displayName, verificationCode);

  return sendEmail(apiKey, {
    to: email,
    subject: 'Verify Your OHCS E-Library Account',
    html,
    text: `Hello ${displayName},\n\nYour verification code is: ${verificationCode}\n\nThis code expires in 15 minutes.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\nOHCS E-Library Team`,
  }, gmailCredentials);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  apiKey: string,
  email: string,
  displayName: string,
  resetToken: string,
  resetUrl: string,
  gmailCredentials?: GmailCredentials
): Promise<EmailResult> {
  const html = generatePasswordResetTemplate(displayName, resetToken, resetUrl);

  return sendEmail(apiKey, {
    to: email,
    subject: 'Reset Your OHCS E-Library Password',
    html,
    text: `Hello ${displayName},\n\nWe received a request to reset your password.\n\nYour reset code is: ${resetToken}\n\nOr click this link: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email or contact support.\n\nBest regards,\nOHCS E-Library Team`,
  }, gmailCredentials);
}

/**
 * Send welcome email after registration
 */
export async function sendWelcomeEmail(
  apiKey: string,
  email: string,
  displayName: string,
  gmailCredentials?: GmailCredentials
): Promise<EmailResult> {
  const html = generateWelcomeEmailTemplate(displayName);

  return sendEmail(apiKey, {
    to: email,
    subject: 'Welcome to OHCS E-Library!',
    html,
    text: `Welcome to OHCS E-Library, ${displayName}!\n\nYour account has been successfully verified. You can now access all features of the platform.\n\nExplore our document library, join discussions, and connect with colleagues across the Ghana Civil Service.\n\nBest regards,\nOHCS E-Library Team`,
  }, gmailCredentials);
}

/**
 * Send login notification for new device/location
 */
export async function sendLoginNotificationEmail(
  apiKey: string,
  email: string,
  displayName: string,
  loginInfo: {
    ipAddress: string;
    userAgent: string;
    timestamp: string;
    location?: string;
  },
  gmailCredentials?: GmailCredentials
): Promise<EmailResult> {
  const html = generateLoginNotificationTemplate(displayName, loginInfo);

  return sendEmail(apiKey, {
    to: email,
    subject: 'New Login to Your OHCS E-Library Account',
    html,
    text: `Hello ${displayName},\n\nWe detected a new login to your account.\n\nTime: ${loginInfo.timestamp}\nIP Address: ${loginInfo.ipAddress}\nDevice: ${loginInfo.userAgent}\n\nIf this wasn't you, please change your password immediately.\n\nBest regards,\nOHCS E-Library Team`,
  }, gmailCredentials);
}

/**
 * Send notification to admin about new registration
 */
export async function sendAdminNewUserNotification(
  apiKey: string,
  newUser: {
    displayName: string;
    email: string;
    department: string;
    mda: string;
    staffId: string;
  },
  gmailCredentials?: GmailCredentials
): Promise<EmailResult> {
  const html = generateAdminNotificationTemplate(newUser);

  return sendEmail(apiKey, {
    to: ADMIN_EMAIL,
    subject: `New User Registration: ${newUser.displayName}`,
    html,
    text: `New user registration:\n\nName: ${newUser.displayName}\nEmail: ${newUser.email}\nStaff ID: ${newUser.staffId}\nMDA: ${newUser.mda}\nDepartment: ${newUser.department}\n\nPlease review this registration in the admin panel.`,
  }, gmailCredentials);
}

// ============ Email Templates ============

function generateVerificationEmailTemplate(displayName: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header with Ghana colors -->
          <tr>
            <td style="background: linear-gradient(135deg, #006B3F 0%, #004d2d 100%); padding: 30px 40px; text-align: center;">
              <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">📚</span>
              </div>
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">OHCS E-Library</h1>
              <p style="margin: 5px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Ghana Civil Service</p>
            </td>
          </tr>

          <!-- Ghana flag stripe -->
          <tr>
            <td>
              <div style="height: 4px; background: linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #FCD116 33.33%, #FCD116 66.66%, #006B3F 66.66%, #006B3F 100%);"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; font-weight: 600;">Verify Your Email</h2>
              <p style="margin: 0 0 25px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
                Hello <strong>${displayName}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
                Thank you for registering with OHCS E-Library. Use the verification code below to complete your registration:
              </p>

              <!-- Verification Code Box -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
                <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <div style="font-size: 36px; font-weight: 700; color: #006B3F; letter-spacing: 8px; font-family: monospace;">
                  ${code}
                </div>
              </div>

              <p style="margin: 0 0 20px; color: #6c757d; font-size: 14px; text-align: center;">
                This code expires in <strong>15 minutes</strong>
              </p>

              <div style="background: #fff8e6; border-left: 4px solid #FCD116; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Didn't request this?</strong><br>
                  If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                Office of the Head of Civil Service
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                © ${new Date().getFullYear()} OHCS E-Library. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generatePasswordResetTemplate(displayName: string, code: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #006B3F 0%, #004d2d 100%); padding: 30px 40px; text-align: center;">
              <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 12px; margin: 0 auto 15px;">
                <span style="font-size: 28px; line-height: 60px;">🔐</span>
              </div>
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Password Reset</h1>
            </td>
          </tr>

          <!-- Ghana flag stripe -->
          <tr>
            <td>
              <div style="height: 4px; background: linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #FCD116 33.33%, #FCD116 66.66%, #006B3F 66.66%, #006B3F 100%);"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 25px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
                Hello <strong>${displayName}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Use the code below or click the button to reset:
              </p>

              <!-- Reset Code Box -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px;">
                <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                <div style="font-size: 32px; font-weight: 700; color: #006B3F; letter-spacing: 6px; font-family: monospace;">
                  ${code}
                </div>
              </div>

              <!-- Reset Button -->
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #006B3F 0%, #004d2d 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="margin: 0 0 20px; color: #6c757d; font-size: 14px; text-align: center;">
                This link expires in <strong>1 hour</strong>
              </p>

              <div style="background: #f8d7da; border-left: 4px solid #CE1126; padding: 15px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #721c24; font-size: 14px;">
                  <strong>Didn't request this?</strong><br>
                  If you didn't request a password reset, please ignore this email or contact support if you're concerned.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                Office of the Head of Civil Service
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                © ${new Date().getFullYear()} OHCS E-Library. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateWelcomeEmailTemplate(displayName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OHCS E-Library</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #006B3F 0%, #004d2d 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Welcome Aboard!</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your account is now verified</p>
            </td>
          </tr>

          <!-- Ghana flag stripe -->
          <tr>
            <td>
              <div style="height: 4px; background: linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #FCD116 33.33%, #FCD116 66.66%, #006B3F 66.66%, #006B3F 100%);"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 25px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
                Hello <strong>${displayName}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
                Welcome to the OHCS E-Library! Your account has been successfully verified and you now have full access to our platform.
              </p>

              <!-- Features -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px; color: #1a1a2e; font-size: 18px;">What you can do:</h3>

                <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                  <span style="width: 24px; height: 24px; background: #e6f4ea; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">📚</span>
                  <span style="color: #4a4a68; font-size: 15px;">Access official documents and policies</span>
                </div>

                <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                  <span style="width: 24px; height: 24px; background: #fff8e6; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">💬</span>
                  <span style="color: #4a4a68; font-size: 15px;">Join discussions in the forum</span>
                </div>

                <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                  <span style="width: 24px; height: 24px; background: #e6f0ff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">🤝</span>
                  <span style="color: #4a4a68; font-size: 15px;">Connect with colleagues across MDAs</span>
                </div>

                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 24px; height: 24px; background: #fce6f4; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">✨</span>
                  <span style="color: #4a4a68; font-size: 15px;">Use AI-powered document analysis</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="https://ohcs-elibrary.pages.dev/dashboard" style="display: inline-block; background: linear-gradient(135deg, #006B3F 0%, #004d2d 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Get Started
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                Office of the Head of Civil Service
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                © ${new Date().getFullYear()} OHCS E-Library. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateLoginNotificationTemplate(
  displayName: string,
  loginInfo: { ipAddress: string; userAgent: string; timestamp: string; location?: string }
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Login Detected</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #006B3F 0%, #004d2d 100%); padding: 30px 40px; text-align: center;">
              <div style="font-size: 36px; margin-bottom: 10px;">🔔</div>
              <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 700;">New Login Detected</h1>
            </td>
          </tr>

          <!-- Ghana flag stripe -->
          <tr>
            <td>
              <div style="height: 4px; background: linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #FCD116 33.33%, #FCD116 66.66%, #006B3F 66.66%, #006B3F 100%);"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 25px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
                Hello <strong>${displayName}</strong>,
              </p>
              <p style="margin: 0 0 25px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
                We detected a new login to your OHCS E-Library account:
              </p>

              <!-- Login Details -->
              <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Time:</td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-size: 14px; font-weight: 500; text-align: right;">${loginInfo.timestamp}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef;">IP Address:</td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-size: 14px; font-weight: 500; text-align: right; border-top: 1px solid #e9ecef;">${loginInfo.ipAddress}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef;">Device:</td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-size: 14px; font-weight: 500; text-align: right; border-top: 1px solid #e9ecef;">${loginInfo.userAgent}</td>
                  </tr>
                  ${loginInfo.location ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef;">Location:</td>
                    <td style="padding: 8px 0; color: #1a1a2e; font-size: 14px; font-weight: 500; text-align: right; border-top: 1px solid #e9ecef;">${loginInfo.location}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <div style="background: #f8d7da; border-left: 4px solid #CE1126; padding: 15px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #721c24; font-size: 14px;">
                  <strong>Wasn't you?</strong><br>
                  If you didn't log in, please <a href="https://ohcs-elibrary.pages.dev/settings/security" style="color: #006B3F; font-weight: 600;">change your password</a> immediately.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                Office of the Head of Civil Service
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                © ${new Date().getFullYear()} OHCS E-Library. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateAdminNotificationTemplate(newUser: {
  displayName: string;
  email: string;
  department: string;
  mda: string;
  staffId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New User Registration</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #006B3F 0%, #004d2d 100%); padding: 30px 40px; text-align: center;">
              <div style="font-size: 36px; margin-bottom: 10px;">👤</div>
              <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 700;">New User Registration</h1>
            </td>
          </tr>

          <!-- Ghana flag stripe -->
          <tr>
            <td>
              <div style="height: 4px; background: linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #FCD116 33.33%, #FCD116 66.66%, #006B3F 66.66%, #006B3F 100%);"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 25px; color: #4a4a68; font-size: 16px; line-height: 1.6;">
                A new user has registered on the OHCS E-Library platform:
              </p>

              <!-- User Details -->
              <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 10px 0; color: #6c757d; font-size: 14px;">Name:</td>
                    <td style="padding: 10px 0; color: #1a1a2e; font-size: 14px; font-weight: 600; text-align: right;">${newUser.displayName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef;">Email:</td>
                    <td style="padding: 10px 0; color: #1a1a2e; font-size: 14px; font-weight: 500; text-align: right; border-top: 1px solid #e9ecef;">${newUser.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef;">Staff ID:</td>
                    <td style="padding: 10px 0; color: #1a1a2e; font-size: 14px; font-weight: 500; text-align: right; border-top: 1px solid #e9ecef;">${newUser.staffId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef;">MDA:</td>
                    <td style="padding: 10px 0; color: #1a1a2e; font-size: 14px; font-weight: 500; text-align: right; border-top: 1px solid #e9ecef;">${newUser.mda}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef;">Department:</td>
                    <td style="padding: 10px 0; color: #1a1a2e; font-size: 14px; font-weight: 500; text-align: right; border-top: 1px solid #e9ecef;">${newUser.department}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="https://ohcs-elibrary.pages.dev/admin/users" style="display: inline-block; background: linear-gradient(135deg, #006B3F 0%, #004d2d 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View in Admin Panel
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                This is an automated notification from OHCS E-Library
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
