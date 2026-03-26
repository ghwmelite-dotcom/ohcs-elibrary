import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  FileText,
  Smile,
  Send,
  X,
  Loader2,
  AtSign,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useWallStore } from '@/stores/wallStore';
import { Avatar } from '@/components/shared/Avatar';
import { VisibilityPicker } from './VisibilityPicker';
import { PostVisibility, AudienceList } from '@/types';
import { cn } from '@/utils/cn';

interface PostComposerProps {
  className?: string;
  placeholder?: string;
  onPostCreated?: () => void;
  audienceLists?: AudienceList[];
}

export function PostComposer({
  className,
  placeholder = "What's on your mind?",
  onPostCreated,
  audienceLists = [],
}: PostComposerProps) {
  const { user } = useAuthStore();
  const { createPost } = useWallStore();

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [customListId, setCustomListId] = useState<string | undefined>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVisibilityChange = (v: PostVisibility, listId?: string) => {
    setVisibility(v);
    setCustomListId(listId);
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const post = await createPost(content.trim(), {
        visibility,
        customListId,
        attachments,
      });

      if (post) {
        setContent('');
        setAttachments([]);
        setIsExpanded(false);
        setVisibility('public');
        setCustomListId(undefined);
        onPostCreated?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 10MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          setAttachments((prev) => [...prev, dataUrl]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input so the same file can be selected again
    e.target.value = '';
  }, []);

  return (
    <motion.div
      layout
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1',
        'border border-surface-200 dark:border-surface-700',
        className
      )}
    >
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar
            src={user?.avatar}
            name={user?.displayName || 'User'}
            size="md"
            className="flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={isExpanded ? 3 : 1}
              className={cn(
                'w-full bg-surface-50 dark:bg-surface-900 rounded-xl px-4 py-3',
                'border border-surface-200 dark:border-surface-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                'placeholder-surface-400 text-surface-900 dark:text-surface-100',
                'resize-none transition-all'
              )}
            />

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-3"
                >
                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-20 rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-700"
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() =>
                              setAttachments(attachments.filter((_, i) => i !== idx))
                            }
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        title="Add image"
                      >
                        <Image className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        title="Share document"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        title="Mention someone"
                      >
                        <AtSign className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                        title="Add emoji"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <VisibilityPicker
                        value={visibility}
                        onChange={handleVisibilityChange}
                        audienceLists={audienceLists}
                      />

                      <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || isSubmitting}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                          content.trim() && !isSubmitting
                            ? 'bg-primary-600 hover:bg-primary-700 text-white'
                            : 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
                        )}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Post</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-surface-400">
                    Press Ctrl+Enter to post
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
