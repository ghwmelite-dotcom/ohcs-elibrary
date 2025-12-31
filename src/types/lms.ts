/**
 * Learning Management System (LMS) Types
 * Complete type definitions for courses, lessons, quizzes, assignments, and certifications
 */

// =====================================================
// ENUMS AND CONSTANTS
// =====================================================

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'pending_review' | 'published' | 'archived';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'expired';
export type LessonStatus = 'not_started' | 'in_progress' | 'completed';
export type LessonContentType = 'text' | 'document' | 'video' | 'embed' | 'quiz' | 'assignment' | 'discussion';
export type VideoProvider = 'youtube' | 'vimeo' | 'direct';
export type QuizType = 'standard' | 'final' | 'practice' | 'diagnostic';
export type QuestionType = 'multiple_choice' | 'multiple_select' | 'true_false' | 'short_answer' | 'matching' | 'fill_blank';
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'timed_out';
export type SubmissionType = 'file' | 'text' | 'url' | 'mixed';
export type SubmissionStatus = 'draft' | 'submitted' | 'late' | 'graded' | 'returned';
export type PeerReviewStatus = 'pending' | 'completed';

// =====================================================
// COURSE TYPES
// =====================================================

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  instructorId: string;
  instructor?: CourseInstructor;
  category: string;
  categoryInfo?: CourseCategory;
  level: CourseLevel;
  status: CourseStatus;
  estimatedDuration: number; // minutes
  tags: string[];
  objectives: string[];
  prerequisites?: string[];
  passingScore: number;
  xpReward: number;
  enrollmentCount: number;
  completionCount: number;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  // Computed fields
  modules?: Module[];
  lessonCount?: number;
  isEnrolled?: boolean;
  userProgress?: number;
}

export interface CourseInstructor {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  bio?: string;
  courseCount?: number;
  studentCount?: number;
  rating?: number;
}

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  courseCount: number;
}

export interface CourseWithDetails extends Course {
  modules: ModuleWithLessons[];
  enrollment?: Enrollment;
  reviews?: CourseReview[];
  announcements?: Announcement[];
}

// =====================================================
// MODULE TYPES
// =====================================================

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  sortOrder: number;
  isLocked: boolean;
  unlockAfterModuleId?: string;
  createdAt: string;
  updatedAt: string;
  // Computed
  lessonCount?: number;
  completedLessons?: number;
  duration?: number;
  isCompleted?: boolean;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

// =====================================================
// LESSON TYPES
// =====================================================

export interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description?: string;
  contentType: LessonContentType;
  content?: string; // Rich text for text lessons
  documentId?: string;
  document?: { id: string; title: string; url: string };
  videoUrl?: string;
  videoProvider?: VideoProvider;
  videoDuration?: number; // seconds
  embedCode?: string;
  sortOrder: number;
  estimatedDuration: number; // minutes
  isRequired: boolean;
  isPreviewable: boolean;
  xpReward: number;
  createdAt: string;
  updatedAt: string;
  // Progress
  progress?: LessonProgress;
  quiz?: Quiz;
  assignment?: Assignment;
}

export interface LessonProgress {
  id: string;
  lessonId: string;
  userId: string;
  enrollmentId: string;
  status: LessonStatus;
  timeSpent: number; // seconds
  videoProgress: number; // percentage
  videoLastPosition: number; // seconds
  scrollProgress: number; // percentage
  attempts: number;
  score?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface LessonWithContent extends Lesson {
  progress?: LessonProgress;
  nextLesson?: { id: string; title: string; moduleId: string };
  prevLesson?: { id: string; title: string; moduleId: string };
}

// =====================================================
// ENROLLMENT TYPES
// =====================================================

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  progress: number; // percentage
  lessonsCompleted: number;
  totalLessons: number;
  timeSpent: number; // seconds
  lastAccessedAt?: string;
  lastLessonId?: string;
  finalGrade?: number;
  certificateId?: string;
  enrolledAt: string;
  completedAt?: string;
  droppedAt?: string;
  // Joined data
  course?: Course;
  certificate?: Certificate;
}

export interface EnrollmentWithProgress extends Enrollment {
  course: Course;
  currentLesson?: Lesson;
  recentActivity?: LessonProgress[];
}

