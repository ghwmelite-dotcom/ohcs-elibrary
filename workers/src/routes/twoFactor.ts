/**
 * Two-Factor Authentication Routes
 * Handles 2FA setup, verification, and management
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import {
  generateSecret,
  generateTOTPUri,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  generateDeviceToken,
  hashDeviceToken,
} from '../services/twoFactorService';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

const twoFactorRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
twoFactorRoutes.use('/*', authMiddleware);

// ============================================
// 2FA Setup Routes
// ============================================

/**
 * GET /2fa/status - Get current 2FA status
 */
twoFactorRoutes.get('/status', async (c) => {
  const userId = c.get('userId') as string;

  const user = await c.env.DB.prepare(`
    SELECT twoFactorEnabled, twoFactorEnabledAt
    FROM users
    WHERE id = ?
  `).bind(userId).first<{ twoFactorEnabled: number; twoFactorEnabledAt: string | null }>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Get trusted devices count
  const devices = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM two_factor_trusted_devices
    WHERE userId = ? AND expiresAt > datetime('now')
  `).bind(userId).first<{ count: number }>();

  return c.json({
    enabled: user.twoFactorEnabled === 1,
    enabledAt: user.twoFactorEnabledAt,
    trustedDevicesCount: devices?.count || 0,
  });
});

/**
 * POST /2fa/setup - Begin 2FA setup (generate secret)
 */
twoFactorRoutes.post('/setup', async (c) => {
  const userId = c.get('userId') as string;

  // Get user email
  const user = await c.env.DB.prepare(`
    SELECT email, twoFactorEnabled
    FROM users
    WHERE id = ?
  `).bind(userId).first<{ email: string; twoFactorEnabled: number }>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (user.twoFactorEnabled === 1) {
    return c.json({ error: '2FA is already enabled' }, 400);
  }

  // Generate new secret
  const secret = generateSecret();
  const uri = generateTOTPUri(secret, user.email);

  // Store secret temporarily (not enabled yet)
  await c.env.DB.prepare(`
    UPDATE users
    SET twoFactorSecret = ?
    WHERE id = ?
  `).bind(secret, userId).run();

  return c.json({
    secret,
    uri,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`,
    instructions: [
      '1. Install an authenticator app (Google Authenticator, Authy, etc.)',
      '2. Scan the QR code or manually enter the secret',
      '3. Enter the 6-digit code to verify and enable 2FA',
    ],
  });
});

/**
 * POST /2fa/enable - Verify code and enable 2FA
 */
