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
  const { email, password } = c.req.valid('json');

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
      return c.json({
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect',
      }, 401);
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

  if (token) {
    try {
      await c.env.DB.prepare(`
        DELETE FROM sessions WHERE token = ?
      `).bind(token).run();
    } catch (e) {
      // Ignore errors on logout
    }
  }

  return c.json({ message: 'Logged out successfully' });
});

export { authRoutes };
