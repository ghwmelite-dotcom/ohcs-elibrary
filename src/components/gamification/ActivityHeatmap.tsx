import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Flame } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ActivityData {
  date: string;
  xpEarned: number;
  activityCount: number;
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  weeks?: number;
}

export function ActivityHeatmap({ data, weeks = 12 }: ActivityHeatmapProps) {
  const { grid, maxXP, totalXP, activeDays } = useMemo(() => {
    const today = new Date();
    const daysToShow = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToShow + 1);

    // Create a map of date to data
    const dataMap = new Map<string, ActivityData>();
    data.forEach((d) => {
      dataMap.set(d.date, d);
    });

    // Find max XP for color scaling
    let maxXP = 0;
    let totalXP = 0;
    let activeDays = 0;
    data.forEach((d) => {
      if (d.xpEarned > maxXP) maxXP = d.xpEarned;
      totalXP += d.xpEarned;
      if (d.xpEarned > 0) activeDays++;
    });

    // Generate grid (weeks as columns, days as rows)
    const grid: (ActivityData | null)[][] = [];

    for (let week = 0; week < weeks; week++) {
      const weekData: (ActivityData | null)[] = [];

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);

        if (currentDate > today) {
          weekData.push(null);
        } else {
          const dateStr = currentDate.toISOString().split('T')[0];
          weekData.push(dataMap.get(dateStr) || { date: dateStr, xpEarned: 0, activityCount: 0 });
        }
      }

      grid.push(weekData);
    }

    return { grid, maxXP, totalXP, activeDays };
  }, [data, weeks]);

  const getColor = (xp: number) => {
    if (xp === 0) return 'bg-surface-100 dark:bg-surface-700';
    const intensity = maxXP > 0 ? xp / maxXP : 0;
    if (intensity < 0.25) return 'bg-primary-200 dark:bg-primary-900';
    if (intensity < 0.5) return 'bg-primary-300 dark:bg-primary-700';
    if (intensity < 0.75) return 'bg-primary-400 dark:bg-primary-600';
    return 'bg-primary-500 dark:bg-primary-500';
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Activity Overview</h3>
            <p className="text-sm text-surface-500">Last {weeks} weeks</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="font-bold text-primary-600 dark:text-primary-400">{totalXP.toLocaleString()}</p>
            <p className="text-surface-500">Total XP</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <p className="font-bold text-orange-600 dark:text-orange-400">{activeDays}</p>
            </div>
            <p className="text-surface-500">Active Days</p>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-2 text-xs text-surface-400">
          {dayLabels.map((day, i) => (
            <div key={i} className="h-3 flex items-center">
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1 overflow-x-auto">
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <div
                      key={dayIndex}
                      className="w-3 h-3 rounded-sm bg-transparent"
                    />
                  );
                }

                return (
                  <motion.div
                    key={dayIndex}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.003 }}
                    className={cn(
                      'w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-125',
                      getColor(day.xpEarned)
                    )}
                    title={`${day.date}: ${day.xpEarned} XP earned`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-surface-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-surface-100 dark:bg-surface-700" />
          <div className="w-3 h-3 rounded-sm bg-primary-200 dark:bg-primary-900" />
          <div className="w-3 h-3 rounded-sm bg-primary-300 dark:bg-primary-700" />
          <div className="w-3 h-3 rounded-sm bg-primary-400 dark:bg-primary-600" />
          <div className="w-3 h-3 rounded-sm bg-primary-500 dark:bg-primary-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
