import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  BellRing,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Sparkles,
  UserPlus,
  Users,
  Check,
  Clock,
  Heart,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useSocialStore } from '@/stores/socialStore';
import { useWishlistStore, useCartStore } from '@/stores/shopStore';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '@/components/shared/Dropdown';
import { AnimatedThemeToggle } from '@/components/shared/AnimatedThemeToggle';
import { ThemeToggleHint } from '@/components/shared/ThemeToggleHint';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { formatRelativeTime } from '@/utils/formatters';

export function Header() {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuthStore();
  const { sidebar, toggleMobileMenu } = useUIStore();
  const { notifications, summary, fetchNotifications, fetchSummary, markAsRead, markAllAsRead } = useNotificationStore();
  const { stats } = useGamificationStore();
  const {
    pendingRequests,
    fetchPendingRequests,
    respondToConnectionRequest,
  } = useSocialStore();
  const { items: wishlistItems } = useWishlistStore();
  const { summary: cartSummary } = useCartStore();

  const wishlistCount = wishlistItems.length;
  const cartCount = cartSummary?.itemCount || 0;

  // Fetch notifications and friend requests on mount
  useEffect(() => {
    fetchNotifications();
    fetchSummary();
    fetchPendingRequests();
  }, []);

  const unreadCount = summary?.unreadTotal || 0;
  const isAdmin = hasRole(['admin', 'director', 'super_admin']);

  return (
    <header
      data-tour="header"
      className={cn(
        'fixed top-0 right-0 h-16 backdrop-blur-sm z-30 transition-all duration-300',
        // Light mode
        'bg-white/95 border-b border-surface-200',
        // Dark mode - rich warm tones
        'dark:bg-[#1a1510]/95 dark:border-b dark:border-amber-900/20',
        // Full width on mobile, adjust for sidebar on lg+ screens
        'left-0',
        'lg:left-20',
        !sidebar.isCollapsed && 'lg:left-64'
      )}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobileMenu}
            aria-label="Open menu"
            className="lg:hidden p-2 text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Button - Opens Global Search Modal */}
          <button
            data-tour="search"
            aria-label="Search"
            onClick={() => window.dispatchEvent(new CustomEvent('ohcs:open-search'))}
            className="hidden md:flex items-center gap-3 w-80 min-w-[160px] px-3 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl text-surface-500 dark:text-surface-300 transition-colors group flex-shrink"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Search...</span>
            <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-surface-200 dark:bg-surface-700 rounded group-hover:bg-surface-300 dark:group-hover:bg-surface-600">
              {isMac ? '⌘' : 'Ctrl+'}K
            </kbd>
          </button>

          {/* Mobile search button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('ohcs:open-search'))}
            aria-label="Search"
            className="md:hidden p-2 text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-3 flex-shrink-0">
          {/* XP Display */}
          {stats && (
            <Link
              data-tour="xp-display"
              to="/leaderboard"
              aria-label={`View leaderboard - ${stats.totalXP.toLocaleString()} XP, Level ${stats.level.level}`}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-secondary-50 dark:bg-secondary-900/20 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-900/30 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {stats.totalXP.toLocaleString()} XP
              </span>
              <Badge variant="secondary" size="sm">
                Lvl {stats.level.level}
              </Badge>
              {/* XP Progress toward next level */}
              <div className="hidden xl:block w-16 h-1 bg-secondary-200 dark:bg-secondary-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, stats.xpProgress || 0)}%` }}
                />
              </div>
            </Link>
          )}

          {/* Language Selector */}
          <LanguageSelector />

          {/* Separator */}
          <div className="hidden lg:block w-px h-6 bg-surface-200 dark:bg-surface-700" />

          {/* Animated Theme Toggle with Discovery Hint */}
          <div data-tour="theme-toggle">
            <ThemeToggleHint variant="dashboard">
              <AnimatedThemeToggle size="md" />
            </ThemeToggleHint>
          </div>

          {/* Wishlist */}
          <Link
            to="/shop/wishlist"
            className="relative p-2 text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount} items)` : ''}`}
          >
            <Heart className={cn('w-5 h-5', wishlistCount > 0 && 'text-red-500')} />
            {wishlistCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
              >
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </motion.span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/shop/cart"
            className="relative p-2 text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            aria-label={`Shopping cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </motion.span>
            )}
          </Link>

          {/* Friend Requests */}
          <Dropdown
            trigger={
              <button
                aria-label={`Friend requests${pendingRequests.length > 0 ? ` (${pendingRequests.length} pending)` : ''}`}
                className="relative p-2 text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                {pendingRequests.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg"
                  >
                    {pendingRequests.length > 9 ? '9+' : pendingRequests.length}
                  </motion.span>
                )}
              </button>
            }
            align="right"
            className="w-80"
          >
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  Connection Requests
                </h3>
                {pendingRequests.length > 0 && (
                  <Badge variant="success" size="sm">
                    {pendingRequests.length} new
                  </Badge>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {pendingRequests.length > 0 ? (
                pendingRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 border-b border-surface-100 dark:border-surface-700/50 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <Link to={`/profile/${request.userId}`}>
                        <Avatar
                          src={request.user?.avatar}
                          name={request.user?.displayName || 'User'}
                          size="md"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/profile/${request.userId}`}
                          className="font-medium text-sm text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 truncate block"
                        >
                          {request.user?.displayName || 'User'}
                        </Link>
                        <p className="text-xs text-surface-500 truncate">
                          {request.user?.title || request.connectionType || 'wants to connect'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              respondToConnectionRequest(request.userId, true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              respondToConnectionRequest(request.userId, false);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Decline
                          </button>
                        </div>
                      </div>
                      <span className="text-[10px] text-surface-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(request.requestedAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-surface-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending requests</p>
                  <p className="text-xs mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700">
              <Link
                to="/network?tab=connections"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                View all connections
              </Link>
            </div>
          </Dropdown>

          {/* Notifications */}
          <Dropdown
            trigger={
              <button
                data-tour="notifications"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                className="relative p-2 -ml-1 text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                {unreadCount > 0 ? (
                  <BellRing className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-error-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}
              </button>
            }
            align="right"
            className="w-96"
          >
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <>
                      <Badge variant="error" size="sm">
                        {unreadCount} new
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllAsRead();
                        }}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <Link
                    key={notification.id}
                    to={notification.link || '/notifications'}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                    className={cn(
                      'flex gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors',
                      !notification.isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm text-surface-900 dark:text-surface-50 truncate',
                        !notification.isRead && 'font-medium'
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-surface-500 truncate">
                        {notification.actorName && <span className="font-medium">{notification.actorName} </span>}
                        {notification.message}
                      </p>
                      <p className="text-xs text-surface-400 mt-0.5">
                        {formatRelativeTime(notification.createdAt)}
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
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
              <Link
                to="/notifications"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                View all notifications
              </Link>
              <Link
                to="/notifications?tab=settings"
                className="text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </Dropdown>

          {/* User Menu */}
          {user && (
            <Dropdown
              trigger={
                <button
                  data-tour="user-menu"
                  aria-label={`User menu for ${user.displayName}`}
                  className="flex items-center gap-2 p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <Avatar
                    src={user.avatar}
                    name={user.displayName}
                    size="sm"
                    showStatus
                    status="online"
                  />
                  <ChevronDown className="w-4 h-4 text-surface-400 dark:text-surface-300 hidden lg:block" />
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

    </header>
  );
}
