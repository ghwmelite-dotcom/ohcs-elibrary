import { create } from 'zustand';
import type { DMConversation, EnhancedDirectMessage, User } from '../types';

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
  userId: string;
  displayName: string;
  avatar?: string;
}

interface DMState {
  // Conversations
  conversations: DMConversation[];
  currentConversation: DMConversation | null;

  // Messages by conversation ID
  messages: Record<string, EnhancedDirectMessage[]>;

  // Unread count
  unreadCount: number;

  // Typing indicators per conversation
  typingUsers: Record<string, TypingUser[]>;

  // Loading states
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;

  // Pagination per conversation
  messagePagination: Record<string, { page: number; hasMore: boolean }>;
}

interface DMActions {
  // Conversations
  fetchConversations: () => Promise<void>;
  getOrCreateConversation: (userId: string) => Promise<DMConversation | null>;
  setCurrentConversation: (conversation: DMConversation | null) => void;
  deleteConversation: (conversationId: string) => Promise<boolean>;

  // Messages
  fetchMessages: (conversationId: string, page?: number) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    attachments?: string[],
    replyToId?: string
  ) => Promise<EnhancedDirectMessage | null>;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (messageId: string, conversationId: string) => Promise<boolean>;

  // Reactions
  addReaction: (messageId: string, emoji: string, conversationId: string) => Promise<boolean>;
  removeReaction: (messageId: string, emoji: string, conversationId: string) => Promise<boolean>;

  // Read status
  markAsRead: (conversationId: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;

  // Typing indicators
  startTyping: (conversationId: string) => Promise<void>;
  stopTyping: (conversationId: string) => Promise<void>;
  fetchTypingUsers: (conversationId: string) => Promise<void>;

  // Real-time helpers
  addIncomingMessage: (conversationId: string, message: EnhancedDirectMessage) => void;
  updateTypingStatus: (conversationId: string, users: TypingUser[]) => void;

  // Search
  searchMessages: (query: string) => Promise<EnhancedDirectMessage[]>;

  // Helpers
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: DMState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  unreadCount: 0,
  typingUsers: {},
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,
  messagePagination: {},
};

