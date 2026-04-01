import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Sparkles,
  Flame,
  Users,
  X,
  Coffee,
  Wind,
  Sun,
  Moon,
  MessageCircle,
  TrendingUp,
  Gift,
  Star,
  Zap,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { KayaAvatar } from './KayaAvatar';
import { useWellnessStore } from '@/stores/wellnessStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

// ============================================================================
// GHANA PROVERBS & CULTURAL HOOKS
// ============================================================================
const ghanaProverbs = [
  { proverb: "Obi nkyerɛ obi ba nyame", meaning: "No one shows God to a child - You already have the wisdom within." },
  { proverb: "Sankofa", meaning: "Go back and fetch it - It's never too late to reflect and learn." },
  { proverb: "Nea onnim no sua a, ohu", meaning: "One who doesn't know can learn - Growth is always possible." },
  { proverb: "Sɛ wo werɛ fi na wosan kofa a, yenkyi", meaning: "It is not taboo to go back for what you forgot." },
  { proverb: "Abɔfra bo nnwa na ɔmmo akyekyedeɛ", meaning: "A child can break snail shells but not tortoise - Take things one step at a time." },
  { proverb: "Dua koro gye mframa a, ɛbu", meaning: "A single tree cannot withstand the storm - We're stronger together." },
  { proverb: "Tikoro nko agyina", meaning: "One head does not hold council - Seek support when needed." },
  { proverb: "Nyansa bun mu ne mate me asɛm", meaning: "The depth of wisdom is 'I have heard' - Listening is key." },
];

const wellnessAffirmations = [
  "Your mental health matters as much as any deadline.",
  "Taking breaks makes you more productive, not less.",
  "It's okay to not have all the answers today.",
  "Small steps forward are still progress.",
  "Your feelings are valid and important.",
  "Rest is not a reward, it's a requirement.",
  "You're doing better than you think.",
  "Asking for help is a sign of strength.",
];

// ============================================================================
// MOOD QUICK CHECK-IN
// ============================================================================
const moods = [
  { value: 1, emoji: '😔', label: 'Struggling', color: 'from-red-400 to-red-500' },
  { value: 2, emoji: '😕', label: 'Low', color: 'from-orange-400 to-orange-500' },
  { value: 3, emoji: '😐', label: 'Okay', color: 'from-yellow-400 to-yellow-500' },
  { value: 4, emoji: '🙂', label: 'Good', color: 'from-green-400 to-green-500' },
  { value: 5, emoji: '😊', label: 'Great', color: 'from-teal-400 to-teal-500' },
];

interface MoodQuickCheckProps {
  onMoodSelected: (mood: number) => void;
  isLoading?: boolean;
}

