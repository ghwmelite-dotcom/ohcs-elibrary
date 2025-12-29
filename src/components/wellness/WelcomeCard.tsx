import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, History, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { AyoAvatar } from './AyoAvatar';
import { MoodSelector } from './MoodSelector';
import { useWellnessStore } from '@/stores/wellnessStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

interface WelcomeCardProps {
  onStartChat?: () => void;
}

export function WelcomeCard({ onStartChat }: WelcomeCardProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { todayMood, logMood, isAnonymous } = useWellnessStore();
  const [selectedMood, setSelectedMood] = useState<number | undefined>(todayMood?.mood);
  const [isSaving, setIsSaving] = useState(false);

  const greeting = getGreeting();
  const displayName = isAnonymous || !isAuthenticated
    ? 'Friend'
    : (user?.firstName || user?.displayName?.split(' ')[0] || 'Friend');

  const handleMoodSelect = async (mood: number) => {
    setSelectedMood(mood);
    if (!isAnonymous && user) {
      setIsSaving(true);
      await logMood({ mood });
      setIsSaving(false);
    }
  };

  const quickActions = [
    {
      icon: MessageCircle,
      label: 'Chat with Ayo',
      description: 'Start a new conversation',
      onClick: () => {
        if (onStartChat) {
          onStartChat();
        } else {
          navigate('/wellness/chat');
        }
      },
      primary: true,
    },
    {
      icon: History,
      label: 'Past Sessions',
      description: 'Continue a conversation',
      onClick: () => navigate('/wellness/chat'),
      primary: false,
    },
    {
      icon: BookOpen,
      label: 'Resources',
      description: 'Self-help materials',
      onClick: () => navigate('/wellness/resources'),
      primary: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-teal-50 via-white to-purple-50 dark:from-teal-950/30 dark:via-gray-900 dark:to-purple-950/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-800"
    >
      {/* Header with Ayo */}
      <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="hidden xs:block">
          <AyoAvatar size="lg" mood="happy" />
        </div>
        <div className="xs:hidden">
          <AyoAvatar size="md" mood="happy" />
        </div>
        <div className="flex-1 min-w-0">
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white"
          >
            {greeting}, {displayName}!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1"
          >
            I'm Ayo, your wellness companion. How are you feeling today?
          </motion.p>
        </div>

        {isAnonymous && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs shrink-0"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Anonymous</span>
          </motion.div>
        )}
      </div>

      {/* Mood selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-5 sm:mb-8"
      >
        <MoodSelector
          value={selectedMood}
          onChange={handleMoodSelect}
          disabled={isSaving}
        />
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3"
      >
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              onClick={action.onClick}
              className={cn(
                'p-3 sm:p-4 rounded-xl text-left transition-all group',
                action.primary
                  ? 'bg-teal-600 hover:bg-teal-700 active:bg-teal-700 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 active:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700'
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className={cn(
                    'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0',
                    action.primary
                      ? 'bg-white/20'
                      : 'bg-teal-100 dark:bg-teal-900/30'
                  )}>
                    <Icon className={cn(
                      'w-4 h-4 sm:w-5 sm:h-5',
                      action.primary ? 'text-white' : 'text-teal-600 dark:text-teal-400'
                    )} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={cn(
                      'font-semibold text-sm sm:text-base',
                      action.primary ? 'text-white' : 'text-gray-900 dark:text-white'
                    )}>
                      {action.label}
                    </h3>
                    <p className={cn(
                      'text-xs sm:text-sm truncate',
                      action.primary ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {action.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1 shrink-0 ml-2',
                  action.primary ? 'text-white/60' : 'text-gray-400'
                )} />
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
