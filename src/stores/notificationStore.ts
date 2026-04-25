import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playNotificationSound, playSuccessSound, playAlertSound } from '@/utils/notificationSound';

// API base URL
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

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

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'message'
    | 'document'
    | 'forum_reply'
    | 'forum_mention'
    | 'group_invite'
    | 'group_post'
    | 'badge_earned'
    | 'level_up'
    | 'xp_earned'
    | 'system'
    | 'announcement'
    | 'like'
    | 'follow'
    | 'security'
    | 'challenge_complete'
    | 'streak'
    | 'welcome'
    | 'document_approved'
    | 'document_rejected';
  title: string;
  message: string;
  link?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  resourceId?: string;
  resourceType?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  isArchived: boolean;
  metadata?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationSummary {
  unreadTotal: number;
  unreadByType: Record<string, number>;
  unreadByPriority: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
  todayCount: number;
  weekCount: number;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  emailDigestEnabled: boolean;
  emailDigestFrequency: 'instant' | 'daily' | 'weekly' | 'never';
  emailDigestTime: string;
  telegramEnabled: boolean;
  categoryPreferences: {
    messages: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    documents: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    forum: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    groups: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    achievements: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    system: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
  };
}

interface NotificationState {
  // Data
  notifications: Notification[];
  summary: NotificationSummary | null;
  preferences: NotificationPreferences | null;

  // Pagination
  page: number;
  totalPages: number;
  total: number;

  // Loading states
  isLoading: boolean;
  isSummaryLoading: boolean;
  isPreferencesLoading: boolean;

  // Filters
  filter: 'all' | 'unread' | 'archived';
  typeFilter: string | null;

  // Error
  error: string | null;

  // Push subscription
  pushSubscription: PushSubscription | null;
  isPushSupported: boolean;

  // Telegram
  telegramStatus: {
    linked: boolean;
    status?: string;
    username?: string;
    firstName?: string;
    mutedUntil?: string;
    linkedAt?: string;
  } | null;
  isTelegramLoading: boolean;

  // Actions
  fetchNotifications: (page?: number, append?: boolean) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: (archived?: boolean) => Promise<void>;
  setFilter: (filter: 'all' | 'unread' | 'archived') => void;
  setTypeFilter: (type: string | null) => void;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<void>;
  checkPushSupport: () => void;
  fetchTelegramStatus: () => Promise<void>;
  linkTelegram: () => Promise<{ deepLink: string; token: string; expiresAt: string } | null>;
  unlinkTelegram: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  reset: () => void;
}

