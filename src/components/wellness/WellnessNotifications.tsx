import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Coffee,
  Calendar,
  PartyPopper,
  Heart,
  Sparkles,
  X,
  MessageCircle,
  Clock,
  Target,
  Smile,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { DrSenaAvatar } from './DrSenaAvatar';
import { useWellnessStore } from '@/stores/wellnessStore';
import { useAuthStore } from '@/stores/authStore';

// ============================================================================
// TIME-BASED NOTIFICATION TYPES
// ============================================================================
type NotificationType =
  | 'monday_motivation'
  | 'midweek_checkin'
  | 'friday_reflection'
  | 'end_of_day'
  | 'morning_greeting'
  | 'break_reminder'
  | 'streak_reminder';

interface WellnessNotification {
  type: NotificationType;
  title: string;
  message: string;
  icon: React.ElementType;
  cta: string;
  ctaAction: () => void;
  dismissLabel?: string;
}

// ============================================================================
// SMART WELLNESS NOTIFICATIONS HOOK
// ============================================================================
export function useSmartWellnessNotifications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { todayMood, moodHistory } = useWellnessStore();
  const [notification, setNotification] = useState<WellnessNotification | null>(null);
  const [dismissedToday, setDismissedToday] = useState<Set<NotificationType>>(new Set());

  const displayName = user?.firstName || 'there';

  // Check what notifications are due
  const checkNotifications = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const today = now.toDateString();

    // Get dismissed notifications from localStorage
    const savedDismissed = localStorage.getItem('wellness-dismissed-notifications');
    const dismissed: { date: string; types: NotificationType[] } = savedDismissed
      ? JSON.parse(savedDismissed)
      : { date: '', types: [] };

    // Reset if it's a new day
    if (dismissed.date !== today) {
      localStorage.setItem('wellness-dismissed-notifications', JSON.stringify({ date: today, types: [] }));
      setDismissedToday(new Set());
    } else {
      setDismissedToday(new Set(dismissed.types));
    }

    // Don't show if already logged mood today (unless it's a special day notification)
    const hasLoggedMoodToday = !!todayMood;

    // Calculate wellness streak
    const wellnessStreak = moodHistory?.length || 0;

    // Determine which notification to show based on time and day
    let notificationToShow: WellnessNotification | null = null;

    // Monday Morning Motivation (Monday, 8-10 AM)
    if (dayOfWeek === 1 && hour >= 8 && hour < 10 && !dismissedToday.has('monday_motivation')) {
      notificationToShow = {
        type: 'monday_motivation',
        title: 'New Week, Fresh Start! 🌟',
        message: `Good morning ${displayName}! Set the tone for a great week with a quick wellness check-in.`,
        icon: Sun,
        cta: 'Start My Week Right',
        ctaAction: () => navigate('/wellness'),
      };
    }
    // Midweek Check-in (Wednesday, 2-4 PM)
    else if (dayOfWeek === 3 && hour >= 14 && hour < 16 && !dismissedToday.has('midweek_checkin') && !hasLoggedMoodToday) {
      notificationToShow = {
        type: 'midweek_checkin',
        title: 'Midweek Moment 🌿',
        message: "You're halfway through the week! How are you holding up?",
        icon: Coffee,
        cta: 'Quick Check-in',
        ctaAction: () => navigate('/wellness'),
      };
    }
    // Friday Reflection (Friday, 3-5 PM)
    else if (dayOfWeek === 5 && hour >= 15 && hour < 17 && !dismissedToday.has('friday_reflection')) {
      notificationToShow = {
        type: 'friday_reflection',
        title: 'Week Complete! 🎉',
        message: `Great work this week, ${displayName}! Take a moment to reflect before the weekend.`,
        icon: PartyPopper,
        cta: 'Week Reflection',
        ctaAction: () => navigate('/wellness'),
      };
    }
    // End of Day Wind-down (5-6 PM on weekdays)
    else if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 17 && hour < 18 && !dismissedToday.has('end_of_day') && !hasLoggedMoodToday) {
      notificationToShow = {
        type: 'end_of_day',
        title: 'Wrapping Up? 🌅',
        message: 'Before you go, how was your day? A quick mood log helps track your wellbeing.',
        icon: Moon,
        cta: 'Log My Day',
        ctaAction: () => navigate('/wellness'),
      };
    }
    // Morning Greeting (8-9 AM if no mood logged)
    else if (hour >= 8 && hour < 9 && !dismissedToday.has('morning_greeting') && !hasLoggedMoodToday && dayOfWeek !== 0 && dayOfWeek !== 6) {
      notificationToShow = {
        type: 'morning_greeting',
        title: `Good Morning, ${displayName}! ☀️`,
        message: 'Start your day with intention. How are you feeling this morning?',
        icon: Sun,
        cta: 'Morning Check-in',
        ctaAction: () => navigate('/wellness'),
      };
    }
    // Streak Reminder (if user has a streak and hasn't logged today)
    else if (wellnessStreak >= 3 && !hasLoggedMoodToday && hour >= 16 && !dismissedToday.has('streak_reminder')) {
      notificationToShow = {
        type: 'streak_reminder',
        title: `Keep Your ${wellnessStreak}-Day Streak! 🔥`,
        message: "Don't break your wellness streak! A quick check-in keeps your momentum going.",
        icon: Target,
        cta: 'Maintain Streak',
        ctaAction: () => navigate('/wellness'),
      };
    }

    if (notificationToShow && !dismissedToday.has(notificationToShow.type)) {
      // Delay showing notification slightly for smoother UX
      setTimeout(() => setNotification(notificationToShow), 3000);
    }
  }, [navigate, displayName, todayMood, moodHistory, dismissedToday]);

  // Run check on mount and periodically
  useEffect(() => {
    checkNotifications();

    // Check every 30 minutes
    const interval = setInterval(checkNotifications, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkNotifications]);

  // Dismiss notification
  const dismissNotification = useCallback(() => {
    if (notification) {
      const today = new Date().toDateString();
      const newDismissed = new Set(dismissedToday);
      newDismissed.add(notification.type);
      setDismissedToday(newDismissed);

      localStorage.setItem(
        'wellness-dismissed-notifications',
        JSON.stringify({ date: today, types: Array.from(newDismissed) })
      );

      setNotification(null);
    }
  }, [notification, dismissedToday]);

  // Accept notification (go to wellness)
  const acceptNotification = useCallback(() => {
    if (notification) {
      notification.ctaAction();
      dismissNotification();
    }
  }, [notification, dismissNotification]);

  return {
    notification,
    dismissNotification,
    acceptNotification,
  };
}

