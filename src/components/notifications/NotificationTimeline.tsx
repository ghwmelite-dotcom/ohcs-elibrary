import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bell,
  MessageSquare,
  FileText,
  Users,
  Award,
  TrendingUp,
  Zap,
  Heart,
  UserPlus,
  Shield,
  AlertCircle,
  AtSign,
  Target,
  Flame,
  Sparkles,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Check,
  Trash2,
  Archive
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import { Notification } from '@/stores/notificationStore';
import { useState } from 'react';

interface NotificationTimelineProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

const iconMap: Record<string, typeof Bell> = {
  message: MessageSquare,
  document: FileText,
  forum_reply: MessageSquare,
  forum_mention: AtSign,
  group_invite: UserPlus,
  group_post: Users,
  badge_earned: Award,
  level_up: TrendingUp,
  xp_earned: Zap,
  system: Bell,
  announcement: AlertCircle,
  like: Heart,
  follow: UserPlus,
  security: Shield,
  challenge_complete: Target,
  streak: Flame,
  welcome: Sparkles,
  document_approved: CheckCircle,
  document_rejected: XCircle
};

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  message: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    icon: 'bg-primary-500',
    border: 'border-primary-200 dark:border-primary-800'
  },
  document: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-500',
    border: 'border-blue-200 dark:border-blue-800'
  },
  forum_reply: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'bg-purple-500',
    border: 'border-purple-200 dark:border-purple-800'
  },
  forum_mention: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'bg-purple-500',
    border: 'border-purple-200 dark:border-purple-800'
  },
  group_invite: {
    bg: 'bg-secondary-50 dark:bg-secondary-900/20',
    icon: 'bg-secondary-500',
    border: 'border-secondary-200 dark:border-secondary-800'
  },
  group_post: {
    bg: 'bg-secondary-50 dark:bg-secondary-900/20',
    icon: 'bg-secondary-500',
    border: 'border-secondary-200 dark:border-secondary-800'
  },
  badge_earned: {
    bg: 'bg-accent-50 dark:bg-accent-900/20',
    icon: 'bg-gradient-to-br from-accent-400 to-accent-600',
    border: 'border-accent-200 dark:border-accent-800'
  },
  level_up: {
    bg: 'bg-accent-50 dark:bg-accent-900/20',
    icon: 'bg-gradient-to-br from-accent-400 to-secondary-500',
    border: 'border-accent-200 dark:border-accent-800'
  },
  xp_earned: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    icon: 'bg-success-500',
    border: 'border-success-200 dark:border-success-800'
  },
  like: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    icon: 'bg-pink-500',
    border: 'border-pink-200 dark:border-pink-800'
  },
  follow: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    icon: 'bg-primary-500',
    border: 'border-primary-200 dark:border-primary-800'
  },
  announcement: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    icon: 'bg-warning-500',
    border: 'border-warning-200 dark:border-warning-800'
  },
  security: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    icon: 'bg-error-500',
    border: 'border-error-200 dark:border-error-800'
  },
  challenge_complete: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    icon: 'bg-gradient-to-br from-success-400 to-success-600',
    border: 'border-success-200 dark:border-success-800'
  },
  streak: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'bg-gradient-to-br from-orange-400 to-red-500',
    border: 'border-orange-200 dark:border-orange-800'
  },
  welcome: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    icon: 'bg-gradient-to-br from-primary-400 to-secondary-500',
    border: 'border-primary-200 dark:border-primary-800'
  },
  document_approved: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    icon: 'bg-success-500',
    border: 'border-success-200 dark:border-success-800'
  },
  document_rejected: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    icon: 'bg-error-500',
    border: 'border-error-200 dark:border-error-800'
  },
  system: {
    bg: 'bg-surface-50 dark:bg-surface-800',
    icon: 'bg-surface-500',
    border: 'border-surface-200 dark:border-surface-700'
  }
};

const priorityStyles: Record<string, string> = {
  urgent: 'ring-2 ring-error-500 ring-offset-2 dark:ring-offset-surface-900',
  high: 'border-l-4 border-l-warning-500',
  normal: '',
  low: 'opacity-90'
};

function NotificationTimelineItem({
  notification,
  onMarkAsRead,
  onDelete,
  onArchive,
  isLast
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  isLast: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = iconMap[notification.type] || Bell;
  const colors = colorMap[notification.type] || colorMap.system;

  const content = (
    <div className="flex gap-4">
      {/* Timeline Line */}
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white z-10',
            colors.icon
          )}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-surface-200 dark:bg-surface-700 mt-2" />
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'flex-1 pb-6 group',
          isLast && 'pb-0'
        )}
      >
        <div
          className={cn(
            'relative p-4 rounded-xl border transition-all',
            colors.bg,
            colors.border,
            !notification.isRead && 'shadow-md',
            priorityStyles[notification.priority]
          )}
        >
          {/* Unread Indicator */}
          {!notification.isRead && (
            <div className="absolute -left-1 top-4 w-2 h-2 bg-primary-500 rounded-full" />
          )}

          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <h4 className={cn(
                'font-medium',
                notification.isRead
                  ? 'text-surface-700 dark:text-surface-300'
                  : 'text-surface-900 dark:text-white'
              )}>
                {notification.title}
              </h4>
              <p className="text-xs text-surface-500">
                {formatRelativeTime(notification.createdAt)}
                {notification.priority === 'urgent' && (
                  <span className="ml-2 px-1.5 py-0.5 bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400 rounded text-xs font-medium">
                    Urgent
                  </span>
                )}
                {notification.priority === 'high' && (
                  <span className="ml-2 px-1.5 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 rounded text-xs font-medium">
                    Important
                  </span>
                )}
              </p>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/50 dark:hover:bg-surface-700 transition-all"
              >
                <MoreHorizontal className="w-4 h-4 text-surface-500" />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-full mt-1 bg-white dark:bg-surface-800 rounded-lg shadow-elevation-3 py-1 z-20 min-w-[140px]"
                >
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                    >
                      <Check className="w-4 h-4" />
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onArchive(notification.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(notification.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-surface-50 dark:hover:bg-surface-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Message */}
          <p className={cn(
            'text-sm',
            notification.isRead
              ? 'text-surface-600 dark:text-surface-400'
              : 'text-surface-700 dark:text-surface-300'
          )}>
            {notification.actorName && (
              <span className="font-medium">{notification.actorName} </span>
            )}
            {notification.message}
          </p>

          {/* Actor Avatar */}
          {notification.actorAvatar && (
            <img
              src={notification.actorAvatar}
              alt={notification.actorName}
              className="w-6 h-6 rounded-full mt-2"
            />
          )}
        </div>
      </motion.div>
    </div>
  );

  if (notification.link) {
    return (
      <Link
        to={notification.link}
        onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
        className="block hover:opacity-95 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export function NotificationTimeline({
  notifications,
  onMarkAsRead,
  onDelete,
  onArchive
}: NotificationTimelineProps) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Bell className="w-10 h-10 text-surface-400" />
        </motion.div>
        <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-1">
          No notifications
        </h3>
        <p className="text-surface-500">
          You're all caught up! Check back later for updates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {notifications.map((notification, index) => (
        <NotificationTimelineItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          onArchive={onArchive}
          isLast={index === notifications.length - 1}
        />
      ))}
    </div>
  );
}
