import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Network,
  Plus,
  BookOpen,
  Lightbulb,
  FileText,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  Target,
  Activity,
} from 'lucide-react';
import { useResearchStore, RESEARCH_CATEGORIES, RESEARCH_STATUSES } from '@/stores/researchStore';
import { ProjectCard, CreateProjectModal } from '@/components/research';
import { cn } from '@/utils/cn';

export default function ResearchLab() {
  const navigate = useNavigate();
  const {
    dashboard,
    dashboardLoading,
    fetchDashboard,
    templates,
    fetchTemplates,
  } = useResearchStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchTemplates();
  }, [fetchDashboard, fetchTemplates]);

  const handleProjectCreated = (projectId: string) => {
    navigate(`/research-hub/projects/${projectId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 100, opacity: 0 }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              className="absolute"
              style={{
                left: `${15 + i * 20}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
            >
              <Network className="w-8 h-8 text-white/20" />
            </motion.div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Network className="w-8 h-8 text-white" />
                </div>
                <span className="px-3 py-1 text-sm font-medium bg-secondary-400 text-secondary-900 rounded-full">
                  AI-Powered
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Research Hub
              </h1>
              <p className="text-lg text-primary-100 max-w-xl">
                Conduct evidence-based policy research with AI-powered insights and collaborative tools.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/research-hub/projects"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 backdrop-blur-sm transition-colors"
              >
                <Search className="w-5 h-5" />
                Browse Projects
              </Link>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl hover:bg-primary-50 font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Project
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Active Projects',
                value: dashboard?.stats?.myActiveProjects || 0,
                icon: Target,
                color: 'from-blue-500 to-blue-600',
              },
              {
                label: 'Completed',
                value: dashboard?.stats?.myCompletedProjects || 0,
                icon: FileText,
                color: 'from-green-500 to-green-600',
              },
              {
                label: 'Total Projects',
                value: (dashboard?.stats?.myActiveProjects || 0) + (dashboard?.stats?.myCompletedProjects || 0),
                icon: Network,
                color: 'from-purple-500 to-purple-600',
              },
              {
                label: 'Pending Reviews',
                value: dashboard?.stats?.pendingReviews || 0,
                icon: Clock,
                color: 'from-orange-500 to-orange-600',
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-100 dark:border-surface-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('p-2 rounded-lg bg-gradient-to-br text-white', stat.color)}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-1">
                  {dashboardLoading ? (
                    <div className="h-8 w-16 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-sm text-surface-500 dark:text-surface-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* My Projects */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary-500" />
                  My Projects
                </h2>
                <Link
                  to="/research-hub/projects?myProjects=true"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {dashboardLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : dashboard?.myProjects && dashboard.myProjects.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.myProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} variant="compact" />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-surface-800 rounded-xl p-8 text-center border border-surface-200 dark:border-surface-700">
                  <Network className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                    No projects yet
                  </h3>
                  <p className="text-surface-500 dark:text-surface-400 mb-4">
                    Start your first research project to see it here.
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Project
                  </button>
                </div>
              )}
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Trending Topics */}
              <div className="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-100 dark:border-surface-700">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  Trending Topics
                </h3>
                {dashboardLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-8 bg-surface-100 dark:bg-surface-700 rounded animate-pulse" />
                    ))}
                  </div>
                ) : dashboard?.trendingTopics && dashboard.trendingTopics.length > 0 ? (
                  <div className="space-y-2">
                    {dashboard.trendingTopics.map((topic, index) => (
                      <Link
                        key={topic.topic}
                        to={`/research-hub/projects?search=${encodeURIComponent(topic.topic)}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-surface-700 dark:text-surface-300">{topic.topic}</span>
                        </div>
                        <span className="text-sm text-surface-400 dark:text-surface-500">{topic.count}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-surface-500 dark:text-surface-400 text-sm">
                    No trending topics yet
                  </p>
                )}
              </div>

              {/* Quick Start Templates */}
              <div className="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-100 dark:border-surface-700">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-secondary-500" />
                  Quick Start
                </h3>
                <div className="space-y-2">
                  {templates.slice(0, 4).map((template) => {
                    const category = RESEARCH_CATEGORIES[template.category] || RESEARCH_CATEGORIES.other;
                    return (
                      <button
                        key={template.id}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors group"
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
                            category.color
                          )}
                        >
                          {category.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-surface-700 dark:text-surface-300 block truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                            {template.name}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-surface-400 dark:text-surface-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                Recent Activity
              </h2>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-100 dark:border-surface-700 overflow-hidden">
              {dashboardLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-surface-100 dark:bg-surface-700 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-surface-100 dark:bg-surface-700 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-surface-100 dark:bg-surface-700 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
                <div className="divide-y divide-surface-100 dark:divide-surface-700">
                  {dashboard.recentActivity.map((activity) => (
                    <Link
                      key={activity.id}
                      to={`/research-hub/projects/${activity.projectId}`}
                      className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                    >
                      {activity.user?.avatar ? (
                        <img
                          src={activity.user.avatar}
                          alt={activity.user.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {activity.user?.displayName?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-surface-900 dark:text-surface-100">
                          <span className="font-medium">{activity.user?.displayName || 'Someone'}</span>
                          {' '}
                          <span className="text-surface-500 dark:text-surface-400">
                            {activity.action.replace(/_/g, ' ')}
                          </span>
                          {' '}
                          <span className="font-medium text-primary-600 dark:text-primary-400">
                            {(activity.metadata as { projectTitle?: string })?.projectTitle || 'a project'}
                          </span>
                        </p>
                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                          {new Date(activity.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Activity className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                  <p className="text-surface-500 dark:text-surface-400">No recent activity</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
