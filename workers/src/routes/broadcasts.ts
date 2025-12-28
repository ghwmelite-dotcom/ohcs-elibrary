import { Hono } from 'hono';
import { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Helper to generate unique IDs
function generateId(): string {
  return `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Middleware to check admin role
async function requireAdmin(c: any, next: () => Promise<void>) {
  const user = c.get('user');
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
}

// GET /broadcasts - Get all broadcasts (admin view)
app.get('/', requireAdmin, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const status = c.req.query('status'); // active, expired, scheduled, all

  try {
    let whereClause = '1=1';

    if (status === 'active') {
      whereClause = 'is_active = 1 AND (expires_at IS NULL OR expires_at > datetime("now"))';
    } else if (status === 'expired') {
      whereClause = 'expires_at <= datetime("now")';
    } else if (status === 'scheduled') {
      whereClause = 'scheduled_at > datetime("now")';
    }

    const broadcasts = await c.env.DB.prepare(`
      SELECT
        b.*,
        u.displayName as creatorName,
        u.avatar as creatorAvatar,
        (SELECT COUNT(*) FROM broadcast_acknowledgments WHERE broadcast_id = b.id) as acknowledgedCount
      FROM broadcasts b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM broadcasts WHERE ${whereClause}
    `).first();

    return c.json({
      broadcasts: broadcasts.results.map((b: any) => ({
        ...b,
        is_active: Boolean(b.is_active),
        requires_acknowledgment: Boolean(b.requires_acknowledgment)
      })),
      pagination: {
        page,
        limit,
        total: (countResult as any)?.total || 0,
        totalPages: Math.ceil(((countResult as any)?.total || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return c.json({ error: 'Failed to fetch broadcasts' }, 500);
  }
});

// GET /broadcasts/active - Get active broadcasts for current user
app.get('/active', async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('user')?.role || 'user';

  try {
    // Get active broadcasts that haven't expired and are either scheduled for now or not scheduled
    const broadcasts = await c.env.DB.prepare(`
      SELECT
        b.*,
        u.displayName as creatorName,
        CASE WHEN ba.id IS NOT NULL THEN 1 ELSE 0 END as acknowledged
      FROM broadcasts b
      LEFT JOIN users u ON b.created_by = u.id
      LEFT JOIN broadcast_acknowledgments ba ON ba.broadcast_id = b.id AND ba.user_id = ?
      WHERE b.is_active = 1
        AND (b.expires_at IS NULL OR b.expires_at > datetime('now'))
        AND (b.scheduled_at IS NULL OR b.scheduled_at <= datetime('now'))
        AND (
          b.target_audience = 'all'
          OR b.target_audience = ?
          OR b.target_audience LIKE '%' || ? || '%'
        )
      ORDER BY
        CASE b.severity
          WHEN 'emergency' THEN 0
          WHEN 'critical' THEN 1
          WHEN 'warning' THEN 2
          WHEN 'info' THEN 3
        END,
        b.created_at DESC
    `).bind(userId || '', userRole, userRole).all();

    return c.json({
      broadcasts: broadcasts.results.map((b: any) => ({
        ...b,
        is_active: Boolean(b.is_active),
        requires_acknowledgment: Boolean(b.requires_acknowledgment),
        acknowledged: Boolean(b.acknowledged)
      }))
    });
  } catch (error) {
    console.error('Error fetching active broadcasts:', error);
    return c.json({ error: 'Failed to fetch broadcasts' }, 500);
  }
});

// GET /broadcasts/:id - Get single broadcast
app.get('/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const broadcast = await c.env.DB.prepare(`
      SELECT
        b.*,
        u.displayName as creatorName,
        u.avatar as creatorAvatar
      FROM broadcasts b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.id = ?
    `).bind(id).first();

    if (!broadcast) {
      return c.json({ error: 'Broadcast not found' }, 404);
    }

    return c.json({
      ...broadcast,
      is_active: Boolean((broadcast as any).is_active),
      requires_acknowledgment: Boolean((broadcast as any).requires_acknowledgment)
    });
  } catch (error) {
    console.error('Error fetching broadcast:', error);
    return c.json({ error: 'Failed to fetch broadcast' }, 500);
  }
});

// POST /broadcasts - Create new broadcast (admin only)
app.post('/', requireAdmin, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const {
    title,
    message,
    severity = 'info',
    target_audience = 'all',
    requires_acknowledgment = false,
    scheduled_at,
    expires_at
  } = body;

  if (!title || !message) {
    return c.json({ error: 'Title and message are required' }, 400);
  }

  if (!['info', 'warning', 'critical', 'emergency'].includes(severity)) {
    return c.json({ error: 'Invalid severity level' }, 400);
  }

  try {
    const id = generateId();

    await c.env.DB.prepare(`
      INSERT INTO broadcasts (
        id, title, message, severity, target_audience,
        requires_acknowledgment, scheduled_at, expires_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, title, message, severity, target_audience,
      requires_acknowledgment ? 1 : 0,
      scheduled_at || null,
      expires_at || null,
      user.id
    ).run();

    return c.json({
      success: true,
      id,
      message: scheduled_at ? 'Broadcast scheduled successfully' : 'Broadcast sent successfully'
    });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return c.json({ error: 'Failed to create broadcast' }, 500);
  }
});

