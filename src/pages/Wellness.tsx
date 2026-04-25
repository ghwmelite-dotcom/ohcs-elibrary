import { useEffect, useState, Component, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Phone,
  Mail,
  MapPin,
  X,
  Trash2,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import {
  WelcomeCard,
  MoodChart,
  SessionCard,
  ResourceCard,
  TopicSelector,
  KayaAvatar,
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
        <div className="min-h-screen flex items-center justify-center p-8 bg-surface-50 dark:bg-surface-900">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
              Wellness Page Error
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <pre className="text-left text-xs bg-surface-100 dark:bg-surface-800 p-4 rounded-lg overflow-auto max-h-40 mb-6">
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [tips, setTips] = useState<string[]>([]);

  // API base URL (matching wellnessStore pattern)
  const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

  // Helper to get auth token
  const getAuthToken = (): string | null => {
    try {
      const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
      return authState?.state?.token || localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  };

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
      fetchMoodHistory();

      // Fetch personalized tips
      const token = getAuthToken();
      if (token) {
        fetch(`${API_BASE}/counselor/tips`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => setTips(data.tips || []))
          .catch(() => {
            // fallback to hardcoded tips on error
          });
      }
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

  const handleDeleteAllData = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/counselor/my-data`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        // Clear consent flag as well
        localStorage.removeItem('wellness_consent_given');
        setShowDeleteDialog(false);
        setDeleteConfirmText('');
        // Refresh data
        fetchSessions();
        fetchMoodHistory();
        navigate('/wellness');
      }
    } catch {
      // error
    } finally {
      setIsDeleting(false);
    }
  };

  // Safely slice arrays with fallbacks
  const recentSessions = Array.isArray(sessions) ? sessions.slice(0, 3) : [];
  const featuredResources = Array.isArray(resources) ? resources.slice(0, 4) : [];
  const moodEntries = Array.isArray(moodHistory) ? moodHistory : [];

  return (
    <WellnessErrorBoundary>
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-purple-50/30 dark:from-surface-900 dark:via-surface-900 dark:to-surface-900">
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-100">
                Wellness Center
              </h1>
            </div>
            <p className="text-sm sm:text-base text-surface-600 dark:text-surface-400 max-w-2xl">
              Your safe space for mental wellness support. Chat with Kaya, our AI wellness companion,
              or explore self-help resources curated for Ghana's civil servants.
            </p>
          </motion.div>

          {/* New session modal/section */}
          {showNewSession ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-surface-800 rounded-xl sm:rounded-2xl border border-surface-200 dark:border-surface-700 p-4 sm:p-6 mb-5 sm:mb-8"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="hidden sm:block">
                  <KayaAvatar size="lg" mood="happy" />
                </div>
                <div className="sm:hidden">
                  <KayaAvatar size="md" mood="happy" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-100">
                    Start a New Conversation
                  </h2>
                  <p className="text-sm sm:text-base text-surface-600 dark:text-surface-400">
                    What would you like to talk about today?
                  </p>
                </div>
              </div>

              {/* Anonymous mode toggle */}
              {!isAuthenticated && (
                <div className="mb-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-1">
                        Anonymous Mode
                      </h3>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                        Your conversations are private and won't be linked to any account.
                        Session will end when you close your browser.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isAuthenticated && (
                <div className="mb-6 p-4 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <h3 className="font-medium text-surface-900 dark:text-surface-100">
                          Anonymous Mode
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          {isAnonymous ? 'Session won\'t be saved' : 'Session will be saved to your history'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => isAnonymous ? disableAnonymousMode() : enableAnonymousMode()}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        isAnonymous ? 'bg-purple-600' : 'bg-surface-300 dark:bg-surface-600'
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
                <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-3">
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
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                      <History className="w-5 h-5 text-surface-400 dark:text-surface-500" />
                      Recent Sessions
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/wellness/chat')}
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
                  <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-surface-400 dark:text-surface-500" />
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
                  <div className="text-center py-8 text-surface-500 dark:text-surface-400">
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

              {/* About Kaya */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-teal-50 to-purple-50 dark:from-teal-950/30 dark:to-purple-950/30 rounded-xl p-5 border border-surface-200 dark:border-surface-700"
              >
                <div className="flex items-center gap-3 mb-3">
                  <KayaAvatar size="sm" mood="neutral" />
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100">About Kaya</h3>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                  Kaya is your AI wellness companion.
                  Trained to provide supportive conversations and coping strategies,
                  Kaya is available 24/7 to listen and help.
                </p>
                <div className="flex items-start gap-2 text-xs text-surface-500 dark:text-surface-400">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Kaya is not a replacement for professional mental health care.
                    For serious concerns, please speak with our counseling unit.
                  </p>
                </div>
              </motion.div>

              {/* Quick tips — personalized when available, fallback to defaults */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700"
              >
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
                  {tips.length > 0 && <Lightbulb className="w-4 h-4 text-amber-500" />}
                  {tips.length > 0 ? 'Tips For You' : 'Quick Wellness Tips'}
                </h3>
                <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                  {(tips.length > 0
                    ? tips
                    : [
                        'Take short breaks every 90 minutes',
                        'Stay hydrated throughout the day',
                        'Practice deep breathing when stressed',
                        'Connect with colleagues regularly',
                      ]
                  ).map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-teal-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* CSEAP Contact Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 rounded-xl p-5 border border-amber-200/80 dark:border-amber-700/50 shadow-sm"
              >
                {/* Decorative pattern */}
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-amber-600">
                    <pattern id="cseap-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="10" cy="10" r="2" fill="currentColor"/>
                    </pattern>
                    <rect width="100" height="100" fill="url(#cseap-pattern)"/>
                  </svg>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <Heart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-surface-900 dark:text-surface-100 text-sm">
                        CSEAP
                      </h3>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium tracking-wide">
                        Employee Assistance Programme
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                    Professional counselors ready to support you with confidential assistance.
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowContactModal(true)}
                    className="w-full border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-medium"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact CSEAP
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Danger Zone — Delete all wellness data */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="max-w-6xl mx-auto px-3 sm:px-4 pb-6"
          >
            <div className="rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 text-base">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-red-700/80 dark:text-red-400/80 mt-1 mb-4">
                    Permanently delete all your wellness data including chat history, mood entries, and bookmarks.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 font-medium"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Wellness Data
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {showDeleteDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}
            >
              <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-surface-800 w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
              >
                {/* Mobile drag indicator */}
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
                </div>

                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/50">
                      <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                        Delete All Wellness Data
                      </h2>
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-4 leading-relaxed">
                    This will permanently delete all your wellness data including chat history, mood entries, and bookmarks. This cannot be undone.
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                  </div>
                </div>

                <div className="shrink-0 px-5 sm:px-6 py-4 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-700/50">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}
                      className="flex-1 py-2.5 text-sm touch-manipulation"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteAllData}
                      disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                      isLoading={isDeleting}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 dark:disabled:bg-red-900/50 text-white text-sm touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Everything
                    </Button>
                  </div>
                  <div className="h-safe-area-inset-bottom" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSEAP Contact Modal - Fully Responsive */}
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-surface-800 w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile drag indicator */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
              </div>

              {/* Decorative Header Banner */}
              <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 px-4 sm:px-6 py-6 sm:py-8 shrink-0">
                {/* Ghana-inspired decorative pattern */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <pattern id="ghana-kente-modal" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <rect x="0" y="0" width="10" height="10" fill="white"/>
                      <rect x="10" y="10" width="10" height="10" fill="white"/>
                    </pattern>
                    <rect width="100" height="100" fill="url(#ghana-kente-modal)"/>
                  </svg>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setShowContactModal(false)}
                  className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 sm:p-1.5 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <div className="relative text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm mb-3 sm:mb-4 ring-4 ring-white/30"
                  >
                    <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </motion.div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">
                    CSEAP
                  </h2>
                  <p className="text-amber-100 text-xs sm:text-sm font-medium tracking-wide px-4">
                    Civil Service Employee Assistance Programme
                  </p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-4 sm:p-6">
                  <p className="text-center text-surface-600 dark:text-surface-400 text-sm sm:text-base mb-4 sm:mb-6">
                    Confidential support for Ghana's civil servants. We're here to help.
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                    {/* Phone */}
                    <a
                      href="tel:+233503337119"
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border border-teal-200/50 dark:border-teal-800/50 hover:shadow-md active:scale-[0.98] transition-all group touch-manipulation"
                    >
                      <div className="p-2.5 sm:p-3 rounded-xl bg-teal-500 shadow-lg shadow-teal-500/30 group-hover:scale-110 group-active:scale-95 transition-transform shrink-0">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">Counseling Hotline</p>
                        <p className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100 truncate">
                          +233 50 333 7119
                        </p>
                      </div>
                      <div className="hidden xs:flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 shrink-0">
                        <Phone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                    </a>

                    {/* Email */}
                    <a
                      href="mailto:cseap@ohcs.gov.gh"
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-md active:scale-[0.98] transition-all group touch-manipulation"
                    >
                      <div className="p-2.5 sm:p-3 rounded-xl bg-purple-500 dark:bg-purple-600 shadow-lg shadow-purple-500/30 group-hover:scale-110 group-active:scale-95 transition-transform shrink-0">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">Email Support</p>
                        <p className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100 truncate">
                          cseap@ohcs.gov.gh
                        </p>
                      </div>
                      <div className="hidden xs:flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 shrink-0">
                        <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </a>

                    {/* Location */}
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
                      <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/30 shrink-0">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Visit Us</p>
                        <p className="text-sm sm:text-base font-semibold text-surface-900 dark:text-surface-100">
                          OHCS Headquarters, Accra
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hours Card */}
                  <div className="p-3 sm:p-4 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs sm:text-sm font-medium text-surface-900 dark:text-surface-100">Available Now</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-surface-500 dark:text-surface-400">Weekdays</p>
                        <p className="font-medium text-surface-900 dark:text-surface-100">8:00 AM - 5:00 PM</p>
                      </div>
                      <div>
                        <p className="text-surface-500 dark:text-surface-400">Crisis Support</p>
                        <p className="font-medium text-teal-600 dark:text-teal-400">24/7 Available</p>
                      </div>
                    </div>
                  </div>

                  {/* Ghana colors accent bar */}
                  <div className="flex gap-1 mb-4">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex-1 h-1 sm:h-1.5 rounded-full bg-red-500 origin-left"
                    />
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex-1 h-1 sm:h-1.5 rounded-full bg-yellow-500 origin-left"
                    />
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex-1 h-1 sm:h-1.5 rounded-full bg-green-600 origin-left"
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Bottom CTA */}
              <div className="shrink-0 p-4 sm:p-6 pt-0 bg-white dark:bg-surface-800">
                <Button
                  onClick={() => setShowContactModal(false)}
                  className="w-full py-3 sm:py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/25 text-sm sm:text-base touch-manipulation"
                >
                  Thank You
                </Button>
                {/* Safe area padding for notched devices */}
                <div className="h-safe-area-inset-bottom" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </WellnessErrorBoundary>
  );
}
