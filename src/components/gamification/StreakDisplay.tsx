import { motion } from 'framer-motion';
import { Flame, Calendar, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  weeklyActivity: boolean[];
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  lastActivityDate,
  weeklyActivity,
}: StreakDisplayProps) {
  const today = new Date();
  const lastActivity = new Date(lastActivityDate);
  const isActiveToday = today.toDateString() === lastActivity.toDateString();

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
      {/* Current Streak */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center',
            currentStreak > 0
              ? 'bg-gradient-to-br from-orange-400 to-accent-500'
              : 'bg-surface-200 dark:bg-surface-700'
          )}
        >
          <Flame
            className={cn(
              'w-8 h-8',
              currentStreak > 0 ? 'text-white' : 'text-surface-400'
            )}
          />
        </div>
        <div>
          <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            {currentStreak}
          </p>
          <p className="text-surface-600 dark:text-surface-400">
            day{currentStreak !== 1 && 's'} streak
          </p>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="mb-6">
        <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
          This Week
        </p>
        <div className="flex justify-between">
          {weeklyActivity.map((isActive, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  isActive
                    ? 'bg-gradient-to-br from-orange-400 to-accent-500'
                    : 'bg-surface-200 dark:bg-surface-700'
                )}
              >
                {isActive && <Flame className="w-4 h-4 text-white" />}
              </div>
              <span className="text-xs text-surface-500">{dayLabels[index]}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        <div className="text-center p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-accent-600 dark:text-accent-400 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {longestStreak}
          </p>
          <p className="text-xs text-surface-500">Best Streak</p>
        </div>
        <div className="text-center p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-primary-600 dark:text-primary-400 mb-1">
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {weeklyActivity.filter(Boolean).length}
          </p>
          <p className="text-xs text-surface-500">Days This Week</p>
        </div>
      </div>

      {/* Motivation Message */}
      {!isActiveToday && currentStreak > 0 && (
        <div className="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg text-center">
          <p className="text-sm text-warning-700 dark:text-warning-300">
            <Flame className="w-4 h-4 inline mr-1" />
            Don't break your streak! Log in today to continue.
          </p>
        </div>
      )}

      {currentStreak >= 7 && (
        <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg text-center">
          <p className="text-sm text-success-700 dark:text-success-300">
            <Award className="w-4 h-4 inline mr-1" />
            Amazing! You're on fire! Keep it up!
          </p>
        </div>
      )}
    </div>
  );
}

interface CompactStreakProps {
  streak: number;
}

export function CompactStreak({ streak }: CompactStreakProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
        streak > 0
          ? 'bg-gradient-to-r from-orange-500 to-accent-500 text-white'
          : 'bg-surface-200 dark:bg-surface-700 text-surface-500'
      )}
    >
      <Flame className="w-4 h-4" />
      {streak}
    </div>
  );
}
