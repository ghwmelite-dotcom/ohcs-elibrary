/**
 * Course Discussions Page
 * Interactive discussion forum for course participants to engage in learning conversations
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Pin,
  Lock,
  Clock,
  Eye,
  MessageCircle,
  ChevronRight,
  Send,
  ThumbsUp,
  Reply,
  MoreVertical,
  CheckCircle,
  Star,
  Award,
  Loader2,
  AlertCircle,
  GraduationCap,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useLMSStore } from '@/stores/lmsStore';
import { useAuthStore } from '@/stores/authStore';
import type { Discussion, DiscussionReply } from '@/types/lms';

// API configuration
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return localStorage.getItem('auth_token');
  }
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }
  return response.json();
};

// Animated background component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white to-amber-50/30 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800" />
      <motion.div
        className="absolute top-20 -left-32 w-96 h-96 bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 -right-32 w-96 h-96 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// Discussion card component
function DiscussionCard({
  discussion,
  onClick,
}: {
  discussion: Discussion;
  onClick: () => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="group bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 transition-all hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          {discussion.author?.avatar ? (
            <img
              src={discussion.author.avatar}
              alt={discussion.author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
              {discussion.author?.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {discussion.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}
            {discussion.isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-xs font-medium rounded">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
            {discussion.isGraded && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium rounded">
                <Award className="w-3 h-3" />
                Graded
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
            {discussion.title}
          </h3>

          <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mt-1">
            {discussion.content.replace(/<[^>]*>/g, '')}
          </p>

          <div className="flex items-center gap-4 mt-3 text-sm text-surface-500 dark:text-surface-400">
            <span className="font-medium text-surface-700 dark:text-surface-300">
              {discussion.author?.name || 'Anonymous'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(discussion.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {discussion.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {discussion.replyCount}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-surface-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
      </div>
    </motion.div>
  );
}

// Reply component
function ReplyCard({
  reply,
  onLike,
  onReply,
  depth = 0,
}: {
  reply: DiscussionReply;
  onLike: (replyId: string) => void;
  onReply: (replyId: string) => void;
  depth?: number;
}) {
  const [showReplies, setShowReplies] = useState(depth < 2);
  const { user } = useAuthStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const maxDepth = 3;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-surface-200 dark:border-surface-700 pl-4' : ''}`}>
      <div className="bg-white dark:bg-surface-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          {/* Author Avatar */}
          {reply.author?.avatar ? (
            <img
              src={reply.author.avatar}
              alt={reply.author.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {reply.author?.name?.charAt(0) || 'U'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-surface-900 dark:text-white">
                {reply.author?.name || 'Anonymous'}
              </span>
              {reply.isInstructorPost && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium rounded">
                  <GraduationCap className="w-3 h-3" />
                  Instructor
                </span>
              )}
              {reply.isAnswer && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                  <CheckCircle className="w-3 h-3" />
                  Answer
                </span>
              )}
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {formatDate(reply.createdAt)}
              </span>
            </div>

            <div
              className="text-surface-700 dark:text-surface-300 text-sm prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: reply.contentHtml || reply.content }}
            />

            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={() => onLike(reply.id)}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  reply.isLikedByUser
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{reply.likes || 0}</span>
              </button>
              {depth < maxDepth && (
                <button
                  onClick={() => onReply(reply.id)}
                  className="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {!showReplies && (
            <button
              onClick={() => setShowReplies(true)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline ml-8"
            >
              Show {reply.replies.length} replies
            </button>
          )}
          {showReplies &&
            reply.replies.map((nestedReply) => (
              <ReplyCard
                key={nestedReply.id}
                reply={nestedReply}
                onLike={onLike}
                onReply={onReply}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// New Discussion Modal
function NewDiscussionModal({
  isOpen,
  onClose,
  courseId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onSuccess: (discussion: Discussion) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE}/lms/courses/${courseId}/discussions`, {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });

      onSuccess(response.discussion);
      setTitle('');
      setContent('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create discussion');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">
            Start a New Discussion
          </h2>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Share your thoughts, ask questions, or start a conversation with fellow learners
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-white placeholder-surface-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or insights..."
              rows={6}
              className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-white placeholder-surface-400 resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post Discussion
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Discussion Detail View
function DiscussionDetail({
  discussion,
  onBack,
  onReplyAdded,
}: {
  discussion: Discussion;
  onBack: () => void;
  onReplyAdded: () => void;
}) {
  const [replies, setReplies] = useState<DiscussionReply[]>(discussion.replies || []);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await authFetch(
        `${API_BASE}/lms/discussions/${discussion.id}/replies`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: replyContent,
            parentId: replyingTo,
          }),
        }
      );

      if (replyingTo) {
        // Add to nested replies
        const addNestedReply = (replies: DiscussionReply[]): DiscussionReply[] => {
          return replies.map((r) => {
            if (r.id === replyingTo) {
              return { ...r, replies: [...(r.replies || []), response.reply] };
            }
            if (r.replies) {
              return { ...r, replies: addNestedReply(r.replies) };
            }
            return r;
          });
        };
        setReplies(addNestedReply(replies));
      } else {
        setReplies([...replies, response.reply]);
      }

      setReplyContent('');
      setReplyingTo(null);
      onReplyAdded();
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (replyId: string) => {
    try {
      await authFetch(`${API_BASE}/lms/discussions/replies/${replyId}/like`, {
        method: 'POST',
      });

      const updateLikes = (replies: DiscussionReply[]): DiscussionReply[] => {
        return replies.map((r) => {
          if (r.id === replyId) {
            return {
              ...r,
              likes: r.isLikedByUser ? r.likes - 1 : r.likes + 1,
              isLikedByUser: !r.isLikedByUser,
            };
          }
          if (r.replies) {
            return { ...r, replies: updateLikes(r.replies) };
          }
          return r;
        });
      };
      setReplies(updateLikes(replies));
    } catch (error) {
      console.error('Failed to like reply:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Discussions
      </button>

      {/* Discussion Header */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
        <div className="flex items-start gap-4">
          {discussion.author?.avatar ? (
            <img
              src={discussion.author.avatar}
              alt={discussion.author.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg font-semibold">
              {discussion.author?.name?.charAt(0) || 'U'}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {discussion.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded">
                  <Pin className="w-3 h-3" />
                  Pinned
                </span>
              )}
              {discussion.isGraded && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium rounded">
                  <Award className="w-3 h-3" />
                  {discussion.pointsValue} pts
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
              {discussion.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400 mb-4">
              <span className="font-medium text-surface-700 dark:text-surface-300">
                {discussion.author?.name || 'Anonymous'}
              </span>
              <span>{formatDate(discussion.createdAt)}</span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {discussion.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {discussion.replyCount} replies
              </span>
            </div>

            <div
              className="prose prose-lg dark:prose-invert max-w-none text-surface-700 dark:text-surface-300"
              dangerouslySetInnerHTML={{ __html: discussion.contentHtml || discussion.content }}
            />
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-500" />
          Replies ({replies.length})
        </h2>

        {replies.length > 0 ? (
          <div className="space-y-4">
            {replies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                onLike={handleLike}
                onReply={(replyId) => setReplyingTo(replyId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <MessageCircle className="w-12 h-12 text-surface-400 mx-auto mb-3" />
            <p className="text-surface-600 dark:text-surface-400">
              No replies yet. Be the first to respond!
            </p>
          </div>
        )}
      </div>

      {/* Reply Form */}
      {!discussion.isLocked && (
        <form onSubmit={handleSubmitReply} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
          {replyingTo && (
            <div className="mb-3 flex items-center justify-between bg-surface-50 dark:bg-surface-900 rounded-lg px-3 py-2">
              <span className="text-sm text-surface-600 dark:text-surface-400">
                Replying to a comment
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              >
                &times;
              </button>
            </div>
          )}

          <div className="flex items-start gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}

            <div className="flex-1">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={3}
                className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-white placeholder-surface-400 resize-none"
              />

              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !replyContent.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {discussion.isLocked && (
        <div className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 flex items-center gap-3 text-surface-600 dark:text-surface-400">
          <Lock className="w-5 h-5" />
          This discussion is locked. No new replies can be added.
        </div>
      )}
    </div>
  );
}

// Main Component
export default function CourseDiscussions() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentCourse, fetchCourse, isLoading } = useLMSStore();

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'graded' | 'unanswered'>('all');

  // Fetch discussions
  const fetchDiscussions = useCallback(async () => {
    if (!courseId) return;

    try {
      const response = await authFetch(`${API_BASE}/lms/courses/${courseId}/discussions`);
      setDiscussions(response.discussions || []);
    } catch (error) {
      console.error('Failed to fetch discussions:', error);
    } finally {
      setIsLoadingDiscussions(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId && (!currentCourse || currentCourse.id !== courseId)) {
      fetchCourse(courseId);
    }
    fetchDiscussions();
  }, [courseId, currentCourse, fetchCourse, fetchDiscussions]);

  // Filter discussions
  const filteredDiscussions = discussions.filter((d) => {
    const matchesSearch = !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'pinned' && d.isPinned) ||
      (filter === 'graded' && d.isGraded) ||
      (filter === 'unanswered' && d.replyCount === 0);

    return matchesSearch && matchesFilter;
  });

  // Stats
  const stats = {
    total: discussions.length,
    graded: discussions.filter((d) => d.isGraded).length,
    replies: discussions.reduce((acc, d) => acc + d.replyCount, 0),
  };

  if (isLoading || isLoadingDiscussions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <AnimatedBackground />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mb-6">
          <Link to="/courses" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Courses
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            to={`/courses/${courseId}`}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {currentCourse?.title || 'Course'}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-surface-900 dark:text-white font-medium">Discussions</span>
        </nav>

        {selectedDiscussion ? (
          <DiscussionDetail
            discussion={selectedDiscussion}
            onBack={() => {
              setSelectedDiscussion(null);
              fetchDiscussions();
            }}
            onReplyAdded={fetchDiscussions}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  Course Discussions
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                  Engage with your peers and instructors
                </p>
              </div>

              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/25 transition-all"
              >
                <Plus className="w-5 h-5" />
                New Discussion
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 mb-1">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
                <span className="text-sm text-surface-500 dark:text-surface-400">Discussions</span>
              </div>
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                  <Award className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.graded}</span>
                </div>
                <span className="text-sm text-surface-500 dark:text-surface-400">Graded</span>
              </div>
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-1">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.replies}</span>
                </div>
                <span className="text-sm text-surface-500 dark:text-surface-400">Replies</span>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search discussions..."
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-white placeholder-surface-400"
                />
              </div>

              <div className="flex gap-2">
                {(['all', 'pinned', 'graded', 'unanswered'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
                    } border border-surface-200 dark:border-surface-700`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Discussions List */}
            <div className="space-y-4">
              {filteredDiscussions.length > 0 ? (
                filteredDiscussions.map((discussion) => (
                  <DiscussionCard
                    key={discussion.id}
                    discussion={discussion}
                    onClick={() => setSelectedDiscussion(discussion)}
                  />
                ))
              ) : (
                <div className="text-center py-16 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700">
                  <MessageSquare className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                    {searchQuery || filter !== 'all' ? 'No matching discussions' : 'No discussions yet'}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 mb-6">
                    {searchQuery || filter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Be the first to start a conversation!'}
                  </p>
                  {!searchQuery && filter === 'all' && (
                    <button
                      onClick={() => setShowNewModal(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Start a Discussion
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* New Discussion Modal */}
      <AnimatePresence>
        {showNewModal && (
          <NewDiscussionModal
            isOpen={showNewModal}
            onClose={() => setShowNewModal(false)}
            courseId={courseId!}
            onSuccess={(discussion) => {
              setDiscussions([discussion, ...discussions]);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
