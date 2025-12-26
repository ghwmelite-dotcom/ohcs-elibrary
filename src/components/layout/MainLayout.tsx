import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/uiStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export function MainLayout() {
  const { sidebar } = useUIStore();
  const { fetchNotifications, startPolling, stopPolling } = useNotificationsStore();
  const { fetchStats, fetchLeaderboard } = useGamificationStore();

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
      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebar.isCollapsed ? 'pl-20' : 'pl-64'
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
    </div>
  );
}

// XP earned notification
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

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
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { Trophy } from 'lucide-react';

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
