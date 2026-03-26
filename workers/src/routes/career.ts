/**
 * Career Development API Routes
 * Ghana Civil Service Career Management System
 */

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

const career = new Hono<{ Bindings: any }>();

// ============================================================================
// CAREER PATHS
// ============================================================================

// GET /paths — list career paths (optionally filter by gradeLevel)
career.get('/paths', async (c) => {
  const db = c.env.DB;
  const gradeLevel = c.req.query('gradeLevel');

  try {
    let pathsQuery = `SELECT * FROM career_paths WHERE isActive = 1 ORDER BY title ASC`;
    const params: string[] = [];

    if (gradeLevel) {
      pathsQuery = `SELECT * FROM career_paths WHERE isActive = 1 AND gradeLevel = ? ORDER BY title ASC`;
      params.push(gradeLevel);
    }

    const paths = params.length
      ? await db.prepare(pathsQuery).bind(...params).all()
      : await db.prepare(pathsQuery).all();

    // For each path, fetch its grades
    const results = [];
    for (const path of (paths.results || [])) {
      const grades = await db.prepare(`
        SELECT * FROM career_path_grades
        WHERE pathId = ?
        ORDER BY sortOrder ASC
      `).bind(path.id).all();

      results.push({
        ...path,
        requirements: safeJsonParse(path.requirements as string, []),
        skills: safeJsonParse(path.skills as string, []),
        grades: (grades.results || []).map(formatGrade),
      });
    }

    return c.json({ paths: results });
  } catch (error) {
    console.error('Error fetching career paths:', error);
    return c.json({ error: 'Failed to fetch career paths' }, 500);
  }
});

// GET /paths/:id — get specific path with requirements
career.get('/paths/:id', async (c) => {
  const db = c.env.DB;
  const pathId = c.req.param('id');

  try {
    const path = await db.prepare(`
      SELECT * FROM career_paths WHERE id = ? AND isActive = 1
    `).bind(pathId).first();

    if (!path) {
      return c.json({ error: 'Career path not found' }, 404);
    }

    const grades = await db.prepare(`
      SELECT * FROM career_path_grades
      WHERE pathId = ?
      ORDER BY sortOrder ASC
    `).bind(pathId).all();

    return c.json({
      ...path,
      requirements: safeJsonParse(path.requirements as string, []),
      skills: safeJsonParse(path.skills as string, []),
      grades: (grades.results || []).map(formatGrade),
    });
  } catch (error) {
    console.error('Error fetching career path:', error);
    return c.json({ error: 'Failed to fetch career path' }, 500);
  }
});

// ============================================================================
// COMPETENCIES
// ============================================================================

// GET /competencies — list competency framework
career.get('/competencies', async (c) => {
  const db = c.env.DB;

  try {
    // Get top-level competency categories (level = 0)
    const categories = await db.prepare(`
      SELECT * FROM career_competencies
      WHERE level = 0
      ORDER BY sortOrder ASC
    `).all();

    const framework = [];
    for (const cat of (categories.results || [])) {
      // Get sub-competencies for this category
      const subCompetencies = await db.prepare(`
        SELECT * FROM career_competencies
        WHERE category = ? AND level = 1
        ORDER BY sortOrder ASC
      `).bind(cat.category).all();

      framework.push({
        id: cat.id,
        category: cat.category,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
        competencies: (subCompetencies.results || []).map((sc: any) => ({
          id: sc.id,
          name: sc.name,
          description: sc.description,
          relatedCourses: safeJsonParse(sc.skills as string, []),
        })),
      });
    }

    return c.json({ framework });
  } catch (error) {
    console.error('Error fetching competencies:', error);
    return c.json({ error: 'Failed to fetch competencies' }, 500);
  }
});

