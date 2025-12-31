import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  Activity,
  Award,
  Eye,
  UserPlus,
  Download,
  AlertCircle,
  ChevronRight,
  Zap,
  Globe,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Shield,
  Sparkles,
  BookOpen,
  Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';

// ============================================================================
// ANIMATED BACKGROUND
// ============================================================================
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Gradient orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 107, 63, 0.15) 0%, transparent 70%)',
          top: '-10%',
          right: '-10%',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(252, 209, 22, 0.1) 0%, transparent 70%)',
          bottom: '-5%',
          left: '-5%',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
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
// 3D STAT CARD
// ============================================================================
interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ElementType;
  color: 'primary' | 'secondary' | 'accent' | 'info' | 'success';
  delay?: number;
}

function StatCard3D({ title, value, change, icon: Icon, color, delay = 0 }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [isHovered, setIsHovered] = useState(false);

  const colors = {
    primary: { bg: '#006B3F', glow: 'rgba(0, 107, 63, 0.4)', light: 'rgba(0, 107, 63, 0.1)' },
    secondary: { bg: '#FCD116', glow: 'rgba(252, 209, 22, 0.4)', light: 'rgba(252, 209, 22, 0.15)' },
    accent: { bg: '#CE1126', glow: 'rgba(206, 17, 38, 0.4)', light: 'rgba(206, 17, 38, 0.1)' },
    info: { bg: '#3B82F6', glow: 'rgba(59, 130, 246, 0.4)', light: 'rgba(59, 130, 246, 0.1)' },
    success: { bg: '#10B981', glow: 'rgba(16, 185, 129, 0.4)', light: 'rgba(16, 185, 129, 0.1)' },
  };

  const c = colors[color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 100 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${c.glow}, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-800/90 backdrop-blur-xl border border-surface-200/50 dark:border-surface-700/50"
        animate={{
          rotateY: isHovered ? 5 : 0,
          rotateX: isHovered ? -5 : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          boxShadow: isHovered
            ? `0 25px 50px -12px ${c.glow}, 0 0 0 1px ${c.light}`
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
          }}
          animate={isHovered ? { x: ['-100%', '200%'] } : {}}
          transition={{ duration: 0.8 }}
        />

        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">{title}</p>
              <motion.p
                className="text-3xl font-bold text-surface-900 dark:text-surface-50"
                initial={{ scale: 0.5 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
              >
                {typeof value === 'number' ? value.toLocaleString() : value}
              </motion.p>
              {change !== undefined && (
                <div className={cn(
                  'flex items-center gap-1 mt-2 text-sm font-medium',
                  change >= 0 ? 'text-success-600' : 'text-error-600'
                )}>
                  {change >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{Math.abs(change)}% vs last month</span>
                </div>
              )}
            </div>

            {/* Icon container */}
            <motion.div
              className="relative"
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: c.light }}
              >
                <Icon className="w-7 h-7" style={{ color: c.bg }} />
              </div>
              {/* Floating particles */}
              {isHovered && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: c.bg }}
                      initial={{ opacity: 0, scale: 0, x: 20, y: 20 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        x: [20, 30 + i * 10, 40 + i * 10],
                        y: [20, -10 - i * 10, -30 - i * 10],
                      }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Bottom accent line */}
        <motion.div
          className="h-1"
          style={{ backgroundColor: c.bg }}
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ delay: delay + 0.3, duration: 0.5 }}
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// ANIMATED CHART
// ============================================================================
function AnimatedLineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const max = Math.max(...data);
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (v / max) * 80,
  }));

  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (point.x - prev.x) / 3;
    const cpx2 = point.x - (point.x - prev.x) / 3;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  return (
    <div ref={ref} className="relative h-48">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {[...Array(5)].map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={20 + i * 20}
            x2="100"
            y2={20 + i * 20}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeDasharray="2 2"
          />
        ))}

        {/* Gradient area */}
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#006B3F" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#006B3F" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <motion.path
          d={`${pathD} L 100 100 L 0 100 Z`}
          fill="url(#chartGradient)"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.5 }}
        />

        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="#006B3F"
          strokeWidth="0.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Data points */}
        {points.map((point, i) => (
          <motion.circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill="#006B3F"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5 + i * 0.1 }}
          />
        ))}
      </svg>

      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-surface-400">
        {labels.filter((_, i) => i % 2 === 0).map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ANIMATED DONUT CHART
// ============================================================================
function AnimatedDonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const total = data.reduce((acc, d) => acc + d.value, 0);
  let cumulativePercent = 0;

  return (
    <div ref={ref} className="relative">
      <svg viewBox="0 0 100 100" className="w-full h-48">
        {data.map((segment, i) => {
          const percent = (segment.value / total) * 100;
          const startAngle = cumulativePercent * 3.6 - 90;
          const endAngle = (cumulativePercent + percent) * 3.6 - 90;
          cumulativePercent += percent;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const largeArc = percent > 50 ? 1 : 0;

          const x1 = 50 + 35 * Math.cos(startRad);
          const y1 = 50 + 35 * Math.sin(startRad);
          const x2 = 50 + 35 * Math.cos(endRad);
          const y2 = 50 + 35 * Math.sin(endRad);

          const pathD = `M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return (
            <motion.path
              key={i}
              d={pathD}
              fill={segment.color}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5, type: 'spring' }}
              className="origin-center hover:scale-105 transition-transform cursor-pointer"
              style={{ transformOrigin: '50px 50px' }}
            />
          );
        })}
        {/* Center circle */}
        <circle cx="50" cy="50" r="22" className="fill-white dark:fill-surface-800" />
        <text
          x="50"
          y="48"
          textAnchor="middle"
          className="fill-surface-900 dark:fill-surface-50 text-[8px] font-bold"
        >
          {total.toLocaleString()}
        </text>
        <text
          x="50"
          y="56"
          textAnchor="middle"
          className="fill-surface-500 text-[4px]"
        >
          Total Users
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {data.map((segment, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-2 text-xs"
          >
            <div className="w-3 h-3 rounded" style={{ backgroundColor: segment.color }} />
            <span className="text-surface-600 dark:text-surface-400">{segment.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ACTIVITY FEED
// ============================================================================
function ActivityFeed({ activities }: { activities: { type: string; message: string; time: string }[] }) {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative flex items-start gap-4 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors cursor-pointer"
        >
          {/* Timeline line */}
          {index < activities.length - 1 && (
            <div className="absolute left-[27px] top-14 w-0.5 h-full bg-surface-200 dark:bg-surface-700" />
          )}

          {/* Icon */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={cn(
              'relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm',
              activity.type === 'user' && 'bg-gradient-to-br from-primary-400 to-primary-600 text-white',
              activity.type === 'document' && 'bg-gradient-to-br from-secondary-400 to-secondary-600 text-surface-900',
              activity.type === 'forum' && 'bg-gradient-to-br from-info-400 to-info-600 text-white',
              activity.type === 'alert' && 'bg-gradient-to-br from-error-400 to-error-600 text-white',
              activity.type === 'badge' && 'bg-gradient-to-br from-success-400 to-success-600 text-white'
            )}
          >
            {activity.type === 'user' && <UserPlus className="w-5 h-5" />}
            {activity.type === 'document' && <FileText className="w-5 h-5" />}
            {activity.type === 'forum' && <MessageSquare className="w-5 h-5" />}
            {activity.type === 'alert' && <AlertCircle className="w-5 h-5" />}
            {activity.type === 'badge' && <Award className="w-5 h-5" />}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-surface-100 transition-colors">
              {activity.message}
            </p>
            <p className="text-xs text-surface-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activity.time}
            </p>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="self-center"
          >
            <ChevronRight className="w-4 h-4 text-surface-400" />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// TOP MDAs LEADERBOARD
// ============================================================================
function TopMDAsLeaderboard({ mdas }: { mdas: { name: string; users: number; documents: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="space-y-3">
      {mdas.map((mda, index) => (
        <motion.div
          key={mda.name}
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: index * 0.1 }}
          className="group relative overflow-hidden"
        >
          <div className="relative flex items-center gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-700/30 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-all cursor-pointer">
            {/* Rank badge */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg',
                index === 0 && 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900',
                index === 1 && 'bg-gradient-to-br from-gray-300 to-gray-500 text-white',
                index === 2 && 'bg-gradient-to-br from-amber-600 to-amber-800 text-white',
                index > 2 && 'bg-gradient-to-br from-primary-400 to-primary-600 text-white'
              )}
            >
              {index + 1}
            </motion.div>

            {/* MDA Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-900 dark:text-surface-50 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {mda.name}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-xs text-surface-500">
                  <Users className="w-3 h-3" />
                  {mda.users.toLocaleString()} users
                </span>
                <span className="flex items-center gap-1 text-xs text-surface-500">
                  <FileText className="w-3 h-3" />
                  {mda.documents.toLocaleString()} docs
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-20">
              <div className="h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: index === 0 ? 'linear-gradient(90deg, #FCD116, #f59e0b)' :
                               index === 1 ? 'linear-gradient(90deg, #9ca3af, #6b7280)' :
                               'linear-gradient(90deg, #006B3F, #10b981)',
                  }}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${(mda.users / mdas[0].users) * 100}%` } : {}}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================
function QuickActions() {
  const actions = [
    { icon: UserPlus, label: 'Add User', href: '/admin/users', color: '#006B3F' },
    { icon: FileText, label: 'Upload Doc', href: '/admin/documents', color: '#FCD116' },
    { icon: Shield, label: 'Security', href: '/admin/audit', color: '#CE1126' },
    { icon: BarChart3, label: 'Reports', href: '/admin/analytics', color: '#3B82F6' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Link
            to={action.href}
            className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-50 dark:bg-surface-700/30 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-all"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${action.color}20` }}
            >
              <action.icon className="w-6 h-6" style={{ color: action.color }} />
            </motion.div>
            <span className="text-xs font-medium text-surface-600 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-100 transition-colors">
              {action.label}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// TYPES
// ============================================================================
interface DashboardStats {
  totalUsers: number;
  usersChange: number;
  totalDocuments: number;
  documentsChange: number;
  forumPosts: number;
  postsChange: number;
  activeUsers: number;
  activeChange: number;
}

interface UserByRole {
  label: string;
  value: number;
  color: string;
}

interface RecentActivityItem {
  type: string;
  message: string;
  time: string;
}

interface TopMDA {
  name: string;
  users: number;
  documents: number;
}

interface MonthlyGrowth {
  month: string;
  count: number;
}

interface DashboardData {
  stats: DashboardStats;
  monthlyGrowth: MonthlyGrowth[];
  usersByRole: UserByRole[];
  recentActivity: RecentActivityItem[];
  topMDAs: TopMDA[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AdminDashboard() {
  const { user, token } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Fetch dashboard stats from API
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const API_URL = import.meta.env.VITE_API_URL || 'https://ohcs-elibrary-api.ghwmelite.workers.dev';
        const response = await fetch(`${API_URL}/api/v1/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Admin stats API error:', {
            status: response.status,
            statusText: response.statusText,
            data
          });

          // If API returned error with stats fallback, use the stats
          if (data.stats) {
            setDashboardData(data);
            setError(data.details || data.error || 'Partial data loaded');
            return;
          }
          throw new Error(`${response.status}: ${data.message || data.details || data.error || 'Failed to fetch dashboard statistics'}`);
        }

        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchDashboardStats();
    }
  }, [token]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Default stats when data is loading or not available
  const stats: DashboardStats = dashboardData?.stats || {
    totalUsers: 0,
    usersChange: 0,
    totalDocuments: 0,
    documentsChange: 0,
    forumPosts: 0,
    postsChange: 0,
    activeUsers: 0,
    activeChange: 0,
  };

  // Process monthly growth data for chart
  const processedGrowthData = (): { data: number[]; labels: string[] } => {
    if (!dashboardData?.monthlyGrowth || dashboardData.monthlyGrowth.length === 0) {
      return {
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      };
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: number[] = [];
    const labels: string[] = [];

    dashboardData.monthlyGrowth.forEach((item) => {
      const [year, month] = item.month.split('-');
      const monthIndex = parseInt(month, 10) - 1;
      labels.push(`${monthNames[monthIndex]} '${year.slice(2)}`);
      data.push(item.count);
    });

    // Ensure at least 2 data points for the chart
    if (data.length < 2) {
      return {
        data: [...data, 0],
        labels: [...labels, 'Next'],
      };
    }

    return { data, labels };
  };

  const { data: userGrowthData, labels: userGrowthLabels } = processedGrowthData();

  const usersByRole: UserByRole[] = dashboardData?.usersByRole || [];
  const recentActivity: RecentActivityItem[] = dashboardData?.recentActivity || [];
  const topMDAs: TopMDA[] = dashboardData?.topMDAs || [];

  // Calculate growth percentage for the chart header
  const calculateGrowthPercentage = (): number => {
    if (userGrowthData.length < 2) return 0;
    const current = userGrowthData[userGrowthData.length - 1];
    const previous = userGrowthData[userGrowthData.length - 2];
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const growthPercentage = calculateGrowthPercentage();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 relative">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Shield className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                    Admin Dashboard
                  </h1>
                  <p className="text-surface-500 flex items-center gap-2">
                    <span>Welcome back, {user?.firstName || 'Admin'}</span>
                    <span className="w-1 h-1 rounded-full bg-surface-400" />
                    <span className="text-primary-600 dark:text-primary-400">
                      {currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="hidden lg:block">
              <QuickActions />
            </div>
          </div>
        </motion.div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-error-700 dark:text-error-300">
                Failed to load dashboard data
              </p>
              <p className="text-xs text-error-600 dark:text-error-400">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-error-100 dark:bg-error-800 text-error-700 dark:text-error-300 hover:bg-error-200 dark:hover:bg-error-700 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center justify-center gap-3 p-4"
          >
            <motion.div
              className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-surface-500 text-sm">Loading dashboard statistics...</span>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard3D
            title="Total Users"
            value={stats.totalUsers}
            change={stats.usersChange}
            icon={Users}
            color="primary"
            delay={0}
          />
          <StatCard3D
            title="Documents"
            value={stats.totalDocuments}
            change={stats.documentsChange}
            icon={FileText}
            color="secondary"
            delay={0.1}
          />
          <StatCard3D
            title="Forum Posts"
            value={stats.forumPosts}
            change={stats.postsChange}
            icon={MessageSquare}
            color="info"
            delay={0.2}
          />
          <StatCard3D
            title="Active Today"
            value={stats.activeUsers}
            change={stats.activeChange}
            icon={Activity}
            color="success"
            delay={0.3}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  User Growth
                </h3>
                <p className="text-sm text-surface-500">Monthly new registrations</p>
              </div>
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
                growthPercentage >= 0
                  ? 'bg-success-100 dark:bg-success-900/30 text-success-600'
                  : 'bg-error-100 dark:bg-error-900/30 text-error-600'
              )}>
                {growthPercentage >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage}%
              </div>
            </div>
            <AnimatedLineChart data={userGrowthData} labels={userGrowthLabels} />
          </motion.div>

          {/* Users by Role */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-secondary-500" />
                  Users by Role
                </h3>
                <p className="text-sm text-surface-500">Distribution across roles</p>
              </div>
            </div>
            {usersByRole.length > 0 ? (
              <AnimatedDonutChart data={usersByRole} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-3">
                  <PieChart className="w-6 h-6 text-surface-400" />
                </div>
                <p className="text-surface-500 text-sm">No user data available</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Zap className="w-5 h-5 text-secondary-500" />
                Recent Activity
              </h3>
              <Link
                to="/admin/audit"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {recentActivity.length > 0 ? (
              <ActivityFeed activities={recentActivity} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6 text-surface-400" />
                </div>
                <p className="text-surface-500 text-sm">No recent activity</p>
              </div>
            )}
          </motion.div>

          {/* Top MDAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                Top MDAs by Activity
              </h3>
              <Link
                to="/admin/analytics"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Details <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {topMDAs.length > 0 ? (
              <TopMDAsLeaderboard mdas={topMDAs} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-surface-400" />
                </div>
                <p className="text-surface-500 text-sm">No MDA data available</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Mobile Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 lg:hidden"
        >
          <QuickActions />
        </motion.div>
      </div>
    </div>
  );
}
