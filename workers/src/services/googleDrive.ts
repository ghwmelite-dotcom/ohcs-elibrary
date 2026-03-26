/**
 * Google Drive Integration Service
 * Handles OAuth authentication and Google Drive API operations
 */

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  GOOGLE_DRIVE_CLIENT_ID: string;
  GOOGLE_DRIVE_CLIENT_SECRET: string;
  GOOGLE_DRIVE_REDIRECT_URI: string;
}

export interface GoogleDriveConnection {
  id: string;
  name: string;
  description?: string;
  driveEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
  rootFolderId?: string;
  rootFolderName?: string;
  scope: string;
  isActive: boolean;
  lastSyncAt?: string;
  totalFilesLinked: number;
  connectedById: string;
  connectedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  parents?: string[];
  description?: string;
  starred?: boolean;
  trashed?: boolean;
  owners?: Array<{ displayName: string; emailAddress: string }>;
}

export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  webViewLink?: string;
}

export interface DriveFolderContents {
  folder: DriveFolder | null;
  files: DriveFile[];
  folders: DriveFolder[];
  nextPageToken?: string;
}

// Google Drive MIME types
export const DRIVE_MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  DOCUMENT: 'application/vnd.google-apps.document',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
  PRESENTATION: 'application/vnd.google-apps.presentation',
  PDF: 'application/pdf',
  // Audio
  AUDIO_MP3: 'audio/mpeg',
  AUDIO_WAV: 'audio/wav',
  AUDIO_OGG: 'audio/ogg',
  AUDIO_AAC: 'audio/aac',
  AUDIO_M4A: 'audio/mp4',
  // Video
  VIDEO_MP4: 'video/mp4',
  VIDEO_WEBM: 'video/webm',
  VIDEO_OGG: 'video/ogg',
  VIDEO_MOV: 'video/quicktime',
  VIDEO_AVI: 'video/x-msvideo',
  // Images
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_GIF: 'image/gif',
  IMAGE_WEBP: 'image/webp',
};

// File type categories for the library
export function getFileCategory(mimeType: string): 'document' | 'audio' | 'video' | 'image' | 'other' {
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('text')
  ) {
    return 'document';
  }
  return 'other';
}

// Export mapping for Google Docs native files
export const GOOGLE_EXPORT_MIMES: Record<string, string> = {
  'application/vnd.google-apps.document': 'application/pdf',
  'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.google-apps.presentation': 'application/pdf',
  'application/vnd.google-apps.drawing': 'image/png',
};

// Office formats that should be exported as PDF for viewing
export const OFFICE_EXPORT_TO_PDF: string[] = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.ms-powerpoint', // ppt
  'application/msword', // doc
  // Note: Excel files are better viewed as original format or converted differently
];

