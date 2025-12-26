import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Eye,
  ThumbsUp,
  Clock,
  Pin,
  Lock,
  CheckCircle,
  Flame,
} from 'lucide-react';
import { ForumTopic, ForumCategory } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface TopicCardProps {
  topic: ForumTopic;
  category?: ForumCategory;
  index?: number;
}

export function TopicCard({ topic, category, index = 0 }: TopicCardProps) {
  const isHot = topic.viewCount > 100 || topic.replyCount > 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 hover:shadow-elevation-2 transition-all p-4',
        topic.isPinned && 'ring-2 ring-primary-500/20'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Author Avatar */}
        <Avatar
          src={topic.author.avatar}
          name={topic.author.name}
          size="md"
          className="flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {topic.isPinned && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}
            {topic.isLocked && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 rounded-full">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
            {topic.hasBestAnswer && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Solved
              </span>
            )}
            {isHot && !topic.isPinned && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded-full">
                <Flame className="w-3 h-3" />
                Hot
              </span>
            )}
          </div>

          {/* Title */}
          <Link
            to={`/forum/topic/${topic.id}`}
            className="block mt-1 font-semibold text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2"
          >
            {topic.title}
          </Link>

          {/* Preview */}
          <p className="mt-1 text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
            {topic.preview}
          </p>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-surface-500">
            <span>
              by{' '}
              <Link
                to={`/profile/${topic.author.id}`}
                className="font-medium text-surface-700 dark:text-surface-300 hover:text-primary-600"
              >
                {topic.author.name}
              </Link>
            </span>

            {category && (
              <span
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.name}
              </span>
            )}

            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeTime(topic.createdAt)}
            </span>

            {/* Tags */}
            {topic.tags && topic.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {topic.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
                {topic.tags.length > 3 && (
                  <span className="text-surface-400">+{topic.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <div className="text-center min-w-[50px]">
            <div className="flex items-center justify-center gap-1 text-surface-500">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium text-surface-700 dark:text-surface-300">
                {topic.replyCount}
              </span>
            </div>
            <p className="text-xs text-surface-400 mt-0.5">replies</p>
          </div>
          <div className="text-center min-w-[50px]">
            <div className="flex items-center justify-center gap-1 text-surface-500">
              <Eye className="w-4 h-4" />
              <span className="font-medium text-surface-700 dark:text-surface-300">
                {topic.viewCount}
              </span>
            </div>
            <p className="text-xs text-surface-400 mt-0.5">views</p>
          </div>
          <div className="text-center min-w-[50px]">
            <div className="flex items-center justify-center gap-1 text-surface-500">
              <ThumbsUp className="w-4 h-4" />
              <span className="font-medium text-surface-700 dark:text-surface-300">
                {topic.likeCount}
              </span>
            </div>
            <p className="text-xs text-surface-400 mt-0.5">likes</p>
          </div>
        </div>

        {/* Last Reply */}
        <div className="hidden lg:block text-right min-w-[140px]">
          {topic.lastReply ? (
            <>
              <div className="flex items-center justify-end gap-2">
                <Avatar
                  src={topic.lastReply.author.avatar}
                  name={topic.lastReply.author.name}
                  size="xs"
                />
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate max-w-[100px]">
                  {topic.lastReply.author.name}
                </span>
              </div>
              <p className="text-xs text-surface-400 mt-1 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(topic.lastReply.createdAt)}
              </p>
            </>
          ) : (
            <p className="text-sm text-surface-400">No replies</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
