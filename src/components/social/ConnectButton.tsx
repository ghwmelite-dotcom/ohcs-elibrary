import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  UserMinus,
  Loader2,
  Check,
  X,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { useSocialStore } from '@/stores/socialStore';
import { ConnectionType } from '@/types';
import { cn } from '@/utils/cn';

interface ConnectButtonProps {
  userId: string;
  connectionStatus?: 'none' | 'pending' | 'connected' | 'received';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
  onConnectionChange?: (status: string) => void;
}

const connectionTypes: { id: ConnectionType; label: string }[] = [
  { id: 'colleague', label: 'Colleague' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'mentee', label: 'Mentee' },
];

export function ConnectButton({
  userId,
  connectionStatus = 'none',
  size = 'md',
  showIcon = true,
  variant = 'primary',
  className,
  onConnectionChange,
}: ConnectButtonProps) {
  const {
    sendConnectionRequest,
    respondToRequest,
    removeConnection,
    isConnected,
  } = useSocialStore();

  const [status, setStatus] = useState(
    connectionStatus !== 'none' ? connectionStatus : isConnected(userId) ? 'connected' : 'none'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleConnect = async (type: ConnectionType = 'colleague') => {
    if (isLoading) return;

    setIsLoading(true);
    setShowTypeMenu(false);
    try {
      const success = await sendConnectionRequest(userId, type);
      if (success) {
        setStatus('pending');
        onConnectionChange?.('pending');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (accept: boolean) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const success = await respondToRequest(userId, accept);
      if (success) {
        setStatus(accept ? 'connected' : 'none');
        onConnectionChange?.(accept ? 'connected' : 'none');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const success = await removeConnection(userId);
      if (success) {
        setStatus('none');
        onConnectionChange?.('none');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all';

  // Received connection request - show accept/decline
  if (status === 'received') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          onClick={() => handleRespond(true)}
          disabled={isLoading}
          className={cn(
            baseClasses,
            sizeClasses[size],
            'bg-primary-600 text-white hover:bg-primary-700',
            isLoading && 'opacity-50'
          )}
        >
          {isLoading ? (
            <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
          ) : (
            <Check className={iconSizes[size]} />
          )}
          Accept
        </button>
        <button
          onClick={() => handleRespond(false)}
          disabled={isLoading}
          className={cn(
            baseClasses,
            sizeClasses[size],
            'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-error-100 hover:text-error-600',
            isLoading && 'opacity-50'
          )}
        >
          <X className={iconSizes[size]} />
        </button>
      </div>
    );
  }

  // Connected - show connected status with remove option
  if (status === 'connected') {
    return (
      <button
        onClick={handleRemove}
        disabled={isLoading}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          baseClasses,
          sizeClasses[size],
          'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300',
          isHovering && 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400',
          isLoading && 'opacity-50',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : showIcon ? (
          <UserMinus className={iconSizes[size]} />
        ) : null}
        <span>{isHovering ? 'Remove' : 'Connected'}</span>
      </button>
    );
  }

  // Pending - show pending status
  if (status === 'pending') {
    return (
      <button
        disabled
        className={cn(
          baseClasses,
          sizeClasses[size],
          'bg-surface-100 dark:bg-surface-800 text-surface-500 cursor-not-allowed',
          className
        )}
      >
        {showIcon && <Clock className={iconSizes[size]} />}
        <span>Pending</span>
      </button>
    );
  }

  // Not connected - show connect button with type selection
  return (
    <div className="relative">
      <button
        onClick={() => setShowTypeMenu(!showTypeMenu)}
        disabled={isLoading}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
          variant === 'outline' && 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
          variant === 'ghost' && 'text-primary-600 hover:bg-primary-50',
          isLoading && 'opacity-50',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : showIcon ? (
          <UserPlus className={iconSizes[size]} />
        ) : null}
        <span>Connect</span>
        <ChevronDown className={cn(iconSizes[size], showTypeMenu && 'rotate-180', 'transition-transform')} />
      </button>

      <AnimatePresence>
        {showTypeMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowTypeMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 top-full mt-1 z-50 w-40 bg-white dark:bg-surface-800 rounded-lg shadow-elevation-3 border border-surface-200 dark:border-surface-700 py-1"
            >
              {connectionTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleConnect(type.id)}
                  className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                >
                  Connect as {type.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
