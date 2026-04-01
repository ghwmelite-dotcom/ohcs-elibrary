import { create } from 'zustand';
import type {
  CounselorSession,
  CounselorMessage,
  MoodEntry,
  WellnessResource,
  WellnessStats
} from '@/types';

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

// Helper to get/set anonymous session ID
const getAnonymousId = (): string | null => {
  return sessionStorage.getItem('kaya-anonymous-id') || sessionStorage.getItem('drsena-anonymous-id');
};

const setAnonymousId = (id: string): void => {
  sessionStorage.setItem('kaya-anonymous-id', id);
};

const clearAnonymousId = (): void => {
  sessionStorage.removeItem('kaya-anonymous-id');
  sessionStorage.removeItem('drsena-anonymous-id');
};

// Helper for authenticated fetch (supports both auth and anonymous)
const wellnessFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const anonymousId = getAnonymousId();

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (anonymousId) {
    headers['X-Anonymous-Id'] = anonymousId;
  }

  return fetch(url, { ...options, headers });
};

interface WellnessState {
  // Sessions
  sessions: CounselorSession[];
  currentSession: CounselorSession | null;
  messages: CounselorMessage[];

  // Anonymous mode
  isAnonymous: boolean;
  anonymousId: string | null;

  // Mood tracking
  moodHistory: MoodEntry[];
  todayMood: MoodEntry | null;

  // Resources
  resources: WellnessResource[];
  currentResource: WellnessResource | null;
  bookmarkedResources: WellnessResource[];

  // Stats (for admin)
  stats: WellnessStats | null;

  // UI state
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Filter
  resourceFilter: {
    category?: string;
    type?: string;
    search?: string;
  };
}

interface WellnessActions {
  // Session management
  createSession: (data: {
    topic?: string;
    mood?: number;
    isAnonymous?: boolean
  }) => Promise<CounselorSession | null>;
  fetchSessions: () => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  setCurrentSession: (session: CounselorSession | null) => void;

  // Messaging
  sendMessage: (sessionId: string, content: string) => Promise<CounselorMessage | null>;
  rateMessage: (sessionId: string, messageId: string, helpful: boolean) => Promise<void>;

  // Escalation
  requestEscalation: (sessionId: string, reason?: string) => Promise<void>;

  // Mood tracking
  logMood: (data: { mood: number; factors?: string[]; notes?: string }) => Promise<void>;
  fetchMoodHistory: () => Promise<void>;

  // Resources
  fetchResources: (filter?: WellnessState['resourceFilter']) => Promise<void>;
  fetchResource: (resourceId: string) => Promise<void>;
  toggleBookmark: (resourceId: string) => Promise<void>;
  fetchBookmarkedResources: () => Promise<void>;
  setResourceFilter: (filter: Partial<WellnessState['resourceFilter']>) => void;

  // Admin stats
  fetchStats: () => Promise<void>;

  // Anonymous mode
  enableAnonymousMode: () => void;
  disableAnonymousMode: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

type WellnessStore = WellnessState & WellnessActions;

export const useWellnessStore = create<WellnessStore>((set, get) => ({
  // Initial state
  sessions: [],
  currentSession: null,
  messages: [],

  isAnonymous: false,
  anonymousId: getAnonymousId(),

  moodHistory: [],
  todayMood: null,

  resources: [],
  currentResource: null,
  bookmarkedResources: [],

  stats: null,

  isLoading: false,
  isSending: false,
  error: null,

  resourceFilter: {},

  // Session management
  createSession: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const { isAnonymous } = get();
      const anonymousId = isAnonymous ? getAnonymousId() : null;

      const response = await wellnessFetch(`${API_BASE}/counselor/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          isAnonymous,
          anonymousId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create session');
      }

      const session = await response.json();

      // Store anonymous ID if returned
      if (session.anonymousId && isAnonymous) {
        setAnonymousId(session.anonymousId);
        set({ anonymousId: session.anonymousId });
      }

      // Parse initial greeting message
      const initialMessages: CounselorMessage[] = session.messages || [];

      set((state) => ({
        currentSession: session,
        sessions: [session, ...state.sessions],
        messages: initialMessages,
        isLoading: false,
      }));

      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create session',
        isLoading: false,
      });
      return null;
    }
  },

  fetchSessions: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/sessions`);

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();

      set({
        sessions: data.sessions || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
        isLoading: false,
        sessions: [],
      });
    }
  },

  fetchSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error('Session not found');
      }

      const data = await response.json();

