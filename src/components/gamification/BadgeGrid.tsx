import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Info, X, Calendar, Award } from 'lucide-react';
import { Badge as BadgeType } from '@/types';
import { Modal } from '@/components/shared/Modal';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/formatters';

interface BadgeGridProps {
  badges: BadgeType[];
  earnedBadgeIds: string[];
  columns?: number;
}

export function BadgeGrid({
  badges,
  earnedBadgeIds,
  columns = 4,
}: BadgeGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);

  const earnedBadges = badges.filter((b) => earnedBadgeIds.includes(b.id));
  const lockedBadges = badges.filter((b) => !earnedBadgeIds.includes(b.id));

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-secondary-500" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              Earned Badges ({earnedBadges.length})
            </h3>
          </div>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {earnedBadges.map((badge, index) => (
              <BadgeItem
                key={badge.id}
                badge={badge}
                isEarned
                index={index}
                onClick={() => setSelectedBadge(badge)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-surface-400" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              Locked Badges ({lockedBadges.length})
            </h3>
          </div>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {lockedBadges.map((badge, index) => (
              <BadgeItem
                key={badge.id}
                badge={badge}
                isEarned={false}
                index={index}
                onClick={() => setSelectedBadge(badge)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            isEarned={earnedBadgeIds.includes(selectedBadge.id)}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface BadgeItemProps {
  badge: BadgeType;
  isEarned: boolean;
  index: number;
  onClick: () => void;
}

function BadgeItem({ badge, isEarned, index, onClick }: BadgeItemProps) {
  const rarityColors = {
    common: 'from-surface-400 to-surface-500',
    uncommon: 'from-success-400 to-success-600',
    rare: 'from-primary-400 to-primary-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-secondary-400 to-secondary-600',
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        'group relative p-4 rounded-xl border-2 transition-all text-center',
        isEarned
          ? 'bg-white dark:bg-surface-800 border-secondary-200 dark:border-secondary-800 hover:border-secondary-400 shadow-sm hover:shadow-md'
          : 'bg-surface-100 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700 opacity-60 hover:opacity-80'
      )}
    >
      {/* Badge Icon */}
      <div
        className={cn(
          'w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl relative',
          isEarned
            ? `bg-gradient-to-br ${rarityColors[badge.rarity]} shadow-lg`
            : 'bg-surface-200 dark:bg-surface-700'
        )}
      >
        {isEarned ? (
          badge.icon
        ) : (
          <Lock className="w-6 h-6 text-surface-400" />
        )}

        {/* Earned Checkmark */}
        {isEarned && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center border-2 border-white dark:border-surface-800">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Badge Name */}
      <p
        className={cn(
          'mt-3 font-medium text-sm truncate',
          isEarned
            ? 'text-surface-900 dark:text-surface-50'
            : 'text-surface-500'
        )}
      >
        {badge.name}
      </p>

      {/* Rarity */}
      <p
        className={cn(
          'text-xs capitalize mt-1',
          isEarned
            ? badge.rarity === 'legendary'
              ? 'text-secondary-500'
              : badge.rarity === 'epic'
              ? 'text-purple-500'
              : badge.rarity === 'rare'
              ? 'text-primary-500'
              : 'text-surface-500'
            : 'text-surface-400'
        )}
      >
        {badge.rarity}
      </p>

      {/* Info Button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Info className="w-4 h-4 text-surface-400" />
      </div>
    </motion.button>
  );
}

interface BadgeDetailModalProps {
  badge: BadgeType;
  isEarned: boolean;
  earnedAt?: string;
  onClose: () => void;
}

function BadgeDetailModal({
  badge,
  isEarned,
  earnedAt,
  onClose,
}: BadgeDetailModalProps) {
  const rarityColors = {
    common: 'from-surface-400 to-surface-500',
    uncommon: 'from-success-400 to-success-600',
    rare: 'from-primary-400 to-primary-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-secondary-400 to-secondary-600',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
      >
        {/* Header */}
        <div
          className={cn(
            'p-6 text-center relative',
            isEarned
              ? `bg-gradient-to-br ${rarityColors[badge.rarity]}`
              : 'bg-surface-200 dark:bg-surface-700'
          )}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div
            className={cn(
              'w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl',
              isEarned ? 'bg-white/20' : 'bg-white/10'
            )}
          >
            {isEarned ? badge.icon : <Lock className="w-10 h-10 text-white/50" />}
          </div>

          <h2 className="mt-4 text-xl font-bold text-white">{badge.name}</h2>
          <p className="text-white/80 capitalize">{badge.rarity} Badge</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-surface-600 dark:text-surface-400 text-center mb-4">
            {badge.description}
          </p>

          <div className="space-y-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Category</span>
              <span className="font-medium text-surface-900 dark:text-surface-50 capitalize">
                {badge.category}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">XP Reward</span>
              <span className="font-medium text-secondary-600 dark:text-secondary-400">
                +{badge.xpReward} XP
              </span>
            </div>
            {isEarned && earnedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Earned On</span>
                <span className="font-medium text-surface-900 dark:text-surface-50">
                  {formatDate(earnedAt)}
                </span>
              </div>
            )}
          </div>

          {!isEarned && (
            <div className="mt-4 p-3 bg-surface-100 dark:bg-surface-700 rounded-lg">
              <p className="text-sm text-surface-600 dark:text-surface-400 text-center">
                <Lock className="w-4 h-4 inline mr-1" />
                {badge.requirement}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
