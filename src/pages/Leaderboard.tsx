import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Crown,
  Medal,
  TrendingUp,
  Users,
  Building2,
  Flame,
  Target,
  Sparkles,
  Zap,
  BookOpen,
  MessageSquare,
  Award,
  Star,
  ChevronRight,
} from 'lucide-react';
import {
  LeaderboardTable,
  LevelProgress,
  BadgeGrid,
  StreakDisplay,
  AchievementList,
  XPHistory,
  Podium,
  WeeklyChallenges,
  ActivityHeatmap,
  MDALeaderboard,
  StatsCard,
  StatsCardGrid,
} from '@/components/gamification';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { cn } from '@/utils/cn';

type Period = 'daily' | 'weekly' | 'monthly' | 'allTime';
type LeaderboardType = 'national' | 'mda';
type Tab = 'leaderboard' | 'achievements' | 'badges' | 'activity';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const {
    leaderboard,
    mdaLeaderboard,
    quickStats,
    challenges,
    achievements,
    allBadges,
    activityHeatmap,
    userRank,
    activities,
    isLoading,
    fetchLeaderboard,
    fetchMDALeaderboard,
    fetchQuickStats,
    fetchChallenges,
    fetchAchievements,
    fetchBadges,
    fetchActivityHeatmap,
    fetchUserRank,
    fetchActivities,
  } = useGamificationStore();

  const [period, setPeriod] = useState<Period>('weekly');
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('national');
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');

  // Fetch all data on mount
  useEffect(() => {
    fetchQuickStats();
    fetchLeaderboard(period);
    fetchMDALeaderboard();
    fetchChallenges();
    fetchAchievements();
    fetchBadges();
    fetchActivityHeatmap();
    fetchUserRank();
    fetchActivities(10);
  }, []);

  // Refetch leaderboard when period changes
  useEffect(() => {
    fetchLeaderboard(period);
  }, [period, fetchLeaderboard]);

  const periods: { value: Period; label: string }[] = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'allTime', label: 'All Time' },
  ];

  const tabs = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'achievements', label: 'Achievements', icon: Medal },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'activity', label: 'Activity', icon: Zap },
  ];

  // Transform leaderboard data for podium
  const podiumUsers = leaderboard.slice(0, 3).map((entry) => ({
    userId: entry.userId,
    name: entry.user?.displayName || 'Anonymous',
    avatar: entry.user?.avatar,
    xp: entry.xp,
    level: entry.level,
    rank: entry.rank,
  }));

  // Transform leaderboard for table
  const tableEntries = leaderboard.map((entry) => ({
    userId: entry.userId,
    name: entry.user?.displayName || 'Anonymous',
    avatar: entry.user?.avatar,
    xp: entry.xp,
    level: entry.level,
    rank: entry.rank,
    change: 0,
    mda: '',
  }));

  // Show skeleton while loading
  if (isLoading && !quickStats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 rounded-2xl p-6 md:p-8 overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Floating Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[Trophy, Star, Crown, Medal].map((Icon, i) => (
            <motion.div
              key={i}
              className="absolute text-white/10"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.1, 0.2, 0.1],
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 4,
                delay: i * 0.5,
                repeat: Infinity,
              }}
              style={{
                left: `${20 + i * 20}%`,
                top: `${30 + (i % 2) * 30}%`,
              }}
            >
              <Icon className="w-12 h-12" />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            >
              <Trophy className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Leaderboard & Achievements
              </h1>
              <p className="text-white/80 mt-1">
                Compete, earn XP, and climb the ranks!
              </p>
            </div>
          </div>

          {/* User Rank Card */}
          {userRank && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-1">
                    <span className="text-xl font-bold text-white">#{userRank.rank}</span>
                  </div>
                  <p className="text-white/80 text-xs">Your Rank</p>
                </div>
                <div className="h-12 w-px bg-white/20" />
                <div>
                  <p className="text-white/80 text-sm">Top {userRank.percentile}%</p>
                  <p className="text-white font-semibold">of all users</p>
                  {userRank.change !== 0 && (
                    <div className={cn(
                      'flex items-center gap-1 text-sm mt-1',
                      userRank.change > 0 ? 'text-success-300' : 'text-error-300'
                    )}>
                      <TrendingUp className={cn('w-4 h-4', userRank.change < 0 && 'rotate-180')} />
                      {Math.abs(userRank.change)} this week
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <StatsCardGrid columns={4}>
        <StatsCard
          title="Total XP"
          value={quickStats?.totalXp || 0}
          icon={Zap}
          color="primary"
          description={`Level ${quickStats?.level || 1} • ${quickStats?.levelTitle || 'Newcomer'}`}
          delay={0}
        />
        <StatsCard
          title="Current Streak"
          value={quickStats?.currentStreak || 0}
          suffix=" days"
          icon={Flame}
          color="warning"
          description={`Longest: ${quickStats?.longestStreak || 0} days`}
          delay={0.1}
        />
        <StatsCard
          title="Badges Earned"
          value={quickStats?.badgesEarned || 0}
          icon={Award}
          color="secondary"
          description="Collect them all!"
          delay={0.2}
        />
        <StatsCard
          title="XP Today"
          value={quickStats?.xpToday || 0}
          prefix="+"
          icon={Sparkles}
          color="success"
          description="Keep it up!"
          delay={0.3}
        />
      </StatsCardGrid>

      {/* Level Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <LevelProgress
          level={quickStats?.level || 1}
          levelName={quickStats?.levelTitle || 'Newcomer'}
          currentXP={quickStats?.xpProgress ? Math.round((quickStats.xpProgress / 100) * (quickStats.xpToNextLevel || 100)) : 0}
          requiredXP={quickStats?.xpToNextLevel || 100}
          totalXP={quickStats?.totalXp || 0}
          showDetails
          size="lg"
        />
      </motion.div>

      {/* Weekly Challenges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <WeeklyChallenges challenges={challenges} />
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-surface-200 dark:border-surface-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Period Filter */}
              <div className="flex items-center gap-2 bg-white dark:bg-surface-800 rounded-lg p-1 shadow-sm">
                {periods.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      period === p.value
                        ? 'bg-primary-600 text-white'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2 bg-white dark:bg-surface-800 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setLeaderboardType('national')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    leaderboardType === 'national'
                      ? 'bg-primary-600 text-white'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                  )}
                >
                  <Users className="w-4 h-4" />
                  National
                </button>
                <button
                  onClick={() => setLeaderboardType('mda')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    leaderboardType === 'mda'
                      ? 'bg-primary-600 text-white'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  MDA Rankings
                </button>
              </div>
            </div>

            {leaderboardType === 'national' ? (
              <>
                {/* Podium */}
                {podiumUsers.length >= 3 && (
                  <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 py-6">
                    <Podium users={podiumUsers} currentUserId={user?.id} />
                  </div>
                )}

                {/* Full Leaderboard */}
                <LeaderboardTable
                  entries={tableEntries}
                  currentUserId={user?.id}
                  period={period}
                  showPodium={false}
                />
              </>
            ) : (
              <MDALeaderboard
                entries={mdaLeaderboard}
                userMdaId={user?.mdaId}
              />
            )}
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Streak Display */}
            <StreakDisplay
              currentStreak={quickStats?.currentStreak || 0}
              longestStreak={quickStats?.longestStreak || 0}
              lastActivityDate={new Date().toISOString()}
              weeklyActivity={[true, true, false, true, true, true, true]}
            />

            {/* Achievements List */}
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Achievements ({achievements.filter((a) => a.earned).length}/{achievements.length})
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {achievements.length === 0 ? (
                  <p className="text-surface-500 text-center py-4">Loading achievements...</p>
                ) : (
                  achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg transition-colors',
                        achievement.earned
                          ? 'bg-success-50 dark:bg-success-900/20'
                          : 'bg-surface-50 dark:bg-surface-700/50 opacity-60'
                      )}
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <p className={cn(
                          'font-medium',
                          achievement.earned
                            ? 'text-success-700 dark:text-success-400'
                            : 'text-surface-600 dark:text-surface-400'
                        )}>
                          {achievement.name}
                        </p>
                        <p className="text-sm text-surface-500">{achievement.description}</p>
                      </div>
                      <span className={cn(
                        'text-sm font-bold px-2 py-0.5 rounded',
                        achievement.earned
                          ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                          : 'bg-surface-100 text-surface-500 dark:bg-surface-600 dark:text-surface-400'
                      )}>
                        +{achievement.xpReward} XP
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* XP History */}
            <div className="lg:col-span-2">
              <XPHistory
                history={activities.map((a: any) => ({
                  id: a.id,
                  amount: a.xpEarned || 0,
                  reason: a.title,
                  timestamp: a.createdAt,
                  category: a.activityType,
                }))}
                maxItems={10}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'badges' && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BadgeGrid
              badges={allBadges.map((b) => ({
                id: b.id,
                name: b.name,
                description: b.description || '',
                icon: b.icon,
                rarity: (b.rarity as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary') || 'common',
                earnedAt: b.earnedAt,
                category: b.category,
                isNew: false,
              }))}
              columns={4}
            />
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Activity Heatmap */}
            <ActivityHeatmap data={activityHeatmap} weeks={12} />

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                title="Documents Read"
                value={quickStats?.documentsRead || 0}
                icon={BookOpen}
                color="primary"
                delay={0}
              />
              <StatsCard
                title="Forum Contributions"
                value={quickStats?.forumPosts || 0}
                icon={MessageSquare}
                color="secondary"
                delay={0.1}
              />
              <StatsCard
                title="National Rank"
                value={userRank?.rank || 0}
                prefix="#"
                icon={Trophy}
                color="warning"
                description={`Top ${userRank?.percentile || 0}% of users`}
                delay={0.2}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How to Earn XP Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6"
      >
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          How to Earn XP
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { action: 'Daily Login', xp: '50 XP', icon: '🔐' },
            { action: 'Read Document', xp: '25 XP', icon: '📄' },
            { action: 'Upload Document', xp: '100 XP', icon: '📤' },
            { action: 'Forum Post', xp: '30 XP', icon: '💬' },
            { action: 'Get Upvote', xp: '15 XP', icon: '👍' },
            { action: 'Join Group', xp: '20 XP', icon: '👥' },
            { action: 'Complete Profile', xp: '200 XP', icon: '✅' },
            { action: 'Earn Badge', xp: '50-500 XP', icon: '🏆' },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="bg-white dark:bg-surface-800 rounded-lg p-3 text-center hover:shadow-md transition-shadow"
            >
              <span className="text-2xl mb-2 block">{item.icon}</span>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                {item.action}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 font-bold">
                +{item.xp}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
