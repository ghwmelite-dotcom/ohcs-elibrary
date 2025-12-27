import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

interface TypingIndicatorProps {
  users: { id: string; name: string; avatar?: string }[];
  className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].name} is typing`;
    } else if (users.length === 2) {
      return `${users[0].name} and ${users[1].name} are typing`;
    } else {
      return `${users[0].name} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn('flex items-center gap-3', className)}
    >
      {/* Avatars */}
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Avatar
              src={user.avatar}
              name={user.name}
              size="xs"
              className="ring-2 ring-white dark:ring-surface-800"
            />
          </motion.div>
        ))}
      </div>

      {/* Typing Animation Bubble */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-100 dark:bg-surface-700 rounded-2xl rounded-bl-md shadow-sm"
      >
        {/* Animated dots with gradient */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-br from-primary-400 to-primary-600"
              animate={{
                y: [0, -6, 0],
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
          {getTypingText()}
        </span>
      </motion.div>
    </motion.div>
  );
}

// Inline typing indicator for compact spaces
export function InlineTypingIndicator({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 ml-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 bg-primary-500 rounded-full"
          animate={{
            y: [0, -3, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

// Compact typing indicator for message lists
export function CompactTypingIndicator({
  userName,
  avatar,
  className,
}: {
  userName: string;
  avatar?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn('flex items-center gap-2 py-2', className)}
    >
      <Avatar src={avatar} name={userName} size="xs" />
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 dark:bg-surface-700/50 rounded-xl">
        <motion.div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 bg-surface-400 dark:bg-surface-500 rounded-full"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Floating typing indicator that appears at the bottom of chat
export function FloatingTypingIndicator({
  users,
  className,
}: {
  users: { id: string; name: string; avatar?: string }[];
  className?: string;
}) {
  if (users.length === 0) return null;

  const displayText =
    users.length === 1
      ? `${users[0].name} is typing...`
      : users.length === 2
      ? `${users[0].name} and ${users[1].name} are typing...`
      : `${users.length} people are typing...`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className={cn(
          'absolute bottom-full left-4 mb-2 flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-800 rounded-full shadow-lg border border-surface-200 dark:border-surface-700',
          className
        )}
      >
        {/* Stacked avatars */}
        <div className="flex -space-x-1.5">
          {users.slice(0, 3).map((user) => (
            <Avatar
              key={user.id}
              src={user.avatar}
              name={user.name}
              size="xs"
              className="ring-2 ring-white dark:ring-surface-800 w-5 h-5 text-[8px]"
            />
          ))}
        </div>

        {/* Animated typing indicator */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 bg-primary-500 rounded-full"
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">
            {displayText}
          </span>
        </div>

        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary-500/10"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// Typing status with pencil animation
export function PencilTypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <motion.span
        className="text-sm"
        animate={{ rotate: [0, -15, 0, 15, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        ✏️
      </motion.span>
      <span className="text-xs text-surface-500 italic">typing</span>
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        ...
      </motion.span>
    </div>
  );
}
