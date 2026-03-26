import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  MessageCircle,
  Clock,
  Users,
  Trash2,
  ChevronRight,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface PrivacyConsentProps {
  isOpen: boolean;
  onAccept: () => void;
}

const CONSENT_KEY = 'wellness_consent_given';

export function hasWellnessConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setWellnessConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, 'true');
  } catch {
    // localStorage unavailable
  }
}

export function PrivacyConsent({ isOpen, onAccept }: PrivacyConsentProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setWellnessConsent();
    setAccepted(true);
    setTimeout(() => onAccept(), 300);
  };

  const dataItems = [
    {
      icon: MessageCircle,
      title: 'Messages & Conversations',
      description: 'Your chat messages with Dr. Sena to provide contextual support.',
      color: 'teal',
    },
    {
      icon: Clock,
      title: 'Mood Entries',
      description: 'Mood logs you submit to track your wellbeing over time.',
      color: 'purple',
    },
    {
      icon: Users,
      title: 'Escalation Requests',
      description: 'Reasons shared when requesting a CSEAP human counselor.',
      color: 'amber',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-surface-800 w-full sm:max-w-lg sm:mx-4 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Mobile drag indicator */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
            </div>

            {/* Header */}
            <div className="relative bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 px-5 sm:px-6 py-6 sm:py-8 shrink-0">
              {/* Subtle kente pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <pattern id="privacy-pattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="8" height="8" fill="white" />
                    <rect x="8" y="8" width="8" height="8" fill="white" />
                  </pattern>
                  <rect width="100" height="100" fill="url(#privacy-pattern)" />
                </svg>
              </div>

              <div className="relative text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm mb-3 ring-4 ring-white/30"
                >
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  Your Privacy Matters
                </h2>
                <p className="text-teal-100 text-xs sm:text-sm font-medium">
                  OHCS Wellness Center &mdash; Data Privacy Notice
                </p>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-5 sm:px-6 py-5 space-y-5">
                {/* Intro */}
                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                  Before your first wellness session, we want you to know exactly how your data is handled.
                  Your trust and safety are our top priority.
                </p>

                {/* What data is collected */}
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-[10px] font-bold text-teal-700 dark:text-teal-300">1</span>
                    What data is collected
                  </h3>
                  <div className="space-y-2.5">
                    {dataItems.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-700/50"
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          item.color === 'teal' ? 'bg-teal-100 dark:bg-teal-900/50' :
                          item.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/50' :
                          'bg-amber-100 dark:bg-amber-900/50'
                        }`}>
                          <item.icon className={`w-4 h-4 ${
                            item.color === 'teal' ? 'text-teal-600 dark:text-teal-400' :
                            item.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            'text-amber-600 dark:text-amber-400'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{item.title}</p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Retention periods */}
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-[10px] font-bold text-teal-700 dark:text-teal-300">2</span>
                    How long is data stored
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200/50 dark:border-teal-800/50 text-center">
                      <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">90</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">days for signed-in sessions</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/50 text-center">
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">30</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">days for anonymous sessions</p>
                    </div>
                  </div>
                </div>

                {/* Who can access */}
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-[10px] font-bold text-teal-700 dark:text-teal-300">3</span>
                    Who can access your data
                  </h3>
                  <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-700/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <p className="text-sm text-surface-700 dark:text-surface-300">
                        <span className="font-medium">Only you</span> can see your sessions and mood data
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <p className="text-sm text-surface-700 dark:text-surface-300">
                        <span className="font-medium">CSEAP counselors</span> only if you request escalation
                      </p>
                    </div>
                  </div>
                </div>

                {/* Your rights */}
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-[10px] font-bold text-teal-700 dark:text-teal-300">4</span>
                    Your rights
                  </h3>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50">
                    <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-surface-700 dark:text-surface-300">
                      You can <span className="font-semibold text-red-600 dark:text-red-400">delete all your wellness data</span> at any time from the Wellness Center settings.
                    </p>
                  </div>
                </div>

                {/* Ghana colors accent bar */}
                <div className="flex gap-1">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex-1 h-1 rounded-full bg-red-500 origin-left"
                  />
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex-1 h-1 rounded-full bg-yellow-500 origin-left"
                  />
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex-1 h-1 rounded-full bg-green-600 origin-left"
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="shrink-0 px-5 sm:px-6 py-4 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-700/50">
              <Button
                onClick={handleAccept}
                disabled={accepted}
                className="w-full py-3 sm:py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:from-teal-700 active:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 text-sm sm:text-base touch-manipulation"
              >
                {accepted ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Accepted
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    I Understand &amp; Agree
                  </span>
                )}
              </Button>
              <button
                onClick={() => window.open('/privacy-policy', '_blank')}
                className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs text-surface-500 dark:text-surface-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors py-1.5 touch-manipulation"
              >
                <ExternalLink className="w-3 h-3" />
                Learn More about our Privacy Policy
              </button>
              <div className="h-safe-area-inset-bottom" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
