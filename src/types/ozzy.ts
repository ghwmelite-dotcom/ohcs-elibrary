/**
 * GUIDE AI Knowledge Assistant Types
 */

// Session topics
export type OzzyTopic = 'policy' | 'hr' | 'procedures' | 'regulations' | 'training' | 'general';

// Session status
export type OzzySessionStatus = 'active' | 'completed';

// Citation from a document
export interface OzzyCitation {
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  chunkIndex: number;
  pageNumber?: number;
  section?: string;
  relevanceScore: number;
}

// Message in a conversation
export interface OzzyMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: OzzyCitation[];
  helpful?: boolean | null;
  processingTimeMs?: number;
  chunksUsed?: number;
  createdAt: string;
}

// Conversation session
export interface OzzySession {
  id: string;
  userId: string;
  title: string;
  topic: OzzyTopic;
  status: OzzySessionStatus;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  messages?: OzzyMessage[];
}

// Create session input
export interface CreateOzzySessionInput {
  topic?: OzzyTopic;
  title?: string;
}

// Send message input
export interface SendOzzyMessageInput {
  content: string;
}

// Message response from API
export interface OzzyMessageResponse {
  userMessage: OzzyMessage;
  assistantMessage: OzzyMessage;
}

// Sessions list response
export interface OzzySessionsResponse {
  sessions: OzzySession[];
  total: number;
  limit: number;
  offset: number;
}

// User usage stats
export interface OzzyUserStats {
  totalSessions: number;
  totalMessages: number;
  helpfulResponses: number;
  todayMessages: number;
  dailyLimit: number;
  remainingToday: number;
}

// Suggested questions
export interface OzzySuggestion {
  id: string;
  question: string;
  category?: OzzyTopic;
}

// Embedding stats (admin)
export interface OzzyEmbeddingStats {
  totalDocuments: number;
  embeddedDocuments: number;
  totalChunks: number;
  pendingQueue: number;
  failedQueue: number;
}

// Admin dashboard stats
export interface OzzyAdminDashboard {
  sessions: {
    total: number;
  };
  messages: {
    total: number;
    today: number;
    thisWeek: number;
  };
  users: {
    activeThisWeek: number;
  };
  embeddings: OzzyEmbeddingStats;
  feedback: {
    helpful: number;
    notHelpful: number;
    total: number;
    helpfulRate: number;
  };
}

// Widget state
export interface OzzyWidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isExpanded: boolean;
  hasUnread: boolean;
}
