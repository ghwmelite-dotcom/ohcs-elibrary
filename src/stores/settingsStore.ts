import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

// Helper to get auth token
const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

// Helper for authenticated fetch
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
};

// =====================================================
// TYPES
// =====================================================

export interface UserSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  accentColor: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'system' | 'inter' | 'roboto' | 'open-sans';
  compactMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;

  // Reading
  readingLineHeight: 'compact' | 'normal' | 'relaxed';
  readingMaxWidth: 'narrow' | 'medium' | 'wide' | 'full';
  autoScroll: boolean;
  autoScrollSpeed: number;
  highlightLinks: boolean;
  showPageNumbers: boolean;

  // AI
  aiEnabled: boolean;
  aiSuggestions: boolean;
  aiSummarization: boolean;
  aiWritingAssist: boolean;
  aiVoice: 'default' | 'professional' | 'friendly';
  aiResponseLength: 'concise' | 'balanced' | 'detailed';
  aiAutoComplete: boolean;

  // Privacy
  profileVisibility: 'public' | 'connections' | 'private';
  showEmail: boolean;
  showActivity: boolean;
  allowMessages: 'all' | 'connections' | 'none';
  allowTagging: boolean;
  showOnlineStatus: boolean;

  // Language & Region
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 'sunday' | 'monday';

  // Downloads
  downloadLocation: string;
  autoDownload: boolean;
  downloadQuality: 'original' | 'optimized' | 'compressed';
  clearCacheOnLogout: boolean;

  // Sounds
  soundEnabled: boolean;
  soundVolume: number;
  notificationSound: string;
  messageSound: string;
  hapticFeedback: boolean;

  // Experimental
  betaFeatures: boolean;
  developerMode: boolean;
}

