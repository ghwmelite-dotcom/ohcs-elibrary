/**
 * Kwame AI Knowledge Assistant Types
 */

// Session topics
export type KwameTopic = 'policy' | 'hr' | 'procedures' | 'regulations' | 'training' | 'general';

// Session status
export type KwameSessionStatus = 'active' | 'completed';

// Citation from a document
export interface KwameCitation {
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  chunkIndex: number;
  pageNumber?: number;
  section?: string;
  relevanceScore: number;
}

// Message in a conversation
export interface KwameMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: KwameCitation[];
  helpful?: boolean | null;
  processingTimeMs?: number;
  chunksUsed?: number;
  createdAt: string;
}

// Conversation session
export interface KwameSession {
  id: string;
  userId: string;
  title: string;
  topic: KwameTopic;
  status: KwameSessionStatus;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  messages?: KwameMessage[];
}

// Create session input
export interface CreateKwameSessionInput {
  topic?: KwameTopic;
  title?: string;
}

// Send message input
export interface SendKwameMessageInput {
  content: string;
}

// Message response from API
export interface KwameMessageResponse {
  userMessage: KwameMessage;
  assistantMessage: KwameMessage;
}

// Sessions list response
export interface KwameSessionsResponse {
  sessions: KwameSession[];
  total: number;
  limit: number;
  offset: number;
}

// User usage stats
export interface KwameUserStats {
  totalSessions: number;
  totalMessages: number;
  helpfulResponses: number;
  todayMessages: number;
  dailyLimit: number;
  remainingToday: number;
}

// Suggested questions
export interface KwameSuggestion {
  id: string;
  question: string;
  category?: KwameTopic;
}

// Embedding stats (admin)
export interface KwameEmbeddingStats {
  totalDocuments: number;
  embeddedDocuments: number;
  totalChunks: number;
  pendingQueue: number;
  failedQueue: number;
}

// Admin dashboard stats
export interface KwameAdminDashboard {
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
  embeddings: KwameEmbeddingStats;
  feedback: {
    helpful: number;
    notHelpful: number;
    total: number;
    helpfulRate: number;
  };
}

// Widget state
export interface KwameWidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isExpanded: boolean;
  hasUnread: boolean;
}
