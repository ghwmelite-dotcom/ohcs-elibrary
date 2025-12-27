import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smile,
  Image as ImageIcon,
  FileText,
  Mic,
  X,
  Send,
  Loader2,
  Film,
  Plus,
} from 'lucide-react';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { GifPicker } from '@/components/chat/GifPicker';
import { VoiceRecorder, VoiceMessagePlayer } from '@/components/chat/VoiceRecorder';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';

interface Attachment {
  id: string;
  type: 'image' | 'file' | 'gif' | 'audio';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  file?: File;
  preview?: string;
  duration?: number;
}

interface PostComposerProps {
  groupId: string;
  onSubmit: (content: string, attachments: Attachment[]) => Promise<void>;
  placeholder?: string;
  isCompact?: boolean;
  autoFocus?: boolean;
}

export function PostComposer({
  groupId,
  onSubmit,
  placeholder = 'Share something with the group...',
  isCompact = false,
  autoFocus = false,
}: PostComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTools, setShowTools] = useState(!isCompact);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if ((!content.trim() && attachments.length === 0) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), attachments);
      setContent('');
      setAttachments([]);
      setShowTools(!isCompact);
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

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleGifSelect = (gif: { url: string; preview: string; title: string }) => {
    const newAttachment: Attachment = {
      id: `gif-${Date.now()}`,
      type: 'gif',
      url: gif.url,
      name: gif.title,
      preview: gif.preview,
    };
    setAttachments((prev) => [...prev, newAttachment]);
    setShowGifPicker(false);
  };

  const handleVoiceRecord = (audioBlob: Blob, duration: number) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const newAttachment: Attachment = {
      id: `voice-${Date.now()}`,
      type: 'audio',
      url: audioUrl,
      name: 'Voice message',
      duration,
      file: new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' }),
    };
    setAttachments((prev) => [...prev, newAttachment]);
    setShowVoiceRecorder(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const preview = isImage ? URL.createObjectURL(file) : undefined;

      const newAttachment: Attachment = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: isImage ? 'image' : 'file',
        url: preview || '',
        name: file.name,
        size: file.size,
        mimeType: file.type,
        file,
        preview,
      };
      setAttachments((prev) => [...prev, newAttachment]);
    });

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const preview = isImage ? URL.createObjectURL(file) : undefined;

      const newAttachment: Attachment = {
        id: `drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: isImage ? 'image' : 'file',
        url: preview || '',
        name: file.name,
        size: file.size,
        mimeType: file.type,
        file,
        preview,
      };
      setAttachments((prev) => [...prev, newAttachment]);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1',
        isCompact ? 'p-3' : 'p-4',
        isDragging && 'ring-2 ring-primary-500 ring-offset-2'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex gap-3">
        {!isCompact && (
          <Avatar
            src={user?.avatar}
            name={user?.displayName || user?.name}
            size="md"
          />
        )}

        <div className="flex-1 space-y-3">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => isCompact && setShowTools(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={cn(
              'w-full bg-surface-100 dark:bg-surface-700 rounded-xl',
              'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'resize-none transition-all',
              isCompact ? 'px-3 py-2 min-h-[40px] text-sm' : 'px-4 py-3 min-h-[100px]'
            )}
            style={{
              height: isCompact ? 'auto' : undefined,
            }}
          />

          {/* Attachments Preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {/* Image Grid */}
                {attachments.filter((a) => a.type === 'image' || a.type === 'gif').length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {attachments
                      .filter((a) => a.type === 'image' || a.type === 'gif')
                      .map((attachment) => (
                        <div
                          key={attachment.id}
                          className="relative aspect-video bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden group"
                        >
                          <img
                            src={attachment.preview || attachment.url}
                            alt={attachment.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {attachment.type === 'gif' && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
                              GIF
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {/* Files */}
                {attachments.filter((a) => a.type === 'file').length > 0 && (
                  <div className="space-y-1">
                    {attachments
                      .filter((a) => a.type === 'file')
                      .map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-700 rounded-lg group"
                        >
                          <FileText className="w-5 h-5 text-surface-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
                              {attachment.name}
                            </p>
                            {attachment.size && (
                              <p className="text-xs text-surface-500">
                                {formatFileSize(attachment.size)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="p-1 text-surface-400 hover:text-error-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Voice Messages */}
                {attachments.filter((a) => a.type === 'audio').length > 0 && (
                  <div className="space-y-1">
                    {attachments
                      .filter((a) => a.type === 'audio')
                      .map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-700 rounded-lg group"
                        >
                          <VoiceMessagePlayer
                            audioUrl={attachment.url}
                            duration={attachment.duration || 0}
                            isOwn={true}
                          />
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="p-1 text-surface-400 hover:text-error-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tools & Actions */}
          <AnimatePresence>
            {showTools && (
              <motion.div
                initial={isCompact ? { opacity: 0, height: 0 } : false}
                animate={{ opacity: 1, height: 'auto' }}
                exit={isCompact ? { opacity: 0, height: 0 } : undefined}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-1">
                  {/* Emoji */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowGifPicker(false);
                      }}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        showEmojiPicker
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                          : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-600'
                      )}
                      title="Add emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <EmojiPicker
                      isOpen={showEmojiPicker}
                      onSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  </div>

                  {/* GIF */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowGifPicker(!showGifPicker);
                        setShowEmojiPicker(false);
                      }}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        showGifPicker
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                          : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-600'
                      )}
                      title="Add GIF"
                    >
                      <Film className="w-5 h-5" />
                    </button>
                    <GifPicker
                      isOpen={showGifPicker}
                      onSelect={handleGifSelect}
                      onClose={() => setShowGifPicker(false)}
                    />
                  </div>

                  {/* Image */}
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-600 rounded-lg transition-colors"
                    title="Add image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e, 'image')}
                    className="hidden"
                  />

                  {/* File */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-600 rounded-lg transition-colors"
                    title="Add file"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e, 'file')}
                    className="hidden"
                  />

                  {/* Voice */}
                  <div className="relative">
                    <button
                      onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        showVoiceRecorder
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                          : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-600'
                      )}
                      title="Record voice"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                      {showVoiceRecorder && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute bottom-full left-0 mb-2 z-50 bg-white dark:bg-surface-800 rounded-xl shadow-elevation-3 p-4"
                        >
                          <VoiceRecorder
                            isRecording={isRecording}
                            onStartRecording={() => setIsRecording(true)}
                            onSend={(audioBlob, duration) => {
                              handleVoiceRecord(audioBlob, duration);
                              setIsRecording(false);
                            }}
                            onCancel={() => {
                              setShowVoiceRecorder(false);
                              setIsRecording(false);
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={(!content.trim() && attachments.length === 0) || isSubmitting}
                  size={isCompact ? 'sm' : 'md'}
                  rightIcon={
                    isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )
                  }
                >
                  {isCompact ? '' : 'Post'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact mode: Show plus button when tools are hidden */}
          {isCompact && !showTools && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowTools(true)}
                className="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              >
                <Plus className="w-5 h-5" />
              </button>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() && attachments.length === 0}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary-500/10 border-2 border-dashed border-primary-500 rounded-xl flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-primary-500 mx-auto mb-2" />
              <p className="text-primary-600 dark:text-primary-400 font-medium">
                Drop files here
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
