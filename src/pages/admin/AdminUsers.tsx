import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Shield,
  Ban,
  Mail,
  Download,
  ChevronDown,
  X,
  Check,
  Eye,
  UserCheck,
  UserX,
  Clock,
  Building2,
  Sparkles,
  Grid3X3,
  List,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  TableProperties,
  Loader2,
  Key,
  Lock,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

// Permission groups for UI organization
const PERMISSION_GROUPS = {
  dashboard: { label: 'Dashboard', permissions: ['view_admin_dashboard'] },
  users: { label: 'User Management', permissions: ['view_users', 'create_users', 'edit_users', 'delete_users', 'manage_user_roles'] },
  documents: { label: 'Documents', permissions: ['view_documents', 'upload_documents', 'edit_documents', 'delete_documents', 'approve_documents'] },
  forum: { label: 'Forum', permissions: ['view_forum_admin', 'moderate_forum', 'delete_forum_posts', 'manage_forum_categories'] },
  chat: { label: 'Chat', permissions: ['view_chat_admin', 'moderate_chat', 'delete_chat_messages'] },
  groups: { label: 'Groups', permissions: ['view_groups_admin', 'create_groups', 'edit_groups', 'delete_groups'] },
  news: { label: 'News', permissions: ['view_news_admin', 'manage_news_sources', 'edit_articles', 'delete_articles'] },
  analytics: { label: 'Analytics', permissions: ['view_analytics', 'export_reports'] },
  settings: { label: 'Settings', permissions: ['view_settings', 'edit_settings'] },
  backup: { label: 'Backup', permissions: ['manage_backups', 'restore_backups'] },
  audit: { label: 'Audit', permissions: ['view_audit_logs'] },
  wellness: { label: 'Wellness', permissions: ['view_wellness_admin', 'manage_wellness_resources', 'view_escalations', 'manage_counselors'] },
};

const PERMISSION_LABELS: Record<string, string> = {
  view_admin_dashboard: 'View Dashboard',
  view_users: 'View Users',
  create_users: 'Create Users',
  edit_users: 'Edit Users',
  delete_users: 'Delete Users',
  manage_user_roles: 'Manage Roles',
  view_documents: 'View Documents',
  upload_documents: 'Upload Documents',
  edit_documents: 'Edit Documents',
  delete_documents: 'Delete Documents',
  approve_documents: 'Approve Documents',
  view_forum_admin: 'View Forum Admin',
  moderate_forum: 'Moderate Forum',
  delete_forum_posts: 'Delete Posts',
  manage_forum_categories: 'Manage Categories',
  view_chat_admin: 'View Chat Admin',
  moderate_chat: 'Moderate Chat',
  delete_chat_messages: 'Delete Messages',
  view_groups_admin: 'View Groups Admin',
  create_groups: 'Create Groups',
  edit_groups: 'Edit Groups',
  delete_groups: 'Delete Groups',
  view_news_admin: 'View News Admin',
  manage_news_sources: 'Manage Sources',
  edit_articles: 'Edit Articles',
  delete_articles: 'Delete Articles',
  view_analytics: 'View Analytics',
  export_reports: 'Export Reports',
  view_settings: 'View Settings',
  edit_settings: 'Edit Settings',
  manage_backups: 'Manage Backups',
  restore_backups: 'Restore Backups',
  view_audit_logs: 'View Audit Logs',
  view_wellness_admin: 'View Wellness Admin',
  manage_wellness_resources: 'Manage Resources',
  view_escalations: 'View Escalations',
  manage_counselors: 'Manage Counselors',
};

// ============================================================================
// TYPES
// ============================================================================
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  mda: string;
  department?: string;
  title?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLogin: string;
  createdAt: string;
  xp: number;
  level: number;
  permissions?: Record<string, boolean>;
}

// ============================================================================
// PERMISSIONS MODAL
// ============================================================================
interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userId: string, role: string, permissions: Record<string, boolean>) => Promise<void>;
}

