import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Loader2, Clock } from 'lucide-react';
import { WallPost, PostVisibility } from '@/types';
import { useWallStore } from '@/stores/wallStore';
import { Avatar } from '@/components/shared/Avatar';
import { VisibilityPicker } from './VisibilityPicker';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: WallPost;
}

export function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const { sharePost } = useWallStore();

  const [comment, setComment] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      const success = await sharePost(post.id, comment.trim() || undefined, visibility);
      if (success) {
        setComment('');
        setVisibility('public');
        onClose();
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-3 border border-surface-200 dark:border-surface-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                <h2 className="font-semibold text-lg text-surface-900 dark:text-surface-100">
                  Share Post
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Add comment */}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your thoughts... (optional)"
                  rows={3}
                  className={cn(
                    'w-full bg-surface-50 dark:bg-surface-900 rounded-xl px-4 py-3',
                    'border border-surface-200 dark:border-surface-700',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                    'placeholder-surface-400 text-surface-900 dark:text-surface-100',
                    'resize-none'
                  )}
                />

                {/* Post Preview */}
                <div className="p-3 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar
                      src={post.author?.avatar}
                      name={post.author?.displayName || 'User'}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-sm text-surface-900 dark:text-surface-100">
                        {post.author?.displayName}
                      </p>
                      <p className="text-xs text-surface-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-3">
                    {post.content}
                  </p>
                </div>

                {/* Visibility Picker */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600 dark:text-surface-400">
                    Who can see this?
                  </span>
                  <VisibilityPicker
                    value={visibility}
                    onChange={(v) => setVisibility(v)}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    'bg-primary-600 hover:bg-primary-700 text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isSharing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  Share
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
