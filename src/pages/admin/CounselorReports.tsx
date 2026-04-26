import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Download,
  Calendar,
  Users,
  BarChart3,
  User,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { generateUserReport, generateAggregateReport } from '@/services/reportGenerator';
import type { UserWellnessReport, AggregateWellnessReport, CounselorTopic } from '@/types';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

interface UserSearchResult {
  id: string;
  displayName: string;
  email: string;
  title?: string;
  department?: string;
  sessionCount: number;
  avgMood: number | null;
}

const topicLabels: Record<CounselorTopic, string> = {
  work_stress: 'Work Stress',
  career: 'Career',
  relationships: 'Relationships',
  personal: 'Personal',
  financial: 'Financial',
  general: 'General',
};

const moodEmojis: Record<number, string> = {
  1: '...',
  2: '...',
  3: '...',
  4: '...',
  5: '...',
};

// Animated Background
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.12) 0%, transparent 70%)',
          top: '-15%',
          right: '-10%',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export default function CounselorReports() {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'individual' | 'aggregate'>('individual');

  // Individual report state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [userReport, setUserReport] = useState<UserWellnessReport | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Aggregate report state
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [aggregateReport, setAggregateReport] = useState<AggregateWellnessReport | null>(null);
  const [isLoadingAggregate, setIsLoadingAggregate] = useState(false);
  const [isGeneratingAggregatePdf, setIsGeneratingAggregatePdf] = useState(false);

  // Search users
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/counselor/reports/users?search=${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  // Load individual user report
  const loadUserReport = async (userId: string) => {
    setIsLoadingReport(true);
    try {
      const res = await fetch(`${API_BASE}/counselor/reports/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserReport(data);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Load aggregate report
  const loadAggregateReport = async () => {
    setIsLoadingAggregate(true);
    try {
      const res = await fetch(
        `${API_BASE}/counselor/reports/aggregate?from=${dateFrom}&to=${dateTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setAggregateReport(data);
      }
    } catch (error) {
      console.error('Failed to load aggregate report:', error);
    } finally {
      setIsLoadingAggregate(false);
    }
  };

  // Download individual PDF
  const handleDownloadUserPdf = async () => {
    if (!userReport) return;

    setIsGeneratingPdf(true);
    try {
      const blob = await generateUserReport(userReport);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wellness-report-${userReport.user.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download aggregate PDF
  const handleDownloadAggregatePdf = async () => {
    if (!aggregateReport) return;

    setIsGeneratingAggregatePdf(true);
    try {
      const blob = await generateAggregateReport(aggregateReport);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wellness-analytics-report-${dateFrom}-to-${dateTo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsGeneratingAggregatePdf(false);
    }
  };

  const TrendIcon = userReport?.summary.moodTrend === 'improving' ? TrendingUp :
                    userReport?.summary.moodTrend === 'declining' ? TrendingDown : Minus;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 relative">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                Wellness Reports
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Generate detailed wellness reports for users
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-1 mb-6 inline-flex"
        >
          <button
            onClick={() => setActiveTab('individual')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
              activeTab === 'individual'
                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
            )}
          >
            <User className="w-4 h-4" />
            Individual Report
          </button>
          <button
            onClick={() => setActiveTab('aggregate')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
              activeTab === 'aggregate'
                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Aggregate Analytics
          </button>
        </motion.div>

        {/* Individual Report Tab */}
        {activeTab === 'individual' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* User Search */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                  Search User
                </h3>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          loadUserReport(u.id);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className={cn(
                          'w-full p-3 rounded-lg text-left transition-colors',
                          selectedUser?.id === u.id
                            ? 'bg-teal-50 dark:bg-teal-900/30 border-2 border-teal-500'
                            : 'bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600'
                        )}
                      >
                        <p className="font-medium text-surface-900 dark:text-white">{u.displayName}</p>
                        <p className="text-sm text-surface-500">{u.email}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                          <span>{u.sessionCount} sessions</span>
                          {u.avgMood && <span>Avg mood: {u.avgMood.toFixed(1)}/5</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                    <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">
                      Selected: {selectedUser.displayName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Report Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                {isLoadingReport ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                  </div>
                ) : userReport ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-surface-900 dark:text-white">
                        Report Preview
                      </h3>
                      <Button onClick={handleDownloadUserPdf} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Download PDF
                      </Button>
                    </div>

                    {/* User Info */}
                    <div className="mb-6 p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                      <h4 className="font-medium text-surface-900 dark:text-white mb-2">
                        {userReport.user.name}
                      </h4>
                      <p className="text-sm text-surface-500">{userReport.user.email}</p>
                      {userReport.user.department && (
                        <p className="text-sm text-surface-500">{userReport.user.department}</p>
                      )}
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                          {userReport.summary.totalSessions}
                        </p>
                        <p className="text-sm text-teal-600 dark:text-teal-400">Total Sessions</p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {userReport.summary.totalMessages}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Messages</p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                          {userReport.summary.averageMood?.toFixed(1) || 'N/A'}
                          {userReport.summary.moodTrend && (
                            <TrendIcon className={cn(
                              'w-5 h-5',
                              userReport.summary.moodTrend === 'improving' && 'text-green-500',
                              userReport.summary.moodTrend === 'declining' && 'text-red-500',
                              userReport.summary.moodTrend === 'stable' && 'text-surface-400 dark:text-surface-500'
                            )} />
                          )}
                        </p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">Average Mood</p>
                      </div>
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                          {userReport.summary.mostCommonTopic
                            ? topicLabels[userReport.summary.mostCommonTopic as CounselorTopic] || userReport.summary.mostCommonTopic
                            : 'N/A'}
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">Common Topic</p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                          {userReport.summary.escalationCount}
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">Escalations</p>
                      </div>
                    </div>

                    {/* Recent Sessions */}
                    {userReport.sessions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-surface-900 dark:text-white mb-3">
                          Recent Sessions
                        </h4>
                        <div className="space-y-2">
                          {userReport.sessions.slice(0, 5).map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-surface-900 dark:text-white text-sm">
                                  {s.topic ? topicLabels[s.topic as CounselorTopic] || s.topic : 'General'}
                                </p>
                                <p className="text-xs text-surface-500">
                                  {new Date(s.date).toLocaleDateString()} - {s.messageCount} messages
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {s.mood && (
                                  <span className="text-sm">{s.mood}/5</span>
                                )}
                                <span className={cn(
                                  'px-2 py-0.5 rounded text-xs font-medium',
                                  s.status === 'active' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                                  s.status === 'completed' && 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-400',
                                  s.status === 'escalated' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                )}>
                                  {s.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
                    <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">
                      No report loaded
                    </h3>
                    <p className="text-surface-500">
                      Search and select a user to generate their wellness report
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Aggregate Report Tab */}
        {activeTab === 'aggregate' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Date Range */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Date Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-surface-500">to</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <Button onClick={loadAggregateReport} disabled={isLoadingAggregate}>
                  {isLoadingAggregate ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2" />
                  )}
                  Generate Report
                </Button>
              </div>
            </div>

            {/* Aggregate Report Content */}
            {aggregateReport && (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-surface-900 dark:text-white">
                    Analytics Overview
                  </h3>
                  <Button onClick={handleDownloadAggregatePdf} disabled={isGeneratingAggregatePdf}>
                    {isGeneratingAggregatePdf ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                      {aggregateReport.overview.totalUsers}
                    </p>
                    <p className="text-xs text-teal-600 dark:text-teal-400">Total Users</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {aggregateReport.overview.totalSessions}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Sessions</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {aggregateReport.overview.totalMessages}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Messages</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {aggregateReport.moodAnalytics.averageMood?.toFixed(1) || 'N/A'}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Avg Mood</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {aggregateReport.overview.escalationRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">Escalation Rate</p>
                  </div>
                  <div className="p-4 bg-surface-100 dark:bg-surface-700/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-surface-700 dark:text-surface-300">
                      {aggregateReport.overview.anonymousSessionRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-surface-600 dark:text-surface-400">Anonymous</p>
                  </div>
                </div>

                {/* Topic Breakdown */}
                <div className="mb-8">
                  <h4 className="font-medium text-surface-900 dark:text-white mb-4">
                    Topic Distribution
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {aggregateReport.topicBreakdown.map((t) => (
                      <div
                        key={t.topic}
                        className="p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg"
                      >
                        <p className="font-medium text-surface-900 dark:text-white text-sm">
                          {topicLabels[t.topic as CounselorTopic] || t.topic}
                        </p>
                        <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                          {t.count}
                        </p>
                        <p className="text-xs text-surface-500">{t.percentage.toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Escalation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-surface-900 dark:text-white mb-3">
                      Escalations by Urgency
                    </h4>
                    <div className="space-y-2">
                      {['low', 'normal', 'high', 'crisis'].map((urgency) => {
                        const count = aggregateReport.escalationAnalytics.byUrgency[urgency as keyof typeof aggregateReport.escalationAnalytics.byUrgency];
                        const total = aggregateReport.escalationAnalytics.total || 1;
                        const pct = (count / total) * 100;
                        return (
                          <div key={urgency} className="flex items-center gap-3">
                            <span className="text-sm text-surface-600 dark:text-surface-400 w-16 capitalize">
                              {urgency}
                            </span>
                            <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  urgency === 'low' && 'bg-green-500',
                                  urgency === 'normal' && 'bg-blue-500',
                                  urgency === 'high' && 'bg-amber-500',
                                  urgency === 'crisis' && 'bg-red-500'
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-surface-900 dark:text-white w-8">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-surface-900 dark:text-white mb-3">
                      Escalations by Status
                    </h4>
                    <div className="space-y-2">
                      {['pending', 'acknowledged', 'scheduled', 'resolved'].map((status) => {
                        const count = aggregateReport.escalationAnalytics.byStatus[status as keyof typeof aggregateReport.escalationAnalytics.byStatus];
                        const total = aggregateReport.escalationAnalytics.total || 1;
                        const pct = (count / total) * 100;
                        return (
                          <div key={status} className="flex items-center gap-3">
                            <span className="text-sm text-surface-600 dark:text-surface-400 w-24 capitalize">
                              {status}
                            </span>
                            <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  status === 'pending' && 'bg-amber-500',
                                  status === 'acknowledged' && 'bg-blue-500',
                                  status === 'scheduled' && 'bg-purple-500',
                                  status === 'resolved' && 'bg-green-500'
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-surface-900 dark:text-white w-8">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Peak Usage */}
                {aggregateReport.peakUsageTimes.busiestDays.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                    <h4 className="font-medium text-surface-900 dark:text-white mb-2">
                      Peak Usage
                    </h4>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      Busiest days: <span className="font-medium text-surface-900 dark:text-white">{aggregateReport.peakUsageTimes.busiestDays.join(', ')}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
