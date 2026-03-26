import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Library,
  Bookmark,
  MessageSquare,
  MessagesSquare,
  Users,
  Newspaper,
  Trophy,
  Heart,
  Bell,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Mail,
  UserPlus,
  Award,
  Sparkles,
  GraduationCap,
  BookOpen,
  BadgeCheck,
  Home,
  Brain,
  Compass,
  Calendar,
  ShoppingBag,
  UserCircle,
  Briefcase,
  Route,
  Target,
  TrendingUp,
  ClipboardList,
  Map,
  Building2,
  HandHeart,
  Presentation,
  Medal,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNewsStore } from '@/stores/newsStore';
import { useDMStore } from '@/stores/dmStore';
import { Avatar } from '@/components/shared/Avatar';
import { AnimatedLogo } from '@/components/shared/AnimatedLogo';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  color?: string;
  tag?: { label: string; color: string; pulse?: boolean };
  hasBadge?: boolean;
}

interface NavSubSection {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  items: NavItem[];
}

interface NavSection {
  title?: string;
  items?: NavItem[];
  subSections?: NavSubSection[];
  requiresInstructor?: boolean;
}

// Organized navigation sections with tags
const navSections: NavSection[] = [
  {
    items: [
      { path: '/feed', label: 'Home', icon: Home, color: 'primary' },
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'slate' },
      { path: '/library', label: 'Document Library', icon: Library, color: 'amber', tag: { label: 'CORE', color: 'amber' } },
      { path: '/bookmarks', label: 'My Bookmarks', icon: Bookmark, color: 'amber' },
    ],
  },
  {
    title: 'Connect',
    items: [
      { path: '/dm', label: 'Messages', icon: Mail, color: 'blue', hasBadge: true },
      { path: '/network', label: 'Network', icon: UserPlus, color: 'emerald' },
      { path: '/chat', label: 'Chat Rooms', icon: MessagesSquare, color: 'cyan', tag: { label: 'LIVE', color: 'cyan', pulse: true } },
      { path: '/groups', label: 'Groups', icon: Users, color: 'violet' },
    ],
  },
  {
    title: 'Career Development',
    subSections: [
      {
        id: 'learning',
        title: 'Learning & Training',
        icon: GraduationCap,
        color: 'indigo',
        items: [
          { path: '/courses', label: 'Course Catalog', icon: Compass, color: 'indigo', tag: { label: 'LMS', color: 'indigo' } },
          { path: '/my-courses', label: 'My Learning', icon: BookOpen, color: 'sky' },
          { path: '/certificates', label: 'Certificates', icon: BadgeCheck, color: 'emerald' },
          { path: '/calendar', label: 'Calendar', icon: Calendar, color: 'green' },
        ],
      },
      {
        id: 'career-growth',
        title: 'Career Growth',
        icon: TrendingUp,
        color: 'emerald',
        items: [
          { path: '/career-paths', label: 'Career Paths', icon: Route, color: 'emerald' },
          { path: '/skill-gap', label: 'Skill Gap', icon: Target, color: 'blue' },
          { path: '/promotion', label: 'Promotion', icon: TrendingUp, color: 'purple' },
          { path: '/competencies', label: 'Competencies', icon: ClipboardList, color: 'teal' },
          { path: '/my-plan', label: 'My Plan', icon: Map, color: 'cyan' },
        ],
      },
      {
        id: 'collaboration',
        title: 'Collaboration',
        icon: Users,
        color: 'violet',
        items: [
          { path: '/mentorship', label: 'Mentorship', icon: Users, color: 'violet', tag: { label: 'HOT', color: 'violet' } },
          { path: '/peer-reviews', label: 'Peer Reviews', icon: Users, color: 'pink' },
        ],
      },
    ],
  },
  {
    title: 'Teach',
    items: [
      { path: '/instructor', label: 'Instructor Hub', icon: Presentation, color: 'violet', tag: { label: 'NEW', color: 'violet' } },
    ],
    requiresInstructor: true,
  },
  {
    title: 'AI Tools',
    items: [
      { path: '/ozzy', label: 'Ask Ozzy', icon: Sparkles, color: 'yellow', tag: { label: 'AI', color: 'gradient', pulse: true } },
      { path: '/research-hub', label: 'Research Hub', icon: Brain, color: 'purple', tag: { label: 'AI', color: 'gradient' } },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      { path: '/shop', label: 'Shop', icon: ShoppingBag, color: 'emerald', tag: { label: 'NEW', color: 'green' } },
      { path: '/shop/account', label: 'My Account', icon: UserCircle, color: 'violet' },
    ],
  },
  {
    title: 'Sponsorship',
    items: [
      { path: '/scholarships', label: 'Scholarships', icon: Medal, color: 'amber', tag: { label: 'NEW', color: 'amber' } },
      { path: '/my-scholarships', label: 'My Applications', icon: ClipboardList, color: 'sky' },
      { path: '/sponsors', label: 'Our Sponsors', icon: Building2, color: 'indigo' },
    ],
  },
  {
    title: 'Community',
    items: [
      { path: '/forum', label: 'Forum', icon: MessageSquare, color: 'orange' },
      { path: '/news', label: 'News', icon: Newspaper, color: 'rose', hasBadge: true },
      { path: '/leaderboard', label: 'Leaderboard', icon: Trophy, color: 'yellow' },
      { path: '/recognition', label: 'Recognition', icon: Award, color: 'pink', tag: { label: 'NEW', color: 'pink' } },
    ],
  },
  {
    title: 'Wellness',
    items: [
      { path: '/wellness', label: 'Wellness Hub', icon: Heart, color: 'teal', tag: { label: 'CARE', color: 'teal' } },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { path: '/notifications', label: 'Notifications', icon: Bell, color: 'slate', hasBadge: true },
  { path: '/settings', label: 'Settings', icon: Settings, color: 'slate' },
  { path: '/help', label: 'Help & Support', icon: HelpCircle, color: 'slate' },
];

// Enhanced color mappings with gradients and glows for beautiful icons
const colorMap: Record<string, {
  bg: string;
  text: string;
  hover: string;
  icon: string;
  iconActive: string;
  glow: string;
  tag: string;
}> = {
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-900/30',
    text: 'text-primary-700 dark:text-primary-300',
    hover: 'hover:bg-primary-50/80 dark:hover:bg-primary-900/20',
    icon: 'text-primary-500 dark:text-primary-400',
    iconActive: 'text-primary-600 dark:text-primary-300',
    glow: 'drop-shadow-[0_0_6px_rgba(0,107,63,0.5)] dark:drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]',
    tag: 'bg-primary-500',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-700 dark:text-slate-200',
    hover: 'hover:bg-slate-100/80 dark:hover:bg-slate-800/40',
    icon: 'text-slate-500 dark:text-slate-400',
    iconActive: 'text-slate-700 dark:text-slate-200',
    glow: 'drop-shadow-[0_0_4px_rgba(100,116,139,0.4)]',
    tag: 'bg-slate-500',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    hover: 'hover:bg-blue-50/80 dark:hover:bg-blue-900/20',
    icon: 'text-blue-500 dark:text-blue-400',
    iconActive: 'text-blue-600 dark:text-blue-300',
    glow: 'drop-shadow-[0_0_6px_rgba(59,130,246,0.5)] dark:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]',
    tag: 'bg-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    hover: 'hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20',
    icon: 'text-emerald-500 dark:text-emerald-400',
    iconActive: 'text-emerald-600 dark:text-emerald-300',
    glow: 'drop-shadow-[0_0_6px_rgba(16,185,129,0.5)] dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    tag: 'bg-emerald-500',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    hover: 'hover:bg-cyan-50/80 dark:hover:bg-cyan-900/20',
    icon: 'text-cyan-500 dark:text-cyan-400',
    iconActive: 'text-cyan-600 dark:text-cyan-300',
    glow: 'drop-shadow-[0_0_6px_rgba(6,182,212,0.5)] dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
    tag: 'bg-cyan-500',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    hover: 'hover:bg-violet-50/80 dark:hover:bg-violet-900/20',
    icon: 'text-violet-500 dark:text-violet-400',
    iconActive: 'text-violet-600 dark:text-violet-300',
    glow: 'drop-shadow-[0_0_6px_rgba(139,92,246,0.5)] dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]',
    tag: 'bg-violet-500',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    hover: 'hover:bg-indigo-50/80 dark:hover:bg-indigo-900/20',
    icon: 'text-indigo-500 dark:text-indigo-400',
    iconActive: 'text-indigo-600 dark:text-indigo-300',
    glow: 'drop-shadow-[0_0_6px_rgba(99,102,241,0.5)] dark:drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]',
    tag: 'bg-indigo-500',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
    hover: 'hover:bg-sky-50/80 dark:hover:bg-sky-900/20',
    icon: 'text-sky-500 dark:text-sky-400',
    iconActive: 'text-sky-600 dark:text-sky-300',
    glow: 'drop-shadow-[0_0_6px_rgba(14,165,233,0.5)] dark:drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]',
    tag: 'bg-sky-500',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    hover: 'hover:bg-green-50/80 dark:hover:bg-green-900/20',
    icon: 'text-green-500 dark:text-green-400',
    iconActive: 'text-green-600 dark:text-green-300',
    glow: 'drop-shadow-[0_0_6px_rgba(34,197,94,0.5)] dark:drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]',
    tag: 'bg-green-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    hover: 'hover:bg-amber-50/80 dark:hover:bg-amber-900/20',
    icon: 'text-amber-500 dark:text-amber-400',
    iconActive: 'text-amber-600 dark:text-amber-300',
    glow: 'drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] dark:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    tag: 'bg-amber-500',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    hover: 'hover:bg-yellow-50/80 dark:hover:bg-yellow-900/20',
    icon: 'text-yellow-500 dark:text-yellow-400',
    iconActive: 'text-yellow-600 dark:text-yellow-300',
    glow: 'drop-shadow-[0_0_6px_rgba(234,179,8,0.5)] dark:drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]',
    tag: 'bg-yellow-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    hover: 'hover:bg-purple-50/80 dark:hover:bg-purple-900/20',
    icon: 'text-purple-500 dark:text-purple-400',
    iconActive: 'text-purple-600 dark:text-purple-300',
    glow: 'drop-shadow-[0_0_6px_rgba(168,85,247,0.5)] dark:drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]',
    tag: 'bg-purple-500',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    hover: 'hover:bg-orange-50/80 dark:hover:bg-orange-900/20',
    icon: 'text-orange-500 dark:text-orange-400',
    iconActive: 'text-orange-600 dark:text-orange-300',
    glow: 'drop-shadow-[0_0_6px_rgba(249,115,22,0.5)] dark:drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]',
    tag: 'bg-orange-500',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    hover: 'hover:bg-rose-50/80 dark:hover:bg-rose-900/20',
    icon: 'text-rose-500 dark:text-rose-400',
    iconActive: 'text-rose-600 dark:text-rose-300',
    glow: 'drop-shadow-[0_0_6px_rgba(244,63,94,0.5)] dark:drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]',
    tag: 'bg-rose-500',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-300',
    hover: 'hover:bg-pink-50/80 dark:hover:bg-pink-900/20',
    icon: 'text-pink-500 dark:text-pink-400',
    iconActive: 'text-pink-600 dark:text-pink-300',
    glow: 'drop-shadow-[0_0_6px_rgba(236,72,153,0.5)] dark:drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]',
    tag: 'bg-pink-500',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    hover: 'hover:bg-teal-50/80 dark:hover:bg-teal-900/20',
    icon: 'text-teal-500 dark:text-teal-400',
    iconActive: 'text-teal-600 dark:text-teal-300',
    glow: 'drop-shadow-[0_0_6px_rgba(20,184,166,0.5)] dark:drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]',
    tag: 'bg-teal-500',
  },
  gradient: {
    bg: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
    text: 'text-white',
    hover: 'hover:opacity-90',
    icon: 'text-violet-500 dark:text-violet-400',
    iconActive: 'text-fuchsia-500 dark:text-fuchsia-400',
    glow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] dark:drop-shadow-[0_0_10px_rgba(232,121,249,0.6)]',
    tag: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
  },
};

