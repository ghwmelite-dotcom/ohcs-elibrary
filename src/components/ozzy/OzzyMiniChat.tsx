/**
 * OzzyMiniChat Component
 * Compact chat interface for the floating widget
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Maximize2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOzzyStore } from '@/stores/ozzyStore';
import { OzzyAvatar } from './OzzyAvatar';
import { OzzyTypingIndicator } from './OzzyChatMessage';
import { SuggestedQuestionsCompact } from './SuggestedQuestions';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';

interface OzzyMiniChatProps {
  onClose: () => void;
  onMaximize: () => void;
}

export function OzzyMiniChat({ onClose, onMaximize }: OzzyMiniChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    currentSession,
    messages,
    suggestions,
    isSending,
    isTyping,
    createSession,
    sendMessage,
    fetchSuggestions,
  } = useOzzyStore();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    fetchSuggestions();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const content = input.trim();
    setInput('');

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
    await sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={cn(
        'w-80 sm:w-96 bg-white dark:bg-surface-800 rounded-2xl shadow-2xl',
        'border border-surface-200 dark:border-surface-700',
        'flex flex-col max-h-[500px]',
        'overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-gradient-to-r from-primary-50 to-yellow-50 dark:from-primary-900/20 dark:to-yellow-900/20">
        <OzzyAvatar size="sm" state={isTyping ? 'thinking' : 'idle'} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-surface-900 dark:text-white text-sm">
            Ask Ozzy
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
            Civil Service Knowledge Assistant
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMaximize}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            title="Open full chat"
          >
            <Maximize2 className="w-4 h-4 text-surface-500" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-surface-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
        {messages.length === 0 && !isTyping ? (
          <div className="text-center py-4">
            <OzzyAvatar size="lg" className="mx-auto mb-3" />
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
              Hi! I'm Ozzy. Ask me about policies, procedures, or regulations.
            </p>
            <SuggestedQuestionsCompact
              suggestions={suggestions}
              onSelect={handleSuggestionSelect}
              isLoading={isSending}
            />
          </div>
        ) : (
          <>
            {messages.slice(-6).map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {message.role === 'assistant' && (
                  <OzzyAvatar size="sm" className="flex-shrink-0" />
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-sm'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white rounded-tl-sm'
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content.length > 300
                      ? message.content.slice(0, 300) + '...'
                      : message.content}
                  </p>
                  {message.citations && message.citations.length > 0 && (
                    <p className="mt-1 text-xs opacity-70">
                      {message.citations.length} source{message.citations.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isTyping && <OzzyTypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={isSending}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm',
              'bg-surface-100 dark:bg-surface-700',
              'border border-surface-200 dark:border-surface-600',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'text-surface-900 dark:text-white placeholder-surface-500',
              'disabled:opacity-50'
            )}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className={cn(
              'p-2 rounded-lg transition-colors flex-shrink-0',
              input.trim() && !isSending
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-surface-200 dark:bg-surface-600 text-surface-400 cursor-not-allowed'
            )}
          >
            {isSending ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* View full chat link */}
        {messages.length > 0 && (
          <Link
            to="/ozzy"
            className="mt-2 flex items-center justify-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
            onClick={onClose}
          >
            <MessageSquare className="w-3 h-3" />
            View full conversation
          </Link>
        )}
      </div>
    </motion.div>
  );
}
