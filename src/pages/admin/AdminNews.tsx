import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import {
  Newspaper,
  Search,
  Filter,
  Eye,
  Trash2,
  ExternalLink,
  Plus,
  TrendingUp,
  Bookmark,
  RefreshCw,
  Globe,
  CheckCircle,
  XCircle,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  Edit3,
  Clock,
  Tag,
  Rss,
  AlertTriangle,
  Play,
  Pause,
  Settings,
  Bell,
  Zap,
  Calendar,
  BarChart3,
  Star,
  Share2,
  MessageSquare,
  ThumbsUp,
  Image,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDistanceToNow, format } from 'date-fns';

// Category-based fallback images using high-quality stock photos
const categoryFallbackImages: Record<string, string> = {
  // News categories
  'Government': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&q=80',
  'Economy': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  'Health': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&q=80',
  'Education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
  'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  'International': 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=600&q=80',
  'Sports': 'https://images.unsplash.com/photo-1461896836934-28e9e0eb0a3f?w=600&q=80',
  'Entertainment': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
  'Business': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  'Politics': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  // Default
  'general': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
  'default': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&q=80',
};

// Get fallback image based on category
function getFallbackImage(category?: string): string {
  if (!category) return categoryFallbackImages['default'];
  // Try exact match first, then case-insensitive
  return categoryFallbackImages[category] ||
         categoryFallbackImages[category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()] ||
         categoryFallbackImages['default'];
}

// Animated background component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-50 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900" />
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 -left-32 w-96 h-96 rounded-full opacity-30 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, #006B3F 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 -right-32 w-96 h-96 rounded-full opacity-30 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, #FCD116 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 dark:opacity-10"
        style={{
          background: 'radial-gradient(circle, #CE1126 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// Stat card with glow effect
interface StatCardProps {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
  negative?: boolean;
}

function StatCard({ label, value, change, icon: Icon, color, negative }: StatCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; glow: string }> = {
    green: {
      bg: 'bg-primary-100 dark:bg-primary-900/30',
      text: 'text-primary-600 dark:text-primary-400',
      glow: '#006B3F',
    },
    gold: {
      bg: 'bg-secondary-100 dark:bg-secondary-900/30',
      text: 'text-secondary-600 dark:text-secondary-500',
      glow: '#FCD116',
    },
    red: {
      bg: 'bg-accent-100 dark:bg-accent-900/30',
      text: 'text-accent-600 dark:text-accent-400',
      glow: '#CE1126',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      glow: '#3B82F6',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      glow: '#8B5CF6',
    },
  };

  const colors = colorClasses[color] || colorClasses.green;

  return (
    <motion.div
      className="relative group"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"
        style={{ background: colors.glow }}
      />
      <div className="relative bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-sm border border-surface-200 dark:border-surface-700">
        <div className="flex items-start justify-between">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.bg)}>
            <Icon className={cn('w-6 h-6', colors.text)} />
          </div>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-1 rounded-full',
              negative
                ? 'text-accent-600 bg-accent-100 dark:text-accent-400 dark:bg-accent-900/30'
                : 'text-primary-600 bg-primary-100 dark:text-primary-400 dark:bg-primary-900/30'
            )}
          >
            {change}
          </span>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{value}</p>
          <p className="text-sm text-surface-500 mt-1">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Types
interface NewsSource {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category: string;
  categoryColor: string;
  status: 'active' | 'paused' | 'error';
  articleCount: number;
  articlesPerDay: number;
  lastFetch: Date;
  nextFetch?: Date;
  reliability: number;
  createdAt: Date;
  isFeatured: boolean;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  sourceColor: string;
  category: string;
  thumbnail?: string;
  author?: string;
  publishedAt: Date;
  fetchedAt: Date;
  views: number;
  bookmarks: number;
  shares: number;
  relevanceScore: number;
  isFeatured: boolean;
}

interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  articleCount: number;
  sourceCount: number;
  isActive: boolean;
}

