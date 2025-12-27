import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  trend?: number;
  description?: string;
  animate?: boolean;
  delay?: number;
}

const colorClasses = {
  primary: {
    bg: 'from-primary-400 to-primary-600',
    text: 'text-primary-600 dark:text-primary-400',
    light: 'bg-primary-50 dark:bg-primary-900/20',
  },
  secondary: {
    bg: 'from-secondary-400 to-secondary-600',
    text: 'text-secondary-600 dark:text-secondary-400',
    light: 'bg-secondary-50 dark:bg-secondary-900/20',
  },
  success: {
    bg: 'from-success-400 to-success-600',
    text: 'text-success-600 dark:text-success-400',
    light: 'bg-success-50 dark:bg-success-900/20',
  },
  warning: {
    bg: 'from-orange-400 to-orange-600',
    text: 'text-orange-600 dark:text-orange-400',
    light: 'bg-orange-50 dark:bg-orange-900/20',
  },
  error: {
    bg: 'from-error-400 to-error-600',
    text: 'text-error-600 dark:text-error-400',
    light: 'bg-error-50 dark:bg-error-900/20',
  },
};

function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const endValue = value;

    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * endValue);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
}

export function StatsCard({
  title,
  value,
  suffix = '',
  prefix = '',
  icon: Icon,
  color,
  trend,
  description,
  animate = true,
  delay = 0,
}: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-5 relative overflow-hidden group hover:shadow-elevation-2 transition-shadow"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10">
        <Icon className="w-full h-full" />
      </div>

      <div className="relative z-10">
        {/* Icon */}
        <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', colors.bg)}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Title */}
        <p className="text-sm text-surface-500 mb-1">{title}</p>

        {/* Value */}
        <div className="flex items-end gap-2">
          <p className={cn('text-3xl font-bold', colors.text)}>
            {prefix}
            {animate ? <AnimatedNumber value={value} /> : value.toLocaleString()}
            {suffix}
          </p>

          {/* Trend */}
          {trend !== undefined && trend !== 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.3 }}
              className={cn(
                'text-sm font-medium px-1.5 py-0.5 rounded',
                trend > 0 ? 'text-success-600 bg-success-50 dark:bg-success-900/20' : 'text-error-600 bg-error-50 dark:bg-error-900/20'
              )}
            >
              {trend > 0 ? '+' : ''}{trend}%
            </motion.span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-surface-400 mt-1">{description}</p>
        )}
      </div>

      {/* Hover Effect */}
      <motion.div
        className={cn('absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity', colors.light)}
      />
    </motion.div>
  );
}

export function StatsCardGrid({ children, columns = 4 }: { children: React.ReactNode; columns?: 2 | 3 | 4 }) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns])}>
      {children}
    </div>
  );
}