// Check if a MIME type should be exported as PDF
export function shouldExportAsPdf(mimeType: string): boolean {
  return OFFICE_EXPORT_TO_PDF.includes(mimeType) ||
         mimeType === 'application/vnd.google-apps.document' ||
         mimeType === 'application/vnd.google-apps.presentation';
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(env: Env, state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_DRIVE_CLIENT_ID,
    redirect_uri: env.GOOGLE_DRIVE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  env: Env,
  code: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_DRIVE_CLIENT_ID,
      client_secret: env.GOOGLE_DRIVE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: env.GOOGLE_DRIVE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json() as any;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  env: Env,
  refreshToken: string
): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_DRIVE_CLIENT_ID,
      client_secret: env.GOOGLE_DRIVE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json() as any;
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get user info from Google
 */
export async function getUserInfo(accessToken: string): Promise<{
  email: string;
  name: string;
  picture?: string;
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  const data = await response.json() as any;
  return {
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
  env: Env,
  connection: GoogleDriveConnection
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // If token is still valid (with 5 min buffer), return it
  if (connection.tokenExpiry > now + 300) {
    return connection.accessToken;
  }

  // Refresh the token
  const { accessToken, expiresIn } = await refreshAccessToken(env, connection.refreshToken);
  const newExpiry = now + expiresIn;

  // Update token in database
  await env.DB.prepare(`
    UPDATE google_drive_connections
    SET accessToken = ?, tokenExpiry = ?, updatedAt = datetime('now')
    WHERE id = ?
  `).bind(accessToken, newExpiry, connection.id).run();

  return accessToken;
}

/**
 * List files in a folder
 */
export async function listFolderContents(
  accessToken: string,
  folderId: string = 'root',
  pageToken?: string,
  pageSize: number = 100
): Promise<DriveFolderContents> {
  // Sanitize folderId: Drive file IDs are alphanumeric with underscores and hyphens.
  const safeFolderId = folderId === 'root' ? 'root' : folderId.replace(/[^a-zA-Z0-9_\-]/g, '');
  const query = safeFolderId === 'root'
    ? `'root' in parents and trashed = false`
    : `'${safeFolderId}' in parents and trashed = false`;

  const params = new URLSearchParams({
    q: query,
    fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, parents, description, owners)',
    pageSize: pageSize.toString(),
    orderBy: 'folder, name',
  });

  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list files: ${error}`);
  }

  const data = await response.json() as any;

  // Separate files and folders
  const files: DriveFile[] = [];
  const folders: DriveFolder[] = [];

  for (const item of data.files || []) {
    if (item.mimeType === DRIVE_MIME_TYPES.FOLDER) {
      folders.push(item as DriveFolder);
    } else {
      files.push(item as DriveFile);
    }
  }

  // Get folder info if not root
  let folder: DriveFolder | null = null;
  if (safeFolderId !== 'root') {
    folder = await getFileMetadata(accessToken, safeFolderId) as DriveFolder;
  }

  return {
    folder,
    files,
    folders,
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Get file metadata
 */
export async function getFileMetadata(accessToken: string, fileId: string): Promise<DriveFile> {
  const params = new URLSearchParams({
    fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, parents, description, owners',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get file metadata: ${error}`);
  }

  return await response.json() as DriveFile;
}

/**
 * Search files in Drive
 */
export async function searchFiles(
  accessToken: string,
  searchQuery: string,
  folderId?: string,
  pageSize: number = 50
): Promise<DriveFile[]> {
  // Sanitize inputs for the Drive API query language:
  // Escape backslashes first, then single-quotes, to prevent injection.
  const safeQuery = searchQuery.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  // folderId must be a Drive file ID (alphanumeric + underscores/hyphens only).
  const safeFolderId = folderId ? folderId.replace(/[^a-zA-Z0-9_\-]/g, '') : undefined;

  let query = `name contains '${safeQuery}' and trashed = false`;

  if (safeFolderId) {
    query += ` and '${safeFolderId}' in parents`;
  }

  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, parents, description)',
    pageSize: pageSize.toString(),
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to search files: ${error}`);
  }

  const data = await response.json() as any;
  return (data.files || []).filter((f: DriveFile) => f.mimeType !== DRIVE_MIME_TYPES.FOLDER);
}

/**
 * Get file content as stream (for viewing/downloading)
 * @param exportAsPdf - If true, attempt to export Office files as PDF for viewing
 */
export async function getFileContent(
  accessToken: string,
  fileId: string,
  mimeType: string,
  exportAsPdf: boolean = false
): Promise<{ response: Response; contentType: string }> {
  const safeFileId = encodeURIComponent(fileId);

  // For Google Docs native files, export to appropriate format
  if (GOOGLE_EXPORT_MIMES[mimeType]) {
    const exportMime = GOOGLE_EXPORT_MIMES[mimeType];
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${safeFileId}/export?mimeType=${encodeURIComponent(exportMime)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to export file: ${await response.text()}`);
    }

    return { response, contentType: exportMime };
  }

  // For Office files, try to export as PDF for viewing
  if (exportAsPdf && OFFICE_EXPORT_TO_PDF.includes(mimeType)) {
    try {
      // Try exporting as PDF using Google's export API
      const exportResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${safeFileId}/export?mimeType=application/pdf`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (exportResponse.ok) {
        return { response: exportResponse, contentType: 'application/pdf' };
      }

      // If export fails (file might not be converted), fall through to direct download
      console.log(`PDF export failed for ${fileId}, falling back to direct download`);
    } catch (exportError) {
      console.log(`PDF export error for ${fileId}:`, exportError);
    }
  }

  // For regular files, download directly
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${safeFileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get file content: ${await response.text()}`);
  }

  return { response, contentType: mimeType };
}

