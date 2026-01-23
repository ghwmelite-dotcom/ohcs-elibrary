/**
 * DrSenaAvatar Component
 * Profile avatar for the AI Wellness Counselor - Dr. Sena
 */

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface DrSenaAvatarProps {
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

export function DrSenaAvatar({
  size = 'md',
  isThinking = false,
  mood = 'neutral',
  className,
}: DrSenaAvatarProps) {
  // Mood-based ring colors
  const moodColors = {
    neutral: 'ring-teal-400',
    happy: 'ring-amber-400',
    listening: 'ring-blue-400',
    concerned: 'ring-purple-400',
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Outer glow ring for thinking state */}
      {isThinking && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-md',
            'from-teal-400 to-teal-600'
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
          'relative rounded-full overflow-hidden shadow-lg ring-2',
          sizeClasses[size],
          moodColors[mood]
        )}
        animate={isThinking ? { scale: [1, 1.05, 1] } : {}}
        transition={{
          duration: 1.5,
          repeat: isThinking ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Dr. Sena Profile Image */}
        <img
          src="/images/avatars/dr-sena.png"
          alt="Dr. Sena - Wellness Counselor"
          className="w-full h-full object-cover"
        />
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
