import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/uiStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';
import {
  ActivityNudge,
  useWellnessNudge,
  SmartNotificationBanner,
  useSmartWellnessNotifications,
  WellnessPulse,
} from '@/components/wellness';
import {
  Sparkles,
  Trophy,
  X,
  LayoutDashboard,
  Library,
  MessageSquare,
  MessagesSquare,
  Users,
  Newspaper,
  Heart,
  Network,
  Settings,
} from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';

// Mobile navigation items
const mobileNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/library', label: 'Library', icon: Library },
  { path: '/research-hub', label: 'Research Hub', icon: Network },
  { path: '/wellness', label: 'Wellness', icon: Heart },
  { path: '/forum', label: 'Forum', icon: MessageSquare },
  { path: '/chat', label: 'Chat', icon: MessagesSquare },
  { path: '/groups', label: 'Groups', icon: Users },
  { path: '/news', label: 'News', icon: Newspaper },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function MainLayout() {
  const { sidebar, isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { fetchNotifications, startPolling, stopPolling } = useNotificationsStore();
  const { fetchStats, fetchLeaderboard } = useGamificationStore();
  const { showNudge, dismissNudge, acceptNudge } = useWellnessNudge();
  const {
    notification: smartNotification,
    dismissNotification: dismissSmartNotification,
    acceptNotification: acceptSmartNotification,
  } = useSmartWellnessNotifications();

  // Fetch initial data
  useEffect(() => {
    fetchNotifications();
    fetchStats();
    fetchLeaderboard();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchNotifications, fetchStats, fetchLeaderboard, startPolling, stopPolling]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-surface-800 z-50 lg:hidden shadow-xl"
            >
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-surface-200 dark:border-surface-700">
                <span className="font-heading font-bold text-lg text-surface-900 dark:text-surface-50">
                  OHCS E-Library
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Navigation */}
              <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
                {mobileNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          // No left padding on mobile (sidebar is hidden), add padding on lg+ screens
          'pl-0 lg:pl-20',
          // Adjust for expanded sidebar on lg+ screens
          !sidebar.isCollapsed && 'lg:pl-64'
        )}
      >
        <div className="p-4 lg:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* XP Notification */}
      <XPNotification />

      {/* Level Up Modal */}
      <LevelUpModal />

      {/* Wellness Activity Nudge */}
      <AnimatePresence>
        {showNudge && (
          <ActivityNudge onDismiss={dismissNudge} onAccept={acceptNudge} />
        )}
      </AnimatePresence>

      {/* Smart Wellness Notifications */}
      <AnimatePresence>
        {smartNotification && (
          <SmartNotificationBanner
            notification={smartNotification}
            onDismiss={dismissSmartNotification}
            onAccept={acceptSmartNotification}
          />
        )}
      </AnimatePresence>

      {/* Floating Wellness Pulse (subtle ambient reminder) */}
      <WellnessPulse onClick={() => window.location.href = '/wellness'} />
    </div>
  );
}

// XP earned notification
function XPNotification() {
  const { showXPNotification, lastXPGain, dismissXPNotification } = useGamificationStore();

  return (
    <AnimatePresence>
      {showXPNotification && lastXPGain && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-secondary-500 text-surface-900 rounded-full shadow-gold-glow flex items-center gap-3"
          onClick={dismissXPNotification}
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-bold">+{lastXPGain.amount} XP</span>
          <span className="text-sm opacity-80">{lastXPGain.reason}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Level up celebration modal
function LevelUpModal() {
  const { showLevelUpModal, dismissLevelUpModal, stats } = useGamificationStore();

  if (!stats) return null;

  return (
    <Modal
      isOpen={showLevelUpModal}
      onClose={dismissLevelUpModal}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-secondary-100 dark:bg-secondary-900/30 rounded-full mb-6"
        >
          <Trophy className="w-12 h-12 text-secondary-600 dark:text-secondary-400" />
        </motion.div>
        <h2 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50 mb-2">
          Level Up!
        </h2>
        <p className="text-lg text-surface-600 dark:text-surface-400 mb-2">
          You've reached
        </p>
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-4xl">{stats.level.icon}</span>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            Level {stats.level.level}: {stats.level.name}
          </span>
        </div>
        <p className="text-surface-500 dark:text-surface-400 mb-6">
          Keep going to unlock more rewards and climb the leaderboard!
        </p>
        <Button onClick={dismissLevelUpModal} size="lg" fullWidth>
          Continue
        </Button>
      </div>
    </Modal>
  );
}
