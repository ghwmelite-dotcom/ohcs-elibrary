/**
 * GUIDE AI Knowledge Assistant Page
 * Full-page chat interface for civil service Q&A
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  MoreVertical,
  ChevronLeft,
  History,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useOzzyStore } from '@/stores/ozzyStore';
import {
  OzzyAvatar,
  OzzyChatMessage,
  SuggestedQuestions,
} from '@/components/ozzy';
import { OzzyTypingIndicator } from '@/components/ozzy/OzzyChatMessage';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';

export default function Ozzy() {
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    sessions,
    currentSession,
    messages,
    suggestions,
    isLoading,
    isSending,
    isTyping,
    userStats,
    error,
    fetchSessions,
    fetchSession,
    createSession,
    sendMessage,
    rateMessage,
    deleteSession,
    fetchSuggestions,
    fetchUserStats,
    clearError,
  } = useOzzyStore();

  // Initialize
  useEffect(() => {
    fetchSessions();
    fetchSuggestions();
    fetchUserStats();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const content = input.trim();
    setInput('');

    // Create session if none exists
    if (!currentSession) {
      const session = await createSession();
      if (!session) return;
    }

    await sendMessage(content);
  };

  const handleSuggestionSelect = async (question: string) => {
    if (!currentSession) {
      const session = await createSession();
      if (!session) return;
    }
    setInput('');
    await sendMessage(question);
  };

  const handleNewChat = async () => {
    await createSession();
  };

  const handleSessionSelect = async (sessionId: string) => {
    await fetchSession(sessionId);
    setShowSidebar(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-surface-50 dark:bg-surface-900">
      {/* Sidebar - Session History */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 border-r border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                <button
                  onClick={handleNewChat}
                  disabled={isLoading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
                    'bg-primary-600 text-white font-medium',
                    'hover:bg-primary-700 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <Plus className="w-5 h-5" />
                  New Chat
                </button>
              </div>

              {/* Session List */}
              <div className="flex-1 overflow-y-auto p-2">
                <p className="px-2 py-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                  Recent Conversations
                </p>

                {sessions.length === 0 ? (
                  <div className="px-2 py-8 text-center">
                    <History className="w-8 h-8 mx-auto text-surface-300 dark:text-surface-600 mb-2" />
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      No conversations yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 mt-2">
                    {sessions.map((session) => (
                      <div key={session.id} className="relative group">
                        <button
                          onClick={() => handleSessionSelect(session.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                            currentSession?.id === session.id
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'hover:bg-surface-100 dark:hover:bg-surface-700'
                          )}
                        >
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {session.title}
                            </p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">
                              {session.messageCount} messages
                            </p>
                          </div>
                        </button>

                        {/* Session menu */}
                        <button
                          onClick={() => setShowMenu(showMenu === session.id ? null : session.id)}
                          className={cn(
                            'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded',
                            'opacity-0 group-hover:opacity-100 transition-opacity',
                            'hover:bg-surface-200 dark:hover:bg-surface-600'
                          )}
                        >
                          <MoreVertical className="w-4 h-4 text-surface-500" />
                        </button>

                        {showMenu === session.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 py-1 w-32 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700">
                            <button
                              onClick={() => {
                                deleteSession(session.id);
                                setShowMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Usage Stats */}
              {userStats && (
                <div className="p-4 border-t border-surface-200 dark:border-surface-700">
                  <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
                    <span>Today's usage</span>
                    <span>{userStats.todayMessages} / {userStats.dailyLimit}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${(userStats.todayMessages / userStats.dailyLimit) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors lg:hidden"
          >
            <ChevronLeft className={cn('w-5 h-5 transition-transform', !showSidebar && 'rotate-180')} />
          </button>

          <OzzyAvatar size="lg" />

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-surface-900 dark:text-white">
              GUIDE
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Government User Intelligence & Document Engine
            </p>
          </div>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            title="Toggle sidebar"
          >
            <History className="w-5 h-5 text-surface-500" />
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center justify-between">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button onClick={clearError} className="text-red-500 hover:text-red-700">
                &times;
              </button>
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6"
              >
                <OzzyAvatar size="xl" />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center max-w-md"
              >
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                  Hello! I'm GUIDE
                </h2>
                <p className="text-surface-600 dark:text-surface-400 mb-6">
                  Your knowledgeable guide to Ghana's civil service policies, procedures, and regulations.
                  Ask me anything about HR matters, leave policies, promotions, training, and more.
                </p>

                <div className="flex items-center justify-center gap-4 text-sm text-surface-500 dark:text-surface-400 mb-6">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Document-backed answers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Personalized suggestions</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-xl"
              >
                <SuggestedQuestions
                  suggestions={suggestions}
                  onSelect={handleSuggestionSelect}
                  isLoading={isSending}
                />
              </motion.div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <OzzyChatMessage
              key={message.id}
              message={message}
              onRate={rateMessage}
              isLatest={index === messages.length - 1 && message.role === 'assistant'}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && <OzzyTypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
          <div className={cn(
            'flex items-end gap-3 p-3 rounded-xl',
            'bg-surface-100 dark:bg-surface-700',
            'border border-surface-200 dark:border-surface-600',
            'focus-within:border-primary-500 dark:focus-within:border-primary-500',
            'transition-colors'
          )}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask GUIDE a question..."
              disabled={isSending}
              rows={1}
              className={cn(
                'flex-1 bg-transparent resize-none outline-none',
                'text-surface-900 dark:text-white placeholder-surface-500',
                'text-sm leading-relaxed',
                'disabled:opacity-50'
              )}
              style={{ maxHeight: '150px' }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className={cn(
                'flex-shrink-0 p-2 rounded-lg transition-colors',
                input.trim() && !isSending
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-surface-200 dark:bg-surface-600 text-surface-400 cursor-not-allowed'
              )}
            >
              {isSending ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <p className="mt-2 text-xs text-center text-surface-400 dark:text-surface-500">
            GUIDE uses AI to search documents. Always verify important information with official sources.
          </p>
        </div>
      </main>
    </div>
  );
}
