import { create } from 'zustand';
import type { Level, Badge, UserBadge, XPTransaction, Achievement as AchievementType, Streak, LeaderboardEntry, GamificationStats } from '@/types';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://api.ohcselibrary.xyz/api/v1'
  : '/api/v1';

// Helper to get auth token
const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

// Helper for authenticated fetch
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
};

// Level definitions (static)
const levels: Level[] = [
  { id: '1', level: 1, name: 'Newcomer', minXP: 0, maxXP: 99, icon: '🌱', color: '#9CA3AF' },
  { id: '2', level: 2, name: 'Learner', minXP: 100, maxXP: 299, icon: '📖', color: '#60A5FA' },
  { id: '3', level: 3, name: 'Contributor', minXP: 300, maxXP: 599, icon: '📝', color: '#34D399' },
  { id: '4', level: 4, name: 'Active Member', minXP: 600, maxXP: 999, icon: '⚡', color: '#A78BFA' },
  { id: '5', level: 5, name: 'Rising Star', minXP: 1000, maxXP: 1499, icon: '🌟', color: '#F59E0B' },
  { id: '6', level: 6, name: 'Established', minXP: 1500, maxXP: 2499, icon: '🎯', color: '#EC4899' },
  { id: '7', level: 7, name: 'Expert', minXP: 2500, maxXP: 3999, icon: '🏆', color: '#EF4444' },
  { id: '8', level: 8, name: 'Mentor', minXP: 4000, maxXP: 5999, icon: '👑', color: '#8B5CF6' },
  { id: '9', level: 9, name: 'Master', minXP: 6000, maxXP: 9999, icon: '🔮', color: '#06B6D4' },
  { id: '10', level: 10, name: 'Grandmaster', minXP: 10000, maxXP: Infinity, icon: '⭐', color: '#FCD116' },
];

interface QuickStats {
  totalXp: number;
  level: number;
  levelTitle: string;
  xpToNextLevel: number;
  xpProgress: number;
  currentStreak: number;
  longestStreak: number;
  badgesEarned: number;
  xpToday: number;
  rank: number;
  documentsRead: number;
  forumPosts: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetType: string;
  targetValue: number;
  xpReward: number;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: string;
  startDate: string;
  endDate: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  triggerType: string;
  triggerValue: number;
  xpReward: number;
  rarity: string;
  earned: boolean;
  earnedAt?: string;
  isNew?: boolean;
}

interface MDALeaderboardEntry {
  rank: number;
  mdaId: string;
  mdaName: string;
  abbreviation: string;
  memberCount: number;
  totalXp: number;
  avgXp: number;
  documentsRead: number;
  forumActivity: number;
}

interface UserRank {
  rank: number;
  totalUsers: number;
  change: number;
  percentile: number;
  scope: 'national' | 'mda';
}

interface GamificationState {
  stats: GamificationStats | null;
  quickStats: QuickStats | null;
  levels: Level[];
  allBadges: Badge[];
  leaderboard: LeaderboardEntry[];
  mdaLeaderboard: MDALeaderboardEntry[];
  challenges: Challenge[];
  achievements: Achievement[];
  userRank: UserRank | null;
  activityHeatmap: { date: string; xpEarned: number; activityCount: number }[];
  recentXPTransactions: XPTransaction[];
  activities: any[];
  isLoading: boolean;
  showLevelUpModal: boolean;
  showXPNotification: boolean;
  lastXPGain: { amount: number; reason: string } | null;
}

interface GamificationActions {
  fetchStats: () => Promise<void>;
  fetchQuickStats: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  fetchLeaderboard: (period?: 'daily' | 'weekly' | 'monthly' | 'allTime') => Promise<void>;
  fetchMDALeaderboard: () => Promise<void>;
  fetchChallenges: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchUserRank: (scope?: 'national' | 'mda') => Promise<void>;
  fetchActivityHeatmap: () => Promise<void>;
  fetchActivities: (limit?: number) => Promise<void>;
  updateStreak: () => Promise<void>;
  updateChallengeProgress: (challengeId: string, progress: number) => Promise<void>;
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
  quickStats: null,
  levels,
  allBadges: [],
  leaderboard: [],
  mdaLeaderboard: [],
  challenges: [],
  achievements: [],
  userRank: null,
  activityHeatmap: [],
  recentXPTransactions: [],
  activities: [],
  isLoading: false,
  showLevelUpModal: false,
  showXPNotification: false,
  lastXPGain: null,

  // Actions
  fetchStats: async () => {
    set({ isLoading: true });

    try {
      const response = await authFetch(`${API_BASE}/gamification/stats`);

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();

      const currentLevel = get().getLevelByXP(data.totalXp || 0);
      const nextLevel = levels.find((l) => l.level === currentLevel.level + 1);

      const stats: GamificationStats = {
        totalXP: data.totalXp || 0,
        level: currentLevel,
        nextLevel,
        xpToNextLevel: data.xpNeeded || 0,
        xpProgress: data.progressPercent || 0,
        badges: [],
        badgeCount: data.badgesEarned || 0,
        achievements: [],
        streaks: [
          {
            id: '1',
            userId: data.userId,
            type: 'login',
            currentStreak: data.currentStreak || 0,
            longestStreak: data.longestStreak || 0,
            lastActivityAt: new Date().toISOString(),
          },
        ],
        rank: 0,
        rankChange: 0,
      };

      set({ stats, isLoading: false });
    } catch (error) {
      console.error('Error fetching stats:', error);

      // Fallback to mock data if API fails
      const currentLevel = get().getLevelByXP(0);
      const nextLevel = levels.find((l) => l.level === currentLevel.level + 1);

      set({
        stats: {
          totalXP: 0,
          level: currentLevel,
          nextLevel,
          xpToNextLevel: 100,
          xpProgress: 0,
          badges: [],
          badgeCount: 0,
          achievements: [],
          streaks: [],
          rank: 0,
          rankChange: 0,
        },
        isLoading: false,
      });
    }
  },