// =====================================================
// QUIZ TYPES
// =====================================================

export interface Quiz {
  id: string;
  lessonId?: string;
  courseId: string;
  title: string;
  description?: string;
  instructions?: string;
  quizType: QuizType;
  passingScore: number;
  timeLimit?: number; // minutes
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  allowReview: boolean;
  xpReward: number;
  questionCount: number;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
  // Computed
  questions?: QuizQuestion[];
  userAttempts?: QuizAttempt[];
  bestAttempt?: QuizAttempt;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionType: QuestionType;
  question: string;
  questionHtml?: string;
  options?: QuestionOption[];
  correctAnswer?: string | string[] | Record<string, string>; // Varies by type
  explanation?: string;
  explanationHtml?: string;
  hints?: string[];
  points: number;
  sortOrder: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
}

export interface QuestionOption {
  id?: string; // Optional when creating, required when fetched
  text: string;
  isCorrect?: boolean; // Only visible after submission
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  enrollmentId?: string;
  attemptNumber: number;
  status: AttemptStatus;
  answers: Record<string, QuestionAnswer>;
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed: boolean;
  timeSpent: number; // seconds
  timeStarted: string;
  timeSubmitted?: string;
  gradedAt?: string;
  gradedById?: string;
  feedback?: string;
  xpAwarded: number;
}

export interface QuestionAnswer {
  answer: string | string[] | Record<string, string>;
  isCorrect?: boolean;
  points?: number;
}

export interface QuizWithQuestions extends Quiz {
  questions: QuizQuestion[];
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  quiz: Quiz;
  questions: QuizQuestion[];
}

// =====================================================
// ASSIGNMENT TYPES
// =====================================================

