import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  threshold?: number;
  maxPull?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
  threshold = 80,
  maxPull = 120,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);

  const rotation = useTransform(pullDistance, [0, threshold], [0, 360]);
  const scale = useTransform(pullDistance, [0, threshold / 2, threshold], [0.5, 0.8, 1]);
  const opacity = useTransform(pullDistance, [0, threshold / 2], [0, 1]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only enable pull-to-refresh when at the top
    if (container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Resistance effect - harder to pull as you go further
      const resistance = 0.5;
      const newPull = Math.min(diff * resistance, maxPull);
      pullDistance.set(newPull);

      // Prevent default scroll when pulling
      if (newPull > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, disabled, isRefreshing, maxPull, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;

    const currentPull = pullDistance.get();
    setIsPulling(false);

    if (currentPull >= threshold && !isRefreshing) {
      setIsRefreshing(true);

      // Animate to loading position
      await animate(pullDistance, threshold * 0.6, { duration: 0.2 });

      try {
        await onRefresh();
      } finally {
        // Animate back to top
        await animate(pullDistance, 0, { duration: 0.3, ease: 'easeOut' });
        setIsRefreshing(false);
      }
    } else {
      // Snap back
      animate(pullDistance, 0, { duration: 0.3, ease: 'easeOut' });
    }
  }, [isPulling, disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  const pullProgress = useTransform(pullDistance, [0, threshold], [0, 1]);
  const progressWidth = useTransform(pullProgress, (p) => `${Math.min(p * 100, 100)}%`);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 flex flex-col items-center justify-end overflow-hidden z-10 pointer-events-none"
        style={{
          height: pullDistance,
          top: 0,
        }}
      >
        <motion.div
          className={cn(
            'flex flex-col items-center justify-center mb-3 transition-colors',
            isRefreshing ? 'text-primary-600' : 'text-surface-500'
          )}
          style={{ opacity, scale }}
        >
          {isRefreshing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div style={{ rotate: rotation }}>
              <ArrowDown className="w-6 h-6" />
            </motion.div>
          )}
          <motion.span className="text-xs mt-1 font-medium">
            {isRefreshing ? 'Refreshing...' : pullDistance.get() >= threshold ? 'Release to refresh' : 'Pull to refresh'}
          </motion.span>
        </motion.div>

        {/* Progress bar */}
        <div className="w-1/2 h-1 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden mb-2">
          <motion.div
            className={cn(
              'h-full rounded-full transition-colors',
              isRefreshing ? 'bg-primary-600' : 'bg-primary-400'
            )}
            style={{ width: progressWidth }}
          />
        </div>
      </motion.div>

      {/* Content with transform */}
      <motion.div style={{ y: pullDistance }}>
        {children}
      </motion.div>
    </div>
  );
}

// Simple wrapper for scroll containers
export function RefreshableContainer({
  onRefresh,
  children,
  className,
  isRefreshing,
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  isRefreshing?: boolean;
}) {
  return (
    <div className={cn('relative', className)}>
      {/* Desktop refresh button - shown at top */}
      <div className="hidden md:flex justify-center mb-4">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            'flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 rounded-full shadow-sm',
            'border border-surface-200 dark:border-surface-700',
            'text-sm font-medium text-surface-600 dark:text-surface-400',
            'hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors',
            isRefreshing && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Mobile pull-to-refresh */}
      <div className="md:hidden">
        <PullToRefresh onRefresh={onRefresh} disabled={isRefreshing}>
          {children}
        </PullToRefresh>
      </div>

      {/* Desktop just renders children */}
      <div className="hidden md:block">
        {children}
      </div>
    </div>
  );
}
