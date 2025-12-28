import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Share2,
  TrendingUp,
  BookOpen,
  Smile,
  Meh,
  Frown,
  Sparkles
} from 'lucide-react';
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
  readingTimeMinutes?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  aiSummary?: string | null;
}

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'default' | 'compact' | 'featured';
  onBookmark?: (id: string) => void;
  onShare?: (article: NewsArticle) => void;
}

// Sentiment indicator component
function SentimentBadge({ sentiment }: { sentiment?: string }) {
  if (!sentiment || sentiment === 'neutral') return null;

  const config = {
    positive: { icon: Smile, color: 'text-success-500', bg: 'bg-success-50 dark:bg-success-900/20' },
    negative: { icon: Frown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  };

  const { icon: Icon, color, bg } = config[sentiment as keyof typeof config] || {};
  if (!Icon) return null;

  return (
    <span className={cn('p-1 rounded-full', bg)}>
      <Icon className={cn('w-3 h-3', color)} />
    </span>
  );
}

// Live timestamp hook
function useLiveTimestamp(date: string) {
  const [timestamp, setTimestamp] = useState(() => formatRelativeTime(date));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(formatRelativeTime(date));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [date]);

  return timestamp;
}

// Category-based fallback images using high-quality stock photos
const categoryFallbackImages: Record<string, string> = {
  // News categories
  'Government': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80',
  'Economy': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  'Health': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80',
  'Education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
  'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  'International': 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&q=80',
  'Sports': 'https://images.unsplash.com/photo-1461896836934-28e9e0eb0a3f?w=800&q=80',
  'Entertainment': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  // Policy categories
  'policy': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
  'training': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  'technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  'hr': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
  'announcements': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
  'events': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  // Default
  'general': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80',
};

// Get fallback image based on category
function getFallbackImage(category?: string): string {
  if (!category) return categoryFallbackImages['default'];
  const normalizedCategory = category.toLowerCase();
  return categoryFallbackImages[category] ||
         categoryFallbackImages[normalizedCategory] ||
         categoryFallbackImages['default'];
}

// Image with blur-up loading
function ArticleImage({ src, alt, className, category }: { src: string; alt: string; className?: string; category?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fallbackSrc = getFallbackImage(category);

  // Use fallback if no src provided
  const imageSrc = error || !src ? fallbackSrc : src;

  return (
    <div className={cn('relative overflow-hidden bg-surface-100 dark:bg-surface-700', className)}>
      {/* Blur placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-600 dark:to-surface-700 animate-pulse" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!error) {
            setError(true);
            setLoaded(false);
          }
        }}
        className={cn(
          'w-full h-full object-cover transition-all duration-500',
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        )}
      />
      {/* Subtle overlay for better text readability */}
      {(error || !src) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      )}
    </div>
  );
}

