/**
 * Course Gradebook
 * View and manage student grades for a course
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Search,
  Download,
  Filter,
  Users,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  FileText,
  Target,
  TrendingUp,
  AlertCircle,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { useInstructorStore } from '@/stores/instructorStore';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';

interface Quiz {
  id: string;
  title: string;
  passingScore: number;
}

interface Assignment {
  id: string;
  title: string;
  maxScore: number;
}

interface GradebookEntry {
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    department?: string;
  };
  enrollment: {
    id: string;
    status: string;
    progress: number;
    lessonsCompleted: number;
    totalLessons: number;
    enrolledAt: string;
    completedAt?: string;
  };
  quizScores: Record<string, { percentage: number; passed: boolean }>;
  assignmentScores: Record<string, { score: number; maxScore: number; percentage: number; status: string }>;
  overallGrade: number | null;
  gradeLabel: string | null;
}

const gradeColors: Record<string, string> = {
  A: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  B: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  C: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  F: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function CourseGradebook() {
  const { courseId } = useParams<{ courseId: string }>();
  const { gradebook, isLoading, error, fetchGradebook, currentEditingCourse, fetchCourseForEditing } = useInstructorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedStudent, setSelectedStudent] = useState<GradebookEntry | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchGradebook(courseId).then((response: any) => {
        if (response?.quizzes) setQuizzes(response.quizzes);
        if (response?.assignments) setAssignments(response.assignments);
      });
      if (!currentEditingCourse) {
        fetchCourseForEditing(courseId);
      }
    }
  }, [courseId]);

  const filteredGradebook = (gradebook as GradebookEntry[]).filter((entry) => {
    const matchesSearch = !searchQuery ||
      entry.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'completed' && entry.enrollment.status === 'completed') ||
      (statusFilter === 'active' && entry.enrollment.status === 'active');

    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalStudents: gradebook.length,
    completed: gradebook.filter((e: any) => e.enrollment.status === 'completed').length,
    avgGrade: gradebook.length > 0
      ? Math.round(gradebook.reduce((acc: number, e: any) => acc + (e.overallGrade || 0), 0) / gradebook.filter((e: any) => e.overallGrade !== null).length) || 0
      : 0,
    passing: gradebook.filter((e: any) => e.overallGrade !== null && e.overallGrade >= 70).length,
  };

  const exportGradebook = () => {
    const headers = ['Student Name', 'Email', 'Status', 'Progress', ...quizzes.map(q => q.title), ...assignments.map(a => a.title), 'Overall Grade'];
    const rows = filteredGradebook.map(entry => [
      entry.student.name,
      entry.student.email,
      entry.enrollment.status,
      `${entry.enrollment.progress}%`,
      ...quizzes.map(q => entry.quizScores[q.id]?.percentage?.toString() || '-'),
      ...assignments.map(a => entry.assignmentScores[a.id]?.percentage?.toString() || '-'),
      entry.gradeLabel || '-',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook-${courseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !gradebook.length) {
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
                  Gradebook
                </h1>
                <p className="text-sm text-surface-500 truncate max-w-[200px] sm:max-w-[400px]">
                  {currentEditingCourse?.title || 'Loading...'}
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={exportGradebook}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
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
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.totalStudents}</p>
                <p className="text-sm text-surface-500">Students</p>
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
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.avgGrade}%</p>
                <p className="text-sm text-surface-500">Avg Grade</p>
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
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.passing}</p>
                <p className="text-sm text-surface-500">Passing</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'completed'] as const).map((status) => (
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
          </div>
        </div>

        {/* Gradebook Table */}
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : filteredGradebook.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-600 dark:text-surface-400">No students enrolled yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700">
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400 sticky left-0 bg-surface-50 dark:bg-surface-700/50">
                      Student
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">
                      Progress
                    </th>
                    {quizzes.map((quiz) => (
                      <th key={quiz.id} className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Target className="w-4 h-4" />
                          <span className="truncate max-w-[100px]" title={quiz.title}>{quiz.title}</span>
                        </div>
                      </th>
                    ))}
                    {assignments.map((assignment) => (
                      <th key={assignment.id} className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span className="truncate max-w-[100px]" title={assignment.title}>{assignment.title}</span>
                          <Link
                            to={`/instructor/courses/${courseId}/assignment/${assignment.id}/grade`}
                            className="ml-1 p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-600 text-primary-500"
                            title="Grade submissions"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">
                      Grade
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                  {filteredGradebook.map((entry, index) => (
                    <motion.tr
                      key={entry.student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-surface-50 dark:hover:bg-surface-700/50"
                    >
                      <td className="px-4 py-3 sticky left-0 bg-white dark:bg-surface-800">
                        <div className="flex items-center gap-3">
                          {entry.student.avatar ? (
                            <img
                              src={entry.student.avatar}
                              alt={entry.student.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400">
                              {entry.student.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                              {entry.student.name}
                            </p>
                            <p className="text-xs text-surface-500 truncate">
                              {entry.student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${entry.enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-surface-600 dark:text-surface-400">
                            {entry.enrollment.progress}%
                          </span>
                        </div>
                      </td>
                      {quizzes.map((quiz) => {
                        const score = entry.quizScores[quiz.id];
                        return (
                          <td key={quiz.id} className="px-4 py-3 text-center">
                            {score ? (
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                score.passed
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              )}>
                                {score.passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {score.percentage}%
                              </span>
                            ) : (
                              <span className="text-surface-400">-</span>
                            )}
                          </td>
                        );
                      })}
                      {assignments.map((assignment) => {
                        const score = entry.assignmentScores[assignment.id];
                        return (
                          <td key={assignment.id} className="px-4 py-3 text-center">
                            {score ? (
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                score.status === 'graded'
                                  ? score.percentage >= 70
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              )}>
                                {score.status === 'graded' ? (
                                  <>
                                    {score.percentage >= 70 ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {score.percentage}%
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    Pending
                                  </>
                                )}
                              </span>
                            ) : (
                              <span className="text-surface-400">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        {entry.gradeLabel ? (
                          <span className={cn(
                            'inline-block px-3 py-1 rounded-full text-sm font-bold',
                            gradeColors[entry.gradeLabel] || 'bg-surface-100 text-surface-600'
                          )}>
                            {entry.gradeLabel}
                          </span>
                        ) : (
                          <span className="text-surface-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedStudent(entry)}
                          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <StudentDetailModal
            entry={selectedStudent}
            quizzes={quizzes}
            assignments={assignments}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StudentDetailModal({
  entry,
  quizzes,
  assignments,
  onClose,
}: {
  entry: GradebookEntry;
  quizzes: Quiz[];
  assignments: Assignment[];
  onClose: () => void;
}) {
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
        className="w-full max-w-2xl bg-white dark:bg-surface-800 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-4">
            {entry.student.avatar ? (
              <img
                src={entry.student.avatar}
                alt={entry.student.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl font-bold text-primary-600">
                {entry.student.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                {entry.student.name}
              </h2>
              <p className="text-surface-500">{entry.student.email}</p>
              {entry.student.department && (
                <p className="text-sm text-surface-400">{entry.student.department}</p>
              )}
            </div>
            {entry.gradeLabel && (
              <div className={cn(
                'ml-auto px-4 py-2 rounded-xl text-2xl font-bold',
                gradeColors[entry.gradeLabel]
              )}>
                {entry.gradeLabel}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress */}
          <div>
            <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-3">Course Progress</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${entry.enrollment.progress}%` }}
                />
              </div>
              <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                {entry.enrollment.progress}%
              </span>
            </div>
            <p className="text-sm text-surface-500 mt-2">
              {entry.enrollment.lessonsCompleted} of {entry.enrollment.totalLessons} lessons completed
            </p>
          </div>

          {/* Quiz Scores */}
          {quizzes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-3">Quiz Scores</h3>
              <div className="space-y-2">
                {quizzes.map((quiz) => {
                  const score = entry.quizScores[quiz.id];
                  return (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-surface-700 dark:text-surface-300">{quiz.title}</span>
                      </div>
                      {score ? (
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          score.passed
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}>
                          {score.percentage}%
                        </span>
                      ) : (
                        <span className="text-sm text-surface-400">Not attempted</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assignment Scores */}
          {assignments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-3">Assignment Scores</h3>
              <div className="space-y-2">
                {assignments.map((assignment) => {
                  const score = entry.assignmentScores[assignment.id];
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-surface-700 dark:text-surface-300">{assignment.title}</span>
                      </div>
                      {score ? (
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          score.status === 'graded'
                            ? score.percentage >= 70
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        )}>
                          {score.status === 'graded' ? `${score.percentage}%` : 'Pending'}
                        </span>
                      ) : (
                        <span className="text-sm text-surface-400">Not submitted</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                <Clock className="w-4 h-4" />
                <span>Enrolled: {new Date(entry.enrollment.enrolledAt).toLocaleDateString()}</span>
              </div>
              {entry.enrollment.completedAt && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Completed: {new Date(entry.enrollment.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-surface-200 dark:border-surface-700 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
