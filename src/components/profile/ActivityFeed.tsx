import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  Users,
  Award,
  ThumbsUp,
  Eye,
  BookOpen,
  UserPlus,
  Zap,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface Activity {
  id: string;
  type:
    | 'document_upload'
    | 'document_read'
    | 'forum_post'
    | 'forum_reply'
    | 'forum_upvote'
    | 'group_join'
    | 'group_post'
    | 'badge_earned'
    | 'level_up'
    | 'follow';
  title: string;
  description?: string;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  showViewAll?: boolean;
}

export function ActivityFeed({
  activities,
  maxItems,
  showViewAll = true,
}: ActivityFeedProps) {
  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'document_upload':
        return { icon: FileText, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' };
      case 'document_read':
        return { icon: BookOpen, color: 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400' };
      case 'forum_post':
      case 'forum_reply':
        return { icon: MessageSquare, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' };
      case 'forum_upvote':
        return { icon: ThumbsUp, color: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400' };
      case 'group_join':
      case 'group_post':
        return { icon: Users, color: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400' };
      case 'badge_earned':
        return { icon: Award, color: 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400' };
      case 'level_up':
        return { icon: TrendingUp, color: 'bg-gradient-to-br from-secondary-400 to-secondary-600 text-white' };
      case 'follow':
        return { icon: UserPlus, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' };
      default:
        return { icon: Zap, color: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400' };
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'document_upload':
        return 'uploaded a document';
      case 'document_read':
        return 'read a document';
      case 'forum_post':
        return 'created a forum topic';
      case 'forum_reply':
        return 'replied to a topic';
      case 'forum_upvote':
        return 'received an upvote';
      case 'group_join':
        return 'joined a group';
      case 'group_post':
        return 'posted in a group';
      case 'badge_earned':
        return 'earned a badge';
      case 'level_up':
        return 'leveled up';
      case 'follow':
        return 'started following';
      default:
        return '';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-8 text-center">
        <Zap className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
        <p className="text-surface-600 dark:text-surface-400">
          No activity yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Zap className="w-5 h-5 text-secondary-500" />
          Recent Activity
        </h3>
      </div>

      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {displayedActivities.map((activity, index) => {
          const { icon: Icon, color } = getActivityIcon(activity.type);

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-700 dark:text-surface-300">
                    <span className="text-surface-500">{getActivityText(activity)}</span>
                  </p>
                  {activity.link ? (
                    <Link
                      to={activity.link}
                      className="text-sm font-medium text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-1"
                    >
                      {activity.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50 line-clamp-1">
                      {activity.title}
                    </p>
                  )}
                  {activity.description && (
                    <p className="text-xs text-surface-500 mt-1 line-clamp-1">
                      {activity.description}
                    </p>
                  )}
                </div>

                {/* Time */}
                <span className="text-xs text-surface-400 flex-shrink-0">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {showViewAll && maxItems && activities.length > maxItems && (
        <div className="p-3 border-t border-surface-200 dark:border-surface-700 text-center">
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-surface-200 dark:bg-surface-700" />

      <div className="space-y-6">
        {activities.map((activity, index) => {
          const { icon: Icon, color } = getActivityIcon(activity.type);

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex gap-4"
            >
              {/* Icon */}
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center z-10', color)}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 bg-white dark:bg-surface-800 rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-surface-400 flex-shrink-0">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'document_upload':
      return { icon: FileText, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' };
    case 'document_read':
      return { icon: BookOpen, color: 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400' };
    case 'forum_post':
    case 'forum_reply':
      return { icon: MessageSquare, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' };
    case 'forum_upvote':
      return { icon: ThumbsUp, color: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400' };
    case 'group_join':
    case 'group_post':
      return { icon: Users, color: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400' };
    case 'badge_earned':
      return { icon: Award, color: 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400' };
    case 'level_up':
      return { icon: TrendingUp, color: 'bg-gradient-to-br from-secondary-400 to-secondary-600 text-white' };
    case 'follow':
      return { icon: UserPlus, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' };
    default:
      return { icon: Zap, color: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400' };
  }
}
