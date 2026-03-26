import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendAdminNewUserNotification,
  type GmailCredentials,
} from '../services/emailService';
import { logAuthEvent, AuditActions } from '../services/auditService';
import { blacklistToken, hashToken } from '../middleware/auth';

// =====================================================
// AES-GCM Encryption for 2FA Secrets at Rest
// =====================================================

async function encryptSecret(plaintext: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey.slice(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(plaintext)
  );
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const ctHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${ivHex}:${ctHex}`;
}

async function decryptSecret(encrypted: string, encryptionKey: string): Promise<string> {
  const [ivHex, ctHex] = encrypted.split(':');
  if (!ivHex || !ctHex) return encrypted; // Plaintext fallback for legacy data
  // Legacy plaintext secrets won't have a valid hex IV of exactly 24 chars (12 bytes)
  if (ivHex.length !== 24) return encrypted;
  try {
    const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const ct = new Uint8Array(ctHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(encryptionKey.slice(0, 32).padEnd(32, '0')),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyMaterial, ct);
    return new TextDecoder().decode(plaintext);
  } catch {
    // Decryption failed — treat as plaintext (legacy data)
    return encrypted;
  }
}

// Helper to get Gmail credentials from env
function getGmailCredentials(env: any): GmailCredentials | undefined {
  if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN) {
    return {
      clientId: env.GMAIL_CLIENT_ID,
      clientSecret: env.GMAIL_CLIENT_SECRET,
      refreshToken: env.GMAIL_REFRESH_TOKEN,
    };
  }
  return undefined;
}

const authRoutes = new Hono();

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(), // Optional 2FA code
});

const verify2FASchema = z.object({
  tempToken: z.string(),
  code: z.string().length(6),
  useBackupCode: z.boolean().optional(),
});

// =====================================================
// TOTP IMPLEMENTATION (copied from settings for auth)
// =====================================================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(str: string): Uint8Array {
  str = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < str.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(str[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

async function generateTOTPCode(secret: string, counter: number): Promise<string> {
  const key = base32Decode(secret);
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setUint32(0, Math.floor(counter / 0x100000000), false);
  counterView.setUint32(4, counter >>> 0, false);

  const hmac = await hmacSha1(key, new Uint8Array(counterBuffer));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

async function verifyTOTP(secret: string, code: string, windowSize: number = 1): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const step = 30;
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / step);

  for (let i = -windowSize; i <= windowSize; i++) {
    const expectedCode = await generateTOTPCode(secret, counter + i);
    if (expectedCode === code) return true;
  }
  return false;
}

async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<number> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code.toUpperCase()));
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashedCodes.indexOf(hashHex);
}

// Registration schema - synced with frontend validators.ts
const registerSchema = z.object({
  // Support both legacy 'name' field and new firstName/lastName fields
  name: z.string().min(2).optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  email: z.string().email().refine(
    (email) => email.endsWith('.gov.gh'),
    { message: 'Only .gov.gh email addresses are allowed' }
  ),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  staffId: z.string().min(6, 'Staff ID must be at least 6 digits').regex(/^\d+$/, 'Staff ID must contain only numbers').optional(),
  mda: z.string().optional(),
  mdaId: z.string().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  // Cloudflare Turnstile token for bot protection
  turnstileToken: z.string().optional(),
}).refine(
  (data) => data.name || (data.firstName && data.lastName),
  { message: 'Either name or firstName and lastName must be provided' }
);

// Email availability check schema
const checkEmailSchema = z.object({
  email: z.string().email(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(12),
});

const verifyEmailSchema = z.object({
  token: z.string(),
});

// Helper function to hash password using PBKDF2 with random salt
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

// Verify password against stored hash (supports both PBKDF2 and legacy SHA-256)
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.includes(':')) {
    // Legacy SHA-256 hash (no salt) — compare directly
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const legacyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return legacyHash === storedHash;
  }
  const [saltHex, expectedHash] = storedHash.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHash;
}

// Verify Cloudflare Turnstile token
async function verifyTurnstile(token: string, secretKey: string, ip?: string): Promise<boolean> {
  if (!secretKey) {
    // Skip verification if no secret key configured
    return true;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json() as { success: boolean };
    return result.success;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
}

// Rate limiting helper using KV
async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;

  try {
    const current = await kv.get(windowKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: (Math.floor(now / windowSeconds) + 1) * windowSeconds,
      };
    }

    await kv.put(windowKey, (count + 1).toString(), { expirationTtl: windowSeconds * 2 });

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: (Math.floor(now / windowSeconds) + 1) * windowSeconds,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Allow on error to prevent lockout
    return { allowed: true, remaining: limit, resetAt: now + windowSeconds };
  }
}

// Check email availability (for real-time validation during registration)
authRoutes.post('/check-email', zValidator('json', checkEmailSchema), async (c) => {
  const { email } = c.req.valid('json');

  try {
    // Rate limit: 10 checks per minute per IP
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    if (c.env.KV) {
      const rateLimit = await checkRateLimit(c.env.KV, `email-check:${ip}`, 10, 60);
      if (!rateLimit.allowed) {
        return c.json({
          error: 'Rate Limited',
          message: 'Too many requests. Please wait a moment.',
          retryAfter: rateLimit.resetAt - Math.floor(Date.now() / 1000),
        }, 429);
      }
    }

    // Check if email exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email.toLowerCase()).first();

    // Check if it's a valid .gov.gh email
    const isGovEmail = email.toLowerCase().endsWith('.gov.gh');

    return c.json({
      available: !existing,
      isGovEmail,
      message: existing
        ? 'This email is already registered'
        : !isGovEmail
          ? 'Only .gov.gh email addresses are allowed'
          : 'Email is available',
    });
  } catch (error) {
    console.error('Email check error:', error);
    return c.json({
      error: 'Server Error',
      message: 'Unable to check email availability',
    }, 500);
  }
});

// Login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password, totpCode } = c.req.valid('json');

  try {
    // Find user (using deployed DB column names)
    const user = await c.env.DB.prepare(`
      SELECT id, email, passwordHash, displayName, firstName, lastName,
             avatar, role, mdaId, department, jobTitle as title,
             isVerified, isActive, lastLoginAt
      FROM users
      WHERE email = ?
    `).bind(email.toLowerCase()).first();

    if (!user) {
      // Log failed login - user not found
      await logAuthEvent(c.env, AuditActions.AUTH_LOGIN_FAILED, {
        userEmail: email.toLowerCase(),
        ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
        userAgent: c.req.header('User-Agent') || 'unknown',
        success: false,
        errorMessage: 'User not found',
      });

      return c.json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password',
      }, 401);
    }

    // Check if account is active — use generic message to prevent account enumeration
    if (!user.isActive) {
      return c.json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password',
      }, 401);
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash as string);

    if (!passwordValid) {
      // Log failed login attempt
      await logAuthEvent(c.env, AuditActions.AUTH_LOGIN_FAILED, {
        userId: user.id as string,
        userEmail: user.email as string,
        ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
        userAgent: c.req.header('User-Agent') || 'unknown',
        success: false,
        errorMessage: 'Incorrect password',
      });

      return c.json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password',
      }, 401);
    }

    // Transparently migrate legacy SHA-256 hash to PBKDF2
    if (!(user.passwordHash as string).includes(':')) {
      try {
        const newHash = await hashPassword(password);
        await c.env.DB.prepare(`
          UPDATE users SET passwordHash = ? WHERE id = ?
        `).bind(newHash, user.id).run();
      } catch (e) {
        // Migration is best-effort; don't block login
        console.error('Failed to migrate password hash:', e);
      }
    }

    // Check if user has 2FA enabled
    const twoFa = await c.env.DB.prepare(`
      SELECT secret, isEnabled FROM user_2fa WHERE userId = ? AND isEnabled = 1
    `).bind(user.id).first();

    // If 2FA is enabled, require verification (all roles including super_admin)
    if (twoFa && twoFa.isEnabled) {
      // If TOTP code was provided, verify it
      if (totpCode) {
        const decryptedSecret = await decryptSecret(twoFa.secret as string, c.env.JWT_SECRET);
        const isValid = await verifyTOTP(decryptedSecret, totpCode);
        if (!isValid) {
          return c.json({
            error: '2FA Error',
            message: 'Invalid verification code',
          }, 401);
        }
        // Code is valid, continue with login
      } else {
        // No code provided, return 2FA required response
        // Generate a temporary token for the 2FA step
        const tempToken = await sign({
          sub: user.id,
          email: user.email,
          role: user.role || 'civil_servant',
          type: '2fa_pending',
          exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
        }, c.env.JWT_SECRET);

        return c.json({
          requires2FA: true,
          tempToken,
          message: 'Two-factor authentication required',
        }, 200);
      }
    }

    // Update last login
    await c.env.DB.prepare(`
      UPDATE users SET lastLoginAt = datetime('now')
      WHERE id = ?
    `).bind(user.id).run();

    // Generate tokens
    const accessToken = await sign({
      sub: user.id,
      email: user.email,
      role: user.role || 'civil_servant',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    }, c.env.JWT_SECRET);

    const refreshToken = await sign({
      sub: user.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    }, c.env.JWT_SECRET);

    // Store session
    try {
      await c.env.DB.prepare(`
        INSERT INTO sessions (id, userId, token, expiresAt)
        VALUES (?, ?, ?, datetime('now', '+7 days'))
      `).bind(
        crypto.randomUUID(),
        user.id,
        refreshToken
      ).run();
    } catch (e) {
      // Session storage is optional, continue if it fails
      console.error('Failed to store session:', e);
    }

    // Log successful login to audit log
    await logAuthEvent(c.env, AuditActions.AUTH_LOGIN, {
      userId: user.id as string,
      userEmail: user.email as string,
      ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      userAgent: c.req.header('User-Agent') || 'unknown',
      success: true,
      metadata: {
        role: user.role,
        has2FA: !!twoFa,
      },
    });

    // Send login notification email (async, don't wait)
    if (c.env.RESEND_API_KEY || c.env.GMAIL_CLIENT_ID) {
      const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'Unknown';
      const userAgent = c.req.header('User-Agent') || 'Unknown';
      const gmailCreds = getGmailCredentials(c.env);

      sendLoginNotificationEmail(c.env.RESEND_API_KEY, user.email as string, user.displayName as string, {
        ipAddress,
        userAgent: userAgent.substring(0, 100), // Truncate long user agents
        timestamp: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' }),
        location: 'Ghana',
      }, gmailCreds).catch((err) => console.error('Failed to send login notification:', err));
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role || 'civil_servant',
        department: user.department,
        title: user.title,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred during login',
    }, 500);
  }
});

// Verify 2FA during login
authRoutes.post('/login/verify-2fa', zValidator('json', verify2FASchema), async (c) => {
  const { tempToken, code, useBackupCode } = c.req.valid('json');

  try {
    // Verify temp token
    const payload = await verify(tempToken, c.env.JWT_SECRET);

    if (payload.type !== '2fa_pending') {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const userId = payload.sub as string;

    // Get user
    const user = await c.env.DB.prepare(`
      SELECT id, email, displayName, firstName, lastName,
             avatar, role, department, jobTitle as title
      FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ error: 'Invalid Credentials', message: 'Invalid email or password' }, 401);
    }

    // Get 2FA info
    const twoFa = await c.env.DB.prepare(`
      SELECT secret, backupCodes, backupCodesUsed FROM user_2fa WHERE userId = ? AND isEnabled = 1
    `).bind(userId).first();

    if (!twoFa) {
      return c.json({ error: '2FA not enabled' }, 400);
    }

    let isValid = false;

    if (useBackupCode && twoFa.backupCodes) {
      // Verify backup code
      const hashedCodes = JSON.parse(twoFa.backupCodes as string) as string[];
      const codeIndex = await verifyBackupCode(code, hashedCodes);

      if (codeIndex !== -1) {
        isValid = true;
        // Remove used backup code
        hashedCodes.splice(codeIndex, 1);
        const usedCount = ((twoFa.backupCodesUsed as number) || 0) + 1;
        await c.env.DB.prepare(`
          UPDATE user_2fa SET backupCodes = ?, backupCodesUsed = ? WHERE userId = ?
        `).bind(JSON.stringify(hashedCodes), usedCount, userId).run();
      }
    } else {
      // Decrypt secret and verify TOTP code
      const decryptedSecret = await decryptSecret(twoFa.secret as string, c.env.JWT_SECRET);
      isValid = await verifyTOTP(decryptedSecret, code);
    }

    if (!isValid) {
      return c.json({
        error: '2FA Error',
        message: useBackupCode ? 'Invalid backup code' : 'Invalid verification code',
      }, 401);
    }

    // Update last login
    await c.env.DB.prepare(`
      UPDATE users SET lastLoginAt = datetime('now')
      WHERE id = ?
    `).bind(userId).run();

    // Generate tokens
    const accessToken = await sign({
      sub: user.id,
      email: user.email,
      role: user.role || 'civil_servant',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    }, c.env.JWT_SECRET);

    const refreshToken = await sign({
      sub: user.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
    }, c.env.JWT_SECRET);

    // Store session
    try {
      await c.env.DB.prepare(`
        INSERT INTO sessions (id, userId, token, expiresAt)
        VALUES (?, ?, ?, datetime('now', '+7 days'))
      `).bind(crypto.randomUUID(), userId, refreshToken).run();
    } catch (e) {
      console.error('Failed to store session:', e);
    }

    // Log successful 2FA login
    try {
      await c.env.DB.prepare(`
        INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
        VALUES (?, ?, 'login', 'Logged in with two-factor authentication', 'success', 'low')
      `).bind(crypto.randomUUID(), userId).run();
    } catch (e) {
      console.error('Failed to log activity:', e);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role || 'civil_servant',
        department: user.department,
        title: user.title,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred during verification',
    }, 500);
  }
});

