/**
 * Course Learn Page
 * Learning interface with lesson content
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle,
  Circle,
  Play,
  FileText,
  Video,
  Target,
  MessageSquare,
  Clock,
  BookOpen,
  Award,
  Lock,
  Maximize2,
  Minimize2,
  Focus,
  Sparkles,
  Eye,
  Zap,
  List,
  ChevronDown,
  GraduationCap,
  Timer,
  Type,
  StickyNote,
  Save,
  Trash2,
  Settings2,
  Minus,
  Plus,
  AlignLeft,
  AlignCenter,
  Trophy,
  Star,
  PartyPopper,
} from 'lucide-react';
import { useLMSStore } from '@/stores/lmsStore';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';
import type { LessonContentType } from '@/types/lms';

const lessonIcons: Record<LessonContentType, typeof Play> = {
  text: FileText,
  document: FileText,
  video: Video,
  embed: Video,
  quiz: Target,
  assignment: FileText,
  discussion: MessageSquare,
};

// Reading settings interface
interface ReadingSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  lineSpacing: 'compact' | 'normal' | 'relaxed';
  contentWidth: 'narrow' | 'medium' | 'wide';
}

const fontSizeClasses = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
  xlarge: 'text-xl',
};

const lineSpacingClasses = {
  compact: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
};

const contentWidthClasses = {
  narrow: 'max-w-2xl',
  medium: 'max-w-3xl lg:max-w-4xl',
  wide: 'max-w-5xl lg:max-w-6xl',
};

// Format seconds to mm:ss or hh:mm:ss
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function CourseLearn() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusModulesOpen, setFocusModulesOpen] = useState(false);

  // New feature states
  const [readingProgress, setReadingProgress] = useState(0);
  const [focusStartTime, setFocusStartTime] = useState<number | null>(null);
  const [focusElapsedTime, setFocusElapsedTime] = useState(0);
  const [readingSettingsOpen, setReadingSettingsOpen] = useState(false);
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>({
    fontSize: 'medium',
    lineSpacing: 'normal',
    contentWidth: 'medium',
  });
  const [notesOpen, setNotesOpen] = useState(false);
  const [lessonNotes, setLessonNotes] = useState<Record<string, string>>({});
  const [currentNote, setCurrentNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [showModuleCelebration, setShowModuleCelebration] = useState(false);
  const [celebratingModule, setCelebratingModule] = useState<string | null>(null);

  // Refs
  const contentRef = useRef<HTMLDivElement>(null);

  // Toggle focus mode with keyboard shortcut (F key or Escape)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key === 'f' || e.key === 'F') {
      setFocusMode(prev => !prev);
    } else if (e.key === 'm' || e.key === 'M') {
      // Toggle modules panel in focus mode
      if (focusMode) setFocusModulesOpen(prev => !prev);
    } else if (e.key === 'n' || e.key === 'N') {
      // Toggle notes panel in focus mode
      if (focusMode) setNotesOpen(prev => !prev);
    } else if (e.key === 's' || e.key === 'S') {
      // Toggle reading settings in focus mode
      if (focusMode) setReadingSettingsOpen(prev => !prev);
    } else if (e.key === 'Escape') {
      if (notesOpen) {
        setNotesOpen(false);
      } else if (readingSettingsOpen) {
        setReadingSettingsOpen(false);
      } else if (focusModulesOpen) {
        setFocusModulesOpen(false);
      } else if (focusMode) {
        setFocusMode(false);
      }
    }
  }, [focusMode, focusModulesOpen, notesOpen, readingSettingsOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const {
    currentCourse: course,
    currentLesson: lesson,
    isLoading,
    isSending,
    error,
    fetchCourse,
    fetchLesson,
    completeLesson,
    clearCurrentLesson,
  } = useLMSStore();

  // Fetch course on mount
  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId]);

  // Fetch lesson when lessonId changes or when course loads
  useEffect(() => {
    if (lessonId) {
      fetchLesson(lessonId);
    } else if (course?.modules && course.modules.length > 0) {
      // Navigate to first lesson
      const firstLesson = course.modules[0]?.lessons?.[0];
      if (firstLesson) {
        navigate(`/courses/${courseId}/learn/${firstLesson.id}`, { replace: true });
      }
    }
    return () => clearCurrentLesson();
  }, [lessonId, course?.modules]);

  // Focus mode timer - start/stop when focus mode changes
  useEffect(() => {
    if (focusMode) {
      setFocusStartTime(Date.now());
      setFocusElapsedTime(0);
    } else {
      setFocusStartTime(null);
    }
  }, [focusMode]);

  // Update elapsed time every second while in focus mode
  useEffect(() => {
    if (!focusMode || !focusStartTime) return;

    const interval = setInterval(() => {
      setFocusElapsedTime(Math.floor((Date.now() - focusStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [focusMode, focusStartTime]);

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const progress = scrollHeight > clientHeight
        ? Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100))
        : 100;
      setReadingProgress(progress);
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [focusMode, lesson]);

  // Load notes from localStorage when lesson changes
  useEffect(() => {
    if (!lessonId) return;
    const savedNotes = localStorage.getItem(`lesson-notes-${courseId}`);
    if (savedNotes) {
      const parsed = JSON.parse(savedNotes);
      setLessonNotes(parsed);
      setCurrentNote(parsed[lessonId] || '');
    } else {
      setCurrentNote('');
    }
  }, [lessonId, courseId]);

  // Save note function
  const saveNote = useCallback(() => {
    if (!lessonId || !courseId) return;
    const updatedNotes = { ...lessonNotes, [lessonId]: currentNote };
    setLessonNotes(updatedNotes);
    localStorage.setItem(`lesson-notes-${courseId}`, JSON.stringify(updatedNotes));
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }, [lessonId, courseId, currentNote, lessonNotes]);

  // Delete note function
  const deleteNote = useCallback(() => {
    if (!lessonId || !courseId) return;
    const updatedNotes = { ...lessonNotes };
    delete updatedNotes[lessonId];
    setLessonNotes(updatedNotes);
    setCurrentNote('');
    localStorage.setItem(`lesson-notes-${courseId}`, JSON.stringify(updatedNotes));
  }, [lessonId, courseId, lessonNotes]);

  // Check for module completion
  const checkModuleCompletion = useCallback((completedLessonId: string) => {
    if (!course?.modules) return;

    for (const module of course.modules) {
      const lessonInModule = module.lessons?.find(l => l.id === completedLessonId);
      if (lessonInModule) {
        // Check if all lessons in this module are now complete
        const allComplete = module.lessons?.every(l =>
          l.id === completedLessonId || l.progress?.status === 'completed'
        );
        if (allComplete) {
          setCelebratingModule(module.title);
          setShowModuleCelebration(true);
          setTimeout(() => {
            setShowModuleCelebration(false);
            setCelebratingModule(null);
          }, 4000);
        }
        break;
      }
    }
  }, [course?.modules]);

  const handleCompleteLesson = async () => {
    if (!lessonId) return;

    const result = await completeLesson(lessonId);
    if (result) {
      setCompletionData(result);

      // Check for module completion
      checkModuleCompletion(lessonId);

      if (result.certificate) {
        setShowCompletionModal(true);
      } else if (lesson?.nextLesson) {
        // Auto-navigate to next lesson after a brief delay
        setTimeout(() => {
          navigate(`/courses/${courseId}/learn/${lesson.nextLesson!.id}`);
        }, 1000);
      }
    }
  };

  const handleNavigateLesson = (targetLessonId: string) => {
    navigate(`/courses/${courseId}/learn/${targetLessonId}`);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  if (isLoading && !course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
          Course not found
        </h3>
        <Link to="/courses" className="text-primary-600 hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  const isCompleted = lesson?.progress?.status === 'completed';

  return (
    <div className={cn(
      "flex h-[calc(100vh-4rem)] -mx-4 lg:-mx-6 -mt-4 lg:-mt-6",
      // Focus mode: fullscreen overlay with immersive dark background
      focusMode && "fixed inset-0 z-[200] h-screen m-0"
    )}>
      {/* Immersive Focus Mode Background */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black"
          >
            {/* Ambient animated gradient orbs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                x: [0, 50, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.2, 0.4],
                x: [0, -40, 0],
                y: [0, -20, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-1/2 right-1/3 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Mode - Reading Progress Bar */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-0 left-0 right-0 z-[215] h-1"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"
              style={{ width: `${readingProgress}%` }}
              transition={{ duration: 0.1 }}
            />
            {/* Glow effect at the tip */}
            <motion.div
              className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent to-white/50 blur-sm"
              style={{ left: `calc(${readingProgress}% - 2rem)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Mode - Right Side Floating Buttons (Notes & Settings) */}
      <AnimatePresence>
        {focusMode && !notesOpen && !readingSettingsOpen && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-[210] flex flex-col gap-3"
          >
            {/* Notes Button */}
            <motion.button
              onClick={() => setNotesOpen(true)}
              className="group relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Notes (N)"
            >
              <div className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-all">
                <StickyNote className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                  Notes
                </span>
                {lessonNotes[lessonId || ''] && (
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </div>
            </motion.button>

            {/* Settings Button */}
            <motion.button
              onClick={() => setReadingSettingsOpen(true)}
              className="group relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Reading Settings (S)"
            >
              <div className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-all">
                <Type className="w-5 h-5 text-violet-400" />
                <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                  Display
                </span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Mode - Notes Panel (Right Side) */}
      <AnimatePresence>
        {focusMode && notesOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[205] bg-black/30 backdrop-blur-sm"
              onClick={() => setNotesOpen(false)}
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full z-[210] w-[320px] sm:w-[380px] flex flex-col overflow-hidden"
            >
              {/* Glass background */}
              <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-2xl border-l border-white/10" />

              {/* Header */}
              <div className="relative z-10 p-4 sm:p-5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <StickyNote className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white text-sm sm:text-base">
                        Lesson Notes
                      </h2>
                      <p className="text-xs text-white/50">
                        {lesson?.title}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setNotesOpen(false)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Notes Editor */}
              <div className="relative z-10 flex-1 p-4 sm:p-5 flex flex-col">
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Write your notes here... They'll be saved locally for this lesson."
                  className="flex-1 w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm"
                />

                {/* Action buttons */}
                <div className="flex items-center justify-between mt-4">
                  <motion.button
                    onClick={deleteNote}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Clear</span>
                  </motion.button>

                  <motion.button
                    onClick={saveNote}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {noteSaved ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span className="text-sm">Save Note</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Footer hint */}
              <div className="relative z-10 p-4 border-t border-white/10">
                <p className="text-xs text-white/40 text-center">
                  Notes are saved locally on this device
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Focus Mode - Reading Settings Panel (Bottom Sheet on Mobile, Centered on Desktop) */}
      <AnimatePresence>
        {focusMode && readingSettingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[205] bg-black/40 backdrop-blur-sm"
              onClick={() => setReadingSettingsOpen(false)}
            />

            {/* Mobile: Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[210] sm:hidden"
            >
              <div className="bg-slate-900 rounded-t-3xl border-t border-white/10 overflow-hidden">
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-white/30" />
                </div>

                {/* Header */}
                <div className="px-4 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <Settings2 className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-semibold text-white text-sm">Reading Settings</h2>
                  </div>
                  <button
                    onClick={() => setReadingSettingsOpen(false)}
                    className="p-2 rounded-lg bg-white/10 text-white/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Settings Content */}
                <div className="px-4 pb-6 space-y-4">
                  {/* Font Size */}
                  <div>
                    <label className="text-xs text-white/70 mb-2 block">Font Size</label>
                    <div className="flex gap-2">
                      {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setReadingSettings(s => ({ ...s, fontSize: size }))}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                            readingSettings.fontSize === size
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/10 text-white/60'
                          )}
                        >
                          {size === 'small' && 'S'}
                          {size === 'medium' && 'M'}
                          {size === 'large' && 'L'}
                          {size === 'xlarge' && 'XL'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Spacing */}
                  <div>
                    <label className="text-xs text-white/70 mb-2 block">Line Spacing</label>
                    <div className="flex gap-2">
                      {(['compact', 'normal', 'relaxed'] as const).map((spacing) => (
                        <button
                          key={spacing}
                          onClick={() => setReadingSettings(s => ({ ...s, lineSpacing: spacing }))}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize',
                            readingSettings.lineSpacing === spacing
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/10 text-white/60'
                          )}
                        >
                          {spacing}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Width */}
                  <div>
                    <label className="text-xs text-white/70 mb-2 block">Content Width</label>
                    <div className="flex gap-2">
                      {(['narrow', 'medium', 'wide'] as const).map((width) => (
                        <button
                          key={width}
                          onClick={() => setReadingSettings(s => ({ ...s, contentWidth: width }))}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize',
                            readingSettings.contentWidth === width
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/10 text-white/60'
                          )}
                        >
                          {width}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hint */}
                  <p className="text-[10px] text-white/40 text-center pt-2">
                    Changes apply instantly
                  </p>
                </div>

                {/* Safe area for bottom notch */}
                <div className="h-safe-area-inset-bottom bg-slate-900" />
              </div>
            </motion.div>

            {/* Desktop: Centered Modal - Scrollable with sticky header/footer */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="hidden sm:flex fixed inset-0 z-[210] items-center justify-center p-6"
              onClick={() => setReadingSettingsOpen(false)}
            >
              <div
                className="relative w-full max-w-[360px] max-h-[80vh] bg-slate-900/98 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header - Sticky */}
                <div className="sticky top-0 z-10 p-4 border-b border-white/10 bg-slate-900/98 backdrop-blur-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <Settings2 className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-semibold text-white text-sm">Reading Settings</h2>
                  </div>
                  <motion.button
                    onClick={() => setReadingSettingsOpen(false)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Settings Content */}
                <div className="p-4 space-y-4">
                  {/* Font Size */}
                  <div>
                    <label className="text-xs text-white/70 mb-2 block font-medium">Font Size</label>
                    <div className="flex gap-2">
                      {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                        <motion.button
                          key={size}
                          onClick={() => setReadingSettings(s => ({ ...s, fontSize: size }))}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                            readingSettings.fontSize === size
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          )}
                          whileTap={{ scale: 0.95 }}
                        >
                          {size === 'small' && 'S'}
                          {size === 'medium' && 'M'}
                          {size === 'large' && 'L'}
                          {size === 'xlarge' && 'XL'}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Line Spacing */}
                  <div>
                    <label className="text-xs text-white/70 mb-2 block font-medium">Line Spacing</label>
                    <div className="flex gap-2">
                      {(['compact', 'normal', 'relaxed'] as const).map((spacing) => (
                        <motion.button
                          key={spacing}
                          onClick={() => setReadingSettings(s => ({ ...s, lineSpacing: spacing }))}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                            readingSettings.lineSpacing === spacing
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          )}
                          whileTap={{ scale: 0.95 }}
                        >
                          {spacing}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Content Width */}
                  <div>
                    <label className="text-xs text-white/70 mb-2 block font-medium">Content Width</label>
                    <div className="flex gap-2">
                      {(['narrow', 'medium', 'wide'] as const).map((width) => (
                        <motion.button
                          key={width}
                          onClick={() => setReadingSettings(s => ({ ...s, contentWidth: width }))}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                            readingSettings.contentWidth === width
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          )}
                          whileTap={{ scale: 0.95 }}
                        >
                          {width}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer hint - Sticky */}
                <div className="sticky bottom-0 z-10 p-3 border-t border-white/10 bg-slate-900/98 backdrop-blur-xl">
                  <p className="text-[11px] text-white/40 text-center">
                    Changes apply instantly to the lesson content
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Focus Mode - Floating Modules Button */}
      <AnimatePresence>
        {focusMode && !focusModulesOpen && (
          <motion.button
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => setFocusModulesOpen(true)}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-[210] group"
            title="Show Modules (M)"
          >
            <div className="relative">
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-white/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {/* Button */}
              <div className="relative flex flex-col items-center gap-2 px-3 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-all group-hover:scale-105">
                <List className="w-5 h-5 text-white" />
                <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                  Modules
                </span>
                {/* Progress indicator */}
                <div className="w-8 h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${course?.enrollment?.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Focus Mode - Slide-out Modules Panel */}
      <AnimatePresence>
        {focusMode && focusModulesOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[205] bg-black/30 backdrop-blur-sm"
              onClick={() => setFocusModulesOpen(false)}
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full z-[210] w-[320px] sm:w-[360px] flex flex-col overflow-hidden"
            >
              {/* Glass background */}
              <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-2xl border-r border-white/10" />

              {/* Header */}
              <div className="relative z-10 p-4 sm:p-5 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white text-sm sm:text-base line-clamp-1">
                        {course?.title}
                      </h2>
                      <p className="text-xs text-white/50">
                        {course?.modules?.length || 0} modules · {course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} lessons
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setFocusModulesOpen(false)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                    <span>Course Progress</span>
                    <span className="text-emerald-400 font-medium">{course?.enrollment?.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${course?.enrollment?.progress || 0}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modules List */}
              <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {course?.modules?.map((module, moduleIndex) => {
                  const completedLessons = module.lessons?.filter(l => l.progress?.status === 'completed').length || 0;
                  const totalLessons = module.lessons?.length || 0;
                  const moduleProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                  return (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: moduleIndex * 0.1 }}
                      className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                    >
                      {/* Module header */}
                      <div className="px-4 py-3 border-b border-white/5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-white/90">
                            Module {moduleIndex + 1}
                          </h3>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            moduleProgress === 100
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/10 text-white/50"
                          )}>
                            {completedLessons}/{totalLessons}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1 line-clamp-1">{module.title}</p>
                        {/* Mini progress */}
                        <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full transition-all duration-300"
                            style={{ width: `${moduleProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Lessons */}
                      <div className="px-2 py-2 space-y-1">
                        {module.lessons?.map((l) => {
                          const Icon = lessonIcons[l.contentType] || FileText;
                          const isActive = l.id === lessonId;
                          const isLessonCompleted = l.progress?.status === 'completed';

                          return (
                            <motion.button
                              key={l.id}
                              onClick={() => {
                                handleNavigateLesson(l.id);
                                setFocusModulesOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                                isActive
                                  ? 'bg-primary-500/20 border border-primary-500/30'
                                  : 'hover:bg-white/5 border border-transparent'
                              )}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className={cn(
                                'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                                isLessonCompleted
                                  ? 'bg-emerald-500/20'
                                  : isActive
                                    ? 'bg-primary-500/30'
                                    : 'bg-white/10'
                              )}>
                                {isLessonCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Icon className={cn(
                                    'w-3.5 h-3.5',
                                    isActive ? 'text-primary-400' : 'text-white/50'
                                  )} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  'text-sm truncate',
                                  isActive
                                    ? 'font-medium text-white'
                                    : isLessonCompleted
                                      ? 'text-white/70'
                                      : 'text-white/60'
                                )}>
                                  {l.title}
                                </p>
                                <p className="text-xs text-white/40">
                                  {l.estimatedDuration} min
                                </p>
                              </div>
                              {isActive && (
                                <motion.div
                                  layoutId="activeLesson"
                                  className="w-1.5 h-1.5 rounded-full bg-primary-400"
                                />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer with keyboard hint */}
              <div className="relative z-10 p-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                  <kbd className="px-2 py-1 rounded bg-white/10 font-mono">M</kbd>
                  <span>to toggle modules</span>
                  <span className="mx-2">·</span>
                  <kbd className="px-2 py-1 rounded bg-white/10 font-mono">Esc</kbd>
                  <span>to close</span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar - Hidden in focus mode */}
      <AnimatePresence>
        {sidebarOpen && !focusMode && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'fixed lg:relative z-50 lg:z-0',
                'w-80 h-full bg-white dark:bg-surface-800',
                'border-r border-surface-200 dark:border-surface-700',
                'flex flex-col overflow-hidden'
              )}
            >
              {/* Header */}
              <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                <div className="flex items-center justify-between mb-2">
                  <Link
                    to={`/courses/${courseId}`}
                    className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Course Overview
                  </Link>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-1 text-surface-500 hover:text-surface-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="font-semibold text-surface-900 dark:text-surface-100 line-clamp-2">
                  {course.title}
                </h2>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-surface-500">{course.enrollment?.progress || 0}% complete</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${course.enrollment?.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Curriculum */}
              <div className="flex-1 overflow-y-auto p-4">
                {course.modules?.map((module, moduleIndex) => (
                  <div key={module.id} className="mb-4">
                    <h3 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase mb-2">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    <div className="space-y-1">
                      {module.lessons?.map((l) => {
                        const Icon = lessonIcons[l.contentType] || FileText;
                        const isActive = l.id === lessonId;
                        const isLessonCompleted = l.progress?.status === 'completed';

                        return (
                          <button
                            key={l.id}
                            onClick={() => handleNavigateLesson(l.id)}
                            className={cn(
                              'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors',
                              isActive
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                            )}
                          >
                            <div className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                              isLessonCompleted
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : isActive
                                  ? 'bg-primary-100 dark:bg-primary-900/50'
                                  : 'bg-surface-100 dark:bg-surface-700'
                            )}>
                              {isLessonCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Icon className={cn(
                                  'w-3 h-3',
                                  isActive ? 'text-primary-600' : 'text-surface-500'
                                )} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-sm truncate',
                                isActive
                                  ? 'font-medium'
                                  : 'text-surface-700 dark:text-surface-300'
                              )}>
                                {l.title}
                              </p>
                              <p className="text-xs text-surface-500">
                                {l.estimatedDuration} min
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Discussions Link */}
              <div className="p-4 border-t border-surface-200 dark:border-surface-700">
                <Link
                  to={`/courses/${courseId}/discussions`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary-50 to-amber-50 dark:from-primary-900/20 dark:to-amber-900/20 hover:from-primary-100 hover:to-amber-100 dark:hover:from-primary-900/30 dark:hover:to-amber-900/30 transition-colors group"
                >
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors">
                    <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <span className="font-medium text-surface-900 dark:text-surface-100 text-sm">
                      Discussions
                    </span>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      Ask questions & engage
                    </p>
                  </div>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar - Normal Mode */}
        {!focusMode && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-semibold text-surface-900 dark:text-surface-100 truncate max-w-[200px] sm:max-w-[300px]">
                {lesson?.title || 'Loading...'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {lesson?.prevLesson && (
                <button
                  onClick={() => handleNavigateLesson(lesson.prevLesson!.id)}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
                  title="Previous lesson"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {lesson?.nextLesson && (
                <button
                  onClick={() => handleNavigateLesson(lesson.nextLesson!.id)}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
                  title="Next lesson"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* PROMINENT FOCUS MODE BUTTON */}
              <motion.button
                onClick={() => setFocusMode(true)}
                className="relative ml-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Enter Focus Mode (Press F)"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
                {/* Pulsing ring for attention */}
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-white/30"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {/* Button content */}
                <div className="relative flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </motion.div>
                  <span className="text-sm sm:text-base font-semibold text-white whitespace-nowrap">
                    Focus Mode
                  </span>
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300 hidden sm:block" />
                </div>
                {/* Glow */}
                <div className="absolute inset-0 rounded-xl shadow-lg shadow-purple-500/40 group-hover:shadow-xl group-hover:shadow-purple-500/50 transition-shadow" />
              </motion.button>
            </div>
          </div>
        )}

        {/* Immersive Focus Mode Header */}
        {focusMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 mt-1"
          >
            {/* Left: Exit button + Timer */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setFocusMode(false)}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white/90 hover:text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Exit Focus Mode (Esc)"
              >
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm font-medium hidden sm:inline">Exit Focus</span>
              </motion.button>

              {/* Focus Timer */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
              >
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-mono text-amber-300">{formatTime(focusElapsedTime)}</span>
                {focusElapsedTime >= 1800 && ( // 30+ minutes bonus indicator
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 ml-1"
                  >
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">Bonus!</span>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Center: Lesson title with progress */}
            <div className="flex-1 flex flex-col items-center max-w-2xl mx-4">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-base sm:text-lg lg:text-xl font-semibold text-white text-center truncate max-w-full"
              >
                {lesson?.title || 'Loading...'}
              </motion.h1>
              {/* Progress bar */}
              <div className="w-full max-w-md mt-2 hidden sm:block">
                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                  <span>Progress</span>
                  <span>{course?.enrollment?.progress || 0}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${course?.enrollment?.progress || 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Navigation */}
            <div className="flex items-center gap-2">
              {lesson?.prevLesson && (
                <motion.button
                  onClick={() => handleNavigateLesson(lesson.prevLesson!.id)}
                  className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Previous lesson"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
              )}
              {lesson?.nextLesson && (
                <motion.button
                  onClick={() => handleNavigateLesson(lesson.nextLesson!.id)}
                  className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Next lesson"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Lesson Content */}
        <div
          ref={contentRef}
          className={cn(
            "flex-1 overflow-y-auto",
            focusMode && "relative z-10"
          )}
        >
          {isLoading && !lesson ? (
            <div className="flex items-center justify-center h-full">
              <Spinner size="lg" />
            </div>
          ) : lesson ? (
            <motion.div
              initial={focusMode ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "mx-auto p-4 sm:p-6 pb-32",
                // Normal mode
                !focusMode && "max-w-4xl",
                // Focus mode: apply content width from settings
                focusMode && contentWidthClasses[readingSettings.contentWidth]
              )}
            >
              {/* Focus mode content wrapper with glass card */}
              <div className={cn(
                // Apply reading settings in focus mode
                focusMode && "bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-4 sm:p-6 lg:p-8 border border-white/20",
                focusMode && fontSizeClasses[readingSettings.fontSize],
                focusMode && lineSpacingClasses[readingSettings.lineSpacing]
              )}>
              {/* Lesson Status Badge */}
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg shadow-green-500/30"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Lesson Completed</span>
                </motion.div>
              )}
              {/* Content based on type */}
              {lesson.contentType === 'video' && lesson.videoUrl && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
                  {lesson.videoProvider === 'youtube' ? (
                    <iframe
                      src={lesson.videoUrl.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={lesson.videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  )}
                </div>
              )}

              {lesson.contentType === 'text' && lesson.content && (
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                </div>
              )}

              {lesson.contentType === 'document' && lesson.documentId && (
                <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-6 text-center">
                  <FileText className="w-12 h-12 text-surface-400 mx-auto mb-4" />
                  <p className="text-surface-600 dark:text-surface-400 mb-4">
                    This lesson includes a document to read.
                  </p>
                  <Link
                    to={`/library/${lesson.documentId}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <FileText className="w-4 h-4" />
                    Open Document
                  </Link>
                </div>
              )}

              {lesson.contentType === 'quiz' && lesson.quiz && (
                <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-6 text-center">
                  <Target className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    {lesson.quiz.title}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 mb-4">
                    {lesson.quiz.questionCount} questions · Pass score: {lesson.quiz.passingScore}%
                  </p>
                  <Button>Start Quiz</Button>
                </div>
              )}

              {lesson.contentType === 'assignment' && lesson.assignment && (
                <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-6 text-center">
                  <FileText className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    {lesson.assignment.title}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 mb-4">
                    Submit your assignment to complete this lesson.
                  </p>
                  <Button>View Assignment</Button>
                </div>
              )}

              {/* Completion Success Celebration */}
              {completionData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="mt-8 p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/30"
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.6 }}
                      className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                    >
                      <Award className="w-8 h-8 text-yellow-300" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-xl font-bold text-white">
                        +{completionData.xpAwarded} XP Earned!
                      </p>
                      <p className="text-green-100">
                        Course progress: {completionData.courseProgress}%
                      </p>
                    </div>
                    {lesson?.nextLesson && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleNavigateLesson(lesson.nextLesson!.id)}
                        className="px-5 py-2.5 bg-white text-green-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        Next Lesson
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
              </div> {/* End focus mode content wrapper */}
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full text-surface-500">
              Select a lesson to begin
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button - Mark Complete */}
      <AnimatePresence>
        {lesson && !isCompleted && !completionData && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              "fixed flex flex-col items-center",
              // Responsive positioning: bottom-right on mobile, bottom-center on larger screens
              "bottom-4 right-4 sm:bottom-6 sm:right-auto sm:left-1/2 sm:-translate-x-1/2",
              // In focus mode, stay centered with higher z-index
              focusMode ? "z-[210] right-auto left-1/2 -translate-x-1/2 bottom-8" : "z-[100]"
            )}
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCompleteLesson}
              disabled={isSending}
              className="relative group overflow-hidden rounded-full"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />

              {/* Subtle shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
              />

              {/* Button content - responsive sizing */}
              <div className="relative flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3">
                {isSending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle className="w-5 h-5 text-white" />
                    </motion.div>
                    <span className="text-sm sm:text-base font-semibold text-white whitespace-nowrap">
                      Complete
                    </span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="hidden sm:block"
                    >
                      <ChevronRight className="w-4 h-4 text-white/80" />
                    </motion.div>
                  </>
                )}
              </div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full shadow-lg shadow-green-500/40 group-hover:shadow-xl group-hover:shadow-green-500/50 transition-shadow duration-300" />
            </motion.button>

            {/* XP hint - hidden on mobile, shown on tablet+ */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden sm:block text-center text-xs text-surface-400 dark:text-surface-500 mt-2 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm px-3 py-1 rounded-full"
            >
              <span className="font-medium text-green-500">+{lesson.xpReward || 10} XP</span>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Next Lesson Button - After Completion */}
      <AnimatePresence>
        {lesson && isCompleted && lesson.nextLesson && !completionData && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              "fixed flex flex-col items-center",
              "bottom-4 right-4 sm:bottom-6 sm:right-auto sm:left-1/2 sm:-translate-x-1/2",
              focusMode ? "z-[210] right-auto left-1/2 -translate-x-1/2 bottom-8" : "z-[100]"
            )}
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigateLesson(lesson.nextLesson!.id)}
              className="relative group overflow-hidden rounded-full"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-indigo-500 to-violet-500" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
              />
              <div className="relative flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3">
                <span className="text-sm sm:text-base font-semibold text-white whitespace-nowrap">
                  Next Lesson
                </span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              <div className="absolute inset-0 rounded-full shadow-lg shadow-primary-500/40 group-hover:shadow-xl group-hover:shadow-primary-500/50 transition-shadow duration-300" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && completionData?.certificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCompletionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-surface-800 rounded-2xl p-8 max-w-md text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                Congratulations!
              </h2>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                You've completed the course! Your certificate is ready.
              </p>
              <div className="space-y-3">
                <Link
                  to={`/certificates`}
                  className="block w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  View Certificate
                </Link>
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="block w-full px-6 py-3 text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                >
                  Continue Exploring
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Completion Celebration */}
      <AnimatePresence>
        {showModuleCelebration && celebratingModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 flex items-center justify-center p-4",
              focusMode ? "z-[220]" : "z-[150]"
            )}
          >
            {/* Backdrop with confetti-like particles */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm overflow-hidden">
              {/* Animated particles */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "absolute w-3 h-3 rounded-full",
                    i % 4 === 0 && "bg-yellow-400",
                    i % 4 === 1 && "bg-emerald-400",
                    i % 4 === 2 && "bg-violet-400",
                    i % 4 === 3 && "bg-pink-400"
                  )}
                  initial={{
                    x: `${Math.random() * 100}vw`,
                    y: -20,
                    scale: Math.random() * 0.5 + 0.5,
                    rotate: 0
                  }}
                  animate={{
                    y: '120vh',
                    rotate: Math.random() * 720 - 360,
                    x: `${Math.random() * 100}vw`
                  }}
                  transition={{
                    duration: Math.random() * 2 + 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: 'linear'
                  }}
                />
              ))}
            </div>

            {/* Celebration Card */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-8 max-w-sm text-center shadow-2xl shadow-purple-500/30"
            >
              {/* Glowing ring */}
              <motion.div
                className="absolute inset-0 rounded-3xl border-2 border-white/30"
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Trophy icon */}
              <motion.div
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Trophy className="w-10 h-10 text-white" />
                </motion.div>
              </motion.div>

              {/* Stars */}
              <div className="absolute top-4 left-4">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                </motion.div>
              </div>
              <div className="absolute top-6 right-6">
                <motion.div
                  animate={{ rotate: -360, scale: [1, 1.3, 1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                >
                  <Star className="w-5 h-5 text-yellow-200 fill-yellow-200" />
                </motion.div>
              </div>
              <div className="absolute bottom-8 left-8">
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <Sparkles className="w-5 h-5 text-cyan-300" />
                </motion.div>
              </div>

              {/* Text */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Module Complete!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 mb-4"
              >
                You've completed
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm mb-4"
              >
                <p className="text-lg font-semibold text-white line-clamp-2">
                  {celebratingModule}
                </p>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-white/60"
              >
                Keep up the great work!
              </motion.p>

              {/* Progress indicator */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 3.5, ease: 'linear' }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-3xl origin-left"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
