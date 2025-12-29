import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, Link2, UserPlus, Search, Loader2 } from 'lucide-react';
import { useSocialStore } from '@/stores/socialStore';
import { FollowersList } from '@/components/social/FollowersList';
import { FollowingList } from '@/components/social/FollowingList';
import { ConnectionsList } from '@/components/social/ConnectionsList';
import { SuggestedUsers } from '@/components/social/SuggestedUsers';
import { cn } from '@/utils/cn';

type TabType = 'followers' | 'following' | 'connections' | 'discover';

const tabs = [
  { id: 'followers' as TabType, label: 'Followers', icon: Users },
  { id: 'following' as TabType, label: 'Following', icon: UserCheck },
  { id: 'connections' as TabType, label: 'Connections', icon: Link2 },
  { id: 'discover' as TabType, label: 'Discover', icon: UserPlus },
];

// Animated background
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 107, 63, 0.12) 0%, transparent 70%)',
          top: '-5%',
          right: '-10%',
        }}
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(252, 209, 22, 0.08) 0%, transparent 70%)',
          bottom: '10%',
          left: '-5%',
        }}
        animate={{
          y: [0, -20, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 107, 63, 0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 107, 63, 0.8) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// Stats overview
function NetworkStats() {
  const { followers, following, connections, pendingRequests } = useSocialStore();

  const stats = [
    { label: 'Followers', value: followers.length, icon: Users, color: 'text-primary-600' },
    { label: 'Following', value: following.length, icon: UserCheck, color: 'text-accent-600' },
    { label: 'Connections', value: connections.length, icon: Link2, color: 'text-success-600' },
    { label: 'Pending', value: pendingRequests.length, icon: UserPlus, color: 'text-warning-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 border border-surface-200 dark:border-surface-700 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg bg-surface-100 dark:bg-surface-700', stat.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {stat.value}
                </p>
                <p className="text-sm text-surface-500">{stat.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

export default function Network() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'followers';

  const {
    fetchFollowers,
    fetchFollowing,
    fetchConnections,
    fetchPendingRequests,
    fetchSentRequests,
  } = useSocialStore();

  // Load data on mount
  useEffect(() => {
    fetchFollowers();
    fetchFollowing();
    fetchConnections();
    fetchPendingRequests();
    fetchSentRequests();
  }, [fetchFollowers, fetchFollowing, fetchConnections, fetchPendingRequests, fetchSentRequests]);

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'followers':
        return <FollowersList />;
      case 'following':
        return <FollowingList />;
      case 'connections':
        return <ConnectionsList />;
      case 'discover':
        return <SuggestedUsers limit={20} title="People You May Know" />;
      default:
        return <FollowersList />;
    }
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
            <Users className="w-7 h-7 text-primary-600" />
            My Network
          </h1>
          <p className="text-surface-500 mt-1">
            Manage your professional network and discover new connections
          </p>
        </motion.div>

        {/* Stats */}
        <NetworkStats />

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 border border-surface-200 dark:border-surface-700 overflow-hidden"
        >
          {/* Tab Navigation */}
          <div className="flex border-b border-surface-200 dark:border-surface-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="networkTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-4 lg:p-6">
            {renderContent()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
