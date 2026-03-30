import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  MessageSquare,
  MessageCircle,
  FileText,
  Users,
  Award,
  AlertCircle,
  Mail,
  Smartphone,
  Moon,
  Clock,
  Save,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { TelegramConnect } from './TelegramConnect';
import { useNotificationStore } from '@/stores/notificationStore';

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sound: boolean;
  telegram: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    messages: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    documents: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    forum: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    groups: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    achievements: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
    system: { email: boolean; push: boolean; inApp: boolean; telegram: boolean };
  };
}

interface NotificationSettingsProps {
  initialPreferences?: NotificationPreferences;
  onSave?: (preferences: NotificationPreferences) => void;
}

export function NotificationSettings({
  initialPreferences,
  onSave,
}: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    initialPreferences || {
      email: true,
      push: true,
      inApp: true,
      sound: true,
      telegram: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
      categories: {
        messages: { email: true, push: true, inApp: true, telegram: false },
        documents: { email: true, push: false, inApp: true, telegram: true },
        forum: { email: false, push: true, inApp: true, telegram: false },
        groups: { email: true, push: true, inApp: true, telegram: false },
        achievements: { email: false, push: true, inApp: true, telegram: false },
        system: { email: true, push: true, inApp: true, telegram: true },
      },
    }
  );

  const [hasChanges, setHasChanges] = useState(false);

  // Telegram integration
  const { telegramStatus, isTelegramLoading, fetchTelegramStatus, linkTelegram, unlinkTelegram } = useNotificationStore();

  useEffect(() => {
    fetchTelegramStatus();
  }, [fetchTelegramStatus]);

  const updatePreference = (path: string, value: boolean | string) => {
    setHasChanges(true);
    setPreferences((prev) => {
      const newPrefs = { ...prev };
      const keys = path.split('.');
      let current: any = newPrefs;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newPrefs;
    });
  };

  const handleSave = () => {
    onSave?.(preferences);
    setHasChanges(false);
  };

  const categories = [
    {
      id: 'messages',
      name: 'Messages',
      description: 'Direct messages and chat notifications',
      icon: MessageSquare,
    },
    {
      id: 'documents',
      name: 'Documents',
      description: 'New documents and updates',
      icon: FileText,
    },
    {
      id: 'forum',
      name: 'Forum',
      description: 'Replies, mentions, and upvotes',
      icon: MessageSquare,
    },
    {
      id: 'groups',
      name: 'Groups',
      description: 'Group invites, posts, and activity',
      icon: Users,
    },
    {
      id: 'achievements',
      name: 'Achievements',
      description: 'Badges, levels, and XP',
      icon: Award,
    },
    {
      id: 'system',
      name: 'System',
      description: 'Important announcements and alerts',
      icon: AlertCircle,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Global Settings */}
      <section className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-600" />
          Global Settings
        </h3>

        <div className="space-y-4">
          {/* Delivery Methods */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <label className="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences.email}
                onChange={(e) => updatePreference('email', e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <Mail className="w-5 h-5 text-surface-500" />
              <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                Email
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences.push}
                onChange={(e) => updatePreference('push', e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <Smartphone className="w-5 h-5 text-surface-500" />
              <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                Push
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences.inApp}
                onChange={(e) => updatePreference('inApp', e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <Bell className="w-5 h-5 text-surface-500" />
              <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                In-App
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences.telegram}
                onChange={(e) => updatePreference('telegram', e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-[#0088cc] focus:ring-[#0088cc]/50"
              />
              <MessageCircle className="w-5 h-5 text-[#0088cc]" />
              <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                Telegram
              </span>
            </label>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
            <div className="flex items-center gap-3">
              {preferences.sound ? (
                <Volume2 className="w-5 h-5 text-surface-500" />
              ) : (
                <VolumeX className="w-5 h-5 text-surface-400" />
              )}
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                  Notification Sound
                </p>
                <p className="text-xs text-surface-500">
                  Play a sound when receiving notifications
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.sound}
                onChange={(e) => updatePreference('sound', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-200 dark:bg-surface-700 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Telegram Connection */}
      <TelegramConnect
        telegramStatus={telegramStatus}
        isLoading={isTelegramLoading}
        onLink={linkTelegram}
        onUnlink={unlinkTelegram}
        onRefreshStatus={fetchTelegramStatus}
      />

      {/* Quiet Hours */}
      <section className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              Quiet Hours
            </h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.quietHours.enabled}
              onChange={(e) => updatePreference('quietHours.enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-200 dark:bg-surface-700 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
          Pause notifications during specific hours
        </p>

        {preferences.quietHours.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-surface-500" />
              <input
                type="time"
                value={preferences.quietHours.start}
                onChange={(e) => updatePreference('quietHours.start', e.target.value)}
                className="px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm"
              />
            </div>
            <span className="text-surface-500">to</span>
            <input
              type="time"
              value={preferences.quietHours.end}
              onChange={(e) => updatePreference('quietHours.end', e.target.value)}
              className="px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm"
            />
          </motion.div>
        )}
      </section>

      {/* Category Settings */}
      <section className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            Category Preferences
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Customize notifications for each category
          </p>
        </div>

        <div className="divide-y divide-surface-200 dark:divide-surface-700">
          {/* Header */}
          <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-surface-50 dark:bg-surface-700/50 text-xs font-medium text-surface-500 uppercase">
            <div>Category</div>
            <div className="text-center">Email</div>
            <div className="text-center">Push</div>
            <div className="text-center">In-App</div>
            <div className="text-center">TG</div>
          </div>

          {/* Categories */}
          {categories.map((category) => {
            const prefs = preferences.categories[category.id as keyof typeof preferences.categories];
            return (
              <div
                key={category.id}
                className="grid grid-cols-5 gap-4 px-4 py-3 items-center hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <category.icon className="w-5 h-5 text-surface-500" />
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                      {category.name}
                    </p>
                    <p className="text-xs text-surface-500 hidden sm:block">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <input
                    type="checkbox"
                    checked={prefs.email}
                    onChange={(e) =>
                      updatePreference(`categories.${category.id}.email`, e.target.checked)
                    }
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <div className="text-center">
                  <input
                    type="checkbox"
                    checked={prefs.push}
                    onChange={(e) =>
                      updatePreference(`categories.${category.id}.push`, e.target.checked)
                    }
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <div className="text-center">
                  <input
                    type="checkbox"
                    checked={prefs.inApp}
                    onChange={(e) =>
                      updatePreference(`categories.${category.id}.inApp`, e.target.checked)
                    }
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                <div className="text-center">
                  <input
                    type="checkbox"
                    checked={prefs.telegram}
                    onChange={(e) =>
                      updatePreference(`categories.${category.id}.telegram`, e.target.checked)
                    }
                    className="w-4 h-4 rounded border-surface-300 text-[#0088cc] focus:ring-[#0088cc]/50"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4"
        >
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-elevation-2"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </motion.div>
      )}
    </div>
  );
}
