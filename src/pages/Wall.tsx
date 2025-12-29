import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  ChevronRight,
  ChevronLeft,
  Flame,
  Hash,
  BookOpen,
  MessageSquare,
  Network,
  Mail,
  Star,
  Sparkles,
  Eye,
  EyeOff,
  PanelLeftOpen,
  PanelRightOpen,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useSocialStore } from '@/stores/socialStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { WallFeed } from '@/components/wall/WallFeed';
import { SuggestedUsers } from '@/components/social/SuggestedUsers';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

// Subtle animated background
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 107, 63, 0.4) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-30 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(0, 107, 63, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          transform: 'translate(-30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 dark:opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(252, 209, 22, 0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
          transform: 'translate(30%, 30%)',
        }}
      />
    </div>
  );
}

// Collapsible Section with clean design
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  accentColor: string;
  count?: number;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = true,
  accentColor,
  count,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200/60 dark:border-surface-700/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Accent bar */}
      <div className={cn('h-0.5', accentColor)} />

      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-50/50 dark:hover:bg-surface-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-surface-500 dark:text-surface-400">
            {icon}
          </span>
          <span className="font-semibold text-surface-800 dark:text-surface-200 text-sm">
            {title}
          </span>
          {count !== undefined && (
            <span className="text-xs text-surface-400 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded ? (
            <EyeOff className="w-4 h-4 text-surface-400" />
          ) : (
            <Eye className="w-4 h-4 text-surface-400" />
          )}
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Profile Card - Clean & Modern
function ProfileCard() {
  const { user } = useAuthStore();
  const { following, followers, connections } = useSocialStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200/60 dark:border-surface-700/60 overflow-hidden shadow-sm"
    >
      {/* Cover */}
      <div className="h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-emerald-600 relative">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 -mt-10 relative">
        <Link to="/profile" className="block w-fit">
          <Avatar
            src={user?.avatar}
            name={user?.displayName || 'User'}
            size="xl"
            className="ring-4 ring-white dark:ring-surface-800 shadow-lg"
          />
        </Link>

        <div className="mt-3">
          <Link
            to="/profile"
            className="font-bold text-lg text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-1"
          >
            {user?.displayName || 'User'}
          </Link>
          <p className="text-sm text-surface-500 line-clamp-1 mt-0.5">
            {user?.title || user?.role || 'Civil Servant'}
          </p>
          {user?.mda && (
            <p className="text-xs text-surface-400 line-clamp-1 mt-1">
              {user.mda}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
          <Link to="/network?tab=following" className="group text-center flex-1">
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {following.length}
            </p>
            <p className="text-xs text-surface-500">Following</p>
          </Link>
          <div className="w-px h-8 bg-surface-200 dark:bg-surface-700" />
          <Link to="/network?tab=followers" className="group text-center flex-1">
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {followers.length}
            </p>
            <p className="text-xs text-surface-500">Followers</p>
          </Link>
          <div className="w-px h-8 bg-surface-200 dark:bg-surface-700" />
          <Link to="/network?tab=connections" className="group text-center flex-1">
            <p className="text-xl font-bold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {connections.length}
            </p>
            <p className="text-xs text-surface-500">Connections</p>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Quick Links - Simple Grid
function QuickLinks() {
  const links = [
    { to: '/library', icon: BookOpen, label: 'Library', color: 'text-amber-500' },
    { to: '/forum', icon: MessageSquare, label: 'Forum', color: 'text-blue-500' },
    { to: '/dm', icon: Mail, label: 'Messages', color: 'text-violet-500' },
    { to: '/network', icon: Network, label: 'Network', color: 'text-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.to}
            to={link.to}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors group"
          >
            <Icon className={cn('w-5 h-5', link.color, 'group-hover:scale-110 transition-transform')} />
            <span className="text-xs font-medium text-surface-600 dark:text-surface-400 text-center">
              {link.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// Trending Topics
function TrendingTopics() {
  const topics = [
    { tag: 'CivilServiceReform', posts: 124, hot: true },
    { tag: 'DigitalGhana', posts: 98, hot: true },
    { tag: 'PublicPolicy', posts: 76, hot: false },
    { tag: 'GoodGovernance', posts: 54, hot: false },
  ];

  return (
    <div className="space-y-1">
      {topics.map((topic, index) => (
        <Link
          key={topic.tag}
          to={`/search?q=${topic.tag}`}
          className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors group"
        >
          <span className={cn(
            'w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold flex-shrink-0',
            index < 2
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
              : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
          )}>
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
              <span className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {topic.tag}
              </span>
              {topic.hot && <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
            </div>
            <p className="text-xs text-surface-400 mt-0.5">{topic.posts} posts</p>
          </div>
          <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      ))}
    </div>
  );
}

// Suggested Users Wrapper
function SuggestedUsersWrapper() {
  return (
    <SuggestedUsers
      limit={3}
      compact
      showHeader={false}
      showRefresh={false}
    />
  );
}

export default function Wall() {
  const { user } = useAuthStore();
  const { fetchFollowing, fetchFollowers, fetchConnections, fetchPendingRequests, following, followers, connections } = useSocialStore();
  const { startHeartbeatPolling, stopHeartbeatPolling } = usePresenceStore();

  // Collapsible sidebars with localStorage persistence
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(() => {
    const saved = localStorage.getItem('wall-left-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [isRightCollapsed, setIsRightCollapsed] = useState(() => {
    const saved = localStorage.getItem('wall-right-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist collapse states
  useEffect(() => {
    localStorage.setItem('wall-left-sidebar-collapsed', JSON.stringify(isLeftCollapsed));
  }, [isLeftCollapsed]);

  useEffect(() => {
    localStorage.setItem('wall-right-sidebar-collapsed', JSON.stringify(isRightCollapsed));
  }, [isRightCollapsed]);

  // Toggle functions
  const toggleLeftSidebar = useCallback(() => {
    setIsLeftCollapsed((prev: boolean) => !prev);
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setIsRightCollapsed((prev: boolean) => !prev);
  }, []);

  // Keyboard shortcuts: Ctrl+[ for left, Ctrl+] for right
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        toggleLeftSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        toggleRightSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftSidebar, toggleRightSidebar]);

  useEffect(() => {
    fetchFollowing();
    fetchFollowers();
    fetchConnections();
    fetchPendingRequests();
  }, [fetchFollowing, fetchFollowers, fetchConnections, fetchPendingRequests]);

  useEffect(() => {
    startHeartbeatPolling(30000);
    return () => stopHeartbeatPolling();
  }, [startHeartbeatPolling, stopHeartbeatPolling]);

  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-surface-50/50 dark:bg-surface-900">
      <AnimatedBackground />

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                Welcome back, {firstName}
                <motion.span
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-sm text-surface-500 mt-0.5">
                See what's happening in your network
              </p>
            </div>

            {/* Sidebar toggles for desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <motion.button
                onClick={toggleLeftSidebar}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  !isLeftCollapsed
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isLeftCollapsed ? 'Show profile (Ctrl+[)' : 'Hide profile (Ctrl+[)'}
              >
                <PanelLeftOpen className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={toggleRightSidebar}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  !isRightCollapsed
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isRightCollapsed ? 'Show discover (Ctrl+])' : 'Hide discover (Ctrl+])'}
              >
                <PanelRightOpen className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Main Grid */}
        <div className="flex gap-6">
          {/* Left Sidebar Collapsed Indicator */}
          <AnimatePresence>
            {isLeftCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 56 }}
                exit={{ opacity: 0, width: 0 }}
                className="hidden lg:flex flex-col items-center py-4 px-2 bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 sticky top-20 self-start"
              >
                <motion.button
                  onClick={toggleLeftSidebar}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400 mb-4"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Show profile (Ctrl+[)"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </motion.button>

                {/* Mini profile indicators */}
                <div className="flex-1 flex flex-col gap-3 items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex flex-col items-center gap-1"
                    title="Your Profile"
                  >
                    <Link to="/profile" className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center hover:scale-105 transition-transform">
                      <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center gap-1"
                    title={`${following.length} Following`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-surface-600 dark:text-surface-400">
                      {following.length}
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col items-center gap-1"
                    title={`${connections.length} Connections`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                      <Network className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-xs font-bold text-surface-600 dark:text-surface-400">
                      {connections.length}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left Sidebar - Full */}
          <motion.aside
            className="hidden lg:block relative flex-shrink-0"
            initial={false}
            animate={{
              width: isLeftCollapsed ? 0 : 280,
              opacity: isLeftCollapsed ? 0 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Collapse Toggle Button */}
            <motion.button
              onClick={toggleLeftSidebar}
              className={cn(
                'absolute top-4 z-10 flex items-center justify-center',
                'w-6 h-12 rounded-r-lg shadow-lg transition-all duration-200',
                'bg-white dark:bg-surface-700 border border-l-0 border-surface-200 dark:border-surface-600',
                'hover:bg-surface-50 dark:hover:bg-surface-600 hover:w-7',
                'text-surface-500 hover:text-primary-600 dark:hover:text-primary-400',
                '-right-3'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isLeftCollapsed ? 'Show profile (Ctrl+[)' : 'Hide profile (Ctrl+[)'}
            >
              <motion.div
                animate={{ rotate: isLeftCollapsed ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.div>
            </motion.button>

            <motion.div
              className="w-[280px] space-y-4 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin"
              initial={false}
              animate={{
                opacity: isLeftCollapsed ? 0 : 1,
                x: isLeftCollapsed ? -20 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              <ProfileCard />

              <CollapsibleSection
                title="Quick Access"
                icon={<Sparkles className="w-4 h-4" />}
                accentColor="bg-gradient-to-r from-emerald-400 to-teal-500"
                defaultExpanded={true}
              >
                <QuickLinks />
              </CollapsibleSection>
            </motion.div>
          </motion.aside>

          {/* Main Feed */}
          <main className="flex-1 min-w-0 order-first lg:order-none relative z-0">
            {/* Mobile Profile Summary */}
            <div className="md:hidden mb-4">
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 bg-white dark:bg-surface-800 rounded-xl border border-surface-200/60 dark:border-surface-700/60"
              >
                <Avatar
                  src={user?.avatar}
                  name={user?.displayName || 'User'}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-surface-500 truncate">
                    View your profile
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-surface-400" />
              </Link>
            </div>

            <WallFeed showComposer />
          </main>

          {/* Right Sidebar - Full */}
          <motion.aside
            className="hidden lg:block relative flex-shrink-0"
            initial={false}
            animate={{
              width: isRightCollapsed ? 0 : 280,
              opacity: isRightCollapsed ? 0 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Collapse Toggle Button */}
            <motion.button
              onClick={toggleRightSidebar}
              className={cn(
                'absolute top-4 z-10 flex items-center justify-center',
                'w-6 h-12 rounded-l-lg shadow-lg transition-all duration-200',
                'bg-white dark:bg-surface-700 border border-r-0 border-surface-200 dark:border-surface-600',
                'hover:bg-surface-50 dark:hover:bg-surface-600 hover:w-7',
                'text-surface-500 hover:text-primary-600 dark:hover:text-primary-400',
                '-left-3'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isRightCollapsed ? 'Show discover (Ctrl+])' : 'Hide discover (Ctrl+])'}
            >
              <motion.div
                animate={{ rotate: isRightCollapsed ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </motion.button>

            <motion.div
              className="w-[280px] space-y-4 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin"
              initial={false}
              animate={{
                opacity: isRightCollapsed ? 0 : 1,
                x: isRightCollapsed ? 20 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              <CollapsibleSection
                title="People You May Know"
                icon={<Users className="w-4 h-4" />}
                accentColor="bg-gradient-to-r from-violet-400 to-purple-500"
                defaultExpanded={true}
                count={5}
              >
                <SuggestedUsersWrapper />
              </CollapsibleSection>

              <CollapsibleSection
                title="Trending Now"
                icon={<TrendingUp className="w-4 h-4" />}
                accentColor="bg-gradient-to-r from-amber-400 to-orange-500"
                defaultExpanded={true}
              >
                <TrendingTopics />
              </CollapsibleSection>

              {/* Footer Links */}
              <div className="px-2 py-3 text-xs text-surface-400 space-y-2">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <Link to="/help" className="hover:text-surface-600 dark:hover:text-surface-300 transition-colors">Help</Link>
                  <Link to="/settings" className="hover:text-surface-600 dark:hover:text-surface-300 transition-colors">Settings</Link>
                  <Link to="/about" className="hover:text-surface-600 dark:hover:text-surface-300 transition-colors">About</Link>
                  <span>Privacy</span>
                  <span>Terms</span>
                </div>
                <p className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  OHCS E-Library © 2024
                </p>
              </div>
            </motion.div>
          </motion.aside>

          {/* Right Sidebar Collapsed Indicator */}
          <AnimatePresence>
            {isRightCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 56 }}
                exit={{ opacity: 0, width: 0 }}
                className="hidden lg:flex flex-col items-center py-4 px-2 bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 sticky top-20 self-start"
              >
                <motion.button
                  onClick={toggleRightSidebar}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400 mb-4"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Show discover (Ctrl+])"
                >
                  <PanelRightOpen className="w-5 h-5" />
                </motion.button>

                {/* Mini discover indicators */}
                <div className="flex-1 flex flex-col gap-3 items-center">
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex flex-col items-center gap-1"
                    title="People You May Know"
                  >
                    <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-xs font-bold text-surface-600 dark:text-surface-400">
                      5
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center gap-1"
                    title="Trending Topics"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-surface-600 dark:text-surface-400">
                      4
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col items-center gap-1"
                    title="Hot Topics"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
