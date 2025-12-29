import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Library,
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
  LogOut,
  Network,
  Rss,
  Mail,
  UserPlus,
  BarChart3,
  Award,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNewsStore } from '@/stores/newsStore';
import { useDMStore } from '@/stores/dmStore';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { AnimatedLogo } from '@/components/shared/AnimatedLogo';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { path: '/feed', label: 'Feed', icon: <Rss className="w-5 h-5 text-primary-500" /> },
  { path: '/dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
  { path: '/dm', label: 'Messages', icon: <Mail className="w-5 h-5 text-blue-500" /> },
  { path: '/network', label: 'Network', icon: <UserPlus className="w-5 h-5 text-emerald-500" /> },
  { path: '/library', label: 'Library', icon: <Library className="w-5 h-5 text-amber-500" /> },
  { path: '/kwame', label: 'Ask Kwame', icon: <Sparkles className="w-5 h-5 text-gold-500" /> },
  { path: '/research-hub', label: 'Research Hub', icon: <Network className="w-5 h-5 text-violet-500" /> },
  { path: '/wellness', label: 'Wellness', icon: <Heart className="w-5 h-5 text-pink-500" /> },
  { path: '/forum', label: 'Forum', icon: <MessageSquare className="w-5 h-5" /> },
  { path: '/chat', label: 'Chat', icon: <MessagesSquare className="w-5 h-5" /> },
  { path: '/groups', label: 'Groups', icon: <Users className="w-5 h-5" /> },
  { path: '/news', label: 'News', icon: <Newspaper className="w-5 h-5" /> },
  { path: '/leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
  { path: '/recognition', label: 'Recognition', icon: <Award className="w-5 h-5 text-rose-500" /> },
];

const bottomNavItems: NavItem[] = [
  { path: '/notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  { path: '/help', label: 'Help', icon: <HelpCircle className="w-5 h-5" /> },
];

export function Sidebar() {
  const { sidebar, setSidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();
  const { summary } = useNotificationStore();
  const unreadCount = summary?.unreadTotal || 0;
  const { newArticlesCount, checkForNewArticles, markNewsAsViewed } = useNewsStore();
  const { unreadCount: dmUnreadCount, fetchUnreadCount } = useDMStore();
  const location = useLocation();

  const isCollapsed = sidebar.isCollapsed;

  // Check for new articles on mount and periodically
  useEffect(() => {
    checkForNewArticles();

    // Check every 5 minutes for new articles
    const interval = setInterval(() => {
      checkForNewArticles();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkForNewArticles]);

  // Mark news as viewed when navigating to news page
  useEffect(() => {
    if (location.pathname === '/news' || location.pathname.startsWith('/news/')) {
      markNewsAsViewed();
    }
  }, [location.pathname, markNewsAsViewed]);

  // Fetch DM unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();

    // Check every 30 seconds for new messages
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40 transition-all duration-300 flex flex-col',
        // Hidden on mobile/tablet, visible on lg+ screens
        'hidden lg:flex',
        // Light mode
        'bg-white border-r border-surface-200',
        // Dark mode - rich warm tones inspired by landing page
        'dark:bg-gradient-to-b dark:from-[#1a1510] dark:via-[#15120d] dark:to-[#1a1510] dark:border-r dark:border-amber-900/20',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo and Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-surface-200 dark:border-amber-900/20">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatedLogo size="sm" showText showAIBadge isCollapsed={false} />
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto"
            >
              <AnimatedLogo size="md" showText={false} showAIBadge={false} isCollapsed />
            </motion.div>
          )}
        </AnimatePresence>

        {!isCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:text-amber-50/40 dark:hover:text-amber-50/80 dark:hover:bg-amber-900/20 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="px-3 py-2">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="w-full p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:text-amber-50/40 dark:hover:text-amber-50/80 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Ghana flag stripe */}
      <div className="ghana-flag-stripe" />

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            // Add badge counts for news and messages
            const badgeCount = item.path === '/news'
              ? newArticlesCount
              : item.path === '/dm'
                ? dmUnreadCount
                : item.badge;
            const isWellness = item.path === '/wellness';
            const isLibrary = item.path === '/library';
            const isResearchHub = item.path === '/research-hub';
            const isKwame = item.path === '/kwame';
            const isFeed = item.path === '/feed';
            const isMessages = item.path === '/dm';
            const isNetwork = item.path === '/network';
            const isHighlighted = isWellness || isLibrary || isResearchHub || isKwame || isFeed;

            // Get theme colors for highlighted items
            const getActiveClasses = () => {
              if (isFeed) return 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium';
              if (isMessages) return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium';
              if (isNetwork) return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium';
              if (isLibrary) return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium';
              if (isKwame) return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 font-medium';
              if (isResearchHub) return 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-medium';
              if (isWellness) return 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-medium';
              return 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium';
            };

            const getHoverClasses = () => {
              if (isFeed) return 'text-surface-600 dark:text-amber-50/60 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300';
              if (isMessages) return 'text-surface-600 dark:text-amber-50/60 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300';
              if (isNetwork) return 'text-surface-600 dark:text-amber-50/60 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300';
              if (isLibrary) return 'text-surface-600 dark:text-amber-50/60 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300';
              if (isKwame) return 'text-surface-600 dark:text-amber-50/60 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:text-yellow-700 dark:hover:text-yellow-300';
              if (isResearchHub) return 'text-surface-600 dark:text-amber-50/60 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300';
              if (isWellness) return 'text-surface-600 dark:text-amber-50/60 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300';
              return 'text-surface-600 dark:text-amber-50/60 hover:bg-surface-100 dark:hover:bg-amber-900/20 hover:text-surface-900 dark:hover:text-amber-50';
            };

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive ? getActiveClasses() : getHoverClasses(),
                      isCollapsed && 'justify-center px-2'
                    )
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 relative">
                    {item.icon}
                    {/* Animated badge dot for collapsed state */}
                    {isCollapsed && badgeCount && badgeCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error-500 rounded-full"
                      >
                        <motion.span
                          className="absolute inset-0 bg-error-500 rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.span>
                    )}
                    {/* Library pulsing book indicator */}
                    {isCollapsed && isLibrary && (
                      <motion.span
                        className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    {/* Research Hub pulsing network indicator */}
                    {isCollapsed && isResearchHub && (
                      <motion.span
                        className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    )}
                    {/* Wellness pulsing heart indicator */}
                    {isCollapsed && isWellness && (
                      <motion.span
                        className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    {/* Kwame pulsing wisdom indicator */}
                    {isCollapsed && isKwame && (
                      <motion.span
                        className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                    )}
                  </span>
                  {!isCollapsed && (
                    <span className="flex-1">{item.label}</span>
                  )}
                  {/* Feed "HOME" badge */}
                  {!isCollapsed && isFeed && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-sm"
                    >
                      HOME
                    </motion.span>
                  )}
                  {/* Library "FEATURED" badge */}
                  {!isCollapsed && isLibrary && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full shadow-sm"
                    >
                      HOT
                    </motion.span>
                  )}
                  {/* Kwame "ASK AI" badge */}
                  {!isCollapsed && isKwame && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-full shadow-sm flex items-center gap-0.5"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="inline-block"
                      >
                        ✨
                      </motion.span>
                      AI
                    </motion.span>
                  )}
                  {/* Research Hub "AI" badge */}
                  {!isCollapsed && isResearchHub && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full shadow-sm flex items-center gap-0.5"
                    >
                      <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                      >
                        ✨
                      </motion.span>
                      AI
                    </motion.span>
                  )}
                  {/* Wellness "New" badge */}
                  {!isCollapsed && isWellness && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full"
                    >
                      NEW
                    </motion.span>
                  )}
                  {!isCollapsed && badgeCount && badgeCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <Badge variant="error" size="sm" className="animate-pulse">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </Badge>
                    </motion.div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-surface-200 dark:border-amber-900/20">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => {
            const badgeCount = item.path === '/notifications' ? unreadCount : undefined;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-surface-600 dark:text-amber-50/60 hover:bg-surface-100 dark:hover:bg-amber-900/20 hover:text-surface-900 dark:hover:text-amber-50',
                      isCollapsed && 'justify-center px-2'
                    )
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 relative">
                    {item.icon}
                    {isCollapsed && badgeCount && badgeCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-2 h-2 bg-error-500 rounded-full"
                      />
                    )}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {badgeCount && badgeCount > 0 && (
                        <Badge variant="error" size="sm">
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Profile */}
      {user && (
        <div className="px-3 py-4 border-t border-surface-200 dark:border-amber-900/20">
          <div
            className={cn(
              'flex items-center gap-3',
              isCollapsed && 'justify-center'
            )}
          >
            <NavLink to="/profile" className="flex-shrink-0">
              <Avatar
                src={user.avatar}
                name={user.displayName}
                size={isCollapsed ? 'md' : 'sm'}
                showStatus
                status="online"
              />
            </NavLink>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-surface-900 dark:text-amber-50 truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-surface-500 dark:text-amber-50/50 truncate">
                  {user.title || user.role}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={logout}
                aria-label="Sign out"
                className="p-2 text-surface-400 hover:text-error-500 hover:bg-error-50 dark:text-amber-50/40 dark:hover:text-error-400 dark:hover:bg-error-900/30 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
