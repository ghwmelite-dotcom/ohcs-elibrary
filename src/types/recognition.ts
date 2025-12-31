// Peer Recognition System Types

// Recognition Category Slugs
export type RecognitionCategorySlug =
  | 'innovation'
  | 'teamwork'
  | 'service-excellence'
  | 'leadership'
  | 'problem-solving'
  | 'knowledge-sharing'
  | 'mentorship'
  | 'above-beyond';

// Recognition Category
export interface RecognitionCategory {
  id: string;
  name: string;
  slug: RecognitionCategorySlug;
  description: string;
  icon: string;
  color: string;
  xpRewardReceiver: number;
  xpRewardGiver: number;
  sortOrder: number;
  isActive: boolean;
}

// Minimal user info for recognition display
export interface RecognitionUser {
  id: string;
  displayName: string;
  avatar?: string;
  title?: string;
  department?: string;
  mda?: string;
}

// Core Recognition
export interface Recognition {
  id: string;
  message: string;
  isPublic: boolean;
  isHighlighted: boolean;
  xpAwarded: number;
  giverXpAwarded: number;
  endorsementCount: number;
  createdAt: string;
  giver: RecognitionUser;
  receiver: RecognitionUser;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    description?: string;
  };
  endorsements?: RecognitionEndorsement[];
  wallPostId?: string;
}

// Manager/Senior Endorsement
export interface RecognitionEndorsement {
  id: string;
  recognitionId?: string;
  endorserRole: string;
  comment?: string;
  bonusXpAwarded: number;
  createdAt: string;
  endorser: RecognitionUser;
}

// User Recognition Statistics
export interface UserRecognitionStats {
  userId: string;
  recognitionsGiven: number;
  recognitionsReceived: number;
  endorsementsReceived: number;
  totalXpFromRecognition: number;
  currentMonthGiven: number;
  mostReceivedCategoryName?: string;
  mostReceivedCategoryIcon?: string;
  categoryBreakdown: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    count: number;
  }>;
}

// Recognition Limit (Anti-abuse)
export interface RecognitionLimit {
  userId: string;
  periodType: 'monthly' | 'quarterly';
  periodStart: string;
  periodEnd: string;
  recognitionsGiven: number;
  maxAllowed: number;
  remaining: number;
}

// Leaderboard Entry
export interface RecognitionLeaderboardEntry {
  rank: number;
  userId: string;
  count: number;
  user: RecognitionUser;
}

// Leaderboard Response
export interface RecognitionLeaderboard {
  type: 'received' | 'given';
  period: 'weekly' | 'monthly' | 'quarterly' | 'allTime';
  entries: RecognitionLeaderboardEntry[];
}

// Recognition Wall Summary
export interface RecognitionWallSummary {
  totalRecognitions: number;
  totalThisWeek: number;
  totalThisMonth: number;
  topCategories: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    count: number;
  }>;
  recentHighlights: Array<{
    id: string;
    message: string;
    createdAt: string;
    giver: { displayName: string; avatar?: string };
    receiver: { displayName: string; avatar?: string };
    category: { name: string; icon: string; color: string };
  }>;
}

// Create Recognition Input
export interface CreateRecognitionInput {
  receiverId: string;
  categoryId: string;
  message: string;
  isPublic?: boolean;
}

// Recognition Feed Filter
export interface RecognitionFeedFilter {
  categoryId?: string;
  receiverId?: string;
  giverId?: string;
  mdaId?: string;
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  page?: number;
  limit?: number;
}

// Recognition Feed Response
export interface RecognitionFeedResponse {
  recognitions: Recognition[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Create Recognition Response
export interface CreateRecognitionResponse {
  recognition: Recognition;
  remaining: number;
}
