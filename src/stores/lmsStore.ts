/**
 * Learning Management System (LMS) Store
 * Zustand store for managing courses, enrollments, lessons, and progress
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Course,
  CourseWithDetails,
  Module,
  Lesson,
  LessonWithContent,
  Enrollment,
  EnrollmentWithProgress,
  Quiz,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  Certificate,
  CourseCategory,
  CoursesListParams,
  CoursesListResponse,
  CourseLevel,
} from '@/types/lms';

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

interface LMSState {
  // Course catalog
  courses: Course[];
  totalCourses: number;
  currentPage: number;
  totalPages: number;
  categories: CourseCategory[];

  // Current course
  currentCourse: CourseWithDetails | null;

  // Enrollments
  enrollments: EnrollmentWithProgress[];

  // Current lesson
  currentLesson: LessonWithContent | null;

  // Quizzes
  currentQuiz: Quiz | null;
  currentQuizAttempt: QuizAttempt | null;
  quizQuestions: any[];

  // Assignments
  currentAssignment: Assignment | null;

  // Certificates
  certificates: Certificate[];

  // UI state
  isLoading: boolean;
  isEnrolling: boolean;
  isSending: boolean;
  error: string | null;

  // Filters
  filters: CoursesListParams;

  // Actions - Catalog
  fetchCourses: (params?: CoursesListParams) => Promise<void>;
  fetchCourse: (courseId: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  setFilters: (filters: Partial<CoursesListParams>) => void;
  clearFilters: () => void;

  // Actions - Enrollment
  enroll: (courseId: string) => Promise<boolean>;
  unenroll: (courseId: string) => Promise<boolean>;
  fetchMyEnrollments: (status?: string) => Promise<void>;

  // Actions - Lessons
  fetchLesson: (lessonId: string) => Promise<void>;
  completeLesson: (lessonId: string) => Promise<{ xpAwarded: number; courseProgress: number; certificate?: Certificate } | null>;

  // Actions - Quizzes
  fetchQuiz: (quizId: string) => Promise<void>;
  startQuiz: (quizId: string) => Promise<boolean>;
  submitQuiz: (quizId: string, answers: Record<string, any>, timeSpent?: number) => Promise<any>;

  // Actions - Assignments
  fetchAssignment: (assignmentId: string) => Promise<void>;
  submitAssignment: (assignmentId: string, data: { content?: string; files?: any[]; urls?: string[] }) => Promise<AssignmentSubmission | null>;

  // Actions - Certificates
  fetchCertificates: () => Promise<void>;
  fetchCertificate: (certId: string) => Promise<Certificate | null>;

  // Utility
  clearError: () => void;
  clearCurrentCourse: () => void;
  clearCurrentLesson: () => void;
}

export const useLMSStore = create<LMSState>()(
  persist(
    (set, get) => ({
      // Initial state
      courses: [],
      totalCourses: 0,
      currentPage: 1,
      totalPages: 1,
      categories: [],
      currentCourse: null,
      enrollments: [],
      currentLesson: null,
      currentQuiz: null,
      currentQuizAttempt: null,
      quizQuestions: [],
      currentAssignment: null,
      certificates: [],
      isLoading: false,
      isEnrolling: false,
      isSending: false,
      error: null,
      filters: {
        page: 1,
        limit: 12,
        sortBy: 'newest',
      },

      // Fetch courses with filtering
      fetchCourses: async (params?: CoursesListParams) => {
        set({ isLoading: true, error: null });
        try {
          const currentFilters = get().filters;
          const mergedParams = { ...currentFilters, ...params };

          const queryParams = new URLSearchParams();
          if (mergedParams.search) queryParams.set('search', mergedParams.search);
          if (mergedParams.category) queryParams.set('category', mergedParams.category);
          if (mergedParams.level) queryParams.set('level', mergedParams.level);
          if (mergedParams.sortBy) queryParams.set('sortBy', mergedParams.sortBy);
          if (mergedParams.page) queryParams.set('page', mergedParams.page.toString());
          if (mergedParams.limit) queryParams.set('limit', mergedParams.limit.toString());

          const response = await authFetch(`${API_BASE}/lms/courses?${queryParams.toString()}`) as CoursesListResponse;

          set({
            courses: response.courses || [],
            totalCourses: response.total || 0,
            currentPage: response.page || 1,
            totalPages: response.totalPages || 1,
            filters: mergedParams,
          });
        } catch (error: any) {
          console.error('Error fetching courses:', error);
          set({ error: error.message || 'Failed to fetch courses' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch single course with details
      fetchCourse: async (courseId: string) => {
        set({ isLoading: true, error: null });
        try {
          const course = await authFetch(`${API_BASE}/lms/courses/${courseId}`) as CourseWithDetails;
          set({ currentCourse: course });
        } catch (error: any) {
          console.error('Error fetching course:', error);
          set({ error: error.message || 'Failed to fetch course' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch categories
      fetchCategories: async () => {
        try {
          const response = await authFetch(`${API_BASE}/lms/categories`) as { categories: CourseCategory[] };
          set({ categories: response.categories || [] });
        } catch (error: any) {
          console.error('Error fetching categories:', error);
        }
      },

      // Set filters
      setFilters: (filters: Partial<CoursesListParams>) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      // Clear filters
      clearFilters: () => {
        set({
          filters: {
            page: 1,
            limit: 12,
            sortBy: 'newest',
          },
        });
      },

      // Enroll in a course
      enroll: async (courseId: string) => {
        set({ isEnrolling: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/lms/courses/${courseId}/enroll`, {
            method: 'POST',
          });

          // Update current course enrollment status
          set(state => ({
            currentCourse: state.currentCourse ? {
              ...state.currentCourse,
              isEnrolled: true,
              enrollment: response.enrollment,
            } : null,
          }));

          // Update course in list
          set(state => ({
            courses: state.courses.map(c =>
              c.id === courseId ? { ...c, isEnrolled: true, enrollmentCount: c.enrollmentCount + 1 } : c
            ),
          }));

          return true;
        } catch (error: any) {
          console.error('Error enrolling:', error);
          set({ error: error.message || 'Failed to enroll' });
          return false;
        } finally {
          set({ isEnrolling: false });
        }
      },

      // Unenroll from a course
      unenroll: async (courseId: string) => {
        set({ isEnrolling: true, error: null });
        try {
          await authFetch(`${API_BASE}/lms/courses/${courseId}/enroll`, {
            method: 'DELETE',
          });

          // Update current course enrollment status
          set(state => ({
            currentCourse: state.currentCourse ? {
              ...state.currentCourse,
              isEnrolled: false,
              enrollment: undefined,
            } : null,
          }));

          // Update enrollments list
          set(state => ({
            enrollments: state.enrollments.filter(e => e.courseId !== courseId),
          }));

          return true;
        } catch (error: any) {
          console.error('Error unenrolling:', error);
          set({ error: error.message || 'Failed to unenroll' });
          return false;
        } finally {
          set({ isEnrolling: false });
        }
      },

      // Fetch user's enrollments
      fetchMyEnrollments: async (status?: string) => {
        set({ isLoading: true, error: null });
        try {
          const params = new URLSearchParams();
          if (status) params.set('status', status);

          const response = await authFetch(`${API_BASE}/lms/my-courses?${params.toString()}`) as { enrollments: EnrollmentWithProgress[] };
          set({ enrollments: response.enrollments || [] });
        } catch (error: any) {
          console.error('Error fetching enrollments:', error);
          set({ error: error.message || 'Failed to fetch enrollments' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch lesson content
      fetchLesson: async (lessonId: string) => {
        set({ isLoading: true, error: null });
        try {
          const lesson = await authFetch(`${API_BASE}/lms/lessons/${lessonId}`) as LessonWithContent;
          set({ currentLesson: lesson });
        } catch (error: any) {
          console.error('Error fetching lesson:', error);
          set({ error: error.message || 'Failed to fetch lesson' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Complete a lesson
      completeLesson: async (lessonId: string) => {
        set({ isSending: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/lms/lessons/${lessonId}/complete`, {
            method: 'POST',
          });

          // Update current lesson progress
          set(state => ({
            currentLesson: state.currentLesson ? {
              ...state.currentLesson,
              progress: {
                ...state.currentLesson.progress!,
                status: 'completed',
                completedAt: new Date().toISOString(),
              },
            } : null,
          }));

          // Update enrollment progress
          set(state => ({
            enrollments: state.enrollments.map(e => {
              if (e.course?.id === state.currentLesson?.courseId) {
                return {
                  ...e,
                  progress: response.courseProgress,
                  lessonsCompleted: e.lessonsCompleted + 1,
                  status: response.isCourseComplete ? 'completed' : e.status,
                };
              }
              return e;
            }),
          }));

          return {
            xpAwarded: response.xpAwarded,
            courseProgress: response.courseProgress,
            certificate: response.certificate,
          };
        } catch (error: any) {
          console.error('Error completing lesson:', error);
          set({ error: error.message || 'Failed to complete lesson' });
          return null;
        } finally {
          set({ isSending: false });
        }
      },

      // Fetch quiz details
      fetchQuiz: async (quizId: string) => {
        set({ isLoading: true, error: null });
        try {
          const quiz = await authFetch(`${API_BASE}/lms/quizzes/${quizId}`) as Quiz;
          set({ currentQuiz: quiz });
        } catch (error: any) {
          console.error('Error fetching quiz:', error);
          set({ error: error.message || 'Failed to fetch quiz' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Start a quiz attempt - fetches quiz and starts attempt
      startQuiz: async (quizId: string) => {
        set({ isLoading: true, error: null });
        try {
          // First fetch the quiz details
          const quiz = await authFetch(`${API_BASE}/lms/quizzes/${quizId}`) as Quiz;

          // Then start the attempt
          const response = await authFetch(`${API_BASE}/lms/quizzes/${quizId}/start`, {
            method: 'POST',
          });

          // Combine quiz with questions from start response
          set({
            currentQuiz: {
              ...quiz,
              questions: response.questions || quiz.questions || [],
            },
            currentQuizAttempt: response.attempt,
            quizQuestions: response.questions || quiz.questions || [],
          });

          return true;
        } catch (error: any) {
          console.error('Error starting quiz:', error);
          set({ error: error.message || 'Failed to start quiz' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // Submit quiz answers
      submitQuiz: async (quizId: string, answers: Record<string, any>, timeSpent?: number) => {
        set({ isSending: true, error: null });
        try {
          const attempt = get().currentQuizAttempt;
          const response = await authFetch(`${API_BASE}/lms/quizzes/${quizId}/submit`, {
            method: 'POST',
            body: JSON.stringify({
              attemptId: attempt?.id,
              answers,
              timeSpent,
            }),
          });

          set({
            currentQuizAttempt: response.attempt,
          });

          return response;
        } catch (error: any) {
          console.error('Error submitting quiz:', error);
          set({ error: error.message || 'Failed to submit quiz' });
          return null;
        } finally {
          set({ isSending: false });
        }
      },

      // Fetch assignment details
      fetchAssignment: async (assignmentId: string) => {
        set({ isLoading: true, error: null });
        try {
          const assignment = await authFetch(`${API_BASE}/lms/assignments/${assignmentId}`) as Assignment;
          set({ currentAssignment: assignment });
        } catch (error: any) {
          console.error('Error fetching assignment:', error);
          set({ error: error.message || 'Failed to fetch assignment' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Submit assignment
      submitAssignment: async (assignmentId: string, data: { content?: string; files?: any[]; urls?: string[] }) => {
        set({ isSending: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/lms/assignments/${assignmentId}/submit`, {
            method: 'POST',
            body: JSON.stringify(data),
          });

          // Update current assignment
          set(state => ({
            currentAssignment: state.currentAssignment ? {
              ...state.currentAssignment,
              userSubmission: response.submission,
            } : null,
          }));

          return response.submission;
        } catch (error: any) {
          console.error('Error submitting assignment:', error);
          set({ error: error.message || 'Failed to submit assignment' });
          return null;
        } finally {
          set({ isSending: false });
        }
      },

      // Fetch user's certificates
      fetchCertificates: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/lms/certificates`) as { certificates: Certificate[] };
          set({ certificates: response.certificates || [] });
        } catch (error: any) {
          console.error('Error fetching certificates:', error);
          set({ error: error.message || 'Failed to fetch certificates' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch single certificate
      fetchCertificate: async (certId: string) => {
        try {
          const certificate = await authFetch(`${API_BASE}/lms/certificates/${certId}`) as Certificate;
          return certificate;
        } catch (error: any) {
          console.error('Error fetching certificate:', error);
          return null;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Clear current course
      clearCurrentCourse: () => set({ currentCourse: null }),

      // Clear current lesson
      clearCurrentLesson: () => set({ currentLesson: null, currentQuiz: null, currentQuizAttempt: null, quizQuestions: [], currentAssignment: null }),
    }),
    {
      name: 'lms-store',
      partialize: (state) => ({
        // Only persist filters
        filters: state.filters,
      }),
    }
  )
);
