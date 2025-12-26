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
  Bell,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: '/library', label: 'Library', icon: <Library className="w-5 h-5" /> },
  { path: '/forum', label: 'Forum', icon: <MessageSquare className="w-5 h-5" /> },
  { path: '/chat', label: 'Chat', icon: <MessagesSquare className="w-5 h-5" /> },
  { path: '/groups', label: 'Groups', icon: <Users className="w-5 h-5" /> },
  { path: '/news', label: 'News', icon: <Newspaper className="w-5 h-5" /> },
  { path: '/leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
];

const bottomNavItems: NavItem[] = [
  { path: '/notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  { path: '/help', label: 'Help', icon: <HelpCircle className="w-5 h-5" /> },
];

export function Sidebar() {
  const { sidebar, setSidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationsStore();
  const location = useLocation();

  const isCollapsed = sidebar.isCollapsed;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 z-40 transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo and Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-surface-200 dark:border-surface-700">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-ghana-gradient flex items-center justify-center">
                <Star className="w-5 h-5 text-secondary-500" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-primary-600 dark:text-primary-400 text-sm">
                  OHCS E-Library
                </h1>
                <p className="text-[10px] text-surface-500">Ghana Civil Service</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <div className="w-10 h-10 rounded-lg bg-ghana-gradient flex items-center justify-center mx-auto">
            <Star className="w-6 h-6 text-secondary-500" />
          </div>
        )}

        <button
          onClick={() => setSidebarCollapsed(!isCollapsed)}
          className={cn(
            'p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors',
            isCollapsed && 'mx-auto mt-2'
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Ghana flag stripe */}
      <div className="ghana-flag-stripe" />

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {mainNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-50',
                    isCollapsed && 'justify-center px-2'
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!isCollapsed && item.badge && item.badge > 0 && (
                  <Badge variant="error" size="sm">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-surface-200 dark:border-surface-700">
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
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-50',
                      isCollapsed && 'justify-center px-2'
                    )
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 relative">
                    {item.icon}
                    {isCollapsed && badgeCount && badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-error-500 rounded-full" />
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
        <div className="px-3 py-4 border-t border-surface-200 dark:border-surface-700">
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
                <p className="font-medium text-sm text-surface-900 dark:text-surface-50 truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-surface-500 truncate">
                  {user.title || user.role}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={logout}
                className="p-2 text-surface-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                title="Sign out"
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
