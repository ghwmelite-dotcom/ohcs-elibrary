import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  MessageSquare,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Eye,
  Clock,
  Activity,
  Zap,
  Globe,
  Building2,
  BookOpen,
  MessagesSquare,
  Award,
  Target,
  PieChart,
  LineChart,
  Filter,
  RefreshCw,
  ChevronRight,
  Flame,
  Star,
  ThumbsUp,
  Share2,
  Bookmark,
  UserPlus,
  FileUp,
  MessageCircle,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { format, subDays, subHours } from 'date-fns';

// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-50 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900" />

      {/* Animated gradient orbs */}
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

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
  subValue?: string;
}

function StatCard({ label, value, change, trend, icon: Icon, color, subValue }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''));

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  const formatValue = (num: number) => {
    if (value.includes('K')) return `${(num / 1000).toFixed(1)}K`;
    if (value.includes('M')) return `${(num / 1000000).toFixed(1)}M`;
    return num.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)`,
        }}
      />

      {/* Decorative corner */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: color }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-surface-900 dark:text-surface-50 mt-1">
            {formatValue(displayValue)}
          </p>
          {subValue && (
            <p className="text-xs text-surface-400 mt-1">{subValue}</p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-2">
        <span className={cn(
          'flex items-center gap-1 text-sm font-semibold',
          trend === 'up' ? 'text-success-600' : 'text-error-600'
        )}>
          {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          {change}
        </span>
        <span className="text-xs text-surface-400">vs last period</span>
      </div>
    </motion.div>
  );
}

// Activity Feed Item
interface ActivityItem {
  id: string;
  type: 'user_joined' | 'document_uploaded' | 'post_created' | 'badge_earned' | 'comment_added';
  user: string;
  content: string;
  time: Date;
}

function ActivityFeedItem({ activity }: { activity: ActivityItem }) {
  const iconMap = {
    user_joined: { icon: UserPlus, color: '#006B3F' },
    document_uploaded: { icon: FileUp, color: '#3B82F6' },
    post_created: { icon: MessageCircle, color: '#8B5CF6' },
    badge_earned: { icon: Trophy, color: '#FCD116' },
    comment_added: { icon: MessageSquare, color: '#10B981' },
  };

  const { icon: Icon, color } = iconMap[activity.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 py-3 border-b border-surface-100 dark:border-surface-700/50 last:border-0"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-700 dark:text-surface-300">
          <span className="font-semibold text-surface-900 dark:text-surface-50">{activity.user}</span>
          {' '}{activity.content}
        </p>
        <p className="text-xs text-surface-400 mt-0.5">
          {format(activity.time, 'h:mm a')}
        </p>
      </div>
    </motion.div>
  );
}

// Chart Bar Component
function ChartBar({ value, maxValue, label, color, delay }: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  delay: number;
}) {
  const percentage = (value / maxValue) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-40 w-full flex items-end justify-center">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ delay, duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-[40px] rounded-t-lg relative group cursor-pointer"
          style={{ backgroundColor: color }}
        >
          {/* Tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 text-white px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {value.toLocaleString()}
          </div>
        </motion.div>
      </div>
      <span className="text-xs text-surface-500 dark:text-surface-400 font-medium">{label}</span>
    </div>
  );
}

// Donut Chart Segment
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cumulativePercent = 0;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {segments.map((segment, index) => {
          const percent = (segment.value / total) * 100;
          const strokeDasharray = `${percent} ${100 - percent}`;
          const strokeDashoffset = -cumulativePercent;
          cumulativePercent += percent;

          return (
            <motion.circle
              key={segment.label}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={segment.color}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          {total.toLocaleString()}
        </span>
        <span className="text-xs text-surface-500">Total</span>
      </div>
    </div>
  );
}

// Heat Map Component
function HeatMap({ data }: { data: number[][] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

  const getColor = (value: number) => {
    if (value === 0) return 'bg-surface-100 dark:bg-surface-700';
    if (value < 25) return 'bg-primary-100 dark:bg-primary-900/30';
    if (value < 50) return 'bg-primary-300 dark:bg-primary-700/50';
    if (value < 75) return 'bg-primary-500 dark:bg-primary-600';
    return 'bg-primary-700 dark:bg-primary-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 ml-10">
        {hours.map((hour) => (
          <span key={hour} className="w-8 text-[10px] text-center text-surface-400">{hour}</span>
        ))}
      </div>
      {data.map((row, dayIndex) => (
        <div key={days[dayIndex]} className="flex items-center gap-1">
          <span className="w-8 text-xs text-surface-500 text-right pr-2">{days[dayIndex]}</span>
          {row.map((value, hourIndex) => (
            <motion.div
              key={hourIndex}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (dayIndex * 8 + hourIndex) * 0.01 }}
              className={cn(
                'w-8 h-6 rounded-sm cursor-pointer transition-transform hover:scale-110',
                getColor(value)
              )}
              title={`${days[dayIndex]} ${hours[hourIndex]}: ${value} activities`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// MDA Leaderboard Row
interface MDAStats {
  rank: number;
  name: string;
  acronym: string;
  users: number;
  documents: number;
  posts: number;
  engagement: number;
  trend: 'up' | 'down' | 'same';
  change: number;
}

function MDALeaderboardRow({ mda, index }: { mda: MDAStats; index: number }) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
    return 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400';
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-surface-100 dark:border-surface-700/50 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
    >
      <td className="py-3 px-4">
        <span className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm',
          getRankStyle(mda.rank)
        )}>
          {mda.rank}
        </span>
      </td>
      <td className="py-3 px-4">
        <div>
          <p className="font-semibold text-surface-900 dark:text-surface-50">{mda.name}</p>
          <p className="text-xs text-surface-400">{mda.acronym}</p>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="font-medium text-surface-700 dark:text-surface-300">{mda.users.toLocaleString()}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="font-medium text-surface-700 dark:text-surface-300">{mda.documents.toLocaleString()}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="font-medium text-surface-700 dark:text-surface-300">{mda.posts.toLocaleString()}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mda.engagement}%` }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            />
          </div>
          <span className="text-sm font-medium text-surface-600 dark:text-surface-400 w-10">
            {mda.engagement}%
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={cn(
          'flex items-center gap-1 text-sm font-medium',
          mda.trend === 'up' ? 'text-success-600' : mda.trend === 'down' ? 'text-error-600' : 'text-surface-400'
        )}>
          {mda.trend === 'up' && <TrendingUp className="w-4 h-4" />}
          {mda.trend === 'down' && <TrendingDown className="w-4 h-4" />}
          {mda.trend === 'same' && <span className="w-4 text-center">—</span>}
          {mda.change > 0 ? '+' : ''}{mda.change}%
        </span>
      </td>
    </motion.tr>
  );
}

