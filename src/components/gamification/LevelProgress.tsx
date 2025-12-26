import { motion } from 'framer-motion';
import { Star, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LevelProgressProps {
  level: number;
  levelName: string;
  currentXP: number;
  requiredXP: number;
  totalXP: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelProgress({
  level,
  levelName,
  currentXP,
  requiredXP,
  totalXP,
  showDetails = true,
  size = 'md',
}: LevelProgressProps) {
  const progress = (currentXP / requiredXP) * 100;

  const sizes = {
    sm: {
      container: 'p-3',
      icon: 'w-8 h-8',
      levelBadge: 'w-5 h-5 text-xs',
      title: 'text-sm',
      bar: 'h-2',
    },
    md: {
      container: 'p-4',
      icon: 'w-12 h-12',
      levelBadge: 'w-6 h-6 text-sm',
      title: 'text-base',
      bar: 'h-3',
    },
    lg: {
      container: 'p-6',
      icon: 'w-16 h-16',
      levelBadge: 'w-8 h-8 text-base',
      title: 'text-lg',
      bar: 'h-4',
    },
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1',
        sizes[size].container
      )}
    >
      <div className="flex items-center gap-4">
        {/* Level Icon */}
        <div className="relative">
          <div
            className={cn(
              'bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl flex items-center justify-center',
              sizes[size].icon
            )}
          >
            <Star className="w-1/2 h-1/2 text-white" />
          </div>
          <div
            className={cn(
              'absolute -bottom-1 -right-1 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold',
              sizes[size].levelBadge
            )}
          >
            {level}
          </div>
        </div>

        {/* Level Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span
                className={cn(
                  'font-semibold text-surface-900 dark:text-surface-50',
                  sizes[size].title
                )}
              >
                Level {level}
              </span>
              <span className="mx-2 text-surface-400">•</span>
              <span className="text-surface-600 dark:text-surface-400">
                {levelName}
              </span>
            </div>
            {showDetails && (
              <div className="flex items-center gap-1 text-secondary-600 dark:text-secondary-400">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {totalXP.toLocaleString()} XP
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div
            className={cn(
              'bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden',
              sizes[size].bar
            )}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          {/* XP Details */}
          {showDetails && (
            <div className="flex items-center justify-between mt-1 text-xs text-surface-500">
              <span>{currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP</span>
              <span>{requiredXP - currentXP} XP to Level {level + 1}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface XPBreakdownProps {
  breakdown: { source: string; amount: number; percentage: number }[];
}

export function XPBreakdown({ breakdown }: XPBreakdownProps) {
  const colors = [
    'bg-primary-500',
    'bg-secondary-500',
    'bg-accent-500',
    'bg-success-500',
    'bg-warning-500',
  ];

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
      <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary-500" />
        XP Breakdown
      </h3>

      {/* Stacked Bar */}
      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden flex">
        {breakdown.map((item, index) => (
          <motion.div
            key={item.source}
            className={cn('h-full', colors[index % colors.length])}
            initial={{ width: 0 }}
            animate={{ width: `${item.percentage}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {breakdown.map((item, index) => (
          <div key={item.source} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn('w-3 h-3 rounded', colors[index % colors.length])}
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">
                {item.source}
              </span>
            </div>
            <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
              {item.amount.toLocaleString()} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
