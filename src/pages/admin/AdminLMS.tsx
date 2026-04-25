/**
 * Admin LMS Management Page
 * Manage courses, instructors, and view LMS statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  Star,
  BarChart2,
  FileText,
  AlertCircle,
  ChevronDown,
  Settings,
  UserPlus,
  RefreshCw,
  Download,
  Plus,
  Palette,
  Image,
  Calendar,
  Hash,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/shared/Spinner';

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

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar: string;
  category: string;
  level: string;
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  enrollmentCount: number;
  averageRating: number;
  moduleCount: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Instructor {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  role: string;
  courseCount: number;
  totalEnrollments: number;
  averageRating: number;
  createdAt: string;
}

interface LMSStats {
  totalCourses: number;
  publishedCourses: number;
  pendingCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  totalInstructors: number;
  totalCertificates: number;
  averageCompletion: number;
  recentEnrollments: { date: string; count: number }[];
  topCourses: { id: string; title: string; enrollments: number }[];
}

interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  recipientName: string;
  certificateNumber: string;
  completionDate: string;
  grade: number;
  gradeLabel: string;
  issuedAt: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

interface CertificateSettings {
  autoGenerate: boolean;
  requireMinGrade: boolean;
  minGradeThreshold: number;
  expirationEnabled: boolean;
  expirationMonths: number;
  signatureEnabled: boolean;
  signatureName: string;
  signatureTitle: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

type Tab = 'overview' | 'courses' | 'instructors' | 'pending' | 'certificates';

const statusColors: Record<string, string> = {
  draft: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300',
  pending_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  archived: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  archived: 'Archived',
};

export default function AdminLMS() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<LMSStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificateSettings, setCertificateSettings] = useState<CertificateSettings>({
    autoGenerate: true,
    requireMinGrade: true,
    minGradeThreshold: 70,
    expirationEnabled: false,
    expirationMonths: 24,
    signatureEnabled: true,
    signatureName: 'Director, OHCS',
    signatureTitle: 'Office of the Head of Civil Service',
    logoUrl: '',
    primaryColor: '#006B3F',
    secondaryColor: '#FCD116',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsData, coursesData, instructorsData] = await Promise.all([
        authFetch(`${API_BASE}/lms/admin/stats`),
        authFetch(`${API_BASE}/lms/admin/courses`),
        authFetch(`${API_BASE}/lms/admin/instructors`),
      ]);

      setStats(statsData);
      setCourses(coursesData.courses || []);
      setInstructors(instructorsData.instructors || []);
      setPendingCourses((coursesData.courses || []).filter((c: Course) => c.status === 'pending_review'));
    } catch (err: any) {
      console.error('Error fetching LMS data:', err);
      setError(err.message || 'Failed to load LMS data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Course actions
  const handleApproveCourse = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      await authFetch(`${API_BASE}/lms/admin/courses/${courseId}/approve`, { method: 'POST' });
      setCourses(prev => prev.map(c =>
        c.id === courseId ? { ...c, status: 'published' } : c
      ));
      setPendingCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (err: any) {
      console.error('Error approving course:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCourse = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      await authFetch(`${API_BASE}/lms/admin/courses/${courseId}/reject`, { method: 'POST' });
      setCourses(prev => prev.map(c =>
        c.id === courseId ? { ...c, status: 'draft' } : c
      ));
      setPendingCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (err: any) {
      console.error('Error rejecting course:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveCourse = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      await authFetch(`${API_BASE}/lms/admin/courses/${courseId}/archive`, { method: 'POST' });
      setCourses(prev => prev.map(c =>
        c.id === courseId ? { ...c, status: 'archived' } : c
      ));
    } catch (err: any) {
      console.error('Error archiving course:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter(c => {
    const matchesSearch = !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructorName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter instructors
  const filteredInstructors = instructors.filter(i =>
    !searchQuery ||
    i.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            LMS Management
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Manage courses, instructors, and learning content
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-700 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart2 },
          { id: 'courses', label: 'All Courses', icon: BookOpen },
          { id: 'pending', label: 'Pending Review', icon: Clock, badge: pendingCourses.length },
          { id: 'instructors', label: 'Instructors', icon: Users },
          { id: 'certificates', label: 'Certificates', icon: Award },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                  <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {stats.totalCourses}
                  </p>
                  <p className="text-sm text-surface-500">Total Courses</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {stats.totalEnrollments}
                  </p>
                  <p className="text-sm text-surface-500">Enrollments</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {stats.totalCertificates}
                  </p>
                  <p className="text-sm text-surface-500">Certificates</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {stats.averageCompletion}%
                  </p>
                  <p className="text-sm text-surface-500">Avg Completion</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Course Status Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
                Course Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Published</span>
                  <span className="font-bold text-emerald-600">{stats.publishedCourses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Pending Review</span>
                  <span className="font-bold text-amber-600">{stats.pendingCourses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Drafts</span>
                  <span className="font-bold text-surface-500">{stats.draftCourses}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
                Top Courses
              </h3>
              <div className="space-y-3">
                {stats.topCourses?.slice(0, 5).map((course, idx) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-surface-700 dark:text-surface-300 truncate max-w-[180px]">
                        {course.title}
                      </span>
                    </div>
                    <span className="text-sm text-surface-500">{course.enrollments} enrolled</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="pending_review">Pending Review</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Courses Table */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Course</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Instructor</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Status</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Enrolled</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Rating</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-12 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-8 rounded bg-surface-200 dark:bg-surface-600 flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-surface-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-surface-900 dark:text-surface-100 line-clamp-1">
                              {course.title}
                            </p>
                            <p className="text-xs text-surface-500">
                              {course.moduleCount} modules • {course.lessonCount} lessons
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {course.instructorAvatar ? (
                            <img
                              src={course.instructorAvatar}
                              alt={course.instructorName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-medium text-primary-600">
                              {course.instructorName?.charAt(0) || 'I'}
                            </div>
                          )}
                          <span className="text-sm text-surface-700 dark:text-surface-300">
                            {course.instructorName || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[course.status])}>
                          {statusLabels[course.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-surface-700 dark:text-surface-300">
                        {course.enrollmentCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-surface-700 dark:text-surface-300">
                            {course.averageRating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {course.status === 'pending_review' && (
                            <>
                              <button
                                onClick={() => handleApproveCourse(course.id)}
                                disabled={actionLoading === course.id}
                                className="p-1.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectCourse(course.id)}
                                disabled={actionLoading === course.id}
                                className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {course.status === 'published' && (
                            <button
                              onClick={() => handleArchiveCourse(course.id)}
                              disabled={actionLoading === course.id}
                              className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
                              title="Archive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <a
                            href={`/courses/${course.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">No courses found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Review Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingCourses.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
                All caught up!
              </h3>
              <p className="text-surface-500">No courses pending review</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingCourses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-24 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-24 h-16 rounded-lg bg-surface-200 dark:bg-surface-600 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-surface-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                          {course.title}
                        </h3>
                        <p className="text-sm text-surface-500 mt-1 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-surface-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {course.instructorName}
                          </span>
                          <span>{course.moduleCount} modules</span>
                          <span>{course.lessonCount} lessons</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveCourse(course.id)}
                        disabled={actionLoading === course.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading === course.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectCourse(course.id)}
                        disabled={actionLoading === course.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructors Tab */}
      {activeTab === 'instructors' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search instructors..."
              className="w-full max-w-md pl-10 pr-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstructors.map((instructor) => (
              <motion.div
                key={instructor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  {instructor.avatar ? (
                    <img
                      src={instructor.avatar}
                      alt={instructor.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg font-semibold text-primary-600">
                      {instructor.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                      {instructor.displayName}
                    </h3>
                    <p className="text-sm text-surface-500">{instructor.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                    <p className="text-lg font-bold text-surface-900 dark:text-surface-100">
                      {instructor.courseCount}
                    </p>
                    <p className="text-xs text-surface-500">Courses</p>
                  </div>
                  <div className="p-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                    <p className="text-lg font-bold text-surface-900 dark:text-surface-100">
                      {instructor.totalEnrollments}
                    </p>
                    <p className="text-xs text-surface-500">Students</p>
                  </div>
                  <div className="p-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                        {instructor.averageRating?.toFixed(1) || '0'}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500">Rating</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredInstructors.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
              <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500">No instructors found</p>
            </div>
          )}
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {/* Settings Section */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                    Certificate Settings
                  </h3>
                  <p className="text-sm text-surface-500">
                    Configure how certificates are generated and issued
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  setIsSavingSettings(true);
                  setSettingsSuccess(false);
                  try {
                    await authFetch(`${API_BASE}/lms/admin/certificate-settings`, {
                      method: 'POST',
                      body: JSON.stringify(certificateSettings),
                    });
                    setSettingsSuccess(true);
                    setTimeout(() => setSettingsSuccess(false), 3000);
                  } catch (err) {
                    console.error('Error saving settings:', err);
                  } finally {
                    setIsSavingSettings(false);
                  }
                }}
                disabled={isSavingSettings}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingSettings ? (
                  <Spinner size="sm" />
                ) : settingsSuccess ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {settingsSuccess ? 'Saved!' : 'Save Settings'}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Generation Settings */}
              <div className="space-y-5">
                <h4 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Generation Rules
                </h4>

                {/* Auto Generate */}
                <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-100">
                      Auto-Generate Certificates
                    </p>
                    <p className="text-sm text-surface-500">
                      Automatically issue certificates upon course completion
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={certificateSettings.autoGenerate}
                    onChange={(e) => setCertificateSettings(prev => ({
                      ...prev,
                      autoGenerate: e.target.checked
                    }))}
                    className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                {/* Minimum Grade */}
                <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-100">
                      Require Minimum Grade
                    </p>
                    <p className="text-sm text-surface-500">
                      Only issue certificates if grade meets threshold
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={certificateSettings.requireMinGrade}
                    onChange={(e) => setCertificateSettings(prev => ({
                      ...prev,
                      requireMinGrade: e.target.checked
                    }))}
                    className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                {certificateSettings.requireMinGrade && (
                  <div className="pl-4">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Minimum Grade Threshold
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={certificateSettings.minGradeThreshold}
                        onChange={(e) => setCertificateSettings(prev => ({
                          ...prev,
                          minGradeThreshold: parseInt(e.target.value) || 0
                        }))}
                        className="w-24 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                      />
                      <span className="text-surface-500">%</span>
                    </div>
                  </div>
                )}

                {/* Expiration */}
                <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-surface-400" />
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        Certificate Expiration
                      </p>
                      <p className="text-sm text-surface-500">
                        Set an expiration period for certificates
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={certificateSettings.expirationEnabled}
                    onChange={(e) => setCertificateSettings(prev => ({
                      ...prev,
                      expirationEnabled: e.target.checked
                    }))}
                    className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                {certificateSettings.expirationEnabled && (
                  <div className="pl-4">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Expiration Period
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={certificateSettings.expirationMonths}
                        onChange={(e) => setCertificateSettings(prev => ({
                          ...prev,
                          expirationMonths: parseInt(e.target.value) || 12
                        }))}
                        className="w-24 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                      />
                      <span className="text-surface-500">months</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Appearance Settings */}
              <div className="space-y-5">
                <h4 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Appearance
                </h4>

                {/* Signature */}
                <label className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-100">
                      Include Signature
                    </p>
                    <p className="text-sm text-surface-500">
                      Add an official signature to certificates
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={certificateSettings.signatureEnabled}
                    onChange={(e) => setCertificateSettings(prev => ({
                      ...prev,
                      signatureEnabled: e.target.checked
                    }))}
                    className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                {certificateSettings.signatureEnabled && (
                  <div className="space-y-3 pl-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Signatory Name
                      </label>
                      <input
                        type="text"
                        value={certificateSettings.signatureName}
                        onChange={(e) => setCertificateSettings(prev => ({
                          ...prev,
                          signatureName: e.target.value
                        }))}
                        placeholder="e.g., Director, OHCS"
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Signatory Title
                      </label>
                      <input
                        type="text"
                        value={certificateSettings.signatureTitle}
                        onChange={(e) => setCertificateSettings(prev => ({
                          ...prev,
                          signatureTitle: e.target.value
                        }))}
                        placeholder="e.g., Office of the Head of Civil Service"
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                      />
                    </div>
                  </div>
                )}

                {/* Colors */}
                <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                  <p className="font-medium text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Certificate Colors
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-surface-600 dark:text-surface-400 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={certificateSettings.primaryColor}
                          onChange={(e) => setCertificateSettings(prev => ({
                            ...prev,
                            primaryColor: e.target.value
                          }))}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={certificateSettings.primaryColor}
                          onChange={(e) => setCertificateSettings(prev => ({
                            ...prev,
                            primaryColor: e.target.value
                          }))}
                          className="flex-1 px-2 py-1 text-sm rounded border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-surface-600 dark:text-surface-400 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={certificateSettings.secondaryColor}
                          onChange={(e) => setCertificateSettings(prev => ({
                            ...prev,
                            secondaryColor: e.target.value
                          }))}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={certificateSettings.secondaryColor}
                          onChange={(e) => setCertificateSettings(prev => ({
                            ...prev,
                            secondaryColor: e.target.value
                          }))}
                          className="flex-1 px-2 py-1 text-sm rounded border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo URL */}
                <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                  <label className="block font-medium text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={certificateSettings.logoUrl}
                    onChange={(e) => setCertificateSettings(prev => ({
                      ...prev,
                      logoUrl: e.target.value
                    }))}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                  />
                  {certificateSettings.logoUrl && (
                    <div className="mt-2">
                      <img
                        src={certificateSettings.logoUrl}
                        alt="Logo preview"
                        className="h-12 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Issued Certificates Section */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-5 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                  <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                    Issued Certificates
                  </h3>
                  <p className="text-sm text-surface-500">
                    {certificates.length} certificates issued
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    const data = await authFetch(`${API_BASE}/lms/admin/certificates`);
                    setCertificates(data.certificates || []);
                  } catch (err) {
                    console.error('Error fetching certificates:', err);
                  }
                }}
                className="px-3 py-1.5 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {certificates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">No certificates issued yet</p>
                <button
                  onClick={async () => {
                    try {
                      const data = await authFetch(`${API_BASE}/lms/admin/certificates`);
                      setCertificates(data.certificates || []);
                    } catch (err) {
                      console.error('Error fetching certificates:', err);
                    }
                  }}
                  className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Load certificates
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Certificate
                        </div>
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Recipient</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Course</th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Grade</th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-surface-600 dark:text-surface-400">Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                        <td className="px-4 py-3">
                          <code className="px-2 py-1 bg-surface-100 dark:bg-surface-700 rounded text-xs font-mono text-surface-600 dark:text-surface-400">
                            {cert.certificateNumber}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-surface-900 dark:text-surface-100">
                            {cert.recipientName}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-surface-700 dark:text-surface-300 line-clamp-1">
                            {cert.courseTitle}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            cert.grade >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            cert.grade >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}>
                            {cert.grade}% - {cert.gradeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-surface-500">
                          {new Date(cert.issuedAt || cert.completionDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