export interface Session {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  ipAddress: string;
  location: string;
  country: string;
  city: string;
  isCurrent: boolean;
  isRevoked: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface TwoFactorStatus {
  isEnabled: boolean;
  hasBackupCodes: boolean;
  backupCodesRemaining: number;
  lastUsedAt?: string;
  enabledAt?: string;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface KeyboardShortcut {
  action: string;
  shortcut: string;
  description: string;
  category: string;
  isCustom: boolean;
  isEnabled: boolean;
}

export interface AccountActivity {
  id: string;
  action: string;
  description: string;
  ipAddress: string;
  location: string;
  deviceInfo: string;
  status: 'success' | 'failed' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export interface StorageUsage {
  totalBytes: number;
  documentsBytes: number;
  attachmentsBytes: number;
  avatarBytes: number;
  cacheBytes: number;
  quotaBytes: number;
  usagePercent: number;
}

export interface DataExport {
  id: string;
  type: 'full' | 'profile' | 'documents' | 'activity';
  format: 'zip' | 'json' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  progress: number;
  fileUrl?: string;
  fileSize?: number;
  requestedAt: string;
  completedAt?: string;
  expiresAt?: string;
}

export interface ConnectedAccount {
  id: string;
  provider: 'google' | 'microsoft' | 'github' | 'linkedin';
  email: string;
  displayName: string;
  avatar?: string;
  lastUsedAt?: string;
  connectedAt: string;
}

export interface BlockedUser {
  id: string;
  blockedUserId: string;
  displayName: string;
  avatar?: string;
  reason?: string;
  createdAt: string;
}

export interface SecurityScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: Array<{
    name: string;
    points: number;
    status: 'complete' | 'incomplete' | 'warning';
    hint?: string;
  }>;
  lastCalculated: string;
}

// =====================================================
// STORE
// =====================================================

interface SettingsState {
  // Data
  settings: UserSettings | null;
  sessions: Session[];
  twoFactor: TwoFactorStatus | null;
  shortcuts: KeyboardShortcut[];
  activities: AccountActivity[];
  storage: StorageUsage | null;
  exports: DataExport[];
  connectedAccounts: ConnectedAccount[];
  blockedUsers: BlockedUser[];
  securityScore: SecurityScore | null;

  // UI State
  isLoading: boolean;
  isSessionsLoading: boolean;
  is2FALoading: boolean;
  isShortcutsLoading: boolean;
  isActivityLoading: boolean;
  isStorageLoading: boolean;
  isExportsLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // 2FA Setup
  twoFactorSetup: TwoFactorSetup | null;
  backupCodes: string[] | null;

  // Activity Pagination
  activityPage: number;
  activityTotalPages: number;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
  fetchTwoFactorStatus: () => Promise<void>;
  initializeTwoFactor: () => Promise<TwoFactorSetup>;
  verifyTwoFactor: (code: string) => Promise<string[]>;
  disableTwoFactor: (code: string) => Promise<void>;
  regenerateBackupCodes: (code: string) => Promise<string[]>;
  fetchShortcuts: () => Promise<void>;
  updateShortcut: (action: string, shortcut: string, isEnabled: boolean) => Promise<void>;
  resetShortcut: (action: string) => Promise<void>;
  fetchActivity: (page?: number) => Promise<void>;
  fetchStorage: () => Promise<void>;
  fetchExports: () => Promise<void>;
  requestExport: (type: string, format: string) => Promise<string>;
  fetchConnectedAccounts: () => Promise<void>;
  disconnectAccount: (provider: string) => Promise<void>;
  fetchBlockedUsers: () => Promise<void>;
  blockUser: (userId: string, reason?: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  fetchSecurityScore: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  reset: () => void;
}

const defaultSettings: UserSettings = {
  theme: 'system',
  accentColor: 'green',
  fontSize: 'medium',
  fontFamily: 'system',
  compactMode: false,
  reducedMotion: false,
  highContrast: false,
  readingLineHeight: 'normal',
  readingMaxWidth: 'medium',
  autoScroll: false,
  autoScrollSpeed: 50,
  highlightLinks: true,
  showPageNumbers: true,
  aiEnabled: true,
  aiSuggestions: true,
  aiSummarization: true,
  aiWritingAssist: false,
  aiVoice: 'default',
  aiResponseLength: 'balanced',
  aiAutoComplete: false,
  profileVisibility: 'public',
  showEmail: false,
  showActivity: true,
  allowMessages: 'all',
  allowTagging: true,
  showOnlineStatus: true,
  language: 'en-US',
  timezone: 'Africa/Accra',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  weekStartsOn: 'monday',
  downloadLocation: 'default',
  autoDownload: false,
  downloadQuality: 'original',
  clearCacheOnLogout: false,
  soundEnabled: true,
  soundVolume: 50,
  notificationSound: 'default',
  messageSound: 'default',
  hapticFeedback: true,
  betaFeatures: false,
  developerMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: null,
      sessions: [],
      twoFactor: null,
      shortcuts: [],
      activities: [],
      storage: null,
      exports: [],
      connectedAccounts: [],
      blockedUsers: [],
      securityScore: null,
      isLoading: false,
      isSessionsLoading: false,
      is2FALoading: false,
      isShortcutsLoading: false,
      isActivityLoading: false,
      isStorageLoading: false,
      isExportsLoading: false,
      isSaving: false,
      error: null,
      twoFactorSetup: null,
      backupCodes: null,
      activityPage: 1,
      activityTotalPages: 1,

      // Fetch all settings
      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/settings`);
          if (!response.ok) throw new Error('Failed to fetch settings');
          const data = await response.json();
          set({ settings: data, isLoading: false });
        } catch (error: any) {
          console.error('Error fetching settings:', error);
          set({ settings: defaultSettings, isLoading: false, error: error.message });
        }
      },

      // Update settings
      updateSettings: async (updates) => {
        const currentSettings = get().settings || defaultSettings;
        const newSettings = { ...currentSettings, ...updates };

        // Optimistic update
        set({ settings: newSettings, isSaving: true, error: null });

        try {
          const response = await authFetch(`${API_BASE}/settings`, {
            method: 'PUT',
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update settings');
          set({ isSaving: false });
        } catch (error: any) {
          console.error('Error updating settings:', error);
          // Revert on error
          set({ settings: currentSettings, isSaving: false, error: error.message });
          throw error;
        }
      },

      // Fetch sessions
      fetchSessions: async () => {
        set({ isSessionsLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/settings/sessions`);
          if (!response.ok) throw new Error('Failed to fetch sessions');
          const data = await response.json();
          set({ sessions: data.sessions, isSessionsLoading: false });
        } catch (error: any) {
          console.error('Error fetching sessions:', error);
          set({ isSessionsLoading: false });
        }
      },

