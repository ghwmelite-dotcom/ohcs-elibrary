/**
 * Course Builder
 * Comprehensive course editing interface with module/lesson management
 * Integrated with OHCS E-Library document system
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ChevronLeft,
  Save,
  Eye,
  Play,
  Settings,
  Layers,
  Plus,
  GripVertical,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  Target,
  MessageSquare,
  Clock,
  Award,
  X,
  Check,
  AlertCircle,
  BookOpen,
  Image,
  Link as LinkIcon,
  Type,
  Upload,
  Sparkles,
  GraduationCap,
  Users,
  Star,
  BarChart3,
  Info,
  Wrench,
} from 'lucide-react';
import { useInstructorStore } from '@/stores/instructorStore';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';
import type {
  Course,
  Module,
  Lesson,
  LessonContentType,
  CourseLevel,
  VideoProvider,
} from '@/types/lms';

// ============================================================================
// LESSON TYPE CONFIG
// ============================================================================
const lessonTypeConfig: Record<LessonContentType, { icon: typeof FileText; label: string; color: string }> = {
  text: { icon: Type, label: 'Text Lesson', color: 'text-blue-500' },
  document: { icon: FileText, label: 'Document', color: 'text-emerald-500' },
  video: { icon: Video, label: 'Video', color: 'text-red-500' },
  embed: { icon: Video, label: 'Embedded Video', color: 'text-purple-500' },
  quiz: { icon: Target, label: 'Quiz', color: 'text-amber-500' },
  assignment: { icon: FileText, label: 'Assignment', color: 'text-orange-500' },
  discussion: { icon: MessageSquare, label: 'Discussion', color: 'text-cyan-500' },
};

// ============================================================================
// MODULE CARD
// ============================================================================
interface ModuleCardProps {
  module: Module;
  lessons: Lesson[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons: (lessonIds: string[]) => void;
  onConfigureQuiz: (lesson: Lesson) => void;
}

function ModuleCard({
  module,
  lessons,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
  onConfigureQuiz,
}: ModuleCardProps) {
  const [localLessons, setLocalLessons] = useState(lessons);

  useEffect(() => {
    setLocalLessons(lessons);
  }, [lessons]);

  const handleReorder = (newOrder: Lesson[]) => {
    setLocalLessons(newOrder);
    onReorderLessons(newOrder.map(l => l.id));
  };

  return (
    <motion.div
      layout
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
    >
      {/* Module Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
        onClick={onToggle}
      >
        <div className="cursor-grab text-surface-400 hover:text-surface-600">
          <GripVertical className="w-5 h-5" />
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-surface-400" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-surface-900 dark:text-surface-100 truncate">
            {module.title}
          </h3>
          <p className="text-sm text-surface-500">
            {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
          </p>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-600 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lessons List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-surface-200 dark:border-surface-700"
          >
            <Reorder.Group
              axis="y"
              values={localLessons}
              onReorder={handleReorder}
              className="divide-y divide-surface-100 dark:divide-surface-700"
            >
              {localLessons.map(lesson => {
                const config = lessonTypeConfig[lesson.contentType];
                const Icon = config.icon;

                return (
                  <Reorder.Item
                    key={lesson.id}
                    value={lesson}
                    className="flex items-center gap-3 px-4 py-3 bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-700/50 cursor-grab"
                  >
                    <GripVertical className="w-4 h-4 text-surface-300" />
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-surface-700')}>
                      <Icon className={cn('w-4 h-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-surface-400">{config.label} · {lesson.estimatedDuration || 5} min</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {lesson.contentType === 'quiz' && (
                        <button
                          onClick={() => onConfigureQuiz(lesson)}
                          className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 hover:text-amber-600"
                          title="Configure Quiz"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditLesson(lesson)}
                        className="p-1.5 rounded hover:bg-white dark:hover:bg-surface-600 text-surface-400 hover:text-surface-600"
                        title="Edit Lesson"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteLesson(lesson.id)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500"
                        title="Delete Lesson"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            {/* Add Lesson Button */}
            <button
              onClick={onAddLesson}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lesson
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// MODULE EDITOR MODAL
// ============================================================================
interface ModuleEditorProps {
  isOpen: boolean;
  module: Module | null;
  courseId: string;
  onClose: () => void;
  onSave: (data: { title: string; description?: string }) => Promise<void>;
}

