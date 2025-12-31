/**
 * My Courses Page
 * Dashboard for enrolled courses with progress tracking
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  PlayCircle,
  Trophy,
  GraduationCap,
  Calendar,
  TrendingUp,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';
import { useLMSStore } from '@/stores/lmsStore';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';
import type { Enrollment, EnrollmentStatus } from '@/types/lms';

const statusConfig: Record<EnrollmentStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: PlayCircle,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle2,
  },
  dropped: {
    label: 'Dropped',
    color: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
    icon: BookOpen,
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: Clock,
  },
};

type FilterType = 'all' | EnrollmentStatus;

export default function MyCourses() {
  const { enrollments, isLoading, fetchMyEnrollments } = useLMSStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMyEnrollments();
  }, []);

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesFilter = filter === 'all' || enrollment.status === filter;
    const matchesSearch =
      !searchQuery ||
      enrollment.course?.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: enrollments.length,
    active: enrollments.filter((e) => e.status === 'active').length,
    completed: enrollments.filter((e) => e.status === 'completed').length,
    totalHours: enrollments.reduce((acc, e) => acc + (e.timeSpent || 0), 0) / 3600,
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
              My Courses
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Track your learning progress
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {stats.total}
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Total Courses
              </p>
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
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {stats.active}
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                In Progress
              </p>
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
              <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {stats.completed}
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Completed
              </p>
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
              <Clock className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {stats.totalHours.toFixed(1)}h
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Time Spent
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your courses..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            {(['all', 'active', 'completed', 'dropped'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  filter === f
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                )}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
            {enrollments.length === 0 ? "You haven't enrolled in any courses yet" : 'No courses found'}
          </h3>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            {enrollments.length === 0
              ? 'Browse our catalog to find courses that interest you'
              : 'Try adjusting your search or filters'}
          </p>
          {enrollments.length === 0 && (
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              Browse Courses
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEnrollments.map((enrollment, index) => (
            <EnrollmentCard key={enrollment.id} enrollment={enrollment} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function EnrollmentCard({ enrollment, index }: { enrollment: Enrollment; index: number }) {
  const course = enrollment.course;
  const status = statusConfig[enrollment.status];
  const StatusIcon = status.icon;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!course) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={enrollment.status === 'completed' ? `/courses/${course.id}` : `/courses/${course.id}/learn`}
        className="block bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden hover:shadow-lg transition-all duration-300"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <div className="relative w-full sm:w-48 h-32 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex-shrink-0">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <GraduationCap className="w-12 h-12 text-primary-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('px-2 py-0.5 text-xs font-medium rounded', status.color)}>
                    <span className="flex items-center gap-1">
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </span>
                  <span className="text-xs text-surface-500 dark:text-surface-400">
                    {course.category}
                  </span>
                </div>

                <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2 line-clamp-1">
                  {course.title}
                </h3>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-surface-600 dark:text-surface-400">
                      {enrollment.lessonsCompleted} / {enrollment.totalLessons} lessons
                    </span>
                    <span className="font-medium text-primary-600 dark:text-primary-400">
                      {enrollment.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${enrollment.progress}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className={cn(
                        'h-full rounded-full',
                        enrollment.status === 'completed'
                          ? 'bg-green-500'
                          : 'bg-primary-500'
                      )}
                    />
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Enrolled {formatDate(enrollment.enrolledAt)}</span>
                  </div>
                  {enrollment.timeSpent > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {Math.floor(enrollment.timeSpent / 3600)}h{' '}
                        {Math.floor((enrollment.timeSpent % 3600) / 60)}m
                      </span>
                    </div>
                  )}
                  {enrollment.status === 'completed' && enrollment.finalGrade && (
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span>Grade: {enrollment.finalGrade}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Continue/View button */}
              <div className="hidden sm:flex items-center">
                <div className="px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium text-sm flex items-center gap-2">
                  {enrollment.status === 'completed' ? 'View Course' : 'Continue'}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
