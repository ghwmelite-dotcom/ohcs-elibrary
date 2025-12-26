import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Shield,
  Bell,
  Mail,
  Database,
  Globe,
  Palette,
  Lock,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Tabs } from '@/components/shared/Tabs';
import { cn } from '@/utils/cn';

export default function AdminSettings() {
  const [selectedTab, setSelectedTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  const [settings, setSettings] = useState({
    siteName: 'OHCS E-Library',
    siteDescription: 'Digital library for Ghana Civil Service',
    supportEmail: 'support@ohcs.gov.gh',
    maxUploadSize: '50',
    allowRegistration: true,
    requireEmailVerification: true,
    allowPublicAccess: false,
    maintenanceMode: false,
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    lockoutDuration: '15',
    passwordMinLength: '12',
    requireTwoFactor: false,
    emailNotifications: true,
    pushNotifications: true,
    digestFrequency: 'daily',
  });

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'storage', label: 'Storage', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
            System Settings
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Configure platform settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Reset to Default
          </Button>
          <Button leftIcon={<Save className="w-4 h-4" />} onClick={handleSave} isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors',
                  selectedTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {selectedTab === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Site Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Site Name"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                  <Input
                    label="Support Email"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      Site Description
                    </label>
                    <textarea
                      value={settings.siteDescription}
                      onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                      rows={3}
                      className={cn(
                        'w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                        'text-surface-900 dark:text-surface-50',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500',
                        'resize-none'
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Access Control</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-50">Allow Registration</p>
                      <p className="text-sm text-surface-500">Allow new users to register</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allowRegistration}
                      onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                      className="w-5 h-5 rounded border-surface-300"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-50">Require Email Verification</p>
                      <p className="text-sm text-surface-500">New users must verify their email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.requireEmailVerification}
                      onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                      className="w-5 h-5 rounded border-surface-300"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-50">Maintenance Mode</p>
                      <p className="text-sm text-surface-500">Only admins can access the platform</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="w-5 h-5 rounded border-surface-300"
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Session Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Session Timeout (minutes)"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                  />
                  <Input
                    label="Max Login Attempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
                  />
                  <Input
                    label="Lockout Duration (minutes)"
                    type="number"
                    value={settings.lockoutDuration}
                    onChange={(e) => setSettings({ ...settings, lockoutDuration: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Password Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Minimum Password Length"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({ ...settings, passwordMinLength: e.target.value })}
                  />
                </div>
                <div className="mt-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-50">Require Two-Factor Authentication</p>
                      <p className="text-sm text-surface-500">All users must enable 2FA</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.requireTwoFactor}
                      onChange={(e) => setSettings({ ...settings, requireTwoFactor: e.target.checked })}
                      className="w-5 h-5 rounded border-surface-300"
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Notification Channels</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-50">Email Notifications</p>
                      <p className="text-sm text-surface-500">Send notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="w-5 h-5 rounded border-surface-300"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-50">Push Notifications</p>
                      <p className="text-sm text-surface-500">Send browser push notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                      className="w-5 h-5 rounded border-surface-300"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Digest Settings</h3>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Digest Frequency
                  </label>
                  <select
                    value={settings.digestFrequency}
                    onChange={(e) => setSettings({ ...settings, digestFrequency: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg"
                  >
                    <option value="realtime">Real-time</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'email' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm"
            >
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Email Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="SMTP Host" placeholder="smtp.example.com" />
                <Input label="SMTP Port" placeholder="587" />
                <Input label="SMTP Username" placeholder="username" />
                <Input label="SMTP Password" type="password" placeholder="********" />
                <Input label="From Address" placeholder="noreply@ohcs.gov.gh" />
                <Input label="From Name" placeholder="OHCS E-Library" />
              </div>
              <div className="mt-4">
                <Button variant="outline">
                  Send Test Email
                </Button>
              </div>
            </motion.div>
          )}

          {selectedTab === 'storage' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Storage Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Max Upload Size (MB)"
                    type="number"
                    value={settings.maxUploadSize}
                    onChange={(e) => setSettings({ ...settings, maxUploadSize: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Storage Usage</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-surface-600 dark:text-surface-400">Documents</span>
                      <span className="text-sm font-medium">24.5 GB / 100 GB</span>
                    </div>
                    <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div className="h-full w-[24%] bg-primary-500 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-surface-600 dark:text-surface-400">Media</span>
                      <span className="text-sm font-medium">8.2 GB / 50 GB</span>
                    </div>
                    <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div className="h-full w-[16%] bg-secondary-500 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-surface-600 dark:text-surface-400">Backups</span>
                      <span className="text-sm font-medium">12.8 GB / 25 GB</span>
                    </div>
                    <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div className="h-full w-[51%] bg-accent-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
