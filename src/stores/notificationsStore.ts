import { create } from 'zustand';
import type { Notification, NotificationType, NotificationPreferences } from '@/types';

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'document_new',
    title: 'New Document Available',
    message: 'A new policy document "Remote Work Guidelines 2024" has been published.',
    priority: 'normal',
    isRead: false,
    actionUrl: '/library/6',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
  },
  {
    id: '2',
    userId: '1',
    type: 'forum_reply',
    title: 'New Reply to Your Topic',
    message: 'Kwame Asante replied to your topic "Best practices for document management"',
    priority: 'normal',
    isRead: false,
    actionUrl: '/forum/topic/1',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: '3',
    userId: '1',
    type: 'xp_earned',
    title: 'XP Earned!',
    message: 'You earned 50 XP for completing the Digital Skills Training module.',
    priority: 'low',
    isRead: false,
    actionUrl: '/leaderboard',
    metadata: { xp: 50 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
  },
  {
    id: '4',
    userId: '1',
    type: 'badge_earned',
    title: 'New Badge Unlocked!',
    message: 'Congratulations! You\'ve earned the "Speed Reader" badge.',
    priority: 'normal',
    isRead: true,
    actionUrl: '/profile',
    metadata: { badgeId: 'b2' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: '5',
    userId: '1',
    type: 'group_invitation',
    title: 'Group Invitation',
    message: 'You\'ve been invited to join the "Digital Transformation Committee" group.',
    priority: 'high',
    isRead: true,
    actionUrl: '/groups/5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: '6',
    userId: '1',
    type: 'chat_mention',
    title: 'You were mentioned',
    message: 'Ama Mensah mentioned you in the "General Discussion" chat room.',
    priority: 'normal',
    isRead: true,
    actionUrl: '/chat/1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: '7',
    userId: '1',
    type: 'system_announcement',
    title: 'Platform Update',
    message: 'New features have been added to the e-library. Check out the changelog!',
    priority: 'high',
    isRead: true,
    actionUrl: '/help',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: '8',
    userId: '1',
    type: 'leaderboard_change',
    title: 'Leaderboard Update',
    message: 'You moved up 2 positions on the weekly leaderboard! You\'re now #5.',
    priority: 'low',
    isRead: true,
    actionUrl: '/leaderboard',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
  },
];

const defaultPreferences: NotificationPreferences = {
  userId: '1',
  email: {
    enabled: true,
    frequency: 'daily',
    categories: [
      'document_new',
      'document_update',
      'forum_reply',
      'forum_mention',
      'group_invitation',
      'system_announcement',
    ],
  },
  push: {
    enabled: true,
    categories: [
      'chat_message',
      'chat_mention',
      'forum_reply',
      'forum_mention',
      'xp_earned',
      'badge_earned',
      'level_up',
    ],
  },
  inApp: {
    enabled: true,
    categories: [
      'document_new',
      'document_update',
      'document_comment',
      'document_mention',
      'forum_reply',
      'forum_mention',
      'forum_subscription',
      'chat_message',
      'chat_mention',
      'chat_reaction',
      'group_invitation',
      'group_post',
      'group_member',
      'system_announcement',
      'system_maintenance',
      'xp_earned',
      'level_up',
      'badge_earned',
      'leaderboard_change',
      'news_breaking',
    ],
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
};

interface NotificationsState {
  notifications: Notification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  isLoading: boolean;
  lastFetchedAt: string | null;
}

interface NotificationsActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>) => void;
  startPolling: () => void;
  stopPolling: () => void;
}

type NotificationsStore = NotificationsState & NotificationsActions;

let pollingInterval: ReturnType<typeof setInterval> | null = null;

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  // Initial state
  notifications: [],
  preferences: defaultPreferences,
  unreadCount: 0,
  isLoading: false,
  lastFetchedAt: null,

  // Actions
  fetchNotifications: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

    set({
      notifications: mockNotifications,
      unreadCount,
      isLoading: false,
      lastFetchedAt: new Date().toISOString(),
    });
  },

  markAsRead: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      return { notifications, unreadCount };
    });
  },

  markAllAsRead: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  deleteNotification: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      return { notifications, unreadCount };
    });
  },

  clearAllNotifications: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ notifications: [], unreadCount: 0 });
  },

  updatePreferences: async (updates: Partial<NotificationPreferences>) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      preferences: { ...state.preferences, ...updates },
    }));
  },

  fetchPreferences: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Preferences are already set to defaults
  },

  addNotification: (notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      userId: '1',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  startPolling: () => {
    // Poll for new notifications every 30 seconds
    if (pollingInterval) return;

    pollingInterval = setInterval(() => {
      // Simulate new notification occasionally
      if (Math.random() > 0.8) {
        const types: NotificationType[] = ['xp_earned', 'forum_reply', 'chat_message'];
        const randomType = types[Math.floor(Math.random() * types.length)]!;

        get().addNotification({
          type: randomType,
          title: 'New Activity',
          message: 'Something new happened on the platform.',
          priority: 'normal',
          isRead: false,
        });
      }
    }, 30000);
  },

  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  },
}));
