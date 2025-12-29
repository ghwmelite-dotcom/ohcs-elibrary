import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useSocialStore } from '@/stores/socialStore';
import { cn } from '@/utils/cn';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  initialIsFollowing = false,
  size = 'md',
  showIcon = true,
  variant = 'primary',
  className,
  onFollowChange,
}: FollowButtonProps) {
  const { followUser, unfollowUser, isFollowing: checkIsFollowing } = useSocialStore();

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing || checkIsFollowing(userId));
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        const success = await unfollowUser(userId);
        if (success) {
          setIsFollowing(false);
          onFollowChange?.(false);
        }
      } else {
        const success = await followUser(userId);
        if (success) {
          setIsFollowing(true);
          onFollowChange?.(true);
        }
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

  const variantClasses = {
    primary: isFollowing
      ? 'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-error-100 hover:text-error-600 dark:hover:bg-error-900/30 dark:hover:text-error-400'
      : 'bg-primary-600 text-white hover:bg-primary-700',
    outline: isFollowing
      ? 'border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:border-error-500 hover:text-error-600 dark:hover:text-error-400'
      : 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
    ghost: isFollowing
      ? 'text-surface-600 dark:text-surface-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20'
      : 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
  };

  const displayText = isFollowing
    ? isHovering
      ? 'Unfollow'
      : 'Following'
    : 'Follow';

  const Icon = isFollowing ? UserMinus : UserPlus;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
      ) : showIcon ? (
        <Icon className={iconSizes[size]} />
      ) : null}
      <span>{displayText}</span>
    </button>
  );
}
