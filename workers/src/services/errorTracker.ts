/**
 * Built-in Error Tracking Service
 * Stores errors in KV for persistent tracking without external services.
 * All operations are fire-and-forget — never throws from tracking calls.
 */

export interface TrackedError {
  id: string;
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
  message: string;
  stack?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

interface RecentErrorSummary {
  id: string;
  path: string;
  method: string;
  message: string;
  timestamp: string;
  statusCode: number;
}

/**
 * Persist a tracked error to KV.
 * Stores individual error detail, increments daily count, and updates the recent-errors list.
 */
export async function trackError(cache: KVNamespace, error: TrackedError): Promise<void> {
  try {
    const TTL = 604800; // 7 days

    // Store individual error (retrievable by id)
    await cache.put(`error:${error.id}`, JSON.stringify(error), { expirationTtl: TTL });

    // Update daily error count
    const today = error.timestamp.split('T')[0];
    const countKey = `error-count:${today}`;
    const currentCount = parseInt(await cache.get(countKey) || '0', 10) + 1;
    await cache.put(countKey, String(currentCount), { expirationTtl: TTL });

    // Maintain a rolling list of the 50 most recent errors
    const recentKey = 'errors:recent';
    const recentRaw = await cache.get(recentKey);
    const recent: RecentErrorSummary[] = recentRaw ? JSON.parse(recentRaw) : [];

    recent.unshift({
      id: error.id,
      path: error.path,
      method: error.method,
      message: error.message,
      timestamp: error.timestamp,
      statusCode: error.statusCode,
    });

    if (recent.length > 50) recent.length = 50;

    await cache.put(recentKey, JSON.stringify(recent), { expirationTtl: TTL });
  } catch {
    // Never throw from error tracker — swallow silently
  }
}

/**
 * Return the 50 most recent tracked errors (summaries).
 */
export async function getRecentErrors(cache: KVNamespace): Promise<RecentErrorSummary[]> {
  try {
    const raw = await cache.get('errors:recent');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Return daily error counts for the last N days (default 7).
 */
export async function getErrorTrend(
  cache: KVNamespace,
  days: number = 7,
): Promise<Array<{ date: string; count: number }>> {
  try {
    const trend: Array<{ date: string; count: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 86_400_000).toISOString().split('T')[0];
      const raw = await cache.get(`error-count:${date}`);
      trend.push({ date, count: parseInt(raw || '0', 10) });
    }

    return trend.reverse();
  } catch {
    return [];
  }
}

/**
 * Retrieve full detail for a single tracked error by id.
 */
export async function getErrorById(cache: KVNamespace, id: string): Promise<TrackedError | null> {
  try {
    const raw = await cache.get(`error:${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
