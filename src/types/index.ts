// ============================================================================
// OHCS E-Library Type Definitions
// Comprehensive TypeScript interfaces for the entire platform
// ============================================================================

// ============================================================================
// Core Types
// ============================================================================

export type UUID = string;
export type Timestamp = string; // ISO 8601 format
export type Email = string;

// ============================================================================
// User & Authentication Types
// ============================================================================

export type UserRole =
  | 'guest'
  | 'user'
  | 'contributor'
  | 'moderator'
  | 'librarian'
  | 'counselor'
  | 'admin'
  | 'director'
  | 'super_admin';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface User {
  id: UUID;
  email: Email;
  staffId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  coverPhoto?: string;
  role: UserRole;
  status: UserStatus;
  mdaId: UUID;
  mda?: MDA;
  department?: string;
  title?: string;
  gradeLevel?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  socialLinks?: SocialLinks;
  emailVerified: boolean;
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  website?: string;
}

export interface MDA {
  id: UUID;
  name: string;
  abbreviation: string;
  type: 'ministry' | 'department' | 'agency';
  parentId?: UUID;
  logoUrl?: string;
  createdAt: Timestamp;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
}

export interface LoginCredentials {
  email: Email;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: Email;
  password: string;
  confirmPassword: string;
  staffId: string;
  firstName: string;
  lastName: string;
  mdaId: UUID;
  department?: string;
  title?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Timestamp;
}

