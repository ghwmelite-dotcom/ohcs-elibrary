import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Loader2, Search } from 'lucide-react';
import { useSocialStore } from '@/stores/socialStore';
import { UserCard } from './UserCard';
import { cn } from '@/utils/cn';

interface FollowingListProps {
  userId?: string;
  title?: string;
  showSearch?: boolean;
  className?: string;
}

export function FollowingList({
  userId,
  title = 'Following',
  showSearch = true,
  className,
}: FollowingListProps) {
  const {
    following,
    followingLoading,
    fetchFollowing,
    fetchUserFollowing,
  } = useSocialStore();

  const [displayFollowing, setDisplayFollowing] = useState(following);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserFollowing(userId).then(setDisplayFollowing);
    } else {
      fetchFollowing();
    }
  }, [userId, fetchFollowing, fetchUserFollowing]);

  useEffect(() => {
    if (!userId) {
      setDisplayFollowing(following);
    }
  }, [following, userId]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!userId) {
      setIsSearching(true);
      await fetchFollowing(1, query);
      setIsSearching(false);
    } else {
      const filtered = following.filter((f) =>
        f.displayName?.toLowerCase().includes(query.toLowerCase())
      );
      setDisplayFollowing(filtered);
    }
  };

  const isLoading = followingLoading && displayFollowing.length === 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary-600" />
          {title}
          <span className="text-sm font-normal text-surface-500">
            ({displayFollowing.length})
          </span>
        </h3>
      </div>

      {showSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search following..."
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg',
              'bg-surface-50 dark:bg-surface-900',
              'border border-surface-200 dark:border-surface-700',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
              'placeholder-surface-400 text-surface-900 dark:text-surface-100',
              'text-sm'
            )}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 animate-spin" />
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : displayFollowing.length === 0 ? (
        <div className="text-center py-8">
          <UserCheck className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
          <p className="text-surface-500">
            {searchQuery ? 'No users found' : 'Not following anyone yet'}
          </p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          {displayFollowing.map((user, index) => (
            <UserCard
              key={user.id}
              user={user}
              index={index}
              showFollow={!userId}
              showConnect={false}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
