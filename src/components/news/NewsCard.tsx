import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, Bookmark, BookmarkCheck, Share2, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
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

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'default' | 'compact' | 'featured';
  onBookmark?: (id: string) => void;
  onShare?: (article: NewsArticle) => void;
}

export function NewsCard({
  article,
  variant = 'default',
  onBookmark,
  onShare,
}: NewsCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Government': 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
      'Economy': 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
      'Health': 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
      'Education': 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
      'Technology': 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
      'International': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'Sports': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return colors[category] || 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300';
  };

  if (variant === 'featured') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group overflow-hidden rounded-2xl shadow-elevation-2"
      >
        {/* Background Image */}
        <div className="aspect-[16/9] md:aspect-[21/9]">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-600 to-secondary-600" />
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getCategoryColor(article.category))}>
              {article.category}
            </span>
            {article.isTrending && (
              <span className="flex items-center gap-1 px-2 py-1 bg-accent-500 text-white rounded-full text-xs font-medium">
                <TrendingUp className="w-3 h-3" />
                Trending
              </span>
            )}
          </div>

          <Link to={`/news/${article.id}`}>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2 group-hover:underline">
              {article.title}
            </h2>
          </Link>

          <p className="text-surface-200 mb-4 line-clamp-2 max-w-2xl">
            {article.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-surface-300">
              {article.sourceIcon && (
                <img src={article.sourceIcon} alt={article.source} className="w-5 h-5 rounded" />
              )}
              <span className="text-sm font-medium">{article.source}</span>
              <span className="text-sm">•</span>
              <span className="text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatRelativeTime(article.publishedAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onBookmark?.(article.id)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                {article.isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => onShare?.(article)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.article
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 rounded-lg transition-colors group"
      >
        {article.imageUrl && (
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <Link to={`/news/${article.id}`}>
            <h3 className="font-medium text-surface-900 dark:text-surface-50 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {article.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1 text-xs text-surface-500">
            <span>{article.source}</span>
            <span>•</span>
            <span>{formatRelativeTime(article.publishedAt)}</span>
          </div>
        </div>
      </motion.article>
    );
  }

  // Default variant
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden group"
    >
      {/* Image */}
      {article.imageUrl && (
        <Link to={`/news/${article.id}`} className="block aspect-video overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getCategoryColor(article.category))}>
            {article.category}
          </span>
          {article.isTrending && (
            <span className="flex items-center gap-1 text-xs text-accent-600 dark:text-accent-400 font-medium">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          )}
          {article.relevanceScore && article.relevanceScore >= 80 && (
            <span className="text-xs text-success-600 dark:text-success-400 font-medium">
              Highly Relevant
            </span>
          )}
        </div>

        <Link to={`/news/${article.id}`}>
          <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {article.title}
          </h3>
        </Link>

        <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mb-3">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-surface-500">
            {article.sourceIcon && (
              <img src={article.sourceIcon} alt={article.source} className="w-4 h-4 rounded" />
            )}
            <span>{article.source}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(article.publishedAt)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onBookmark?.(article.id)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                article.isBookmarked
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              {article.isBookmarked ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => onShare?.(article)}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
