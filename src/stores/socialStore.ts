import { create } from 'zustand';
import type {
  User,
  UserConnection,
  SuggestedConnection,
  ConnectionStatus,
  ConnectionType,
} from '../types';

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

interface FollowingUser extends User {
  followedAt?: string;
  isFollowingBack?: boolean;
}

interface SocialState {
  // Following
  following: FollowingUser[];
  followers: FollowingUser[];
  followingLoading: boolean;
  followersLoading: boolean;

  // Connections
  connections: UserConnection[];
  pendingRequests: UserConnection[];
  sentRequests: UserConnection[];
  connectionsLoading: boolean;

  // Suggestions
  suggestedUsers: SuggestedConnection[];
  suggestionsLoading: boolean;

  // Blocked
  blockedUsers: Array<{ id: string; userId: string; displayName: string; avatar?: string; createdAt: string }>;

  // Stats
  stats: {
    followersCount: number;
    followingCount: number;
    connectionsCount: number;
    postsCount: number;
  } | null;

  error: string | null;
}

interface SocialActions {
  // Following
  fetchFollowing: (page?: number, search?: string) => Promise<void>;
  fetchFollowers: (page?: number, search?: string) => Promise<void>;
  followUser: (userId: string) => Promise<boolean>;
  unfollowUser: (userId: string) => Promise<boolean>;
  fetchUserFollowers: (userId: string, page?: number) => Promise<FollowingUser[]>;
  fetchUserFollowing: (userId: string, page?: number) => Promise<FollowingUser[]>;

  // Connections
  fetchConnections: (status?: ConnectionStatus, type?: ConnectionType) => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  sendConnectionRequest: (userId: string, type?: ConnectionType) => Promise<boolean>;
  respondToRequest: (userId: string, accept: boolean) => Promise<boolean>;
  removeConnection: (userId: string) => Promise<boolean>;

  // Suggestions
  fetchSuggestions: (limit?: number) => Promise<void>;
  hideSuggestion: (userId: string) => Promise<void>;

  // Blocking
  blockUser: (userId: string, reason?: string) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<boolean>;
  fetchBlockedUsers: () => Promise<void>;

  // Stats
  fetchUserStats: (userId: string) => Promise<any>;
  fetchMutualConnections: (userId: string, limit?: number) => Promise<User[]>;

  // Helpers
  isFollowing: (userId: string) => boolean;
  isConnected: (userId: string) => boolean;
  isBlocked: (userId: string) => boolean;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: SocialState = {
  following: [],
  followers: [],
  followingLoading: false,
  followersLoading: false,
  connections: [],
  pendingRequests: [],
  sentRequests: [],
  connectionsLoading: false,
  suggestedUsers: [],
  suggestionsLoading: false,
  blockedUsers: [],
  stats: null,
  error: null,
};

export const useSocialStore = create<SocialState & SocialActions>((set, get) => ({
  ...initialState,

  // ============================================================================
  // Following
  // ============================================================================

  fetchFollowing: async (page = 1, search = '') => {
    set({ followingLoading: true, error: null });
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.append('search', search);

      const response = await authFetch(`${API_BASE}/social/following?${params}`);
      if (!response.ok) throw new Error('Failed to fetch following');

      const data = await response.json();
      set({ following: data.following || [], followingLoading: false });
    } catch (error) {
      console.error('Error fetching following:', error);
      set({ error: 'Failed to fetch following', followingLoading: false });
    }
  },

  fetchFollowers: async (page = 1, search = '') => {
    set({ followersLoading: true, error: null });
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.append('search', search);

      const response = await authFetch(`${API_BASE}/social/followers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch followers');

      const data = await response.json();
      set({ followers: data.followers || [], followersLoading: false });
    } catch (error) {
      console.error('Error fetching followers:', error);
      set({ error: 'Failed to fetch followers', followersLoading: false });
    }
  },

  followUser: async (userId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/social/follow/${userId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to follow user');
      }

      // Optimistic update - add to following list
      const { following } = get();
      if (!following.find(u => u.id === userId)) {
        set((state) => ({
          following: [...state.following, { id: userId, followedAt: new Date().toISOString() } as FollowingUser],
        }));
      }

      return true;
    } catch (error) {
      console.error('Error following user:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to follow user' });
      return false;
    }
  },

  unfollowUser: async (userId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/social/follow/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unfollow user');
      }

      // Remove from following list
      set((state) => ({
        following: state.following.filter(u => u.id !== userId),
      }));

      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to unfollow user' });
      return false;
    }
  },

  fetchUserFollowers: async (userId: string, page = 1) => {
    try {
      const response = await authFetch(`${API_BASE}/social/users/${userId}/followers?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch user followers');

      const data = await response.json();
      return data.followers || [];
    } catch (error) {
      console.error('Error fetching user followers:', error);
      return [];
    }
  },

  fetchUserFollowing: async (userId: string, page = 1) => {
    try {
      const response = await authFetch(`${API_BASE}/social/users/${userId}/following?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch user following');

      const data = await response.json();
      return data.following || [];
    } catch (error) {
      console.error('Error fetching user following:', error);
      return [];
    }
  },

  // ============================================================================
  // Connections
  // ============================================================================

  fetchConnections: async (status = 'accepted', type) => {
    set({ connectionsLoading: true, error: null });
    try {
      const params = new URLSearchParams({ status });
      if (type) params.append('type', type);

      const response = await authFetch(`${API_BASE}/social/connections?${params}`);
      if (!response.ok) throw new Error('Failed to fetch connections');

      const data = await response.json();
      set({ connections: data.connections || [], connectionsLoading: false });
    } catch (error) {
      console.error('Error fetching connections:', error);
      set({ error: 'Failed to fetch connections', connectionsLoading: false });
    }
  },

  fetchPendingRequests: async () => {
    try {
      const response = await authFetch(`${API_BASE}/social/connections/pending`);
      if (!response.ok) throw new Error('Failed to fetch pending requests');

      const data = await response.json();
      set({ pendingRequests: data.requests || [] });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  },

  fetchSentRequests: async () => {
    try {
      const response = await authFetch(`${API_BASE}/social/connections/sent`);
      if (!response.ok) throw new Error('Failed to fetch sent requests');

      const data = await response.json();
      set({ sentRequests: data.requests || [] });
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    }
  },

  sendConnectionRequest: async (userId: string, type: ConnectionType = 'colleague') => {
    try {
      const response = await authFetch(`${API_BASE}/social/connect/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ connectionType: type }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send connection request');
      }

      return true;
    } catch (error) {
      console.error('Error sending connection request:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to send request' });
      return false;
    }
  },