function ModuleEditor({ isOpen, module, courseId, onClose, onSave }: ModuleEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    await onSave({ title: title.trim(), description: description.trim() || undefined });
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-surface-800 rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {module ? 'Edit Module' : 'Add Module'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Module Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Introduction to the Topic"
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of what this module covers..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || isSaving}>
              {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
              {module ? 'Save Changes' : 'Add Module'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// LESSON EDITOR MODAL
// ============================================================================
interface LessonEditorProps {
  isOpen: boolean;
  lesson: Lesson | null;
  moduleId: string;
  courseId: string;
  onClose: () => void;
  onSave: (data: Partial<Lesson>) => Promise<void>;
}

function LessonEditor({ isOpen, lesson, moduleId, courseId, onClose, onSave }: LessonEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'text' as LessonContentType,
    content: '',
    videoUrl: '',
    videoProvider: 'youtube' as VideoProvider,
    documentId: '',
    estimatedDuration: 10,
    isRequired: true,
    xpReward: 10,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        description: lesson.description || '',
        contentType: lesson.contentType,
        content: lesson.content || '',
        videoUrl: lesson.videoUrl || '',
        videoProvider: lesson.videoProvider || 'youtube',
        documentId: lesson.documentId || '',
        estimatedDuration: lesson.estimatedDuration || 10,
        isRequired: lesson.isRequired,
        xpReward: lesson.xpReward || 10,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        contentType: 'text',
        content: '',
        videoUrl: '',
        videoProvider: 'youtube',
        documentId: '',
        estimatedDuration: 10,
        isRequired: true,
        xpReward: 10,
      });
    }
  }, [lesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSaving(true);
    await onSave({
      ...formData,
      moduleId,
      courseId,
    });
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-2xl my-8 bg-white dark:bg-surface-800 rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {lesson ? 'Edit Lesson' : 'Add Lesson'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700">
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Lesson Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Understanding Public Policy"
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Content Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(['text', 'video', 'document', 'quiz'] as LessonContentType[]).map(type => {
                const config = lessonTypeConfig[type];
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, contentType: type })}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                      formData.contentType === type
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', config.color)} />
                    <span className="text-xs font-medium">{config.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content based on type */}
          {formData.contentType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Lesson Content
              </label>
              <textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your lesson content here... HTML is supported."
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500 resize-none font-mono text-sm"
              />
              <p className="text-xs text-surface-500 mt-1">Tip: You can use HTML tags for formatting</p>
            </div>
          )}

          {formData.contentType === 'video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Video Provider
                </label>
                <div className="flex gap-2">
                  {(['youtube', 'vimeo', 'direct'] as VideoProvider[]).map(provider => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setFormData({ ...formData, videoProvider: provider })}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors',
                        formData.videoProvider === provider
                          ? 'bg-violet-600 text-white'
                          : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300'
                      )}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder={
                    formData.videoProvider === 'youtube'
                      ? 'https://www.youtube.com/watch?v=...'
                      : 'https://...'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {formData.contentType === 'document' && (
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Document from Library
              </label>
              <div className="p-4 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 text-center">
                <FileText className="w-10 h-10 text-surface-400 mx-auto mb-2" />
                <p className="text-sm text-surface-500 mb-2">
                  Link a document from the OHCS E-Library
                </p>
                <Link
                  to="/library"
                  target="_blank"
                  className="text-sm text-violet-600 hover:underline"
                >
                  Browse Library
                </Link>
                <input
                  type="text"
                  value={formData.documentId}
                  onChange={e => setFormData({ ...formData, documentId: e.target.value })}
                  placeholder="Enter document ID"
                  className="mt-3 w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                />
              </div>
            </div>
          )}

          {formData.contentType === 'quiz' && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">Quiz Lesson</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    {lesson
                      ? 'Click the wrench icon (🔧) on this lesson to configure quiz questions in the Quiz Builder.'
                      : 'After saving this lesson, click the wrench icon (🔧) to configure quiz questions.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Duration & Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.estimatedDuration}
                onChange={e => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 10 })}
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                XP Reward
              </label>
              <input
                type="number"
                min="0"
                value={formData.xpReward}
                onChange={e => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 10 })}
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Required toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                'w-10 h-6 rounded-full transition-colors relative',
                formData.isRequired ? 'bg-violet-600' : 'bg-surface-300 dark:bg-surface-600'
              )}
              onClick={() => setFormData({ ...formData, isRequired: !formData.isRequired })}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                animate={{ left: formData.isRequired ? 20 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
            <span className="text-sm text-surface-700 dark:text-surface-300">
              Required for course completion
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!formData.title.trim() || isSaving}>
              {isSaving ? <Spinner size="sm" className="mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {lesson ? 'Save Changes' : 'Add Lesson'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// COURSE SETTINGS PANEL
// ============================================================================
interface CourseSettingsProps {
  course: Course;
  onUpdate: (data: Partial<Course>) => Promise<void>;
}

function CourseSettings({ course, onUpdate }: CourseSettingsProps) {
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description || '',
    shortDescription: course.shortDescription || '',
    category: course.category,
    level: course.level,
    passingScore: course.passingScore || 70,
    xpReward: course.xpReward || 100,
    objectives: course.objectives || [],
  });
  const [newObjective, setNewObjective] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const categories = [
    { value: 'general', label: 'General Training' },
    { value: 'leadership', label: 'Leadership & Management' },
    { value: 'technical', label: 'Technical Skills' },
    { value: 'compliance', label: 'Compliance & Ethics' },
    { value: 'communication', label: 'Communication' },
    { value: 'it', label: 'IT & Digital Skills' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(formData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData({ ...formData, objectives: [...formData.objectives, newObjective.trim()] });
      setNewObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setFormData({ ...formData, objectives: formData.objectives.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-violet-500" />
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Course Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Short Description
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="Brief tagline for the course"
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Full Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Level
              </label>
              <select
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value as CourseLevel })}
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" />
          Learning Objectives
        </h3>
        <div className="space-y-3">
          {formData.objectives.map((obj, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="flex-1 text-sm text-surface-700 dark:text-surface-300">{obj}</span>
              <button
                onClick={() => removeObjective(index)}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newObjective}
              onChange={e => setNewObjective(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addObjective())}
              placeholder="Add a learning objective..."
              className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
            />
            <Button variant="outline" size="sm" onClick={addObjective} disabled={!newObjective.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Completion Settings */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Completion Settings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Passing Score (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.passingScore}
              onChange={e => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 70 })}
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              XP Reward
            </label>
            <input
              type="number"
              min="0"
              value={formData.xpReward}
              onChange={e => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 100 })}
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Spinner size="sm" className="mr-2" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saveSuccess ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function CourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const {
    currentEditingCourse: course,
    editingModules: modules,
    editingLessons: lessons,
    isLoading,
    isSaving,
    error,
    fetchCourseForEditing,
    updateCourse,
    publishCourse,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    clearEditingState,
    fetchQuizByLessonId,
  } = useInstructorStore();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'settings'>('curriculum');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleEditorOpen, setModuleEditorOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [lessonEditorOpen, setLessonEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');

  useEffect(() => {
    if (courseId) {
      fetchCourseForEditing(courseId);
    }
    return () => clearEditingState();
  }, [courseId]);

  // Auto-expand all modules initially
  useEffect(() => {
    if (modules.length > 0 && expandedModules.size === 0) {
      setExpandedModules(new Set(modules.map(m => m.id)));
    }
  }, [modules]);

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleAddModule = () => {
    setEditingModule(null);
    setModuleEditorOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleEditorOpen(true);
  };

  const handleSaveModule = async (data: { title: string; description?: string }) => {
    if (editingModule) {
      await updateModule(editingModule.id, data);
    } else if (courseId) {
      const newModule = await createModule({ courseId, ...data });
      if (newModule) {
        setExpandedModules(prev => new Set([...prev, newModule.id]));
      }
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('Delete this module and all its lessons?')) {
      await deleteModule(moduleId);
    }
  };

  const handleAddLesson = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    setLessonEditorOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedModuleId(lesson.moduleId);
    setEditingLesson(lesson);
    setLessonEditorOpen(true);
  };

  const handleSaveLesson = async (data: Partial<Lesson>) => {
    if (editingLesson) {
      await updateLesson(editingLesson.id, data);
    } else if (courseId && selectedModuleId) {
      await createLesson({
        moduleId: selectedModuleId,
        courseId,
        title: data.title || '',
        contentType: data.contentType || 'text',
        ...data,
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm('Delete this lesson?')) {
      await deleteLesson(lessonId);
    }
  };

  const handleConfigureQuiz = async (lesson: Lesson) => {
    if (!courseId) return;

    // Fetch the quiz associated with this lesson
    const quiz = await fetchQuizByLessonId(lesson.id);
    if (quiz) {
      navigate(`/instructor/courses/${courseId}/quiz/${quiz.id}`);
    } else {
      // Quiz doesn't exist yet - this shouldn't happen for new lessons
      // but might for lessons created before the auto-create feature
      alert('No quiz found for this lesson. Please delete and recreate the quiz lesson.');
    }
  };

  const handlePublish = async () => {
    if (!courseId) return;
    if (course?.status === 'published') {
      await updateCourse(courseId, { status: 'draft' });
    } else {
      await publishCourse(courseId);
    }
  };

  if (isLoading && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-16 h-16 text-surface-300 mb-4" />
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
          Course not found
        </h2>
        <p className="text-surface-500 mb-4">The course you're looking for doesn't exist or you don't have access.</p>
        <Button onClick={() => navigate('/instructor')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const sortedModules = [...modules].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/instructor')}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-semibold text-surface-900 dark:text-surface-100 truncate max-w-[200px] sm:max-w-[400px]">
                  {course.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-surface-500">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    course.status === 'published'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600'
                  )}>
                    {course.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <span>·</span>
                  <span>{modules.length} modules</span>
                  <span>·</span>
                  <span>{lessons.length} lessons</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={`/courses/${courseId}`}
                target="_blank"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Link>
              <Button
                onClick={handlePublish}
                disabled={isSaving}
                variant={course.status === 'published' ? 'outline' : 'default'}
              >
                {isSaving ? (
                  <Spinner size="sm" className="mr-2" />
                ) : course.status === 'published' ? (
                  <X className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {course.status === 'published' ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 -mb-px">
            {[
              { id: 'curriculum', label: 'Curriculum', icon: Layers },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-1 py-4 border-b-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}

        {activeTab === 'curriculum' ? (
          <div className="space-y-4">
            {/* Modules */}
            {sortedModules.map(module => (
              <ModuleCard
                key={module.id}
                module={module}
                lessons={lessons.filter(l => l.moduleId === module.id).sort((a, b) => a.sortOrder - b.sortOrder)}
                isExpanded={expandedModules.has(module.id)}
                onToggle={() => toggleModule(module.id)}
                onEdit={() => handleEditModule(module)}
                onDelete={() => handleDeleteModule(module.id)}
                onAddLesson={() => handleAddLesson(module.id)}
                onEditLesson={handleEditLesson}
                onDeleteLesson={handleDeleteLesson}
                onReorderLessons={(lessonIds) => reorderLessons(module.id, lessonIds)}
                onConfigureQuiz={handleConfigureQuiz}
              />
            ))}

            {/* Add Module Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddModule}
              className="w-full flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 text-surface-500 hover:border-violet-500 hover:text-violet-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Module</span>
            </motion.button>
          </div>
        ) : (
          <CourseSettings course={course} onUpdate={(data) => updateCourse(courseId!, data)} />
        )}
      </div>

      {/* Module Editor Modal */}
      <AnimatePresence>
        {moduleEditorOpen && courseId && (
          <ModuleEditor
            isOpen={moduleEditorOpen}
            module={editingModule}
            courseId={courseId}
            onClose={() => setModuleEditorOpen(false)}
            onSave={handleSaveModule}
          />
        )}
      </AnimatePresence>

      {/* Lesson Editor Modal */}
      <AnimatePresence>
        {lessonEditorOpen && courseId && selectedModuleId && (
          <LessonEditor
            isOpen={lessonEditorOpen}
            lesson={editingLesson}
            moduleId={selectedModuleId}
            courseId={courseId}
            onClose={() => setLessonEditorOpen(false)}
            onSave={handleSaveLesson}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
