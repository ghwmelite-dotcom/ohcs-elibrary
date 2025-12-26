import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function OfflineBanner() {
  const { isOnline } = usePWA();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950"
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center gap-3">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">
                You're offline. Some features may be unavailable.
              </span>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 rounded text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineBanner;
