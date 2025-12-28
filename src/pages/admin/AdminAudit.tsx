import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  User,
  FileText,
  Settings,
  LogIn,
  LogOut,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ChevronDown,
  ChevronRight,
  X,
  Calendar,
  Activity,
  TrendingUp,
  RefreshCw,
  List,
  LayoutGrid,
  Zap,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Key,
  MessageSquare,
  Upload,
  Database,
  Server,
  Mail,
  Bell,
  MoreVertical,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { cn } from '@/utils/cn';
import { format, formatDistanceToNow, subHours, subDays } from 'date-fns';

// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-50 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900" />

      <motion.div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-30 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, #006B3F 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-25 dark:opacity-15"
        style={{
          background: 'radial-gradient(circle, #FCD116 0%, transparent 70%)',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute -bottom-16 left-1/3 w-72 h-72 rounded-full opacity-20 dark:opacity-10"
        style={{
          background: 'radial-gradient(circle, #CE1126 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Stat Card with animated counter
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; up: boolean };
}

function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)`,
        }}
      />

      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: color }} />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-surface-900 dark:text-surface-50 mt-1">
            {displayValue.toLocaleString()}
          </p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.up ? 'text-success-600' : 'text-error-600'
            )}>
              <TrendingUp className={cn('w-4 h-4', !trend.up && 'rotate-180')} />
              {trend.up ? '+' : '-'}{trend.value}% vs last period
            </div>
          )}
        </div>
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-7 h-7" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

// Audit Log Interface
interface AuditLog {
  id: string;
  action: string;
  actionType: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'security' | 'export' | 'import' | 'permission';
  resource: string;
  resourceId?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  ipAddress: string;
  location?: string;
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
  status: 'success' | 'failure' | 'warning';
  details?: string;
  metadata?: Record<string, string>;
  timestamp: Date;
}

// Action Config
const actionConfig: Record<string, { icon: React.ElementType; color: string; bgLight: string; bgDark: string }> = {
  create: { icon: Plus, color: '#10B981', bgLight: 'bg-success-100', bgDark: 'dark:bg-success-900/30' },
  read: { icon: Eye, color: '#3B82F6', bgLight: 'bg-blue-100', bgDark: 'dark:bg-blue-900/30' },
  update: { icon: Edit, color: '#F59E0B', bgLight: 'bg-amber-100', bgDark: 'dark:bg-amber-900/30' },
  delete: { icon: Trash2, color: '#EF4444', bgLight: 'bg-red-100', bgDark: 'dark:bg-red-900/30' },
  login: { icon: LogIn, color: '#006B3F', bgLight: 'bg-primary-100', bgDark: 'dark:bg-primary-900/30' },
  logout: { icon: LogOut, color: '#6B7280', bgLight: 'bg-surface-100', bgDark: 'dark:bg-surface-700' },
  security: { icon: Shield, color: '#CE1126', bgLight: 'bg-red-100', bgDark: 'dark:bg-red-900/30' },
  export: { icon: Download, color: '#8B5CF6', bgLight: 'bg-purple-100', bgDark: 'dark:bg-purple-900/30' },
  import: { icon: Upload, color: '#EC4899', bgLight: 'bg-pink-100', bgDark: 'dark:bg-pink-900/30' },
  permission: { icon: Key, color: '#FCD116', bgLight: 'bg-secondary-100', bgDark: 'dark:bg-secondary-900/30' },
};

const statusConfig = {
  success: { icon: CheckCircle, color: '#10B981', label: 'Success' },
  failure: { icon: XCircle, color: '#EF4444', label: 'Failed' },
  warning: { icon: AlertTriangle, color: '#F59E0B', label: 'Warning' },
};

// Timeline Log Item
function TimelineLogItem({ log, index, onViewDetails }: { log: AuditLog; index: number; onViewDetails: (log: AuditLog) => void }) {
  const config = actionConfig[log.actionType] || actionConfig.read;
  const status = statusConfig[log.status];
  const Icon = config.icon;
  const StatusIcon = status.icon;
  const DeviceIcon = log.device.type === 'mobile' ? Smartphone : log.device.type === 'tablet' ? Tablet : Monitor;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative pl-8 pb-8 group"
    >
      {/* Timeline line */}
      <div className="absolute left-[11px] top-10 bottom-0 w-0.5 bg-surface-200 dark:bg-surface-700 group-last:hidden" />

      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-surface-900',
          config.bgLight,
          config.bgDark
        )}
      >
        <Icon className="w-3 h-3" style={{ color: config.color }} />
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ml-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-surface-900 dark:text-surface-50">{log.action}</h4>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  log.status === 'success' && 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
                  log.status === 'failure' && 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
                  log.status === 'warning' && 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
            </div>

            <p className="text-sm text-surface-500 mt-1">
              {log.resource}{log.resourceId && ` • ID: ${log.resourceId}`}
            </p>

            {log.details && (
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 line-clamp-2">
                {log.details}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {/* User */}
              <div className="flex items-center gap-2">
                {log.user.avatar ? (
                  <img
                    src={log.user.avatar}
                    alt={log.user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <User className="w-3 h-3 text-primary-600" />
                  </div>
                )}
                <span className="text-sm text-surface-700 dark:text-surface-300">{log.user.name}</span>
              </div>

              {/* Device */}
              <div className="flex items-center gap-1.5 text-sm text-surface-500">
                <DeviceIcon className="w-4 h-4" />
                <span>{log.device.browser}</span>
              </div>

              {/* Location */}
              {log.location && (
                <div className="flex items-center gap-1.5 text-sm text-surface-500">
                  <MapPin className="w-4 h-4" />
                  <span>{log.location}</span>
                </div>
              )}

              {/* IP */}
              <div className="flex items-center gap-1.5 text-sm text-surface-400">
                <Globe className="w-4 h-4" />
                <span>{log.ipAddress}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                {format(log.timestamp, 'HH:mm:ss')}
              </p>
              <p className="text-xs text-surface-400">
                {formatDistanceToNow(log.timestamp, { addSuffix: true })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(log)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Table Log Row
function TableLogRow({ log, index, onViewDetails }: { log: AuditLog; index: number; onViewDetails: (log: AuditLog) => void }) {
  const config = actionConfig[log.actionType] || actionConfig.read;
  const status = statusConfig[log.status];
  const Icon = config.icon;
  const StatusIcon = status.icon;
  const DeviceIcon = log.device.type === 'mobile' ? Smartphone : log.device.type === 'tablet' ? Tablet : Monitor;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors group"
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              config.bgLight,
              config.bgDark
            )}
          >
            <Icon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50">{log.action}</p>
            <p className="text-xs text-surface-500">{log.resource}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {log.user.avatar ? (
            <img src={log.user.avatar} alt={log.user.name} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary-600" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{log.user.name}</p>
            <p className="text-xs text-surface-400">{log.user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <DeviceIcon className="w-4 h-4 text-surface-400" />
          <div>
            <p className="text-sm text-surface-700 dark:text-surface-300">{log.device.browser}</p>
            <p className="text-xs text-surface-400">{log.device.os}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div>
          <p className="text-sm text-surface-700 dark:text-surface-300">{log.ipAddress}</p>
          {log.location && (
            <p className="text-xs text-surface-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {log.location}
            </p>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
            log.status === 'success' && 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
            log.status === 'failure' && 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
            log.status === 'warning' && 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
          )}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="text-right">
          <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
            {format(log.timestamp, 'MMM d, HH:mm')}
          </p>
          <p className="text-xs text-surface-400">{formatDistanceToNow(log.timestamp, { addSuffix: true })}</p>
        </div>
      </td>
      <td className="py-4 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(log)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </td>
    </motion.tr>
  );
}

// Detail Modal
function LogDetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const config = actionConfig[log.actionType] || actionConfig.read;
  const status = statusConfig[log.status];
  const Icon = config.icon;
  const StatusIcon = status.icon;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-surface-200 dark:border-surface-700">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, ${config.color}20, transparent)`,
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bgLight, config.bgDark)}
              >
                <Icon className="w-5 h-5" style={{ color: config.color }} />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-50">{log.action}</h3>
                <p className="text-sm text-surface-500">{log.resource}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Status and Time */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold',
                log.status === 'success' && 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
                log.status === 'failure' && 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
                log.status === 'warning' && 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
              )}
            >
              <StatusIcon className="w-4 h-4" />
              {status.label}
            </span>
            <div className="text-right">
              <p className="font-medium text-surface-900 dark:text-surface-50">
                {format(log.timestamp, 'MMMM d, yyyy')}
              </p>
              <p className="text-sm text-surface-500">{format(log.timestamp, 'HH:mm:ss')}</p>
            </div>
          </div>

          {/* Details */}
          {log.details && (
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
              <p className="text-sm font-medium text-surface-500 mb-2">Details</p>
              <p className="text-surface-900 dark:text-surface-50">{log.details}</p>
            </div>
          )}

          {/* User Info */}
          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
            <p className="text-sm font-medium text-surface-500 mb-3">User</p>
            <div className="flex items-center gap-3">
              {log.user.avatar ? (
                <img src={log.user.avatar} alt={log.user.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
              )}
              <div>
                <p className="font-semibold text-surface-900 dark:text-surface-50">{log.user.name}</p>
                <p className="text-sm text-surface-500">{log.user.email}</p>
                {log.user.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs rounded-full">
                    {log.user.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
              <p className="text-sm font-medium text-surface-500 mb-2">IP Address</p>
              <div className="flex items-center justify-between">
                <code className="text-surface-900 dark:text-surface-50">{log.ipAddress}</code>
                <button
                  onClick={() => copyToClipboard(log.ipAddress, 'ip')}
                  className="p-1.5 hover:bg-surface-200 dark:hover:bg-surface-600 rounded transition-colors"
                >
                  {copiedField === 'ip' ? (
                    <Check className="w-4 h-4 text-success-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-surface-400" />
                  )}
                </button>
              </div>
              {log.location && (
                <p className="text-sm text-surface-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {log.location}
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
              <p className="text-sm font-medium text-surface-500 mb-2">Device</p>
              <p className="text-surface-900 dark:text-surface-50">{log.device.browser}</p>
              <p className="text-sm text-surface-500">{log.device.os}</p>
            </div>
          </div>

          {/* Resource ID */}
          {log.resourceId && (
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
              <p className="text-sm font-medium text-surface-500 mb-2">Resource ID</p>
              <div className="flex items-center justify-between">
                <code className="text-surface-900 dark:text-surface-50">{log.resourceId}</code>
                <button
                  onClick={() => copyToClipboard(log.resourceId!, 'resourceId')}
                  className="p-1.5 hover:bg-surface-200 dark:hover:bg-surface-600 rounded transition-colors"
                >
                  {copiedField === 'resourceId' ? (
                    <Check className="w-4 h-4 text-success-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-surface-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
              <p className="text-sm font-medium text-surface-500 mb-3">Additional Data</p>
              <div className="space-y-2">
                {Object.entries(log.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-surface-500">{key}</span>
                    <span className="text-sm font-medium text-surface-900 dark:text-surface-50">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Activity Chart
function ActivityChart({ data }: { data: number[] }) {
  const maxValue = Math.max(...data);

  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((value, index) => (
        <motion.div
          key={index}
          initial={{ height: 0 }}
          animate={{ height: `${(value / maxValue) * 100}%` }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="flex-1 bg-primary-500 dark:bg-primary-400 rounded-t opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          title={`${value} events`}
        />
      ))}
    </div>
  );
}

export default function AdminAudit() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Audit data - to be populated from API
  const logs: AuditLog[] = [];

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failure').length,
    security: logs.filter(l => l.actionType === 'security').length,
  };

  const activityData: number[] = [];

  const tabs = [
    { id: 'all', label: 'All Activity', count: logs.length, icon: Activity },
    { id: 'security', label: 'Security', count: logs.filter(l => l.actionType === 'security' || l.status === 'failure').length, icon: Shield },
    { id: 'documents', label: 'Documents', count: logs.filter(l => l.resource === 'Documents').length, icon: FileText },
    { id: 'users', label: 'Users', count: logs.filter(l => l.resource === 'Users').length, icon: User },
    { id: 'settings', label: 'Settings', count: logs.filter(l => l.resource === 'Settings').length, icon: Settings },
  ];

  const dateRanges = [
    { id: '24h', label: '24h' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
  ];

  const filteredLogs = logs.filter(log => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'security') return log.actionType === 'security' || log.status === 'failure';
    if (selectedTab === 'documents') return log.resource === 'Documents';
    if (selectedTab === 'users') return log.resource === 'Users';
    if (selectedTab === 'settings') return log.resource === 'Settings';
    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
                Audit Logs
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Track all system activity and security events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range */}
            <div className="flex bg-white dark:bg-surface-800 rounded-xl p-1 shadow-sm">
              {dateRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
                    dateRange === range.id
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              leftIcon={<RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Refresh
            </Button>

            <Button variant="primary" leftIcon={<Download className="w-4 h-4" />}>
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Events" value={stats.total} icon={Activity} color="#006B3F" trend={{ value: 12, up: true }} />
          <StatCard label="Successful" value={stats.success} icon={CheckCircle} color="#10B981" trend={{ value: 8, up: true }} />
          <StatCard label="Failed" value={stats.failed} icon={XCircle} color="#EF4444" trend={{ value: 15, up: false }} />
          <StatCard label="Security Alerts" value={stats.security} icon={AlertTriangle} color="#FCD116" trend={{ value: 5, up: true }} />
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">Activity Timeline</h3>
              <p className="text-sm text-surface-500">Events per hour over the last 24 hours</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">1,247</p>
              <p className="text-sm text-success-600">+18% from yesterday</p>
            </div>
          </div>
          <ActivityChart data={activityData} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 bg-white dark:bg-surface-800 rounded-xl p-2 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  selectedTab === tab.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50 hover:bg-surface-50 dark:hover:bg-surface-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  selectedTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by user, action, resource, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
              {showFilters && <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>

            <div className="flex bg-white dark:bg-surface-800 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('timeline')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'timeline'
                    ? 'bg-primary-500 text-white'
                    : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-50'
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'table'
                    ? 'bg-primary-500 text-white'
                    : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-50'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Logs Display */}
        <AnimatePresence mode="wait">
          {viewMode === 'timeline' ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {filteredLogs.map((log, index) => (
                <TimelineLogItem
                  key={log.id}
                  log={log}
                  index={index}
                  onViewDetails={setSelectedLog}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Action</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">User</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Device</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Location</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Time</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <TableLogRow
                        key={log.id}
                        log={log}
                        index={index}
                        onViewDetails={setSelectedLog}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedLog && (
            <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
