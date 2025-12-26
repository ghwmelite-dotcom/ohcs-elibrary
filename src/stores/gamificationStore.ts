import { create } from 'zustand';
import type { Level, Badge, UserBadge, XPTransaction, Achievement, Streak, LeaderboardEntry, GamificationStats } from '@/types';

// Level definitions
const levels: Level[] = [
  { id: '1', level: 1, name: 'Newcomer', minXP: 0, maxXP: 99, icon: '🌱', color: '#9CA3AF' },
  { id: '2', level: 2, name: 'Explorer', minXP: 100, maxXP: 499, icon: '🔍', color: '#60A5FA' },
  { id: '3', level: 3, name: 'Contributor', minXP: 500, maxXP: 1499, icon: '📝', color: '#34D399' },
  { id: '4', level: 4, name: 'Scholar', minXP: 1500, maxXP: 3999, icon: '📚', color: '#A78BFA' },
  { id: '5', level: 5, name: 'Expert', minXP: 4000, maxXP: 9999, icon: '🎯', color: '#F59E0B' },
  { id: '6', level: 6, name: 'Mentor', minXP: 10000, maxXP: 24999, icon: '🌟', color: '#EC4899' },
  { id: '7', level: 7, name: 'Champion', minXP: 25000, maxXP: 59999, icon: '🏆', color: '#EF4444' },
  { id: '8', level: 8, name: 'Master', minXP: 60000, maxXP: 149999, icon: '👑', color: '#8B5CF6' },
  { id: '9', level: 9, name: 'Sage', minXP: 150000, maxXP: 499999, icon: '🔮', color: '#06B6D4' },
  { id: '10', level: 10, name: 'Grandmaster', minXP: 500000, maxXP: Infinity, icon: '⭐', color: '#FCD116' },
];

