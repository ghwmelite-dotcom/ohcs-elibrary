/**
 * Google Drive Integration Routes
 * Handles OAuth flow, Drive browsing, and file operations
 */

import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  getUserInfo,
  getValidAccessToken,
  listFolderContents,
  getFileMetadata,
  searchFiles,
  getFileContent,
  getFolderPath,
  createDriveConnection,
  getActiveConnections,
  getConnection,
  updateConnection,
  deleteConnection,
  linkDriveFileToLibrary,
  bulkLinkDriveFiles,
  extractTextFromDriveFile,
  GOOGLE_EXPORT_MIMES,
  getFileCategory,
  type GoogleDriveConnection,
  type DriveFile,
} from '../services/googleDrive';

interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
  JWT_SECRET: string;
  GOOGLE_DRIVE_CLIENT_ID: string;
  GOOGLE_DRIVE_CLIENT_SECRET: string;
  GOOGLE_DRIVE_REDIRECT_URI: string;
}

interface Variables {
  userId?: string;
  userRole?: string;
  userName?: string;
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// Require auth middleware
async function requireAuth(c: AppContext, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
  }

  try {
    const { verify } = await import('hono/jwt');
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);

    if (!payload?.sub) {
      return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401);
    }

    c.set('userId', payload.sub as string);
    c.set('userRole', (payload.role as string) || 'user');
    c.set('userName', (payload.name as string) || '');

    await next();
  } catch {
    return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401);
  }
}

// Require admin role
async function requireAdmin(c: AppContext, next: Next) {
  const role = c.get('userRole');
  if (!['admin', 'super_admin', 'librarian'].includes(role || '')) {
    return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
  }
  await next();
}

export const googleDriveRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Allowed origins for CORS (must stay in sync with documents.ts)
const ALLOWED_ORIGINS = [
  'https://ohcs-elibrary.pages.dev',
  'https://ohcs-elibrary.gov.gh',
  'http://localhost:5173',
  'http://localhost:3000',
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.match(/^https:\/\/[a-z0-9]+\.ohcs-elibrary\.pages\.dev$/)) return true;
  return false;
}

// Apply auth to all routes
googleDriveRoutes.use('*', requireAuth);

// ============================================================================
// OAuth Flow Routes
// ============================================================================

/**
 * GET /google-drive/auth/url
 * Get OAuth authorization URL
 */
googleDriveRoutes.get('/auth/url', requireAdmin, async (c: AppContext) => {
  try {
    const userId = c.get('userId');
    const stateData = JSON.stringify({
      userId,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
    });
    const state = btoa(stateData);

    // Store state in KV for validation
    await c.env.CACHE.put(`gdrive_oauth_state:${state}`, userId!, { expirationTtl: 600 });

    const authUrl = getAuthorizationUrl(c.env, state);

    return c.json({ authUrl, state });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return c.json({ error: 'Failed to generate authorization URL' }, 500);
  }
});

/**
 * POST /google-drive/auth/callback
 * Handle OAuth callback
 */