// Animated Icon Component
function AnimatedIcon({ Icon, color, isActive, isHovered }: { Icon: LucideIcon; color: string; isActive: boolean; isHovered: boolean }) {
  return (
    <motion.div
      animate={{
        scale: isHovered ? 1.15 : 1,
        rotate: isHovered ? [0, -10, 10, -5, 5, 0] : 0,
      }}
      transition={{
        scale: { type: 'spring', stiffness: 400, damping: 17 },
        rotate: { duration: 0.5, ease: 'easeInOut' },
      }}
    >
      <Icon
        className={cn(
          'w-[18px] h-[18px] transition-colors duration-200',
          isActive || isHovered ? colorMap[color]?.icon : 'text-surface-400 dark:text-surface-500'
        )}
      />
    </motion.div>
  );
}

// Tag Component with enhanced styling
function NavTag({ label, color, pulse }: { label: string; color: string; pulse?: boolean }) {
  // Beautiful gradient backgrounds for tags
  const tagStyles: Record<string, string> = {
    gradient: 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 shadow-violet-500/30',
    cyan: 'bg-gradient-to-r from-cyan-500 to-teal-500 shadow-cyan-500/30',
    indigo: 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-indigo-500/30',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30',
    pink: 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30',
    teal: 'bg-gradient-to-r from-teal-500 to-emerald-500 shadow-teal-500/30',
  };

  const tagColor = tagStyles[color] || `${colorMap[color]?.tag || 'bg-surface-500 dark:bg-surface-600'} shadow-surface-500/20 dark:shadow-surface-600/20`;

  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      className={cn(
        'px-1.5 py-0.5 text-[9px] font-bold text-white rounded-md shadow-lg',
        tagColor
      )}
    >
      {pulse ? (
        <motion.span
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {label}
        </motion.span>
      ) : (
        label
      )}
    </motion.span>
  );
}

