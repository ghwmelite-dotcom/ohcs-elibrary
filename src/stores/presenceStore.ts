import { create } from 'zustand';
import type { PresenceStatus, UserPresence } from '../types';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return localStorage.getItem('auth_token');
  }
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

interface TypingUser {
  id: string;
  displayName: string;
  avatar?: string;
}

interface OnlineUser {
  id: string;
  displayName: string;
  avatar?: string;
  status: PresenceStatus;
  lastSeenAt: string;
  currentActivity?: string;
}

interface PresenceState {
  // User presence map (userId -> presence info)
  userPresence: Record<string, UserPresence>;

  // Online users from following list
  onlineFollowing: OnlineUser[];

  // Typing users per room (roomKey -> users)
  typingUsers: Record<string, TypingUser[]>;

  // My current status
  myStatus: PresenceStatus;
  currentActivity: string | null;

  // Polling interval IDs
  heartbeatInterval: NodeJS.Timeout | null;
  presencePollingInterval: NodeJS.Timeout | null;

  // Loading states
  isLoading: boolean;
}

interface PresenceActions {
  // Heartbeat
  sendHeartbeat: (activity?: string) => Promise<void>;
  setStatus: (status: PresenceStatus) => Promise<void>;

  // Fetch presence for users
  fetchPresence: (userIds: string[]) => Promise<void>;
  fetchUserPresence: (userId: string) => Promise<UserPresence | null>;
  getPresence: (userId: string) => UserPresence | null;

  // Online following
  fetchOnlineFollowing: () => Promise<void>;

  // Typing indicators
  startTyping: (roomId: string, roomType: 'dm' | 'chat') => Promise<void>;
  stopTyping: (roomId: string, roomType: 'dm' | 'chat') => Promise<void>;
  fetchTypingUsers: (roomId: string, roomType: 'dm' | 'chat') => Promise<TypingUser[]>;
  setTypingUsers: (roomKey: string, users: TypingUser[]) => void;

  // Polling management
  startPresencePolling: (userIds: string[], intervalMs?: number) => void;
  stopPresencePolling: () => void;
  startHeartbeatPolling: (intervalMs?: number) => void;
  stopHeartbeatPolling: () => void;

  // Cleanup
  cleanup: () => void;
  reset: () => void;
}

const initialState: PresenceState = {
  userPresence: {},
  onlineFollowing: [],
  typingUsers: {},
  myStatus: 'online',
  currentActivity: null,
  heartbeatInterval: null,
  presencePollingInterval: null,
  isLoading: false,
};