function PermissionsModal({ isOpen, onClose, user, onSave }: PermissionsModalProps) {
  const [role, setRole] = useState(user?.role || 'user');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setPermissions(user.permissions || {});
    }
  }, [user]);

  const handleTogglePermission = (permission: string) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleToggleGroup = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS];
    const allEnabled = group.permissions.every(p => permissions[p]);

    const newPermissions = { ...permissions };
    group.permissions.forEach(p => {
      newPermissions[p] = !allEnabled;
    });
    setPermissions(newPermissions);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await onSave(user.id, role, permissions);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const roles = [
    { value: 'user', label: 'User' },
    { value: 'contributor', label: 'Contributor' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'librarian', label: 'Librarian' },
    { value: 'counselor', label: 'Counselor' },
    { value: 'admin', label: 'Admin' },
    { value: 'director', label: 'Director' },
    { value: 'super_admin', label: 'Super Admin' },
  ];

  return (
    <AnimatePresence>
      {isOpen && user && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-2xl bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                      Manage Permissions
                    </h2>
                    <p className="text-sm text-surface-500">{user.name} ({user.email})</p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-surface-500" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {roles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                    Granular Permissions
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                      const enabledCount = group.permissions.filter(p => permissions[p]).length;
                      const allEnabled = enabledCount === group.permissions.length;
                      const someEnabled = enabledCount > 0 && !allEnabled;

                      return (
                        <div key={groupKey} className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                          <button
                            onClick={() => handleToggleGroup(groupKey)}
                            className="w-full flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                                allEnabled
                                  ? 'bg-primary-500 border-primary-500 text-white'
                                  : someEnabled
                                    ? 'bg-primary-200 border-primary-500'
                                    : 'border-surface-300 dark:border-surface-600'
                              )}>
                                {allEnabled && <Check className="w-3 h-3" />}
                                {someEnabled && <div className="w-2 h-2 bg-primary-500 rounded-sm" />}
                              </div>
                              <span className="font-medium text-surface-900 dark:text-surface-50">
                                {group.label}
                              </span>
                            </div>
                            <span className="text-sm text-surface-500">
                              {enabledCount}/{group.permissions.length}
                            </span>
                          </button>
                          <div className="p-4 grid grid-cols-2 gap-2">
                            {group.permissions.map(permission => (
                              <label
                                key={permission}
                                className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!permissions[permission]}
                                  onChange={() => handleTogglePermission(permission)}
                                  className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-sm text-surface-700 dark:text-surface-300">
                                  {PERMISSION_LABELS[permission] || permission}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-200 dark:border-surface-700 flex-shrink-0">
                <motion.button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Save Permissions
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// ANIMATED BACKGROUND
// ============================================================================
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 107, 63, 0.12) 0%, transparent 70%)',
          top: '-15%',
          right: '-10%',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(252, 209, 22, 0.08) 0%, transparent 70%)',
          bottom: '10%',
          left: '-5%',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 107, 63, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 107, 63, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  change?: number;
  delay?: number;
}

