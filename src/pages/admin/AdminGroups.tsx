import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Eye,
  Trash2,
  Shield,
  Plus,
  TrendingUp,
  UserPlus,
  Lock,
  Globe,
  CheckCircle,
  XCircle,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  Edit3,
  MessageSquare,
  Calendar,
  Crown,
  Star,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings,
  Bell,
  FileText,
  RefreshCw,
  Building2,
  Award,
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
interface Group {
  id: string;
  name: string;
  description: string;
  type: 'open' | 'closed' | 'private' | 'official';
  category: string;
  categoryColor: string;
  memberCount: number;
  postCount: number;
  postsPerWeek: number;
  status: 'active' | 'inactive' | 'flagged' | 'pending';
  owner: { name: string; avatar?: string; role: string };
  admins: { name: string; avatar?: string }[];
  coverImage?: string;
  createdAt: Date;
  lastActivity: Date;
  isVerified: boolean;
  isFeatured: boolean;
}

interface MemberRequest {
  id: string;
  user: { name: string; avatar?: string; role: string; mda: string };
  group: string;
  groupId: string;
  requestedAt: Date;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface FlaggedGroup {
  id: string;
  groupName: string;
  groupId: string;
  reason: string;
  reportedBy: string;
  reportedAt: Date;
  description: string;
  status: 'pending' | 'reviewed' | 'dismissed';
}

// Group Card Component
function GroupCard({
  group,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onMakeOfficial,
}: {
  group: Group;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMakeOfficial: () => void;
}) {
  const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    open: { icon: Globe, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30', label: 'Open' },
    closed: { icon: Lock, color: 'text-secondary-500', bg: 'bg-secondary-100 dark:bg-secondary-900/30', label: 'Closed' },
    private: { icon: Lock, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Private' },
    official: { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Official' },
  };

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30', label: 'Active' },
    inactive: { color: 'text-surface-500', bg: 'bg-surface-100 dark:bg-surface-700', label: 'Inactive' },
    flagged: { color: 'text-accent-600', bg: 'bg-accent-100 dark:bg-accent-900/30', label: 'Flagged' },
    pending: { color: 'text-secondary-600', bg: 'bg-secondary-100 dark:bg-secondary-900/30', label: 'Pending' },
  };

  const config = typeConfig[group.type];
  const status = statusConfig[group.status];
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
              : 'border-surface-300 dark:border-surface-600 bg-white/80 dark:bg-surface-800/80 hover:border-primary-400'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
        </motion.button>
      </div>

      {/* Badges */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {group.isVerified && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500 text-white text-[10px] font-bold">
            <Shield className="w-3 h-3" />
            VERIFIED
          </div>
        )}
        {group.isFeatured && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary-500 text-surface-900 text-[10px] font-bold">
            <Star className="w-3 h-3" />
            FEATURED
          </div>
        )}
      </div>

      {/* Cover image */}
      <div className="relative h-32 overflow-hidden">
        {group.coverImage ? (
          <img src={group.coverImage} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${group.categoryColor}40, ${group.categoryColor}20)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full', config.bg, config.color)}>
            <TypeIcon className="w-3 h-3 inline mr-1" />
            {config.label}
          </span>
          <span className="text-xs text-white/80">
            {group.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 truncate">
          {group.name}
        </h3>
        <p className="text-sm text-surface-500 mt-1 line-clamp-2">{group.description}</p>

        {/* Owner */}
        <div className="flex items-center gap-3 mt-4">
          <img
            src={group.owner.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50'}
            alt={group.owner.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-surface-700"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
              {group.owner.name}
            </p>
            <p className="text-xs text-surface-500">{group.owner.role}</p>
          </div>
          <Crown className="w-4 h-4 text-secondary-500" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-1.5 text-sm text-surface-500">
            <Users className="w-4 h-4" />
            <span>{group.memberCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-surface-500">
            <MessageSquare className="w-4 h-4" />
            <span>{group.postCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-surface-500">
            <TrendingUp className="w-4 h-4" />
            <span>{group.postsPerWeek}/week</span>
          </div>
        </div>

        {/* Status and activity */}
        <div className="flex items-center justify-between mt-4">
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full', status.bg, status.color)}>
            {status.label}
          </span>
          <span className="text-xs text-surface-400">
            Active {formatDistanceToNow(group.lastActivity, { addSuffix: true })}
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
          {group.type !== 'official' && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onMakeOfficial();
              }}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="w-4 h-4" />
            </motion.button>
          )}
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

// Group Row Component (for table view)
function GroupRow({
  group,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onMakeOfficial,
}: {
  group: Group;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMakeOfficial: () => void;
}) {
  const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    open: { icon: Globe, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30', label: 'Open' },
    closed: { icon: Lock, color: 'text-secondary-600', bg: 'bg-secondary-100 dark:bg-secondary-900/30', label: 'Closed' },
    private: { icon: Lock, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Private' },
    official: { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Official' },
  };

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30', label: 'Active' },
    inactive: { color: 'text-surface-500', bg: 'bg-surface-100 dark:bg-surface-700', label: 'Inactive' },
    flagged: { color: 'text-accent-600', bg: 'bg-accent-100 dark:bg-accent-900/30', label: 'Flagged' },
    pending: { color: 'text-secondary-600', bg: 'bg-secondary-100 dark:bg-secondary-900/30', label: 'Pending' },
  };

  const config = typeConfig[group.type];
  const status = statusConfig[group.status];
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
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${group.categoryColor}20` }}
          >
            <Users className="w-5 h-5" style={{ color: group.categoryColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-surface-900 dark:text-surface-50">{group.name}</span>
              {group.isVerified && <Shield className="w-4 h-4 text-blue-500" />}
              {group.isFeatured && <Star className="w-4 h-4 text-secondary-500" />}
            </div>
            <p className="text-xs text-surface-500 truncate max-w-xs">{group.description}</p>
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
        <div className="flex items-center gap-2">
          <img
            src={group.owner.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50'}
            alt={group.owner.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm text-surface-700 dark:text-surface-300">{group.owner.name}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 text-surface-700 dark:text-surface-300">
          <Users className="w-4 h-4 text-surface-400" />
          <span className="font-medium">{group.memberCount}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 text-surface-700 dark:text-surface-300">
          <MessageSquare className="w-4 h-4 text-surface-400" />
          <span>{group.postCount}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', status.bg, status.color)}>
          {status.label}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-surface-500">
          {formatDistanceToNow(group.lastActivity, { addSuffix: true })}
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
          {group.type !== 'official' && (
            <motion.button
              onClick={onMakeOfficial}
              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Shield className="w-4 h-4" />
            </motion.button>
          )}
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

// Member Request Card
function MemberRequestCard({
  request,
  onApprove,
  onReject,
}: {
  request: MemberRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
    >
      <div className="flex items-start gap-4">
        <img
          src={request.user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50'}
          alt={request.user.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-surface-200 dark:border-surface-600"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">{request.user.name}</h3>
              <p className="text-sm text-surface-500">{request.user.role} at {request.user.mda}</p>
            </div>
            <span className="text-xs text-surface-400">
              {formatDistanceToNow(request.requestedAt, { addSuffix: true })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-surface-500">Wants to join</span>
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30">
              {request.group}
            </span>
          </div>
          {request.message && (
            <p className="mt-2 text-sm text-surface-700 dark:text-surface-300 p-2 rounded-lg bg-surface-50 dark:bg-surface-700/50">
              "{request.message}"
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
        <motion.button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <UserCheck className="w-4 h-4" />
          Approve
        </motion.button>
        <motion.button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-200 dark:hover:bg-surface-600"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <UserX className="w-4 h-4" />
          Reject
        </motion.button>
      </div>
    </motion.div>
  );
}

// Flagged Group Card
function FlaggedGroupCard({
  report,
  onReview,
  onDismiss,
  onDelete,
}: {
  report: FlaggedGroup;
  onReview: () => void;
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
            <AlertTriangle className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-surface-900 dark:text-surface-50">
                {report.groupName}
              </span>
              <span className="text-xs text-surface-400">•</span>
              <span className="text-xs text-surface-500">
                {formatDistanceToNow(report.reportedAt, { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-accent-600 dark:text-accent-400 mt-1">
              Reason: <span className="font-medium">{report.reason}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-surface-700 dark:text-surface-300">{report.description}</p>
        <p className="text-xs text-surface-500 mt-3">
          Reported by <span className="font-medium">{report.reportedBy}</span>
        </p>

        <div className="flex items-center gap-2 mt-4">
          <motion.button
            onClick={onReview}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="w-4 h-4" />
            Review
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

export default function AdminGroups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Groups data - to be populated from API
  const groups: Group[] = [];

  const memberRequests: MemberRequest[] = [];

  const flaggedGroups: FlaggedGroup[] = [];

  const stats = [
    { label: 'Total Groups', value: '0', icon: Users, color: 'green', change: '+0%' },
    { label: 'Active Members', value: '0', icon: UserPlus, color: 'blue', change: '+0%' },
    { label: 'Posts This Week', value: '0', icon: MessageSquare, color: 'gold', change: '+0%' },
    { label: 'Official Groups', value: '0', icon: Shield, color: 'purple', change: '+0%' },
  ];

  const tabs = [
    { id: 'all', label: 'All Groups', count: groups.length },
    { id: 'official', label: 'Official', count: groups.filter(g => g.type === 'official').length },
    { id: 'requests', label: 'Join Requests', count: memberRequests.filter(r => r.status === 'pending').length },
    { id: 'flagged', label: 'Flagged', count: flaggedGroups.filter(f => f.status === 'pending').length },
    { id: 'settings', label: 'Settings' },
  ];

  const toggleGroupSelection = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((groupId) => groupId !== id) : [...prev, id]
    );
  };

  const selectAllGroups = () => {
    if (selectedGroups.length === groups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(groups.map((g) => g.id));
    }
  };

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || group.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
    const matchesTab = selectedTab === 'all' || selectedTab === 'settings' || selectedTab === 'requests' || selectedTab === 'flagged' || group.type === selectedTab;
    return matchesSearch && matchesType && matchesStatus && matchesTab;
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
              Groups Management
            </motion.h1>
            <motion.p
              className="text-surface-600 dark:text-surface-400 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Manage user groups, communities, and official organizations
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
            Create Official Group
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
        <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
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

        {/* Groups Tab (All or Official) */}
        {(selectedTab === 'all' || selectedTab === 'official') && (
          <>
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search groups..."
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
                        Group Type
                      </label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">All Types</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="private">Private</option>
                        <option value="official">Official</option>
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
                        <option value="inactive">Inactive</option>
                        <option value="flagged">Flagged</option>
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
              {selectedGroups.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                >
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {selectedGroups.length} group{selectedGroups.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700">
                      <Shield className="w-4 h-4" />
                      Make Official
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700">
                      <Star className="w-4 h-4" />
                      Feature
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedGroups([])}
                      className="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Groups Grid/Table */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isSelected={selectedGroups.includes(group.id)}
                      onSelect={() => toggleGroupSelection(group.id)}
                      onView={() => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onMakeOfficial={() => {}}
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
                          onClick={selectAllGroups}
                          className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                            selectedGroups.length === groups.length
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
                          )}
                        >
                          {selectedGroups.length === groups.length && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </button>
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Group
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Posts
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
                    {filteredGroups.map((group) => (
                      <GroupRow
                        key={group.id}
                        group={group}
                        isSelected={selectedGroups.includes(group.id)}
                        onSelect={() => toggleGroupSelection(group.id)}
                        onView={() => {}}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onMakeOfficial={() => {}}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Join Requests Tab */}
        {selectedTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {memberRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <MemberRequestCard
                  request={request}
                  onApprove={() => {}}
                  onReject={() => {}}
                />
              </motion.div>
            ))}
            {memberRequests.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <UserCheck className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  No pending requests
                </h3>
                <p className="text-surface-500 mt-1">
                  All membership requests have been processed.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Flagged Tab */}
        {selectedTab === 'flagged' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {flaggedGroups.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FlaggedGroupCard
                  report={report}
                  onReview={() => {}}
                  onDismiss={() => {}}
                  onDelete={() => {}}
                />
              </motion.div>
            ))}
            {flaggedGroups.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  No flagged groups
                </h3>
                <p className="text-surface-500 mt-1">
                  All groups are in good standing.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Group Creation Settings */}
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
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">Group Creation</h3>
                  <p className="text-sm text-surface-500">Control who can create groups</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Allow open groups</p>
                    <p className="text-sm text-surface-500">Users can create public groups</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Allow closed groups</p>
                    <p className="text-sm text-surface-500">Users can create invite-only groups</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Require approval</p>
                    <p className="text-sm text-surface-500">New groups need admin approval</p>
                  </div>
                  <button className="relative w-12 h-6 bg-surface-200 dark:bg-surface-600 rounded-full transition-colors">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Group Limits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-secondary-600 dark:text-secondary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">Group Limits</h3>
                  <p className="text-sm text-surface-500">Set membership and posting limits</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Max members per group
                  </label>
                  <input
                    type="number"
                    defaultValue={1000}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Max groups per user
                  </label>
                  <input
                    type="number"
                    defaultValue={20}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-surface-900 dark:text-surface-50 mb-2">
                    Max admins per group
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-full px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600"
                  />
                </div>
              </div>
            </motion.div>

            {/* Content Policy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">Content Policy</h3>
                  <p className="text-sm text-surface-500">Group content moderation settings</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Auto-moderate posts</p>
                    <p className="text-sm text-surface-500">Filter inappropriate content</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Allow file uploads</p>
                    <p className="text-sm text-surface-500">Members can share files in groups</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Allow events</p>
                    <p className="text-sm text-surface-500">Groups can create events</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
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
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">Admin Notifications</h3>
                  <p className="text-sm text-surface-500">Get notified about group activities</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">New group created</p>
                    <p className="text-sm text-surface-500">Notify when new groups are created</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Group reported</p>
                    <p className="text-sm text-surface-500">Notify when groups are flagged</p>
                  </div>
                  <button className="relative w-12 h-6 bg-primary-500 rounded-full transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">Weekly summary</p>
                    <p className="text-sm text-surface-500">Receive weekly group stats digest</p>
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

      {/* Create Group Modal */}
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
                      Create Official Group
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
                    Group Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., IT Officers Network"
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the group's purpose..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Category
                  </label>
                  <select className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 focus:ring-2 focus:ring-primary-500">
                    <option value="">Select a category</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="research">Research</option>
                    <option value="networking">Networking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Group Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: 'open', icon: Globe, label: 'Open', desc: 'Anyone can join' },
                      { type: 'closed', icon: Lock, label: 'Closed', desc: 'Approval required' },
                    ].map((option) => (
                      <button
                        key={option.type}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-surface-200 dark:border-surface-600 hover:border-primary-400 transition-colors"
                      >
                        <option.icon className="w-6 h-6 text-surface-500" />
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                          {option.label}
                        </span>
                        <span className="text-xs text-surface-400">{option.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="verified"
                    defaultChecked
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <label htmlFor="verified" className="text-sm text-surface-700 dark:text-surface-300">
                    Mark as verified official group
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
                  Create Group
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