twoFactorRoutes.post('/enable', async (c) => {
  const userId = c.get('userId') as string;

  const schema = z.object({
    code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits'),
  });

  const body = await c.req.json();
  const validation = schema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Invalid code format', details: validation.error.issues }, 400);
  }

  const { code } = validation.data;

  // Get user's pending secret
  const user = await c.env.DB.prepare(`
    SELECT twoFactorSecret, twoFactorEnabled
    FROM users
    WHERE id = ?
  `).bind(userId).first<{ twoFactorSecret: string | null; twoFactorEnabled: number }>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (user.twoFactorEnabled === 1) {
    return c.json({ error: '2FA is already enabled' }, 400);
  }

  if (!user.twoFactorSecret) {
    return c.json({ error: 'Please start 2FA setup first' }, 400);
  }

  // Verify the code
  const isValid = await verifyTOTP(user.twoFactorSecret, code);

  if (!isValid) {
    // Log failed attempt
    await c.env.DB.prepare(`
      INSERT INTO two_factor_attempts (id, userId, attemptType, success, ipAddress, userAgent)
      VALUES (?, ?, 'totp', 0, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId,
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run();

    return c.json({ error: 'Invalid verification code' }, 400);
  }

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);
  const hashedCodes = await Promise.all(backupCodes.map(hashBackupCode));

  // Enable 2FA
  await c.env.DB.prepare(`
    UPDATE users
    SET twoFactorEnabled = 1,
        twoFactorBackupCodes = ?,
        twoFactorEnabledAt = datetime('now')
    WHERE id = ?
  `).bind(JSON.stringify(hashedCodes), userId).run();

  // Log successful setup
  await c.env.DB.prepare(`
    INSERT INTO two_factor_attempts (id, userId, attemptType, success, ipAddress, userAgent)
    VALUES (?, ?, 'setup', 1, ?, ?)
  `).bind(
    crypto.randomUUID(),
    userId,
    c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
    c.req.header('User-Agent') || 'unknown'
  ).run();

  return c.json({
    success: true,
    message: '2FA has been enabled successfully',
    backupCodes,
    warning: 'Save these backup codes in a secure place. They can be used to access your account if you lose your authenticator device.',
  });
});

/**
 * POST /2fa/disable - Disable 2FA
 */
twoFactorRoutes.post('/disable', async (c) => {
  const userId = c.get('userId') as string;

  const schema = z.object({
    password: z.string().min(1, 'Password is required'),
    code: z.string().optional(), // TOTP code or backup code
  });

  const body = await c.req.json();
  const validation = schema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Invalid request', details: validation.error.issues }, 400);
  }

  const { password, code } = validation.data;

  // Get user
  const user = await c.env.DB.prepare(`
    SELECT passwordHash, twoFactorEnabled, twoFactorSecret
    FROM users
    WHERE id = ?
  `).bind(userId).first<{ passwordHash: string; twoFactorEnabled: number; twoFactorSecret: string | null }>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (user.twoFactorEnabled !== 1) {
    return c.json({ error: '2FA is not enabled' }, 400);
  }

  // Verify password
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (passwordHash !== user.passwordHash) {
    return c.json({ error: 'Invalid password' }, 401);
  }

  // Optionally verify 2FA code
  if (code && user.twoFactorSecret) {
    const isValidCode = await verifyTOTP(user.twoFactorSecret, code);
    if (!isValidCode) {
      return c.json({ error: 'Invalid 2FA code' }, 400);
    }
  }

  // Disable 2FA
  await c.env.DB.prepare(`
    UPDATE users
    SET twoFactorEnabled = 0,
        twoFactorSecret = NULL,
        twoFactorBackupCodes = NULL,
        twoFactorEnabledAt = NULL
    WHERE id = ?
  `).bind(userId).run();

  // Remove trusted devices
  await c.env.DB.prepare(`
    DELETE FROM two_factor_trusted_devices
    WHERE userId = ?
  `).bind(userId).run();

  return c.json({
    success: true,
    message: '2FA has been disabled',
  });
});

/**
 * POST /2fa/verify - Verify 2FA code (for login flow)
 */
twoFactorRoutes.post('/verify', async (c) => {
  const schema = z.object({
    userId: z.string().uuid(),
    code: z.string().min(6),
    trustDevice: z.boolean().optional(),
    deviceName: z.string().optional(),
  });

  const body = await c.req.json();
  const validation = schema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Invalid request', details: validation.error.issues }, 400);
  }

  const { userId, code, trustDevice, deviceName } = validation.data;

  // Get user
  const user = await c.env.DB.prepare(`
    SELECT twoFactorSecret, twoFactorBackupCodes, twoFactorEnabled
    FROM users
    WHERE id = ?
  `).bind(userId).first<{
    twoFactorSecret: string | null;
    twoFactorBackupCodes: string | null;
    twoFactorEnabled: number;
  }>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (user.twoFactorEnabled !== 1 || !user.twoFactorSecret) {
    return c.json({ error: '2FA is not enabled for this user' }, 400);
  }

  const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';

  // Check rate limiting (max 5 attempts per minute)
  const recentAttempts = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM two_factor_attempts
    WHERE userId = ? AND success = 0 AND createdAt > datetime('now', '-1 minute')
  `).bind(userId).first<{ count: number }>();

  if (recentAttempts && recentAttempts.count >= 5) {
    return c.json({ error: 'Too many attempts. Please wait a minute.' }, 429);
  }

  let isValid = false;
  let attemptType = 'totp';

  // First try as TOTP code
  if (code.length === 6 && /^\d+$/.test(code)) {
    isValid = await verifyTOTP(user.twoFactorSecret, code);
  }

  // If not valid, try as backup code
  if (!isValid && user.twoFactorBackupCodes) {
    attemptType = 'backup_code';
    const hashedCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
    const backupResult = await verifyBackupCode(code, hashedCodes);

    if (backupResult.valid) {
      isValid = true;
      // Remove used backup code
      hashedCodes.splice(backupResult.usedIndex, 1);
      await c.env.DB.prepare(`
        UPDATE users
        SET twoFactorBackupCodes = ?
        WHERE id = ?
      `).bind(JSON.stringify(hashedCodes), userId).run();
    }
  }

  // Log attempt
  await c.env.DB.prepare(`
    INSERT INTO two_factor_attempts (id, userId, attemptType, success, ipAddress, userAgent)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    userId,
    attemptType,
    isValid ? 1 : 0,
    ipAddress,
    userAgent
  ).run();

  if (!isValid) {
    return c.json({ error: 'Invalid verification code' }, 401);
  }

  let deviceToken: string | undefined;

  // Create trusted device if requested
  if (trustDevice) {
    deviceToken = generateDeviceToken();
    const hashedToken = await hashDeviceToken(deviceToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    await c.env.DB.prepare(`
      INSERT INTO two_factor_trusted_devices (id, userId, deviceToken, deviceName, expiresAt)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId,
      hashedToken,
      deviceName || `${userAgent.slice(0, 50)}...`,
      expiresAt
    ).run();
  }

  return c.json({
    success: true,
    verified: true,
    usedBackupCode: attemptType === 'backup_code',
    deviceToken,
  });
});

