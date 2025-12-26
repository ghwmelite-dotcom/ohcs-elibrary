import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MoreVertical,
  Reply,
  Edit2,
  Trash2,
  Copy,
  SmilePlus,
  Check,
  CheckCheck,
  File,
  Image as ImageIcon,
  Download,
} from 'lucide-react';
import { ChatMessage } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatRelativeTime, formatFileSize } from '@/utils/formatters';

interface MessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: () => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageItem({
  message,
  isOwnMessage,
  showAvatar = true,
  showTimestamp = true,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: MessageItemProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const menuItems = [
    { label: 'Reply', icon: Reply, onClick: onReply },
    { label: 'Copy', icon: Copy, onClick: () => navigator.clipboard.writeText(message.content) },
    ...(isOwnMessage
      ? [
          {
            label: 'Edit',
            icon: Edit2,
            onClick: () => {
              setIsEditing(true);
              setEditContent(message.content);
            },
          },
          { label: 'Delete', icon: Trash2, onClick: onDelete, className: 'text-error-600' },
        ]
      : []),
  ];

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(editContent);
    }
    setIsEditing(false);
  };

  const renderReadStatus = () => {
    if (!isOwnMessage) return null;
    return message.readBy && message.readBy.length > 0 ? (
      <CheckCheck className="w-4 h-4 text-primary-500" />
    ) : (
      <Check className="w-4 h-4 text-surface-400" />
    );
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((attachment, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              isOwnMessage
                ? 'bg-primary-600/20'
                : 'bg-surface-200 dark:bg-surface-600'
            )}
          >
            {attachment.type === 'image' ? (
              <ImageIcon className="w-8 h-8 text-surface-500" />
            ) : (
              <File className="w-8 h-8 text-surface-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.name}</p>
              <p className="text-xs text-surface-500">
                {formatFileSize(attachment.size)}
              </p>
            </div>
            <button className="p-2 hover:bg-black/10 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group flex gap-3',
        isOwnMessage && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <Avatar
          src={message.sender?.avatar}
          name={message.sender?.displayName || 'User'}
          size="sm"
          className="flex-shrink-0"
        />
      )}
      {showAvatar && isOwnMessage && <div className="w-8" />}

      {/* Message Content */}
      <div className={cn('max-w-[70%] min-w-0', isOwnMessage && 'items-end')}>
        {/* Sender Name */}
        {!isOwnMessage && showAvatar && (
          <p className="text-xs font-medium text-surface-600 dark:text-surface-400 mb-1 ml-1">
            {message.sender?.displayName || 'User'}
          </p>
        )}

        {/* Reply Reference */}
        {message.replyTo && (
          <div
            className={cn(
              'text-xs px-3 py-1.5 rounded-t-lg border-l-2 mb-0.5',
              isOwnMessage
                ? 'bg-primary-600/10 border-primary-400 text-right'
                : 'bg-surface-100 dark:bg-surface-700 border-surface-400'
            )}
          >
            <p className="text-surface-500 truncate">
              Replying to {message.replyTo.sender?.displayName || 'User'}
            </p>
            <p className="text-surface-600 dark:text-surface-400 truncate">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-4 py-2.5',
            isOwnMessage
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-surface-50 rounded-bl-sm'
          )}
        >
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-2 py-1 bg-white/20 rounded text-inherit placeholder:text-white/60 focus:outline-none resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 text-xs rounded hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2 py-1 text-xs bg-white/20 rounded hover:bg-white/30"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
              {message.isEdited && (
                <span className="text-xs opacity-60 ml-1">(edited)</span>
              )}
            </>
          )}

          {renderAttachments()}

          {/* Actions (on hover) */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1',
              isOwnMessage ? '-left-20' : '-right-20'
            )}
          >
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1.5 bg-white dark:bg-surface-800 shadow-sm rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <SmilePlus className="w-4 h-4 text-surface-500" />
            </button>
            <Dropdown items={menuItems} align={isOwnMessage ? 'left' : 'right'}>
              <button className="p-1.5 bg-white dark:bg-surface-800 shadow-sm rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                <MoreVertical className="w-4 h-4 text-surface-500" />
              </button>
            </Dropdown>
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={cn(
              'flex flex-wrap gap-1 mt-1',
              isOwnMessage && 'justify-end'
            )}
          >
            {message.reactions.map((reaction, index) => (
              <button
                key={index}
                onClick={() => onReact?.(reaction.emoji)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                  reaction.users.includes('current-user')
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                )}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick Reactions Picker */}
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex items-center gap-1 mt-1 p-1 bg-white dark:bg-surface-800 rounded-full shadow-lg',
              isOwnMessage && 'justify-end'
            )}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact?.(emoji);
                  setShowReactions(false);
                }}
                className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
              >
                <span className="text-lg">{emoji}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Timestamp & Read Status */}
        {showTimestamp && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1 text-xs text-surface-400',
              isOwnMessage && 'justify-end'
            )}
          >
            <span>{formatRelativeTime(message.createdAt)}</span>
            {renderReadStatus()}
          </div>
        )}
      </div>
    </motion.div>
  );
}
