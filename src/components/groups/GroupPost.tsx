import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageSquare,
  Share2,
  MoreVertical,
  Edit2,
  Trash2,
  Flag,
  Pin,
  Image as ImageIcon,
  File,
  Send,
} from 'lucide-react';
import { GroupPost as GroupPostType } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface GroupPostProps {
  post: GroupPostType;
  isOwnPost?: boolean;
  isPinned?: boolean;
  onLike?: () => void;
  onComment?: (content: string) => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
}

export function GroupPost({
  post,
  isOwnPost = false,
  isPinned = false,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onPin,
}: GroupPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike?.();
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onComment?.(commentText);
    setCommentText('');
  };

  const menuItems = [
    ...(isOwnPost
      ? [
          { label: 'Edit', icon: Edit2, onClick: onEdit },
          { label: 'Delete', icon: Trash2, onClick: onDelete, className: 'text-error-600' },
        ]
      : [{ label: 'Report', icon: Flag, onClick: () => {} }]),
    { label: isPinned ? 'Unpin' : 'Pin', icon: Pin, onClick: onPin },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1',
        isPinned && 'ring-2 ring-primary-500/30'
      )}
    >
      {/* Pinned Badge */}
      {isPinned && (
        <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 border-b border-primary-100 dark:border-primary-800 flex items-center gap-2 text-primary-700 dark:text-primary-300">
          <Pin className="w-4 h-4" />
          <span className="text-sm font-medium">Pinned Post</span>
        </div>
      )}

      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-start gap-3">
          <Avatar
            src={post.author.avatar}
            name={post.author.name}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-surface-900 dark:text-surface-50">
                  {post.author.name}
                </span>
                {post.author.role && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                    {post.author.role}
                  </span>
                )}
              </div>
              <Dropdown items={menuItems} align="right">
                <button className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </Dropdown>
            </div>
            <p className="text-sm text-surface-500">
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Post Content */}
        <div className="mt-4">
          <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {post.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="relative aspect-video bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden"
                >
                  {attachment.type === 'image' ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <File className="w-8 h-8 text-surface-400 mb-2" />
                      <p className="text-sm text-surface-600 dark:text-surface-400 truncate max-w-full">
                        {attachment.name}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-surface-500">
          {likeCount > 0 && (
            <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
          )}
          {post.commentCount > 0 && (
            <span>
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 flex items-center gap-2">
          <button
            onClick={handleLike}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors',
              isLiked
                ? 'text-accent-600 bg-accent-50 dark:bg-accent-900/20'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
            )}
          >
            <Heart className={cn('w-5 h-5', isLiked && 'fill-current')} />
            <span className="font-medium">Like</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Comment</span>
          </button>
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 space-y-4">
            {/* Comment Input */}
            <div className="flex gap-3">
              <Avatar size="sm" />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                  className={cn(
                    'flex-1 px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-full',
                    'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500'
                  )}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                  className="p-2 text-primary-600 dark:text-primary-400 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comments List */}
            {post.comments && post.comments.length > 0 && (
              <div className="space-y-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar
                      src={comment.author.avatar}
                      name={comment.author.name}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="bg-surface-100 dark:bg-surface-700 rounded-xl px-4 py-2">
                        <p className="font-medium text-sm text-surface-900 dark:text-surface-50">
                          {comment.author.name}
                        </p>
                        <p className="text-sm text-surface-700 dark:text-surface-300">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-surface-500">
                        <button className="hover:text-primary-600">Like</button>
                        <button className="hover:text-primary-600">Reply</button>
                        <span>{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
