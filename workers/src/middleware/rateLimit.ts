import { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
};

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  '/api/v1/auth/login': { windowMs: 15 * 60 * 1000, max: 5 }, // 5 per 15 min
  '/api/v1/auth/register': { windowMs: 60 * 60 * 1000, max: 3 }, // 3 per hour
  '/api/v1/auth/forgot-password': { windowMs: 60 * 60 * 1000, max: 3 },
  '/api/v1/documents': { windowMs: 60 * 1000, max: 30 },
  '/api/v1/chat': { windowMs: 60 * 1000, max: 60 },
  '/api/v1/admin/users/invite': { windowMs: 60 * 60 * 1000, max: 20 }, // 20 per hour
  '/api/v1/backup/restore': { windowMs: 60 * 60 * 1000, max: 2 }, // 2 per hour
  '/api/v1/backup': { windowMs: 60 * 60 * 1000, max: 5 }, // 5 per hour (backup creation)
};

/**
 * Simple KV-based rate limit check for use in individual route handlers.
 * Returns true if the request is allowed, false if the limit has been exceeded.
 */
export async function checkRateLimit(
  cache: KVNamespace,
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const current = parseInt(await cache.get(key) || '0');
  if (current >= maxRequests) return false;
  await cache.put(key, String(current + 1), { expirationTtl: windowSeconds });
  return true;
}

export async function rateLimiter(c: Context, next: Next) {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const path = c.req.path;

  // Find matching rate limit config
  let config = defaultConfig;
  for (const [pattern, cfg] of Object.entries(rateLimitConfigs)) {
    if (path.startsWith(pattern)) {
      config = cfg;
      break;
    }
  }

  const key = `ratelimit:${ip}:${path}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Get current rate limit data from KV
    const data = await c.env.CACHE.get(key, 'json') as { requests: number[]; } | null;

    let requests = data?.requests || [];

    // Filter out old requests
    requests = requests.filter((timestamp: number) => timestamp > windowStart);

    if (requests.length >= config.max) {
      const retryAfter = Math.ceil((requests[0] + config.windowMs - now) / 1000);

      c.header('X-RateLimit-Limit', config.max.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', new Date(requests[0] + config.windowMs).toISOString());
      c.header('Retry-After', retryAfter.toString());

      return c.json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      }, 429);
    }

    // Add current request
    requests.push(now);

    // Store updated data
    await c.env.CACHE.put(key, JSON.stringify({ requests }), {
      expirationTtl: Math.ceil(config.windowMs / 1000),
    });

    // Set rate limit headers
    c.header('X-RateLimit-Limit', config.max.toString());
    c.header('X-RateLimit-Remaining', (config.max - requests.length).toString());

    await next();
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    console.error('Rate limiting error:', error);
    await next();
  }
}
