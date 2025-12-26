import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Award, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';

interface XPGain {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

interface XPNotificationProps {
  gains: XPGain[];
  onDismiss: (id: string) => void;
}

export function XPNotification({ gains, onDismiss }: XPNotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {gains.map((gain) => (
          <XPToast key={gain.id} gain={gain} onDismiss={() => onDismiss(gain.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface XPToastProps {
  gain: XPGain;
  onDismiss: () => void;
}

function XPToast({ gain, onDismiss }: XPToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getIcon = () => {
    if (gain.amount >= 100) return Sparkles;
    if (gain.amount >= 50) return Star;
    if (gain.amount >= 25) return Award;
    return Zap;
  };

  const Icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[200px]"
    >
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-lg">+{gain.amount} XP</p>
        <p className="text-sm text-secondary-100">{gain.reason}</p>
      </div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Star className="w-6 h-6 text-secondary-200" />
      </motion.div>
    </motion.div>
  );
}

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number;
  levelName: string;
  rewards?: { type: string; value: string }[];
  onClose: () => void;
}

export function LevelUpModal({
  isOpen,
  newLevel,
  levelName,
  rewards = [],
  onClose,
}: LevelUpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: 50 }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Confetti Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
              }}
              animate={{
                x: `${Math.random() * 200 - 50}%`,
                y: `${Math.random() * 200 - 50}%`,
                scale: [0, 1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 0.5,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              className={cn(
                'absolute w-3 h-3 rounded-full',
                ['bg-secondary-500', 'bg-primary-500', 'bg-accent-500', 'bg-success-500'][
                  i % 4
                ]
              )}
            />
          ))}
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden text-center relative">
          {/* Header */}
          <div className="bg-gradient-to-br from-secondary-400 to-secondary-600 p-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Star className="w-12 h-12 text-white" />
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white"
            >
              Level Up!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-secondary-100 mt-1"
            >
              Congratulations!
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-surface-600 dark:text-surface-400 mb-2">
                You are now
              </p>
              <p className="text-4xl font-bold text-surface-900 dark:text-surface-50 mb-1">
                Level {newLevel}
              </p>
              <p className="text-lg text-secondary-600 dark:text-secondary-400 font-medium">
                {levelName}
              </p>
            </motion.div>

            {/* Rewards */}
            {rewards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700"
              >
                <p className="text-sm text-surface-500 mb-3">Rewards Unlocked</p>
                <div className="space-y-2">
                  {rewards.map((reward, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-700 rounded-lg"
                    >
                      <span className="text-sm text-surface-700 dark:text-surface-300">
                        {reward.type}
                      </span>
                      <span className="text-sm font-medium text-success-600 dark:text-success-400">
                        {reward.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onClick={onClose}
              className="mt-6 w-full py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white font-medium rounded-lg hover:from-secondary-600 hover:to-secondary-700 transition-colors"
            >
              Awesome!
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
