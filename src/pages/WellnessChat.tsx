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
import { KayaAvatar, ChatMessage, TopicSelector, PrivacyConsent, hasWellnessConsent } from '@/components/wellness';
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
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
      setIsNewSession(false);
    } else {
      setCurrentSession(null);
      setIsNewSession(true);
    }
  }, [sessionId, fetchSession, setCurrentSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleStartSession = async () => {
    // Check for privacy consent before creating session
    if (!hasWellnessConsent()) {
      setShowPrivacyConsent(true);
      return;
    }

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

  const handlePrivacyAccepted = () => {
    setShowPrivacyConsent(false);
    // Now proceed to create the session
    handleStartSessionAfterConsent();
  };

  const handleStartSessionAfterConsent = async () => {
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

  const latestAIMessageId = messages
    .filter(m => m.role === 'assistant' && !m.id.startsWith('temp-'))
    .slice(-1)[0]?.id;

  if (isNewSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-purple-50/30 dark:from-surface-900 dark:via-surface-900 dark:to-surface-900">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <button
              onClick={() => navigate('/wellness')}
              className="flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Wellness</span>
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <KayaAvatar size="lg" mood="happy" />
                <div>
                  <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                    Start a Conversation
                  </h1>
                  <p className="text-surface-600 dark:text-surface-400">
                    I'm Kaya, your AI wellness companion, here to listen and support you.
                  </p>
                </div>
              </div>

              <div className="mb-6 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                <span className="text-sm text-teal-700 dark:text-teal-300">
                  <strong>Note:</strong> Kaya is an AI wellness companion here to support you.
                  For human counseling support, you can request to speak with a CSEAP counselor at any time.
                </span>
              </div>

              {isAnonymous && (
                <div className="mb-6 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    Anonymous mode is on. Your conversation won't be saved.
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="font-medium text-surface-900 dark:text-surface-100 mb-3">
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

            <PrivacyConsent
              isOpen={showPrivacyConsent}
              onAccept={handlePrivacyAccepted}
            />
          </div>
        </div>
    );
  }

  return (
    <div className="h-[100dvh] md:h-[calc(100vh-4rem)] flex flex-col bg-surface-50 dark:bg-surface-900">
        <div className="shrink-0 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-3 sm:px-4 py-2 sm:py-3 safe-area-top">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/wellness')}
                className="p-2 -ml-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <KayaAvatar size="sm" mood="listening" isThinking={isSending} />

              <div>
                <h1 className="font-semibold text-surface-900 dark:text-surface-100">
                  Kaya <span className="text-xs font-normal text-teal-600 dark:text-teal-400">(AI)</span>
                </h1>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {currentSession?.topic
                    ? topicLabels[currentSession.topic]
                    : 'AI Wellness Companion'}
                  {isAnonymous && ' • Anonymous'}
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 py-2 z-50"
                  >
                    <button
                      onClick={() => {
                        setShowEscalation(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Request CSEAP Counselor</span>
                    </button>
                    <button
                      onClick={() => {
                        handleEndSession();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
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

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
            {currentSession && (
              <div className="text-center">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 text-xs text-surface-500 dark:text-surface-400">
                  <Info className="w-3 h-3" />
                  Session started
                </span>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onRate={handleRateMessage}
                isLatestAI={message.id === latestAIMessageId}
              />
            ))}

            {isSending && (
              <div className="flex items-center gap-3">
                <KayaAvatar size="md" mood="listening" isThinking />
                <div className="bg-surface-100 dark:bg-surface-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500"
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

            {currentSession?.status === 'escalated' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-300">
                      Escalation Requested
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      A counselor from <span className="font-semibold">CSEAP</span> (Civil Service Employee Assistance Programme) will be in touch with you soon.
                      You can continue chatting with Kaya in the meantime.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {currentSession?.status !== 'completed' && (
          <div className="shrink-0 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 px-3 sm:px-4 py-2 sm:py-3 safe-area-bottom">
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
                      'w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-surface-200 dark:border-surface-700',
                      'bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 text-sm sm:text-base',
                      'placeholder-surface-400 dark:placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500',
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

              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1.5 sm:mt-2 text-center hidden sm:block">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showEscalation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
              onClick={() => setShowEscalation(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-surface-800 w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
              >
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
                </div>

                <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-surface-100 dark:border-surface-700/50">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 shadow-inner shrink-0"
                    >
                      <PhoneCall className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                    </motion.div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-surface-100">
                        Request CSEAP Counselor
                      </h2>
                      <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium truncate">
                        Civil Service Employee Assistance Programme
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4">
                  <p className="text-sm sm:text-base text-surface-600 dark:text-surface-400 mb-4">
                    Our trained CSEAP counselors are here to provide confidential support.
                    Please share what you'd like help with (optional):
                  </p>

                  <textarea
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="Tell us briefly what you need help with..."
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base touch-manipulation"
                  />

                  <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/50 border border-amber-200/50 dark:border-amber-800/50">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <span className="font-semibold">Confidential:</span> Your request will be handled privately by our professional counselors.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 px-4 sm:px-6 py-4 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-700/50">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowEscalation(false)}
                      className="flex-1 py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEscalate}
                      className="flex-1 py-2.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 shadow-lg shadow-amber-500/25 text-sm sm:text-base touch-manipulation"
                    >
                      Contact CSEAP
                    </Button>
                  </div>
                  <div className="h-safe-area-inset-bottom" />
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
