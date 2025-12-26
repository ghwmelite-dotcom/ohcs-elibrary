import { motion } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  Users,
  Award,
  TrendingUp,
  Eye,
  ThumbsUp,
  Flame
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface ProfileStatsProps {
  stats: {
    documents: number;
    forumPosts: number;
    forumReplies: number;
    groups: number;
    badges: number;
    followers: number;
    following: number;
    views?: number;
    upvotes?: number;
    streak?: number;
  };
  layout?: 'horizontal' | 'grid';
}

export function ProfileStats({ stats, layout = 'horizontal' }: ProfileStatsProps) {
  const primaryStats = [
    { label: 'Documents', value: stats.documents, icon: FileText },
    { label: 'Forum Posts', value: stats.forumPosts, icon: MessageSquare },
    { label: 'Groups', value: stats.groups, icon: Users },
    { label: 'Badges', value: stats.badges, icon: Award },
  ];

  const socialStats = [
    { label: 'Followers', value: stats.followers },
    { label: 'Following', value: stats.following },
  ];

  if (layout === 'grid') {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
          Statistics
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {primaryStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span className="text-xs text-surface-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {stat.value.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Social Stats */}
        <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
          {socialStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-bold text-surface-900 dark:text-surface-50">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-surface-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Additional Stats */}
        {(stats.views !== undefined || stats.upvotes !== undefined || stats.streak !== undefined) && (
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            {stats.views !== undefined && (
              <div className="text-center p-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                <Eye className="w-4 h-4 text-surface-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                  {stats.views.toLocaleString()}
                </p>
                <p className="text-xs text-surface-500">Views</p>
              </div>
            )}
            {stats.upvotes !== undefined && (
              <div className="text-center p-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                <ThumbsUp className="w-4 h-4 text-surface-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                  {stats.upvotes.toLocaleString()}
                </p>
                <p className="text-xs text-surface-500">Upvotes</p>
              </div>
            )}
            {stats.streak !== undefined && (
              <div className="text-center p-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                  {stats.streak}
                </p>
                <p className="text-xs text-surface-500">Day Streak</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
      <div className="flex items-center justify-around">
        {primaryStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <stat.icon className="w-5 h-5 text-primary-600 dark:text-primary-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-surface-900 dark:text-surface-50">
              {stat.value.toLocaleString()}
            </p>
            <p className="text-xs text-surface-500">{stat.label}</p>
          </motion.div>
        ))}

        <div className="w-px h-12 bg-surface-200 dark:bg-surface-700" />

        {socialStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (primaryStats.length + index) * 0.1 }}
            className="text-center"
          >
            <p className="text-xl font-bold text-surface-900 dark:text-surface-50">
              {stat.value.toLocaleString()}
            </p>
            <p className="text-xs text-surface-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface QuickStatsCardProps {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  change?: number;
  color?: string;
}

export function QuickStatsCard({
  icon: Icon,
  label,
  value,
  change,
  color = 'primary',
}: QuickStatsCardProps) {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
    secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400',
    success: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
    accent: 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400',
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-surface-500">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-surface-900 dark:text-surface-50">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change !== undefined && (
              <span
                className={cn(
                  'text-xs font-medium',
                  change >= 0 ? 'text-success-600' : 'text-error-600'
                )}
              >
                {change >= 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
