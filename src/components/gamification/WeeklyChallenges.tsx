import { motion } from 'framer-motion';
import { Target, Clock, CheckCircle2, Flame, Gift, Trophy, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetType: string;
  targetValue: number;
  xpReward: number;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: string;
  startDate: string;
  endDate: string;
}

interface WeeklyChallengesProps {
  challenges: Challenge[];
  onChallengeClick?: (challenge: Challenge) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  '📚': <span className="text-2xl">📚</span>,
  '💬': <span className="text-2xl">💬</span>,
  '⚡': <Zap className="w-6 h-6 text-yellow-500" />,
  '🎯': <Target className="w-6 h-6 text-primary-500" />,
  '🔥': <Flame className="w-6 h-6 text-orange-500" />,
  '🏆': <Trophy className="w-6 h-6 text-yellow-600" />,
};

export function WeeklyChallenges({ challenges, onChallengeClick }: WeeklyChallengesProps) {
  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (challenges.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-surface-900 dark:text-white">Weekly Challenges</h3>
        </div>
        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-surface-500">No active challenges this week</p>
          <p className="text-sm text-surface-400 mt-1">Check back soon for new challenges!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Weekly Challenges</h3>
              <p className="text-white/80 text-sm">Complete for bonus XP!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              {getTimeRemaining(challenges[0]?.endDate || '')}
            </span>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="p-4 space-y-3">
        {challenges.map((challenge, index) => {
          const progress = Math.min((challenge.currentProgress / challenge.targetValue) * 100, 100);

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onChallengeClick?.(challenge)}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all cursor-pointer',
                challenge.isCompleted
                  ? 'border-success-300 bg-success-50 dark:bg-success-900/20 dark:border-success-700'
                  : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600 bg-surface-50 dark:bg-surface-800/50'
              )}
            >
              {/* Completion Badge */}
              {challenge.isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-success-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </motion.div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  challenge.isCompleted
                    ? 'bg-success-100 dark:bg-success-900/30'
                    : 'bg-surface-100 dark:bg-surface-700'
                )}>
                  {iconMap[challenge.icon] || <span className="text-2xl">{challenge.icon}</span>}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={cn(
                      'font-semibold',
                      challenge.isCompleted
                        ? 'text-success-700 dark:text-success-400'
                        : 'text-surface-900 dark:text-white'
                    )}>
                      {challenge.title}
                    </h4>
                    <span className={cn(
                      'text-sm font-bold px-2 py-0.5 rounded-full',
                      challenge.isCompleted
                        ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                        : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400'
                    )}>
                      +{challenge.xpReward} XP
                    </span>
                  </div>

                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                    {challenge.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-surface-500">
                        {challenge.currentProgress} / {challenge.targetValue}
                      </span>
                      <span className={cn(
                        'font-medium',
                        challenge.isCompleted ? 'text-success-600' : 'text-surface-600 dark:text-surface-400'
                      )}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                        className={cn(
                          'h-full rounded-full',
                          challenge.isCompleted
                            ? 'bg-gradient-to-r from-success-400 to-success-500'
                            : 'bg-gradient-to-r from-primary-400 to-primary-600'
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
