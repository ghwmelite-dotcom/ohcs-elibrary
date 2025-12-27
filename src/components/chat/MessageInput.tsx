import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Image as ImageIcon,
  File,
  Mic,
  Bold,
  Italic,
  Code,
  Link2,
  Gift,
  Sparkles,
  Hash,
  AtSign,
  Plus,
  Camera,
} from 'lucide-react';
import { ChatMessage } from '@/types';
import { cn } from '@/utils/cn';
import { formatFileSize } from '@/utils/formatters';
import { EmojiPicker } from './EmojiPicker';
import { GifPicker } from './GifPicker';
import { VoiceRecorder } from './VoiceRecorder';

interface MessageInputProps {
  onSend: (content: string, attachments?: File[]) => void;
  onSendGif?: (gif: { url: string; preview: string; title: string }) => void;
  onSendVoice?: (audioBlob: Blob, duration: number) => void;
  onTyping?: () => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

// Storage key for recent emojis
const RECENT_EMOJIS_KEY = 'ohcs_recent_emojis';

export function MessageInput({
  onSend,
  onSendGif,
  onSendVoice,
  onTyping,
  replyTo,
  onCancelReply,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
      if (stored) {
        setRecentEmojis(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load recent emojis');
    }
  }, []);

  // Save recent emojis to localStorage
  const updateRecentEmojis = useCallback((emojis: string[]) => {
    setRecentEmojis(emojis);
    try {
      localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(emojis));
    } catch (e) {
      console.warn('Failed to save recent emojis');
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Focus input when reply is set
  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
        setShowGif(false);
        setShowFormatting(false);
        setShowMobileActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Notify typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping?.();
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing notification after 2 seconds
    }, 2000);
  };

  const handleSubmit = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;

