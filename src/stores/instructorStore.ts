/**
 * Instructor Store
 * Zustand store for managing instructor course creation and management
 */

import { create } from 'zustand';
import type {
  Course,
  Module,
  Lesson,
  Quiz,
  QuizQuestion,
  Assignment,
  AssignmentSubmission,
  GradebookEntry,
  CreateCourseInput,
  CreateModuleInput,
  CreateLessonInput,
  CreateQuizInput,
  CreateQuestionInput,
  CreateAssignmentInput,
  Rubric,
  RubricCriterion,
} from '@/types/lms';

const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

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

interface EnrolledStudent {
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

export interface CourseAnalytics {
  overview: {
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    droppedEnrollments: number;
    completionRate: number;
    dropRate: number;
    avgProgress: number;
    avgTimeSpent: number;
  };
  enrollmentTrends: { date: string; enrollments: number }[];
  completionTrends: { date: string; completions: number }[];
  quizPerformance: {
    id: string;
    title: string;
    attemptCount: number;
    avgScore: number;
    passRate: number;
    minScore?: number;
    maxScore?: number;
  }[];
  assignmentStats: {
    id: string;
    title: string;
    submissionCount: number;
    gradedCount: number;
    avgScore: number;
    lateSubmissions: number;
  }[];
  lessonCompletion: {
    id: string;
    title: string;
    contentType: string;
    sortOrder: number;
    completionCount: number;
  }[];
  studentEngagement: { date: string; activeStudents: number }[];
  gradeDistribution: { grade: string; count: number }[];
  topPerformers: {
    id: string;
    displayName: string;
    avatar?: string;
    department?: string;
    progress: number;
    finalGrade: number;
    timeSpent: number;
    lessonsCompleted: number;
  }[];
  strugglingStudents: {
    id: string;
    displayName: string;
    avatar?: string;
    email: string;
    progress: number;
    lessonsCompleted: number;
    totalLessons: number;
    lastAccessedAt?: string;
  }[];
  discussionStats: {
    totalDiscussions: number;
    totalReplies: number;
    uniqueParticipants: number;
  };
}

interface InstructorState {
  // Instructor's courses
  myCourses: Course[];

  // Current editing course
  currentEditingCourse: Course | null;
  editingModules: Module[];
  editingLessons: Lesson[];

  // Quiz builder
  editingQuiz: Quiz | null;
  editingQuestions: QuizQuestion[];

  // Assignment builder
  editingAssignment: Assignment | null;

  // Students & Gradebook
  enrolledStudents: EnrolledStudent[];
  gradebook: GradebookEntry[];
  pendingSubmissions: AssignmentSubmission[];

  // Rubrics
  rubrics: Rubric[];
  editingRubric: Rubric | null;

  // UI State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions - Courses
  fetchMyCourses: () => Promise<void>;
  createCourse: (data: CreateCourseInput) => Promise<string | null>;
  updateCourse: (courseId: string, data: Partial<CreateCourseInput>) => Promise<boolean>;
  deleteCourse: (courseId: string) => Promise<boolean>;
  publishCourse: (courseId: string) => Promise<boolean>;
  unpublishCourse: (courseId: string) => Promise<boolean>;

  // Actions - Course Builder
  setEditingCourse: (course: Course | null) => void;
  fetchCourseForEditing: (courseId: string) => Promise<void>;

  // Actions - Modules
  createModule: (data: CreateModuleInput) => Promise<Module | null>;
  updateModule: (moduleId: string, data: Partial<CreateModuleInput>) => Promise<boolean>;
  deleteModule: (moduleId: string) => Promise<boolean>;
  reorderModules: (moduleIds: string[]) => Promise<boolean>;

  // Actions - Lessons
  createLesson: (data: CreateLessonInput) => Promise<Lesson | null>;
  updateLesson: (lessonId: string, data: Partial<CreateLessonInput>) => Promise<boolean>;
  deleteLesson: (lessonId: string) => Promise<boolean>;
  reorderLessons: (moduleId: string, lessonIds: string[]) => Promise<boolean>;

  // Actions - Quizzes
  createQuiz: (data: CreateQuizInput) => Promise<Quiz | null>;
  updateQuiz: (quizId: string, data: Partial<CreateQuizInput>) => Promise<boolean>;
  deleteQuiz: (quizId: string) => Promise<boolean>;
  setEditingQuiz: (quiz: Quiz | null) => void;

