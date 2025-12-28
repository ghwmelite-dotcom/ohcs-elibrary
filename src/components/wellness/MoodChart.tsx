import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { MoodEntry } from '@/types';

interface MoodChartProps {
  entries: MoodEntry[];
  days?: number;
  showLabels?: boolean;
}

const moodEmojis: Record<number, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

const moodColors: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-lime-500',
  5: 'bg-green-500',
};

export function MoodChart({ entries, days = 7, showLabels = true }: MoodChartProps) {
  // Create data points for the last N days
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const data: Array<{ date: Date; mood: number | null; entry?: MoodEntry }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const entry = entries.find(e => {
        try {
          if (!e?.createdAt) return false;
          return isSameDay(new Date(e.createdAt), date);
        } catch {
          return false;
        }
      });

      data.push({
        date,
        mood: entry?.mood || null,
        entry,
      });
    }

    return data;
  }, [entries, days]);

  // Calculate trend
  const trend = useMemo(() => {
    const recentMoods = chartData
      .filter(d => d.mood !== null)
      .slice(-3)
      .map(d => d.mood as number);

    if (recentMoods.length < 2) return 'neutral';

    const avg1 = recentMoods.slice(0, Math.floor(recentMoods.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(recentMoods.length / 2);
    const avg2 = recentMoods.slice(Math.floor(recentMoods.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(recentMoods.length / 2);

    if (avg2 > avg1 + 0.3) return 'up';
    if (avg2 < avg1 - 0.3) return 'down';
    return 'neutral';
  }, [chartData]);

  // Calculate average mood
  const averageMood = useMemo(() => {
    const moods = chartData.filter(d => d.mood !== null).map(d => d.mood as number);
    if (moods.length === 0) return null;
    return Math.round(moods.reduce((a, b) => a + b, 0) / moods.length * 10) / 10;
  }, [chartData]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Mood Tracker</h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Last {days} days</p>
        </div>

        {averageMood && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl">{moodEmojis[Math.round(averageMood)]}</span>
            <div className="text-right">
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {averageMood.toFixed(1)}
              </div>
              <div className={cn('flex items-center gap-1 text-[10px] sm:text-xs', trendColor)}>
                <TrendIcon className="w-3 h-3" />
                <span className="capitalize">{trend}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative h-24 sm:h-32">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[5, 4, 3, 2, 1].map(level => (
            <div key={level} className="flex items-center">
              {showLabels && (
                <span className="text-xs text-gray-400 w-4">{level}</span>
              )}
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700 ml-2" />
            </div>
          ))}
        </div>

        {/* Data points */}
        <div className="absolute inset-0 flex items-end justify-around pt-4 pb-2" style={{ paddingLeft: showLabels ? '1.5rem' : 0 }}>
          {chartData.map((data, index) => (
            <div key={index} className="flex flex-col items-center gap-1 flex-1">
              {data.mood ? (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.mood / 5) * 100}%` }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="relative flex flex-col items-center justify-end"
                  style={{ height: `${(data.mood / 5) * 100}%` }}
                >
                  <motion.div
                    className={cn(
                      'w-3 h-3 rounded-full shadow-md',
                      moodColors[data.mood]
                    )}
                    whileHover={{ scale: 1.3 }}
                    title={`${format(data.date, 'MMM d')}: ${moodEmojis[data.mood]}`}
                  />
                </motion.div>
              ) : (
                <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 opacity-30" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Day labels */}
      <div className="flex justify-around mt-2" style={{ paddingLeft: showLabels ? '1.5rem' : 0 }}>
        {chartData.map((data, index) => (
          <div key={index} className="flex-1 text-center">
            <span className="text-xs text-gray-400">
              {format(data.date, 'EEE')}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        {[1, 3, 5].map(mood => (
          <div key={mood} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', moodColors[mood])} />
            <span className="text-xs text-gray-500">{moodEmojis[mood]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
