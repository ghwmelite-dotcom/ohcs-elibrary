import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Radio,
  Info,
  AlertTriangle,
  AlertCircle,
  Siren,
  Clock,
  CheckCircle,
  Eye,
  Megaphone,
  ChevronRight,
  RefreshCw,
  Filter,
  Calendar,
  Users,
  Bell,
  BellOff,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useBroadcastStore, type Broadcast, type BroadcastSeverity } from '@/stores/broadcastStore';
import { Button } from '@/components/shared/Button';

// Severity configurations
const severityConfig: Record<
  BroadcastSeverity,
  {
    icon: typeof Info;
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconBg: string;
    badgeBg: string;
    gradient: string;
  }
> = {
  info: {
    icon: Info,
    label: 'Information',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeBg: 'bg-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeBg: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-500',
  },
  critical: {
    icon: AlertCircle,
    label: 'Critical',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    badgeBg: 'bg-red-500',
    gradient: 'from-red-500 to-rose-500',
  },
  emergency: {
    icon: Siren,
    label: 'Emergency',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-700',
    textColor: 'text-red-800 dark:text-red-200',
    iconBg: 'bg-red-200 dark:bg-red-900/50',
    badgeBg: 'bg-red-600',
    gradient: 'from-red-600 to-rose-600',
  },
};

// Single broadcast card component
interface BroadcastCardProps {
  broadcast: Broadcast;
  index: number;
  onAcknowledge?: () => void;
}

