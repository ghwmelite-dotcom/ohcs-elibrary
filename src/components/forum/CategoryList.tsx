import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Clock, ChevronRight, Pin } from 'lucide-react';
import { ForumCategory } from '@/types';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface CategoryListProps {
  categories: ForumCategory[];
}

export function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="space-y-4">
      {categories.map((category, index) => (
        <CategoryCard key={category.id} category={category} index={index} />
      ))}
    </div>
  );
}

interface CategoryCardProps {
  category: ForumCategory;
  index: number;
}

function CategoryCard({ category, index }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden hover:shadow-elevation-2 transition-shadow"
    >
      <Link to={`/forum/category/${category.id}`} className="block p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <span className="text-2xl">{category.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 group-hover:text-primary-600">
                {category.name}
              </h3>
              {category.isLocked && (
                <span className="text-xs px-2 py-0.5 bg-surface-200 dark:bg-surface-700 text-surface-500 rounded-full">
                  Locked
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
              {category.description}
            </p>

            {/* Stats */}
            <div className="mt-3 flex items-center gap-4 text-xs text-surface-500">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {category.topicCount} topics
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {category.postCount} posts
              </span>
            </div>
          </div>

          {/* Latest Activity */}
          <div className="hidden md:block text-right min-w-[200px]">
            {category.lastActivity ? (
              <>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                  {category.lastActivity.topicTitle}
                </p>
                <p className="text-xs text-surface-500 mt-1">
                  by {category.lastActivity.userName}
                </p>
                <p className="text-xs text-surface-400 flex items-center justify-end gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(category.lastActivity.timestamp)}
                </p>
              </>
            ) : (
              <p className="text-sm text-surface-400">No posts yet</p>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-surface-400 flex-shrink-0 self-center" />
        </div>
      </Link>
    </motion.div>
  );
}

interface CompactCategoryListProps {
  categories: ForumCategory[];
  selectedCategory?: string;
  onSelect?: (id: string | null) => void;
}

export function CompactCategoryList({
  categories,
  selectedCategory,
  onSelect,
}: CompactCategoryListProps) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">
          Categories
        </h3>
      </div>
      <nav className="p-2">
        <button
          onClick={() => onSelect?.(null)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            'hover:bg-surface-100 dark:hover:bg-surface-700',
            !selectedCategory &&
              'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          )}
        >
          <div className="w-8 h-8 bg-surface-200 dark:bg-surface-700 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-surface-500" />
          </div>
          <span className="text-sm font-medium flex-1 text-left">All Topics</span>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect?.(category.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              'hover:bg-surface-100 dark:hover:bg-surface-700',
              selectedCategory === category.id &&
                'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            )}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <span className="text-sm">{category.icon}</span>
            </div>
            <span className="text-sm font-medium flex-1 text-left truncate">
              {category.name}
            </span>
            <span className="text-xs text-surface-400">{category.topicCount}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
