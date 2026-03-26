/**
 * Learning Management System (LMS) Routes
 * Complete API for courses, lessons, quizzes, assignments, and certifications
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  OPENAI_API_KEY?: string;
};

type Variables = {
  user?: { id: string; role: string; email: string };
};

const lms = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Helper to check if user is instructor or admin
const isInstructor = (role?: string) => ['admin', 'super_admin', 'director', 'instructor', 'librarian'].includes(role || '');

// XP reward amounts for LMS activities
const LMS_XP_REWARDS = {
  LESSON_COMPLETE: 10,
  QUIZ_PASS: 25,
  ASSIGNMENT_SUBMIT: 50,
  COURSE_COMPLETE: 100,
  PEER_REVIEW: 15,
};

// Helper function to award XP for LMS activities
async function awardLmsXp(
  db: D1Database,
  userId: string,
  amount: number,
  reason: string,
  referenceId: string,
  referenceType: string
): Promise<boolean> {
  try {
    // Check if XP was already awarded for this activity
    const existing = await db.prepare(`
      SELECT id FROM xp_transactions
      WHERE userId = ? AND referenceId = ? AND referenceType = ?
    `).bind(userId, referenceId, referenceType).first();

    if (existing) {
      return false; // Already awarded
    }

    // Create XP transaction
    await db.prepare(`
      INSERT INTO xp_transactions (userId, amount, reason, referenceId, referenceType, createdAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(userId, amount, reason, referenceId, referenceType).run();

    // Update user stats
    await db.prepare(`
      INSERT INTO user_stats (userId, totalXp, level, documentsRead, forumPosts, forumTopics, bestAnswers, badgesEarned)
      VALUES (?, ?, 1, 0, 0, 0, 0, 0)
      ON CONFLICT(userId) DO UPDATE SET totalXp = totalXp + ?
    `).bind(userId, amount, amount).run();

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    await db.prepare(`
      INSERT INTO user_streaks (userId, currentStreak, longestStreak, lastActivityDate)
      VALUES (?, 1, 1, ?)
      ON CONFLICT(userId) DO UPDATE SET lastActivityDate = ?
    `).bind(userId, today, today).run();

    return true;
  } catch (error) {
    console.error('Error awarding XP:', error);
    return false;
  }
}

// LMS Badge IDs (match migration 016_lms_badges.sql)
const LMS_BADGES = {
  FIRST_COURSE: 'badge-first-course',
  FIRST_COMPLETION: 'badge-first-completion',
  FIVE_COURSES: 'badge-5-courses',
  TEN_COURSES: 'badge-10-courses',
  FIRST_QUIZ: 'badge-first-quiz',
  PERFECT_QUIZ: 'badge-perfect-quiz',
  TEN_QUIZZES: 'badge-10-quizzes',
  FIRST_ASSIGNMENT: 'badge-first-assignment',
  TEN_ASSIGNMENTS: 'badge-10-assignments',
  FIRST_CERTIFICATE: 'badge-first-certificate',
  FIVE_CERTIFICATES: 'badge-5-certificates',
  DISCUSSION_STARTER: 'badge-discussion-starter',
  HIGH_ACHIEVER: 'badge-high-achiever',
  FAST_LEARNER: 'badge-fast-learner',
};

// Helper function to award a badge
async function awardBadge(
  db: D1Database,
  userId: string,
  badgeId: string
): Promise<boolean> {
  try {
    // Check if user already has this badge
    const existing = await db.prepare(`
      SELECT id FROM user_badges WHERE userId = ? AND badgeId = ?
    `).bind(userId, badgeId).first();

    if (existing) {
      return false; // Already has badge
    }

    // Get badge info for XP reward
    const badge = await db.prepare(`
      SELECT xpReward FROM badges WHERE id = ?
    `).bind(badgeId).first();

    if (!badge) {
      console.error('Badge not found:', badgeId);
      return false;
    }

    // Award badge
    await db.prepare(`
      INSERT INTO user_badges (userId, badgeId, earnedAt)
      VALUES (?, ?, datetime('now'))
    `).bind(userId, badgeId).run();

    // Update badges earned count
    await db.prepare(`
      UPDATE user_stats SET badgesEarned = badgesEarned + 1 WHERE userId = ?
    `).bind(userId).run();

    // Award XP for the badge
    const xpReward = (badge as any).xpReward || 0;
    if (xpReward > 0) {
      await awardLmsXp(db, userId, xpReward, 'Badge earned', badgeId, 'badge');
    }

    return true;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
}

// Check and award LMS badges based on milestones
async function checkLmsBadges(
  db: D1Database,
  userId: string,
  triggerType: 'enrollment' | 'course_complete' | 'quiz_pass' | 'assignment_submit' | 'certificate' | 'discussion',
  additionalData?: { percentage?: number; enrolledAt?: string; completedAt?: string; finalGrade?: number }
): Promise<string[]> {
  const awardedBadges: string[] = [];

  try {
    switch (triggerType) {
      case 'enrollment': {
        // Check first course enrollment
        const enrollmentCount = await db.prepare(`
          SELECT COUNT(*) as count FROM lms_enrollments WHERE userId = ?
        `).bind(userId).first();
        if ((enrollmentCount as any)?.count === 1) {
          if (await awardBadge(db, userId, LMS_BADGES.FIRST_COURSE)) {
            awardedBadges.push(LMS_BADGES.FIRST_COURSE);
          }
        }
        break;
      }

      case 'course_complete': {
        // Count completed courses
        const completedCount = await db.prepare(`
          SELECT COUNT(*) as count FROM lms_enrollments WHERE userId = ? AND status = 'completed'
        `).bind(userId).first();
        const count = (completedCount as any)?.count || 0;

        // First completion
        if (count === 1) {
          if (await awardBadge(db, userId, LMS_BADGES.FIRST_COMPLETION)) {
            awardedBadges.push(LMS_BADGES.FIRST_COMPLETION);
          }
        }

        // 5 courses completed
        if (count >= 5) {
          if (await awardBadge(db, userId, LMS_BADGES.FIVE_COURSES)) {
            awardedBadges.push(LMS_BADGES.FIVE_COURSES);
          }
        }

        // 10 courses completed
        if (count >= 10) {
          if (await awardBadge(db, userId, LMS_BADGES.TEN_COURSES)) {
            awardedBadges.push(LMS_BADGES.TEN_COURSES);
          }
        }

        // Fast learner - completed within 7 days
        if (additionalData?.enrolledAt && additionalData?.completedAt) {
          const enrolled = new Date(additionalData.enrolledAt);
          const completed = new Date(additionalData.completedAt);
          const daysDiff = Math.floor((completed.getTime() - enrolled.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 7) {
            if (await awardBadge(db, userId, LMS_BADGES.FAST_LEARNER)) {
              awardedBadges.push(LMS_BADGES.FAST_LEARNER);
            }
          }
        }

        // High achiever - A grade in 3 courses (90%+)
        if (additionalData?.finalGrade && additionalData.finalGrade >= 90) {
          const highGradeCount = await db.prepare(`
            SELECT COUNT(*) as count FROM lms_enrollments
            WHERE userId = ? AND status = 'completed' AND finalGrade >= 90
          `).bind(userId).first();
          if ((highGradeCount as any)?.count >= 3) {
            if (await awardBadge(db, userId, LMS_BADGES.HIGH_ACHIEVER)) {
              awardedBadges.push(LMS_BADGES.HIGH_ACHIEVER);
            }
          }
        }
        break;
      }

      case 'quiz_pass': {
        // Count passed quizzes
        const passedQuizCount = await db.prepare(`
          SELECT COUNT(DISTINCT quizId) as count FROM lms_quiz_attempts
          WHERE userId = ? AND passed = 1
        `).bind(userId).first();
        const quizCount = (passedQuizCount as any)?.count || 0;

        // First quiz pass
        if (quizCount === 1) {
          if (await awardBadge(db, userId, LMS_BADGES.FIRST_QUIZ)) {
            awardedBadges.push(LMS_BADGES.FIRST_QUIZ);
          }
        }

        // 10 quizzes passed
        if (quizCount >= 10) {
          if (await awardBadge(db, userId, LMS_BADGES.TEN_QUIZZES)) {
            awardedBadges.push(LMS_BADGES.TEN_QUIZZES);
          }
        }

        // Perfect score (100%)
        if (additionalData?.percentage === 100) {
          if (await awardBadge(db, userId, LMS_BADGES.PERFECT_QUIZ)) {
            awardedBadges.push(LMS_BADGES.PERFECT_QUIZ);
          }
        }
        break;
      }

      case 'assignment_submit': {
        // Count submitted assignments
        const submissionCount = await db.prepare(`
          SELECT COUNT(*) as count FROM lms_assignment_submissions WHERE userId = ?
        `).bind(userId).first();
        const assignmentCount = (submissionCount as any)?.count || 0;

        // First assignment
        if (assignmentCount === 1) {
          if (await awardBadge(db, userId, LMS_BADGES.FIRST_ASSIGNMENT)) {
            awardedBadges.push(LMS_BADGES.FIRST_ASSIGNMENT);
          }
        }

        // 10 assignments
        if (assignmentCount >= 10) {
          if (await awardBadge(db, userId, LMS_BADGES.TEN_ASSIGNMENTS)) {
            awardedBadges.push(LMS_BADGES.TEN_ASSIGNMENTS);
          }
        }
        break;
      }

      case 'certificate': {
        // Count certificates
        const certCount = await db.prepare(`
          SELECT COUNT(*) as count FROM lms_certificates WHERE userId = ?
        `).bind(userId).first();
        const certificates = (certCount as any)?.count || 0;

        // First certificate
        if (certificates === 1) {
          if (await awardBadge(db, userId, LMS_BADGES.FIRST_CERTIFICATE)) {
            awardedBadges.push(LMS_BADGES.FIRST_CERTIFICATE);
          }
        }

        // 5 certificates
        if (certificates >= 5) {
          if (await awardBadge(db, userId, LMS_BADGES.FIVE_CERTIFICATES)) {
            awardedBadges.push(LMS_BADGES.FIVE_CERTIFICATES);
          }
        }
        break;
      }

      case 'discussion': {
        // Count discussions started in courses
        const discussionCount = await db.prepare(`
          SELECT COUNT(*) as count FROM lms_discussions WHERE authorId = ?
        `).bind(userId).first();
        const discussions = (discussionCount as any)?.count || 0;

        // Discussion starter (5 discussions)
        if (discussions >= 5) {
          if (await awardBadge(db, userId, LMS_BADGES.DISCUSSION_STARTER)) {
            awardedBadges.push(LMS_BADGES.DISCUSSION_STARTER);
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error checking LMS badges:', error);
  }

  return awardedBadges;
}

// Auth middleware for protected routes
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    });
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
};

// Optional auth - extracts user if token present, but doesn't fail if missing
const optionalAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = await verify(token, c.env.JWT_SECRET);
      c.set('user', {
        id: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string,
      });
    } catch (error) {
      // Token invalid, but we don't fail - just continue without user
    }
  }
  await next();
};

// Apply auth to instructor/protected endpoints
lms.use('/instructor/*', requireAuth);
lms.use('/admin/*', requireAuth);
lms.use('/my-courses', requireAuth);
lms.use('/certificates', requireAuth);
lms.post('/courses', requireAuth);
lms.post('/modules', requireAuth);
lms.post('/lessons', requireAuth);
lms.post('/quizzes', requireAuth);
lms.post('/courses/:id/enroll', requireAuth);
lms.post('/courses/:id/publish', requireAuth);
lms.put('/courses/:id', requireAuth);
lms.delete('/courses/:id', requireAuth);
lms.post('/courses/:id/discussions', requireAuth);
lms.post('/discussions/:id/replies', requireAuth);
lms.post('/discussions/replies/:id/like', requireAuth);

// Auth for quiz, question, submission, review, and other mutation endpoints
lms.post('/quizzes/:id/start', requireAuth);
lms.post('/quizzes/:id/submit', requireAuth);
lms.post('/quizzes/:id/questions', requireAuth);
lms.put('/quizzes/:id/questions/reorder', requireAuth);
lms.put('/quizzes/:id', requireAuth);
lms.put('/questions/:id', requireAuth);
lms.delete('/questions/:id', requireAuth);
lms.post('/submissions/:id/grade', requireAuth);
lms.post('/lessons/:id/complete', requireAuth);
lms.post('/assignments/:id/submit', requireAuth);
lms.delete('/courses/:id/enroll', requireAuth);
lms.post('/courses/:id/reviews', requireAuth);
lms.delete('/courses/:id/reviews', requireAuth);
lms.post('/reviews/:id/helpful', requireAuth);
lms.post('/reviews/:id/respond', requireAuth);
lms.put('/reviews/:id/hide', requireAuth);

// Apply optional auth to catalog endpoints (to check enrollment status)
lms.use('/courses', optionalAuth);
lms.use('/courses/:id', optionalAuth);
lms.use('/lessons/:id', optionalAuth);
lms.use('/discussions/:id', optionalAuth);
lms.use('/quizzes/:id', optionalAuth);

// =====================================================
// COURSE CATALOG (Student Endpoints)
// =====================================================

// GET /lms/courses - List courses with filtering
lms.get('/courses', async (c) => {
  const user = c.get('user');
  const { search, category, level, status, instructorId, sortBy, page, limit } = c.req.query();

  const pageNum = parseInt(page || '1');
  const limitNum = Math.min(parseInt(limit || '20'), 50);
  const offset = (pageNum - 1) * limitNum;

  try {
    let whereClause = "WHERE c.status = 'published'";
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      whereClause += ' AND c.category = ?';
      params.push(category);
    }

    if (level) {
      whereClause += ' AND c.level = ?';
      params.push(level);
    }

    if (instructorId) {
      whereClause += ' AND c.instructorId = ?';
      params.push(instructorId);
    }

    // Sort options
    let orderBy = 'c.createdAt DESC';
    if (sortBy === 'popular') orderBy = 'c.enrollmentCount DESC';
    else if (sortBy === 'rating') orderBy = 'c.averageRating DESC';
    else if (sortBy === 'title') orderBy = 'c.title ASC';
    else if (sortBy === 'newest') orderBy = 'c.createdAt DESC';

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM lms_courses c ${whereClause}
    `).bind(...params).first();
    const total = (countResult as any)?.total || 0;

    // Get courses with instructor info
    const courses = await c.env.DB.prepare(`
      SELECT
        c.*,
        u.displayName as instructorName,
        u.avatar as instructorAvatar,
        u.jobTitle as instructorTitle,
        (SELECT COUNT(*) FROM lms_modules WHERE courseId = c.id) as moduleCount,
        (SELECT COUNT(*) FROM lms_lessons WHERE courseId = c.id) as lessonCount
        ${user?.id ? `, (SELECT 1 FROM lms_enrollments WHERE courseId = c.id AND userId = ? LIMIT 1) as isEnrolled` : ''}
      FROM lms_courses c
      LEFT JOIN users u ON c.instructorId = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).bind(...(user?.id ? [user.id, ...params] : params), limitNum, offset).all();

    return c.json({
      courses: courses.results?.map((course: any) => ({
        ...course,
        tags: course.tags ? JSON.parse(course.tags) : [],
        objectives: course.objectives ? JSON.parse(course.objectives) : [],
        isEnrolled: !!course.isEnrolled,
        instructor: {
          id: course.instructorId,
          name: course.instructorName,
          avatar: course.instructorAvatar,
          title: course.instructorTitle,
        },
      })) || [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return c.json({ error: 'Failed to fetch courses' }, 500);
  }
});

// GET /lms/courses/:id - Get course details
lms.get('/courses/:id', async (c) => {
  const courseId = c.req.param('id');
  const user = c.get('user');

  try {
    const course = await c.env.DB.prepare(`
      SELECT
        c.*,
        u.displayName as instructorName,
        u.avatar as instructorAvatar,
        u.jobTitle as instructorTitle
      FROM lms_courses c
      LEFT JOIN users u ON c.instructorId = u.id
      WHERE c.id = ?
    `).bind(courseId).first();

    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }

    // Check if user is enrolled
    let enrollment = null;
    if (user?.id) {
      enrollment = await c.env.DB.prepare(`
        SELECT * FROM lms_enrollments WHERE courseId = ? AND userId = ?
      `).bind(courseId, user.id).first();
    }

    // Get modules with lessons
    const modules = await c.env.DB.prepare(`
      SELECT m.*,
        (SELECT COUNT(*) FROM lms_lessons WHERE moduleId = m.id) as lessonCount
      FROM lms_modules m
      WHERE m.courseId = ?
      ORDER BY m.sortOrder ASC
    `).bind(courseId).all();

    // Get lessons for each module
    const lessonsResult = await c.env.DB.prepare(`
      SELECT l.*,
        q.id as quizId, q.title as quizTitle,
        a.id as assignmentId, a.title as assignmentTitle
      FROM lms_lessons l
      LEFT JOIN lms_quizzes q ON q.lessonId = l.id
      LEFT JOIN lms_assignments a ON a.lessonId = l.id
      WHERE l.courseId = ?
      ORDER BY l.sortOrder ASC
    `).bind(courseId).all();

    // Get lesson progress if enrolled
    let lessonProgress: any = {};
    if (enrollment) {
      const progress = await c.env.DB.prepare(`
        SELECT lessonId, status, completedAt FROM lms_lesson_progress
        WHERE enrollmentId = ?
      `).bind((enrollment as any).id).all();

      progress.results?.forEach((p: any) => {
        lessonProgress[p.lessonId] = p;
      });
    }

    // Get course reviews
    const reviews = await c.env.DB.prepare(`
      SELECT r.*, u.displayName, u.avatar
      FROM lms_course_reviews r
      LEFT JOIN users u ON r.userId = u.id
      WHERE r.courseId = ? AND r.isHidden = 0
      ORDER BY r.createdAt DESC
      LIMIT 10
    `).bind(courseId).all();

    // Get recent announcements
    const announcements = await c.env.DB.prepare(`
      SELECT a.*, u.displayName as authorName, u.avatar as authorAvatar
      FROM lms_announcements a
      LEFT JOIN users u ON a.authorId = u.id
      WHERE a.courseId = ? AND a.isPublished = 1
      ORDER BY a.isPinned DESC, a.createdAt DESC
      LIMIT 5
    `).bind(courseId).all();

    // Organize lessons by module
    const modulesWithLessons = modules.results?.map((module: any) => ({
      ...module,
      lessons: lessonsResult.results
        ?.filter((l: any) => l.moduleId === module.id)
        .map((l: any) => ({
          ...l,
          progress: lessonProgress[l.id] || null,
          quiz: l.quizId ? { id: l.quizId, title: l.quizTitle } : null,
          assignment: l.assignmentId ? { id: l.assignmentId, title: l.assignmentTitle } : null,
        })),
    }));

    return c.json({
      ...course,
      tags: (course as any).tags ? JSON.parse((course as any).tags) : [],
      objectives: (course as any).objectives ? JSON.parse((course as any).objectives) : [],
      instructor: {
        id: (course as any).instructorId,
        name: (course as any).instructorName,
        avatar: (course as any).instructorAvatar,
        title: (course as any).instructorTitle,
      },
      modules: modulesWithLessons || [],
      enrollment: enrollment || null,
      reviews: reviews.results || [],
      announcements: announcements.results || [],
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return c.json({ error: 'Failed to fetch course' }, 500);
  }
});

// POST /lms/courses/:id/enroll - Enroll in a course
lms.post('/courses/:id/enroll', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');

  try {
    // Check if course exists and is published
    const course = await c.env.DB.prepare(`
      SELECT id, title, xpReward FROM lms_courses WHERE id = ? AND status = 'published'
    `).bind(courseId).first();

    if (!course) {
      return c.json({ error: 'Course not found or not available' }, 404);
    }

    // Check if already enrolled
    const existing = await c.env.DB.prepare(`
      SELECT id FROM lms_enrollments WHERE courseId = ? AND userId = ?
    `).bind(courseId, user.id).first();

    if (existing) {
      return c.json({ error: 'Already enrolled in this course' }, 400);
    }

    // Count total lessons
    const lessonCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_lessons WHERE courseId = ?
    `).bind(courseId).first();

    // Create enrollment
    const enrollmentId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO lms_enrollments (id, courseId, userId, status, totalLessons, enrolledAt)
      VALUES (?, ?, ?, 'active', ?, datetime('now'))
    `).bind(enrollmentId, courseId, user.id, (lessonCount as any)?.count || 0).run();

    // Increment course enrollment count
    await c.env.DB.prepare(`
      UPDATE lms_courses SET enrollmentCount = enrollmentCount + 1, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(courseId).run();

    // Award XP for enrollment
    const enrollXP = 10;
    await c.env.DB.prepare(`
      INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId, createdAt)
      VALUES (?, ?, ?, 'Enrolled in course', 'learning', ?, datetime('now'))
    `).bind(crypto.randomUUID(), user.id, enrollXP, courseId).run();

    // Check and award enrollment badges
    const badgesAwarded = await checkLmsBadges(c.env.DB, user.id, 'enrollment');

    return c.json({
      enrollment: {
        id: enrollmentId,
        courseId,
        userId: user.id,
        status: 'active',
        progress: 0,
        lessonsCompleted: 0,
        totalLessons: (lessonCount as any)?.count || 0,
        enrolledAt: new Date().toISOString(),
      },
      xpAwarded: enrollXP,
      badgesAwarded,
    });
  } catch (error) {
    console.error('Error enrolling:', error);
    return c.json({ error: 'Failed to enroll in course' }, 500);
  }
});

// DELETE /lms/courses/:id/enroll - Unenroll from a course
lms.delete('/courses/:id/enroll', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');

  try {
    const enrollment = await c.env.DB.prepare(`
      SELECT id, status FROM lms_enrollments WHERE courseId = ? AND userId = ?
    `).bind(courseId, user.id).first();

    if (!enrollment) {
      return c.json({ error: 'Not enrolled in this course' }, 404);
    }

    // Mark as dropped instead of deleting
    await c.env.DB.prepare(`
      UPDATE lms_enrollments SET status = 'dropped', droppedAt = datetime('now')
      WHERE id = ?
    `).bind((enrollment as any).id).run();

    // Decrement enrollment count
    await c.env.DB.prepare(`
      UPDATE lms_courses SET enrollmentCount = MAX(0, enrollmentCount - 1), updatedAt = datetime('now')
      WHERE id = ?
    `).bind(courseId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error unenrolling:', error);
    return c.json({ error: 'Failed to unenroll' }, 500);
  }
});

// GET /lms/my-courses - Get user's enrolled courses
lms.get('/my-courses', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { status } = c.req.query();

  try {
    let whereClause = 'WHERE e.userId = ?';
    const params: any[] = [user.id];

    if (status) {
      whereClause += ' AND e.status = ?';
      params.push(status);
    }

    const enrollments = await c.env.DB.prepare(`
      SELECT
        e.*,
        c.title, c.slug, c.shortDescription, c.thumbnailUrl,
        c.level, c.category, c.estimatedDuration,
        u.displayName as instructorName, u.avatar as instructorAvatar
      FROM lms_enrollments e
      JOIN lms_courses c ON e.courseId = c.id
      LEFT JOIN users u ON c.instructorId = u.id
      ${whereClause}
      ORDER BY e.lastAccessedAt DESC, e.enrolledAt DESC
    `).bind(...params).all();

    return c.json({
      enrollments: enrollments.results?.map((e: any) => ({
        ...e,
        course: {
          id: e.courseId,
          title: e.title,
          slug: e.slug,
          shortDescription: e.shortDescription,
          thumbnailUrl: e.thumbnailUrl,
          level: e.level,
          category: e.category,
          estimatedDuration: e.estimatedDuration,
          instructor: {
            name: e.instructorName,
            avatar: e.instructorAvatar,
          },
        },
      })) || [],
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return c.json({ error: 'Failed to fetch courses' }, 500);
  }
});

// =====================================================
// LESSONS
// =====================================================

// GET /lms/lessons/:id - Get lesson content
lms.get('/lessons/:id', async (c) => {
  const user = c.get('user');
  const lessonId = c.req.param('id');

  try {
    const lesson = await c.env.DB.prepare(`
      SELECT l.*, m.title as moduleTitle, c.title as courseTitle, c.id as courseId
      FROM lms_lessons l
      JOIN lms_modules m ON l.moduleId = m.id
      JOIN lms_courses c ON l.courseId = c.id
      WHERE l.id = ?
    `).bind(lessonId).first();

    if (!lesson) {
      return c.json({ error: 'Lesson not found' }, 404);
    }

    // Check enrollment (unless previewable)
    let enrollment = null;
    let progress = null;
    if (user?.id) {
      enrollment = await c.env.DB.prepare(`
        SELECT * FROM lms_enrollments WHERE courseId = ? AND userId = ?
      `).bind((lesson as any).courseId, user.id).first();

      if (enrollment) {
        progress = await c.env.DB.prepare(`
          SELECT * FROM lms_lesson_progress WHERE lessonId = ? AND userId = ?
        `).bind(lessonId, user.id).first();

        // Update last accessed
        await c.env.DB.prepare(`
          UPDATE lms_enrollments SET lastAccessedAt = datetime('now'), lastLessonId = ?
          WHERE id = ?
        `).bind(lessonId, (enrollment as any).id).run();
      }
    }

    if (!(lesson as any).isPreviewable && !enrollment) {
      return c.json({ error: 'Please enroll in this course to access this lesson' }, 403);
    }

    // Get quiz if exists
    let quiz = null;
    if ((lesson as any).contentType === 'quiz') {
      quiz = await c.env.DB.prepare(`
        SELECT * FROM lms_quizzes WHERE lessonId = ?
      `).bind(lessonId).first();
    }

    // Get assignment if exists
    let assignment = null;
    if ((lesson as any).contentType === 'assignment') {
      assignment = await c.env.DB.prepare(`
        SELECT * FROM lms_assignments WHERE lessonId = ?
      `).bind(lessonId).first();
    }

    // Get next/prev lessons
    const navigation = await c.env.DB.prepare(`
      SELECT id, title, moduleId, sortOrder FROM lms_lessons
      WHERE courseId = ?
      ORDER BY sortOrder ASC
    `).bind((lesson as any).courseId).all();

    const lessons = navigation.results || [];
    const currentIndex = lessons.findIndex((l: any) => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

    // Create or update progress to in_progress
    if (enrollment && !progress) {
      await c.env.DB.prepare(`
        INSERT INTO lms_lesson_progress (id, lessonId, userId, enrollmentId, status, startedAt)
        VALUES (?, ?, ?, ?, 'in_progress', datetime('now'))
      `).bind(crypto.randomUUID(), lessonId, user!.id, (enrollment as any).id).run();
    }

    return c.json({
      ...lesson,
      progress,
      quiz,
      assignment,
      prevLesson,
      nextLesson,
      isEnrolled: !!enrollment,
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return c.json({ error: 'Failed to fetch lesson' }, 500);
  }
});

// POST /lms/lessons/:id/complete - Mark lesson as complete
lms.post('/lessons/:id/complete', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const lessonId = c.req.param('id');

  try {
    const lesson = await c.env.DB.prepare(`
      SELECT l.*, c.id as courseId, c.xpReward as courseXP
      FROM lms_lessons l
      JOIN lms_courses c ON l.courseId = c.id
      WHERE l.id = ?
    `).bind(lessonId).first();

    if (!lesson) {
      return c.json({ error: 'Lesson not found' }, 404);
    }

    // Get enrollment
    const enrollment = await c.env.DB.prepare(`
      SELECT * FROM lms_enrollments WHERE courseId = ? AND userId = ?
    `).bind((lesson as any).courseId, user.id).first();

    if (!enrollment) {
      return c.json({ error: 'Not enrolled in this course' }, 403);
    }

    // Check if already completed
    const existingProgress = await c.env.DB.prepare(`
      SELECT * FROM lms_lesson_progress WHERE lessonId = ? AND userId = ?
    `).bind(lessonId, user.id).first();

    if (existingProgress && (existingProgress as any).status === 'completed') {
      return c.json({ error: 'Lesson already completed' }, 400);
    }

    // Update or create progress
    if (existingProgress) {
      await c.env.DB.prepare(`
        UPDATE lms_lesson_progress SET status = 'completed', completedAt = datetime('now')
        WHERE id = ?
      `).bind((existingProgress as any).id).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO lms_lesson_progress (id, lessonId, userId, enrollmentId, status, startedAt, completedAt)
        VALUES (?, ?, ?, ?, 'completed', datetime('now'), datetime('now'))
      `).bind(crypto.randomUUID(), lessonId, user.id, (enrollment as any).id).run();
    }

    // Update enrollment progress
    const completedCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_lesson_progress
      WHERE enrollmentId = ? AND status = 'completed'
    `).bind((enrollment as any).id).first();

    const totalLessons = (enrollment as any).totalLessons || 1;
    const lessonsCompleted = ((completedCount as any)?.count || 0) + (existingProgress ? 0 : 1);
    const progress = Math.round((lessonsCompleted / totalLessons) * 100);

    await c.env.DB.prepare(`
      UPDATE lms_enrollments
      SET lessonsCompleted = ?, progress = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(lessonsCompleted, progress, (enrollment as any).id).run();

    // Award XP for lesson completion
    const lessonXpReward = (lesson as any).xpReward || LMS_XP_REWARDS.LESSON_COMPLETE;
    await awardLmsXp(
      c.env.DB,
      user.id,
      lessonXpReward,
      'Completed lesson',
      lessonId,
      'lms_lesson'
    );

    // Check module completion
    const moduleProgress = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM lms_lessons WHERE moduleId = l.moduleId) as total,
        (SELECT COUNT(*) FROM lms_lesson_progress lp
         JOIN lms_lessons ll ON lp.lessonId = ll.id
         WHERE ll.moduleId = l.moduleId AND lp.userId = ? AND lp.status = 'completed') as completed
      FROM lms_lessons l WHERE l.id = ?
    `).bind(user.id, lessonId).first();

    const isModuleComplete = (moduleProgress as any)?.completed >= (moduleProgress as any)?.total;

    // Check course completion
    let isCourseComplete = progress >= 100;
    let certificate = null;

    if (isCourseComplete) {
      // Mark enrollment as completed
      await c.env.DB.prepare(`
        UPDATE lms_enrollments SET status = 'completed', completedAt = datetime('now')
        WHERE id = ?
      `).bind((enrollment as any).id).run();

      // Update course completion count
      await c.env.DB.prepare(`
        UPDATE lms_courses SET completionCount = completionCount + 1, updatedAt = datetime('now')
        WHERE id = ?
      `).bind((lesson as any).courseId).run();

      // Issue certificate (basic - can be enhanced)
      const certId = crypto.randomUUID();
      const certNumber = `OHCS-${Date.now().toString(36).toUpperCase()}`;

      const userData = await c.env.DB.prepare(`
        SELECT displayName FROM users WHERE id = ?
      `).bind(user.id).first();

      const courseData = await c.env.DB.prepare(`
        SELECT title FROM lms_courses WHERE id = ?
      `).bind((lesson as any).courseId).first();

      await c.env.DB.prepare(`
        INSERT INTO lms_certificates (id, courseId, userId, enrollmentId, certificateNumber, recipientName, courseTitle, completionDate, grade, gradeLabel, issuedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), ?, 'Pass', datetime('now'))
      `).bind(
        certId,
        (lesson as any).courseId,
        user.id,
        (enrollment as any).id,
        certNumber,
        (userData as any)?.displayName || 'Unknown',
        (courseData as any)?.title || 'Course',
        progress
      ).run();

      certificate = {
        id: certId,
        certificateNumber: certNumber,
      };

      // Award course completion XP
      const courseXP = (lesson as any).courseXP || LMS_XP_REWARDS.COURSE_COMPLETE;
      await awardLmsXp(
        c.env.DB,
        user.id,
        courseXP,
        'Completed course',
        (lesson as any).courseId,
        'lms_course_complete'
      );

      // Check and award course completion badges
      await checkLmsBadges(c.env.DB, user.id, 'course_complete', {
        enrolledAt: (enrollment as any).enrolledAt,
        completedAt: new Date().toISOString(),
        finalGrade: progress,
      });

      // Check and award certificate badges
      await checkLmsBadges(c.env.DB, user.id, 'certificate');
    }

    return c.json({
      progress: {
        lessonId,
        status: 'completed',
        completedAt: new Date().toISOString(),
      },
      xpAwarded: (lesson as any).xpReward || 10,
      courseProgress: progress,
      isModuleComplete,
      isCourseComplete,
      certificate,
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    return c.json({ error: 'Failed to complete lesson' }, 500);
  }
});

// =====================================================
// QUIZZES
// =====================================================

// GET /lms/quizzes/:id - Get quiz details
lms.get('/quizzes/:id', async (c) => {
  const user = c.get('user');
  const quizId = c.req.param('id');

  try {
    const quiz = await c.env.DB.prepare(`
      SELECT q.*, c.title as courseTitle
      FROM lms_quizzes q
      JOIN lms_courses c ON q.courseId = c.id
      WHERE q.id = ?
    `).bind(quizId).first();

    if (!quiz) {
      return c.json({ error: 'Quiz not found' }, 404);
    }

    // Get user's attempts
    let attempts: any[] = [];
    if (user?.id) {
      const attemptsResult = await c.env.DB.prepare(`
        SELECT * FROM lms_quiz_attempts
        WHERE quizId = ? AND userId = ?
        ORDER BY attemptNumber DESC
      `).bind(quizId, user.id).all();
      attempts = attemptsResult.results || [];
    }

    return c.json({
      ...quiz,
      attempts,
      canAttempt: attempts.length < ((quiz as any).maxAttempts || 3),
      remainingAttempts: Math.max(0, ((quiz as any).maxAttempts || 3) - attempts.length),
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return c.json({ error: 'Failed to fetch quiz' }, 500);
  }
});

// POST /lms/quizzes/:id/start - Start a quiz attempt
lms.post('/quizzes/:id/start', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const quizId = c.req.param('id');

  try {
    const quiz = await c.env.DB.prepare(`
      SELECT * FROM lms_quizzes WHERE id = ?
    `).bind(quizId).first();

    if (!quiz) {
      return c.json({ error: 'Quiz not found' }, 404);
    }

    // Check enrollment
    const enrollment = await c.env.DB.prepare(`
      SELECT id FROM lms_enrollments WHERE courseId = ? AND userId = ? AND status = 'active'
    `).bind((quiz as any).courseId, user.id).first();

    if (!enrollment) {
      return c.json({ error: 'Not enrolled in this course' }, 403);
    }

    // Check existing attempts
    const attempts = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_quiz_attempts WHERE quizId = ? AND userId = ?
    `).bind(quizId, user.id).first();

    const attemptCount = (attempts as any)?.count || 0;
    if (attemptCount >= ((quiz as any).maxAttempts || 3)) {
      return c.json({ error: 'Maximum attempts reached' }, 400);
    }

    // Check for in-progress attempt
    const inProgress = await c.env.DB.prepare(`
      SELECT * FROM lms_quiz_attempts WHERE quizId = ? AND userId = ? AND status = 'in_progress'
    `).bind(quizId, user.id).first();

    if (inProgress) {
      // Return existing in-progress attempt
      const questions = await c.env.DB.prepare(`
        SELECT id, questionType, question, questionHtml, options, points, sortOrder, mediaUrl, mediaType
        FROM lms_quiz_questions WHERE quizId = ?
        ORDER BY ${(quiz as any).shuffleQuestions ? 'RANDOM()' : 'sortOrder ASC'}
      `).bind(quizId).all();

      return c.json({
        attempt: inProgress,
        questions: questions.results?.map((q: any) => ({
          ...q,
          options: q.options ? JSON.parse(q.options).map((o: any) => ({ id: o.id, text: o.text })) : [],
        })),
        timeLimit: (quiz as any).timeLimit,
      });
    }

    // Create new attempt
    const attemptId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO lms_quiz_attempts (id, quizId, userId, enrollmentId, attemptNumber, status, timeStarted)
      VALUES (?, ?, ?, ?, ?, 'in_progress', datetime('now'))
    `).bind(attemptId, quizId, user.id, (enrollment as any).id, attemptCount + 1).run();

    // Get questions (without correct answers)
    const questions = await c.env.DB.prepare(`
      SELECT id, questionType, question, questionHtml, options, points, sortOrder, mediaUrl, mediaType
      FROM lms_quiz_questions WHERE quizId = ?
      ORDER BY ${(quiz as any).shuffleQuestions ? 'RANDOM()' : 'sortOrder ASC'}
    `).bind(quizId).all();

    return c.json({
      attempt: {
        id: attemptId,
        quizId,
        attemptNumber: attemptCount + 1,
        status: 'in_progress',
        timeStarted: new Date().toISOString(),
      },
      questions: questions.results?.map((q: any) => ({
        ...q,
        options: q.options ? JSON.parse(q.options).map((o: any) => ({ id: o.id, text: o.text })) : [],
      })),
      timeLimit: (quiz as any).timeLimit,
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    return c.json({ error: 'Failed to start quiz' }, 500);
  }
});

// POST /lms/quizzes/:id/submit - Submit quiz answers
lms.post('/quizzes/:id/submit', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const quizId = c.req.param('id');
  const { attemptId, answers } = await c.req.json();

  try {
    const attempt = await c.env.DB.prepare(`
      SELECT * FROM lms_quiz_attempts WHERE id = ? AND userId = ? AND status = 'in_progress'
    `).bind(attemptId, user.id).first();

    if (!attempt) {
      return c.json({ error: 'No active attempt found' }, 404);
    }

    const quiz = await c.env.DB.prepare(`
      SELECT * FROM lms_quizzes WHERE id = ?
    `).bind(quizId).first();

    // Get all questions with correct answers
    const questions = await c.env.DB.prepare(`
      SELECT * FROM lms_quiz_questions WHERE quizId = ?
    `).bind(quizId).all();

    // Grade answers
    let totalScore = 0;
    let maxScore = 0;
    const results: any[] = [];
    const gradedAnswers: Record<string, any> = {};

    for (const question of (questions.results || []) as any[]) {
      const userAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer ? JSON.parse(question.correctAnswer) : null;
      const points = question.points || 1;
      maxScore += points;

      let isCorrect = false;

      if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
        isCorrect = userAnswer === correctAnswer;
      } else if (question.questionType === 'multiple_select') {
        const userArr = Array.isArray(userAnswer) ? userAnswer.sort() : [];
        const correctArr = Array.isArray(correctAnswer) ? correctAnswer.sort() : [];
        isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr);
      } else if (question.questionType === 'short_answer') {
        // Simple case-insensitive match
        isCorrect = userAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();
      }

      if (isCorrect) {
        totalScore += points;
      }

      gradedAnswers[question.id] = {
        answer: userAnswer,
        isCorrect,
        points: isCorrect ? points : 0,
      };

      results.push({
        questionId: question.id,
        isCorrect,
        correctAnswer: (quiz as any).showCorrectAnswers ? correctAnswer : undefined,
        explanation: (quiz as any).showExplanations ? question.explanation : undefined,
        points: isCorrect ? points : 0,
      });
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = percentage >= ((quiz as any).passingScore || 70);

    // Calculate time spent
    const startTime = new Date((attempt as any).timeStarted).getTime();
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Update attempt
    await c.env.DB.prepare(`
      UPDATE lms_quiz_attempts
      SET status = 'graded', answers = ?, score = ?, maxScore = ?, percentage = ?,
          passed = ?, timeSpent = ?, timeSubmitted = datetime('now'), gradedAt = datetime('now')
      WHERE id = ?
    `).bind(
      JSON.stringify(gradedAnswers),
      totalScore,
      maxScore,
      percentage,
      passed ? 1 : 0,
      timeSpent,
      attemptId
    ).run();

    // Award XP if passed
    let xpAwarded = 0;
    const badgesAwarded: string[] = [];

    if (passed) {
      xpAwarded = (quiz as any).xpReward || LMS_XP_REWARDS.QUIZ_PASS;
      const awarded = await awardLmsXp(
        c.env.DB,
        user.id,
        xpAwarded,
        'Passed quiz',
        `${quizId}-${attemptId}`,
        'lms_quiz_pass'
      );
      if (!awarded) {
        xpAwarded = 0; // Already awarded for this quiz attempt
      }

      // Check and award quiz badges
      const quizBadges = await checkLmsBadges(c.env.DB, user.id, 'quiz_pass', { percentage });
      badgesAwarded.push(...quizBadges);
    }

    return c.json({
      attempt: {
        id: attemptId,
        status: 'graded',
        score: totalScore,
        maxScore,
        percentage,
        passed,
        timeSpent,
        timeSubmitted: new Date().toISOString(),
      },
      results,
      xpAwarded,
      passed,
      badgesAwarded,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return c.json({ error: 'Failed to submit quiz' }, 500);
  }
});

// =====================================================
// ASSIGNMENTS
// =====================================================

// GET /lms/assignments/:id - Get assignment details
lms.get('/assignments/:id', async (c) => {
  const user = c.get('user');
  const assignmentId = c.req.param('id');

  try {
    const assignment = await c.env.DB.prepare(`
      SELECT a.*, c.title as courseTitle
      FROM lms_assignments a
      JOIN lms_courses c ON a.courseId = c.id
      WHERE a.id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json({ error: 'Assignment not found' }, 404);
    }

    // Get rubric if exists
    let rubric = null;
    if ((assignment as any).rubricId) {
      rubric = await c.env.DB.prepare(`
        SELECT * FROM lms_rubrics WHERE id = ?
      `).bind((assignment as any).rubricId).first();
      if (rubric) {
        (rubric as any).criteria = JSON.parse((rubric as any).criteria);
      }
    }

    // Get user's submission
    let submission = null;
    if (user?.id) {
      submission = await c.env.DB.prepare(`
        SELECT * FROM lms_assignment_submissions
        WHERE assignmentId = ? AND userId = ?
        ORDER BY submittedAt DESC LIMIT 1
      `).bind(assignmentId, user.id).first();

      if (submission) {
        (submission as any).files = (submission as any).files ? JSON.parse((submission as any).files) : [];
      }
    }

    return c.json({
      ...assignment,
      allowedFileTypes: (assignment as any).allowedFileTypes ? JSON.parse((assignment as any).allowedFileTypes) : [],
      rubric,
      userSubmission: submission,
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return c.json({ error: 'Failed to fetch assignment' }, 500);
  }
});

// POST /lms/assignments/:id/submit - Submit assignment
lms.post('/assignments/:id/submit', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const assignmentId = c.req.param('id');
  const { content, files, urls } = await c.req.json();

  try {
    const assignment = await c.env.DB.prepare(`
      SELECT * FROM lms_assignments WHERE id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json({ error: 'Assignment not found' }, 404);
    }

    // Check enrollment
    const enrollment = await c.env.DB.prepare(`
      SELECT id FROM lms_enrollments WHERE courseId = ? AND userId = ? AND status = 'active'
    `).bind((assignment as any).courseId, user.id).first();

    if (!enrollment) {
      return c.json({ error: 'Not enrolled in this course' }, 403);
    }

    // Check if past due
    const isLate = (assignment as any).dueDate && new Date((assignment as any).dueDate) < new Date();
    let daysLate = 0;
    if (isLate && (assignment as any).dueDate) {
      daysLate = Math.ceil((Date.now() - new Date((assignment as any).dueDate).getTime()) / (1000 * 60 * 60 * 24));
    }

    // Create submission
    const submissionId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO lms_assignment_submissions
        (id, assignmentId, userId, enrollmentId, content, files, urls, status, isLate, daysLate, submittedAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, datetime('now'), datetime('now'))
    `).bind(
      submissionId,
      assignmentId,
      user.id,
      (enrollment as any).id,
      content || null,
      files ? JSON.stringify(files) : null,
      urls ? JSON.stringify(urls) : null,
      isLate ? 1 : 0,
      daysLate
    ).run();

    // Award XP for assignment submission
    const assignmentXP = (assignment as any).xpReward || LMS_XP_REWARDS.ASSIGNMENT_SUBMIT;
    await awardLmsXp(
      c.env.DB,
      user.id,
      assignmentXP,
      'Submitted assignment',
      submissionId,
      'lms_assignment_submit'
    );

    // Check and award assignment badges
    const badgesAwarded = await checkLmsBadges(c.env.DB, user.id, 'assignment_submit');

    return c.json({
      submission: {
        id: submissionId,
        assignmentId,
        status: 'submitted',
        isLate,
        daysLate,
        submittedAt: new Date().toISOString(),
      },
      xpAwarded: assignmentXP,
      badgesAwarded,
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return c.json({ error: 'Failed to submit assignment' }, 500);
  }
});

// =====================================================
// CERTIFICATES
// =====================================================

// GET /lms/certificates - Get user's certificates
lms.get('/certificates', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const certificates = await c.env.DB.prepare(`
      SELECT cert.*, c.thumbnailUrl as courseThumbnail
      FROM lms_certificates cert
      JOIN lms_courses c ON cert.courseId = c.id
      WHERE cert.userId = ? AND cert.revokedAt IS NULL
      ORDER BY cert.issuedAt DESC
    `).bind(user.id).all();

    return c.json({
      certificates: certificates.results || [],
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return c.json({ error: 'Failed to fetch certificates' }, 500);
  }
});

// GET /lms/certificates/:id - Get certificate details
lms.get('/certificates/:id', async (c) => {
  const certId = c.req.param('id');

  try {
    const certificate = await c.env.DB.prepare(`
      SELECT * FROM lms_certificates WHERE id = ? OR certificateNumber = ?
    `).bind(certId, certId).first();

    if (!certificate) {
      return c.json({ error: 'Certificate not found' }, 404);
    }

    return c.json(certificate);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return c.json({ error: 'Failed to fetch certificate' }, 500);
  }
});

// =====================================================
// CATEGORIES
// =====================================================

// GET /lms/categories - Get all categories
lms.get('/categories', async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT * FROM lms_categories WHERE isActive = 1 ORDER BY sortOrder ASC
    `).all();

    return c.json({
      categories: categories.results || [],
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// =====================================================
// INSTRUCTOR ENDPOINTS
// =====================================================

// GET /lms/instructor/courses - Get instructor's courses
lms.get('/instructor/courses', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const courses = await c.env.DB.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM lms_modules WHERE courseId = c.id) as moduleCount,
        (SELECT COUNT(*) FROM lms_lessons WHERE courseId = c.id) as lessonCount
      FROM lms_courses c
      WHERE c.instructorId = ?
      ORDER BY c.updatedAt DESC
    `).bind(user.id).all();

    return c.json({
      courses: courses.results?.map((course: any) => ({
        ...course,
        tags: course.tags ? JSON.parse(course.tags) : [],
        objectives: course.objectives ? JSON.parse(course.objectives) : [],
      })) || [],
    });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    return c.json({ error: 'Failed to fetch courses' }, 500);
  }
});

// POST /lms/courses - Create a new course
lms.post('/courses', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const { title, description, shortDescription, category, level, objectives, tags, thumbnailUrl, passingScore, xpReward } = body;

  if (!title) {
    return c.json({ error: 'Title is required' }, 400);
  }

  try {
    const id = crypto.randomUUID();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    await c.env.DB.prepare(`
      INSERT INTO lms_courses
        (id, title, slug, description, shortDescription, thumbnailUrl, instructorId, category, level, status, tags, objectives, passingScore, xpReward, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      title,
      slug,
      description || null,
      shortDescription || null,
      thumbnailUrl || null,
      user.id,
      category || 'general',
      level || 'beginner',
      tags ? JSON.stringify(tags) : null,
      objectives ? JSON.stringify(objectives) : null,
      passingScore || 70,
      xpReward || 100
    ).run();

    return c.json({
      id,
      slug,
      title,
      status: 'draft',
    }, 201);
  } catch (error) {
    console.error('Error creating course:', error);
    return c.json({ error: 'Failed to create course' }, 500);
  }
});

// PUT /lms/courses/:id - Update a course
lms.put('/courses/:id', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');
  const body = await c.req.json();

  try {
    // Check ownership
    const course = await c.env.DB.prepare(`
      SELECT instructorId FROM lms_courses WHERE id = ?
    `).bind(courseId).first();

    if (!course || ((course as any).instructorId !== user.id && user.role !== 'admin' && user.role !== 'super_admin')) {
      return c.json({ error: 'Course not found or access denied' }, 404);
    }

    const updateFields = ['title', 'description', 'shortDescription', 'thumbnailUrl', 'category', 'level', 'passingScore', 'xpReward', 'estimatedDuration'];
    const updates: string[] = [];
    const values: any[] = [];

    for (const field of updateFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (body.tags) {
      updates.push('tags = ?');
      values.push(JSON.stringify(body.tags));
    }

    if (body.objectives) {
      updates.push('objectives = ?');
      values.push(JSON.stringify(body.objectives));
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updatedAt = datetime("now")');
    values.push(courseId);

    await c.env.DB.prepare(`
      UPDATE lms_courses SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating course:', error);
    return c.json({ error: 'Failed to update course' }, 500);
  }
});

// POST /lms/courses/:id/publish - Publish a course
lms.post('/courses/:id/publish', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');

  try {
    const course = await c.env.DB.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM lms_lessons WHERE courseId = c.id) as lessonCount
      FROM lms_courses c WHERE c.id = ? AND c.instructorId = ?
    `).bind(courseId, user.id).first();

    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }

    if ((course as any).lessonCount === 0) {
      return c.json({ error: 'Course must have at least one lesson before publishing' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE lms_courses SET status = 'published', publishedAt = datetime('now'), updatedAt = datetime('now')
      WHERE id = ?
    `).bind(courseId).run();

    return c.json({ success: true, status: 'published' });
  } catch (error) {
    console.error('Error publishing course:', error);
    return c.json({ error: 'Failed to publish course' }, 500);
  }
});

// POST /lms/modules - Create a module
lms.post('/modules', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { courseId, title, description, sortOrder } = await c.req.json();

  if (!courseId || !title) {
    return c.json({ error: 'Course ID and title are required' }, 400);
  }

  try {
    // Verify course ownership
    const course = await c.env.DB.prepare(`
      SELECT instructorId FROM lms_courses WHERE id = ?
    `).bind(courseId).first();

    if (!course || ((course as any).instructorId !== user.id && user.role !== 'admin')) {
      return c.json({ error: 'Course not found or access denied' }, 404);
    }

    const id = crypto.randomUUID();
    const order = sortOrder ?? ((await c.env.DB.prepare(`
      SELECT COALESCE(MAX(sortOrder), -1) + 1 as nextOrder FROM lms_modules WHERE courseId = ?
    `).bind(courseId).first() as any)?.nextOrder ?? 0);

    await c.env.DB.prepare(`
      INSERT INTO lms_modules (id, courseId, title, description, sortOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(id, courseId, title, description || null, order).run();

    return c.json({ id, courseId, title, sortOrder: order }, 201);
  } catch (error) {
    console.error('Error creating module:', error);
    return c.json({ error: 'Failed to create module' }, 500);
  }
});

// POST /lms/lessons - Create a lesson
lms.post('/lessons', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const { moduleId, courseId, title, contentType, content, documentId, videoUrl, videoProvider, embedCode, sortOrder, estimatedDuration, isRequired, isPreviewable, xpReward } = body;

  if (!moduleId || !courseId || !title || !contentType) {
    return c.json({ error: 'Module ID, course ID, title, and content type are required' }, 400);
  }

  try {
    // Verify course ownership
    const course = await c.env.DB.prepare(`
      SELECT instructorId FROM lms_courses WHERE id = ?
    `).bind(courseId).first();

    if (!course || ((course as any).instructorId !== user.id && user.role !== 'admin')) {
      return c.json({ error: 'Course not found or access denied' }, 404);
    }

    const id = crypto.randomUUID();
    const order = sortOrder ?? ((await c.env.DB.prepare(`
      SELECT COALESCE(MAX(sortOrder), -1) + 1 as nextOrder FROM lms_lessons WHERE moduleId = ?
    `).bind(moduleId).first() as any)?.nextOrder ?? 0);

    await c.env.DB.prepare(`
      INSERT INTO lms_lessons
        (id, moduleId, courseId, title, contentType, content, documentId, videoUrl, videoProvider, embedCode, sortOrder, estimatedDuration, isRequired, isPreviewable, xpReward, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id, moduleId, courseId, title, contentType,
      content || null, documentId || null, videoUrl || null, videoProvider || null, embedCode || null,
      order, estimatedDuration || 0, isRequired !== false ? 1 : 0, isPreviewable ? 1 : 0, xpReward || 10
    ).run();

    // Auto-create quiz if contentType is 'quiz'
    let quizId = null;
    if (contentType === 'quiz') {
      quizId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO lms_quizzes
          (id, lessonId, courseId, title, quizType, passingScore, timeLimit, maxAttempts, shuffleQuestions, shuffleOptions, showCorrectAnswers, showExplanations, xpReward, questionCount, totalPoints, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, 'standard', 70, NULL, 3, 0, 0, 1, 1, 25, 0, 0, datetime('now'), datetime('now'))
      `).bind(quizId, id, courseId, title).run();
    }

    return c.json({ id, moduleId, title, contentType, sortOrder: order, quizId }, 201);
  } catch (error) {
    console.error('Error creating lesson:', error);
    return c.json({ error: 'Failed to create lesson' }, 500);
  }
});

// POST /lms/quizzes - Create a quiz
lms.post('/quizzes', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const { lessonId, courseId, title, description, instructions, quizType, passingScore, timeLimit, maxAttempts, shuffleQuestions, shuffleOptions, showCorrectAnswers, showExplanations, xpReward } = body;

  if (!courseId || !title) {
    return c.json({ error: 'Course ID and title are required' }, 400);
  }

  try {
    const id = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO lms_quizzes
        (id, lessonId, courseId, title, description, instructions, quizType, passingScore, timeLimit, maxAttempts, shuffleQuestions, shuffleOptions, showCorrectAnswers, showExplanations, xpReward, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id, lessonId || null, courseId, title, description || null, instructions || null,
      quizType || 'standard', passingScore || 70, timeLimit || null, maxAttempts || 3,
      shuffleQuestions ? 1 : 0, shuffleOptions ? 1 : 0, showCorrectAnswers !== false ? 1 : 0, showExplanations !== false ? 1 : 0,
      xpReward || 25
    ).run();

    return c.json({ id, title, courseId }, 201);
  } catch (error) {
    console.error('Error creating quiz:', error);
    return c.json({ error: 'Failed to create quiz' }, 500);
  }
});

// POST /lms/quizzes/:id/questions - Add questions to a quiz
lms.post('/quizzes/:id/questions', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const quizId = c.req.param('id');
  const body = await c.req.json();
  const { questionType, question, questionHtml, options, correctAnswer, explanation, hints, points, mediaUrl, mediaType } = body;

  if (!questionType || !question) {
    return c.json({ error: 'Question type and question text are required' }, 400);
  }

  try {
    const id = crypto.randomUUID();
    const sortOrder = (await c.env.DB.prepare(`
      SELECT COALESCE(MAX(sortOrder), -1) + 1 as nextOrder FROM lms_quiz_questions WHERE quizId = ?
    `).bind(quizId).first() as any)?.nextOrder || 0;

    await c.env.DB.prepare(`
      INSERT INTO lms_quiz_questions
        (id, quizId, questionType, question, questionHtml, options, correctAnswer, explanation, hints, points, sortOrder, mediaUrl, mediaType, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id, quizId, questionType, question, questionHtml || null,
      options ? JSON.stringify(options) : null,
      correctAnswer ? JSON.stringify(correctAnswer) : null,
      explanation || null,
      hints ? JSON.stringify(hints) : null,
      points || 1, sortOrder, mediaUrl || null, mediaType || null
    ).run();

    // Update quiz question count
    await c.env.DB.prepare(`
      UPDATE lms_quizzes SET questionCount = questionCount + 1, totalPoints = totalPoints + ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(points || 1, quizId).run();

    return c.json({ id, questionType, question }, 201);
  } catch (error) {
    console.error('Error adding question:', error);
    return c.json({ error: 'Failed to add question' }, 500);
  }
});

// GET /lms/quizzes/:id/questions - Get all questions for a quiz (instructor view with answers)
lms.get('/quizzes/:id/questions', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const quizId = c.req.param('id');

  try {
    // Verify quiz exists
    const quiz = await c.env.DB.prepare(`
      SELECT q.*, c.instructorId
      FROM lms_quizzes q
      JOIN lms_courses c ON q.courseId = c.id
      WHERE q.id = ?
    `).bind(quizId).first();

    if (!quiz) {
      return c.json({ error: 'Quiz not found' }, 404);
    }

    // Get all questions with correct answers
    const questions = await c.env.DB.prepare(`
      SELECT * FROM lms_quiz_questions WHERE quizId = ? ORDER BY sortOrder ASC
    `).bind(quizId).all();

    return c.json({
      quiz: {
        id: (quiz as any).id,
        title: (quiz as any).title,
        description: (quiz as any).description,
        quizType: (quiz as any).quizType,
        passingScore: (quiz as any).passingScore,
        timeLimit: (quiz as any).timeLimit,
        maxAttempts: (quiz as any).maxAttempts,
        shuffleQuestions: !!(quiz as any).shuffleQuestions,
        questionCount: (quiz as any).questionCount || 0,
        totalPoints: (quiz as any).totalPoints || 0,
      },
      questions: (questions.results || []).map((q: any) => ({
        id: q.id,
        questionType: q.questionType,
        question: q.question,
        questionHtml: q.questionHtml,
        options: q.options ? JSON.parse(q.options) : [],
        correctAnswer: q.correctAnswer ? JSON.parse(q.correctAnswer) : null,
        explanation: q.explanation,
        hints: q.hints ? JSON.parse(q.hints) : [],
        points: q.points || 1,
        sortOrder: q.sortOrder,
        mediaUrl: q.mediaUrl,
        mediaType: q.mediaType,
      })),
    });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    return c.json({ error: 'Failed to fetch questions' }, 500);
  }
});

// GET /lms/lessons/:lessonId/quiz - Get quiz by lesson ID (for instructors to navigate to quiz builder)
lms.get('/lessons/:lessonId/quiz', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const lessonId = c.req.param('lessonId');

  try {
    const quiz = await c.env.DB.prepare(`
      SELECT q.*, c.instructorId
      FROM lms_quizzes q
      JOIN lms_courses c ON q.courseId = c.id
      WHERE q.lessonId = ?
    `).bind(lessonId).first();

    if (!quiz) {
      return c.json({ error: 'Quiz not found for this lesson' }, 404);
    }

    // Check ownership
    if ((quiz as any).instructorId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      return c.json({ error: 'Access denied' }, 403);
    }

    return c.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz by lesson:', error);
    return c.json({ error: 'Failed to fetch quiz' }, 500);
  }
});

// PUT /lms/questions/:id - Update a question
lms.put('/questions/:id', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const questionId = c.req.param('id');
  const body = await c.req.json();
  const { questionType, question, questionHtml, options, correctAnswer, explanation, hints, points, mediaUrl, mediaType } = body;

  try {
    // Check question exists
    const existing = await c.env.DB.prepare(`
      SELECT q.*, lq.courseId
      FROM lms_quiz_questions q
      JOIN lms_quizzes lq ON q.quizId = lq.id
      WHERE q.id = ?
    `).bind(questionId).first();

    if (!existing) {
      return c.json({ error: 'Question not found' }, 404);
    }

    const oldPoints = (existing as any).points || 1;
    const newPoints = points || oldPoints;

    await c.env.DB.prepare(`
      UPDATE lms_quiz_questions SET
        questionType = COALESCE(?, questionType),
        question = COALESCE(?, question),
        questionHtml = ?,
        options = ?,
        correctAnswer = ?,
        explanation = ?,
        hints = ?,
        points = ?,
        mediaUrl = ?,
        mediaType = ?
      WHERE id = ?
    `).bind(
      questionType || null, question || null,
      questionHtml || null,
      options ? JSON.stringify(options) : null,
      correctAnswer ? JSON.stringify(correctAnswer) : null,
      explanation || null,
      hints ? JSON.stringify(hints) : null,
      newPoints, mediaUrl || null, mediaType || null,
      questionId
    ).run();

    // Update quiz total points if points changed
    if (newPoints !== oldPoints) {
      await c.env.DB.prepare(`
        UPDATE lms_quizzes SET totalPoints = totalPoints + ?, updatedAt = datetime('now')
        WHERE id = ?
      `).bind(newPoints - oldPoints, (existing as any).quizId).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating question:', error);
    return c.json({ error: 'Failed to update question' }, 500);
  }
});

// DELETE /lms/questions/:id - Delete a question
lms.delete('/questions/:id', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const questionId = c.req.param('id');

  try {
    const existing = await c.env.DB.prepare(`
      SELECT * FROM lms_quiz_questions WHERE id = ?
    `).bind(questionId).first();

    if (!existing) {
      return c.json({ error: 'Question not found' }, 404);
    }

    const quizId = (existing as any).quizId;
    const points = (existing as any).points || 1;

    await c.env.DB.prepare(`
      DELETE FROM lms_quiz_questions WHERE id = ?
    `).bind(questionId).run();

    // Update quiz stats
    await c.env.DB.prepare(`
      UPDATE lms_quizzes SET
        questionCount = questionCount - 1,
        totalPoints = totalPoints - ?,
        updatedAt = datetime('now')
      WHERE id = ?
    `).bind(points, quizId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return c.json({ error: 'Failed to delete question' }, 500);
  }
});

// PUT /lms/quizzes/:id/questions/reorder - Reorder questions
lms.put('/quizzes/:id/questions/reorder', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const quizId = c.req.param('id');
  const body = await c.req.json();
  const { questionIds } = body;

  if (!Array.isArray(questionIds)) {
    return c.json({ error: 'questionIds array is required' }, 400);
  }

  try {
    for (let i = 0; i < questionIds.length; i++) {
      await c.env.DB.prepare(`
        UPDATE lms_quiz_questions SET sortOrder = ? WHERE id = ? AND quizId = ?
      `).bind(i, questionIds[i], quizId).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error reordering questions:', error);
    return c.json({ error: 'Failed to reorder questions' }, 500);
  }
});

// PUT /lms/quizzes/:id - Update quiz settings
lms.put('/quizzes/:id', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const quizId = c.req.param('id');
  const body = await c.req.json();
  const { title, description, passingScore, timeLimit, maxAttempts, shuffleQuestions, xpReward } = body;

  try {
    await c.env.DB.prepare(`
      UPDATE lms_quizzes SET
        title = COALESCE(?, title),
        description = ?,
        passingScore = COALESCE(?, passingScore),
        timeLimit = ?,
        maxAttempts = COALESCE(?, maxAttempts),
        shuffleQuestions = ?,
        xpReward = COALESCE(?, xpReward),
        updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      title || null, description || null, passingScore || null,
      timeLimit || null, maxAttempts || null,
      shuffleQuestions ? 1 : 0, xpReward || null, quizId
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return c.json({ error: 'Failed to update quiz' }, 500);
  }
});

// GET /lms/instructor/courses/:id/students - Get enrolled students
lms.get('/instructor/courses/:id/students', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');

  try {
    const course = await c.env.DB.prepare(`
      SELECT c.* FROM lms_courses c WHERE c.id = ? AND c.instructorId = ?
    `).bind(courseId, user.id).first();

    if (!course) {
      return c.json({ error: 'Course not found or access denied' }, 403);
    }

    const students = await c.env.DB.prepare(`
      SELECT
        e.*,
        u.displayName, u.email, u.avatar, u.department
      FROM lms_enrollments e
      JOIN users u ON e.userId = u.id
      WHERE e.courseId = ?
      ORDER BY e.enrolledAt DESC
    `).bind(courseId).all();

    return c.json({
      students: students.results?.map((s: any) => ({
        enrollment: {
          id: s.id,
          status: s.status,
          progress: s.progress,
          lessonsCompleted: s.lessonsCompleted,
          totalLessons: s.totalLessons,
          timeSpent: s.timeSpent,
          enrolledAt: s.enrolledAt,
          completedAt: s.completedAt,
        },
        user: {
          id: s.userId,
          name: s.displayName,
          email: s.email,
          avatar: s.avatar,
          department: s.department,
        },
      })) || [],
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return c.json({ error: 'Failed to fetch students' }, 500);
  }
});

// GET /lms/instructor/courses/:id/grades - Get gradebook for a course
lms.get('/instructor/courses/:id/grades', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');

  try {
    const course = await c.env.DB.prepare(`
      SELECT c.* FROM lms_courses c WHERE c.id = ? AND c.instructorId = ?
    `).bind(courseId, user.id).first();

    if (!course) {
      return c.json({ error: 'Course not found or access denied' }, 403);
    }

    // Get all enrolled students with their grades
    const students = await c.env.DB.prepare(`
      SELECT
        e.id as enrollmentId,
        e.userId,
        e.status,
        e.progress,
        e.lessonsCompleted,
        e.totalLessons,
        e.enrolledAt,
        e.completedAt,
        u.displayName,
        u.email,
        u.avatar,
        u.department
      FROM lms_enrollments e
      JOIN users u ON e.userId = u.id
      WHERE e.courseId = ?
      ORDER BY u.displayName ASC
    `).bind(courseId).all();

    // Get all quizzes for this course
    const quizzes = await c.env.DB.prepare(`
      SELECT id, title, passingScore FROM lms_quizzes WHERE courseId = ?
    `).bind(courseId).all();

    // Get all assignments for this course
    const assignments = await c.env.DB.prepare(`
      SELECT id, title, maxScore FROM lms_assignments WHERE courseId = ?
    `).bind(courseId).all();

    // Get quiz attempts for all students
    const quizAttempts = await c.env.DB.prepare(`
      SELECT qa.userId, qa.quizId, qa.percentage, qa.passed,
             ROW_NUMBER() OVER (PARTITION BY qa.userId, qa.quizId ORDER BY qa.percentage DESC) as rn
      FROM lms_quiz_attempts qa
      JOIN lms_quizzes q ON qa.quizId = q.id
      WHERE q.courseId = ? AND qa.status = 'graded'
    `).bind(courseId).all();

    // Get assignment submissions for all students
    const submissions = await c.env.DB.prepare(`
      SELECT s.userId, s.assignmentId, s.score, s.maxScore, s.percentage, s.status
      FROM lms_assignment_submissions s
      JOIN lms_assignments a ON s.assignmentId = a.id
      WHERE a.courseId = ?
    `).bind(courseId).all();

    // Build gradebook entries
    const gradebook = (students.results || []).map((student: any) => {
      // Get best quiz scores for this student
      const studentQuizScores: Record<string, any> = {};
      (quizAttempts.results || [])
        .filter((qa: any) => qa.userId === student.userId && qa.rn === 1)
        .forEach((qa: any) => {
          studentQuizScores[qa.quizId] = {
            percentage: qa.percentage,
            passed: qa.passed,
          };
        });

      // Get assignment scores for this student
      const studentAssignmentScores: Record<string, any> = {};
      (submissions.results || [])
        .filter((s: any) => s.userId === student.userId)
        .forEach((s: any) => {
          studentAssignmentScores[s.assignmentId] = {
            score: s.score,
            maxScore: s.maxScore,
            percentage: s.percentage,
            status: s.status,
          };
        });

      // Calculate overall grade
      let totalPoints = 0;
      let earnedPoints = 0;

      (quizzes.results || []).forEach((q: any) => {
        totalPoints += 100;
        if (studentQuizScores[q.id]) {
          earnedPoints += studentQuizScores[q.id].percentage || 0;
        }
      });

      (assignments.results || []).forEach((a: any) => {
        totalPoints += a.maxScore || 100;
        if (studentAssignmentScores[a.id] && studentAssignmentScores[a.id].status === 'graded') {
          earnedPoints += studentAssignmentScores[a.id].percentage || 0;
        }
      });

      const overallGrade = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : null;
      const gradeLabel = overallGrade !== null
        ? overallGrade >= 90 ? 'A' : overallGrade >= 80 ? 'B' : overallGrade >= 70 ? 'C' : overallGrade >= 60 ? 'D' : 'F'
        : null;

      return {
        student: {
          id: student.userId,
          name: student.displayName,
          email: student.email,
          avatar: student.avatar,
          department: student.department,
        },
        enrollment: {
          id: student.enrollmentId,
          status: student.status,
          progress: student.progress,
          lessonsCompleted: student.lessonsCompleted,
          totalLessons: student.totalLessons,
          enrolledAt: student.enrolledAt,
          completedAt: student.completedAt,
        },
        quizScores: studentQuizScores,
        assignmentScores: studentAssignmentScores,
        overallGrade,
        gradeLabel,
      };
    });

    return c.json({
      gradebook,
      quizzes: quizzes.results || [],
      assignments: assignments.results || [],
    });
  } catch (error) {
    console.error('Error fetching gradebook:', error);
    return c.json({ error: 'Failed to fetch gradebook' }, 500);
  }
});

// GET /lms/instructor/courses/:id/analytics - Get course analytics
lms.get('/instructor/courses/:id/analytics', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');

  try {
    // Verify instructor owns this course
    const course = await c.env.DB.prepare(`
      SELECT * FROM lms_courses WHERE id = ? AND instructorId = ?
    `).bind(courseId, user.id).first();

    if (!course) {
      return c.json({ error: 'Course not found or unauthorized' }, 404);
    }

    // Get enrollment stats
    const enrollmentStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as totalEnrollments,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeEnrollments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedEnrollments,
        SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END) as droppedEnrollments,
        AVG(CASE WHEN status != 'dropped' THEN progress ELSE NULL END) as avgProgress,
        AVG(CASE WHEN status != 'dropped' THEN timeSpent ELSE NULL END) as avgTimeSpent
      FROM lms_enrollments
      WHERE courseId = ?
    `).bind(courseId).first();

    // Get enrollment trends (last 30 days)
    const enrollmentTrends = await c.env.DB.prepare(`
      SELECT
        DATE(enrolledAt) as date,
        COUNT(*) as enrollments
      FROM lms_enrollments
      WHERE courseId = ? AND enrolledAt >= datetime('now', '-30 days')
      GROUP BY DATE(enrolledAt)
      ORDER BY date ASC
    `).bind(courseId).all();

    // Get completion trends (last 30 days)
    const completionTrends = await c.env.DB.prepare(`
      SELECT
        DATE(completedAt) as date,
        COUNT(*) as completions
      FROM lms_enrollments
      WHERE courseId = ? AND status = 'completed' AND completedAt >= datetime('now', '-30 days')
      GROUP BY DATE(completedAt)
      ORDER BY date ASC
    `).bind(courseId).all();

    // Get quiz performance
    const quizPerformance = await c.env.DB.prepare(`
      SELECT
        q.id, q.title,
        COUNT(DISTINCT qa.userId) as attemptCount,
        AVG(qa.percentage) as avgScore,
        SUM(CASE WHEN qa.passed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as passRate,
        MIN(qa.percentage) as minScore,
        MAX(qa.percentage) as maxScore
      FROM lms_quizzes q
      LEFT JOIN lms_quiz_attempts qa ON q.id = qa.quizId AND qa.status = 'graded'
      WHERE q.courseId = ?
      GROUP BY q.id, q.title
      ORDER BY q.title ASC
    `).bind(courseId).all();

    // Get assignment completion stats
    const assignmentStats = await c.env.DB.prepare(`
      SELECT
        a.id, a.title,
        COUNT(DISTINCT s.userId) as submissionCount,
        SUM(CASE WHEN s.status = 'graded' THEN 1 ELSE 0 END) as gradedCount,
        AVG(CASE WHEN s.status = 'graded' THEN s.percentage ELSE NULL END) as avgScore,
        SUM(CASE WHEN s.isLate = 1 THEN 1 ELSE 0 END) as lateSubmissions
      FROM lms_assignments a
      LEFT JOIN lms_assignment_submissions s ON a.id = s.assignmentId
      WHERE a.courseId = ?
      GROUP BY a.id, a.title
    `).bind(courseId).all();

    // Get lesson completion rates
    const lessonCompletion = await c.env.DB.prepare(`
      SELECT
        l.id, l.title, l.contentType, l.sortOrder,
        COUNT(DISTINCT lp.userId) as completionCount
      FROM lms_lessons l
      LEFT JOIN lms_lesson_progress lp ON l.id = lp.lessonId AND lp.status = 'completed'
      WHERE l.courseId = ?
      GROUP BY l.id, l.title, l.contentType, l.sortOrder
      ORDER BY l.sortOrder ASC
    `).bind(courseId).all();

    // Get student engagement (active students per day - last 14 days)
    const studentEngagement = await c.env.DB.prepare(`
      SELECT
        DATE(lastAccessedAt) as date,
        COUNT(DISTINCT userId) as activeStudents
      FROM lms_enrollments
      WHERE courseId = ? AND lastAccessedAt >= datetime('now', '-14 days')
      GROUP BY DATE(lastAccessedAt)
      ORDER BY date ASC
    `).bind(courseId).all();

    // Get grade distribution
    const gradeDistribution = await c.env.DB.prepare(`
      SELECT
        CASE
          WHEN finalGrade >= 90 THEN 'A'
          WHEN finalGrade >= 80 THEN 'B'
          WHEN finalGrade >= 70 THEN 'C'
          WHEN finalGrade >= 60 THEN 'D'
          ELSE 'F'
        END as grade,
        COUNT(*) as count
      FROM lms_enrollments
      WHERE courseId = ? AND status = 'completed' AND finalGrade IS NOT NULL
      GROUP BY grade
    `).bind(courseId).all();

    // Get top performers
    const topPerformers = await c.env.DB.prepare(`
      SELECT
        u.id, u.displayName, u.avatar, u.department,
        e.progress, e.finalGrade, e.timeSpent, e.lessonsCompleted
      FROM lms_enrollments e
      JOIN users u ON e.userId = u.id
      WHERE e.courseId = ? AND e.status = 'completed'
      ORDER BY e.finalGrade DESC
      LIMIT 5
    `).bind(courseId).all();

    // Get struggling students (low progress, long time since access)
    const strugglingStudents = await c.env.DB.prepare(`
      SELECT
        u.id, u.displayName, u.avatar, u.email,
        e.progress, e.lessonsCompleted, e.totalLessons, e.lastAccessedAt
      FROM lms_enrollments e
      JOIN users u ON e.userId = u.id
      WHERE e.courseId = ? AND e.status = 'active'
        AND (e.progress < 30 OR e.lastAccessedAt < datetime('now', '-7 days'))
      ORDER BY e.progress ASC
      LIMIT 10
    `).bind(courseId).all();

    // Get discussion activity
    const discussionStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as totalDiscussions,
        SUM(replyCount) as totalReplies,
        COUNT(DISTINCT authorId) as uniqueParticipants
      FROM lms_discussions
      WHERE courseId = ?
    `).bind(courseId).first();

    // Calculate completion rate
    const totalEnrollments = (enrollmentStats as any)?.totalEnrollments || 0;
    const completedEnrollments = (enrollmentStats as any)?.completedEnrollments || 0;
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    // Calculate drop rate
    const droppedEnrollments = (enrollmentStats as any)?.droppedEnrollments || 0;
    const dropRate = totalEnrollments > 0 ? Math.round((droppedEnrollments / totalEnrollments) * 100) : 0;

    return c.json({
      overview: {
        totalEnrollments,
        activeEnrollments: (enrollmentStats as any)?.activeEnrollments || 0,
        completedEnrollments,
        droppedEnrollments,
        completionRate,
        dropRate,
        avgProgress: Math.round((enrollmentStats as any)?.avgProgress || 0),
        avgTimeSpent: Math.round((enrollmentStats as any)?.avgTimeSpent || 0),
      },
      enrollmentTrends: enrollmentTrends.results || [],
      completionTrends: completionTrends.results || [],
      quizPerformance: (quizPerformance.results || []).map((q: any) => ({
        ...q,
        avgScore: Math.round(q.avgScore || 0),
        passRate: Math.round(q.passRate || 0),
      })),
      assignmentStats: (assignmentStats.results || []).map((a: any) => ({
        ...a,
        avgScore: Math.round(a.avgScore || 0),
      })),
      lessonCompletion: lessonCompletion.results || [],
      studentEngagement: studentEngagement.results || [],
      gradeDistribution: gradeDistribution.results || [],
      topPerformers: topPerformers.results || [],
      strugglingStudents: strugglingStudents.results || [],
      discussionStats: {
        totalDiscussions: (discussionStats as any)?.totalDiscussions || 0,
        totalReplies: (discussionStats as any)?.totalReplies || 0,
        uniqueParticipants: (discussionStats as any)?.uniqueParticipants || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// GET /lms/instructor/assignments/:id - Get assignment details for grading interface
lms.get('/instructor/assignments/:id', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const assignmentId = c.req.param('id');

  try {
    // Get assignment with course info
    const assignment = await c.env.DB.prepare(`
      SELECT a.*, c.title as courseTitle, c.instructorId,
             l.title as lessonTitle
      FROM lms_assignments a
      JOIN lms_courses c ON a.courseId = c.id
      LEFT JOIN lms_lessons l ON a.lessonId = l.id
      WHERE a.id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json({ error: 'Assignment not found' }, 404);
    }

    // Check ownership
    if ((assignment as any).instructorId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Get rubric if exists
    let rubric = null;
    if ((assignment as any).rubricId) {
      rubric = await c.env.DB.prepare(`
        SELECT * FROM lms_rubrics WHERE id = ?
      `).bind((assignment as any).rubricId).first();

      if (rubric) {
        rubric = {
          ...rubric,
          criteria: JSON.parse((rubric as any).criteria || '[]'),
        };
      }
    }

    return c.json({
      ...assignment,
      rubric,
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return c.json({ error: 'Failed to fetch assignment' }, 500);
  }
});

// GET /lms/instructor/assignments/:id/submissions - Get all submissions for grading
lms.get('/instructor/assignments/:id/submissions', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const assignmentId = c.req.param('id');
  const { status, search } = c.req.query();

  try {
    // Verify assignment exists and user has access
    const assignment = await c.env.DB.prepare(`
      SELECT a.*, c.instructorId
      FROM lms_assignments a
      JOIN lms_courses c ON a.courseId = c.id
      WHERE a.id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json({ error: 'Assignment not found' }, 404);
    }

    if ((assignment as any).instructorId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Build query for submissions
    let whereClause = 'WHERE s.assignmentId = ?';
    const params: any[] = [assignmentId];

    if (status === 'pending') {
      whereClause += " AND s.status = 'submitted'";
    } else if (status === 'graded') {
      whereClause += " AND s.status = 'graded'";
    }

    if (search) {
      whereClause += ' AND u.displayName LIKE ?';
      params.push(`%${search}%`);
    }

    const submissions = await c.env.DB.prepare(`
      SELECT s.*,
             u.displayName as studentName, u.avatar as studentAvatar, u.email as studentEmail,
             g.displayName as graderName
      FROM lms_assignment_submissions s
      LEFT JOIN users u ON s.userId = u.id
      LEFT JOIN users g ON s.gradedById = g.id
      ${whereClause}
      ORDER BY s.submittedAt DESC
    `).bind(...params).all();

    // Parse files JSON for each submission
    const formattedSubmissions = (submissions.results || []).map((s: any) => ({
      ...s,
      files: s.files ? JSON.parse(s.files) : [],
      rubricScores: s.rubricScores ? JSON.parse(s.rubricScores) : null,
    }));

    // Get counts
    const counts = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as graded
      FROM lms_assignment_submissions
      WHERE assignmentId = ?
    `).bind(assignmentId).first();

    return c.json({
      submissions: formattedSubmissions,
      counts: {
        total: (counts as any)?.total || 0,
        pending: (counts as any)?.pending || 0,
        graded: (counts as any)?.graded || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return c.json({ error: 'Failed to fetch submissions' }, 500);
  }
});

// POST /lms/submissions/:id/grade - Grade a submission
lms.post('/submissions/:id/grade', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const submissionId = c.req.param('id');
  const { score, feedback, rubricScores } = await c.req.json();

  try {
    const submission = await c.env.DB.prepare(`
      SELECT s.*, a.maxScore, a.xpReward, a.latePenalty
      FROM lms_assignment_submissions s
      JOIN lms_assignments a ON s.assignmentId = a.id
      WHERE s.id = ?
    `).bind(submissionId).first();

    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    // Calculate final score with late penalty
    let finalScore = score;
    let latePenaltyApplied = 0;
    if ((submission as any).isLate && (submission as any).latePenalty > 0) {
      latePenaltyApplied = Math.min(100, (submission as any).daysLate * (submission as any).latePenalty);
      finalScore = Math.max(0, score - (score * latePenaltyApplied / 100));
    }

    const maxScore = (submission as any).maxScore || 100;
    const percentage = Math.round((finalScore / maxScore) * 100);

    await c.env.DB.prepare(`
      UPDATE lms_assignment_submissions
      SET score = ?, maxScore = ?, percentage = ?, feedback = ?, rubricScores = ?,
          latePenaltyApplied = ?, status = 'graded', gradedAt = datetime('now'), gradedById = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      finalScore, maxScore, percentage, feedback || null,
      rubricScores ? JSON.stringify(rubricScores) : null,
      latePenaltyApplied, user.id, submissionId
    ).run();

    // Award XP
    const xpReward = (submission as any).xpReward || 50;
    const xpAwarded = Math.round(xpReward * (percentage / 100));

    await c.env.DB.prepare(`
      UPDATE lms_assignment_submissions SET xpAwarded = ? WHERE id = ?
    `).bind(xpAwarded, submissionId).run();

    await c.env.DB.prepare(`
      INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId, createdAt)
      VALUES (?, ?, ?, 'Assignment graded', 'learning', ?, datetime('now'))
    `).bind(crypto.randomUUID(), (submission as any).userId, xpAwarded, submissionId).run();

    return c.json({
      submission: {
        id: submissionId,
        score: finalScore,
        maxScore,
        percentage,
        latePenaltyApplied,
        status: 'graded',
      },
      xpAwarded,
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    return c.json({ error: 'Failed to grade submission' }, 500);
  }
});

// =====================================================
// DISCUSSIONS
// =====================================================

// GET /lms/courses/:id/discussions - Get course discussions
lms.get('/courses/:id/discussions', async (c) => {
  const courseId = c.req.param('id');

  try {
    const discussions = await c.env.DB.prepare(`
      SELECT d.*, u.displayName as authorName, u.avatar as authorAvatar
      FROM lms_discussions d
      LEFT JOIN users u ON d.authorId = u.id
      WHERE d.courseId = ?
      ORDER BY d.isPinned DESC, d.lastReplyAt DESC, d.createdAt DESC
    `).bind(courseId).all();

    return c.json({
      discussions: discussions.results || [],
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return c.json({ error: 'Failed to fetch discussions' }, 500);
  }
});

// POST /lms/courses/:id/discussions - Create a discussion
lms.post('/courses/:id/discussions', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');
  const { title, content, lessonId } = await c.req.json();

  if (!title || !content) {
    return c.json({ error: 'Title and content are required' }, 400);
  }

  try {
    const id = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO lms_discussions (id, courseId, lessonId, authorId, title, content, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(id, courseId, lessonId || null, user.id, title, content).run();

    // Award XP for starting a discussion
    const discussionXP = 10;
    await c.env.DB.prepare(`
      INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId, createdAt)
      VALUES (?, ?, ?, 'Started course discussion', 'learning', ?, datetime('now'))
    `).bind(crypto.randomUUID(), user.id, discussionXP, id).run();

    // Check and award discussion badges
    const badgesAwarded = await checkLmsBadges(c.env.DB, user.id, 'discussion');

    return c.json({ id, title, xpAwarded: discussionXP, badgesAwarded }, 201);
  } catch (error) {
    console.error('Error creating discussion:', error);
    return c.json({ error: 'Failed to create discussion' }, 500);
  }
});

// GET /lms/discussions/:id - Get discussion with replies
lms.get('/discussions/:id', async (c) => {
  const discussionId = c.req.param('id');
  const user = c.get('user');

  try {
    // Get discussion
    const discussion = await c.env.DB.prepare(`
      SELECT d.*, u.displayName as authorName, u.avatar as authorAvatar
      FROM lms_discussions d
      LEFT JOIN users u ON d.authorId = u.id
      WHERE d.id = ?
    `).bind(discussionId).first();

    if (!discussion) {
      return c.json({ error: 'Discussion not found' }, 404);
    }

    // Increment view count
    await c.env.DB.prepare(`
      UPDATE lms_discussions SET viewCount = viewCount + 1 WHERE id = ?
    `).bind(discussionId).run();

    // Get replies
    const replies = await c.env.DB.prepare(`
      SELECT r.*, u.displayName as authorName, u.avatar as authorAvatar,
             (SELECT 1 FROM lms_discussion_likes WHERE replyId = r.id AND userId = ? LIMIT 1) as isLikedByUser
      FROM lms_discussion_replies r
      LEFT JOIN users u ON r.authorId = u.id
      WHERE r.discussionId = ? AND r.parentId IS NULL
      ORDER BY r.createdAt ASC
    `).bind(user?.id || '', discussionId).all();

    // Get nested replies
    const allNestedReplies = await c.env.DB.prepare(`
      SELECT r.*, u.displayName as authorName, u.avatar as authorAvatar,
             (SELECT 1 FROM lms_discussion_likes WHERE replyId = r.id AND userId = ? LIMIT 1) as isLikedByUser
      FROM lms_discussion_replies r
      LEFT JOIN users u ON r.authorId = u.id
      WHERE r.discussionId = ? AND r.parentId IS NOT NULL
      ORDER BY r.createdAt ASC
    `).bind(user?.id || '', discussionId).all();

    // Build nested reply tree
    const buildReplyTree = (parentId: string): any[] => {
      return (allNestedReplies.results || [])
        .filter((r: any) => r.parentId === parentId)
        .map((r: any) => ({
          ...r,
          isLikedByUser: !!r.isLikedByUser,
          author: { name: r.authorName, avatar: r.authorAvatar },
          replies: buildReplyTree(r.id),
        }));
    };

    const formattedReplies = (replies.results || []).map((r: any) => ({
      ...r,
      isLikedByUser: !!r.isLikedByUser,
      author: { name: r.authorName, avatar: r.authorAvatar },
      replies: buildReplyTree(r.id),
    }));

    return c.json({
      ...(discussion as any),
      author: { name: (discussion as any).authorName, avatar: (discussion as any).authorAvatar },
      viewCount: ((discussion as any).viewCount || 0) + 1,
      replies: formattedReplies,
    });
  } catch (error) {
    console.error('Error fetching discussion:', error);
    return c.json({ error: 'Failed to fetch discussion' }, 500);
  }
});

// POST /lms/discussions/:id/replies - Add a reply
lms.post('/discussions/:id/replies', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const discussionId = c.req.param('id');
  const { content, parentId } = await c.req.json();

  if (!content?.trim()) {
    return c.json({ error: 'Content is required' }, 400);
  }

  try {
    // Verify discussion exists
    const discussion = await c.env.DB.prepare(`
      SELECT id, isLocked, courseId FROM lms_discussions WHERE id = ?
    `).bind(discussionId).first();

    if (!discussion) {
      return c.json({ error: 'Discussion not found' }, 404);
    }

    if ((discussion as any).isLocked) {
      return c.json({ error: 'Discussion is locked' }, 403);
    }

    const id = crypto.randomUUID();
    const isInstructorPost = isInstructor(user.role);

    await c.env.DB.prepare(`
      INSERT INTO lms_discussion_replies
        (id, discussionId, authorId, parentId, content, isInstructorPost, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(id, discussionId, user.id, parentId || null, content.trim(), isInstructorPost ? 1 : 0).run();

    // Update reply count and last reply time
    await c.env.DB.prepare(`
      UPDATE lms_discussions
      SET replyCount = replyCount + 1, lastReplyAt = datetime('now'), updatedAt = datetime('now')
      WHERE id = ?
    `).bind(discussionId).run();

    // Award XP for reply
    const replyXP = 5;
    await c.env.DB.prepare(`
      INSERT INTO xp_transactions (id, userId, amount, reason, referenceType, referenceId, createdAt)
      VALUES (?, ?, ?, 'Replied to discussion', 'learning', ?, datetime('now'))
    `).bind(crypto.randomUUID(), user.id, replyXP, id).run();

    // Get user info for response
    const userInfo = await c.env.DB.prepare(`
      SELECT displayName, avatar FROM users WHERE id = ?
    `).bind(user.id).first();

    return c.json({
      reply: {
        id,
        discussionId,
        parentId,
        content: content.trim(),
        isInstructorPost,
        likes: 0,
        isLikedByUser: false,
        createdAt: new Date().toISOString(),
        author: {
          name: (userInfo as any)?.displayName || 'User',
          avatar: (userInfo as any)?.avatar,
        },
        replies: [],
      },
      xpAwarded: replyXP,
    }, 201);
  } catch (error) {
    console.error('Error creating reply:', error);
    return c.json({ error: 'Failed to create reply' }, 500);
  }
});

// =====================================================
// ADMIN ENDPOINTS
// =====================================================

// GET /lms/admin/stats - Get LMS statistics
lms.get('/admin/stats', async (c) => {
  const user = c.get('user');
  if (!user?.id || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Count courses by status
    const courseCounts = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as totalCourses,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedCourses,
        SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pendingCourses,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draftCourses
      FROM lms_courses
    `).first();

    // Count enrollments and certificates
    const enrollmentStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as totalEnrollments,
        AVG(progress) as averageCompletion
      FROM lms_enrollments
      WHERE status != 'dropped'
    `).first();

    const certificateCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_certificates
    `).first();

    const instructorCount = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT instructorId) as count FROM lms_courses
    `).first();

    // Top courses
    const topCourses = await c.env.DB.prepare(`
      SELECT id, title, enrollmentCount as enrollments
      FROM lms_courses
      WHERE status = 'published'
      ORDER BY enrollmentCount DESC
      LIMIT 5
    `).all();

    return c.json({
      totalCourses: (courseCounts as any)?.totalCourses || 0,
      publishedCourses: (courseCounts as any)?.publishedCourses || 0,
      pendingCourses: (courseCounts as any)?.pendingCourses || 0,
      draftCourses: (courseCounts as any)?.draftCourses || 0,
      totalEnrollments: (enrollmentStats as any)?.totalEnrollments || 0,
      averageCompletion: Math.round((enrollmentStats as any)?.averageCompletion || 0),
      totalCertificates: (certificateCount as any)?.count || 0,
      totalInstructors: (instructorCount as any)?.count || 0,
      topCourses: topCourses.results || [],
    });
  } catch (error) {
    console.error('Error fetching LMS stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// GET /lms/admin/courses - Get all courses for admin
lms.get('/admin/courses', async (c) => {
  const user = c.get('user');
  if (!user?.id || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const courses = await c.env.DB.prepare(`
      SELECT c.*,
             u.displayName as instructorName, u.avatar as instructorAvatar,
             (SELECT COUNT(*) FROM lms_modules WHERE courseId = c.id) as moduleCount,
             (SELECT COUNT(*) FROM lms_lessons WHERE courseId = c.id) as lessonCount
      FROM lms_courses c
      LEFT JOIN users u ON c.instructorId = u.id
      ORDER BY c.createdAt DESC
    `).all();

    return c.json({
      courses: courses.results || [],
    });
  } catch (error) {
    console.error('Error fetching admin courses:', error);
    return c.json({ error: 'Failed to fetch courses' }, 500);
  }
});

// GET /lms/admin/instructors - Get all instructors
lms.get('/admin/instructors', async (c) => {
  const user = c.get('user');
  if (!user?.id || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const instructors = await c.env.DB.prepare(`
      SELECT u.id, u.displayName, u.email, u.avatar, u.role, u.createdAt,
             COUNT(DISTINCT c.id) as courseCount,
             COALESCE(SUM(c.enrollmentCount), 0) as totalEnrollments,
             COALESCE(AVG(c.averageRating), 0) as averageRating
      FROM users u
      LEFT JOIN lms_courses c ON c.instructorId = u.id
      WHERE u.role IN ('instructor', 'admin', 'super_admin', 'director')
      GROUP BY u.id
      ORDER BY courseCount DESC
    `).all();

    return c.json({
      instructors: instructors.results || [],
    });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return c.json({ error: 'Failed to fetch instructors' }, 500);
  }
});

// POST /lms/admin/courses/:id/approve - Approve a course
lms.post('/admin/courses/:id/approve', async (c) => {
  const user = c.get('user');
  if (!user?.id || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');

  try {
    await c.env.DB.prepare(`
      UPDATE lms_courses
      SET status = 'published', publishedAt = datetime('now'), updatedAt = datetime('now')
      WHERE id = ? AND status = 'pending_review'
    `).bind(courseId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error approving course:', error);
    return c.json({ error: 'Failed to approve course' }, 500);
  }
});

// POST /lms/admin/courses/:id/reject - Reject a course
lms.post('/admin/courses/:id/reject', async (c) => {
  const user = c.get('user');
  if (!user?.id || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');

  try {
    await c.env.DB.prepare(`
      UPDATE lms_courses
      SET status = 'draft', updatedAt = datetime('now')
      WHERE id = ? AND status = 'pending_review'
    `).bind(courseId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error rejecting course:', error);
    return c.json({ error: 'Failed to reject course' }, 500);
  }
});

// POST /lms/admin/courses/:id/archive - Archive a course
lms.post('/admin/courses/:id/archive', async (c) => {
  const user = c.get('user');
  if (!user?.id || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');

  try {
    await c.env.DB.prepare(`
      UPDATE lms_courses
      SET status = 'archived', updatedAt = datetime('now')
      WHERE id = ?
    `).bind(courseId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error archiving course:', error);
    return c.json({ error: 'Failed to archive course' }, 500);
  }
});

// GET /lms/admin/certificates - Get all issued certificates
lms.get('/admin/certificates', async (c) => {
  const user = c.get('user');
  if (!user?.id || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const certificates = await c.env.DB.prepare(`
      SELECT
        cert.*,
        u.displayName as recipientDisplayName,
        u.email as recipientEmail
      FROM lms_certificates cert
      LEFT JOIN users u ON cert.userId = u.id
      ORDER BY cert.completionDate DESC
      LIMIT 100
    `).all();

    return c.json({
      certificates: (certificates.results || []).map((cert: any) => ({
        ...cert,
        recipientName: cert.recipientName || cert.recipientDisplayName,
      })),
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return c.json({ error: 'Failed to fetch certificates' }, 500);
  }
});

// GET /lms/admin/certificate-settings - Get certificate settings
lms.get('/admin/certificate-settings', async (c) => {
  const user = c.get('user');
  if (!user?.id || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Try to get settings from database
    const settings = await c.env.DB.prepare(`
      SELECT value FROM lms_settings WHERE key = 'certificate_settings'
    `).first();

    if (settings?.value) {
      return c.json(JSON.parse(settings.value as string));
    }

    // Return default settings if none found
    return c.json({
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
  } catch (error) {
    // Table might not exist, return defaults
    return c.json({
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
  }
});

// POST /lms/admin/certificate-settings - Save certificate settings
lms.post('/admin/certificate-settings', async (c) => {
  const user = c.get('user');
  if (!user?.id || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const settingsJson = JSON.stringify(body);

    // Try to create the settings table if it doesn't exist
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lms_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // Upsert the certificate settings
    await c.env.DB.prepare(`
      INSERT INTO lms_settings (key, value, updatedAt)
      VALUES ('certificate_settings', ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
    `).bind(settingsJson).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving certificate settings:', error);
    return c.json({ error: 'Failed to save settings' }, 500);
  }
});

// =====================================================
// PEER REVIEW ENDPOINTS
// =====================================================

// GET /lms/peer-reviews/pending - Get pending peer reviews for the logged-in user
lms.get('/peer-reviews/pending', requireAuth, async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const pendingReviews = await c.env.DB.prepare(`
      SELECT
        pr.*,
        a.title as assignmentTitle,
        a.instructions as assignmentInstructions,
        a.rubricId,
        a.peerReviewDueDate,
        c.title as courseTitle,
        c.id as courseId,
        sub.content as submissionContent,
        sub.files as submissionFiles,
        sub.submittedAt as submissionDate
      FROM lms_peer_reviews pr
      JOIN lms_assignment_submissions sub ON pr.submissionId = sub.id
      JOIN lms_assignments a ON pr.assignmentId = a.id
      JOIN lms_courses c ON a.courseId = c.id
      WHERE pr.reviewerId = ? AND pr.status = 'pending'
      ORDER BY a.peerReviewDueDate ASC, pr.assignedAt ASC
    `).bind(user.id).all();

    // Get rubrics for assignments that have them
    const reviewsWithRubrics = await Promise.all(
      (pendingReviews.results || []).map(async (review: any) => {
        if (review.rubricId) {
          const rubric = await c.env.DB.prepare(`
            SELECT * FROM lms_rubrics WHERE id = ?
          `).bind(review.rubricId).first();
          return { ...review, rubric };
        }
        return review;
      })
    );

    return c.json({ reviews: reviewsWithRubrics });
  } catch (error) {
    console.error('Error fetching pending peer reviews:', error);
    return c.json({ error: 'Failed to fetch peer reviews' }, 500);
  }
});

// GET /lms/peer-reviews/:id - Get a specific peer review assignment
lms.get('/peer-reviews/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const reviewId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const review = await c.env.DB.prepare(`
      SELECT
        pr.*,
        a.title as assignmentTitle,
        a.instructions as assignmentInstructions,
        a.rubricId,
        a.maxScore,
        a.peerReviewDueDate,
        c.title as courseTitle,
        c.id as courseId,
        sub.content as submissionContent,
        sub.contentHtml as submissionContentHtml,
        sub.files as submissionFiles,
        sub.urls as submissionUrls,
        sub.submittedAt as submissionDate
      FROM lms_peer_reviews pr
      JOIN lms_assignment_submissions sub ON pr.submissionId = sub.id
      JOIN lms_assignments a ON pr.assignmentId = a.id
      JOIN lms_courses c ON a.courseId = c.id
      WHERE pr.id = ? AND pr.reviewerId = ?
    `).bind(reviewId, user.id).first();

    if (!review) {
      return c.json({ error: 'Peer review not found' }, 404);
    }

    // Get rubric if exists
    let rubric = null;
    if ((review as any).rubricId) {
      rubric = await c.env.DB.prepare(`
        SELECT * FROM lms_rubrics WHERE id = ?
      `).bind((review as any).rubricId).first();
    }

    return c.json({ review: { ...review, rubric } });
  } catch (error) {
    console.error('Error fetching peer review:', error);
    return c.json({ error: 'Failed to fetch peer review' }, 500);
  }
});

// POST /lms/peer-reviews/:id/submit - Submit a peer review
lms.post('/peer-reviews/:id/submit', requireAuth, async (c) => {
  const user = c.get('user');
  const reviewId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { scores, totalScore, overallFeedback } = body;

    // Verify the review belongs to this user and is pending
    const review = await c.env.DB.prepare(`
      SELECT * FROM lms_peer_reviews WHERE id = ? AND reviewerId = ? AND status = 'pending'
    `).bind(reviewId, user.id).first();

    if (!review) {
      return c.json({ error: 'Peer review not found or already submitted' }, 404);
    }

    // Update the peer review
    await c.env.DB.prepare(`
      UPDATE lms_peer_reviews
      SET scores = ?, totalScore = ?, overallFeedback = ?, status = 'completed', submittedAt = datetime('now')
      WHERE id = ?
    `).bind(
      JSON.stringify(scores || {}),
      totalScore || 0,
      overallFeedback || '',
      reviewId
    ).run();

    // Check if all peer reviews for this submission are complete
    const submissionId = (review as any).submissionId;
    const pendingCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_peer_reviews
      WHERE submissionId = ? AND status = 'pending'
    `).bind(submissionId).first();

    // If all reviews complete, calculate average peer review score
    if ((pendingCount as any)?.count === 0) {
      const allReviews = await c.env.DB.prepare(`
        SELECT totalScore FROM lms_peer_reviews WHERE submissionId = ? AND status = 'completed'
      `).bind(submissionId).all();

      if (allReviews.results && allReviews.results.length > 0) {
        const avgScore = allReviews.results.reduce((sum: number, r: any) => sum + (r.totalScore || 0), 0) / allReviews.results.length;

        // Update submission with peer review average (optional - instructor may override)
        await c.env.DB.prepare(`
          UPDATE lms_assignment_submissions
          SET updatedAt = datetime('now')
          WHERE id = ?
        `).bind(submissionId).run();
      }
    }

    // Award XP for completing peer review
    await awardLmsXp(
      c.env.DB,
      user.id,
      LMS_XP_REWARDS.PEER_REVIEW,
      'Completed peer review',
      reviewId,
      'lms_peer_review'
    );

    return c.json({ success: true, message: 'Peer review submitted successfully' });
  } catch (error) {
    console.error('Error submitting peer review:', error);
    return c.json({ error: 'Failed to submit peer review' }, 500);
  }
});

// GET /lms/submissions/:id/peer-reviews - Get all peer reviews for a submission
lms.get('/submissions/:id/peer-reviews', requireAuth, async (c) => {
  const user = c.get('user');
  const submissionId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Verify user owns this submission or is instructor
    const submission = await c.env.DB.prepare(`
      SELECT s.*, a.courseId, a.instructorId
      FROM lms_assignment_submissions s
      JOIN lms_assignments a ON s.assignmentId = a.id
      WHERE s.id = ?
    `).bind(submissionId).first();

    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    const isOwner = (submission as any).userId === user.id;
    const isInstructorOrAdmin = isInstructor(user.role);

    if (!isOwner && !isInstructorOrAdmin) {
      return c.json({ error: 'Not authorized to view these reviews' }, 403);
    }

    // Get completed peer reviews (hide reviewer identity if anonymous)
    const reviews = await c.env.DB.prepare(`
      SELECT
        pr.id,
        pr.scores,
        pr.totalScore,
        pr.overallFeedback,
        pr.submittedAt,
        pr.isAnonymous,
        pr.helpfulVotes,
        CASE WHEN pr.isAnonymous = 0 OR ? = 1 THEN u.displayName ELSE 'Anonymous Reviewer' END as reviewerName,
        CASE WHEN pr.isAnonymous = 0 OR ? = 1 THEN u.avatar ELSE NULL END as reviewerAvatar
      FROM lms_peer_reviews pr
      LEFT JOIN users u ON pr.reviewerId = u.id
      WHERE pr.submissionId = ? AND pr.status = 'completed'
      ORDER BY pr.submittedAt DESC
    `).bind(isInstructorOrAdmin ? 1 : 0, isInstructorOrAdmin ? 1 : 0, submissionId).all();

    // Calculate average score
    const avgScore = reviews.results && reviews.results.length > 0
      ? reviews.results.reduce((sum: number, r: any) => sum + (r.totalScore || 0), 0) / reviews.results.length
      : null;

    return c.json({
      reviews: reviews.results || [],
      averageScore: avgScore,
      totalReviews: reviews.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching submission peer reviews:', error);
    return c.json({ error: 'Failed to fetch peer reviews' }, 500);
  }
});

// POST /lms/assignments/:id/assign-peer-reviews - Auto-assign peer reviews (instructor)
lms.post('/assignments/:id/assign-peer-reviews', requireAuth, async (c) => {
  const user = c.get('user');
  const assignmentId = c.req.param('id');

  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get assignment details
    const assignment = await c.env.DB.prepare(`
      SELECT * FROM lms_assignments WHERE id = ?
    `).bind(assignmentId).first();

    if (!assignment) {
      return c.json({ error: 'Assignment not found' }, 404);
    }

    if (!(assignment as any).requiresPeerReview) {
      return c.json({ error: 'This assignment does not require peer review' }, 400);
    }

    const peerReviewCount = (assignment as any).peerReviewCount || 2;

    // Get all submitted submissions for this assignment
    const submissions = await c.env.DB.prepare(`
      SELECT id, userId FROM lms_assignment_submissions
      WHERE assignmentId = ? AND status IN ('submitted', 'late')
      ORDER BY submittedAt ASC
    `).bind(assignmentId).all();

    const submissionList = submissions.results || [];

    if (submissionList.length < 2) {
      return c.json({ error: 'Need at least 2 submissions to assign peer reviews' }, 400);
    }

    // Clear existing pending peer reviews for this assignment
    await c.env.DB.prepare(`
      DELETE FROM lms_peer_reviews WHERE assignmentId = ? AND status = 'pending'
    `).bind(assignmentId).run();

    // Assign peer reviews in round-robin fashion
    const assignmentsCreated: string[] = [];

    for (let i = 0; i < submissionList.length; i++) {
      const submission = submissionList[i] as any;
      let reviewersAssigned = 0;

      for (let j = 1; reviewersAssigned < peerReviewCount && j < submissionList.length; j++) {
        const reviewerIndex = (i + j) % submissionList.length;
        const reviewer = submissionList[reviewerIndex] as any;

        // Don't assign self-reviews
        if (reviewer.userId === submission.userId) continue;

        // Check if this pair already has a completed review
        const existing = await c.env.DB.prepare(`
          SELECT id FROM lms_peer_reviews
          WHERE submissionId = ? AND reviewerId = ? AND status = 'completed'
        `).bind(submission.id, reviewer.userId).first();

        if (!existing) {
          const reviewId = crypto.randomUUID();
          await c.env.DB.prepare(`
            INSERT INTO lms_peer_reviews (id, submissionId, reviewerId, assignmentId, status, isAnonymous, assignedAt)
            VALUES (?, ?, ?, ?, 'pending', 1, datetime('now'))
          `).bind(reviewId, submission.id, reviewer.userId, assignmentId).run();

          assignmentsCreated.push(reviewId);
          reviewersAssigned++;
        }
      }
    }

    return c.json({
      success: true,
      message: `Assigned ${assignmentsCreated.length} peer reviews`,
      count: assignmentsCreated.length
    });
  } catch (error) {
    console.error('Error assigning peer reviews:', error);
    return c.json({ error: 'Failed to assign peer reviews' }, 500);
  }
});

// POST /lms/peer-reviews/:id/helpful - Vote a peer review as helpful
lms.post('/peer-reviews/:id/helpful', requireAuth, async (c) => {
  const user = c.get('user');
  const reviewId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Verify user owns the submission being reviewed
    const review = await c.env.DB.prepare(`
      SELECT pr.*, sub.userId as submissionOwnerId
      FROM lms_peer_reviews pr
      JOIN lms_assignment_submissions sub ON pr.submissionId = sub.id
      WHERE pr.id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    if ((review as any).submissionOwnerId !== user.id) {
      return c.json({ error: 'Only submission owner can vote on reviews' }, 403);
    }

    // Increment helpful votes
    await c.env.DB.prepare(`
      UPDATE lms_peer_reviews SET helpfulVotes = helpfulVotes + 1 WHERE id = ?
    `).bind(reviewId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error voting review helpful:', error);
    return c.json({ error: 'Failed to vote' }, 500);
  }
});

// POST /lms/discussions/replies/:id/like - Like/unlike a reply
lms.post('/discussions/replies/:id/like', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const replyId = c.req.param('id');

  try {
    // Check if already liked
    const existingLike = await c.env.DB.prepare(`
      SELECT id FROM lms_discussion_likes WHERE replyId = ? AND userId = ?
    `).bind(replyId, user.id).first();

    if (existingLike) {
      // Unlike
      await c.env.DB.prepare(`
        DELETE FROM lms_discussion_likes WHERE replyId = ? AND userId = ?
      `).bind(replyId, user.id).run();

      await c.env.DB.prepare(`
        UPDATE lms_discussion_replies SET likes = MAX(0, likes - 1) WHERE id = ?
      `).bind(replyId).run();

      return c.json({ liked: false });
    } else {
      // Like
      await c.env.DB.prepare(`
        INSERT INTO lms_discussion_likes (id, replyId, userId, createdAt)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(crypto.randomUUID(), replyId, user.id).run();

      await c.env.DB.prepare(`
        UPDATE lms_discussion_replies SET likes = likes + 1 WHERE id = ?
      `).bind(replyId).run();

      return c.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return c.json({ error: 'Failed to toggle like' }, 500);
  }
});

// =====================================================
// COURSE REVIEWS/RATINGS
// =====================================================

// GET /lms/courses/:id/reviews - Get reviews for a course
lms.get('/courses/:id/reviews', async (c) => {
  const courseId = c.req.param('id');
  const user = c.get('user');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);
  const offset = (page - 1) * limit;
  const sortBy = c.req.query('sort') || 'newest'; // newest, oldest, helpful, highest, lowest

  try {
    // Get course info including review stats
    const course = await c.env.DB.prepare(`
      SELECT id, title, averageRating, ratingCount FROM lms_courses WHERE id = ?
    `).bind(courseId).first();

    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }

    // Calculate rating distribution
    const { results: ratingDist } = await c.env.DB.prepare(`
      SELECT rating, COUNT(*) as count
      FROM lms_course_reviews
      WHERE courseId = ? AND isHidden = 0
      GROUP BY rating
      ORDER BY rating DESC
    `).bind(courseId).all();

    const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDist?.forEach((r: any) => {
      ratingDistribution[r.rating] = r.count;
    });

    // Build order clause
    let orderBy = 'r.createdAt DESC';
    if (sortBy === 'oldest') orderBy = 'r.createdAt ASC';
    else if (sortBy === 'helpful') orderBy = 'r.helpfulVotes DESC, r.createdAt DESC';
    else if (sortBy === 'highest') orderBy = 'r.rating DESC, r.createdAt DESC';
    else if (sortBy === 'lowest') orderBy = 'r.rating ASC, r.createdAt DESC';

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_course_reviews WHERE courseId = ? AND isHidden = 0
    `).bind(courseId).first();

    // Get reviews
    const { results } = await c.env.DB.prepare(`
      SELECT r.*, u.displayName as userName, u.avatar as userAvatar, u.department as userDepartment
      FROM lms_course_reviews r
      LEFT JOIN users u ON r.userId = u.id
      WHERE r.courseId = ? AND r.isHidden = 0
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).bind(courseId, limit, offset).all();

    // Check if current user has reviewed
    let userReview = null;
    if (user?.id) {
      userReview = await c.env.DB.prepare(`
        SELECT * FROM lms_course_reviews WHERE courseId = ? AND userId = ?
      `).bind(courseId, user.id).first();
    }

    return c.json({
      reviews: results || [],
      total: (countResult as any)?.count || 0,
      page,
      totalPages: Math.ceil(((countResult as any)?.count || 0) / limit),
      averageRating: (course as any).averageRating || 0,
      totalReviews: (course as any).ratingCount || 0,
      ratingDistribution,
      userReview,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// POST /lms/courses/:id/reviews - Create or update a review
lms.post('/courses/:id/reviews', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');
  const body = await c.req.json();
  const { rating, review } = body;

  if (!rating || rating < 1 || rating > 5) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400);
  }

  try {
    // Check if user is enrolled in the course
    const enrollment = await c.env.DB.prepare(`
      SELECT id, status, progress FROM lms_enrollments WHERE courseId = ? AND userId = ?
    `).bind(courseId, user.id).first();

    if (!enrollment) {
      return c.json({ error: 'You must be enrolled in the course to review it' }, 403);
    }

    // Check if review already exists
    const existingReview = await c.env.DB.prepare(`
      SELECT id FROM lms_course_reviews WHERE courseId = ? AND userId = ?
    `).bind(courseId, user.id).first();

    const now = new Date().toISOString();

    if (existingReview) {
      // Update existing review
      await c.env.DB.prepare(`
        UPDATE lms_course_reviews
        SET rating = ?, review = ?, updatedAt = ?
        WHERE id = ?
      `).bind(rating, review || null, now, (existingReview as any).id).run();
    } else {
      // Create new review
      const reviewId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO lms_course_reviews (id, courseId, userId, enrollmentId, rating, review, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(reviewId, courseId, user.id, (enrollment as any).id, rating, review || null, now, now).run();
    }

    // Update course average rating
    const ratingStats = await c.env.DB.prepare(`
      SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount
      FROM lms_course_reviews
      WHERE courseId = ? AND isHidden = 0
    `).bind(courseId).first();

    await c.env.DB.prepare(`
      UPDATE lms_courses
      SET averageRating = ?, ratingCount = ?, updatedAt = ?
      WHERE id = ?
    `).bind(
      (ratingStats as any)?.avgRating || 0,
      (ratingStats as any)?.reviewCount || 0,
      now,
      courseId
    ).run();

    // Award XP for first review
    if (!existingReview) {
      await awardLmsXp(c.env.DB, user.id, 15, 'Submitted course review', courseId, 'lms_course_review');
    }

    return c.json({
      success: true,
      message: existingReview ? 'Review updated' : 'Review submitted',
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return c.json({ error: 'Failed to submit review' }, 500);
  }
});

// DELETE /lms/courses/:id/reviews - Delete own review
lms.delete('/courses/:id/reviews', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('id');

  try {
    // Delete the review
    const result = await c.env.DB.prepare(`
      DELETE FROM lms_course_reviews WHERE courseId = ? AND userId = ?
    `).bind(courseId, user.id).run();

    if (!result.changes) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Update course average rating
    const ratingStats = await c.env.DB.prepare(`
      SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount
      FROM lms_course_reviews
      WHERE courseId = ? AND isHidden = 0
    `).bind(courseId).first();

    await c.env.DB.prepare(`
      UPDATE lms_courses
      SET averageRating = ?, ratingCount = ?, updatedAt = ?
      WHERE id = ?
    `).bind(
      (ratingStats as any)?.avgRating || 0,
      (ratingStats as any)?.reviewCount || 0,
      new Date().toISOString(),
      courseId
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return c.json({ error: 'Failed to delete review' }, 500);
  }
});

// POST /lms/reviews/:id/helpful - Vote a review as helpful
lms.post('/reviews/:id/helpful', async (c) => {
  const user = c.get('user');
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const reviewId = c.req.param('id');

  try {
    // Check if already voted (we'd need a votes table for proper tracking)
    // For simplicity, just increment the count
    const review = await c.env.DB.prepare(`
      SELECT userId FROM lms_course_reviews WHERE id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Can't vote on own review
    if ((review as any).userId === user.id) {
      return c.json({ error: 'Cannot vote on your own review' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE lms_course_reviews SET helpfulVotes = helpfulVotes + 1 WHERE id = ?
    `).bind(reviewId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error voting helpful:', error);
    return c.json({ error: 'Failed to vote' }, 500);
  }
});

// POST /lms/reviews/:id/respond - Instructor response to review
lms.post('/reviews/:id/respond', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const reviewId = c.req.param('id');
  const body = await c.req.json();
  const { response } = body;

  if (!response?.trim()) {
    return c.json({ error: 'Response is required' }, 400);
  }

  try {
    // Check if user is the course instructor
    const review = await c.env.DB.prepare(`
      SELECT r.id, c.instructorId
      FROM lms_course_reviews r
      JOIN lms_courses c ON r.courseId = c.id
      WHERE r.id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Only course instructor or admin can respond
    if ((review as any).instructorId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      return c.json({ error: 'Only the course instructor can respond' }, 403);
    }

    await c.env.DB.prepare(`
      UPDATE lms_course_reviews
      SET instructorResponse = ?, instructorRespondedAt = ?
      WHERE id = ?
    `).bind(response, new Date().toISOString(), reviewId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error responding to review:', error);
    return c.json({ error: 'Failed to respond' }, 500);
  }
});

// PUT /lms/reviews/:id/hide - Hide/unhide a review (instructor/admin)
lms.put('/reviews/:id/hide', async (c) => {
  const user = c.get('user');
  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const reviewId = c.req.param('id');
  const body = await c.req.json();
  const { hidden } = body;

  try {
    const review = await c.env.DB.prepare(`
      SELECT r.id, r.courseId, c.instructorId
      FROM lms_course_reviews r
      JOIN lms_courses c ON r.courseId = c.id
      WHERE r.id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Only course instructor or admin can hide
    if ((review as any).instructorId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await c.env.DB.prepare(`
      UPDATE lms_course_reviews SET isHidden = ? WHERE id = ?
    `).bind(hidden ? 1 : 0, reviewId).run();

    // Update course rating (excluding hidden reviews)
    const ratingStats = await c.env.DB.prepare(`
      SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount
      FROM lms_course_reviews
      WHERE courseId = ? AND isHidden = 0
    `).bind((review as any).courseId).first();

    await c.env.DB.prepare(`
      UPDATE lms_courses
      SET averageRating = ?, ratingCount = ?, updatedAt = ?
      WHERE id = ?
    `).bind(
      (ratingStats as any)?.avgRating || 0,
      (ratingStats as any)?.reviewCount || 0,
      new Date().toISOString(),
      (review as any).courseId
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error hiding review:', error);
    return c.json({ error: 'Failed to hide review' }, 500);
  }
});

// =====================================================
// COURSE ANNOUNCEMENTS
// =====================================================

// GET /lms/courses/:id/announcements - Get all announcements for a course
lms.get('/courses/:id/announcements', async (c) => {
  const courseId = c.req.param('id');
  const user = c.get('user');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const offset = (page - 1) * limit;

  try {
    // Check enrollment or if instructor
    let canView = false;
    if (user?.id) {
      const enrollment = await c.env.DB.prepare(`
        SELECT id FROM lms_enrollments WHERE courseId = ? AND userId = ? AND status = 'active'
      `).bind(courseId, user.id).first();

      const course = await c.env.DB.prepare(`
        SELECT instructorId FROM lms_courses WHERE id = ?
      `).bind(courseId).first();

      canView = !!enrollment || (course as any)?.instructorId === user.id || isInstructor(user.role);
    }

    if (!canView) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get announcements
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_announcements WHERE courseId = ? AND isPublished = 1
    `).bind(courseId).first();

    const { results } = await c.env.DB.prepare(`
      SELECT a.*, u.displayName as authorName, u.avatar as authorAvatar
      FROM lms_announcements a
      LEFT JOIN users u ON a.authorId = u.id
      WHERE a.courseId = ? AND a.isPublished = 1
      ORDER BY a.isPinned DESC, a.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(courseId, limit, offset).all();

    return c.json({
      items: results || [],
      total: (countResult as any)?.count || 0,
      page,
      limit,
      totalPages: Math.ceil(((countResult as any)?.count || 0) / limit),
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return c.json({ error: 'Failed to fetch announcements' }, 500);
  }
});

// POST /lms/courses/:id/announcements - Create announcement (instructor only)
lms.post('/courses/:id/announcements', requireAuth, async (c) => {
  const user = c.get('user');
  const courseId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Verify instructor owns this course
    const course = await c.env.DB.prepare(`
      SELECT instructorId FROM lms_courses WHERE id = ?
    `).bind(courseId).first();

    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }

    if ((course as any).instructorId !== user.id && !isInstructor(user.role)) {
      return c.json({ error: 'Only course instructors can create announcements' }, 403);
    }

    const { title, content, isPinned } = await c.req.json();

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO lms_announcements (id, courseId, authorId, title, content, isPinned, isPublished, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).bind(id, courseId, user.id, title, content, isPinned ? 1 : 0).run();

    return c.json({ id, title, message: 'Announcement created successfully' }, 201);
  } catch (error) {
    console.error('Error creating announcement:', error);
    return c.json({ error: 'Failed to create announcement' }, 500);
  }
});

// PUT /lms/announcements/:id - Update announcement
lms.put('/announcements/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const announcementId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Verify user is author or admin
    const announcement = await c.env.DB.prepare(`
      SELECT a.*, c.instructorId FROM lms_announcements a
      JOIN lms_courses c ON a.courseId = c.id
      WHERE a.id = ?
    `).bind(announcementId).first();

    if (!announcement) {
      return c.json({ error: 'Announcement not found' }, 404);
    }

    const isAuthor = (announcement as any).authorId === user.id;
    const isCourseInstructor = (announcement as any).instructorId === user.id;
    const isAdmin = isInstructor(user.role);

    if (!isAuthor && !isCourseInstructor && !isAdmin) {
      return c.json({ error: 'Not authorized to update this announcement' }, 403);
    }

    const { title, content, isPinned, isPublished } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE lms_announcements
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          isPinned = COALESCE(?, isPinned),
          isPublished = COALESCE(?, isPublished),
          updatedAt = datetime('now')
      WHERE id = ?
    `).bind(title, content, isPinned, isPublished, announcementId).run();

    return c.json({ success: true, message: 'Announcement updated' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return c.json({ error: 'Failed to update announcement' }, 500);
  }
});

// DELETE /lms/announcements/:id - Delete announcement
lms.delete('/announcements/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const announcementId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Verify user is author or admin
    const announcement = await c.env.DB.prepare(`
      SELECT a.*, c.instructorId FROM lms_announcements a
      JOIN lms_courses c ON a.courseId = c.id
      WHERE a.id = ?
    `).bind(announcementId).first();

    if (!announcement) {
      return c.json({ error: 'Announcement not found' }, 404);
    }

    const isAuthor = (announcement as any).authorId === user.id;
    const isCourseInstructor = (announcement as any).instructorId === user.id;
    const isAdmin = isInstructor(user.role);

    if (!isAuthor && !isCourseInstructor && !isAdmin) {
      return c.json({ error: 'Not authorized to delete this announcement' }, 403);
    }

    await c.env.DB.prepare(`
      DELETE FROM lms_announcements WHERE id = ?
    `).bind(announcementId).run();

    return c.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return c.json({ error: 'Failed to delete announcement' }, 500);
  }
});

// GET /lms/instructor/courses/:id/announcements - Get all announcements including unpublished (instructor)
lms.get('/instructor/courses/:id/announcements', requireAuth, async (c) => {
  const user = c.get('user');
  const courseId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Verify instructor
    const course = await c.env.DB.prepare(`
      SELECT instructorId FROM lms_courses WHERE id = ?
    `).bind(courseId).first();

    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }

    if ((course as any).instructorId !== user.id && !isInstructor(user.role)) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const { results } = await c.env.DB.prepare(`
      SELECT a.*, u.displayName as authorName, u.avatar as authorAvatar
      FROM lms_announcements a
      LEFT JOIN users u ON a.authorId = u.id
      WHERE a.courseId = ?
      ORDER BY a.isPinned DESC, a.createdAt DESC
    `).bind(courseId).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Error fetching instructor announcements:', error);
    return c.json({ error: 'Failed to fetch announcements' }, 500);
  }
});

// =====================================================
// RUBRICS MANAGEMENT
// =====================================================

// GET /lms/rubrics - Get all rubrics for the current user (instructor)
lms.get('/rubrics', requireAuth, async (c) => {
  const user = c.get('user');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!isInstructor(user.role)) {
    return c.json({ error: 'Only instructors can view rubrics' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT r.*, u.displayName as creatorName,
        (SELECT COUNT(*) FROM lms_assignments WHERE rubricId = r.id) as usageCount
      FROM lms_rubrics r
      LEFT JOIN users u ON r.instructorId = u.id
      WHERE r.instructorId = ? OR r.isTemplate = 1
      ORDER BY r.updatedAt DESC
    `).bind(user.id).all();

    const rubrics = (results || []).map((r: any) => ({
      ...r,
      criteria: JSON.parse(r.criteria || '[]'),
    }));

    return c.json(rubrics);
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    return c.json({ error: 'Failed to fetch rubrics' }, 500);
  }
});

// GET /lms/rubrics/:id - Get a specific rubric
lms.get('/rubrics/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const rubricId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const rubric = await c.env.DB.prepare(`
      SELECT r.*, u.displayName as creatorName
      FROM lms_rubrics r
      LEFT JOIN users u ON r.instructorId = u.id
      WHERE r.id = ?
    `).bind(rubricId).first();

    if (!rubric) {
      return c.json({ error: 'Rubric not found' }, 404);
    }

    // Check access
    const isOwner = (rubric as any).instructorId === user.id;
    const isSharedTemplate = (rubric as any).isTemplate;
    const isAdmin = isInstructor(user.role);

    if (!isOwner && !isSharedTemplate && !isAdmin) {
      return c.json({ error: 'Not authorized to view this rubric' }, 403);
    }

    return c.json({
      ...rubric,
      criteria: JSON.parse((rubric as any).criteria || '[]'),
    });
  } catch (error) {
    console.error('Error fetching rubric:', error);
    return c.json({ error: 'Failed to fetch rubric' }, 500);
  }
});

// POST /lms/rubrics - Create a new rubric
lms.post('/rubrics', requireAuth, async (c) => {
  const user = c.get('user');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!isInstructor(user.role)) {
    return c.json({ error: 'Only instructors can create rubrics' }, 403);
  }

  try {
    const { title, description, criteria, maxScore, isTemplate } = await c.req.json();

    if (!title || !criteria || !Array.isArray(criteria) || criteria.length === 0) {
      return c.json({ error: 'Title and at least one criterion are required' }, 400);
    }

    // Calculate max score from criteria
    const calculatedMaxScore = criteria.reduce((sum: number, c: any) => sum + (c.maxPoints || 0), 0);

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO lms_rubrics (id, title, description, criteria, maxScore, instructorId, isTemplate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      title,
      description || null,
      JSON.stringify(criteria),
      maxScore || calculatedMaxScore,
      user.id,
      isTemplate ? 1 : 0
    ).run();

    return c.json({ id, message: 'Rubric created successfully' }, 201);
  } catch (error) {
    console.error('Error creating rubric:', error);
    return c.json({ error: 'Failed to create rubric' }, 500);
  }
});

// PUT /lms/rubrics/:id - Update a rubric
lms.put('/rubrics/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const rubricId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const rubric = await c.env.DB.prepare(`
      SELECT * FROM lms_rubrics WHERE id = ?
    `).bind(rubricId).first();

    if (!rubric) {
      return c.json({ error: 'Rubric not found' }, 404);
    }

    if ((rubric as any).instructorId !== user.id && !isInstructor(user.role)) {
      return c.json({ error: 'Not authorized to update this rubric' }, 403);
    }

    const { title, description, criteria, maxScore, isTemplate } = await c.req.json();

    // Calculate max score from criteria if not provided
    let calculatedMaxScore = maxScore;
    if (criteria && Array.isArray(criteria)) {
      calculatedMaxScore = criteria.reduce((sum: number, c: any) => sum + (c.maxPoints || 0), 0);
    }

    await c.env.DB.prepare(`
      UPDATE lms_rubrics
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          criteria = COALESCE(?, criteria),
          maxScore = COALESCE(?, maxScore),
          isTemplate = COALESCE(?, isTemplate),
          updatedAt = datetime('now')
      WHERE id = ?
    `).bind(
      title,
      description,
      criteria ? JSON.stringify(criteria) : null,
      calculatedMaxScore,
      isTemplate !== undefined ? (isTemplate ? 1 : 0) : null,
      rubricId
    ).run();

    return c.json({ success: true, message: 'Rubric updated' });
  } catch (error) {
    console.error('Error updating rubric:', error);
    return c.json({ error: 'Failed to update rubric' }, 500);
  }
});

// DELETE /lms/rubrics/:id - Delete a rubric
lms.delete('/rubrics/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const rubricId = c.req.param('id');

  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const rubric = await c.env.DB.prepare(`
      SELECT * FROM lms_rubrics WHERE id = ?
    `).bind(rubricId).first();

    if (!rubric) {
      return c.json({ error: 'Rubric not found' }, 404);
    }

    if ((rubric as any).instructorId !== user.id && !isInstructor(user.role)) {
      return c.json({ error: 'Not authorized to delete this rubric' }, 403);
    }

    // Check if rubric is in use
    const usageCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_assignments WHERE rubricId = ?
    `).bind(rubricId).first();

    if ((usageCount as any)?.count > 0) {
      return c.json({ error: 'Cannot delete rubric that is in use by assignments' }, 400);
    }

    await c.env.DB.prepare(`
      DELETE FROM lms_rubrics WHERE id = ?
    `).bind(rubricId).run();

    return c.json({ success: true, message: 'Rubric deleted' });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    return c.json({ error: 'Failed to delete rubric' }, 500);
  }
});

// POST /lms/rubrics/:id/duplicate - Duplicate a rubric
lms.post('/rubrics/:id/duplicate', requireAuth, async (c) => {
  const user = c.get('user');
  const rubricId = c.req.param('id');

  if (!user?.id || !isInstructor(user.role)) {
    return c.json({ error: 'Only instructors can duplicate rubrics' }, 403);
  }

  try {
    const rubric = await c.env.DB.prepare(`
      SELECT * FROM lms_rubrics WHERE id = ?
    `).bind(rubricId).first();

    if (!rubric) {
      return c.json({ error: 'Rubric not found' }, 404);
    }

    const newId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO lms_rubrics (id, title, description, criteria, maxScore, instructorId, isTemplate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).bind(
      newId,
      `${(rubric as any).title} (Copy)`,
      (rubric as any).description,
      (rubric as any).criteria,
      (rubric as any).maxScore,
      user.id
    ).run();

    return c.json({ id: newId, message: 'Rubric duplicated successfully' }, 201);
  } catch (error) {
    console.error('Error duplicating rubric:', error);
    return c.json({ error: 'Failed to duplicate rubric' }, 500);
  }
});

export default lms;
