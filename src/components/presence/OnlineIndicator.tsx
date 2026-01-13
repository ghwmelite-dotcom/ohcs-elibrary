import { useEffect } from 'react';
import { usePresenceStore, isUserOnline, getStatusColor } from '@/stores/presenceStore';
import { cn } from '@/utils/cn';

interface OnlineIndicatorProps {
  userId: string;
  size?: 'xs' | 'sm' | 'md';
  showOffline?: boolean;
  className?: string;
}

export function OnlineIndicator({
  userId,
  size = 'sm',
  showOffline = false,
  className,
}: OnlineIndicatorProps) {
  const { userPresence, fetchUserPresence } = usePresenceStore();

  useEffect(() => {
    if (userId && !userPresence[userId]) {
      fetchUserPresence(userId);
    }
  }, [userId, userPresence, fetchUserPresence]);

  const presence = userPresence[userId];
  const online = isUserOnline(presence);

  // Don't show anything if offline and showOffline is false
  if (!online && !showOffline) {
    return null;
  }

  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  };

  const statusColor = presence ? getStatusColor(presence.status) : 'bg-surface-400 dark:bg-surface-500';

  return (
    <span
      className={cn(
        'block rounded-full ring-2 ring-white dark:ring-surface-800',
        sizeClasses[size],
        online ? statusColor : 'bg-surface-400 dark:bg-surface-500',
        className
      )}
      title={presence?.status || 'offline'}
    />
  );
}