// Source Card Component
function SourceCard({
  source,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onToggle,
  onRefresh,
  onDelete,
  isRefreshing = false,
}: {
  source: NewsSource;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onRefresh: () => void;
  onDelete: () => void;
  isRefreshing?: boolean;
}) {
  const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    active: { icon: CheckCircle, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30', label: 'Active' },
    paused: { icon: Pause, color: 'text-secondary-600', bg: 'bg-secondary-100 dark:bg-secondary-900/30', label: 'Paused' },
    error: { icon: AlertTriangle, color: 'text-accent-600', bg: 'bg-accent-100 dark:bg-accent-900/30', label: 'Error' },
  };

  const status = statusConfig[source.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        'group relative bg-white dark:bg-surface-800 rounded-2xl border-2 overflow-hidden transition-all duration-200',
        isSelected
          ? 'border-primary-500 shadow-lg shadow-primary-500/20'
          : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600'
      )}
    >
      {/* Selection checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-primary-500 border-primary-500'
              : 'border-surface-300 dark:border-surface-600 bg-white/80 dark:bg-surface-800/80 hover:border-primary-400'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
        </motion.button>
      </div>

      {/* Featured badge */}
      {source.isFeatured && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary-500 text-surface-900 text-[10px] font-bold">
            <Star className="w-3 h-3" />
            FEATURED
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: `${source.categoryColor}20` }}
          >
            {source.logo ? (
              <img
                src={source.logo}
                alt={source.name}
                className="w-10 h-10 rounded-lg object-contain"
                onError={(e) => {
                  // Replace with fallback icon on error
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold text-lg",
              source.logo ? "hidden" : ""
            )}>
              {source.name.charAt(0)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 truncate">
              {source.name}
            </h3>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {source.url}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* Category and Status */}
        <div className="flex items-center gap-2 mt-4">
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ backgroundColor: `${source.categoryColor}20`, color: source.categoryColor }}
          >
            {source.category}
          </span>
          <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', status.bg, status.color)}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
          <div className="text-center">
            <p className="text-lg font-bold text-surface-900 dark:text-surface-50">{source.articleCount.toLocaleString()}</p>
            <p className="text-xs text-surface-500">Articles</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-surface-900 dark:text-surface-50">{source.articlesPerDay}</p>
            <p className="text-xs text-surface-500">Per Day</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-surface-900 dark:text-surface-50">{source.reliability}%</p>
            <p className="text-xs text-surface-500">Reliability</p>
          </div>
        </div>

        {/* Last fetch info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-1.5 text-xs text-surface-500">
            <Clock className="w-3 h-3" />
            Last: {formatDistanceToNow(source.lastFetch, { addSuffix: true })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-surface-400">
            <RefreshCw className="w-3 h-3" />
            Next: {source.nextFetch ? format(source.nextFetch, 'HH:mm') : 'Manual'}
          </div>
        </div>
      </div>

      {/* Action buttons on hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white dark:from-surface-800 dark:via-surface-800 to-transparent pt-8 pb-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-center gap-2">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="w-4 h-4" />
            View
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={isRefreshing}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isRefreshing
                ? "bg-amber-200 text-amber-800 cursor-wait"
                : "bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/40 dark:hover:bg-amber-800/50 dark:text-amber-300"
            )}
            whileHover={isRefreshing ? {} : { scale: 1.05 }}
            whileTap={isRefreshing ? {} : { scale: 0.95 }}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={cn(
              'p-2 rounded-lg',
              source.status === 'active'
                ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400'
                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {source.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 rounded-lg bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 hover:bg-accent-200 dark:hover:bg-accent-900/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Source Row Component (for table view)
function SourceRow({
  source,
  isSelected,
  onSelect,
  onView,
  onToggle,
  onRefresh,
  onDelete,
  isRefreshing = false,
}: {
  source: NewsSource;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onToggle: () => void;
  onRefresh: () => void;
  onDelete: () => void;
  isRefreshing?: boolean;
}) {
  const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    active: { icon: CheckCircle, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30', label: 'Active' },
    paused: { icon: Pause, color: 'text-secondary-600', bg: 'bg-secondary-100 dark:bg-secondary-900/30', label: 'Paused' },
    error: { icon: AlertTriangle, color: 'text-accent-600', bg: 'bg-accent-100 dark:bg-accent-900/30', label: 'Error' },
  };

  const status = statusConfig[source.status];
  const StatusIcon = status.icon;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'group border-b border-surface-100 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors',
        isSelected && 'bg-primary-50 dark:bg-primary-900/20'
      )}
    >
      <td className="py-4 px-4">
        <motion.button
          onClick={onSelect}
          className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-primary-500 border-primary-500'
              : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
        </motion.button>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: `${source.categoryColor}20` }}
          >
            {source.logo ? (
              <img
                src={source.logo}
                alt={source.name}
                className="w-8 h-8 rounded object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={cn(
              "w-8 h-8 rounded flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold",
              source.logo ? "hidden" : ""
            )}>
              {source.name.charAt(0)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-surface-900 dark:text-surface-50">{source.name}</span>
              {source.isFeatured && <Star className="w-4 h-4 text-secondary-500" />}
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-500 hover:underline flex items-center gap-1"
            >
              {source.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${source.categoryColor}20`, color: source.categoryColor }}
        >
          {source.category}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="font-medium text-surface-900 dark:text-surface-50">{source.articleCount.toLocaleString()}</span>
      </td>
      <td className="py-4 px-4">
        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.bg, status.color)}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-surface-500">
          {formatDistanceToNow(source.lastFetch, { addSuffix: true })}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            onClick={onView}
            className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Eye className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isRefreshing
                ? "bg-amber-200 text-amber-800 cursor-wait"
                : "hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            )}
            whileHover={isRefreshing ? {} : { scale: 1.1 }}
            whileTap={isRefreshing ? {} : { scale: 0.9 }}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </motion.button>
          <motion.button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {source.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </motion.button>
          <motion.button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-900/30 text-accent-600 dark:text-accent-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
}

// Article Card Component
function ArticleCard({ article }: { article: Article }) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = imageError || !article.thumbnail
    ? getFallbackImage(article.category)
    : article.thumbnail;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden group hover:shadow-lg transition-shadow"
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden bg-surface-100 dark:bg-surface-700">
        <img
          src={imageSrc}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
        {/* Subtle overlay for fallback images */}
        {(imageError || !article.thumbnail) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        )}
        {article.isFeatured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-secondary-500 text-surface-900 text-[10px] font-bold">
            <Star className="w-3 h-3" />
            FEATURED
          </div>
        )}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
          {article.relevanceScore}% relevant
        </div>
        {/* Category badge on fallback images */}
        {(imageError || !article.thumbnail) && (
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
            {article.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${article.sourceColor}20`, color: article.sourceColor }}
          >
            {article.source}
          </span>
          <span className="text-xs text-surface-400">
            {formatDistanceToNow(article.publishedAt, { addSuffix: true })}
          </span>
        </div>
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 line-clamp-2 mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-surface-500 line-clamp-2">{article.excerpt}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-1 text-xs text-surface-500">
            <Eye className="w-3 h-3" />
            {article.views}
          </div>
          <div className="flex items-center gap-1 text-xs text-surface-500">
            <Bookmark className="w-3 h-3" />
            {article.bookmarks}
          </div>
          <div className="flex items-center gap-1 text-xs text-surface-500">
            <Share2 className="w-3 h-3" />
            {article.shares}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Category Card Component
function CategoryCard({
  category,
  onEdit,
  onToggle,
  onDelete,
}: {
  category: NewsCategory;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 group hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <Tag className="w-6 h-6" style={{ color: category.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">{category.name}</h3>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                category.isActive
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-surface-100 text-surface-500 dark:bg-surface-700'
              )}
            >
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-surface-500 mt-1">{category.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-surface-500">
              <span className="font-medium text-surface-900 dark:text-surface-50">{category.articleCount}</span> articles
            </span>
            <span className="text-xs text-surface-500">
              <span className="font-medium text-surface-900 dark:text-surface-50">{category.sourceCount}</span> sources
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 opacity-0 group-hover:opacity-100 transition-opacity">
        <motion.button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-200 dark:hover:bg-surface-600"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Edit3 className="w-4 h-4" />
          Edit
        </motion.button>
        <motion.button
          onClick={onToggle}
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium',
            category.isActive
              ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400'
              : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {category.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </motion.button>
        <motion.button
          onClick={onDelete}
          className="px-3 py-2 rounded-lg bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function AdminNews() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('sources');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshingSourceId, setRefreshingSourceId] = useState<string | null>(null);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [statsData, setStatsData] = useState({
    activeSources: 0,
    totalArticles: 0,
    articlesToday: 0,
    bookmarks: 0,
  });

  const { token } = useAuthStore();
  const API_URL = import.meta.env.PROD
    ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
    : '/api/v1';

  // Fetch news data
  const fetchNewsData = async () => {
    try {
      // Fetch sources
      const sourcesRes = await fetch(`${API_URL}/news/sources`);
      const sourcesData = await sourcesRes.json();

      if (sourcesData.sources) {
        const mappedSources: NewsSource[] = sourcesData.sources.map((s: any) => ({
          id: s.id,
          name: s.name,
          url: s.url || s.rssUrl,
          logo: s.logoUrl,
          category: s.category || 'General',
          categoryColor: getCategoryColor(s.category || 'General'),
          status: s.fetchError ? 'error' : (s.isActive ? 'active' : 'paused'),
          articleCount: s.articleCount || 0,
          articlesPerDay: Math.round((s.articleCount || 0) / 7),
          lastFetch: s.lastFetchedAt ? new Date(s.lastFetchedAt) : new Date(),
          nextFetch: undefined,
          reliability: s.fetchError ? 70 : 95,
          createdAt: new Date(s.createdAt),
          isFeatured: false,
        }));
        setSources(mappedSources);
        setStatsData(prev => ({ ...prev, activeSources: mappedSources.filter(s => s.status === 'active').length }));
      }

      // Fetch articles
      const articlesRes = await fetch(`${API_URL}/news?limit=50`);
      const articlesData = await articlesRes.json();

      if (articlesData.articles) {
        const mappedArticles: Article[] = articlesData.articles.map((a: any) => ({
          id: a.id,
          title: a.title,
          excerpt: a.summary || a.content?.substring(0, 150) || '',
          source: a.source?.name || a.sourceName || 'Unknown',
          sourceColor: getCategoryColor(a.category || 'General'),
          category: a.category || 'General',
          thumbnail: a.imageUrl,
          author: a.author,
          publishedAt: new Date(a.publishedAt),
          fetchedAt: new Date(a.fetchedAt || a.createdAt),
          views: a.viewCount || 0,
          bookmarks: 0,
          shares: 0,
          relevanceScore: a.relevanceScore || 50,
          isFeatured: a.isFeatured || false,
        }));
        setArticles(mappedArticles);
        setStatsData(prev => ({
          ...prev,
          totalArticles: articlesData.total || mappedArticles.length,
          articlesToday: mappedArticles.filter(a => {
            const today = new Date();
            return a.publishedAt.toDateString() === today.toDateString();
          }).length
        }));
      }

      // Fetch categories
      const categoriesRes = await fetch(`${API_URL}/news/categories`);
      const categoriesData = await categoriesRes.json();

      if (categoriesData.categories) {
        const mappedCategories: NewsCategory[] = categoriesData.categories.map((c: any) => ({
          id: c.id || c.slug,
          name: c.name,
          slug: c.slug,
          description: c.description || `${c.name} news and articles`,
          color: c.color || getCategoryColor(c.name),
          articleCount: c.count || 0,
          sourceCount: 0,
          isActive: c.isActive !== false,
        }));
        setCategories(mappedCategories);
      }

    } catch (error) {
      console.error('Error fetching news data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get category color
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'policy': '#006B3F',
      'general': '#3B82F6',
      'technology': '#8B5CF6',
      'hr': '#F59E0B',
      'training': '#10B981',
      'events': '#EC4899',
      'announcements': '#EF4444',
      'General': '#3B82F6',
      'Politics': '#006B3F',
      'Economy': '#F59E0B',
      'Technology': '#8B5CF6',
    };
    return colors[category] || '#6B7280';
  };

  // Trigger aggregation
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await fetch(`${API_URL}/admin/news/aggregate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // Refetch data after aggregation
      await fetchNewsData();
    } catch (error) {
      console.error('Error triggering aggregation:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // View source articles - switch to articles tab filtered by this source
  const handleViewSource = (source: NewsSource) => {
    setSelectedTab('articles');
    setSearchQuery(source.name);
  };

  // Refresh a specific source
  const handleRefreshSource = async (sourceId: string) => {
    setRefreshingSourceId(sourceId);
    try {
      await fetch(`${API_URL}/admin/news/aggregate?sourceId=${sourceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // Refetch data after aggregation
      await fetchNewsData();
    } catch (error) {
      console.error('Error refreshing source:', error);
    } finally {
      setRefreshingSourceId(null);
    }
  };

  useEffect(() => {
    fetchNewsData();
  }, []);

  const stats = [
    { label: 'Active Sources', value: statsData.activeSources.toString(), change: '+2 this week', icon: Globe, color: 'green' },
    { label: 'Total Articles', value: statsData.totalArticles.toLocaleString(), change: '+150 today', icon: Newspaper, color: 'blue' },
    { label: 'Articles Today', value: statsData.articlesToday.toString(), change: 'Last 24h', icon: TrendingUp, color: 'gold' },
    { label: 'User Bookmarks', value: statsData.bookmarks.toString(), change: '+12 today', icon: Bookmark, color: 'purple' },
  ];

  const tabs = [
    { id: 'sources', label: 'News Sources', count: sources.length },
    { id: 'articles', label: 'Recent Articles', count: articles.length },
    { id: 'categories', label: 'Categories', count: categories.length },
    { id: 'settings', label: 'Settings' },
  ];

  const toggleSourceSelection = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((sourceId) => sourceId !== id) : [...prev, id]
    );
  };

  const selectAllSources = () => {
    if (selectedSources.length === sources.length) {
      setSelectedSources([]);
    } else {
      setSelectedSources(sources.map((s) => s.id));
    }
  };

  const filteredSources = sources.filter((source) => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || source.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || source.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      <AnimatedBackground />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              className="text-3xl font-bold font-heading text-surface-900 dark:text-surface-50"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              News Management
            </motion.h1>
            <motion.p
              className="text-surface-600 dark:text-surface-400 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Manage news sources, articles, and content aggregation
            </motion.p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh All'}
            </motion.button>
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Plus className="w-5 h-5" />
              Add Source
            </motion.button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-surface-600 dark:text-surface-400">Loading news data...</p>
            </div>
          </div>
        ) : (
          <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedTab === tab.id
                  ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs',
                    selectedTab === tab.id
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-surface-200 text-surface-600 dark:bg-surface-600 dark:text-surface-400'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sources Tab */}
        {selectedTab === 'sources' && (
          <>
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search news sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-xl border transition-all',
                    showFilters
                      ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-800'
                      : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Filter className="w-5 h-5" />
                  Filters
                  <ChevronDown
                    className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')}
                  />
                </motion.button>
                <div className="flex items-center rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      viewMode === 'grid'
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
                    )}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      viewMode === 'table'
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
                    )}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Category
                      </label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">All Categories</option>
                        <option value="General">General</option>
                        <option value="Politics">Politics</option>
                        <option value="Economy">Economy</option>
                        <option value="Technology">Technology</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setCategoryFilter('all');
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reset Filters
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk Actions */}
            <AnimatePresence>
              {selectedSources.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                >
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {selectedSources.length} source{selectedSources.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700">
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedSources([])}
                      className="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sources Grid/Table */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredSources.map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      isSelected={selectedSources.includes(source.id)}
                      onSelect={() => toggleSourceSelection(source.id)}
                      onView={() => handleViewSource(source)}
                      onEdit={() => {}}
                      onToggle={() => {}}
                      onRefresh={() => handleRefreshSource(source.id)}
                      onDelete={() => {}}
                      isRefreshing={refreshingSourceId === source.id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                    <tr>
                      <th className="py-4 px-4 text-left">
                        <button
                          onClick={selectAllSources}
                          className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                            selectedSources.length === sources.length
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
                          )}
                        >
                          {selectedSources.length === sources.length && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </button>
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Articles
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Last Fetch
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSources.map((source) => (
                      <SourceRow
                        key={source.id}
                        source={source}
                        isSelected={selectedSources.includes(source.id)}
                        onSelect={() => toggleSourceSelection(source.id)}
                        onView={() => handleViewSource(source)}
                        onToggle={() => {}}
                        onRefresh={() => handleRefreshSource(source.id)}
                        onDelete={() => {}}
                        isRefreshing={refreshingSourceId === source.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Articles Tab */}
        {selectedTab === 'articles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ArticleCard article={article} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Categories Tab */}
        {selectedTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CategoryCard
                  category={category}
                  onEdit={() => {}}
                  onToggle={() => {}}
                  onDelete={() => {}}
                />
              </motion.div>
            ))}
            {/* Add Category Card */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categories.length * 0.1 }}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 text-surface-500 hover:border-primary-400 hover:text-primary-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-8 h-8" />
              <span className="font-medium">Add Category</span>
            </motion.button>
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fetch Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">Fetch Settings</h3>
                  <p className="text-sm text-surface-500">Configure article fetching behavior</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Default fetch interval (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Max articles per fetch
                  </label>
                  <input
                    type="number"
                    defaultValue={50}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Auto-retry on error</p>
                    <p className="text-sm text-surface-500">Automatically retry failed fetches</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* AI Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-secondary-600 dark:text-secondary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">AI Processing</h3>
                  <p className="text-sm text-surface-500">Configure AI relevance scoring</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Enable AI scoring</p>
                    <p className="text-sm text-surface-500">Score articles by relevance to civil service</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div>
                  <label className="block font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Minimum relevance score (%)
                  </label>
                  <input
                    type="number"
                    defaultValue={60}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600"
                  />
                  <p className="text-xs text-surface-500 mt-1">
                    Articles below this score won't be shown to users
                  </p>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Auto-categorize</p>
                    <p className="text-sm text-surface-500">Let AI assign categories to articles</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Display Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">Display Settings</h3>
                  <p className="text-sm text-surface-500">Configure news feed appearance</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Articles per page
                  </label>
                  <input
                    type="number"
                    defaultValue={20}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Show thumbnails</p>
                    <p className="text-sm text-surface-500">Display article images in feed</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Show relevance score</p>
                    <p className="text-sm text-surface-500">Display AI relevance score to users</p>
                  </div>
                  <button className="relative w-12 h-6 bg-surface-200 dark:bg-surface-600 rounded-full transition-colors">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">Notifications</h3>
                  <p className="text-sm text-surface-500">Configure admin alerts</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Source errors</p>
                    <p className="text-sm text-surface-500">Alert when a source fails to fetch</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Breaking news</p>
                    <p className="text-sm text-surface-500">Alert for high-relevance articles</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Daily digest</p>
                    <p className="text-sm text-surface-500">Receive daily summary of news activity</p>
                  </div>
                  <button className="relative w-12 h-6 bg-surface-200 dark:bg-surface-600 rounded-full transition-colors">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Add Source Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="w-full max-w-lg bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Ghana stripe */}
              <div className="relative">
                <div className="h-1 bg-gradient-to-r from-accent-500 via-secondary-500 to-primary-500" />
                <div className="p-6 border-b border-surface-200 dark:border-surface-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">
                      Add News Source
                    </h2>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                    >
                      <X className="w-5 h-5 text-surface-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Source Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Ghana News Agency"
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    RSS/API URL
                  </label>
                  <div className="relative">
                    <Rss className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input
                      type="url"
                      placeholder="https://example.com/rss"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Category
                  </label>
                  <select className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500">
                    <option value="">Select a category</option>
                    <option value="general">General</option>
                    <option value="politics">Politics</option>
                    <option value="economy">Economy</option>
                    <option value="technology">Technology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Fetch Interval (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="featured"
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <label htmlFor="featured" className="text-sm text-surface-700 dark:text-surface-300">
                    Mark as featured source
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-surface-200 dark:border-surface-700 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium shadow-lg shadow-primary-500/25"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  Add Source
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
