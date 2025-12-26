import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  Shield,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Key,
  Smartphone,
  History,
  Trash2,
  Download,
  Save
} from 'lucide-react';
import { ProfileEdit } from '@/components/profile';
import { NotificationSettings } from '@/components/notifications';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/utils/cn';

type SettingsSection =
  | 'profile'
  | 'notifications'
  | 'appearance'
  | 'security'
  | 'privacy'
  | 'language'
  | 'data';

export default function Settings() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User, description: 'Manage your personal information' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure notification preferences' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Customize the look and feel' },
    { id: 'security', label: 'Security', icon: Lock, description: 'Password and authentication' },
    { id: 'privacy', label: 'Privacy', icon: Shield, description: 'Control your privacy settings' },
    { id: 'language', label: 'Language & Region', icon: Globe, description: 'Language and timezone' },
    { id: 'data', label: 'Data & Storage', icon: Download, description: 'Export or delete your data' },
  ];

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <ProfileEdit
            initialData={{
              name: user?.displayName || 'User',
              email: user?.email || 'user@ohcs.gov.gh',
              avatar: user?.avatar,
              title: user?.title || 'Senior Administrative Officer',
              mda: user?.mda?.name || 'Office of the Head of Civil Service',
              gradeLevel: user?.gradeLevel || 'Principal',
              location: 'Accra, Ghana',
              bio: user?.bio || '',
            }}
            onSave={async (data) => {
              console.log('Saving profile:', data);
            }}
            onCancel={() => {}}
          />
        );

      case 'notifications':
        return (
          <NotificationSettings
            onSave={(prefs) => console.log('Saving notification preferences:', prefs)}
          />
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Theme
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {themeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id as typeof theme)}
                    className={cn(
                      'flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-colors',
                      theme === option.id
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                    )}
                  >
                    <option.icon className={cn(
                      'w-8 h-8',
                      theme === option.id
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-surface-500'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      theme === option.id
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-surface-700 dark:text-surface-300'
                    )}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Display
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Compact Mode
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Show Animations
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Password
              </h3>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                Change your password to keep your account secure.
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                <Key className="w-4 h-4" />
                Change Password
              </button>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                Add an extra layer of security to your account.
              </p>
              <button className="flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                <Smartphone className="w-4 h-4" />
                Enable 2FA
              </button>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Login History
              </h3>
              <div className="space-y-3">
                {[
                  { device: 'Chrome on Windows', location: 'Accra, Ghana', time: 'Now', current: true },
                  { device: 'Safari on iPhone', location: 'Accra, Ghana', time: '2 hours ago', current: false },
                  { device: 'Firefox on MacOS', location: 'Kumasi, Ghana', time: 'Yesterday', current: false },
                ].map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        {session.device}
                        {session.current && (
                          <span className="ml-2 px-2 py-0.5 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-surface-500">
                        {session.location} • {session.time}
                      </p>
                    </div>
                    {!session.current && (
                      <button className="text-xs text-error-600 hover:underline">
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Profile Visibility
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Show my profile to other users', key: 'profileVisible' },
                  { label: 'Show my email address', key: 'emailVisible' },
                  { label: 'Show my activity status', key: 'activityVisible' },
                  { label: 'Allow others to message me', key: 'allowMessages' },
                ].map((setting) => (
                  <label
                    key={setting.key}
                    className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg cursor-pointer"
                  >
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      {setting.label}
                    </span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Blocked Users
              </h3>
              <p className="text-sm text-surface-500">
                You haven't blocked any users.
              </p>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Language
              </h3>
              <select className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option>English (United States)</option>
                <option>English (United Kingdom)</option>
                <option>Twi</option>
                <option>Ga</option>
                <option>Ewe</option>
              </select>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Timezone
              </h3>
              <select className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option>Africa/Accra (GMT+0)</option>
                <option>Europe/London (GMT+0)</option>
                <option>America/New_York (GMT-5)</option>
              </select>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Date & Time Format
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-surface-600 dark:text-surface-400 mb-2">
                    Date Format
                  </label>
                  <select className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-surface-600 dark:text-surface-400 mb-2">
                    Time Format
                  </label>
                  <select className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option>12-hour</option>
                    <option>24-hour</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Export Your Data
              </h3>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                Download a copy of your data including profile information, documents, and activity history.
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                <Download className="w-4 h-4" />
                Request Data Export
              </button>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Storage Usage
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-surface-600 dark:text-surface-400">Used</span>
                    <span className="font-medium text-surface-900 dark:text-surface-50">
                      156 MB of 1 GB
                    </span>
                  </div>
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full"
                      style={{ width: '15.6%' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                    <p className="text-surface-500">Documents</p>
                    <p className="font-medium text-surface-900 dark:text-surface-50">120 MB</p>
                  </div>
                  <div className="p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                    <p className="text-surface-500">Attachments</p>
                    <p className="font-medium text-surface-900 dark:text-surface-50">36 MB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-error-50 dark:bg-error-900/20 rounded-xl p-6 border border-error-200 dark:border-error-800">
              <h3 className="font-semibold text-error-900 dark:text-error-100 mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-error-700 dark:text-error-300 mb-4">
                This action is irreversible. All your data will be permanently deleted.
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-error-600 text-white font-medium rounded-lg hover:bg-error-700 transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-surface-400 to-surface-600 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              Settings
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Manage your account preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    activeSection === item.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-2 border-primary-600'
                      : 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700/50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}

              <div className="border-t border-surface-200 dark:border-surface-700">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderContent()}
            </motion.div>
          </main>
        </div>
    </div>
  );
}
