import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MoreVertical, Edit2, Trash2, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  replies?: Comment[];
}

interface DocumentCommentsProps {
  documentId: string;
  comments: Comment[];
  currentUserId?: string;
  onAddComment?: (content: string, parentId?: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export function DocumentComments({
  documentId,
  comments,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: DocumentCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onAddComment?.(newComment, replyingTo || undefined);
      setNewComment('');
      setReplyingTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    await onEditComment?.(commentId, editContent);
    setEditingId(null);
    setEditContent('');
  };

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4">
        <div className="flex gap-3">
          <Avatar size="md" />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
              className={cn(
                'w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                'resize-none min-h-[100px]'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSubmit();
                }
              }}
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-surface-400">
                Press Ctrl + Enter to submit
              </p>
              <div className="flex items-center gap-2">
                {replyingTo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={!newComment.trim()}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  {replyingTo ? 'Reply' : 'Comment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              editingId={editingId}
              editContent={editContent}
              onStartEdit={(id, content) => {
                setEditingId(id);
                setEditContent(content);
              }}
              onCancelEdit={() => {
                setEditingId(null);
                setEditContent('');
              }}
              onSaveEdit={handleEdit}
              setEditContent={setEditContent}
              onReply={(id) => setReplyingTo(id)}
              onDelete={onDeleteComment}
            />
          ))}
        </AnimatePresence>
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8 text-surface-500 dark:text-surface-400">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  editingId: string | null;
  editContent: string;
  onStartEdit: (id: string, content: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  setEditContent: (content: string) => void;
  onReply: (id: string) => void;
  onDelete?: (id: string) => void;
  isReply?: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  editingId,
  editContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  setEditContent,
  onReply,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const isOwn = comment.userId === currentUserId;
  const isEditing = editingId === comment.id;

  const menuItems = [
    ...(isOwn
      ? [
          {
            label: 'Edit',
            icon: Edit2,
            onClick: () => onStartEdit(comment.id, comment.content),
          },
          {
            label: 'Delete',
            icon: Trash2,
            onClick: () => onDelete?.(comment.id),
            className: 'text-error-600',
          },
        ]
      : [{ label: 'Report', icon: Flag, onClick: () => {} }]),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('group', isReply && 'ml-12')}
    >
      <div className="flex gap-3">
        <Avatar
          src={comment.userAvatar}
          name={comment.userName}
          size={isReply ? 'sm' : 'md'}
        />
        <div className="flex-1">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-medium text-surface-900 dark:text-surface-50">
                  {comment.userName}
                </span>
                <span className="mx-2 text-surface-300 dark:text-surface-600">
                  &bull;
                </span>
                <span className="text-sm text-surface-500 dark:text-surface-400">
                  {formatRelativeTime(comment.createdAt)}
                </span>
                {comment.updatedAt && (
                  <span className="text-xs text-surface-400 ml-2">(edited)</span>
                )}
              </div>
              <Dropdown items={menuItems} align="right">
                <button className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </Dropdown>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-lg',
                    'text-surface-900 dark:text-surface-50',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'resize-none min-h-[80px]'
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => onSaveEdit(comment.id)}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
          </div>

          {!isReply && (
            <div className="flex items-center gap-4 mt-2 ml-4">
              <button
                onClick={() => onReply(comment.id)}
                className="text-sm text-surface-500 hover:text-primary-600 dark:hover:text-primary-400"
              >
                Reply
              </button>
              {comment.replies && comment.replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-sm text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
                >
                  {showReplies ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {comment.replies.length}{' '}
                  {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              editingId={editingId}
              editContent={editContent}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSaveEdit={onSaveEdit}
              setEditContent={setEditContent}
              onReply={onReply}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
