import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  FileText,
  GraduationCap,
  Laptop,
  MapPin,
  Megaphone,
  Lightbulb,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  FileText,
  GraduationCap,
  Laptop,
  Users,
  MapPin,
  Megaphone,
  Lightbulb,
};

function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || MessageSquare;
}

interface ForumStatsProps {
  stats: {
    totalTopics: number;
    totalPosts: number;
    totalMembers: number;
    todayTopics: number;
    todayPosts: number;
  };
}

export function ForumStats({ stats }: ForumStatsProps) {
  const statItems = [
    { label: 'Topics', value: stats.totalTopics, icon: MessageSquare, color: 'primary' },
    { label: 'Posts', value: stats.totalPosts, icon: FileText, color: 'secondary' },
    { label: 'Members', value: stats.totalMembers, icon: Users, color: 'accent' },
  ];

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4 sm:p-6">
      <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
        Forum Statistics
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2',
                stat.color === 'primary' &&
                  'bg-primary-100 dark:bg-primary-900/30 text-primary-600',
                stat.color === 'secondary' &&
                  'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600',
                stat.color === 'accent' &&
                  'bg-accent-100 dark:bg-accent-900/30 text-accent-600'
              )}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-50">
              {stat.value.toLocaleString()}
            </p>
            <p className="text-xs text-surface-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Today's Activity */}
      {(stats.todayTopics > 0 || stats.todayPosts > 0) && (
        <div className="mt-5 pt-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-success-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              Today's Activity
            </span>
          </div>
          {stats.todayTopics > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-500">New topics</span>
              <span className="font-medium text-success-600 dark:text-success-400">
                +{stats.todayTopics}
              </span>
            </div>
          )}
          {stats.todayPosts > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-surface-500">New posts</span>
              <span className="font-medium text-success-600 dark:text-success-400">
                +{stats.todayPosts}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no activity */}
      {stats.totalTopics === 0 && stats.totalPosts === 0 && (
        <div className="mt-5 pt-4 border-t border-surface-200 dark:border-surface-700">
          <p className="text-sm text-surface-500 text-center">
            Be the first to start a discussion!
          </p>
        </div>
      )}
    </div>
  );
}

interface CategoryStatsProps {
  category: {
    name: string;
    icon: string;
    color: string;
    topicCount: number;
    postCount: number;
    lastActivity?: {
      topicTitle: string;
      userName: string;
      timestamp: string;
    };
  };
}

export function CategoryStats({ category }: CategoryStatsProps) {
  const IconComponent = getIconComponent(category.icon || 'MessageSquare');

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <IconComponent className="w-6 h-6" style={{ color: category.color }} />
        </div>
        <div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            {category.name}
          </h3>
          <p className="text-sm text-surface-500">Category Statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {category.topicCount}
          </p>
          <p className="text-xs text-surface-500">Topics</p>
        </div>
        <div className="text-center p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {category.postCount}
          </p>
          <p className="text-xs text-surface-500">Posts</p>
        </div>
      </div>

      {category.lastActivity && (
        <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2 text-xs text-surface-500 mb-2">
            <Clock className="w-3.5 h-3.5" />
            Latest Activity
          </div>
          <p className="text-sm font-medium text-surface-900 dark:text-surface-50 line-clamp-1">
            {category.lastActivity.topicTitle}
          </p>
          <p className="text-xs text-surface-500 mt-1">
            by {category.lastActivity.userName}
          </p>
        </div>
      )}
    </div>
  );
}
