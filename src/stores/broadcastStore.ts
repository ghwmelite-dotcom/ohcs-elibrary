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

export type BroadcastSeverity = 'info' | 'warning' | 'critical' | 'emergency';

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  severity: BroadcastSeverity;
  target_audience: string;
  is_active: boolean;
  requires_acknowledgment: boolean;
  scheduled_at?: string;
  expires_at?: string;
  created_by: string;
  creatorName?: string;
  creatorAvatar?: string;
  created_at: string;
  updated_at: string;
  acknowledged?: boolean;
  acknowledgedCount?: number;
}

export interface BroadcastFormData {
  title: string;
  message: string;
  severity: BroadcastSeverity;
  target_audience: string;
  requires_acknowledgment: boolean;
  scheduled_at?: string;
  expires_at?: string;
}

interface BroadcastState {
  // Active broadcasts for users
  activeBroadcasts: Broadcast[];
  dismissedBroadcastIds: string[];

  // Admin management
  allBroadcasts: Broadcast[];
  selectedBroadcast: Broadcast | null;

  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  showAdminPanel: boolean;

  // Sound settings
  soundEnabled: boolean;
  lastPlayedSoundId: string | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Actions
  fetchActiveBroadcasts: () => Promise<void>;
  fetchAllBroadcasts: (page?: number, status?: string) => Promise<void>;
  createBroadcast: (data: BroadcastFormData) => Promise<boolean>;
  updateBroadcast: (id: string, data: Partial<BroadcastFormData>) => Promise<boolean>;
  deleteBroadcast: (id: string) => Promise<boolean>;
  deactivateBroadcast: (id: string) => Promise<boolean>;
  acknowledgeBroadcast: (id: string) => Promise<boolean>;
  dismissBroadcast: (id: string) => void;
  setSelectedBroadcast: (broadcast: Broadcast | null) => void;
  setShowAdminPanel: (show: boolean) => void;
  toggleSound: () => void;
  markSoundPlayed: (id: string) => void;
  clearError: () => void;
}

export const useBroadcastStore = create<BroadcastState>()(
  persist(
    (set, get) => ({
      activeBroadcasts: [],
      dismissedBroadcastIds: [],
      allBroadcasts: [],
      selectedBroadcast: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
      showAdminPanel: false,
      soundEnabled: true,
      lastPlayedSoundId: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },

      fetchActiveBroadcasts: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/broadcasts/active`);

          if (!response.ok) {
            throw new Error('Failed to fetch broadcasts');
          }

          const data = await response.json();
          const { dismissedBroadcastIds } = get();

          // Filter out dismissed broadcasts (unless they require acknowledgment)
          const filteredBroadcasts = data.broadcasts.filter((b: Broadcast) =>
            !dismissedBroadcastIds.includes(b.id) || b.requires_acknowledgment
          );

          set({ activeBroadcasts: filteredBroadcasts, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      fetchAllBroadcasts: async (page = 1, status = 'all') => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(
            `${API_BASE}/broadcasts?page=${page}&limit=20&status=${status}`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch broadcasts');
          }

          const data = await response.json();
          set({
            allBroadcasts: data.broadcasts,
            pagination: data.pagination,
            isLoading: false,
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      createBroadcast: async (data: BroadcastFormData) => {
        set({ isSubmitting: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/broadcasts`, {
            method: 'POST',
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create broadcast');
          }

          set({ isSubmitting: false });

          // Refresh both lists
          get().fetchAllBroadcasts();
          get().fetchActiveBroadcasts();

          return true;
        } catch (error) {
          set({ error: (error as Error).message, isSubmitting: false });
          return false;
        }
      },

      updateBroadcast: async (id: string, data: Partial<BroadcastFormData>) => {
        set({ isSubmitting: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/broadcasts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update broadcast');
          }

          set({ isSubmitting: false });
          get().fetchAllBroadcasts();
          get().fetchActiveBroadcasts();

          return true;
        } catch (error) {
          set({ error: (error as Error).message, isSubmitting: false });
          return false;
        }
      },

      deleteBroadcast: async (id: string) => {
        set({ isSubmitting: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/broadcasts/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete broadcast');
          }

          set({ isSubmitting: false });
          get().fetchAllBroadcasts();
          get().fetchActiveBroadcasts();

          return true;
        } catch (error) {
          set({ error: (error as Error).message, isSubmitting: false });
          return false;
        }
      },

      deactivateBroadcast: async (id: string) => {
        set({ isSubmitting: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/broadcasts/${id}/deactivate`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to deactivate broadcast');
          }

          set({ isSubmitting: false });
          get().fetchAllBroadcasts();
          get().fetchActiveBroadcasts();

          return true;
        } catch (error) {
          set({ error: (error as Error).message, isSubmitting: false });
          return false;
        }
      },

      acknowledgeBroadcast: async (id: string) => {
        try {
          const response = await authFetch(`${API_BASE}/broadcasts/${id}/acknowledge`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to acknowledge broadcast');
          }

          // Update local state
          set((state) => ({
            activeBroadcasts: state.activeBroadcasts.map((b) =>
              b.id === id ? { ...b, acknowledged: true } : b
            ),
          }));

          return true;
        } catch (error) {
          set({ error: (error as Error).message });
          return false;
        }
      },

      dismissBroadcast: (id: string) => {
        const { activeBroadcasts, dismissedBroadcastIds } = get();
        const broadcast = activeBroadcasts.find((b) => b.id === id);

        // Can't dismiss broadcasts that require acknowledgment
        if (broadcast?.requires_acknowledgment && !broadcast.acknowledged) {
          return;
        }

        set({
          dismissedBroadcastIds: [...dismissedBroadcastIds, id],
          activeBroadcasts: activeBroadcasts.filter((b) => b.id !== id),
        });
      },

      setSelectedBroadcast: (broadcast) => set({ selectedBroadcast: broadcast }),

      setShowAdminPanel: (show) => set({ showAdminPanel: show }),

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      markSoundPlayed: (id) => set({ lastPlayedSoundId: id }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ohcs-broadcast-storage',
      partialize: (state) => ({
        dismissedBroadcastIds: state.dismissedBroadcastIds,
        soundEnabled: state.soundEnabled,
        lastPlayedSoundId: state.lastPlayedSoundId,
      }),
    }
  )
);
