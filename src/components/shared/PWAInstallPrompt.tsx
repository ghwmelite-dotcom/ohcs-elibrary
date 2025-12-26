import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share, Plus } from 'lucide-react';
import { usePWA, shouldShowInstallPrompt } from '@/hooks/usePWA';
import { Button } from './Button';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, isStandalone, installApp, dismissInstallPrompt } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Don't show if already installed or in standalone mode
    if (isInstalled || isStandalone) {
      setShowPrompt(false);
      return;
    }

    // Check if we should show based on dismissal
    if (!shouldShowInstallPrompt()) {
      setShowPrompt(false);
      return;
    }

    // Show prompt after a delay for better UX
    const timer = setTimeout(() => {
      if (isInstallable || isIOS) {
        setShowPrompt(true);
      }
    }, 5000); // 5 second delay

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isIOS, isStandalone]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const success = await installApp();
      if (success) {
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  if (!showPrompt) return null;

  return (
    <>
      <AnimatePresence>
        {showPrompt && !showIOSInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
          >
            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              {/* Ghana flag stripe accent */}
              <div className="h-1 bg-gradient-to-r from-[#CE1126] via-[#FCD116] to-[#006B3F]" />

              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* App icon */}
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#006B3F] to-[#004d2e] rounded-xl flex items-center justify-center shadow-lg">
                    <svg viewBox="0 0 512 512" className="w-10 h-10">
                      <g transform="translate(256, 240)">
                        <path d="M-10 -80 L-10 100 Q-70 85 -130 95 L-130 -65 Q-70 -75 -10 -60 Z" fill="#FFFFFF"/>
                        <path d="M10 -80 L10 100 Q70 85 130 95 L130 -65 Q70 -75 10 -60 Z" fill="#F5F5F5"/>
                      </g>
                      <g transform="translate(256, 340)">
                        <polygon points="0,-40 9,-12 40,-12 15,-4 25,24 0,9 -25,24 -15,-4 -40,-12 -9,-12" fill="#000000" stroke="#FCD116" strokeWidth="3"/>
                      </g>
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                          Install E-Library
                        </h3>
                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">
                          Get quick access from your home screen
                        </p>
                      </div>
                      <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        onClick={handleInstall}
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Install App
                      </Button>
                      <button
                        onClick={handleDismiss}
                        className="px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors"
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 text-xs text-surface-500 dark:text-surface-400">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Works offline</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    <span>Fast access</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Install Instructions Modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={handleDismiss}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface-800 rounded-t-3xl max-h-[80vh] overflow-auto"
            >
              {/* Ghana flag stripe */}
              <div className="h-1 bg-gradient-to-r from-[#CE1126] via-[#FCD116] to-[#006B3F]" />

              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                    Install on iPhone/iPad
                  </h2>
                  <button
                    onClick={handleDismiss}
                    className="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors rounded-full hover:bg-surface-100 dark:hover:bg-surface-700"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        Tap the Share button
                      </p>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                        Look for the share icon at the bottom of your browser
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-lg">
                        <Share className="w-5 h-5 text-[#007AFF]" />
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Share</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        Scroll down and tap "Add to Home Screen"
                      </p>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                        You may need to scroll down in the share menu
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-lg">
                        <Plus className="w-5 h-5 text-surface-600 dark:text-surface-300" />
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Add to Home Screen</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        Tap "Add" to install
                      </p>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                        The app will appear on your home screen
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Button onClick={handleDismiss} fullWidth variant="secondary">
                    Got it
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default PWAInstallPrompt;