/**
 * POST /2fa/check-device - Check if device is trusted
 */
twoFactorRoutes.post('/check-device', async (c) => {
  const schema = z.object({
    userId: z.string().uuid(),
    deviceToken: z.string(),
  });

  const body = await c.req.json();
  const validation = schema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Invalid request' }, 400);
  }

  const { userId, deviceToken } = validation.data;
  const hashedToken = await hashDeviceToken(deviceToken);

  const device = await c.env.DB.prepare(`
    SELECT id
    FROM two_factor_trusted_devices
    WHERE userId = ? AND deviceToken = ? AND expiresAt > datetime('now')
  `).bind(userId, hashedToken).first();

  if (device) {
    // Update last used
    await c.env.DB.prepare(`
      UPDATE two_factor_trusted_devices
      SET lastUsedAt = datetime('now')
      WHERE id = ?
    `).bind(device.id).run();
  }

  return c.json({
    trusted: !!device,
  });
});

/**
 * GET /2fa/backup-codes - Get remaining backup codes count
 */
twoFactorRoutes.get('/backup-codes', async (c) => {
  const userId = c.get('userId') as string;

  const user = await c.env.DB.prepare(`
    SELECT twoFactorBackupCodes, twoFactorEnabled
    FROM users
    WHERE id = ?
  `).bind(userId).first<{ twoFactorBackupCodes: string | null; twoFactorEnabled: number }>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (user.twoFactorEnabled !== 1) {
    return c.json({ error: '2FA is not enabled' }, 400);
  }

  const codes = user.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes) : [];

  return c.json({
    remaining: codes.length,
    total: 10,
    warning: codes.length <= 2 ? 'You have few backup codes remaining. Consider regenerating them.' : null,
  });
});

/**
 * POST /2fa/backup-codes/regenerate - Generate new backup codes
 */
twoFactorRoutes.post('/backup-codes/regenerate', async (c) => {
  const userId = c.get('userId') as string;

  const schema = z.object({
    code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits'),
  });

  const body = await c.req.json();
  const validation = schema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Invalid request', details: validation.error.issues }, 400);
  }

  const { code } = validation.data;

  // Get user
  const user = await c.env.DB.prepare(`
    SELECT twoFactorSecret, twoFactorEnabled
    FROM users
    WHERE id = ?
  `).bind(userId).first<{ twoFactorSecret: string | null; twoFactorEnabled: number }>();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (user.twoFactorEnabled !== 1 || !user.twoFactorSecret) {
    return c.json({ error: '2FA is not enabled' }, 400);
  }

  // Verify TOTP code
  const isValid = await verifyTOTP(user.twoFactorSecret, code);
  if (!isValid) {
    return c.json({ error: 'Invalid verification code' }, 401);
  }

  // Generate new backup codes
  const backupCodes = generateBackupCodes(10);
  const hashedCodes = await Promise.all(backupCodes.map(hashBackupCode));

  await c.env.DB.prepare(`
    UPDATE users
    SET twoFactorBackupCodes = ?
    WHERE id = ?
  `).bind(JSON.stringify(hashedCodes), userId).run();

  return c.json({
    success: true,
    backupCodes,
    warning: 'Your old backup codes are now invalid. Save these new codes securely.',
  });
});

/**
 * GET /2fa/devices - List trusted devices
 */
twoFactorRoutes.get('/devices', async (c) => {
  const userId = c.get('userId') as string;

  const devices = await c.env.DB.prepare(`
    SELECT id, deviceName, lastUsedAt, expiresAt, createdAt
    FROM two_factor_trusted_devices
    WHERE userId = ? AND expiresAt > datetime('now')
    ORDER BY lastUsedAt DESC
  `).bind(userId).all();

  return c.json({
    devices: devices.results || [],
  });
});

/**
 * DELETE /2fa/devices/:id - Remove trusted device
 */
twoFactorRoutes.delete('/devices/:id', async (c) => {
  const userId = c.get('userId') as string;
  const deviceId = c.req.param('id');

  await c.env.DB.prepare(`
    DELETE FROM two_factor_trusted_devices
    WHERE id = ? AND userId = ?
  `).bind(deviceId, userId).run();

  return c.json({
    success: true,
    message: 'Device removed',
  });
});

/**
 * DELETE /2fa/devices - Remove all trusted devices
 */
twoFactorRoutes.delete('/devices', async (c) => {
  const userId = c.get('userId') as string;

  const result = await c.env.DB.prepare(`
    DELETE FROM two_factor_trusted_devices
    WHERE userId = ?
  `).bind(userId).run();

  return c.json({
    success: true,
    removedCount: result.meta.changes,
  });
});

export { twoFactorRoutes };
