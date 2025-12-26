import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Settings, ExternalLink } from 'lucide-react';
import { NotificationItem, Notification } from './NotificationItem';
import { cn } from '@/utils/cn';

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  maxPreviewItems?: number;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  maxPreviewItems = 5,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const previewNotifications = notifications.slice(0, maxPreviewItems);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
      >
        <Bell className="w-5 h-5 text-surface-600 dark:text-surface-400" />

        {/* Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-surface-800 rounded-xl shadow-elevation-3 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <Link
                  to="/settings/notifications"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded transition-colors"
                >
                  <Settings className="w-4 h-4 text-surface-500" />
                </Link>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-surface-200 dark:divide-surface-700">
              {previewNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
                  <p className="text-sm text-surface-500">No notifications</p>
                </div>
              ) : (
                previewNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.isRead) {
                        onMarkAsRead?.(notification.id);
                      }
                      if (notification.link) {
                        setIsOpen(false);
                      }
                    }}
                  >
                    <NotificationItem
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > maxPreviewItems && (
              <div className="p-3 border-t border-surface-200 dark:border-surface-700">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  View all notifications
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NotificationDotProps {
  hasUnread: boolean;
}

export function NotificationDot({ hasUnread }: NotificationDotProps) {
  if (!hasUnread) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute top-0 right-0 w-2 h-2 bg-accent-500 rounded-full"
    />
  );
}
