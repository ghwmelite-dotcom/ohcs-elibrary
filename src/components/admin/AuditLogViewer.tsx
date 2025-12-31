/**
 * Audit Log Viewer Component
 * Admin interface for viewing and filtering audit logs
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  Bug,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Globe,
  Monitor,
  Clock,
  FileText,
  X,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import { useAuthStore } from '@/stores/authStore';
import type {
  AuditLog,
  AuditLogsResponse,
  AuditStats,
  AuditCategory,
  AuditSeverity,
  AuditStatus,
} from '@/types/audit';

const API_URL = import.meta.env.VITE_API_URL || '';

// Severity icons and colors
const severityConfig: Record<AuditSeverity, { icon: typeof Info; color: string; bgColor: string }> = {
  debug: { icon: Bug, color: 'text-surface-500', bgColor: 'bg-surface-100 dark:bg-surface-800' },
  info: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  error: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  critical: { icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-200 dark:bg-red-900/50' },
};

// Category colors
const categoryColors: Record<AuditCategory, string> = {
  auth: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  document: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  forum: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  group: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  security: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  system: 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
  api: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

interface AuditLogViewerProps {
  className?: string;
}

export function AuditLogViewer({ className }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AuditCategory | ''>('');
  const [severity, setSeverity] = useState<AuditSeverity | ''>('');
  const [status, setStatus] = useState<AuditStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Detail view
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const getAuthHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '25');
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (severity) params.set('severity', severity);
      if (status) params.set('status', status);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`${API_URL}/api/v1/audit/logs?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data: AuditLogsResponse = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, severity, status, startDate, endDate]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/audit/stats?days=30`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch audit stats');

      const data: AuditStats = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSeverity('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.set('format', 'csv');
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const token = useAuthStore.getState().token;
      if (token) params.set('token', token);

      window.open(`${API_URL}/api/v1/audit/export?${params.toString()}`, '_blank');
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Audit Logs
          </h2>
          <p className="text-surface-500 mt-1">
            {total.toLocaleString()} total entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <p className="text-sm text-surface-500">Total Logs (30d)</p>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              {stats.totalLogs.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <p className="text-sm text-surface-500">Warnings</p>
            <p className="text-2xl font-bold text-amber-600">
              {(stats.bySeverity.warning || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <p className="text-sm text-surface-500">Errors</p>
            <p className="text-2xl font-bold text-red-600">
              {((stats.bySeverity.error || 0) + (stats.bySeverity.critical || 0)).toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <p className="text-sm text-surface-500">Failed Actions</p>
            <p className="text-2xl font-bold text-orange-600">
              {((stats.byStatus.failure || 0) + (stats.byStatus.error || 0)).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filters
          </Button>
          <Button type="submit">Search</Button>
        </form>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AuditCategory | '')}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                  >
                    <option value="">All</option>
                    <option value="auth">Auth</option>
                    <option value="user">User</option>
                    <option value="document">Document</option>
                    <option value="admin">Admin</option>
                    <option value="security">Security</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as AuditSeverity | '')}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                  >
                    <option value="">All</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AuditStatus | '')}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                  >
                    <option value="">All</option>
                    <option value="success">Success</option>
                    <option value="failure">Failure</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-surface-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-surface-500">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                {logs.map((log) => {
                  const SeverityIcon = severityConfig[log.severity].icon;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-surface-50 dark:hover:bg-surface-700/50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm text-surface-500 whitespace-nowrap">
                        {formatRelativeTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            severityConfig[log.severity].bgColor,
                            severityConfig[log.severity].color
                          )}
                        >
                          <SeverityIcon className="w-3 h-3" />
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            categoryColors[log.category]
                          )}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-900 dark:text-surface-100">
                        {log.userEmail || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">
                        {log.resourceType ? `${log.resourceType}:${log.resourceId?.slice(0, 8)}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            log.status === 'success'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : log.status === 'failure'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500 font-mono">
                        {log.ipAddress?.slice(0, 15) || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
            <p className="text-sm text-surface-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedLog(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-surface-800 z-50 shadow-xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  Log Details
                </h3>
                <button onClick={() => setSelectedLog(null)}>
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Action & Category */}
                <div>
                  <span
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium',
                      categoryColors[selectedLog.category]
                    )}
                  >
                    {selectedLog.action}
                  </span>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-surface-400" />
                    <span className="text-surface-600 dark:text-surface-400">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-surface-400" />
                    <span className="text-surface-600 dark:text-surface-400">
                      {selectedLog.userEmail || 'System'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-surface-400" />
                    <span className="text-surface-600 dark:text-surface-400 font-mono">
                      {selectedLog.ipAddress || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-surface-400" />
                    <span className="text-surface-600 dark:text-surface-400">
                      {selectedLog.userRole || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Resource */}
                {selectedLog.resourceType && (
                  <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Resource
                    </h4>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-surface-400" />
                      <span className="text-surface-600 dark:text-surface-400">
                        {selectedLog.resourceType}: {selectedLog.resourceName || selectedLog.resourceId}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {selectedLog.errorMessage && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                      Error Message
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {selectedLog.errorMessage}
                    </p>
                  </div>
                )}

                {/* User Agent */}
                {selectedLog.userAgent && (
                  <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      User Agent
                    </h4>
                    <p className="text-xs text-surface-500 font-mono break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                )}

                {/* Request Info */}
                {selectedLog.requestPath && (
                  <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Request
                    </h4>
                    <p className="text-sm text-surface-600 dark:text-surface-400 font-mono">
                      {selectedLog.requestMethod} {selectedLog.requestPath}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                {selectedLog.metadata && (
                  <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Additional Data
                    </h4>
                    <pre className="text-xs text-surface-600 dark:text-surface-400 overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* IDs */}
                <div className="text-xs text-surface-400 space-y-1">
                  <p>Log ID: {selectedLog.id}</p>
                  {selectedLog.userId && <p>User ID: {selectedLog.userId}</p>}
                  {selectedLog.sessionId && <p>Session ID: {selectedLog.sessionId}</p>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