googleDriveRoutes.post('/auth/callback', requireAdmin, async (c: AppContext) => {
  try {
    const { code, state, name, description, rootFolderId } = await c.req.json();
    const userId = c.get('userId');
    const userName = c.get('userName');

    if (!code || !state) {
      return c.json({ error: 'Missing code or state' }, 400);
    }

    // Validate state
    const storedUserId = await c.env.CACHE.get(`gdrive_oauth_state:${state}`);
    if (!storedUserId || storedUserId !== userId) {
      return c.json({ error: 'Invalid or expired state' }, 400);
    }

    // Clean up state
    await c.env.CACHE.delete(`gdrive_oauth_state:${state}`);

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(c.env, code);

    // Get user info from Google
    const userInfo = await getUserInfo(tokens.accessToken);

    // Calculate token expiry
    const tokenExpiry = Math.floor(Date.now() / 1000) + tokens.expiresIn;

    // Get root folder name if specified
    let rootFolderName: string | undefined;
    if (rootFolderId && rootFolderId !== 'root') {
      try {
        const folderMeta = await getFileMetadata(tokens.accessToken, rootFolderId);
        rootFolderName = folderMeta.name;
      } catch {
        // Ignore error, folder name is optional
      }
    }

    // Create connection
    const connection = await createDriveConnection(c.env, {
      name: name || `${userInfo.name}'s Drive`,
      description,
      driveEmail: userInfo.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry,
      rootFolderId: rootFolderId || undefined,
      rootFolderName,
      connectedById: userId!,
      connectedByName: userName,
    });

    return c.json({
      success: true,
      connection: {
        id: connection.id,
        name: connection.name,
        driveEmail: connection.driveEmail,
        rootFolderId: connection.rootFolderId,
        rootFolderName: connection.rootFolderName,
        createdAt: connection.createdAt,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Failed to complete authentication' }, 500);
  }
});

// ============================================================================
// Connection Management Routes
// ============================================================================

/**
 * GET /google-drive/connections
 * List all Drive connections
 */
googleDriveRoutes.get('/connections', async (c: AppContext) => {
  try {
    const connections = await getActiveConnections(c.env);

    // Don't expose sensitive tokens
    const safeConnections = connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      description: conn.description,
      driveEmail: conn.driveEmail,
      rootFolderId: conn.rootFolderId,
      rootFolderName: conn.rootFolderName,
      isActive: conn.isActive,
      lastSyncAt: conn.lastSyncAt,
      totalFilesLinked: conn.totalFilesLinked,
      connectedByName: conn.connectedByName,
      createdAt: conn.createdAt,
    }));

    return c.json(safeConnections);
  } catch (error) {
    console.error('Error listing connections:', error);
    return c.json({ error: 'Failed to list connections' }, 500);
  }
});

/**
 * GET /google-drive/connections/:id
 * Get a specific connection
 */
googleDriveRoutes.get('/connections/:id', async (c: AppContext) => {
  try {
    const connectionId = c.req.param('id');
    const connection = await getConnection(c.env, connectionId);

    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    return c.json({
      id: connection.id,
      name: connection.name,
      description: connection.description,
      driveEmail: connection.driveEmail,
      rootFolderId: connection.rootFolderId,
      rootFolderName: connection.rootFolderName,
      isActive: connection.isActive,
      lastSyncAt: connection.lastSyncAt,
      totalFilesLinked: connection.totalFilesLinked,
      connectedByName: connection.connectedByName,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    });
  } catch (error) {
    console.error('Error getting connection:', error);
    return c.json({ error: 'Failed to get connection' }, 500);
  }
});

/**
 * PATCH /google-drive/connections/:id
 * Update a connection
 */
