import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageSquare,
  Sparkles,
  Send,
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
  Eye,
  Edit3,
  ChevronRight,
  Lightbulb,
  Users,
  BookOpen,
  HelpCircle,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import type { ForumCategory } from '@/types';

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ForumCategory[];
  onSubmit: (data: {
    title: string;
    content: string;
    categoryId: string;
    tags: string[];
  }) => Promise<boolean>;
}

const categoryIcons: Record<string, React.ReactNode> = {
  general: <MessageSquare className="w-5 h-5" />,
  announcements: <Megaphone className="w-5 h-5" />,
  'help-support': <HelpCircle className="w-5 h-5" />,
  ideas: <Lightbulb className="w-5 h-5" />,
  resources: <BookOpen className="w-5 h-5" />,
  introductions: <Users className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  general: 'from-blue-500 to-blue-600',
  announcements: 'from-amber-500 to-orange-500',
  'help-support': 'from-emerald-500 to-teal-500',
  ideas: 'from-violet-500 to-purple-500',
  resources: 'from-cyan-500 to-blue-500',
  introductions: 'from-pink-500 to-rose-500',
};

export function CreateTopicModal({
  isOpen,
  onClose,
  categories,
  onSubmit,
}: CreateTopicModalProps) {
  const [step, setStep] = useState<'category' | 'compose'>('category');
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title input when moving to compose step
  useEffect(() => {
    if (step === 'compose' && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('category');
        setSelectedCategory(null);
        setTitle('');
        setContent('');
        setTags([]);
        setTagInput('');
        setShowPreview(false);
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  const handleCategorySelect = (category: ForumCategory) => {
    setSelectedCategory(category);
    setStep('compose');
  };

  const handleBack = () => {
    setStep('category');
  };

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newText);

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
    const newText = content.substring(0, start) + text + content.substring(start);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || tags.length >= 5) return;
    const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !selectedCategory) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onSubmit({
        title: title.trim(),
        content: content.trim(),
        categoryId: selectedCategory.id,
        tags,
      });

      if (success) {
        onClose();
      } else {
        setError('Failed to create topic. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPreview = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-surface-200 dark:bg-surface-700 rounded">$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-primary-500 pl-4 my-2 italic text-surface-600 dark:text-surface-400">$1</blockquote>')
      .replace(/\n/g, '<br />');
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

  const canSubmit = title.trim().length >= 5 && content.trim().length >= 20 && selectedCategory;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500" />
              <div className="absolute inset-0 bg-[url('/patterns/ghana-pattern.svg')] opacity-10" />
              <div className="relative px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Start a Discussion</h2>
                    <p className="text-sm text-white/80">
                      {step === 'category' ? 'Choose a category' : `Posting in ${selectedCategory?.name}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="relative px-6 pb-4 flex items-center gap-2">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  step === 'category' ? 'bg-white text-primary-600' : 'bg-white/20 text-white'
                )}>
                  <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">1</span>
                  Category
                </div>
                <ChevronRight className="w-4 h-4 text-white/60" />
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  step === 'compose' ? 'bg-white text-primary-600' : 'bg-white/20 text-white'
                )}>
                  <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">2</span>
                  Compose
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === 'category' ? (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6"
                  >
                    <p className="text-surface-600 dark:text-surface-400 mb-4">
                      Select the category that best fits your discussion topic:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categories.map((category) => {
                        const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
                        const icon = categoryIcons[slug] || <MessageSquare className="w-5 h-5" />;
                        const gradient = categoryColors[slug] || 'from-gray-500 to-gray-600';

                        return (
                          <motion.button
                            key={category.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCategorySelect(category)}
                            className="flex items-start gap-4 p-4 rounded-xl border-2 border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-500 bg-surface-50 dark:bg-surface-700/50 text-left transition-all group"
                          >
                            <div className={cn(
                              'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0',
                              gradient
                            )}>
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-surface-900 dark:text-surface-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {category.name}
                              </h3>
                              <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 mt-0.5">
                                {category.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                                <span>{category.topicCount || 0} topics</span>
                                <span>{category.postCount || 0} posts</span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-surface-400 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-3" />
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="compose"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex flex-col"
                  >
                    {/* Back button */}
                    <div className="px-6 py-3 border-b border-surface-200 dark:border-surface-700">
                      <button
                        onClick={handleBack}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Change category
                      </button>
                    </div>

                    {/* Title Input */}
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What's your topic about?"
                        className="w-full text-xl font-semibold text-surface-900 dark:text-surface-50 placeholder:text-surface-400 bg-transparent border-0 focus:outline-none focus:ring-0"
                        maxLength={150}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-surface-400">
                          {title.length < 5 ? `${5 - title.length} more characters needed` : 'Great title!'}
                        </p>
                        <p className="text-xs text-surface-400">{title.length}/150</p>
                      </div>
                    </div>

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
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                          showPreview
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-600'
                        )}
                      >
                        {showPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showPreview ? 'Edit' : 'Preview'}
                      </button>
                    </div>

                    {/* Editor/Preview */}
                    <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
                      {showPreview ? (
                        <div
                          className="p-6 prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: renderPreview(content) || '<p class="text-surface-400">Nothing to preview yet...</p>',
                          }}
                        />
                      ) : (
                        <textarea
                          ref={textareaRef}
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Share your thoughts, ask a question, or start a discussion..."
                          className="w-full h-full min-h-[200px] px-6 py-4 bg-transparent text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none resize-none"
                        />
                      )}
                    </div>

                    {/* Tags */}
                    <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/30">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Hash className="w-4 h-4 text-surface-400" />
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-full"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="p-0.5 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full"
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
                            placeholder={tags.length === 0 ? 'Add tags (optional)...' : 'Add more...'}
                            className="flex-1 min-w-[100px] px-2 py-1 bg-transparent text-sm text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none"
                          />
                        )}
                      </div>
                      <p className="text-xs text-surface-400 mt-2">
                        Press Enter to add tags. Tags help others find your topic.
                      </p>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="mx-6 mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-center gap-2 text-error-700 dark:text-error-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {step === 'compose' && (
              <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-surface-500">
                  {content.length < 20 ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span>{20 - content.length} more characters needed</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success-500" />
                      <span>Ready to post</span>
                    </>
                  )}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  rightIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Creating...' : 'Create Topic'}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
