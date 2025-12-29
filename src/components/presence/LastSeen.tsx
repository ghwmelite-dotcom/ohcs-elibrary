import { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { usePresenceStore, formatLastSeen, isUserOnline } from '@/stores/presenceStore';
import { cn } from '@/utils/cn';

interface LastSeenProps {
  userId: string;
  showIcon?: boolean;
  className?: string;
}

export function LastSeen({ userId, showIcon = false, className }: LastSeenProps) {
  const { userPresence, fetchUserPresence } = usePresenceStore();

  useEffect(() => {
    if (userId && !userPresence[userId]) {
      fetchUserPresence(userId);
    }
  }, [userId, userPresence, fetchUserPresence]);

  const presence = userPresence[userId];

  if (!presence) {
    return null;
  }

  const online = isUserOnline(presence);

  if (online) {
    return (
      <span className={cn('text-xs text-success-600 dark:text-success-400', className)}>
        Online now
      </span>
    );
  }

  const lastSeenText = formatLastSeen(presence.lastSeenAt);

  return (
    <span className={cn('text-xs text-surface-500 flex items-center gap-1', className)}>
      {showIcon && <Clock className="w-3 h-3" />}
      Last seen {lastSeenText}
    </span>
  );
}
