import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    shimmer: 'shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-surface-200 dark:bg-surface-700',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{
        width: width,
        height: height,
      }}
    />
  );
}

// Pre-built skeleton compositions
export function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
      <Skeleton variant="rounded" height={160} className="mb-4" />
      <Skeleton width="60%" className="mb-2" />
      <Skeleton width="80%" className="mb-2" />
      <Skeleton width="40%" />
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-4">
      <SkeletonAvatar />
      <div className="flex-1">
        <Skeleton width="40%" className="mb-2" />
        <Skeleton width="60%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-surface-200 dark:border-surface-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="20%" height={12} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-surface-200 dark:border-surface-700"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width="20%" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDocumentCard() {
  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <Skeleton variant="rectangular" height={200} />
      <div className="p-4">
        <Skeleton width="70%" className="mb-2" />
        <Skeleton width="100%" className="mb-1" />
        <Skeleton width="60%" className="mb-4" />
        <div className="flex gap-2">
          <Skeleton variant="rounded" width={60} height={24} />
          <Skeleton variant="rounded" width={60} height={24} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonForumTopic() {
  return (
    <div className="p-4 border-b border-surface-200 dark:border-surface-700">
      <div className="flex gap-4">
        <SkeletonAvatar />
        <div className="flex-1">
          <Skeleton width="60%" className="mb-2" />
          <Skeleton width="100%" className="mb-1" />
          <Skeleton width="80%" className="mb-3" />
          <div className="flex gap-4">
            <Skeleton width={80} height={16} />
            <Skeleton width={80} height={16} />
            <Skeleton width={80} height={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonChatMessage() {
  return (
    <div className="flex gap-3 p-2">
      <SkeletonAvatar size={36} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Skeleton width={100} height={14} />
          <Skeleton width={60} height={12} />
        </div>
        <Skeleton variant="rounded" width="70%" height={40} />
      </div>
    </div>
  );
}