      // Revoke a session
      revokeSession: async (sessionId) => {
        const { sessions } = get();
        // Optimistic update
        set({ sessions: sessions.filter(s => s.id !== sessionId) });

        try {
          const response = await authFetch(`${API_BASE}/settings/sessions/${sessionId}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to revoke session');
        } catch (error: any) {
          console.error('Error revoking session:', error);
          // Revert
          get().fetchSessions();
          throw error;
        }
      },

      // Revoke all other sessions
      revokeAllSessions: async () => {
        const { sessions } = get();
        // Optimistic update - keep only current session
        set({ sessions: sessions.filter(s => s.isCurrent) });

        try {
          const response = await authFetch(`${API_BASE}/settings/sessions`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to revoke sessions');
        } catch (error: any) {
          console.error('Error revoking sessions:', error);
          get().fetchSessions();
          throw error;
        }
      },

      // Fetch 2FA status
      fetchTwoFactorStatus: async () => {
        set({ is2FALoading: true });
        try {
          const response = await authFetch(`${API_BASE}/settings/2fa`);
          if (!response.ok) throw new Error('Failed to fetch 2FA status');
          const data = await response.json();
          set({ twoFactor: data, is2FALoading: false });
        } catch (error: any) {
          console.error('Error fetching 2FA status:', error);
          set({ is2FALoading: false });
        }
      },

      // Initialize 2FA setup
      initializeTwoFactor: async () => {
        set({ is2FALoading: true });
        try {
          const response = await authFetch(`${API_BASE}/settings/2fa/setup`, {
            method: 'POST',
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to initialize 2FA');
          }
          const data = await response.json();
          set({ twoFactorSetup: data, is2FALoading: false });
          return data;
        } catch (error) {
          set({ is2FALoading: false });
          throw error;
        }
      },

      // Verify and enable 2FA
      verifyTwoFactor: async (code) => {
        const response = await authFetch(`${API_BASE}/settings/2fa/verify`, {
          method: 'POST',
          body: JSON.stringify({ code }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Invalid code');
        }
        const data = await response.json();
        set({
          twoFactor: { isEnabled: true, hasBackupCodes: true, backupCodesRemaining: 10 },
          backupCodes: data.backupCodes,
          twoFactorSetup: null,
        });
        return data.backupCodes;
      },

      // Disable 2FA
      disableTwoFactor: async (code) => {
        const response = await authFetch(`${API_BASE}/settings/2fa`, {
          method: 'DELETE',
          body: JSON.stringify({ code }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to disable 2FA');
        }
        set({
          twoFactor: { isEnabled: false, hasBackupCodes: false, backupCodesRemaining: 0 },
          backupCodes: null,
        });
      },

      // Regenerate backup codes
      regenerateBackupCodes: async (code) => {
        const response = await authFetch(`${API_BASE}/settings/2fa/backup/regenerate`, {
          method: 'POST',
          body: JSON.stringify({ code }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to regenerate backup codes');
        }
        const data = await response.json();
        set({
          twoFactor: {
            ...get().twoFactor!,
            backupCodesRemaining: 10,
          },
          backupCodes: data.backupCodes,
        });
        return data.backupCodes;
      },

      // Fetch keyboard shortcuts
      fetchShortcuts: async () => {
        set({ isShortcutsLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/settings/shortcuts`);
          if (!response.ok) throw new Error('Failed to fetch shortcuts');
          const data = await response.json();
          set({ shortcuts: data.shortcuts, isShortcutsLoading: false });
        } catch (error: any) {
          console.error('Error fetching shortcuts:', error);
          set({ isShortcutsLoading: false });
        }
      },

      // Update a shortcut
      updateShortcut: async (action, shortcut, isEnabled) => {
        const { shortcuts } = get();
        // Optimistic update
        set({
          shortcuts: shortcuts.map(s =>
            s.action === action ? { ...s, shortcut, isEnabled, isCustom: true } : s
          ),
        });

        try {
          const response = await authFetch(`${API_BASE}/settings/shortcuts`, {
            method: 'PUT',
            body: JSON.stringify({ action, shortcut, isEnabled }),
          });
          if (!response.ok) throw new Error('Failed to update shortcut');
        } catch (error: any) {
          console.error('Error updating shortcut:', error);
          get().fetchShortcuts();
          throw error;
        }
      },

      // Reset a shortcut to default
      resetShortcut: async (action) => {
        try {
          const response = await authFetch(`${API_BASE}/settings/shortcuts/${action}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to reset shortcut');
          get().fetchShortcuts();
        } catch (error: any) {
          console.error('Error resetting shortcut:', error);
          throw error;
        }
      },

      // Fetch account activity
      fetchActivity: async (page = 1) => {
        set({ isActivityLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/settings/activity?page=${page}&limit=20`);
          if (!response.ok) throw new Error('Failed to fetch activity');
          const data = await response.json();
          set({
            activities: page === 1 ? data.activities : [...get().activities, ...data.activities],
            activityPage: data.pagination.page,
            activityTotalPages: data.pagination.totalPages,
            isActivityLoading: false,
          });
        } catch (error: any) {
          console.error('Error fetching activity:', error);
          set({ isActivityLoading: false });
        }
      },

