import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Smile,
  Paperclip,
  Mic,
  X,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import { GroupPost as GroupPostType, GroupComment as GroupCommentType } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import { ReactionBar, QuickReactions, type Reaction } from './ReactionBar';
import { EmojiPicker, QUICK_REACTIONS } from '@/components/chat/EmojiPicker';

interface GroupPostProps {
  post: GroupPostType;
  comments?: GroupCommentType[];
  isOwnPost?: boolean;
  isPinned?: boolean;
  onLike?: () => void;
  onReact?: (emoji: string) => void;
  onComment?: (content: string, attachments?: any[]) => void;
  onCommentReact?: (commentId: string, emoji: string) => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
}

export function GroupPost({
  post,
  comments = [],
  isOwnPost = false,
  isPinned = false,
  onLike,
  onReact,
  onComment,
  onCommentReact,
  onShare,
  onEdit,
  onDelete,
  onPin,
}: GroupPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Handle both nested author object and flat properties
  const authorName = (post as any).authorName || post.author?.name || 'Unknown';
  const authorAvatar = (post as any).authorAvatar || post.author?.avatar;
  const authorRole = (post as any).authorRole || post.author?.role;

  // Get reactions
  const reactions: Reaction[] = (post.reactions || []).map((r: any) => ({
    emoji: r.emoji,
    count: r.count,
    users: r.users || [],
    hasReacted: r.hasReacted || false,
  }));

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike?.();
  };

  const handleReaction = (emoji: string) => {
    onReact?.(emoji);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onComment?.(commentText);
    setCommentText('');
  };

  const handleEmojiSelect = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    commentInputRef.current?.focus();
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
            src={authorAvatar}
            name={authorName}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-surface-900 dark:text-surface-50">
                  {authorName}
                </span>
                {authorRole && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                    {authorRole}
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
            <div className="mt-4">
              <AttachmentDisplay attachments={post.attachments} />
            </div>
          )}
        </div>

        {/* Post Stats & Reactions */}
        <div className="mt-4 space-y-3">
          {/* Emoji Reactions */}
          {(reactions.length > 0 || onReact) && (
            <ReactionBar
              reactions={reactions}
              onReact={handleReaction}
            />
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-surface-500">
            {likeCount > 0 && (
              <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
            )}
            {post.commentCount > 0 && (
              <button
                onClick={() => setShowComments(true)}
                className="hover:text-primary-600 dark:hover:text-primary-400"
              >
                {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
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
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 space-y-4"
            >
              {/* Comment Input */}
              <div className="flex gap-3">
                <Avatar size="sm" />
                <div className="flex-1 relative">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative flex items-center bg-surface-100 dark:bg-surface-700 rounded-full">
                      <input
                        ref={commentInputRef}
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                        className={cn(
                          'flex-1 px-4 py-2 bg-transparent rounded-full',
                          'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                          'focus:outline-none'
                        )}
                      />
                      <div className="flex items-center pr-2">
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded-full hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim()}
                      className="p-2 text-primary-600 dark:text-primary-400 disabled:opacity-50 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Emoji Picker */}
                  <EmojiPicker
                    isOpen={showEmojiPicker}
                    onSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                    position="top"
                  />
                </div>
              </div>

              {/* Comments List */}
              {comments && comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onReact={(emoji) => onCommentReact?.(comment.id, emoji)}
                    />
                  ))}
                </div>
              )}

              {/* Inline comments from post.comments */}
              {post.comments && post.comments.length > 0 && comments.length === 0 && (
                <div className="space-y-3">
                  {post.comments.map((comment: any) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onReact={(emoji) => onCommentReact?.(comment.id, emoji)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Comment Item Component
interface CommentItemProps {
  comment: GroupCommentType | any;
  onReact?: (emoji: string) => void;
}

function CommentItem({ comment, onReact }: CommentItemProps) {
  const [showReactions, setShowReactions] = useState(false);

  const authorName = comment.authorName || comment.author?.name || 'Unknown';
  const authorAvatar = comment.authorAvatar || comment.author?.avatar;
  const reactions: Reaction[] = (comment.reactions || []).map((r: any) => ({
    emoji: r.emoji,
    count: r.count,
    users: r.users || [],
    hasReacted: r.hasReacted || false,
  }));

  return (
    <div className="flex gap-3 group">
      <Avatar
        src={authorAvatar}
        name={authorName}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="bg-surface-100 dark:bg-surface-700 rounded-xl px-4 py-2">
          <p className="font-medium text-sm text-surface-900 dark:text-surface-50">
            {authorName}
          </p>
          <p className="text-sm text-surface-700 dark:text-surface-300">
            {comment.content}
          </p>

          {/* Comment Attachments */}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-2">
              <AttachmentDisplay attachments={comment.attachments} compact />
            </div>
          )}
        </div>

        {/* Comment Actions & Reactions */}
        <div className="flex items-center gap-2 mt-1 ml-2">
          <div className="flex items-center gap-3 text-xs text-surface-500">
            <button
              className="hover:text-primary-600"
              onMouseEnter={() => setShowReactions(true)}
            >
              Like
            </button>
            <button className="hover:text-primary-600">Reply</button>
            <span>{formatRelativeTime(comment.createdAt)}</span>
          </div>

          {/* Quick reactions on hover */}
          <div className={cn(
            'transition-opacity',
            showReactions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}>
            <QuickReactions onReact={(emoji) => onReact?.(emoji)} />
          </div>
        </div>

        {/* Existing reactions */}
        {reactions.length > 0 && (
          <div className="mt-1 ml-2">
            <ReactionBar
              reactions={reactions}
              onReact={(emoji) => onReact?.(emoji)}
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Attachment Display Component
interface AttachmentDisplayProps {
  attachments: any[];
  compact?: boolean;
}

function AttachmentDisplay({ attachments, compact = false }: AttachmentDisplayProps) {
  const images = attachments.filter((a) => a.type === 'image');
  const gifs = attachments.filter((a) => a.type === 'gif');
  const audio = attachments.filter((a) => a.type === 'audio');
  const files = attachments.filter((a) => a.type === 'file');

  return (
    <div className={cn('space-y-2', compact && 'space-y-1')}>
      {/* Images Grid */}
      {images.length > 0 && (
        <div className={cn(
          'grid gap-2',
          images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
        )}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className={cn(
                'relative bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden',
                compact ? 'max-h-32' : 'aspect-video'
              )}
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* GIFs */}
      {gifs.map((gif, idx) => (
        <div
          key={idx}
          className={cn(
            'relative bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden',
            compact ? 'max-w-[200px]' : 'max-w-sm'
          )}
        >
          <img
            src={gif.url}
            alt="GIF"
            className="w-full h-auto"
          />
        </div>
      ))}

      {/* Audio / Voice Messages */}
      {audio.map((aud, idx) => (
        <AudioPlayer key={idx} src={aud.url} duration={aud.duration} compact={compact} />
      ))}

      {/* Files */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, idx) => (
            <a
              key={idx}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-700 rounded-lg',
                'hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors'
              )}
            >
              <File className="w-5 h-5 text-surface-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
                  {file.name}
                </p>
                {file.size && (
                  <p className="text-xs text-surface-500">
                    {formatFileSize(file.size)}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// Audio Player Component
interface AudioPlayerProps {
  src: string;
  duration?: number;
  compact?: boolean;
}

function AudioPlayer({ src, duration, compact }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 bg-surface-100 dark:bg-surface-700 rounded-xl',
      compact && 'p-2 max-w-[200px]'
    )}>
      <audio ref={audioRef} src={src} />
      <button
        onClick={togglePlay}
        className={cn(
          'flex-shrink-0 flex items-center justify-center rounded-full bg-primary-500 text-white',
          compact ? 'w-8 h-8' : 'w-10 h-10'
        )}
      >
        {isPlaying ? (
          <Pause className={cn(compact ? 'w-4 h-4' : 'w-5 h-5')} />
        ) : (
          <Play className={cn(compact ? 'w-4 h-4' : 'w-5 h-5', 'ml-0.5')} />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1.5 bg-surface-300 dark:bg-surface-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        {duration && (
          <p className="text-xs text-surface-500 mt-1">
            {formatDuration(duration)}
          </p>
        )}
      </div>
      <Volume2 className={cn('text-surface-400', compact ? 'w-4 h-4' : 'w-5 h-5')} />
    </div>
  );
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
