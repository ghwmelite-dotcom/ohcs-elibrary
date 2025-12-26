import { motion } from 'framer-motion';
import { Trophy, Zap, Calendar, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime, formatDate } from '@/utils/formatters';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpEarned: number;
  earnedAt: string;
  category: string;
}

interface AchievementListProps {
  achievements: Achievement[];
  maxItems?: number;
}

export function AchievementList({ achievements, maxItems }: AchievementListProps) {
  const displayedAchievements = maxItems
    ? achievements.slice(0, maxItems)
    : achievements;

  if (achievements.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-8 text-center">
        <Trophy className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
        <p className="text-surface-600 dark:text-surface-400">
          No achievements yet. Start exploring to earn your first!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-secondary-500" />
          Recent Achievements
        </h3>
      </div>

      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {displayedAchievements.map((achievement, index) => (
          <AchievementItem
            key={achievement.id}
            achievement={achievement}
            index={index}
          />
        ))}
      </div>

      {maxItems && achievements.length > maxItems && (
        <div className="p-3 text-center border-t border-surface-200 dark:border-surface-700">
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all {achievements.length} achievements
          </button>
        </div>
      )}
    </div>
  );
}

interface AchievementItemProps {
  achievement: Achievement;
  index: number;
}

function AchievementItem({ achievement, index }: AchievementItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
    >
      {/* Icon */}
      <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
        {achievement.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-surface-900 dark:text-surface-50">
          {achievement.title}
        </p>
        <p className="text-sm text-surface-500 truncate">
          {achievement.description}
        </p>
      </div>

      {/* XP & Time */}
      <div className="text-right">
        <p className="font-bold text-secondary-600 dark:text-secondary-400 flex items-center justify-end gap-1">
          <Zap className="w-4 h-4" />
          +{achievement.xpEarned} XP
        </p>
        <p className="text-xs text-surface-400 flex items-center justify-end gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(achievement.earnedAt)}
        </p>
      </div>
    </motion.div>
  );
}

interface XPHistoryProps {
  history: {
    id: string;
    amount: number;
    reason: string;
    timestamp: string;
    category: string;
  }[];
  maxItems?: number;
}

export function XPHistory({ history, maxItems }: XPHistoryProps) {
  const displayedHistory = maxItems ? history.slice(0, maxItems) : history;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'forum':
        return '💬';
      case 'document':
        return '📄';
      case 'group':
        return '👥';
      case 'login':
        return '🔐';
      case 'badge':
        return '🏆';
      default:
        return '⭐';
    }
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success-500" />
          XP History
        </h3>
      </div>

      {displayedHistory.length === 0 ? (
        <div className="p-8 text-center text-surface-500">
          No XP earned yet
        </div>
      ) : (
        <div className="divide-y divide-surface-200 dark:divide-surface-700">
          {displayedHistory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50"
            >
              <span className="text-xl">{getCategoryIcon(item.category)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-700 dark:text-surface-300 truncate">
                  {item.reason}
                </p>
                <p className="text-xs text-surface-400">
                  {formatRelativeTime(item.timestamp)}
                </p>
              </div>
              <span
                className={cn(
                  'font-bold',
                  item.amount >= 0
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-error-600 dark:text-error-400'
                )}
              >
                {item.amount >= 0 ? '+' : ''}{item.amount} XP
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {maxItems && history.length > maxItems && (
        <div className="p-3 text-center border-t border-surface-200 dark:border-surface-700">
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View full history
          </button>
        </div>
      )}
    </div>
  );
}
