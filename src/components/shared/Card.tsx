import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghana' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const variantStyles = {
  default: 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700',
  elevated: 'bg-white dark:bg-surface-800 shadow-elevation-2',
  outlined: 'bg-transparent border-2 border-surface-200 dark:border-surface-700',
  ghana: 'bg-white dark:bg-surface-800 shadow-elevation-2 border border-primary-100 dark:border-primary-900/30',
  glass: 'bg-white/80 dark:bg-surface-800/80 backdrop-blur-md border border-surface-200/50 dark:border-surface-700/50',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden transition-all duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        hoverable && 'hover:shadow-elevation-3 hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Card Footer
interface CardFooterProps {
  children: ReactNode;
  className?: string;
  divided?: boolean;
}

export function CardFooter({ children, className, divided = false }: CardFooterProps) {
  return (
    <div
      className={cn(
        'mt-4',
        divided && 'pt-4 border-t border-surface-200 dark:border-surface-700',
        className
      )}
    >
      {children}
    </div>
  );
}

// Stat Card for dashboards
interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, change, icon, className }: StatCardProps) {
  return (
    <Card variant="elevated" className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                'mt-1 text-sm font-medium',
                change.type === 'increase' ? 'text-success-600' : 'text-error-600'
              )}
            >
              {change.type === 'increase' ? '+' : '-'}
              {Math.abs(change.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
