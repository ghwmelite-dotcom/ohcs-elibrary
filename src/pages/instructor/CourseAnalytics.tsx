/**
 * Course Analytics Page
 * Comprehensive analytics dashboard for instructors to track course performance
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Award,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useInstructorStore, type CourseAnalytics as AnalyticsData } from '@/stores/instructorStore';

// Simple chart components (no external dependencies)
function BarChart({ data, maxValue, label }: { data: { name: string; value: number }[]; maxValue: number; label?: string }) {
  return (
    <div className="space-y-2">
      {label && <p className="text-xs text-surface-500 mb-3">{label}</p>}
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="text-xs text-surface-600 dark:text-surface-400 w-16 truncate">{item.name}</span>
          <div className="flex-1 h-6 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            />
          </div>
          <span className="text-xs font-medium text-surface-700 dark:text-surface-300 w-10 text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, dataKey, color = '#22c55e' }: { data: { date: string; [key: string]: any }[]; dataKey: string; color?: string }) {
  if (!data.length) return <p className="text-sm text-surface-500 text-center py-8">No data available</p>;

  const values = data.map(d => d[dataKey] || 0);
  const max = Math.max(...values, 1);
  const min = 0;
  const range = max - min;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((d[dataKey] - min) / range) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-32">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Grid lines */}
        <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" className="text-surface-200 dark:text-surface-700" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-surface-200 dark:text-surface-700" strokeWidth="0.5" />
        <line x1="0" y1="80" x2="100" y2="80" stroke="currentColor" className="text-surface-200 dark:text-surface-700" strokeWidth="0.5" />

        {/* Area fill */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * 100;
          const y = 100 - ((d[dataKey] - min) / range) * 80;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill={color}
            />
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-surface-500">
        {data.length > 0 && (
          <>
            <span>{data[0].date.slice(5)}</span>
            {data.length > 2 && <span>{data[Math.floor(data.length / 2)].date.slice(5)}</span>}
            <span>{data[data.length - 1].date.slice(5)}</span>
          </>
        )}
      </div>
    </div>
  );
}

