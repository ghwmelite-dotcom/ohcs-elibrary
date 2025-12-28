import { motion } from 'framer-motion';
import {
  FileText,
  Video,
  Headphones,
  Dumbbell,
  Bookmark,
  BookmarkCheck,
  Clock,
  Eye,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { WellnessResource } from '@/types';

interface ResourceCardProps {
  resource: WellnessResource;
  onClick?: () => void;
  onBookmark?: () => void;
  variant?: 'default' | 'compact';
}

const typeIcons = {
  article: FileText,
  video: Video,
  audio: Headphones,
  exercise: Dumbbell,
};

const typeColors = {
  article: 'from-blue-500 to-blue-600',
  video: 'from-red-500 to-red-600',
  audio: 'from-purple-500 to-purple-600',
  exercise: 'from-green-500 to-green-600',
};

const categoryLabels: Record<string, string> = {
  stress: 'Stress Management',
  career: 'Career Growth',
  relationships: 'Relationships',
  mindfulness: 'Mindfulness',
  sleep: 'Sleep & Rest',
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function ResourceCard({
  resource,
  onClick,
  onBookmark,
  variant = 'default',
}: ResourceCardProps) {
  const Icon = typeIcons[resource.type];
  const color = typeColors[resource.type];

  if (variant === 'compact') {
    return (
      <motion.div
        onClick={onClick}
        className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className={cn(
          'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0',
          color
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {resource.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {categoryLabels[resource.category] || resource.category}
            {resource.duration && ` · ${resource.duration} min`}
          </p>
        </div>

        {onBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {resource.isBookmarked ? (
              <BookmarkCheck className="w-5 h-5 text-teal-500" />
            ) : (
              <Bookmark className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Thumbnail or colored header */}
      <div className={cn(
        'h-32 bg-gradient-to-br relative overflow-hidden',
        color
      )}>
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-12 h-12 text-white/50" />
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/30 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
          <Icon className="w-3 h-3" />
          <span className="capitalize">{resource.type}</span>
        </div>

        {/* Bookmark button */}
        {onBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            className="absolute top-2 right-2 p-2 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            {resource.isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-teal-400" />
            ) : (
              <Bookmark className="w-4 h-4 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category & Difficulty */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {categoryLabels[resource.category] || resource.category}
          </span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full capitalize',
            difficultyColors[resource.difficulty]
          )}>
            {resource.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
          {resource.title}
        </h3>

        {/* Description */}
        {resource.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {resource.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            {resource.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {resource.duration} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {resource.views.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
