import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Award,
  Lightbulb,
  Users,
  Crown,
  Target,
  BookOpen,
  GraduationCap,
  Rocket,
  Heart,
  MessageSquare,
  BadgeCheck,
  Sparkles,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/shared/Avatar';
import type { Recognition } from '@/types/recognition';

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

interface RecognitionCardProps {
  recognition: Recognition;
  onEndorse?: (recognitionId: string) => void;
  canEndorse?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export function RecognitionCard({
  recognition,
  onEndorse,
  canEndorse = false,
  showActions = true,
  compact = false,
}: RecognitionCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const IconComponent = iconMap[recognition.category.icon] || Award;

  const timeAgo = formatDistanceToNow(new Date(recognition.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700',
        'overflow-hidden transition-shadow hover:shadow-lg',
        recognition.isHighlighted && 'ring-2 ring-secondary-400 dark:ring-secondary-500'
      )}
    >
      {/* Highlighted badge */}
      {recognition.isHighlighted && (
        <div className="bg-gradient-to-r from-secondary-400 to-secondary-500 px-3 py-1 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-white" fill="currentColor" />
          <span className="text-xs font-medium text-white">Featured Recognition</span>
        </div>
      )}

      <div className={cn('p-4', compact && 'p-3')}>
        {/* Header: Giver -> Receiver with Category */}
        <div className="flex items-start gap-3 mb-3">
          {/* Giver Avatar */}
          <Link to={`/profile/${recognition.giver.id}`} className="shrink-0">
            <Avatar
              src={recognition.giver.avatar}
              alt={recognition.giver.displayName}
              size={compact ? 'sm' : 'md'}
            />
          </Link>

          <div className="flex-1 min-w-0">
            {/* Names and arrow */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                to={`/profile/${recognition.giver.id}`}
                className="font-semibold text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {recognition.giver.displayName}
              </Link>
              <ArrowRight className="w-4 h-4 text-surface-400 shrink-0" />
              <Link
                to={`/profile/${recognition.receiver.id}`}
                className="font-semibold text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {recognition.receiver.displayName}
              </Link>
            </div>

            {/* Title/Department */}
            {!compact && (recognition.giver.title || recognition.giver.department) && (
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                {recognition.giver.title}
                {recognition.giver.title && recognition.giver.department && ' • '}
                {recognition.giver.department}
              </p>
            )}

            {/* Timestamp */}
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{timeAgo}</p>
          </div>

          {/* Receiver Avatar */}
          <Link to={`/profile/${recognition.receiver.id}`} className="shrink-0">
            <Avatar
              src={recognition.receiver.avatar}
              alt={recognition.receiver.displayName}
              size={compact ? 'sm' : 'md'}
            />
          </Link>
        </div>

        {/* Category Badge */}
        <div className="mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: recognition.category.color }}
          >
            <IconComponent className="w-4 h-4" />
            {recognition.category.name}
          </span>
        </div>

        {/* Message */}
        <div className="mb-3">
          <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
            "{recognition.message}"
          </p>
        </div>

        {/* XP Award */}
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              +{recognition.xpAwarded} XP
            </span>
          </div>
          {recognition.endorsementCount > 0 && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <BadgeCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                {recognition.endorsementCount} Endorsement{recognition.endorsementCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Endorsements List */}
        {recognition.endorsements && recognition.endorsements.length > 0 && (
          <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">
              Endorsed by:
            </p>
            <div className="space-y-1.5">
              {recognition.endorsements.slice(0, 3).map((endorsement) => (
                <div key={endorsement.id} className="flex items-center gap-2">
                  <Avatar
                    src={endorsement.endorser.avatar}
                    alt={endorsement.endorser.displayName}
                    size="xs"
                  />
                  <span className="text-xs text-surface-700 dark:text-surface-300">
                    <span className="font-medium">{endorsement.endorser.displayName}</span>
                    <span className="text-surface-500 dark:text-surface-400">
                      {' '}({endorsement.endorserRole})
                    </span>
                  </span>
                  {endorsement.comment && (
                    <span className="text-xs text-surface-500 dark:text-surface-400 italic truncate">
                      "{endorsement.comment}"
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-700">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors',
                isLiked
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
              )}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
              <span className="text-sm">Like</span>
            </button>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Comment</span>
            </button>

            {canEndorse && onEndorse && (
              <button
                onClick={() => onEndorse(recognition.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors ml-auto"
              >
                <BadgeCheck className="w-4 h-4" />
                <span className="text-sm font-medium">Endorse</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Compact version for lists/grids
export function RecognitionCardCompact({ recognition }: { recognition: Recognition }) {
  const IconComponent = iconMap[recognition.category.icon] || Award;

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: recognition.category.color }}
      >
        <IconComponent className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-900 dark:text-white truncate">
          <span className="font-medium">{recognition.giver.displayName}</span>
          <span className="text-surface-500 dark:text-surface-400"> recognized </span>
          <span className="font-medium">{recognition.receiver.displayName}</span>
        </p>
        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
          {recognition.category.name}
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
        <Sparkles className="w-3.5 h-3.5" />
        +{recognition.xpAwarded}
      </div>
    </div>
  );
}
