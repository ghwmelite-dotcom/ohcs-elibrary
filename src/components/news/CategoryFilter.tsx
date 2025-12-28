import { motion } from 'framer-motion';
import {
  Landmark,
  TrendingUp,
  Heart,
  GraduationCap,
  Cpu,
  Globe,
  Trophy,
  Newspaper,
  CheckCircle2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface NewsCategory {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

interface CategoryFilterProps {
  categories: NewsCategory[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearAll?: () => void;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onCategoryToggle,
  onClearAll,
}: CategoryFilterProps) {
  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, typeof Newspaper> = {
      'government': Landmark,
      'economy': TrendingUp,
      'health': Heart,
      'education': GraduationCap,
      'technology': Cpu,
      'international': Globe,
      'sports': Trophy,
    };
    return icons[iconName] || Newspaper;
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">
          Categories
        </h3>
        {selectedCategories.length > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-1">
        {/* All News Option */}
        <button
          onClick={onClearAll}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
            selectedCategories.length === 0
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300'
          )}
        >
          <Newspaper className="w-5 h-5" />
          <span className="flex-1 font-medium">All News</span>
          {selectedCategories.length === 0 && (
            <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          )}
        </button>

        {/* Category List */}
        {categories.map((category, index) => {
          const Icon = getCategoryIcon(category.icon);
          const isSelected = selectedCategories.includes(category.id);

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onCategoryToggle(category.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 font-medium">{category.name}</span>
              {category.count !== undefined && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isSelected
                    ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                )}>
                  {category.count}
                </span>
              )}
              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface SourceFilterProps {
  sources: { id: string; name: string; icon?: string; url?: string; count?: number }[];
  selectedSources: string[];
  onSourceToggle: (sourceId: string) => void;
  onSourceRefresh?: (sourceId: string) => void;
  onClearAll?: () => void;
  isRefreshing?: string | null;
}

export function SourceFilter({
  sources,
  selectedSources,
  onSourceToggle,
  onSourceRefresh,
  onClearAll,
  isRefreshing,
}: SourceFilterProps) {
  const handleViewSource = (e: React.MouseEvent, url?: string) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRefreshSource = (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    onSourceRefresh?.(sourceId);
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">
          News Sources
        </h3>
        {selectedSources.length > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-1">
        {sources.map((source, index) => {
          const isSelected = selectedSources.includes(source.id);
          const isSourceRefreshing = isRefreshing === source.id;

          return (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group relative"
            >
              <button
                onClick={() => onSourceToggle(source.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300'
                )}
              >
                {source.icon ? (
                  <img
                    src={source.icon}
                    alt={source.name}
                    className="w-5 h-5 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-5 h-5 bg-surface-200 dark:bg-surface-600 rounded flex items-center justify-center text-xs font-bold">
                    {source.name.charAt(0)}
                  </div>
                )}
                <span className="flex-1 font-medium truncate">{source.name}</span>

                {/* Hover action buttons */}
                <div className="hidden group-hover:flex items-center gap-1 absolute right-2">
                  {source.url && (
                    <button
                      onClick={(e) => handleViewSource(e, source.url)}
                      className="p-1.5 rounded-md bg-surface-100 dark:bg-surface-600 hover:bg-surface-200 dark:hover:bg-surface-500 text-surface-600 dark:text-surface-300 transition-colors"
                      title={`Visit ${source.name}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onSourceRefresh && (
                    <button
                      onClick={(e) => handleRefreshSource(e, source.id)}
                      disabled={isSourceRefreshing}
                      className={cn(
                        'p-1.5 rounded-md bg-surface-100 dark:bg-surface-600 hover:bg-surface-200 dark:hover:bg-surface-500 text-surface-600 dark:text-surface-300 transition-colors',
                        isSourceRefreshing && 'opacity-50 cursor-not-allowed'
                      )}
                      title={`Refresh ${source.name}`}
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isSourceRefreshing && 'animate-spin')} />
                    </button>
                  )}
                </div>

                {/* Count badge - hidden on hover to make room for action buttons */}
                {source.count !== undefined && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full group-hover:hidden',
                    isSelected
                      ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                  )}>
                    {source.count}
                  </span>
                )}
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 group-hover:hidden" />
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