export const usePresenceStore = create<PresenceState & PresenceActions>((set, get) => ({
  ...initialState,

  // ============================================================================
  // Heartbeat
  // ============================================================================

  sendHeartbeat: async (activity?: string) => {
    try {
      await authFetch(`${API_BASE}/presence/heartbeat`, {
        method: 'POST',
        body: JSON.stringify({
          status: get().myStatus,
          currentActivity: activity || get().currentActivity,
        }),
      });

      if (activity !== undefined) {
        set({ currentActivity: activity });
      }
    } catch (error) {
      // Silently fail - heartbeat is not critical
      console.debug('Heartbeat failed:', error);
    }
  },

  setStatus: async (status: PresenceStatus) => {
    try {
      await authFetch(`${API_BASE}/presence/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      set({ myStatus: status });
    } catch (error) {
      console.error('Error setting status:', error);
    }
  },

  // ============================================================================
  // Fetch Presence
  // ============================================================================

  fetchPresence: async (userIds: string[]) => {
    if (userIds.length === 0) return;

    try {
      const response = await authFetch(
        `${API_BASE}/presence/users?userIds=${userIds.join(',')}`
      );
      if (!response.ok) return;

      const data = await response.json();
      const presenceMap = data.presence || {};

      set((state) => ({
        userPresence: {
          ...state.userPresence,
          ...presenceMap,
        },
      }));
    } catch (error) {
      console.debug('Error fetching presence:', error);
    }
  },

  fetchUserPresence: async (userId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/presence/users/${userId}`);
      if (!response.ok) return null;

      const data = await response.json();
      const presence = data.presence;

      set((state) => ({
        userPresence: {
          ...state.userPresence,
          [userId]: presence,
        },
      }));

      return presence;
    } catch (error) {
      console.debug('Error fetching user presence:', error);
      return null;
    }
  },

  getPresence: (userId: string) => {
    return get().userPresence[userId] || null;
  },

  // ============================================================================
  // Online Following
  // ============================================================================

  fetchOnlineFollowing: async () => {
    try {
      const response = await authFetch(`${API_BASE}/presence/online-following`);
      if (!response.ok) return;

      const data = await response.json();
      set({ onlineFollowing: data.onlineUsers || [] });
    } catch (error) {
      console.debug('Error fetching online following:', error);
    }
  },

  // ============================================================================
  // Typing Indicators
  // ============================================================================

  startTyping: async (roomId: string, roomType: 'dm' | 'chat') => {
    try {
      await authFetch(`${API_BASE}/presence/typing`, {
        method: 'POST',
        body: JSON.stringify({ roomId, roomType }),
      });
    } catch (error) {
      // Silently fail
    }
  },

  stopTyping: async (roomId: string, roomType: 'dm' | 'chat') => {
    try {
      await authFetch(`${API_BASE}/presence/typing`, {
        method: 'DELETE',
        body: JSON.stringify({ roomId, roomType }),
      });
    } catch (error) {
      // Silently fail
    }
  },

  fetchTypingUsers: async (roomId: string, roomType: 'dm' | 'chat') => {
    try {
      const response = await authFetch(`${API_BASE}/presence/typing/${roomType}/${roomId}`);
      if (!response.ok) return [];

      const data = await response.json();
      const users = data.typingUsers || [];

      const roomKey = `${roomType}:${roomId}`;
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [roomKey]: users,
        },
      }));

      return users;
    } catch (error) {
      return [];
    }
  },

  setTypingUsers: (roomKey: string, users: TypingUser[]) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [roomKey]: users,
      },
    }));
  },

  // ============================================================================
  // Polling Management
  // ============================================================================

  startPresencePolling: (userIds: string[], intervalMs = 15000) => {
    // Stop existing polling
    get().stopPresencePolling();

    // Fetch immediately
    get().fetchPresence(userIds);

    // Set up interval
    const interval = setInterval(() => {
      get().fetchPresence(userIds);
    }, intervalMs);

    set({ presencePollingInterval: interval });
  },

  stopPresencePolling: () => {
    const { presencePollingInterval } = get();
    if (presencePollingInterval) {
      clearInterval(presencePollingInterval);
      set({ presencePollingInterval: null });
    }
  },

  startHeartbeatPolling: (intervalMs = 30000) => {
    // Stop existing polling
    get().stopHeartbeatPolling();

    // Send immediately
    get().sendHeartbeat();

    // Set up interval
    const interval = setInterval(() => {
      get().sendHeartbeat();
    }, intervalMs);

    set({ heartbeatInterval: interval });
  },

  stopHeartbeatPolling: () => {
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      set({ heartbeatInterval: null });
    }
  },

  // ============================================================================
  // Cleanup
  // ============================================================================

  cleanup: () => {
    get().stopPresencePolling();
    get().stopHeartbeatPolling();
  },

  reset: () => {
    get().cleanup();
    set(initialState);
  },
}));

// Helper function to determine if a user is online
export const isUserOnline = (presence: UserPresence | null): boolean => {
  if (!presence) return false;
  if (presence.status === 'offline') return false;

  // Check if last seen is within 2 minutes
  if (presence.lastSeenAt) {
    const lastSeen = new Date(presence.lastSeenAt).getTime();
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    return lastSeen > twoMinutesAgo;
  }

  return presence.status !== 'offline';
};

// Helper to format last seen time
export const formatLastSeen = (lastSeenAt: string | null): string => {
  if (!lastSeenAt) return 'Never';

  const lastSeen = new Date(lastSeenAt);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return lastSeen.toLocaleDateString();
};

// Helper to get status color
export const getStatusColor = (status: PresenceStatus): string => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'away':
      return 'bg-yellow-500';
    case 'busy':
      return 'bg-red-500';
    case 'offline':
    default:
      return 'bg-gray-400';
  }
};