// Badge definitions
const allBadges: Badge[] = [
  // Reading badges
  { id: 'b1', name: 'Bookworm', description: 'Read 10 documents', icon: '📖', category: 'reading', rarity: 'common', xpReward: 50, requirement: 'Read 10 documents', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b2', name: 'Speed Reader', description: 'Read 5 documents in one day', icon: '⚡', category: 'reading', rarity: 'uncommon', xpReward: 100, requirement: 'Read 5 documents in a day', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b3', name: 'Library Explorer', description: 'Read documents from all categories', icon: '🗺️', category: 'reading', rarity: 'rare', xpReward: 200, requirement: 'Read from all 8 categories', isHidden: false, createdAt: new Date().toISOString() },

  // Engagement badges
  { id: 'b4', name: 'Conversationalist', description: 'Post 50 forum messages', icon: '💬', category: 'engagement', rarity: 'common', xpReward: 50, requirement: 'Post 50 forum messages', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b5', name: 'Helpful Hand', description: 'Have 10 answers marked as best', icon: '🤝', category: 'engagement', rarity: 'rare', xpReward: 200, requirement: '10 best answers', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b6', name: 'Community Star', description: 'Receive 100 upvotes', icon: '⭐', category: 'engagement', rarity: 'epic', xpReward: 500, requirement: '100 upvotes received', isHidden: false, createdAt: new Date().toISOString() },

  // Contribution badges
  { id: 'b7', name: 'First Upload', description: 'Upload your first document', icon: '📤', category: 'contribution', rarity: 'common', xpReward: 100, requirement: 'Upload 1 document', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b8', name: 'Top Contributor', description: 'Upload 25 documents', icon: '🏅', category: 'contribution', rarity: 'rare', xpReward: 300, requirement: 'Upload 25 documents', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b9', name: 'Knowledge Sharer', description: 'Have documents downloaded 1000 times', icon: '📊', category: 'contribution', rarity: 'epic', xpReward: 500, requirement: '1000 document downloads', isHidden: false, createdAt: new Date().toISOString() },

  // Learning badges
  { id: 'b10', name: 'Quick Learner', description: 'Complete 5 training documents', icon: '🎓', category: 'learning', rarity: 'common', xpReward: 75, requirement: 'Complete 5 trainings', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b11', name: 'Dedicated Student', description: 'Complete 25 training documents', icon: '📚', category: 'learning', rarity: 'uncommon', xpReward: 150, requirement: 'Complete 25 trainings', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b12', name: 'Training Champion', description: 'Complete all available trainings', icon: '🏆', category: 'learning', rarity: 'legendary', xpReward: 1000, requirement: 'Complete all trainings', isHidden: false, createdAt: new Date().toISOString() },

  // Social badges
  { id: 'b13', name: 'Networker', description: 'Join 5 groups', icon: '🌐', category: 'social', rarity: 'common', xpReward: 50, requirement: 'Join 5 groups', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b14', name: 'Team Player', description: 'Actively participate in 3 groups', icon: '👥', category: 'social', rarity: 'uncommon', xpReward: 100, requirement: 'Active in 3 groups', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b15', name: 'Leader', description: 'Create a group with 50+ members', icon: '👔', category: 'social', rarity: 'rare', xpReward: 250, requirement: 'Lead group with 50+ members', isHidden: false, createdAt: new Date().toISOString() },

  // Special badges
  { id: 'b16', name: 'Pioneer', description: 'Among the first 1000 platform users', icon: '🚀', category: 'special', rarity: 'legendary', xpReward: 500, requirement: 'Early adopter', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b17', name: 'Anniversary', description: 'One year on the platform', icon: '🎂', category: 'special', rarity: 'rare', xpReward: 200, requirement: '1 year membership', isHidden: false, createdAt: new Date().toISOString() },
  { id: 'b18', name: 'Night Owl', description: 'Active between 10 PM and 6 AM', icon: '🦉', category: 'special', rarity: 'uncommon', xpReward: 75, requirement: 'Late night activity', isHidden: true, createdAt: new Date().toISOString() },
];

// Mock leaderboard
const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: '2', xp: 45000, level: 7, badgeCount: 12, user: { id: '2', email: 'kwame.asante@ohcs.gov.gh', staffId: 'GCS-001', firstName: 'Kwame', lastName: 'Asante', displayName: 'Kwame Asante', role: 'director', status: 'active', mdaId: '1', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' } },
  { rank: 2, userId: '3', xp: 38500, level: 7, badgeCount: 10, user: { id: '3', email: 'ama.mensah@mof.gov.gh', staffId: 'GCS-002', firstName: 'Ama', lastName: 'Mensah', displayName: 'Ama Mensah', role: 'admin', status: 'active', mdaId: '2', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' } },
  { rank: 3, userId: '4', xp: 32100, level: 7, badgeCount: 11, user: { id: '4', email: 'kofi.boateng@mod.gov.gh', staffId: 'GCS-003', firstName: 'Kofi', lastName: 'Boateng', displayName: 'Kofi Boateng', role: 'librarian', status: 'active', mdaId: '3', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' } },
  { rank: 4, userId: '5', xp: 28900, level: 6, badgeCount: 9, user: { id: '5', email: 'akua.owusu@moh.gov.gh', staffId: 'GCS-004', firstName: 'Akua', lastName: 'Owusu', displayName: 'Akua Owusu', role: 'contributor', status: 'active', mdaId: '4', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' } },
  { rank: 5, userId: '1', xp: 12500, level: 6, badgeCount: 8, change: 2 },
  { rank: 6, userId: '6', xp: 11200, level: 6, badgeCount: 7, user: { id: '6', email: 'yaw.frimpong@moe.gov.gh', staffId: 'GCS-005', firstName: 'Yaw', lastName: 'Frimpong', displayName: 'Yaw Frimpong', role: 'user', status: 'active', mdaId: '5', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' } },
  { rank: 7, userId: '7', xp: 9800, level: 5, badgeCount: 6, user: { id: '7', email: 'efua.ankrah@moti.gov.gh', staffId: 'GCS-006', firstName: 'Efua', lastName: 'Ankrah', displayName: 'Efua Ankrah', role: 'user', status: 'active', mdaId: '6', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' } },
  { rank: 8, userId: '8', xp: 8500, level: 5, badgeCount: 5, user: { id: '8', email: 'kwesi.darko@gra.gov.gh', staffId: 'GCS-007', firstName: 'Kwesi', lastName: 'Darko', displayName: 'Kwesi Darko', role: 'user', status: 'active', mdaId: '7', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' } },
  { rank: 9, userId: '9', xp: 7200, level: 5, badgeCount: 5, user: { id: '9', email: 'adwoa.sarpong@mlgrd.gov.gh', staffId: 'GCS-008', firstName: 'Adwoa', lastName: 'Sarpong', displayName: 'Adwoa Sarpong', role: 'user', status: 'active', mdaId: '8', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' } },
  { rank: 10, userId: '10', xp: 6100, level: 5, badgeCount: 4, user: { id: '10', email: 'kojo.asiedu@mofa.gov.gh', staffId: 'GCS-009', firstName: 'Kojo', lastName: 'Asiedu', displayName: 'Kojo Asiedu', role: 'user', status: 'active', mdaId: '9', skills: [], interests: [], emailVerified: true, createdAt: '', updatedAt: '' } },
];

interface GamificationState {
  stats: GamificationStats | null;
  levels: Level[];
  allBadges: Badge[];
  leaderboard: LeaderboardEntry[];
  recentXPTransactions: XPTransaction[];
  isLoading: boolean;
  showLevelUpModal: boolean;
  showXPNotification: boolean;
  lastXPGain: { amount: number; reason: string } | null;
}

interface GamificationActions {
  fetchStats: () => Promise<void>;
  fetchLeaderboard: (period?: 'daily' | 'weekly' | 'monthly' | 'allTime') => Promise<void>;
  awardXP: (amount: number, reason: string, sourceType: string, sourceId?: string) => void;
  checkAchievements: () => Promise<void>;
  dismissLevelUpModal: () => void;
  dismissXPNotification: () => void;
  getLevelByXP: (xp: number) => Level;
  getProgressToNextLevel: (xp: number) => { current: number; required: number; percentage: number };
}

type GamificationStore = GamificationState & GamificationActions;

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  // Initial state
  stats: null,
  levels,
  allBadges,
  leaderboard: [],
  recentXPTransactions: [],
  isLoading: false,
  showLevelUpModal: false,
  showXPNotification: false,
  lastXPGain: null,

  // Actions
  fetchStats: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const currentXP = 12500;
    const currentLevel = get().getLevelByXP(currentXP);
    const nextLevel = levels.find((l) => l.level === currentLevel.level + 1);

    const userBadges: UserBadge[] = [
      { id: '1', userId: '1', badgeId: 'b1', badge: allBadges[0], earnedAt: '2024-01-15T10:00:00Z' },
      { id: '2', userId: '1', badgeId: 'b4', badge: allBadges[3], earnedAt: '2024-01-20T14:00:00Z' },
      { id: '3', userId: '1', badgeId: 'b7', badge: allBadges[6], earnedAt: '2024-02-01T09:00:00Z' },
      { id: '4', userId: '1', badgeId: 'b10', badge: allBadges[9], earnedAt: '2024-02-10T11:00:00Z' },
      { id: '5', userId: '1', badgeId: 'b13', badge: allBadges[12], earnedAt: '2024-02-15T08:00:00Z' },
      { id: '6', userId: '1', badgeId: 'b16', badge: allBadges[15], earnedAt: '2024-01-01T00:00:00Z' },
      { id: '7', userId: '1', badgeId: 'b2', badge: allBadges[1], earnedAt: '2024-03-01T10:00:00Z' },
      { id: '8', userId: '1', badgeId: 'b11', badge: allBadges[10], earnedAt: '2024-03-05T14:00:00Z' },
    ];

    const streaks: Streak[] = [
      { id: '1', userId: '1', type: 'login', currentStreak: 15, longestStreak: 32, lastActivityAt: new Date().toISOString() },
      { id: '2', userId: '1', type: 'reading', currentStreak: 7, longestStreak: 14, lastActivityAt: new Date().toISOString() },
    ];

    const achievements: Achievement[] = [
      { id: '1', name: 'First Steps', description: 'Log in for the first time', icon: '👋', category: 'onboarding', xpReward: 10, requirement: { type: 'login', target: 1, current: 1 }, isUnlocked: true, unlockedAt: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'Profile Complete', description: 'Complete your profile', icon: '✅', category: 'onboarding', xpReward: 50, requirement: { type: 'profile', target: 100, current: 100 }, isUnlocked: true, unlockedAt: '2024-01-05T10:00:00Z' },
      { id: '3', name: 'Week Warrior', description: 'Log in 7 days in a row', icon: '🔥', category: 'streak', xpReward: 100, requirement: { type: 'login_streak', target: 7, current: 15 }, isUnlocked: true, unlockedAt: '2024-01-15T08:00:00Z' },
      { id: '4', name: 'Month Master', description: 'Log in 30 days in a row', icon: '📅', category: 'streak', xpReward: 500, requirement: { type: 'login_streak', target: 30, current: 15 } },
      { id: '5', name: 'Century Club', description: 'Earn 100 XP', icon: '💯', category: 'xp', xpReward: 25, requirement: { type: 'xp', target: 100, current: 12500 }, isUnlocked: true, unlockedAt: '2024-01-02T09:00:00Z' },
    ];

    const stats: GamificationStats = {
      totalXP: currentXP,
      level: currentLevel,
      nextLevel,
      xpToNextLevel: nextLevel ? nextLevel.minXP - currentXP : 0,
      xpProgress: nextLevel
        ? ((currentXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
        : 100,
      badges: userBadges,
      badgeCount: userBadges.length,
      achievements,
      streaks,
      rank: 5,
      rankChange: 2,
    };

    set({ stats, isLoading: false });
  },

  fetchLeaderboard: async (period = 'weekly') => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    // In real implementation, filter by period
    console.log('Fetching leaderboard for period:', period);
    set({ leaderboard: mockLeaderboard, isLoading: false });
  },

  awardXP: (amount: number, reason: string, sourceType: string, sourceId?: string) => {
    const { stats } = get();
    if (!stats) return;

    const newXP = stats.totalXP + amount;
    const currentLevel = get().getLevelByXP(stats.totalXP);
    const newLevel = get().getLevelByXP(newXP);

    const transaction: XPTransaction = {
      id: Date.now().toString(),
      userId: '1',
      amount,
      reason,
      sourceType: sourceType as XPTransaction['sourceType'],
      sourceId,
      createdAt: new Date().toISOString(),
    };

    const showLevelUp = newLevel.level > currentLevel.level;

    set((state) => ({
      stats: state.stats
        ? {
            ...state.stats,
            totalXP: newXP,
            level: newLevel,
            xpToNextLevel: get().getProgressToNextLevel(newXP).required - newXP,
            xpProgress: get().getProgressToNextLevel(newXP).percentage,
          }
        : null,
      recentXPTransactions: [transaction, ...state.recentXPTransactions].slice(0, 50),
      showLevelUpModal: showLevelUp,
      showXPNotification: true,
      lastXPGain: { amount, reason },
    }));

    // Auto-dismiss XP notification after 3 seconds
    setTimeout(() => {
      set({ showXPNotification: false, lastXPGain: null });
    }, 3000);
  },

  checkAchievements: async () => {
    // In real implementation, check and award achievements
    await new Promise((resolve) => setTimeout(resolve, 100));
  },

  dismissLevelUpModal: () => {
    set({ showLevelUpModal: false });
  },

  dismissXPNotification: () => {
    set({ showXPNotification: false, lastXPGain: null });
  },

  getLevelByXP: (xp: number): Level => {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (xp >= levels[i]!.minXP) {
        return levels[i]!;
      }
    }
    return levels[0]!;
  },

  getProgressToNextLevel: (xp: number) => {
    const currentLevel = get().getLevelByXP(xp);
    const nextLevel = levels.find((l) => l.level === currentLevel.level + 1);

    if (!nextLevel) {
      return { current: xp, required: xp, percentage: 100 };
    }

    const levelStartXP = currentLevel.minXP;
    const levelEndXP = nextLevel.minXP;
    const progress = xp - levelStartXP;
    const required = levelEndXP - levelStartXP;
    const percentage = (progress / required) * 100;

    return { current: progress, required, percentage };
  },
}));