function StatCard({ label, value, icon: Icon, color, change, delay = 0 }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-pointer"
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}40, transparent 70%)`,
          filter: 'blur(15px)',
        }}
      />

      <motion.div
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-800/90 backdrop-blur-xl border border-surface-200/50 dark:border-surface-700/50 p-5"
        animate={{ scale: isHovered ? 1.02 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          boxShadow: isHovered
            ? `0 20px 40px -12px ${color}30`
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">{label}</p>
            <motion.p
              className="text-3xl font-bold text-surface-900 dark:text-surface-50"
              initial={{ scale: 0.5 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: delay + 0.2, type: 'spring' }}
            >
              {value.toLocaleString()}
            </motion.p>
            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 mt-1 text-xs font-medium',
                change >= 0 ? 'text-success-600' : 'text-error-600'
              )}>
                {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{Math.abs(change)}% this week</span>
              </div>
            )}
          </div>
          <motion.div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
            animate={{ rotate: isHovered ? 10 : 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Icon className="w-7 h-7" style={{ color }} />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// USER CARD (Grid View)
// ============================================================================
interface UserCardProps {
  user: User;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (action: string) => void;
  delay?: number;
}

function UserCard({ user, isSelected, onSelect, onAction, delay = 0 }: UserCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [showActions, setShowActions] = useState(false);

  const statusColors = {
    active: { bg: 'bg-success-500', text: 'text-success-600', label: 'Active' },
    inactive: { bg: 'bg-surface-400', text: 'text-surface-600', label: 'Inactive' },
    suspended: { bg: 'bg-error-500', text: 'text-error-600', label: 'Suspended' },
    pending: { bg: 'bg-warning-500', text: 'text-warning-600', label: 'Pending' },
  };

  const roleColors: Record<string, string> = {
    admin: '#CE1126',
    moderator: '#FCD116',
    civil_servant: '#006B3F',
    director: '#3B82F6',
    guest: '#6B7280',
  };

  const status = statusColors[user.status];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      className={cn(
        'relative group overflow-hidden rounded-2xl bg-white dark:bg-surface-800/90 backdrop-blur-xl border-2 transition-all duration-300',
        isSelected
          ? 'border-primary-500 shadow-lg shadow-primary-500/20'
          : 'border-surface-200/50 dark:border-surface-700/50 hover:border-surface-300 dark:hover:border-surface-600'
      )}
    >
      {/* Selection checkbox */}
      <motion.button
        onClick={onSelect}
        className={cn(
          'absolute top-3 left-3 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
          isSelected
            ? 'bg-primary-500 border-primary-500 text-white'
            : 'bg-white/80 dark:bg-surface-800/80 border-surface-300 dark:border-surface-600'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isSelected && <Check className="w-4 h-4" />}
      </motion.button>

      {/* Actions button */}
      <div className="absolute top-3 right-3 z-10">
        <motion.button
          onClick={() => setShowActions(!showActions)}
          className="w-8 h-8 rounded-lg bg-white/80 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MoreHorizontal className="w-4 h-4 text-surface-600 dark:text-surface-400" />
        </motion.button>

        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute right-0 top-full mt-2 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-2 min-w-[160px] z-20"
            >
              {[
                { icon: Eye, label: 'View Profile', action: 'view', color: 'text-surface-600' },
                { icon: Edit2, label: 'Edit User', action: 'edit', color: 'text-surface-600' },
                { icon: Shield, label: 'Change Role', action: 'role', color: 'text-surface-600' },
                { icon: Mail, label: 'Send Email', action: 'email', color: 'text-surface-600' },
                { icon: Ban, label: 'Suspend', action: 'suspend', color: 'text-warning-600' },
                { icon: Trash2, label: 'Delete', action: 'delete', color: 'text-error-600' },
              ].map((item, i) => (
                <motion.button
                  key={item.action}
                  onClick={() => {
                    onAction(item.action);
                    setShowActions(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors',
                    item.color
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card content */}
      <div className="p-6 pt-12">
        {/* Avatar and status */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-3">
            <motion.div
              className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: roleColors[user.role] || '#006B3F' }}
                >
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
            </motion.div>
            {/* Status indicator */}
            <div className={cn('absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-surface-800', status.bg)} />
          </div>

          <h3 className="font-semibold text-surface-900 dark:text-surface-50 text-center">
            {user.name}
          </h3>
          <p className="text-sm text-surface-500 truncate max-w-full">{user.email}</p>
        </div>

        {/* Role badge */}
        <div className="flex justify-center mb-4">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold text-white capitalize"
            style={{ backgroundColor: roleColors[user.role] || '#6B7280' }}
          >
            {user.role.replace('_', ' ')}
          </span>
        </div>

        {/* Info grid */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{user.mda}</span>
          </div>
          <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Level and XP */}
        <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-sm font-bold text-surface-900">
                {user.level}
              </div>
              <span className="text-sm text-surface-600 dark:text-surface-400">Level</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                {user.xp.toLocaleString()} XP
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// USER ROW (Table View)
// ============================================================================
interface UserRowProps {
  user: User;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (action: string) => void;
  delay?: number;
}

function UserRow({ user, isSelected, onSelect, onAction, delay = 0 }: UserRowProps) {
  const [showActions, setShowActions] = useState(false);

  const statusConfig = {
    active: { icon: CheckCircle2, color: 'text-success-600 bg-success-100 dark:bg-success-900/30', label: 'Active' },
    inactive: { icon: XCircle, color: 'text-surface-500 bg-surface-100 dark:bg-surface-700', label: 'Inactive' },
    suspended: { icon: Ban, color: 'text-error-600 bg-error-100 dark:bg-error-900/30', label: 'Suspended' },
    pending: { icon: Clock, color: 'text-warning-600 bg-warning-100 dark:bg-warning-900/30', label: 'Pending' },
  };

  const roleColors: Record<string, string> = {
    admin: '#CE1126',
    moderator: '#FCD116',
    civil_servant: '#006B3F',
    director: '#3B82F6',
    guest: '#6B7280',
  };

  const status = statusConfig[user.status];
  const StatusIcon = status.icon;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={cn(
        'group transition-colors',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
      )}
    >
      {/* Checkbox */}
      <td className="py-4 pl-6 pr-3">
        <motion.button
          onClick={onSelect}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'border-surface-300 dark:border-surface-600 hover:border-primary-500'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </motion.button>
      </td>

      {/* User */}
      <td className="py-4 pr-3">
        <div className="flex items-center gap-3">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: roleColors[user.role] || '#006B3F' }}
                >
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
            </div>
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-surface-800',
              user.status === 'active' ? 'bg-success-500' :
              user.status === 'suspended' ? 'bg-error-500' :
              user.status === 'pending' ? 'bg-warning-500' : 'bg-surface-400'
            )} />
          </motion.div>
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50">{user.name}</p>
            <p className="text-xs text-surface-500">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="py-4 pr-3">
        <span
          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white capitalize"
          style={{ backgroundColor: roleColors[user.role] || '#6B7280' }}
        >
          {user.role.replace('_', ' ')}
        </span>
      </td>

      {/* MDA */}
      <td className="py-4 pr-3">
        <span className="text-sm text-surface-600 dark:text-surface-400 truncate block max-w-[180px]">
          {user.mda}
        </span>
      </td>

      {/* Status */}
      <td className="py-4 pr-3">
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', status.color)}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </span>
      </td>

      {/* Level */}
      <td className="py-4 pr-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-xs font-bold text-surface-900">
            {user.level}
          </div>
          <span className="text-sm text-surface-500">{user.xp.toLocaleString()} XP</span>
        </div>
      </td>

      {/* Last Login */}
      <td className="py-4 pr-3">
        <span className="text-sm text-surface-500">
          {new Date(user.lastLogin).toLocaleDateString()}
        </span>
      </td>

      {/* Actions */}
      <td className="py-4 pr-6">
        <div className="relative">
          <motion.button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-4 h-4 text-surface-500" />
          </motion.button>

          <AnimatePresence>
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="absolute right-0 top-full mt-1 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-2 min-w-[160px] z-20"
                >
                  {[
                    { icon: Eye, label: 'View', action: 'view', color: 'text-surface-600 dark:text-surface-400' },
                    { icon: Edit2, label: 'Edit', action: 'edit', color: 'text-surface-600 dark:text-surface-400' },
                    { icon: Shield, label: 'Role', action: 'role', color: 'text-surface-600 dark:text-surface-400' },
                    { icon: Mail, label: 'Email', action: 'email', color: 'text-surface-600 dark:text-surface-400' },
                    { icon: Ban, label: 'Suspend', action: 'suspend', color: 'text-warning-600' },
                    { icon: Trash2, label: 'Delete', action: 'delete', color: 'text-error-600' },
                  ].map((item, i) => (
                    <motion.button
                      key={item.action}
                      onClick={() => {
                        onAction(item.action);
                        setShowActions(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors',
                        item.color
                      )}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </td>
    </motion.tr>
  );
}

// ============================================================================
// ADD USER MODAL
// ============================================================================
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    staffId: '',
    role: 'civil_servant',
    mda: '',
    department: '',
    title: '',
  });

  const roles = [
    { value: 'civil_servant', label: 'Civil Servant' },
    { value: 'admin', label: 'Admin' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'director', label: 'Director' },
    { value: 'librarian', label: 'Librarian' },
  ];

  const mdas = [
    'Office of the Head of Civil Service',
    'Ministry of Finance',
    'Ministry of Health',
    'Ministry of Education',
    'Public Services Commission',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-xl bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header gradient */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: 'linear-gradient(90deg, #006B3F, #FCD116, #CE1126)' }}
              />

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Add New User</h2>
                    <p className="text-sm text-surface-500">Create a new user account</p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-surface-500" />
                </motion.button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    placeholder="john.doe@agency.gov.gh"
                  />
                </div>

                {/* Staff ID and Role */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Staff ID
                    </label>
                    <input
                      type="text"
                      value={formData.staffId}
                      onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="GCS-2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* MDA */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    MDA
                  </label>
                  <select
                    value={formData.mda}
                    onChange={(e) => setFormData({ ...formData, mda: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  >
                    <option value="">Select MDA</option>
                    {mdas.map((mda) => (
                      <option key={mda} value={mda}>{mda}</option>
                    ))}
                  </select>
                </div>

                {/* Department and Title */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="IT Directorate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      placeholder="Senior Officer"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-200 dark:border-surface-700">
                <motion.button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Create User
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AdminUsers() {
  const { token } = useAuthStore();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // API state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, suspended: 0 });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterRole !== 'all') params.set('role', filterRole);
      params.set('limit', '50');

      const response = await fetch(`${API_BASE}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/users/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.stats?.total || 0,
          active: data.stats?.active || 0,
          inactive: data.stats?.inactive || 0,
          suspended: data.stats?.suspended || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [searchQuery, filterStatus, filterRole]);

  // Save user permissions
  const handleSavePermissions = async (userId: string, role: string, permissions: Record<string, boolean>) => {
    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, permissions }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Permissions updated successfully' });
        fetchUsers();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update permissions' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update permissions' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  // Suspend/unsuspend user
  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    if (!confirm(suspend ? 'Are you sure you want to suspend this user?' : 'Unsuspend this user?')) return;

    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suspend }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: suspend ? 'User suspended' : 'User unsuspended' });
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'User deleted' });
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.mda.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleUserAction = (userId: string, action: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'role':
      case 'edit':
        setSelectedUser(user);
        setShowPermissionsModal(true);
        break;
      case 'suspend':
        handleSuspendUser(userId, user.status !== 'suspended');
        break;
      case 'delete':
        handleDeleteUser(userId);
        break;
      default:
        console.log(`Action: ${action} on user: ${userId}`);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.total, icon: Users, color: '#006B3F' },
    { label: 'Active', value: stats.active, icon: UserCheck, color: '#10B981' },
    { label: 'Inactive', value: stats.inactive, icon: UserX, color: '#6B7280' },
    { label: 'Suspended', value: stats.suspended, icon: Ban, color: '#CE1126' },
  ];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 relative">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Users className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                User Management
              </h1>
              <p className="text-surface-500">
                Manage platform users and their permissions
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </motion.button>
        </motion.div>

        {/* Success/Error Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                'mb-6 p-4 rounded-xl flex items-center gap-3',
                message.type === 'success'
                  ? 'bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800'
                  : 'bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800'
              )}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-success-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-error-600" />
              )}
              <span className={message.type === 'success' ? 'text-success-700 dark:text-success-300' : 'text-error-700 dark:text-error-300'}>
                {message.text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <StatCard
              key={stat.label}
              {...stat}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 p-4 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or MDA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-3">
              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>

              {/* Role filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="director">Director</option>
                <option value="civil_servant">Civil Servant</option>
              </select>

              {/* View toggle */}
              <div className="flex items-center rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'p-3 transition-colors',
                    viewMode === 'table'
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-50 dark:bg-surface-900 text-surface-500 hover:text-surface-700'
                  )}
                >
                  <TableProperties className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-3 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-50 dark:bg-surface-900 text-surface-500 hover:text-surface-700'
                  )}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>

              {/* Refresh */}
              <motion.button
                onClick={() => { fetchUsers(); fetchStats(); }}
                className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Refresh"
              >
                <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
              </motion.button>

              {/* Export */}
              <motion.button
                className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* User List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isLoading ? (
            <div className="bg-white dark:bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 py-16 text-center">
              <Loader2 className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-spin" />
              <p className="text-surface-500">Loading users...</p>
            </div>
          ) : viewMode === 'grid' ? (
            filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user, index) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isSelected={selectedUsers.includes(user.id)}
                    onSelect={() => toggleUserSelection(user.id)}
                    onAction={(action) => handleUserAction(user.id, action)}
                    delay={index * 0.05}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 py-16 text-center">
                <Users className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                <p className="text-surface-500">No users found</p>
              </div>
            )
          ) : (
            <div className="bg-white dark:bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="py-4 pl-6 pr-3">
                      <motion.button
                        onClick={selectAllUsers}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                          selectedUsers.length === filteredUsers.length && filteredUsers.length > 0
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'border-surface-300 dark:border-surface-600 hover:border-primary-500'
                        )}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 && (
                          <Check className="w-3 h-3" />
                        )}
                      </motion.button>
                    </th>
                    <th className="py-4 pr-3 text-left text-sm font-semibold text-surface-700 dark:text-surface-300">User</th>
                    <th className="py-4 pr-3 text-left text-sm font-semibold text-surface-700 dark:text-surface-300">Role</th>
                    <th className="py-4 pr-3 text-left text-sm font-semibold text-surface-700 dark:text-surface-300">MDA</th>
                    <th className="py-4 pr-3 text-left text-sm font-semibold text-surface-700 dark:text-surface-300">Status</th>
                    <th className="py-4 pr-3 text-left text-sm font-semibold text-surface-700 dark:text-surface-300">Level</th>
                    <th className="py-4 pr-3 text-left text-sm font-semibold text-surface-700 dark:text-surface-300">Last Login</th>
                    <th className="py-4 pr-6 text-right text-sm font-semibold text-surface-700 dark:text-surface-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelected={selectedUsers.includes(user.id)}
                      onSelect={() => toggleUserSelection(user.id)}
                      onAction={(action) => handleUserAction(user.id, action)}
                      delay={index * 0.03}
                    />
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="py-16 text-center">
                  <Users className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                  <p className="text-surface-500">No users found matching your criteria</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
            >
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 shadow-2xl">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-sm font-bold"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    {selectedUsers.length}
                  </motion.div>
                  <span className="text-sm font-medium">
                    user{selectedUsers.length > 1 ? 's' : ''} selected
                  </span>
                </div>

                <div className="w-px h-6 bg-white/20 dark:bg-surface-900/20" />

                <div className="flex items-center gap-2">
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 dark:bg-surface-900/10 hover:bg-white/20 dark:hover:bg-surface-900/20 transition-colors text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </motion.button>
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning-500 hover:bg-warning-600 transition-colors text-sm font-medium text-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Ban className="w-4 h-4" />
                    Suspend
                  </motion.button>
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-error-500 hover:bg-error-600 transition-colors text-sm font-medium text-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                </div>

                <motion.button
                  onClick={() => setSelectedUsers([])}
                  className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-surface-900/10 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add User Modal */}
        <AddUserModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

        {/* Permissions Modal */}
        <PermissionsModal
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSave={handleSavePermissions}
        />
      </div>
    </div>
  );
}
