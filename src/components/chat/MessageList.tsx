import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
import { ChatMessage } from '@/types';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/formatters';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  typingUsers?: { id: string; name: string }[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  typingUsers = [],
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  // Check if we should show avatar (first message or different sender)
  const shouldShowAvatar = (message: ChatMessage, index: number, dayMessages: ChatMessage[]) => {
    if (index === 0) return true;
    const prevMessage = dayMessages[index - 1];
    return prevMessage.sender?.id !== message.sender?.id;
  };

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Handle scroll
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    setAutoScroll(isNearBottom);
    setShowScrollButton(!isNearBottom);

    // Load more when scrolled to top
    if (scrollTop < 50 && hasMore && !isLoading) {
      onLoadMore?.();
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setAutoScroll(true);
    }
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return formatDate(dateString, 'EEEE, MMMM d');
  };

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-4 space-y-6"
      >
        {/* Loading indicator for older messages */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Load more button */}
        {hasMore && !isLoading && (
          <div className="flex justify-center">
            <button
              onClick={onLoadMore}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {/* Messages grouped by date */}
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center gap-4 py-4">
              <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
              <span className="text-xs text-surface-500 font-medium px-2">
                {formatDateHeader(date)}
              </span>
              <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {dayMessages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender?.id === currentUserId}
                  showAvatar={shouldShowAvatar(message, index, dayMessages)}
                  showTimestamp={
                    index === dayMessages.length - 1 ||
                    dayMessages[index + 1]?.sender?.id !== message.sender?.id
                  }
                  onReply={() => onReply?.(message)}
                  onEdit={(content) => onEdit?.(message.id, content)}
                  onDelete={() => onDelete?.(message.id)}
                  onReact={(emoji) => onReact?.(message.id, emoji)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <TypingIndicator users={typingUsers} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-surface-600 dark:text-surface-400">
              No messages yet
            </p>
            <p className="text-sm text-surface-500 mt-1">
              Start the conversation!
            </p>
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
