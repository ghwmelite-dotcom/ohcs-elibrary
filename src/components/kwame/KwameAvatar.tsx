/**
 * KwameAvatar Component
 * Wisdom-themed avatar for the AI Knowledge Assistant
 * Features the Nyansapo Adinkra symbol (wisdom knot) with Ghana colors
 */

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface KwameAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  state?: 'idle' | 'thinking' | 'speaking';
  className?: string;
}

export function KwameAvatar({ size = 'md', state = 'idle', className }: KwameAvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-full flex items-center justify-center',
        'bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700',
        'shadow-lg',
        sizes[size],
        className
      )}
      animate={
        state === 'thinking'
          ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }
          : state === 'speaking'
          ? { scale: [1, 1.02, 1] }
          : {}
      }
      transition={
        state === 'thinking'
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : state === 'speaking'
          ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
          : {}
      }
    >
      {/* Outer ring for speaking state */}
      {state === 'speaking' && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-gold-400"
          animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Nyansapo (Wisdom Knot) Symbol - Stylized */}
      <svg
        viewBox="0 0 24 24"
        className={cn(iconSizes[size], 'text-white')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Wisdom Knot - Simplified design */}
        <circle cx="12" cy="12" r="8" strokeWidth="1.5" />
        <path d="M12 4v4M12 16v4M4 12h4M16 12h4" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
        {/* Inner cross pattern */}
        <path d="M9 9l6 6M15 9l-6 6" strokeWidth="1" opacity="0.7" />
      </svg>

      {/* Ghana colors accent ring */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-gold-400 to-primary-500" />
      </div>

      {/* Thinking dots */}
      {state === 'thinking' && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-gold-400"
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
