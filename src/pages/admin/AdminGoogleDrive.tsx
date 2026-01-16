import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import {
  HardDrive,
  Link2,
  Unlink,
  FolderOpen,
  FileText,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Upload,
  Search,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Cloud,
  CloudOff,
  Eye,
  Download,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils/cn';
import { formatFileSize, formatDate, formatRelativeTime } from '@/utils/formatters';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

// Types
interface DriveConnection {
  id: string;
  name: string;
  description?: string;
  driveEmail: string;
  rootFolderId?: string;
  rootFolderName?: string;
  isActive: boolean;
  lastSyncAt?: string;
  totalFilesLinked: number;
  connectedByName?: string;
  createdAt: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  description?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
}

interface DriveFolderContents {
  folder: DriveFolder | null;
  files: DriveFile[];
  folders: DriveFolder[];
  path: Array<{ id: string; name: string }>;
  connectionId: string;
  connectionName: string;
}

// Document categories for import
const DOCUMENT_CATEGORIES = [
  { id: 'circulars', name: 'Circulars & Directives' },
  { id: 'policies', name: 'Policies & Guidelines' },
  { id: 'training', name: 'Training Materials' },
  { id: 'reports', name: 'Reports & Publications' },
  { id: 'forms', name: 'Forms & Templates' },
  { id: 'legal', name: 'Legal Documents' },
  { id: 'research', name: 'Research Papers' },
  { id: 'general', name: 'General Documents' },
];

// Access levels
const ACCESS_LEVELS = [
  { id: 'public', name: 'Public' },
  { id: 'internal', name: 'Internal' },
  { id: 'restricted', name: 'Restricted' },
  { id: 'confidential', name: 'Confidential' },
];

// Helper to get file icon based on mime type
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('image/')) return ImageIcon;
  return FileText;
}

// Helper to get file type badge
function getFileTypeBadge(mimeType: string) {
  if (mimeType.startsWith('audio/')) return { label: 'Audio', variant: 'info' as const };
  if (mimeType.startsWith('video/')) return { label: 'Video', variant: 'warning' as const };
  if (mimeType.startsWith('image/')) return { label: 'Image', variant: 'success' as const };
  if (mimeType.includes('pdf')) return { label: 'PDF', variant: 'error' as const };
  if (mimeType.includes('document') || mimeType.includes('word')) return { label: 'Doc', variant: 'info' as const };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return { label: 'Sheet', variant: 'success' as const };
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return { label: 'Slides', variant: 'warning' as const };
  return { label: 'File', variant: 'default' as const };
}