// Register
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const data = c.req.valid('json');
  const { email, password, turnstileToken } = data;

  try {
    // Rate limit: 5 registrations per hour per IP
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    if (c.env.KV) {
      const rateLimit = await checkRateLimit(c.env.KV, `register:${ip}`, 5, 3600);
      if (!rateLimit.allowed) {
        return c.json({
          error: 'Rate Limited',
          message: 'Too many registration attempts. Please try again later.',
          retryAfter: rateLimit.resetAt - Math.floor(Date.now() / 1000),
        }, 429);
      }
    }

    // Verify Turnstile token if configured
    if (c.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return c.json({
          error: 'Verification Required',
          message: 'Please complete the security verification',
        }, 400);
      }

      const isValidTurnstile = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY, ip);
      if (!isValidTurnstile) {
        return c.json({
          error: 'Verification Failed',
          message: 'Security verification failed. Please try again.',
        }, 400);
      }
    }

    // Check if user exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email.toLowerCase()).first();

    if (existing) {
      return c.json({
        error: 'Email Exists',
        message: 'An account with this email already exists',
      }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Handle both legacy 'name' field and new firstName/lastName fields
    let firstName: string;
    let lastName: string;
    let displayName: string;

    if (data.firstName && data.lastName) {
      firstName = data.firstName.trim();
      lastName = data.lastName.trim();
      displayName = `${firstName} ${lastName}`;
    } else if (data.name) {
      const nameParts = data.name.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ') || '';
      displayName = data.name.trim();
    } else {
      return c.json({
        error: 'Invalid Data',
        message: 'Name is required',
      }, 400);
    }

    // Get MDA from either field
    const mdaId = data.mdaId || data.mda || null;

    // Generate user ID
    const userId = crypto.randomUUID();

    // Auto-verify .gov.gh emails (trusted government domain)
    const isGovEmail = email.toLowerCase().endsWith('.gov.gh');

    // Create user - auto-verify for .gov.gh emails
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, passwordHash, displayName, firstName, lastName, staffId, role, mdaId, department, jobTitle, isActive, isVerified)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'civil_servant', ?, ?, ?, 1, ?)
    `).bind(
      userId,
      email.toLowerCase(),
      passwordHash,
      displayName,
      firstName,
      lastName,
      data.staffId || null,
      mdaId,
      data.department || null,
      data.title || null,
      isGovEmail ? 1 : 0
    ).run();

    // Notify admin of new registration (uses Gmail API for better delivery)
    if (c.env.RESEND_API_KEY || c.env.GMAIL_CLIENT_ID) {
      try {
        const gmailCreds = getGmailCredentials(c.env);
        await sendAdminNewUserNotification(c.env.RESEND_API_KEY, {
          displayName,
          email: email.toLowerCase(),
          department: data.department || '',
          mda: mdaId || 'Not specified',
          staffId: data.staffId || 'Not provided',
        }, gmailCreds);
      } catch (adminError) {
        console.error('Failed to send admin notification:', adminError);
      }
    }

    // Auto-login for verified .gov.gh users
    if (isGovEmail) {
      const accessToken = await sign({
        sub: userId,
        email: email.toLowerCase(),
        role: 'civil_servant',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      }, c.env.JWT_SECRET);

      const refreshToken = await sign({
        sub: userId,
        type: 'refresh',
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
      }, c.env.JWT_SECRET);

      return c.json({
        message: 'Registration successful! Welcome to OHCS E-Library.',
        user: {
          id: userId,
          email: email.toLowerCase(),
          name: displayName,
          firstName,
          lastName,
          displayName,
          staffId: data.staffId || null,
          mdaId,
          department: data.department || null,
          title: data.title || null,
          role: 'civil_servant',
        },
        accessToken,
        refreshToken,
      }, 201);
    }

    // Non .gov.gh emails would need verification (but we block them anyway)
    return c.json({
      message: 'Registration successful! Please check your email for a verification code.',
      requiresVerification: true,
      userId,
      email: email.toLowerCase(),
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred during registration',
    }, 500);
  }
});

// Verify email with code
const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

authRoutes.post('/verify-email', zValidator('json', verifyCodeSchema), async (c) => {
  const { email, code } = c.req.valid('json');

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, displayName, verificationCode, verificationExpires
      FROM users
      WHERE email = ? AND isVerified = 0
    `).bind(email.toLowerCase()).first();

    if (!user) {
      return c.json({
        error: 'Invalid Request',
        message: 'No pending verification found for this email',
      }, 400);
    }

    // Check if code matches
    if (user.verificationCode !== code) {
      return c.json({
        error: 'Invalid Code',
        message: 'The verification code is incorrect',
      }, 400);
    }

    // Check if code has expired
    if (user.verificationExpires && new Date(user.verificationExpires as string) < new Date()) {
      return c.json({
        error: 'Code Expired',
        message: 'The verification code has expired. Please request a new one.',
      }, 400);
    }

    // Mark user as verified
    await c.env.DB.prepare(`
      UPDATE users
      SET isVerified = 1, verificationCode = NULL, verificationExpires = NULL
      WHERE id = ?
    `).bind(user.id).run();

    // Send welcome email
    if (c.env.RESEND_API_KEY || c.env.GMAIL_CLIENT_ID) {
      try {
        const gmailCreds = getGmailCredentials(c.env);
        await sendWelcomeEmail(
          c.env.RESEND_API_KEY,
          email.toLowerCase(),
          user.displayName as string,
          gmailCreds
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    // Generate tokens for auto-login
    const accessToken = await sign({
      sub: user.id,
      email: email.toLowerCase(),
      role: 'civil_servant',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    }, c.env.JWT_SECRET);

    const refreshToken = await sign({
      sub: user.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
    }, c.env.JWT_SECRET);

    return c.json({
      message: 'Email verified successfully! Welcome to OHCS E-Library.',
      user: {
        id: user.id,
        email: email.toLowerCase(),
        displayName: user.displayName,
        role: 'civil_servant',
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred during verification',
    }, 500);
  }
});

// Resend verification code
authRoutes.post('/resend-verification', zValidator('json', forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json');

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, displayName FROM users WHERE email = ? AND isVerified = 0
    `).bind(email.toLowerCase()).first();

    if (!user) {
      // Don't reveal if email exists
      return c.json({
        message: 'If an unverified account exists, a new code will be sent.',
      });
    }

    // Generate new code
    const verificationCode = generateVerificationCode();

    await c.env.DB.prepare(`
      UPDATE users
      SET verificationCode = ?, verificationExpires = datetime('now', '+15 minutes')
      WHERE id = ?
    `).bind(verificationCode, user.id).run();

    // Send verification email
    if (c.env.RESEND_API_KEY || c.env.GMAIL_CLIENT_ID) {
      try {
        const gmailCreds = getGmailCredentials(c.env);
        await sendVerificationEmail(
          c.env.RESEND_API_KEY,
          email.toLowerCase(),
          user.displayName as string,
          verificationCode,
          gmailCreds
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }
    }

    return c.json({
      message: 'If an unverified account exists, a new code will be sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred',
    }, 500);
  }
});

// Forgot password
authRoutes.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json');

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, displayName FROM users WHERE email = ?
    `).bind(email.toLowerCase()).first();

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({
        message: 'If an account exists with this email, you will receive a password reset code.',
      });
    }

    // Generate 6-digit reset code
    const resetCode = generateVerificationCode();
    const resetToken = crypto.randomUUID();

    await c.env.DB.prepare(`
      UPDATE users
      SET resetCode = ?, resetToken = ?, resetExpires = datetime('now', '+1 hour')
      WHERE id = ?
    `).bind(resetCode, resetToken, user.id).run();

    // Try to send password reset email (uses Gmail for better delivery to gov.gh)
    let emailSent = false;
    if (c.env.RESEND_API_KEY || c.env.GMAIL_CLIENT_ID) {
      try {
        const gmailCreds = getGmailCredentials(c.env);
        const resetUrl = `https://ohcs-elibrary.pages.dev/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(
          c.env.RESEND_API_KEY,
          email.toLowerCase(),
          user.displayName as string,
          resetCode,
          resetUrl,
          gmailCreds
        );
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    return c.json({
      message: 'If an account exists with this email, you will receive a password reset code.',
      expiresIn: '1 hour',
      emailSent,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred',
    }, 500);
  }
});

// Reset password with code
const resetPasswordWithCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

authRoutes.post('/reset-password', zValidator('json', resetPasswordWithCodeSchema), async (c) => {
  const { email, code, password } = c.req.valid('json');

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, resetCode, resetExpires FROM users WHERE email = ?
    `).bind(email.toLowerCase()).first();

    if (!user) {
      return c.json({
        error: 'Invalid Request',
        message: 'Invalid email or reset code',
      }, 400);
    }

    // Check if code matches
    if (user.resetCode !== code) {
      return c.json({
        error: 'Invalid Code',
        message: 'The reset code is incorrect',
      }, 400);
    }

    // Check if code has expired
    if (user.resetExpires && new Date(user.resetExpires as string) < new Date()) {
      return c.json({
        error: 'Code Expired',
        message: 'The reset code has expired. Please request a new one.',
      }, 400);
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset tokens
    await c.env.DB.prepare(`
      UPDATE users
      SET passwordHash = ?, resetCode = NULL, resetToken = NULL, resetExpires = NULL
      WHERE id = ?
    `).bind(passwordHash, user.id).run();

    // Blacklist all active session tokens for this user (invalidate all sessions)
    if (c.env.CACHE) {
      try {
        const sessions = await c.env.DB.prepare(`
          SELECT token FROM sessions WHERE userId = ? AND expiresAt > datetime('now')
        `).bind(user.id).all();

        for (const session of sessions.results || []) {
          if (session.token) {
            try {
              const sessionPayload = await verify(session.token as string, c.env.JWT_SECRET);
              if (sessionPayload.exp) {
                const remainingTtl = Math.max(0, (sessionPayload.exp as number) - Math.floor(Date.now() / 1000));
                await blacklistToken(c.env.CACHE, session.token as string, remainingTtl);
              }
            } catch (_) {
              // Token already expired or invalid — skip
            }
          }
        }
      } catch (e) {
        console.error('Failed to blacklist sessions on password reset:', e);
      }
    }

    // Delete all sessions for the user
    try {
      await c.env.DB.prepare(`
        DELETE FROM sessions WHERE userId = ?
      `).bind(user.id).run();
    } catch (e) {
      console.error('Failed to delete sessions on password reset:', e);
    }

    // Log password reset activity
    try {
      await c.env.DB.prepare(`
        INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
        VALUES (?, ?, 'password_reset', 'Password was reset successfully', 'success', 'medium')
      `).bind(crypto.randomUUID(), user.id).run();
    } catch (e) {
      console.error('Failed to log password reset:', e);
    }

    return c.json({
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred',
    }, 500);
  }
});

