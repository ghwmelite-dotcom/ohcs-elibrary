import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Clock,
  Play,
  Pause,
  ExternalLink,
  Forward,
  Pin,
  Bookmark,
} from 'lucide-react';
import { ChatMessage } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatRelativeTime, formatFileSize } from '@/utils/formatters';
import { QUICK_REACTIONS } from './EmojiPicker';

interface MessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: () => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
  onForward?: () => void;
  onPin?: () => void;
}

// URL detection regex
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const GIF_REGEX = /!\[(.*?)\]\((https?:\/\/[^\s)]+\.gif[^\s)]*)\)/g;

// Message status types
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export function MessageItem({
  message,
  isOwnMessage,
  showAvatar = true,
  showTimestamp = true,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onForward,
  onPin,
}: MessageItemProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const reactionsRef = useRef<HTMLDivElement>(null);

  // Close reactions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
    };

    if (showReactions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReactions]);

  const menuItems = [
    { label: 'Reply', icon: Reply, onClick: onReply },
    { label: 'Forward', icon: Forward, onClick: onForward },
    { label: 'Copy', icon: Copy, onClick: () => navigator.clipboard.writeText(message.content) },
    { label: 'Pin', icon: Pin, onClick: onPin },
    { label: 'Save', icon: Bookmark, onClick: () => {} },
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

  // Determine message status
  const getMessageStatus = (): MessageStatus => {
    if (message.readBy && message.readBy.length > 0) return 'read';
    if (message.id) return 'delivered';
    return 'sent';
  };

  const renderMessageStatus = () => {
    if (!isOwnMessage) return null;

    const status = getMessageStatus();

    switch (status) {
      case 'sending':
        return <Clock className="w-3.5 h-3.5 text-surface-400 animate-pulse" />;
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-surface-400" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-surface-400" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-primary-500" />;
      case 'failed':
        return (
          <span className="text-xs text-error-500 flex items-center gap-1">
            Failed <button className="underline">Retry</button>
          </span>
        );
      default:
        return null;
    }
  };

  // Check if message is a GIF
  const isGifMessage = () => {
    return GIF_REGEX.test(message.content);
  };

  // Extract GIF URL from message
  const extractGifUrl = () => {
    const match = GIF_REGEX.exec(message.content);
    if (match) {
      return { alt: match[1], url: match[2] };
    }
    return null;
  };

  // Render message content with links
  const renderContent = () => {
    // Check for GIF
    if (isGifMessage()) {
      const gif = extractGifUrl();
      if (gif) {
        return (
          <div className="relative rounded-xl overflow-hidden max-w-[300px]">
            <img
              src={gif.url}
              alt={gif.alt}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        );
      }
    }

    // Regular message with link detection
    const parts = message.content.split(URL_REGEX);

    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {parts.map((part, index) => {
          if (URL_REGEX.test(part)) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'underline hover:no-underline inline-flex items-center gap-0.5',
                  isOwnMessage ? 'text-white/90' : 'text-primary-600 dark:text-primary-400'
                )}
              >
                {part.length > 40 ? part.slice(0, 40) + '...' : part}
                <ExternalLink className="w-3 h-3" />
              </a>
            );
          }
          return part;
        })}
      </p>
    );
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((attachment, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'relative rounded-xl overflow-hidden',
              attachment.type === 'image' ? '' : cn(
                'flex items-center gap-3 p-3',
                isOwnMessage
                  ? 'bg-white/10'
                  : 'bg-surface-200 dark:bg-surface-600'
              )
            )}
          >
            {attachment.type === 'image' ? (
              <div className="relative group cursor-pointer" onClick={() => setShowFullImage(true)}>
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="max-w-[250px] rounded-lg"
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-surface-200 dark:bg-surface-700 animate-pulse rounded-lg" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-sm font-medium">Click to expand</span>
                </div>
              </div>
            ) : (
              <>
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isOwnMessage ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-900/30'
                )}>
                  <File className={cn(
                    'w-5 h-5',
                    isOwnMessage ? 'text-white' : 'text-primary-500'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.name}</p>
                  <p className={cn(
                    'text-xs',
                    isOwnMessage ? 'text-white/60' : 'text-surface-500'
                  )}>
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    isOwnMessage ? 'hover:bg-white/20' : 'hover:bg-surface-300 dark:hover:bg-surface-500'
                  )}
                >
                  <Download className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  // Render reactions with animation
  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex flex-wrap gap-1 mt-1.5',
          isOwnMessage && 'justify-end'
        )}
      >
        {message.reactions.map((reaction, index) => {
          const isUserReacted = reaction.users.includes('current-user');
          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onReact?.(reaction.emoji)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                isUserReacted
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/30'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
              )}
            >
              <span className="text-base">{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </motion.button>
          );
        })}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowReactions(true)}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </motion.button>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group flex gap-3 py-1',
        isOwnMessage && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <Avatar
          src={message.sender?.avatar}
          name={message.sender?.displayName || 'User'}
          size="sm"
          className="flex-shrink-0 mt-1"
        />
      )}
      {showAvatar && isOwnMessage && <div className="w-8" />}

      {/* Message Content */}
      <div className={cn('max-w-[70%] min-w-0', isOwnMessage && 'items-end')}>
        {/* Sender Name */}
        {!isOwnMessage && showAvatar && (
          <p className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1 ml-1">
            {message.sender?.displayName || 'User'}
          </p>
        )}

        {/* Reply Reference */}
        <AnimatePresence>
          {message.replyTo && (
            <motion.div
              initial={{ opacity: 0, x: isOwnMessage ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'text-xs px-3 py-2 rounded-xl mb-1 cursor-pointer hover:opacity-80 transition-opacity',
                isOwnMessage
                  ? 'bg-primary-700/50 border-l-2 border-white/30 ml-auto'
                  : 'bg-surface-200/80 dark:bg-surface-600/80 border-l-2 border-surface-400'
              )}
            >
              <p className={cn(
                'font-medium flex items-center gap-1',
                isOwnMessage ? 'text-white/70' : 'text-surface-500'
              )}>
                <Reply className="w-3 h-3" />
                {message.replyTo.sender?.displayName || 'User'}
              </p>
              <p className={cn(
                'truncate mt-0.5',
                isOwnMessage ? 'text-white/60' : 'text-surface-600 dark:text-surface-400'
              )}>
                {message.replyTo.content}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-4 py-2.5 shadow-sm',
            isOwnMessage
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md'
              : 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 rounded-bl-md border border-surface-100 dark:border-surface-600'
          )}
        >
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm focus:outline-none resize-none',
                  isOwnMessage
                    ? 'bg-white/20 text-white placeholder:text-white/60'
                    : 'bg-surface-100 dark:bg-surface-600 text-surface-900 dark:text-surface-50'
                )}
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                    isOwnMessage ? 'hover:bg-white/20 text-white' : 'hover:bg-surface-200 dark:hover:bg-surface-600'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                    isOwnMessage
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : 'bg-primary-500 hover:bg-primary-600 text-white'
                  )}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {renderContent()}
              {message.isEdited && (
                <span className={cn(
                  'text-xs ml-1',
                  isOwnMessage ? 'text-white/50' : 'text-surface-400'
                )}>
                  (edited)
                </span>
              )}
            </>
          )}

          {renderAttachments()}

          {/* Actions (on hover) */}
          <div
            ref={reactionsRef}
            className={cn(
              'absolute top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200',
              isOwnMessage ? '-left-2 -translate-x-full' : '-right-2 translate-x-full'
            )}
          >
            <div className="flex items-center gap-1 bg-white dark:bg-surface-800 rounded-full shadow-lg border border-surface-100 dark:border-surface-700 p-1">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowReactions(!showReactions)}
                className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
              >
                <SmilePlus className="w-4 h-4 text-surface-500" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReply}
                className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
              >
                <Reply className="w-4 h-4 text-surface-500" />
              </motion.button>
              <Dropdown items={menuItems} align={isOwnMessage ? 'left' : 'right'}>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-surface-500" />
                </motion.button>
              </Dropdown>
            </div>

            {/* Quick Reactions Picker */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className={cn(
                    'absolute top-full mt-1 flex items-center gap-0.5 p-1.5 bg-white dark:bg-surface-800 rounded-full shadow-xl border border-surface-100 dark:border-surface-700',
                    isOwnMessage ? 'right-0' : 'left-0'
                  )}
                >
                  {QUICK_REACTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        onReact?.(emoji);
                        setShowReactions(false);
                      }}
                      className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
                    >
                      <span className="text-lg">{emoji}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Reactions */}
        {renderReactions()}

        {/* Timestamp & Read Status */}
        {showTimestamp && (
          <div
            className={cn(
              'flex items-center gap-1.5 mt-1 text-[11px] text-surface-400 px-1',
              isOwnMessage && 'justify-end'
            )}
          >
            <span>{formatRelativeTime(message.createdAt)}</span>
            {renderMessageStatus()}
          </div>
        )}
      </div>

      {/* Full Image Modal */}
      <AnimatePresence>
        {showFullImage && message.attachments?.some(a => a.type === 'image') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullImage(false)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={message.attachments.find(a => a.type === 'image')?.url}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