function DonutChart({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <p className="text-sm text-surface-500 text-center py-8">No data</p>;

  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {data.map((item, idx) => {
            const percent = (item.value / total) * 100;
            const dashArray = `${percent} ${100 - percent}`;
            const dashOffset = -cumulativePercent;
            cumulativePercent += percent;

            return (
              <circle
                key={idx}
                cx="18"
                cy="18"
                r="15.91549431"
                fill="none"
                stroke={colors[idx % colors.length]}
                strokeWidth="3"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-surface-900 dark:text-white">{total}</span>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
            <span className="text-surface-600 dark:text-surface-400">{item.name}</span>
            <span className="font-medium text-surface-900 dark:text-white ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = 'primary'
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'blue';
}) {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-surface-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
             trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
        <p className="text-sm text-surface-500">{label}</p>
        {subValue && <p className="text-xs text-surface-400 mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-semibold text-surface-900 dark:text-white">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-surface-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-surface-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-6 border-t border-surface-200 dark:border-surface-700 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CourseAnalytics() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { fetchAnalytics, fetchCourseForEditing, currentEditingCourse, isLoading, error } = useInstructorStore();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseForEditing(courseId);
      loadAnalytics();
    }
  }, [courseId]);

  const loadAnalytics = async () => {
    if (!courseId) return;
    const data = await fetchAnalytics(courseId);
    setAnalytics(data);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Enrollments', analytics.overview.totalEnrollments],
      ['Active Students', analytics.overview.activeEnrollments],
      ['Completed', analytics.overview.completedEnrollments],
      ['Dropped', analytics.overview.droppedEnrollments],
      ['Completion Rate', `${analytics.overview.completionRate}%`],
      ['Average Progress', `${analytics.overview.avgProgress}%`],
      ['Average Time Spent', formatTime(analytics.overview.avgTimeSpent)],
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentEditingCourse?.title || 'course'}-analytics.csv`;
    a.click();
  };

  if (isLoading && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-surface-600 dark:text-surface-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
            Unable to load analytics
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-4">{error || 'Course not found'}</p>
          <button
            onClick={() => navigate('/instructor')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const gradeColors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
  const gradeOrder = ['A', 'B', 'C', 'D', 'F'];
  const sortedGrades = gradeOrder
    .map(grade => analytics.gradeDistribution.find(g => g.grade === grade) || { grade, count: 0 })
    .filter(g => g.count > 0);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/instructor"
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-white">
                  Course Analytics
                </h1>
                {currentEditingCourse && (
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    {currentEditingCourse.title}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={exportAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Enrollments"
            value={analytics.overview.totalEnrollments}
            subValue={`${analytics.overview.activeEnrollments} active`}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Completion Rate"
            value={`${analytics.overview.completionRate}%`}
            subValue={`${analytics.overview.completedEnrollments} completed`}
            trend={analytics.overview.completionRate >= 70 ? 'up' : 'down'}
            color="green"
          />
          <StatCard
            icon={Target}
            label="Average Progress"
            value={`${analytics.overview.avgProgress}%`}
            color="primary"
          />
          <StatCard
            icon={Clock}
            label="Avg Time Spent"
            value={formatTime(analytics.overview.avgTimeSpent)}
            color="yellow"
          />
        </div>

        {/* Trends Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <CollapsibleSection title="Enrollment Trends (30 days)" icon={TrendingUp}>
            <LineChart
              data={analytics.enrollmentTrends}
              dataKey="enrollments"
              color="#3b82f6"
            />
          </CollapsibleSection>

          <CollapsibleSection title="Completion Trends (30 days)" icon={Award}>
            <LineChart
              data={analytics.completionTrends}
              dataKey="completions"
              color="#22c55e"
            />
          </CollapsibleSection>
        </div>

        {/* Grade Distribution & Student Engagement */}
        <div className="grid md:grid-cols-2 gap-6">
          <CollapsibleSection title="Grade Distribution" icon={BarChart3}>
            {sortedGrades.length > 0 ? (
              <DonutChart
                data={sortedGrades.map(g => ({ name: g.grade, value: g.count }))}
                colors={gradeColors}
              />
            ) : (
              <p className="text-sm text-surface-500 text-center py-8">No grades recorded yet</p>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Student Engagement (14 days)" icon={Users}>
            <LineChart
              data={analytics.studentEngagement}
              dataKey="activeStudents"
              color="#8b5cf6"
            />
          </CollapsibleSection>
        </div>

        {/* Quiz Performance */}
        {analytics.quizPerformance.length > 0 && (
          <CollapsibleSection title="Quiz Performance" icon={FileText}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-surface-500 uppercase tracking-wider">
                    <th className="pb-3">Quiz</th>
                    <th className="pb-3 text-center">Attempts</th>
                    <th className="pb-3 text-center">Avg Score</th>
                    <th className="pb-3 text-center">Pass Rate</th>
                    <th className="pb-3 text-center">Score Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                  {analytics.quizPerformance.map((quiz) => (
                    <tr key={quiz.id} className="text-sm">
                      <td className="py-3 text-surface-900 dark:text-white font-medium">{quiz.title}</td>
                      <td className="py-3 text-center text-surface-600 dark:text-surface-400">{quiz.attemptCount}</td>
                      <td className="py-3 text-center">
                        <span className={`font-medium ${
                          quiz.avgScore >= 70 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {quiz.avgScore}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`font-medium ${
                          quiz.passRate >= 70 ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {quiz.passRate}%
                        </span>
                      </td>
                      <td className="py-3 text-center text-surface-600 dark:text-surface-400">
                        {quiz.minScore}% - {quiz.maxScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}

        {/* Assignment Stats */}
        {analytics.assignmentStats.length > 0 && (
          <CollapsibleSection title="Assignment Statistics" icon={BookOpen}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-surface-500 uppercase tracking-wider">
                    <th className="pb-3">Assignment</th>
                    <th className="pb-3 text-center">Submissions</th>
                    <th className="pb-3 text-center">Graded</th>
                    <th className="pb-3 text-center">Avg Score</th>
                    <th className="pb-3 text-center">Late</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                  {analytics.assignmentStats.map((assignment) => (
                    <tr key={assignment.id} className="text-sm">
                      <td className="py-3 text-surface-900 dark:text-white font-medium">{assignment.title}</td>
                      <td className="py-3 text-center text-surface-600 dark:text-surface-400">{assignment.submissionCount}</td>
                      <td className="py-3 text-center text-surface-600 dark:text-surface-400">{assignment.gradedCount}</td>
                      <td className="py-3 text-center">
                        <span className={`font-medium ${
                          assignment.avgScore >= 70 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {assignment.avgScore}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {assignment.lateSubmissions > 0 ? (
                          <span className="text-yellow-600">{assignment.lateSubmissions}</span>
                        ) : (
                          <span className="text-surface-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}

        {/* Lesson Completion */}
        {analytics.lessonCompletion.length > 0 && (
          <CollapsibleSection title="Lesson Completion" icon={BookOpen} defaultOpen={false}>
            <BarChart
              data={analytics.lessonCompletion.map(l => ({
                name: l.title.length > 20 ? l.title.slice(0, 20) + '...' : l.title,
                value: l.completionCount,
              }))}
              maxValue={analytics.overview.totalEnrollments || 1}
              label="Students completed each lesson"
            />
          </CollapsibleSection>
        )}

        {/* Discussion Stats */}
        <CollapsibleSection title="Discussion Activity" icon={MessageSquare}>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {analytics.discussionStats.totalDiscussions}
              </p>
              <p className="text-sm text-surface-500">Discussions</p>
            </div>
            <div className="text-center p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {analytics.discussionStats.totalReplies}
              </p>
              <p className="text-sm text-surface-500">Replies</p>
            </div>
            <div className="text-center p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {analytics.discussionStats.uniqueParticipants}
              </p>
              <p className="text-sm text-surface-500">Participants</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Top Performers & Struggling Students */}
        <div className="grid md:grid-cols-2 gap-6">
          <CollapsibleSection title="Top Performers" icon={Award}>
            {analytics.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topPerformers.map((student, idx) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-surface-400 dark:bg-surface-500' : idx === 2 ? 'bg-amber-700' : 'bg-surface-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 dark:text-white truncate">
                        {student.displayName}
                      </p>
                      <p className="text-xs text-surface-500">{student.department || 'Staff'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{student.finalGrade}%</p>
                      <p className="text-xs text-surface-500">{formatTime(student.timeSpent)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-500 text-center py-8">No completions yet</p>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Students Needing Attention" icon={AlertTriangle}>
            {analytics.strugglingStudents.length > 0 ? (
              <div className="space-y-3">
                {analytics.strugglingStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <img
                      src={student.avatar || `https://ui-avatars.com/api/?name=${student.displayName}&background=random`}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 dark:text-white truncate">
                        {student.displayName}
                      </p>
                      <p className="text-xs text-surface-500">
                        {student.lessonsCompleted}/{student.totalLessons} lessons • Last active: {formatDate(student.lastAccessedAt || '')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{student.progress}%</p>
                      <a
                        href={`mailto:${student.email}`}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        Contact
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-surface-500">All students are on track!</p>
              </div>
            )}
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
