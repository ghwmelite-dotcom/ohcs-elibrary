import { motion } from 'framer-motion';
import {
  Activity,
  LogIn,
  LogOut,
  Key,
  Shield,
  Settings,
  UserCog,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Ban,
  ChevronDown,
  Loader2,
  MapPin,
  Monitor,
  Clock,
  Download
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import type { AccountActivity as ActivityType } from '@/stores/settingsStore';

interface AccountActivityProps {
  activities: ActivityType[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onLoadMore: () => void;
}

const actionIcons: Record<string, typeof LogIn> = {
  login: LogIn,
  logout: LogOut,
  password_change: Key,
  password_change_failed: Key,
  '2fa_enabled': Shield,
  '2fa_disabled': Shield,
  settings_update: Settings,
  session_revoke: LogOut,
  sessions_revoke_all: LogOut,
  data_export: Download,
  profile_update: UserCog,
  disconnect_account: Ban,
};

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    login: 'Signed in',
    logout: 'Signed out',
    password_change: 'Password changed',
    password_change_failed: 'Password change failed',
    '2fa_enabled': 'Two-factor enabled',
    '2fa_disabled': 'Two-factor disabled',
    settings_update: 'Settings updated',
    session_revoke: 'Session revoked',
    sessions_revoke_all: 'All sessions revoked',
    data_export: 'Data export requested',
    profile_update: 'Profile updated',
    disconnect_account: 'Account disconnected',
  };
  return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export function AccountActivity({
  activities,
  isLoading,
  page,
  totalPages,
  onLoadMore
}: AccountActivityProps) {
  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityType[]>);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-success-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-error-500" />;
      case 'blocked':
        return <Ban className="w-4 h-4 text-error-500" />;
      default:
        return null;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800';
      default:
        return 'bg-surface-50 dark:bg-surface-700/50 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-600';
    }
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Account Activity</h3>
            <p className="text-sm text-surface-500">Recent security and account events</p>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="p-6">
        {activities.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-4" />
            <p className="text-surface-500">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
                  <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-surface-200 dark:bg-surface-700" />

                  <div className="space-y-4">
                    {dayActivities.map((activity, index) => {
                      const ActionIcon = actionIcons[activity.action] || Settings;

                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            'relative flex gap-4 p-4 ml-3 rounded-xl border transition-colors',
                            getRiskLevelColor(activity.riskLevel)
                          )}
                        >
                          {/* Timeline dot */}
                          <div className={cn(
                            'absolute -left-5 top-5 w-4 h-4 rounded-full border-2 border-white dark:border-surface-800 flex items-center justify-center',
                            activity.status === 'success'
                              ? 'bg-success-500'
                              : activity.status === 'failed'
                              ? 'bg-error-500'
                              : 'bg-surface-400'
                          )}>
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>

                          {/* Icon */}
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                            activity.status === 'success'
                              ? 'bg-success-100 dark:bg-success-900/40'
                              : activity.status === 'failed'
                              ? 'bg-error-100 dark:bg-error-900/40'
                              : 'bg-surface-100 dark:bg-surface-700'
                          )}>
                            <ActionIcon className={cn(
                              'w-5 h-5',
                              activity.status === 'success'
                                ? 'text-success-600 dark:text-success-400'
                                : activity.status === 'failed'
                                ? 'text-error-600 dark:text-error-400'
                                : 'text-surface-500'
                            )} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-surface-900 dark:text-white">
                                  {getActionLabel(activity.action)}
                                </p>
                                {activity.description && (
                                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                              {getStatusIcon(activity.status)}
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-surface-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(activity.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {activity.ipAddress && (
                                <span className="flex items-center gap-1">
                                  <Monitor className="w-3 h-3" />
                                  {activity.ipAddress}
                                </span>
                              )}
                              {activity.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {activity.location}
                                </span>
                              )}
                              {activity.riskLevel !== 'low' && (
                                <span className={cn(
                                  'px-2 py-0.5 rounded-full font-medium',
                                  activity.riskLevel === 'critical'
                                    ? 'bg-error-200 dark:bg-error-800 text-error-700 dark:text-error-200'
                                    : activity.riskLevel === 'high'
                                    ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200'
                                    : 'bg-warning-200 dark:bg-warning-800 text-warning-700 dark:text-warning-200'
                                )}>
                                  {activity.riskLevel} risk
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {page < totalPages && (
          <div className="mt-8 text-center">
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
