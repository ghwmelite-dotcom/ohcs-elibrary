import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/shared/Avatar';
import { Spinner } from '@/components/shared/Spinner';
import { useRecognitionStore } from '@/stores/recognitionStore';

type LeaderboardType = 'received' | 'given';
type LeaderboardPeriod = 'weekly' | 'monthly' | 'quarterly' | 'allTime';

interface RecognitionLeaderboardProps {
  defaultType?: LeaderboardType;
  defaultPeriod?: LeaderboardPeriod;
  showTabs?: boolean;
  limit?: number;
  compact?: boolean;
}

export function RecognitionLeaderboard({
  defaultType = 'received',
  defaultPeriod = 'monthly',
  showTabs = true,
  limit = 10,
  compact = false,
}: RecognitionLeaderboardProps) {
  const [type, setType] = useState<LeaderboardType>(defaultType);
  const [period, setPeriod] = useState<LeaderboardPeriod>(defaultPeriod);

  const { leaderboard, isLoadingLeaderboard, fetchLeaderboard } = useRecognitionStore();

  useEffect(() => {
    fetchLeaderboard(type, period);
  }, [type, period]);

  const periodLabels: Record<LeaderboardPeriod, string> = {
    weekly: 'This Week',
    monthly: 'This Month',
    quarterly: 'This Quarter',
    allTime: 'All Time',
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-surface-400 dark:text-surface-500" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-surface-500">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800';
      case 2:
        return 'bg-gradient-to-r from-surface-50 to-surface-100 dark:from-surface-800/50 dark:to-surface-700/50 border-surface-200 dark:border-surface-600';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700';
    }
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Recognition Leaders
          </h3>
          {!compact && (
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as LeaderboardPeriod)}
              className="text-sm px-2 py-1 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300"
            >
              {Object.entries(periodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Type tabs */}
        {showTabs && (
          <div className="flex gap-2">
            <button
              onClick={() => setType('received')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                type === 'received'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
              )}
            >
              <Heart className="w-4 h-4" />
              Most Recognized
            </button>
            <button
              onClick={() => setType('given')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                type === 'given'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
              )}
            >
              <Sparkles className="w-4 h-4" />
              Most Giving
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('divide-y divide-surface-100 dark:divide-surface-700', compact && 'max-h-80 overflow-y-auto')}>
        {isLoadingLeaderboard ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : leaderboard?.entries?.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
            <p className="text-sm text-surface-500 dark:text-surface-400">No data for this period</p>
          </div>
        ) : (
          leaderboard?.entries?.slice(0, limit).map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-3 p-3 border-l-4 transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50',
                getRankBg(entry.rank)
              )}
            >
              {/* Rank */}
              <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>

              {/* Avatar */}
              <Link to={`/profile/${entry.userId}`}>
                <Avatar
                  src={entry.user?.avatar}
                  alt={entry.user?.displayName || 'User'}
                  size="sm"
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/profile/${entry.userId}`}
                  className="font-medium text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block"
                >
                  {entry.user?.displayName || 'Unknown User'}
                </Link>
                {!compact && entry.user?.title && (
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                    {entry.user.title}
                  </p>
                )}
              </div>

              {/* Count */}
              <div className="text-right">
                <p className="font-bold text-primary-600 dark:text-primary-400">{entry.count}</p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {type === 'received' ? 'received' : 'given'}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      {!compact && leaderboard?.entries && leaderboard.entries.length > limit && (
        <div className="p-3 border-t border-surface-200 dark:border-surface-700">
          <Link
            to="/recognition?tab=leaderboard"
            className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            View full leaderboard
          </Link>
        </div>
      )}
    </div>
  );
}
