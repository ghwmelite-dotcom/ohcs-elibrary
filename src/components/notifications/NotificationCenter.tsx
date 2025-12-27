import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  BellRing,
  MessageSquare,
  FileText,
  Users,
  Award,
  Shield,
  TrendingUp,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { NotificationSummary } from '@/stores/notificationStore';

interface NotificationCenterProps {
  summary: NotificationSummary | null;
  isLoading: boolean;
}

function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * value);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue}</>;
}

const typeIcons: Record<string, typeof Bell> = {
  message: MessageSquare,
  document: FileText,
  forum: MessageSquare,
  group: Users,
  achievement: Award,
  security: Shield
};

const typeColors: Record<string, string> = {
  message: 'from-primary-400 to-primary-600',
  document: 'from-blue-400 to-blue-600',
  forum: 'from-purple-400 to-purple-600',
  group: 'from-secondary-400 to-secondary-600',
  achievement: 'from-accent-400 to-accent-600',
  security: 'from-error-400 to-error-600'
};

export function NotificationCenter({ summary, isLoading }: NotificationCenterProps) {
  const unreadTotal = summary?.unreadTotal || 0;
  const todayCount = summary?.todayCount || 0;
  const weekCount = summary?.weekCount || 0;

  // Get top notification types
  const topTypes = summary?.unreadByType
    ? Object.entries(summary.unreadByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
    : [];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-6 text-white">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated rings */}
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-white/10"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full border border-white/10"
          animate={{ scale: [1.1, 1, 1.1], rotate: [360, 180, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        {/* Floating bell icons */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/10"
            style={{
              left: `${15 + i * 20}%`,
              top: `${20 + (i % 2) * 40}%`
            }}
            animate={{
              y: [0, -10, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
          >
            <Bell className="w-8 h-8" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              animate={unreadTotal > 0 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {unreadTotal > 0 ? (
                <BellRing className="w-8 h-8" />
              ) : (
                <Bell className="w-8 h-8" />
              )}
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold">Notification Center</h1>
              <p className="text-white/80">
                {unreadTotal > 0
                  ? `You have ${unreadTotal} unread notification${unreadTotal !== 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>

          {unreadTotal === 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">All Clear</span>
            </motion.div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
          >
            <div className="text-3xl font-bold">
              {isLoading ? '-' : <AnimatedCounter value={unreadTotal} />}
            </div>
            <div className="text-sm text-white/70">Unread</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
          >
            <div className="text-3xl font-bold">
              {isLoading ? '-' : <AnimatedCounter value={todayCount} />}
            </div>
            <div className="text-sm text-white/70">Today</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
          >
            <div className="text-3xl font-bold">
              {isLoading ? '-' : <AnimatedCounter value={weekCount} />}
            </div>
            <div className="text-sm text-white/70">This Week</div>
          </motion.div>
        </div>

        {/* Unread by Type */}
        {topTypes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-white/70 mb-3">Unread by Category</p>
            <div className="flex flex-wrap gap-2">
              {topTypes.map(([type, count], index) => {
                const Icon = typeIcons[type] || Bell;
                const color = typeColors[type] || 'from-gray-400 to-gray-600';

                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full"
                  >
                    <div className={cn('w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center', color)}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">{count}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Priority Alerts */}
        {summary?.unreadByPriority?.urgent && summary.unreadByPriority.urgent > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-4 flex items-center gap-3 px-4 py-3 bg-error-500/30 backdrop-blur-sm border border-error-400/50 rounded-xl"
          >
            <Shield className="w-5 h-5 text-error-200" />
            <span className="font-medium">
              {summary.unreadByPriority.urgent} urgent notification{summary.unreadByPriority.urgent !== 1 ? 's' : ''} require your attention
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
