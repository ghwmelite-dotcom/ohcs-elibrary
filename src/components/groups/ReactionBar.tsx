import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Smile } from 'lucide-react';
import { QUICK_REACTIONS } from '@/components/chat/EmojiPicker';
import { cn } from '@/utils/cn';

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface ReactionBarProps {
  reactions: Reaction[];
  onReact: (emoji: string) => void;
  compact?: boolean;
  className?: string;
}

export function ReactionBar({
  reactions,
  onReact,
  compact = false,
  className,
}: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleReaction = (emoji: string) => {
    onReact(emoji);
    setShowPicker(false);
  };

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <motion.button
          key={reaction.emoji}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleReaction(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors',
            reaction.hasReacted
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-700'
              : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
          )}
          title={`${reaction.count} ${reaction.count === 1 ? 'reaction' : 'reactions'}`}
        >
          <span className="text-base">{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </motion.button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            'inline-flex items-center justify-center rounded-full transition-colors',
            compact
              ? 'w-7 h-7 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
              : 'w-8 h-8 bg-surface-100 dark:bg-surface-700 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-600'
          )}
          title="Add reaction"
        >
          {compact ? (
            <Smile className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </motion.button>

        <AnimatePresence>
          {showPicker && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowPicker(false)}
              />

              {/* Quick Reaction Picker */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-full left-0 mb-2 z-50 bg-white dark:bg-surface-800 rounded-full shadow-xl border border-surface-200 dark:border-surface-700 px-2 py-1.5 flex items-center gap-1"
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReaction(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-xl hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Quick reaction buttons for inline use
interface QuickReactionsProps {
  onReact: (emoji: string) => void;
  className?: string;
}

export function QuickReactions({ onReact, className }: QuickReactionsProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {QUICK_REACTIONS.slice(0, 6).map((emoji) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onReact(emoji)}
          className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          title={`React with ${emoji}`}
        >
          <span className="text-lg">{emoji}</span>
        </motion.button>
      ))}
    </div>
  );
}
