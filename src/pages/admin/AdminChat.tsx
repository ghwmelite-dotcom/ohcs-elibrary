import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Ban,
  Users,
  Hash,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LayoutGrid,
  List,
  ChevronDown,
  Plus,
  Settings,
  Bell,
  Shield,
  Clock,
  MessageSquare,
  Send,
  Image,
  Paperclip,
  Smile,
  Lock,
  Globe,
  Building2,
  TrendingUp,
  Zap,
  X,
  Edit3,
  Archive,
  Flag,
  UserX,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

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
interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'mda';
  mdaName?: string;
  memberCount: number;
  messageCount: number;
  messagesPerDay: number;
  status: 'active' | 'archived' | 'muted';
  avatar?: string;
  lastMessage?: string;
  lastMessageBy?: string;
  createdAt: Date;
  lastActivity: Date;
  isOfficial: boolean;
  pinnedMessages: number;
}

interface FlaggedMessage {
  id: string;
  roomName: string;
  roomId: string;
  content: string;
  author: string;
  authorAvatar?: string;
  reportedBy: string;
  reason: string;
  reportedAt: Date;
  status: 'pending' | 'reviewed' | 'dismissed';
}

interface UserReport {
  id: string;
  reportedUser: string;
  reportedUserAvatar?: string;
  reportedBy: string;
  reason: string;
  description: string;
  roomName: string;
  reportedAt: Date;
  status: 'pending' | 'warning_sent' | 'banned' | 'dismissed';
}

