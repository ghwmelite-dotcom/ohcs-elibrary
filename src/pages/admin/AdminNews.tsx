import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}: {
  source: NewsSource;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onRefresh: () => void;
  onDelete: () => void;
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
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${source.categoryColor}20` }}
          >
            {source.logo ? (
              <img src={source.logo} alt={source.name} className="w-10 h-10 rounded-lg object-contain" />
            ) : (
              <Newspaper className="w-7 h-7" style={{ color: source.categoryColor }} />
            )}
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-200 dark:hover:bg-surface-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
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
}: {
  source: NewsSource;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onToggle: () => void;
  onRefresh: () => void;
  onDelete: () => void;
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
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${source.categoryColor}20` }}
          >
            <Newspaper className="w-5 h-5" style={{ color: source.categoryColor }} />
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
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <RefreshCw className="w-4 h-4" />
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden group hover:shadow-lg transition-shadow"
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden bg-surface-100 dark:bg-surface-700">
        {article.thumbnail ? (
          <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-12 h-12 text-surface-400" />
          </div>
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

  // Mock data
  const sources: NewsSource[] = [
    {
      id: '1',
      name: 'Ghana News Agency',
      url: 'https://newsghana.com.gh',
      category: 'General',
      categoryColor: '#3B82F6',
      status: 'active',
      articleCount: 1234,
      articlesPerDay: 45,
      lastFetch: new Date(Date.now() - 3600000),
      nextFetch: new Date(Date.now() + 1800000),
      reliability: 98,
      createdAt: new Date(Date.now() - 86400000 * 365),
      isFeatured: true,
    },
    {
      id: '2',
      name: 'Daily Graphic',
      url: 'https://graphic.com.gh',
      category: 'General',
      categoryColor: '#3B82F6',
      status: 'active',
      articleCount: 987,
      articlesPerDay: 38,
      lastFetch: new Date(Date.now() - 7200000),
      nextFetch: new Date(Date.now() + 3600000),
      reliability: 95,
      createdAt: new Date(Date.now() - 86400000 * 300),
      isFeatured: true,
    },
    {
      id: '3',
      name: 'Joy Online',
      url: 'https://myjoyonline.com',
      category: 'General',
      categoryColor: '#3B82F6',
      status: 'active',
      articleCount: 876,
      articlesPerDay: 52,
      lastFetch: new Date(Date.now() - 1800000),
      nextFetch: new Date(Date.now() + 900000),
      reliability: 92,
      createdAt: new Date(Date.now() - 86400000 * 200),
      isFeatured: false,
    },
    {
      id: '4',
      name: 'Citi Newsroom',
      url: 'https://citinewsroom.com',
      category: 'Politics',
      categoryColor: '#8B5CF6',
      status: 'paused',
      articleCount: 654,
      articlesPerDay: 28,
      lastFetch: new Date(Date.now() - 86400000),
      reliability: 90,
      createdAt: new Date(Date.now() - 86400000 * 150),
      isFeatured: false,
    },
    {
      id: '5',
      name: 'GhanaWeb',
      url: 'https://ghanaweb.com',
      category: 'General',
      categoryColor: '#3B82F6',
      status: 'active',
      articleCount: 2341,
      articlesPerDay: 67,
      lastFetch: new Date(Date.now() - 900000),
      nextFetch: new Date(Date.now() + 600000),
      reliability: 88,
      createdAt: new Date(Date.now() - 86400000 * 400),
      isFeatured: true,
    },
    {
      id: '6',
      name: 'Business Ghana',
      url: 'https://businessghana.com',
      category: 'Economy',
      categoryColor: '#10B981',
      status: 'error',
      articleCount: 432,
      articlesPerDay: 12,
      lastFetch: new Date(Date.now() - 172800000),
      reliability: 85,
      createdAt: new Date(Date.now() - 86400000 * 100),
      isFeatured: false,
    },
  ];

  const articles: Article[] = [
    {
      id: '1',
      title: 'Government Announces New Digital Transformation Initiative for Public Sector',
      excerpt: 'The Office of the Head of Civil Service has unveiled a comprehensive digital transformation plan aimed at modernizing public service delivery across all MDAs.',
      source: 'Ghana News Agency',
      sourceColor: '#3B82F6',
      category: 'Technology',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
      author: 'Kofi Mensah',
      publishedAt: new Date(Date.now() - 3600000),
      fetchedAt: new Date(Date.now() - 1800000),
      views: 1234,
      bookmarks: 89,
      shares: 45,
      relevanceScore: 95,
      isFeatured: true,
    },
    {
      id: '2',
      title: 'Civil Service Commission Releases New Guidelines for Performance Management',
      excerpt: 'New performance management guidelines have been issued to ensure accountability and efficiency in the public sector.',
      source: 'Daily Graphic',
      sourceColor: '#8B5CF6',
      category: 'Policy',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      publishedAt: new Date(Date.now() - 7200000),
      fetchedAt: new Date(Date.now() - 5400000),
      views: 876,
      bookmarks: 67,
      shares: 34,
      relevanceScore: 92,
      isFeatured: false,
    },
    {
      id: '3',
      title: 'Ghana Hosts International Conference on Public Administration',
      excerpt: 'Leading experts from across Africa gather in Accra to discuss best practices in public sector management and governance.',
      source: 'Joy Online',
      sourceColor: '#10B981',
      category: 'Events',
      thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
      publishedAt: new Date(Date.now() - 14400000),
      fetchedAt: new Date(Date.now() - 10800000),
      views: 654,
      bookmarks: 45,
      shares: 23,
      relevanceScore: 88,
      isFeatured: true,
    },
    {
      id: '4',
      title: '2024 Budget: Implications for Civil Service Salaries and Benefits',
      excerpt: 'Analysis of the recently announced budget and its impact on public sector compensation and welfare programs.',
      source: 'Citi Newsroom',
      sourceColor: '#F59E0B',
      category: 'Economy',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
      publishedAt: new Date(Date.now() - 28800000),
      fetchedAt: new Date(Date.now() - 25200000),
      views: 2341,
      bookmarks: 156,
      shares: 89,
      relevanceScore: 85,
      isFeatured: false,
    },
  ];

  const categories: NewsCategory[] = [
    {
      id: '1',
      name: 'General',
      slug: 'general',
      description: 'General news and current affairs',
      color: '#3B82F6',
      articleCount: 2345,
      sourceCount: 5,
      isActive: true,
    },
    {
      id: '2',
      name: 'Politics',
      slug: 'politics',
      description: 'Political news and government affairs',
      color: '#8B5CF6',
      articleCount: 876,
      sourceCount: 3,
      isActive: true,
    },
    {
      id: '3',
      name: 'Economy',
      slug: 'economy',
      description: 'Economic news and business updates',
      color: '#10B981',
      articleCount: 654,
      sourceCount: 2,
      isActive: true,
    },
    {
      id: '4',
      name: 'Technology',
      slug: 'technology',
      description: 'Technology and digital transformation news',
      color: '#F59E0B',
      articleCount: 432,
      sourceCount: 2,
      isActive: true,
    },
    {
      id: '5',
      name: 'Health',
      slug: 'health',
      description: 'Health sector news and updates',
      color: '#EF4444',
      articleCount: 321,
      sourceCount: 1,
      isActive: false,
    },
  ];

  const stats = [
    { label: 'Active Sources', value: '12', change: '+2', icon: Globe, color: 'green' },
    { label: 'Total Articles', value: '3,456', change: '+156', icon: Newspaper, color: 'blue' },
    { label: 'Articles Today', value: '89', change: '+12%', icon: TrendingUp, color: 'gold' },
    { label: 'User Bookmarks', value: '567', change: '+23', icon: Bookmark, color: 'purple' },
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="w-5 h-5" />
              Refresh All
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
                      onView={() => {}}
                      onEdit={() => {}}
                      onToggle={() => {}}
                      onRefresh={() => {}}
                      onDelete={() => {}}
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
                        onView={() => {}}
                        onToggle={() => {}}
                        onRefresh={() => {}}
                        onDelete={() => {}}
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
