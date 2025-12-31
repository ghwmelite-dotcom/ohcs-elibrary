-- =====================================================
-- LMS DEMO DATA FOR TESTING
-- =====================================================

-- Temporarily disable foreign key checks
PRAGMA foreign_keys = OFF;

-- Use existing admin user as instructor (admin-001)
-- Note: This script assumes admin-001 exists in the users table

-- =====================================================
-- DEMO COURSE 1: Public Service Ethics
-- =====================================================
INSERT OR REPLACE INTO lms_courses (
  id, title, slug, description, shortDescription, thumbnailUrl, instructorId,
  category, level, status, estimatedDuration, tags, objectives,
  passingScore, xpReward, enrollmentCount, averageRating, createdAt, publishedAt, updatedAt
) VALUES (
  'course-ethics-001',
  'Public Service Ethics and Integrity',
  'public-service-ethics',
  'This comprehensive course covers the fundamental principles of ethics and integrity in public service. Learn about ethical decision-making, conflict of interest, accountability, and maintaining public trust. Through case studies and practical exercises, you will develop the skills needed to navigate ethical challenges in your daily work.',
  'Master the principles of ethical conduct in Ghana public service',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
  'admin-001',
  'governance',
  'beginner',
  'published',
  180,
  '["ethics", "integrity", "governance", "public service"]',
  '["Understand ethical principles in public service", "Apply ethical decision-making frameworks", "Identify and manage conflicts of interest", "Promote transparency and accountability"]',
  70,
  150,
  45,
  4.7,
  datetime('now', '-30 days'),
  datetime('now', '-28 days'),
  datetime('now')
);

-- Modules for Ethics Course
INSERT OR REPLACE INTO lms_modules (id, courseId, title, description, sortOrder, isLocked) VALUES
  ('mod-ethics-01', 'course-ethics-001', 'Introduction to Public Service Ethics', 'Foundation of ethical conduct in government service', 0, 0),
  ('mod-ethics-02', 'course-ethics-001', 'Ethical Decision Making', 'Frameworks and tools for ethical decisions', 1, 0),
  ('mod-ethics-03', 'course-ethics-001', 'Conflict of Interest', 'Identifying and managing conflicts', 2, 0),
  ('mod-ethics-04', 'course-ethics-001', 'Accountability and Transparency', 'Building public trust', 3, 0);

-- Lessons for Ethics Course
INSERT OR REPLACE INTO lms_lessons (id, moduleId, courseId, title, contentType, content, sortOrder, estimatedDuration, isRequired, xpReward) VALUES
  ('les-ethics-01-01', 'mod-ethics-01', 'course-ethics-001', 'What is Public Service Ethics?', 'text', '<h2>Understanding Public Service Ethics</h2><p>Public service ethics refers to the moral principles and standards that guide the behavior of public servants in their official duties. These ethics are essential for maintaining public trust and ensuring effective governance.</p><h3>Key Principles</h3><ul><li><strong>Integrity:</strong> Acting honestly and maintaining high moral standards</li><li><strong>Accountability:</strong> Being answerable for actions and decisions</li><li><strong>Transparency:</strong> Operating openly and providing information to stakeholders</li><li><strong>Fairness:</strong> Treating all citizens equally without discrimination</li></ul><p>In Ghana, public servants are bound by the Code of Conduct for Public Officers, which outlines specific ethical requirements and expectations.</p>', 0, 15, 1, 10),
  ('les-ethics-01-02', 'mod-ethics-01', 'course-ethics-001', 'The Ghana Code of Conduct', 'text', '<h2>Ghana Code of Conduct for Public Officers</h2><p>The Code of Conduct for Public Officers in Ghana establishes the ethical standards expected of all government employees. This code is essential reading for all civil servants.</p><h3>Core Requirements</h3><ul><li>Declaration of assets and liabilities</li><li>Prohibition of conflicts of interest</li><li>Requirements for gift disclosure</li><li>Restrictions on outside employment</li></ul><p>Understanding and adhering to this code is fundamental to maintaining the integrity of the public service.</p>', 1, 20, 1, 10),
  ('les-ethics-01-03', 'mod-ethics-01', 'course-ethics-001', 'Module 1 Quiz', 'quiz', NULL, 2, 15, 1, 25),
  ('les-ethics-02-01', 'mod-ethics-02', 'course-ethics-001', 'Ethical Decision-Making Framework', 'text', '<h2>Making Ethical Decisions</h2><p>When faced with ethical dilemmas, public servants need a structured approach to decision-making. The following framework can guide you through difficult situations.</p><h3>The ETHICS Framework</h3><ol><li><strong>E</strong>valuate the situation objectively</li><li><strong>T</strong>hink about stakeholders affected</li><li><strong>H</strong>ighlight the ethical issues</li><li><strong>I</strong>dentify possible courses of action</li><li><strong>C</strong>onsider consequences of each option</li><li><strong>S</strong>elect the most ethical course of action</li></ol>', 0, 25, 1, 15),
  ('les-ethics-02-02', 'mod-ethics-02', 'course-ethics-001', 'Case Study: The Procurement Dilemma', 'text', '<h2>Case Study: Procurement Decision</h2><p><strong>Scenario:</strong> You are a procurement officer responsible for awarding a contract worth GHS 500,000. Your childhood friend has submitted a bid that is 10% higher than the lowest bidder but promises "expedited delivery."</p><h3>Questions to Consider</h3><ul><li>What ethical issues are present in this scenario?</li><li>Who are the stakeholders affected by your decision?</li><li>What would be the ethical course of action?</li><li>How would you document your decision?</li></ul><p>Apply the ETHICS framework to analyze this situation.</p>', 1, 20, 1, 10),
  ('les-ethics-02-03', 'mod-ethics-02', 'course-ethics-001', 'Ethical Decision Making Assignment', 'assignment', NULL, 2, 45, 1, 50);

