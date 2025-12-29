import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useWallStore } from '@/stores/wallStore';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

interface CommentComposerProps {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onCommentAdded?: () => void;
  autoFocus?: boolean;
}

export function CommentComposer({
  postId,
  parentId,
  placeholder = 'Write a comment...',
  onCommentAdded,
  autoFocus = false,
}: CommentComposerProps) {
  const { user } = useAuthStore();
  const { addComment, isPostingComment } = useWallStore();

  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPostingComment) return;

    const success = await addComment(postId, content.trim(), parentId);
    if (success) {
      setContent('');
      onCommentAdded?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <Avatar
        src={user?.avatar}
        name={user?.displayName || 'User'}
        size="sm"
        className="flex-shrink-0"
      />

      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full bg-surface-50 dark:bg-surface-900 rounded-full px-4 py-2 pr-10',
            'border border-surface-200 dark:border-surface-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
            'placeholder-surface-400 text-surface-900 dark:text-surface-100',
            'text-sm'
          )}
        />

        <button
          type="submit"
          disabled={!content.trim() || isPostingComment}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors',
            content.trim() && !isPostingComment
              ? 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
              : 'text-surface-300 cursor-not-allowed'
          )}
        >
          {isPostingComment ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
}
