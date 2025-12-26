import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, TrendingUp, Flame, Clock } from 'lucide-react';
import { useForumStore } from '@/stores/forumStore';
import {
  CategoryList,
  TopicList,
  ForumStats,
  NewTopicModal,
} from '@/components/forum';
import { Tabs } from '@/components/shared/Tabs';

export default function Forum() {
  const {
    categories,
    topics,
    fetchCategories,
    fetchTopics,
    isLoading,
  } = useForumStore();
  const [activeTab, setActiveTab] = useState('categories');
  const [showNewTopic, setShowNewTopic] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTopics();
  }, [fetchCategories, fetchTopics]);

  const tabs = [
    { id: 'categories', label: 'Categories', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'latest', label: 'Latest', icon: <Clock className="w-4 h-4" /> },
    { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4" /> },
  ];

  // Mock stats
  const forumStats = {
    totalTopics: 1542,
    totalPosts: 23567,
    totalMembers: 4821,
    onlineMembers: 127,
    todayTopics: 24,
    todayPosts: 156,
  };

  const topContributors = [
    { id: '1', name: 'Kwame Asante', avatar: undefined, postCount: 342 },
    { id: '2', name: 'Ama Serwaa', avatar: undefined, postCount: 289 },
    { id: '3', name: 'Kofi Mensah', avatar: undefined, postCount: 234 },
    { id: '4', name: 'Akua Owusu', avatar: undefined, postCount: 198 },
    { id: '5', name: 'Yaw Boateng', avatar: undefined, postCount: 176 },
  ];

  const onlineUsers = [
    { id: '1', name: 'Kwame Asante', avatar: undefined },
    { id: '2', name: 'Ama Serwaa', avatar: undefined },
    { id: '3', name: 'Kofi Mensah', avatar: undefined },
    { id: '4', name: 'Akua Owusu', avatar: undefined },
    { id: '5', name: 'Yaw Boateng', avatar: undefined },
    { id: '6', name: 'Efua Mensah', avatar: undefined },
    { id: '7', name: 'Nana Ama', avatar: undefined },
    { id: '8', name: 'Kwesi Appiah', avatar: undefined },
    { id: '9', name: 'Adwoa Kyei', avatar: undefined },
    { id: '10', name: 'Kojo Asare', avatar: undefined },
  ];

  const getTrendingTopics = () => {
    return [...topics]
      .sort((a, b) => b.viewCount + b.likeCount - (a.viewCount + a.likeCount))
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
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
          Discussion Forum
        </h1>
        <p className="mt-1 text-surface-600 dark:text-surface-400">
          Connect with colleagues, share knowledge, and discuss topics
        </p>
      </div>

      {/* Quick Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
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
          label="Active Today"
          value={`+${forumStats.todayPosts}`}
          color="success"
        />
        <StatCard
          icon={Flame}
          label="Online Now"
          value={forumStats.onlineMembers.toString()}
          color="accent"
        />
      </motion.div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Area */}
        <div className="lg:col-span-3">
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
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ForumStats
            stats={forumStats}
            topContributors={topContributors}
            onlineUsers={onlineUsers}
          />
        </div>
      </div>

      {/* New Topic Modal */}
      <NewTopicModal
        isOpen={showNewTopic}
        onClose={() => setShowNewTopic(false)}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        onSubmit={(data) => {
          console.log('Create topic:', data);
          setShowNewTopic(false);
        }}
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