-- Quiz for Ethics Course Module 1
INSERT OR REPLACE INTO lms_quizzes (id, lessonId, courseId, title, quizType, passingScore, timeLimit, maxAttempts, shuffleQuestions, shuffleOptions, showCorrectAnswers, showExplanations, xpReward, questionCount, totalPoints, createdAt, updatedAt) VALUES
  ('quiz-ethics-01', 'les-ethics-01-03', 'course-ethics-001', 'Module 1: Introduction to Ethics Quiz', 'standard', 70, 15, 3, 1, 1, 1, 1, 25, 5, 50, datetime('now'), datetime('now'));

-- Quiz Questions
INSERT OR REPLACE INTO lms_quiz_questions (id, quizId, questionType, question, options, correctAnswer, explanation, points, sortOrder) VALUES
  ('qq-ethics-01-01', 'quiz-ethics-01', 'multiple_choice', 'Which of the following is NOT a core principle of public service ethics?', '["Integrity", "Transparency", "Profit maximization", "Accountability"]', '"Profit maximization"', 'Public service ethics focuses on serving the public interest, not profit maximization. The core principles include integrity, transparency, accountability, and fairness.', 10, 0),
  ('qq-ethics-01-02', 'quiz-ethics-01', 'multiple_choice', 'The Ghana Code of Conduct requires public officers to:', '["Declare their assets and liabilities", "Accept gifts without disclosure", "Engage in unlimited outside employment", "Prioritize personal interests"]', '"Declare their assets and liabilities"', 'The Code of Conduct requires public officers to declare their assets and liabilities as part of maintaining transparency and accountability.', 10, 1),
  ('qq-ethics-01-03', 'quiz-ethics-01', 'true_false', 'Public servants can accept gifts of any value as long as they disclose them.', '["True", "False"]', '"False"', 'Public servants must refuse gifts that could influence their official duties, regardless of disclosure. There are strict limits on acceptable gifts.', 10, 2),
  ('qq-ethics-01-04', 'quiz-ethics-01', 'multiple_choice', 'Accountability in public service means:', '["Following orders without question", "Being answerable for actions and decisions", "Keeping information confidential", "Avoiding difficult decisions"]', '"Being answerable for actions and decisions"', 'Accountability means being responsible and answerable for ones actions, decisions, and their consequences.', 10, 3),
  ('qq-ethics-01-05', 'quiz-ethics-01', 'multiple_choice', 'Which body oversees ethical compliance in Ghana public service?', '["Commission on Human Rights and Administrative Justice (CHRAJ)", "Ghana Police Service", "Bank of Ghana", "Electoral Commission"]', '"Commission on Human Rights and Administrative Justice (CHRAJ)"', 'CHRAJ is responsible for investigating complaints of corruption and abuse of power by public officials.', 10, 4);

