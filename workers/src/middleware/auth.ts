import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  mda?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

/**
 * Hash a token to a short key for the KV blacklist.
 * Uses SHA-256, truncated to 16 hex chars to keep KV keys compact.
 */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * Add a token to the KV blacklist. TTL should match the token's remaining lifetime.
 */
export async function blacklistToken(cache: KVNamespace, token: string, ttlSeconds: number): Promise<void> {
  if (ttlSeconds <= 0) return;
  const key = `blacklist:${await hashToken(token)}`;
  await cache.put(key, '1', { expirationTtl: ttlSeconds });
}

/**
 * Check whether a token has been blacklisted (revoked).
 */
async function isTokenBlacklisted(cache: KVNamespace, token: string): Promise<boolean> {
  const key = `blacklist:${await hashToken(token)}`;
  const value = await cache.get(key);
  return value !== null;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, c.env.JWT_SECRET);

    if (!payload || !payload.sub) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid token',
      }, 401);
    }

    // Check token expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return c.json({
        error: 'Unauthorized',
        message: 'Token has expired',
      }, 401);
    }

    // Check token blacklist (revoked tokens)
    if (c.env.CACHE) {
      try {
        const revoked = await isTokenBlacklisted(c.env.CACHE, token);
        if (revoked) {
          return c.json({
            error: 'Unauthorized',
            message: 'Token has been revoked',
          }, 401);
        }
      } catch (e) {
        // Blacklist check failure should not block auth — fail open
        console.error('Token blacklist check failed:', e);
      }
    }

    // Set user in context
    c.set('user', {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
      mda: payload.mda as string | undefined,
    });

    await next();
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({
      error: 'Unauthorized',
      message: 'Invalid token',
    }, 401);
  }
}

// Optional authentication middleware - doesn't require auth but parses token if present
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const payload = await verify(token, c.env.JWT_SECRET);

      if (payload && payload.sub) {
        // Check token expiration
        if (!payload.exp || Date.now() < payload.exp * 1000) {
          // Check blacklist before setting user context
          let revoked = false;
          if (c.env.CACHE) {
            try {
              const key = `blacklist:${await hashToken(token)}`;
              revoked = (await c.env.CACHE.get(key)) !== null;
            } catch (_) {
              // Fail open
            }
          }

          if (!revoked) {
            // Set user in context if token is valid
            c.set('user', {
              id: payload.sub as string,
              email: payload.email as string,
              role: payload.role as string,
              mda: payload.mda as string | undefined,
            });
          }
        }
      }
    } catch (error) {
      // Token is invalid but we don't block the request
      console.log('Optional auth - invalid token, continuing without auth');
    }
  }

  await next();
}

// Role-based access control middleware
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({
        error: 'Unauthorized',
        message: 'Authentication required',
      }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      }, 403);
    }

    await next();
  };
}

// Permission-based access control
export function requirePermission(permission: string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({
        error: 'Unauthorized',
        message: 'Authentication required',
      }, 401);
    }

    // Check permission in database
    const result = await c.env.DB.prepare(`
      SELECT 1 FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN roles r ON rp.role_id = r.id
      WHERE r.name = ? AND p.name = ?
    `).bind(user.role, permission).first();

    if (!result) {
      return c.json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      }, 403);
    }

    await next();
  };
}
