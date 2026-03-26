import { Hono } from 'hono';
import type { Context } from 'hono';

interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  JWT_SECRET: string;
}

interface Variables {
  userId: string;
  userRole: string;
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export const backupRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Tables to backup (in order for proper restoration)
const BACKUP_TABLES = [
  'users',
  'roles',
  'user_roles',
  'mdas',
  'documents',
  'document_ratings',
  'document_views',
  'document_ai_analysis',
  'document_chat_history',
  'bookmarks',
  'forum_categories',
  'forum_topics',
  'forum_posts',
  'forum_reactions',
  'chat_rooms',
  'chat_room_members',
  'chat_messages',
  'groups',
  'group_members',
  'group_posts',
  'group_post_comments',
  'news_sources',
  'news_articles',
  'news_bookmarks',
  'notifications',
  'user_xp',
  'user_badges',
  'user_streaks',
  'counselor_sessions',
  'counselor_messages',
  'mood_entries',
  'wellness_resources',
  'wellness_bookmarks',
  'counselor_escalations',
  'counselor_assignments',
];

// Check if user is admin or super_admin
function requireAdmin(c: AppContext): boolean {
  const user = c.get('user') as { role?: string } | undefined;
  const role = user?.role;
  return typeof role === 'string' && ['admin', 'super_admin', 'director'].includes(role);
}

// Check if user is super_admin (for destructive operations)
function requireSuperAdmin(c: AppContext): boolean {
  const user = c.get('user') as { role?: string } | undefined;
  const role = user?.role;
  return role === 'super_admin';
}

// Validate a table name against the allowlist to prevent SQL injection
// (SQLite does not support parameterized identifiers, so we validate manually)
function assertValidTable(table: string): void {
  if (!BACKUP_TABLES.includes(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
}

// GET /backup - List all backups
backupRoutes.get('/', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized - Admin access required' }, 403);
  }

  try {
    const { DOCUMENTS } = c.env;

    // List all backup files in R2
    const list = await DOCUMENTS.list({ prefix: 'backups/' });

    const backups = list.objects
      .filter(obj => obj.key.endsWith('.json'))
      .map(obj => {
        const filename = obj.key.replace('backups/', '');
        const parts = filename.replace('.json', '').split('_');
        const type = parts[0]; // 'manual' or 'auto'
        const timestamp = parts.slice(1).join('_');

        return {
          id: obj.key,
          filename,
          type,
          size: obj.size,
          sizeFormatted: formatBytes(obj.size),
          createdAt: obj.uploaded.toISOString(),
          timestamp,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({
      backups,
      total: backups.length,
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    return c.json({ error: 'Failed to list backups' }, 500);
  }
});

// POST /backup - Create a new backup
backupRoutes.post('/', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized - Admin access required' }, 403);
  }

  try {
    const { DB, DOCUMENTS } = c.env;
    const body = await c.req.json().catch(() => ({}));
    const backupType = body.type || 'manual';

    console.log(`Starting ${backupType} backup...`);

    // Export all tables
    const backupData: Record<string, any[]> = {};
    const tableStats: Record<string, number> = {};

    for (const table of BACKUP_TABLES) {
      try {
        assertValidTable(table); // Validate against allowlist before interpolating
        const { results } = await DB.prepare(`SELECT * FROM ${table}`).all();
        backupData[table] = results || [];
        tableStats[table] = results?.length || 0;
        console.log(`Backed up ${table}: ${tableStats[table]} rows`);
      } catch (e) {
        // Table might not exist, skip it
        console.log(`Skipping table ${table}: ${e}`);
        backupData[table] = [];
        tableStats[table] = 0;
      }
    }

    // Create backup metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${backupType}_${timestamp}.json`;
    const backupKey = `backups/${filename}`;

    const user = c.get('user') as { id?: string } | undefined;
    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      createdBy: user?.id || 'unknown',
      type: backupType,
      tables: tableStats,
      data: backupData,
    };

    // Store in R2
    const backupJson = JSON.stringify(backup, null, 2);
    await DOCUMENTS.put(backupKey, backupJson, {
      httpMetadata: {
        contentType: 'application/json',
      },
      customMetadata: {
        type: backupType,
        createdBy: user?.id || 'unknown',
      },
    });

    // Get the stored object to return size
    const storedObject = await DOCUMENTS.head(backupKey);

    console.log(`Backup created: ${backupKey} (${formatBytes(storedObject?.size || 0)})`);

    return c.json({
      success: true,
      backup: {
        id: backupKey,
        filename,
        type: backupType,
        size: storedObject?.size || 0,
        sizeFormatted: formatBytes(storedObject?.size || 0),
        createdAt: new Date().toISOString(),
        tables: tableStats,
        totalRows: Object.values(tableStats).reduce((a, b) => a + b, 0),
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return c.json({ error: 'Failed to create backup', details: String(error) }, 500);
  }
});

// GET /backup/:id - Download a specific backup
backupRoutes.get('/:id', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized - Admin access required' }, 403);
  }

  try {
    const { DOCUMENTS } = c.env;
    const backupId = c.req.param('id');

    // The ID is the full key, but URL-encoded
    const backupKey = decodeURIComponent(backupId);

    const object = await DOCUMENTS.get(backupKey);
    if (!object) {
      return c.json({ error: 'Backup not found' }, 404);
    }

    const filename = backupKey.replace('backups/', '');

    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading backup:', error);
    return c.json({ error: 'Failed to download backup' }, 500);
  }
});

// POST /backup/restore/:id - Restore from a backup (super_admin only — destructive operation)
backupRoutes.post('/restore/:id', async (c: AppContext) => {
  if (!requireSuperAdmin(c)) {
    return c.json({ error: 'Unauthorized - Super Admin access required for restore operations' }, 403);
  }

  try {
    const { DB, DOCUMENTS } = c.env;
    const backupId = c.req.param('id');
    const backupKey = decodeURIComponent(backupId);

    console.log(`Starting restore from: ${backupKey}`);

    // Get backup from R2
    const object = await DOCUMENTS.get(backupKey);
    if (!object) {
      return c.json({ error: 'Backup not found' }, 404);
    }

    const backupJson = await object.text();
    const backup = JSON.parse(backupJson);

    if (!backup.data) {
      return c.json({ error: 'Invalid backup format' }, 400);
    }

    const restoreStats: Record<string, { deleted: number; inserted: number }> = {};

    // Restore tables in reverse order (to handle foreign key constraints)
    const tablesToRestore = [...BACKUP_TABLES].reverse();

    // First, delete all data from tables (in reverse order to handle FK)
    for (const table of tablesToRestore) {
      try {
        assertValidTable(table); // Validate against allowlist before interpolating
        const deleteResult = await DB.prepare(`DELETE FROM ${table}`).run();
        restoreStats[table] = { deleted: deleteResult.meta.changes || 0, inserted: 0 };
      } catch (e) {
        console.log(`Could not clear table ${table}: ${e}`);
        restoreStats[table] = { deleted: 0, inserted: 0 };
      }
    }

    // Then insert data in original order
    for (const table of BACKUP_TABLES) {
      const rows = backup.data[table] || [];
      if (rows.length === 0) continue;

      try {
        assertValidTable(table); // Validate against allowlist before interpolating
        // Get column names from first row
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const insertSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

        let insertedCount = 0;
        for (const row of rows) {
          try {
            const values = columns.map(col => row[col]);
            await DB.prepare(insertSql).bind(...values).run();
            insertedCount++;
          } catch (e) {
            console.log(`Error inserting row into ${table}: ${e}`);
          }
        }

        restoreStats[table].inserted = insertedCount;
        console.log(`Restored ${table}: ${insertedCount} rows`);
      } catch (e) {
        console.log(`Error restoring table ${table}: ${e}`);
      }
    }

    console.log('Restore completed');

    return c.json({
      success: true,
      message: 'Backup restored successfully',
      restoredFrom: {
        id: backupKey,
        createdAt: backup.createdAt,
        type: backup.type,
      },
      stats: restoreStats,
      totalRestored: Object.values(restoreStats).reduce((a, b) => a + b.inserted, 0),
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return c.json({ error: 'Failed to restore backup', details: String(error) }, 500);
  }
});

// DELETE /backup/:id - Delete a backup
backupRoutes.delete('/:id', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized - Admin access required' }, 403);
  }

  try {
    const { DOCUMENTS } = c.env;
    const backupId = c.req.param('id');
    const backupKey = decodeURIComponent(backupId);

    await DOCUMENTS.delete(backupKey);

    return c.json({ success: true, message: 'Backup deleted' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return c.json({ error: 'Failed to delete backup' }, 500);
  }
});

// GET /backup/stats - Get backup statistics
backupRoutes.get('/stats/summary', async (c: AppContext) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized - Admin access required' }, 403);
  }

  try {
    const { DOCUMENTS } = c.env;

    const list = await DOCUMENTS.list({ prefix: 'backups/' });
    const backups = list.objects.filter(obj => obj.key.endsWith('.json'));

    const totalSize = backups.reduce((sum, obj) => sum + obj.size, 0);
    const lastBackup = backups.length > 0
      ? backups.sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime())[0]
      : null;

    const manualCount = backups.filter(b => b.key.includes('manual_')).length;
    const autoCount = backups.filter(b => b.key.includes('auto_')).length;

    return c.json({
      totalBackups: backups.length,
      manualBackups: manualCount,
      autoBackups: autoCount,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      lastBackup: lastBackup ? {
        id: lastBackup.key,
        filename: lastBackup.key.replace('backups/', ''),
        createdAt: lastBackup.uploaded.toISOString(),
        size: lastBackup.size,
        sizeFormatted: formatBytes(lastBackup.size),
      } : null,
    });
  } catch (error) {
    console.error('Error getting backup stats:', error);
    return c.json({ error: 'Failed to get backup stats' }, 500);
  }
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export for scheduled backups
export async function createScheduledBackup(env: Env): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Starting scheduled automatic backup...');

    const backupData: Record<string, any[]> = {};
    const tableStats: Record<string, number> = {};

    for (const table of BACKUP_TABLES) {
      try {
        assertValidTable(table); // Validate against allowlist before interpolating
        const { results } = await env.DB.prepare(`SELECT * FROM ${table}`).all();
        backupData[table] = results || [];
        tableStats[table] = results?.length || 0;
      } catch (e) {
        backupData[table] = [];
        tableStats[table] = 0;
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auto_${timestamp}.json`;
    const backupKey = `backups/${filename}`;

    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      type: 'auto',
      tables: tableStats,
      data: backupData,
    };

    const backupJson = JSON.stringify(backup, null, 2);
    await env.DOCUMENTS.put(backupKey, backupJson, {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { type: 'auto', createdBy: 'system' },
    });

    // Clean up old auto backups (keep last 7)
    const list = await env.DOCUMENTS.list({ prefix: 'backups/auto_' });
    const autoBackups = list.objects
      .filter(obj => obj.key.endsWith('.json'))
      .sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime());

    if (autoBackups.length > 7) {
      const toDelete = autoBackups.slice(7);
      for (const obj of toDelete) {
        await env.DOCUMENTS.delete(obj.key);
        console.log(`Deleted old backup: ${obj.key}`);
      }
    }

    console.log(`Scheduled backup created: ${backupKey}`);
    return { success: true, message: `Backup created: ${filename}` };
  } catch (error) {
    console.error('Scheduled backup failed:', error);
    return { success: false, message: String(error) };
  }
}
