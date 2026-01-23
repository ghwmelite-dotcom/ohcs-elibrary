/**
 * Ozzy AI Knowledge Assistant Store
 * Zustand store for managing Ozzy chat state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OzzySession,
  OzzyMessage,
  OzzyTopic,
  OzzyUserStats,
  OzzyMessageResponse,
  OzzySessionsResponse,
} from '@/types/ozzy';

const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

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
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }
  return response.json();
};

interface OzzyState {
  // Sessions
  sessions: OzzySession[];
  currentSession: OzzySession | null;
  messages: OzzyMessage[];
  suggestions: string[];

  // Loading states
  isLoading: boolean;
  isSending: boolean;
  isTyping: boolean;

  // Widget state
  widgetOpen: boolean;
  widgetMinimized: boolean;

  // User stats
  userStats: OzzyUserStats | null;

  // Error handling
  error: string | null;

  // Actions
  fetchSessions: (status?: string) => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  createSession: (topic?: OzzyTopic, title?: string) => Promise<OzzySession | null>;
  sendMessage: (content: string) => Promise<OzzyMessageResponse | null>;
  rateMessage: (messageId: string, helpful: boolean) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  fetchUserStats: () => Promise<void>;

  // Widget actions
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
  minimizeWidget: () => void;
  expandWidget: () => void;

  // Session management
  setCurrentSession: (session: OzzySession | null) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export const useOzzyStore = create<OzzyState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      currentSession: null,
      messages: [],
      suggestions: [],
      isLoading: false,
      isSending: false,
      isTyping: false,
      widgetOpen: false,
      widgetMinimized: false,
      userStats: null,
      error: null,

      // Fetch user's sessions
      fetchSessions: async (status?: string) => {
        set({ isLoading: true, error: null });
        try {
          const params = new URLSearchParams();
          if (status) params.set('status', status);
          params.set('limit', '20');

          const response = await authFetch(
            `${API_BASE}/ozzy/sessions?${params.toString()}`
          ) as OzzySessionsResponse;
          set({ sessions: response.sessions || [] });
        } catch (error: any) {
          console.error('Error fetching sessions:', error);
          set({ error: error.message || 'Failed to fetch sessions' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch a specific session with messages
      fetchSession: async (sessionId: string) => {
        set({ isLoading: true, error: null });
        try {
          const session = await authFetch(
            `${API_BASE}/ozzy/sessions/${sessionId}`
          ) as OzzySession & { messages: OzzyMessage[] };
          set({
            currentSession: session,
            messages: session.messages || [],
          });
        } catch (error: any) {
          console.error('Error fetching session:', error);
          set({ error: error.message || 'Failed to fetch session' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Create a new session
      createSession: async (topic: OzzyTopic = 'general', title?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/ozzy/sessions`, {
            method: 'POST',
            body: JSON.stringify({ topic, title }),
          }) as OzzySession & { suggestions: string[] };

          const session: OzzySession = {
            id: response.id,
            userId: '',
            title: response.title,
            topic: response.topic as OzzyTopic,
            status: response.status as 'active' | 'completed',
            messageCount: response.messageCount,
            createdAt: response.createdAt,
            updatedAt: response.createdAt,
          };

          set(state => ({
            sessions: [session, ...state.sessions],
            currentSession: session,
            messages: [],
            suggestions: response.suggestions || [],
          }));

          return session;
        } catch (error: any) {
          console.error('Error creating session:', error);
          set({ error: error.message || 'Failed to create session' });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      // Send a message and get AI response
      sendMessage: async (content: string) => {
        const { currentSession } = get();
        if (!currentSession) {
          set({ error: 'No active session' });
          return null;
        }

        set({ isSending: true, isTyping: true, error: null });

        // Optimistically add user message
        const tempUserMessage: OzzyMessage = {
          id: `temp-${Date.now()}`,
          sessionId: currentSession.id,
          role: 'user',
          content,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          messages: [...state.messages, tempUserMessage],
        }));

        try {
          const response = await authFetch(
            `${API_BASE}/ozzy/sessions/${currentSession.id}/messages`,
            { method: 'POST', body: JSON.stringify({ content }) }
          ) as OzzyMessageResponse;

          // Replace temp message with actual response
          set(state => ({
            messages: state.messages
              .filter(m => m.id !== tempUserMessage.id)
              .concat([response.userMessage, response.assistantMessage]),
            currentSession: state.currentSession ? {
              ...state.currentSession,
              messageCount: state.currentSession.messageCount + 2,
              lastMessageAt: new Date().toISOString(),
            } : null,
          }));

          return response;
        } catch (error: any) {
          console.error('Error sending message:', error);
          // Remove optimistic message on error
          set(state => ({
            messages: state.messages.filter(m => m.id !== tempUserMessage.id),
            error: error.message || 'Failed to send message',
          }));
          return null;
        } finally {
          set({ isSending: false, isTyping: false });
        }
      },

      // Rate a message as helpful or not
      rateMessage: async (messageId: string, helpful: boolean) => {
        try {
          await authFetch(`${API_BASE}/ozzy/messages/${messageId}/feedback`, {
            method: 'POST',
            body: JSON.stringify({ helpful }),
          });

          set(state => ({
            messages: state.messages.map(m =>
              m.id === messageId ? { ...m, helpful } : m
            ),
          }));
        } catch (error: any) {
          console.error('Error rating message:', error);
        }
      },

      // End a session
      endSession: async (sessionId: string) => {
        try {
          await authFetch(`${API_BASE}/ozzy/sessions/${sessionId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'completed' }),
          });

          set(state => ({
            sessions: state.sessions.map(s =>
              s.id === sessionId ? { ...s, status: 'completed' as const } : s
            ),
            currentSession: state.currentSession?.id === sessionId
              ? { ...state.currentSession, status: 'completed' as const }
              : state.currentSession,
          }));
        } catch (error: any) {
          console.error('Error ending session:', error);
          set({ error: error.message || 'Failed to end session' });
        }
      },

      // Delete a session
      deleteSession: async (sessionId: string) => {
        try {
          await authFetch(`${API_BASE}/ozzy/sessions/${sessionId}`, {
            method: 'DELETE',
          });

          set(state => ({
            sessions: state.sessions.filter(s => s.id !== sessionId),
            currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
            messages: state.currentSession?.id === sessionId ? [] : state.messages,
          }));
        } catch (error: any) {
          console.error('Error deleting session:', error);
          set({ error: error.message || 'Failed to delete session' });
        }
      },

      // Fetch suggested questions
      fetchSuggestions: async () => {
        try {
          const response = await authFetch(`${API_BASE}/ozzy/suggestions`) as { suggestions: string[] };
          set({ suggestions: response.suggestions || [] });
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      },

      // Fetch user stats
      fetchUserStats: async () => {
        try {
          const stats = await authFetch(`${API_BASE}/ozzy/stats`) as OzzyUserStats;
          set({ userStats: stats });
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      },

      // Widget actions
      openWidget: () => set({ widgetOpen: true, widgetMinimized: false }),
      closeWidget: () => set({ widgetOpen: false }),
      toggleWidget: () => set(state => ({ widgetOpen: !state.widgetOpen })),
      minimizeWidget: () => set({ widgetMinimized: true }),
      expandWidget: () => set({ widgetMinimized: false }),

      // Session management
      setCurrentSession: (session) => set({ currentSession: session }),
      clearMessages: () => set({ messages: [], currentSession: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'ozzy-store',
      partialize: (state) => ({
        // Only persist widget state
        widgetOpen: state.widgetOpen,
        widgetMinimized: state.widgetMinimized,
      }),
    }
  )
);
