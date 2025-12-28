import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, TrendingUp, TrendingDown, Minus, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { AyoAvatar } from './AyoAvatar';
import { useWellnessStore } from '@/stores/wellnessStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

const wellnessTips = [
  "Take a 5-minute break to stretch and breathe deeply.",
  "A short walk can boost your mood and creativity.",
  "Remember to stay hydrated throughout the day.",
  "Practice gratitude by noting three things you're thankful for.",
  "Connect with a colleague today - social bonds improve wellbeing.",
  "Set boundaries - it's okay to say no to protect your energy.",
  "Celebrate small wins - every achievement matters.",
  "Deep breathing: 4 seconds in, 4 seconds hold, 4 seconds out.",
];

const moodEmojis: Record<number, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

export function WellnessDashboardCard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { moodStats, todayMood, fetchMoodHistory, moodHistory } = useWellnessStore();

  // Fetch mood history on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMoodHistory();
    }
  }, [isAuthenticated, user, fetchMoodHistory]);

  // Get random tip for today (seeded by date for consistency)
  const dailyTip = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return wellnessTips[seed % wellnessTips.length];
  }, []);

  const displayName = user?.firstName || user?.displayName?.split(' ')[0] || 'there';

  // Calculate mood trend
  const moodTrend = useMemo(() => {
    if (!moodStats || moodStats.count < 2) return null;
    return moodStats.trend;
  }, [moodStats]);

  const TrendIcon = moodTrend === 'improving' ? TrendingUp : moodTrend === 'declining' ? TrendingDown : Minus;
  const trendColor = moodTrend === 'improving' ? 'text-green-500' : moodTrend === 'declining' ? 'text-red-500' : 'text-gray-400';
  const trendLabel = moodTrend === 'improving' ? 'Improving' : moodTrend === 'declining' ? 'Needs attention' : 'Stable';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <AyoAvatar size="md" mood="happy" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Heart className="w-4 h-4 text-pink-200" />
              <span className="text-xs sm:text-sm font-medium text-white/80">Wellness Centre</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold truncate">
              Hi {displayName}! How are you today?
            </h3>
          </div>
        </div>

        {/* Mood status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4">
          {todayMood ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{moodEmojis[todayMood.mood]}</span>
                <div>
                  <p className="text-sm font-medium">Today's mood logged</p>
                  <p className="text-xs text-white/70">Keep up the self-awareness!</p>
                </div>
              </div>
              {moodTrend && moodStats && moodStats.count >= 3 && (
                <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full bg-white/20', trendColor)}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{trendLabel}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div>
                  <p className="text-sm font-medium">Check in with yourself</p>
                  <p className="text-xs text-white/70">How are you feeling right now?</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/wellness')}
                className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs"
              >
                Log mood
              </Button>
            </div>
          )}
        </div>

        {/* Daily tip */}
        <div className="mb-4">
          <p className="text-xs text-white/70 mb-1">Today's wellness tip</p>
          <p className="text-sm text-white/90 leading-relaxed">{dailyTip}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/wellness/chat')}
            className="flex-1 bg-white text-teal-700 hover:bg-white/90 font-semibold"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with Ayo
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/wellness')}
            className="border-white/30 text-white hover:bg-white/10"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
