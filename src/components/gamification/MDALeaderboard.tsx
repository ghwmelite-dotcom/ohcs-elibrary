import { motion } from 'framer-motion';
import { Building2, Users, TrendingUp, Award, BookOpen, MessageSquare } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MDAEntry {
  rank: number;
  mdaId: string;
  mdaName: string;
  abbreviation: string;
  memberCount: number;
  totalXp: number;
  avgXp: number;
  documentsRead: number;
  forumActivity: number;
}

interface MDALeaderboardProps {
  entries: MDAEntry[];
  userMdaId?: string;
}

export function MDALeaderboard({ entries, userMdaId }: MDALeaderboardProps) {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-400/30">
            <span className="text-white font-bold text-sm">1</span>
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-300 to-surface-500 dark:from-surface-400 dark:to-surface-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">2</span>
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">3</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
            <span className="text-surface-600 dark:text-surface-300 font-medium text-sm">{rank}</span>
          </div>
        );
    }
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-surface-900 dark:text-white">MDA Rankings</h3>
        </div>
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-surface-500">No MDA data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">MDA Competition</h3>
            <p className="text-white/80 text-sm">Which ministry leads in learning?</p>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-surface-50 dark:bg-surface-700/50 text-xs font-medium text-surface-500 uppercase tracking-wider">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Ministry</div>
        <div className="col-span-2 text-center">Members</div>
        <div className="col-span-2 text-center">Total XP</div>
        <div className="col-span-3 text-center">Avg XP/User</div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-surface-100 dark:divide-surface-700">
        {entries.map((entry, index) => {
          const isUserMDA = entry.mdaId === userMdaId;

          return (
            <motion.div
              key={entry.mdaId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors',
                isUserMDA && 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
              )}
            >
              {/* Rank */}
              <div className="col-span-1">
                {getRankBadge(entry.rank)}
              </div>

              {/* Ministry Info */}
              <div className="col-span-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white',
                    entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                    entry.rank === 2 ? 'bg-gradient-to-br from-surface-400 to-surface-600 dark:from-surface-500 dark:to-surface-700' :
                    entry.rank === 3 ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
                    'bg-gradient-to-br from-primary-400 to-primary-600'
                  )}>
                    {entry.abbreviation?.slice(0, 2) || entry.mdaName.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      'font-medium truncate',
                      isUserMDA ? 'text-primary-600 dark:text-primary-400' : 'text-surface-900 dark:text-white'
                    )}>
                      {entry.abbreviation || entry.mdaName}
                      {isUserMDA && ' (Your MDA)'}
                    </p>
                    <p className="text-xs text-surface-500 truncate">{entry.mdaName}</p>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="col-span-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="w-4 h-4 text-surface-400" />
                  <span className="font-medium text-surface-700 dark:text-surface-300">{entry.memberCount}</span>
                </div>
              </div>

              {/* Total XP */}
              <div className="col-span-2 text-center">
                <span className={cn(
                  'font-bold',
                  entry.rank === 1 ? 'text-yellow-600 dark:text-yellow-400' :
                  entry.rank === 2 ? 'text-surface-600 dark:text-surface-400' :
                  entry.rank === 3 ? 'text-amber-600 dark:text-amber-400' :
                  'text-surface-700 dark:text-surface-300'
                )}>
                  {entry.totalXp.toLocaleString()}
                </span>
              </div>

              {/* Avg XP */}
              <div className="col-span-3 text-center">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700">
                  <TrendingUp className="w-3 h-3 text-success-500" />
                  <span className="font-medium text-surface-700 dark:text-surface-300">{entry.avgXp.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="bg-surface-50 dark:bg-surface-700/50 p-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="flex items-center justify-center gap-1 text-primary-600 dark:text-primary-400">
            <Award className="w-4 h-4" />
            <span className="font-bold">{entries.length}</span>
          </div>
          <p className="text-surface-500">MDAs Competing</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-success-600 dark:text-success-400">
            <BookOpen className="w-4 h-4" />
            <span className="font-bold">{entries.reduce((sum, e) => sum + e.documentsRead, 0).toLocaleString()}</span>
          </div>
          <p className="text-surface-500">Docs Read</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-secondary-600 dark:text-secondary-400">
            <MessageSquare className="w-4 h-4" />
            <span className="font-bold">{entries.reduce((sum, e) => sum + e.forumActivity, 0).toLocaleString()}</span>
          </div>
          <p className="text-surface-500">Forum Posts</p>
        </div>
      </div>
    </div>
  );
}