// Room Card Component
function RoomCard({
  room,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onArchive,
  onDelete,
}: {
  room: ChatRoom;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    public: { icon: Globe, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30' },
    private: { icon: Lock, color: 'text-secondary-500', bg: 'bg-secondary-100 dark:bg-secondary-900/30' },
    mda: { icon: Building2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  };

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30', label: 'Active' },
    archived: { color: 'text-surface-500', bg: 'bg-surface-100 dark:bg-surface-700', label: 'Archived' },
    muted: { color: 'text-secondary-600', bg: 'bg-secondary-100 dark:bg-secondary-900/30', label: 'Muted' },
  };

  const config = typeConfig[room.type];
  const status = statusConfig[room.status];
  const TypeIcon = config.icon;

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
              : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
        </motion.button>
      </div>

      {/* Official badge */}
      {room.isOfficial && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500 text-white text-[10px] font-bold">
            <Shield className="w-3 h-3" />
            OFFICIAL
          </div>
        </div>
      )}

      {/* Room avatar / icon */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', config.bg)}>
            {room.avatar ? (
              <img src={room.avatar} alt={room.name} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <Hash className={cn('w-7 h-7', config.color)} />
            )}
          </div>
          <div className="flex-1 min-w-0 mt-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 truncate">
                {room.name}
              </h3>
              <TypeIcon className={cn('w-4 h-4 flex-shrink-0', config.color)} />
            </div>
            <p className="text-sm text-surface-500 mt-1 line-clamp-2">{room.description}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-sm text-surface-500">
            <Users className="w-4 h-4" />
            <span>{room.memberCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-surface-500">
            <MessageSquare className="w-4 h-4" />
            <span>{room.messageCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-surface-500">
            <TrendingUp className="w-4 h-4" />
            <span>{room.messagesPerDay}/day</span>
          </div>
        </div>

        {/* Last message preview */}
        {room.lastMessage && (
          <div className="mt-4 p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <p className="text-xs text-surface-500 mb-1">
              Last message by <span className="font-medium">{room.lastMessageBy}</span>
            </p>
            <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-1">
              {room.lastMessage}
            </p>
          </div>
        )}

        {/* Status and activity */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full', status.bg, status.color)}>
            {status.label}
          </span>
          <span className="text-xs text-surface-400">
            Active {formatDistanceToNow(room.lastActivity, { addSuffix: true })}
          </span>
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
              onEdit();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-200 dark:hover:bg-surface-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onArchive();
            }}
            className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Archive className="w-4 h-4" />
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

// Room Row Component (for table view)
function RoomRow({
  room,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onArchive,
  onDelete,
}: {
  room: ChatRoom;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    public: { icon: Globe, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30', label: 'Public' },
    private: { icon: Lock, color: 'text-secondary-600', bg: 'bg-secondary-100 dark:bg-secondary-900/30', label: 'Private' },
    mda: { icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'MDA' },
  };

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30', label: 'Active' },
    archived: { color: 'text-surface-500', bg: 'bg-surface-100 dark:bg-surface-700', label: 'Archived' },
    muted: { color: 'text-secondary-600', bg: 'bg-secondary-100 dark:bg-secondary-900/30', label: 'Muted' },
  };

  const config = typeConfig[room.type];
  const status = statusConfig[room.status];
  const TypeIcon = config.icon;

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
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
            <Hash className={cn('w-5 h-5', config.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-surface-900 dark:text-surface-50">{room.name}</span>
              {room.isOfficial && (
                <Shield className="w-4 h-4 text-primary-500" />
              )}
            </div>
            <p className="text-xs text-surface-500 truncate max-w-xs">{room.description}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.bg, config.color)}>
          <TypeIcon className="w-3 h-3" />
          {config.label}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 text-surface-700 dark:text-surface-300">
          <Users className="w-4 h-4 text-surface-400" />
          <span className="font-medium">{room.memberCount}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 text-surface-700 dark:text-surface-300">
          <MessageSquare className="w-4 h-4 text-surface-400" />
          <span>{room.messageCount.toLocaleString()}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', status.bg, status.color)}>
          {status.label}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-surface-500">
          {formatDistanceToNow(room.lastActivity, { addSuffix: true })}
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
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Edit3 className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={onArchive}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Archive className="w-4 h-4" />
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

// Flagged Message Card
function FlaggedMessageCard({
  message,
  onApprove,
  onDismiss,
  onDelete,
}: {
  message: FlaggedMessage;
  onApprove: () => void;
  onDismiss: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
    >
      <div className="p-4 border-b border-surface-100 dark:border-surface-700 bg-accent-50 dark:bg-accent-900/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
            <Flag className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-accent-600 dark:text-accent-400">
                Flagged in #{message.roomName}
              </span>
              <span className="text-xs text-surface-400">•</span>
              <span className="text-xs text-surface-500">
                {formatDistanceToNow(message.reportedAt, { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-surface-700 dark:text-surface-300 mt-1">
              Reason: <span className="font-medium">{message.reason}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <img
            src={message.authorAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50'}
            alt={message.author}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 p-3 rounded-lg bg-surface-50 dark:bg-surface-700">
            <p className="text-xs font-medium text-surface-900 dark:text-surface-50 mb-1">{message.author}</p>
            <p className="text-sm text-surface-700 dark:text-surface-300">{message.content}</p>
          </div>
        </div>

        <p className="text-xs text-surface-500 mb-4">
          Reported by <span className="font-medium">{message.reportedBy}</span>
        </p>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </motion.button>
          <motion.button
            onClick={onDismiss}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-200 dark:hover:bg-surface-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <XCircle className="w-4 h-4" />
            Dismiss
          </motion.button>
          <motion.button
            onClick={onDelete}
            className="px-3 py-2 rounded-lg bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-sm font-medium hover:bg-accent-200 dark:hover:bg-accent-900/50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// User Report Card
function UserReportCard({
  report,
  onWarn,
  onBan,
  onDismiss,
}: {
  report: UserReport;
  onWarn: () => void;
  onBan: () => void;
  onDismiss: () => void;
}) {
  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: 'text-secondary-600', bg: 'bg-secondary-100 dark:bg-secondary-900/30', label: 'Pending' },
    warning_sent: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Warning Sent' },
    banned: { color: 'text-accent-600', bg: 'bg-accent-100 dark:bg-accent-900/30', label: 'Banned' },
    dismissed: { color: 'text-surface-500', bg: 'bg-surface-100 dark:bg-surface-700', label: 'Dismissed' },
  };

  const status = statusConfig[report.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
    >
      <div className="flex items-start gap-4">
        <img
          src={report.reportedUserAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50'}
          alt={report.reportedUser}
          className="w-12 h-12 rounded-full object-cover border-2 border-surface-200 dark:border-surface-600"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">{report.reportedUser}</h3>
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', status.bg, status.color)}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-surface-500 mt-1">
            Reported by <span className="font-medium">{report.reportedBy}</span> in #{report.roomName}
          </p>
          <div className="mt-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <p className="text-xs font-medium text-accent-600 dark:text-accent-400 mb-1">{report.reason}</p>
            <p className="text-sm text-surface-700 dark:text-surface-300">{report.description}</p>
          </div>
          <p className="text-xs text-surface-400 mt-2">
            {formatDistanceToNow(report.reportedAt, { addSuffix: true })}
          </p>
        </div>
      </div>

      {report.status === 'pending' && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
          <motion.button
            onClick={onWarn}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary-500 text-surface-900 text-sm font-medium hover:bg-secondary-400"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AlertTriangle className="w-4 h-4" />
            Send Warning
          </motion.button>
          <motion.button
            onClick={onBan}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserX className="w-4 h-4" />
            Ban User
          </motion.button>
          <motion.button
            onClick={onDismiss}
            className="px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-sm font-medium hover:bg-surface-200 dark:hover:bg-surface-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <XCircle className="w-4 h-4" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

export default function AdminChat() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('rooms');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data
  const rooms: ChatRoom[] = [
    {
      id: '1',
      name: 'General Discussion',
      description: 'Public chat room for all civil servants to connect and discuss',
      type: 'public',
      memberCount: 1456,
      messageCount: 45632,
      messagesPerDay: 234,
      status: 'active',
      lastMessage: 'Looking forward to the new policy updates next week!',
      lastMessageBy: 'Kofi Mensah',
      createdAt: new Date(Date.now() - 86400000 * 180),
      lastActivity: new Date(Date.now() - 300000),
      isOfficial: true,
      pinnedMessages: 5,
    },
    {
      id: '2',
      name: 'Ministry of Finance',
      description: 'Official chat room for Ministry of Finance staff only',
      type: 'mda',
      mdaName: 'Ministry of Finance',
      memberCount: 189,
      messageCount: 12453,
      messagesPerDay: 78,
      status: 'active',
      lastMessage: 'The quarterly report templates are now available',
      lastMessageBy: 'Abena Owusu',
      createdAt: new Date(Date.now() - 86400000 * 120),
      lastActivity: new Date(Date.now() - 600000),
      isOfficial: true,
      pinnedMessages: 3,
    },
    {
      id: '3',
      name: 'IT Officers Network',
      description: 'Technical discussions and support for IT professionals across MDAs',
      type: 'private',
      memberCount: 87,
      messageCount: 8341,
      messagesPerDay: 56,
      status: 'active',
      lastMessage: 'Has anyone tested the new authentication module?',
      lastMessageBy: 'Kwame Asante',
      createdAt: new Date(Date.now() - 86400000 * 90),
      lastActivity: new Date(Date.now() - 1800000),
      isOfficial: false,
      pinnedMessages: 2,
    },
    {
      id: '4',
      name: 'Ghana Health Service',
      description: 'Official communication channel for GHS personnel',
      type: 'mda',
      mdaName: 'Ghana Health Service',
      memberCount: 312,
      messageCount: 23456,
      messagesPerDay: 145,
      status: 'active',
      lastMessage: 'Reminder: Staff meeting tomorrow at 10 AM',
      lastMessageBy: 'Dr. Yaa Mensah',
      createdAt: new Date(Date.now() - 86400000 * 150),
      lastActivity: new Date(Date.now() - 900000),
      isOfficial: true,
      pinnedMessages: 8,
    },
    {
      id: '5',
      name: 'Policy Research Group',
      description: 'Collaborative space for policy researchers and analysts',
      type: 'private',
      memberCount: 34,
      messageCount: 2341,
      messagesPerDay: 12,
      status: 'active',
      lastMessage: 'New research paper on civil service reforms attached',
      lastMessageBy: 'Prof. Ama Sarpong',
      createdAt: new Date(Date.now() - 86400000 * 60),
      lastActivity: new Date(Date.now() - 7200000),
      isOfficial: false,
      pinnedMessages: 1,
    },
    {
      id: '6',
      name: 'Announcements',
      description: 'Official announcements from OHCS leadership',
      type: 'public',
      memberCount: 2341,
      messageCount: 456,
      messagesPerDay: 3,
      status: 'active',
      lastMessage: 'Public holiday announcement for Independence Day',
      lastMessageBy: 'Admin',
      createdAt: new Date(Date.now() - 86400000 * 200),
      lastActivity: new Date(Date.now() - 86400000),
      isOfficial: true,
      pinnedMessages: 12,
    },
  ];

  const flaggedMessages: FlaggedMessage[] = [
    {
      id: '1',
      roomName: 'General Discussion',
      roomId: '1',
      content: 'This is inappropriate content that was flagged by community members for review.',
      author: 'John Doe',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50',
      reportedBy: 'Kofi Mensah',
      reason: 'Inappropriate language',
      reportedAt: new Date(Date.now() - 3600000),
      status: 'pending',
    },
    {
      id: '2',
      roomName: 'IT Officers Network',
      roomId: '3',
      content: 'Sharing unauthorized external links to suspicious websites.',
      author: 'Jane Smith',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50',
      reportedBy: 'Kwame Asante',
      reason: 'Spam / Suspicious links',
      reportedAt: new Date(Date.now() - 7200000),
      status: 'pending',
    },
    {
      id: '3',
      roomName: 'General Discussion',
      roomId: '1',
      content: 'Heated political discussion that went off-topic.',
      author: 'Samuel Adjei',
      reportedBy: 'Abena Owusu',
      reason: 'Off-topic / Political content',
      reportedAt: new Date(Date.now() - 10800000),
      status: 'pending',
    },
  ];

  const userReports: UserReport[] = [
    {
      id: '1',
      reportedUser: 'Michael Asamoah',
      reportedUserAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50',
      reportedBy: 'Ama Serwaa',
      reason: 'Harassment',
      description: 'Repeatedly sending unwanted messages and making others uncomfortable in group chats.',
      roomName: 'General Discussion',
      reportedAt: new Date(Date.now() - 86400000),
      status: 'pending',
    },
    {
      id: '2',
      reportedUser: 'Grace Appiah',
      reportedUserAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50',
      reportedBy: 'Kofi Bonsu',
      reason: 'Spam',
      description: 'Posting promotional content repeatedly in multiple chat rooms.',
      roomName: 'IT Officers Network',
      reportedAt: new Date(Date.now() - 172800000),
      status: 'warning_sent',
    },
  ];

  const stats = [
    { label: 'Active Rooms', value: '45', change: '+3', icon: Hash, color: 'green' },
    { label: 'Online Users', value: '234', change: '+15%', icon: Users, color: 'blue' },
    { label: 'Messages Today', value: '1,892', change: '+23%', icon: MessageCircle, color: 'gold' },
    { label: 'Flagged Content', value: '3', change: '-2', icon: AlertTriangle, color: 'red', negative: true },
  ];

  const tabs = [
    { id: 'rooms', label: 'Chat Rooms', count: rooms.length },
    { id: 'flagged', label: 'Flagged Messages', count: flaggedMessages.length },
    { id: 'reports', label: 'User Reports', count: userReports.filter(r => r.status === 'pending').length },
    { id: 'settings', label: 'Settings' },
  ];

  const toggleRoomSelection = (id: string) => {
    setSelectedRooms((prev) =>
      prev.includes(id) ? prev.filter((roomId) => roomId !== id) : [...prev, id]
    );
  };

  const selectAllRooms = () => {
    if (selectedRooms.length === rooms.length) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(rooms.map((r) => r.id));
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || room.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
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
              Chat Management
            </motion.h1>
            <motion.p
              className="text-surface-600 dark:text-surface-400 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Manage chat rooms, moderate messages, and handle user reports
            </motion.p>
          </div>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-shadow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Plus className="w-5 h-5" />
            Create Room
          </motion.button>
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

        {/* Rooms Tab */}
        {selectedTab === 'rooms' && (
          <>
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search chat rooms..."
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
                        Room Type
                      </label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">All Types</option>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="mda">MDA</option>
                      </select>
                    </div>
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
                        <option value="muted">Muted</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setTypeFilter('all');
                          setStatusFilter('all');
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
              {selectedRooms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                >
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {selectedRooms.length} room{selectedRooms.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700">
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700">
                      <VolumeX className="w-4 h-4" />
                      Mute
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedRooms([])}
                      className="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rooms Grid/Table */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      isSelected={selectedRooms.includes(room.id)}
                      onSelect={() => toggleRoomSelection(room.id)}
                      onView={() => {}}
                      onEdit={() => {}}
                      onArchive={() => {}}
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
                          onClick={selectAllRooms}
                          className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                            selectedRooms.length === rooms.length
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
                          )}
                        >
                          {selectedRooms.length === rooms.length && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </button>
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Messages
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map((room) => (
                      <RoomRow
                        key={room.id}
                        room={room}
                        isSelected={selectedRooms.includes(room.id)}
                        onSelect={() => toggleRoomSelection(room.id)}
                        onView={() => {}}
                        onEdit={() => {}}
                        onArchive={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Flagged Messages Tab */}
        {selectedTab === 'flagged' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {flaggedMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FlaggedMessageCard
                  message={message}
                  onApprove={() => {}}
                  onDismiss={() => {}}
                  onDelete={() => {}}
                />
              </motion.div>
            ))}
            {flaggedMessages.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  No flagged messages
                </h3>
                <p className="text-surface-500 mt-1">
                  All messages have been reviewed. Great job!
                </p>
              </div>
            )}
          </div>
        )}

        {/* User Reports Tab */}
        {selectedTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <UserReportCard
                  report={report}
                  onWarn={() => {}}
                  onBan={() => {}}
                  onDismiss={() => {}}
                />
              </motion.div>
            ))}
            {userReports.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  No user reports
                </h3>
                <p className="text-surface-500 mt-1">
                  There are no pending user reports to review.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">General Settings</h3>
                  <p className="text-sm text-surface-500">Configure global chat settings</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Allow public rooms</p>
                    <p className="text-sm text-surface-500">Users can create public chat rooms</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Allow file sharing</p>
                    <p className="text-sm text-surface-500">Users can share files in chat</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Message editing</p>
                    <p className="text-sm text-surface-500">Allow users to edit sent messages</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Message reactions</p>
                    <p className="text-sm text-surface-500">Allow emoji reactions on messages</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Moderation Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">Moderation</h3>
                  <p className="text-sm text-surface-500">Content moderation settings</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Auto-flag spam</p>
                    <p className="text-sm text-surface-500">Automatically detect and flag spam</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Profanity filter</p>
                    <p className="text-sm text-surface-500">Filter inappropriate language</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div>
                  <label className="block font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Auto-ban after reports
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600"
                  />
                  <p className="text-xs text-surface-500 mt-1">
                    Automatically ban users after this many reports
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Rate Limiting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-secondary-600 dark:text-secondary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">Rate Limiting</h3>
                  <p className="text-sm text-surface-500">Control message frequency</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Messages per minute
                  </label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Slowmode (seconds)
                  </label>
                  <input
                    type="number"
                    defaultValue={0}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600"
                  />
                  <p className="text-xs text-surface-500 mt-1">
                    0 = disabled. Time users must wait between messages.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Notification Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">Notifications</h3>
                  <p className="text-sm text-surface-500">Admin notification preferences</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Flagged content</p>
                    <p className="text-sm text-surface-500">Notify when content is flagged</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">User reports</p>
                    <p className="text-sm text-surface-500">Notify on new user reports</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Daily digest</p>
                    <p className="text-sm text-surface-500">Receive daily moderation summary</p>
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

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
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
                      Create Chat Room
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
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
                    Room Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., General Discussion"
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the chat room..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Room Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'public', icon: Globe, label: 'Public', color: 'primary' },
                      { type: 'private', icon: Lock, label: 'Private', color: 'secondary' },
                      { type: 'mda', icon: Building2, label: 'MDA', color: 'blue' },
                    ].map((option) => (
                      <button
                        key={option.type}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-surface-200 dark:border-surface-600 hover:border-primary-400 transition-colors"
                      >
                        <option.icon className="w-6 h-6 text-surface-500" />
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="official"
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <label htmlFor="official" className="text-sm text-surface-700 dark:text-surface-300">
                    Mark as official OHCS room
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-surface-200 dark:border-surface-700 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
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
                  Create Room
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
