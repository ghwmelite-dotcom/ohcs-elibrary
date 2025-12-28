import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Lock,
  Pin,
  Flag,
  TrendingUp,
  Users,
  Grid3X3,
  List,
  Check,
  X,
  Plus,
  MessageCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  EyeOff,
  Unlock,
  Edit2,
  FolderPlus,
  Settings,
  Hash,
  Flame,
  Award,
  ThumbsUp,
  Reply,
  Calendar,
  ChevronRight,
  Shield,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

interface ForumTopic {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  authorRole: string;
  category: string;
  categoryColor: string;
  content: string;
  replies: number;
  views: number;
  likes: number;
  status: 'active' | 'locked' | 'flagged' | 'hidden';
  isPinned: boolean;
  isHot: boolean;
  isSolved: boolean;
  createdAt: Date;
  lastActivity: Date;
  lastReplyBy?: string;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  topicsCount: number;
  postsCount: number;
  isActive: boolean;
}

interface FlaggedContent {
  id: string;
  type: 'topic' | 'reply';
  title: string;
  content: string;
  author: string;
  reportedBy: string;
  reason: string;
  reportedAt: Date;
  status: 'pending' | 'reviewed' | 'dismissed';
}

// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950" />

      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, #006B3F 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -left-32 w-80 h-80 rounded-full opacity-20 dark:opacity-15"
        style={{
          background: 'radial-gradient(circle, #FCD116 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full opacity-20 dark:opacity-10"
        style={{
          background: 'radial-gradient(circle, #CE1126 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -20, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  subtitle
}: {
  title: string;
  value: number | string;
  change?: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
    primary: { bg: 'bg-primary-500', text: 'text-primary-500', glow: '#006B3F' },
    secondary: { bg: 'bg-secondary-500', text: 'text-secondary-500', glow: '#FCD116' },
    success: { bg: 'bg-success-500', text: 'text-success-500', glow: '#10B981' },
    warning: { bg: 'bg-warning-500', text: 'text-warning-500', glow: '#F59E0B' },
    error: { bg: 'bg-error-500', text: 'text-error-500', glow: '#EF4444' },
    info: { bg: 'bg-info-500', text: 'text-info-500', glow: '#3B82F6' },
  };

  const colors = colorMap[color] || colorMap.primary;
  const isPositive = change?.startsWith('+');
  const isNegative = change?.startsWith('-');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative group"
    >
      <div
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-40 blur-xl transition-all duration-500"
        style={{ background: colors.glow }}
      />

      <div className="relative bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-lg border border-surface-200/50 dark:border-surface-700/50 overflow-hidden">
        <div
          className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10"
          style={{ background: colors.glow }}
        />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex-1">
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-surface-400 mt-1">{subtitle}</p>
            )}
            {change && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-xs font-medium',
                isPositive && 'text-success-500',
                isNegative && color === 'error' ? 'text-success-500' : isNegative && 'text-error-500',
                !isPositive && !isNegative && 'text-surface-500'
              )}>
                <TrendingUp className={cn('w-3 h-3', isNegative && 'rotate-180')} />
                <span>{change} this week</span>
              </div>
            )}
          </div>
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            colors.bg,
            'bg-opacity-10 dark:bg-opacity-20'
          )}>
            <Icon className={cn('w-6 h-6', colors.text)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Topic Card Component
function TopicCard({
  topic,
  isSelected,
  onSelect,
  onView,
  onPin,
  onLock,
  onHide,
  onDelete
}: {
  topic: ForumTopic;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onPin: () => void;
  onLock: () => void;
  onHide: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = {
    active: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-300', icon: CheckCircle },
    locked: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300', icon: Lock },
    flagged: { bg: 'bg-error-100 dark:bg-error-900/30', text: 'text-error-700 dark:text-error-300', icon: Flag },
    hidden: { bg: 'bg-surface-100 dark:bg-surface-700', text: 'text-surface-500 dark:text-surface-400', icon: EyeOff },
  };

  const StatusIcon = statusConfig[topic.status].icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative group bg-white dark:bg-surface-800 rounded-2xl overflow-hidden shadow-lg border-2 transition-all duration-300',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-transparent hover:border-surface-300 dark:hover:border-surface-600'
      )}
    >
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSelect}
          className={cn(
            'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'bg-white/80 dark:bg-surface-700/80 border-surface-300 dark:border-surface-500 opacity-0 group-hover:opacity-100'
          )}
        >
          {isSelected && <Check className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Badges row */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {topic.isPinned && (
          <div className="px-2 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Pin className="w-3.5 h-3.5" />
          </div>
        )}
        {topic.isHot && (
          <div className="px-2 py-1 rounded-lg bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400">
            <Flame className="w-3.5 h-3.5" />
          </div>
        )}
        {topic.isSolved && (
          <div className="px-2 py-1 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400">
            <Award className="w-3.5 h-3.5" />
          </div>
        )}

        {/* More menu */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowMenu(!showMenu)}
          className="w-8 h-8 rounded-lg bg-white/80 dark:bg-surface-700/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <MoreVertical className="w-4 h-4 text-surface-600 dark:text-surface-300" />
        </motion.button>

        <AnimatePresence>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-10 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden z-20"
              >
                <button
                  onClick={() => { onView(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Topic
                </button>
                <button
                  onClick={() => { onPin(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <Pin className="w-4 h-4" />
                  {topic.isPinned ? 'Unpin' : 'Pin'} Topic
                </button>
                <button
                  onClick={() => { onLock(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  {topic.status === 'locked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {topic.status === 'locked' ? 'Unlock' : 'Lock'} Topic
                </button>
                <button
                  onClick={() => { onHide(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <EyeOff className="w-4 h-4" />
                  {topic.status === 'hidden' ? 'Show' : 'Hide'} Topic
                </button>
                <div className="border-t border-surface-200 dark:border-surface-700" />
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Topic
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-4 pt-12">
        {/* Category badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-white"
            style={{ backgroundColor: topic.categoryColor }}
          >
            {topic.category}
          </span>
          <span className={cn(
            'px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1',
            statusConfig[topic.status].bg,
            statusConfig[topic.status].text
          )}>
            <StatusIcon className="w-3 h-3" />
            {topic.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 line-clamp-2 mb-2">
          {topic.title}
        </h3>

        {/* Content preview */}
        <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 mb-4">
          {topic.content}
        </p>

        {/* Author */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-white">
            {topic.author.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
              {topic.author}
            </p>
            <p className="text-xs text-surface-400">{topic.authorRole}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-surface-500 pt-3 border-t border-surface-100 dark:border-surface-700">
          <span className="flex items-center gap-1">
            <Reply className="w-3.5 h-3.5" />
            {topic.replies}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {topic.views}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            {topic.likes}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3.5 h-3.5" />
            {formatDistanceToNow(topic.lastActivity, { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Topic Row Component
function TopicRow({
  topic,
  isSelected,
  onSelect,
  onView,
  onPin,
  onLock,
  onDelete
}: {
  topic: ForumTopic;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onPin: () => void;
  onLock: () => void;
  onDelete: () => void;
}) {
  const statusConfig = {
    active: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-300' },
    locked: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300' },
    flagged: { bg: 'bg-error-100 dark:bg-error-900/30', text: 'text-error-700 dark:text-error-300' },
    hidden: { bg: 'bg-surface-100 dark:bg-surface-700', text: 'text-surface-500 dark:text-surface-400' },
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'group transition-colors',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
      )}
    >
      <td className="px-4 py-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSelect}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'border-surface-300 dark:border-surface-500'
          )}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </motion.button>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {topic.isPinned && <Pin className="w-4 h-4 text-primary-500" />}
            {topic.isHot && <Flame className="w-4 h-4 text-error-500" />}
            {topic.isSolved && <Award className="w-4 h-4 text-success-500" />}
          </div>
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50 line-clamp-1">
              {topic.title}
            </p>
            <p className="text-xs text-surface-500">
              by {topic.author} • {formatDistanceToNow(topic.createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-white"
          style={{ backgroundColor: topic.categoryColor }}
        >
          {topic.category}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-4 text-sm text-surface-500">
          <span className="flex items-center gap-1">
            <Reply className="w-4 h-4" />
            {topic.replies}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {topic.views}
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium capitalize',
          statusConfig[topic.status].bg,
          statusConfig[topic.status].text
        )}>
          {topic.status}
        </span>
      </td>

      <td className="px-4 py-3 text-sm text-surface-500">
        {formatDistanceToNow(topic.lastActivity, { addSuffix: true })}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onView}
            className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4 text-surface-500" />
          </button>
          <button
            onClick={onPin}
            className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title={topic.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={cn('w-4 h-4', topic.isPinned ? 'text-primary-500' : 'text-surface-500')} />
          </button>
          <button
            onClick={onLock}
            className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title={topic.status === 'locked' ? 'Unlock' : 'Lock'}
          >
            <Lock className={cn('w-4 h-4', topic.status === 'locked' ? 'text-warning-500' : 'text-surface-500')} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-error-100 dark:hover:bg-error-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-error-500" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// Category Card Component
function CategoryCard({
  category,
  onEdit,
  onToggle,
  onDelete
}: {
  category: ForumCategory;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative group bg-white dark:bg-surface-800 rounded-2xl overflow-hidden shadow-lg border transition-all',
        category.isActive
          ? 'border-transparent'
          : 'border-dashed border-surface-300 dark:border-surface-600 opacity-60'
      )}
    >
      {/* Color bar */}
      <div
        className="h-2"
        style={{ backgroundColor: category.color }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${category.color}20` }}
          >
            {category.icon}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
            >
              <Edit2 className="w-4 h-4 text-surface-500" />
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
            >
              {category.isActive ? (
                <EyeOff className="w-4 h-4 text-surface-500" />
              ) : (
                <Eye className="w-4 h-4 text-surface-500" />
              )}
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-error-100 dark:hover:bg-error-900/20 rounded-lg"
            >
              <Trash2 className="w-4 h-4 text-error-500" />
            </button>
          </div>
        </div>

        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">
          {category.name}
        </h3>
        <p className="text-sm text-surface-500 line-clamp-2 mb-3">
          {category.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-surface-400 pt-3 border-t border-surface-100 dark:border-surface-700">
          <span>{category.topicsCount} topics</span>
          <span>{category.postsCount} posts</span>
          {!category.isActive && (
            <span className="ml-auto px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-700 text-surface-500">
              Disabled
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Flagged Content Card
function FlaggedContentCard({
  item,
  onApprove,
  onDismiss,
  onDelete
}: {
  item: FlaggedContent;
  onApprove: () => void;
  onDismiss: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-error-200 dark:border-error-800/50"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-error-100 dark:bg-error-900/30 flex items-center justify-center flex-shrink-0">
          <Flag className="w-5 h-5 text-error-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400 capitalize">
              {item.type}
            </span>
            <span className={cn(
              'px-2 py-0.5 rounded text-xs font-medium capitalize',
              item.status === 'pending' && 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
              item.status === 'reviewed' && 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
              item.status === 'dismissed' && 'bg-surface-100 dark:bg-surface-700 text-surface-500'
            )}>
              {item.status}
            </span>
          </div>

          <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-1">
            {item.title}
          </h4>
          <p className="text-sm text-surface-500 line-clamp-2 mb-2">
            {item.content}
          </p>

          <div className="flex items-center gap-4 text-xs text-surface-400 mb-3">
            <span>By {item.author}</span>
            <span>Reported by {item.reportedBy}</span>
            <span>{formatDistanceToNow(item.reportedAt, { addSuffix: true })}</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-50 dark:bg-surface-700/50 text-sm">
            <AlertTriangle className="w-4 h-4 text-warning-500 flex-shrink-0" />
            <span className="text-surface-600 dark:text-surface-300">
              Reason: {item.reason}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onApprove}
            className="p-2 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50"
            title="Approve (Remove flag)"
          >
            <CheckCircle className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDismiss}
            className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-600"
            title="Dismiss report"
          >
            <XCircle className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="p-2 rounded-lg bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400 hover:bg-error-200 dark:hover:bg-error-900/50"
            title="Delete content"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Main Component
export default function AdminForum() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'topics' | 'flagged' | 'categories' | 'settings'>('topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Forum data - to be populated from API
  const topics: ForumTopic[] = [];

  const categories: ForumCategory[] = [];

  const flaggedContent: FlaggedContent[] = [];

  // Filter topics
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          topic.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || topic.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || topic.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const toggleSelectAll = () => {
    if (selectedTopics.length === filteredTopics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(filteredTopics.map(t => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Stats
  const totalTopics = topics.length;
  const activeDiscussions = topics.filter(t => t.status === 'active').length;
  const flaggedCount = topics.filter(t => t.status === 'flagged').length + flaggedContent.filter(f => f.status === 'pending').length;
  const totalReplies = topics.reduce((sum, t) => sum + t.replies, 0);

  const tabs = [
    { id: 'topics', label: 'All Topics', icon: MessageSquare, count: totalTopics },
    { id: 'flagged', label: 'Flagged', icon: Flag, count: flaggedCount },
    { id: 'categories', label: 'Categories', icon: Hash, count: categories.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen">
      <AnimatedBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              Forum Management
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Manage topics, categories, and moderation
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
          >
            <Megaphone className="w-4 h-4" />
            Make Announcement
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Topics"
            value={totalTopics}
            icon={MessageSquare}
            color="primary"
            subtitle={`${categories.filter(c => c.isActive).length} active categories`}
          />
          <StatCard
            title="Active Discussions"
            value={activeDiscussions}
            icon={TrendingUp}
            color="success"
            subtitle="Last 7 days"
          />
          <StatCard
            title="Flagged Content"
            value={flaggedCount}
            icon={Flag}
            color="error"
            subtitle="Requires attention"
          />
          <StatCard
            title="Total Replies"
            value={totalReplies}
            icon={Reply}
            color="info"
            subtitle="Community engagement"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300'
                  )}>
                    {tab.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Topics Tab */}
        {activeTab === 'topics' && (
          <>
            {/* Search and Filters Bar */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-200/50 dark:border-surface-700/50 p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search topics by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-surface-900 dark:text-surface-50 placeholder-surface-400"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
                      showFilters
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>

                  <div className="flex items-center bg-surface-100 dark:bg-surface-700 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-surface-600 shadow-sm text-primary-600 dark:text-primary-400'
                          : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                      )}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        viewMode === 'table'
                          ? 'bg-white dark:bg-surface-600 shadow-sm text-primary-600 dark:text-primary-400'
                          : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                      )}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-surface-200 dark:border-surface-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-surface-500 mb-1.5">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-surface-50"
                        >
                          <option value="all">All Statuses</option>
                          <option value="active">Active</option>
                          <option value="locked">Locked</option>
                          <option value="flagged">Flagged</option>
                          <option value="hidden">Hidden</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-surface-500 mb-1.5">Category</label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-surface-50"
                        >
                          <option value="all">All Categories</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
              {selectedTopics.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => setSelectedTopics([])}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Clear selection
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 rounded-lg text-sm font-medium"
                    >
                      <Pin className="w-4 h-4" />
                      Pin
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 rounded-lg text-sm font-medium"
                    >
                      <Lock className="w-4 h-4" />
                      Lock
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300 rounded-lg text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-surface-500">
                Showing {filteredTopics.length} of {topics.length} topics
              </p>
              {filteredTopics.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {selectedTopics.length === filteredTopics.length ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>

            {/* Topics Grid/Table */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredTopics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      isSelected={selectedTopics.includes(topic.id)}
                      onSelect={() => toggleSelect(topic.id)}
                      onView={() => console.log('View', topic.id)}
                      onPin={() => console.log('Pin', topic.id)}
                      onLock={() => console.log('Lock', topic.id)}
                      onHide={() => console.log('Hide', topic.id)}
                      onDelete={() => console.log('Delete', topic.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-200/50 dark:border-surface-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        <th className="px-4 py-3 text-left">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleSelectAll}
                            className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                              selectedTopics.length === filteredTopics.length && filteredTopics.length > 0
                                ? 'bg-primary-500 border-primary-500 text-white'
                                : 'border-surface-300 dark:border-surface-500'
                            )}
                          >
                            {selectedTopics.length === filteredTopics.length && filteredTopics.length > 0 && (
                              <Check className="w-3 h-3" />
                            )}
                          </motion.button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Topic</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Activity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Last Active</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                      <AnimatePresence>
                        {filteredTopics.map((topic) => (
                          <TopicRow
                            key={topic.id}
                            topic={topic}
                            isSelected={selectedTopics.includes(topic.id)}
                            onSelect={() => toggleSelect(topic.id)}
                            onView={() => console.log('View', topic.id)}
                            onPin={() => console.log('Pin', topic.id)}
                            onLock={() => console.log('Lock', topic.id)}
                            onDelete={() => console.log('Delete', topic.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Flagged Content Tab */}
        {activeTab === 'flagged' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-surface-500">
                {flaggedContent.filter(f => f.status === 'pending').length} items pending review
              </p>
            </div>

            {flaggedContent.map((item) => (
              <FlaggedContentCard
                key={item.id}
                item={item}
                onApprove={() => console.log('Approve', item.id)}
                onDismiss={() => console.log('Dismiss', item.id)}
                onDelete={() => console.log('Delete', item.id)}
              />
            ))}

            {flaggedContent.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white dark:bg-surface-800 rounded-2xl"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-success-500" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  All Clear!
                </h3>
                <p className="text-surface-500">
                  No flagged content requires your attention.
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-surface-500">
                {categories.filter(c => c.isActive).length} active categories
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl font-medium"
              >
                <FolderPlus className="w-4 h-4" />
                Add Category
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={() => console.log('Edit', category.id)}
                  onToggle={() => console.log('Toggle', category.id)}
                  onDelete={() => console.log('Delete', category.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-200/50 dark:border-surface-700/50 p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-6">
              Forum Settings
            </h3>

            <div className="space-y-6">
              {/* Moderation Settings */}
              <div className="pb-6 border-b border-surface-200 dark:border-surface-700">
                <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-4">Moderation</h4>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-700 dark:text-surface-200">Auto-flag new topics</p>
                      <p className="text-sm text-surface-500">Automatically flag topics from new users for review</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 rounded text-primary-500" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-700 dark:text-surface-200">Profanity filter</p>
                      <p className="text-sm text-surface-500">Automatically filter inappropriate language</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 rounded text-primary-500" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-700 dark:text-surface-200">Link approval</p>
                      <p className="text-sm text-surface-500">Require approval for posts containing external links</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 rounded text-primary-500" />
                  </label>
                </div>
              </div>

              {/* Posting Settings */}
              <div className="pb-6 border-b border-surface-200 dark:border-surface-700">
                <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-4">Posting</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                      Minimum character count for posts
                    </label>
                    <input
                      type="number"
                      defaultValue={20}
                      className="w-full max-w-xs px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-surface-900 dark:text-surface-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                      Maximum attachments per post
                    </label>
                    <input
                      type="number"
                      defaultValue={5}
                      className="w-full max-w-xs px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-surface-900 dark:text-surface-50"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-4">Notifications</h4>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-700 dark:text-surface-200">Email digest</p>
                      <p className="text-sm text-surface-500">Send weekly forum activity digest to admins</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 rounded text-primary-500" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-700 dark:text-surface-200">Flag alerts</p>
                      <p className="text-sm text-surface-500">Instant notification when content is flagged</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 rounded text-primary-500" defaultChecked />
                  </label>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25"
                >
                  Save Settings
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