const defaultPreferences: NotificationPreferences = {
  emailEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  soundEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  emailDigestEnabled: true,
  emailDigestFrequency: 'daily',
  emailDigestTime: '08:00',
  telegramEnabled: false,
  categoryPreferences: {
    messages: { email: true, push: true, inApp: true, telegram: false },
    documents: { email: true, push: false, inApp: true, telegram: true },
    forum: { email: false, push: true, inApp: true, telegram: false },
    groups: { email: true, push: true, inApp: true, telegram: false },
    achievements: { email: false, push: true, inApp: true, telegram: false },
    system: { email: true, push: true, inApp: true, telegram: true }
  }
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      summary: null,
      preferences: null,
      page: 1,
      totalPages: 1,
      total: 0,
      isLoading: false,
      isSummaryLoading: false,
      isPreferencesLoading: false,
      filter: 'all',
      typeFilter: null,
      error: null,
      pushSubscription: null,
      isPushSupported: false,
      telegramStatus: null,
      isTelegramLoading: false,

      // Fetch notifications with pagination
      fetchNotifications: async (page = 1, append = false) => {
        const { filter, typeFilter } = get();
        set({ isLoading: true, error: null });

        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: '20',
            filter
          });

          if (typeFilter) {
            params.append('type', typeFilter);
          }

          const response = await authFetch(`${API_BASE}/notifications?${params}`);

          if (!response.ok) {
            throw new Error('Failed to fetch notifications');
          }

          const data = await response.json();

          set({
            notifications: append
              ? [...get().notifications, ...data.notifications]
              : data.notifications,
            page: data.pagination.page,
            totalPages: data.pagination.totalPages,
            total: data.pagination.total,
            isLoading: false
          });
        } catch (error: any) {
          console.error('Error fetching notifications:', error);
          set({
            error: error.message || 'Failed to fetch notifications',
            isLoading: false
          });
        }
      },

      // Fetch notification summary
      fetchSummary: async () => {
        set({ isSummaryLoading: true });

        try {
          const response = await authFetch(`${API_BASE}/notifications/summary`);

          if (!response.ok) {
            throw new Error('Failed to fetch summary');
          }

          const data = await response.json();
          set({
            summary: data,
            isSummaryLoading: false
          });
        } catch (error: any) {
          console.error('Error fetching notification summary:', error);
          set({ isSummaryLoading: false });
        }
      },

      // Fetch preferences
      fetchPreferences: async () => {
        set({ isPreferencesLoading: true });

        try {
          const response = await authFetch(`${API_BASE}/notifications/preferences`);

          if (!response.ok) {
            throw new Error('Failed to fetch preferences');
          }

          const data = await response.json();
          set({
            preferences: data,
            isPreferencesLoading: false
          });
        } catch (error: any) {
          console.error('Error fetching notification preferences:', error);
          set({
            preferences: defaultPreferences,
            isPreferencesLoading: false
          });
        }
      },

      // Update preferences
      updatePreferences: async (prefs) => {
        const currentPrefs = get().preferences || defaultPreferences;
        const newPrefs = { ...currentPrefs, ...prefs };

        set({ preferences: newPrefs });

        try {
          const response = await authFetch(`${API_BASE}/notifications/preferences`, {
            method: 'PUT',
            body: JSON.stringify(newPrefs)
          });

          if (!response.ok) {
            throw new Error('Failed to update preferences');
          }
        } catch (error: any) {
          console.error('Error updating preferences:', error);
          // Revert on error
          set({ preferences: currentPrefs });
          throw error;
        }
      },

      // Mark single notification as read
      markAsRead: async (id) => {
        const { notifications } = get();

        // Optimistic update
        set({
          notifications: notifications.map(n =>
            n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        });

        try {
          await authFetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
          // Refresh summary
          get().fetchSummary();
        } catch (error: any) {
          console.error('Error marking notification as read:', error);
          // Revert on error
          set({
            notifications: notifications.map(n =>
              n.id === id ? { ...n, isRead: false, readAt: undefined } : n
            )
          });
        }
      },

      // Mark all as read
      markAllAsRead: async () => {
        const { notifications } = get();
        const now = new Date().toISOString();

        // Optimistic update
        set({
          notifications: notifications.map(n => ({ ...n, isRead: true, readAt: now }))
        });

        try {
          await authFetch(`${API_BASE}/notifications/read-all`, { method: 'PATCH' });
          get().fetchSummary();
        } catch (error: any) {
          console.error('Error marking all as read:', error);
          // Revert on error
          set({ notifications });
        }
      },

      // Archive notification
      archiveNotification: async (id) => {
        const { notifications, filter } = get();

        // Optimistic update
        set({
          notifications: filter === 'archived'
            ? notifications
            : notifications.filter(n => n.id !== id)
        });

        try {
          await authFetch(`${API_BASE}/notifications/${id}/archive`, { method: 'PATCH' });
        } catch (error: any) {
          console.error('Error archiving notification:', error);
          // Revert on error - would need to track original state better
          get().fetchNotifications();
        }
      },

      // Delete notification
      deleteNotification: async (id) => {
        const { notifications } = get();

        // Optimistic update
        set({
          notifications: notifications.filter(n => n.id !== id)
        });

        try {
          await authFetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE' });
          get().fetchSummary();
        } catch (error: any) {
          console.error('Error deleting notification:', error);
          // Revert on error
          get().fetchNotifications();
        }
      },

      // Clear all notifications
      clearAll: async (archived = false) => {
        const { notifications } = get();

        // Optimistic update
        set({ notifications: [] });

        try {
          await authFetch(`${API_BASE}/notifications${archived ? '?archived=true' : ''}`, { method: 'DELETE' });
          get().fetchSummary();
        } catch (error: any) {
          console.error('Error clearing notifications:', error);
          // Revert on error
          set({ notifications });
        }
      },

      // Set read filter
      setFilter: (filter) => {
        set({ filter, page: 1 });
        get().fetchNotifications(1);
      },

      // Set type filter
      setTypeFilter: (type) => {
        set({ typeFilter: type, page: 1 });
        get().fetchNotifications(1);
      },

      // Check push notification support
      checkPushSupport: () => {
        const isPushSupported = 'PushManager' in window && 'serviceWorker' in navigator;
        set({ isPushSupported });
      },

      fetchTelegramStatus: async () => {
        try {
          set({ isTelegramLoading: true });
          const res = await authFetch(`${API_BASE}/telegram/status`);
          if (res.ok) {
            const data = await res.json();
            set({ telegramStatus: data });
          }
        } catch (err) {
          console.error('Failed to fetch Telegram status:', err);
        } finally {
          set({ isTelegramLoading: false });
        }
      },

      linkTelegram: async () => {
        try {
          set({ isTelegramLoading: true });
          const res = await authFetch(`${API_BASE}/telegram/link`, {
            method: 'POST',
          });
          if (res.ok) {
            return await res.json();
          }
          return null;
        } catch (err) {
          console.error('Failed to generate Telegram link:', err);
          return null;
        } finally {
          set({ isTelegramLoading: false });
        }
      },

      unlinkTelegram: async () => {
        try {
          set({ isTelegramLoading: true });
          const res = await authFetch(`${API_BASE}/telegram/link`, {
            method: 'DELETE',
          });
          if (res.ok) {
            set({ telegramStatus: { linked: false } });
          }
        } catch (err) {
          console.error('Failed to unlink Telegram:', err);
        } finally {
          set({ isTelegramLoading: false });
        }
      },

      // Subscribe to push notifications
      subscribeToPush: async () => {
        if (!get().isPushSupported) return false;

        try {
          const registration = await navigator.serviceWorker.ready;

          // Request notification permission
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return false;

          // Get VAPID public key from environment
          const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

          if (!vapidPublicKey) {
            console.error('VAPID public key not configured');
            return false;
          }

          // Convert base64 URL-safe to Uint8Array for applicationServerKey
          const urlBase64ToUint8Array = (base64String: string) => {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
              .replace(/-/g, '+')
              .replace(/_/g, '/');
            const rawData = window.atob(base64);
            return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
          };

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });

          // Send subscription to server
          await authFetch(`${API_BASE}/notifications/subscribe`, {
            method: 'POST',
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              keys: {
                p256dh: btoa(String.fromCharCode.apply(null,
                  Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
                auth: btoa(String.fromCharCode.apply(null,
                  Array.from(new Uint8Array(subscription.getKey('auth')!))))
              },
              userAgent: navigator.userAgent
            })
          });

          set({ pushSubscription: subscription });
          return true;
        } catch (error) {
          console.error('Failed to subscribe to push:', error);
          return false;
        }
      },

      // Unsubscribe from push notifications
      unsubscribeFromPush: async () => {
        const { pushSubscription } = get();
        if (!pushSubscription) return;

        try {
          await pushSubscription.unsubscribe();
          await authFetch(`${API_BASE}/notifications/subscribe`, {
            method: 'DELETE',
            body: JSON.stringify({ endpoint: pushSubscription.endpoint })
          });
          set({ pushSubscription: null });
        } catch (error) {
          console.error('Failed to unsubscribe from push:', error);
        }
      },

      // Add a notification (for real-time updates)
      addNotification: (notification) => {
        const { notifications, preferences } = get();

        // Check if in-app notifications are enabled
        if (preferences && !preferences.inAppEnabled) return;

        // Check category preferences
        const categoryMap: Record<string, string> = {
          message: 'messages',
          document: 'documents',
          document_approved: 'documents',
          document_rejected: 'documents',
          forum_reply: 'forum',
          forum_mention: 'forum',
          group_invite: 'groups',
          group_post: 'groups',
          badge_earned: 'achievements',
          level_up: 'achievements',
          xp_earned: 'achievements',
          challenge_complete: 'achievements',
          streak: 'achievements',
          system: 'system',
          announcement: 'system',
          security: 'system',
          welcome: 'system'
        };

        const category = categoryMap[notification.type] || 'system';
        if (preferences?.categoryPreferences?.[category as keyof typeof preferences.categoryPreferences]?.inApp === false) {
          return;
        }

        // Play sound if enabled
        if (preferences?.soundEnabled) {
          try {
            // Use different sounds based on notification priority/type
            if (notification.priority === 'urgent' || notification.type === 'security') {
              playAlertSound(0.4);
            } else if (['badge_earned', 'level_up', 'xp_earned', 'challenge_complete'].includes(notification.type)) {
              playSuccessSound(0.3);
            } else {
              playNotificationSound(0.3);
            }
          } catch {}
        }

        set({
          notifications: [notification, ...notifications]
        });

        // Update summary
        get().fetchSummary();
      },

      // Reset store
      reset: () => {
        set({
          notifications: [],
          summary: null,
          preferences: null,
          page: 1,
          totalPages: 1,
          total: 0,
          isLoading: false,
          isSummaryLoading: false,
          isPreferencesLoading: false,
          filter: 'all',
          typeFilter: null,
          error: null,
          telegramStatus: null,
          isTelegramLoading: false,
        });
      }
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        preferences: state.preferences
      })
    }
  )
);

// Selector hooks for common patterns
export const useUnreadCount = () => useNotificationStore((state) => state.summary?.unreadTotal || 0);
export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useNotificationPreferences = () => useNotificationStore((state) => state.preferences);
