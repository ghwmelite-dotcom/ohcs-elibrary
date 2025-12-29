import { useEffect } from 'react';
import { usePresenceStore, isUserOnline, getStatusColor } from '@/stores/presenceStore';
import { PresenceStatus } from '@/types';
import { cn } from '@/utils/cn';

interface PresenceBadgeProps {
  userId: string;
  showLabel?: boolean;
  className?: string;
}

const statusLabels: Record<PresenceStatus, string> = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

export function PresenceBadge({
  userId,
  showLabel = true,
  className,
}: PresenceBadgeProps) {
  const { userPresence, fetchUserPresence } = usePresenceStore();

  useEffect(() => {
    if (userId && !userPresence[userId]) {
      fetchUserPresence(userId);
    }
  }, [userId, userPresence, fetchUserPresence]);

  const presence = userPresence[userId];
  const status = presence?.status || 'offline';
  const statusColor = getStatusColor(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs',
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', statusColor)} />
      {showLabel && (
        <span className="text-surface-600 dark:text-surface-400">
          {statusLabels[status]}
        </span>
      )}
    </span>
  );
}
