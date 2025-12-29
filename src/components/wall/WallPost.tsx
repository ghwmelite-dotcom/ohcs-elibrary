import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Globe,
  Users,
  Building2,
  Lock,
  UserCheck,
  GraduationCap,
  Edit2,
  Trash2,
  Pin,
  Flag,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { WallPost as WallPostType, PostVisibility } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useWallStore } from '@/stores/wallStore';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import { CommentComposer } from './CommentComposer';
import { WallComment } from './WallComment';

interface WallPostProps {
  post: WallPostType;
  index?: number;
  onShare?: () => void;
  showComments?: boolean;
}

const visibilityIcons: Record<PostVisibility, React.ElementType> = {
  public: Globe,
  network: Users,
  mda: Building2,
  close_colleagues: UserCheck,
  mentors: GraduationCap,
  custom_list: Users,
  private: Lock,
};

export function WallPost({
  post,
  index = 0,
  onShare,
  showComments = false,
}: WallPostProps) {
  const { user } = useAuthStore();
  const {
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    deletePost,
    fetchComments,
    comments,
  } = useWallStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(showComments);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const isOwner = user?.id === post.authorId;
  const VisibilityIcon = visibilityIcons[post.visibility] || Globe;
  const postComments = comments[post.id] || [];

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (post.isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;
    setIsBookmarking(true);
    try {
      if (post.isBookmarked) {
        await unbookmarkPost(post.id);
      } else {
        await bookmarkPost(post.id);
      }
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShowComments = async () => {
    if (!showCommentsSection) {
      await fetchComments(post.id);
    }
    setShowCommentsSection(!showCommentsSection);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(post.id);
    }
    setShowMenu(false);
  };

  // Reactions display
  const topReactions = post.reactions
    ? Object.entries(post.reactions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
    : [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1',
        'border border-surface-200 dark:border-surface-700',
        post.isPinned && 'ring-2 ring-primary-500/20'
      )}
    >
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start gap-3">
          <Link to={`/profile/${post.authorId}`}>
            <Avatar
              src={post.author?.avatar}
              name={post.author?.displayName || 'User'}
              size="md"
              className="flex-shrink-0"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/profile/${post.authorId}`}
                className="font-semibold text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400"
              >
                {post.author?.displayName || 'User'}
              </Link>
              {post.author?.title && (
                <span className="text-sm text-surface-500">
                  {post.author.title}
                </span>
              )}
              {post.isPinned && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                  <Pin className="w-3 h-3" />
                  Pinned
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-surface-500 mt-0.5">
              <Link
                to={`/wall/post/${post.id}`}
                className="hover:text-primary-600 flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                {formatRelativeTime(post.createdAt)}
              </Link>
              {post.isEdited && <span>(edited)</span>}
              <span className="flex items-center gap-1" title={post.visibility}>
                <VisibilityIcon className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-elevation-3 border border-surface-200 dark:border-surface-700 py-1"
                >
                  {isOwner && (
                    <>
                      <button
                        onClick={() => setShowMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit post
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete post
                      </button>
                      <div className="my-1 border-t border-surface-200 dark:border-surface-700" />
                    </>
                  )}
                  <Link
                    to={`/wall/post/${post.id}`}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                    onClick={() => setShowMenu(false)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View post
                  </Link>
                  {!isOwner && (
                    <button
                      onClick={() => setShowMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-surface-800 dark:text-surface-200 whitespace-pre-wrap break-words">
          {post.content}
        </p>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-3 grid gap-2 grid-cols-2">
            {post.attachments.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt=""
                className="rounded-lg w-full h-48 object-cover"
              />
            ))}
          </div>
        )}

        {/* Shared Post Preview */}
        {post.sharedPost && (
          <div className="mt-3 p-3 bg-surface-50 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2 mb-2">
              <Avatar
                src={post.sharedPost.author?.avatar}
                name={post.sharedPost.author?.displayName || 'User'}
                size="sm"
              />
              <div>
                <p className="font-medium text-sm text-surface-900 dark:text-surface-100">
                  {post.sharedPost.author?.displayName}
                </p>
                <p className="text-xs text-surface-500">
                  {formatRelativeTime(post.sharedPost.createdAt)}
                </p>
              </div>
            </div>
            <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-3">
              {post.sharedPost.content}
            </p>
          </div>
        )}

        {/* Shared Document Preview */}
        {post.sharedDocument && (
          <Link
            to={`/library/document/${post.sharedDocument.id}`}
            className="mt-3 flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-500 transition-colors"
          >
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <ExternalLink className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                {post.sharedDocument.title}
              </p>
              <p className="text-xs text-surface-500">Shared document</p>
            </div>
          </Link>
        )}
      </div>

      {/* Engagement Stats */}
      {(post.likesCount > 0 ||
        post.commentsCount > 0 ||
        post.sharesCount > 0 ||
        topReactions.length > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-surface-500 border-t border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-2">
            {topReactions.length > 0 && (
              <span className="flex items-center">
                {topReactions.map(([emoji]) => (
                  <span key={emoji} className="text-sm">
                    {emoji}
                  </span>
                ))}
              </span>
            )}
            {post.likesCount > 0 && (
              <span>
                {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {post.commentsCount > 0 && (
              <button onClick={handleShowComments} className="hover:underline">
                {post.commentsCount}{' '}
                {post.commentsCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
            {post.sharesCount > 0 && (
              <span>
                {post.sharesCount} {post.sharesCount === 1 ? 'share' : 'shares'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-surface-100 dark:border-surface-700">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            post.isLiked
              ? 'text-error-600 dark:text-error-400'
              : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
          )}
        >
          <Heart
            className={cn('w-5 h-5', post.isLiked && 'fill-current')}
          />
          <span className="hidden sm:inline">Like</span>
        </button>

        <button
          onClick={handleShowComments}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Comment</span>
        </button>

        <button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <button
          onClick={handleBookmark}
          disabled={isBookmarking}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            post.isBookmarked
              ? 'text-accent-600 dark:text-accent-400'
              : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
          )}
        >
          <Bookmark
            className={cn('w-5 h-5', post.isBookmarked && 'fill-current')}
          />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>

      {/* Comments Section */}
      {showCommentsSection && (
        <div className="px-4 pb-4 border-t border-surface-100 dark:border-surface-700">
          <div className="pt-4 space-y-4">
            {postComments.map((comment) => (
              <WallComment
                key={comment.id}
                comment={comment}
                postId={post.id}
              />
            ))}

            <CommentComposer postId={post.id} />
          </div>
        </div>
      )}
    </motion.article>
  );
}