  // Actions - Questions
  addQuestion: (data: CreateQuestionInput) => Promise<QuizQuestion | null>;
  updateQuestion: (questionId: string, data: Partial<CreateQuestionInput>) => Promise<boolean>;
  deleteQuestion: (questionId: string) => Promise<boolean>;
  reorderQuestions: (quizId: string, questionIds: string[]) => Promise<boolean>;

  // Actions - Assignments
  createAssignment: (data: CreateAssignmentInput) => Promise<Assignment | null>;
  updateAssignment: (assignmentId: string, data: Partial<CreateAssignmentInput>) => Promise<boolean>;
  deleteAssignment: (assignmentId: string) => Promise<boolean>;
  setEditingAssignment: (assignment: Assignment | null) => void;

  // Actions - Students & Grading
  fetchStudents: (courseId: string) => Promise<void>;
  fetchGradebook: (courseId: string) => Promise<{ gradebook: GradebookEntry[]; quizzes: any[]; assignments: any[] } | null>;
  fetchPendingSubmissions: (courseId: string) => Promise<void>;
  gradeSubmission: (submissionId: string, data: { score: number; feedback?: string; rubricScores?: Record<string, number> }) => Promise<boolean>;

  // Actions - Analytics
  fetchAnalytics: (courseId: string) => Promise<CourseAnalytics | null>;

  // Actions - Quiz by Lesson
  fetchQuizByLessonId: (lessonId: string) => Promise<Quiz | null>;

  // Actions - Rubrics
  fetchRubrics: () => Promise<void>;
  fetchRubric: (rubricId: string) => Promise<Rubric | null>;
  createRubric: (data: { title: string; description?: string; criteria: RubricCriterion[]; isTemplate?: boolean }) => Promise<Rubric | null>;
  updateRubric: (rubricId: string, data: Partial<{ title: string; description?: string; criteria: RubricCriterion[]; isTemplate?: boolean }>) => Promise<boolean>;
  deleteRubric: (rubricId: string) => Promise<boolean>;
  duplicateRubric: (rubricId: string, newTitle?: string) => Promise<Rubric | null>;
  setEditingRubric: (rubric: Rubric | null) => void;

