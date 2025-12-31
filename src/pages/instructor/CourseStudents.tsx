/**
 * Course Students Management
 * View and manage enrolled students
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Search,
  Download,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Mail,
  UserMinus,
  Eye,
  Filter,
  AlertCircle,
  Calendar,
  TrendingUp,
  GraduationCap,
  Building,
} from 'lucide-react';
import { useInstructorStore } from '@/stores/instructorStore';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';

interface Student {
  enrollment: {
    id: string;
    status: string;
    progress: number;
    lessonsCompleted: number;
    totalLessons: number;
    timeSpent: number;
    enrolledAt: string;
    completedAt?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    department?: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  dropped: { label: 'Dropped', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

export default function CourseStudents() {
  const { courseId } = useParams<{ courseId: string }>();
  const { enrolledStudents, isLoading, error, fetchStudents, currentEditingCourse, fetchCourseForEditing } = useInstructorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'dropped'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'enrolled'>('enrolled');

  useEffect(() => {
    if (courseId) {
      fetchStudents(courseId);
      if (!currentEditingCourse) {
        fetchCourseForEditing(courseId);
      }
    }
  }, [courseId]);

  const filteredStudents = (enrolledStudents as Student[])
    .filter((student) => {
      const matchesSearch = !searchQuery ||
        student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || student.enrollment.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.user.name.localeCompare(b.user.name);
      if (sortBy === 'progress') return b.enrollment.progress - a.enrollment.progress;
      return new Date(b.enrollment.enrolledAt).getTime() - new Date(a.enrollment.enrolledAt).getTime();
    });

  const stats = {
    total: enrolledStudents.length,
    active: enrolledStudents.filter((s: any) => s.enrollment.status === 'active').length,
    completed: enrolledStudents.filter((s: any) => s.enrollment.status === 'completed').length,
    avgProgress: enrolledStudents.length > 0
      ? Math.round(enrolledStudents.reduce((acc: number, s: any) => acc + s.enrollment.progress, 0) / enrolledStudents.length)
      : 0,
  };

  const exportStudents = () => {
    const headers = ['Name', 'Email', 'Department', 'Status', 'Progress', 'Lessons Completed', 'Enrolled Date', 'Completed Date'];
    const rows = filteredStudents.map(student => [
      student.user.name,
      student.user.email,
      student.user.department || '-',
      student.enrollment.status,
      `${student.enrollment.progress}%`,
      `${student.enrollment.lessonsCompleted}/${student.enrollment.totalLessons}`,
      new Date(student.enrollment.enrolledAt).toLocaleDateString(),
      student.enrollment.completedAt ? new Date(student.enrollment.completedAt).toLocaleDateString() : '-',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${courseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (isLoading && !enrolledStudents.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/instructor"
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-semibold text-surface-900 dark:text-surface-100">
                  Student Management
                </h1>
                <p className="text-sm text-surface-500 truncate max-w-[200px] sm:max-w-[400px]">
                  {currentEditingCourse?.title || 'Loading...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/instructor/courses/${courseId}/grades`}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                <GraduationCap className="w-4 h-4" />
                Gradebook
              </Link>
              <Button variant="outline" onClick={exportStudents}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.total}</p>
                <p className="text-sm text-surface-500">Total Enrolled</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.active}</p>
                <p className="text-sm text-surface-500">Active</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.completed}</p>
                <p className="text-sm text-surface-500">Completed</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.avgProgress}%</p>
                <p className="text-sm text-surface-500">Avg Progress</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'completed', 'dropped'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors',
                    statusFilter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
            >
              <option value="enrolled">Sort by: Enrolled Date</option>
              <option value="name">Sort by: Name</option>
              <option value="progress">Sort by: Progress</option>
            </select>
          </div>
        </div>

        {/* Students List */}
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-600 dark:text-surface-400">
              {enrolledStudents.length === 0 ? 'No students enrolled yet' : 'No students match your filters'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredStudents.map((student, index) => (
              <StudentCard
                key={student.enrollment.id}
                student={student}
                index={index}
                onView={() => setSelectedStudent(student)}
                formatDate={formatDate}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <StudentDetailModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
            formatDate={formatDate}
            formatDuration={formatDuration}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StudentCard({
  student,
  index,
  onView,
  formatDate,
  formatDuration,
}: {
  student: Student;
  index: number;
  onView: () => void;
  formatDate: (date: string) => string;
  formatDuration: (minutes: number) => string;
}) {
  const status = statusConfig[student.enrollment.status] || statusConfig.active;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {student.user.avatar ? (
          <img
            src={student.user.avatar}
            alt={student.user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg font-bold text-primary-600 dark:text-primary-400">
            {student.user.name.charAt(0)}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-surface-900 dark:text-surface-100 truncate">
              {student.user.name}
            </h3>
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-surface-500 truncate">{student.user.email}</p>
          {student.user.department && (
            <p className="text-xs text-surface-400 flex items-center gap-1 mt-1">
              <Building className="w-3 h-3" />
              {student.user.department}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="hidden sm:block text-center px-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-24 h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  student.enrollment.progress === 100 ? 'bg-green-500' : 'bg-primary-500'
                )}
                style={{ width: `${student.enrollment.progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {student.enrollment.progress}%
            </span>
          </div>
          <p className="text-xs text-surface-400">
            {student.enrollment.lessonsCompleted}/{student.enrollment.totalLessons} lessons
          </p>
        </div>

        {/* Time Spent */}
        <div className="hidden md:block text-center px-4">
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {formatDuration(student.enrollment.timeSpent)}
          </p>
          <p className="text-xs text-surface-400">Time spent</p>
        </div>

        {/* Enrolled Date */}
        <div className="hidden lg:block text-center px-4">
          <p className="text-sm text-surface-600 dark:text-surface-400">
            {formatDate(student.enrollment.enrolledAt)}
          </p>
          <p className="text-xs text-surface-400">Enrolled</p>
        </div>

        {/* Actions */}
        <button
          onClick={onView}
          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function StudentDetailModal({
  student,
  onClose,
  formatDate,
  formatDuration,
}: {
  student: Student;
  onClose: () => void;
  formatDate: (date: string) => string;
  formatDuration: (minutes: number) => string;
}) {
  const status = statusConfig[student.enrollment.status] || statusConfig.active;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-surface-800 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-4">
            {student.user.avatar ? (
              <img
                src={student.user.avatar}
                alt={student.user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl font-bold text-primary-600">
                {student.user.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                {student.user.name}
              </h2>
              <p className="text-surface-500">{student.user.email}</p>
              {student.user.department && (
                <p className="text-sm text-surface-400 flex items-center gap-1 mt-1">
                  <Building className="w-4 h-4" />
                  {student.user.department}
                </p>
              )}
            </div>
            <span className={cn('px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1', status.color)}>
              <StatusIcon className="w-4 h-4" />
              {status.label}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Course Progress</span>
              <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                {student.enrollment.progress}%
              </span>
            </div>
            <div className="h-3 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  student.enrollment.progress === 100 ? 'bg-green-500' : 'bg-primary-500'
                )}
                style={{ width: `${student.enrollment.progress}%` }}
              />
            </div>
            <p className="text-sm text-surface-500 mt-2">
              {student.enrollment.lessonsCompleted} of {student.enrollment.totalLessons} lessons completed
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-surface-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Time Spent</span>
              </div>
              <p className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {formatDuration(student.enrollment.timeSpent)}
              </p>
            </div>
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-surface-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Enrolled</span>
              </div>
              <p className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {formatDate(student.enrollment.enrolledAt)}
              </p>
            </div>
          </div>

          {/* Completed Date */}
          {student.enrollment.completedAt && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Completed on {formatDate(student.enrollment.completedAt)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-200 dark:border-surface-700 flex justify-between">
          <a
            href={`mailto:${student.user.email}`}
            className="flex items-center gap-2 px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </a>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
