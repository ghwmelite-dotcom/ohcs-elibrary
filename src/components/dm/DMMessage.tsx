import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Reply,
  Check,
  CheckCheck,
  Smile,
} from 'lucide-react';
import { EnhancedDirectMessage } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useDMStore } from '@/stores/dmStore';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface DMMessageProps {
  message: EnhancedDirectMessage;
  conversationId: string;
  showAvatar?: boolean;
  isGrouped?: boolean;
  onReply?: () => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function DMMessage({
  message,
  conversationId,
  showAvatar = true,
  isGrouped = false,
  onReply,
}: DMMessageProps) {
  const { user } = useAuthStore();
  const { deleteMessage, addReaction, removeReaction } = useDMStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwn = message.senderId === user?.id;

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      setIsDeleting(true);
      await deleteMessage(message.id, conversationId);
    }
    setShowMenu(false);
  };

  const handleReaction = async (emoji: string) => {
    const existing = message.reactions?.find((r) => r.emoji === emoji && r.hasReacted);
    if (existing) {
      await removeReaction(message.id, emoji, conversationId);
    } else {
      await addReaction(message.id, emoji, conversationId);
    }
    setShowReactions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group flex gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        isGrouped && 'mt-1'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isGrouped && (
        <Link
          to={`/profile/${message.senderId}`}
          className="flex-shrink-0"
        >
          <Avatar
            src={message.sender?.avatar}
            name={message.sender?.displayName || 'User'}
            size="sm"
          />
        </Link>
      )}
      {isGrouped && <div className="w-8" />}

      {/* Message Content */}
      <div className={cn('relative max-w-[70%]', isOwn && 'items-end')}>
        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={cn(
              'text-xs text-surface-500 mb-1 px-3 py-1 rounded-lg',
              'bg-surface-100 dark:bg-surface-800 border-l-2 border-primary-500'
            )}
          >
            <p className="font-medium">{message.replyTo.sender?.displayName}</p>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}

        <div
          className={cn(
            'relative px-4 py-2 rounded-2xl',
            isOwn
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-bl-sm'
          )}
        >
          {/* Sender name (for non-own messages) */}
          {!isOwn && !isGrouped && (
            <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
              {message.sender?.displayName}
            </p>
          )}

          {/* Message text */}
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 grid gap-2 grid-cols-2">
              {message.attachments.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt=""
                  className="rounded-lg max-w-full h-auto"
                />
              ))}
            </div>
          )}

          {/* Time and read status */}
          <div
            className={cn(
              'flex items-center gap-1 mt-1 text-[10px]',
              isOwn ? 'text-primary-200' : 'text-surface-400'
            )}
          >
            <span>{formatRelativeTime(message.createdAt)}</span>
            {message.isEdited && <span>(edited)</span>}
            {isOwn && (
              <span className="ml-1">
                {message.isRead ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={cn(
              'flex flex-wrap gap-1 mt-1',
              isOwn && 'justify-end'
            )}
          >
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                  'bg-surface-100 dark:bg-surface-800',
                  reaction.hasReacted && 'ring-2 ring-primary-500'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="text-surface-600 dark:text-surface-400">
                  {reaction.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Hover Actions */}
        <div
          className={cn(
            'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity',
            'flex items-center gap-1 bg-white dark:bg-surface-800 rounded-lg shadow-lg p-1',
            isOwn ? 'right-full mr-2' : 'left-full ml-2'
          )}
        >
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
            title="React"
          >
            <Smile className="w-4 h-4 text-surface-500" />
          </button>
          <button
            onClick={onReply}
            className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
            title="Reply"
          >
            <Reply className="w-4 h-4 text-surface-500" />
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                <MoreHorizontal className="w-4 h-4 text-surface-500" />
              </button>
            </>
          )}
        </div>

        {/* Reaction Picker */}
        {showReactions && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowReactions(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'absolute z-50 flex gap-1 p-2 bg-white dark:bg-surface-800 rounded-full shadow-lg',
                isOwn ? 'right-0' : 'left-0',
                'top-full mt-1'
              )}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          </>
        )}

        {/* Message Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'absolute z-50 w-32 bg-white dark:bg-surface-800 rounded-lg shadow-lg py-1',
                isOwn ? 'right-0' : 'left-0',
                'top-full mt-1'
              )}
            >
              <button
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
