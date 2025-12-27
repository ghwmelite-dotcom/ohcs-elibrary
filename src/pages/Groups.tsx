import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Star, UserPlus, X, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { useGroupsStore } from '@/stores/groupsStore';
import { useAuthStore } from '@/stores/authStore';
import { GroupList, GroupCardCompact, CreateGroupModal } from '@/components/groups';
import { Tabs } from '@/components/shared/Tabs';

export default function Groups() {
  const {
    groups,
    categories,
    stats,
    fetchGroups,
    fetchCategories,
    fetchStats,
    createGroup,
    joinGroup,
    leaveGroup,
    isLoading,
  } = useGroupsStore();

  const { isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchCategories();
    fetchStats();
  }, [fetchGroups, fetchCategories, fetchStats]);

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

  // Top groups
  const topGroups = [...groups]
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 5);

  // Handle group creation
  const handleCreateGroup = async (data: { name: string; description: string; type: 'open' | 'closed' | 'private'; categoryId?: string; coverColor: string }) => {
    if (!isAuthenticated) {
      setCreateError('You must be logged in to create a group');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      await createGroup(data);
      setShowCreateModal(false);
      // Refresh stats and groups after creating
      fetchStats();
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to create group:', error);
      setCreateError(error.message || 'Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle opening create modal
  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      setCreateError('You must be logged in to create a group');
      return;
    }
    setCreateError(null);
    setShowCreateModal(true);
  };

  // Sidebar content component (reused for both mobile and desktop)
  const SidebarContent = () => (
    <>
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
              onClick={() => setShowMobileSidebar(false)}
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
          {categories.length > 0 ? categories.map((category) => (
            <button
              key={category.id}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {category.name}
                </span>
              </div>
              <span className="text-xs text-surface-400">
                {category.groupCount}
              </span>
            </button>
          )) : (
            <p className="text-sm text-surface-500 text-center py-2">No categories yet</p>
          )}
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
          onClick={() => {
            handleOpenCreateModal();
            setShowMobileSidebar(false);
          }}
          className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          Create Group
        </button>
      </div>
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface-50 dark:bg-surface-900 z-50 lg:hidden shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700 sticky top-0 bg-surface-50 dark:bg-surface-900">
                <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-500" />
                  Discover
                </h2>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <SidebarContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
            Groups
          </h1>
          <p className="mt-1 text-sm sm:text-base text-surface-600 dark:text-surface-400">
            Connect with colleagues who share your interests
          </p>
        </div>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="lg:hidden p-2 bg-white dark:bg-surface-800 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-1 text-sm text-surface-600 dark:text-surface-400"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">Discover</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Error Message */}
      {createError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0" />
          <p className="text-sm text-error-700 dark:text-error-300">{createError}</p>
          <button
            onClick={() => setCreateError(null)}
            className="ml-auto text-error-600 dark:text-error-400 hover:text-error-800 dark:hover:text-error-200"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
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
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-3">
          <GroupList
            groups={getFilteredGroups()}
            isLoading={isLoading}
            onCreateGroup={handleOpenCreateModal}
            onJoinGroup={joinGroup}
            onLeaveGroup={leaveGroup}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block space-y-6">
          <SidebarContent />
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGroup}
        isSubmitting={isCreating}
        categories={categories}
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
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-50">{value}</p>
          <p className="text-[10px] sm:text-xs text-surface-500 truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}