googleDriveRoutes.patch('/connections/:id', requireAdmin, async (c: AppContext) => {
  try {
    const connectionId = c.req.param('id');
    const updates = await c.req.json();

    const connection = await getConnection(c.env, connectionId);
    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    await updateConnection(c.env, connectionId, {
      name: updates.name,
      description: updates.description,
      rootFolderId: updates.rootFolderId,
      rootFolderName: updates.rootFolderName,
      isActive: updates.isActive,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating connection:', error);
    return c.json({ error: 'Failed to update connection' }, 500);
  }
});

/**
 * DELETE /google-drive/connections/:id
 * Delete a connection
 */
googleDriveRoutes.delete('/connections/:id', requireAdmin, async (c: AppContext) => {
  try {
    const connectionId = c.req.param('id');

    const connection = await getConnection(c.env, connectionId);
    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    await deleteConnection(c.env, connectionId);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return c.json({ error: 'Failed to delete connection' }, 500);
  }
});

// ============================================================================
// Drive Browsing Routes
// ============================================================================

/**
 * GET /google-drive/browse/:connectionId
 * Browse files in a connected Drive
 */
googleDriveRoutes.get('/browse/:connectionId', async (c: AppContext) => {
  try {
    const connectionId = c.req.param('connectionId');
    const folderId = c.req.query('folderId') || 'root';
    const pageToken = c.req.query('pageToken');

    const connection = await getConnection(c.env, connectionId);
    if (!connection || !connection.isActive) {
      return c.json({ error: 'Connection not found or inactive' }, 404);
    }

    // Use root folder from connection if set and folderId is 'root'
    const effectiveFolderId = folderId === 'root' && connection.rootFolderId
      ? connection.rootFolderId
      : folderId;

    const accessToken = await getValidAccessToken(c.env, connection);
    const contents = await listFolderContents(accessToken, effectiveFolderId, pageToken || undefined);

    // Get folder path for breadcrumbs
    const path = effectiveFolderId !== 'root'
      ? await getFolderPath(accessToken, effectiveFolderId)
      : [{ id: 'root', name: connection.rootFolderName || 'My Drive' }];

    return c.json({
      ...contents,
      path,
      connectionId,
      connectionName: connection.name,
    });
  } catch (error) {
    console.error('Error browsing Drive:', error);
    return c.json({ error: 'Failed to browse Drive' }, 500);
  }
});

/**
 * GET /google-drive/search/:connectionId
 * Search files in a connected Drive
 */
googleDriveRoutes.get('/search/:connectionId', async (c: AppContext) => {
  try {
    const connectionId = c.req.param('connectionId');
    const query = c.req.query('q');
    const folderId = c.req.query('folderId');

    if (!query) {
      return c.json({ error: 'Search query required' }, 400);
    }

    const connection = await getConnection(c.env, connectionId);
    if (!connection || !connection.isActive) {
      return c.json({ error: 'Connection not found or inactive' }, 404);
    }

    const accessToken = await getValidAccessToken(c.env, connection);
    const files = await searchFiles(accessToken, query, folderId || connection.rootFolderId);

    return c.json({
      files,
      query,
      connectionId,
    });
  } catch (error) {
    console.error('Error searching Drive:', error);
    return c.json({ error: 'Failed to search Drive' }, 500);
  }
});

/**
 * GET /google-drive/file/:connectionId/:fileId
 * Get metadata for a specific file
 */
googleDriveRoutes.get('/file/:connectionId/:fileId', async (c: AppContext) => {
  try {
    const connectionId = c.req.param('connectionId');
    const fileId = c.req.param('fileId');

    const connection = await getConnection(c.env, connectionId);
    if (!connection || !connection.isActive) {
      return c.json({ error: 'Connection not found or inactive' }, 404);
    }

    const accessToken = await getValidAccessToken(c.env, connection);
    const file = await getFileMetadata(accessToken, fileId);

    return c.json({
      ...file,
      fileCategory: getFileCategory(file.mimeType),
      connectionId,
    });
  } catch (error) {
    console.error('Error getting file:', error);
    return c.json({ error: 'Failed to get file' }, 500);
  }
});

// ============================================================================
// File Operations Routes
// ============================================================================

/**
 * POST /google-drive/import
 * Import (link) files from Drive to library
 */
googleDriveRoutes.post('/import', requireAdmin, async (c: AppContext) => {
  try {
    const userId = c.get('userId');
    const { connectionId, files, category, accessLevel, tags } = await c.req.json();

    if (!connectionId || !files || !Array.isArray(files) || files.length === 0) {
      return c.json({ error: 'Connection ID and files array required' }, 400);
    }

    if (!category) {
      return c.json({ error: 'Category is required' }, 400);
    }

    const connection = await getConnection(c.env, connectionId);
    if (!connection || !connection.isActive) {
      return c.json({ error: 'Connection not found or inactive' }, 404);
    }

    const accessToken = await getValidAccessToken(c.env, connection);

    // Get full metadata for each file
    const filesToImport: Array<{ driveFile: DriveFile; category: string; accessLevel?: string }> = [];

    for (const fileInfo of files) {
      try {
        const driveFile = await getFileMetadata(accessToken, fileInfo.id || fileInfo.fileId);
        filesToImport.push({
          driveFile,
          category: fileInfo.category || category,
          accessLevel: fileInfo.accessLevel || accessLevel || 'internal',
        });
      } catch (error) {
        console.error(`Failed to get metadata for file ${fileInfo.id}:`, error);
      }
    }

    if (filesToImport.length === 0) {
      return c.json({ error: 'No valid files to import' }, 400);
    }

    const result = await bulkLinkDriveFiles(c.env, connectionId, filesToImport, userId!);

    return c.json({
      success: true,
      imported: result.success,
      failed: result.failed,
      documentIds: result.documentIds,
    });
  } catch (error) {
    console.error('Error importing files:', error);
    return c.json({ error: 'Failed to import files' }, 500);
  }
});

/**
 * POST /google-drive/import-folder
 * Import all files in a folder recursively
 */
googleDriveRoutes.post('/import-folder', requireAdmin, async (c: AppContext) => {
  try {
    const userId = c.get('userId');
    const { connectionId, folderId, folderName, category, accessLevel } = await c.req.json();

    if (!connectionId || !folderId) {
      return c.json({ error: 'Connection ID and folder ID required' }, 400);
    }

    if (!category) {
      return c.json({ error: 'Category is required' }, 400);
    }

    const connection = await getConnection(c.env, connectionId);
    if (!connection || !connection.isActive) {
      return c.json({ error: 'Connection not found or inactive' }, 404);
    }

    const accessToken = await getValidAccessToken(c.env, connection);

    // Recursively collect all files from the folder
    const allFiles: DriveFile[] = [];

    async function collectFilesFromFolder(parentFolderId: string): Promise<void> {
      let pageToken: string | undefined;

      do {
        const contents = await listFolderContents(accessToken, parentFolderId, pageToken);

        // Add files to the list
        allFiles.push(...contents.files);

        // Recursively process subfolders
        for (const subfolder of contents.folders) {
          await collectFilesFromFolder(subfolder.id);
        }

        pageToken = contents.nextPageToken;
      } while (pageToken);
    }

    await collectFilesFromFolder(folderId);

    if (allFiles.length === 0) {
      return c.json({
        success: true,
        imported: 0,
        message: 'No files found in the folder',
      });
    }

    // Import all collected files
    const filesToImport = allFiles.map((driveFile) => ({
      driveFile,
      category,
      accessLevel: accessLevel || 'internal',
    }));

    const result = await bulkLinkDriveFiles(c.env, connectionId, filesToImport, userId!);

    return c.json({
      success: true,
      imported: result.success,
      failed: result.failed,
      documentIds: result.documentIds,
      folderName,
    });
  } catch (error) {
    console.error('Error importing folder:', error);
    return c.json({ error: 'Failed to import folder' }, 500);
  }
});

/**
 * POST /google-drive/import-single
 * Import a single file with full options
 */
googleDriveRoutes.post('/import-single', requireAdmin, async (c: AppContext) => {
  try {
    const userId = c.get('userId');
    const {
      connectionId,
      fileId,
      title,
      description,
      category,
      tags,
      accessLevel,
    } = await c.req.json();

    if (!connectionId || !fileId || !category) {
      return c.json({ error: 'Connection ID, file ID, and category are required' }, 400);
    }

    const connection = await getConnection(c.env, connectionId);
    if (!connection || !connection.isActive) {
      return c.json({ error: 'Connection not found or inactive' }, 404);
    }

    const accessToken = await getValidAccessToken(c.env, connection);
    const driveFile = await getFileMetadata(accessToken, fileId);

    const documentId = await linkDriveFileToLibrary(c.env, connectionId, driveFile, {
      title,
      description,
      category,
      tags,
      accessLevel,
      authorId: userId!,
    });

    return c.json({
      success: true,
      documentId,
      document: {
        id: documentId,
        title: title || driveFile.name,
        source: 'google_drive',
        externalFileId: driveFile.id,
      },
    });
  } catch (error) {
    console.error('Error importing file:', error);
    return c.json({ error: 'Failed to import file' }, 500);
  }
});

/**
 * POST /google-drive/sync
 * Sync a connection to find and import new files
 */
googleDriveRoutes.post('/sync', requireAdmin, async (c: AppContext) => {
  try {
    const userId = c.get('userId');
    const { connectionId, folderId, category, accessLevel } = await c.req.json();

    if (!connectionId) {
      return c.json({ error: 'Connection ID is required' }, 400);
    }

    if (!category) {
      return c.json({ error: 'Category is required' }, 400);
    }

    const connection = await getConnection(c.env, connectionId);
    if (!connection || !connection.isActive) {
      return c.json({ error: 'Connection not found or inactive' }, 404);
    }

    const accessToken = await getValidAccessToken(c.env, connection);

    // Get all existing documents for this connection
    const { results: existingDocs } = await c.env.DB.prepare(`
      SELECT externalFileId FROM documents WHERE driveConnectionId = ?
    `).bind(connectionId).all();

    const existingFileIds = new Set((existingDocs || []).map((d: any) => d.externalFileId));

    // Determine which folder to sync
    const syncFolderId = folderId || connection.rootFolderId || 'root';

    // Recursively collect all files from the folder
    const allFiles: DriveFile[] = [];

    async function collectFilesFromFolder(parentFolderId: string): Promise<void> {
      let pageToken: string | undefined;

      do {
        const contents = await listFolderContents(accessToken, parentFolderId, pageToken);

        // Add files to the list
        allFiles.push(...contents.files);

        // Recursively process subfolders
        for (const subfolder of contents.folders) {
          await collectFilesFromFolder(subfolder.id);
        }

        pageToken = contents.nextPageToken;
      } while (pageToken);
    }

    await collectFilesFromFolder(syncFolderId);

    // Filter out files that are already imported
    const newFiles = allFiles.filter(file => !existingFileIds.has(file.id));

    if (newFiles.length === 0) {
      // Update last sync time
      await c.env.DB.prepare(`
        UPDATE google_drive_connections SET lastSyncAt = datetime('now') WHERE id = ?
      `).bind(connectionId).run();

      return c.json({
        success: true,
        message: 'No new files found',
        total: allFiles.length,
        existing: existingFileIds.size,
        newFiles: 0,
        imported: 0,
      });
    }

    // Import new files
    const filesToImport = newFiles.map((driveFile) => ({
      driveFile,
      category,
      accessLevel: accessLevel || 'internal',
    }));

    const result = await bulkLinkDriveFiles(c.env, connectionId, filesToImport, userId!);

    // Update last sync time
    await c.env.DB.prepare(`
      UPDATE google_drive_connections SET lastSyncAt = datetime('now') WHERE id = ?
    `).bind(connectionId).run();

    return c.json({
      success: true,
      total: allFiles.length,
      existing: existingFileIds.size,
      newFiles: newFiles.length,
      imported: result.success,
      failed: result.failed,
      documentIds: result.documentIds,
    });
  } catch (error) {
    console.error('Error syncing:', error);
    return c.json({ error: 'Failed to sync files' }, 500);
  }
});

// ============================================================================
// Streaming Routes (for viewing Drive files)
// ============================================================================

/**
 * GET /google-drive/stream/:documentId
 * Stream a Drive file for viewing
 */
googleDriveRoutes.get('/stream/:documentId', async (c: AppContext) => {
  try {
    const documentId = c.req.param('documentId');

    // Get document from database
    const document = await c.env.DB.prepare(`
      SELECT d.*, gc.id as connectionId
      FROM documents d
      LEFT JOIN google_drive_connections gc ON d.driveConnectionId = gc.id
      WHERE d.id = ? AND d.source = 'google_drive'
    `).bind(documentId).first() as any;

    if (!document) {
      return c.json({ error: 'Document not found or not a Drive file' }, 404);
    }

    if (!document.connectionId) {
      return c.json({ error: 'Drive connection not found' }, 404);
    }

    const connection = await getConnection(c.env, document.connectionId);
    if (!connection || !connection.isActive) {
      return c.json({ error: 'Drive connection inactive' }, 404);
    }

    const accessToken = await getValidAccessToken(c.env, connection);
    const { response, contentType } = await getFileContent(
      accessToken,
      document.externalFileId,
      document.externalMimeType,
      true // Export Office files as PDF for viewing
    );

    // Return streamed content with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${document.fileName}"`);
    headers.set('Cache-Control', 'private, max-age=3600');

    // CORS headers — restrict to known origins only
    const origin = c.req.header('Origin') || '';
    if (origin && isAllowedOrigin(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return new Response(response.body, { headers });
  } catch (error) {
    console.error('Error streaming file:', error);
    return c.json({ error: 'Failed to stream file' }, 500);
  }
});

/**
 * GET /google-drive/stream-direct/:connectionId/:fileId
 * Stream a Drive file directly (for preview before import)
 */
googleDriveRoutes.get('/stream-direct/:connectionId/:fileId', async (c: AppContext) => {
  try {
    const connectionId = c.req.param('connectionId');
    const fileId = c.req.param('fileId');

    const connection = await getConnection(c.env, connectionId);
    if (!connection || !connection.isActive) {
      return c.json({ error: 'Connection not found or inactive' }, 404);
    }

    const accessToken = await getValidAccessToken(c.env, connection);
    const fileMeta = await getFileMetadata(accessToken, fileId);
    const { response, contentType } = await getFileContent(
      accessToken,
      fileId,
      fileMeta.mimeType,
      true // Export Office files as PDF for viewing
    );

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${fileMeta.name}"`);
    headers.set('Cache-Control', 'private, max-age=3600');

    // CORS headers — restrict to known origins only
    const origin = c.req.header('Origin') || '';
    if (origin && isAllowedOrigin(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return new Response(response.body, { headers });
  } catch (error) {
    console.error('Error streaming file:', error);
    return c.json({ error: 'Failed to stream file' }, 500);
  }
});

// ============================================================================
// AI Analysis for Drive Files
// ============================================================================

/**
 * POST /google-drive/extract-text/:documentId
 * Extract text from a Drive file for AI analysis
 */
googleDriveRoutes.post('/extract-text/:documentId', async (c: AppContext) => {
  try {
    const documentId = c.req.param('documentId');

    // Get document from database
    const document = await c.env.DB.prepare(`
      SELECT d.*, gc.id as connectionId
      FROM documents d
      LEFT JOIN google_drive_connections gc ON d.driveConnectionId = gc.id
      WHERE d.id = ? AND d.source = 'google_drive'
    `).bind(documentId).first() as any;

    if (!document) {
      return c.json({ error: 'Document not found or not a Drive file' }, 404);
    }

    if (!document.connectionId) {
      return c.json({ error: 'Drive connection not found' }, 404);
    }

    const connection = await getConnection(c.env, document.connectionId);
    if (!connection || !connection.isActive) {
      return c.json({ error: 'Drive connection inactive' }, 404);
    }

    const accessToken = await getValidAccessToken(c.env, connection);
    const extractedText = await extractTextFromDriveFile(
      accessToken,
      document.externalFileId,
      document.externalMimeType
    );

    return c.json({
      documentId,
      extractedText,
      length: extractedText.length,
    });
  } catch (error) {
    console.error('Error extracting text:', error);
    return c.json({ error: 'Failed to extract text' }, 500);
  }
});

export default googleDriveRoutes;
