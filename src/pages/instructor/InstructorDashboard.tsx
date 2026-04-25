/**
 * Instructor Dashboard
 * Central hub for instructors to manage their courses, view analytics, and track student progress
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  Trophy,
  TrendingUp,
  Plus,
  Eye,
  Edit3,
  MoreVertical,
  Clock,
  Star,
  FileText,
  Target,
  Award,
  ChevronRight,
  BarChart3,
  Play,
  CheckCircle,
  AlertCircle,
  Sparkles,
  GraduationCap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  X,
  LayoutTemplate,
  Search,
  Zap,
  Tag,
} from 'lucide-react';
import { useInstructorStore } from '@/stores/instructorStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';
import type { Course, CourseLevel, CourseStatus } from '@/types/lms';

// ============================================================================
// ANIMATED BACKGROUND
// ============================================================================
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          top: '-5%',
          right: '-5%',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          bottom: '10%',
          left: '-5%',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================
interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ElementType;
  color: 'violet' | 'emerald' | 'amber' | 'blue';
  delay?: number;
}

function StatCard({ title, value, change, icon: Icon, color, delay = 0 }: StatCardProps) {
  const colors = {
    violet: { bg: 'bg-violet-500', light: 'bg-violet-500/10', text: 'text-violet-500' },
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-500/10', text: 'text-emerald-500' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-500/10', text: 'text-amber-500' },
    blue: { bg: 'bg-blue-500', light: 'bg-blue-500/10', text: 'text-blue-500' },
  };

  const c = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative group"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-sm font-medium',
                change >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{Math.abs(change)}% this month</span>
              </div>
            )}
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', c.light)}>
            <Icon className={cn('w-6 h-6', c.text)} />
          </div>
        </div>
        <motion.div
          className={cn('absolute bottom-0 left-0 right-0 h-1', c.bg)}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// COURSE CARD
// ============================================================================
interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onView: (course: Course) => void;
}

function CourseCard({ course, onEdit, onView }: CourseCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { publishCourse, unpublishCourse, deleteCourse } = useInstructorStore();

  const statusColors: Record<CourseStatus, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-surface-100 dark:bg-surface-700', text: 'text-surface-600 dark:text-surface-300', label: 'Draft' },
    pending_review: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Pending' },
    published: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Published' },
    archived: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Archived' },
  };

  const levelColors: Record<CourseLevel, string> = {
    beginner: 'text-emerald-600',
    intermediate: 'text-amber-600',
    advanced: 'text-red-600',
  };

  const status = statusColors[course.status];

  const handlePublish = async () => {
    setShowMenu(false);
    if (course.status === 'published') {
      await unpublishCourse(course.id);
    } else {
      await publishCourse(course.id);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      await deleteCourse(course.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-violet-500 to-purple-600 overflow-hidden">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white/30" />
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onView(course)}
            className="p-3 bg-white/90 rounded-xl text-surface-900 hover:bg-white"
          >
            <Eye className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(course)}
            className="p-3 bg-white/90 rounded-xl text-surface-900 hover:bg-white"
          >
            <Edit3 className="w-5 h-5" />
          </motion.button>
        </div>
        {/* Status badge */}
        <div className={cn('absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium', status.bg, status.text)}>
          {status.label}
        </div>
        {/* Menu button */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-white/90 rounded-lg text-surface-700 hover:bg-white"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-2 z-20"
              >
                <button
                  onClick={() => { setShowMenu(false); onEdit(course); }}
                  className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" /> Edit Course
                </button>
                <Link
                  to={`/instructor/courses/${course.id}/students`}
                  onClick={() => setShowMenu(false)}
                  className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" /> Students
                </Link>
                <Link
                  to={`/instructor/courses/${course.id}/grades`}
                  onClick={() => setShowMenu(false)}
                  className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Gradebook
                </Link>
                <Link
                  to={`/instructor/courses/${course.id}/analytics`}
                  onClick={() => setShowMenu(false)}
                  className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" /> Analytics
                </Link>
                <hr className="my-2 border-surface-200 dark:border-surface-700" />
                <button
                  onClick={handlePublish}
                  className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
                >
                  {course.status === 'published' ? (
                    <><X className="w-4 h-4" /> Unpublish</>
                  ) : (
                    <><Play className="w-4 h-4" /> Publish</>
                  )}
                </button>
                <hr className="my-2 border-surface-200 dark:border-surface-700" />
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 mb-4">
          {course.shortDescription || course.description || 'No description provided'}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400 mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {course.enrollmentCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-4 h-4" />
            {course.lessonCount || 0} lessons
          </span>
          <span className={cn('capitalize', levelColors[course.level])}>
            {course.level}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {course.averageRating > 0 ? (
              <>
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium text-surface-900 dark:text-surface-100">
                  {course.averageRating.toFixed(1)}
                </span>
                <span className="text-surface-500 text-sm">
                  ({course.ratingCount || 0})
                </span>
              </>
            ) : (
              <span className="text-surface-400 text-sm">No ratings yet</span>
            )}
          </div>
          <button
            onClick={() => onEdit(course)}
            className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1"
          >
            Edit <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// CREATE COURSE MODAL
// ============================================================================
interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (courseId: string) => void;
}

function CreateCourseModal({ isOpen, onClose, onCreated }: CreateCourseModalProps) {
  const { createCourse, isSaving } = useInstructorStore();
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    category: 'general',
    level: 'beginner' as CourseLevel,
  });

  const categories = [
    { value: 'general', label: 'General Training' },
    { value: 'leadership', label: 'Leadership & Management' },
    { value: 'technical', label: 'Technical Skills' },
    { value: 'compliance', label: 'Compliance & Ethics' },
    { value: 'communication', label: 'Communication' },
    { value: 'it', label: 'IT & Digital Skills' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const courseId = await createCourse(formData);
    if (courseId) {
      onCreated(courseId);
      setFormData({ title: '', shortDescription: '', category: 'general', level: 'beginner' });
    }
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              Create New Course
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Introduction to Public Administration"
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Short Description
            </label>
            <textarea
              value={formData.shortDescription}
              onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="Brief overview of what students will learn..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
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
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !formData.title.trim()}>
              {isSaving ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// TEMPLATE LIBRARY MODAL
// ============================================================================
interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  level: string;
  estimatedDuration: number;
  moduleCount: number;
  lessonCount: number;
  objectives: string[];
  tags: string[];
  isOfficial: number;
  usageCount: number;
}

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: (courseId: string) => void;
}