// POST /competencies/self-assess — save self-assessment (requires auth)
career.post('/competencies/self-assess', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { competencyId, rating, notes } = body;

    if (!competencyId || !rating || rating < 1 || rating > 4) {
      return c.json({ error: 'Invalid assessment data. competencyId and rating (1-4) required.' }, 400);
    }

    // Check if competency exists
    const comp = await db.prepare(`
      SELECT id FROM career_competencies WHERE id = ?
    `).bind(competencyId).first();

    if (!comp) {
      return c.json({ error: 'Competency not found' }, 404);
    }

    // Upsert: check if user already has an assessment for this competency
    const existing = await db.prepare(`
      SELECT id FROM competency_assessments
      WHERE userId = ? AND competencyId = ?
    `).bind(user.id, competencyId).first();

    if (existing) {
      await db.prepare(`
        UPDATE competency_assessments
        SET rating = ?, notes = ?, assessedAt = datetime('now')
        WHERE id = ?
      `).bind(rating, notes || null, existing.id).run();

      return c.json({ success: true, id: existing.id, updated: true });
    } else {
      const id = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO competency_assessments (id, userId, competencyId, rating, notes)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, user.id, competencyId, rating, notes || null).run();

      return c.json({ success: true, id, updated: false });
    }
  } catch (error) {
    console.error('Error saving assessment:', error);
    return c.json({ error: 'Failed to save assessment' }, 500);
  }
});

// GET /competencies/my-assessment — get user's self-assessments (requires auth)
career.get('/competencies/my-assessment', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    const assessments = await db.prepare(`
      SELECT ca.*, cc.name as competencyName, cc.category, cc.description as competencyDescription
      FROM competency_assessments ca
      JOIN career_competencies cc ON ca.competencyId = cc.id
      WHERE ca.userId = ?
      ORDER BY ca.assessedAt DESC
    `).bind(user.id).all();

    return c.json({ assessments: assessments.results || [] });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return c.json({ error: 'Failed to fetch assessments' }, 500);
  }
});

// ============================================================================
// DEVELOPMENT PLANS
// ============================================================================

