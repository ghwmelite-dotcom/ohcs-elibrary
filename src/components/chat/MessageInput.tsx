import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Image as ImageIcon,
  File,
  AtSign,
  Mic,
  StopCircle,
} from 'lucide-react';
import { ChatMessage } from '@/types';
import { cn } from '@/utils/cn';
import { formatFileSize } from '@/utils/formatters';

interface MessageInputProps {
  onSend: (content: string, attachments?: File[]) => void;
  onTyping?: () => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const EMOJI_LIST = [
  '😊', '😂', '❤️', '👍', '🎉', '🙏', '💪', '🔥',
  '✨', '👏', '🤝', '💯', '🇬🇭', '⭐', '👋', '😎',
];

export function MessageInput({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

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

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  return (
    <div className="border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4">
      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 p-3 bg-surface-100 dark:bg-surface-700 rounded-lg flex items-start gap-3"
          >
            <div className="w-1 h-full bg-primary-500 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
                Replying to {replyTo.sender?.displayName || 'User'}
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400 truncate">
                {replyTo.content}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-surface-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex flex-wrap gap-2"
          >
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-surface-100 dark:bg-surface-700 rounded-lg"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-primary-500" />
                ) : (
                  <File className="w-4 h-4 text-primary-500" />
                )}
                <div className="max-w-[150px]">
                  <p className="text-xs font-medium text-surface-900 dark:text-surface-50 truncate">
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
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2.5 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        />

        {/* Emoji Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            disabled={disabled}
            className="p-2.5 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700"
              >
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full px-4 py-2.5 bg-surface-100 dark:bg-surface-700 rounded-xl',
              'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'resize-none max-h-[150px]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        </div>

        {/* Voice/Send Button */}
        {message.trim() || attachments.length > 0 ? (
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={toggleRecording}
            disabled={disabled}
            className={cn(
              'p-2.5 rounded-lg transition-colors disabled:opacity-50',
              isRecording
                ? 'bg-error-500 text-white'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
            )}
          >
            {isRecording ? (
              <StopCircle className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Typing hint */}
      <p className="text-xs text-surface-400 mt-2 ml-2">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
