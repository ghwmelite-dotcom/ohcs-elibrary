import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface AyoAvatarProps {
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

const innerSizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
  xl: 'w-18 h-18',
};

export function AyoAvatar({
  size = 'md',
  isThinking = false,
  mood = 'neutral',
  className,
}: AyoAvatarProps) {
  // Mood-based colors
  const moodColors = {
    neutral: 'from-teal-400 to-teal-600',
    happy: 'from-amber-400 to-orange-500',
    listening: 'from-blue-400 to-indigo-500',
    concerned: 'from-purple-400 to-violet-500',
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Outer glow ring */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-md',
          moodColors[mood]
        )}
        animate={isThinking ? {
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        } : {
          scale: 1,
          opacity: 0.5,
        }}
        transition={{
          duration: 1.5,
          repeat: isThinking ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />

      {/* Main avatar circle */}
      <motion.div
        className={cn(
          'relative rounded-full bg-gradient-to-br shadow-lg flex items-center justify-center',
          sizeClasses[size],
          moodColors[mood]
        )}
        animate={isThinking ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 1.5,
          repeat: isThinking ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Inner light */}
        <div className={cn(
          'rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center',
          innerSizeClasses[size]
        )}>
          {/* Ayo face/symbol */}
          <motion.div
            className="text-white font-bold"
            style={{ fontSize: size === 'xl' ? '1.5rem' : size === 'lg' ? '1rem' : size === 'md' ? '0.75rem' : '0.5rem' }}
            animate={isThinking ? { rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 2, repeat: isThinking ? Infinity : 0 }}
          >
            {/* Kente-inspired pattern or simple A for Ayo */}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={cn(
                size === 'xl' ? 'w-10 h-10' :
                size === 'lg' ? 'w-7 h-7' :
                size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
              )}
            >
              {/* Heart with a gentle smile - representing care and joy */}
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
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
