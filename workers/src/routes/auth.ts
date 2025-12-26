import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const authRoutes = new Hono();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

// Login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  try {
    // Check for account lockout
    const lockout = await c.env.DB.prepare(`
      SELECT failed_attempts, locked_until
      FROM user_sessions
      WHERE user_id = (SELECT id FROM users WHERE email = ?)
      ORDER BY created_at DESC LIMIT 1
    `).bind(email).first();

    if (lockout?.locked_until && new Date(lockout.locked_until) > new Date()) {
      return c.json({
        error: 'Account Locked',
        message: 'Too many failed login attempts. Please try again later.',
      }, 423);
    }

    // Find user
    const user = await c.env.DB.prepare(`
      SELECT id, email, password_hash, name, role_id, mda_id, email_verified, status
      FROM users WHERE email = ?
    `).bind(email).first();

    if (!user) {
      return c.json({
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect',
      }, 401);
    }

    // Check if email is verified
    if (!user.email_verified) {
      return c.json({
        error: 'Email Not Verified',
        message: 'Please verify your email address before logging in',
      }, 403);
    }

    // Check user status
    if (user.status !== 'active') {
      return c.json({
        error: 'Account Inactive',
        message: 'Your account has been suspended or deactivated',
      }, 403);
    }

    // Verify password (using Web Crypto API)
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (passwordHash !== user.password_hash) {
      // Record failed attempt
      await c.env.DB.prepare(`
        UPDATE users SET failed_login_attempts = failed_login_attempts + 1
        WHERE id = ?
      `).bind(user.id).run();

      // Lock account after 5 failed attempts
      const attempts = await c.env.DB.prepare(`
        SELECT failed_login_attempts FROM users WHERE id = ?
      `).bind(user.id).first();

      if (attempts && attempts.failed_login_attempts >= 5) {
        await c.env.DB.prepare(`
          UPDATE users SET locked_until = datetime('now', '+15 minutes')
          WHERE id = ?
        `).bind(user.id).run();
      }

      return c.json({
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect',
      }, 401);
    }

    // Reset failed attempts
    await c.env.DB.prepare(`
      UPDATE users SET failed_login_attempts = 0, last_login = datetime('now')
      WHERE id = ?
    `).bind(user.id).run();

    // Get role name
    const role = await c.env.DB.prepare(`
      SELECT name FROM roles WHERE id = ?
    `).bind(user.role_id).first();

    // Generate tokens
    const accessToken = await sign({
      sub: user.id,
      email: user.email,
      role: role?.name || 'guest',
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    }, c.env.JWT_SECRET);

    const refreshToken = await sign({
      sub: user.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    }, c.env.JWT_SECRET);

    // Store session
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, datetime('now', '+7 days'))
    `).bind(
      user.id,
      refreshToken,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run();

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role?.name,
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

// Register
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const { name, email, password, mda } = c.req.valid('json');

  try {
    // Check if user exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first();

    if (existing) {
      return c.json({
        error: 'Email Exists',
        message: 'An account with this email already exists',
      }, 409);
    }

    // Hash password
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Get default role
    const role = await c.env.DB.prepare(`
      SELECT id FROM roles WHERE name = 'civil_servant'
    `).first();

    // Generate verification token
    const verificationToken = crypto.randomUUID();

    // Create user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (name, email, password_hash, role_id, email_verification_token, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
      RETURNING id
    `).bind(name, email, passwordHash, role?.id || 2, verificationToken).first();

    // TODO: Send verification email using email service

    return c.json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId: result?.id,
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

    // Verify session exists
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM user_sessions
      WHERE token = ? AND expires_at > datetime('now')
    `).bind(refreshToken).first();

    if (!session) {
      return c.json({ error: 'Session expired' }, 401);
    }

    // Get user
    const user = await c.env.DB.prepare(`
      SELECT u.id, u.email, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).bind(session.user_id).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Generate new access token
    const accessToken = await sign({
      sub: user.id,
      email: user.email,
      role: user.role,
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

  if (token) {
    await c.env.DB.prepare(`
      DELETE FROM user_sessions WHERE token = ?
    `).bind(token).run();
  }

  return c.json({ message: 'Logged out successfully' });
});

export { authRoutes };