// Top Content Card
interface TopContentItem {
  id: string;
  title: string;
  type: 'document' | 'post' | 'article';
  views: number;
  likes: number;
  shares: number;
  author: string;
  thumbnail?: string;
}

function TopContentCard({ item, rank }: { item: TopContentItem; rank: number }) {
  const typeIcons = {
    document: FileText,
    post: MessageSquare,
    article: BookOpen,
  };
  const Icon = typeIcons[item.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors cursor-pointer group"
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm',
        rank === 1 && 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white',
        rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800',
        rank === 3 && 'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
        rank > 3 && 'bg-surface-100 dark:bg-surface-700 text-surface-500'
      )}>
        {rank}
      </div>

      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-surface-900 dark:text-surface-50 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {item.title}
        </p>
        <p className="text-xs text-surface-400 truncate">by {item.author}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-surface-500">
            <Eye className="w-3 h-3" /> {item.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-xs text-surface-500">
            <ThumbsUp className="w-3 h-3" /> {item.likes}
          </span>
          <span className="flex items-center gap-1 text-xs text-surface-500">
            <Share2 className="w-3 h-3" /> {item.shares}
          </span>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500 transition-colors" />
    </motion.div>
  );
}

export default function AdminAnalytics() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Analytics data - to be populated from API
  const stats: StatCardProps[] = [
    { label: 'Total Users', value: '0', change: '0%', trend: 'up', icon: Users, color: '#006B3F' },
    { label: 'Documents', value: '0', change: '0%', trend: 'up', icon: FileText, color: '#3B82F6' },
    { label: 'Forum Posts', value: '0', change: '0%', trend: 'up', icon: MessageSquare, color: '#8B5CF6' },
    { label: 'Page Views', value: '0', change: '0%', trend: 'up', icon: Eye, color: '#FCD116' },
    { label: 'Avg Session', value: '0', change: '0%', trend: 'up', icon: Clock, color: '#10B981' },
    { label: 'Engagement Rate', value: '0', change: '0%', trend: 'up', icon: Activity, color: '#CE1126' },
  ];

  const userGrowthData: { month: string; users: number }[] = [];

  const contentDistribution: { label: string; value: number; color: string }[] = [];

  const engagementByType: { label: string; value: number; color: string }[] = [];

  const mdaLeaderboard: MDAStats[] = [];

  const recentActivities: ActivityItem[] = [];

  const heatMapData: number[][] = [];

  const topContent: TopContentItem[] = [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'engagement', label: 'Engagement', icon: Activity },
    { id: 'mdas', label: 'MDAs', icon: Building2 },
  ];

  const dateRanges = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: '1y', label: '1 Year' },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const maxUsers = Math.max(...userGrowthData.map(d => d.users));

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
                  Analytics Dashboard
                </h1>
                <p className="text-surface-600 dark:text-surface-400">
                  Platform insights and performance metrics
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
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

        {/* Tabs */}
        <div className="flex bg-white dark:bg-surface-800 rounded-xl p-1 shadow-sm overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                  selectedTab === tab.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50 hover:bg-surface-50 dark:hover:bg-surface-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Growth Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-primary-500" />
                  User Growth Trend
                </h3>
                <p className="text-sm text-surface-500 mt-1">Monthly active users over time</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-50 dark:bg-success-900/30">
                <TrendingUp className="w-4 h-4 text-success-600" />
                <span className="text-sm font-semibold text-success-600">+46.7%</span>
              </div>
            </div>

            <div className="flex items-end gap-3 h-48">
              {userGrowthData.map((data, index) => (
                <ChartBar
                  key={data.month}
                  value={data.users}
                  maxValue={maxUsers * 1.1}
                  label={data.month}
                  color={index === userGrowthData.length - 1 ? '#006B3F' : '#006B3F80'}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Zap className="w-5 h-5 text-secondary-500" />
                Live Activity
              </h3>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                <span className="text-xs text-surface-500">Live</span>
              </span>
            </div>

            <div className="space-y-1 max-h-[280px] overflow-y-auto custom-scrollbar">
              {recentActivities.map((activity) => (
                <ActivityFeedItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Content Distribution */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary-500" />
                  Content Distribution
                </h3>
                <p className="text-sm text-surface-500 mt-1">Documents by category</p>
              </div>
            </div>

            <DonutChart segments={contentDistribution} />

            <div className="grid grid-cols-2 gap-2 mt-6">
              {contentDistribution.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-surface-600 dark:text-surface-400 truncate">{item.label}</span>
                  <span className="text-xs font-semibold text-surface-900 dark:text-surface-50 ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement by Feature */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary-500" />
                  Feature Engagement
                </h3>
                <p className="text-sm text-surface-500 mt-1">Interactions by platform feature</p>
              </div>
            </div>

            <div className="space-y-4">
              {engagementByType.map((item, index) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{item.label}</span>
                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / 6500) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Content */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Flame className="w-5 h-5 text-error-500" />
                Trending Content
              </h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>

            <div className="space-y-1">
              {topContent.map((item, index) => (
                <TopContentCard key={item.id} item={item} rank={index + 1} />
              ))}
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                Activity Heatmap
              </h3>
              <p className="text-sm text-surface-500 mt-1">Platform activity patterns throughout the week</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500">Less</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-sm bg-surface-100 dark:bg-surface-700" />
                  <div className="w-4 h-4 rounded-sm bg-primary-200 dark:bg-primary-800" />
                  <div className="w-4 h-4 rounded-sm bg-primary-400 dark:bg-primary-600" />
                  <div className="w-4 h-4 rounded-sm bg-primary-600 dark:bg-primary-500" />
                </div>
                <span className="text-xs text-surface-500">More</span>
              </div>
            </div>
          </div>

          <HeatMap data={heatMapData} />
        </div>

        {/* MDA Leaderboard */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-secondary-500" />
                MDA Leaderboard
              </h3>
              <p className="text-sm text-surface-500 mt-1">Top performing ministries, departments & agencies</p>
            </div>
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Export Report
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Rank</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">MDA</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Users</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Documents</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Posts</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Engagement</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody>
                {mdaLeaderboard.map((mda, index) => (
                  <MDALeaderboardRow key={mda.acronym} mda={mda} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg. Response Time', value: '1.2s', icon: Zap, color: '#10B981' },
            { label: 'Uptime', value: '99.9%', icon: Activity, color: '#006B3F' },
            { label: 'Peak Users Today', value: '1,847', icon: TrendingUp, color: '#FCD116' },
            { label: 'Total Downloads', value: '45.6K', icon: Download, color: '#3B82F6' },
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-surface-900 dark:text-surface-50">{item.value}</p>
                <p className="text-xs text-surface-500">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