export const useDMStore = create<DMState & DMActions>((set, get) => ({
  ...initialState,

  // ============================================================================
  // Conversations
  // ============================================================================

  fetchConversations: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/dm/conversations`);
      if (!response.ok) throw new Error('Failed to fetch conversations');

      const data = await response.json();
      set({
        conversations: data.conversations || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      set({ error: 'Failed to fetch conversations', isLoading: false });
    }
  },

  getOrCreateConversation: async (userId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/dm/conversations/${userId}`);
      if (!response.ok) throw new Error('Failed to get conversation');

      const data = await response.json();
      const conversation = data.conversation;

      // Add to conversations if new
      set((state) => {
        const exists = state.conversations.find((c) => c.id === conversation.id);
        if (!exists) {
          return {
            conversations: [conversation, ...state.conversations],
            currentConversation: conversation,
          };
        }
        return { currentConversation: conversation };
      });

      return conversation;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      set({ error: 'Failed to start conversation' });
      return null;
    }
  },

  setCurrentConversation: (conversation: DMConversation | null) => {
    set({ currentConversation: conversation });
    if (conversation) {
      // Mark as read when opening conversation
      get().markAsRead(conversation.id);
    }
  },

  deleteConversation: async (conversationId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/dm/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete conversation');

      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== conversationId),
        currentConversation:
          state.currentConversation?.id === conversationId ? null : state.currentConversation,
        messages: { ...state.messages, [conversationId]: [] },
      }));

      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  },

  // ============================================================================
  // Messages
  // ============================================================================

  fetchMessages: async (conversationId: string, page = 1) => {
    set({ isLoadingMessages: true });

    try {
      const response = await authFetch(
        `${API_BASE}/dm/messages/${conversationId}?page=${page}&limit=50`
      );
      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]:
            page === 1
              ? data.messages || []
              : [...(data.messages || []), ...(state.messages[conversationId] || [])],
        },
        messagePagination: {
          ...state.messagePagination,
          [conversationId]: {
            page,
            hasMore: (data.messages || []).length === 50,
          },
        },
        isLoadingMessages: false,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ isLoadingMessages: false });
    }
  },

  loadMoreMessages: async (conversationId: string) => {
    const pagination = get().messagePagination[conversationId];
    if (!pagination?.hasMore || get().isLoadingMessages) return;

    await get().fetchMessages(conversationId, pagination.page + 1);
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    attachments?: string[],
    replyToId?: string
  ) => {
    set({ isSending: true });

    try {
      const response = await authFetch(`${API_BASE}/dm/messages`, {
        method: 'POST',
        body: JSON.stringify({
          conversationId,
          content,
          attachments,
          replyToId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await response.json();
      const message = data.message;

      // Add to messages
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), message],
        },
        isSending: false,
      }));

      // Update conversation last message
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: message,
                lastMessageAt: message.createdAt,
              }
            : c
        ),
      }));

      // Stop typing indicator
      get().stopTyping(conversationId);

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      set({ isSending: false, error: 'Failed to send message' });
      return null;
    }
  },

  editMessage: async (messageId: string, content: string) => {
    try {
      const response = await authFetch(`${API_BASE}/dm/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to edit message');

      // Update in all conversation messages
      set((state) => {
        const newMessages = { ...state.messages };
        for (const convId in newMessages) {
          newMessages[convId] = newMessages[convId].map((m) =>
            m.id === messageId ? { ...m, content, isEdited: true } : m
          );
        }
        return { messages: newMessages };
      });

      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  },

  deleteMessage: async (messageId: string, conversationId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/dm/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete message');

      // Remove from messages
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).filter(
            (m) => m.id !== messageId
          ),
        },
      }));

      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  },

  // ============================================================================
  // Reactions
  // ============================================================================

  addReaction: async (messageId: string, emoji: string, conversationId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/dm/messages/${messageId}/reaction`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) throw new Error('Failed to add reaction');

      // Update message reactions
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map((m) => {
            if (m.id !== messageId) return m;
            const reactions = [...(m.reactions || [])];
            const existingIdx = reactions.findIndex((r) => r.emoji === emoji);
            if (existingIdx >= 0) {
              reactions[existingIdx] = {
                ...reactions[existingIdx],
                count: reactions[existingIdx].count + 1,
                hasReacted: true,
              };
            } else {
              reactions.push({ emoji, count: 1, hasReacted: true });
            }
            return { ...m, reactions };
          }),
        },
      }));

      return true;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return false;
    }
  },

  removeReaction: async (messageId: string, emoji: string, conversationId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/dm/messages/${messageId}/reaction/${emoji}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove reaction');

      // Update message reactions
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map((m) => {
            if (m.id !== messageId) return m;
            const reactions = (m.reactions || [])
              .map((r) => {
                if (r.emoji !== emoji) return r;
                return { ...r, count: r.count - 1, hasReacted: false };
              })
              .filter((r) => r.count > 0);
            return { ...m, reactions };
          }),
        },
      }));

      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return false;
    }
  },

  // ============================================================================
  // Read Status
  // ============================================================================

  markAsRead: async (conversationId: string) => {
    try {
      await authFetch(`${API_BASE}/dm/conversations/${conversationId}/read`, {
        method: 'PUT',
      });

      // Update unread count in conversation
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));

      // Refresh total unread count
      get().fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  markMessageAsRead: async (messageId: string) => {
    try {
      await authFetch(`${API_BASE}/dm/messages/${messageId}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await authFetch(`${API_BASE}/dm/unread-count`);
      if (!response.ok) return;

      const data = await response.json();
      set({ unreadCount: data.count || 0 });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  // ============================================================================
  // Typing Indicators
  // ============================================================================

  startTyping: async (conversationId: string) => {
    try {
      await authFetch(`${API_BASE}/presence/typing`, {
        method: 'POST',
        body: JSON.stringify({ roomId: conversationId, roomType: 'dm' }),
      });
    } catch (error) {
      // Silently fail - typing indicators are not critical
    }
  },

  stopTyping: async (conversationId: string) => {
    try {
      await authFetch(`${API_BASE}/presence/typing`, {
        method: 'DELETE',
        body: JSON.stringify({ roomId: conversationId, roomType: 'dm' }),
      });
    } catch (error) {
      // Silently fail
    }
  },

  fetchTypingUsers: async (conversationId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/presence/typing/dm/${conversationId}`);
      if (!response.ok) return;

      const data = await response.json();
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: data.typingUsers || [],
        },
      }));
    } catch (error) {
      // Silently fail
    }
  },

  // ============================================================================
  // Real-time Helpers
  // ============================================================================

  addIncomingMessage: (conversationId: string, message: EnhancedDirectMessage) => {
    set((state) => {
      // Add message if not already present
      const existingMessages = state.messages[conversationId] || [];
      if (existingMessages.find((m) => m.id === message.id)) {
        return state;
      }

      // Update conversation
      const updatedConversations = state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: message,
              lastMessageAt: message.createdAt,
              unreadCount:
                state.currentConversation?.id === conversationId ? 0 : c.unreadCount + 1,
            }
          : c
      );

      // Move conversation to top
      const conversationIndex = updatedConversations.findIndex((c) => c.id === conversationId);
      if (conversationIndex > 0) {
        const [conversation] = updatedConversations.splice(conversationIndex, 1);
        updatedConversations.unshift(conversation);
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message],
        },
        conversations: updatedConversations,
        unreadCount:
          state.currentConversation?.id === conversationId
            ? state.unreadCount
            : state.unreadCount + 1,
      };
    });
  },

  updateTypingStatus: (conversationId: string, users: TypingUser[]) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: users,
      },
    }));
  },

  // ============================================================================
  // Search
  // ============================================================================

  searchMessages: async (query: string) => {
    try {
      const response = await authFetch(
        `${API_BASE}/dm/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) return [];

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  },

  // ============================================================================
  // Helpers
  // ============================================================================

  setError: (error: string | null) => set({ error }),

  reset: () => set(initialState),
}));
