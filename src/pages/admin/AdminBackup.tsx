import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Clock,
  Calendar,
  HardDrive,
  Shield,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  Plus,
  Lock,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.PROD
  ? 'https://api.ohcselibrary.xyz/api/v1'
  : '/api/v1';

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
        style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }}
        animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-25 dark:opacity-15"
        style={{ background: 'radial-gradient(circle, #006B3F 0%, transparent 70%)' }}
        animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-16 left-1/3 w-72 h-72 rounded-full opacity-20 dark:opacity-10"
        style={{ background: 'radial-gradient(circle, #CE1126 0%, transparent 70%)' }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// Restore Confirmation Dialog
function RestoreDialog({
  isOpen,
  onClose,
  onConfirm,
  backupName,
  isRestoring,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  backupName: string;
  isRestoring: boolean;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-warning-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    Restore Backup
                  </h3>
                  <p className="text-sm text-surface-500">{backupName}</p>
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
                    <p className="text-sm font-medium text-error-800 dark:text-error-200 mb-2">
                      Warning: This action is destructive
                    </p>
                    <ul className="text-sm text-error-700 dark:text-error-300 space-y-1 list-disc list-inside">
                      <li>All current data will be overwritten</li>
                      <li>This action cannot be undone</li>
                      <li>Users may experience temporary downtime</li>
                      <li>Only super admins can perform this action</li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" fullWidth onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => setStep(2)}
                      className="bg-warning-600 hover:bg-warning-700"
                    >
                      I Understand, Continue
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    Enter your password to confirm the restore operation.
                  </p>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={cn(
                        'w-full pl-10 pr-10 py-3 rounded-xl border',
                        'border-surface-300 dark:border-surface-600',
                        'bg-surface-50 dark:bg-surface-700',
                        'text-surface-900 dark:text-surface-50',
                        'placeholder:text-surface-400',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                      )}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && password) {
                          onConfirm(password);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" fullWidth onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      fullWidth
                      onClick={() => onConfirm(password)}
                      disabled={!password || isRestoring}
                      className="bg-error-600 hover:bg-error-700 text-white"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Restoring...
                        </>
                      ) : (
                        'Confirm Restore'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Delete Confirmation Dialog
function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  backupName,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  backupName: string;
  isDeleting: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-error-100 dark:bg-error-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-error-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    Delete Backup
                  </h3>
                </div>
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                Are you sure you want to delete <span className="font-medium text-surface-900 dark:text-surface-50">{backupName}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" fullWidth onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="bg-error-600 hover:bg-error-700 text-white"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AdminBackup() {
  const { token, user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  // Data state
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [isLoadingBackups, setIsLoadingBackups] = useState(true);

  // Action state
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [isDeletingBackup, setIsDeletingBackup] = useState(false);

  // Dialog state
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null);

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchBackups();
    fetchBackupStats();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const fetchBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const response = await fetch(`${API_BASE}/backup`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const fetchBackupStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/backup/stats/summary`, {
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
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch(`${API_BASE}/backup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'manual' }),
      });
      if (response.ok) {
        const data = await response.json();
        setSuccessMsg(`Backup created: ${data.backup.filename} (${data.backup.sizeFormatted})`);
        fetchBackups();
        fetchBackupStats();
      } else {
        const error = await response.json();
        setErrorMsg(error.error || 'Failed to create backup');
      }
    } catch {
      setErrorMsg('Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId: string, password: string) => {
    setIsRestoringBackup(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch(`${API_BASE}/backup/restore/${encodeURIComponent(backupId)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        const data = await response.json();
        setSuccessMsg(`Backup restored successfully. ${data.totalRestored ?? ''} records restored.`);
        setRestoreTarget(null);
      } else {
        const error = await response.json();
        setErrorMsg(error.error || 'Failed to restore backup');
      }
    } catch {
      setErrorMsg('Failed to restore backup');
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const downloadBackup = async (backupId: string, filename: string) => {
    try {
      const response = await fetch(`${API_BASE}/backup/${encodeURIComponent(backupId)}`, {
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
      } else {
        setErrorMsg('Failed to download backup');
      }
    } catch {
      setErrorMsg('Failed to download backup');
    }
  };

  const deleteBackup = async (backupId: string) => {
    setIsDeletingBackup(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`${API_BASE}/backup/${encodeURIComponent(backupId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setSuccessMsg('Backup deleted successfully');
        setDeleteTarget(null);
        fetchBackups();
        fetchBackupStats();
      } else {
        setErrorMsg('Failed to delete backup');
      }
    } catch {
      setErrorMsg('Failed to delete backup');
    } finally {
      setIsDeletingBackup(false);
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

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
                Backup & Restore
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Manage database backups and restore operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                fetchBackups();
                fetchBackupStats();
              }}
            >
              Refresh
            </Button>
            <Button
              leftIcon={
                isCreatingBackup ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )
              }
              onClick={createBackup}
              disabled={isCreatingBackup}
            >
              {isCreatingBackup ? 'Creating...' : 'Create Backup'}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-4 bg-success-50 dark:bg-success-900/30 rounded-xl border border-success-200 dark:border-success-800"
            >
              <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
              <span className="text-success-700 dark:text-success-300 flex-1">{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)}>
                <X className="w-4 h-4 text-success-600" />
              </button>
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-4 bg-error-50 dark:bg-error-900/30 rounded-xl border border-error-200 dark:border-error-800"
            >
              <AlertTriangle className="w-5 h-5 text-error-600 flex-shrink-0" />
              <span className="text-error-700 dark:text-error-300 flex-1">{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)}>
                <X className="w-4 h-4 text-error-600" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Archive className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-surface-500">Total Backups</span>
            </div>
            <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">
              {backupStats?.totalBackups ?? '--'}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
              <span>{backupStats?.manualBackups ?? 0} manual</span>
              <span className="w-1 h-1 rounded-full bg-surface-300" />
              <span>{backupStats?.autoBackups ?? 0} automatic</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-surface-500">Last Backup</span>
            </div>
            <p className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              {backupStats?.lastBackup
                ? formatDate(backupStats.lastBackup.createdAt)
                : 'No backups yet'}
            </p>
            {backupStats?.lastBackup && (
              <p className="text-xs text-surface-500 mt-1">
                {backupStats.lastBackup.type === 'auto' ? 'Automatic' : 'Manual'}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-surface-500">Total Size</span>
            </div>
            <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">
              {backupStats?.totalSizeFormatted ?? '--'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-success-600" />
              </div>
              <span className="text-sm font-medium text-surface-500">Auto Backup</span>
            </div>
            <p className="text-lg font-semibold text-success-600 dark:text-success-400">
              Enabled
            </p>
            <p className="text-xs text-surface-500 mt-1">
              Daily at midnight UTC (last 7 kept)
            </p>
          </motion.div>
        </div>

        {/* Backup List Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                    Backup History
                  </h2>
                  <p className="text-sm text-surface-500">
                    {backups.length} backup{backups.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoadingBackups ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-surface-400 mb-3" />
              <p className="text-surface-500">Loading backups...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="p-12 text-center">
              <Archive className="w-12 h-12 mx-auto mb-3 text-surface-300" />
              <p className="text-surface-600 dark:text-surface-400 font-medium">
                No backups yet
              </p>
              <p className="text-sm text-surface-500 mt-1">
                Create your first backup to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-700/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Backup
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                  {backups.map((backup, index) => (
                    <motion.tr
                      key={backup.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center',
                              backup.type === 'auto'
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'bg-purple-100 dark:bg-purple-900/30'
                            )}
                          >
                            {backup.type === 'auto' ? (
                              <Clock className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Archive className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          <span className="font-medium text-surface-900 dark:text-surface-50 text-sm">
                            {backup.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-400">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-400">
                        {backup.sizeFormatted}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            backup.type === 'auto'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          )}
                        >
                          {backup.type === 'auto' ? 'Automatic' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadBackup(backup.id, backup.filename)}
                            title="Download backup"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <div className="relative group">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (isSuperAdmin) {
                                  setRestoreTarget(backup);
                                }
                              }}
                              disabled={!isSuperAdmin}
                              title={
                                isSuperAdmin
                                  ? 'Restore from backup'
                                  : 'Only super admins can restore backups'
                              }
                              className={cn(
                                !isSuperAdmin && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            {isSuperAdmin && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                                <Shield className="w-2 h-2 text-white" />
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(backup)}
                            className="text-error-600 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-900/20"
                            title="Delete backup"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Auto Backup Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                Automatic Backup Schedule
              </h3>
              <p className="text-sm text-surface-500 mt-0.5">
                Automatic backups run daily and the system retains the last 7
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="font-medium text-surface-900 dark:text-surface-50">
                  Auto-backup is active
                </p>
                <p className="text-sm text-surface-500">
                  Runs daily at midnight UTC. Last 7 automatic backups are retained.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dialogs */}
      <RestoreDialog
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={(password) => {
          if (restoreTarget) {
            restoreBackup(restoreTarget.id, password);
          }
        }}
        backupName={restoreTarget?.filename ?? ''}
        isRestoring={isRestoringBackup}
      />
      <DeleteDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteBackup(deleteTarget.id);
          }
        }}
        backupName={deleteTarget?.filename ?? ''}
        isDeleting={isDeletingBackup}
      />
    </div>
  );
}