const TEMPLATE_CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  compliance: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: 'text-red-500' },
  it: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: 'text-blue-500' },
  leadership: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: 'text-purple-500' },
  communication: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: 'text-emerald-500' },
  general: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: 'text-amber-500' },
};

const API_BASE = import.meta.env.PROD
  ? 'https://api.ohcselibrary.xyz/api/v1'
  : '/api/v1';

function TemplateLibraryModal({ isOpen, onClose, onCourseCreated }: TemplateLibraryModalProps) {
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<CourseTemplate | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    setTemplateError(null);
    try {
      const token = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}')?.state?.token || localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/lms/course-templates`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      setTemplateError(err.message || 'Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    setIsCreating(templateId);
    setTemplateError(null);
    try {
      const token = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}')?.state?.token || localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/lms/course-templates/${templateId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create course' }));
        throw new Error(err.error || 'Failed to create course from template');
      }
      const data = await res.json();
      onCourseCreated(data.courseId);
    } catch (err: any) {
      setTemplateError(err.message || 'Failed to create course from template');
    } finally {
      setIsCreating(null);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const categoryLabels: Record<string, string> = {
    all: 'All Templates',
    compliance: 'Compliance',
    it: 'IT & Digital',
    leadership: 'Leadership',
    communication: 'Communication',
    general: 'General',
  };

  const levelColors: Record<string, string> = {
    beginner: 'text-emerald-600 dark:text-emerald-400',
    intermediate: 'text-amber-600 dark:text-amber-400',
    advanced: 'text-red-600 dark:text-red-400',
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
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                Course Template Library
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Start with a pre-built structure and customise it
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-3 border-b border-surface-200 dark:border-surface-700 flex-shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                )}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {templateError && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{templateError}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingTemplates ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner size="lg" />
              <p className="mt-4 text-surface-500 text-sm">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                <LayoutTemplate className="w-8 h-8 text-surface-400" />
              </div>
              <p className="text-surface-600 dark:text-surface-400 font-medium">No templates found</p>
              <p className="text-surface-400 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : previewTemplate ? (
            /* Template Preview */
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <button
                onClick={() => setPreviewTemplate(null)}
                className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-4"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to templates
              </button>
              <div className="space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                        {previewTemplate.name}
                      </h3>
                      <p className="text-surface-500 dark:text-surface-400 mt-1">
                        {previewTemplate.description}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUseTemplate(previewTemplate.id)}
                      disabled={isCreating === previewTemplate.id}
                      className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-shadow disabled:opacity-50"
                    >
                      {isCreating === previewTemplate.id ? (
                        <><Spinner size="sm" /> Creating...</>
                      ) : (
                        <><Zap className="w-4 h-4" /> Use Template</>
                      )}
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-medium',
                      TEMPLATE_CATEGORY_COLORS[previewTemplate.category]?.bg || 'bg-surface-100 dark:bg-surface-700',
                      TEMPLATE_CATEGORY_COLORS[previewTemplate.category]?.text || 'text-surface-600'
                    )}>
                      {categoryLabels[previewTemplate.category] || previewTemplate.category}
                    </span>
                    <span className={cn('capitalize font-medium', levelColors[previewTemplate.level] || '')}>
                      {previewTemplate.level}
                    </span>
                    <span className="text-surface-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {previewTemplate.estimatedDuration} min
                    </span>
                    <span className="text-surface-500 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> {previewTemplate.moduleCount} modules, {previewTemplate.lessonCount} lessons
                    </span>
                  </div>
                </div>

                {previewTemplate.objectives.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Learning Objectives
                    </h4>
                    <ul className="space-y-1.5">
                      {previewTemplate.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewTemplate.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-surface-400" />
                    {previewTemplate.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-700 text-xs text-surface-500 dark:text-surface-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Template Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template, i) => {
                const catColor = TEMPLATE_CATEGORY_COLORS[template.category] || TEMPLATE_CATEGORY_COLORS.general;
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-5 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {template.name}
                          </h3>
                          {template.isOfficial === 1 && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wide">
                              Official
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400 mb-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded-md font-medium',
                        catColor.bg, catColor.text
                      )}>
                        {categoryLabels[template.category] || template.category}
                      </span>
                      <span className={cn('capitalize font-medium', levelColors[template.level] || '')}>
                        {template.level}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {template.estimatedDuration}m
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-surface-400">
                        {template.moduleCount} modules &middot; {template.lessonCount} lessons
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template.id);
                        }}
                        disabled={isCreating === template.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isCreating === template.id ? (
                          <><Spinner size="sm" /> Creating...</>
                        ) : (
                          <><Zap className="w-3 h-3" /> Use</>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { myCourses, isLoading, error, fetchMyCourses } = useInstructorStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [filter, setFilter] = useState<'all' | CourseStatus>('all');

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const filteredCourses = filter === 'all'
    ? myCourses
    : myCourses.filter(c => c.status === filter);

  const stats = {
    totalCourses: myCourses.length,
    publishedCourses: myCourses.filter(c => c.status === 'published').length,
    totalStudents: myCourses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0),
    totalCompletions: myCourses.reduce((acc, c) => acc + (c.completionCount || 0), 0),
  };

  const handleEditCourse = (course: Course) => {
    navigate(`/instructor/courses/${course.id}/edit`);
  };

  const handleViewCourse = (course: Course) => {
    navigate(`/courses/${course.id}`);
  };

  const handleCourseCreated = (courseId: string) => {
    setShowCreateModal(false);
    navigate(`/instructor/courses/${courseId}/edit`);
  };

  const handleTemplateCreated = (courseId: string) => {
    setShowTemplateLibrary(false);
    navigate(`/instructor/courses/${courseId}/edit`);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 relative">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <GraduationCap className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  Instructor Dashboard
                </h1>
                <p className="text-surface-500 dark:text-surface-400">
                  Welcome back, {user?.firstName || 'Instructor'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTemplateLibrary(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-shadow"
              >
                <LayoutTemplate className="w-5 h-5" />
                From Template
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-shadow"
              >
                <Plus className="w-5 h-5" />
                Create Course
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Courses"
            value={stats.totalCourses}
            icon={BookOpen}
            color="violet"
            delay={0}
          />
          <StatCard
            title="Published"
            value={stats.publishedCourses}
            icon={CheckCircle}
            color="emerald"
            delay={0.1}
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            color="blue"
            delay={0.2}
          />
          <StatCard
            title="Completions"
            value={stats.totalCompletions}
            icon={Trophy}
            color="amber"
            delay={0.3}
          />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-2"
        >
          {[
            { value: 'all', label: 'All Courses' },
            { value: 'draft', label: 'Drafts' },
            { value: 'published', label: 'Published' },
            { value: 'archived', label: 'Archived' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as typeof filter)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                filter === option.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
              )}
            >
              {option.label}
            </button>
          ))}
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" />
            <p className="mt-4 text-surface-500">Loading your courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-violet-500" />
            </div>
            <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
              {filter === 'all' ? 'No courses yet' : `No ${filter} courses`}
            </h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6 max-w-md mx-auto">
              {filter === 'all'
                ? 'Create your first course and start sharing knowledge with civil servants across Ghana.'
                : `You don't have any ${filter} courses at the moment.`}
            </p>
            {filter === 'all' && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Course
              </Button>
            )}
          </motion.div>
        ) : (
          /* Courses Grid */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={handleEditCourse}
                  onView={handleViewCourse}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Quick Tips */}
        {myCourses.length > 0 && myCourses.length < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  Tips for Course Creators
                </h3>
                <ul className="text-sm text-surface-600 dark:text-surface-400 space-y-1">
                  <li>- Add clear learning objectives to help students understand what they'll gain</li>
                  <li>- Break content into digestible modules with 5-10 minute lessons</li>
                  <li>- Include quizzes to reinforce learning and track progress</li>
                  <li>- Use a mix of content types: videos, documents, and text</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Course Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCourseModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreated={handleCourseCreated}
          />
        )}
      </AnimatePresence>

      {/* Template Library Modal */}
      <AnimatePresence>
        {showTemplateLibrary && (
          <TemplateLibraryModal
            isOpen={showTemplateLibrary}
            onClose={() => setShowTemplateLibrary(false)}
            onCourseCreated={handleTemplateCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