-- Assignment for Ethics Course
INSERT OR REPLACE INTO lms_assignments (id, lessonId, courseId, title, instructions, submissionType, dueDate, maxScore, rubricId, requiresPeerReview, peerReviewCount, xpReward, createdAt, updatedAt) VALUES
  ('assign-ethics-01', 'les-ethics-02-03', 'course-ethics-001', 'Ethical Decision Making Analysis', 'Write a 500-word analysis of an ethical dilemma you have encountered or observed in the workplace. Use the ETHICS framework discussed in this module to analyze the situation and propose an ethical solution.

Requirements:
1. Describe the situation clearly
2. Identify all stakeholders
3. Apply each step of the ETHICS framework
4. Propose your recommended action
5. Explain how you would implement your decision

Submit your analysis as a PDF or Word document.', 'file', datetime('now', '+14 days'), 100, 'rubric-ethics-01', 0, 0, 50, datetime('now'), datetime('now'));

-- Rubric for Ethics Assignment
INSERT OR REPLACE INTO lms_rubrics (id, title, criteria, maxScore, instructorId, createdAt, updatedAt) VALUES
  ('rubric-ethics-01', 'Ethical Analysis Rubric', '[
    {
      "id": "crit-01",
      "name": "Situation Description",
      "description": "Clarity and completeness of the ethical dilemma description",
      "weight": 20,
      "levels": [
        {"score": 0, "label": "Missing", "description": "No description provided"},
        {"score": 10, "label": "Basic", "description": "Vague or incomplete description"},
        {"score": 15, "label": "Good", "description": "Clear description with some details"},
        {"score": 20, "label": "Excellent", "description": "Comprehensive and detailed description"}
      ]
    },
    {
      "id": "crit-02",
      "name": "Stakeholder Analysis",
      "description": "Identification and consideration of all affected parties",
      "weight": 20,
      "levels": [
        {"score": 0, "label": "Missing", "description": "No stakeholders identified"},
        {"score": 10, "label": "Basic", "description": "Only obvious stakeholders identified"},
        {"score": 15, "label": "Good", "description": "Most stakeholders identified with some analysis"},
        {"score": 20, "label": "Excellent", "description": "Comprehensive stakeholder identification and analysis"}
      ]
    },
    {
      "id": "crit-03",
      "name": "Framework Application",
      "description": "Proper application of the ETHICS framework",
      "weight": 30,
      "levels": [
        {"score": 0, "label": "Missing", "description": "Framework not applied"},
        {"score": 15, "label": "Basic", "description": "Partial framework application"},
        {"score": 22, "label": "Good", "description": "Most steps applied correctly"},
        {"score": 30, "label": "Excellent", "description": "Complete and insightful framework application"}
      ]
    },
    {
      "id": "crit-04",
      "name": "Recommendation Quality",
      "description": "Strength and feasibility of the proposed solution",
      "weight": 20,
      "levels": [
        {"score": 0, "label": "Missing", "description": "No recommendation provided"},
        {"score": 10, "label": "Basic", "description": "Weak or impractical recommendation"},
        {"score": 15, "label": "Good", "description": "Sound recommendation with some justification"},
        {"score": 20, "label": "Excellent", "description": "Strong, well-justified, and practical recommendation"}
      ]
    },
    {
      "id": "crit-05",
      "name": "Writing Quality",
      "description": "Clarity, organization, and professionalism of writing",
      "weight": 10,
      "levels": [
        {"score": 0, "label": "Poor", "description": "Many errors, unclear organization"},
        {"score": 5, "label": "Basic", "description": "Some errors, basic organization"},
        {"score": 8, "label": "Good", "description": "Few errors, well-organized"},
        {"score": 10, "label": "Excellent", "description": "Professional quality writing"}
      ]
    }
  ]', 100, 'admin-001', datetime('now'), datetime('now'));

-- =====================================================
-- DEMO COURSE 2: Digital Skills (Pending Review)
-- =====================================================
INSERT OR REPLACE INTO lms_courses (
  id, title, slug, description, shortDescription, thumbnailUrl, instructorId,
  category, level, status, estimatedDuration, tags, objectives,
  passingScore, xpReward, enrollmentCount, averageRating, createdAt, updatedAt
) VALUES (
  'course-digital-001',
  'Digital Skills for Public Servants',
  'digital-skills-public-servants',
  'Develop essential digital skills needed for modern public service. This course covers digital communication, online collaboration tools, data management, and cybersecurity basics. Learn to leverage technology effectively in your daily work.',
  'Essential digital competencies for the modern civil servant',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
  'admin-001',
  'technology',
  'beginner',
  'pending_review',
  120,
  '["digital", "technology", "skills", "productivity"]',
  '["Use digital communication tools effectively", "Collaborate using online platforms", "Manage digital documents securely", "Apply basic cybersecurity practices"]',
  70,
  100,
  0,
  0,
  datetime('now', '-5 days'),
  datetime('now')
);

-- Modules for Digital Skills Course
INSERT OR REPLACE INTO lms_modules (id, courseId, title, description, sortOrder, isLocked) VALUES
  ('mod-digital-01', 'course-digital-001', 'Digital Communication', 'Email, messaging, and virtual meetings', 0, 0),
  ('mod-digital-02', 'course-digital-001', 'Collaboration Tools', 'Online document sharing and teamwork', 1, 0),
  ('mod-digital-03', 'course-digital-001', 'Cybersecurity Basics', 'Protecting yourself and your organization', 2, 0);

-- Lessons for Digital Skills Course
INSERT OR REPLACE INTO lms_lessons (id, moduleId, courseId, title, contentType, content, sortOrder, estimatedDuration, isRequired, xpReward) VALUES
  ('les-digital-01-01', 'mod-digital-01', 'course-digital-001', 'Professional Email Communication', 'text', '<h2>Writing Effective Professional Emails</h2><p>Email remains a critical communication tool in public service. Learn to write clear, professional emails that get results.</p><h3>Best Practices</h3><ul><li>Use clear, descriptive subject lines</li><li>Keep messages concise and focused</li><li>Use proper greetings and sign-offs</li><li>Proofread before sending</li></ul>', 0, 20, 1, 10),
  ('les-digital-01-02', 'mod-digital-01', 'course-digital-001', 'Virtual Meeting Etiquette', 'video', NULL, 1, 15, 1, 10),
  ('les-digital-02-01', 'mod-digital-02', 'course-digital-001', 'Google Workspace for Teams', 'text', '<h2>Collaborating with Google Workspace</h2><p>Learn to use Google Docs, Sheets, and Drive for team collaboration in your department.</p>', 0, 25, 1, 15),
  ('les-digital-03-01', 'mod-digital-03', 'course-digital-001', 'Password Security', 'text', '<h2>Creating and Managing Strong Passwords</h2><p>Your password is the first line of defense. Learn to create strong, unique passwords and manage them securely.</p>', 0, 15, 1, 10);

-- =====================================================
-- DEMO ENROLLMENTS
-- =====================================================
INSERT OR REPLACE INTO lms_enrollments (id, courseId, userId, status, progress, lessonsCompleted, totalLessons, timeSpent, enrolledAt, lastAccessedAt) VALUES
  ('enroll-admin-ethics', 'course-ethics-001', 'admin-001', 'active', 80, 5, 6, 5400, datetime('now', '-14 days'), datetime('now'));

-- Lesson Progress
INSERT OR REPLACE INTO lms_lesson_progress (id, lessonId, enrollmentId, userId, status, timeSpent, completedAt) VALUES
  ('prog-admin-01', 'les-ethics-01-01', 'enroll-admin-ethics', 'admin-001', 'completed', 900, datetime('now', '-13 days')),
  ('prog-admin-02', 'les-ethics-01-02', 'enroll-admin-ethics', 'admin-001', 'completed', 1200, datetime('now', '-12 days')),
  ('prog-admin-03', 'les-ethics-01-03', 'enroll-admin-ethics', 'admin-001', 'completed', 900, datetime('now', '-11 days')),
  ('prog-admin-04', 'les-ethics-02-01', 'enroll-admin-ethics', 'admin-001', 'completed', 1500, datetime('now', '-10 days')),
  ('prog-admin-05', 'les-ethics-02-02', 'enroll-admin-ethics', 'admin-001', 'completed', 1200, datetime('now', '-8 days'));

-- Quiz Attempts
INSERT OR REPLACE INTO lms_quiz_attempts (id, quizId, userId, enrollmentId, attemptNumber, status, answers, score, percentage, passed, timeStarted, timeSubmitted) VALUES
  ('attempt-admin-01', 'quiz-ethics-01', 'admin-001', 'enroll-admin-ethics', 1, 'completed', '{"qq-ethics-01-01": "Profit maximization", "qq-ethics-01-02": "Declare their assets and liabilities", "qq-ethics-01-03": "False", "qq-ethics-01-04": "Being answerable for actions and decisions", "qq-ethics-01-05": "Commission on Human Rights and Administrative Justice (CHRAJ)"}', 50, 100, 1, datetime('now', '-11 days'), datetime('now', '-11 days', '+12 minutes'));

-- Assignment Submissions
INSERT OR REPLACE INTO lms_assignment_submissions (id, assignmentId, userId, enrollmentId, content, files, status, score, maxScore, percentage, feedback, submittedAt, gradedAt, gradedById) VALUES
  ('submit-admin-01', 'assign-ethics-01', 'admin-001', 'enroll-admin-ethics', NULL, '[{"name": "my_ethics_paper.docx", "url": "/uploads/my_ethics_paper.docx", "size": 189000}]', 'submitted', NULL, NULL, NULL, NULL, datetime('now', '-1 days'), NULL, NULL);

-- =====================================================
-- DEMO DISCUSSIONS
-- =====================================================
INSERT OR REPLACE INTO lms_discussions (id, courseId, lessonId, authorId, title, content, isPinned, isLocked, isGraded, pointsValue, viewCount, replyCount, createdAt, lastReplyAt, updatedAt) VALUES
  ('disc-001', 'course-ethics-001', NULL, 'admin-001', 'Welcome to Public Service Ethics!', 'Welcome to this important course on ethics and integrity. I encourage everyone to share their experiences and questions throughout the course. Remember, ethical conduct is the foundation of effective public service.', 1, 0, 0, 0, 78, 5, datetime('now', '-28 days'), datetime('now', '-10 days'), datetime('now')),
  ('disc-002', 'course-ethics-001', 'les-ethics-02-02', 'admin-001', 'Question about the Procurement Case Study', 'In the procurement case study, what if the friend''s company genuinely offers better quality despite the higher price? How do we balance value for money with the appearance of conflict of interest?', 0, 0, 0, 0, 34, 3, datetime('now', '-10 days'), datetime('now', '-8 days'), datetime('now')),
  ('disc-003', 'course-ethics-001', NULL, 'admin-001', 'Real-world ethical challenges', 'I''d like to share a challenging situation I faced recently and get everyone''s perspective on how to handle it ethically...', 0, 0, 1, 10, 56, 7, datetime('now', '-7 days'), datetime('now', '-2 days'), datetime('now'));

-- Discussion Replies
INSERT OR REPLACE INTO lms_discussion_replies (id, discussionId, authorId, parentId, content, isInstructorPost, isAnswer, likes, createdAt, updatedAt) VALUES
  ('reply-001', 'disc-001', 'admin-001', NULL, 'Thank you for the warm welcome! I''m excited to learn more about ethical decision-making in our daily work.', 0, 0, 3, datetime('now', '-27 days'), datetime('now')),
  ('reply-002', 'disc-001', 'admin-001', NULL, 'Looking forward to the discussions. Ethics is such an important topic for all of us.', 0, 0, 2, datetime('now', '-26 days'), datetime('now')),
  ('reply-003', 'disc-001', 'admin-001', 'reply-001', 'Glad to have you, Kofi! Feel free to ask questions anytime.', 1, 0, 4, datetime('now', '-26 days'), datetime('now')),
  ('reply-004', 'disc-002', 'admin-001', NULL, 'Excellent question, Kofi! This is exactly the kind of nuanced situation we need to think carefully about. The key is transparency and documentation. If you genuinely believe the higher-priced option offers better value, you must document your reasoning thoroughly and ensure the decision can withstand scrutiny.', 1, 1, 8, datetime('now', '-9 days'), datetime('now')),
  ('reply-005', 'disc-002', 'admin-001', NULL, 'I agree with Dr. Asante. In my experience, having a clear evaluation matrix before reviewing bids helps reduce bias.', 0, 0, 5, datetime('now', '-8 days'), datetime('now'));

-- =====================================================
-- DEMO CERTIFICATE
-- =====================================================
INSERT OR REPLACE INTO lms_certificates (id, courseId, userId, enrollmentId, templateId, certificateNumber, recipientName, courseTitle, instructorName, completionDate, grade, gradeLabel, pdfUrl, issuedAt) VALUES
  ('cert-admin-001', 'course-ethics-001', 'admin-001', 'enroll-admin-ethics', NULL, 'OHCS-LMS-2024-00001', 'Admin User', 'Public Service Ethics and Integrity', 'Dr. Kwame Asante', datetime('now', '-3 days'), 85, 'Distinction', NULL, datetime('now', '-3 days'));

-- =====================================================
-- COURSE REVIEWS
-- =====================================================
INSERT OR REPLACE INTO lms_course_reviews (id, courseId, userId, enrollmentId, rating, review, isHidden, createdAt, updatedAt) VALUES
  ('review-001', 'course-ethics-001', 'admin-001', 'enroll-admin-ethics', 5, 'Excellent course! Very practical and relevant to our daily work. The case studies were particularly helpful.', 0, datetime('now', '-2 days'), datetime('now'));

-- Update course rating
UPDATE lms_courses SET averageRating = 5.0 WHERE id = 'course-ethics-001';

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;