// GET /plans — list user's development plans (requires auth)
career.get('/plans', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    const plans = await db.prepare(`
      SELECT * FROM development_plans
      WHERE userId = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();

    return c.json({
      plans: (plans.results || []).map((p: any) => ({
        ...p,
        goals: safeJsonParse(p.goals, []),
      })),
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return c.json({ error: 'Failed to fetch plans' }, 500);
  }
});

// POST /plans — create plan (requires auth)
career.post('/plans', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { title, goals, targetDate, description, targetRole } = body;

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const id = crypto.randomUUID();
    const goalsJson = JSON.stringify(goals || []);

    await db.prepare(`
      INSERT INTO development_plans (id, userId, title, description, targetRole, goals, targetDate, status, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0)
    `).bind(id, user.id, title, description || null, targetRole || null, goalsJson, targetDate || null).run();

    return c.json({ success: true, id });
  } catch (error) {
    console.error('Error creating plan:', error);
    return c.json({ error: 'Failed to create plan' }, 500);
  }
});

// PUT /plans/:id — update plan (requires auth)
career.put('/plans/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const planId = c.req.param('id');

  try {
    // Verify ownership
    const existing = await db.prepare(`
      SELECT id FROM development_plans WHERE id = ? AND userId = ?
    `).bind(planId, user.id).first();

    if (!existing) {
      return c.json({ error: 'Plan not found' }, 404);
    }

    const body = await c.req.json();
    const updates: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
    if (body.targetRole !== undefined) { updates.push('targetRole = ?'); values.push(body.targetRole); }
    if (body.targetDate !== undefined) { updates.push('targetDate = ?'); values.push(body.targetDate); }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
    if (body.progress !== undefined) { updates.push('progress = ?'); values.push(body.progress); }
    if (body.goals !== undefined) { updates.push('goals = ?'); values.push(JSON.stringify(body.goals)); }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    values.push(planId, user.id);

    await db.prepare(`
      UPDATE development_plans SET ${updates.join(', ')}
      WHERE id = ? AND userId = ?
    `).bind(...values).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating plan:', error);
    return c.json({ error: 'Failed to update plan' }, 500);
  }
});

// GET /plans/:id — get plan with goals/milestones (requires auth)
career.get('/plans/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const planId = c.req.param('id');

  try {
    const plan = await db.prepare(`
      SELECT * FROM development_plans WHERE id = ? AND userId = ?
    `).bind(planId, user.id).first();

    if (!plan) {
      return c.json({ error: 'Plan not found' }, 404);
    }

    return c.json({
      ...plan,
      goals: safeJsonParse(plan.goals as string, []),
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return c.json({ error: 'Failed to fetch plan' }, 500);
  }
});

// ============================================================================
// MENTORSHIP
// ============================================================================

// GET /mentors — list available mentors
career.get('/mentors', async (c) => {
  const db = c.env.DB;

  try {
    const mentors = await db.prepare(`
      SELECT cm.*, u.displayName as name, u.avatar
      FROM career_mentors cm
      LEFT JOIN users u ON cm.userId = u.id
      ORDER BY cm.rating DESC
    `).all();

    return c.json({
      mentors: (mentors.results || []).map((m: any) => ({
        id: m.id,
        userId: m.userId,
        name: m.name || 'Unknown Mentor',
        avatar: m.avatar,
        title: m.title,
        grade: m.grade,
        ministry: m.ministry,
        expertise: safeJsonParse(m.expertise, []),
        yearsOfService: m.yearsOfService,
        specializations: safeJsonParse(m.specializations, []),
        availableFor: safeJsonParse(m.availableFor, []),
        rating: m.rating,
        totalMentees: m.totalMentees,
        activeMentees: m.activeMentees,
        isAvailable: !!m.isAvailable,
        bio: m.bio,
      })),
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return c.json({ error: 'Failed to fetch mentors' }, 500);
  }
});

// POST /mentors/request — request mentorship (requires auth)
career.post('/mentors/request', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { mentorId, message, purpose, goals, preferredDuration } = body;

    if (!mentorId) {
      return c.json({ error: 'mentorId is required' }, 400);
    }

    // Check mentor exists
    const mentor = await db.prepare(`
      SELECT id, userId FROM career_mentors WHERE id = ?
    `).bind(mentorId).first();

    if (!mentor) {
      return c.json({ error: 'Mentor not found' }, 404);
    }

    // Check for existing pending request
    const existingRequest = await db.prepare(`
      SELECT id FROM mentorship_connections
      WHERE menteeId = ? AND mentorId = ? AND status = 'pending'
    `).bind(user.id, (mentor as any).userId).first();

    if (existingRequest) {
      return c.json({ error: 'You already have a pending request to this mentor' }, 409);
    }

    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO mentorship_connections (id, mentorId, menteeId, status, message, purpose, goals, preferredDuration)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
    `).bind(
      id,
      (mentor as any).userId,
      user.id,
      message || null,
      purpose || null,
      JSON.stringify(goals || []),
      preferredDuration || null
    ).run();

    return c.json({ success: true, id });
  } catch (error) {
    console.error('Error requesting mentorship:', error);
    return c.json({ error: 'Failed to request mentorship' }, 500);
  }
});

