import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Sparkles,
  AlertTriangle,
  MoreVertical,
  XCircle,
  PhoneCall,
  Info,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { AyoAvatar, ChatMessage, TopicSelector } from '@/components/wellness';
import { useWellnessStore } from '@/stores/wellnessStore';
import { cn } from '@/utils/cn';
import type { CounselorTopic } from '@/types';

export default function WellnessChat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    currentSession,
    messages,
    isAnonymous,
    isSending,
    fetchSession,
    sendMessage,
    rateMessage,
    endSession,
    requestEscalation,
    createSession,
    setCurrentSession,
  } = useWellnessStore();

  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [isNewSession, setIsNewSession] = useState(!sessionId);
  const [selectedTopic, setSelectedTopic] = useState<CounselorTopic | undefined>();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch existing session or prepare for new one
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
      setIsNewSession(false);
    } else {
      setCurrentSession(null);
      setIsNewSession(true);
    }
  }, [sessionId, fetchSession, setCurrentSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleStartSession = async () => {
    setIsCreating(true);
    const session = await createSession({
      topic: selectedTopic,
      isAnonymous,
    });

    if (session) {
      navigate(`/wellness/chat/${session.id}`, { replace: true });
      setIsNewSession(false);
    }
    setIsCreating(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending || !currentSession) return;

    const message = input.trim();
    setInput('');

    await sendMessage(currentSession.id, message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndSession = async () => {
    if (currentSession) {
      await endSession(currentSession.id);
      navigate('/wellness');
    }
  };

  const handleEscalate = async () => {
    if (currentSession) {
      await requestEscalation(currentSession.id, escalationReason);
      setShowEscalation(false);
      setEscalationReason('');
    }
  };

  const handleRateMessage = (messageId: string, helpful: boolean) => {
    if (currentSession) {
      rateMessage(currentSession.id, messageId, helpful);
    }
  };

  // Find the latest AI message for rating prompt
  const latestAIMessageId = messages
    .filter(m => m.role === 'assistant' && !m.id.startsWith('temp-'))
    .slice(-1)[0]?.id;

  // Show topic selector for new sessions
  if (isNewSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
          <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Back button */}
            <button
              onClick={() => navigate('/wellness')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Wellness</span>
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <AyoAvatar size="lg" mood="happy" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Start a Conversation
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    I'm Ayo, here to listen and support you.
                  </p>
                </div>
              </div>

              {isAnonymous && (
                <div className="mb-6 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    Anonymous mode is on. Your conversation won't be saved.
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="font-medium text-gray-900 dark:text-white mb-3">
                  What would you like to talk about?
                </h2>
                <TopicSelector
                  value={selectedTopic}
                  onChange={setSelectedTopic}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleStartSession}
                  isLoading={isCreating}
                  className="flex-1"
                >
                  Start Chatting
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/wellness')}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
    );
  }

  return (
    <div className="h-[100dvh] md:h-[calc(100vh-4rem)] flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
        <div className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-2 sm:py-3 safe-area-top">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/wellness')}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <AyoAvatar size="sm" mood="listening" isThinking={isSending} />

              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">
                  Ayo
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentSession?.topic
                    ? topicLabels[currentSession.topic]
                    : 'Wellness Companion'}
                  {isAnonymous && ' • Anonymous'}
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    <button
                      onClick={() => {
                        setShowEscalation(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Request CSEAP Counselor</span>
                    </button>
                    <button
                      onClick={() => {
                        handleEndSession();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>End Session</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
            {/* Session started indicator */}
            {currentSession && (
              <div className="text-center">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                  <Info className="w-3 h-3" />
                  Session started
                </span>
              </div>
            )}

            {/* Messages list */}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onRate={handleRateMessage}
                isLatestAI={message.id === latestAIMessageId}
              />
            ))}

            {/* Typing indicator */}
            {isSending && (
              <div className="flex items-center gap-3">
                <AyoAvatar size="md" mood="listening" isThinking />
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-gray-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Escalated session notice */}
            {currentSession?.status === 'escalated' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-300">
                      Escalation Requested
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      A counselor from <span className="font-semibold">CSEAP</span> (Civil Service Employee Assistance Programme) will be in touch with you soon.
                      You can continue chatting with Ayo in the meantime.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        {currentSession?.status !== 'completed' && (
          <div className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-2 sm:py-3 safe-area-bottom">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    disabled={isSending}
                    className={cn(
                      'w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-700',
                      'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm sm:text-base',
                      'placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isSending}
                  className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl p-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              <p className="text-xs text-gray-400 mt-1.5 sm:mt-2 text-center hidden sm:block">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        )}

        {/* Escalation modal */}
        <AnimatePresence>
          {showEscalation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowEscalation(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30 shadow-inner">
                    <PhoneCall className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Request CSEAP Counselor
                    </h2>
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                      Civil Service Employee Assistance Programme
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our trained CSEAP counselors are here to provide confidential support.
                  Please share what you'd like help with (optional):
                </p>

                <textarea
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Tell us briefly what you need help with..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
                />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEscalation(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEscalate}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
                  >
                    Contact CSEAP
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}

const topicLabels: Record<string, string> = {
  work_stress: 'Work Stress',
  career: 'Career Growth',
  relationships: 'Relationships',
  personal: 'Personal Life',
  financial: 'Financial',
  general: 'General Chat',
};
