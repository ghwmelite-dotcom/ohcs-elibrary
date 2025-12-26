import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon: Icon,
  color = 'primary',
  trend,
}: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
    secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400',
    success: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
    error: 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400',
    info: 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400',
  };

  const getTrendIcon = () => {
    if (trend === 'up' || (change !== undefined && change > 0)) {
      return <TrendingUp className="w-4 h-4" />;
    }
    if (trend === 'down' || (change !== undefined && change < 0)) {
      return <TrendingDown className="w-4 h-4" />;
    }
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up' || (change !== undefined && change > 0)) {
      return 'text-success-600 dark:text-success-400';
    }
    if (trend === 'down' || (change !== undefined && change < 0)) {
      return 'text-error-600 dark:text-error-400';
    }
    return 'text-surface-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {change !== undefined && (
        <div className={cn('flex items-center gap-1 mt-4 text-sm', getTrendColor())}>
          {getTrendIcon()}
          <span className="font-medium">
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="text-surface-500 ml-1">{changeLabel}</span>
        </div>
      )}
    </motion.div>
  );
}

interface MiniStatCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
}

export function MiniStatCard({ label, value, icon: Icon }: MiniStatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
      {Icon && (
        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
      )}
      <div>
        <p className="text-xs text-surface-500">{label}</p>
        <p className="font-semibold text-surface-900 dark:text-surface-50">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}
