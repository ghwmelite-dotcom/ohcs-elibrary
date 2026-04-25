import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
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
  Key,
  Link2,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Server,
  HardDrive,
  Cpu,
  Activity,
  Clock,
  Users,
  FileText,
  Image,
  Archive,
  Zap,
  Eye,
  EyeOff,
  Copy,
  RotateCcw,
  AlertCircle,
  Wifi,
  WifiOff,
  CloudOff,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Building2,
  Loader2,
  History,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { cn } from '@/utils/cn';

// API base URL
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

// Backup types
interface Backup {
  id: string;
  filename: string;
  type: 'manual' | 'auto';
  size: number;
  sizeFormatted: string;
  createdAt: string;
}

interface BackupStats {
  totalBackups: number;
  manualBackups: number;
  autoBackups: number;
  totalSize: number;
  totalSizeFormatted: string;
  lastBackup: Backup | null;
}

// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-50 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900" />

      <motion.div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-30 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, #006B3F 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-25 dark:opacity-15"
        style={{
          background: 'radial-gradient(circle, #FCD116 0%, transparent 70%)',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute -bottom-16 left-1/3 w-72 h-72 rounded-full opacity-20 dark:opacity-10"
        style={{
          background: 'radial-gradient(circle, #CE1126 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Toggle Switch Component
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

function ToggleSwitch({ enabled, onChange, label, description, disabled }: ToggleSwitchProps) {
  return (
    <label className={cn(
      'flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer',
      'bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700',
      disabled && 'opacity-50 cursor-not-allowed'
    )}>
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-medium text-surface-900 dark:text-surface-50">{label}</p>
        {description && (
          <p className="text-sm text-surface-500 mt-0.5">{description}</p>
        )}
      </div>
      <motion.button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!enabled)}
        className={cn(
          'relative w-12 h-7 rounded-full transition-colors flex-shrink-0',
          enabled ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
        )}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </label>
  );
}

// Setting Section Component
interface SettingSectionProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
}

function SettingSection({ title, description, icon: Icon, iconColor = '#006B3F', children }: SettingSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-start gap-3 mb-5">
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">{title}</h3>
          {description && (
            <p className="text-sm text-surface-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// Storage Bar Component
interface StorageBarProps {
  label: string;
  used: number;
  total: number;
  color: string;
  icon: React.ElementType;
}

function StorageBar({ label, used, total, color, icon: Icon }: StorageBarProps) {
  const percentage = (used / total) * 100;
  const formatSize = (gb: number) => gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : `${gb} GB`;

  return (
    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="font-medium text-surface-900 dark:text-surface-50">{label}</span>
        </div>
        <span className="text-sm text-surface-500">
          {formatSize(used)} / {formatSize(total)}
        </span>
      </div>
      <div className="h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-surface-400">{percentage.toFixed(1)}% used</span>
        <span className="text-xs text-surface-400">{formatSize(total - used)} free</span>
      </div>
    </div>
  );
}

// System Status Card
interface SystemStatusProps {
  label: string;
  status: 'online' | 'offline' | 'warning';
  value?: string;
  icon: React.ElementType;
}

function SystemStatusCard({ label, status, value, icon: Icon }: SystemStatusProps) {
  const statusConfig = {
    online: { color: '#10B981', bg: 'bg-success-50 dark:bg-success-900/30', text: 'Online' },
    offline: { color: '#EF4444', bg: 'bg-error-50 dark:bg-error-900/30', text: 'Offline' },
    warning: { color: '#F59E0B', bg: 'bg-warning-50 dark:bg-warning-900/30', text: 'Warning' },
  };

  const config = statusConfig[status];

  return (
    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${config.color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: config.color }} />
          </div>
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50">{label}</p>
            {value && <p className="text-sm text-surface-500">{value}</p>}
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.bg)}>
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: config.color }}
          />
          <span style={{ color: config.color }}>{config.text}</span>
        </div>
      </div>
    </div>
  );
}

// API Key Row
interface APIKeyProps {
  name: string;
  apiKey: string;
  lastUsed: string;
  onRevoke: () => void;
}

