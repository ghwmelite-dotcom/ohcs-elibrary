import { motion } from 'framer-motion';
import { MessageSquare, Users, Eye, TrendingUp, Award, Clock } from 'lucide-react';
import { Avatar, AvatarGroup } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

interface ForumStatsProps {
  stats: {
    totalTopics: number;
    totalPosts: number;
    totalMembers: number;
    onlineMembers: number;
    todayTopics: number;
    todayPosts: number;
  };
  topContributors?: {
    id: string;
    name: string;
    avatar?: string;
    postCount: number;
  }[];
  onlineUsers?: {
    id: string;
    name: string;
    avatar?: string;
  }[];
}

export function ForumStats({ stats, topContributors = [], onlineUsers = [] }: ForumStatsProps) {
  const statItems = [
    { label: 'Topics', value: stats.totalTopics, icon: MessageSquare, color: 'primary' },
    { label: 'Posts', value: stats.totalPosts, icon: MessageSquare, color: 'secondary' },
    { label: 'Members', value: stats.totalMembers, icon: Users, color: 'accent' },
    { label: 'Online Now', value: stats.onlineMembers, icon: Eye, color: 'success' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
          Forum Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
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
                    'bg-accent-100 dark:bg-accent-900/30 text-accent-600',
                  stat.color === 'success' &&
                    'bg-success-100 dark:bg-success-900/30 text-success-600'
                )}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-50">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs text-surface-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Today's Activity */}
        <div className="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-success-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              Today's Activity
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-500">New topics</span>
            <span className="font-medium text-surface-700 dark:text-surface-300">
              +{stats.todayTopics}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-surface-500">New posts</span>
            <span className="font-medium text-surface-700 dark:text-surface-300">
              +{stats.todayPosts}
            </span>
          </div>
        </div>
      </div>

      {/* Top Contributors */}
      {topContributors.length > 0 && (
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-secondary-500" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              Top Contributors
            </h3>
          </div>
          <div className="space-y-3">
            {topContributors.slice(0, 5).map((user, index) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 && 'bg-secondary-500 text-white',
                    index === 1 && 'bg-surface-400 text-white',
                    index === 2 && 'bg-orange-500 text-white',
                    index > 2 && 'bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-300'
                  )}
                >
                  {index + 1}
                </span>
                <Avatar src={user.avatar} name={user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                    {user.name}
                  </p>
                </div>
                <span className="text-sm text-surface-500">
                  {user.postCount} posts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                Online Now
              </h3>
            </div>
            <span className="text-sm text-surface-500">
              {onlineUsers.length} users
            </span>
          </div>
          <AvatarGroup
            users={onlineUsers.map((user) => ({
              id: user.id,
              name: user.name,
              avatar: user.avatar,
            }))}
            max={8}
            size="sm"
          />
          {onlineUsers.length > 8 && (
            <p className="text-xs text-surface-400 mt-3">
              and {onlineUsers.length - 8} more...
            </p>
          )}
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
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <span className="text-2xl">{category.icon}</span>
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
