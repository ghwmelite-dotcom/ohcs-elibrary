import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Filter, Grid, List, SortAsc, SortDesc } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { cn } from '@/utils/cn';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  sourceIcon?: string;
  category: string;
  imageUrl?: string;
  publishedAt: string;
  url: string;
  relevanceScore?: number;
  isBookmarked?: boolean;
  isTrending?: boolean;
}

interface NewsFeedProps {
  articles: NewsArticle[];
  featuredArticle?: NewsArticle;
  isLoading?: boolean;
  onRefresh?: () => void;
  onBookmark?: (id: string) => void;
  onShare?: (article: NewsArticle) => void;
}

export function NewsFeed({
  articles,
  featuredArticle,
  isLoading,
  onRefresh,
  onBookmark,
  onShare,
}: NewsFeedProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'latest' | 'relevance' | 'trending'>('latest');

  const sortedArticles = [...articles].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      case 'trending':
        return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
      case 'latest':
      default:
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="latest">Latest</option>
            <option value="relevance">Most Relevant</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={cn(
              'p-2 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>

          {/* View Mode */}
          <div className="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Featured Article */}
      {featuredArticle && (
        <NewsCard
          article={featuredArticle}
          variant="featured"
          onBookmark={onBookmark}
          onShare={onShare}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-surface-800 rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-surface-200 dark:bg-surface-700" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/4" />
                <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full" />
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Articles Grid/List */}
      {!isLoading && sortedArticles.length > 0 && (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          )}
        >
          {sortedArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NewsCard
                article={article}
                variant={viewMode === 'list' ? 'compact' : 'default'}
                onBookmark={onBookmark}
                onShare={onShare}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sortedArticles.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-surface-400" />
          </div>
          <p className="text-surface-600 dark:text-surface-400">
            No articles found. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
}
