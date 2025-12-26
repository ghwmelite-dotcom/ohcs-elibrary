import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUIStore } from '@/stores/uiStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '@/components/shared/Dropdown';
import { SearchInput } from '@/components/shared/Input';

export function Header() {
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { sidebar, toggleSidebar, toggleSearch, isSearchOpen, searchQuery, setSearchQuery } = useUIStore();
  const { unreadCount, notifications } = useNotificationsStore();
  const { stats } = useGamificationStore();

  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      toggleSearch();
      setSearchQuery('');
    }
  };

  const isAdmin = hasRole(['admin', 'director', 'super_admin']);
  const recentNotifications = notifications.slice(0, 5);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white/95 dark:bg-surface-800/95 backdrop-blur-sm border-b border-surface-200 dark:border-surface-700 z-30 transition-all duration-300',
        sidebar.isCollapsed ? 'left-20' : 'left-64'
      )}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="hidden md:block w-80">
            <SearchInput
              placeholder="Search documents, topics, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              onClear={() => setSearchQuery('')}
              size="sm"
            />
          </div>

          {/* Mobile search button */}
          <button
            onClick={toggleSearch}
            className="md:hidden p-2 text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* XP Display */}
          {stats && (
            <Link
              to="/leaderboard"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-secondary-50 dark:bg-secondary-900/20 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-900/30 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {stats.totalXP.toLocaleString()} XP
              </span>
              <Badge variant="secondary" size="sm">
                Lvl {stats.level.level}
              </Badge>
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <Dropdown
            trigger={
              <button className="relative p-2 text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full" />
                )}
              </button>
            }
            align="right"
            className="w-80"
          >
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="error" size="sm">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={notification.actionUrl || '/notifications'}
                    className={cn(
                      'flex gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors',
                      !notification.isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-surface-500 truncate">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 mt-2 bg-primary-500 rounded-full flex-shrink-0" />
                    )}
                  </Link>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-surface-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700">
              <Link
                to="/notifications"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                View all notifications
              </Link>
            </div>
          </Dropdown>

          {/* User Menu */}
          {user && (
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                  <Avatar
                    src={user.avatar}
                    name={user.displayName}
                    size="sm"
                    showStatus
                    status="online"
                  />
                  <ChevronDown className="w-4 h-4 text-surface-400 hidden lg:block" />
                </button>
              }
              align="right"
            >
              <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                <p className="font-medium text-surface-900 dark:text-surface-50">
                  {user.displayName}
                </p>
                <p className="text-sm text-surface-500">{user.email}</p>
              </div>
              <DropdownItem
                icon={<User className="w-4 h-4" />}
                onClick={() => navigate('/profile')}
              >
                View Profile
              </DropdownItem>
              <DropdownItem
                icon={<Settings className="w-4 h-4" />}
                onClick={() => navigate('/settings')}
              >
                Settings
              </DropdownItem>
              {isAdmin && (
                <>
                  <DropdownDivider />
                  <DropdownItem
                    icon={<Shield className="w-4 h-4" />}
                    onClick={() => navigate('/admin')}
                  >
                    Admin Panel
                  </DropdownItem>
                </>
              )}
              <DropdownDivider />
              <DropdownItem
                icon={<LogOut className="w-4 h-4" />}
                onClick={logout}
                danger
              >
                Sign Out
              </DropdownItem>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-0 top-full bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 p-4 md:hidden"
          >
            <div className="flex items-center gap-2">
              <SearchInput
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                onClear={() => setSearchQuery('')}
                className="flex-1"
                autoFocus
              />
              <button
                onClick={toggleSearch}
                className="p-2 text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
