import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Eye,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { ChartWidget } from '@/components/admin/ChartWidget';
import { Button } from '@/components/shared/Button';
import { Tabs } from '@/components/shared/Tabs';
import { cn } from '@/utils/cn';

export default function AdminAnalytics() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');

  const stats = [
    { label: 'Total Users', value: '12,456', change: '+12%', icon: Users, trend: 'up' },
    { label: 'Documents', value: '3,892', change: '+8%', icon: FileText, trend: 'up' },
    { label: 'Forum Posts', value: '8,234', change: '+23%', icon: MessageSquare, trend: 'up' },
    { label: 'Page Views', value: '156K', change: '+15%', icon: Eye, trend: 'up' },
  ];

  const userGrowthData = [
    { month: 'Jan', users: 8500 },
    { month: 'Feb', users: 9200 },
    { month: 'Mar', users: 9800 },
    { month: 'Apr', users: 10400 },
    { month: 'May', users: 11200 },
    { month: 'Jun', users: 12456 },
  ];

  const documentStats = [
    { category: 'Policies', count: 456, percentage: 35 },
    { category: 'Circulars', count: 324, percentage: 25 },
    { category: 'Guidelines', count: 267, percentage: 20 },
    { category: 'Reports', count: 156, percentage: 12 },
    { category: 'Forms', count: 104, percentage: 8 },
  ];

  const topMDAs = [
    { name: 'Ministry of Finance', users: 456, documents: 234, activity: 'high' },
    { name: 'Ministry of Health', users: 389, documents: 198, activity: 'high' },
    { name: 'Ministry of Education', users: 345, documents: 167, activity: 'medium' },
    { name: 'Ministry of Communications', users: 289, documents: 145, activity: 'medium' },
    { name: 'Ministry of Trade', users: 234, documents: 123, activity: 'medium' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'content', label: 'Content' },
    { id: 'engagement', label: 'Engagement' },
  ];

  const dateRanges = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: '1y', label: '1 Year' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
            Analytics
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Platform usage statistics and insights
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
            {dateRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  dateRange === range.id
                    ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-50 shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={selectedTab}
        onChange={setSelectedTab}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">User Growth</h3>
              <p className="text-sm text-surface-500">Monthly active users</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span>+12%</span>
            </div>
          </div>
          <div className="h-64 flex items-end gap-4">
            {userGrowthData.map((data, index) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.users / 15000) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full bg-primary-500 rounded-t-lg min-h-[20px]"
                />
                <span className="text-xs text-surface-500">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Document Distribution */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">Document Categories</h3>
              <p className="text-sm text-surface-500">Distribution by type</p>
            </div>
          </div>
          <div className="space-y-4">
            {documentStats.map((stat) => (
              <div key={stat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-surface-700 dark:text-surface-300">{stat.category}</span>
                  <span className="text-sm font-medium text-surface-900 dark:text-surface-50">{stat.count}</span>
                </div>
                <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-primary-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top MDAs */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">Top MDAs by Activity</h3>
            <p className="text-sm text-surface-500">Most active ministries and agencies</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">MDA</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Users</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Documents</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-surface-500">Activity</th>
              </tr>
            </thead>
            <tbody>
              {topMDAs.map((mda, index) => (
                <tr
                  key={mda.name}
                  className="border-b border-surface-100 dark:border-surface-700/50 last:border-0"
                >
                  <td className="py-3 px-4">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      index === 0 && 'bg-secondary-100 text-secondary-700',
                      index === 1 && 'bg-surface-200 text-surface-700',
                      index === 2 && 'bg-amber-100 text-amber-700',
                      index > 2 && 'bg-surface-100 text-surface-600'
                    )}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-surface-900 dark:text-surface-50">{mda.name}</td>
                  <td className="py-3 px-4 text-surface-600 dark:text-surface-400">{mda.users}</td>
                  <td className="py-3 px-4 text-surface-600 dark:text-surface-400">{mda.documents}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      mda.activity === 'high' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                      mda.activity === 'medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                      mda.activity === 'low' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}>
                      {mda.activity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