// Badge Count Component with gradient and glow
function BadgeCount({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <motion.span
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className="min-w-[18px] px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full text-center shadow-lg shadow-red-500/40"
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  );
}

// Map sidebar paths to i18n keys for translatable nav items
const navI18nKeys: Record<string, string> = {
  '/feed': 'nav.home',
  '/library': 'nav.library',
  '/courses': 'nav.courses',
  '/chat': 'nav.chat',
  '/forum': 'nav.forum',
  '/news': 'nav.news',
  '/wellness': 'nav.wellness',
  '/research-hub': 'nav.research',
  '/shop': 'nav.shop',
  '/settings': 'nav.settings',
  '/profile': 'nav.profile',
};

export function Sidebar() {
  const { sidebar, setSidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const { summary } = useNotificationStore();
  const unreadCount = summary?.unreadTotal || 0;
  const { newArticlesCount, checkForNewArticles, markNewsAsViewed } = useNewsStore();
  const { unreadCount: dmUnreadCount, fetchUnreadCount } = useDMStore();
  const location = useLocation();

  // State for expanded sub-sections (default: first sub-section expanded)
  const [expandedSubSections, setExpandedSubSections] = useState<Record<string, boolean>>({
    'learning': true,
    'career-growth': false,
    'collaboration': false,
  });

  const isCollapsed = sidebar.isCollapsed;

  const toggleSubSection = (id: string) => {
    setExpandedSubSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    checkForNewArticles();
    const interval = setInterval(checkForNewArticles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkForNewArticles]);

  useEffect(() => {
    if (location.pathname === '/news' || location.pathname.startsWith('/news/')) {
      markNewsAsViewed();
    }
  }, [location.pathname, markNewsAsViewed]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const getBadgeCount = (path: string) => {
    if (path === '/news') return newArticlesCount;
    if (path === '/dm') return dmUnreadCount;
    if (path === '/notifications') return unreadCount;
    return 0;
  };

  const renderNavItem = (item: NavItem) => {
    const colors = colorMap[item.color || 'slate'] || colorMap.slate;
    const badgeCount = item.hasBadge ? getBadgeCount(item.path) : 0;
    const Icon = item.icon;
    // Use translated label if an i18n key exists for this path
    const i18nKey = navI18nKeys[item.path];
    const translatedItem = i18nKey ? { ...item, label: t(i18nKey) } : item;

    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200',
              isActive
                ? `${colors.bg} ${colors.text} font-medium shadow-sm`
                : `text-surface-600 dark:text-surface-400 ${colors.hover}`,
              isCollapsed && 'justify-center px-2'
            )
          }
          title={isCollapsed ? translatedItem.label : undefined}
        >
          {({ isActive }) => (
            <NavItemContent
              item={translatedItem}
              isActive={isActive}
              isCollapsed={isCollapsed}
              badgeCount={badgeCount}
              colors={colors}
            />
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <aside
      data-tour="sidebar"
      className={cn(
        'fixed left-0 top-0 h-screen z-40 transition-all duration-300 flex flex-col',
        'hidden lg:flex',
        'bg-white/95 backdrop-blur-xl border-r border-surface-200/80',
        'dark:bg-surface-900/95 dark:border-surface-800',
        isCollapsed ? 'w-[72px]' : 'w-60'
      )}
    >
      {/* Logo and Toggle */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-surface-200/60 dark:border-surface-800">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <AnimatedLogo size="sm" showText showAIBadge={false} isCollapsed={false} />
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto"
            >
              <AnimatedLogo size="sm" showText={false} showAIBadge={false} isCollapsed />
            </motion.div>
          )}
        </AnimatePresence>

        {!isCollapsed && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="px-3 py-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarCollapsed(false)}
            className="w-full p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex items-center justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin scrollbar-thumb-surface-300 dark:scrollbar-thumb-surface-700">
        {navSections.map((section, sectionIndex) => {
          // Skip instructor section if user doesn't have instructor role
          const instructorRoles = ['instructor', 'admin', 'director', 'super_admin'];
          if (section.requiresInstructor && (!user || !instructorRoles.includes(user.role))) {
            return null;
          }

          return (
            <div key={sectionIndex}>
              {section.title && !isCollapsed && (
                <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                  {section.title}
                </h3>
              )}
              {section.title && isCollapsed && (
                <div className="h-px bg-surface-200 dark:bg-surface-800 mx-2 my-2" />
              )}

              {/* Regular items */}
              {section.items && (
                <ul className="space-y-0.5">
                  {section.items.map(renderNavItem)}
                </ul>
              )}

              {/* Collapsible sub-sections */}
              {section.subSections && (
                <div className="space-y-1">
                  {section.subSections.map((subSection) => {
                    const isExpanded = expandedSubSections[subSection.id];
                    const SubIcon = subSection.icon;
                    const subColors = colorMap[subSection.color] || colorMap.slate;

                    // Check if any item in this sub-section is active
                    const hasActiveItem = subSection.items.some(
                      item => location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    );

                    return (
                      <div key={subSection.id}>
                        {/* Sub-section header */}
                        {!isCollapsed ? (
                          <button
                            onClick={() => toggleSubSection(subSection.id)}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                              'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800',
                              hasActiveItem && 'text-surface-900 dark:text-surface-200 font-medium'
                            )}
                          >
                            <SubIcon
                              className="w-4 h-4"
                              style={{ color: colorMap[subSection.color]?.icon?.replace('text-', '') }}
                            />
                            <span className="flex-1 text-left text-xs font-medium">
                              {subSection.title}
                            </span>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
                            </motion.div>
                          </button>
                        ) : (
                          <div className="h-px bg-surface-200 dark:bg-surface-800 mx-2 my-1" />
                        )}

                        {/* Sub-section items */}
                        <AnimatePresence initial={false}>
                          {(isExpanded || isCollapsed) && (
                            <motion.ul
                              initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className={cn(
                                'space-y-0.5 overflow-hidden',
                                !isCollapsed && 'ml-2 pl-2 border-l border-surface-200 dark:border-surface-700'
                              )}
                            >
                              {subSection.items.map(renderNavItem)}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-3 border-t border-surface-200/60 dark:border-surface-800">
        <ul className="space-y-0.5">
          {bottomNavItems.map(renderNavItem)}
        </ul>
      </div>

      {/* User Profile */}
      {user && (
        <div className="px-3 py-3 border-t border-surface-200/60 dark:border-surface-800">
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <NavLink to="/profile" className="flex-shrink-0 group">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar
                  src={user.avatar}
                  name={user.displayName}
                  size={isCollapsed ? 'md' : 'sm'}
                  className="ring-2 ring-transparent group-hover:ring-primary-200 dark:group-hover:ring-primary-800 transition-all"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-surface-900" />
              </motion.div>
            </NavLink>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-surface-900 dark:text-surface-100 truncate">
                    {user.displayName}
                  </p>
                  <p className="text-[11px] text-surface-500 dark:text-surface-500 truncate">
                    {user.title || user.role?.replace('_', ' ')}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: -10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={logout}
                  aria-label="Sign out"
                  className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

// Separate component for nav item content to handle hover state
function NavItemContent({
  item,
  isActive,
  isCollapsed,
  badgeCount,
  colors
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  badgeCount: number;
  colors: typeof colorMap[string];
}) {
  const Icon = item.icon;

  // Beautiful inline styles for each icon color - ALWAYS colorful!
  const iconColorStyles: Record<string, { color: string; glow: string; bgGlow: string }> = {
    primary: { color: '#006B3F', glow: '0 0 8px rgba(0,107,63,0.6)', bgGlow: 'rgba(0,107,63,0.15)' },
    slate: { color: '#64748b', glow: '0 0 6px rgba(100,116,139,0.5)', bgGlow: 'rgba(100,116,139,0.12)' },
    blue: { color: '#3b82f6', glow: '0 0 10px rgba(59,130,246,0.6)', bgGlow: 'rgba(59,130,246,0.15)' },
    emerald: { color: '#10b981', glow: '0 0 10px rgba(16,185,129,0.6)', bgGlow: 'rgba(16,185,129,0.15)' },
    cyan: { color: '#06b6d4', glow: '0 0 10px rgba(6,182,212,0.6)', bgGlow: 'rgba(6,182,212,0.15)' },
    violet: { color: '#8b5cf6', glow: '0 0 10px rgba(139,92,246,0.6)', bgGlow: 'rgba(139,92,246,0.15)' },
    indigo: { color: '#6366f1', glow: '0 0 10px rgba(99,102,241,0.6)', bgGlow: 'rgba(99,102,241,0.15)' },
    sky: { color: '#0ea5e9', glow: '0 0 10px rgba(14,165,233,0.6)', bgGlow: 'rgba(14,165,233,0.15)' },
    green: { color: '#22c55e', glow: '0 0 10px rgba(34,197,94,0.6)', bgGlow: 'rgba(34,197,94,0.15)' },
    amber: { color: '#f59e0b', glow: '0 0 10px rgba(245,158,11,0.6)', bgGlow: 'rgba(245,158,11,0.15)' },
    yellow: { color: '#eab308', glow: '0 0 10px rgba(234,179,8,0.6)', bgGlow: 'rgba(234,179,8,0.15)' },
    purple: { color: '#a855f7', glow: '0 0 10px rgba(168,85,247,0.6)', bgGlow: 'rgba(168,85,247,0.15)' },
    orange: { color: '#f97316', glow: '0 0 10px rgba(249,115,22,0.6)', bgGlow: 'rgba(249,115,22,0.15)' },
    rose: { color: '#f43f5e', glow: '0 0 10px rgba(244,63,94,0.6)', bgGlow: 'rgba(244,63,94,0.15)' },
    pink: { color: '#ec4899', glow: '0 0 10px rgba(236,72,153,0.6)', bgGlow: 'rgba(236,72,153,0.15)' },
    teal: { color: '#14b8a6', glow: '0 0 10px rgba(20,184,166,0.6)', bgGlow: 'rgba(20,184,166,0.15)' },
  };

  const colorStyle = iconColorStyles[item.color || 'slate'] || iconColorStyles.slate;

  return (
    <>
      <span className="relative flex-shrink-0">
        <motion.div
          whileHover={{ scale: 1.25, rotate: [0, -12, 12, -6, 6, 0] }}
          transition={{
            scale: { type: 'spring', stiffness: 500, damping: 15 },
            rotate: { duration: 0.5, ease: 'easeInOut' }
          }}
          className="relative"
        >
          {/* Glowing background circle - always visible, brighter on active/hover */}
          <motion.div
            className="absolute -inset-1 rounded-lg"
            style={{
              background: colorStyle.bgGlow,
              opacity: isActive ? 1 : 0.6,
            }}
            whileHover={{ opacity: 1, scale: 1.1 }}
            transition={{ duration: 0.2 }}
          />

          {/* The icon - ALWAYS colorful with glow */}
          <Icon
            className="w-[18px] h-[18px] relative z-10 transition-all duration-200"
            style={{
              color: colorStyle.color,
              filter: isActive
                ? `drop-shadow(${colorStyle.glow})`
                : `drop-shadow(0 0 4px ${colorStyle.bgGlow})`,
            }}
          />
        </motion.div>

        {/* Notification dot for collapsed state */}
        {isCollapsed && badgeCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full ring-2 ring-white dark:ring-surface-900 shadow-lg shadow-red-500/50"
          />
        )}

        {/* Pulsing indicator for collapsed AI items */}
        {isCollapsed && item.tag?.label === 'AI' && (
          <motion.span
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 1, 0.6],
              boxShadow: [
                '0 0 4px rgba(168,85,247,0.4)',
                '0 0 12px rgba(168,85,247,0.8)',
                '0 0 4px rgba(168,85,247,0.4)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
          />
        )}

        {/* Live indicator for chat */}
        {isCollapsed && item.tag?.label === 'LIVE' && (
          <motion.span
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50"
          />
        )}
      </span>

      {!isCollapsed && (
        <>
          <span className={cn(
            'flex-1 text-[13px] transition-colors duration-200',
            isActive && 'font-medium'
          )}>
            {item.label}
          </span>

          {/* Tag */}
          {item.tag && <NavTag {...item.tag} />}

          {/* Badge Count */}
          {badgeCount > 0 && <BadgeCount count={badgeCount} />}
        </>
      )}
    </>
  );
}
