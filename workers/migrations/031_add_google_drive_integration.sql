-- Migration: Add Google Drive Integration
-- This migration adds support for linking Google Drive files to the document library

-- Add source columns to documents table
ALTER TABLE documents ADD COLUMN source TEXT DEFAULT 'local';
ALTER TABLE documents ADD COLUMN externalFileId TEXT;
ALTER TABLE documents ADD COLUMN externalMimeType TEXT;
ALTER TABLE documents ADD COLUMN externalUrl TEXT;
ALTER TABLE documents ADD COLUMN driveConnectionId TEXT;

-- Create index for source column
CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source);
CREATE INDEX IF NOT EXISTS idx_documents_external_file_id ON documents(externalFileId);

-- Google Drive Connections table
-- Stores OAuth tokens for connected Google Drive accounts
CREATE TABLE IF NOT EXISTS google_drive_connections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  driveEmail TEXT NOT NULL,
  accessToken TEXT NOT NULL,
  refreshToken TEXT NOT NULL,
  tokenExpiry INTEGER NOT NULL,
  rootFolderId TEXT,
  rootFolderName TEXT,
  scope TEXT DEFAULT 'https://www.googleapis.com/auth/drive.readonly',
  isActive INTEGER DEFAULT 1,
  lastSyncAt TEXT,
  totalFilesLinked INTEGER DEFAULT 0,
  connectedById TEXT NOT NULL,
  connectedByName TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (connectedById) REFERENCES users(id)
);

-- Index for active connections
CREATE INDEX IF NOT EXISTS idx_google_drive_connections_active ON google_drive_connections(isActive);
CREATE INDEX IF NOT EXISTS idx_google_drive_connections_email ON google_drive_connections(driveEmail);

-- Google Drive Sync Log
-- Tracks sync operations for audit and debugging
CREATE TABLE IF NOT EXISTS google_drive_sync_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  connectionId TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  filesProcessed INTEGER DEFAULT 0,
  filesAdded INTEGER DEFAULT 0,
  filesUpdated INTEGER DEFAULT 0,
  filesRemoved INTEGER DEFAULT 0,
  errorMessage TEXT,
  startedAt TEXT DEFAULT (datetime('now')),
  completedAt TEXT,
  FOREIGN KEY (connectionId) REFERENCES google_drive_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_google_drive_sync_log_connection ON google_drive_sync_log(connectionId);
CREATE INDEX IF NOT EXISTS idx_google_drive_sync_log_status ON google_drive_sync_log(status);

-- Google Drive Folder Mappings
-- Maps Drive folders to library categories
CREATE TABLE IF NOT EXISTS google_drive_folder_mappings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  connectionId TEXT NOT NULL,
  driveFolderId TEXT NOT NULL,
  driveFolderName TEXT NOT NULL,
  driveFolderPath TEXT,
  libraryCategory TEXT,
  accessLevel TEXT DEFAULT 'internal',
  autoSync INTEGER DEFAULT 1,
  lastSyncAt TEXT,
  fileCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (connectionId) REFERENCES google_drive_connections(id) ON DELETE CASCADE,
  UNIQUE(connectionId, driveFolderId)
);

CREATE INDEX IF NOT EXISTS idx_drive_folder_mappings_connection ON google_drive_folder_mappings(connectionId);
