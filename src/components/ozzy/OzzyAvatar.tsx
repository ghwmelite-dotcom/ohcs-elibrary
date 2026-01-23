/**
 * OzzyAvatar Component
 * Profile avatar for the AI Knowledge Assistant - Ozzy
 */

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface OzzyAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  state?: 'idle' | 'thinking' | 'speaking';
  className?: string;
}

export function OzzyAvatar({ size = 'md', state = 'idle', className }: OzzyAvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-full flex items-center justify-center overflow-hidden',
        'shadow-lg ring-2 ring-primary-500/30',
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

      {/* Ozzy Profile Image */}
      <img
        src="/images/avatars/ozzy.png"
        alt="Ozzy - Knowledge Assistant"
        className="w-full h-full object-cover"
      />

      {/* Ghana colors accent ring */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-gold-400 to-primary-500" />
      </div>

      {/* Thinking indicator overlay */}
      {state === 'thinking' && (
        <>
          <div className="absolute inset-0 bg-primary-500/20 animate-pulse rounded-full" />
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
        </>
      )}
    </motion.div>
  );
}
