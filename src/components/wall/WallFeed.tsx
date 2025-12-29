import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useWallStore } from '@/stores/wallStore';
import { WallPost as WallPostType } from '@/types';
import { WallPost } from './WallPost';
import { PostComposer } from './PostComposer';
import { FeedTabs } from './FeedTabs';
import { ShareModal } from './ShareModal';
import { cn } from '@/utils/cn';

interface WallFeedProps {
  className?: string;
  showComposer?: boolean;
  userId?: string; // For profile page - show user's posts only
}

export function WallFeed({ className, showComposer = true, userId }: WallFeedProps) {
  const {
    posts,
    feedType,
    isLoading,
    isLoadingMore,
    pagination,
    audienceLists,
    fetchFeed,
    setFeedType,
    loadMorePosts,
    refreshFeed,
    fetchUserPosts,
    fetchAudienceLists,
    userPosts,
  } = useWallStore();

  const [sharePost, setSharePost] = useState<WallPostType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch feed on mount and when feed type changes
  useEffect(() => {
    if (userId) {
      fetchUserPosts(userId);
    } else {
      fetchFeed(feedType, true);
    }
    fetchAudienceLists();
  }, [userId, feedType, fetchFeed, fetchUserPosts, fetchAudienceLists]);

  // Handle infinite scroll
  useEffect(() => {
    if (userId) return; // Don't infinite scroll on profile page

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 500 && !isLoadingMore && pagination.hasMore) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, pagination.hasMore, loadMorePosts, userId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshFeed();
    setIsRefreshing(false);
  }, [refreshFeed]);

  const displayPosts = userId ? (userPosts[userId] || []) : posts;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Feed Tabs - only show on main feed */}
      {!userId && (
        <div className="flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
          <FeedTabs activeTab={feedType} onTabChange={setFeedType} className="min-w-0 flex-1" />

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              'p-2.5 rounded-lg transition-colors flex-shrink-0',
              'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700',
              'text-surface-600 dark:text-surface-400',
              isRefreshing && 'opacity-50'
            )}
            title="Refresh feed"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </button>
        </div>
      )}

      {/* Post Composer */}
      {showComposer && !userId && (
        <PostComposer
          audienceLists={audienceLists}
          onPostCreated={handleRefresh}
        />
      )}

      {/* Posts */}
      {isLoading && displayPosts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : displayPosts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
            No posts yet
          </h3>
          <p className="text-surface-500 max-w-sm mx-auto">
            {userId
              ? "This user hasn't posted anything yet."
              : feedType === 'following'
              ? 'Follow more people to see their posts here.'
              : feedType === 'mda'
              ? 'No posts from your MDA colleagues yet.'
              : 'Be the first to share something!'}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {displayPosts.map((post, index) => (
              <WallPost
                key={post.id}
                post={post}
                index={index}
                onShare={() => setSharePost(post)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Loading More */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      )}

      {/* End of Feed */}
      {!isLoading && !isLoadingMore && !pagination.hasMore && displayPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <p className="text-sm text-surface-400">
            You&apos;re all caught up!
          </p>
        </motion.div>
      )}

      {/* Share Modal */}
      {sharePost && (
        <ShareModal
          isOpen={!!sharePost}
          onClose={() => setSharePost(null)}
          post={sharePost}
        />
      )}
    </div>
  );
}
