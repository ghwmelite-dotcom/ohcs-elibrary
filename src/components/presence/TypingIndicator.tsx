import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface TypingIndicatorProps {
  users?: Array<{ id: string; displayName: string }>;
  className?: string;
}

export function TypingIndicator({ users = [], className }: TypingIndicatorProps) {
  if (users.length === 0) {
    return null;
  }

  const getText = () => {
    if (users.length === 1) {
      return `${users[0].displayName} is typing`;
    }
    if (users.length === 2) {
      return `${users[0].displayName} and ${users[1].displayName} are typing`;
    }
    return `${users[0].displayName} and ${users.length - 1} others are typing`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn('flex items-center gap-2 text-sm text-surface-500', className)}
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 bg-surface-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      <span>{getText()}</span>
    </motion.div>
  );
}
