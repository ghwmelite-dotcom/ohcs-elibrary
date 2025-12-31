-- Learning Management System (LMS) Tables
-- Migration 015: Complete LMS schema for Ghana Civil Service training platform

-- =====================================================
-- COURSES
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  shortDescription TEXT,
  thumbnailUrl TEXT,
  instructorId TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  status TEXT DEFAULT 'draft', -- draft, pending_review, published, archived
  estimatedDuration INTEGER DEFAULT 0, -- in minutes
  tags TEXT, -- JSON array
  objectives TEXT, -- JSON array
  prerequisites TEXT, -- JSON array of course IDs
  passingScore INTEGER DEFAULT 70,
  xpReward INTEGER DEFAULT 100,
  enrollmentCount INTEGER DEFAULT 0,
  completionCount INTEGER DEFAULT 0,
  averageRating REAL DEFAULT 0,
  ratingCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  publishedAt TEXT,
  FOREIGN KEY (instructorId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_courses_instructor ON lms_courses(instructorId);
CREATE INDEX IF NOT EXISTS idx_lms_courses_status ON lms_courses(status);
CREATE INDEX IF NOT EXISTS idx_lms_courses_category ON lms_courses(category);
CREATE INDEX IF NOT EXISTS idx_lms_courses_slug ON lms_courses(slug);

-- =====================================================
-- MODULES (Course Sections)
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_modules (
  id TEXT PRIMARY KEY,
  courseId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sortOrder INTEGER DEFAULT 0,
  isLocked INTEGER DEFAULT 0,
  unlockAfterModuleId TEXT, -- Prerequisite module
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (unlockAfterModuleId) REFERENCES lms_modules(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_modules_course ON lms_modules(courseId);

-- =====================================================
-- LESSONS (Content Units)
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_lessons (
  id TEXT PRIMARY KEY,
  moduleId TEXT NOT NULL,
  courseId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  contentType TEXT NOT NULL, -- text, document, video, embed, quiz, assignment, discussion
  content TEXT, -- Rich text content for text lessons
  documentId TEXT, -- Reference to documents table
  videoUrl TEXT,
  videoProvider TEXT, -- youtube, vimeo, direct
  videoDuration INTEGER DEFAULT 0, -- in seconds
  embedCode TEXT, -- For custom embeds
  sortOrder INTEGER DEFAULT 0,
  estimatedDuration INTEGER DEFAULT 0, -- in minutes
  isRequired INTEGER DEFAULT 1,
  isPreviewable INTEGER DEFAULT 0, -- Can be viewed without enrollment
  xpReward INTEGER DEFAULT 10,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (moduleId) REFERENCES lms_modules(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (documentId) REFERENCES documents(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_lessons_module ON lms_lessons(moduleId);
CREATE INDEX IF NOT EXISTS idx_lms_lessons_course ON lms_lessons(courseId);

-- =====================================================
-- ENROLLMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_enrollments (
  id TEXT PRIMARY KEY,
  courseId TEXT NOT NULL,
  userId TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, completed, dropped, expired
  progress INTEGER DEFAULT 0, -- Percentage 0-100
  lessonsCompleted INTEGER DEFAULT 0,
  totalLessons INTEGER DEFAULT 0,
  timeSpent INTEGER DEFAULT 0, -- in seconds
  lastAccessedAt TEXT,
  lastLessonId TEXT, -- Resume position
  finalGrade REAL,
  certificateId TEXT,
  enrolledAt TEXT DEFAULT (datetime('now')),
  completedAt TEXT,
  droppedAt TEXT,
  UNIQUE(courseId, userId),
  FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lastLessonId) REFERENCES lms_lessons(id),
  FOREIGN KEY (certificateId) REFERENCES lms_certificates(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_enrollments_user ON lms_enrollments(userId);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_course ON lms_enrollments(courseId);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_status ON lms_enrollments(status);

-- =====================================================
-- LESSON PROGRESS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_lesson_progress (
  id TEXT PRIMARY KEY,
  lessonId TEXT NOT NULL,
  userId TEXT NOT NULL,
  enrollmentId TEXT NOT NULL,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  timeSpent INTEGER DEFAULT 0, -- in seconds
  videoProgress INTEGER DEFAULT 0, -- Percentage for video lessons
  videoLastPosition INTEGER DEFAULT 0, -- Last watched position in seconds
  scrollProgress INTEGER DEFAULT 0, -- Percentage for text/document lessons
  attempts INTEGER DEFAULT 0, -- For quiz/assignment lessons
  score REAL, -- For graded lessons
  startedAt TEXT,
  completedAt TEXT,
  UNIQUE(lessonId, userId),
  FOREIGN KEY (lessonId) REFERENCES lms_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollmentId) REFERENCES lms_enrollments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_lesson_progress_user ON lms_lesson_progress(userId);
CREATE INDEX IF NOT EXISTS idx_lms_lesson_progress_lesson ON lms_lesson_progress(lessonId);
CREATE INDEX IF NOT EXISTS idx_lms_lesson_progress_enrollment ON lms_lesson_progress(enrollmentId);

-- =====================================================
-- QUIZZES
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_quizzes (
  id TEXT PRIMARY KEY,
  lessonId TEXT, -- NULL for standalone final quizzes
  courseId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  quizType TEXT DEFAULT 'standard', -- standard, final, practice, diagnostic
  passingScore INTEGER DEFAULT 70,
  timeLimit INTEGER, -- in minutes, NULL for unlimited
  maxAttempts INTEGER DEFAULT 3, -- 0 for unlimited
  shuffleQuestions INTEGER DEFAULT 0,
  shuffleOptions INTEGER DEFAULT 0,
  showCorrectAnswers INTEGER DEFAULT 1, -- Show after submission
  showExplanations INTEGER DEFAULT 1,
  allowReview INTEGER DEFAULT 1, -- Allow reviewing after completion
  xpReward INTEGER DEFAULT 25,
  questionCount INTEGER DEFAULT 0,
  totalPoints INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lessonId) REFERENCES lms_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_quizzes_lesson ON lms_quizzes(lessonId);
CREATE INDEX IF NOT EXISTS idx_lms_quizzes_course ON lms_quizzes(courseId);

-- =====================================================
-- QUIZ QUESTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_quiz_questions (
  id TEXT PRIMARY KEY,
  quizId TEXT NOT NULL,
  questionType TEXT NOT NULL, -- multiple_choice, multiple_select, true_false, short_answer, matching, fill_blank
  question TEXT NOT NULL,
  questionHtml TEXT, -- Rich text version
  options TEXT, -- JSON array of {id, text, isCorrect?}
  correctAnswer TEXT, -- JSON - varies by question type
  explanation TEXT,
  explanationHtml TEXT,
  hints TEXT, -- JSON array
  points INTEGER DEFAULT 1,
  sortOrder INTEGER DEFAULT 0,
  mediaUrl TEXT, -- Image or video for question
  mediaType TEXT, -- image, video, audio
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (quizId) REFERENCES lms_quizzes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_quiz_questions_quiz ON lms_quiz_questions(quizId);

-- =====================================================
-- QUIZ ATTEMPTS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_quiz_attempts (
  id TEXT PRIMARY KEY,
  quizId TEXT NOT NULL,
  userId TEXT NOT NULL,
  enrollmentId TEXT,
  attemptNumber INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress', -- in_progress, submitted, graded, timed_out
  answers TEXT, -- JSON: {questionId: {answer, isCorrect, points}}
  score REAL,
  maxScore REAL,
  percentage REAL,
  passed INTEGER DEFAULT 0,
  timeSpent INTEGER DEFAULT 0, -- in seconds
  timeStarted TEXT DEFAULT (datetime('now')),
  timeSubmitted TEXT,
  gradedAt TEXT,
  gradedById TEXT, -- For manual grading
  feedback TEXT,
  xpAwarded INTEGER DEFAULT 0,
  FOREIGN KEY (quizId) REFERENCES lms_quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollmentId) REFERENCES lms_enrollments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_quiz_attempts_quiz ON lms_quiz_attempts(quizId);
CREATE INDEX IF NOT EXISTS idx_lms_quiz_attempts_user ON lms_quiz_attempts(userId);
CREATE INDEX IF NOT EXISTS idx_lms_quiz_attempts_enrollment ON lms_quiz_attempts(enrollmentId);

-- =====================================================
-- ASSIGNMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_assignments (
  id TEXT PRIMARY KEY,
  lessonId TEXT,
  courseId TEXT NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  instructionsHtml TEXT, -- Rich text
  submissionType TEXT DEFAULT 'file', -- file, text, url, mixed
  allowedFileTypes TEXT, -- JSON array: ["pdf", "docx", "doc"]
  maxFileSize INTEGER DEFAULT 10485760, -- 10MB default
  maxFiles INTEGER DEFAULT 5,
  dueDate TEXT,
  latePenalty REAL DEFAULT 0, -- Percentage per day late
  maxScore INTEGER DEFAULT 100,
  rubricId TEXT,
  requiresPeerReview INTEGER DEFAULT 0,
  peerReviewCount INTEGER DEFAULT 2,
  peerReviewDueDate TEXT,
  isGroupAssignment INTEGER DEFAULT 0,
  maxGroupSize INTEGER DEFAULT 4,
  xpReward INTEGER DEFAULT 50,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lessonId) REFERENCES lms_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (rubricId) REFERENCES lms_rubrics(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_assignments_lesson ON lms_assignments(lessonId);
CREATE INDEX IF NOT EXISTS idx_lms_assignments_course ON lms_assignments(courseId);

-- =====================================================
-- ASSIGNMENT SUBMISSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_assignment_submissions (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  enrollmentId TEXT,
  groupId TEXT, -- For group assignments
  content TEXT, -- Text submission
  contentHtml TEXT,
  files TEXT, -- JSON array: [{name, url, size, type}]
  urls TEXT, -- JSON array for URL submissions
  status TEXT DEFAULT 'draft', -- draft, submitted, late, graded, returned
  score REAL,
  maxScore REAL,
  percentage REAL,
  feedback TEXT,
  feedbackHtml TEXT,
  rubricScores TEXT, -- JSON: {criterionId: score}
  isLate INTEGER DEFAULT 0,
  daysLate INTEGER DEFAULT 0,
  latePenaltyApplied REAL DEFAULT 0,
  submittedAt TEXT,
  gradedAt TEXT,
  gradedById TEXT,
  returnedAt TEXT,
  xpAwarded INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES lms_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollmentId) REFERENCES lms_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (gradedById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_submissions_assignment ON lms_assignment_submissions(assignmentId);
CREATE INDEX IF NOT EXISTS idx_lms_submissions_user ON lms_assignment_submissions(userId);
CREATE INDEX IF NOT EXISTS idx_lms_submissions_status ON lms_assignment_submissions(status);

-- =====================================================
-- RUBRICS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_rubrics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  criteria TEXT NOT NULL, -- JSON array: [{id, name, description, levels: [{score, label, description}]}]
  maxScore INTEGER,
  instructorId TEXT NOT NULL,
  isTemplate INTEGER DEFAULT 0, -- Can be reused
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (instructorId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_rubrics_instructor ON lms_rubrics(instructorId);

-- =====================================================
-- PEER REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_peer_reviews (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  reviewerId TEXT NOT NULL,
  assignmentId TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed
  scores TEXT, -- JSON: {criterionId: {score, feedback}}
  totalScore REAL,
  overallFeedback TEXT,
  isAnonymous INTEGER DEFAULT 1,
  helpfulVotes INTEGER DEFAULT 0,
  assignedAt TEXT DEFAULT (datetime('now')),
  submittedAt TEXT,
  UNIQUE(submissionId, reviewerId),
  FOREIGN KEY (submissionId) REFERENCES lms_assignment_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignmentId) REFERENCES lms_assignments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_peer_reviews_submission ON lms_peer_reviews(submissionId);
CREATE INDEX IF NOT EXISTS idx_lms_peer_reviews_reviewer ON lms_peer_reviews(reviewerId);

-- =====================================================
-- DISCUSSIONS (Course-level and Lesson-level)
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_discussions (
  id TEXT PRIMARY KEY,
  courseId TEXT NOT NULL,
  lessonId TEXT, -- NULL for general course discussions
  authorId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  contentHtml TEXT,
  isPinned INTEGER DEFAULT 0,
  isLocked INTEGER DEFAULT 0,
  isGraded INTEGER DEFAULT 0, -- Participation counts toward grade
  minRepliesRequired INTEGER DEFAULT 0,
  pointsValue INTEGER DEFAULT 0,
  dueDate TEXT, -- For graded discussions
  viewCount INTEGER DEFAULT 0,
  replyCount INTEGER DEFAULT 0,
  lastReplyAt TEXT,
  lastReplyById TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lessonId) REFERENCES lms_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (authorId) REFERENCES users(id),
  FOREIGN KEY (lastReplyById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_discussions_course ON lms_discussions(courseId);
CREATE INDEX IF NOT EXISTS idx_lms_discussions_lesson ON lms_discussions(lessonId);
CREATE INDEX IF NOT EXISTS idx_lms_discussions_author ON lms_discussions(authorId);

-- =====================================================
-- DISCUSSION REPLIES
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_discussion_replies (
  id TEXT PRIMARY KEY,
  discussionId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  parentId TEXT, -- For nested replies
  content TEXT NOT NULL,
  contentHtml TEXT,
  isInstructorPost INTEGER DEFAULT 0,
  isAnswer INTEGER DEFAULT 0, -- Marked as best answer
  likes INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (discussionId) REFERENCES lms_discussions(id) ON DELETE CASCADE,
  FOREIGN KEY (authorId) REFERENCES users(id),
  FOREIGN KEY (parentId) REFERENCES lms_discussion_replies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_discussion_replies_discussion ON lms_discussion_replies(discussionId);
CREATE INDEX IF NOT EXISTS idx_lms_discussion_replies_author ON lms_discussion_replies(authorId);
CREATE INDEX IF NOT EXISTS idx_lms_discussion_replies_parent ON lms_discussion_replies(parentId);

-- =====================================================
-- DISCUSSION PARTICIPATION (for graded discussions)
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_discussion_participation (
  id TEXT PRIMARY KEY,
  discussionId TEXT NOT NULL,
  userId TEXT NOT NULL,
  enrollmentId TEXT NOT NULL,
  replyCount INTEGER DEFAULT 0,
  pointsEarned INTEGER DEFAULT 0,
  isComplete INTEGER DEFAULT 0,
  completedAt TEXT,
  UNIQUE(discussionId, userId),
  FOREIGN KEY (discussionId) REFERENCES lms_discussions(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollmentId) REFERENCES lms_enrollments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_discussion_participation_discussion ON lms_discussion_participation(discussionId);
CREATE INDEX IF NOT EXISTS idx_lms_discussion_participation_user ON lms_discussion_participation(userId);

-- =====================================================
-- DISCUSSION LIKES
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_discussion_likes (
  id TEXT PRIMARY KEY,
  replyId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(replyId, userId),
  FOREIGN KEY (replyId) REFERENCES lms_discussion_replies(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_discussion_likes_reply ON lms_discussion_likes(replyId);
CREATE INDEX IF NOT EXISTS idx_lms_discussion_likes_user ON lms_discussion_likes(userId);

-- =====================================================
-- CERTIFICATES
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_certificates (
  id TEXT PRIMARY KEY,
  courseId TEXT NOT NULL,
  userId TEXT NOT NULL,
  enrollmentId TEXT NOT NULL,
  templateId TEXT,
  certificateNumber TEXT UNIQUE NOT NULL,
  recipientName TEXT NOT NULL,
  courseTitle TEXT NOT NULL,
  instructorName TEXT,
  completionDate TEXT NOT NULL,
  grade REAL,
  gradeLabel TEXT, -- Distinction, Merit, Pass, etc.
  timeSpent INTEGER, -- Total time in seconds
  pdfUrl TEXT,
  imageUrl TEXT, -- For sharing
  verificationUrl TEXT,
  qrCode TEXT, -- Base64 QR code image
  badgeId TEXT, -- Linked gamification badge
  metadata TEXT, -- JSON: additional certificate data
  issuedAt TEXT DEFAULT (datetime('now')),
  expiresAt TEXT, -- For certifications with validity period
  revokedAt TEXT,
  revokedReason TEXT,
  FOREIGN KEY (courseId) REFERENCES lms_courses(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (enrollmentId) REFERENCES lms_enrollments(id),
  FOREIGN KEY (templateId) REFERENCES lms_certificate_templates(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_certificates_user ON lms_certificates(userId);
CREATE INDEX IF NOT EXISTS idx_lms_certificates_course ON lms_certificates(courseId);
CREATE INDEX IF NOT EXISTS idx_lms_certificates_number ON lms_certificates(certificateNumber);

-- =====================================================
-- CERTIFICATE TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_certificate_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  templateHtml TEXT NOT NULL,
  templateCss TEXT,
  thumbnailUrl TEXT,
  isDefault INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  variables TEXT, -- JSON: available merge fields
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

-- =====================================================
-- COURSE ANNOUNCEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_announcements (
  id TEXT PRIMARY KEY,
  courseId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  contentHtml TEXT,
  isPinned INTEGER DEFAULT 0,
  isPublished INTEGER DEFAULT 1,
  scheduledAt TEXT, -- For scheduled announcements
  sendEmail INTEGER DEFAULT 0, -- Email enrolled students
  viewCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (authorId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_announcements_course ON lms_announcements(courseId);

-- =====================================================
-- COURSE REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_course_reviews (
  id TEXT PRIMARY KEY,
  courseId TEXT NOT NULL,
  userId TEXT NOT NULL,
  enrollmentId TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  review TEXT,
  isVerifiedPurchase INTEGER DEFAULT 1,
  helpfulVotes INTEGER DEFAULT 0,
  instructorResponse TEXT,
  instructorRespondedAt TEXT,
  isHidden INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  UNIQUE(courseId, userId),
  FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollmentId) REFERENCES lms_enrollments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_course_reviews_course ON lms_course_reviews(courseId);
CREATE INDEX IF NOT EXISTS idx_lms_course_reviews_user ON lms_course_reviews(userId);

-- =====================================================
-- COURSE CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  parentId TEXT,
  sortOrder INTEGER DEFAULT 0,
  courseCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parentId) REFERENCES lms_categories(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_categories_parent ON lms_categories(parentId);
CREATE INDEX IF NOT EXISTS idx_lms_categories_slug ON lms_categories(slug);

-- =====================================================
-- BOOKMARKS (Save lessons/courses for later)
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_bookmarks (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  courseId TEXT,
  lessonId TEXT,
  note TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lessonId) REFERENCES lms_lessons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_bookmarks_user ON lms_bookmarks(userId);

-- =====================================================
-- NOTES (User notes on lessons)
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_notes (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  lessonId TEXT NOT NULL,
  enrollmentId TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER, -- For video notes, position in seconds
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lessonId) REFERENCES lms_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollmentId) REFERENCES lms_enrollments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_notes_user ON lms_notes(userId);
CREATE INDEX IF NOT EXISTS idx_lms_notes_lesson ON lms_notes(lessonId);

-- =====================================================
-- LEARNING PATHS (Course sequences)
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_learning_paths (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnailUrl TEXT,
  level TEXT DEFAULT 'beginner',
  estimatedDuration INTEGER DEFAULT 0,
  courseCount INTEGER DEFAULT 0,
  enrollmentCount INTEGER DEFAULT 0,
  xpReward INTEGER DEFAULT 500,
  badgeId TEXT,
  isPublished INTEGER DEFAULT 0,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lms_learning_paths_slug ON lms_learning_paths(slug);

-- =====================================================
-- LEARNING PATH COURSES (Junction table)
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_learning_path_courses (
  id TEXT PRIMARY KEY,
  pathId TEXT NOT NULL,
  courseId TEXT NOT NULL,
  sortOrder INTEGER DEFAULT 0,
  isRequired INTEGER DEFAULT 1,
  UNIQUE(pathId, courseId),
  FOREIGN KEY (pathId) REFERENCES lms_learning_paths(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_lp_courses_path ON lms_learning_path_courses(pathId);

-- =====================================================
-- LEARNING PATH ENROLLMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS lms_learning_path_enrollments (
  id TEXT PRIMARY KEY,
  pathId TEXT NOT NULL,
  userId TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  coursesCompleted INTEGER DEFAULT 0,
  totalCourses INTEGER DEFAULT 0,
  enrolledAt TEXT DEFAULT (datetime('now')),
  completedAt TEXT,
  certificateId TEXT,
  UNIQUE(pathId, userId),
  FOREIGN KEY (pathId) REFERENCES lms_learning_paths(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lms_lp_enrollments_user ON lms_learning_path_enrollments(userId);
CREATE INDEX IF NOT EXISTS idx_lms_lp_enrollments_path ON lms_learning_path_enrollments(pathId);

-- =====================================================
-- Insert Default Categories
-- =====================================================
INSERT OR IGNORE INTO lms_categories (id, name, slug, description, icon, color, sortOrder) VALUES
  ('cat_governance', 'Governance & Policy', 'governance-policy', 'Public administration, policy development, and governance frameworks', 'Scale', '#006B3F', 1),
  ('cat_leadership', 'Leadership & Management', 'leadership-management', 'Leadership skills, team management, and organizational development', 'Users', '#FCD116', 2),
  ('cat_ethics', 'Ethics & Compliance', 'ethics-compliance', 'Civil service ethics, code of conduct, and regulatory compliance', 'Shield', '#CE1126', 3),
  ('cat_digital', 'Digital Skills', 'digital-skills', 'ICT proficiency, digital transformation, and e-governance', 'Monitor', '#0047AB', 4),
  ('cat_finance', 'Financial Management', 'financial-management', 'Budgeting, financial reporting, and public financial management', 'Wallet', '#228B22', 5),
  ('cat_hr', 'Human Resources', 'human-resources', 'HR policies, performance management, and employee relations', 'UserCog', '#FF6B35', 6),
  ('cat_communication', 'Communication', 'communication', 'Effective communication, public relations, and stakeholder engagement', 'MessageCircle', '#9B59B6', 7),
  ('cat_project', 'Project Management', 'project-management', 'Project planning, execution, monitoring, and evaluation', 'ClipboardList', '#3498DB', 8);

-- =====================================================
-- Insert Default Certificate Template
-- =====================================================
INSERT OR IGNORE INTO lms_certificate_templates (id, name, description, templateHtml, isDefault, isActive) VALUES
  ('tpl_default', 'Ghana Civil Service Certificate', 'Official OHCS training completion certificate', '
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; text-align: center; padding: 40px; }
    .border { border: 3px solid #006B3F; padding: 20px; }
    .header { color: #006B3F; }
    .gold-bar { background: linear-gradient(90deg, #006B3F, #FCD116, #CE1126); height: 4px; margin: 20px 0; }
    .recipient { font-size: 28px; color: #333; margin: 20px 0; }
    .course { font-size: 20px; color: #006B3F; }
    .date { color: #666; margin-top: 20px; }
    .signature { margin-top: 40px; }
    .cert-number { font-size: 12px; color: #999; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="border">
    <h1 class="header">Office of the Head of Civil Service</h1>
    <h2 class="header">Republic of Ghana</h2>
    <div class="gold-bar"></div>
    <h3>Certificate of Completion</h3>
    <p>This is to certify that</p>
    <p class="recipient">{{recipientName}}</p>
    <p>has successfully completed the course</p>
    <p class="course">{{courseTitle}}</p>
    <p class="date">Completed on {{completionDate}}</p>
    <p>Grade: {{gradeLabel}} ({{grade}}%)</p>
    <div class="signature">
      <p>_______________________</p>
      <p>Head of Civil Service</p>
    </div>
    <p class="cert-number">Certificate No: {{certificateNumber}}</p>
    <p class="cert-number">Verify at: {{verificationUrl}}</p>
  </div>
</body>
</html>
', 1, 1);
