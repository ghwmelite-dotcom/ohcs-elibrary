import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineArticles';

export function OfflineIndicator() {
  const isOnline = useOfflineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Some features may be limited.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OfflineStatusBadge() {
  const isOnline = useOfflineStatus();

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
      isOnline
        ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