// PUT /broadcasts/:id - Update broadcast (admin only)
app.put('/:id', requireAdmin, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();

  const {
    title,
    message,
    severity,
    target_audience,
    is_active,
    requires_acknowledgment,
    scheduled_at,
    expires_at
  } = body;

  try {
    // Check if broadcast exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM broadcasts WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return c.json({ error: 'Broadcast not found' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE broadcasts SET
        title = COALESCE(?, title),
        message = COALESCE(?, message),
        severity = COALESCE(?, severity),
        target_audience = COALESCE(?, target_audience),
        is_active = COALESCE(?, is_active),
        requires_acknowledgment = COALESCE(?, requires_acknowledgment),
        scheduled_at = ?,
        expires_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      title || null,
      message || null,
      severity || null,
      target_audience || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      requires_acknowledgment !== undefined ? (requires_acknowledgment ? 1 : 0) : null,
      scheduled_at !== undefined ? scheduled_at : null,
      expires_at !== undefined ? expires_at : null,
      id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating broadcast:', error);
    return c.json({ error: 'Failed to update broadcast' }, 500);
  }
});

// DELETE /broadcasts/:id - Delete broadcast (admin only)
app.delete('/:id', requireAdmin, async (c) => {
  const { id } = c.req.param();

  try {
    await c.env.DB.prepare(`
      DELETE FROM broadcasts WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    return c.json({ error: 'Failed to delete broadcast' }, 500);
  }
});

// POST /broadcasts/:id/acknowledge - Acknowledge a broadcast
// Supports both authenticated users and anonymous acknowledgment via session ID
app.post('/:id/acknowledge', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();

  // Get anonymous session ID from header if not authenticated
  const anonymousId = c.req.header('X-Anonymous-Id');

  // Require either userId or anonymousId
  const identifier = userId || anonymousId;
  const identifierType = userId ? 'user' : 'anonymous';

  if (!identifier) {
    return c.json({ error: 'Authentication or anonymous ID required' }, 401);
  }

  // For anonymous users, use the anonymous ID as the user_id with a special prefix
  // This works because user_id column is NOT NULL
  const effectiveUserId = userId || `anon:${anonymousId}`;

  try {
    // Check if already acknowledged
    const existing = await c.env.DB.prepare(`
      SELECT id FROM broadcast_acknowledgments
      WHERE broadcast_id = ? AND user_id = ?
    `).bind(id, effectiveUserId).first();

    if (existing) {
      return c.json({ success: true, message: 'Already acknowledged' });
    }

    const ackId = `ack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await c.env.DB.prepare(`
      INSERT INTO broadcast_acknowledgments (id, broadcast_id, user_id, anonymous_id)
      VALUES (?, ?, ?, ?)
    `).bind(ackId, id, effectiveUserId, anonymousId || null).run();

    return c.json({ success: true, identifierType });
  } catch (error) {
    console.error('Error acknowledging broadcast:', error);
    return c.json({ error: 'Failed to acknowledge broadcast' }, 500);
  }
});

// GET /broadcasts/:id/acknowledgments - Get acknowledgment stats (admin only)
app.get('/:id/acknowledgments', requireAdmin, async (c) => {
  const { id } = c.req.param();
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;

  try {
    const acknowledgments = await c.env.DB.prepare(`
      SELECT
        ba.acknowledged_at,
        u.id as userId,
        u.displayName,
        u.email,
        u.avatar,
        u.department
      FROM broadcast_acknowledgments ba
      JOIN users u ON ba.user_id = u.id
      WHERE ba.broadcast_id = ?
      ORDER BY ba.acknowledged_at DESC
      LIMIT ? OFFSET ?
    `).bind(id, limit, offset).all();

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM broadcast_acknowledgments WHERE broadcast_id = ?
    `).bind(id).first();

    // Get total users for percentage
    const totalUsersResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM users WHERE isActive = 1
    `).first();

    return c.json({
      acknowledgments: acknowledgments.results,
      stats: {
        acknowledged: (countResult as any)?.total || 0,
        totalUsers: (totalUsersResult as any)?.total || 0,
        percentage: Math.round((((countResult as any)?.total || 0) / ((totalUsersResult as any)?.total || 1)) * 100)
      },
      pagination: {
        page,
        limit,
        total: (countResult as any)?.total || 0,
        totalPages: Math.ceil(((countResult as any)?.total || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching acknowledgments:', error);
    return c.json({ error: 'Failed to fetch acknowledgments' }, 500);
  }
});

// POST /broadcasts/:id/deactivate - Deactivate broadcast (admin only)
app.post('/:id/deactivate', requireAdmin, async (c) => {
  const { id } = c.req.param();

  try {
    await c.env.DB.prepare(`
      UPDATE broadcasts SET is_active = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deactivating broadcast:', error);
    return c.json({ error: 'Failed to deactivate broadcast' }, 500);
  }
});

export default app;