export default function AdminGoogleDrive() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'connections' | 'browse' | 'import'>('connections');
  const [connections, setConnections] = useState<DriveConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionName, setConnectionName] = useState('');
  const [connectionDescription, setConnectionDescription] = useState('');

  // Browse state
  const [selectedConnection, setSelectedConnection] = useState<DriveConnection | null>(null);
  const [folderContents, setFolderContents] = useState<DriveFolderContents | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DriveFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Import state
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<DriveFolder[]>([]);
  const [importCategory, setImportCategory] = useState('general');
  const [importAccessLevel, setImportAccessLevel] = useState('internal');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<string | null>(null); // Connection ID being synced
  const [syncCategory, setSyncCategory] = useState('general');

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/google-drive/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch connections');

      const data = await response.json();
      setConnections(data);
    } catch (err) {
      setError('Failed to load Drive connections');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Connect Google Drive
  const handleConnect = async () => {
    if (!token || !connectionName.trim()) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Get auth URL
      const response = await fetch(`${API_BASE}/google-drive/auth/url`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to get auth URL');

      const { authUrl, state } = await response.json();

      // Store connection info for callback
      sessionStorage.setItem('gdrive_connection_name', connectionName);
      sessionStorage.setItem('gdrive_connection_desc', connectionDescription);
      sessionStorage.setItem('gdrive_oauth_state', state);

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to start connection');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Save OAuth callback params immediately on page load (before auth redirect might clear them)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      // Save callback params to sessionStorage so they persist through auth redirects
      sessionStorage.setItem('gdrive_pending_code', code);
      sessionStorage.setItem('gdrive_pending_state', state);
      // Clear URL params immediately to prevent re-processing
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // Run only once on mount

  // Process OAuth callback when token is available
  useEffect(() => {
    if (!token) return;

    const code = sessionStorage.getItem('gdrive_pending_code');
    const state = sessionStorage.getItem('gdrive_pending_state');
    const savedState = sessionStorage.getItem('gdrive_oauth_state');

    if (code && state && savedState && state === savedState) {
      const name = sessionStorage.getItem('gdrive_connection_name') || 'My Drive';
      const description = sessionStorage.getItem('gdrive_connection_desc') || '';

      // Clear all session storage items
      sessionStorage.removeItem('gdrive_pending_code');
      sessionStorage.removeItem('gdrive_pending_state');
      sessionStorage.removeItem('gdrive_connection_name');
      sessionStorage.removeItem('gdrive_connection_desc');
      sessionStorage.removeItem('gdrive_oauth_state');

      // Complete connection
      completeConnection(code, state, name, description);
    }
  }, [token]);

  const completeConnection = async (code: string, state: string, name: string, description: string) => {
    try {
      setIsConnecting(true);
      setError(null);

      const response = await fetch(`${API_BASE}/google-drive/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, state, name, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete connection');
      }

      setSuccess('Google Drive connected successfully!');
      fetchConnections();
    } catch (err: any) {
      setError(err.message || 'Failed to complete connection');
    } finally {
      setIsConnecting(false);
    }
  };

  // Delete connection
  const handleDeleteConnection = async (connectionId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to disconnect this Google Drive? Documents already imported will remain but may lose sync.')) return;

    try {
      const response = await fetch(`${API_BASE}/google-drive/connections/${connectionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete connection');

      setSuccess('Drive disconnected successfully');
      fetchConnections();

      if (selectedConnection?.id === connectionId) {
        setSelectedConnection(null);
        setFolderContents(null);
      }
    } catch (err) {
      setError('Failed to disconnect Drive');
    }
  };

  // Sync connection to find new files
  const handleSync = async (connection: DriveConnection, category: string) => {
    if (!token) return;

    try {
      setIsSyncing(connection.id);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_BASE}/google-drive/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: connection.id,
          folderId: connection.rootFolderId,
          category,
          accessLevel: 'internal',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Sync failed');
      }

      const data = await response.json();

      if (data.newFiles === 0) {
        setSuccess(`Sync complete! No new files found. (${data.total} files total, ${data.existing} already imported)`);
      } else {
        setSuccess(`Sync complete! Imported ${data.imported} new files. (${data.failed > 0 ? `${data.failed} failed` : 'All successful'})`);
      }

      // Refresh connections to update lastSyncAt
      fetchConnections();
    } catch (err: any) {
      setError(err.message || 'Failed to sync');
    } finally {
      setIsSyncing(null);
    }
  };

  // Browse folder
  const browseFolderInternal = async (connectionId: string, folderId: string = 'root') => {
    if (!token) return;

    try {
      setIsBrowsing(true);
      setSearchResults([]);

      const response = await fetch(
        `${API_BASE}/google-drive/browse/${connectionId}?folderId=${folderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to browse folder');

      const data = await response.json();
      setFolderContents(data);
      setCurrentFolderId(folderId);
    } catch (err) {
      setError('Failed to browse folder');
    } finally {
      setIsBrowsing(false);
    }
  };

  const browseFolder = (folderId: string = 'root') => {
    if (selectedConnection) {
      browseFolderInternal(selectedConnection.id, folderId);
    }
  };

  // Search files
  const handleSearch = async () => {
    if (!token || !selectedConnection || !searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const response = await fetch(
        `${API_BASE}/google-drive/search/${selectedConnection.id}?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data.files);
    } catch (err) {
      setError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (file: DriveFile) => {
    setSelectedFiles((prev) => {
      const isSelected = prev.some((f) => f.id === file.id);
      if (isSelected) {
        return prev.filter((f) => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const toggleFolderSelection = (folder: DriveFolder, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder navigation
    setSelectedFolders((prev) => {
      const isSelected = prev.some((f) => f.id === folder.id);
      if (isSelected) {
        return prev.filter((f) => f.id !== folder.id);
      } else {
        return [...prev, folder];
      }
    });
  };

  // Import selected files and folders
  const handleImport = async () => {
    if (!token || !selectedConnection || (selectedFiles.length === 0 && selectedFolders.length === 0)) return;

    try {
      setIsImporting(true);
      setError(null);
      setImportProgress(null);

      let totalImported = 0;

      // Import individual files first
      if (selectedFiles.length > 0) {
        setImportProgress(`Importing ${selectedFiles.length} file(s)...`);
        const response = await fetch(`${API_BASE}/google-drive/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            connectionId: selectedConnection.id,
            files: selectedFiles.map((f) => ({ id: f.id })),
            category: importCategory,
            accessLevel: importAccessLevel,
          }),
        });

        if (!response.ok) throw new Error('File import failed');
        const data = await response.json();
        totalImported += data.imported || 0;
      }

      // Import folders recursively
      for (let i = 0; i < selectedFolders.length; i++) {
        const folder = selectedFolders[i];
        setImportProgress(`Importing folder "${folder.name}" (${i + 1}/${selectedFolders.length})...`);

        const response = await fetch(`${API_BASE}/google-drive/import-folder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            connectionId: selectedConnection.id,
            folderId: folder.id,
            folderName: folder.name,
            category: importCategory,
            accessLevel: importAccessLevel,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to import folder ${folder.name}`);
          continue;
        }

        const data = await response.json();
        totalImported += data.imported || 0;
      }

      setSuccess(`Successfully imported ${totalImported} file(s)!`);
      setSelectedFiles([]);
      setSelectedFolders([]);
      fetchConnections(); // Refresh to update file counts
    } catch (err) {
      setError('Failed to import files/folders');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  // Start browsing a connection
  const startBrowsing = (connection: DriveConnection) => {
    setSelectedConnection(connection);
    setActiveTab('browse');
    browseFolderInternal(connection.id, 'root');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            Google Drive Integration
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Connect and manage Google Drive storage for the document library
          </p>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 dark:text-green-300">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-700">
        <button
          onClick={() => setActiveTab('connections')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'connections'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700'
          )}
        >
          <Cloud className="w-4 h-4 inline mr-2" />
          Connections
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          disabled={!selectedConnection}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'browse'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700',
            !selectedConnection && 'opacity-50 cursor-not-allowed'
          )}
        >
          <FolderOpen className="w-4 h-4 inline mr-2" />
          Browse Files
        </button>
        <button
          onClick={() => setActiveTab('import')}
          disabled={selectedFiles.length === 0 && selectedFolders.length === 0}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'import'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700',
            (selectedFiles.length === 0 && selectedFolders.length === 0) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Import ({selectedFiles.length + selectedFolders.length})
        </button>
      </div>

      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <div className="space-y-6">
          {/* Connect New Drive */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Connect New Google Drive
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Connection Name"
                placeholder="e.g., OHCS Training Materials"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
              />
              <Input
                label="Description (optional)"
                placeholder="Description of this Drive connection"
                value={connectionDescription}
                onChange={(e) => setConnectionDescription(e.target.value)}
              />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !connectionName.trim()}
                leftIcon={isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              >
                {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
              </Button>
              <p className="text-sm text-surface-500">
                You'll be redirected to Google to authorize access
              </p>
            </div>
          </div>

          {/* Existing Connections */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Connected Drives
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-12 text-surface-500">
                <CloudOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No Google Drive connections yet</p>
                <p className="text-sm mt-1">Connect a Drive to start importing files</p>
              </div>
            ) : (
              <div className="space-y-4">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          conn.isActive
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-surface-100 dark:bg-surface-700'
                        )}>
                          <HardDrive className={cn(
                            'w-6 h-6',
                            conn.isActive
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-surface-400'
                          )} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-surface-900 dark:text-surface-50">
                            {conn.name}
                          </h4>
                          <p className="text-sm text-surface-500">{conn.driveEmail}</p>
                          {conn.description && (
                            <p className="text-sm text-surface-400 mt-1">{conn.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                            <span>{conn.totalFilesLinked} files linked</span>
                            <span>Connected {formatRelativeTime(conn.createdAt)}</span>
                            {conn.connectedByName && <span>by {conn.connectedByName}</span>}
                            {conn.lastSyncAt && (
                              <span>Last synced {formatRelativeTime(conn.lastSyncAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={conn.isActive ? 'success' : 'default'}>
                          {conn.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <select
                          className="px-2 py-1.5 text-xs border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300"
                          value={syncCategory}
                          onChange={(e) => setSyncCategory(e.target.value)}
                          disabled={isSyncing === conn.id}
                        >
                          {DOCUMENT_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(conn, syncCategory)}
                          disabled={isSyncing === conn.id}
                          leftIcon={isSyncing === conn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        >
                          {isSyncing === conn.id ? 'Syncing...' : 'Sync'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startBrowsing(conn)}
                          leftIcon={<FolderOpen className="w-4 h-4" />}
                        >
                          Browse
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteConnection(conn.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Browse Tab */}
      {activeTab === 'browse' && selectedConnection && (
        <div className="space-y-4">
          {/* Breadcrumb & Search */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm overflow-x-auto">
                <span className="font-medium text-surface-700 dark:text-surface-300">
                  {selectedConnection.name}
                </span>
                {folderContents?.path.map((item, index) => (
                  <span key={item.id} className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-surface-400 mx-1" />
                    <button
                      onClick={() => browseFolder(item.id)}
                      className={cn(
                        'hover:text-primary-600',
                        index === folderContents.path.length - 1
                          ? 'text-primary-600 font-medium'
                          : 'text-surface-500'
                      )}
                    >
                      {item.name}
                    </button>
                  </span>
                ))}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearch}
                  disabled={isSearching}
                  leftIcon={isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* File Browser */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
            {/* Selection Toolbar */}
            {folderContents && (folderContents.files.length > 0 || folderContents.folders.length > 0 || searchResults.length > 0) && (
              <div className="px-4 py-3 bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-surface-600 dark:text-surface-400">
                    {selectedFolders.length > 0 && `${selectedFolders.length} folder(s)`}
                    {selectedFolders.length > 0 && selectedFiles.length > 0 && ', '}
                    {selectedFiles.length > 0 && `${selectedFiles.length} file(s)`}
                    {selectedFolders.length === 0 && selectedFiles.length === 0 && 'No items selected'}
                    {' selected'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Select All Folders */}
                  {folderContents.folders.length > 0 && !searchResults.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allFoldersSelected = folderContents.folders.every(f => selectedFolders.some(sf => sf.id === f.id));
                        if (allFoldersSelected) {
                          setSelectedFolders(prev => prev.filter(sf => !folderContents.folders.some(f => f.id === sf.id)));
                        } else {
                          setSelectedFolders(prev => {
                            const existingIds = new Set(prev.map(f => f.id));
                            const newFolders = folderContents.folders.filter(f => !existingIds.has(f.id));
                            return [...prev, ...newFolders];
                          });
                        }
                      }}
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      {folderContents.folders.every(f => selectedFolders.some(sf => sf.id === f.id))
                        ? 'Deselect Folders'
                        : 'Select All Folders'}
                    </Button>
                  )}
                  {/* Select All Files */}
                  {(folderContents.files.length > 0 || searchResults.length > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const filesToSelect = searchResults.length > 0 ? searchResults : folderContents.files;
                        const allSelected = filesToSelect.every(f => selectedFiles.some(sf => sf.id === f.id));
                        if (allSelected) {
                          setSelectedFiles(prev => prev.filter(sf => !filesToSelect.some(f => f.id === sf.id)));
                        } else {
                          setSelectedFiles(prev => {
                            const existingIds = new Set(prev.map(f => f.id));
                            const newFiles = filesToSelect.filter(f => !existingIds.has(f.id));
                            return [...prev, ...newFiles];
                          });
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      {(searchResults.length > 0 ? searchResults : folderContents.files).every(f => selectedFiles.some(sf => sf.id === f.id))
                        ? 'Deselect Files'
                        : 'Select All Files'}
                    </Button>
                  )}
                  {/* Import Button */}
                  {(selectedFiles.length > 0 || selectedFolders.length > 0) && (
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('import')}
                      leftIcon={<Upload className="w-4 h-4" />}
                    >
                      Import Selected
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isBrowsing ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="divide-y divide-surface-200 dark:divide-surface-700">
                {/* Back button */}
                {currentFolderId !== 'root' && folderContents?.path && folderContents.path.length > 1 && (
                  <button
                    onClick={() => {
                      const parentPath = folderContents.path[folderContents.path.length - 2];
                      browseFolder(parentPath?.id || 'root');
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-surface-400" />
                    <span className="text-surface-600 dark:text-surface-400">Go back</span>
                  </button>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-surface-50 dark:bg-surface-700/50">
                      <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
                        Search Results ({searchResults.length})
                      </span>
                      <button
                        onClick={() => setSearchResults([])}
                        className="ml-4 text-sm text-primary-600 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                    {searchResults.map((file) => {
                      const FileIcon = getFileIcon(file.mimeType);
                      const typeBadge = getFileTypeBadge(file.mimeType);
                      const isSelected = selectedFiles.some((f) => f.id === file.id);

                      return (
                        <div
                          key={file.id}
                          onClick={() => toggleFileSelection(file)}
                          className={cn(
                            'px-4 py-3 flex items-center gap-4 cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-primary-50 dark:bg-primary-900/20'
                              : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                          )}
                        >
                          <div className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center',
                            isSelected
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-surface-300 dark:border-surface-600'
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <FileIcon className="w-5 h-5 text-surface-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-surface-500">
                              {file.size ? formatFileSize(file.size) : 'Google Doc'}
                            </p>
                          </div>
                          <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Folders */}
                {!searchResults.length && folderContents?.folders.map((folder) => {
                  const isFolderSelected = selectedFolders.some((f) => f.id === folder.id);
                  return (
                    <div
                      key={folder.id}
                      className={cn(
                        'w-full px-4 py-3 flex items-center gap-4 transition-colors',
                        isFolderSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                      )}
                    >
                      {/* Checkbox for folder selection */}
                      <button
                        onClick={(e) => toggleFolderSelection(folder, e)}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                          isFolderSelected
                            ? 'bg-primary-500 border-primary-500'
                            : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
                        )}
                      >
                        {isFolderSelected && <Check className="w-3 h-3 text-white" />}
                      </button>

                      {/* Clickable folder name for navigation */}
                      <button
                        onClick={() => browseFolder(folder.id)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <FolderOpen className="w-5 h-5 text-secondary-500" />
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                          {folder.name}
                        </span>
                      </button>

                      <ChevronRight className="w-4 h-4 text-surface-400" />
                    </div>
                  );
                })}

                {/* Files */}
                {!searchResults.length && folderContents?.files.map((file) => {
                  const FileIcon = getFileIcon(file.mimeType);
                  const typeBadge = getFileTypeBadge(file.mimeType);
                  const isSelected = selectedFiles.some((f) => f.id === file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleFileSelection(file)}
                      className={cn(
                        'px-4 py-3 flex items-center gap-4 cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center',
                        isSelected
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-surface-300 dark:border-surface-600'
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {file.thumbnailLink ? (
                        <img src={file.thumbnailLink} alt="" className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <FileIcon className="w-5 h-5 text-surface-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-surface-500">
                          {file.size ? formatFileSize(file.size) : 'Google Doc'}
                          {file.modifiedTime && ` • Modified ${formatRelativeTime(file.modifiedTime)}`}
                        </p>
                      </div>
                      <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-surface-400 hover:text-primary-500"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  );
                })}

                {/* Empty State */}
                {!searchResults.length &&
                  !folderContents?.folders.length &&
                  !folderContents?.files.length && (
                    <div className="py-12 text-center text-surface-500">
                      <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>This folder is empty</p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Selection Footer */}
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-900 dark:bg-surface-700 text-white rounded-xl shadow-elevation-3 px-6 py-4 flex items-center gap-6"
            >
              <span>{selectedFiles.length} file(s) selected</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedFiles([])}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab('import')}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Import Selected
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (selectedFiles.length > 0 || selectedFolders.length > 0) && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Import Settings
            </h3>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Category
                </label>
                <select
                  value={importCategory}
                  onChange={(e) => setImportCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Access Level
                </label>
                <select
                  value={importAccessLevel}
                  onChange={(e) => setImportAccessLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50"
                >
                  {ACCESS_LEVELS.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Folders Preview */}
            {selectedFolders.length > 0 && (
              <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden mb-4">
                <div className="px-4 py-2 bg-secondary-50 dark:bg-secondary-900/20 font-medium text-sm flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-secondary-500" />
                  Folders to Import ({selectedFolders.length})
                  <span className="text-xs text-surface-500 ml-2">All files inside will be imported recursively</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-surface-200 dark:divide-surface-700">
                  {selectedFolders.map((folder) => (
                    <div key={folder.id} className="px-4 py-2 flex items-center gap-3">
                      <FolderOpen className="w-4 h-4 text-secondary-500" />
                      <span className="text-sm text-surface-700 dark:text-surface-300 flex-1 truncate">
                        {folder.name}
                      </span>
                      <Badge variant="warning" className="text-xs">Folder</Badge>
                      <button
                        onClick={() => setSelectedFolders(prev => prev.filter(f => f.id !== folder.id))}
                        className="p-1 text-surface-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden mb-6">
                <div className="px-4 py-2 bg-surface-50 dark:bg-surface-700/50 font-medium text-sm">
                  Files to Import ({selectedFiles.length})
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-surface-200 dark:divide-surface-700">
                  {selectedFiles.map((file) => {
                    const FileIcon = getFileIcon(file.mimeType);
                    const typeBadge = getFileTypeBadge(file.mimeType);

                    return (
                      <div key={file.id} className="px-4 py-2 flex items-center gap-3">
                        <FileIcon className="w-4 h-4 text-surface-400" />
                        <span className="text-sm text-surface-700 dark:text-surface-300 flex-1 truncate">
                          {file.name}
                        </span>
                        <Badge variant={typeBadge.variant} className="text-xs">
                          {typeBadge.label}
                        </Badge>
                        <button
                          onClick={() => toggleFileSelection(file)}
                          className="p-1 text-surface-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Import Progress */}
            {importProgress && (
              <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm text-blue-700 dark:text-blue-300">{importProgress}</span>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button
                onClick={handleImport}
                disabled={isImporting}
                leftIcon={isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              >
                {isImporting ? 'Importing...' : `Import ${selectedFolders.length > 0 ? `${selectedFolders.length} Folder(s)` : ''}${selectedFolders.length > 0 && selectedFiles.length > 0 ? ' + ' : ''}${selectedFiles.length > 0 ? `${selectedFiles.length} File(s)` : ''}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab('browse');
                }}
              >
                Back to Browse
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedFiles([]);
                  setSelectedFolders([]);
                }}
                className="text-red-500 hover:text-red-700"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">How Import Works</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                <li>Files are linked, not copied - they stay in Google Drive</li>
                <li>Documents will appear in the library with the selected category</li>
                <li>Users can view files directly in the library viewer</li>
                <li>AI analysis will work on imported documents</li>
                <li>Changes in Drive are reflected automatically</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
