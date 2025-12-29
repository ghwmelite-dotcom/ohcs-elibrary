/**
 * KwameChatMessage Component
 * Message bubble for Kwame chat with citation support
 */

import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, User, Clock } from 'lucide-react';
import { KwameAvatar } from './KwameAvatar';
import { CitationsList } from './KwameCitation';
import { cn } from '@/utils/cn';
import type { KwameMessage } from '@/types';

interface KwameChatMessageProps {
  message: KwameMessage;
  onRate?: (messageId: string, helpful: boolean) => void;
  isLatest?: boolean;
}

export function KwameChatMessage({ message, onRate, isLatest }: KwameChatMessageProps) {
  const isUser = message.role === 'user';

  // Format processing time
  const formatTime = (ms?: number) => {
    if (!ms) return null;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
            <User className="w-5 h-5 text-surface-500 dark:text-surface-400" />
          </div>
        ) : (
          <KwameAvatar size="md" />
        )}
      </div>

      {/* Message content */}
      <div className={cn('flex-1 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary-600 text-white rounded-tr-sm'
              : 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white rounded-tl-sm border border-surface-200 dark:border-surface-700'
          )}
        >
          {/* Message text with simple markdown-like parsing */}
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={i} className="font-semibold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </div>

          {/* Processing time for assistant messages */}
          {!isUser && message.processingTimeMs && (
            <div className="mt-2 flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500">
              <Clock className="w-3 h-3" />
              <span>{formatTime(message.processingTimeMs)}</span>
              {message.chunksUsed !== undefined && message.chunksUsed > 0 && (
                <span className="ml-2">
                  {message.chunksUsed} source{message.chunksUsed !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Citations for assistant messages */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <CitationsList citations={message.citations} />
        )}

        {/* Feedback buttons for assistant messages */}
        {!isUser && isLatest && onRate && message.helpful === undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 flex items-center gap-2"
          >
            <span className="text-xs text-surface-500 dark:text-surface-400">
              Was this helpful?
            </span>
            <button
              onClick={() => onRate(message.id, true)}
              className={cn(
                'p-1.5 rounded-full transition-colors',
                'hover:bg-green-100 dark:hover:bg-green-900/30',
                'text-surface-400 hover:text-green-600 dark:hover:text-green-400'
              )}
              title="Yes, helpful"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRate(message.id, false)}
              className={cn(
                'p-1.5 rounded-full transition-colors',
                'hover:bg-red-100 dark:hover:bg-red-900/30',
                'text-surface-400 hover:text-red-600 dark:hover:text-red-400'
              )}
              title="No, not helpful"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Show feedback status if already rated */}
        {!isUser && message.helpful !== undefined && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {message.helpful ? (
              <>
                <ThumbsUp className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Helpful</span>
              </>
            ) : (
              <>
                <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-600 dark:text-red-400">Not helpful</span>
              </>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={cn(
          'text-xs text-surface-400 dark:text-surface-500 mt-1',
          isUser ? 'text-right' : 'text-left'
        )}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

// Typing indicator component
export function KwameTypingIndicator() {
  return (
    <div className="flex gap-3">
      <KwameAvatar size="md" state="thinking" />
      <div className="bg-white dark:bg-surface-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-surface-500 dark:text-surface-400">Kwame is thinking</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary-500"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