/**
 * Get text content from a Drive file for AI analysis
 */
export async function extractTextFromDriveFile(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<string> {
  try {
    const safeFileId = encodeURIComponent(fileId);

    // For Google Docs, export as plain text
    if (mimeType === DRIVE_MIME_TYPES.DOCUMENT) {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${safeFileId}/export?mimeType=text/plain`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const text = await response.text();
        return text.slice(0, 50000); // Limit to 50KB
      }
    }

    // For PDFs and other files, we'll need to download and process
    // For now, return placeholder - in production use document AI or pdf.js
    const { response: fileResponse } = await getFileContent(accessToken, fileId, mimeType, false);

    if (mimeType === 'application/pdf') {
      const arrayBuffer = await fileResponse.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const content = decoder.decode(bytes);

      // Basic PDF text extraction
      let text = '';
      const textMatches = content.match(/\(([^)]+)\)/g);
      if (textMatches) {
        text = textMatches
          .map(m => m.slice(1, -1))
          .filter(t => t.length > 3 && /[a-zA-Z]/.test(t))
          .join(' ');
      }

      return text.slice(0, 50000) || 'PDF document from Google Drive';
    }

    // For text files
    if (mimeType.startsWith('text/')) {
      const text = await fileResponse.text();
      return text.slice(0, 50000);
    }

    return `Google Drive file (${mimeType})`;
  } catch (error) {
    console.error('Error extracting text from Drive file:', error);
    return '';
  }
}

/**
 * Get folder path (breadcrumb)
 */
export async function getFolderPath(
  accessToken: string,
  folderId: string
): Promise<Array<{ id: string; name: string }>> {
  const path: Array<{ id: string; name: string }> = [];
  let currentId = folderId;

  while (currentId && currentId !== 'root') {
    try {
      const metadata = await getFileMetadata(accessToken, currentId);
      path.unshift({ id: metadata.id, name: metadata.name });
      currentId = metadata.parents?.[0] || '';
    } catch {
      break;
    }
  }

  // Add root
  path.unshift({ id: 'root', name: 'My Drive' });

  return path;
}

/**
 * Store a Drive connection in the database
 */
export async function createDriveConnection(
  env: Env,
  data: {
    name: string;
    description?: string;
    driveEmail: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiry: number;
    rootFolderId?: string;
    rootFolderName?: string;
    connectedById: string;
    connectedByName?: string;
  }
): Promise<GoogleDriveConnection> {
  const id = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO google_drive_connections (
      id, name, description, driveEmail, accessToken, refreshToken,
      tokenExpiry, rootFolderId, rootFolderName, connectedById, connectedByName,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    id,
    data.name,
    data.description || null,
    data.driveEmail,
    data.accessToken,
    data.refreshToken,
    data.tokenExpiry,
    data.rootFolderId || null,
    data.rootFolderName || null,
    data.connectedById,
    data.connectedByName || null
  ).run();

  const connection = await env.DB.prepare(`
    SELECT * FROM google_drive_connections WHERE id = ?
  `).bind(id).first() as any;

  return {
    ...connection,
    isActive: Boolean(connection.isActive),
  };
}

/**
 * Get all active Drive connections
 */
export async function getActiveConnections(env: Env): Promise<GoogleDriveConnection[]> {
  const { results } = await env.DB.prepare(`
    SELECT * FROM google_drive_connections WHERE isActive = 1 ORDER BY createdAt DESC
  `).all();

  return (results || []).map((c: any) => ({
    ...c,
    isActive: Boolean(c.isActive),
  }));
}

/**
 * Get a specific Drive connection
 */
export async function getConnection(env: Env, connectionId: string): Promise<GoogleDriveConnection | null> {
  const connection = await env.DB.prepare(`
    SELECT * FROM google_drive_connections WHERE id = ?
  `).bind(connectionId).first() as any;

  if (!connection) return null;

  return {
    ...connection,
    isActive: Boolean(connection.isActive),
  };
}

/**
 * Update Drive connection
 */
export async function updateConnection(
  env: Env,
  connectionId: string,
  updates: Partial<Pick<GoogleDriveConnection, 'name' | 'description' | 'rootFolderId' | 'rootFolderName' | 'isActive'>>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.rootFolderId !== undefined) {
    fields.push('rootFolderId = ?');
    values.push(updates.rootFolderId);
  }
  if (updates.rootFolderName !== undefined) {
    fields.push('rootFolderName = ?');
    values.push(updates.rootFolderName);
  }
  if (updates.isActive !== undefined) {
    fields.push('isActive = ?');
    values.push(updates.isActive ? 1 : 0);
  }

  if (fields.length === 0) return;

  fields.push('updatedAt = datetime("now")');
  values.push(connectionId);

  await env.DB.prepare(`
    UPDATE google_drive_connections SET ${fields.join(', ')} WHERE id = ?
  `).bind(...values).run();
}

/**
 * Delete a Drive connection
 */
export async function deleteConnection(env: Env, connectionId: string): Promise<void> {
  // Delete associated documents first (or mark as orphaned)
  await env.DB.prepare(`
    UPDATE documents SET status = 'archived' WHERE driveConnectionId = ?
  `).bind(connectionId).run();

  // Delete the connection
  await env.DB.prepare(`
    DELETE FROM google_drive_connections WHERE id = ?
  `).bind(connectionId).run();
}

/**
 * Link a Google Drive file to the library
 */
export async function linkDriveFileToLibrary(
  env: Env,
  connectionId: string,
  driveFile: DriveFile,
  options: {
    title?: string;
    description?: string;
    category: string;
    tags?: string[];
    accessLevel?: string;
    authorId: string;
  }
): Promise<string> {
  const documentId = crypto.randomUUID();
  const fileCategory = getFileCategory(driveFile.mimeType);

  await env.DB.prepare(`
    INSERT INTO documents (
      id, title, description, category, tags, fileName, fileUrl, fileSize, fileType,
      thumbnailUrl, accessLevel, status, authorId, source, externalFileId,
      externalMimeType, externalUrl, driveConnectionId,
      views, downloads, averageRating, totalRatings, version,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, 'google_drive', ?, ?, ?, ?,
      0, 0, 0, 0, 1, datetime('now'), datetime('now'))
  `).bind(
    documentId,
    options.title || driveFile.name,
    options.description || driveFile.description || '',
    options.category,
    JSON.stringify(options.tags || []),
    driveFile.name,
    driveFile.webViewLink || '',
    driveFile.size || 0,
    driveFile.mimeType,
    driveFile.thumbnailLink || null,
    options.accessLevel || 'internal',
    options.authorId,
    driveFile.id,
    driveFile.mimeType,
    driveFile.webViewLink || null,
    connectionId
  ).run();

  // Update connection file count
  await env.DB.prepare(`
    UPDATE google_drive_connections
    SET totalFilesLinked = totalFilesLinked + 1, updatedAt = datetime('now')
    WHERE id = ?
  `).bind(connectionId).run();

  return documentId;
}

/**
 * Bulk link Drive files to library
 */
export async function bulkLinkDriveFiles(
  env: Env,
  connectionId: string,
  files: Array<{
    driveFile: DriveFile;
    category: string;
    accessLevel?: string;
  }>,
  authorId: string
): Promise<{ success: number; failed: number; documentIds: string[] }> {
  let success = 0;
  let failed = 0;
  const documentIds: string[] = [];

  for (const file of files) {
    try {
      const docId = await linkDriveFileToLibrary(env, connectionId, file.driveFile, {
        category: file.category,
        accessLevel: file.accessLevel,
        authorId,
      });
      documentIds.push(docId);
      success++;
    } catch (error) {
      console.error(`Failed to link file ${file.driveFile.name}:`, error);
      failed++;
    }
  }

  return { success, failed, documentIds };
}
