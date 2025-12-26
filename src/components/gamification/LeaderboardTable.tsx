import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
import { LeaderboardEntry } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  showPodium?: boolean;
}

export function LeaderboardTable({
  entries,
  currentUserId,
  period = 'weekly',
  showPodium = true,
}: LeaderboardTableProps) {
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-secondary-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-surface-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getRankChange = (change: number) => {
    if (change > 0) {
      return (
        <span className="flex items-center gap-0.5 text-success-500">
          <TrendingUp className="w-3 h-3" />
          {change}
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="flex items-center gap-0.5 text-error-500">
          <TrendingDown className="w-3 h-3" />
          {Math.abs(change)}
        </span>
      );
    }
    return (
      <span className="flex items-center text-surface-400">
        <Minus className="w-3 h-3" />
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Podium */}
      {showPodium && topThree.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-8">
          {/* Second Place */}
          <PodiumItem entry={topThree[1]} position={2} />
          {/* First Place */}
          <PodiumItem entry={topThree[0]} position={1} />
          {/* Third Place */}
          <PodiumItem entry={topThree[2]} position={3} />
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-secondary-500" />
              Leaderboard
            </h3>
            <span className="text-sm text-surface-500 capitalize">{period}</span>
          </div>
        </div>

        <div className="divide-y divide-surface-200 dark:divide-surface-700">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onMouseEnter={() => setHoveredEntry(entry.userId)}
              onMouseLeave={() => setHoveredEntry(null)}
              className={cn(
                'flex items-center gap-4 px-4 py-3 transition-colors',
                entry.userId === currentUserId &&
                  'bg-primary-50 dark:bg-primary-900/20',
                hoveredEntry === entry.userId &&
                  entry.userId !== currentUserId &&
                  'bg-surface-50 dark:bg-surface-700/50'
              )}
            >
              {/* Rank */}
              <div className="w-10 flex items-center justify-center">
                {entry.rank <= 3 ? (
                  getRankIcon(entry.rank)
                ) : (
                  <span
                    className={cn(
                      'font-bold',
                      entry.userId === currentUserId
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-surface-500'
                    )}
                  >
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Change */}
              <div className="w-8 text-xs">
                {getRankChange(entry.change || 0)}
              </div>

              {/* User */}
              <Link
                to={`/profile/${entry.userId}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar src={entry.avatar} name={entry.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium truncate',
                      entry.userId === currentUserId
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-surface-900 dark:text-surface-50'
                    )}
                  >
                    {entry.name}
                    {entry.userId === currentUserId && (
                      <span className="ml-2 text-xs text-primary-500">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-surface-500 truncate">
                    {entry.mda || 'OHCS'}
                  </p>
                </div>
              </Link>

              {/* Level */}
              <div className="hidden sm:flex items-center gap-1">
                <div className="w-6 h-6 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Lvl {entry.level}
                </span>
              </div>

              {/* XP */}
              <div className="text-right min-w-[80px]">
                <p className="font-bold text-secondary-600 dark:text-secondary-400">
                  {entry.xp.toLocaleString()}
                </p>
                <p className="text-xs text-surface-400">XP</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PodiumItemProps {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}

function PodiumItem({ entry, position }: PodiumItemProps) {
  const heights = {
    1: 'h-32',
    2: 'h-24',
    3: 'h-20',
  };

  const colors = {
    1: 'from-secondary-400 to-secondary-600',
    2: 'from-surface-300 to-surface-400',
    3: 'from-orange-400 to-orange-600',
  };

  const avatarSizes = {
    1: 'w-16 h-16',
    2: 'w-12 h-12',
    3: 'w-12 h-12',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position === 1 ? 0 : position * 0.1 }}
      className="flex flex-col items-center"
    >
      {/* Avatar */}
      <Link
        to={`/profile/${entry.userId}`}
        className="relative mb-2"
      >
        <Avatar
          src={entry.avatar}
          name={entry.name}
          className={cn('ring-4 ring-white dark:ring-surface-800', avatarSizes[position])}
        />
        {position === 1 && (
          <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-secondary-500" />
        )}
      </Link>

      {/* Name & XP */}
      <p className="font-medium text-surface-900 dark:text-surface-50 text-center text-sm truncate max-w-[100px]">
        {entry.name}
      </p>
      <p className="text-xs text-secondary-600 dark:text-secondary-400 font-bold">
        {entry.xp.toLocaleString()} XP
      </p>

      {/* Podium */}
      <div
        className={cn(
          'w-24 mt-2 rounded-t-lg bg-gradient-to-b flex items-center justify-center',
          heights[position],
          colors[position]
        )}
      >
        <span className="text-2xl font-bold text-white">{position}</span>
      </div>
    </motion.div>
  );
}
