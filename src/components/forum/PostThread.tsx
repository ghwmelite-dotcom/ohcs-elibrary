import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  MoreVertical,
  Flag,
  Edit2,
  Trash2,
  Share2,
  CheckCircle,
  Quote,
  Clock,
  Award,
} from 'lucide-react';
import { ForumPost } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatRelativeTime, formatDate } from '@/utils/formatters';

interface PostThreadProps {
  posts: ForumPost[];
  topicAuthorId: string;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onDislike?: (postId: string) => void;
  onReply?: (postId: string, content: string) => void;
  onEdit?: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  onMarkBestAnswer?: (postId: string) => void;
  onQuote?: (postId: string) => void;
}

export function PostThread({
  posts,
  topicAuthorId,
  currentUserId,
  onLike,
  onDislike,
  onReply,
  onEdit,
  onDelete,
  onMarkBestAnswer,
  onQuote,
}: PostThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = (postId: string) => {
    if (!replyContent.trim()) return;
    onReply?.(postId, replyContent);
    setReplyContent('');
    setReplyingTo(null);
  };

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <PostItem
          key={post.id}
          post={post}
          index={index}
          isTopicAuthor={post.author.id === topicAuthorId}
          isOwnPost={post.author.id === currentUserId}
          canMarkBestAnswer={currentUserId === topicAuthorId}
          replyingTo={replyingTo}
          replyContent={replyContent}
          onReplyContentChange={setReplyContent}
          onStartReply={() => setReplyingTo(post.id)}
          onCancelReply={() => {
            setReplyingTo(null);
            setReplyContent('');
          }}
          onSubmitReply={() => handleSubmitReply(post.id)}
          onLike={() => onLike?.(post.id)}
          onDislike={() => onDislike?.(post.id)}
          onEdit={onEdit}
          onDelete={() => onDelete?.(post.id)}
          onMarkBestAnswer={() => onMarkBestAnswer?.(post.id)}
          onQuote={() => onQuote?.(post.id)}
        />
      ))}
    </div>
  );
}

interface PostItemProps {
  post: ForumPost;
  index: number;
  isTopicAuthor: boolean;
  isOwnPost: boolean;
  canMarkBestAnswer: boolean;
  replyingTo: string | null;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onStartReply: () => void;
  onCancelReply: () => void;
  onSubmitReply: () => void;
  onLike: () => void;
  onDislike: () => void;
  onEdit?: (postId: string, content: string) => void;
  onDelete: () => void;
  onMarkBestAnswer: () => void;
  onQuote: () => void;
}

function PostItem({
  post,
  index,
  isTopicAuthor,
  isOwnPost,
  canMarkBestAnswer,
  replyingTo,
  replyContent,
  onReplyContentChange,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onLike,
  onDislike,
  onEdit,
  onDelete,
  onMarkBestAnswer,
  onQuote,
}: PostItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const isReplying = replyingTo === post.id;

  const menuItems = [
    { label: 'Quote', icon: Quote, onClick: onQuote },
    { label: 'Share', icon: Share2, onClick: () => {} },
    ...(isOwnPost
      ? [
          {
            label: 'Edit',
            icon: Edit2,
            onClick: () => {
              setIsEditing(true);
              setEditContent(post.content);
            },
          },
          { label: 'Delete', icon: Trash2, onClick: onDelete, className: 'text-error-600' },
        ]
      : [{ label: 'Report', icon: Flag, onClick: () => {} }]),
    ...(canMarkBestAnswer && !post.isBestAnswer
      ? [
          {
            label: 'Mark as Best Answer',
            icon: CheckCircle,
            onClick: onMarkBestAnswer,
            className: 'text-success-600',
          },
        ]
      : []),
  ];

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    onEdit?.(post.id, editContent);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      id={`post-${post.id}`}
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden',
        post.isBestAnswer && 'ring-2 ring-success-500'
      )}
    >
      {/* Best Answer Banner */}
      {post.isBestAnswer && (
        <div className="bg-success-500 text-white px-4 py-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Best Answer</span>
        </div>
      )}

      <div className="p-6">
        <div className="flex gap-4">
          {/* Author Sidebar */}
          <div className="hidden sm:block text-center">
            <Avatar
              src={post.author.avatar}
              name={post.author.name}
              size="lg"
              className="mx-auto"
            />
            <p className="mt-2 font-medium text-surface-900 dark:text-surface-50 text-sm">
              {post.author.name}
            </p>
            {post.author.title && (
              <p className="text-xs text-surface-500">{post.author.title}</p>
            )}
            <div className="mt-2 flex flex-col gap-1">
              {isTopicAuthor && (
                <Badge variant="status" className="mx-auto">
                  OP
                </Badge>
              )}
              {post.author.level && (
                <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                  Lvl {post.author.level}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:hidden">
                <Avatar src={post.author.avatar} name={post.author.name} size="sm" />
                <span className="font-medium text-surface-900 dark:text-surface-50">
                  {post.author.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-500">
                <Clock className="w-3.5 h-3.5" />
                <span title={formatDate(post.createdAt)}>
                  {formatRelativeTime(post.createdAt)}
                </span>
                {post.isEdited && <span className="italic">(edited)</span>}
              </div>
              <Dropdown items={menuItems} align="right">
                <button className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </Dropdown>
            </div>

            {/* Quoted Post */}
            {post.quotedPost && (
              <div className="mb-4 p-3 bg-surface-100 dark:bg-surface-700 rounded-lg border-l-4 border-primary-500">
                <p className="text-xs text-surface-500 mb-1">
                  Replying to {post.quotedPost.author}:
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                  {post.quotedPost.content}
                </p>
              </div>
            )}

            {/* Post Content */}
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-lg',
                    'text-surface-900 dark:text-surface-50',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'resize-none min-h-[150px]'
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-surface-200 dark:border-surface-700 pt-4">
              <div className="flex items-center gap-4">
                {/* Vote Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={onLike}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      post.userVote === 'up'
                        ? 'bg-success-100 dark:bg-success-900/30 text-success-600'
                        : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                    )}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <span
                    className={cn(
                      'font-medium min-w-[2rem] text-center',
                      post.likeCount - post.dislikeCount > 0
                        ? 'text-success-600'
                        : post.likeCount - post.dislikeCount < 0
                        ? 'text-error-600'
                        : 'text-surface-500'
                    )}
                  >
                    {post.likeCount - post.dislikeCount}
                  </span>
                  <button
                    onClick={onDislike}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      post.userVote === 'down'
                        ? 'bg-error-100 dark:bg-error-900/30 text-error-600'
                        : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                    )}
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Reply Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStartReply}
                  leftIcon={<MessageSquare className="w-4 h-4" />}
                >
                  Reply
                </Button>
              </div>

              {/* Post Number */}
              <span className="text-xs text-surface-400">#{index + 1}</span>
            </div>

            {/* Reply Form */}
            <AnimatePresence>
              {isReplying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700"
                >
                  <textarea
                    value={replyContent}
                    onChange={(e) => onReplyContentChange(e.target.value)}
                    placeholder={`Reply to ${post.author.name}...`}
                    className={cn(
                      'w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-lg',
                      'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500',
                      'resize-none min-h-[100px]'
                    )}
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="ghost" size="sm" onClick={onCancelReply}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={onSubmitReply}
                      disabled={!replyContent.trim()}
                    >
                      Post Reply
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
