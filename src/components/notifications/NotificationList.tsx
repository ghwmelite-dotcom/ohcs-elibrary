import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Filter, Settings } from 'lucide-react';
import { NotificationItem, NotificationGroup, Notification } from './NotificationItem';
import { cn } from '@/utils/cn';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}: NotificationListProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    const matchesReadFilter = filter === 'all' || !n.isRead;
    const matchesTypeFilter = !typeFilter || n.type === typeFilter;
    return matchesReadFilter && matchesTypeFilter;
  });

  // Group notifications by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayNotifications = filteredNotifications.filter(
    (n) => new Date(n.createdAt) >= today
  );
  const yesterdayNotifications = filteredNotifications.filter(
    (n) => {
      const date = new Date(n.createdAt);
      return date >= yesterday && date < today;
    }
  );
  const thisWeekNotifications = filteredNotifications.filter(
    (n) => {
      const date = new Date(n.createdAt);
      return date >= weekAgo && date < yesterday;
    }
  );
  const olderNotifications = filteredNotifications.filter(
    (n) => new Date(n.createdAt) < weekAgo
  );

  const notificationTypes = [
    { id: 'message', label: 'Messages' },
    { id: 'document', label: 'Documents' },
    { id: 'forum_reply', label: 'Forum' },
    { id: 'group_invite', label: 'Groups' },
    { id: 'badge_earned', label: 'Achievements' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="font-semibold text-surface-900 dark:text-surface-50">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Read Filter */}
          <div className="flex items-center bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                filter === 'all'
                  ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-50 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                filter === 'unread'
                  ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-50 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400'
              )}
            >
              Unread
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setTypeFilter(null)}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors',
                !typeFilter
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              All Types
            </button>
            {notificationTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setTypeFilter(type.id)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors',
                  typeFilter === type.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Groups */}
      <div className="max-h-[600px] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
            <p className="text-surface-600 dark:text-surface-400">
              {filter === 'unread'
                ? "You're all caught up!"
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <>
            <NotificationGroup
              title="Today"
              notifications={todayNotifications}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
            <NotificationGroup
              title="Yesterday"
              notifications={yesterdayNotifications}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
            <NotificationGroup
              title="This Week"
              notifications={thisWeekNotifications}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
            <NotificationGroup
              title="Older"
              notifications={olderNotifications}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          </>
        )}
      </div>
    </div>
  );
}