function MoodQuickCheck({ onMoodSelected, isLoading }: MoodQuickCheckProps) {
  const [hoveredMood, setHoveredMood] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/80 text-center">Tap to log how you're feeling</p>
      <div className="flex justify-center gap-2">
        {moods.map((mood, index) => (
          <motion.button
            key={mood.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => !isLoading && onMoodSelected(mood.value)}
            onMouseEnter={() => setHoveredMood(mood.value)}
            onMouseLeave={() => setHoveredMood(null)}
            disabled={isLoading}
            className={cn(
              'relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200',
              'bg-white/20 hover:bg-white/30 backdrop-blur-sm',
              hoveredMood === mood.value && 'scale-110 bg-white/40',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <AnimatePresence>
              {hoveredMood === mood.value && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap"
                >
                  {mood.label}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// WELLNESS STREAK DISPLAY
// ============================================================================
interface WellnessStreakProps {
  streak: number;
  xpEarned?: number;
}

function WellnessStreak({ streak, xpEarned }: WellnessStreakProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/15 backdrop-blur-sm"
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="relative"
      >
        <Flame className="w-6 h-6 text-orange-300" />
        {streak >= 7 && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.div>
      <div>
        <p className="text-sm font-bold text-white">
          {streak} Day{streak !== 1 ? 's' : ''} Wellness Streak!
        </p>
        {xpEarned && (
          <p className="text-xs text-white/70 flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-300" />
            +{xpEarned} XP earned this week
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// SOCIAL PROOF BADGE
// ============================================================================
function SocialProofBadge({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 text-xs text-white/70"
    >
      <div className="flex -space-x-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-300 to-teal-500 border-2 border-teal-600"
          />
        ))}
      </div>
      <span>{count}+ colleagues checked in this week</span>
    </motion.div>
  );
}

// ============================================================================
// ENHANCED WELLNESS DASHBOARD CARD
// ============================================================================
export function EnhancedWellnessDashboardCard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { todayMood, logMood, fetchMoodHistory, moodHistory, isLoading } = useWellnessStore();
  const [showMoodLogged, setShowMoodLogged] = useState(false);
  const [currentProverb, setCurrentProverb] = useState(ghanaProverbs[0]);
  const [showProverb, setShowProverb] = useState(false);

  // Get daily proverb (consistent per day)
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    setCurrentProverb(ghanaProverbs[dayOfYear % ghanaProverbs.length]);
  }, []);

  // Fetch mood history on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMoodHistory();
    }
  }, [isAuthenticated, user, fetchMoodHistory]);

  // Calculate wellness streak from mood history
  const wellnessStreak = (() => {
    if (!moodHistory || moodHistory.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort by date descending and check consecutive days
    const sortedMoods = [...moodHistory].sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );

    for (let i = 0; i < sortedMoods.length; i++) {
      const moodDate = new Date(sortedMoods[i].createdAt || '');
      moodDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (moodDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  })();

  const displayName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: Sun };
    if (hour < 17) return { text: 'Good afternoon', icon: Coffee };
    if (hour < 21) return { text: 'Good evening', icon: Moon };
    return { text: 'Good night', icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Handle mood selection
  const handleMoodSelected = async (mood: number) => {
    await logMood({ mood });
    setShowMoodLogged(true);
    setTimeout(() => setShowMoodLogged(false), 3000);
  };

  // Random affirmation based on day
  const dailyAffirmation = wellnessAffirmations[
    new Date().getDate() % wellnessAffirmations.length
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700" />

      {/* Animated pattern */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        animate={{ x: [0, 30], y: [0, 30] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full"
        style={{ transform: 'translate(30%, -30%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full"
        style={{ transform: 'translate(-30%, 30%)' }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative z-10 p-5 md:p-6">
        {/* Header with Kaya */}
        <div className="flex items-start gap-4 mb-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <KayaAvatar size="md" mood={todayMood ? 'happy' : 'neutral'} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-pink-300" />
              <span className="text-xs font-medium text-white/80">Wellness Centre</span>
              {wellnessStreak >= 3 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 text-[10px] font-bold bg-orange-400 text-orange-900 rounded-full"
                >
                  {wellnessStreak}🔥
                </motion.span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GreetingIcon className="w-5 h-5 text-yellow-300" />
              {greeting.text}, {displayName}!
            </h3>
          </div>
        </div>

        {/* Mood Check-in or Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <AnimatePresence mode="wait">
            {showMoodLogged ? (
              <motion.div
                key="logged"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl mb-2"
                >
                  ✨
                </motion.div>
                <p className="font-medium text-white">Mood logged! +5 XP</p>
                <p className="text-xs text-white/70">Keep it up for bonus rewards</p>
              </motion.div>
            ) : todayMood ? (
              <motion.div
                key="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{moods.find(m => m.value === todayMood.mood)?.emoji || '😊'}</span>
                  <div>
                    <p className="font-medium text-white">Today's mood logged</p>
                    <p className="text-xs text-white/70">Come back tomorrow to continue your streak!</p>
                  </div>
                </div>
                {wellnessStreak > 0 && (
                  <WellnessStreak streak={wellnessStreak} xpEarned={wellnessStreak * 5} />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="checkin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <MoodQuickCheck onMoodSelected={handleMoodSelected} isLoading={isLoading} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ghana Proverb / Affirmation Toggle */}
        <motion.button
          onClick={() => setShowProverb(!showProverb)}
          className="w-full text-left mb-4 group"
        >
          <AnimatePresence mode="wait">
            {showProverb ? (
              <motion.div
                key="proverb"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-white/10 rounded-lg p-3"
              >
                <p className="text-xs text-yellow-300 font-medium mb-1 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Sankofa Moment
                </p>
                <p className="text-sm text-white font-medium italic">"{currentProverb.proverb}"</p>
                <p className="text-xs text-white/70 mt-1">{currentProverb.meaning}</p>
              </motion.div>
            ) : (
              <motion.div
                key="affirmation"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <p className="text-xs text-white/60 mb-1">💡 Today's reminder</p>
                <p className="text-sm text-white/90 leading-relaxed group-hover:text-white transition-colors">
                  {dailyAffirmation}
                </p>
                <p className="text-[10px] text-white/50 mt-1">Tap for Sankofa wisdom →</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Social Proof */}
        <div className="mb-4">
          <SocialProofBadge count={47} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/wellness/chat')}
            className="flex-1 bg-white text-teal-700 hover:bg-white/90 font-semibold shadow-lg"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with Kaya
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/wellness')}
            className="border-white/30 text-white hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// ACTIVITY NUDGE COMPONENT
// ============================================================================
interface ActivityNudgeProps {
  onDismiss: () => void;
  onAccept: () => void;
}

export function ActivityNudge({ onDismiss, onAccept }: ActivityNudgeProps) {
  const nudgeMessages = [
    { text: "You've been focused for a while! Take a mental break?", icon: Coffee },
    { text: "Great progress! How about a quick wellness check-in?", icon: Heart },
    { text: "Kaya is here if you need to chat about anything.", icon: MessageCircle },
    { text: "Remember: breaks boost productivity. Ready for one?", icon: Wind },
  ];

  const [message] = useState(() =>
    nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)]
  );
  const NudgeIcon = message.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-24 right-6 z-50 max-w-sm"
    >
      <div className="relative bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-4 shadow-2xl text-white">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 bg-white/20 rounded-xl"
          >
            <KayaAvatar size="sm" mood="listening" />
          </motion.div>

          <div className="flex-1">
            <p className="text-sm font-medium mb-3">{message.text}</p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onAccept}
                className="bg-white text-teal-700 hover:bg-white/90 text-xs"
              >
                <NudgeIcon className="w-3 h-3 mr-1" />
                Let's go
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
              >
                Maybe later
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-teal-500 to-emerald-600 rotate-45"
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// USE WELLNESS NUDGE HOOK
// ============================================================================
export function useWellnessNudge() {
  const [showNudge, setShowNudge] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());
  const [lastNudgeTime, setLastNudgeTime] = useState<number | null>(null);
  const navigate = useNavigate();

  // Check if we should show a nudge
  const checkNudge = useCallback(() => {
    const sessionDuration = (Date.now() - sessionStartTime) / 1000 / 60; // minutes
    const timeSinceLastNudge = lastNudgeTime
      ? (Date.now() - lastNudgeTime) / 1000 / 60
      : Infinity;

    // Show nudge after 45 minutes of activity, with at least 30 min between nudges
    if (sessionDuration >= 45 && timeSinceLastNudge >= 30 && !showNudge) {
      setShowNudge(true);
      setLastNudgeTime(Date.now());
    }
  }, [sessionStartTime, lastNudgeTime, showNudge]);

  // Check every 5 minutes
  useEffect(() => {
    const interval = setInterval(checkNudge, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkNudge]);

  const dismissNudge = useCallback(() => {
    setShowNudge(false);
  }, []);

  const acceptNudge = useCallback(() => {
    setShowNudge(false);
    navigate('/wellness');
  }, [navigate]);

  return {
    showNudge,
    dismissNudge,
    acceptNudge,
  };
}

// ============================================================================
// WELLNESS MILESTONE CELEBRATION
// ============================================================================
interface MilestoneCelebrationProps {
  milestone: {
    type: 'streak' | 'sessions' | 'badge';
    value: number;
    label: string;
    xpReward: number;
  };
  onClose: () => void;
}

export function MilestoneCelebration({ milestone, onClose }: MilestoneCelebrationProps) {
  const icons = {
    streak: Flame,
    sessions: MessageCircle,
    badge: Star,
  };
  const Icon = icons[milestone.type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 rounded-3xl p-8 max-w-sm text-center text-white overflow-hidden"
      >
        {/* Confetti effect */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: ['#FCD116', '#CE1126', '#fff', '#006B3F'][i % 4],
              left: `${Math.random() * 100}%`,
              top: '-10px',
            }}
            animate={{
              y: ['0%', '1000%'],
              x: [0, (Math.random() - 0.5) * 100],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 0.5,
            }}
          />
        ))}

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
        >
          <Icon className="w-10 h-10 text-yellow-300" />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-2"
        >
          🎉 Milestone Reached!
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg mb-4"
        >
          {milestone.label}
        </motion.p>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-6"
        >
          <Zap className="w-5 h-5 text-yellow-300" />
          <span className="font-bold">+{milestone.xpReward} XP</span>
        </motion.div>

        <Button
          onClick={onClose}
          className="w-full bg-white text-teal-700 hover:bg-white/90 font-bold"
        >
          <Gift className="w-4 h-4 mr-2" />
          Claim Reward
        </Button>
      </motion.div>
    </motion.div>
  );
}
