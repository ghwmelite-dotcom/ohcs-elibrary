import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DMConversation } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/shared/Avatar';
import { OnlineIndicator } from '@/components/presence/OnlineIndicator';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface ConversationItemProps {
  conversation: DMConversation;
  isActive?: boolean;
  index?: number;
  onClick?: () => void;
}

export function ConversationItem({
  conversation,
  isActive = false,
  index = 0,
  onClick,
}: ConversationItemProps) {
  const { user } = useAuthStore();

  // Get the other participant
  const otherUser =
    conversation.participant1Id === user?.id
      ? conversation.participant2
      : conversation.participant1;

  const hasUnread = (conversation.unreadCount || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link
        to={`/messages/${otherUser?.id}`}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl transition-colors',
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/20'
            : 'hover:bg-surface-50 dark:hover:bg-surface-800',
          hasUnread && 'bg-primary-50/50 dark:bg-primary-900/10'
        )}
      >
        {/* Avatar with online indicator */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={otherUser?.avatar}
            name={otherUser?.displayName || 'User'}
            size="md"
          />
          <OnlineIndicator userId={otherUser?.id || ''} className="absolute -bottom-0.5 -right-0.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                'font-medium truncate',
                hasUnread
                  ? 'text-surface-900 dark:text-surface-100'
                  : 'text-surface-700 dark:text-surface-300'
              )}
            >
              {otherUser?.displayName || 'User'}
            </p>
            {conversation.lastMessageAt && (
              <span className="text-xs text-surface-400 flex-shrink-0">
                {formatRelativeTime(conversation.lastMessageAt)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p
              className={cn(
                'text-sm truncate',
                hasUnread
                  ? 'text-surface-700 dark:text-surface-300 font-medium'
                  : 'text-surface-500'
              )}
            >
              {conversation.lastMessage?.content || 'Start a conversation'}
            </p>

            {hasUnread && (
              <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium bg-primary-600 text-white rounded-full">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
