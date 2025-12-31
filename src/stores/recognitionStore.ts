import { create } from 'zustand';
import type {
  Recognition,
  RecognitionCategory,
  UserRecognitionStats,
  RecognitionLimit,
  RecognitionLeaderboard,
  RecognitionWallSummary,
  CreateRecognitionInput,
  RecognitionFeedFilter,
} from '@/types/recognition';

const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return null;
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

interface RecognitionState {
  // Data
  recognitions: Recognition[];
  categories: RecognitionCategory[];
  userStats: UserRecognitionStats | null;
  limits: RecognitionLimit | null;
  leaderboard: RecognitionLeaderboard | null;
  wallSummary: RecognitionWallSummary | null;
  currentRecognition: Recognition | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  isFetchingMore: boolean;
  isLoadingCategories: boolean;
  isLoadingStats: boolean;
  isLoadingLeaderboard: boolean;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
    total: number;
  };

  // Filters
  currentFilter: RecognitionFeedFilter;

  // Modal state
  showComposer: boolean;
  selectedReceiverId: string | null;
  selectedReceiverName: string | null;

  error: string | null;
}

interface RecognitionActions {
  // Data fetching
  fetchCategories: () => Promise<void>;
  fetchRecognitions: (filter?: RecognitionFeedFilter, refresh?: boolean) => Promise<void>;
  fetchRecognition: (id: string) => Promise<void>;
  loadMoreRecognitions: () => Promise<void>;
  fetchUserStats: (userId?: string) => Promise<void>;
  fetchLimits: () => Promise<void>;
  fetchLeaderboard: (type?: 'received' | 'given', period?: string) => Promise<void>;
  fetchWallSummary: () => Promise<void>;

  // Actions
  giveRecognition: (input: CreateRecognitionInput) => Promise<Recognition | null>;
  endorseRecognition: (recognitionId: string, comment?: string) => Promise<boolean>;
  highlightRecognition: (recognitionId: string) => Promise<boolean>;

  // UI
  openComposer: (receiverId?: string, receiverName?: string) => void;
  closeComposer: () => void;
  setFilter: (filter: RecognitionFeedFilter) => void;
  clearCurrentRecognition: () => void;

  // Helpers
  checkCanGiveRecognition: () => boolean;
  reset: () => void;
}

type RecognitionStore = RecognitionState & RecognitionActions;

const initialState: RecognitionState = {
  recognitions: [],
  categories: [],
  userStats: null,
  limits: null,
  leaderboard: null,
  wallSummary: null,
  currentRecognition: null,
  isLoading: false,
  isSubmitting: false,
  isFetchingMore: false,
  isLoadingCategories: false,
  isLoadingStats: false,
  isLoadingLeaderboard: false,
  pagination: {
    page: 1,
    limit: 20,
    hasMore: true,
    total: 0,
  },
  currentFilter: {},
  showComposer: false,
  selectedReceiverId: null,
  selectedReceiverName: null,
  error: null,
};

