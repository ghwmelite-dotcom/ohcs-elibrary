import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, X, BookOpen, GraduationCap } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { TOURS } from '@/types/onboarding';
import { useAuthStore } from '@/stores/authStore';

export function WelcomeTourTrigger() {
  const { isFirstTimeUser, shouldShowTour, startTour, setFirstTimeUser, isActive } = useOnboardingStore();
  const { user } = useAuthStore();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show prompt for first-time users after a short delay
  useEffect(() => {
    if (!user || dismissed || isActive) return;

    // Check if user should see the welcome tour
    const shouldShow = isFirstTimeUser && shouldShowTour(TOURS.WELCOME);

    if (shouldShow) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [user, isFirstTimeUser, shouldShowTour, dismissed, isActive]);

  const handleStartTour = () => {
    setShowPrompt(false);
    startTour(TOURS.WELCOME);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    setFirstTimeUser(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[420px] max-w-[calc(100vw-32px)]"
        >
          <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            {/* Ghana flag stripe at top */}
            <div className="h-1 bg-gradient-to-r from-ghana-red via-ghana-gold to-ghana-green" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="p-6 pt-5">
              {/* Icon */}
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{
                    rotate: [0, -5, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                  className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-center text-surface-900 dark:text-surface-50 mb-2">
                Welcome to OHCS E-Library!
              </h2>

              {/* Subtitle */}
              <p className="text-center text-surface-500 dark:text-surface-400 mb-6">
                Let's take a quick tour to help you get started with Ghana's premier civil service knowledge platform.
              </p>

              {/* Features preview */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                  <BookOpen className="w-4 h-4 text-primary-500" />
                  <span className="text-xs text-surface-600 dark:text-surface-300">Document Library</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                  <GraduationCap className="w-4 h-4 text-secondary-500" />
                  <span className="text-xs text-surface-600 dark:text-surface-300">Training Courses</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleStartTour}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl shadow-lg shadow-primary-500/25 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Start Tour
                </button>
              </div>

              {/* Time estimate */}
              <p className="text-center text-[11px] text-surface-400 mt-4">
                Takes about 1 minute
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
