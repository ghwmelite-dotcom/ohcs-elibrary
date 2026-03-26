import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { useLibraryStore } from '@/stores/libraryStore';

interface DocumentRatingProps {
  documentId: string;
  currentRating: number;
  totalRatings: number;
  userRating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DocumentRating({
  documentId,
  currentRating: initialRating,
  totalRatings: initialTotalRatings,
  userRating: initialUserRating,
  onRate,
  readonly = false,
  size = 'md',
}: DocumentRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localUserRating, setLocalUserRating] = useState<number | undefined>(initialUserRating);
  const [localAvgRating, setLocalAvgRating] = useState(initialRating);
  const [localTotalRatings, setLocalTotalRatings] = useState(initialTotalRatings);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const { rateDocument } = useLibraryStore();

  const displayRating = hoverRating ?? localUserRating ?? 0;
  const currentRating = localAvgRating;
  const totalRatings = localTotalRatings;

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleRate = async (rating: number) => {
    if (readonly || isSubmitting) return;
    setIsSubmitting(true);
    setRatingError(null);
    try {
      await rateDocument(documentId, rating);
      setLocalUserRating(rating);
      // Optimistic update: recalculate average
      const wasRated = localUserRating !== undefined;
      const newTotal = wasRated ? localTotalRatings : localTotalRatings + 1;
      const newAvg = wasRated
        ? (localAvgRating * localTotalRatings - (localUserRating || 0) + rating) / localTotalRatings
        : (localAvgRating * localTotalRatings + rating) / newTotal;
      setLocalAvgRating(Math.round(newAvg * 10) / 10);
      setLocalTotalRatings(newTotal);
      onRate?.(rating);
    } catch {
      setRatingError('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((rating) => (
            <motion.button
              key={rating}
              disabled={readonly || isSubmitting}
              onClick={() => handleRate(rating)}
              onMouseEnter={() => !readonly && setHoverRating(rating)}
              onMouseLeave={() => setHoverRating(null)}
              whileHover={!readonly ? { scale: 1.1 } : undefined}
              whileTap={!readonly ? { scale: 0.95 } : undefined}
              className={cn(
                'transition-colors focus:outline-none',
                !readonly && 'cursor-pointer',
                readonly && 'cursor-default'
              )}
            >
              <Star
                className={cn(
                  sizes[size],
                  'transition-colors',
                  rating <= displayRating
                    ? 'text-secondary-500 fill-secondary-500'
                    : rating <= currentRating
                    ? 'text-secondary-300 fill-secondary-300'
                    : 'text-surface-300 dark:text-surface-600'
                )}
              />
            </motion.button>
          ))}
        </div>

        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
          {currentRating.toFixed(1)}
        </span>

        <span className="text-sm text-surface-500 dark:text-surface-400">
          ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
        </span>
      </div>

      {localUserRating && !readonly && (
        <p className="text-xs text-surface-500 dark:text-surface-400">
          You rated this document {localUserRating} star{localUserRating !== 1 && 's'}
        </p>
      )}
      {ratingError && (
        <p className="text-xs text-error-500">{ratingError}</p>
      )}
    </div>
  );
}

interface RatingBreakdownProps {
  ratings: { [key: number]: number };
  totalRatings: number;
}

export function RatingBreakdown({ ratings, totalRatings }: RatingBreakdownProps) {
  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return (count / totalRatings) * 100;
  };

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((rating) => (
        <div key={rating} className="flex items-center gap-3">
          <div className="flex items-center gap-1 w-12">
            <span className="text-sm text-surface-600 dark:text-surface-400">
              {rating}
            </span>
            <Star className="w-3.5 h-3.5 text-secondary-500 fill-secondary-500" />
          </div>
          <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getPercentage(ratings[rating] || 0)}%` }}
              transition={{ duration: 0.5, delay: (5 - rating) * 0.1 }}
              className="h-full bg-secondary-500 rounded-full"
            />
          </div>
          <span className="text-sm text-surface-500 dark:text-surface-400 w-12 text-right">
            {ratings[rating] || 0}
          </span>
        </div>
      ))}
    </div>
  );
}
