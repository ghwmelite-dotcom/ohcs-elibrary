import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  Users,
  Newspaper,
  Trophy,
  Bell,
  TrendingUp,
  BookOpen,
  Clock,
  ArrowRight,
  Zap,
  Star,
  Flame,
  Target,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Play,
  Bookmark,
  Brain,
  GraduationCap,
  Calendar,
  CheckCircle2,
  PanelRightOpen,
  PanelRightClose,
  LayoutGrid,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useForumStore } from '@/stores/forumStore';
import { EnhancedWellnessDashboardCard } from '@/components/wellness';
import { cn } from '@/utils/cn';

// ============================================================================
// ANIMATED BACKGROUND
// ============================================================================
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating gradient orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 107, 63, 0.12) 0%, transparent 70%)',
          top: '-5%',
          left: '-10%',
        }}
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(252, 209, 22, 0.08) 0%, transparent 70%)',
          bottom: '10%',
          right: '-5%',
        }}
        animate={{
          y: [0, -20, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 107, 63, 0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 107, 63, 0.8) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// ============================================================================
// LEVEL PROGRESS CARD (Premium Version)
// ============================================================================
interface LevelProgressProps {
  level: number;
  levelName: string;
  currentXP: number;
  requiredXP: number;
  totalXP: number;
}

function PremiumLevelProgress({ level, levelName, currentXP, requiredXP, totalXP }: LevelProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const progress = (currentXP / requiredXP) * 100;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 50%, #003620 100%)',
        }}
      />

      {/* Animated patterns */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        animate={{ x: [0, 60], y: [0, 60] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-secondary-400 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: '50%',
          }}
          animate={{
            y: [-20, -40, -20],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}

      <div className="relative p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Level badge */}
            <motion.div
              className="relative"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center shadow-lg">
                <span className="text-xl sm:text-2xl font-bold text-surface-900">{level}</span>
              </div>
              {/* Glow ring */}
              <motion.div
                className="absolute -inset-1 rounded-2xl border-2 border-secondary-400"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-white truncate">{levelName}</h3>
              <p className="text-primary-200 text-xs sm:text-sm">
                {totalXP.toLocaleString()} Total XP
              </p>
            </div>
          </div>

          {/* Next level info */}
          <div className="text-left sm:text-right">
            <p className="text-primary-200 text-xs sm:text-sm">Next Level</p>
            <p className="text-xl sm:text-2xl font-bold text-white">
              {(requiredXP - currentXP).toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-4 bg-black/20 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #FCD116, #f59e0b, #FCD116)',
              backgroundSize: '200% 100%',
            }}
            initial={{ width: 0 }}
            animate={isInView ? {
              width: `${progress}%`,
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            } : {}}
            transition={{
              width: { duration: 1.5, ease: 'easeOut' },
              backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
            }}
          />
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        </div>

        {/* XP Labels */}
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-primary-200">{currentXP.toLocaleString()} XP</span>
          <span className="text-white font-medium">{requiredXP.toLocaleString()} XP</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  link: string;
  delay?: number;
}

function StatCard({ label, value, icon: Icon, color, link, delay = 0 }: StatCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const isInView = useInView(ref, { once: true });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, type: 'spring', stiffness: 100 }}
    >
      <Link
        ref={ref}
        to={link}
        className="group block relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-surface-800/90 backdrop-blur-xl border border-surface-200/50 dark:border-surface-700/50 p-3 sm:p-4 md:p-5 transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          boxShadow: isHovered
            ? `0 20px 40px -12px ${color}40, 0 0 0 1px ${color}20`
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Hover glow */}
        <motion.div
          className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${color}30, transparent 70%)`,
            filter: 'blur(15px)',
          }}
        />

        <div className="relative flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* Icon */}
          <motion.div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}15` }}
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} />
          </motion.div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <motion.p
              className="text-lg sm:text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50 truncate"
              initial={{ scale: 0.8 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: delay + 0.2, type: 'spring' }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </motion.p>
            <p className="text-xs sm:text-sm text-surface-500 truncate">{label}</p>
          </div>

          {/* Arrow - hidden on mobile */}
          <motion.div
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 hidden sm:block"
            animate={{ x: isHovered ? 0 : -5, opacity: isHovered ? 1 : 0 }}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// STREAK DISPLAY
// ============================================================================
function StreakDisplay({ streak }: { streak: number }) {
  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Flame className="w-5 h-5 text-orange-500" />
      </motion.div>
      <span className="font-bold text-orange-600 dark:text-orange-400">{streak}</span>
      <span className="text-sm text-surface-600 dark:text-surface-400">day streak</span>
    </motion.div>
  );
}

