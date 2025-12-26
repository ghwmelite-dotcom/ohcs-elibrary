import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  MessageSquare,
  FileText,
  Users,
  Award,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Heart,
  AtSign,
  UserPlus,
  Shield,
  Zap,
  X,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import { useState } from 'react';

export interface Notification {
  id: string;
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
    | 'security';
  title: string;
  message: string;
  link?: string;
  avatar?: string;
  actorName?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getIcon = () => {
    const iconProps = { className: 'w-5 h-5' };
    switch (notification.type) {
      case 'message':
        return <MessageSquare {...iconProps} />;
      case 'document':
        return <FileText {...iconProps} />;
      case 'forum_reply':
      case 'forum_mention':
        return <AtSign {...iconProps} />;
      case 'group_invite':
        return <UserPlus {...iconProps} />;
      case 'group_post':
        return <Users {...iconProps} />;
      case 'badge_earned':
        return <Award {...iconProps} />;
      case 'level_up':
        return <TrendingUp {...iconProps} />;
      case 'xp_earned':
        return <Zap {...iconProps} />;
      case 'system':
        return <Bell {...iconProps} />;
      case 'announcement':
        return <AlertCircle {...iconProps} />;
      case 'like':
        return <Heart {...iconProps} />;
      case 'follow':
        return <UserPlus {...iconProps} />;
      case 'security':
        return <Shield {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getIconBgColor = () => {
    switch (notification.type) {
      case 'message':
        return 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400';
      case 'document':
        return 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400';
      case 'forum_reply':
      case 'forum_mention':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'group_invite':
      case 'group_post':
        return 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400';
      case 'badge_earned':
      case 'level_up':
        return 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400';
      case 'xp_earned':
        return 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400';
      case 'announcement':
        return 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400';
      case 'security':
        return 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400';
      default:
        return 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400';
    }
  };

  const content = (
    <div className="flex items-start gap-3 flex-1 min-w-0">
      {/* Icon or Avatar */}
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', getIconBgColor())}>
        {notification.avatar ? (
          <img
            src={notification.avatar}
            alt={notification.actorName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          getIcon()
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm',
          notification.isRead
            ? 'text-surface-600 dark:text-surface-400'
            : 'text-surface-900 dark:text-surface-50 font-medium'
        )}>
          {notification.actorName && (
            <span className="font-semibold">{notification.actorName} </span>
          )}
          {notification.message}
        </p>
        <p className="text-xs text-surface-500 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0" />
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'relative group p-4 transition-colors',
        notification.isRead
          ? 'bg-white dark:bg-surface-800'
          : 'bg-primary-50/50 dark:bg-primary-900/10',
        'hover:bg-surface-50 dark:hover:bg-surface-700/50'
      )}
    >
      {notification.link ? (
        <Link
          to={notification.link}
          onClick={() => !notification.isRead && onMarkAsRead?.(notification.id)}
          className="block"
        >
          {content}
        </Link>
      ) : (
        <div>{content}</div>
      )}

      {/* Action Menu */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4 text-surface-500" />
        </button>

        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-full mt-1 bg-white dark:bg-surface-800 rounded-lg shadow-elevation-3 py-1 z-10 min-w-[140px]"
          >
            {!notification.isRead && (
              <button
                onClick={() => {
                  onMarkAsRead?.(notification.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as read
              </button>
            )}
            <button
              onClick={() => {
                onDelete?.(notification.id);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-surface-50 dark:hover:bg-surface-700"
            >
              <X className="w-4 h-4" />
              Delete
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

interface NotificationGroupProps {
  title: string;
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationGroup({
  title,
  notifications,
  onMarkAsRead,
  onDelete,
}: NotificationGroupProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wide px-4 mb-2">
        {title}
      </h3>
      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