      set({
        currentSession: data.session,
        messages: data.messages || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching session:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch session',
        isLoading: false,
        currentSession: null,
        messages: [],
      });
    }
  },

  endSession: async (sessionId: string) => {
    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to end session');
      }

      set((state) => ({
        currentSession: state.currentSession?.id === sessionId
          ? { ...state.currentSession, status: 'completed' }
          : state.currentSession,
        sessions: state.sessions.map(s =>
          s.id === sessionId ? { ...s, status: 'completed' as const } : s
        ),
      }));
    } catch (error) {
      console.error('Error ending session:', error);
    }
  },

  setCurrentSession: (session) => {
    set({ currentSession: session, messages: [] });
  },

  // Messaging
  sendMessage: async (sessionId: string, content: string) => {
    set({ isSending: true, error: null });

    try {
      // Add user message optimistically
      const tempUserMessage: CounselorMessage = {
        id: `temp-${Date.now()}`,
        sessionId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, tempUserMessage],
      }));

      const response = await wellnessFetch(`${API_BASE}/counselor/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();

      // Replace temp message with real one and add AI response
      set((state) => {
        const filteredMessages = state.messages.filter(m => m.id !== tempUserMessage.id);
        return {
          messages: [
            ...filteredMessages,
            data.userMessage,
            data.aiMessage,
          ],
          currentSession: state.currentSession
            ? {
                ...state.currentSession,
                messageCount: (state.currentSession.messageCount || 0) + 2,
                lastMessageAt: data.aiMessage.createdAt,
              }
            : null,
          isSending: false,
        };
      });

      return data.userMessage;
    } catch (error) {
      console.error('Error sending message:', error);

      // Remove temp message on error
      set((state) => ({
        messages: state.messages.filter(m => !m.id.startsWith('temp-')),
        error: error instanceof Error ? error.message : 'Failed to send message',
        isSending: false,
      }));

      return null;
    }
  },

  rateMessage: async (sessionId: string, messageId: string, helpful: boolean) => {
    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, helpful }),
      });

      if (!response.ok) {
        throw new Error('Failed to rate message');
      }

      set((state) => ({
        messages: state.messages.map(m =>
          m.id === messageId ? { ...m, helpful } : m
        ),
      }));
    } catch (error) {
      console.error('Error rating message:', error);
    }
  },

  // Escalation
  requestEscalation: async (sessionId: string, reason?: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/sessions/${sessionId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to request escalation');
      }

      set((state) => ({
        currentSession: state.currentSession?.id === sessionId
          ? { ...state.currentSession, status: 'escalated' }
          : state.currentSession,
        sessions: state.sessions.map(s =>
          s.id === sessionId ? { ...s, status: 'escalated' as const } : s
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error requesting escalation:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to request escalation',
        isLoading: false,
      });
    }
  },

  // Mood tracking
  logMood: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to log mood');
      }

      const moodEntry = await response.json();

      set((state) => ({
        moodHistory: [moodEntry, ...state.moodHistory],
        todayMood: moodEntry,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error logging mood:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to log mood',
        isLoading: false,
      });
    }
  },

  fetchMoodHistory: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/mood`);

      if (!response.ok) {
        // Don't throw error if not authenticated - just return empty
        set({
          moodHistory: [],
          todayMood: null,
          isLoading: false,
        });
        return;
      }

      const data = await response.json();
      const entries = data.entries || [];

      // Find today's mood entry
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = entries.find((e: MoodEntry) =>
        e.createdAt?.startsWith(today)
      );

      set({
        moodHistory: entries,
        todayMood: todayEntry || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching mood history:', error);
      set({
        moodHistory: [],
        todayMood: null,
        isLoading: false,
      });
    }
  },

  // Resources
  fetchResources: async (filter) => {
    set({ isLoading: true, error: null });

    try {
      const currentFilter = filter || get().resourceFilter;
      const params = new URLSearchParams();

      if (currentFilter.category) params.append('category', currentFilter.category);
      if (currentFilter.type) params.append('type', currentFilter.type);
      if (currentFilter.search) params.append('search', currentFilter.search);

      const response = await wellnessFetch(`${API_BASE}/counselor/resources?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const data = await response.json();

      set({
        resources: data.resources || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching resources:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch resources',
        isLoading: false,
        resources: [],
      });
    }
  },

  fetchResource: async (resourceId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/resources/${resourceId}`);

      if (!response.ok) {
        throw new Error('Resource not found');
      }

      const resource = await response.json();

      set({
        currentResource: resource,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching resource:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch resource',
        isLoading: false,
        currentResource: null,
      });
    }
  },

  toggleBookmark: async (resourceId: string) => {
    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/resources/${resourceId}/bookmark`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle bookmark');
      }

      const result = await response.json();

      set((state) => ({
        resources: state.resources.map(r =>
          r.id === resourceId ? { ...r, isBookmarked: result.bookmarked } : r
        ),
        currentResource: state.currentResource?.id === resourceId
          ? { ...state.currentResource, isBookmarked: result.bookmarked }
          : state.currentResource,
        bookmarkedResources: result.bookmarked
          ? [...state.bookmarkedResources, state.resources.find(r => r.id === resourceId)!].filter(Boolean)
          : state.bookmarkedResources.filter(r => r.id !== resourceId),
      }));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  },

  fetchBookmarkedResources: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/bookmarks`);

      if (!response.ok) {
        throw new Error('Failed to fetch bookmarked resources');
      }

      const data = await response.json();

      set({
        bookmarkedResources: data.resources || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching bookmarked resources:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch bookmarks',
        isLoading: false,
      });
    }
  },

  setResourceFilter: (filter) => {
    set((state) => ({
      resourceFilter: { ...state.resourceFilter, ...filter },
    }));
  },

  // Admin stats
  fetchStats: async () => {
    try {
      const response = await wellnessFetch(`${API_BASE}/counselor/admin/dashboard`);

      if (!response.ok) {
        return;
      }

      const stats = await response.json();
      set({ stats });
    } catch (error) {
      console.error('Error fetching wellness stats:', error);
    }
  },

  // Anonymous mode
  enableAnonymousMode: () => {
    set({ isAnonymous: true });
  },

  disableAnonymousMode: () => {
    clearAnonymousId();
    set({
      isAnonymous: false,
      anonymousId: null,
    });
  },

  // Error handling
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