export const useRecognitionStore = create<RecognitionStore>((set, get) => ({
  ...initialState,

  fetchCategories: async () => {
    set({ isLoadingCategories: true });
    try {
      const response = await authFetch(`${API_BASE}/recognition/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const categories = await response.json();
      set({ categories, isLoadingCategories: false });
    } catch (error) {
      console.error('Error fetching recognition categories:', error);
      set({ isLoadingCategories: false });
    }
  },

  fetchRecognitions: async (filter?: RecognitionFeedFilter, refresh = false) => {
    const currentFilter = filter || get().currentFilter;
    set({
      isLoading: true,
      error: null,
      currentFilter,
      ...(refresh ? { pagination: { ...initialState.pagination } } : {}),
    });

    try {
      const params = new URLSearchParams();
      if (currentFilter.categoryId) params.append('categoryId', currentFilter.categoryId);
      if (currentFilter.receiverId) params.append('receiverId', currentFilter.receiverId);
      if (currentFilter.giverId) params.append('giverId', currentFilter.giverId);
      if (currentFilter.mdaId) params.append('mdaId', currentFilter.mdaId);
      if (currentFilter.period) params.append('period', currentFilter.period);
      params.append('page', refresh ? '1' : String(get().pagination.page));
      params.append('limit', String(get().pagination.limit));

      const response = await authFetch(`${API_BASE}/recognition?${params}`);
      if (!response.ok) throw new Error('Failed to fetch recognitions');

      const data = await response.json();
      set({
        recognitions: refresh ? data.recognitions : [...get().recognitions, ...data.recognitions],
        pagination: {
          ...get().pagination,
          page: data.page,
          hasMore: data.hasMore,
          total: data.total || 0,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching recognitions:', error);
      set({ error: 'Failed to fetch recognitions', isLoading: false });
    }
  },

  fetchRecognition: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/recognition/${id}`);
      if (!response.ok) throw new Error('Failed to fetch recognition');
      const recognition = await response.json();
      set({ currentRecognition: recognition, isLoading: false });
    } catch (error) {
      console.error('Error fetching recognition:', error);
      set({ error: 'Failed to fetch recognition', isLoading: false });
    }
  },

  loadMoreRecognitions: async () => {
    if (get().isFetchingMore || !get().pagination.hasMore) return;
    set({ isFetchingMore: true });

    const nextPage = get().pagination.page + 1;
    set((state) => ({
      pagination: { ...state.pagination, page: nextPage },
    }));

    try {
      const currentFilter = get().currentFilter;
      const params = new URLSearchParams();
      if (currentFilter.categoryId) params.append('categoryId', currentFilter.categoryId);
      if (currentFilter.receiverId) params.append('receiverId', currentFilter.receiverId);
      if (currentFilter.giverId) params.append('giverId', currentFilter.giverId);
      if (currentFilter.period) params.append('period', currentFilter.period);
      params.append('page', String(nextPage));
      params.append('limit', String(get().pagination.limit));

      const response = await authFetch(`${API_BASE}/recognition?${params}`);
      if (!response.ok) throw new Error('Failed to fetch more recognitions');

      const data = await response.json();
      set((state) => ({
        recognitions: [...state.recognitions, ...data.recognitions],
        pagination: {
          ...state.pagination,
          hasMore: data.hasMore,
          total: data.total || 0,
        },
        isFetchingMore: false,
      }));
    } catch (error) {
      console.error('Error loading more recognitions:', error);
      set({ isFetchingMore: false });
    }
  },

  fetchUserStats: async (userId?: string) => {
    set({ isLoadingStats: true });
    try {
      const endpoint = userId
        ? `${API_BASE}/recognition/stats/${userId}`
        : `${API_BASE}/recognition/stats/me`;
      const response = await authFetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      const userStats = await response.json();
      set({ userStats, isLoadingStats: false });
    } catch (error) {
      console.error('Error fetching user recognition stats:', error);
      set({ isLoadingStats: false });
    }
  },

  fetchLimits: async () => {
    try {
      const response = await authFetch(`${API_BASE}/recognition/limits`);
      if (!response.ok) throw new Error('Failed to fetch limits');
      const limits = await response.json();
      set({ limits });
    } catch (error) {
      console.error('Error fetching recognition limits:', error);
    }
  },

  fetchLeaderboard: async (type = 'received', period = 'monthly') => {
    set({ isLoadingLeaderboard: true });
    try {
      const response = await authFetch(
        `${API_BASE}/recognition/leaderboard?type=${type}&period=${period}`
      );
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const leaderboard = await response.json();
      set({ leaderboard, isLoadingLeaderboard: false });
    } catch (error) {
      console.error('Error fetching recognition leaderboard:', error);
      set({ isLoadingLeaderboard: false });
    }
  },

  fetchWallSummary: async () => {
    try {
      const response = await authFetch(`${API_BASE}/recognition/summary`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      const wallSummary = await response.json();
      set({ wallSummary });
    } catch (error) {
      console.error('Error fetching recognition summary:', error);
    }
  },

  giveRecognition: async (input: CreateRecognitionInput) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/recognition`, {
        method: 'POST',
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to give recognition');
      }

      const data = await response.json();

      // Add to top of list
      set((state) => ({
        recognitions: [data.recognition, ...state.recognitions],
        isSubmitting: false,
        showComposer: false,
        selectedReceiverId: null,
        selectedReceiverName: null,
        limits: state.limits
          ? {
              ...state.limits,
              recognitionsGiven: state.limits.recognitionsGiven + 1,
              remaining: data.remaining,
            }
          : null,
      }));

      // Refresh stats
      get().fetchUserStats();

      return data.recognition;
    } catch (error: any) {
      console.error('Error giving recognition:', error);
      set({ error: error.message, isSubmitting: false });
      return null;
    }
  },

  endorseRecognition: async (recognitionId: string, comment?: string) => {
    try {
      const response = await authFetch(`${API_BASE}/recognition/${recognitionId}/endorse`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to endorse');
      }

      const data = await response.json();

      // Update recognition in list
      set((state) => ({
        recognitions: state.recognitions.map((r) =>
          r.id === recognitionId
            ? {
                ...r,
                endorsements: [...(r.endorsements || []), data.endorsement],
                endorsementCount: (r.endorsementCount || 0) + 1,
              }
            : r
        ),
        currentRecognition:
          state.currentRecognition?.id === recognitionId
            ? {
                ...state.currentRecognition,
                endorsements: [...(state.currentRecognition.endorsements || []), data.endorsement],
                endorsementCount: (state.currentRecognition.endorsementCount || 0) + 1,
              }
            : state.currentRecognition,
      }));

      return true;
    } catch (error) {
      console.error('Error endorsing recognition:', error);
      return false;
    }
  },

  highlightRecognition: async (recognitionId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/recognition/${recognitionId}/highlight`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to toggle highlight');

      const data = await response.json();

      // Update recognition in list
      set((state) => ({
        recognitions: state.recognitions.map((r) =>
          r.id === recognitionId ? { ...r, isHighlighted: data.isHighlighted } : r
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error highlighting recognition:', error);
      return false;
    }
  },

  openComposer: (receiverId?: string, receiverName?: string) => {
    set({
      showComposer: true,
      selectedReceiverId: receiverId || null,
      selectedReceiverName: receiverName || null,
    });
  },

  closeComposer: () => {
    set({
      showComposer: false,
      selectedReceiverId: null,
      selectedReceiverName: null,
    });
  },

  setFilter: (filter: RecognitionFeedFilter) => {
    set({ currentFilter: filter });
    get().fetchRecognitions(filter, true);
  },

  clearCurrentRecognition: () => {
    set({ currentRecognition: null });
  },

  checkCanGiveRecognition: () => {
    const { limits } = get();
    if (!limits) return true;
    return limits.remaining > 0;
  },

  reset: () => set(initialState),
}));

// Selector hooks
export const useRecognitionCategories = () => useRecognitionStore((s) => s.categories);
export const useRecognitions = () => useRecognitionStore((s) => s.recognitions);
export const useRecognitionStats = () => useRecognitionStore((s) => s.userStats);
export const useRecognitionLimits = () => useRecognitionStore((s) => s.limits);
export const useRecognitionLeaderboard = () => useRecognitionStore((s) => s.leaderboard);
export const useRecognitionSummary = () => useRecognitionStore((s) => s.wallSummary);
