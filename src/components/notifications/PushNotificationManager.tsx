import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  BellRing,
  Smartphone,
  Check,
  X,
  AlertCircle,
  Loader2,
  TestTube,
  Sparkles
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface PushNotificationManagerProps {
  isEnabled: boolean;
  onSubscribe: () => Promise<boolean>;
  onUnsubscribe: () => Promise<void>;
}

export function PushNotificationManager({
  isEnabled,
  onSubscribe,
  onUnsubscribe
}: PushNotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [showTestSent, setShowTestSent] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported('PushManager' in window && 'serviceWorker' in navigator);

    // Check current permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isEnabled) {
        await onUnsubscribe();
      } else {
        const success = await onSubscribe();
        if (success) {
          setPermission('granted');
        }
      }
    } catch (error) {
      console.error('Push notification toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = () => {
    if (permission === 'granted') {
      // Show a test notification
      new Notification('OHCS E-Library', {
        body: 'Push notifications are working! You\'ll receive updates here.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification'
      });
      setShowTestSent(true);
      setTimeout(() => setShowTestSent(false), 3000);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-surface-200 dark:bg-surface-700 rounded-xl flex items-center justify-center">
            <BellOff className="w-6 h-6 text-surface-500" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white mb-1">
              Push Notifications Unavailable
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Push Notifications</h3>
            <p className="text-white/80 text-sm">Get instant updates on your device</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Card */}
        <div className={cn(
          'p-4 rounded-xl border-2 transition-colors',
          isEnabled
            ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
            : 'bg-surface-50 dark:bg-surface-700/50 border-surface-200 dark:border-surface-600'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={isEnabled ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  isEnabled
                    ? 'bg-success-500 text-white'
                    : 'bg-surface-200 dark:bg-surface-600 text-surface-500'
                )}
              >
                {isEnabled ? <BellRing className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
              </motion.div>
              <div>
                <p className={cn(
                  'font-semibold',
                  isEnabled
                    ? 'text-success-700 dark:text-success-400'
                    : 'text-surface-700 dark:text-surface-300'
                )}>
                  {isEnabled ? 'Notifications Enabled' : 'Notifications Disabled'}
                </p>
                <p className="text-sm text-surface-500">
                  {isEnabled
                    ? 'You\'ll receive push notifications'
                    : 'Enable to get instant updates'}
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={cn(
                'relative px-6 py-2.5 rounded-xl font-medium transition-all',
                isEnabled
                  ? 'bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-200 hover:bg-surface-300 dark:hover:bg-surface-500'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isEnabled ? (
                'Disable'
              ) : (
                'Enable'
              )}
            </button>
          </div>
        </div>

        {/* Permission Warning */}
        {permission === 'denied' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl"
          >
            <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-error-700 dark:text-error-400">
                Notifications Blocked
              </p>
              <p className="text-sm text-error-600 dark:text-error-500 mt-1">
                You've blocked notifications for this site. To enable them, click the lock icon in your browser's address bar and allow notifications.
              </p>
            </div>
          </motion.div>
        )}

        {/* Test Notification */}
        {isEnabled && permission === 'granted' && (
          <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <TestTube className="w-5 h-5 text-surface-500" />
              <div>
                <p className="font-medium text-surface-900 dark:text-white">Test Notification</p>
                <p className="text-sm text-surface-500">Send a test to verify it's working</p>
              </div>
            </div>
            <button
              onClick={handleTestNotification}
              className="px-4 py-2 bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-200 rounded-lg hover:bg-surface-300 dark:hover:bg-surface-500 transition-colors font-medium text-sm"
            >
              Send Test
            </button>
          </div>
        )}

        {/* Success Toast */}
        <AnimatePresence>
          {showTestSent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-2 p-3 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 rounded-lg"
            >
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Test notification sent!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features List */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
            What you'll be notified about:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '💬', label: 'New messages' },
              { icon: '📄', label: 'Document updates' },
              { icon: '👥', label: 'Group activity' },
              { icon: '🏆', label: 'Achievements' },
              { icon: '🔔', label: 'Mentions' },
              { icon: '⚡', label: 'Important alerts' }
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
