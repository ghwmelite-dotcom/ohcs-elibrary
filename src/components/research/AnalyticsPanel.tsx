import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  BookOpen,
  MessageSquare,
  Brain,
  Target,
  Calendar,
  Activity,
  Download,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import type { ResearchProjectAnalytics, ResearchContributor, ResearchActivityPoint } from '@/types';

interface AnalyticsPanelProps {
  projectId: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://ohcs-elibrary-api.ghwmelite.workers.dev';

export function AnalyticsPanel({ projectId }: AnalyticsPanelProps) {
  const { token } = useAuthStore();
  const [analytics, setAnalytics] = useState<ResearchProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllContributors, setShowAllContributors] = useState(false);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/api/v1/research/projects/${projectId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
        <p className="text-surface-500 dark:text-surface-400">{error || 'No analytics data available'}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const { metrics, contributors, activityTimeline } = analytics;

  // Calculate max activity for chart scaling
  const maxActivity = Math.max(...activityTimeline.map(a => a.count), 1);

  const statCards = [
    { label: 'Notes', value: metrics.notes, icon: FileText, color: 'bg-blue-500' },
    { label: 'Citations', value: metrics.citations, icon: BookOpen, color: 'bg-green-500' },
    { label: 'Discussions', value: metrics.discussions, icon: MessageSquare, color: 'bg-purple-500' },
    { label: 'Literature', value: metrics.literature, icon: BookOpen, color: 'bg-orange-500' },
    { label: 'AI Insights', value: metrics.insights, icon: Brain, color: 'bg-pink-500' },
    { label: 'Briefs', value: metrics.briefs, icon: FileText, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            Project Analytics
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Track progress and team contributions
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="p-2 text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-5 text-white col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between mb-3">
            <Target className="w-6 h-6 opacity-80" />
            <span className="text-3xl font-bold">{metrics.completionPercentage}%</span>
          </div>
          <p className="text-primary-100 text-sm">Overall Progress</p>
          <div className="mt-3 h-2 bg-primary-400/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.completionPercentage}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </motion.div>

        {/* Days Active Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-50 dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-surface-400" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{metrics.daysActive}</p>
          <p className="text-sm text-surface-500 dark:text-surface-400">Days Active</p>
        </motion.div>

        {/* Recent Activity Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-50 dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-surface-400" />
            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
              7 days
            </span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{metrics.recentActivity}</p>
          <p className="text-sm text-surface-500 dark:text-surface-400">Recent Activities</p>
        </motion.div>

        {/* Milestones Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-50 dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-surface-400" />
            <span className="text-xs text-surface-400">
              {metrics.milestones.completed}/{metrics.milestones.total}
            </span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{metrics.milestones.progress}%</p>
          <p className="text-sm text-surface-500 dark:text-surface-400">Milestones Done</p>
          <div className="mt-2 h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary-500 rounded-full transition-all"
              style={{ width: `${metrics.milestones.progress}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', stat.color)}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-bold text-surface-900 dark:text-surface-50">{stat.value}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity Timeline Chart */}
      {activityTimeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-50 dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700"
        >
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
            Activity Timeline (Last 30 Days)
          </h3>
          <div className="h-40 flex items-end gap-1">
            {activityTimeline.map((point, index) => {
              const height = (point.count / maxActivity) * 100;
              return (
                <motion.div
                  key={point.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 5)}%` }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className="flex-1 bg-primary-500/80 hover:bg-primary-500 rounded-t cursor-pointer transition-colors group relative"
                  title={`${point.date}: ${point.count} activities`}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {point.count} activities
                    <br />
                    <span className="text-surface-400">{new Date(point.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-surface-400">
            <span>{activityTimeline[0]?.date ? new Date(activityTimeline[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
            <span>{activityTimeline[activityTimeline.length - 1]?.date ? new Date(activityTimeline[activityTimeline.length - 1].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
          </div>
        </motion.div>
      )}

      {/* Top Contributors */}
      {contributors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-50 dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <Users className="w-5 h-5 text-surface-400" />
              Top Contributors
            </h3>
            {contributors.length > 5 && (
              <button
                onClick={() => setShowAllContributors(!showAllContributors)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                {showAllContributors ? 'Show Less' : 'Show All'}
                {showAllContributors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {(showAllContributors ? contributors : contributors.slice(0, 5)).map((contributor, index) => {
                const maxContributions = Math.max(...contributors.map(c => c.contributions));
                const percentage = (contributor.contributions / maxContributions) * 100;

                return (
                  <motion.div
                    key={contributor.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex items-center gap-3 w-40 flex-shrink-0">
                      <span className="text-sm font-medium text-surface-400 w-5">{index + 1}</span>
                      {contributor.avatar ? (
                        <img
                          src={contributor.avatar}
                          alt={contributor.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {contributor.displayName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                        {contributor.displayName}
                      </span>
                    </div>
                    <div className="flex-1 h-6 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                        className={cn(
                          'h-full rounded-full',
                          index === 0 ? 'bg-secondary-500' : index === 1 ? 'bg-primary-500' : 'bg-surface-400 dark:bg-surface-500'
                        )}
                      />
                    </div>
                    <span className="text-sm font-medium text-surface-600 dark:text-surface-400 w-16 text-right">
                      {contributor.contributions}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default AnalyticsPanel;
