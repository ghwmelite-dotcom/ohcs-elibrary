import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  TrendingUp,
  Flame,
  Clock,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  PanelRightOpen,
  BarChart3,
} from 'lucide-react';
import { useForumStore } from '@/stores/forumStore';
import {
  CategoryList,
  TopicList,
  ForumStats,
  CreateTopicModal,
} from '@/components/forum';
import { Tabs } from '@/components/shared/Tabs';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';

export default function Forum() {
  const navigate = useNavigate();
  const {
    categories,
    topics,
    stats,
    fetchCategories,
    fetchTopics,
    fetchStats,
    createTopic,
    isLoading,
  } = useForumStore();
  const [activeTab, setActiveTab] = useState('categories');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [showMobileStats, setShowMobileStats] = useState(false);

  // Collapsible stats sidebar state with localStorage persistence
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(() => {
    const saved = localStorage.getItem('forum-stats-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem('forum-stats-collapsed', JSON.stringify(isStatsCollapsed));
  }, [isStatsCollapsed]);

  // Toggle function with keyboard shortcut support
  const toggleStats = useCallback(() => {
    setIsStatsCollapsed((prev: boolean) => !prev);
  }, []);

  // Keyboard shortcut: Ctrl+. to toggle stats
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        toggleStats();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleStats]);

  const handleCreateTopic = async (data: {
    title: string;
    content: string;
    categoryId: string;
    tags: string[];
  }) => {
    const topic = await createTopic(data);
    if (topic) {
      // Navigate to the new topic
      navigate(`/forum/topic/${topic.id}`);
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchCategories();
    fetchTopics();
    fetchStats();
  }, [fetchCategories, fetchTopics, fetchStats]);

  const tabs = [
    { id: 'categories', label: 'Categories', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'latest', label: 'Latest', icon: <Clock className="w-4 h-4" /> },
    { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4" /> },
  ];

  // Use real stats from API
  const forumStats = {
    totalTopics: stats.totalTopics || 0,
    totalPosts: stats.totalPosts || 0,
    totalMembers: stats.activeMembers || 0,
    onlineMembers: 0, // We don't track this in real-time
    todayTopics: stats.todayTopics || 0,
    todayPosts: 0, // We can add this to the API later
  };

  const getTrendingTopics = () => {
    return [...topics]
      .sort((a, b) => b.views + b.postCount - (a.views + a.postCount))
      .slice(0, 20);
  };

  const getLatestTopics = () => {
    return [...topics]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
            Discussion Forum
          </h1>
          <p className="mt-1 text-surface-600 dark:text-surface-400">
            Connect with colleagues, share knowledge, and discuss topics
          </p>
        </div>
        <Button
          onClick={() => setShowNewTopic(true)}
          leftIcon={<Plus className="w-5 h-5" />}
          className="whitespace-nowrap"
        >
          Start Discussion
        </Button>
      </div>

      {/* Quick Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        <StatCard
          icon={MessageSquare}
          label="Total Topics"
          value={forumStats.totalTopics.toLocaleString()}
          color="primary"
        />
        <StatCard
          icon={MessageSquare}
          label="Total Posts"
          value={forumStats.totalPosts.toLocaleString()}
          color="secondary"
        />
        <StatCard
          icon={TrendingUp}
          label="New Today"
          value={forumStats.todayTopics > 0 ? `+${forumStats.todayTopics}` : '0'}
          color="success"
        />
        <StatCard
          icon={Users}
          label="Members"
          value={forumStats.totalMembers.toLocaleString()}
          color="accent"
        />
      </motion.div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Main Area */}
        <motion.div
          className="flex-1 min-w-0"
          initial={false}
          animate={{
            marginRight: isStatsCollapsed ? 0 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {activeTab === 'categories' && <CategoryList categories={categories} />}

          {activeTab === 'latest' && (
            <TopicList
              topics={getLatestTopics()}
              categories={categories}
              isLoading={isLoading}
              onNewTopic={() => setShowNewTopic(true)}
            />
          )}

          {activeTab === 'trending' && (
            <TopicList
              topics={getTrendingTopics()}
              categories={categories}
              isLoading={isLoading}
              onNewTopic={() => setShowNewTopic(true)}
            />
          )}
        </motion.div>

        {/* Collapsed Stats Indicator */}
        <AnimatePresence>
          {isStatsCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 56 }}
              exit={{ opacity: 0, width: 0 }}
              className="hidden lg:flex flex-col items-center py-4 px-2 bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1"
            >
              <motion.button
                onClick={toggleStats}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400 mb-4"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Show stats (Ctrl+.)"
              >
                <PanelRightOpen className="w-5 h-5" />
              </motion.button>

              {/* Mini stat indicators */}
              <div className="flex-1 flex flex-col gap-3 items-center">
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex flex-col items-center gap-1"
                  title={`${forumStats.totalTopics} Topics`}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-xs font-bold text-surface-600 dark:text-surface-400">
                    {forumStats.totalTopics}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center gap-1"
                  title={`${forumStats.totalPosts} Posts`}
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary-50 dark:bg-secondary-900/30 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <span className="text-xs font-bold text-surface-600 dark:text-surface-400">
                    {forumStats.totalPosts}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-col items-center gap-1"
                  title={`${forumStats.totalMembers} Members`}
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                  </div>
                  <span className="text-xs font-bold text-surface-600 dark:text-surface-400">
                    {forumStats.totalMembers}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar - Stats with Collapse */}
        <motion.div
          className="hidden lg:block relative flex-shrink-0"
          initial={false}
          animate={{
            width: isStatsCollapsed ? 0 : 280,
            opacity: isStatsCollapsed ? 0 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Collapse Toggle Button */}
          <motion.button
            onClick={toggleStats}
            className={cn(
              'absolute top-4 z-10 flex items-center justify-center',
              'w-6 h-12 rounded-l-lg shadow-lg transition-all duration-200',
              'bg-white dark:bg-surface-700 border border-r-0 border-surface-200 dark:border-surface-600',
              'hover:bg-surface-50 dark:hover:bg-surface-600 hover:w-7',
              'text-surface-500 hover:text-primary-600 dark:hover:text-primary-400',
              '-left-3'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isStatsCollapsed ? 'Show stats (Ctrl+.)' : 'Hide stats (Ctrl+.)'}
          >
            <motion.div
              animate={{ rotate: isStatsCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.button>

          <motion.div
            className="w-[280px] overflow-hidden"
            initial={false}
            animate={{
              opacity: isStatsCollapsed ? 0 : 1,
              x: isStatsCollapsed ? 20 : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            <ForumStats stats={forumStats} />
          </motion.div>
        </motion.div>

        {/* Mobile Stats FAB */}
        <motion.button
          onClick={() => setShowMobileStats(true)}
          className="lg:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-xl shadow-primary-500/30 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <BarChart3 className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Mobile Stats Drawer */}
      <AnimatePresence>
        {showMobileStats && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileStats(false)}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-surface-800 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-surface-300 dark:bg-surface-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-surface-200 dark:border-surface-700">
                <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-500" />
                  Forum Statistics
                </h3>
                <button
                  onClick={() => setShowMobileStats(false)}
                  className="p-2 rounded-xl bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600"
                >
                  <ChevronRight className="w-5 h-5 text-surface-500 rotate-90" />
                </button>
              </div>

              {/* Stats Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                <ForumStats stats={forumStats} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Topic Modal */}
      <CreateTopicModal
        isOpen={showNewTopic}
        onClose={() => setShowNewTopic(false)}
        categories={categories}
        onSubmit={handleCreateTopic}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: 'primary' | 'secondary' | 'success' | 'accent';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    secondary: 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
    success: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400',
    accent: 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-surface-900 dark:text-surface-50">{value}</p>
          <p className="text-xs text-surface-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