function APIKeyRow({ name, apiKey, lastUsed, onRevoke }: APIKeyProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const maskedKey = `${apiKey.slice(0, 8)}${'•'.repeat(24)}${apiKey.slice(-4)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-surface-900 dark:text-surface-50">{name}</p>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-sm text-surface-500 font-mono">
            {isVisible ? apiKey : maskedKey}
          </code>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-1 hover:bg-surface-200 dark:hover:bg-surface-600 rounded transition-colors"
          >
            {isVisible ? (
              <EyeOff className="w-4 h-4 text-surface-400" />
            ) : (
              <Eye className="w-4 h-4 text-surface-400" />
            )}
          </button>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-surface-200 dark:hover:bg-surface-600 rounded transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success-500" />
            ) : (
              <Copy className="w-4 h-4 text-surface-400" />
            )}
          </button>
        </div>
        <p className="text-xs text-surface-400 mt-1">Last used: {lastUsed}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRevoke}
        className="text-error-600 hover:text-error-700 hover:bg-error-50"
      >
        Revoke
      </Button>
    </div>
  );
}

// Integration Card
interface IntegrationProps {
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  onToggle: () => void;
}

function IntegrationCard({ name, description, icon, connected, onToggle }: IntegrationProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50 group hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
      <div className="flex items-center gap-3">
        <img src={icon} alt={name} className="w-10 h-10 rounded-lg" />
        <div>
          <p className="font-medium text-surface-900 dark:text-surface-50">{name}</p>
          <p className="text-sm text-surface-500">{description}</p>
        </div>
      </div>
      <Button
        variant={connected ? 'outline' : 'primary'}
        size="sm"
        onClick={onToggle}
        leftIcon={connected ? <X className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </Button>
    </div>
  );
}

export default function AdminSettings() {
  const [selectedTab, setSelectedTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Backup state
  const { token } = useAuthStore();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);

  // Holiday state
  interface Holiday {
    id: string;
    title: string;
    date: string;
    description?: string;
    isRecurring: boolean;
  }
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ title: '', date: '', description: '', isRecurring: false });
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const [holidaySuccess, setHolidaySuccess] = useState<string | null>(null);

  const fetchHolidays = async () => {
    setIsLoadingHolidays(true);
    try {
      const response = await fetch(`${API_BASE}/calendar/holidays`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
    } finally {
      setIsLoadingHolidays(false);
    }
  };

  const addHoliday = async () => {
    if (!holidayForm.title || !holidayForm.date) return;
    setIsAddingHoliday(true);
    setHolidayError(null);
    setHolidaySuccess(null);
    try {
      const response = await fetch(`${API_BASE}/calendar/holidays`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(holidayForm),
      });
      if (response.ok) {
        setHolidaySuccess('Holiday added successfully');
        setHolidayForm({ title: '', date: '', description: '', isRecurring: false });
        fetchHolidays();
        setTimeout(() => setHolidaySuccess(null), 3000);
      } else {
        const error = await response.json();
        setHolidayError(error.error || 'Failed to add holiday');
      }
    } catch {
      setHolidayError('Failed to add holiday');
    } finally {
      setIsAddingHoliday(false);
    }
  };

  const deleteHoliday = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/calendar/holidays/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setHolidaySuccess('Holiday deleted');
        fetchHolidays();
        setTimeout(() => setHolidaySuccess(null), 3000);
      } else {
        setHolidayError('Failed to delete holiday');
      }
    } catch {
      setHolidayError('Failed to delete holiday');
    }
  };

  // Fetch holidays when holidays tab is selected
  useEffect(() => {
    if (selectedTab === 'holidays') {
      fetchHolidays();
    }
  }, [selectedTab]);

  // Fetch backups when backup tab is selected
  useEffect(() => {
    if (selectedTab === 'backup') {
      fetchBackups();
      fetchBackupStats();
    }
  }, [selectedTab]);

  const fetchBackups = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/backup`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    }
  };

  const fetchBackupStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/backup/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBackupStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch backup stats:', error);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    setBackupError(null);
    setBackupSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/admin/backup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'manual' }),
      });

      if (response.ok) {
        const data = await response.json();
        setBackupSuccess(`Backup created: ${data.backup.filename} (${data.backup.sizeFormatted})`);
        fetchBackups();
        fetchBackupStats();
      } else {
        const error = await response.json();
        setBackupError(error.error || 'Failed to create backup');
      }
    } catch (error) {
      setBackupError('Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite all current data.')) {
      return;
    }

    setIsRestoringBackup(true);
    setRestoringBackupId(backupId);
    setBackupError(null);
    setBackupSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/admin/backup/restore/${encodeURIComponent(backupId)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBackupSuccess(`Backup restored successfully. ${data.totalRestored} records restored.`);
      } else {
        const error = await response.json();
        setBackupError(error.error || 'Failed to restore backup');
      }
    } catch (error) {
      setBackupError('Failed to restore backup');
    } finally {
      setIsRestoringBackup(false);
      setRestoringBackupId(null);
    }
  };

  const downloadBackup = async (backupId: string, filename: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/backup/${encodeURIComponent(backupId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      setBackupError('Failed to download backup');
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/backup/${encodeURIComponent(backupId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setBackupSuccess('Backup deleted');
        fetchBackups();
        fetchBackupStats();
      } else {
        setBackupError('Failed to delete backup');
      }
    } catch (error) {
      setBackupError('Failed to delete backup');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [settings, setSettings] = useState({
    // General
    siteName: 'OHCS E-Library',
    siteDescription: 'Digital knowledge platform for Ghana Civil Service - Empowering public servants with accessible information',
    supportEmail: 'support@ohcs.gov.gh',
    siteUrl: 'https://elibrary.ohcs.gov.gh',
    timezone: 'Africa/Accra',
    language: 'en',
    // Access
    allowRegistration: true,
    requireEmailVerification: true,
    allowPublicAccess: false,
    maintenanceMode: false,
    restrictToGovEmail: true,
    // Security
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    lockoutDuration: '15',
    passwordMinLength: '12',
    requireTwoFactor: false,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
    passwordExpiry: '90',
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    digestFrequency: 'daily',
    notifyNewUsers: true,
    notifyNewDocuments: true,
    notifySecurityAlerts: true,
    // Email
    smtpHost: 'smtp.gov.gh',
    smtpPort: '587',
    smtpUsername: 'elibrary@ohcs.gov.gh',
    smtpPassword: '',
    fromAddress: 'noreply@ohcs.gov.gh',
    fromName: 'OHCS E-Library',
    smtpEncryption: 'tls',
    // Storage
    maxUploadSize: '50',
    allowedFileTypes: 'pdf,doc,docx,xls,xlsx,ppt,pptx',
    autoDeleteDays: '0',
    compressUploads: true,
    // Appearance
    primaryColor: '#006B3F',
    accentColor: '#FCD116',
    darkModeDefault: false,
    showFooter: true,
    customCss: '',
  });

  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Fetch system settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE}/settings/system`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSettings(prev => ({ ...prev, ...data }));
          setSettingsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to fetch system settings:', error);
      }
    };

    if (token) {
      fetchSettings();
    }
  }, [token]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/settings/system`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
      } else {
        const error = await response.json();
        console.error('Failed to save settings:', error);
        alert('Failed to save settings: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings, color: '#006B3F' },
    { id: 'security', label: 'Security', icon: Shield, color: '#CE1126' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: '#FCD116' },
    { id: 'email', label: 'Email', icon: Mail, color: '#3B82F6' },
    { id: 'storage', label: 'Storage', icon: Database, color: '#8B5CF6' },
    { id: 'api', label: 'API Keys', icon: Key, color: '#10B981' },
    { id: 'integrations', label: 'Integrations', icon: Link2, color: '#F59E0B' },
    { id: 'appearance', label: 'Appearance', icon: Palette, color: '#EC4899' },
    { id: 'backup', label: 'Backup', icon: Archive, color: '#6366F1' },
    { id: 'holidays', label: 'Holidays', icon: Calendar, color: '#F97316' },
    { id: 'system', label: 'System', icon: Server, color: '#14B8A6' },
  ];

  // Settings data - to be populated from API
  const apiKeys: { name: string; key: string; lastUsed: string }[] = [];

  const integrations: { name: string; description: string; icon: string; connected: boolean }[] = [];

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
                System Settings
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Configure platform settings and preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {showSaveSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-success-50 dark:bg-success-900/30 rounded-lg"
                >
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span className="text-sm font-medium text-success-600">Settings saved</span>
                </motion.div>
              )}
            </AnimatePresence>
            <Button variant="outline" leftIcon={<RotateCcw className="w-4 h-4" />}>
              Reset
            </Button>
            <Button
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSave}
              isLoading={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white dark:bg-surface-800 rounded-2xl p-2 shadow-sm sticky top-6">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = selectedTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                      )}
                      whileHover={{ x: isActive ? 0 : 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                          isActive ? '' : 'bg-surface-100 dark:bg-surface-700'
                        )}
                        style={{
                          backgroundColor: isActive ? `${tab.color}20` : undefined,
                        }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: isActive ? tab.color : undefined }}
                        />
                      </div>
                      <span
                        className={cn(
                          'font-medium',
                          isActive
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-surface-600 dark:text-surface-400'
                        )}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 ml-auto text-primary-500" />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 space-y-6">
            <AnimatePresence mode="wait">
              {selectedTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SettingSection
                    title="Site Information"
                    description="Basic information about your platform"
                    icon={Globe}
                    iconColor="#006B3F"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Site Name"
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      />
                      <Input
                        label="Site URL"
                        value={settings.siteUrl}
                        onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                      />
                      <Input
                        label="Support Email"
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      />
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                          Timezone
                        </label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                          <option value="UTC">UTC</option>
                          <option value="Europe/London">Europe/London</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                          Site Description
                        </label>
                        <textarea
                          value={settings.siteDescription}
                          onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 bg-white dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                      </div>
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="Access Control"
                    description="Control who can access your platform"
                    icon={Lock}
                    iconColor="#CE1126"
                  >
                    <div className="space-y-3">
                      <ToggleSwitch
                        enabled={settings.allowRegistration}
                        onChange={(v) => setSettings({ ...settings, allowRegistration: v })}
                        label="Allow Registration"
                        description="Allow new users to create accounts"
                      />
                      <ToggleSwitch
                        enabled={settings.requireEmailVerification}
                        onChange={(v) => setSettings({ ...settings, requireEmailVerification: v })}
                        label="Require Email Verification"
                        description="New users must verify their email address"
                      />
                      <ToggleSwitch
                        enabled={settings.restrictToGovEmail}
                        onChange={(v) => setSettings({ ...settings, restrictToGovEmail: v })}
                        label="Restrict to Government Email"
                        description="Only allow @gov.gh email addresses"
                      />
                      <ToggleSwitch
                        enabled={settings.allowPublicAccess}
                        onChange={(v) => setSettings({ ...settings, allowPublicAccess: v })}
                        label="Allow Public Access"
                        description="Allow viewing without login"
                      />
                      <ToggleSwitch
                        enabled={settings.maintenanceMode}
                        onChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
                        label="Maintenance Mode"
                        description="Only administrators can access the platform"
                      />
                    </div>
                  </SettingSection>
                </motion.div>
              )}

              {selectedTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SettingSection
                    title="Session Settings"
                    description="Configure session and login behavior"
                    icon={Clock}
                    iconColor="#3B82F6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </SettingSection>

                  <SettingSection
                    title="Password Policy"
                    description="Set requirements for user passwords"
                    icon={Key}
                    iconColor="#CE1126"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="Minimum Password Length"
                        type="number"
                        value={settings.passwordMinLength}
                        onChange={(e) => setSettings({ ...settings, passwordMinLength: e.target.value })}
                      />
                      <Input
                        label="Password Expiry (days, 0 = never)"
                        type="number"
                        value={settings.passwordExpiry}
                        onChange={(e) => setSettings({ ...settings, passwordExpiry: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <ToggleSwitch
                        enabled={settings.requireUppercase}
                        onChange={(v) => setSettings({ ...settings, requireUppercase: v })}
                        label="Require Uppercase Letters"
                        description="Password must contain at least one uppercase letter"
                      />
                      <ToggleSwitch
                        enabled={settings.requireNumbers}
                        onChange={(v) => setSettings({ ...settings, requireNumbers: v })}
                        label="Require Numbers"
                        description="Password must contain at least one number"
                      />
                      <ToggleSwitch
                        enabled={settings.requireSymbols}
                        onChange={(v) => setSettings({ ...settings, requireSymbols: v })}
                        label="Require Special Characters"
                        description="Password must contain at least one symbol"
                      />
                      <ToggleSwitch
                        enabled={settings.requireTwoFactor}
                        onChange={(v) => setSettings({ ...settings, requireTwoFactor: v })}
                        label="Require Two-Factor Authentication"
                        description="All users must enable 2FA"
                      />
                    </div>
                  </SettingSection>
                </motion.div>
              )}

              {selectedTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SettingSection
                    title="Notification Channels"
                    description="Configure how notifications are delivered"
                    icon={Bell}
                    iconColor="#FCD116"
                  >
                    <div className="space-y-3">
                      <ToggleSwitch
                        enabled={settings.emailNotifications}
                        onChange={(v) => setSettings({ ...settings, emailNotifications: v })}
                        label="Email Notifications"
                        description="Send notifications via email"
                      />
                      <ToggleSwitch
                        enabled={settings.pushNotifications}
                        onChange={(v) => setSettings({ ...settings, pushNotifications: v })}
                        label="Push Notifications"
                        description="Send browser push notifications"
                      />
                      <ToggleSwitch
                        enabled={settings.smsNotifications}
                        onChange={(v) => setSettings({ ...settings, smsNotifications: v })}
                        label="SMS Notifications"
                        description="Send SMS alerts for critical updates"
                      />
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="Admin Alerts"
                    description="Notifications for administrators"
                    icon={AlertCircle}
                    iconColor="#CE1126"
                  >
                    <div className="space-y-3">
                      <ToggleSwitch
                        enabled={settings.notifyNewUsers}
                        onChange={(v) => setSettings({ ...settings, notifyNewUsers: v })}
                        label="New User Registrations"
                        description="Get notified when new users register"
                      />
                      <ToggleSwitch
                        enabled={settings.notifyNewDocuments}
                        onChange={(v) => setSettings({ ...settings, notifyNewDocuments: v })}
                        label="New Document Uploads"
                        description="Get notified when documents are uploaded"
                      />
                      <ToggleSwitch
                        enabled={settings.notifySecurityAlerts}
                        onChange={(v) => setSettings({ ...settings, notifySecurityAlerts: v })}
                        label="Security Alerts"
                        description="Receive alerts for suspicious activities"
                      />
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="Digest Settings"
                    description="Configure email digest frequency"
                    icon={Mail}
                    iconColor="#3B82F6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                        Digest Frequency
                      </label>
                      <select
                        value={settings.digestFrequency}
                        onChange={(e) => setSettings({ ...settings, digestFrequency: e.target.value })}
                        className="w-full md:w-64 px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="realtime">Real-time</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </SettingSection>
                </motion.div>
              )}

              {selectedTab === 'email' && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SettingSection
                    title="SMTP Configuration"
                    description="Configure email server settings"
                    icon={Mail}
                    iconColor="#3B82F6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="SMTP Host"
                        value={settings.smtpHost}
                        onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                        placeholder="smtp.example.com"
                      />
                      <Input
                        label="SMTP Port"
                        value={settings.smtpPort}
                        onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                        placeholder="587"
                      />
                      <Input
                        label="SMTP Username"
                        value={settings.smtpUsername}
                        onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                      />
                      <Input
                        label="SMTP Password"
                        type="password"
                        value={settings.smtpPassword}
                        onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                          Encryption
                        </label>
                        <select
                          value={settings.smtpEncryption}
                          onChange={(e) => setSettings({ ...settings, smtpEncryption: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="none">None</option>
                          <option value="ssl">SSL</option>
                          <option value="tls">TLS</option>
                        </select>
                      </div>
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="Sender Information"
                    description="Configure email sender details"
                    icon={Building2}
                    iconColor="#006B3F"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="From Address"
                        value={settings.fromAddress}
                        onChange={(e) => setSettings({ ...settings, fromAddress: e.target.value })}
                        placeholder="noreply@ohcs.gov.gh"
                      />
                      <Input
                        label="From Name"
                        value={settings.fromName}
                        onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                        placeholder="OHCS E-Library"
                      />
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" leftIcon={<Mail className="w-4 h-4" />}>
                        Send Test Email
                      </Button>
                    </div>
                  </SettingSection>
                </motion.div>
              )}

              {selectedTab === 'storage' && (
                <motion.div
                  key="storage"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SettingSection
                    title="Upload Settings"
                    description="Configure file upload behavior"
                    icon={Upload}
                    iconColor="#8B5CF6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Max Upload Size (MB)"
                        type="number"
                        value={settings.maxUploadSize}
                        onChange={(e) => setSettings({ ...settings, maxUploadSize: e.target.value })}
                      />
                      <Input
                        label="Allowed File Types"
                        value={settings.allowedFileTypes}
                        onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
                        placeholder="pdf,doc,docx,xls,xlsx"
                      />
                    </div>
                    <div className="mt-4 space-y-3">
                      <ToggleSwitch
                        enabled={settings.compressUploads}
                        onChange={(v) => setSettings({ ...settings, compressUploads: v })}
                        label="Compress Uploads"
                        description="Automatically compress uploaded files"
                      />
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="Storage Usage"
                    description="Current storage allocation and usage"
                    icon={HardDrive}
                    iconColor="#006B3F"
                  >
                    <div className="space-y-4">
                      <StorageBar
                        label="Documents"
                        used={0}
                        total={100}
                        color="#006B3F"
                        icon={FileText}
                      />
                      <StorageBar
                        label="Media"
                        used={0}
                        total={50}
                        color="#FCD116"
                        icon={Image}
                      />
                      <StorageBar
                        label="Backups"
                        used={0}
                        total={25}
                        color="#CE1126"
                        icon={Archive}
                      />
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-primary-900 dark:text-primary-100">Total Storage</p>
                        <p className="text-sm text-primary-700 dark:text-primary-300">0 GB used of 175 GB</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Upgrade Plan
                      </Button>
                    </div>
                  </SettingSection>
                </motion.div>
              )}

              {selectedTab === 'api' && (
                <motion.div
                  key="api"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SettingSection
                    title="API Keys"
                    description="Manage API keys for external integrations"
                    icon={Key}
                    iconColor="#10B981"
                  >
                    <div className="space-y-3">
                      {apiKeys.map((apiKeyItem) => (
                        <APIKeyRow
                          key={apiKeyItem.name}
                          name={apiKeyItem.name}
                          apiKey={apiKeyItem.key}
                          lastUsed={apiKeyItem.lastUsed}
                          onRevoke={() => console.log('Revoke', apiKeyItem.name)}
                        />
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button variant="primary" leftIcon={<Key className="w-4 h-4" />}>
                        Generate New Key
                      </Button>
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="API Settings"
                    description="Configure API behavior and limits"
                    icon={Zap}
                    iconColor="#F59E0B"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Rate Limit (requests/minute)"
                        type="number"
                        defaultValue="100"
                      />
                      <Input
                        label="Max Page Size"
                        type="number"
                        defaultValue="100"
                      />
                    </div>
                  </SettingSection>
                </motion.div>
              )}

              {selectedTab === 'integrations' && (
                <motion.div
                  key="integrations"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SettingSection
                    title="Connected Services"
                    description="Manage third-party integrations"
                    icon={Link2}
                    iconColor="#F59E0B"
                  >
                    <div className="space-y-3">
                      {integrations.map((integration) => (
                        <IntegrationCard
                          key={integration.name}
                          {...integration}
                          onToggle={() => console.log('Toggle', integration.name)}
                        />
                      ))}
                    </div>
                  </SettingSection>
                </motion.div>
              )}

              {selectedTab === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SettingSection
                    title="Brand Colors"
                    description="Customize your platform colors"
                    icon={Palette}
                    iconColor="#EC4899"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                          Primary Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                            className="w-12 h-12 rounded-lg border-2 border-surface-300 cursor-pointer"
                          />
                          <Input
                            value={settings.primaryColor}
                            onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                          Accent Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.accentColor}
                            onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                            className="w-12 h-12 rounded-lg border-2 border-surface-300 cursor-pointer"
                          />
                          <Input
                            value={settings.accentColor}
                            onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="Display Settings"
                    description="Configure display preferences"
                    icon={Eye}
                    iconColor="#6366F1"
                  >
                    <div className="space-y-3">
                      <ToggleSwitch
                        enabled={settings.darkModeDefault}
                        onChange={(v) => setSettings({ ...settings, darkModeDefault: v })}
                        label="Default to Dark Mode"
                        description="New users will see dark mode by default"
                      />
                      <ToggleSwitch
                        enabled={settings.showFooter}
                        onChange={(v) => setSettings({ ...settings, showFooter: v })}
                        label="Show Footer"
                        description="Display the site footer"
                      />
                    </div>
                  </SettingSection>
                </motion.div>
              )}

              {selectedTab === 'backup' && (
                <motion.div
                  key="backup"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Success/Error Messages */}
                  <AnimatePresence>
                    {backupSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-4 bg-success-50 dark:bg-success-900/30 rounded-xl border border-success-200 dark:border-success-800"
                      >
                        <CheckCircle className="w-5 h-5 text-success-600" />
                        <span className="text-success-700 dark:text-success-300">{backupSuccess}</span>
                        <button onClick={() => setBackupSuccess(null)} className="ml-auto">
                          <X className="w-4 h-4 text-success-600" />
                        </button>
                      </motion.div>
                    )}
                    {backupError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-4 bg-error-50 dark:bg-error-900/30 rounded-xl border border-error-200 dark:border-error-800"
                      >
                        <AlertTriangle className="w-5 h-5 text-error-600" />
                        <span className="text-error-700 dark:text-error-300">{backupError}</span>
                        <button onClick={() => setBackupError(null)} className="ml-auto">
                          <X className="w-4 h-4 text-error-600" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <SettingSection
                    title="Backup Management"
                    description="Create and restore database backups"
                    icon={Archive}
                    iconColor="#6366F1"
                  >
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-3">
                        <Button
                          variant="primary"
                          leftIcon={isCreatingBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          onClick={createBackup}
                          disabled={isCreatingBackup}
                        >
                          {isCreatingBackup ? 'Creating Backup...' : 'Create Backup Now'}
                        </Button>
                        <Button
                          variant="outline"
                          leftIcon={<RefreshCw className="w-4 h-4" />}
                          onClick={() => { fetchBackups(); fetchBackupStats(); }}
                        >
                          Refresh
                        </Button>
                      </div>

                      {/* Backup Stats */}
                      {backupStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                            <p className="text-xs text-surface-500 uppercase tracking-wider">Total Backups</p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-1">{backupStats.totalBackups}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                            <p className="text-xs text-surface-500 uppercase tracking-wider">Manual</p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-1">{backupStats.manualBackups}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                            <p className="text-xs text-surface-500 uppercase tracking-wider">Automatic</p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-1">{backupStats.autoBackups}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                            <p className="text-xs text-surface-500 uppercase tracking-wider">Total Size</p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-1">{backupStats.totalSizeFormatted}</p>
                          </div>
                        </div>
                      )}

                      {/* Last Backup Info */}
                      {backupStats?.lastBackup && (
                        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-primary-600" />
                            <span className="font-medium text-primary-900 dark:text-primary-100">Last Backup</span>
                          </div>
                          <p className="text-sm text-primary-700 dark:text-primary-300">
                            {formatDate(backupStats.lastBackup.createdAt)} ({backupStats.lastBackup.type === 'auto' ? 'Automatic' : 'Manual'})
                          </p>
                          <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                            {backupStats.lastBackup.filename} • {backupStats.lastBackup.sizeFormatted}
                          </p>
                        </div>
                      )}

                      {!backupStats?.lastBackup && (
                        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50 text-center">
                          <Archive className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                          <p className="text-surface-600 dark:text-surface-400">No backups yet</p>
                          <p className="text-sm text-surface-500">Create your first backup to get started</p>
                        </div>
                      )}
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="Backup History"
                    description="View and manage all backups"
                    icon={History}
                    iconColor="#10B981"
                  >
                    <div className="space-y-3">
                      {backups.length === 0 ? (
                        <div className="p-8 text-center text-surface-500">
                          <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No backups available</p>
                        </div>
                      ) : (
                        backups.map((backup) => (
                          <div
                            key={backup.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                backup.type === 'auto' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
                              )}>
                                {backup.type === 'auto' ? (
                                  <Clock className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Archive className="w-5 h-5 text-purple-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-surface-900 dark:text-surface-50">
                                  {backup.filename}
                                </p>
                                <p className="text-sm text-surface-500">
                                  {formatDate(backup.createdAt)} • {backup.sizeFormatted}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadBackup(backup.id, backup.filename)}
                                title="Download backup"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => restoreBackup(backup.id)}
                                disabled={isRestoringBackup}
                                title="Restore from backup"
                              >
                                {restoringBackupId === backup.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteBackup(backup.id)}
                                className="text-error-600 hover:text-error-700 hover:bg-error-50"
                                title="Delete backup"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="Auto Backup Settings"
                    description="Automatic backups run daily at midnight UTC (keeping last 7)"
                    icon={Clock}
                    iconColor="#F59E0B"
                  >
                    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-success-600" />
                        </div>
                        <div>
                          <p className="font-medium text-surface-900 dark:text-surface-50">Automatic Backups Enabled</p>
                          <p className="text-sm text-surface-500">
                            Daily backups at 00:00 UTC • Last 7 backups retained
                          </p>
                        </div>
                      </div>
                    </div>
                  </SettingSection>
                </motion.div>
              )}

              {selectedTab === 'holidays' && (
                <motion.div
                  key="holidays"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Success/Error Messages */}
                  <AnimatePresence>
                    {holidaySuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-4 bg-success-50 dark:bg-success-900/30 rounded-xl border border-success-200 dark:border-success-800"
                      >
                        <CheckCircle className="w-5 h-5 text-success-600" />
                        <span className="text-success-700 dark:text-success-300">{holidaySuccess}</span>
                        <button onClick={() => setHolidaySuccess(null)} className="ml-auto">
                          <X className="w-4 h-4 text-success-600" />
                        </button>
                      </motion.div>
                    )}
                    {holidayError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-4 bg-error-50 dark:bg-error-900/30 rounded-xl border border-error-200 dark:border-error-800"
                      >
                        <AlertTriangle className="w-5 h-5 text-error-600" />
                        <span className="text-error-700 dark:text-error-300">{holidayError}</span>
                        <button onClick={() => setHolidayError(null)} className="ml-auto">
                          <X className="w-4 h-4 text-error-600" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <SettingSection
                    title="Add Holiday"
                    description="Add public holidays to the platform calendar"
                    icon={Calendar}
                    iconColor="#F97316"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                            Holiday Title
                          </label>
                          <input
                            type="text"
                            value={holidayForm.title}
                            onChange={(e) => setHolidayForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g. Independence Day"
                            className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                            Date
                          </label>
                          <input
                            type="date"
                            value={holidayForm.date}
                            onChange={(e) => setHolidayForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                          Description (optional)
                        </label>
                        <input
                          type="text"
                          value={holidayForm.description}
                          onChange={(e) => setHolidayForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of the holiday"
                          className="w-full px-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <motion.button
                            type="button"
                            role="switch"
                            aria-checked={holidayForm.isRecurring}
                            onClick={() => setHolidayForm(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
                            className={cn(
                              'relative w-12 h-7 rounded-full transition-colors flex-shrink-0',
                              holidayForm.isRecurring ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
                            )}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.span
                              className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
                              animate={{ x: holidayForm.isRecurring ? 20 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                          <div>
                            <span className="font-medium text-surface-900 dark:text-surface-50">Recurring</span>
                            <p className="text-sm text-surface-500">Repeats every year on the same date</p>
                          </div>
                        </label>
                        <Button
                          onClick={addHoliday}
                          disabled={!holidayForm.title || !holidayForm.date || isAddingHoliday}
                          leftIcon={isAddingHoliday ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                        >
                          {isAddingHoliday ? 'Adding...' : 'Add Holiday'}
                        </Button>
                      </div>
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="Holiday List"
                    description="Manage platform holidays"
                    icon={Calendar}
                    iconColor="#10B981"
                  >
                    <div className="space-y-3">
                      {isLoadingHolidays ? (
                        <div className="p-8 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-surface-400 mb-2" />
                          <p className="text-surface-500">Loading holidays...</p>
                        </div>
                      ) : holidays.length === 0 ? (
                        <div className="p-8 text-center text-surface-500">
                          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No holidays configured</p>
                          <p className="text-sm mt-1">Add your first holiday above</p>
                        </div>
                      ) : (
                        holidays.map((holiday) => (
                          <div
                            key={holiday.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-surface-900 dark:text-surface-50">
                                    {holiday.title}
                                  </p>
                                  {holiday.isRecurring && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                      Recurring
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-surface-500">
                                  {new Date(holiday.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  {holiday.description && ` — ${holiday.description}`}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteHoliday(holiday.id)}
                              className="text-error-600 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-900/20"
                              title="Delete holiday"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </SettingSection>
                </motion.div>
              )}

              {selectedTab === 'system' && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SettingSection
                    title="System Status"
                    description="Current system health and status"
                    icon={Activity}
                    iconColor="#10B981"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SystemStatusCard
                        label="Web Server"
                        status="online"
                        value="Operational"
                        icon={Server}
                      />
                      <SystemStatusCard
                        label="Database"
                        status="online"
                        value="Connected"
                        icon={Database}
                      />
                      <SystemStatusCard
                        label="Cache"
                        status="online"
                        value="Active"
                        icon={Zap}
                      />
                      <SystemStatusCard
                        label="Storage"
                        status="online"
                        value="Available"
                        icon={HardDrive}
                      />
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="System Information"
                    description="Platform version and environment details"
                    icon={Info}
                    iconColor="#3B82F6"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Version', value: 'v1.0.0' },
                        { label: 'Environment', value: 'Production' },
                        { label: 'Node.js', value: 'v18+' },
                        { label: 'React', value: 'v18.3.1' },
                      ].map((item) => (
                        <div key={item.label} className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                          <p className="text-xs text-surface-500 uppercase tracking-wider">{item.label}</p>
                          <p className="font-semibold text-surface-900 dark:text-surface-50 mt-1">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </SettingSection>

                  <SettingSection
                    title="Danger Zone"
                    description="Irreversible actions - proceed with caution"
                    icon={AlertTriangle}
                    iconColor="#EF4444"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20">
                        <div>
                          <p className="font-medium text-error-900 dark:text-error-100">Clear All Cache</p>
                          <p className="text-sm text-error-700 dark:text-error-300">
                            Remove all cached data. Users may experience slower load times temporarily.
                          </p>
                        </div>
                        <Button variant="outline" className="border-error-300 text-error-600 hover:bg-error-100">
                          Clear Cache
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20">
                        <div>
                          <p className="font-medium text-error-900 dark:text-error-100">Reset All Settings</p>
                          <p className="text-sm text-error-700 dark:text-error-300">
                            Restore all settings to their default values. This cannot be undone.
                          </p>
                        </div>
                        <Button variant="outline" className="border-error-300 text-error-600 hover:bg-error-100">
                          Reset All
                        </Button>
                      </div>
                    </div>
                  </SettingSection>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
