import { create } from 'zustand';
import type { ChatRoom, ChatMessage, Conversation, DirectMessage, TypingIndicator } from '@/types';

// Mock chat rooms
const mockRooms: ChatRoom[] = [
  {
    id: '1',
    name: 'General Discussion',
    description: 'Open chat for all civil servants',
    type: 'public',
    createdById: '1',
    memberCount: 1250,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isJoined: true,
    unreadCount: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Ministry of Finance',
    description: 'Official channel for MoF staff',
    type: 'mda',
    mdaId: '1',
    createdById: '2',
    memberCount: 450,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isJoined: true,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Tech Enthusiasts',
    description: 'For discussions about technology and innovation',
    type: 'public',
    createdById: '1',
    memberCount: 380,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isJoined: true,
    unreadCount: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'HR Network',
    description: 'Human Resources professionals network',
    type: 'public',
    createdById: '4',
    memberCount: 290,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    isJoined: false,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Digital Transformation',
    description: 'Discussing digital initiatives across government',
    type: 'public',
    createdById: '2',
    memberCount: 520,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isJoined: true,
    unreadCount: 12,
    createdAt: new Date().toISOString(),
  },
];

// Mock messages
const mockMessages: ChatMessage[] = [
  {
    id: '1',
    roomId: '1',
    senderId: '2',
    content: 'Good morning everyone! Hope you all had a great weekend.',
    type: 'text',
    attachments: [],
    reactions: [{ emoji: '👋', users: ['3', '4', '5'], count: 3 }],
    isEdited: false,
    isDeleted: false,
    readBy: ['1', '3', '4'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    roomId: '1',
    senderId: '3',
    content: 'Good morning! Has anyone seen the new circular on remote work?',
    type: 'text',
    attachments: [],
    reactions: [],
    isEdited: false,
    isDeleted: false,
    readBy: ['1', '2', '4'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '3',
    roomId: '1',
    senderId: '1',
    content: 'Yes! It is available in the library under Circulars. Very comprehensive document.',
    type: 'text',
    attachments: [],
    reactions: [{ emoji: '👍', users: ['2', '3'], count: 2 }],
    isEdited: false,
    isDeleted: false,
    readBy: ['2', '3'],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: '4',
    roomId: '1',
    senderId: '4',
    content: 'Thanks for sharing! I will check it out.',
    type: 'text',
    attachments: [],
    reactions: [],
    isEdited: false,
    isDeleted: false,
    readBy: ['1', '2', '3'],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '5',
    roomId: '1',
    senderId: '2',
    content: '@john.doe Could you share the link?',
    type: 'text',
    attachments: [],
    reactions: [],
    isEdited: false,
    isDeleted: false,
    readBy: ['1', '3', '4'],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

// Mock conversations (DMs)
const mockConversations: Conversation[] = [
  {
    id: 'c1',
    participantIds: ['1', '2'],
    participants: [
      { id: '2', email: 'kwame.asante@ohcs.gov.gh', staffId: 'GCS-001', firstName: 'Kwame', lastName: 'Asante', displayName: 'Kwame Asante', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', role: 'director', status: 'active', mdaId: '1', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' },
    ],
    lastMessage: {
      id: 'dm1',
      conversationId: 'c1',
      senderId: '2',
      receiverId: '1',
      content: 'Can we discuss the project proposal tomorrow?',
      type: 'text',
      attachments: [],
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'c2',
    participantIds: ['1', '3'],
    participants: [
      { id: '3', email: 'ama.mensah@mof.gov.gh', staffId: 'GCS-002', firstName: 'Ama', lastName: 'Mensah', displayName: 'Ama Mensah', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'admin', status: 'active', mdaId: '2', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' },
    ],
    lastMessage: {
      id: 'dm2',
      conversationId: 'c2',
      senderId: '1',
      receiverId: '3',
      content: 'Thanks for the help with the document!',
      type: 'text',
      attachments: [],
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

interface ChatState {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: ChatMessage[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  directMessages: DirectMessage[];
  typingUsers: TypingIndicator[];
  onlineUsers: string[];
  isLoading: boolean;
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
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  createRoom: (data: { name: string; description?: string; type: 'public' | 'private' }) => Promise<ChatRoom>;
  fetchConversations: () => Promise<void>;
  fetchConversation: (id: string) => Promise<void>;
  fetchDirectMessages: (conversationId: string) => Promise<void>;
  sendDirectMessage: (conversationId: string, content: string) => Promise<void>;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  markAsRead: (roomId: string) => void;
  simulateIncomingMessage: () => void;
}

type ChatStore = ChatState & ChatActions;

let messageSimulationInterval: ReturnType<typeof setInterval> | null = null;

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  rooms: [],
  currentRoom: null,
  messages: [],
  conversations: [],
  currentConversation: null,
  directMessages: [],
  typingUsers: [],
  onlineUsers: ['1', '2', '3', '5'],
  isLoading: false,

  // Actions
  fetchRooms: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ rooms: mockRooms, isLoading: false });
  },

  fetchRoom: async (id: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    const room = mockRooms.find((r) => r.id === id);
    set({ currentRoom: room || null, isLoading: false });
  },

  setCurrentRoom: (room: ChatRoom | null) => {
    set({ currentRoom: room });
  },

  fetchMessages: async (roomId: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const messages = mockMessages.filter((m) => m.roomId === roomId);
    set({ messages, isLoading: false });
  },

  sendMessage: async (roomId: string, content: string, type = 'text') => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      roomId,
      senderId: '1',
      content,
      type,
      attachments: [],
      reactions: [],
      isEdited: false,
      isDeleted: false,
      readBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
      rooms: state.rooms.map((r) =>
        r.id === roomId
          ? { ...r, lastMessageAt: newMessage.createdAt, lastMessage: newMessage }
          : r
      ),
    }));
  },

  editMessage: async (messageId: string, content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, content, isEdited: true, updatedAt: new Date().toISOString() }
          : m
      ),
    }));
  },

  deleteMessage: async (messageId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, isDeleted: true, content: 'This message was deleted' }
          : m
      ),
    }));
  },

  addReaction: async (messageId: string, emoji: string) => {
    await new Promise((resolve) => setTimeout(resolve, 50));

    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m;

        const existingReaction = m.reactions.find((r) => r.emoji === emoji);
        if (existingReaction) {
          if (!existingReaction.users.includes('1')) {
            return {
              ...m,
              reactions: m.reactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, users: [...r.users, '1'], count: r.count + 1 }
                  : r
              ),
            };
          }
          return m;
        }

        return {
          ...m,
          reactions: [...m.reactions, { emoji, users: ['1'], count: 1 }],
        };
      }),
    }));
  },

  removeReaction: async (messageId: string, emoji: string) => {
    await new Promise((resolve) => setTimeout(resolve, 50));

    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m;

        return {
          ...m,
          reactions: m.reactions
            .map((r) =>
              r.emoji === emoji
                ? { ...r, users: r.users.filter((u) => u !== '1'), count: r.count - 1 }
                : r
            )
            .filter((r) => r.count > 0),
        };
      }),
    }));
  },

  joinRoom: async (roomId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId
          ? { ...r, isJoined: true, memberCount: r.memberCount + 1 }
          : r
      ),
    }));
  },

  leaveRoom: async (roomId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId
          ? { ...r, isJoined: false, memberCount: r.memberCount - 1 }
          : r
      ),
    }));
  },

  createRoom: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      type: data.type,
      createdById: '1',
      memberCount: 1,
      isJoined: true,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      rooms: [...state.rooms, newRoom],
    }));

    return newRoom;
  },

  fetchConversations: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ conversations: mockConversations, isLoading: false });
  },

  fetchConversation: async (id: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    const conversation = mockConversations.find((c) => c.id === id);
    set({ currentConversation: conversation || null, isLoading: false });
  },

  fetchDirectMessages: async (_conversationId: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Would fetch actual DMs based on conversation ID
    set({ directMessages: [], isLoading: false });
  },

  sendDirectMessage: async (conversationId: string, content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const newMessage: DirectMessage = {
      id: Date.now().toString(),
      conversationId,
      senderId: '1',
      receiverId: '2',
      content,
      type: 'text',
      attachments: [],
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      directMessages: [...state.directMessages, newMessage],
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: newMessage, updatedAt: newMessage.createdAt }
          : c
      ),
    }));
  },

  startTyping: (roomId: string) => {
    const indicator: TypingIndicator = {
      roomId,
      userId: '1',
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      typingUsers: [...state.typingUsers.filter((t) => t.userId !== '1'), indicator],
    }));
  },

  stopTyping: (_roomId: string) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter((t) => t.userId !== '1'),
    }));
  },

  markAsRead: (roomId: string) => {
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, unreadCount: 0 } : r
      ),
    }));
  },

  simulateIncomingMessage: () => {
    // Simulate incoming messages periodically
    if (messageSimulationInterval) return;

    messageSimulationInterval = setInterval(() => {
      const { currentRoom } = get();
      if (!currentRoom || Math.random() > 0.3) return;

      const sampleMessages = [
        'Has anyone tried the new document search feature?',
        'Great discussion everyone!',
        'I have a question about the policy update.',
        'Thanks for sharing that resource.',
        'Looking forward to the training session tomorrow.',
      ];

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        roomId: currentRoom.id,
        senderId: ['2', '3', '4', '5'][Math.floor(Math.random() * 4)]!,
        content: sampleMessages[Math.floor(Math.random() * sampleMessages.length)]!,
        type: 'text',
        attachments: [],
        reactions: [],
        isEdited: false,
        isDeleted: false,
        readBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    }, 15000); // Every 15 seconds
  },
}));
