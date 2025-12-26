import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  Users,
  Newspaper,
  Trophy,
  Bell,
  TrendingUp,
  BookOpen,
  Clock,
  ArrowRight,
  Zap,
  Star,
  Flame
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LevelProgress, CompactStreak } from '@/components/gamification';
import { useAuthStore } from '@/stores/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();

  const quickStats = [
    { label: 'Documents Read', value: 24, icon: BookOpen, color: 'primary', link: '/library' },
    { label: 'Forum Posts', value: 12, icon: MessageSquare, color: 'info', link: '/forum' },
    { label: 'Groups Joined', value: 5, icon: Users, color: 'secondary', link: '/groups' },
    { label: 'Badges Earned', value: 8, icon: Trophy, color: 'accent', link: '/leaderboard' },
  ];

  const recentDocuments = [
    { id: '1', title: 'Annual Budget Guidelines 2024', category: 'Policy', readProgress: 75 },
    { id: '2', title: 'Civil Service Training Manual', category: 'Training', readProgress: 100 },
    { id: '3', title: 'Performance Evaluation Framework', category: 'Guidelines', readProgress: 30 },
  ];

  const recentActivity = [
    { type: 'xp', message: 'Earned 50 XP for daily login', time: '2 hours ago' },
    { type: 'badge', message: 'Earned "Bookworm" badge', time: '1 day ago' },
    { type: 'forum', message: 'Your post received 5 upvotes', time: '2 days ago' },
  ];

  const upcomingEvents = [
    { title: 'Digital Skills Workshop', date: 'Jan 20, 2025', type: 'Training' },
    { title: 'Policy Review Meeting', date: 'Jan 22, 2025', type: 'Meeting' },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Here's what's happening on the platform today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CompactStreak streak={12} />
              <Link
                to="/notifications"
                className="relative p-2 bg-white dark:bg-surface-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <Bell className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <LevelProgress
            level={6}
            levelName="Expert"
            currentXP={2200}
            requiredXP={3000}
            totalXP={10200}
            showDetails
          />
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link
                to={stat.link}
                className="block p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                      {stat.value}
                    </p>
                    <p className="text-xs text-surface-500">{stat.label}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Reading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-surface-800 rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  Continue Reading
                </h2>
                <Link to="/library" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/library/doc/${doc.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 dark:text-surface-50 truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-surface-500">{doc.category}</p>
                    </div>
                    <div className="w-20">
                      <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${doc.readProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-surface-500 text-right mt-1">
                        {doc.readProgress}%
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: 'Browse Library', icon: BookOpen, link: '/library', color: 'primary' },
                { label: 'Forum', icon: MessageSquare, link: '/forum', color: 'info' },
                { label: 'News Feed', icon: Newspaper, link: '/news', color: 'accent' },
                { label: 'Leaderboard', icon: Trophy, link: '/leaderboard', color: 'secondary' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.link}
                  className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${action.color}-100 dark:bg-${action.color}-900/30`}>
                    <action.icon className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-400`} />
                  </div>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {action.label}
                  </span>
                </Link>
              ))}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-surface-800 rounded-xl shadow-sm p-6"
            >
              <h2 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-secondary-500" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'xp' ? 'bg-success-100 dark:bg-success-900/30' :
                      activity.type === 'badge' ? 'bg-secondary-100 dark:bg-secondary-900/30' :
                      'bg-info-100 dark:bg-info-900/30'
                    }`}>
                      {activity.type === 'xp' && <Zap className="w-4 h-4 text-success-600" />}
                      {activity.type === 'badge' && <Star className="w-4 h-4 text-secondary-600" />}
                      {activity.type === 'forum' && <TrendingUp className="w-4 h-4 text-info-600" />}
                    </div>
                    <div>
                      <p className="text-sm text-surface-700 dark:text-surface-300">
                        {activity.message}
                      </p>
                      <p className="text-xs text-surface-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm p-6 text-white"
            >
              <h2 className="font-semibold mb-4">Upcoming Events</h2>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-3">
                    <p className="font-medium">{event.title}</p>
                    <div className="flex items-center justify-between mt-1 text-sm text-primary-100">
                      <span>{event.date}</span>
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
