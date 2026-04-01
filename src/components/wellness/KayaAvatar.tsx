/**
 * KayaAvatar Component
 * Profile avatar for the AI Wellness Counselor - Kaya
 * SVG-based design representing a caring, professional wellness companion
 */

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface KayaAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  mood?: 'neutral' | 'happy' | 'listening' | 'concerned';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function KayaAvatar({
  size = 'md',
  isThinking = false,
  mood = 'neutral',
  className,
}: KayaAvatarProps) {
  // Mood-based gradient colors
  const moodGradients = {
    neutral: 'from-teal-400 to-emerald-500',
    happy: 'from-amber-400 to-orange-500',
    listening: 'from-blue-400 to-indigo-500',
    concerned: 'from-purple-400 to-violet-500',
  };

  const moodRings = {
    neutral: 'ring-teal-300',
    happy: 'ring-amber-300',
    listening: 'ring-blue-300',
    concerned: 'ring-purple-300',
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Outer glow ring for thinking state */}
      {isThinking && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-md',
            moodGradients[mood]
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main avatar container */}
      <motion.div
        className={cn(
          'relative rounded-full overflow-hidden shadow-lg ring-2 flex items-center justify-center',
          'bg-gradient-to-br',
          sizeClasses[size],
          moodGradients[mood],
          moodRings[mood]
        )}
        animate={isThinking ? { scale: [1, 1.05, 1] } : {}}
        transition={{
          duration: 1.5,
          repeat: isThinking ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Inner circle with icon */}
        <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          {/* Heart with healing hands - representing wellness counseling */}
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            className={cn(iconSizes[size], 'text-white drop-shadow-md')}
            animate={isThinking ? { rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 2, repeat: isThinking ? Infinity : 0 }}
          >
            {/* Caring hands cradling a heart */}
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="currentColor"
              opacity="0.9"
            />
            {/* Subtle pulse effect in center */}
            <circle
              cx="12"
              cy="10"
              r="2"
              fill="white"
              opacity="0.4"
            />
            {/* Small sparkle/star representing AI */}
            <path
              d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5L19 3z"
              fill="white"
              opacity="0.8"
            />
          </motion.svg>
        </div>

        {/* AI indicator badge */}
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
          <span className="text-[6px] font-bold text-teal-600">AI</span>
        </div>
      </motion.div>

      {/* Thinking dots indicator */}
      {isThinking && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-teal-500"
              initial={{ opacity: 0.3, y: 0 }}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
