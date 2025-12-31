/**
 * Analytics Types
 */

export interface AnalyticsOverview {
  stats: {
    totalUsers: number;
    newUsers: number;
    userChange: { value: number; trend: 'up' | 'down' };
    totalDocuments: number;
    newDocuments: number;
    documentChange: { value: number; trend: 'up' | 'down' };
    totalPosts: number;
    newPosts: number;
    postChange: { value: number; trend: 'up' | 'down' };
    totalGroups: number;
    activeGroups: number;
    totalCourses: number;
    courseEnrollments: number;
    totalXPEarned: number;
    badgesAwarded: number;
  };
  period: {
    days: number;
    startDate: string;
  };
}

export interface UserGrowthData {
  month: string;
  label: string;
  users: number;
}

export interface ContentDistribution {
  label: string;
  value: number;
  color: string;
}

export interface EngagementData {
  label: string;
  value: number;
  color: string;
}

export interface TopContent {
  id: string;
  title: string;
  type: 'document' | 'post' | 'article';
  views: number;
  likes: number;
  shares: number;
  author: string;
  thumbnail?: string;
}

export interface MDAStats {
  rank: number;
  name: string;
  acronym: string;
  users: number;
  documents: number;
  posts: number;
  engagement: number;
  trend: 'up' | 'down' | 'same';
  change: number;
}

export interface ActivityItem {
  id: string;
  type: 'user_joined' | 'document_uploaded' | 'post_created' | 'badge_earned' | 'comment_added';
  user: string;
  content: string;
  time: string;
}

export interface QuickStats {
  avgResponseTime: string;
  uptime: string;
  peakUsersToday: number;
  totalDownloads: number;
}

export interface AnalyticsState {
  overview: AnalyticsOverview | null;
  userGrowth: UserGrowthData[];
  contentDistribution: ContentDistribution[];
  engagement: EngagementData[];
  topContent: TopContent[];
  mdaLeaderboard: MDAStats[];
  recentActivity: ActivityItem[];
  heatmapData: number[][];
  quickStats: QuickStats | null;
  loading: boolean;
  error: string | null;
}
