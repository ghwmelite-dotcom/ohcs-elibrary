import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, User } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DrSenaAvatar } from './DrSenaAvatar';
import type { CounselorMessage } from '@/types';

interface ChatMessageProps {
  message: CounselorMessage;
  onRate?: (messageId: string, helpful: boolean) => void;
  isLatestAI?: boolean;
}

export function ChatMessage({ message, onRate, isLatestAI }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isTemp = message.id.startsWith('temp-');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
            <User className="w-5 h-5 text-surface-500 dark:text-surface-400" />
          </div>
        ) : (
          <DrSenaAvatar size="md" mood="listening" isThinking={isTemp} />
        )}
      </div>

      {/* Message content */}
      <div className={cn(
        'flex-1 max-w-[85%] sm:max-w-[80%]',
        isUser ? 'flex flex-col items-end' : ''
      )}>
        <div className={cn(
          'rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3',
          isUser
            ? 'bg-teal-600 text-white rounded-tr-sm'
            : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-tl-sm',
          isTemp && 'opacity-70'
        )}>
          {/* Message text */}
          <div className="whitespace-pre-wrap break-words text-[15px] sm:text-base leading-relaxed">
            {message.content.split('\n').map((paragraph, i) => {
              // Handle markdown-like formatting
              const parts = paragraph.split(/(\*\*.*?\*\*)/g);
              return (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                  {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </p>
              );
            })}
          </div>
        </div>

        {/* Timestamp and feedback */}
        <div className={cn(
          'flex items-center gap-2 mt-1 text-xs text-surface-500 dark:text-surface-400',
          isUser ? 'flex-row-reverse' : ''
        )}>
          <span>
            {message.createdAt
              ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
              : 'Just now'}
          </span>

          {/* Feedback buttons for AI messages */}
          {!isUser && onRate && isLatestAI && message.helpful === undefined && (
            <div className="flex items-center gap-0.5 sm:gap-1 ml-1 sm:ml-2">
              <span className="text-surface-400 dark:text-surface-500 mr-0.5 sm:mr-1 text-[11px] sm:text-xs">Helpful?</span>
              <motion.button
                onClick={() => onRate(message.id, true)}
                className="p-2 sm:p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-surface-400 dark:text-surface-500 hover:text-green-600 active:bg-green-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ThumbsUp className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => onRate(message.id, false)}
                className="p-2 sm:p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-400 dark:text-surface-500 hover:text-red-600 active:bg-red-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ThumbsDown className="w-4 h-4" />
              </motion.button>
            </div>
          )}

          {/* Feedback indicator if already rated */}
          {!isUser && message.helpful !== undefined && message.helpful !== null && (
            <span className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
              message.helpful
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'
            )}>
              {message.helpful ? (
                <>
                  <ThumbsUp className="w-3 h-3" />
                  <span>Helpful</span>
                </>
              ) : (
                <>
                  <ThumbsDown className="w-3 h-3" />
                  <span>Not helpful</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
