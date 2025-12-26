import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Star, UserPlus } from 'lucide-react';
import { useGroupsStore } from '@/stores/groupsStore';
import { GroupList, GroupCardCompact, CreateGroupModal } from '@/components/groups';
import { Tabs } from '@/components/shared/Tabs';

export default function Groups() {
  const {
    groups,
    fetchGroups,
    joinGroup,
    leaveGroup,
    isLoading,
  } = useGroupsStore();

  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const tabs = [
    { id: 'discover', label: 'Discover', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'my-groups', label: 'My Groups', icon: <Users className="w-4 h-4" /> },
    { id: 'suggested', label: 'Suggested', icon: <Star className="w-4 h-4" /> },
  ];

  // Filter groups based on tab
  const getFilteredGroups = () => {
    switch (activeTab) {
      case 'my-groups':
        return groups.filter((g) => g.isJoined);
      case 'suggested':
        return groups.filter((g) => !g.isJoined).slice(0, 6);
      default:
        return groups;
    }
  };

  // Mock stats
  const stats = {
    totalGroups: groups.length,
    myGroups: groups.filter((g) => g.isJoined).length,
    trending: 5,
    newThisWeek: 12,
  };

  // Top groups
  const topGroups = [...groups]
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
          Groups
        </h1>
        <p className="mt-1 text-surface-600 dark:text-surface-400">
          Connect with colleagues who share your interests
        </p>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={Users}
          label="Total Groups"
          value={stats.totalGroups.toString()}
          color="primary"
        />
        <StatCard
          icon={Star}
          label="My Groups"
          value={stats.myGroups.toString()}
          color="secondary"
        />
        <StatCard
          icon={TrendingUp}
          label="Trending"
          value={stats.trending.toString()}
          color="accent"
        />
        <StatCard
          icon={UserPlus}
          label="New This Week"
          value={`+${stats.newThisWeek}`}
          color="success"
        />
      </motion.div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-3">
          <GroupList
            groups={getFilteredGroups()}
            isLoading={isLoading}
            onCreateGroup={() => setShowCreateModal(true)}
            onJoinGroup={joinGroup}
            onLeaveGroup={leaveGroup}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Groups */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-500" />
              Top Groups
            </h3>
            <div className="space-y-3">
              {topGroups.map((group, index) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3"
                >
                  <span className="w-6 h-6 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center text-xs font-bold text-surface-500">
                    {index + 1}
                  </span>
                  <GroupCardCompact group={group} onJoin={joinGroup} />
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Categories
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Professional', count: 24, emoji: '💼' },
                { name: 'MDA Groups', count: 18, emoji: '🏛️' },
                { name: 'Training', count: 12, emoji: '📚' },
                { name: 'Social', count: 8, emoji: '🎉' },
                { name: 'Technology', count: 15, emoji: '💻' },
              ].map((category) => (
                <button
                  key={category.name}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.emoji}</span>
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-xs text-surface-400">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Create Group CTA */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white">
            <Users className="w-8 h-8 mb-3" />
            <h4 className="font-semibold mb-2">Start a Group</h4>
            <p className="text-sm text-primary-100 mb-4">
              Create a space for your team or interest group to connect and
              collaborate.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => {
          console.log('Create group:', data);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: 'primary' | 'secondary' | 'accent' | 'success';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    secondary: 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
    accent: 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
    success: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400',
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