  respondToRequest: async (userId: string, accept: boolean) => {
    try {
      const response = await authFetch(`${API_BASE}/social/connect/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ accept }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to respond to request');
      }

      // Remove from pending requests
      set((state) => ({
        pendingRequests: state.pendingRequests.filter(r => r.userId !== userId),
      }));

      return true;
    } catch (error) {
      console.error('Error responding to request:', error);
      return false;
    }
  },

  removeConnection: async (userId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/social/connect/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove connection');
      }

      set((state) => ({
        connections: state.connections.filter(c =>
          c.userId !== userId && c.connectedUserId !== userId
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error removing connection:', error);
      return false;
    }
  },

  // ============================================================================
  // Suggestions
  // ============================================================================

  fetchSuggestions: async (limit = 10) => {
    set({ suggestionsLoading: true });
    try {
      const response = await authFetch(`${API_BASE}/social/suggestions?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');

      const data = await response.json();
      set({ suggestedUsers: data.suggestions || [], suggestionsLoading: false });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      set({ suggestionsLoading: false });
    }
  },

  hideSuggestion: async (userId: string) => {
    try {
      await authFetch(`${API_BASE}/social/suggestions/${userId}/hide`, {
        method: 'POST',
      });

      set((state) => ({
        suggestedUsers: state.suggestedUsers.filter(s => s.suggestedUserId !== userId),
      }));
    } catch (error) {
      console.error('Error hiding suggestion:', error);
    }
  },

  // ============================================================================
  // Blocking
  // ============================================================================

  blockUser: async (userId: string, reason?: string) => {
    try {
      const response = await authFetch(`${API_BASE}/social/block/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to block user');
      }

      // Remove from following/followers/connections
      set((state) => ({
        following: state.following.filter(u => u.id !== userId),
        followers: state.followers.filter(u => u.id !== userId),
        connections: state.connections.filter(c =>
          c.userId !== userId && c.connectedUserId !== userId
        ),
        suggestedUsers: state.suggestedUsers.filter(s => s.suggestedUserId !== userId),
      }));

      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  },

  unblockUser: async (userId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/social/block/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unblock user');
      }

      set((state) => ({
        blockedUsers: state.blockedUsers.filter(b => b.userId !== userId),
      }));

      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  },

  fetchBlockedUsers: async () => {
    try {
      const response = await authFetch(`${API_BASE}/social/blocked`);
      if (!response.ok) throw new Error('Failed to fetch blocked users');

      const data = await response.json();
      set({ blockedUsers: data.blocked || [] });
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  },

  // ============================================================================
  // Stats & Helpers
  // ============================================================================

  fetchUserStats: async (userId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/social/stats/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user stats');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  },

  fetchMutualConnections: async (userId: string, limit = 10) => {
    try {
      const response = await authFetch(`${API_BASE}/social/mutual/${userId}?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch mutual connections');

      const data = await response.json();
      return data.mutual || [];
    } catch (error) {
      console.error('Error fetching mutual connections:', error);
      return [];
    }
  },

  isFollowing: (userId: string) => {
    return get().following.some(u => u.id === userId);
  },

  isConnected: (userId: string) => {
    return get().connections.some(c =>
      (c.userId === userId || c.connectedUserId === userId) && c.status === 'accepted'
    );
  },

  isBlocked: (userId: string) => {
    return get().blockedUsers.some(b => b.userId === userId);
  },

  setError: (error: string | null) => set({ error }),

  reset: () => set(initialState),
}));