// ============================================================================
// DOCUMENT CARD
// ============================================================================
interface DocumentCardProps {
  id: string;
  title: string;
  category: string;
  progress: number;
  delay?: number;
}

function DocumentCard({ id, title, category, progress, delay = 0 }: DocumentCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const isInView = useInView(ref, { once: true });
  const isComplete = progress === 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay }}
    >
      <Link
        ref={ref}
        to={`/library/${id}`}
        className="group flex items-center gap-4 p-4 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-all"
      >
        {/* Icon */}
        <motion.div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shadow-sm',
            isComplete
              ? 'bg-gradient-to-br from-success-400 to-success-600'
              : 'bg-gradient-to-br from-primary-400 to-primary-600'
          )}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-white" />
          ) : (
            <BookOpen className="w-6 h-6 text-white" />
          )}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-surface-900 dark:text-surface-50 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {title}
          </p>
          <p className="text-xs text-surface-500">{category}</p>
        </div>

        {/* Progress */}
        <div className="w-24 flex flex-col items-end gap-1">
          <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                isComplete
                  ? 'bg-gradient-to-r from-success-400 to-success-600'
                  : 'bg-gradient-to-r from-primary-400 to-primary-600'
              )}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${progress}%` } : {}}
              transition={{ delay: delay + 0.3, duration: 0.8 }}
            />
          </div>
          <span className={cn(
            'text-xs font-medium',
            isComplete ? 'text-success-600' : 'text-surface-500'
          )}>
            {progress}%
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// ACTIVITY ITEM
// ============================================================================
interface ActivityItemProps {
  type: 'xp' | 'badge' | 'forum' | 'document';
  message: string;
  time: string;
  delay?: number;
}

function ActivityItem({ type, message, time, delay = 0 }: ActivityItemProps) {
  const icons = {
    xp: Zap,
    badge: Star,
    forum: TrendingUp,
    document: BookOpen,
  };

  const colors = {
    xp: { bg: 'from-success-400 to-success-600', text: 'text-success-600' },
    badge: { bg: 'from-secondary-400 to-secondary-600', text: 'text-secondary-600' },
    forum: { bg: 'from-info-400 to-info-600', text: 'text-info-600' },
    document: { bg: 'from-primary-400 to-primary-600', text: 'text-primary-600' },
  };

  const Icon = icons[type];
  const color = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3 group"
    >
      <motion.div
        className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm bg-gradient-to-br', color.bg)}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-surface-100 transition-colors">
          {message}
        </p>
        <p className="text-xs text-surface-400 mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {time}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// QUICK ACTION BUTTON
// ============================================================================
interface QuickActionProps {
  label: string;
  icon: React.ElementType;
  link: string;
  color: string;
  delay?: number;
}

function QuickAction({ label, icon: Icon, link, color, delay = 0 }: QuickActionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
    >
      <Link
        to={link}
        className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-surface-800/90 backdrop-blur-xl border border-surface-200/50 dark:border-surface-700/50 hover:shadow-lg transition-all"
      >
        <motion.div
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" style={{ color }} />
        </motion.div>
        <span className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-surface-100 transition-colors text-center truncate w-full">
          {label}
        </span>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// EVENT CARD
// ============================================================================
interface EventCardProps {
  title: string;
  date: string;
  type: string;
  delay?: number;
}

function EventCard({ title, date, type, delay = 0 }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
    >
      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
        <Calendar className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-primary-200">{date}</span>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-white/20 text-white rounded-full">
            {type}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Dashboard() {
  const { user } = useAuthStore();
  const { stats, activities, fetchStats, fetchActivities, updateStreak } = useGamificationStore();
  const { recentlyViewed, fetchRecentlyViewed } = useLibraryStore();
  const { stats: forumStats, fetchStats: fetchForumStats } = useForumStore();
  const [greeting, setGreeting] = useState('');

  // Collapsible sidebar state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('dashboard-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem('dashboard-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Toggle function
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev: boolean) => !prev);
  }, []);

  // Keyboard shortcut: Ctrl+. to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // Fetch data on mount
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Fetch all dashboard data
    fetchStats();
    fetchActivities(5);
    fetchRecentlyViewed();
    fetchForumStats();
    updateStreak(); // Update login streak
  }, []);

  // Calculate stats from real data
  const documentsRead = stats?.level?.level ? Math.floor((stats.totalXP || 0) / 50) : 0;
  const forumPosts = forumStats?.totalPosts || 0;
  const badgesEarned = stats?.badgeCount || 0;
  const currentStreak = stats?.streaks?.[0]?.currentStreak || 0;

  const quickStats = [
    { label: 'Documents Read', value: documentsRead, icon: BookOpen, color: '#006B3F', link: '/library' },
    { label: 'Forum Posts', value: forumPosts, icon: MessageSquare, color: '#3B82F6', link: '/forum' },
    { label: 'Groups Joined', value: 3, icon: Users, color: '#FCD116', link: '/groups' },
    { label: 'Badges Earned', value: badgesEarned, icon: Trophy, color: '#CE1126', link: '/leaderboard' },
  ];

  // Use real recent documents or fallback
  const recentDocuments = (recentlyViewed || []).slice(0, 4).map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category || 'Document',
    progress: doc.readingProgress || 0,
  }));

  // If no recent documents, show placeholder
  const displayDocuments = recentDocuments.length > 0 ? recentDocuments : [
    { id: '1', title: 'Start exploring the library', category: 'Getting Started', progress: 0 },
  ];

  // Format activity for display
  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getActivityType = (sourceType: string): 'xp' | 'badge' | 'forum' | 'document' => {
    if (sourceType === 'badge') return 'badge';
    if (sourceType === 'forum_post' || sourceType === 'forum_topic') return 'forum';
    if (sourceType === 'document' || sourceType === 'reading') return 'document';
    return 'xp';
  };

  // Use real activities or fallback
  const recentActivity = (activities || []).slice(0, 4).map((activity: any) => ({
    type: getActivityType(activity.sourceType || 'xp'),
    message: activity.description || activity.reason || 'Activity',
    time: formatActivityTime(activity.createdAt || new Date().toISOString()),
  }));

  // If no activities, show placeholder
  const displayActivities = recentActivity.length > 0 ? recentActivity : [
    { type: 'xp' as const, message: 'Welcome to OHCS E-Library!', time: 'Just now' },
  ];

  const quickActions = [
    { label: 'Browse Library', icon: BookOpen, link: '/library', color: '#006B3F' },
    { label: 'Forum', icon: MessageSquare, link: '/forum', color: '#3B82F6' },
    { label: 'News Feed', icon: Newspaper, link: '/news', color: '#CE1126' },
    { label: 'Leaderboard', icon: Trophy, link: '/leaderboard', color: '#FCD116' },
  ];

  const upcomingEvents = [
    { title: 'Digital Skills Workshop', date: 'Jan 20, 2025', type: 'Training' },
    { title: 'Policy Review Meeting', date: 'Jan 22, 2025', type: 'Meeting' },
    { title: 'AI in Government Webinar', date: 'Jan 25, 2025', type: 'Webinar' },
  ];

  // Get level info from stats
  const currentLevel = stats?.level?.level || 1;
  const levelName = stats?.level?.name || 'Newcomer';
  const totalXP = stats?.totalXP || 0;
  const xpProgress = stats?.xpProgress || 0;
  const xpToNextLevel = stats?.xpToNextLevel || 100;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 relative">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                  alt="Profile"
                  className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                />
                {/* Online indicator */}
                <motion.div
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-success-500 rounded-full border-2 border-white dark:border-surface-900"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <div>
                <motion.h1
                  className="text-2xl font-bold text-surface-900 dark:text-surface-50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {greeting}, {user?.firstName || 'User'}!
                  <motion.span
                    className="inline-block ml-2"
                    animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    👋
                  </motion.span>
                </motion.h1>
                <p className="text-surface-600 dark:text-surface-400">
                  Ready to learn something new today?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StreakDisplay streak={currentStreak} />
              <Link
                to="/notifications"
                className="relative p-3 bg-white dark:bg-surface-800 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <Bell className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                <motion.span
                  className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  3
                </motion.span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <PremiumLevelProgress
            level={currentLevel}
            levelName={levelName}
            currentXP={xpProgress}
            requiredXP={xpProgress + xpToNextLevel}
            totalXP={totalXP}
          />
        </motion.div>

        {/* Wellness Centre Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <EnhancedWellnessDashboardCard />
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
          {quickStats.map((stat, index) => (
            <StatCard
              key={stat.label}
              {...stat}
              delay={0.2 + index * 0.1}
            />
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Main Content */}
          <motion.div
            className="flex-1 min-w-0 space-y-6"
            initial={false}
            animate={{ marginRight: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Continue Reading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <motion.div
                    className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Clock className="w-4 h-4 text-primary-600" />
                  </motion.div>
                  Continue Reading
                </h2>
                <Link
                  to="/library"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-2">
                {displayDocuments.map((doc, index) => (
                  <DocumentCard
                    key={doc.id}
                    {...doc}
                    delay={0.5 + index * 0.1}
                  />
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
            >
              {quickActions.map((action, index) => (
                <QuickAction
                  key={action.label}
                  {...action}
                  delay={0.6 + index * 0.1}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Collapsed Sidebar - Sleek Glass Panel */}
          <AnimatePresence>
            {isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0, scale: 0.8 }}
                animate={{ opacity: 1, width: 72, scale: 1 }}
                exit={{ opacity: 0, width: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="hidden lg:flex flex-col items-center py-6 px-3 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 shadow-xl"
              >
                {/* Expand Button with Glow */}
                <motion.button
                  onClick={toggleSidebar}
                  className="relative p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg mb-6 group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="Expand sidebar (Ctrl+.)"
                >
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-primary-400 blur-lg opacity-0 group-hover:opacity-50 transition-opacity"
                  />
                  <PanelRightOpen className="w-5 h-5 relative z-10" />
                </motion.button>

                {/* Mini Indicators with beautiful styling */}
                <div className="flex-1 flex flex-col gap-4 items-center">
                  {/* Activity Indicator */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center gap-2"
                    title="Recent Activity"
                  >
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400/20 to-secondary-600/20 border border-secondary-500/30 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      >
                        <Zap className="w-5 h-5 text-secondary-500" />
                      </motion.div>
                    </motion.div>
                    <span className="text-[10px] font-medium text-surface-500">Activity</span>
                  </motion.div>

                  {/* Events Indicator */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-2"
                    title="Upcoming Events"
                  >
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400/20 to-primary-600/20 border border-primary-500/30 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                    >
                      <Calendar className="w-5 h-5 text-primary-500" />
                    </motion.div>
                    <span className="text-[10px] font-medium text-surface-500">Events</span>
                  </motion.div>

                  {/* AI Indicator */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center gap-2"
                    title="AI Assistant"
                  >
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Brain className="w-5 h-5 text-amber-500" />
                      </motion.div>
                    </motion.div>
                    <span className="text-[10px] font-medium text-surface-500">AI</span>
                  </motion.div>
                </div>

                {/* Bottom decoration */}
                <motion.div
                  className="w-8 h-1 rounded-full bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 mt-4"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar with Collapse */}
          <motion.div
            className="hidden lg:block relative flex-shrink-0"
            initial={false}
            animate={{
              width: isSidebarCollapsed ? 0 : 340,
              opacity: isSidebarCollapsed ? 0 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Sleek Collapse Toggle Handle */}
            <motion.button
              onClick={toggleSidebar}
              className={cn(
                'absolute top-6 z-20 flex items-center justify-center',
                'w-8 h-14 rounded-l-2xl shadow-xl transition-all duration-300',
                'bg-gradient-to-b from-white to-surface-50 dark:from-surface-700 dark:to-surface-800',
                'border border-r-0 border-surface-200/50 dark:border-surface-600/50',
                'hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30',
                'text-surface-400 hover:text-primary-600 dark:hover:text-primary-400',
                'group',
                '-left-4'
              )}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+.)' : 'Collapse sidebar (Ctrl+.)'}
            >
              {/* Glow on hover */}
              <motion.div
                className="absolute inset-0 rounded-l-2xl bg-primary-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <motion.div
                className="relative z-10"
                animate={{ rotate: isSidebarCollapsed ? 180 : 0 }}
                transition={{ duration: 0.3, type: 'spring' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.div>
            </motion.button>

            <motion.div
              className="w-[340px] space-y-6 overflow-hidden"
              initial={false}
              animate={{
                opacity: isSidebarCollapsed ? 0 : 1,
                x: isSidebarCollapsed ? 30 : 0,
              }}
              transition={{ duration: 0.25 }}
            >
              {/* Sidebar content wrapper */}
              <div className="space-y-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-surface-800/90 backdrop-blur-xl rounded-2xl border border-surface-200/50 dark:border-surface-700/50 p-6 shadow-lg"
            >
              <h2 className="font-semibold text-surface-900 dark:text-surface-50 mb-5 flex items-center gap-2">
                <motion.div
                  className="w-8 h-8 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Zap className="w-4 h-4 text-secondary-600" />
                </motion.div>
                Recent Activity
              </h2>

              <div className="space-y-4">
                {displayActivities.map((activity, index) => (
                  <ActivityItem
                    key={index}
                    {...activity}
                    delay={0.7 + index * 0.1}
                  />
                ))}
              </div>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="relative overflow-hidden rounded-2xl"
            >
              {/* Background */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
                }}
              />

              {/* Animated pattern */}
              <motion.div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
                animate={{ x: [0, 20], y: [0, 20] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />

              <div className="relative p-6">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Events
                </h2>

                <div className="space-y-3">
                  {upcomingEvents.map((event, index) => (
                    <EventCard
                      key={event.title}
                      {...event}
                      delay={0.8 + index * 0.1}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* AI Assistant Promo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 to-surface-800 p-6"
            >
              {/* Glow effect */}
              <motion.div
                className="absolute top-0 right-0 w-32 h-32 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(252, 209, 22, 0.3), transparent 70%)',
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <div className="relative">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center mb-4 shadow-lg"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Brain className="w-6 h-6 text-surface-900" />
                </motion.div>

                <h3 className="text-lg font-bold text-white mb-2">
                  AI Research Assistant
                </h3>
                <p className="text-sm text-surface-400 mb-4">
                  Get instant answers from our AI trained on official documents.
                </p>

                <Link
                  to="/library"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-500 text-surface-900 font-medium text-sm hover:bg-secondary-400 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Try Now
                </Link>
              </div>
            </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
