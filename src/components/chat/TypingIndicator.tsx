import { motion } from 'framer-motion';
import { Avatar } from '@/components/shared/Avatar';

interface TypingIndicatorProps {
  users: { id: string; name: string; avatar?: string }[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
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
    <div className="flex items-center gap-3">
      {/* Avatars */}
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <Avatar
            key={user.id}
            src={user.avatar}
            name={user.name}
            size="xs"
            className="ring-2 ring-white dark:ring-surface-800"
          />
        ))}
      </div>

      {/* Typing Animation */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-100 dark:bg-surface-700 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 bg-surface-400 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
        <span className="text-xs text-surface-500">{getTypingText()}</span>
      </div>
    </div>
  );
}

export function InlineTypingIndicator() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 bg-surface-400 rounded-full"
          animate={{ y: [0, -2, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </span>
  );
}