      // Fetch storage usage
      fetchStorage: async () => {
        set({ isStorageLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/settings/storage`);
          if (!response.ok) throw new Error('Failed to fetch storage');
          const data = await response.json();
          set({ storage: data, isStorageLoading: false });
        } catch (error: any) {
          console.error('Error fetching storage:', error);
          set({ isStorageLoading: false });
        }
      },

      // Fetch export history
      fetchExports: async () => {
        set({ isExportsLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/settings/exports`);
          if (!response.ok) throw new Error('Failed to fetch exports');
          const data = await response.json();
          set({ exports: data.exports, isExportsLoading: false });
        } catch (error: any) {
          console.error('Error fetching exports:', error);
          set({ isExportsLoading: false });
        }
      },

      // Request data export
      requestExport: async (type, format) => {
        const response = await authFetch(`${API_BASE}/settings/exports`, {
          method: 'POST',
          body: JSON.stringify({ type, format }),
        });
        if (!response.ok) throw new Error('Failed to request export');
        const data = await response.json();
        get().fetchExports();
        return data.id;
      },

      // Fetch connected accounts
      fetchConnectedAccounts: async () => {
        try {
          const response = await authFetch(`${API_BASE}/settings/connected`);
          if (!response.ok) throw new Error('Failed to fetch connected accounts');
          const data = await response.json();
          set({ connectedAccounts: data.accounts });
        } catch (error: any) {
          console.error('Error fetching connected accounts:', error);
        }
      },

      // Disconnect account
      disconnectAccount: async (provider) => {
        const { connectedAccounts } = get();
        set({ connectedAccounts: connectedAccounts.filter(a => a.provider !== provider) });

        try {
          const response = await authFetch(`${API_BASE}/settings/connected/${provider}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to disconnect account');
        } catch (error: any) {
          console.error('Error disconnecting account:', error);
          get().fetchConnectedAccounts();
          throw error;
        }
      },

      // Fetch blocked users
      fetchBlockedUsers: async () => {
        try {
          const response = await authFetch(`${API_BASE}/settings/blocked`);
          if (!response.ok) throw new Error('Failed to fetch blocked users');
          const data = await response.json();
          set({ blockedUsers: data.blocked });
        } catch (error: any) {
          console.error('Error fetching blocked users:', error);
        }
      },

      // Block user
      blockUser: async (userId, reason) => {
        const response = await authFetch(`${API_BASE}/settings/blocked`, {
          method: 'POST',
          body: JSON.stringify({ blockedUserId: userId, reason }),
        });
        if (!response.ok) throw new Error('Failed to block user');
        get().fetchBlockedUsers();
      },

      // Unblock user
      unblockUser: async (userId) => {
        const { blockedUsers } = get();
        set({ blockedUsers: blockedUsers.filter(u => u.blockedUserId !== userId) });

        try {
          const response = await authFetch(`${API_BASE}/settings/blocked/${userId}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to unblock user');
        } catch (error: any) {
          console.error('Error unblocking user:', error);
          get().fetchBlockedUsers();
          throw error;
        }
      },

      // Fetch security score
      fetchSecurityScore: async () => {
        try {
          const response = await authFetch(`${API_BASE}/settings/security-score`);
          if (!response.ok) throw new Error('Failed to fetch security score');
          const data = await response.json();
          set({ securityScore: data });
        } catch (error: any) {
          console.error('Error fetching security score:', error);
        }
      },

      // Change password
      changePassword: async (currentPassword, newPassword) => {
        const response = await authFetch(`${API_BASE}/settings/password`, {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to change password');
        }
      },

      // Reset store
      reset: () => {
        set({
          settings: null,
          sessions: [],
          twoFactor: null,
          shortcuts: [],
          activities: [],
          storage: null,
          exports: [],
          connectedAccounts: [],
          blockedUsers: [],
          securityScore: null,
          isLoading: false,
          isSessionsLoading: false,
          is2FALoading: false,
          isShortcutsLoading: false,
          isActivityLoading: false,
          isStorageLoading: false,
          isExportsLoading: false,
          isSaving: false,
          error: null,
          twoFactorSetup: null,
          backupCodes: null,
          activityPage: 1,
          activityTotalPages: 1,
        });
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);

// Selector hooks
export const useSettings = () => useSettingsStore((state) => state.settings);
export const useSessions = () => useSettingsStore((state) => state.sessions);
export const useSecurityScore = () => useSettingsStore((state) => state.securityScore);
