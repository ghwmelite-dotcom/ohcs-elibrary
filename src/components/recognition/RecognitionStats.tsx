import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Heart,
  Sparkles,
  BadgeCheck,
  TrendingUp,
  Lightbulb,
  Users,
  Crown,
  Target,
  BookOpen,
  GraduationCap,
  Rocket,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useRecognitionStore } from '@/stores/recognitionStore';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Lightbulb,
  Users,
  Award,
  Crown,
  Target,
  BookOpen,
  GraduationCap,
  Rocket,
};

interface RecognitionStatsProps {
  userId?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export function RecognitionStats({
  userId,
  showTitle = true,
  compact = false,
}: RecognitionStatsProps) {
  const { userStats, isLoadingStats, fetchUserStats } = useRecognitionStore();

  useEffect(() => {
    fetchUserStats(userId);
  }, [userId]);

  if (isLoadingStats) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-surface-200 dark:bg-surface-700 rounded-lg" />
        <div className="h-32 bg-surface-200 dark:bg-surface-700 rounded-lg" />
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="text-center py-6">
        <Award className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
        <p className="text-sm text-surface-500 dark:text-surface-400">
          No recognition data available
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Received',
      value: userStats.recognitionsReceived,
      icon: Heart,
      color: 'text-red-500',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Given',
      value: userStats.recognitionsGiven,
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'Endorsed',
      value: userStats.endorsementsReceived,
      icon: BadgeCheck,
      color: 'text-purple-500',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: 'XP Earned',
      value: userStats.totalXpFromRecognition,
      icon: TrendingUp,
      color: 'text-primary-500',
      bg: 'bg-primary-100 dark:bg-primary-900/30',
    },
  ];

  return (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-primary-500" />
          Recognition Stats
        </h3>
      )}

      {/* Stats Grid */}
      <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4')}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'p-3 rounded-xl border border-surface-200 dark:border-surface-700',
              'bg-white dark:bg-surface-800'
            )}
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', stat.bg)}>
              <stat.icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Category Breakdown */}
      {userStats.categoryBreakdown && userStats.categoryBreakdown.length > 0 && (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
          <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            Recognition by Category
          </h4>
          <div className="space-y-2">
            {userStats.categoryBreakdown.map((cat, index) => {
              const IconComponent = iconMap[cat.icon] || Award;
              const maxCount = Math.max(...userStats.categoryBreakdown.map((c) => c.count));
              const percentage = (cat.count / maxCount) * 100;

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-surface-700 dark:text-surface-300 truncate">
                        {cat.name}
                      </span>
                      <span className="text-sm font-medium text-surface-900 dark:text-white">
                        {cat.count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Category */}
      {userStats.mostReceivedCategoryName && (
        <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl border border-primary-200 dark:border-primary-800">
          <p className="text-xs text-primary-600 dark:text-primary-400 mb-1">Most Recognized For</p>
          <div className="flex items-center gap-2">
            {userStats.mostReceivedCategoryIcon && (
              (() => {
                const IconComponent = iconMap[userStats.mostReceivedCategoryIcon] || Award;
                return <IconComponent className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
              })()
            )}
            <span className="font-semibold text-primary-700 dark:text-primary-300">
              {userStats.mostReceivedCategoryName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact widget for profile header
export function RecognitionStatsCompact({ userId }: { userId?: string }) {
  const { userStats, fetchUserStats } = useRecognitionStore();

  useEffect(() => {
    fetchUserStats(userId);
  }, [userId]);

  if (!userStats) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <Heart className="w-4 h-4 text-red-500" />
        <span className="font-medium text-surface-900 dark:text-white">
          {userStats.recognitionsReceived}
        </span>
        <span className="text-surface-500 dark:text-surface-400">received</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="font-medium text-surface-900 dark:text-white">
          {userStats.recognitionsGiven}
        </span>
        <span className="text-surface-500 dark:text-surface-400">given</span>
      </div>
      {userStats.endorsementsReceived > 0 && (
        <div className="flex items-center gap-1.5">
          <BadgeCheck className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-surface-900 dark:text-white">
            {userStats.endorsementsReceived}
          </span>
          <span className="text-surface-500 dark:text-surface-400">endorsed</span>
        </div>
      )}
    </div>
  );
}