export interface PasswordResetRequest {
  email: Email;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerification {
  email: Email;
  otp: string;
}

// ============================================================================
// Permission Types
// ============================================================================

export interface Permission {
  id: UUID;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface RolePermission {
  roleId: UUID;
  permissionId: UUID;
}

// ============================================================================
// Document Library Types
// ============================================================================

export type DocumentCategory =
  | 'circulars'
  | 'policies'
  | 'training'
  | 'reports'
  | 'forms'
  | 'legal'
  | 'research'
  | 'general';

export type DocumentAccessLevel =
  | 'public'
  | 'internal'
  | 'restricted'
  | 'confidential'
  | 'secret';

export type DocumentStatus = 'draft' | 'pending' | 'published' | 'archived';

export interface Document {
  id: UUID;
  title: string;
  description: string;
  category: DocumentCategory;
  subcategory?: string;
  tags: string[];
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
  accessLevel: DocumentAccessLevel;
  status: DocumentStatus;
  authorId: UUID;
  author?: User;
  mdaId?: UUID;
  mda?: MDA;
  version: number;
  downloads: number;
  views: number;
  averageRating: number;
  totalRatings: number;
  isBookmarked?: boolean;
  isDownloadable?: boolean; // Admin can control whether document can be downloaded
  userRating?: number;
  readingProgress?: number;
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DocumentVersion {
  id: UUID;
  documentId: UUID;
  version: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  changeLog?: string;
  uploadedById: UUID;
  uploadedBy?: User;
  createdAt: Timestamp;
}

export interface DocumentComment {
  id: UUID;
  documentId: UUID;
  userId: UUID;
  user?: User;
  content: string;
  parentId?: UUID;
  replies?: DocumentComment[];
  likes: number;
  isLiked?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DocumentRating {
  id: UUID;
  documentId: UUID;
  userId: UUID;
  rating: number; // 1-5
  review?: string;
  createdAt: Timestamp;
}

export interface ReadingProgress {
  id: UUID;
  documentId: UUID;
  userId: UUID;
  currentPage: number;
  totalPages: number;
  percentage: number;
  lastReadAt: Timestamp;
}

export interface Bookmark {
  id: UUID;
  documentId: UUID;
  document?: Document;
  userId: UUID;
  notes?: string;
  createdAt: Timestamp;
}

export interface Collection {
  id: UUID;
  name: string;
  description?: string;
  userId: UUID;
  user?: User;
  isPublic: boolean;
  documentCount: number;
  documents?: Document[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DocumentFilter {
  category?: DocumentCategory;
  accessLevel?: DocumentAccessLevel;
  status?: DocumentStatus;
  mdaId?: UUID;
  authorId?: UUID;
  tags?: string[];
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'views' | 'downloads' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  topics: string[];
  suggestedTags: string[];
  relatedDocuments: Document[];
  readingTime: number; // in minutes
}

// ============================================================================
// Forum Types
// ============================================================================

export interface ForumCategory {
  id: UUID;
  name: string;
  description: string;
  slug: string;
  icon?: string;
  color?: string;
  order: number;
  topicCount: number;
  postCount: number;
  lastActivityAt?: Timestamp;
  isLocked: boolean;
  createdAt: Timestamp;
}

export interface ForumTopic {
  id: UUID;
  title: string;
  slug: string;
  content: string;
  categoryId: UUID;
  category?: ForumCategory;
  authorId: UUID;
  author?: User;
  isPinned: boolean;
  isLocked: boolean;
  isAnswered: boolean;
  views: number;
  postCount: number;
  lastPostAt?: Timestamp;
  lastPostBy?: User;
  tags: string[];
  isSubscribed?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ForumPost {
  id: UUID;
  topicId: UUID;
  topic?: ForumTopic;
  authorId: UUID;
  author?: User;
  content: string;
  parentId?: UUID;
  replies?: ForumPost[];
  likes: number;
  dislikes: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  isBestAnswer: boolean;
  isEdited: boolean;
  attachments: Attachment[];
  mentions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ForumSubscription {
  id: UUID;
  topicId: UUID;
  userId: UUID;
  createdAt: Timestamp;
}

export interface Attachment {
  id: UUID;
  name: string;
  url: string;
  size: number;
  type: string;
}

// ============================================================================
// Chat Types
// ============================================================================

export type ChatRoomType = 'public' | 'mda' | 'private' | 'direct';

export interface ChatRoom {
  id: UUID;
  name: string;
  description?: string;
  type: ChatRoomType;
  mdaId?: UUID;
  mda?: MDA;
  createdById: UUID;
  createdBy?: User;
  memberCount: number;
  lastMessageAt?: Timestamp;
  lastMessage?: ChatMessage;
  isJoined?: boolean;
  unreadCount?: number;
  createdAt: Timestamp;
}

export interface ChatRoomMember {
  id: UUID;
  roomId: UUID;
  userId: UUID;
  user?: User;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Timestamp;
  lastReadAt?: Timestamp;
}

export interface ChatMessage {
  id: UUID;
  roomId: UUID;
  senderId: UUID;
  sender?: User;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments: Attachment[];
  replyToId?: UUID;
  replyTo?: ChatMessage;
  reactions: MessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  readBy: UUID[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageReaction {
  emoji: string;
  users: UUID[];
  count: number;
}

export interface DirectMessage {
  id: UUID;
  conversationId: UUID;
  senderId: UUID;
  sender?: User;
  receiverId: UUID;
  receiver?: User;
  content: string;
  type: 'text' | 'image' | 'file';
  attachments: Attachment[];
  isRead: boolean;
  createdAt: Timestamp;
}

export interface Conversation {
  id: UUID;
  participantIds: UUID[];
  participants: User[];
  lastMessage?: DirectMessage;
  unreadCount: number;
  updatedAt: Timestamp;
}

export interface TypingIndicator {
  roomId: UUID;
  userId: UUID;
  user?: User;
  timestamp: Timestamp;
}

// ============================================================================
// Groups Types
// ============================================================================

export type GroupType = 'open' | 'closed' | 'private' | 'official';

export interface Group {
  id: UUID;
  name: string;
  description: string;
  slug: string;
  type: GroupType;
  coverImage?: string;
  coverColor?: string;
  avatar?: string;
  createdById?: UUID;
  createdBy?: User;
  mdaId?: UUID;
  memberCount: number;
  postCount: number;
  isJoined?: boolean;
  memberRole?: GroupMemberRole;
  isPendingApproval?: boolean;
  tags: string[];
  rules?: string;
  isArchived?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type GroupMemberRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface GroupMember {
  id: UUID;
  groupId?: UUID;
  userId?: UUID;
  user?: User;
  role: GroupMemberRole;
  status?: 'active' | 'pending' | 'banned';
  joinedAt: Timestamp;
  // Flattened user fields from API
  displayName?: string;
  name?: string;
  avatar?: string;
  title?: string;
}

export interface GroupPostReaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export interface GroupPost {
  id: UUID;
  groupId: UUID;
  group?: Group;
  authorId: UUID;
  author?: User;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  attachments: Attachment[];
  likes: number;
  commentCount: number;
  isLiked?: boolean;
  isPinned: boolean;
  reactions?: GroupPostReaction[];
  comments?: GroupComment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GroupComment {
  id: UUID;
  postId: UUID;
  authorId: UUID;
  author?: User;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  attachments?: Attachment[];
  parentId?: UUID;
  replies?: GroupComment[];
  likes: number;
  isLiked?: boolean;
  reactions?: GroupPostReaction[];
  createdAt: Timestamp;
}

export interface GroupInvitation {
  id: UUID;
  groupId: UUID;
  group?: Group;
  inviterId: UUID;
  inviter?: User;
  inviteeId: UUID;
  invitee?: User;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
}

// ============================================================================
// Gamification Types
// ============================================================================

export interface Level {
  id: UUID;
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  icon?: string;
  color?: string;
}

export interface Badge {
  id: UUID;
  name: string;
  description: string;
  icon: string;
  category: 'reading' | 'engagement' | 'contribution' | 'learning' | 'social' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  requirement: string;
  isHidden: boolean;
  createdAt: Timestamp;
}

export interface UserBadge {
  id: UUID;
  userId: UUID;
  badgeId: UUID;
  badge?: Badge;
  earnedAt: Timestamp;
}

export interface XPTransaction {
  id: UUID;
  userId: UUID;
  amount: number;
  reason: string;
  sourceType: 'document' | 'forum' | 'chat' | 'group' | 'login' | 'achievement' | 'streak';
  sourceId?: UUID;
  createdAt: Timestamp;
}

export interface Achievement {
  id: UUID;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  requirement: {
    type: string;
    target: number;
    current?: number;
  };
  isUnlocked?: boolean;
  unlockedAt?: Timestamp;
}

export interface Streak {
  id: UUID;
  userId: UUID;
  type: 'login' | 'reading' | 'posting';
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Timestamp;
}

export interface LeaderboardEntry {
  rank: number;
  userId: UUID;
  user?: User;
  xp: number;
  level: number;
  badgeCount: number;
  change?: number; // position change from previous period
}

export interface GamificationStats {
  totalXP: number;
  level: Level;
  nextLevel?: Level;
  xpToNextLevel: number;
  xpProgress: number; // percentage
  badges: UserBadge[];
  badgeCount: number;
  achievements: Achievement[];
  streaks: Streak[];
  rank: number;
  rankChange?: number;
}

// ============================================================================
// News Types
// ============================================================================

export interface NewsSource {
  id: UUID;
  name: string;
  url: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface NewsArticle {
  id: UUID;
  title: string;
  summary: string;
  content?: string;
  url: string;
  imageUrl?: string;
  sourceId: UUID;
  source?: NewsSource;
  category: string;
  tags: string[];
  publishedAt: Timestamp;
  relevanceScore?: number;
  isBreaking: boolean;
  isBookmarked?: boolean;
  fetchedAt: Timestamp;
}

export interface NewsBookmark {
  id: UUID;
  articleId: UUID;
  article?: NewsArticle;
  userId: UUID;
  createdAt: Timestamp;
}

export interface NewsFilter {
  sourceId?: UUID;
  category?: string;
  search?: string;
  isBreaking?: boolean;
  fromDate?: Timestamp;
  toDate?: Timestamp;
  page?: number;
  limit?: number;
}

export interface NewsCategory {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  articleCount?: number;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType =
  | 'document_new'
  | 'document_update'
  | 'document_comment'
  | 'document_mention'
  | 'forum_reply'
  | 'forum_mention'
  | 'forum_subscription'
  | 'chat_message'
  | 'chat_mention'
  | 'chat_reaction'
  | 'group_invitation'
  | 'group_post'
  | 'group_member'
  | 'system_announcement'
  | 'system_maintenance'
  | 'xp_earned'
  | 'level_up'
  | 'badge_earned'
  | 'leaderboard_change'
  | 'news_breaking';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface NotificationPreferences {
  userId: UUID;
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    categories: NotificationType[];
  };
  push: {
    enabled: boolean;
    categories: NotificationType[];
  };
  inApp: {
    enabled: boolean;
    categories: NotificationType[];
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
}

// ============================================================================
// Search Types
// ============================================================================

export type SearchResultType = 'document' | 'topic' | 'post' | 'user' | 'group' | 'news';

export interface SearchResult {
  type: SearchResultType;
  id: UUID;
  title: string;
  description: string;
  url: string;
  highlights: string[];
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchFilter {
  query: string;
  types?: SearchResultType[];
  category?: string;
  mdaId?: UUID;
  fromDate?: Timestamp;
  toDate?: Timestamp;
  page?: number;
  limit?: number;
}

export interface SearchHistory {
  id: UUID;
  userId: UUID;
  query: string;
  resultCount: number;
  searchedAt: Timestamp;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface AuditLog {
  id: UUID;
  userId: UUID;
  user?: User;
  action: string;
  resource: string;
  resourceId?: UUID;
  details?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Timestamp;
}

export interface SystemSettings {
  id: UUID;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  isEditable: boolean;
  updatedAt: Timestamp;
  updatedById?: UUID;
}

export interface PlatformStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
  };
  documents: {
    total: number;
    publishedToday: number;
    downloads: number;
    views: number;
  };
  forum: {
    topics: number;
    posts: number;
    activeToday: number;
  };
  chat: {
    rooms: number;
    messagestoday: number;
    activeUsers: number;
  };
  groups: {
    total: number;
    members: number;
  };
}

// ============================================================================
// UI State Types
// ============================================================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface Modal {
  id: string;
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// Form Types
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableSort {
  key: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// Route Types
// ============================================================================

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

// ============================================================================
// Wellness & Counselor Types (AI Counselor "Ayo")
// ============================================================================

export type CounselorTopic =
  | 'work_stress'
  | 'career'
  | 'personal'
  | 'relationships'
  | 'financial'
  | 'general';

export type CounselorSessionStatus = 'active' | 'completed' | 'escalated';

export interface CounselorSession {
  id: UUID;
  userId?: UUID;
  anonymousId?: string;
  title?: string;
  topic?: CounselorTopic;
  status: CounselorSessionStatus;
  messageCount: number;
  mood?: number;
  isAnonymous: boolean;
  lastMessageAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CounselorMessage {
  id: UUID;
  sessionId: UUID;
  role: 'user' | 'assistant';
  content: string;
  helpful?: boolean | null;
  createdAt: Timestamp;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type MoodFactor =
  | 'work'
  | 'family'
  | 'health'
  | 'sleep'
  | 'finances'
  | 'relationships'
  | 'personal';

export interface MoodEntry {
  id: UUID;
  userId: UUID;
  mood: MoodLevel;
  factors?: MoodFactor[];
  notes?: string;
  createdAt: Timestamp;
}

export interface MoodStats {
  average: number | null;
  count: number;
  trend: 'improving' | 'declining' | 'stable' | null;
}

export type WellnessResourceType = 'article' | 'video' | 'audio' | 'exercise';

export type WellnessCategory =
  | 'stress'
  | 'career'
  | 'relationships'
  | 'mindfulness'
  | 'sleep';

export type WellnessDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface WellnessResource {
  id: UUID;
  title: string;
  description?: string;
  content?: string;
  type: WellnessResourceType;
  category: WellnessCategory;
  thumbnailUrl?: string;
  mediaUrl?: string;
  duration?: number;
  difficulty: WellnessDifficulty;
  views: number;
  likes: number;
  isBookmarked?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type EscalationUrgency = 'low' | 'normal' | 'high' | 'crisis';

export type EscalationStatus = 'pending' | 'acknowledged' | 'scheduled' | 'resolved';

export interface CounselorEscalation {
  id: UUID;
  sessionId: UUID;
  userId?: UUID;
  reason?: string;
  urgency: EscalationUrgency;
  status: EscalationStatus;
  assignedCounselorId?: UUID;
  assignedCounselorName?: string;
  notes?: string;
  scheduledAt?: Timestamp;
  resolvedAt?: Timestamp;
  createdAt: Timestamp;
  // Session info
  sessionTopic?: CounselorTopic;
  sessionMessages?: number;
  // User info
  userName?: string;
  userEmail?: string;
}

export interface WellnessStats {
  sessions: {
    totalSessions: number;
    activeSessions: number;
    escalatedSessions: number;
    weeklyNew: number;
  };
  escalations: {
    total: number;
    pending: number;
    urgent: number;
  };
  avgMood: number | null;
  topTopics: Array<{ topic: string; count: number }>;
  resources: {
    total: number;
    totalViews: number;
  };
}

// ============================================================================
// Counselor Management & Reporting Types
// ============================================================================

export type CounselorStatus = 'active' | 'inactive' | 'on_leave';

export interface CounselorAssignment {
  id: UUID;
  counselorId: UUID;
  counselor?: User;
  assignedById: UUID;
  assignedBy?: User;
  specializations?: CounselorTopic[];
  status: CounselorStatus;
  maxCaseload: number;
  currentCaseload: number;
  bio?: string;
  qualifications?: string;
  availableHours?: Record<string, string>;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserWellnessReport {
  user: {
    id: UUID;
    name: string;
    email: string;
    department?: string;
    mda?: string;
  };
  summary: {
    totalSessions: number;
    totalMessages: number;
    averageMood: number | null;
    moodTrend: 'improving' | 'stable' | 'declining' | null;
    mostCommonTopic: string | null;
    escalationCount: number;
    firstSessionAt: Timestamp | null;
    lastSessionAt: Timestamp | null;
  };
  sessions: Array<{
    id: UUID;
    date: Timestamp;
    topic: CounselorTopic | null;
    messageCount: number;
    mood: number | null;
    status: CounselorSessionStatus;
    duration?: number;
  }>;
  moodHistory: Array<{
    date: Timestamp;
    mood: MoodLevel;
    factors?: MoodFactor[];
  }>;
  generatedAt: Timestamp;
  generatedBy: string;
}

export interface AggregateWellnessReport {
  period: {
    from: Timestamp;
    to: Timestamp;
  };
  overview: {
    totalUsers: number;
    totalSessions: number;
    totalMessages: number;
    averageSessionLength: number;
    escalationRate: number;
    anonymousSessionRate: number;
  };
  topicBreakdown: Array<{
    topic: CounselorTopic;
    count: number;
    percentage: number;
  }>;
  moodAnalytics: {
    averageMood: number | null;
    moodDistribution: Record<MoodLevel, number>;
    trendOverTime: Array<{
      date: Timestamp;
      average: number;
      count: number;
    }>;
  };
  escalationAnalytics: {
    total: number;
    byUrgency: Record<EscalationUrgency, number>;
    byStatus: Record<EscalationStatus, number>;
    averageResolutionTime: number | null;
  };
  peakUsageTimes: {
    busiestDays: string[];
    busiestHours: number[];
  };
  generatedAt: Timestamp;
  generatedBy: string;
}

export interface CounselorDashboardStats {
  totalCounselors: number;
  activeCounselors: number;
  totalAssignedCases: number;
  pendingEscalations: number;
  resolvedThisWeek: number;
  averageCaseload: number;
}

// ============================================================================
// Research Lab Types
// ============================================================================

export type ResearchProjectStatus = 'draft' | 'planning' | 'active' | 'review' | 'completed' | 'archived';

export type ResearchPhase =
  | 'ideation'
  | 'literature_review'
  | 'methodology'
  | 'data_collection'
  | 'analysis'
  | 'writing'
  | 'peer_review'
  | 'publication';

export type ResearchMethodology =
  | 'qualitative'
  | 'quantitative'
  | 'mixed_methods'
  | 'case_study'
  | 'survey'
  | 'experimental'
  | 'policy_analysis'
  | 'comparative';

export type ResearchCategory =
  | 'policy_impact'
  | 'performance_audit'
  | 'capacity_assessment'
  | 'citizen_feedback'
  | 'budget_analysis'
  | 'digital_transformation'
  | 'hr_management'
  | 'service_delivery'
  | 'governance'
  | 'other';

export type ResearchTeamRole = 'lead' | 'researcher' | 'reviewer' | 'advisor' | 'contributor';

export interface ResearchProject {
  id: UUID;
  title: string;
  description: string;
  researchQuestion: string;
  hypothesis?: string;
  objectives: string[];
  methodology: ResearchMethodology;
  category: ResearchCategory;
  status: ResearchProjectStatus;
  phase: ResearchPhase;
  tags: string[];

  // Team
  createdById: UUID;
  createdBy?: User;
  teamLeadId: UUID;
  teamLead?: User;
  teamMembers?: ResearchTeamMember[];
  teamMemberCount: number;

  // Progress & Dates
  progress: number; // 0-100 percentage
  startDate?: Timestamp;
  targetEndDate?: Timestamp;
  completedAt?: Timestamp;

  // Literature
  literatureCount: number;

  // Insights & Briefs
  insightCount: number;
  briefCount: number;

  // Metadata
  isPublic: boolean;
  mdaId?: UUID;
  mda?: MDA;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ResearchTeamMember {
  id: UUID;
  projectId: UUID;
  userId: UUID;
  user?: User;
  role: ResearchTeamRole;
  permissions: ResearchPermission[];
  contribution?: string;
  joinedAt: Timestamp;
}

export type ResearchPermission =
  | 'view'
  | 'edit'
  | 'manage_team'
  | 'manage_literature'
  | 'generate_insights'
  | 'publish';

export interface ResearchLiterature {
  id: UUID;
  projectId: UUID;
  documentId?: UUID;
  document?: Document;

  // External source (if not from library)
  externalTitle?: string;
  externalUrl?: string;
  externalAuthors?: string;
  externalYear?: number;
  externalSource?: string;

  // Research-specific fields
  citationKey: string;
  relevanceScore: number; // 0-1 AI-computed
  notes?: string;
  annotations?: ResearchAnnotation[];
  tags: string[];

  // User tracking
  addedById: UUID;
  addedBy?: User;
  addedAt: Timestamp;
  lastAccessedAt?: Timestamp;
}

export interface ResearchAnnotation {
  id: UUID;
  literatureId: UUID;
  userId: UUID;
  user?: User;
  content: string;
  pageNumber?: number;
  highlight?: string;
  color?: string;
  createdAt: Timestamp;
}

export type ResearchInsightType =
  | 'gap'
  | 'trend'
  | 'recommendation'
  | 'synthesis'
  | 'key_finding'
  | 'contradiction'
  | 'opportunity';

export interface ResearchInsight {
  id: UUID;
  projectId: UUID;
  type: ResearchInsightType;
  title: string;
  content: string;
  confidence: number; // 0-1
  sources: UUID[]; // Document/Literature IDs
  sourceDetails?: Array<{
    id: UUID;
    title: string;
    type: 'document' | 'literature';
  }>;
  isAIGenerated: boolean;
  isVerified: boolean;
  verifiedById?: UUID;
  verifiedBy?: User;
  verifiedAt?: Timestamp;
  createdAt: Timestamp;
}

export type ResearchBriefStatus = 'draft' | 'review' | 'approved' | 'published';

export interface ResearchBrief {
  id: UUID;
  projectId: UUID;
  project?: ResearchProject;
  title: string;
  executiveSummary: string;
  background?: string;
  methodology?: string;
  keyFindings: ResearchKeyFinding[];
  recommendations: ResearchRecommendation[];
  conclusion?: string;
  limitations?: string;

  // Status & Review
  status: ResearchBriefStatus;
  version: number;

  // Generation
  isAIGenerated: boolean;
  generatedById?: UUID;
  generatedBy?: User;

  // Review
  reviewedById?: UUID;
  reviewedBy?: User;
  reviewedAt?: Timestamp;
  reviewNotes?: string;

  // Publication
  publishedAt?: Timestamp;
  publishedById?: UUID;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ResearchKeyFinding {
  id: UUID;
  order: number;
  title: string;
  description: string;
  evidence: string[];
  impact: 'high' | 'medium' | 'low';
}

export interface ResearchRecommendation {
  id: UUID;
  order: number;
  title: string;
  description: string;
  rationale: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  targetAudience?: string;
  implementationSteps?: string[];
}

export interface ResearchTemplate {
  id: UUID;
  name: string;
  description: string;
  category: ResearchCategory;
  methodology: ResearchMethodology;
  defaultObjectives: string[];
  suggestedPhases: ResearchPhase[];
  guidelineUrl?: string;
  isOfficial: boolean;
  usageCount: number;
  createdAt: Timestamp;
}

export interface ResearchActivity {
  id: UUID;
  projectId: UUID;
  userId: UUID;
  user?: User;
  action: ResearchActivityAction;
  details?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

export type ResearchActivityAction =
  | 'project_created'
  | 'project_updated'
  | 'status_changed'
  | 'phase_changed'
  | 'member_added'
  | 'member_removed'
  | 'literature_added'
  | 'literature_removed'
  | 'insight_generated'
  | 'insight_verified'
  | 'brief_created'
  | 'brief_updated'
  | 'brief_published'
  | 'comment_added';

export interface ResearchComment {
  id: UUID;
  projectId: UUID;
  userId: UUID;
  user?: User;
  content: string;
  parentId?: UUID;
  replies?: ResearchComment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ResearchFilter {
  status?: ResearchProjectStatus;
  phase?: ResearchPhase;
  category?: ResearchCategory;
  methodology?: ResearchMethodology;
  mdaId?: UUID;
  teamLeadId?: UUID;
  memberId?: UUID;
  search?: string;
  tags?: string[];
  isPublic?: boolean;
  fromDate?: Timestamp;
  toDate?: Timestamp;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'progress' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ResearchStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    byStatus: Record<ResearchProjectStatus, number>;
    byCategory: Record<ResearchCategory, number>;
  };
  literature: {
    total: number;
    fromLibrary: number;
    external: number;
  };
  insights: {
    total: number;
    aiGenerated: number;
    verified: number;
    byType: Record<ResearchInsightType, number>;
  };
  briefs: {
    total: number;
    published: number;
    inReview: number;
  };
  engagement: {
    totalResearchers: number;
    activeResearchers: number;
    avgTeamSize: number;
  };
}

export interface ResearchDashboardData {
  myProjects: ResearchProject[];
  recentActivity: ResearchActivity[];
  trendingTopics: Array<{ topic: string; count: number }>;
  stats: {
    myActiveProjects: number;
    myCompletedProjects: number;
    totalLiterature: number;
    totalInsights: number;
    pendingReviews: number;
  };
  recommendations: {
    suggestedDocuments: Document[];
    relatedProjects: ResearchProject[];
  };
}
