import { motion } from 'framer-motion';
import { Crown, Medal, Trophy, Sparkles } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

interface PodiumUser {
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  rank: number;
  mda?: string;
}

interface PodiumProps {
  users: PodiumUser[];
  currentUserId?: string;
}

export function Podium({ users, currentUserId }: PodiumProps) {
  // Ensure we have exactly 3 users (or fill with empty)
  const top3 = [...users.slice(0, 3)];
  while (top3.length < 3) {
    top3.push({ userId: '', name: '---', xp: 0, level: 0, rank: top3.length + 1 });
  }

  // Reorder for visual display: 2nd, 1st, 3rd
  const orderedUsers = [top3[1], top3[0], top3[2]];

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1: return 'h-32';
      case 2: return 'h-24';
      case 3: return 'h-20';
      default: return 'h-16';
    }
  };

  const getPodiumColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 via-yellow-500 to-yellow-600';
      case 2: return 'from-gray-300 via-gray-400 to-gray-500';
      case 3: return 'from-amber-600 via-amber-700 to-amber-800';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-300" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return null;
    }
  };

  const getAvatarSize = (rank: number) => {
    switch (rank) {
      case 1: return 'w-20 h-20';
      case 2: return 'w-16 h-16';
      case 3: return 'w-14 h-14';
      default: return 'w-12 h-12';
    }
  };

  return (
    <div className="relative py-8">
      {/* Sparkles background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, -20, -40],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            style={{
              left: `${10 + (i * 7)}%`,
              top: '60%',
            }}
          >
            <Sparkles className="w-4 h-4 text-yellow-400/50" />
          </motion.div>
        ))}
      </div>

      <div className="flex items-end justify-center gap-4 md:gap-8">
        {orderedUsers?.map((user, index) => {
          if (!user) return null;
          const isCurrentUser = user.userId === currentUserId;
          const animationDelay = index === 1 ? 0 : index === 0 ? 0.2 : 0.4;

          return (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: animationDelay, type: 'spring', stiffness: 100 }}
              className={cn(
                'flex flex-col items-center',
                user.rank === 1 ? 'order-2' : user.rank === 2 ? 'order-1' : 'order-3'
              )}
            >
              {/* User Info */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: animationDelay + 0.2, type: 'spring' }}
                className="flex flex-col items-center mb-4"
              >
                {/* Rank Icon */}
                <motion.div
                  animate={user.rank === 1 ? {
                    rotate: [0, -10, 10, 0],
                    scale: [1, 1.1, 1],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="mb-2"
                >
                  {getRankIcon(user.rank)}
                </motion.div>

                {/* Avatar with glow effect for 1st place */}
                <div className={cn(
                  'relative rounded-full',
                  user.rank === 1 && 'ring-4 ring-yellow-400/50 shadow-lg shadow-yellow-400/30',
                  user.rank === 2 && 'ring-2 ring-gray-300/50',
                  user.rank === 3 && 'ring-2 ring-amber-600/50',
                  isCurrentUser && 'ring-4 ring-primary-500'
                )}>
                  {user.rank === 1 && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-yellow-400/20"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    className={cn(getAvatarSize(user.rank), 'border-2 border-white dark:border-surface-700')}
                  />
                </div>

                {/* Name & XP */}
                <div className="text-center mt-2">
                  <p className={cn(
                    'font-bold truncate max-w-24',
                    user.rank === 1 ? 'text-lg text-surface-900 dark:text-white' : 'text-sm text-surface-700 dark:text-surface-300',
                    isCurrentUser && 'text-primary-600 dark:text-primary-400'
                  )}>
                    {user.name}
                    {isCurrentUser && ' (You)'}
                  </p>
                  <p className={cn(
                    'font-medium',
                    user.rank === 1 ? 'text-yellow-600 dark:text-yellow-400' : 'text-surface-500 text-sm'
                  )}>
                    {user.xp.toLocaleString()} XP
                  </p>
                </div>
              </motion.div>

              {/* Podium Block */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: animationDelay, duration: 0.5, ease: 'easeOut' }}
                className={cn(
                  'w-24 md:w-32 rounded-t-xl relative overflow-hidden origin-bottom',
                  getPodiumHeight(user.rank),
                  `bg-gradient-to-b ${getPodiumColor(user.rank)}`
                )}
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                />

                {/* Rank Number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn(
                    'font-bold text-white/90',
                    user.rank === 1 ? 'text-4xl' : 'text-2xl'
                  )}>
                    {user.rank}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Trophy decoration */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="relative">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sparkles className="w-16 h-16 text-yellow-400/30" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