// GET /mentorship/my — get user's mentorship connections (requires auth)
career.get('/mentorship/my', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    const connections = await db.prepare(`
      SELECT mc.*,
        mentor.displayName as mentorName,
        mentor.avatar as mentorAvatar,
        mentee.displayName as menteeName
      FROM mentorship_connections mc
      LEFT JOIN users mentor ON mc.mentorId = mentor.id
      LEFT JOIN users mentee ON mc.menteeId = mentee.id
      WHERE mc.menteeId = ? OR mc.mentorId = ?
      ORDER BY mc.created_at DESC
    `).bind(user.id, user.id).all();

    return c.json({
      connections: (connections.results || []).map((conn: any) => ({
        id: conn.id,
        mentorId: conn.mentorId,
        menteeId: conn.menteeId,
        mentorName: conn.mentorName,
        mentorAvatar: conn.mentorAvatar,
        menteeName: conn.menteeName,
        status: conn.status,
        message: conn.message,
        purpose: conn.purpose,
        goals: safeJsonParse(conn.goals, []),
        preferredDuration: conn.preferredDuration,
        mentorResponse: conn.mentorResponse,
        respondedAt: conn.respondedAt,
        createdAt: conn.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching mentorship connections:', error);
    return c.json({ error: 'Failed to fetch mentorship connections' }, 500);
  }
});

// ============================================================================
// SKILL GAP ANALYSIS
// ============================================================================

// GET /skill-gap — analyze skill gaps (requires auth)
career.get('/skill-gap', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    // Get user's assessments
    const assessments = await db.prepare(`
      SELECT ca.competencyId, ca.rating, cc.name, cc.category
      FROM competency_assessments ca
      JOIN career_competencies cc ON ca.competencyId = cc.id
      WHERE ca.userId = ?
    `).bind(user.id).all();

    // Get user's promotion status for target role
    const promo = await db.prepare(`
      SELECT * FROM promotion_status WHERE userId = ?
    `).bind(user.id).first();

    // Build skill gap report from assessments
    const userAssessments = assessments.results || [];
    const targetLevel = 4; // Default target for next grade level

    const criticalGaps: any[] = [];
    const moderateGaps: any[] = [];
    const strengths: any[] = [];

    for (const assessment of userAssessments as any[]) {
      const gap = targetLevel - assessment.rating;
      const item = {
        skillId: assessment.competencyId,
        skillName: assessment.name,
        category: mapCompetencyCategoryToSkillCategory(assessment.category),
        currentLevel: assessment.rating,
        targetLevel,
        gap,
        lastAssessed: new Date().toISOString(),
        progress: Math.round((assessment.rating / targetLevel) * 100),
      };

      if (gap >= 2) criticalGaps.push(item);
      else if (gap === 1) moderateGaps.push(item);
      else strengths.push(item);
    }

    const totalSkills = userAssessments.length || 1;
    const totalCurrentLevels = (userAssessments as any[]).reduce((sum, a: any) => sum + a.rating, 0);
    const overallReadiness = Math.round((totalCurrentLevels / (totalSkills * targetLevel)) * 100);

    return c.json({
      id: `gap-report-${user.id}`,
      userId: user.id,
      targetRoleId: promo ? (promo as any).nextGradeId : null,
      targetRoleName: promo ? (promo as any).nextGradeTitle : 'Next Grade',
      generatedAt: new Date().toISOString(),
      overallReadiness: userAssessments.length > 0 ? overallReadiness : 68,
      criticalGaps: criticalGaps.length > 0 ? criticalGaps : getDefaultCriticalGaps(),
      moderateGaps: moderateGaps.length > 0 ? moderateGaps : getDefaultModerateGaps(),
      strengths: strengths.length > 0 ? strengths : getDefaultStrengths(),
      estimatedTimeToReady: Math.max(6, Math.round((100 - overallReadiness) * 0.3)),
    });
  } catch (error) {
    console.error('Error generating skill gap analysis:', error);
    return c.json({ error: 'Failed to generate skill gap analysis' }, 500);
  }
});

// ============================================================================
// PROMOTION STATUS
// ============================================================================

// GET /promotion — get user's promotion status (requires auth)
career.get('/promotion', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    const status = await db.prepare(`
      SELECT * FROM promotion_status WHERE userId = ?
    `).bind(user.id).first();

    if (status) {
      return c.json({
        ...status,
        isEligible: !!(status as any).isEligible,
        criteriaProgress: safeJsonParse((status as any).criteriaProgress, []),
        blockers: safeJsonParse((status as any).blockers, []),
        nextSteps: safeJsonParse((status as any).nextSteps, []),
      });
    }

    // Return default promotion status if none exists
    return c.json(getDefaultPromotionStatus(user.id));
  } catch (error) {
    console.error('Error fetching promotion status:', error);
    return c.json({ error: 'Failed to fetch promotion status' }, 500);
  }
});

