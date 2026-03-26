import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Mail,
  Megaphone,
  Check,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/utils/cn';

// Toggle switch component (reuses the pattern from NotificationSettings)
function Toggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={cn(
          'w-9 h-5 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
          'after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-surface-300 after:rounded-full after:h-4 after:w-4 after:transition-all',
          'peer-checked:after:translate-x-4 peer-checked:after:border-white',
          checked
            ? 'bg-primary-600'
            : 'bg-surface-200 dark:bg-surface-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </label>
  );
}

type DigestFrequency = 'instant' | 'daily' | 'weekly' | 'never';

interface NewsletterSubscriptionProps {
  /** When true, renders in a compact sidebar-friendly card. Default: true. */
  compact?: boolean;
  className?: string;
}

export function NewsletterSubscription({
  compact = true,
  className,
}: NewsletterSubscriptionProps) {
  const {
    preferences,
    isPreferencesLoading,
    fetchPreferences,
    updatePreferences,
  } = useNotificationStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDigestOptions, setShowDigestOptions] = useState(false);

  // Local state shadows preferences for optimistic UI
  const [emailDigest, setEmailDigest] = useState(
    preferences?.emailDigestEnabled ?? true
  );
  const [digestFreq, setDigestFreq] = useState<DigestFrequency>(
    preferences?.emailDigestFrequency ?? 'daily'
  );
  const [pushEnabled, setPushEnabled] = useState(
    preferences?.pushEnabled ?? true
  );
  const [announcements, setAnnouncements] = useState(
    preferences?.categoryPreferences?.system?.email ?? true
  );

  // Sync from store when preferences load
  useEffect(() => {
    if (preferences) {
      setEmailDigest(preferences.emailDigestEnabled);
      setDigestFreq(preferences.emailDigestFrequency);
      setPushEnabled(preferences.pushEnabled);
      setAnnouncements(preferences.categoryPreferences?.system?.email ?? true);
    }
  }, [preferences]);

  useEffect(() => {
    if (!preferences) {
      fetchPreferences();
    }
  }, [preferences, fetchPreferences]);

  const persistUpdate = async (
    patch: Partial<{
      emailDigestEnabled: boolean;
      emailDigestFrequency: DigestFrequency;
      pushEnabled: boolean;
      announcementsEmail: boolean;
    }>
  ) => {
    if (!preferences) return;

    setSaving(true);
    setSaved(false);

    try {
      const newCategoryPrefs = {
        ...preferences.categoryPreferences,
        system: {
          ...preferences.categoryPreferences?.system,
          email: patch.announcementsEmail ?? announcements,
        },
      };

      await updatePreferences({
        emailDigestEnabled: patch.emailDigestEnabled ?? emailDigest,
        emailDigestFrequency: patch.emailDigestFrequency ?? digestFreq,
        pushEnabled: patch.pushEnabled ?? pushEnabled,
        categoryPreferences: newCategoryPrefs,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // preferences store reverts on error
    } finally {
      setSaving(false);
    }
  };

  const handleEmailDigestToggle = (value: boolean) => {
    setEmailDigest(value);
    persistUpdate({ emailDigestEnabled: value });
  };

  const handleFreqChange = (freq: DigestFrequency) => {
    setDigestFreq(freq);
    setShowDigestOptions(false);
    persistUpdate({ emailDigestFrequency: freq });
  };

  const handlePushToggle = (value: boolean) => {
    setPushEnabled(value);
    persistUpdate({ pushEnabled: value });
  };

  const handleAnnouncementsToggle = (value: boolean) => {
    setAnnouncements(value);
    persistUpdate({ announcementsEmail: value });
  };

  const freqLabels: Record<DigestFrequency, string> = {
    instant: 'Instant',
    daily: 'Daily digest',
    weekly: 'Weekly digest',
    never: 'Off',
  };

  if (isPreferencesLoading && !preferences) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-4',
          className
        )}
      >
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-xl bg-surface-200 dark:bg-surface-600" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-surface-200 dark:bg-surface-600 rounded" />
            <div className="h-3 w-24 bg-surface-200 dark:bg-surface-600 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400 w-[18px] h-[18px]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50 leading-tight">
              Notifications &amp; Digest
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              Manage your subscription
            </p>
          </div>
        </div>

        {/* Save indicator */}
        <AnimatePresence>
          {(saving || saved) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 text-xs"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 text-primary-500 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 text-success-500" />
              )}
              <span className={saving ? 'text-primary-500' : 'text-success-500'}>
                {saving ? 'Saving…' : 'Saved'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="h-px bg-surface-100 dark:bg-surface-700 mx-4" />

      {/* Toggle rows */}
      <div className="px-4 py-3 space-y-0">
        {/* Email Digest */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200 leading-tight">
                Email digest
              </p>
              {compact && (
                <p className="text-xs text-surface-400 truncate">
                  Summary sent to your inbox
                </p>
              )}
            </div>
          </div>
          <Toggle
            checked={emailDigest}
            onChange={handleEmailDigestToggle}
            disabled={saving}
            id="toggle-email-digest"
          />
        </div>

        {/* Digest frequency — only when email digest is on */}
        <AnimatePresence>
          {emailDigest && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pl-[1.625rem] pb-1">
                <div className="relative">
                  <button
                    onClick={() => setShowDigestOptions(!showDigestOptions)}
                    className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    {freqLabels[digestFreq]}
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform',
                        showDigestOptions && 'rotate-180'
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {showDigestOptions && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 top-6 z-10 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg overflow-hidden min-w-[140px]"
                      >
                        {(Object.entries(freqLabels) as [DigestFrequency, string][]).map(
                          ([value, label]) => (
                            <button
                              key={value}
                              onClick={() => handleFreqChange(value)}
                              className={cn(
                                'w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2',
                                digestFreq === value
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                  : 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
                              )}
                            >
                              {digestFreq === value && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                              {digestFreq !== value && <span className="w-3.5 h-3.5" />}
                              {label}
                            </button>
                          )
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Push Notifications */}
        <div className="flex items-center justify-between py-2.5 border-t border-surface-100 dark:border-surface-700/50">
          <div className="flex items-center gap-2.5 min-w-0">
            {pushEnabled ? (
              <Bell className="w-4 h-4 text-surface-400 flex-shrink-0" />
            ) : (
              <BellOff className="w-4 h-4 text-surface-400 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200 leading-tight">
                Push notifications
              </p>
              {compact && (
                <p className="text-xs text-surface-400 truncate">
                  Browser &amp; mobile alerts
                </p>
              )}
            </div>
          </div>
          <Toggle
            checked={pushEnabled}
            onChange={handlePushToggle}
            disabled={saving}
            id="toggle-push"
          />
        </div>

        {/* Announcement Alerts */}
        <div className="flex items-center justify-between py-2.5 border-t border-surface-100 dark:border-surface-700/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <Megaphone className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200 leading-tight">
                Announcement alerts
              </p>
              {compact && (
                <p className="text-xs text-surface-400 truncate">
                  Email me important news
                </p>
              )}
            </div>
          </div>
          <Toggle
            checked={announcements}
            onChange={handleAnnouncementsToggle}
            disabled={saving}
            id="toggle-announcements"
          />
        </div>
      </div>

      {/* Footer link */}
      <div className="px-4 pb-4">
        <a
          href="/notifications"
          className="block text-center text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors py-1"
        >
          Full notification settings
        </a>
      </div>
    </motion.div>
  );
}