    onSend(message.trim(), attachments.length > 0 ? attachments : undefined);
    setMessage('');
    setAttachments([]);
    setShowEmoji(false);
    setShowGif(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    // Formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          wrapSelection('**', '**');
          break;
        case 'i':
          e.preventDefault();
          wrapSelection('*', '*');
          break;
        case 'k':
          e.preventDefault();
          wrapSelection('[', '](url)');
          break;
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 5)); // Max 5 files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.slice(0, start) + emoji + message.slice(end);
    setMessage(newMessage);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const handleGifSelect = (gif: { url: string; preview: string; title: string }) => {
    if (onSendGif) {
      onSendGif(gif);
    } else {
      // Fallback: send GIF URL as message
      onSend(`![${gif.title}](${gif.url})`);
    }
    setShowGif(false);
  };

  const handleVoiceSend = (audioBlob: Blob, duration: number) => {
    if (onSendVoice) {
      onSendVoice(audioBlob, duration);
    }
    setIsRecording(false);
  };

  // Wrap selected text with formatting markers
  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.slice(start, end);
    const newMessage =
      message.slice(0, start) + before + selectedText + after + message.slice(end);
    setMessage(newMessage);

    // Set cursor position
    setTimeout(() => {
      if (selectedText) {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = end + before.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + before.length;
      }
      textarea.focus();
    }, 0);
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const hasContent = message.trim() || attachments.length > 0;

  return (
    <div
      ref={containerRef}
      className="border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
    >
      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3"
          >
            <div className="p-3 bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/20 dark:to-transparent rounded-xl flex items-start gap-3 border-l-4 border-primary-500">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                  <span>↩️</span>
                  Replying to {replyTo.sender?.displayName || 'User'}
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400 truncate mt-0.5">
                  {replyTo.content}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1.5 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-surface-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3"
          >
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => {
                const preview = getFilePreview(file);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      'relative group rounded-xl overflow-hidden',
                      preview ? 'w-20 h-20' : 'flex items-center gap-2 px-3 py-2 bg-surface-100 dark:bg-surface-700'
                    )}
                  >
                    {preview ? (
                      <>
                        <img
                          src={preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => removeAttachment(index)}
                            className="p-1.5 bg-error-500 text-white rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <File className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-surface-900 dark:text-surface-50 truncate max-w-[120px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-surface-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-full transition-colors"
                        >
                          <X className="w-3 h-3 text-surface-500" />
                        </button>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recording Mode */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-3"
          >
            <VoiceRecorder
              isRecording={isRecording}
              onStartRecording={() => setIsRecording(true)}
              onSend={handleVoiceSend}
              onCancel={() => setIsRecording(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Area */}
      {!isRecording && (
        <div className="p-2 sm:p-4">
          {/* Formatting Toolbar */}
          <AnimatePresence>
            {showFormatting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-2 flex items-center gap-1 p-2 bg-surface-100 dark:bg-surface-700 rounded-xl overflow-x-auto"
              >
                <button
                  onClick={() => wrapSelection('**', '**')}
                  className="p-2 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-lg transition-colors flex-shrink-0"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                </button>
                <button
                  onClick={() => wrapSelection('*', '*')}
                  className="p-2 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-lg transition-colors flex-shrink-0"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                </button>
                <button
                  onClick={() => wrapSelection('`', '`')}
                  className="p-2 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-lg transition-colors flex-shrink-0"
                  title="Code"
                >
                  <Code className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                </button>
                <button
                  onClick={() => wrapSelection('[', '](url)')}
                  className="p-2 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-lg transition-colors flex-shrink-0"
                  title="Link (Ctrl+K)"
                >
                  <Link2 className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                </button>
                <div className="w-px h-5 bg-surface-300 dark:bg-surface-600 mx-1 flex-shrink-0" />
                <button
                  onClick={() => wrapSelection('```\n', '\n```')}
                  className="px-2 py-1 text-xs font-mono hover:bg-surface-200 dark:hover:bg-surface-600 rounded-lg transition-colors text-surface-600 dark:text-surface-300 flex-shrink-0"
                  title="Code Block"
                >
                  {'</>'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Actions Menu */}
          <AnimatePresence>
            {showMobileActions && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="mb-2 sm:hidden"
              >
                <div className="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-700 rounded-xl overflow-x-auto">
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowMobileActions(false);
                    }}
                    className="flex flex-col items-center gap-1 p-3 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-xl transition-colors min-w-[60px]"
                  >
                    <Paperclip className="w-5 h-5 text-primary-500" />
                    <span className="text-[10px] text-surface-500">File</span>
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowMobileActions(false);
                    }}
                    className="flex flex-col items-center gap-1 p-3 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-xl transition-colors min-w-[60px]"
                  >
                    <Camera className="w-5 h-5 text-success-500" />
                    <span className="text-[10px] text-surface-500">Photo</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowGif(true);
                      setShowMobileActions(false);
                    }}
                    className="flex flex-col items-center gap-1 p-3 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-xl transition-colors min-w-[60px]"
                  >
                    <Gift className="w-5 h-5 text-secondary-500" />
                    <span className="text-[10px] text-surface-500">GIF</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowFormatting(true);
                      setShowMobileActions(false);
                    }}
                    className="flex flex-col items-center gap-1 p-3 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-xl transition-colors min-w-[60px]"
                  >
                    <Sparkles className="w-5 h-5 text-accent-500" />
                    <span className="text-[10px] text-surface-500">Format</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsRecording(true);
                      setShowMobileActions(false);
                    }}
                    className="flex flex-col items-center gap-1 p-3 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-xl transition-colors min-w-[60px]"
                  >
                    <Mic className="w-5 h-5 text-error-500" />
                    <span className="text-[10px] text-surface-500">Voice</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-1.5 sm:gap-2">
            {/* Mobile: Plus button to expand actions */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileActions(!showMobileActions)}
              disabled={disabled}
              className={cn(
                'p-2.5 rounded-xl transition-all disabled:opacity-50 sm:hidden flex-shrink-0',
                showMobileActions
                  ? 'bg-primary-500 text-white rotate-45'
                  : 'text-surface-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
              )}
              title="More options"
            >
              <Plus className="w-5 h-5" />
            </motion.button>

            {/* Desktop: Action Buttons inline */}
            <div className="hidden sm:flex items-center gap-0.5">
              {/* Attachment Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-2 text-surface-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors disabled:opacity-50"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </motion.button>

              {/* GIF Button */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowGif(!showGif);
                    setShowEmoji(false);
                  }}
                  disabled={disabled}
                  className={cn(
                    'p-2 rounded-xl transition-colors disabled:opacity-50',
                    showGif
                      ? 'text-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                      : 'text-surface-500 hover:text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-900/20'
                  )}
                  title="Send GIF"
                >
                  <Gift className="w-5 h-5" />
                </motion.button>

                <GifPicker
                  isOpen={showGif}
                  onClose={() => setShowGif(false)}
                  onSelect={handleGifSelect}
                />
              </div>

              {/* Formatting Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowFormatting(!showFormatting)}
                disabled={disabled}
                className={cn(
                  'p-2 rounded-xl transition-colors disabled:opacity-50',
                  showFormatting
                    ? 'text-accent-500 bg-accent-50 dark:bg-accent-900/20'
                    : 'text-surface-500 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/20'
                )}
                title="Formatting"
              >
                <Sparkles className="w-5 h-5" />
              </motion.button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />

            {/* Text Input with integrated emoji button */}
            <div className="flex-1 relative min-w-0">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className={cn(
                  'w-full pl-3 sm:pl-4 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-surface-100 dark:bg-surface-700 rounded-2xl',
                  'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-surface-600',
                  'resize-none max-h-[120px] sm:max-h-[150px] transition-all text-sm sm:text-base',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
              {/* Emoji button inside textarea */}
              <div className="absolute right-2 bottom-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowEmoji(!showEmoji);
                    setShowGif(false);
                  }}
                  disabled={disabled}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors disabled:opacity-50',
                    showEmoji
                      ? 'text-primary-500 bg-primary-100 dark:bg-primary-900/30'
                      : 'text-surface-400 hover:text-primary-500 hover:bg-surface-200 dark:hover:bg-surface-600'
                  )}
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </motion.button>

                <EmojiPicker
                  isOpen={showEmoji}
                  onClose={() => setShowEmoji(false)}
                  onSelect={insertEmoji}
                  recentEmojis={recentEmojis}
                  onUpdateRecent={updateRecentEmojis}
                />
              </div>
            </div>

            {/* Voice/Send Button */}
            {hasContent ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSubmit}
                disabled={disabled}
                className="p-2.5 sm:p-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all disabled:opacity-50 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsRecording(true)}
                disabled={disabled}
                className="hidden sm:flex p-2.5 sm:p-3 text-surface-500 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                title="Record voice message"
              >
                <Mic className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* Quick tip - only on desktop */}
          <div className="hidden sm:flex items-center justify-between mt-2 px-1">
            <span className="text-xs text-surface-400">
              Press <kbd className="px-1.5 py-0.5 bg-surface-200 dark:bg-surface-600 rounded text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-surface-200 dark:bg-surface-600 rounded text-[10px]">Shift+Enter</kbd> for new line
            </span>
            <div className="flex items-center gap-1 text-surface-400">
              <button className="p-1 hover:text-primary-500 transition-colors" title="Mention someone">
                <AtSign className="w-4 h-4" />
              </button>
              <button className="p-1 hover:text-primary-500 transition-colors" title="Add hashtag">
                <Hash className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
