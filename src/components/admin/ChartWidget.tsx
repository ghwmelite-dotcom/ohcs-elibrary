import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChartWidgetProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function ChartWidget({ title, subtitle, children, action }: ChartWidgetProps) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-surface-500 mt-1">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  showValues?: boolean;
}

export function SimpleBarChart({ data, maxValue, showValues = true }: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-surface-600 dark:text-surface-400">
              {item.label}
            </span>
            {showValues && (
              <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                {item.value.toLocaleString()}
              </span>
            )}
          </div>
          <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                'h-full rounded-full',
                item.color || 'bg-primary-600'
              )}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface SimpleLineChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
}

export function SimpleLineChart({
  data,
  labels,
  color = 'stroke-primary-600',
  height = 100,
}: SimpleLineChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - ((value - min) / range) * 100,
  }));

  const pathD = points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    )
    .join(' ');

  return (
    <div className="relative" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" className="stroke-surface-200 dark:stroke-surface-700" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" className="stroke-surface-200 dark:stroke-surface-700" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" className="stroke-surface-200 dark:stroke-surface-700" strokeWidth="0.5" />

        {/* Area fill */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          d={`${pathD} L 100 100 L 0 100 Z`}
          className="fill-primary-600"
        />

        {/* Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
          d={pathD}
          fill="none"
          className={cn(color)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Points */}
        {points.map((point, index) => (
          <motion.circle
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + index * 0.05 }}
            cx={point.x}
            cy={point.y}
            r="1.5"
            className="fill-primary-600"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {labels && (
        <div className="flex justify-between mt-2">
          {labels.map((label, index) => (
            <span key={index} className="text-xs text-surface-500">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
}

export function DonutChart({
  data,
  size = 120,
  strokeWidth = 20,
  showLegend = true,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = (percentage / 100) * circumference;
            const strokeDashoffset = -currentOffset;
            currentOffset += strokeDasharray;

            return (
              <motion.circle
                key={index}
                initial={{ strokeDasharray: 0 }}
                animate={{ strokeDasharray }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              {total.toLocaleString()}
            </p>
            <p className="text-xs text-surface-500">Total</p>
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-surface-600 dark:text-surface-400">
                {item.label}
              </span>
              <span className="text-sm font-medium text-surface-900 dark:text-surface-50 ml-auto">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
  weeks?: number;
}

export function ActivityHeatmap({ data, weeks = 12 }: ActivityHeatmapProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxCount = Math.max(...data.map((d) => d.count));

  const getColor = (count: number) => {
    if (count === 0) return 'bg-surface-200 dark:bg-surface-700';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'bg-primary-200 dark:bg-primary-900';
    if (intensity < 0.5) return 'bg-primary-400 dark:bg-primary-700';
    if (intensity < 0.75) return 'bg-primary-500 dark:bg-primary-600';
    return 'bg-primary-600 dark:bg-primary-500';
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pr-2">
          {days.map((day, i) => (
            <div key={i} className="h-3 text-xs text-surface-500 leading-3">
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Cells */}
        {[...Array(weeks)].map((_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {days.map((_, dayIndex) => {
              const dataIndex = weekIndex * 7 + dayIndex;
              const item = data[dataIndex];
              return (
                <motion.div
                  key={dayIndex}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.005 }}
                  className={cn(
                    'w-3 h-3 rounded-sm',
                    getColor(item?.count || 0)
                  )}
                  title={item ? `${item.date}: ${item.count}` : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-surface-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-surface-200 dark:bg-surface-700" />
          <div className="w-3 h-3 rounded-sm bg-primary-200 dark:bg-primary-900" />
          <div className="w-3 h-3 rounded-sm bg-primary-400 dark:bg-primary-700" />
          <div className="w-3 h-3 rounded-sm bg-primary-500 dark:bg-primary-600" />
          <div className="w-3 h-3 rounded-sm bg-primary-600 dark:bg-primary-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
