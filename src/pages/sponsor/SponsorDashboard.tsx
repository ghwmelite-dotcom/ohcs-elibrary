import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Eye,
  MousePointerClick,
  GraduationCap,
  FileText,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  ChevronRight,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useSponsorDashboardStore } from '@/stores/sponsorshipStore';

// Stat Card Component
function StatCard3D({
  icon: Icon,
  title,
  value,
  change,
  changeLabel,
  color = 'green',
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  color?: 'green' | 'gold' | 'blue' | 'purple';
  delay?: number;
}) {
  const colorClasses = {
    green: {
      bg: 'bg-gradient-to-br from-ghana-green/10 to-green-100',
      icon: 'bg-ghana-green text-white',
      text: 'text-ghana-green',
    },
    gold: {
      bg: 'bg-gradient-to-br from-ghana-gold/10 to-amber-100',
      icon: 'bg-ghana-gold text-white',
      text: 'text-amber-600',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      icon: 'bg-blue-500 text-white',
      text: 'text-blue-600',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      icon: 'bg-purple-500 text-white',
      text: 'text-purple-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`${colors.bg} rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${colors.icon} p-3 rounded-xl shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-text-secondary mb-1">{title}</h3>
      <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
      {changeLabel && (
        <p className="text-xs text-text-tertiary mt-1">{changeLabel}</p>
      )}
    </motion.div>
  );
}

// Simple Line Chart Component
function SimpleLineChart({ data, color = '#006B3F' }: { data: number[]; color?: string }) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - (value / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-32">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points} 100,100`}
        fill="url(#chartGradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Scholarship Card Component
function ScholarshipCard({
  scholarship,
  index,
}: {
  scholarship: any;
  index: number;
}) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    open: 'bg-green-100 text-green-700',
    closed: 'bg-yellow-100 text-yellow-700',
    awarded: 'bg-blue-100 text-blue-700',
    completed: 'bg-purple-100 text-purple-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center justify-between p-4 bg-white rounded-xl border border-surface-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-ghana-green/10 to-green-100 flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-ghana-green" />
        </div>
        <div>
          <h4 className="font-semibold text-text-primary">{scholarship.title}</h4>
          <p className="text-sm text-text-secondary">
            GHS {scholarship.amount?.toLocaleString()} • {scholarship.currentRecipients || 0}/{scholarship.maxRecipients} recipients
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[scholarship.status] || statusColors.draft}`}>
          {scholarship.status}
        </span>
        <ChevronRight className="h-5 w-5 text-text-tertiary" />
      </div>
    </motion.div>
  );
}

// Recent Activity Item Component
function ActivityItem({
  activity,
  index,
}: {
  activity: any;
  index: number;
}) {
  const actionIcons: Record<string, React.ElementType> = {
    status_change: RefreshCw,
    scholarship_created: GraduationCap,
    application_received: FileText,
    application_reviewed: Award,
    scholarship_awarded: Award,
    dashboard_access: Eye,
    content_added: FileText,
  };

  const Icon = actionIcons[activity.action] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-3 p-3 hover:bg-surface-50 rounded-lg transition-colors"
    >
      <div className="h-8 w-8 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{activity.details}</p>
        <p className="text-xs text-text-tertiary mt-0.5">
          {new Date(activity.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

export default function SponsorDashboard() {
  const [searchParams] = useSearchParams();
  const accessKey = searchParams.get('key') || undefined;

  const {
    sponsor,
    tier,
    stats,
    analytics,
    scholarships,
    recipients,
    recentActivity,
    isLoading,
    error,
    fetchDashboard,
    fetchApplications,
  } = useSponsorDashboardStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'scholarships' | 'analytics'>('overview');

  useEffect(() => {
    fetchDashboard(accessKey);
  }, [fetchDashboard, accessKey]);

  useEffect(() => {
    if (sponsor) {
      fetchApplications({ accessKey });
    }
  }, [sponsor, fetchApplications, accessKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ghana-green mx-auto mb-4" />
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !sponsor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Access Denied</h2>
          <p className="text-text-secondary">
            {error || 'Unable to access sponsor dashboard. Please check your access credentials.'}
          </p>
        </div>
      </div>
    );
  }

  const dailyImpressions = analytics?.dailyMetrics?.map(d => d.totalImpressions) || [];
  const dailyClicks = analytics?.dailyMetrics?.map(d => d.totalClicks) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {sponsor.logo ? (
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="h-12 w-12 object-contain rounded-xl border border-surface-200 p-1"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center"
                  style={{ background: tier?.color }}
                >
                  <Award className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-text-primary">{sponsor.name}</h1>
                <p className="text-sm text-text-secondary">
                  {tier?.name} Partner • Since {new Date(sponsor.startDate || sponsor.createdAt).getFullYear()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors">
                <Download className="h-4 w-4" />
                Export Report
              </button>
              <button
                onClick={() => fetchDashboard(accessKey)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-ghana-green rounded-lg hover:bg-ghana-green/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4">
            {(['overview', 'scholarships', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-ghana-green text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard3D
                icon={Eye}
                title="Total Reach"
                value={(stats?.totalImpressions || 0).toLocaleString()}
                change={12}
                changeLabel="vs last month"
                color="green"
                delay={0}
              />
              <StatCard3D
                icon={MousePointerClick}
                title="Engagement Rate"
                value={`${stats?.engagementRate?.toFixed(1) || 0}%`}
                change={5}
                changeLabel="click-through rate"
                color="gold"
                delay={0.1}
              />
              <StatCard3D
                icon={GraduationCap}
                title="Scholars Supported"
                value={stats?.scholarsSupported || 0}
                changeLabel="lifetime impact"
                color="blue"
                delay={0.2}
              />
              <StatCard3D
                icon={FileText}
                title="Active Placements"
                value={stats?.activePlacements || 0}
                changeLabel="sponsored content"
                color="purple"
                delay={0.3}
              />
            </div>

            {/* Charts and Scholarships */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Engagement Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2 bg-white rounded-2xl border border-surface-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-text-primary">Engagement Trends</h3>
                    <p className="text-sm text-text-secondary">Last 30 days performance</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-ghana-green" />
                      <span className="text-text-secondary">Impressions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-ghana-gold" />
                      <span className="text-text-secondary">Clicks</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <SimpleLineChart data={dailyImpressions} color="#006B3F" />
                  </div>
                  <div>
                    <SimpleLineChart data={dailyClicks} color="#FCD116" />
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl border border-surface-200 p-6"
              >
                <h3 className="font-semibold text-text-primary mb-4">Scholarship Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span className="text-sm text-text-secondary">Active Scholarships</span>
                    <span className="text-lg font-bold text-ghana-green">{stats?.activeScholarships || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <span className="text-sm text-text-secondary">Total Applications</span>
                    <span className="text-lg font-bold text-blue-600">{stats?.totalApplications || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                    <span className="text-sm text-text-secondary">Pending Reviews</span>
                    <span className="text-lg font-bold text-amber-600">{stats?.pendingReviews || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <span className="text-sm text-text-secondary">Total Awarded</span>
                    <span className="text-lg font-bold text-purple-600">{stats?.scholarsSupported || 0}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Scholarships and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scholarships */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl border border-surface-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-text-primary">Your Scholarships</h3>
                  <button className="text-sm text-ghana-green font-medium hover:underline">
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {scholarships.length > 0 ? (
                    scholarships.slice(0, 5).map((scholarship, index) => (
                      <ScholarshipCard key={scholarship.id} scholarship={scholarship} index={index} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-text-secondary">
                      <GraduationCap className="h-12 w-12 mx-auto mb-3 text-surface-300" />
                      <p>No scholarships yet</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl border border-surface-200 p-6"
              >
                <h3 className="font-semibold text-text-primary mb-4">Recent Activity</h3>
                <div className="space-y-1">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 8).map((activity, index) => (
                      <ActivityItem key={activity.id} activity={activity} index={index} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-text-secondary">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-surface-300" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}

        {activeTab === 'scholarships' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-primary">All Scholarships</h2>
              <button className="px-4 py-2 bg-ghana-green text-white rounded-lg font-medium hover:bg-ghana-green/90 transition-colors">
                + Create Scholarship
              </button>
            </div>
            <div className="space-y-3">
              {scholarships.map((scholarship, index) => (
                <ScholarshipCard key={scholarship.id} scholarship={scholarship} index={index} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">Detailed Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-surface-200 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-ghana-green/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-ghana-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Impressions Over Time</h3>
                    <p className="text-sm text-text-secondary">Daily impression counts</p>
                  </div>
                </div>
                <SimpleLineChart data={dailyImpressions} color="#006B3F" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-surface-200 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-ghana-gold/10 flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Clicks Over Time</h3>
                    <p className="text-sm text-text-secondary">Daily click counts</p>
                  </div>
                </div>
                <SimpleLineChart data={dailyClicks} color="#FCD116" />
              </motion.div>
            </div>

            {/* Recipients List */}
            {recipients.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-200 p-6">
                <h3 className="font-semibold text-text-primary mb-4">Scholarship Recipients</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Scholarship</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((recipient) => (
                        <tr key={recipient.id} className="border-b border-surface-100 hover:bg-surface-50">
                          <td className="py-3 px-4">
                            <span className="font-medium text-text-primary">{recipient.fullName}</span>
                          </td>
                          <td className="py-3 px-4 text-text-secondary">{recipient.scholarshipTitle}</td>
                          <td className="py-3 px-4 text-text-secondary">
                            GHS {recipient.awardedAmount?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              recipient.programStatus === 'completed' ? 'bg-green-100 text-green-700' :
                              recipient.programStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {recipient.programStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-ghana-green rounded-full"
                                  style={{ width: `${recipient.progressPercentage || 0}%` }}
                                />
                              </div>
                              <span className="text-sm text-text-secondary">
                                {recipient.progressPercentage || 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
