import { useEffect, useState, Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  BookOpen,
  History,
  Shield,
  Sparkles,
  Info,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import {
  WelcomeCard,
  MoodChart,
  SessionCard,
  ResourceCard,
  TopicSelector,
  AyoAvatar,
} from '@/components/wellness';
import { useWellnessStore } from '@/stores/wellnessStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import type { CounselorTopic } from '@/types';

// Local error boundary for debugging
class WellnessErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Wellness page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Wellness Page Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <pre className="text-left text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-40 mb-6">
              {this.state.error?.stack}
            </pre>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Wellness() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    sessions,
    moodHistory,
    resources,
    isAnonymous,
    fetchSessions,
    fetchMoodHistory,
    fetchResources,
    enableAnonymousMode,
    disableAnonymousMode,
    createSession,
    isLoading,
  } = useWellnessStore();

  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<CounselorTopic | undefined>();
  const [isStarting, setIsStarting] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
      fetchMoodHistory();
    }
    fetchResources();
  }, [isAuthenticated, fetchSessions, fetchMoodHistory, fetchResources]);

  const handleStartChat = async () => {
    if (!selectedTopic) {
      setShowNewSession(true);
      return;
    }

    setIsStarting(true);
    const session = await createSession({
      topic: selectedTopic,
      isAnonymous,
    });

    if (session) {
      navigate(`/wellness/chat/${session.id}`);
    }
    setIsStarting(false);
  };

  const handleQuickStart = () => {
    setShowNewSession(true);
  };

  // Safely slice arrays with fallbacks
  const recentSessions = Array.isArray(sessions) ? sessions.slice(0, 3) : [];
  const featuredResources = Array.isArray(resources) ? resources.slice(0, 4) : [];
  const moodEntries = Array.isArray(moodHistory) ? moodHistory : [];

  return (
    <WellnessErrorBoundary>
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 sm:mb-8"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-teal-100 dark:bg-teal-900/30">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Wellness Center
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
              Your safe space for mental wellness support. Chat with Ayo, our AI wellness companion,
              or explore self-help resources curated for Ghana's civil servants.
            </p>
          </motion.div>

          {/* New session modal/section */}
          {showNewSession ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-5 sm:mb-8"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="hidden sm:block">
                  <AyoAvatar size="lg" mood="happy" />
                </div>
                <div className="sm:hidden">
                  <AyoAvatar size="md" mood="happy" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Start a New Conversation
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    What would you like to talk about today?
                  </p>
                </div>
              </div>

              {/* Anonymous mode toggle */}
              {!isAuthenticated && (
                <div className="mb-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        Anonymous Mode
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Your conversations are private and won't be linked to any account.
                        Session will end when you close your browser.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isAuthenticated && (
                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Anonymous Mode
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isAnonymous ? 'Session won\'t be saved' : 'Session will be saved to your history'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => isAnonymous ? disableAnonymousMode() : enableAnonymousMode()}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        isAnonymous ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          isAnonymous ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Topic selection */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Choose a topic (optional)
                </h3>
                <TopicSelector
                  value={selectedTopic}
                  onChange={setSelectedTopic}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleStartChat}
                  isLoading={isStarting}
                  className="flex-1 md:flex-none"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Conversation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewSession(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Welcome card */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <WelcomeCard onStartChat={handleQuickStart} />
            </motion.div>
          )}

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left column - Sessions & Resources */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Recent sessions */}
              {isAuthenticated && recentSessions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-gray-400" />
                      Recent Sessions
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/wellness/history')}
                      className="text-teal-600"
                    >
                      View all
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {recentSessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                      >
                        <SessionCard
                          session={session}
                          onClick={() => navigate(`/wellness/chat/${session.id}`)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Featured resources */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    Self-Help Resources
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/wellness/resources')}
                    className="text-teal-600"
                  >
                    View all
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredResources.map((resource, index) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <ResourceCard
                        resource={resource}
                        onClick={() => navigate(`/wellness/resources/${resource.id}`)}
                      />
                    </motion.div>
                  ))}
                </div>

                {featuredResources.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Resources coming soon!</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right column - Mood & Info */}
            <div className="space-y-4 sm:space-y-6">
              {/* Mood tracker */}
              {isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <MoodChart entries={moodEntries} days={7} />
                </motion.div>
              )}

              {/* About Ayo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-teal-50 to-purple-50 dark:from-teal-950/30 dark:to-purple-950/30 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 mb-3">
                  <AyoAvatar size="sm" mood="neutral" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">About Ayo</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Ayo (meaning "joy" in Yoruba) is your AI wellness companion.
                  Trained to provide supportive conversations and coping strategies,
                  Ayo is available 24/7 to listen and help.
                </p>
                <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Ayo is not a replacement for professional mental health care.
                    For serious concerns, please speak with our counseling unit.
                  </p>
                </div>
              </motion.div>

              {/* Quick tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Quick Wellness Tips
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">•</span>
                    Take short breaks every 90 minutes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">•</span>
                    Stay hydrated throughout the day
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">•</span>
                    Practice deep breathing when stressed
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500">•</span>
                    Connect with colleagues regularly
                  </li>
                </ul>
              </motion.div>

              {/* Counseling unit contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-5 border border-amber-200 dark:border-amber-800"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Need Human Support?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Our trained counselors are available to help with more serious concerns.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                >
                  Contact Counseling Unit
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </WellnessErrorBoundary>
  );
}