// Refresh token
authRoutes.post('/refresh', async (c) => {
  const refreshToken = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!refreshToken) {
    return c.json({ error: 'Missing refresh token' }, 401);
  }

  try {
    const payload = await verify(refreshToken, c.env.JWT_SECRET);

    if (payload.type !== 'refresh') {
      return c.json({ error: 'Invalid token type' }, 401);
    }

    // Check if refresh token has been blacklisted
    if (c.env.CACHE) {
      try {
        const key = `blacklist:${await hashToken(refreshToken)}`;
        const revoked = await c.env.CACHE.get(key);
        if (revoked !== null) {
          return c.json({ error: 'Token has been revoked' }, 401);
        }
      } catch (e) {
        console.error('Refresh token blacklist check failed:', e);
      }
    }

    // Verify session exists (using deployed DB column names)
    const session = await c.env.DB.prepare(`
      SELECT userId FROM sessions
      WHERE token = ? AND expiresAt > datetime('now')
    `).bind(refreshToken).first();

    if (!session) {
      return c.json({ error: 'Session expired' }, 401);
    }

    // Get user (using deployed DB column names)
    const user = await c.env.DB.prepare(`
      SELECT id, email, role
      FROM users
      WHERE id = ?
    `).bind(session.userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Generate new access token
    const accessToken = await sign({
      sub: user.id,
      email: user.email,
      role: user.role || 'civil_servant',
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
    }, c.env.JWT_SECRET);

    return c.json({ accessToken });
  } catch (error) {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }
});

