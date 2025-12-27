import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ActivityData {
  date: string;
  count: number;
}

interface NotificationActivityChartProps {
  data: ActivityData[];
  className?: string;
}

export function NotificationActivityChart({ data, className }: NotificationActivityChartProps) {
  const { chartData, maxCount, trend, totalThisWeek } = useMemo(() => {
    // Ensure we have 7 days of data
    const last7Days: ActivityData[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existing = data.find(d => d.date === dateStr);
      last7Days.push({
        date: dateStr,
        count: existing?.count || 0
      });
    }

    const maxCount = Math.max(...last7Days.map(d => d.count), 1);
    const totalThisWeek = last7Days.reduce((sum, d) => sum + d.count, 0);

    // Calculate trend (compare last 3 days to first 3 days)
    const firstHalf = last7Days.slice(0, 3).reduce((sum, d) => sum + d.count, 0);
    const secondHalf = last7Days.slice(4).reduce((sum, d) => sum + d.count, 0);
    const trend = firstHalf === 0 ? 0 : Math.round(((secondHalf - firstHalf) / firstHalf) * 100);

    return { chartData: last7Days, maxCount, trend, totalThisWeek };
  }, [data]);

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  return (
    <div className={cn('bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Notification Activity</h3>
            <p className="text-sm text-surface-500">Last 7 days</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalThisWeek}</p>
            <p className="text-xs text-surface-500">This week</p>
          </div>
          {trend !== 0 && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
              trend > 0
                ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                : 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400'
            )}>
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-32">
        {chartData.map((day, index) => {
          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
          const isToday = index === chartData.length - 1;

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-full flex items-end justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 4)}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    'w-full max-w-[40px] rounded-t-lg relative group cursor-pointer transition-colors',
                    isToday
                      ? 'bg-gradient-to-t from-primary-500 to-primary-400'
                      : day.count > 0
                        ? 'bg-primary-200 dark:bg-primary-800 hover:bg-primary-300 dark:hover:bg-primary-700'
                        : 'bg-surface-100 dark:bg-surface-700'
                  )}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-900 dark:bg-surface-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.count} notification{day.count !== 1 ? 's' : ''}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-900 dark:border-t-surface-700" />
                  </div>

                  {/* Count Label (for higher bars) */}
                  {height > 50 && day.count > 0 && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium text-white"
                    >
                      {day.count}
                    </motion.span>
                  )}
                </motion.div>
              </div>

              {/* Day Label */}
              <span className={cn(
                'text-xs font-medium',
                isToday
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-surface-500'
              )}>
                {isToday ? 'Today' : getDayLabel(day.date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 flex items-center justify-center gap-6 text-xs text-surface-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary-200 dark:bg-primary-800" />
          <span>Past days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-t from-primary-500 to-primary-400" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
