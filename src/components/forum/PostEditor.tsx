import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  AtSign,
  Hash,
  Send,
  X,
  Eye,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { cn } from '@/utils/cn';

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  showTitle?: boolean;
  title?: string;
  onTitleChange?: (title: string) => void;
  titlePlaceholder?: string;
  showTags?: boolean;
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  categoryId?: string;
  onCategoryChange?: (categoryId: string) => void;
  categories?: { id: string; name: string }[];
}

export function PostEditor({
  value,
  onChange,
  placeholder = 'Write your post...',
  minHeight = '200px',
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Post',
  showTitle = false,
  title = '',
  onTitleChange,
  titlePlaceholder = 'Topic title',
  showTags = false,
  tags = [],
  onTagsChange,
  categoryId,
  onCategoryChange,
  categories = [],
}: PostEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    onChange(newText);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + text + value.substring(start);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, label: 'Bold', action: () => insertFormatting('**') },
    { icon: Italic, label: 'Italic', action: () => insertFormatting('*') },
    { icon: Link2, label: 'Link', action: () => insertFormatting('[', '](url)') },
    { icon: Quote, label: 'Quote', action: () => insertAtCursor('\n> ') },
    { icon: Code, label: 'Code', action: () => insertFormatting('`') },
    { icon: List, label: 'Bullet List', action: () => insertAtCursor('\n- ') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertAtCursor('\n1. ') },
    { icon: AtSign, label: 'Mention', action: () => insertAtCursor('@') },
    { icon: Hash, label: 'Tag', action: () => insertAtCursor('#') },
  ];

  const handleAddTag = () => {
    if (!tagInput.trim() || tags.length >= 5) return;
    const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tags.includes(newTag)) {
      onTagsChange?.([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange?.(tags.filter((t) => t !== tag));
  };

  // Simple markdown to HTML for preview
  const renderPreview = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Title */}
      {showTitle && (
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <Input
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            placeholder={titlePlaceholder}
            className="text-lg font-semibold"
          />
        </div>
      )}

      {/* Category Selection */}
      {categories.length > 0 && (
        <div className="px-4 pt-4">
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange?.(e.target.value)}
            className={cn(
              'w-full sm:w-auto px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-lg',
              'text-surface-900 dark:text-surface-50',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
            )}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/50">
        <div className="flex items-center gap-1 flex-wrap">
          {toolbarButtons.map((button) => (
            <button
              key={button.label}
              onClick={button.action}
              title={button.label}
              className="p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-lg transition-colors"
            >
              <button.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
              showPreview
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-600'
            )}
          >
            {showPreview ? (
              <>
                <Edit3 className="w-4 h-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Preview
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="relative">
        {showPreview ? (
          <div
            className="p-4 prose prose-sm dark:prose-invert max-w-none overflow-auto"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: renderPreview(value) || '<p class="text-surface-400">Nothing to preview</p>' }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ minHeight }}
            className={cn(
              'w-full px-4 py-3 bg-transparent',
              'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
              'focus:outline-none resize-none'
            )}
          />
        )}
      </div>

      {/* Tags */}
      {showTags && (
        <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-sm rounded-full"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="p-0.5 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tags..."
                className="flex-1 min-w-[100px] px-2 py-1 bg-transparent text-sm text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none"
              />
            )}
          </div>
          <p className="text-xs text-surface-400 mt-2">
            Press Enter or comma to add a tag (max 5)
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/50">
        <p className="text-xs text-surface-400">
          Supports Markdown formatting
        </p>
        <Button
          onClick={onSubmit}
          isLoading={isSubmitting}
          disabled={!value.trim() || (showTitle && !title.trim())}
          rightIcon={<Send className="w-4 h-4" />}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

interface NewTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
  onSubmit: (data: {
    title: string;
    content: string;
    categoryId: string;
    tags: string[];
  }) => void;
  isSubmitting?: boolean;
}

export function NewTopicModal({
  isOpen,
  onClose,
  categories,
  onSubmit,
  isSubmitting = false,
}: NewTopicModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !categoryId) return;
    onSubmit({ title, content, categoryId, tags });
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setCategoryId('');
    setTags([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Topic" size="xl">
      <PostEditor
        value={content}
        onChange={setContent}
        placeholder="Write your topic content here..."
        minHeight="250px"
        showTitle
        title={title}
        onTitleChange={setTitle}
        titlePlaceholder="What's your topic about?"
        showTags
        tags={tags}
        onTagsChange={setTags}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        categories={categories}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Create Topic"
      />
    </Modal>
  );
}