export function NewsCard({
  article,
  variant = 'default',
  onBookmark,
  onShare,
}: NewsCardProps) {
  const liveTimestamp = useLiveTimestamp(article.publishedAt);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'policy': 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
      'training': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'technology': 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
      'hr': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'announcements': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'events': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      'general': 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
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
        <ArticleImage
          src={article.imageUrl || ''}
          alt={article.title}
          className="aspect-[16/9] md:aspect-[21/9]"
          category={article.category}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getCategoryColor(article.category))}>
              {article.category}
            </span>
            {article.isTrending && (
              <span className="flex items-center gap-1 px-2 py-1 bg-accent-500 text-white rounded-full text-xs font-medium">
                <TrendingUp className="w-3 h-3" />
                Trending
              </span>
            )}
            {article.readingTimeMinutes && (
              <span className="flex items-center gap-1 px-2 py-1 bg-white/20 text-white rounded-full text-xs font-medium backdrop-blur-sm">
                <BookOpen className="w-3 h-3" />
                {article.readingTimeMinutes} min read
              </span>
            )}
            <SentimentBadge sentiment={article.sentiment} />
          </div>

          <Link to={`/news/${article.id}`}>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2 group-hover:underline">
              {article.title}
            </h2>
          </Link>

          {/* AI Summary or Excerpt */}
          {article.aiSummary ? (
            <div className="mb-4 max-w-2xl">
              <div className="flex items-center gap-1 text-xs text-primary-300 font-medium mb-1">
                <Sparkles className="w-3 h-3" />
                AI Summary
              </div>
              <p className="text-surface-200 line-clamp-2">
                {article.aiSummary}
              </p>
            </div>
          ) : (
            <p className="text-surface-200 mb-4 line-clamp-2 max-w-2xl">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-surface-300">
              {article.sourceIcon && (
                <img src={article.sourceIcon} alt={article.source} className="w-5 h-5 rounded" />
              )}
              <span className="text-sm font-medium">{article.source}</span>
              <span className="text-sm">•</span>
              <span className="text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {liveTimestamp}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onBookmark?.(article.id)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm"
              >
                {article.isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => onShare?.(article)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm"
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
        {(article.imageUrl || true) && (
          <ArticleImage
            src={article.imageUrl || ''}
            alt={article.title}
            className="w-20 h-20 flex-shrink-0 rounded-lg"
            category={article.category}
          />
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
            <span>{liveTimestamp}</span>
            {article.readingTimeMinutes && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <BookOpen className="w-3 h-3" />
                  {article.readingTimeMinutes}m
                </span>
              </>
            )}
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
      className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden group hover:shadow-elevation-2 transition-shadow"
    >
      {/* Image */}
      <Link to={`/news/${article.id}`} className="block aspect-video overflow-hidden">
        <ArticleImage
          src={article.imageUrl || ''}
          alt={article.title}
          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
          category={article.category}
        />
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', getCategoryColor(article.category))}>
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
          <SentimentBadge sentiment={article.sentiment} />
        </div>

        <Link to={`/news/${article.id}`}>
          <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {article.title}
          </h3>
        </Link>

        {/* AI Summary or Excerpt */}
        {article.aiSummary ? (
          <div className="mb-3">
            <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-medium mb-1">
              <Sparkles className="w-3 h-3" />
              AI Summary
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
              {article.aiSummary}
            </p>
          </div>
        ) : (
          <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mb-3">
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-surface-500">
            {article.sourceIcon && (
              <img
                src={article.sourceIcon}
                alt={article.source}
                className="w-4 h-4 rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span className="truncate max-w-[100px]">{article.source}</span>
            <span>•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3 h-3" />
              {liveTimestamp}
            </span>
            {article.readingTimeMinutes && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {article.readingTimeMinutes}m
                </span>
              </>
            )}
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

// Skeleton loader for news cards
export function NewsCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  if (variant === 'featured') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-surface-200 dark:bg-surface-700 animate-pulse">
        <div className="aspect-[16/9] md:aspect-[21/9]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-white/20 rounded-full" />
            <div className="h-6 w-24 bg-white/20 rounded-full" />
          </div>
          <div className="h-8 w-3/4 bg-white/20 rounded" />
          <div className="h-4 w-1/2 bg-white/20 rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex gap-3 p-3 animate-pulse">
        <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-surface-200 dark:bg-surface-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full" />
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-2/3" />
          <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden animate-pulse">
      <div className="aspect-video bg-surface-200 dark:bg-surface-700" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-surface-200 dark:bg-surface-700 rounded-full" />
          <div className="h-5 w-20 bg-surface-200 dark:bg-surface-700 rounded-full" />
        </div>
        <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-full" />
        <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full" />
        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-2/3" />
        <div className="flex justify-between pt-2">
          <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
          <div className="flex gap-1">
            <div className="h-6 w-6 bg-surface-200 dark:bg-surface-700 rounded" />
            <div className="h-6 w-6 bg-surface-200 dark:bg-surface-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
