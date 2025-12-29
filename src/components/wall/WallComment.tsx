import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  MoreHorizontal,
  Edit2,
  Trash2,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { WallComment as WallCommentType } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useWallStore } from '@/stores/wallStore';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import { CommentComposer } from './CommentComposer';

interface WallCommentProps {
  comment: WallCommentType;
  postId: string;
  isReply?: boolean;
}

export function WallComment({ comment, postId, isReply = false }: WallCommentProps) {
  const { user } = useAuthStore();
  const { likeComment, unlikeComment, deleteComment } = useWallStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = user?.id === comment.authorId;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (comment.isLiked) {
        await unlikeComment(comment.id, postId);
      } else {
        await likeComment(comment.id, postId);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(comment.id, postId);
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isReply && 'ml-10 mt-3')}
    >
      <Link to={`/profile/${comment.authorId}`} className="flex-shrink-0">
        <Avatar
          src={comment.author?.avatar}
          name={comment.author?.displayName || 'User'}
          size="sm"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="bg-surface-50 dark:bg-surface-900 rounded-2xl px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/profile/${comment.authorId}`}
              className="font-semibold text-sm text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {comment.author?.displayName || 'User'}
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
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
                    className="absolute right-0 top-full mt-1 z-50 w-36 bg-white dark:bg-surface-800 rounded-lg shadow-elevation-3 border border-surface-200 dark:border-surface-700 py-1"
                  >
                    {isOwner && (
                      <>
                        <button
                          onClick={() => setShowMenu(false)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </div>
          </div>

          <p className="text-sm text-surface-800 dark:text-surface-200 mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-1 px-2 text-xs">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              'font-medium transition-colors',
              comment.isLiked
                ? 'text-error-600 dark:text-error-400'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            )}
          >
            {comment.likesCount > 0 ? `${comment.likesCount} Like${comment.likesCount > 1 ? 's' : ''}` : 'Like'}
          </button>

          {!isReply && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="font-medium text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
            >
              Reply
            </button>
          )}

          <span className="text-surface-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(comment.createdAt)}
          </span>

          {comment.isEdited && (
            <span className="text-surface-400">(edited)</span>
          )}
        </div>

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-3">
            <CommentComposer
              postId={postId}
              parentId={comment.id}
              onCommentAdded={() => setShowReplyInput(false)}
              placeholder={`Reply to ${comment.author?.displayName}...`}
              autoFocus
            />
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <WallComment
                key={reply.id}
                comment={reply}
                postId={postId}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
