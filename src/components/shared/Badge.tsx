import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
  success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  error: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300',
  info: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300',
  outline: 'bg-transparent border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300',
};

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-info-500',
  outline: 'bg-surface-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  icon,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="flex-shrink-0 ml-0.5 -mr-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Remove"
        >
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </button>
      )}
    </span>
  );
}

// Status badge for showing user/item status
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'online' | 'offline';
  showDot?: boolean;
}

const statusConfig: Record<StatusBadgeProps['status'], { variant: BadgeVariant; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'outline', label: 'Inactive' },
  pending: { variant: 'warning', label: 'Pending' },
  suspended: { variant: 'error', label: 'Suspended' },
  online: { variant: 'success', label: 'Online' },
  offline: { variant: 'outline', label: 'Offline' },
};

export function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} dot={showDot} size="sm">
      {config.label}
    </Badge>
  );
}

// Role badge for displaying user roles
interface RoleBadgeProps {
  role: string;
}

const roleColors: Record<string, BadgeVariant> = {
  super_admin: 'error',
  admin: 'primary',
  director: 'info',
  librarian: 'success',
  moderator: 'warning',
  contributor: 'secondary',
  user: 'outline',
  guest: 'outline',
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const variant = roleColors[role] || 'outline';
  const label = role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Badge variant={variant} size="sm">
      {label}
    </Badge>
  );
}

// Category badge for documents/forum
interface CategoryBadgeProps {
  category: string;
  color?: string;
}

export function CategoryBadge({ category, color }: CategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      size="sm"
      style={color ? { borderColor: color, color } : undefined}
    >
      {category}
    </Badge>
  );
}
