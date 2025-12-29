import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, X } from 'lucide-react';
import { User, SuggestedConnection } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { FollowButton } from './FollowButton';
import { ConnectButton } from './ConnectButton';
import { cn } from '@/utils/cn';

interface UserCardProps {
  user: User | SuggestedConnection;
  index?: number;
  showActions?: boolean;
  showFollow?: boolean;
  showConnect?: boolean;
  showMutual?: boolean;
  showReason?: boolean;
  compact?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function UserCard({
  user,
  index = 0,
  showActions = true,
  showFollow = true,
  showConnect = false,
  showMutual = false,
  showReason = false,
  compact = false,
  onDismiss,
  className,
}: UserCardProps) {
  // Handle both User and SuggestedConnection types
  const userId = 'suggestedUserId' in user ? user.suggestedUserId : user.id;
  const userData = 'suggestedUser' in user ? user.suggestedUser : user;
  const reason = 'reason' in user ? user.reason : undefined;
  const mutualCount = 'mutualConnectionsCount' in user ? user.mutualConnectionsCount : 0;

  const reasonLabels: Record<string, string> = {
    same_mda: 'Same organization',
    mutual_connections: 'Mutual connections',
    similar_interests: 'Similar interests',
    same_department: 'Same department',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'rounded-xl transition-all overflow-hidden',
        compact
          ? 'p-2.5 hover:bg-surface-50 dark:hover:bg-surface-700/50'
          : 'bg-white dark:bg-surface-800 shadow-elevation-1 border border-surface-200 dark:border-surface-700 p-4 hover:shadow-elevation-2',
        className
      )}
    >
      <div className={cn('flex items-start', compact ? 'gap-2.5' : 'gap-3')}>
        <Link to={`/profile/${userId}`} className="flex-shrink-0">
          <Avatar
            src={userData?.avatar}
            name={userData?.displayName || 'User'}
            size={compact ? 'sm' : 'lg'}
          />
        </Link>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <Link
                to={`/profile/${userId}`}
                className={cn(
                  'font-semibold text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 block truncate',
                  compact ? 'text-sm' : 'text-base'
                )}
              >
                {userData?.displayName || 'User'}
              </Link>

              {userData?.title && (
                <p className={cn('text-surface-500 truncate', compact ? 'text-xs' : 'text-sm')}>
                  {userData.title}
                </p>
              )}

              {!compact && userData?.mda && (
                <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5 truncate">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{userData.mda}</span>
                </p>
              )}
            </div>

            {onDismiss && !compact && (
              <button
                onClick={onDismiss}
                className="p-1 rounded-full text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Reason for suggestion */}
          {showReason && reason && (
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 truncate">
              {reasonLabels[reason] || reason}
            </p>
          )}

          {/* Mutual connections */}
          {showMutual && mutualCount > 0 && (
            <p className="text-xs text-surface-500 mt-1">
              {mutualCount} mutual connection{mutualCount > 1 ? 's' : ''}
            </p>
          )}

          {/* Actions */}
          {showActions && (
            <div className={cn('flex items-center gap-2 flex-wrap', compact ? 'mt-2' : 'mt-3')}>
              {showFollow && (
                <FollowButton
                  userId={userId}
                  size="xs"
                  variant="primary"
                />
              )}
              {showConnect && (
                <ConnectButton
                  userId={userId}
                  size="xs"
                  variant="outline"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
