import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const authRoutes = new Hono();

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

const registerSchema = z.object({
  name: z.string().min(2),
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
  mda: z.string().optional(),
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

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
      return c.json({
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect',
      }, 401);
    }

    // Check if account is active
    if (!user.isActive) {
      return c.json({
        error: 'Account Inactive',
        message: 'Your account has been deactivated',
      }, 403);
    }

    // Verify password
    const passwordHash = await hashPassword(password);

    if (passwordHash !== user.passwordHash) {
      // Log failed login attempt
      try {
        await c.env.DB.prepare(`
          INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
          VALUES (?, ?, 'login', 'Failed login attempt - incorrect password', 'failed', 'medium')
        `).bind(crypto.randomUUID(), user.id).run();
      } catch (e) {
        console.error('Failed to log failed login:', e);
      }

      return c.json({
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect',
      }, 401);
    }

    // Check if user has 2FA enabled (bypass for super_admin)
    const twoFa = await c.env.DB.prepare(`
      SELECT secret, isEnabled FROM user_2fa WHERE userId = ? AND isEnabled = 1
    `).bind(user.id).first();

    // If 2FA is enabled and user is NOT super_admin, require verification
    if (twoFa && twoFa.isEnabled && user.role !== 'super_admin') {
      // If TOTP code was provided, verify it
      if (totpCode) {
        const isValid = await verifyTOTP(twoFa.secret as string, totpCode);
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

    // Log successful login activity
    try {
      await c.env.DB.prepare(`
        INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
        VALUES (?, ?, 'login', 'Signed in successfully', 'success', 'low')
      `).bind(crypto.randomUUID(), user.id).run();
    } catch (e) {
      console.error('Failed to log login activity:', e);
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
      return c.json({ error: 'User not found' }, 401);
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
      // Verify TOTP code
      isValid = await verifyTOTP(twoFa.secret as string, code);
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
  const { name, email, password, mda } = c.req.valid('json');

  try {
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

    // Parse name into first/last
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate user ID
    const userId = crypto.randomUUID();

    // Create user - auto-verify for development (using deployed DB column names)
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, passwordHash, displayName, firstName, lastName, role, mdaId, isActive, isVerified)
      VALUES (?, ?, ?, ?, ?, ?, 'civil_servant', ?, 1, 1)
    `).bind(
      userId,
      email.toLowerCase(),
      passwordHash,
      name,
      firstName,
      lastName,
      mda || null
    ).run();

    // Auto-login after registration
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
      message: 'Registration successful!',
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name,
        firstName,
        lastName,
        displayName: name,
        role: 'civil_servant',
      },
      accessToken,
      refreshToken,
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred during registration',
    }, 500);
  }
});

// Verify email
authRoutes.post('/verify-email', zValidator('json', verifyEmailSchema), async (c) => {
  const { token } = c.req.valid('json');

  try {
    const user = await c.env.DB.prepare(`
      SELECT id FROM users
      WHERE email_verification_token = ? AND email_verified = 0
    `).bind(token).first();

    if (!user) {
      return c.json({
        error: 'Invalid Token',
        message: 'The verification token is invalid or has already been used',
      }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE users
      SET email_verified = 1, email_verification_token = NULL, status = 'active'
      WHERE id = ?
    `).bind(user.id).run();

    return c.json({
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred during verification',
    }, 500);
  }
});

// Forgot password
authRoutes.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json');

  try {
    const user = await c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first();

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    const resetToken = crypto.randomUUID();

    await c.env.DB.prepare(`
      UPDATE users
      SET password_reset_token = ?, password_reset_expires = datetime('now', '+1 hour')
      WHERE id = ?
    `).bind(resetToken, user.id).run();

    // TODO: Send password reset email

    return c.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
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

// Logout
authRoutes.post('/logout', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  let userId: string | null = null;

  if (token) {
    try {
      // Try to get userId from token before invalidating
      const payload = await verify(token, c.env.JWT_SECRET);
      userId = payload.sub as string;
    } catch (e) {
      // Token might be expired, still try to delete session
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