export interface Assignment {
  id: string;
  lessonId?: string;
  courseId: string;
  title: string;
  instructions?: string;
  instructionsHtml?: string;
  submissionType: SubmissionType;
  allowedFileTypes?: string[];
  maxFileSize: number; // bytes
  maxFiles: number;
  dueDate?: string;
  latePenalty: number; // percentage per day
  maxScore: number;
  rubricId?: string;
  rubric?: Rubric;
  requiresPeerReview: boolean;
  peerReviewCount: number;
  peerReviewDueDate?: string;
  isGroupAssignment: boolean;
  maxGroupSize: number;
  xpReward: number;
  createdAt: string;
  updatedAt: string;
  // Computed
  userSubmission?: AssignmentSubmission;
  peerReviewsAssigned?: PeerReview[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  enrollmentId?: string;
  groupId?: string;
  content?: string;
  contentHtml?: string;
  files?: SubmissionFile[];
  urls?: string[];
  status: SubmissionStatus;
  score?: number;
  maxScore?: number;
  percentage?: number;
  feedback?: string;
  feedbackHtml?: string;
  rubricScores?: Record<string, number>;
  isLate: boolean;
  daysLate: number;
  latePenaltyApplied: number;
  submittedAt?: string;
  gradedAt?: string;
  gradedById?: string;
  returnedAt?: string;
  xpAwarded: number;
  createdAt: string;
  updatedAt: string;
  // Joined
  user?: { id: string; name: string; avatar?: string };
  peerReviews?: PeerReview[];
}

export interface SubmissionFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

// =====================================================
// RUBRIC TYPES
// =====================================================

export interface Rubric {
  id: string;
  title: string;
  description?: string;
  criteria: RubricCriterion[];
  maxScore: number;
  instructorId: string;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description?: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  label: string;
  description?: string;
}

// =====================================================
// PEER REVIEW TYPES
// =====================================================

export interface PeerReview {
  id: string;
  submissionId: string;
  reviewerId: string;
  assignmentId: string;
  status: PeerReviewStatus;
  scores?: Record<string, { score: number; feedback?: string }>;
  totalScore?: number;
  overallFeedback?: string;
  isAnonymous: boolean;
  helpfulVotes: number;
  assignedAt: string;
  submittedAt?: string;
  // Joined
  submission?: AssignmentSubmission;
  reviewer?: { id: string; name: string; avatar?: string };
}

// =====================================================
// DISCUSSION TYPES
// =====================================================

export interface Discussion {
  id: string;
  courseId: string;
  lessonId?: string;
  authorId: string;
  author?: { id: string; name: string; avatar?: string; role?: string };
  title: string;
  content: string;
  contentHtml?: string;
  isPinned: boolean;
  isLocked: boolean;
  isGraded: boolean;
  minRepliesRequired: number;
  pointsValue: number;
  dueDate?: string;
  viewCount: number;
  replyCount: number;
  lastReplyAt?: string;
  lastReplyById?: string;
  createdAt: string;
  updatedAt: string;
  // Computed
  replies?: DiscussionReply[];
  userParticipation?: DiscussionParticipation;
}

export interface DiscussionReply {
  id: string;
  discussionId: string;
  authorId: string;
  author?: { id: string; name: string; avatar?: string; role?: string };
  parentId?: string;
  content: string;
  contentHtml?: string;
  isInstructorPost: boolean;
  isAnswer: boolean;
  likes: number;
  createdAt: string;
  updatedAt: string;
  // Nested replies
  replies?: DiscussionReply[];
  isLikedByUser?: boolean;
}

export interface DiscussionParticipation {
  id: string;
  discussionId: string;
  userId: string;
  enrollmentId: string;
  replyCount: number;
  pointsEarned: number;
  isComplete: boolean;
  completedAt?: string;
}

// =====================================================
// CERTIFICATE TYPES
// =====================================================

export interface Certificate {
  id: string;
  courseId: string;
  userId: string;
  enrollmentId: string;
  templateId?: string;
  certificateNumber: string;
  recipientName: string;
  courseTitle: string;
  instructorName?: string;
  completionDate: string;
  grade?: number;
  gradeLabel?: string;
  timeSpent?: number; // seconds
  pdfUrl?: string;
  imageUrl?: string;
  verificationUrl?: string;
  qrCode?: string;
  badgeId?: string;
  metadata?: Record<string, unknown>;
  issuedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  templateHtml: string;
  templateCss?: string;
  thumbnailUrl?: string;
  isDefault: boolean;
  isActive: boolean;
  variables?: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// ANNOUNCEMENT TYPES
// =====================================================

export interface Announcement {
  id: string;
  courseId: string;
  authorId: string;
  author?: { id: string; name: string; avatar?: string };
  title: string;
  content: string;
  contentHtml?: string;
  isPinned: boolean;
  isPublished: boolean;
  scheduledAt?: string;
  sendEmail: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// REVIEW TYPES
// =====================================================

export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  user?: { id: string; name: string; avatar?: string };
  enrollmentId: string;
  rating: number;
  review?: string;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  instructorResponse?: string;
  instructorRespondedAt?: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// LEARNING PATH TYPES
// =====================================================

export interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  level: CourseLevel;
  estimatedDuration: number;
  courseCount: number;
  enrollmentCount: number;
  xpReward: number;
  badgeId?: string;
  isPublished: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  // Computed
  courses?: LearningPathCourse[];
  userEnrollment?: LearningPathEnrollment;
}

export interface LearningPathCourse {
  id: string;
  pathId: string;
  courseId: string;
  course?: Course;
  sortOrder: number;
  isRequired: boolean;
}

export interface LearningPathEnrollment {
  id: string;
  pathId: string;
  userId: string;
  status: EnrollmentStatus;
  progress: number;
  coursesCompleted: number;
  totalCourses: number;
  enrolledAt: string;
  completedAt?: string;
  certificateId?: string;
}

// =====================================================
// BOOKMARK & NOTES TYPES
// =====================================================

export interface Bookmark {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  course?: Course;
  lesson?: Lesson;
  note?: string;
  createdAt: string;
}

export interface LessonNote {
  id: string;
  userId: string;
  lessonId: string;
  enrollmentId: string;
  content: string;
  timestamp?: number; // For video notes
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CoursesListParams {
  search?: string;
  category?: string;
  level?: CourseLevel;
  status?: CourseStatus;
  instructorId?: string;
  sortBy?: 'newest' | 'popular' | 'rating' | 'title';
  page?: number;
  limit?: number;
}

export interface CoursesListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnrollResponse {
  enrollment: Enrollment;
  xpAwarded?: number;
}

export interface CompleteLessonResponse {
  progress: LessonProgress;
  xpAwarded: number;
  courseProgress: number;
  isModuleComplete: boolean;
  isCourseComplete: boolean;
  certificate?: Certificate;
}

export interface StartQuizResponse {
  attempt: QuizAttempt;
  questions: QuizQuestion[];
  timeLimit?: number;
}

export interface SubmitQuizResponse {
  attempt: QuizAttempt;
  results: {
    questionId: string;
    isCorrect: boolean;
    correctAnswer?: string | string[];
    explanation?: string;
    points: number;
  }[];
  xpAwarded: number;
  passed: boolean;
}

export interface SubmitAssignmentResponse {
  submission: AssignmentSubmission;
  xpAwarded?: number;
  peerReviewsAssigned?: PeerReview[];
}

export interface GradeSubmissionResponse {
  submission: AssignmentSubmission;
  xpAwarded: number;
}

export interface IssueCertificateResponse {
  certificate: Certificate;
  badgeAwarded?: { id: string; name: string; icon: string };
  xpAwarded: number;
}

// =====================================================
// INSTRUCTOR TYPES
// =====================================================

export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  totalRevenue?: number;
}

export interface CourseAnalytics {
  courseId: string;
  enrollments: number;
  completions: number;
  completionRate: number;
  averageProgress: number;
  averageTimeSpent: number;
  averageGrade: number;
  dropoutRate: number;
  engagement: {
    date: string;
    views: number;
    enrollments: number;
    completions: number;
  }[];
  lessonAnalytics: {
    lessonId: string;
    title: string;
    views: number;
    completionRate: number;
    averageTimeSpent: number;
    dropoffRate: number;
  }[];
}

export interface GradebookEntry {
  userId: string;
  user: { id: string; name: string; email: string; avatar?: string };
  enrollmentId: string;
  enrolledAt: string;
  progress: number;
  lessonsCompleted: number;
  timeSpent: number;
  quizGrades: { quizId: string; title: string; score: number; percentage: number }[];
  assignmentGrades: { assignmentId: string; title: string; score: number; percentage: number }[];
  finalGrade?: number;
  status: EnrollmentStatus;
  certificateIssued: boolean;
}

export interface CreateCourseInput {
  title: string;
  description?: string;
  shortDescription?: string;
  category: string;
  level: CourseLevel;
  objectives?: string[];
  tags?: string[];
  thumbnailUrl?: string;
  passingScore?: number;
  xpReward?: number;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {
  status?: CourseStatus;
}

export interface CreateModuleInput {
  courseId: string;
  title: string;
  description?: string;
  sortOrder?: number;
}

export interface CreateLessonInput {
  moduleId: string;
  courseId: string;
  title: string;
  description?: string;
  contentType: LessonContentType;
  content?: string;
  documentId?: string;
  videoUrl?: string;
  videoProvider?: VideoProvider;
  embedCode?: string;
  sortOrder?: number;
  estimatedDuration?: number;
  isRequired?: boolean;
  isPreviewable?: boolean;
  xpReward?: number;
}

export interface CreateQuizInput {
  lessonId?: string;
  courseId: string;
  title: string;
  description?: string;
  instructions?: string;
  quizType?: QuizType;
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showCorrectAnswers?: boolean;
  showExplanations?: boolean;
  xpReward?: number;
}

export interface CreateQuestionInput {
  quizId: string;
  questionType: QuestionType;
  question: string;
  questionHtml?: string;
  options?: Array<{ id?: string; text: string; isCorrect?: boolean }>;
  correctAnswer: string | string[] | Record<string, string>;
  explanation?: string;
  explanationHtml?: string;
  hints?: string[];
  points?: number;
  sortOrder?: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
}

export interface CreateAssignmentInput {
  lessonId?: string;
  courseId: string;
  title: string;
  instructions?: string;
  submissionType?: SubmissionType;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  dueDate?: string;
  latePenalty?: number;
  maxScore?: number;
  rubricId?: string;
  requiresPeerReview?: boolean;
  peerReviewCount?: number;
  xpReward?: number;
}
