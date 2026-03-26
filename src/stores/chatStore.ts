import { create } from 'zustand';
import type { ChatRoom, ChatMessage, Conversation, DirectMessage, TypingIndicator } from '@/types';

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
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
};

interface ChatState {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: ChatMessage[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  directMessages: DirectMessage[];
  typingUsers: TypingIndicator[];
  roomMembers: any[];
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  fetchRooms: () => Promise<void>;
  fetchRoom: (id: string) => Promise<void>;
  setCurrentRoom: (room: ChatRoom | null) => void;
  fetchMessages: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string, type?: 'text' | 'image' | 'file') => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  createRoom: (data: { name: string; description?: string; type: 'public' | 'private' }) => Promise<ChatRoom | null>;
  fetchRoomMembers: (roomId: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchConversation: (id: string) => Promise<void>;
  fetchDirectMessages: (conversationId: string) => Promise<void>;
  sendDirectMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (roomId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  rooms: [],
  currentRoom: null,
  messages: [],
  conversations: [],
  currentConversation: null,
  directMessages: [],
  typingUsers: [],
  roomMembers: [],
  isLoading: false,
  error: null,

  // Actions
  fetchRooms: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/chat/rooms`);

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const rooms = await response.json();

      // Transform API response to match ChatRoom type
      const transformedRooms: ChatRoom[] = (rooms || []).map((room: any) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        type: room.type,
        mdaId: room.mdaId,
        createdById: room.createdById,
        memberCount: room.memberCount || 0,
        lastMessageAt: room.lastMessageAt,
        isJoined: room.isJoined === 1,
        unreadCount: room.unreadCount || 0,
        createdAt: room.createdAt,
      }));

      set({ rooms: transformedRooms, isLoading: false });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch rooms',
        isLoading: false,
        rooms: []
      });
    }
  },

  fetchRoom: async (id: string) => {
    set({ isLoading: true });

    try {
      const response = await authFetch(`${API_BASE}/chat/rooms/${id}`);

      if (!response.ok) {
        throw new Error('Room not found');
      }

      const room = await response.json();

      const transformedRoom: ChatRoom = {
        id: room.id,
        name: room.name,
        description: room.description,
        type: room.type,
        mdaId: room.mdaId,
        createdById: room.createdById,
        memberCount: room.memberCount || 0,
        lastMessageAt: room.lastMessageAt,
        isJoined: room.isJoined === 1,
        unreadCount: 0,
        createdAt: room.createdAt,
      };

      set({ currentRoom: transformedRoom, isLoading: false });
    } catch (error) {
      console.error('Error fetching room:', error);
      set({ currentRoom: null, isLoading: false });
    }
  },

  setCurrentRoom: (room: ChatRoom | null) => {
    set({ currentRoom: room, messages: [] });
  },

  fetchMessages: async (roomId: string) => {
    set({ isLoading: true });

    try {
      const response = await authFetch(`${API_BASE}/chat/rooms/${roomId}/messages`);

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const messages = await response.json();

      // Transform API response to match ChatMessage type
      const transformedMessages: ChatMessage[] = (messages || []).map((msg: any) => ({
        id: msg.id,
        roomId: msg.roomId,
        senderId: msg.senderId,
        sender: {
          id: msg.senderId,
          displayName: msg.senderName || 'User',
          avatar: msg.senderAvatar,
        },
        content: msg.content,
        type: msg.type || 'text',
        attachments: [],
        reactions: msg.reactions || [],
        replyToId: msg.replyToId,
        isEdited: msg.isEdited === 1,
        isDeleted: msg.isDeleted === 1,
        readBy: [],
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      }));

      set({ messages: transformedMessages, isLoading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ messages: [], isLoading: false });
    }
  },

  sendMessage: async (roomId: string, content: string, type = 'text') => {
    try {
      const response = await authFetch(`${API_BASE}/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to send message');
      }

      const newMessage = await response.json();

      const transformedMessage: ChatMessage = {
        id: newMessage.id,
        roomId: newMessage.roomId,
        senderId: newMessage.senderId,
        sender: {
          id: newMessage.senderId,
          email: '',
          staffId: '',
          firstName: newMessage.senderName || 'User',
          lastName: '',
          displayName: newMessage.senderName || 'User',
          avatar: newMessage.senderAvatar,
          role: 'user',
          status: 'active',
          mdaId: '',
          skills: [],
          interests: [],
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        content: newMessage.content,
        type: newMessage.type || 'text',
        attachments: [],
        reactions: [],
        isEdited: false,
        isDeleted: false,
        readBy: [],
        createdAt: newMessage.createdAt,
        updatedAt: newMessage.updatedAt,
      };

      set((state) => ({
        messages: [...state.messages, transformedMessage],
        rooms: state.rooms.map((r) =>
          r.id === roomId
            ? { ...r, lastMessageAt: transformedMessage.createdAt }
            : r
        ),
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    }
  },

  editMessage: async (messageId: string, content: string) => {
    try {
      const response = await authFetch(`${API_BASE}/chat/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId
            ? { ...m, content, isEdited: true, updatedAt: new Date().toISOString() }
            : m
        ),
      }));
    } catch (error) {
      console.error('Error editing message:', error);
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/chat/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: 'This message was deleted' }
            : m
        ),
      }));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  },

  addReaction: async (messageId: string, emoji: string) => {
    try {
      const response = await authFetch(`${API_BASE}/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }

      const result = await response.json();

      // Update local state based on action
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m.id !== messageId) return m;

          const existingReaction = m.reactions.find((r) => r.emoji === emoji);

          if (result.action === 'removed') {
            // Remove user from reaction
            return {
              ...m,
              reactions: m.reactions
                .map((r) =>
                  r.emoji === emoji
                    ? { ...r, count: r.count - 1 }
                    : r
                )
                .filter((r) => r.count > 0),
            };
          } else {
            // Add reaction
            if (existingReaction) {
              return {
                ...m,
                reactions: m.reactions.map((r) =>
                  r.emoji === emoji
                    ? { ...r, count: r.count + 1 }
                    : r
                ),
              };
            } else {
              return {
                ...m,
                reactions: [...m.reactions, { emoji, count: 1, users: [] }],
              };
            }
          }
        }),
      }));
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  },

  joinRoom: async (roomId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/chat/rooms/${roomId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to join room');
      }

      set((state) => ({
        rooms: state.rooms.map((r) =>
          r.id === roomId
            ? { ...r, isJoined: true, memberCount: r.memberCount + 1 }
            : r
        ),
      }));
    } catch (error) {
      console.error('Error joining room:', error);
    }
  },

  leaveRoom: async (roomId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/chat/rooms/${roomId}/leave`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to leave room');
      }

      set((state) => ({
        rooms: state.rooms.map((r) =>
          r.id === roomId
            ? { ...r, isJoined: false, memberCount: Math.max(0, r.memberCount - 1) }
            : r
        ),
      }));
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  },

  createRoom: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create room');
      }

      const room = await response.json();

      const newRoom: ChatRoom = {
        id: room.id,
        name: room.name,
        description: room.description,
        type: room.type,
        createdById: room.createdById,
        memberCount: room.memberCount || 1,
        isJoined: true,
        unreadCount: 0,
        createdAt: room.createdAt,
      };

      set((state) => ({
        rooms: [newRoom, ...state.rooms],
        isLoading: false,
      }));

      return newRoom;
    } catch (error) {
      console.error('Error creating room:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create room',
        isLoading: false
      });
      return null;
    }
  },

  fetchRoomMembers: async (roomId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/chat/rooms/${roomId}/members`);

      if (!response.ok) {
        return;
      }

      const members = await response.json();
      set({ roomMembers: members || [] });
    } catch (error) {
      console.error('Error fetching members:', error);
      set({ roomMembers: [] });
    }
  },

  fetchConversations: async () => {
    // DMs not implemented yet
    set({ conversations: [] });
  },

  fetchConversation: async (_id: string) => {
    // DMs not implemented yet
    set({ currentConversation: null });
  },

  fetchDirectMessages: async (_conversationId: string) => {
    // DMs not implemented yet
    set({ directMessages: [] });
  },

  sendDirectMessage: async (_conversationId: string, _content: string) => {
    // DMs not implemented yet
  },

  markAsRead: async (roomId: string) => {
    // Update local state immediately
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, unreadCount: 0 } : r
      ),
    }));

    // Persist to API
    try {
      await authFetch(`${API_BASE}/chat/rooms/${roomId}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Error marking room as read:', error);
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
