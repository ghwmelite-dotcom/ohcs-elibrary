/**
 * Course Announcements Page
 * View and manage course announcements
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  ArrowLeft,
  Plus,
  Pin,
  Clock,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

// API configuration
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return localStorage.getItem('auth_token');
  }
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }
  return response.json();
};

interface Announcement {
  id: string;
  courseId: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  title: string;
  content: string;
  isPinned: number;
  isPublished: number;
  createdAt: string;
  updatedAt: string;
}

// Animated background component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white to-amber-50/30 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800" />
      <motion.div
        className="absolute top-20 -left-32 w-96 h-96 bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 -right-32 w-96 h-96 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// Announcement card component
function AnnouncementCard({
  announcement,
  isInstructor,
  onEdit,
  onDelete,
  onTogglePin,
  onTogglePublish,
}: {
  announcement: Announcement;
  isInstructor: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onTogglePublish: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl border overflow-hidden transition-all duration-200',
        announcement.isPinned
          ? 'border-amber-300 dark:border-amber-600 shadow-amber-100 dark:shadow-amber-900/20'
          : 'border-surface-200 dark:border-surface-700',
        !announcement.isPublished && 'opacity-70'
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              announcement.isPinned
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-primary-100 dark:bg-primary-900/30'
            )}>
              {announcement.isPinned ? (
                <Pin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Megaphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  {announcement.title}
                </h3>
                {announcement.isPinned && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                    Pinned
                  </span>
                )}
                {!announcement.isPublished && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 rounded">
                    Draft
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-surface-500 dark:text-surface-400">
                {announcement.authorName && (
                  <span className="flex items-center gap-1.5">
                    {announcement.authorAvatar ? (
                      <img
                        src={announcement.authorAvatar}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-primary-600">
                          {announcement.authorName.charAt(0)}
                        </span>
                      </div>
                    )}
                    {announcement.authorName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(announcement.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {isInstructor && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onTogglePin}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  announcement.isPinned
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500'
                )}
                title={announcement.isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={onTogglePublish}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  announcement.isPublished
                    ? 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500'
                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                )}
                title={announcement.isPublished ? 'Unpublish' : 'Publish'}
              >
                {announcement.isPublished ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onEdit}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-500 hover:text-red-600 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-4">
          <div
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none',
              !isExpanded && 'line-clamp-3'
            )}
          >
            <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>
          {announcement.content.length > 300 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Read more
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Create/Edit announcement modal
function AnnouncementModal({
  isOpen,
  onClose,
  onSubmit,
  announcement,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; isPinned: boolean }) => void;
  announcement?: Announcement | null;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState(announcement?.title || '');
  const [content, setContent] = useState(announcement?.content || '');
  const [isPinned, setIsPinned] = useState(!!announcement?.isPinned);

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setIsPinned(!!announcement.isPinned);
    } else {
      setTitle('');
      setContent('');
      setIsPinned(false);
    }
  }, [announcement]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            {announcement ? 'Edit Announcement' : 'New Announcement'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              className="w-full px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={6}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                'w-10 h-6 rounded-full transition-colors relative',
                isPinned ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
              )}
              onClick={() => setIsPinned(!isPinned)}
            >
              <div
                className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  isPinned ? 'translate-x-5' : 'translate-x-1'
                )}
              />
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              Pin this announcement
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-surface-200 dark:border-surface-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ title, content, isPinned })}
            disabled={!title.trim() || !content.trim() || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {announcement ? 'Update' : 'Create'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CourseAnnouncements() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInstructor = user?.role && ['admin', 'super_admin', 'director', 'instructor', 'librarian'].includes(user.role);

  const fetchData = useCallback(async () => {
    if (!courseId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch course info
      const courseData = await authFetch(`${API_BASE}/lms/courses/${courseId}`);
      setCourse(courseData);

      // Fetch announcements (different endpoint for instructors)
      const endpoint = isInstructor
        ? `${API_BASE}/lms/instructor/courses/${courseId}/announcements`
        : `${API_BASE}/lms/courses/${courseId}/announcements`;

      const announcementsData = await authFetch(endpoint);
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : announcementsData.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, isInstructor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: { title: string; content: string; isPinned: boolean }) => {
    if (!courseId) return;

    setIsSubmitting(true);
    try {
      if (editingAnnouncement) {
        await authFetch(`${API_BASE}/lms/announcements/${editingAnnouncement.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        await authFetch(`${API_BASE}/lms/courses/${courseId}/announcements`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (announcement: Announcement) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await authFetch(`${API_BASE}/lms/announcements/${announcement.id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      await authFetch(`${API_BASE}/lms/announcements/${announcement.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPinned: announcement.isPinned ? 0 : 1 }),
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTogglePublish = async (announcement: Announcement) => {
    try {
      await authFetch(`${API_BASE}/lms/announcements/${announcement.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: announcement.isPublished ? 0 : 1 }),
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-surface-600 dark:text-surface-400">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <AnimatedBackground />

      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-2 hover:bg-white/80 dark:hover:bg-surface-800/80 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mb-1">
              <GraduationCap className="w-4 h-4" />
              <Link to={`/courses/${courseId}`} className="hover:text-primary-600">
                {course?.title || 'Course'}
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              Announcements
            </h1>
          </div>

          {isInstructor && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-lg shadow-primary-500/20 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Announcement</span>
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </motion.div>
        )}

        {/* Announcements list */}
        <div className="space-y-4">
          <AnimatePresence>
            {announcements.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  No announcements yet
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  {isInstructor
                    ? 'Create your first announcement to keep students informed.'
                    : 'Check back later for updates from your instructor.'}
                </p>
                {isInstructor && (
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Announcement
                  </button>
                )}
              </motion.div>
            ) : (
              announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isInstructor={!!isInstructor}
                  onEdit={() => handleEdit(announcement)}
                  onDelete={() => handleDelete(announcement)}
                  onTogglePin={() => handleTogglePin(announcement)}
                  onTogglePublish={() => handleTogglePublish(announcement)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <AnnouncementModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
            announcement={editingAnnouncement}
            isLoading={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