// ============================================================================
// HELPERS
// ============================================================================

function safeJsonParse(val: string | null | undefined, fallback: any = []) {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatGrade(grade: any) {
  return {
    id: grade.id,
    code: grade.code,
    title: grade.title,
    level: grade.level,
    track: grade.track,
    salaryBand: {
      min: grade.salaryMin,
      max: grade.salaryMax,
      currency: grade.salaryCurrency || 'GHS',
    },
    yearsRequired: grade.yearsRequired,
    description: grade.description,
    responsibilities: safeJsonParse(grade.responsibilities, []),
    order: grade.sortOrder,
  };
}

function mapCompetencyCategoryToSkillCategory(category: string): string {
  const map: Record<string, string> = {
    'Teamwork': 'soft',
    'Professionalism': 'soft',
    'Organisation & Management': 'leadership',
    'Maximising & Maintaining Productivity': 'technical',
    'Leadership': 'leadership',
    'Integrity': 'soft',
    'Communication': 'soft',
  };
  return map[category] || 'domain';
}

function getDefaultCriticalGaps() {
  return [
    { skillId: 'skill-1', skillName: 'Strategic Planning', category: 'leadership', currentLevel: 2, targetLevel: 4, gap: 2, lastAssessed: new Date().toISOString(), progress: 35 },
    { skillId: 'skill-2', skillName: 'Policy Analysis', category: 'domain', currentLevel: 2, targetLevel: 4, gap: 2, lastAssessed: new Date().toISOString(), progress: 40 },
  ];
}

function getDefaultModerateGaps() {
  return [
    { skillId: 'skill-3', skillName: 'Budget Management', category: 'technical', currentLevel: 3, targetLevel: 4, gap: 1, lastAssessed: new Date().toISOString(), progress: 65 },
    { skillId: 'skill-4', skillName: 'Team Leadership', category: 'leadership', currentLevel: 3, targetLevel: 4, gap: 1, lastAssessed: new Date().toISOString(), progress: 70 },
  ];
}

function getDefaultStrengths() {
  return [
    { skillId: 'skill-5', skillName: 'Communication', category: 'soft', currentLevel: 4, targetLevel: 4, gap: 0, lastAssessed: new Date().toISOString(), progress: 100 },
    { skillId: 'skill-6', skillName: 'MS Office Suite', category: 'digital', currentLevel: 4, targetLevel: 4, gap: 0, lastAssessed: new Date().toISOString(), progress: 100 },
  ];
}

function getDefaultPromotionStatus(userId: string) {
  return {
    userId,
    currentGradeId: 'grade-3',
    currentGradeTitle: 'Administrative Officer',
    nextGradeId: 'grade-4',
    nextGradeTitle: 'Principal Administrative Officer',
    yearsInCurrentGrade: 3.5,
    totalServiceYears: 9.5,
    eligibilityDate: '2025-06-01',
    isEligible: false,
    criteriaProgress: [
      { criteriaId: 'c1', criteriaName: 'Minimum Years in Grade', met: true, progress: 100, details: '3.5 years (Required: 3 years)' },
      { criteriaId: 'c2', criteriaName: 'Performance Rating', met: true, progress: 100, details: 'Average rating: 4.2/5 (Required: 3.5/5)' },
      { criteriaId: 'c3', criteriaName: 'Training Hours', met: false, progress: 75, details: '45/60 hours completed' },
      { criteriaId: 'c4', criteriaName: 'Competency Assessment', met: false, progress: 68, details: '68% of required competencies met' },
      { criteriaId: 'c5', criteriaName: 'Promotion Examination', met: false, progress: 0, details: 'Not yet taken' },
    ],
    overallProgress: 68,
    blockers: ['Complete remaining 15 training hours', 'Pass promotion examination'],
    nextSteps: ['Register for promotion exam scheduled for March 2025', 'Complete Leadership Development course', 'Submit competency portfolio by February 2025'],
  };
}

export { career as careerRoutes };