  fetchQuickStats: async () => {
    try {
      const response = await authFetch(`${API_BASE}/gamification/quick-stats`);

      if (!response.ok) {
        return;
      }

      const quickStats = await response.json();
      set({ quickStats });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  },

  fetchBadges: async () => {
    try {
      const response = await authFetch(`${API_BASE}/gamification/badges`);

      if (!response.ok) {
        return;
      }

      const badges = await response.json();

      // Transform API badges to match the Badge type
      const transformedBadges: Badge[] = (badges || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        category: b.category,
        rarity: b.rarity,
        xpReward: b.xpReward,
        requirement: b.description,
        isHidden: false,
        createdAt: b.createdAt,
        earned: b.earned === 1,
        earnedAt: b.earnedAt,
      }));

      set({ allBadges: transformedBadges });
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  },

  fetchLeaderboard: async (period = 'weekly') => {
    set({ isLoading: true });

    try {
      const apiPeriod = period === 'allTime' ? 'all' : period;
      const response = await fetch(`${API_BASE}/gamification/leaderboard?period=${apiPeriod}&limit=10`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();

      const leaderboard: LeaderboardEntry[] = (data || []).map((entry: any) => ({
        rank: entry.rank,
        userId: entry.id,
        xp: entry.xp || 0,
        level: entry.levelInfo?.level || 1,
        badgeCount: entry.badgesEarned || 0,
        user: {
          id: entry.id,
          email: '',
          staffId: '',
          firstName: entry.displayName?.split(' ')[0] || '',
          lastName: entry.displayName?.split(' ').slice(1).join(' ') || '',
          displayName: entry.displayName || 'Anonymous',
          role: 'user',
          status: 'active',
          mdaId: '',
          skills: [],
          interests: [],
          emailVerified: true,
          createdAt: '',
          updatedAt: '',
          avatar: entry.avatar,
        },
      }));

      set({ leaderboard, isLoading: false });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      set({ leaderboard: [], isLoading: false });
    }
  },

  fetchMDALeaderboard: async () => {
    try {
      const response = await fetch(`${API_BASE}/gamification/mda-leaderboard?limit=10`);

      if (!response.ok) {
        return;
      }

      const mdaLeaderboard = await response.json();
      set({ mdaLeaderboard });
    } catch (error) {
      console.error('Error fetching MDA leaderboard:', error);
      set({ mdaLeaderboard: [] });
    }
  },

  fetchChallenges: async () => {
    try {
      const response = await authFetch(`${API_BASE}/gamification/challenges`);

      if (!response.ok) {
        return;
      }

      const challenges = await response.json();
      set({ challenges });
    } catch (error) {
      console.error('Error fetching challenges:', error);
      set({ challenges: [] });
    }
  },

  fetchAchievements: async () => {
    try {
      const response = await authFetch(`${API_BASE}/gamification/achievements`);

      if (!response.ok) {
        return;
      }

      const achievements = await response.json();
      set({ achievements });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      set({ achievements: [] });
    }
  },

  fetchUserRank: async (scope = 'national') => {
    try {
      const response = await authFetch(`${API_BASE}/gamification/user-rank?scope=${scope}`);

      if (!response.ok) {
        return;
      }

      const userRank = await response.json();
      set({ userRank });
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  },

  fetchActivityHeatmap: async () => {
    try {
      const response = await authFetch(`${API_BASE}/gamification/activity-heatmap`);

      if (!response.ok) {
        return;
      }

      const activityHeatmap = await response.json();
      set({ activityHeatmap });
    } catch (error) {
      console.error('Error fetching activity heatmap:', error);
      set({ activityHeatmap: [] });
    }
  },

  fetchActivities: async (limit = 10) => {
    try {
      const response = await authFetch(`${API_BASE}/gamification/activity?limit=${limit}`);

      if (!response.ok) {
        return;
      }

      const activities = await response.json();
      set({ activities });
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  },

  updateChallengeProgress: async (challengeId: string, progress: number) => {
    try {
      const response = await authFetch(`${API_BASE}/gamification/challenges/${challengeId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) {
        return;
      }

      const updated = await response.json();

      // Optimistically update the challenge in state
      set((state) => ({
        challenges: state.challenges.map((c) =>
          c.id === challengeId
            ? {
                ...c,
                currentProgress: updated.currentProgress ?? progress,
                isCompleted: updated.isCompleted ?? c.isCompleted,
                completedAt: updated.completedAt ?? c.completedAt,
              }
            : c
        ),
      }));

      // Refresh quick stats in case XP was awarded
      get().fetchQuickStats();
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  },

  updateStreak: async () => {
    try {
      const response = await authFetch(`${API_BASE}/gamification/streak`, {
        method: 'POST',
      });

      if (!response.ok) {
        return;
      }

      const result = await response.json();

      set((state) => ({
        stats: state.stats
          ? {
              ...state.stats,
              streaks: state.stats.streaks.map((s) =>
                s.type === 'login'
                  ? { ...s, currentStreak: result.currentStreak, longestStreak: result.longestStreak }
                  : s
              ),
            }
          : null,
      }));
    } catch (error) {
      console.error('Error updating streak:', error);
    }
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
