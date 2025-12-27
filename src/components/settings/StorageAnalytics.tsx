import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive,
  FileText,
  Image,
  User,
  Trash2,
  Download,
  RefreshCw,
  AlertTriangle,
  Package,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { StorageUsage, DataExport } from '@/stores/settingsStore';

interface StorageAnalyticsProps {
  storage: StorageUsage | null;
  exports: DataExport[];
  isLoading: boolean;
  isExportsLoading: boolean;
  onRequestExport: (type: string, format: string) => Promise<string>;
  onRefresh: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function StorageAnalytics({
  storage,
  exports,
  isLoading,
  isExportsLoading,
  onRequestExport,
  onRefresh
}: StorageAnalyticsProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState('full');
  const [exportFormat, setExportFormat] = useState('zip');
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestExport = async () => {
    setIsRequesting(true);
    try {
      await onRequestExport(exportType, exportFormat);
      setIsExportModalOpen(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const storageBreakdown = storage ? [
    { label: 'Documents', bytes: storage.documentsBytes, color: 'bg-primary-500', icon: FileText },
    { label: 'Attachments', bytes: storage.attachmentsBytes, color: 'bg-secondary-500', icon: Image },
    { label: 'Profile', bytes: storage.avatarBytes, color: 'bg-warning-500', icon: User },
    { label: 'Cache', bytes: storage.cacheBytes, color: 'bg-surface-400', icon: Package },
  ] : [];

  const getExportStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success-600 bg-success-50 dark:bg-success-900/20';
      case 'processing': return 'text-primary-600 bg-primary-50 dark:bg-primary-900/20';
      case 'failed': return 'text-error-600 bg-error-50 dark:bg-error-900/20';
      case 'expired': return 'text-surface-500 bg-surface-100 dark:bg-surface-700';
      default: return 'text-surface-600 bg-surface-50 dark:bg-surface-700';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Storage Usage</h3>
              <p className="text-sm text-surface-500">
                {storage ? `${formatBytes(storage.totalBytes)} of ${formatBytes(storage.quotaBytes)} used` : 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {storage && (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-4 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden flex">
                {storageBreakdown.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.bytes / storage.quotaBytes) * 100}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn('h-full', item.color)}
                    title={`${item.label}: ${formatBytes(item.bytes)}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-surface-900 dark:text-white">
                  {storage.usagePercent.toFixed(1)}% used
                </span>
                <span className="text-sm text-surface-500">
                  {formatBytes(storage.quotaBytes - storage.totalBytes)} available
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {storageBreakdown.map((item) => (
                <div key={item.label} className="p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('w-3 h-3 rounded-full', item.color)} />
                    <item.icon className="w-4 h-4 text-surface-400" />
                  </div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {formatBytes(item.bytes)}
                  </p>
                  <p className="text-xs text-surface-500">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Warning if near quota */}
            {storage.usagePercent > 80 && (
              <div className={cn(
                'mt-6 flex items-center gap-3 p-4 rounded-xl border',
                storage.usagePercent > 95
                  ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
                  : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
              )}>
                <AlertTriangle className={cn(
                  'w-5 h-5',
                  storage.usagePercent > 95 ? 'text-error-500' : 'text-warning-500'
                )} />
                <div>
                  <p className={cn(
                    'font-medium',
                    storage.usagePercent > 95
                      ? 'text-error-700 dark:text-error-300'
                      : 'text-warning-700 dark:text-warning-300'
                  )}>
                    {storage.usagePercent > 95 ? 'Storage Almost Full' : 'Running Low on Storage'}
                  </p>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    Consider deleting old documents or clearing cache
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Data Export */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Export Your Data</h3>
              <p className="text-sm text-surface-500">Download a copy of your data</p>
            </div>
          </div>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Request Export
          </button>
        </div>

        {/* Export History */}
        {isExportsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-surface-400 animate-spin" />
          </div>
        ) : exports.length > 0 ? (
          <div className="space-y-3">
            {exports.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', getExportStatusColor(exp.status))}>
                    {exp.status === 'processing' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Package className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white capitalize">
                      {exp.type} Export ({exp.format.toUpperCase()})
                    </p>
                    <p className="text-xs text-surface-500">
                      {new Date(exp.requestedAt).toLocaleDateString()} •{' '}
                      <span className={cn(
                        'capitalize',
                        exp.status === 'completed' ? 'text-success-600' :
                        exp.status === 'failed' ? 'text-error-600' :
                        exp.status === 'processing' ? 'text-primary-600' :
                        'text-surface-500'
                      )}>
                        {exp.status}
                      </span>
                      {exp.fileSize && ` • ${formatBytes(exp.fileSize)}`}
                    </p>
                  </div>
                </div>
                {exp.status === 'completed' && exp.fileUrl && (
                  <a
                    href={exp.fileUrl}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
                {exp.status === 'processing' && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${exp.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-surface-500">{exp.progress}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-surface-500">
            <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No export history</p>
          </div>
        )}
      </div>

      {/* Delete Account */}
      <div className="bg-error-50 dark:bg-error-900/20 rounded-xl p-6 border border-error-200 dark:border-error-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-error-100 dark:bg-error-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-error-600 dark:text-error-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-error-900 dark:text-error-100">Delete Account</h3>
            <p className="text-sm text-error-700 dark:text-error-300 mt-1 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="flex items-center gap-2 px-4 py-2 bg-error-600 text-white font-medium rounded-lg hover:bg-error-700 transition-colors">
              <Trash2 className="w-4 h-4" />
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setIsExportModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-surface-800 rounded-2xl shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
                Request Data Export
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    What to export
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['full', 'profile', 'documents', 'activity'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setExportType(type)}
                        className={cn(
                          'px-4 py-2.5 rounded-lg border-2 text-sm font-medium capitalize transition-all',
                          exportType === type
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-surface-300'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['zip', 'json', 'pdf'].map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={cn(
                          'px-4 py-2.5 rounded-lg border-2 text-sm font-medium uppercase transition-all',
                          exportFormat === format
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-surface-300'
                        )}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl text-sm text-surface-600 dark:text-surface-400">
                  <p>Your export will be ready within a few minutes. You'll receive a notification when it's complete.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestExport}
                    disabled={isRequesting}
                    className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {isRequesting ? 'Requesting...' : 'Request Export'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
