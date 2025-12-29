import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, X, Loader2 } from 'lucide-react';
import { useDMStore } from '@/stores/dmStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { EnhancedDirectMessage } from '@/types';
import { cn } from '@/utils/cn';

interface DMInputProps {
  conversationId: string;
  replyTo?: EnhancedDirectMessage | null;
  onCancelReply?: () => void;
  className?: string;
}

export function DMInput({
  conversationId,
  replyTo,
  onCancelReply,
  className,
}: DMInputProps) {
  const { sendMessage, isSending, startTyping, stopTyping } = useDMStore();

  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when replying
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  // Handle typing indicator
  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    startTyping(conversationId);

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    handleTyping();

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSending) return;

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(conversationId);

    const success = await sendMessage(
      conversationId,
      content.trim(),
      attachments.length > 0 ? attachments : undefined,
      replyTo?.id
    );

    if (success) {
      setContent('');
      setAttachments([]);
      onCancelReply?.();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('border-t border-surface-200 dark:border-surface-700', className)}>
      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3"
          >
            <div className="flex items-center justify-between bg-surface-50 dark:bg-surface-900 rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
                  Replying to {replyTo.sender?.displayName}
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400 truncate">
                  {replyTo.content}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700"
              >
                <X className="w-4 h-4 text-surface-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <button
            type="button"
            className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className={cn(
                'w-full px-4 py-2.5 pr-10 rounded-2xl resize-none',
                'bg-surface-50 dark:bg-surface-900',
                'border border-surface-200 dark:border-surface-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                'placeholder-surface-400 text-surface-900 dark:text-surface-100',
                'text-sm max-h-[150px]'
              )}
            />

            {/* Emoji button */}
            <button
              type="button"
              className="absolute right-3 bottom-2.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSending}
            className={cn(
              'p-2.5 rounded-full transition-colors',
              content.trim() && !isSending
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
            )}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachments.map((url, idx) => (
              <div
                key={idx}
                className="relative w-16 h-16 rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-800"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