function BroadcastCard({ broadcast, index, onAcknowledge }: BroadcastCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const config = severityConfig[broadcast.severity];
  const Icon = config.icon;
  const isActive = broadcast.is_active;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
          isActive ? config.borderColor : 'border-surface-200 dark:border-surface-700',
          isActive ? config.bgColor : 'bg-surface-50 dark:bg-surface-800/50',
          'hover:shadow-lg hover:scale-[1.01]'
        )}
      >
        {/* Top gradient accent for active broadcasts */}
        {isActive && (
          <div className={cn('h-1.5 bg-gradient-to-r', config.gradient)} />
        )}

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm',
                isActive ? config.iconBg : 'bg-surface-100 dark:bg-surface-700'
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6',
                  isActive ? config.textColor : 'text-surface-400'
                )}
              />
            </motion.div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {/* Severity badge */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-white',
                    config.badgeBg
                  )}
                >
                  <Radio className="w-3 h-3" />
                  {config.label}
                </span>

                {/* Status badge */}
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                  )}
                >
                  {isActive ? 'Active' : 'Expired'}
                </span>

                {/* Acknowledged badge */}
                {broadcast.acknowledged && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                    <CheckCircle className="w-3 h-3" />
                    Acknowledged
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-bold text-surface-900 dark:text-surface-100 text-base sm:text-lg mb-1 line-clamp-1">
                {broadcast.title}
              </h3>

              {/* Message */}
              <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mb-3">
                {broadcast.message}
              </p>

              {/* Meta info */}
              <div className="flex items-center gap-4 text-xs text-surface-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(broadcast.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                {broadcast.creatorName && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {broadcast.creatorName}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {broadcast.target_audience === 'all' ? 'All Users' : broadcast.target_audience}
                </span>
              </div>
            </div>

            {/* Action button */}
            {isActive && broadcast.requires_acknowledgment && !broadcast.acknowledged && onAcknowledge && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  variant={broadcast.severity === 'emergency' ? 'danger' : 'primary'}
                  onClick={onAcknowledge}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Acknowledge
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Expand indicator */}
        <motion.div
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        >
          <ChevronRight className="w-5 h-5 text-surface-400" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Hero section with summary
function BroadcastHero({ broadcasts }: { broadcasts: Broadcast[] }) {
  const activeBroadcasts = broadcasts.filter((b) => b.is_active);
  const acknowledgedCount = broadcasts.filter((b) => b.acknowledged).length;

  const severityCounts = {
    emergency: activeBroadcasts.filter((b) => b.severity === 'emergency').length,
    critical: activeBroadcasts.filter((b) => b.severity === 'critical').length,
    warning: activeBroadcasts.filter((b) => b.severity === 'warning').length,
    info: activeBroadcasts.filter((b) => b.severity === 'info').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 sm:p-8 mb-6"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/10"
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Megaphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Broadcasts</h2>
            <p className="text-white/70 text-sm">System alerts and announcements</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-white/70" />
              <span className="text-xs text-white/70 uppercase tracking-wider">Active</span>
            </div>
            <p className="text-2xl font-bold text-white">{activeBroadcasts.length}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-white/70" />
              <span className="text-xs text-white/70 uppercase tracking-wider">Acknowledged</span>
            </div>
            <p className="text-2xl font-bold text-white">{acknowledgedCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-white/70 uppercase tracking-wider">Urgent</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {severityCounts.emergency + severityCounts.critical}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-white/70" />
              <span className="text-xs text-white/70 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{broadcasts.length}</p>
          </div>
        </div>

        {/* Severity breakdown */}
        {activeBroadcasts.length > 0 && (
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {severityCounts.emergency > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 text-red-200 text-sm font-medium">
                <Siren className="w-4 h-4" />
                {severityCounts.emergency} Emergency
              </span>
            )}
            {severityCounts.critical > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-400/20 text-red-200 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                {severityCounts.critical} Critical
              </span>
            )}
            {severityCounts.warning > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-200 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                {severityCounts.warning} Warning
              </span>
            )}
            {severityCounts.info > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-400/20 text-blue-200 text-sm font-medium">
                <Info className="w-4 h-4" />
                {severityCounts.info} Info
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 px-6"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center"
      >
        <BellOff className="w-10 h-10 text-surface-400" />
      </motion.div>
      <motion.h3
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2"
      >
        No Broadcasts
      </motion.h3>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-surface-500 max-w-sm mx-auto"
      >
        There are no system broadcasts at the moment. You'll see important announcements here when they're published.
      </motion.p>
    </motion.div>
  );
}

// Main BroadcastsSection component
export function BroadcastsSection() {
  const {
    activeBroadcasts,
    allBroadcasts,
    isLoading,
    fetchActiveBroadcasts,
    fetchAllBroadcasts,
    acknowledgeBroadcast,
  } = useBroadcastStore();

  // Fetch broadcasts on mount
  useEffect(() => {
    fetchActiveBroadcasts();
    fetchAllBroadcasts(1, 'all');
  }, [fetchActiveBroadcasts, fetchAllBroadcasts]);

  // Combine active and all broadcasts, removing duplicates
  const allUniqueBroadcasts = [...activeBroadcasts];
  allBroadcasts.forEach((b) => {
    if (!allUniqueBroadcasts.find((existing) => existing.id === b.id)) {
      allUniqueBroadcasts.push(b);
    }
  });

  // Sort by date (newest first) and then by severity
  const sortedBroadcasts = allUniqueBroadcasts.sort((a, b) => {
    // Active broadcasts first
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    // Then by severity (emergency > critical > warning > info)
    const severityOrder = { emergency: 0, critical: 1, warning: 2, info: 3 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    // Then by date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleRefresh = () => {
    fetchActiveBroadcasts();
    fetchAllBroadcasts(1, 'all');
  };

  return (
    <div>
      {/* Hero section */}
      <BroadcastHero broadcasts={sortedBroadcasts} />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100">
          All Broadcasts
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </motion.button>
      </div>

      {/* Broadcasts list */}
      {isLoading && sortedBroadcasts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : sortedBroadcasts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {sortedBroadcasts.map((broadcast, index) => (
              <BroadcastCard
                key={broadcast.id}
                broadcast={broadcast}
                index={index}
                onAcknowledge={
                  broadcast.is_active && broadcast.requires_acknowledgment && !broadcast.acknowledged
                    ? () => acknowledgeBroadcast(broadcast.id)
                    : undefined
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