  // Utility
  clearError: () => void;
  clearEditingState: () => void;
}

export const useInstructorStore = create<InstructorState>((set, get) => ({
  // Initial state
  myCourses: [],
  currentEditingCourse: null,
  editingModules: [],
  editingLessons: [],
  editingQuiz: null,
  editingQuestions: [],
  editingAssignment: null,
  enrolledStudents: [],
  gradebook: [],
  pendingSubmissions: [],
  rubrics: [],
  editingRubric: null,
  isLoading: false,
  isSaving: false,
  error: null,

  // Fetch instructor's courses
  fetchMyCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/instructor/courses`) as { courses: Course[] };
      set({ myCourses: response.courses || [] });
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      set({ error: error.message || 'Failed to fetch courses' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new course
  createCourse: async (data: CreateCourseInput) => {
    set({ isSaving: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/courses`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Add to list
      set(state => ({
        myCourses: [
          { ...data, id: response.id, slug: response.slug, status: 'draft' } as Course,
          ...state.myCourses,
        ],
      }));

      return response.id;
    } catch (error: any) {
      console.error('Error creating course:', error);
      set({ error: error.message || 'Failed to create course' });
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  // Update a course
  updateCourse: async (courseId: string, data: Partial<CreateCourseInput>) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      // Update in list
      set(state => ({
        myCourses: state.myCourses.map(c =>
          c.id === courseId ? { ...c, ...data } : c
        ),
        currentEditingCourse: state.currentEditingCourse?.id === courseId
          ? { ...state.currentEditingCourse, ...data }
          : state.currentEditingCourse,
      }));

      return true;
    } catch (error: any) {
      console.error('Error updating course:', error);
      set({ error: error.message || 'Failed to update course' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Delete a course
  deleteCourse: async (courseId: string) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/courses/${courseId}`, {
        method: 'DELETE',
      });

      set(state => ({
        myCourses: state.myCourses.filter(c => c.id !== courseId),
      }));

      return true;
    } catch (error: any) {
      console.error('Error deleting course:', error);
      set({ error: error.message || 'Failed to delete course' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Publish a course
  publishCourse: async (courseId: string) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/courses/${courseId}/publish`, {
        method: 'POST',
      });

      set(state => ({
        myCourses: state.myCourses.map(c =>
          c.id === courseId ? { ...c, status: 'published' as const } : c
        ),
        currentEditingCourse: state.currentEditingCourse?.id === courseId
          ? { ...state.currentEditingCourse, status: 'published' as const }
          : state.currentEditingCourse,
      }));

      return true;
    } catch (error: any) {
      console.error('Error publishing course:', error);
      set({ error: error.message || 'Failed to publish course' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Unpublish a course
  unpublishCourse: async (courseId: string) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'draft' }),
      });

      set(state => ({
        myCourses: state.myCourses.map(c =>
          c.id === courseId ? { ...c, status: 'draft' as const } : c
        ),
      }));

      return true;
    } catch (error: any) {
      console.error('Error unpublishing course:', error);
      set({ error: error.message || 'Failed to unpublish course' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Set editing course
  setEditingCourse: (course) => {
    set({
      currentEditingCourse: course,
      editingModules: [],
      editingLessons: [],
    });
  },

  // Fetch course for editing
  fetchCourseForEditing: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const course = await authFetch(`${API_BASE}/lms/courses/${courseId}`) as any;

      // Extract modules and lessons
      const modules = course.modules || [];
      const lessons: Lesson[] = [];
      modules.forEach((m: any) => {
        if (m.lessons) {
          lessons.push(...m.lessons);
        }
      });

      set({
        currentEditingCourse: course,
        editingModules: modules,
        editingLessons: lessons,
      });
    } catch (error: any) {
      console.error('Error fetching course:', error);
      set({ error: error.message || 'Failed to fetch course' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a module
  createModule: async (data: CreateModuleInput) => {
    set({ isSaving: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/modules`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const newModule: Module = {
        id: response.id,
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        sortOrder: response.sortOrder,
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set(state => ({
        editingModules: [...state.editingModules, newModule],
      }));

      return newModule;
    } catch (error: any) {
      console.error('Error creating module:', error);
      set({ error: error.message || 'Failed to create module' });
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  // Update a module
  updateModule: async (moduleId: string, data: Partial<CreateModuleInput>) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/modules/${moduleId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      set(state => ({
        editingModules: state.editingModules.map(m =>
          m.id === moduleId ? { ...m, ...data } : m
        ),
      }));

      return true;
    } catch (error: any) {
      console.error('Error updating module:', error);
      set({ error: error.message || 'Failed to update module' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Delete a module
  deleteModule: async (moduleId: string) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/modules/${moduleId}`, {
        method: 'DELETE',
      });

      set(state => ({
        editingModules: state.editingModules.filter(m => m.id !== moduleId),
        editingLessons: state.editingLessons.filter(l => l.moduleId !== moduleId),
      }));

      return true;
    } catch (error: any) {
      console.error('Error deleting module:', error);
      set({ error: error.message || 'Failed to delete module' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Reorder modules
  reorderModules: async (moduleIds: string[]) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/modules/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ moduleIds }),
      });

      set(state => ({
        editingModules: moduleIds.map((id, index) => {
          const module = state.editingModules.find(m => m.id === id);
          return module ? { ...module, sortOrder: index } : module!;
        }).filter(Boolean),
      }));

      return true;
    } catch (error: any) {
      console.error('Error reordering modules:', error);
      set({ error: error.message || 'Failed to reorder modules' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Create a lesson
  createLesson: async (data: CreateLessonInput) => {
    set({ isSaving: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/lessons`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const newLesson: Lesson = {
        id: response.id,
        moduleId: data.moduleId,
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        contentType: data.contentType,
        content: data.content,
        documentId: data.documentId,
        videoUrl: data.videoUrl,
        videoProvider: data.videoProvider,
        embedCode: data.embedCode,
        sortOrder: response.sortOrder,
        estimatedDuration: data.estimatedDuration || 0,
        isRequired: data.isRequired !== false,
        isPreviewable: data.isPreviewable || false,
        xpReward: data.xpReward || 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set(state => ({
        editingLessons: [...state.editingLessons, newLesson],
      }));

      return newLesson;
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      set({ error: error.message || 'Failed to create lesson' });
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  // Update a lesson
  updateLesson: async (lessonId: string, data: Partial<CreateLessonInput>) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      set(state => ({
        editingLessons: state.editingLessons.map(l =>
          l.id === lessonId ? { ...l, ...data } : l
        ),
      }));

      return true;
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      set({ error: error.message || 'Failed to update lesson' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Delete a lesson
  deleteLesson: async (lessonId: string) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      set(state => ({
        editingLessons: state.editingLessons.filter(l => l.id !== lessonId),
      }));

      return true;
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      set({ error: error.message || 'Failed to delete lesson' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Reorder lessons
  reorderLessons: async (moduleId: string, lessonIds: string[]) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/lessons/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ moduleId, lessonIds }),
      });

      set(state => ({
        editingLessons: state.editingLessons.map(l => {
          if (l.moduleId === moduleId) {
            const index = lessonIds.indexOf(l.id);
            return index >= 0 ? { ...l, sortOrder: index } : l;
          }
          return l;
        }),
      }));

      return true;
    } catch (error: any) {
      console.error('Error reordering lessons:', error);
      set({ error: error.message || 'Failed to reorder lessons' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Create a quiz
  createQuiz: async (data: CreateQuizInput) => {
    set({ isSaving: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/quizzes`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const newQuiz: Quiz = {
        id: response.id,
        lessonId: data.lessonId,
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        quizType: data.quizType || 'standard',
        passingScore: data.passingScore || 70,
        timeLimit: data.timeLimit,
        maxAttempts: data.maxAttempts || 3,
        shuffleQuestions: data.shuffleQuestions || false,
        shuffleOptions: data.shuffleOptions || false,
        showCorrectAnswers: data.showCorrectAnswers !== false,
        showExplanations: data.showExplanations !== false,
        allowReview: true,
        xpReward: data.xpReward || 25,
        questionCount: 0,
        totalPoints: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({ editingQuiz: newQuiz, editingQuestions: [] });

      return newQuiz;
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      set({ error: error.message || 'Failed to create quiz' });
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  // Update a quiz
  updateQuiz: async (quizId: string, data: Partial<CreateQuizInput>) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/quizzes/${quizId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      set(state => ({
        editingQuiz: state.editingQuiz?.id === quizId
          ? { ...state.editingQuiz, ...data }
          : state.editingQuiz,
      }));

      return true;
    } catch (error: any) {
      console.error('Error updating quiz:', error);
      set({ error: error.message || 'Failed to update quiz' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Delete a quiz
  deleteQuiz: async (quizId: string) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      set(state => ({
        editingQuiz: state.editingQuiz?.id === quizId ? null : state.editingQuiz,
        editingQuestions: state.editingQuiz?.id === quizId ? [] : state.editingQuestions,
      }));

      return true;
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      set({ error: error.message || 'Failed to delete quiz' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Set editing quiz
  setEditingQuiz: (quiz) => {
    set({
      editingQuiz: quiz,
      editingQuestions: quiz?.questions || [],
    });
  },

  // Add a question
  addQuestion: async (data: CreateQuestionInput) => {
    set({ isSaving: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/quizzes/${data.quizId}/questions`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const newQuestion: QuizQuestion = {
        id: response.id,
        quizId: data.quizId,
        questionType: data.questionType,
        question: data.question,
        questionHtml: data.questionHtml,
        options: data.options?.map((o, i) => ({ id: `opt_${i}`, ...o })),
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        hints: data.hints,
        points: data.points || 1,
        sortOrder: get().editingQuestions.length,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
      };

      set(state => ({
        editingQuestions: [...state.editingQuestions, newQuestion],
        editingQuiz: state.editingQuiz ? {
          ...state.editingQuiz,
          questionCount: state.editingQuiz.questionCount + 1,
          totalPoints: state.editingQuiz.totalPoints + (data.points || 1),
        } : null,
      }));

      return newQuestion;
    } catch (error: any) {
      console.error('Error adding question:', error);
      set({ error: error.message || 'Failed to add question' });
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  // Update a question
  updateQuestion: async (questionId: string, data: Partial<CreateQuestionInput>) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/questions/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      set(state => ({
        editingQuestions: state.editingQuestions.map(q =>
          q.id === questionId ? { ...q, ...data } : q
        ),
      }));

      return true;
    } catch (error: any) {
      console.error('Error updating question:', error);
      set({ error: error.message || 'Failed to update question' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Delete a question
  deleteQuestion: async (questionId: string) => {
    set({ isSaving: true, error: null });
    try {
      const question = get().editingQuestions.find(q => q.id === questionId);

      await authFetch(`${API_BASE}/lms/questions/${questionId}`, {
        method: 'DELETE',
      });

      set(state => ({
        editingQuestions: state.editingQuestions.filter(q => q.id !== questionId),
        editingQuiz: state.editingQuiz && question ? {
          ...state.editingQuiz,
          questionCount: Math.max(0, state.editingQuiz.questionCount - 1),
          totalPoints: Math.max(0, state.editingQuiz.totalPoints - (question.points || 1)),
        } : state.editingQuiz,
      }));

      return true;
    } catch (error: any) {
      console.error('Error deleting question:', error);
      set({ error: error.message || 'Failed to delete question' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Reorder questions
  reorderQuestions: async (quizId: string, questionIds: string[]) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/questions/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ quizId, questionIds }),
      });

      set(state => ({
        editingQuestions: questionIds.map((id, index) => {
          const question = state.editingQuestions.find(q => q.id === id);
          return question ? { ...question, sortOrder: index } : question!;
        }).filter(Boolean),
      }));

      return true;
    } catch (error: any) {
      console.error('Error reordering questions:', error);
      set({ error: error.message || 'Failed to reorder questions' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Create an assignment
  createAssignment: async (data: CreateAssignmentInput) => {
    set({ isSaving: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/assignments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const newAssignment: Assignment = {
        id: response.id,
        lessonId: data.lessonId,
        courseId: data.courseId,
        title: data.title,
        instructions: data.instructions,
        submissionType: data.submissionType || 'file',
        allowedFileTypes: data.allowedFileTypes,
        maxFileSize: data.maxFileSize || 10485760,
        maxFiles: data.maxFiles || 5,
        dueDate: data.dueDate,
        latePenalty: data.latePenalty || 0,
        maxScore: data.maxScore || 100,
        rubricId: data.rubricId,
        requiresPeerReview: data.requiresPeerReview || false,
        peerReviewCount: data.peerReviewCount || 2,
        isGroupAssignment: false,
        maxGroupSize: 4,
        xpReward: data.xpReward || 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({ editingAssignment: newAssignment });

      return newAssignment;
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      set({ error: error.message || 'Failed to create assignment' });
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  // Update an assignment
  updateAssignment: async (assignmentId: string, data: Partial<CreateAssignmentInput>) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/assignments/${assignmentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      set(state => ({
        editingAssignment: state.editingAssignment?.id === assignmentId
          ? { ...state.editingAssignment, ...data }
          : state.editingAssignment,
      }));

      return true;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      set({ error: error.message || 'Failed to update assignment' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Delete an assignment
  deleteAssignment: async (assignmentId: string) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      set(state => ({
        editingAssignment: state.editingAssignment?.id === assignmentId ? null : state.editingAssignment,
      }));

      return true;
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      set({ error: error.message || 'Failed to delete assignment' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Set editing assignment
  setEditingAssignment: (assignment) => {
    set({ editingAssignment: assignment });
  },

  // Fetch enrolled students
  fetchStudents: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/instructor/courses/${courseId}/students`) as { students: EnrolledStudent[] };
      set({ enrolledStudents: response.students || [] });
    } catch (error: any) {
      console.error('Error fetching students:', error);
      set({ error: error.message || 'Failed to fetch students' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch gradebook
  fetchGradebook: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/instructor/courses/${courseId}/grades`) as {
        gradebook: GradebookEntry[];
        quizzes: any[];
        assignments: any[];
      };
      set({ gradebook: response.gradebook || [] });
      return response; // Return full response for component to use
    } catch (error: any) {
      console.error('Error fetching gradebook:', error);
      set({ error: error.message || 'Failed to fetch gradebook' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch pending submissions
  fetchPendingSubmissions: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/instructor/courses/${courseId}/submissions?status=submitted`) as { submissions: AssignmentSubmission[] };
      set({ pendingSubmissions: response.submissions || [] });
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      set({ error: error.message || 'Failed to fetch submissions' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Grade a submission
  gradeSubmission: async (submissionId: string, data: { score: number; feedback?: string; rubricScores?: Record<string, number> }) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/submissions/${submissionId}/grade`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Remove from pending
      set(state => ({
        pendingSubmissions: state.pendingSubmissions.filter(s => s.id !== submissionId),
      }));

      return true;
    } catch (error: any) {
      console.error('Error grading submission:', error);
      set({ error: error.message || 'Failed to grade submission' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Fetch course analytics
  fetchAnalytics: async (courseId: string): Promise<CourseAnalytics | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/instructor/courses/${courseId}/analytics`) as CourseAnalytics;
      return response;
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      set({ error: error.message || 'Failed to fetch analytics' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch quiz by lesson ID
  fetchQuizByLessonId: async (lessonId: string): Promise<Quiz | null> => {
    try {
      const response = await authFetch(`${API_BASE}/lms/lessons/${lessonId}/quiz`) as Quiz;
      return response;
    } catch (error: any) {
      console.error('Error fetching quiz by lesson:', error);
      return null;
    }
  },

  // Fetch all rubrics for current instructor
  fetchRubrics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/rubrics`) as { rubrics: Rubric[] };
      set({ rubrics: response.rubrics || [] });
    } catch (error: any) {
      console.error('Error fetching rubrics:', error);
      set({ error: error.message || 'Failed to fetch rubrics' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch single rubric
  fetchRubric: async (rubricId: string): Promise<Rubric | null> => {
    try {
      const response = await authFetch(`${API_BASE}/lms/rubrics/${rubricId}`) as Rubric;
      return response;
    } catch (error: any) {
      console.error('Error fetching rubric:', error);
      return null;
    }
  },

  // Create a new rubric
  createRubric: async (data: { title: string; description?: string; criteria: RubricCriterion[]; isTemplate?: boolean }) => {
    set({ isSaving: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/rubrics`, {
        method: 'POST',
        body: JSON.stringify(data),
      }) as { rubric: Rubric };

      set(state => ({
        rubrics: [response.rubric, ...state.rubrics],
      }));

      return response.rubric;
    } catch (error: any) {
      console.error('Error creating rubric:', error);
      set({ error: error.message || 'Failed to create rubric' });
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  // Update a rubric
  updateRubric: async (rubricId: string, data: Partial<{ title: string; description?: string; criteria: RubricCriterion[]; isTemplate?: boolean }>) => {
    set({ isSaving: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/rubrics/${rubricId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }) as { rubric: Rubric };

      set(state => ({
        rubrics: state.rubrics.map(r => r.id === rubricId ? response.rubric : r),
        editingRubric: state.editingRubric?.id === rubricId ? response.rubric : state.editingRubric,
      }));

      return true;
    } catch (error: any) {
      console.error('Error updating rubric:', error);
      set({ error: error.message || 'Failed to update rubric' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Delete a rubric
  deleteRubric: async (rubricId: string) => {
    set({ isSaving: true, error: null });
    try {
      await authFetch(`${API_BASE}/lms/rubrics/${rubricId}`, {
        method: 'DELETE',
      });

      set(state => ({
        rubrics: state.rubrics.filter(r => r.id !== rubricId),
        editingRubric: state.editingRubric?.id === rubricId ? null : state.editingRubric,
      }));

      return true;
    } catch (error: any) {
      console.error('Error deleting rubric:', error);
      set({ error: error.message || 'Failed to delete rubric' });
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  // Duplicate a rubric
  duplicateRubric: async (rubricId: string, newTitle?: string) => {
    set({ isSaving: true, error: null });
    try {
      const response = await authFetch(`${API_BASE}/lms/rubrics/${rubricId}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ newTitle }),
      }) as { rubric: Rubric };

      set(state => ({
        rubrics: [response.rubric, ...state.rubrics],
      }));

      return response.rubric;
    } catch (error: any) {
      console.error('Error duplicating rubric:', error);
      set({ error: error.message || 'Failed to duplicate rubric' });
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  // Set editing rubric
  setEditingRubric: (rubric) => {
    set({ editingRubric: rubric });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear editing state
  clearEditingState: () => set({
    currentEditingCourse: null,
    editingModules: [],
    editingLessons: [],
    editingQuiz: null,
    editingQuestions: [],
    editingAssignment: null,
    editingRubric: null,
    error: null,
  }),
}));