// ============================================================================
// SMART NOTIFICATION BANNER
// ============================================================================
interface SmartNotificationBannerProps {
  notification: WellnessNotification;
  onDismiss: () => void;
  onAccept: () => void;
}

export function SmartNotificationBanner({
  notification,
  onDismiss,
  onAccept,
}: SmartNotificationBannerProps) {
  const Icon = notification.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <div className="relative bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-4 shadow-2xl text-white overflow-hidden">
        {/* Background decoration */}
        <motion.div
          className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative flex items-start gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 bg-white/20 rounded-xl"
          >
            <Icon className="w-6 h-6" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm mb-1">{notification.title}</h3>
            <p className="text-xs text-white/90 mb-3">{notification.message}</p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onAccept}
                className="bg-white text-teal-700 hover:bg-white/90 text-xs font-semibold"
              >
                <Heart className="w-3 h-3 mr-1" />
                {notification.cta}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-white/70 hover:text-white hover:bg-white/10 text-xs"
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// FLOATING WELLNESS PULSE (subtle ambient reminder)
// ============================================================================
export function WellnessPulse({ onClick }: { onClick: () => void }) {
  const { todayMood } = useWellnessStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if no mood logged today
    if (!todayMood) {
      const timer = setTimeout(() => setIsVisible(true), 60000); // Show after 1 minute
      return () => clearTimeout(timer);
    }
  }, [todayMood]);

  if (!isVisible || todayMood) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      onClick={onClick}
      className="fixed bottom-24 right-6 z-40 group"
    >
      <motion.div
        className="relative w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full shadow-lg flex items-center justify-center"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-teal-400"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <DrSenaAvatar size="sm" mood="caring" />

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute right-full mr-3 px-3 py-2 bg-surface-900 text-white text-xs rounded-lg whitespace-nowrap"
        >
          How are you today?
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-surface-900 rotate-45" />
        </motion.div>
      </motion.div>
    </motion.button>
  );
}

// ============================================================================
// WEEKLY WELLNESS SUMMARY CARD
// ============================================================================
interface WeeklySummaryProps {
  moodHistory: Array<{ mood: number; createdAt?: string }>;
  streak: number;
}

export function WeeklyWellnessSummary({ moodHistory, streak }: WeeklySummaryProps) {
  // Calculate stats for the week
  const thisWeekMoods = moodHistory.filter((m) => {
    if (!m.createdAt) return false;
    const moodDate = new Date(m.createdAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return moodDate >= weekAgo;
  });

  const averageMood = thisWeekMoods.length > 0
    ? thisWeekMoods.reduce((sum, m) => sum + m.mood, 0) / thisWeekMoods.length
    : 0;

  const moodLabels: Record<number, string> = {
    1: 'Challenging',
    2: 'Low',
    3: 'Okay',
    4: 'Good',
    5: 'Great',
  };

  const getMoodEmoji = (avg: number) => {
    if (avg < 2) return '😔';
    if (avg < 3) return '😕';
    if (avg < 4) return '😐';
    if (avg < 4.5) return '🙂';
    return '😊';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500/10 to-teal-500/10 dark:from-purple-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/50"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-500" />
          This Week's Wellness
        </h3>
        <span className="text-xs text-surface-500 dark:text-surface-400">{thisWeekMoods.length} check-ins</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-surface-50/50 dark:bg-surface-800/50 rounded-lg p-3">
          <span className="text-2xl">{getMoodEmoji(averageMood)}</span>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Average</p>
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {averageMood ? moodLabels[Math.round(averageMood)] : 'N/A'}
          </p>
        </div>

        <div className="bg-surface-50/50 dark:bg-surface-800/50 rounded-lg p-3">
          <div className="flex items-center justify-center gap-1">
            <Target className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Check-ins</p>
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {thisWeekMoods.length}/7
          </p>
        </div>

        <div className="bg-surface-50/50 dark:bg-surface-800/50 rounded-lg p-3">
          <div className="flex items-center justify-center gap-1">
            <Sparkles className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Streak</p>
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {streak} day{streak !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
