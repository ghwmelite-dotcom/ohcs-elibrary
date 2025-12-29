import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, RefreshCw } from 'lucide-react';
import { useSocialStore } from '@/stores/socialStore';
import { UserCard } from './UserCard';
import { cn } from '@/utils/cn';

interface SuggestedUsersProps {
  limit?: number;
  title?: string;
  showRefresh?: boolean;
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

export function SuggestedUsers({
  limit = 5,
  title = 'People You May Know',
  showRefresh = true,
  showHeader = true,
  compact = false,
  className,
}: SuggestedUsersProps) {
  const {
    suggestedUsers,
    suggestionsLoading,
    fetchSuggestions,
    hideSuggestion,
  } = useSocialStore();

  useEffect(() => {
    fetchSuggestions(limit);
  }, [limit, fetchSuggestions]);

  const handleDismiss = async (userId: string) => {
    await hideSuggestion(userId);
  };

  const handleRefresh = () => {
    fetchSuggestions(limit);
  };

  if (suggestionsLoading && suggestedUsers.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (suggestedUsers.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            {title}
          </h3>

          {showRefresh && (
            <button
              onClick={handleRefresh}
              disabled={suggestionsLoading}
              className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <RefreshCw className={cn('w-4 h-4', suggestionsLoading && 'animate-spin')} />
            </button>
          )}
        </div>
      )}

      <motion.div layout className={cn('space-y-3', compact && 'space-y-2')}>
        {suggestedUsers.map((suggestion, index) => (
          <UserCard
            key={suggestion.suggestedUserId}
            user={suggestion}
            index={index}
            showFollow
            showConnect={!compact}
            showMutual={!compact}
            showReason={!compact}
            compact={compact}
            onDismiss={() => handleDismiss(suggestion.suggestedUserId)}
          />
        ))}
      </motion.div>
    </div>
  );
}
