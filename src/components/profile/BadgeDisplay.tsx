import { motion } from 'framer-motion';
import { Award, Lock, Star, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/formatters';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
  category: string;
  progress?: number;
  requirement?: string;
}

interface BadgeDisplayProps {
  badges: Badge[];
  showLocked?: boolean;
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeDisplay({
  badges,
  showLocked = false,
  maxDisplay,
  size = 'md',
}: BadgeDisplayProps) {
  const earnedBadges = badges.filter((b) => b.earnedAt);
  const lockedBadges = badges.filter((b) => !b.earnedAt);

  const displayedEarned = maxDisplay ? earnedBadges.slice(0, maxDisplay) : earnedBadges;
  const remainingCount = earnedBadges.length - displayedEarned.length;

  const getRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'from-surface-400 to-surface-500';
      case 'uncommon':
        return 'from-success-400 to-success-600';
      case 'rare':
        return 'from-info-400 to-info-600';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'legendary':
        return 'from-secondary-400 to-accent-500';
    }
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Award className="w-5 h-5 text-secondary-500" />
          Badges
          <span className="text-sm font-normal text-surface-500">
            ({earnedBadges.length} earned)
          </span>
        </h3>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {displayedEarned.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div
                className={cn(
                  'rounded-xl bg-gradient-to-br flex items-center justify-center cursor-pointer transition-transform hover:scale-110',
                  sizeClasses[size],
                  getRarityColor(badge.rarity)
                )}
              >
                <span className={textSizes[size]}>{badge.icon}</span>

                {badge.rarity === 'legendary' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-xl border-2 border-secondary-300/50"
                  />
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-surface-900 dark:bg-surface-700 text-white rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
                <p className="font-medium text-sm">{badge.name}</p>
                <p className="text-xs text-surface-300 mt-1">{badge.description}</p>
                {badge.earnedAt && (
                  <p className="text-xs text-surface-400 mt-2">
                    Earned {formatDate(badge.earnedAt)}
                  </p>
                )}
                <div
                  className={cn(
                    'mt-2 text-xs font-medium capitalize',
                    badge.rarity === 'legendary' && 'text-secondary-400',
                    badge.rarity === 'epic' && 'text-purple-400',
                    badge.rarity === 'rare' && 'text-info-400',
                    badge.rarity === 'uncommon' && 'text-success-400',
                    badge.rarity === 'common' && 'text-surface-400'
                  )}
                >
                  {badge.rarity}
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-surface-900 dark:border-t-surface-700" />
              </div>
            </motion.div>
          ))}

          {remainingCount > 0 && (
            <div
              className={cn(
                'rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center',
                sizeClasses[size]
              )}
            >
              <span className="text-sm font-medium text-surface-500">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Award className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
          <p className="text-sm text-surface-500">No badges earned yet</p>
        </div>
      )}

      {/* Locked Badges Preview */}
      {showLocked && lockedBadges.length > 0 && (
        <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
          <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Next Badges to Unlock
          </h4>
          <div className="space-y-3">
            {lockedBadges.slice(0, 3).map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-200 dark:bg-surface-600 flex items-center justify-center opacity-50">
                  <span className="text-xl grayscale">{badge.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {badge.name}
                  </p>
                  <p className="text-xs text-surface-500 truncate">
                    {badge.requirement || badge.description}
                  </p>
                </div>
                {badge.progress !== undefined && (
                  <div className="w-16">
                    <div className="h-1.5 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-surface-500 text-center mt-1">
                      {badge.progress}%
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FeaturedBadgeProps {
  badge: Badge;
}

export function FeaturedBadge({ badge }: FeaturedBadgeProps) {
  const getRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'from-surface-400 to-surface-500';
      case 'uncommon':
        return 'from-success-400 to-success-600';
      case 'rare':
        return 'from-info-400 to-info-600';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'legendary':
        return 'from-secondary-400 to-accent-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-white dark:bg-surface-800 rounded-xl shadow-elevation-2 p-6 text-center overflow-hidden"
    >
      {/* Background Decoration */}
      {badge.rarity === 'legendary' && (
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-secondary-200/30 to-accent-200/30 rounded-full blur-2xl"
          />
        </div>
      )}

      <div className="relative">
        <div
          className={cn(
            'w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center',
            getRarityColor(badge.rarity)
          )}
        >
          <span className="text-5xl">{badge.icon}</span>
        </div>

        <h3 className="mt-4 font-bold text-lg text-surface-900 dark:text-surface-50">
          {badge.name}
        </h3>
        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
          {badge.description}
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Star className="w-4 h-4 text-secondary-500" />
          <span className="text-sm font-medium capitalize text-secondary-600 dark:text-secondary-400">
            {badge.rarity}
          </span>
        </div>

        {badge.earnedAt && (
          <p className="text-xs text-surface-500 mt-2">
            Earned {formatDate(badge.earnedAt)}
          </p>
        )}
      </div>
    </motion.div>
  );
}
