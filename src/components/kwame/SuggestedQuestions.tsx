/**
 * SuggestedQuestions Component
 * Displays clickable question suggestions for new chats
 */

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SuggestedQuestionsProps {
  suggestions: string[];
  onSelect: (question: string) => void;
  isLoading?: boolean;
}

export function SuggestedQuestions({ suggestions, onSelect, isLoading }: SuggestedQuestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Suggested questions</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {suggestions.map((question, index) => (
          <motion.button
            key={question}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(question)}
            disabled={isLoading}
            className={cn(
              'group flex items-center gap-3 p-3 rounded-xl text-left transition-all',
              'bg-white dark:bg-surface-800',
              'border border-surface-200 dark:border-surface-700',
              'hover:border-primary-300 dark:hover:border-primary-700',
              'hover:shadow-md hover:shadow-primary-500/10',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="flex-1">
              <p className="text-sm text-surface-700 dark:text-surface-200 line-clamp-2">
                {question}
              </p>
            </div>
            <ArrowRight className={cn(
              'w-4 h-4 text-surface-400 flex-shrink-0 transition-transform',
              'group-hover:translate-x-1 group-hover:text-primary-500'
            )} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Compact version for the widget
export function SuggestedQuestionsCompact({
  suggestions,
  onSelect,
  isLoading,
}: SuggestedQuestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-surface-500 dark:text-surface-400 px-1">
        Quick questions:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.slice(0, 3).map((question) => (
          <button
            key={question}
            onClick={() => onSelect(question)}
            disabled={isLoading}
            className={cn(
              'px-2.5 py-1.5 rounded-full text-xs transition-colors',
              'bg-surface-100 dark:bg-surface-700',
              'text-surface-600 dark:text-surface-300',
              'hover:bg-primary-100 dark:hover:bg-primary-900/30',
              'hover:text-primary-700 dark:hover:text-primary-300',
              'disabled:opacity-50'
            )}
          >
            {question.length > 40 ? question.slice(0, 40) + '...' : question}
          </button>
        ))}
      </div>
    </div>
  );
}
