import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  Activity,
  Award,
  Eye,
  UserPlus,
  Download,
  AlertCircle
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  StatCard,
  ChartWidget,
  SimpleBarChart,
  SimpleLineChart,
  DonutChart,
  ActivityHeatmap
} from '@/components/admin';
import { cn } from '@/utils/cn';

export default function AdminDashboard() {
  // Mock data
  const stats = {
    totalUsers: 2847,
    usersChange: 12.5,
    totalDocuments: 1523,
    documentsChange: 8.3,
    forumPosts: 4892,
    postsChange: -2.1,
    activeUsers: 892,
    activeChange: 15.7,
  };

  const userGrowthData = [150, 180, 220, 195, 250, 310, 285, 340, 380, 420, 395, 450];
  const userGrowthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const categoryData = [
    { label: 'Policy Documents', value: 450, color: 'bg-primary-600' },
    { label: 'Training Materials', value: 380, color: 'bg-secondary-500' },
    { label: 'Reports', value: 320, color: 'bg-info-500' },
    { label: 'Guidelines', value: 280, color: 'bg-success-500' },
    { label: 'Circulars', value: 93, color: 'bg-warning-500' },
  ];

  const usersByRole = [
    { label: 'Civil Servants', value: 2100, color: '#006B3F' },
    { label: 'Admins', value: 45, color: '#FCD116' },
    { label: 'Moderators', value: 120, color: '#CE1126' },
    { label: 'Guests', value: 582, color: '#6B7280' },
  ];

  const recentActivity = [
    { type: 'user', message: 'New user registered: Kwame Asante', time: '5 min ago' },
    { type: 'document', message: 'Document uploaded: Annual Report 2024', time: '12 min ago' },
    { type: 'forum', message: 'New forum topic: Policy Discussion', time: '25 min ago' },
    { type: 'alert', message: 'Login attempt failed: suspicious activity', time: '1 hour ago' },
    { type: 'badge', message: 'Badge earned by Ama Serwaa: Contributor', time: '2 hours ago' },
  ];

  const topMDAs = [
    { name: 'Ministry of Finance', users: 245, documents: 89 },
    { name: 'Ministry of Health', users: 198, documents: 76 },
    { name: 'Public Services Commission', users: 156, documents: 54 },
    { name: 'Ministry of Education', users: 134, documents: 48 },
    { name: 'OHCS', users: 128, documents: 45 },
  ];

  // Generate mock heatmap data
  const heatmapData = [...Array(84)].map((_, i) => ({
    date: new Date(Date.now() - (83 - i) * 86400000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 50),
  }));

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Admin Dashboard
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Overview of platform activity and statistics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            change={stats.usersChange}
            icon={Users}
            color="primary"
          />
          <StatCard
            title="Documents"
            value={stats.totalDocuments}
            change={stats.documentsChange}
            icon={FileText}
            color="secondary"
          />
          <StatCard
            title="Forum Posts"
            value={stats.forumPosts}
            change={stats.postsChange}
            icon={MessageSquare}
            color="info"
          />
          <StatCard
            title="Active Today"
            value={stats.activeUsers}
            change={stats.activeChange}
            icon={Activity}
            color="success"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth */}
          <ChartWidget
            title="User Growth"
            subtitle="Monthly new registrations"
          >
            <SimpleLineChart
              data={userGrowthData}
              labels={userGrowthLabels}
              height={200}
            />
          </ChartWidget>

          {/* Users by Role */}
          <ChartWidget
            title="Users by Role"
            subtitle="Distribution across roles"
          >
            <DonutChart data={usersByRole} />
          </ChartWidget>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Document Categories */}
          <ChartWidget
            title="Documents by Category"
            subtitle="Top categories"
          >
            <SimpleBarChart data={categoryData} />
          </ChartWidget>

          {/* Activity Heatmap */}
          <div className="lg:col-span-2">
            <ChartWidget
              title="Platform Activity"
              subtitle="Last 12 weeks"
            >
              <ActivityHeatmap data={heatmapData} />
            </ChartWidget>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    activity.type === 'user' && 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
                    activity.type === 'document' && 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400',
                    activity.type === 'forum' && 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400',
                    activity.type === 'alert' && 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400',
                    activity.type === 'badge' && 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
                  )}>
                    {activity.type === 'user' && <UserPlus className="w-4 h-4" />}
                    {activity.type === 'document' && <FileText className="w-4 h-4" />}
                    {activity.type === 'forum' && <MessageSquare className="w-4 h-4" />}
                    {activity.type === 'alert' && <AlertCircle className="w-4 h-4" />}
                    {activity.type === 'badge' && <Award className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-700 dark:text-surface-300">
                      {activity.message}
                    </p>
                    <p className="text-xs text-surface-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Top MDAs */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Top MDAs by Activity
            </h3>
            <div className="space-y-4">
              {topMDAs.map((mda, index) => (
                <motion.div
                  key={mda.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                      {mda.name}
                    </p>
                    <div className="flex gap-4 text-xs text-surface-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {mda.users} users
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {mda.documents} docs
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
