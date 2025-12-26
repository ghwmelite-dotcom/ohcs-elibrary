import { type HTMLAttributes } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/formatters';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

const statusSizeStyles: Record<AvatarSize, string> = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
};

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-surface-400',
  away: 'bg-warning-500',
  busy: 'bg-error-500',
};

const bgColors = [
  'bg-primary-100 text-primary-700',
  'bg-secondary-100 text-secondary-700',
  'bg-accent-100 text-accent-700',
  'bg-info-100 text-info-700',
  'bg-success-100 text-success-700',
  'bg-warning-100 text-warning-700',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length]!;
}

export function Avatar({
  src,
  name,
  size = 'md',
  showStatus = false,
  status = 'offline',
  className,
  ...props
}: AvatarProps) {
  const initials = name ? getInitials(name) : null;
  const colorClass = name ? getColorFromName(name) : 'bg-surface-200 text-surface-500';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-medium overflow-hidden',
        sizeStyles[size],
        !src && colorClass,
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image on error, show initials instead
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User className="w-1/2 h-1/2" />
      )}

      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-surface-800',
            statusSizeStyles[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

// Avatar Group for showing multiple avatars
interface AvatarGroupProps {
  users: Array<{ id: string; name: string; avatar?: string }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({ users, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayUsers.map((user) => (
        <Avatar
          key={user.id}
          src={user.avatar}
          name={user.name}
          size={size}
          className="ring-2 ring-white dark:ring-surface-800"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-medium ring-2 ring-white dark:ring-surface-800',
            sizeStyles[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
