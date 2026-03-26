import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  Shield,
  LogOut,
  Keyboard,
  Bot,
  HardDrive,
  Activity,
  Eye,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ProfileEdit } from '@/components/profile';
import { NotificationSettings } from '@/components/notifications';
import {
  SettingsHero,
  SecurityDashboard,
  KeyboardShortcuts,
  AppearanceSettings,
  AIPreferences,
  StorageAnalytics,
  AccountActivity,
  TwoFactorSetup
} from '@/components/settings';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/utils/cn';

type SettingsSection =
  | 'overview'
  | 'profile'
  | 'notifications'
  | 'appearance'
  | 'security'
  | 'ai'
  | 'shortcuts'
  | 'privacy'
  | 'language'
  | 'data'
  | 'activity';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const initialSection = (searchParams.get('section') as SettingsSection) || 'overview';
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  const { user, logout } = useAuthStore();
  const {
    settings,
    sessions,
    twoFactor,
    shortcuts,
    activities,
    storage,
    exports,
    securityScore,
    isLoading,
    isSessionsLoading,
    is2FALoading,
    isShortcutsLoading,
    isActivityLoading,
    isStorageLoading,
    isExportsLoading,
    isSaving,
    activityPage,
    activityTotalPages,
    fetchSettings,
    updateSettings,
    fetchSessions,
    revokeSession,
    revokeAllSessions,
    fetchTwoFactorStatus,
    initializeTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    fetchShortcuts,
    updateShortcut,
    resetShortcut,
    fetchActivity,
    fetchStorage,
    fetchExports,
    requestExport,
    fetchSecurityScore,
    changePassword
  } = useSettingsStore();

  const { preferences: notificationPreferences, updatePreferences: updateNotificationPreferences } = useNotificationStore();

  // Fetch all data on mount
  useEffect(() => {
    fetchSettings();
    fetchSecurityScore();
    fetchSessions();
    fetchTwoFactorStatus();
  }, []);

  // Fetch section-specific data when section changes
  useEffect(() => {
    switch (activeSection) {
      case 'shortcuts':
        fetchShortcuts();
        break;
      case 'activity':
        fetchActivity(1);
        break;
      case 'data':
        fetchStorage();
        fetchExports();
        break;
    }
  }, [activeSection]);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Shield, description: 'Security score & quick actions' },
    { id: 'profile', label: 'Profile', icon: User, description: 'Personal information' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme & display' },
    { id: 'security', label: 'Security', icon: Lock, description: 'Password & 2FA' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts & emails' },
    { id: 'ai', label: 'AI Assistant', icon: Bot, description: 'AI preferences' },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard, description: 'Keyboard shortcuts' },
    { id: 'privacy', label: 'Privacy', icon: Eye, description: 'Visibility settings' },
    { id: 'language', label: 'Language', icon: Globe, description: 'Region & locale' },
    { id: 'data', label: 'Data & Storage', icon: HardDrive, description: 'Export & storage' },
    { id: 'activity', label: 'Activity', icon: Activity, description: 'Account activity' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <SettingsHero
              securityScore={securityScore}
              isLoading={isLoading}
              userName={user?.displayName}
              onImproveClick={() => setActiveSection('security')}
            />

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'profile', icon: User, label: 'Edit Profile', desc: 'Update your info', color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' },
                { id: 'security', icon: Lock, label: 'Security', desc: 'Password & 2FA', color: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400' },
                { id: 'appearance', icon: Palette, label: 'Appearance', desc: 'Theme & colors', color: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400' },
                { id: 'ai', icon: Bot, label: 'AI Assistant', desc: 'Configure AI', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
                { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Alert settings', color: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400' },
                { id: 'shortcuts', icon: Keyboard, label: 'Shortcuts', desc: 'Customize keys', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
              ].map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 hover:shadow-elevation-2 transition-all text-left"
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', item.color)}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-surface-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-surface-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-surface-400" />
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <ProfileEdit
            initialData={{
              name: user?.displayName || 'User',
              email: user?.email || 'user@ohcs.gov.gh',
              avatar: user?.avatar,
              title: user?.title || '',
              mda: user?.mda?.name || '',
              gradeLevel: user?.gradeLevel || '',
              location: user?.location || 'Accra, Ghana',
              bio: user?.bio || '',
              phone: user?.phone || '',
              website: user?.website || '',
            }}
            onSave={async (data) => {
              const API_BASE = import.meta.env.PROD
                ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
                : '/api/v1';

              const token = localStorage.getItem('auth_token') ||
                JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}')?.state?.token;

              const response = await fetch(`${API_BASE}/users/me`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
              });

              if (!response.ok) {
                throw new Error('Failed to update profile');
              }

              // Refresh user data in auth store
              window.location.reload();
            }}
            onCancel={() => setActiveSection('overview')}
          />
        );

      case 'appearance':
        return (
          <AppearanceSettings
            settings={settings}
            isSaving={isSaving}
            onUpdate={updateSettings}
          />
        );

      case 'security':
        return (
          <div className="space-y-6">
            <SecurityDashboard
              sessions={sessions}
              twoFactor={twoFactor}
              isSessionsLoading={isSessionsLoading}
              is2FALoading={is2FALoading}
              onRevokeSession={revokeSession}
              onRevokeAllSessions={revokeAllSessions}
              onInitialize2FA={initializeTwoFactor}
              onVerify2FA={verifyTwoFactor}
              onDisable2FA={disableTwoFactor}
              onChangePassword={changePassword}
            />
            <TwoFactorSetup />
          </div>
        );

      case 'notifications':
        return (
          <NotificationSettings
            initialPreferences={notificationPreferences ? {
              email: notificationPreferences.emailEnabled,
              push: notificationPreferences.pushEnabled,
              inApp: notificationPreferences.inAppEnabled,
              sound: notificationPreferences.soundEnabled,
              quietHours: {
                enabled: notificationPreferences.quietHoursEnabled,
                start: notificationPreferences.quietHoursStart,
                end: notificationPreferences.quietHoursEnd
              },
              categories: notificationPreferences.categoryPreferences
            } : undefined}
            onSave={async (prefs) => {
              await updateNotificationPreferences({
                emailEnabled: prefs.email,
                pushEnabled: prefs.push,
                inAppEnabled: prefs.inApp,
                soundEnabled: prefs.sound,
                quietHoursEnabled: prefs.quietHours.enabled,
                quietHoursStart: prefs.quietHours.start,
                quietHoursEnd: prefs.quietHours.end,
                categoryPreferences: prefs.categories
              });
            }}
          />
        );

      case 'ai':
        return (
          <AIPreferences
            settings={settings}
            isSaving={isSaving}
            onUpdate={updateSettings}
          />
        );

      case 'shortcuts':
        return (
          <KeyboardShortcuts
            shortcuts={shortcuts}
            isLoading={isShortcutsLoading}
            onUpdate={updateShortcut}
            onReset={resetShortcut}
          />
        );

      case 'privacy':
        return (
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-white">Privacy Settings</h3>
                <p className="text-sm text-surface-500">Control your visibility and data sharing</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'profileVisibility', label: 'Profile Visibility', desc: 'Who can see your profile', type: 'select', options: ['public', 'connections', 'private'] },
                { key: 'showEmail', label: 'Show Email', desc: 'Display email on profile', type: 'toggle' },
                { key: 'showActivity', label: 'Show Activity', desc: 'Let others see your activity', type: 'toggle' },
                { key: 'showOnlineStatus', label: 'Online Status', desc: 'Show when you are online', type: 'toggle' },
                { key: 'allowMessages', label: 'Messages', desc: 'Who can message you', type: 'select', options: ['all', 'connections', 'none'] },
                { key: 'allowTagging', label: 'Allow Tagging', desc: 'Let others tag you in posts', type: 'toggle' },
              ].map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white">{setting.label}</p>
                    <p className="text-sm text-surface-500">{setting.desc}</p>
                  </div>
                  {setting.type === 'toggle' ? (
                    <label className="relative cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(settings as any)?.[setting.key] || false}
                        onChange={(e) => updateSettings({ [setting.key]: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={cn(
                        'w-11 h-6 rounded-full transition-colors',
                        (settings as any)?.[setting.key] ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'
                      )}>
                        <div className={cn(
                          'w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5',
                          (settings as any)?.[setting.key] && 'translate-x-5'
                        )} />
                      </div>
                    </label>
                  ) : (
                    <select
                      value={(settings as any)?.[setting.key] || setting.options?.[0]}
                      onChange={(e) => updateSettings({ [setting.key]: e.target.value })}
                      className="px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg capitalize"
                    >
                      {setting.options?.map((opt) => (
                        <option key={opt} value={opt} className="capitalize">{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">Language & Region</h3>
                  <p className="text-sm text-surface-500">Set your locale preferences</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Language
                  </label>
                  <select
                    value={settings?.language || 'en-US'}
                    onChange={(e) => updateSettings({ language: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg"
                  >
                    <option value="en-US">English (United States)</option>
                    <option value="en-GB">English (United Kingdom)</option>
                    <option value="tw">Twi</option>
                    <option value="ga">Ga</option>
                    <option value="ee">Ewe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings?.timezone || 'Africa/Accra'}
                    onChange={(e) => updateSettings({ timezone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg"
                  >
                    <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="America/New_York">America/New_York (GMT-5)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Date Format
                    </label>
                    <select
                      value={settings?.dateFormat || 'DD/MM/YYYY'}
                      onChange={(e) => updateSettings({ dateFormat: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Time Format
                    </label>
                    <select
                      value={settings?.timeFormat || '12h'}
                      onChange={(e) => updateSettings({ timeFormat: e.target.value as '12h' | '24h' })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg"
                    >
                      <option value="12h">12-hour</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Week Starts On
                  </label>
                  <select
                    value={settings?.weekStartsOn || 'monday'}
                    onChange={(e) => updateSettings({ weekStartsOn: e.target.value as 'sunday' | 'monday' })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg"
                  >
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <StorageAnalytics
            storage={storage}
            exports={exports}
            isLoading={isStorageLoading}
            isExportsLoading={isExportsLoading}
            onRequestExport={requestExport}
            onRefresh={fetchStorage}
          />
        );

      case 'activity':
        return (
          <AccountActivity
            activities={activities}
            isLoading={isActivityLoading}
            page={activityPage}
            totalPages={activityTotalPages}
            onLoadMore={() => fetchActivity(activityPage + 1)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
          <SettingsIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Settings</h1>
          <p className="text-surface-600 dark:text-surface-400">
            Manage your account and preferences
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <nav className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden sticky top-24">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 dark:text-white truncate">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
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
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Log Out</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
