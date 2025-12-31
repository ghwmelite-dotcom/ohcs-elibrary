/**
 * Analytics Store
 * Manages analytics data fetching and state
 */

import { create } from 'zustand';
import { useAuthStore } from './authStore';
import type {
  AnalyticsOverview,
  UserGrowthData,
  ContentDistribution,
  EngagementData,
  TopContent,
  MDAStats,
  ActivityItem,
  QuickStats,
  AnalyticsState,
} from '@/types/analytics';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AnalyticsActions {
  fetchOverview: (days?: number) => Promise<void>;
  fetchUserGrowth: (months?: number) => Promise<void>;
  fetchContentDistribution: () => Promise<void>;
  fetchEngagement: (days?: number) => Promise<void>;
  fetchTopContent: (limit?: number) => Promise<void>;
  fetchMDALeaderboard: (limit?: number) => Promise<void>;
  fetchRecentActivity: (limit?: number) => Promise<void>;
  fetchActivityHeatmap: () => Promise<void>;
  fetchQuickStats: () => Promise<void>;
  fetchAllAnalytics: (days?: number) => Promise<void>;
  clearError: () => void;
}

const getAuthHeaders = (): HeadersInit => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>((set, get) => ({
  // Initial state
  overview: null,
  userGrowth: [],
  contentDistribution: [],
  engagement: [],
  topContent: [],
  mdaLeaderboard: [],
  recentActivity: [],
  heatmapData: [],
  quickStats: null,
  loading: false,
  error: null,

  fetchOverview: async (days = 30) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/overview?days=${days}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch overview');

      const data: AnalyticsOverview = await response.json();
      set({ overview: data });
    } catch (error) {
      console.error('Failed to fetch overview:', error);
      set({ error: 'Failed to fetch analytics overview' });
    }
  },

  fetchUserGrowth: async (months = 12) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/user-growth?months=${months}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch user growth');

      const { data } = await response.json();
      set({ userGrowth: data as UserGrowthData[] });
    } catch (error) {
      console.error('Failed to fetch user growth:', error);
    }
  },

  fetchContentDistribution: async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/content-distribution`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch content distribution');

      const { data } = await response.json();
      set({ contentDistribution: data as ContentDistribution[] });
    } catch (error) {
      console.error('Failed to fetch content distribution:', error);
    }
  },

  fetchEngagement: async (days = 30) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/engagement?days=${days}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch engagement');

      const { data } = await response.json();
      set({ engagement: data as EngagementData[] });
    } catch (error) {
      console.error('Failed to fetch engagement:', error);
    }
  },

  fetchTopContent: async (limit = 5) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/top-content?limit=${limit}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch top content');

      const { data } = await response.json();
      set({ topContent: data as TopContent[] });
    } catch (error) {
      console.error('Failed to fetch top content:', error);
    }
  },

  fetchMDALeaderboard: async (limit = 10) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/mda-leaderboard?limit=${limit}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch MDA leaderboard');

      const { data } = await response.json();
      set({ mdaLeaderboard: data as MDAStats[] });
    } catch (error) {
      console.error('Failed to fetch MDA leaderboard:', error);
    }
  },

  fetchRecentActivity: async (limit = 10) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/recent-activity?limit=${limit}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch recent activity');

      const { data } = await response.json();
      set({ recentActivity: data as ActivityItem[] });
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  },

  fetchActivityHeatmap: async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/activity-heatmap`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch activity heatmap');

      const { data } = await response.json();
      set({ heatmapData: data as number[][] });
    } catch (error) {
      console.error('Failed to fetch activity heatmap:', error);
    }
  },

  fetchQuickStats: async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/analytics/quick-stats`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch quick stats');

      const { data } = await response.json();
      set({ quickStats: data as QuickStats });
    } catch (error) {
      console.error('Failed to fetch quick stats:', error);
    }
  },

  fetchAllAnalytics: async (days = 30) => {
    set({ loading: true, error: null });

    try {
      // Fetch all analytics data in parallel
      await Promise.all([
        get().fetchOverview(days),
        get().fetchUserGrowth(12),
        get().fetchContentDistribution(),
        get().fetchEngagement(days),
        get().fetchTopContent(5),
        get().fetchMDALeaderboard(10),
        get().fetchRecentActivity(10),
        get().fetchActivityHeatmap(),
        get().fetchQuickStats(),
      ]);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      set({ error: 'Failed to fetch analytics data' });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