// Demo login - creates a valid session for demo/trial users
authRoutes.post('/demo', async (c) => {
  try {
    const demoUserId = 'demo-user-001';
    const demoEmail = 'demo@ohcs.gov.gh';

    // Check if demo user exists, create if not
    let user = await c.env.DB.prepare(`
      SELECT id, email, displayName, firstName, lastName, avatar, role, department, jobTitle as title
      FROM users WHERE id = ?
    `).bind(demoUserId).first();

    if (!user) {
      // Create demo user
      const passwordHash = await hashPassword('DemoPassword123!');
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, passwordHash, displayName, firstName, lastName, role, department, jobTitle, isActive, isVerified)
        VALUES (?, ?, ?, 'Kwame Asante', 'Kwame', 'Asante', 'civil_servant', 'Administrative Services', 'Administrative Officer', 1, 1)
      `).bind(demoUserId, demoEmail, passwordHash).run();

      user = {
        id: demoUserId,
        email: demoEmail,
        displayName: 'Kwame Asante',
        firstName: 'Kwame',
        lastName: 'Asante',
        avatar: null,
        role: 'civil_servant',
        department: 'Administrative Services',
        title: 'Administrative Officer',
      };
    }

    // Generate tokens with 24-hour expiry
    const accessToken = await sign({
      sub: user.id,
      email: user.email,
      role: user.role || 'civil_servant',
      isDemo: true,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    }, c.env.JWT_SECRET);

    const refreshToken = await sign({
      sub: user.id,
      type: 'refresh',
      isDemo: true,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours (shorter for demo)
    }, c.env.JWT_SECRET);

    // Store session
    try {
      await c.env.DB.prepare(`
        INSERT INTO sessions (id, userId, token, expiresAt)
        VALUES (?, ?, ?, datetime('now', '+24 hours'))
      `).bind(crypto.randomUUID(), user.id, refreshToken).run();
    } catch (e) {
      console.error('Failed to store demo session:', e);
    }

    // Log demo login
    try {
      await c.env.DB.prepare(`
        INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
        VALUES (?, ?, 'demo_login', 'Demo access session started', 'success', 'low')
      `).bind(crypto.randomUUID(), user.id).run();
    } catch (e) {
      console.error('Failed to log demo activity:', e);
    }

    // Seed demo certificate if it doesn't exist (permanent, not tied to session)
    try {
      const demoCertId = 'demo-certificate-permanent-001';
      const demoEnrollmentId = 'demo-enrollment-permanent-001';
      const demoCertNumber = 'OHCS-DEMO-2024-001';

      const existingCert = await c.env.DB.prepare(`
        SELECT id FROM lms_certificates WHERE id = ?
      `).bind(demoCertId).first();

      if (!existingCert) {
        // Get the first available course
        const course = await c.env.DB.prepare(`
          SELECT id, title, instructorId FROM lms_courses WHERE status = 'published' LIMIT 1
        `).first();

        if (course) {
          // Get instructor name
          const instructor = await c.env.DB.prepare(`
            SELECT displayName FROM users WHERE id = ?
          `).bind((course as any).instructorId).first();

          // Create permanent demo enrollment (completed)
          await c.env.DB.prepare(`
            INSERT OR IGNORE INTO lms_enrollments (id, courseId, userId, status, progress, completedAt, enrolledAt)
            VALUES (?, ?, ?, 'completed', 100, '2024-12-15', '2024-11-15')
          `).bind(demoEnrollmentId, (course as any).id, demoUserId).run();

          // Create permanent demo certificate
          await c.env.DB.prepare(`
            INSERT OR IGNORE INTO lms_certificates (
              id, courseId, userId, enrollmentId, certificateNumber,
              recipientName, courseTitle, instructorName, completionDate,
              grade, gradeLabel, timeSpent, issuedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2024-12-15', 92.5, 'A', 180, '2024-12-15 10:30:00')
          `).bind(
            demoCertId,
            (course as any).id,
            demoUserId,
            demoEnrollmentId,
            demoCertNumber,
            'Kwame Asante',
            (course as any).title,
            (instructor as any)?.displayName || 'System Admin'
          ).run();

          console.log('Permanent demo certificate created:', demoCertNumber);
        }
      }
    } catch (e) {
      console.error('Failed to seed demo certificate:', e);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role || 'civil_servant',
        department: user.department,
        title: user.title,
        staffId: 'DEMO-001',
      },
      accessToken,
      refreshToken,
      isDemo: true,
      expiresIn: '24 hours',
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred during demo login',
    }, 500);
  }
});

// Logout
authRoutes.post('/logout', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  let userId: string | null = null;

  if (token) {
    try {
      // Try to get userId from token before invalidating
      const payload = await verify(token, c.env.JWT_SECRET);
      userId = payload.sub as string;

      // Blacklist the access token so it cannot be reused
      if (c.env.CACHE && payload.exp) {
        const remainingTtl = Math.max(0, (payload.exp as number) - Math.floor(Date.now() / 1000));
        try {
          await blacklistToken(c.env.CACHE, token, remainingTtl);
        } catch (e) {
          console.error('Failed to blacklist access token:', e);
        }
      }
    } catch (e) {
      // Token might be expired, still try to delete session
    }

    // Also blacklist the refresh token if provided in the body
    try {
      const body = await c.req.json().catch(() => ({}));
      if (body.refreshToken && c.env.CACHE) {
        try {
          const refreshPayload = await verify(body.refreshToken, c.env.JWT_SECRET);
          if (refreshPayload.exp) {
            const remainingTtl = Math.max(0, (refreshPayload.exp as number) - Math.floor(Date.now() / 1000));
            await blacklistToken(c.env.CACHE, body.refreshToken, remainingTtl);
          }
        } catch (e) {
          // Refresh token may be invalid/expired — still continue
        }
      }
    } catch (e) {
      // Body parsing failure is not critical
    }

    try {
      await c.env.DB.prepare(`
        DELETE FROM sessions WHERE token = ?
      `).bind(token).run();
    } catch (e) {
      // Ignore errors on logout
    }

    // Log logout activity
    if (userId) {
      try {
        await c.env.DB.prepare(`
          INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
          VALUES (?, ?, 'logout', 'Signed out', 'success', 'low')
        `).bind(crypto.randomUUID(), userId).run();
      } catch (e) {
        console.error('Failed to log logout activity:', e);
      }
    }
  }

  return c.json({ message: 'Logged out successfully' });
});

export { authRoutes };
