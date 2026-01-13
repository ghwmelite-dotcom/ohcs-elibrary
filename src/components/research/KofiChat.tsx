import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Minimize2,
  Maximize2,
  HelpCircle,
  BookOpen,
  BarChart3,
  FileText,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProjectContext {
  id: string;
  title: string;
  researchQuestion: string;
  methodology: string;
  category: string;
  phase: string;
  objectives?: string[];
}

interface KofiChatProps {
  projectContext?: ProjectContext;
  className?: string;
}

const QUICK_PROMPTS = [
  { icon: HelpCircle, label: 'Research methodology', prompt: 'What research methodology would you recommend for my project?' },
  { icon: BookOpen, label: 'Literature review', prompt: 'How should I approach the literature review for this research?' },
  { icon: BarChart3, label: 'Data analysis', prompt: 'What data analysis methods would be appropriate for my research?' },
  { icon: FileText, label: 'Policy brief', prompt: 'How do I structure an effective policy brief from my research?' },
  { icon: Lightbulb, label: 'Research gaps', prompt: 'What are potential gaps I should explore in my research?' },
];

export function KofiChat({ projectContext, className }: KofiChatProps) {
  const { token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm Kofi, your AI Research Assistant. I'm here to help you with your civil service research projects. ${projectContext ? `I see you're working on "${projectContext.title}". ` : ''}How can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/v1/research/kofi/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: content.trim(),
          projectContext,
          conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an issue. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  if (!token) {
    return null; // Don't show chat for unauthenticated users
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'absolute bottom-16 right-0 bg-surface-50 dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden',
              isMinimized ? 'w-80 h-14' : 'w-96 h-[32rem]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Kofi</h3>
                  <p className="text-xs text-white/80">AI Research Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(32rem-8rem)]">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          message.role === 'user'
                            ? 'bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400'
                            : 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                        )}
                      >
                        {message.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                          message.role === 'user'
                            ? 'bg-primary-600 text-white rounded-tr-md'
                            : 'bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-200 rounded-tl-md'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={cn(
                            'text-xs mt-1',
                            message.role === 'user' ? 'text-white/70' : 'text-surface-500 dark:text-surface-400'
                          )}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-surface-100 dark:bg-surface-700 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                          <span className="text-sm text-surface-600 dark:text-surface-300">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                {messages.length <= 2 && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-2">Quick questions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PROMPTS.slice(0, 3).map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickPrompt(prompt.prompt)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-full text-surface-700 dark:text-surface-300 transition-colors"
                        >
                          <prompt.icon className="w-3 h-3" />
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-surface-200 dark:border-surface-700">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Kofi anything..."
                      rows={1}
                      className="flex-1 resize-none rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500"
                      style={{ maxHeight: '80px' }}
                    />
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || isLoading}
                      className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors',
          isOpen
            ? 'bg-surface-600 dark:bg-surface-500 hover:bg-surface-700 dark:hover:bg-surface-400'
            : 'bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <Sparkles className="w-3 h-3 text-secondary-400 absolute -top-1 -right-1" />
          </div>
        )}
      </motion.button>
    </div>
  );
}

export default KofiChat;
