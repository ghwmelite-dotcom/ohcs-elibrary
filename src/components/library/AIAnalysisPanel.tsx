import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ListChecks,
  FileText,
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
  Clock,
  BookOpen,
  Send,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Bot,
  User,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn } from '@/utils/cn';

interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  topics: string[];
  readingTime: number;
  complexity: 'basic' | 'intermediate' | 'advanced';
  recommendations: string[];
  sentiment?: 'positive' | 'neutral' | 'negative' | 'informative';
  wordCount?: number;
  cached?: boolean;
}

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  helpful?: boolean | null;
}

interface AIAnalysisPanelProps {
  documentId: string;
  analysis?: AIAnalysis;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const API_BASE = import.meta.env.PROD
  ? 'https://api.ohcselibrary.xyz/api/v1'
  : '/api/v1';

export function AIAnalysisPanel({
  documentId,
  analysis: initialAnalysis,
  isLoading: externalLoading = false,
  onRefresh,
}: AIAnalysisPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(initialAnalysis || null);
  const [isLoading, setIsLoading] = useState(externalLoading);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Fetch analysis on mount
  useEffect(() => {
    if (!initialAnalysis && documentId) {
      fetchAnalysis();
    }
  }, [documentId, initialAnalysis]);

  // Fetch chat history when chat opens
  useEffect(() => {
    if (chatOpen && chatMessages.length === 0) {
      fetchChatHistory();
    }
  }, [chatOpen]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('auth_token') ||
      JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}')?.state?.token;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/documents/${documentId}/analysis`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const data = await response.json();

      if (data.available === false) {
        // Analysis not yet generated
        setAnalysis(null);
      } else {
        setAnalysis(data);
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError('Could not load AI analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnalysis = async (refresh = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/documents/${documentId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }

      const data = await response.json();
      setAnalysis(data);

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError('Failed to generate AI analysis. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/documents/${documentId}/chat`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const question = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);
    setChatError(null);

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      question,
      answer: '',
      createdAt: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch(`${API_BASE}/documents/${documentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Replace temp message with real response
      setChatMessages(prev =>
        prev.map(m => m.id === tempId ? {
          ...data,
          helpful: null,
        } : m)
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setChatError('Failed to get response. Please try again.');
      // Remove temp message on error
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsChatLoading(false);
    }
  };

  const sendFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await fetch(`${API_BASE}/documents/${documentId}/chat/${messageId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ helpful }),
      });

      setChatMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, helpful } : m)
      );
    } catch (err) {
      console.error('Error sending feedback:', err);
    }
  };

  const handleCopy = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sections = [
    {
      id: 'summary',
      title: 'AI Summary',
      icon: FileText,
      content: analysis?.summary,
    },
    {
      id: 'keyPoints',
      title: 'Key Points',
      icon: Lightbulb,
      content: analysis?.keyPoints,
    },
    {
      id: 'topics',
      title: 'Topics Covered',
      icon: ListChecks,
      content: analysis?.topics,
    },
    {
      id: 'recommendations',
      title: 'Related Reading',
      icon: BookOpen,
      content: analysis?.recommendations,
    },
  ];

  const complexityColors = {
    basic: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    intermediate:
      'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    advanced: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
  };

  const sentimentColors = {
    positive: 'text-success-600 dark:text-success-400',
    neutral: 'text-surface-600 dark:text-surface-400',
    negative: 'text-error-600 dark:text-error-400',
    informative: 'text-primary-600 dark:text-primary-400',
  };

  if (isLoading || externalLoading) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
            <span className="font-semibold text-surface-900 dark:text-surface-50">
              AI Analysis
            </span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <span className="font-semibold text-surface-900 dark:text-surface-50">
              AI Analysis
            </span>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
            AI-Powered Insights
          </h3>
          <p className="text-surface-600 dark:text-surface-400 mb-4 text-sm">
            Get intelligent summaries, key points, and ask questions about this document
          </p>
          {error && (
            <p className="text-error-600 dark:text-error-400 text-sm mb-4 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
          <Button
            onClick={() => generateAnalysis()}
            disabled={isGenerating}
            leftIcon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          >
            {isGenerating ? 'Analyzing...' : 'Generate Analysis'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="font-semibold text-surface-900 dark:text-surface-50">
            AI Analysis
          </span>
          {analysis.cached && (
            <span className="text-xs text-surface-400 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
              Cached
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
            leftIcon={<MessageSquare className="w-4 h-4" />}
          >
            Ask AI
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateAnalysis(true)}
            disabled={isGenerating}
            leftIcon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-3 bg-surface-50 dark:bg-surface-700/50 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-surface-400" />
          <span className="text-surface-500 dark:text-surface-400">
            {analysis.readingTime} min read
          </span>
        </div>
        {analysis.wordCount && analysis.wordCount > 0 && (
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-surface-400" />
            <span className="text-surface-500 dark:text-surface-400">
              {analysis.wordCount.toLocaleString()} words
            </span>
          </div>
        )}
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
            complexityColors[analysis.complexity]
          )}
        >
          {analysis.complexity}
        </span>
        {analysis.sentiment && (
          <span className={cn('text-xs capitalize', sentimentColors[analysis.sentiment])}>
            {analysis.sentiment}
          </span>
        )}
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-surface-200 dark:border-surface-700"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-surface-900 dark:text-surface-50">
                  Ask questions about this document
                </span>
              </div>

              {/* Chat Messages */}
              <div className="max-h-64 overflow-y-auto space-y-3 mb-3">
                {chatMessages.length === 0 && !isChatLoading && (
                  <div className="text-center py-4 text-surface-500 dark:text-surface-400 text-sm">
                    <p>No conversation yet. Ask a question to get started!</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {['What is this about?', 'Key takeaways?', 'Who should read this?'].map((q) => (
                        <button
                          key={q}
                          onClick={() => setChatInput(q)}
                          className="text-xs px-2 py-1 bg-surface-100 dark:bg-surface-700 rounded-full hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    {/* Question */}
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-surface-600 dark:text-surface-300" />
                      </div>
                      <div className="flex-1 bg-surface-100 dark:bg-surface-700 rounded-lg px-3 py-2 text-sm">
                        {msg.question}
                      </div>
                    </div>

                    {/* Answer */}
                    {msg.answer && (
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2 text-sm text-surface-700 dark:text-surface-300">
                            {msg.answer}
                          </div>
                          {msg.helpful === null && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-surface-400">Helpful?</span>
                              <button
                                onClick={() => sendFeedback(msg.id, true)}
                                className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded transition-colors"
                              >
                                <ThumbsUp className="w-3.5 h-3.5 text-surface-400 hover:text-success-500" />
                              </button>
                              <button
                                onClick={() => sendFeedback(msg.id, false)}
                                className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded transition-colors"
                              >
                                <ThumbsDown className="w-3.5 h-3.5 text-surface-400 hover:text-error-500" />
                              </button>
                            </div>
                          )}
                          {msg.helpful === true && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-success-500">
                              <ThumbsUp className="w-3 h-3" /> Thanks for the feedback!
                            </div>
                          )}
                          {msg.helpful === false && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-surface-400">
                              <ThumbsDown className="w-3 h-3" /> We'll improve
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    </div>
                  </div>
                )}
              </div>

              {chatError && (
                <p className="text-error-600 dark:text-error-400 text-xs mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {chatError}
                </p>
              )}

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask a question about this document..."
                  className="flex-1 px-3 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isChatLoading}
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sections */}
      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              onClick={() =>
                setExpandedSection(expandedSection === section.id ? null : section.id)
              }
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <section.icon className="w-4 h-4 text-primary-500" />
                <span className="font-medium text-surface-900 dark:text-surface-50">
                  {section.title}
                </span>
              </div>
              {expandedSection === section.id ? (
                <ChevronUp className="w-4 h-4 text-surface-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-surface-400" />
              )}
            </button>

            <AnimatePresence>
              {expandedSection === section.id && section.content && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4 relative">
                      <button
                        onClick={() =>
                          handleCopy(
                            Array.isArray(section.content)
                              ? section.content.join('\n')
                              : section.content || '',
                            section.id
                          )
                        }
                        className="absolute top-2 right-2 p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-white dark:hover:bg-surface-600 rounded transition-colors"
                      >
                        {copiedSection === section.id ? (
                          <Check className="w-4 h-4 text-success-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {typeof section.content === 'string' ? (
                        <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed pr-8">
                          {section.content}
                        </p>
                      ) : (
                        <ul className="space-y-2 pr-8">
                          {section.content.map((item, index) => (
                            <li
                              key={index}
                              className="text-sm text-surface-700 dark:text-surface-300 flex items-start gap-2"
                            >
                              <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                                {index + 1}
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
