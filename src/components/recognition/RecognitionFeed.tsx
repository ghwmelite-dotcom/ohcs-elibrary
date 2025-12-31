import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Award, RefreshCw } from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import { RecognitionCard } from './RecognitionCard';
import { useRecognitionStore } from '@/stores/recognitionStore';
import { useAuthStore } from '@/stores/authStore';
import type { RecognitionFeedFilter } from '@/types/recognition';

interface RecognitionFeedProps {
  filter?: RecognitionFeedFilter;
  showEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function RecognitionFeed({
  filter,
  showEmpty = true,
  emptyTitle = 'No recognitions yet',
  emptyDescription = 'Be the first to recognize a colleague!',
}: RecognitionFeedProps) {
  const {
    recognitions,
    isLoading,
    isFetchingMore,
    pagination,
    fetchRecognitions,
    loadMoreRecognitions,
    endorseRecognition,
  } = useRecognitionStore();

  const { user } = useAuthStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Check if user can endorse (manager/director roles)
  const canEndorse = user?.role && ['admin', 'director', 'super_admin', 'moderator'].includes(user.role);

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchRecognitions(filter, true);
  }, [filter?.categoryId, filter?.receiverId, filter?.giverId, filter?.period]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !isFetchingMore && !isLoading) {
          loadMoreRecognitions();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [pagination.hasMore, isFetchingMore, isLoading]);

  // Handle endorsement
  const handleEndorse = useCallback(async (recognitionId: string) => {
    const comment = window.prompt('Add an optional endorsement comment:');
    await endorseRecognition(recognitionId, comment || undefined);
  }, [endorseRecognition]);

  if (isLoading && recognitions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (recognitions.length === 0 && showEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-1">
          {emptyTitle}
        </h3>
        <p className="text-surface-500 dark:text-surface-400">{emptyDescription}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {recognitions.map((recognition, index) => (
        <motion.div
          key={recognition.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <RecognitionCard
            recognition={recognition}
            canEndorse={canEndorse && recognition.receiver.id !== user?.id && recognition.giver.id !== user?.id}
            onEndorse={handleEndorse}
          />
        </motion.div>
      ))}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {isFetchingMore && (
          <div className="flex items-center justify-center">
            <Spinner size="md" />
          </div>
        )}
        {!pagination.hasMore && recognitions.length > 0 && (
          <p className="text-center text-sm text-surface-500 dark:text-surface-400">
            You've seen all recognitions
          </p>
        )}
      </div>
    </div>
  );
}

// Compact feed for sidebars/widgets
export function RecognitionFeedCompact({ limit = 5 }: { limit?: number }) {
  const { recognitions, isLoading, fetchRecognitions } = useRecognitionStore();

  useEffect(() => {
    fetchRecognitions({ limit }, true);
  }, [limit]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Spinner size="sm" />
      </div>
    );
  }

  if (recognitions.length === 0) {
    return (
      <p className="text-center text-sm text-surface-500 dark:text-surface-400 py-4">
        No recent recognitions
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {recognitions.slice(0, limit).map((recognition) => (
        <RecognitionCard key={recognition.id} recognition={recognition} compact showActions={false} />
      ))}
    </div>
  );
}
