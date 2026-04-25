import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, Reply, Trash2, Send, Loader2, ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.ohcselibrary.xyz';

interface CommentData {
  id: string;
  documentId: string;
  userId: string;
  parentId: string | null;
  content: string;
  likesCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorAvatar: string | null;
  userLiked: boolean;
  replies: CommentData[];
}

interface DocumentCommentsProps {
  documentId: string;
}

export function DocumentComments({ documentId }: DocumentCommentsProps) {
  const { token, user, isAuthenticated } = useAuthStore();

  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  const fetchComments = useCallback(async (pageNum: number, append = false) => {
    if (!append) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/documents/${documentId}/comments?page=${pageNum}&limit=20`,
        { headers: headers() }
      );
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();

      if (append) {
        setComments((prev) => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [documentId, headers]);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting || !token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/documents/${documentId}/comments`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      const created = await res.json();
      setComments((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || isSubmitting || !token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/documents/${documentId}/comments`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ content: replyContent.trim(), parentId }),
      });
      if (!res.ok) throw new Error('Failed to post reply');
      const created = await res.json();
      // Add the reply to the parent comment's replies array
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: [...(c.replies || []), created] } : c
        )
      );
      setReplyingTo(null);
      setReplyContent('');
    } catch (err) {
      console.error('Error posting reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string, parentId?: string | null) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/documents/${documentId}/comments/${commentId}`,
        { method: 'DELETE', headers: headers() }
      );
      if (!res.ok) throw new Error('Failed to delete comment');

      if (parentId) {
        // Remove from parent's replies
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== commentId) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setTotal((prev) => prev - 1);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleLike = async (commentId: string, parentId?: string | null) => {
    if (!token) return;

    // Optimistic update
    const updateLike = (comment: CommentData): CommentData => {
      if (comment.id === commentId) {
        return {
          ...comment,
          userLiked: !comment.userLiked,
          likesCount: comment.userLiked ? comment.likesCount - 1 : comment.likesCount + 1,
        };
      }
      return comment;
    };

    if (parentId) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: c.replies.map(updateLike) }
            : c
        )
      );
    } else {
      setComments((prev) => prev.map(updateLike));
    }

    try {
      await fetch(
        `${API_BASE}/api/v1/documents/${documentId}/comments/${commentId}/like`,
        { method: 'POST', headers: headers() }
      );
    } catch (err) {
      // Revert on error
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: c.replies.map(updateLike) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.map(updateLike));
      }
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchComments(page + 1, true);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-8">
        <div className="flex items-center justify-center gap-3 text-surface-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-surface-500" />
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">
          Comments {total > 0 && <span className="text-surface-400 font-normal">({total})</span>}
        </h3>
      </div>

      {/* Comment Input */}
      {isAuthenticated ? (
        <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl p-4">
          <div className="flex gap-3">
            <Avatar size="md" src={user?.avatar} name={user?.displayName} />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className={cn(
                  'w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                  'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  'resize-none min-h-[80px]'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handleSubmitComment();
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-surface-400">Press Ctrl + Enter to submit</p>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  isLoading={isSubmitting}
                  disabled={!newComment.trim()}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl p-6 text-center">
          <LogIn className="w-8 h-8 text-surface-400 mx-auto mb-2" />
          <p className="text-surface-600 dark:text-surface-400 text-sm">
            Sign in to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              replyingTo={replyingTo}
              replyContent={replyContent}
              isSubmitting={isSubmitting}
              onSetReplyingTo={(id) => {
                setReplyingTo(id);
                setReplyContent('');
              }}
              onSetReplyContent={setReplyContent}
              onSubmitReply={handleSubmitReply}
              onCancelReply={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
              onDelete={handleDelete}
              onLike={handleLike}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {comments.length === 0 && (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-surface-500 dark:text-surface-400">
            Be the first to comment
          </p>
        </div>
      )}

      {/* Load More */}
      {page < totalPages && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            onClick={handleLoadMore}
            isLoading={isLoadingMore}
          >
            Load more comments
          </Button>
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: CommentData;
  currentUserId?: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  replyingTo: string | null;
  replyContent: string;
  isSubmitting: boolean;
  onSetReplyingTo: (id: string) => void;
  onSetReplyContent: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
  onDelete: (commentId: string, parentId?: string | null) => void;
  onLike: (commentId: string, parentId?: string | null) => void;
  isReply?: boolean;
  parentId?: string;
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  isAuthenticated,
  replyingTo,
  replyContent,
  isSubmitting,
  onSetReplyingTo,
  onSetReplyContent,
  onSubmitReply,
  onCancelReply,
  onDelete,
  onLike,
  isReply = false,
  parentId,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const isOwner = comment.userId === currentUserId;
  const canDelete = isOwner || isAdmin;
  const effectiveParentId = isReply ? parentId : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(isReply && 'ml-12')}
    >
      <div className="flex gap-3 group">
        <Avatar
          src={comment.authorAvatar || undefined}
          name={comment.authorName}
          size={isReply ? 'sm' : 'md'}
        />
        <div className="flex-1 min-w-0">
          <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl p-4">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-surface-900 dark:text-surface-50 text-sm">
                  {comment.authorName}
                </span>
                <span className="text-xs text-surface-400">
                  {formatRelativeTime(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-surface-400">(edited)</span>
                )}
              </div>
              {canDelete && (
                <button
                  onClick={() => onDelete(comment.id, effectiveParentId)}
                  className="p-1 text-surface-400 hover:text-error-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap text-sm">
              {comment.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2 ml-2">
            {isAuthenticated && (
              <button
                onClick={() => onLike(comment.id, effectiveParentId)}
                className={cn(
                  'flex items-center gap-1 text-xs transition-colors',
                  comment.userLiked
                    ? 'text-red-500'
                    : 'text-surface-400 hover:text-red-500'
                )}
              >
                <Heart
                  className={cn('w-3.5 h-3.5', comment.userLiked && 'fill-current')}
                />
                {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
              </button>
            )}
            {!isAuthenticated && comment.likesCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-surface-400">
                <Heart className="w-3.5 h-3.5" />
                {comment.likesCount}
              </span>
            )}
            {!isReply && isAuthenticated && (
              <button
                onClick={() => onSetReplyingTo(comment.id)}
                className="flex items-center gap-1 text-xs text-surface-400 hover:text-primary-500 transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
            {!isReply && comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs text-surface-500 hover:text-primary-500 transition-colors"
              >
                {showReplies ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyingTo === comment.id && !isReply && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 ml-2"
            >
              <div className="flex gap-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => onSetReplyContent(e.target.value)}
                  placeholder={`Reply to ${comment.authorName}...`}
                  className={cn(
                    'flex-1 px-3 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                    'text-surface-900 dark:text-surface-50 placeholder:text-surface-400 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'resize-none min-h-[60px]'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) onSubmitReply(comment.id);
                  }}
                />
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={onCancelReply}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSubmitReply(comment.id)}
                  isLoading={isSubmitting}
                  disabled={!replyContent.trim()}
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Reply
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && !isReply && comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              replyingTo={replyingTo}
              replyContent={replyContent}
              isSubmitting={isSubmitting}
              onSetReplyingTo={onSetReplyingTo}
              onSetReplyContent={onSetReplyContent}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              onDelete={onDelete}
              onLike={onLike}
              isReply
              parentId={comment.id}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
