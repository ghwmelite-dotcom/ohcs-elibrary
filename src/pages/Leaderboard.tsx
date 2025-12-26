import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, TrendingUp, Users, Building2, Calendar, Filter, ChevronDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LeaderboardTable, LevelProgress, BadgeGrid, StreakDisplay, AchievementList, XPHistory } from '@/components/gamification';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { cn } from '@/utils/cn';

type Period = 'daily' | 'weekly' | 'monthly' | 'all-time';
type LeaderboardType = 'national' | 'mda';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const {
    leaderboard,
    userStats,
    badges,
    achievements,
    xpHistory,
    fetchLeaderboard
  } = useGamificationStore();

  const [period, setPeriod] = useState<Period>('weekly');
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('national');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements' | 'badges'>('leaderboard');

  const periods: { value: Period; label: string }[] = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'all-time', label: 'All Time' },
  ];

  // Mock data for demonstration
  const mockLeaderboard = [
    { userId: '1', name: 'Kwame Asante', avatar: '', xp: 15420, level: 8, rank: 1, change: 2, mda: 'Ministry of Finance' },
    { userId: '2', name: 'Ama Serwaa', avatar: '', xp: 14850, level: 8, rank: 2, change: -1, mda: 'Public Services Commission' },
    { userId: '3', name: 'Kofi Mensah', avatar: '', xp: 13200, level: 7, rank: 3, change: 1, mda: 'Ministry of Health' },
    { userId: '4', name: 'Abena Pokua', avatar: '', xp: 12100, level: 7, rank: 4, change: 0, mda: 'Ministry of Education' },
    { userId: '5', name: 'Yaw Boateng', avatar: '', xp: 11500, level: 6, rank: 5, change: 3, mda: 'OHCS' },
    { userId: user?.id || '6', name: user?.name || 'You', avatar: user?.avatar || '', xp: 10200, level: 6, rank: 6, change: -2, mda: user?.mda || 'OHCS' },
    { userId: '7', name: 'Efua Ankrah', avatar: '', xp: 9800, level: 6, rank: 7, change: 1, mda: 'Ministry of Foreign Affairs' },
    { userId: '8', name: 'Kwesi Appiah', avatar: '', xp: 9200, level: 5, rank: 8, change: -1, mda: 'Ministry of Justice' },
    { userId: '9', name: 'Akosua Darko', avatar: '', xp: 8700, level: 5, rank: 9, change: 0, mda: 'Ministry of Trade' },
    { userId: '10', name: 'Nana Yeboah', avatar: '', xp: 8100, level: 5, rank: 10, change: 2, mda: 'Ministry of Communications' },
  ];

  const mockUserStats = {
    level: 6,
    levelName: 'Expert',
    currentXP: 2200,
    requiredXP: 3000,
    totalXP: 10200,
    rank: 6,
    rankChange: -2,
    streak: 12,
    longestStreak: 21,
    lastActivityDate: new Date().toISOString(),
    weeklyActivity: [true, true, false, true, true, true, true],
  };

  const mockBadges = [
    { id: '1', name: 'First Steps', description: 'Complete your profile', icon: '👋', rarity: 'common' as const, earnedAt: '2024-01-15', category: 'onboarding' },
    { id: '2', name: 'Bookworm', description: 'Read 10 documents', icon: '📚', rarity: 'uncommon' as const, earnedAt: '2024-01-20', category: 'library' },
    { id: '3', name: 'Contributor', description: 'Upload 5 documents', icon: '📤', rarity: 'rare' as const, earnedAt: '2024-02-01', category: 'library' },
    { id: '4', name: 'Helpful', description: 'Get 10 upvotes on forum posts', icon: '👍', rarity: 'uncommon' as const, earnedAt: '2024-02-10', category: 'forum' },
    { id: '5', name: 'Socialite', description: 'Join 5 groups', icon: '👥', rarity: 'common' as const, earnedAt: '2024-02-15', category: 'social' },
    { id: '6', name: 'Fire Starter', description: '7-day login streak', icon: '🔥', rarity: 'uncommon' as const, earnedAt: '2024-02-20', category: 'engagement', isNew: true },
    { id: '7', name: 'Legend', description: 'Reach level 10', icon: '🏆', rarity: 'legendary' as const, category: 'progression' },
    { id: '8', name: 'Master Reviewer', description: 'Rate 50 documents', icon: '⭐', rarity: 'epic' as const, category: 'library' },
  ];

  const mockAchievements = [
    { id: '1', title: '7-Day Streak!', description: 'Logged in for 7 consecutive days', icon: '🔥', xpEarned: 100, earnedAt: new Date().toISOString(), category: 'streak' },
    { id: '2', title: 'Document Master', description: 'Read 50 documents', icon: '📚', xpEarned: 250, earnedAt: new Date(Date.now() - 86400000).toISOString(), category: 'library' },
    { id: '3', title: 'Forum Star', description: 'Received 25 upvotes', icon: '⭐', xpEarned: 150, earnedAt: new Date(Date.now() - 172800000).toISOString(), category: 'forum' },
  ];

  const mockXPHistory = [
    { id: '1', amount: 50, reason: 'Daily login bonus', timestamp: new Date().toISOString(), category: 'login' },
    { id: '2', amount: 25, reason: 'Read: Annual Budget Report 2024', timestamp: new Date(Date.now() - 3600000).toISOString(), category: 'document' },
    { id: '3', amount: 15, reason: 'Forum post upvoted', timestamp: new Date(Date.now() - 7200000).toISOString(), category: 'forum' },
    { id: '4', amount: 100, reason: 'Earned badge: Fire Starter', timestamp: new Date(Date.now() - 86400000).toISOString(), category: 'badge' },
    { id: '5', amount: 10, reason: 'Joined study group', timestamp: new Date(Date.now() - 172800000).toISOString(), category: 'group' },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                Leaderboard & Achievements
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Track your progress and compete with colleagues
              </p>
            </div>
          </div>
        </div>

        {/* User Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Level Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 md:col-span-2"
          >
            <LevelProgress
              level={mockUserStats.level}
              levelName={mockUserStats.levelName}
              currentXP={mockUserStats.currentXP}
              requiredXP={mockUserStats.requiredXP}
              totalXP={mockUserStats.totalXP}
              showDetails
              size="lg"
            />
          </motion.div>

          {/* Rank Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                {mockUserStats.rank <= 3 ? (
                  mockUserStats.rank === 1 ? (
                    <Crown className="w-8 h-8 text-white" />
                  ) : (
                    <Medal className="w-8 h-8 text-white" />
                  )
                ) : (
                  <span className="text-2xl font-bold text-white">#{mockUserStats.rank}</span>
                )}
              </div>
              <p className="text-4xl font-bold text-surface-900 dark:text-surface-50">
                #{mockUserStats.rank}
              </p>
              <p className="text-surface-600 dark:text-surface-400 mb-2">
                Your Rank
              </p>
              <div className={cn(
                'inline-flex items-center gap-1 text-sm font-medium',
                mockUserStats.rankChange > 0 ? 'text-success-600' :
                mockUserStats.rankChange < 0 ? 'text-error-600' : 'text-surface-500'
              )}>
                <TrendingUp className={cn(
                  'w-4 h-4',
                  mockUserStats.rankChange < 0 && 'rotate-180'
                )} />
                {mockUserStats.rankChange > 0 ? '+' : ''}{mockUserStats.rankChange} this week
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-surface-200 dark:border-surface-700">
          {[
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'achievements', label: 'Achievements', icon: Medal },
            { id: 'badges', label: 'Badges', icon: Crown },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 font-medium border-b-2 -mb-px transition-colors',
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

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
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
                  My MDA
                </button>
              </div>
            </div>

            {/* Leaderboard Table */}
            <LeaderboardTable
              entries={mockLeaderboard}
              currentUserId={user?.id || '6'}
              period={period}
              showPodium
            />
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Streak Display */}
            <StreakDisplay
              currentStreak={mockUserStats.streak}
              longestStreak={mockUserStats.longestStreak}
              lastActivityDate={mockUserStats.lastActivityDate}
              weeklyActivity={mockUserStats.weeklyActivity}
            />

            {/* Recent Achievements */}
            <AchievementList
              achievements={mockAchievements}
              maxItems={5}
            />

            {/* XP History */}
            <div className="lg:col-span-2">
              <XPHistory
                history={mockXPHistory}
                maxItems={10}
              />
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <BadgeGrid
            badges={mockBadges}
            columns={4}
          />
        )}

        {/* How to Earn XP Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6"
        >
          <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
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
              <div
                key={index}
                className="bg-white dark:bg-surface-800 rounded-lg p-3 text-center"
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                  {item.action}
                </p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 font-bold">
                  +{item.xp}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
