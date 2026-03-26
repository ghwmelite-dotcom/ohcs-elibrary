import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const sponsorshipRoutes = new Hono();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createSponsorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  tierId: z.string(),
  logo: z.string().url().optional().or(z.literal('')),
  logoDark: z.string().url().optional().or(z.literal('')),
  banner: z.string().url().optional().or(z.literal('')),
  tagline: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email().optional(),
  contactPerson: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  contactTitle: z.string().max(100).optional(),
  investmentAmount: z.number().positive().optional(),
  currency: z.string().default('GHS'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  linkedIn: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  region: z.string().optional(),
  notes: z.string().optional(),
});

const updateSponsorSchema = createSponsorSchema.partial();

const updateSponsorStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'expired']),
  notes: z.string().optional(),
});

const createScholarshipSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('GHS'),
  totalBudget: z.number().positive().optional(),
  programType: z.enum(['course', 'certification', 'degree', 'training', 'professional_development']).optional(),
  targetProgram: z.string().optional(),
  programDuration: z.string().optional(),
  eligibilityCriteria: z.object({
    minimumYearsOfService: z.number().optional(),
    maximumYearsOfService: z.number().optional(),
    requiredGradeLevels: z.array(z.string()).optional(),
    requiredMdas: z.array(z.string()).optional(),
    requiredDepartments: z.array(z.string()).optional(),
    ageLimit: z.number().optional(),
    additionalCriteria: z.array(z.string()).optional(),
  }).optional(),
  requirements: z.array(z.string()).optional(),
  maxRecipients: z.number().int().positive().default(1),
  applicationDeadline: z.string().optional(),
  selectionDate: z.string().optional(),
  programStartDate: z.string().optional(),
  programEndDate: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
});

const updateScholarshipSchema = createScholarshipSchema.partial().extend({
  status: z.enum(['draft', 'open', 'closed', 'awarded', 'completed', 'cancelled']).optional(),
});

const createScholarshipApplicationSchema = z.object({
  scholarshipId: z.string(),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  staffId: z.string().optional(),
  mdaId: z.string().optional(),
  department: z.string().optional(),
  currentPosition: z.string().optional(),
  yearsOfService: z.number().int().min(0).optional(),
  currentGrade: z.string().optional(),
  dateOfBirth: z.string().optional(),
  educationHistory: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    fieldOfStudy: z.string(),
    startYear: z.number(),
    endYear: z.number().optional(),
    grade: z.string().optional(),
    isOngoing: z.boolean().optional(),
  })).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuingOrganization: z.string(),
    issueDate: z.string(),
    expiryDate: z.string().optional(),
    credentialId: z.string().optional(),
  })).optional(),
  careerGoals: z.string().max(2000).optional(),
  statementOfPurpose: z.string().min(100, 'Statement must be at least 100 characters').max(5000),
  expectedImpact: z.string().max(2000).optional(),
  howDiscovered: z.string().optional(),
  supervisorName: z.string().optional(),
  supervisorEmail: z.string().email().optional().or(z.literal('')),
  supervisorPhone: z.string().optional(),
});

const reviewApplicationSchema = z.object({
  status: z.enum(['under_review', 'shortlisted', 'interview', 'approved', 'rejected']),
  reviewScore: z.number().int().min(0).max(100).optional(),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  awardedAmount: z.number().positive().optional(),
});

const createSponsoredContentSchema = z.object({
  contentType: z.enum(['course', 'document', 'resource', 'page', 'certificate']),
  contentId: z.string().optional(),
  contentTitle: z.string().optional(),
  placementType: z.enum(['banner', 'badge', 'powered_by', 'certificate_logo', 'sidebar']),
  placementPosition: z.enum(['top', 'bottom', 'sidebar', 'footer']).optional(),
  customMessage: z.string().max(500).optional(),
  customCTA: z.string().max(100).optional(),
  customCTAUrl: z.string().url().optional().or(z.literal('')),
  displayPriority: z.number().int().default(0),
  showOnMobile: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const trackAnalyticsSchema = z.object({
  sponsorId: z.string(),
  eventType: z.enum(['impression', 'click', 'view', 'download', 'conversion', 'certificate_view']),
  eventSource: z.enum(['banner', 'badge', 'content', 'certificate', 'showcase']).optional(),
  contentType: z.string().optional(),
  contentId: z.string().optional(),
  contentTitle: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);
}

function generateAccessKey(): string {
  return 'spn_' + crypto.randomUUID().replace(/-/g, '');
}

function getUserFromToken(c: any): { userId: string; role: string } | null {
  const user = c.get('user');
  if (!user) return null;
  return { userId: user.id, role: user.role };
}

function isAdmin(role: string): boolean {
  return ['admin', 'super_admin', 'director'].includes(role);
}

// ============================================================================
// PUBLIC ROUTES - Tiers & Showcase
// ============================================================================

// Get all sponsorship tiers
sponsorshipRoutes.get('/tiers', async (c) => {
  try {
    const tiers = await c.env.DB.prepare(`
      SELECT * FROM sponsorship_tiers WHERE isActive = 1 ORDER BY sortOrder ASC
    `).all();

    return c.json({
      tiers: tiers.results.map((tier: any) => ({
        ...tier,
        benefits: tier.benefits ? JSON.parse(tier.benefits) : [],
        features: tier.features ? JSON.parse(tier.features) : [],
      })),
    });
  } catch (error) {
    console.error('Get tiers error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get public sponsor showcase
sponsorshipRoutes.get('/showcase', async (c) => {
  try {
    // Get all active sponsors grouped by tier
    const sponsors = await c.env.DB.prepare(`
      SELECT
        s.*,
        t.name as tierName,
        t.slug as tierSlug,
        t.color as tierColor,
        t.sortOrder as tierSortOrder
      FROM sponsors s
      JOIN sponsorship_tiers t ON s.tierId = t.id
      WHERE s.status = 'active'
      ORDER BY t.sortOrder ASC, s.name ASC
    `).all();

    // Get aggregate impact stats
    const stats = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM sponsors WHERE status = 'active') as totalSponsors,
        (SELECT COALESCE(SUM(investmentAmount), 0) FROM sponsors WHERE status = 'active') as totalInvestment,
        (SELECT COUNT(*) FROM scholarship_recipients WHERE programStatus != 'withdrawn') as scholarsSupported,
        (SELECT COUNT(*) FROM scholarships WHERE status IN ('open', 'awarded', 'completed')) as activeScholarships
    `).first();

    return c.json({
      sponsors: sponsors.results.map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        logo: s.logo,
        tagline: s.tagline,
        website: s.website,
        tier: {
          name: s.tierName,
          slug: s.tierSlug,
          color: s.tierColor,
        },
      })),
      impactStats: {
        totalSponsors: stats?.totalSponsors || 0,
        totalInvestment: stats?.totalInvestment || 0,
        scholarsSupported: stats?.scholarsSupported || 0,
        activeScholarships: stats?.activeScholarships || 0,
      },
    });
  } catch (error) {
    console.error('Get showcase error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get single sponsor public profile
sponsorshipRoutes.get('/sponsors/:slug/public', async (c) => {
  const slug = c.req.param('slug');

  try {
    const sponsor = await c.env.DB.prepare(`
      SELECT
        s.id, s.name, s.slug, s.logo, s.banner, s.tagline, s.description,
        s.website, s.linkedIn, s.twitter, s.facebook,
        t.name as tierName, t.slug as tierSlug, t.color as tierColor
      FROM sponsors s
      JOIN sponsorship_tiers t ON s.tierId = t.id
      WHERE s.slug = ? AND s.status = 'active'
    `).bind(slug).first();

    if (!sponsor) {
      return c.json({ error: 'Sponsor not found' }, 404);
    }

    // Get sponsor's active scholarships
    const scholarships = await c.env.DB.prepare(`
      SELECT id, title, slug, shortDescription, amount, currency,
             programType, applicationDeadline, maxRecipients, currentRecipients, status
      FROM scholarships
      WHERE sponsorId = ? AND status = 'open'
      ORDER BY applicationDeadline ASC
    `).bind(sponsor.id).all();

    // Get impact stats for this sponsor
    const stats = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM scholarship_recipients WHERE scholarshipId IN
          (SELECT id FROM scholarships WHERE sponsorId = ?)) as scholarsSupported,
        (SELECT COUNT(*) FROM scholarships WHERE sponsorId = ? AND status IN ('open', 'awarded', 'completed')) as scholarshipsOffered,
        (SELECT COUNT(DISTINCT sad.id) FROM sponsorship_analytics_daily sad WHERE sad.sponsorId = ?) as daysActive
    `).bind(sponsor.id, sponsor.id, sponsor.id).first();

    return c.json({
      sponsor: {
        ...sponsor,
        tier: {
          name: sponsor.tierName,
          slug: sponsor.tierSlug,
          color: sponsor.tierColor,
        },
      },
      scholarships: scholarships.results,
      stats: {
        scholarsSupported: stats?.scholarsSupported || 0,
        scholarshipsOffered: stats?.scholarshipsOffered || 0,
        daysActive: stats?.daysActive || 0,
      },
    });
  } catch (error) {
    console.error('Get sponsor public profile error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// ============================================================================
// PUBLIC ROUTES - Scholarships
// ============================================================================

// Get open scholarships
sponsorshipRoutes.get('/scholarships', async (c) => {
  const VALID_STATUSES = ['open', 'closed', 'awarded', 'completed', 'cancelled', 'draft'];
  const rawStatus = c.req.query('status') || 'open';
  const status = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'open';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const featured = c.req.query('featured');

  try {
    const params: any[] = [status];
    let whereClause = 'WHERE s.status = ?';
    if (featured === 'true') {
      whereClause += ' AND s.isFeatured = 1';
    }

    const scholarships = await c.env.DB.prepare(`
      SELECT
        s.*,
        sp.name as sponsorName,
        sp.logo as sponsorLogo,
        sp.slug as sponsorSlug
      FROM scholarships s
      JOIN sponsors sp ON s.sponsorId = sp.id
      ${whereClause}
      ORDER BY s.isFeatured DESC, s.applicationDeadline ASC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM scholarships s ${whereClause}
    `).bind(...params).first();

    return c.json({
      scholarships: scholarships.results.map((s: any) => ({
        ...s,
        eligibilityCriteria: s.eligibilityCriteria ? JSON.parse(s.eligibilityCriteria) : null,
        requirements: s.requirements ? JSON.parse(s.requirements) : [],
        documents: s.documents ? JSON.parse(s.documents) : [],
        requiredGradeLevel: s.requiredGradeLevel ? JSON.parse(s.requiredGradeLevel) : null,
        requiredMdas: s.requiredMdas ? JSON.parse(s.requiredMdas) : null,
        requiredDepartments: s.requiredDepartments ? JSON.parse(s.requiredDepartments) : null,
      })),
      pagination: {
        page,
        limit,
        total: (countResult as any)?.total || 0,
        totalPages: Math.ceil(((countResult as any)?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get scholarships error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get single scholarship details
sponsorshipRoutes.get('/scholarships/:id', async (c) => {
  const scholarshipId = c.req.param('id');
  const user = getUserFromToken(c);

  try {
    const scholarship = await c.env.DB.prepare(`
      SELECT
        s.*,
        sp.name as sponsorName,
        sp.logo as sponsorLogo,
        sp.slug as sponsorSlug,
        sp.website as sponsorWebsite,
        sp.description as sponsorDescription
      FROM scholarships s
      JOIN sponsors sp ON s.sponsorId = sp.id
      WHERE s.id = ? OR s.slug = ?
    `).bind(scholarshipId, scholarshipId).first();

    if (!scholarship) {
      return c.json({ error: 'Scholarship not found' }, 404);
    }

    // Check if user has already applied
    let existingApplication = null;
    if (user) {
      existingApplication = await c.env.DB.prepare(`
        SELECT id, status, submittedAt FROM scholarship_applications
        WHERE scholarshipId = ? AND userId = ?
      `).bind(scholarship.id, user.userId).first();
    }

    return c.json({
      scholarship: {
        ...scholarship,
        eligibilityCriteria: scholarship.eligibilityCriteria ? JSON.parse(scholarship.eligibilityCriteria as string) : null,
        requirements: scholarship.requirements ? JSON.parse(scholarship.requirements as string) : [],
        documents: scholarship.documents ? JSON.parse(scholarship.documents as string) : [],
        requiredGradeLevel: scholarship.requiredGradeLevel ? JSON.parse(scholarship.requiredGradeLevel as string) : null,
        requiredMdas: scholarship.requiredMdas ? JSON.parse(scholarship.requiredMdas as string) : null,
        requiredDepartments: scholarship.requiredDepartments ? JSON.parse(scholarship.requiredDepartments as string) : null,
      },
      existingApplication,
    });
  } catch (error) {
    console.error('Get scholarship error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// ============================================================================
// USER ROUTES - Scholarship Applications
// ============================================================================

// Submit scholarship application
sponsorshipRoutes.post('/scholarships/:id/apply', zValidator('json', createScholarshipApplicationSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const scholarshipId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    // Verify scholarship exists and is open
    const scholarship = await c.env.DB.prepare(`
      SELECT * FROM scholarships WHERE id = ? AND status = 'open'
    `).bind(scholarshipId).first();

    if (!scholarship) {
      return c.json({ error: 'Scholarship not found or not accepting applications' }, 404);
    }

    // Check deadline
    if (scholarship.applicationDeadline && new Date(scholarship.applicationDeadline as string) < new Date()) {
      return c.json({ error: 'Application deadline has passed' }, 400);
    }

    // Check if user already applied
    const existing = await c.env.DB.prepare(`
      SELECT id, status FROM scholarship_applications WHERE scholarshipId = ? AND userId = ?
    `).bind(scholarshipId, user.userId).first();

    if (existing && existing.status !== 'draft') {
      return c.json({ error: 'You have already submitted an application for this scholarship' }, 409);
    }

    // Get MDA name if provided
    let mdaName = null;
    if (data.mdaId) {
      const mda = await c.env.DB.prepare('SELECT name FROM mdas WHERE id = ?').bind(data.mdaId).first();
      mdaName = mda?.name;
    }

    const applicationId = existing?.id || crypto.randomUUID();

    if (existing) {
      // Update existing draft
      await c.env.DB.prepare(`
        UPDATE scholarship_applications SET
          fullName = ?, email = ?, phone = ?, staffId = ?, mdaId = ?, mdaName = ?,
          department = ?, currentPosition = ?, yearsOfService = ?, currentGrade = ?,
          dateOfBirth = ?, educationHistory = ?, certifications = ?, careerGoals = ?,
          statementOfPurpose = ?, expectedImpact = ?, howDiscovered = ?,
          supervisorName = ?, supervisorEmail = ?, supervisorPhone = ?,
          status = 'submitted', submittedAt = datetime('now'), updatedAt = datetime('now')
        WHERE id = ?
      `).bind(
        data.fullName, data.email, data.phone || null, data.staffId || null,
        data.mdaId || null, mdaName, data.department || null, data.currentPosition || null,
        data.yearsOfService || null, data.currentGrade || null, data.dateOfBirth || null,
        data.educationHistory ? JSON.stringify(data.educationHistory) : null,
        data.certifications ? JSON.stringify(data.certifications) : null,
        data.careerGoals || null, data.statementOfPurpose, data.expectedImpact || null,
        data.howDiscovered || null, data.supervisorName || null, data.supervisorEmail || null,
        data.supervisorPhone || null, applicationId
      ).run();
    } else {
      // Create new application
      await c.env.DB.prepare(`
        INSERT INTO scholarship_applications (
          id, scholarshipId, userId, fullName, email, phone, staffId, mdaId, mdaName,
          department, currentPosition, yearsOfService, currentGrade, dateOfBirth,
          educationHistory, certifications, careerGoals, statementOfPurpose,
          expectedImpact, howDiscovered, supervisorName, supervisorEmail, supervisorPhone,
          status, submittedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', datetime('now'))
      `).bind(
        applicationId, scholarshipId, user.userId,
        data.fullName, data.email, data.phone || null, data.staffId || null,
        data.mdaId || null, mdaName, data.department || null, data.currentPosition || null,
        data.yearsOfService || null, data.currentGrade || null, data.dateOfBirth || null,
        data.educationHistory ? JSON.stringify(data.educationHistory) : null,
        data.certifications ? JSON.stringify(data.certifications) : null,
        data.careerGoals || null, data.statementOfPurpose, data.expectedImpact || null,
        data.howDiscovered || null, data.supervisorName || null, data.supervisorEmail || null,
        data.supervisorPhone || null
      ).run();
    }

    // Track analytics event
    await c.env.DB.prepare(`
      INSERT INTO sponsorship_analytics (id, sponsorId, eventType, eventSource, contentType, contentId, userId)
      VALUES (?, ?, 'conversion', 'content', 'scholarship', ?, ?)
    `).bind(crypto.randomUUID(), scholarship.sponsorId, scholarshipId, user.userId).run();

    return c.json({
      message: 'Application submitted successfully',
      applicationId,
    }, 201);
  } catch (error) {
    console.error('Submit application error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get user's scholarship applications
sponsorshipRoutes.get('/my-applications', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const applications = await c.env.DB.prepare(`
      SELECT
        sa.*,
        s.title as scholarshipTitle,
        s.slug as scholarshipSlug,
        s.amount as scholarshipAmount,
        s.currency as scholarshipCurrency,
        s.applicationDeadline,
        sp.name as sponsorName,
        sp.logo as sponsorLogo
      FROM scholarship_applications sa
      JOIN scholarships s ON sa.scholarshipId = s.id
      JOIN sponsors sp ON s.sponsorId = sp.id
      WHERE sa.userId = ?
      ORDER BY sa.createdAt DESC
    `).bind(user.userId).all();

    return c.json({
      applications: applications.results.map((app: any) => ({
        ...app,
        educationHistory: app.educationHistory ? JSON.parse(app.educationHistory) : [],
        certifications: app.certifications ? JSON.parse(app.certifications) : [],
      })),
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get single application details
sponsorshipRoutes.get('/my-applications/:id', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const applicationId = c.req.param('id');

  try {
    const application = await c.env.DB.prepare(`
      SELECT
        sa.*,
        s.title as scholarshipTitle,
        s.slug as scholarshipSlug,
        s.description as scholarshipDescription,
        s.amount as scholarshipAmount,
        s.currency as scholarshipCurrency,
        s.programType,
        s.applicationDeadline,
        sp.name as sponsorName,
        sp.logo as sponsorLogo,
        sp.website as sponsorWebsite
      FROM scholarship_applications sa
      JOIN scholarships s ON sa.scholarshipId = s.id
      JOIN sponsors sp ON s.sponsorId = sp.id
      WHERE sa.id = ? AND sa.userId = ?
    `).bind(applicationId, user.userId).first();

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    // Get uploaded documents
    const documents = await c.env.DB.prepare(`
      SELECT * FROM scholarship_documents WHERE applicationId = ?
    `).bind(applicationId).all();

    return c.json({
      application: {
        ...application,
        educationHistory: application.educationHistory ? JSON.parse(application.educationHistory as string) : [],
        certifications: application.certifications ? JSON.parse(application.certifications as string) : [],
      },
      documents: documents.results,
    });
  } catch (error) {
    console.error('Get application error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// ============================================================================
// SPONSOR DASHBOARD ROUTES
// ============================================================================

// Get sponsor dashboard (by access key or user ID)
sponsorshipRoutes.get('/dashboard', async (c) => {
  const user = getUserFromToken(c);
  const accessKey = c.req.query('key');

  try {
    let sponsor;

    if (accessKey) {
      sponsor = await c.env.DB.prepare(`
        SELECT s.*, t.name as tierName, t.slug as tierSlug, t.benefits, t.features, t.color as tierColor
        FROM sponsors s
        JOIN sponsorship_tiers t ON s.tierId = t.id
        WHERE s.dashboardAccessKey = ? AND s.status = 'active'
      `).bind(accessKey).first();
    } else if (user) {
      sponsor = await c.env.DB.prepare(`
        SELECT s.*, t.name as tierName, t.slug as tierSlug, t.benefits, t.features, t.color as tierColor
        FROM sponsors s
        JOIN sponsorship_tiers t ON s.tierId = t.id
        WHERE s.userId = ? AND s.status = 'active'
      `).bind(user.userId).first();
    }

    if (!sponsor) {
      return c.json({ error: 'Sponsor not found or unauthorized' }, 404);
    }

    // Update last dashboard access
    await c.env.DB.prepare(`
      UPDATE sponsors SET lastDashboardAccess = datetime('now') WHERE id = ?
    `).bind(sponsor.id).run();

    // Get dashboard stats
    const stats = await c.env.DB.prepare(`
      SELECT
        (SELECT COALESCE(SUM(totalImpressions), 0) FROM sponsorship_analytics_daily WHERE sponsorId = ?) as totalImpressions,
        (SELECT COALESCE(SUM(totalClicks), 0) FROM sponsorship_analytics_daily WHERE sponsorId = ?) as totalClicks,
        (SELECT COALESCE(SUM(uniqueUsers), 0) FROM sponsorship_analytics_daily WHERE sponsorId = ?) as totalUniqueUsers,
        (SELECT COUNT(*) FROM sponsored_content WHERE sponsorId = ? AND isActive = 1) as activePlacements,
        (SELECT COUNT(*) FROM scholarships WHERE sponsorId = ?) as totalScholarships,
        (SELECT COUNT(*) FROM scholarships WHERE sponsorId = ? AND status = 'open') as activeScholarships,
        (SELECT COUNT(*) FROM scholarship_applications WHERE scholarshipId IN (SELECT id FROM scholarships WHERE sponsorId = ?)) as totalApplications,
        (SELECT COUNT(*) FROM scholarship_applications WHERE scholarshipId IN (SELECT id FROM scholarships WHERE sponsorId = ?) AND status = 'submitted') as pendingReviews,
        (SELECT COUNT(*) FROM scholarship_recipients WHERE scholarshipId IN (SELECT id FROM scholarships WHERE sponsorId = ?)) as scholarsSupported
    `).bind(
      sponsor.id, sponsor.id, sponsor.id, sponsor.id, sponsor.id,
      sponsor.id, sponsor.id, sponsor.id, sponsor.id
    ).first();

    // Get recent analytics (last 30 days)
    const dailyAnalytics = await c.env.DB.prepare(`
      SELECT * FROM sponsorship_analytics_daily
      WHERE sponsorId = ? AND date >= date('now', '-30 days')
      ORDER BY date ASC
    `).bind(sponsor.id).all();

    // Get scholarships
    const scholarships = await c.env.DB.prepare(`
      SELECT * FROM scholarships WHERE sponsorId = ? ORDER BY createdAt DESC
    `).bind(sponsor.id).all();

    // Get recent recipients
    const recipients = await c.env.DB.prepare(`
      SELECT
        sr.*,
        sa.fullName, sa.email, sa.department, sa.mdaName,
        s.title as scholarshipTitle
      FROM scholarship_recipients sr
      JOIN scholarship_applications sa ON sr.applicationId = sa.id
      JOIN scholarships s ON sr.scholarshipId = s.id
      WHERE sr.scholarshipId IN (SELECT id FROM scholarships WHERE sponsorId = ?)
      ORDER BY sr.awardDate DESC
      LIMIT 10
    `).bind(sponsor.id).all();

    // Get recent activity
    const activity = await c.env.DB.prepare(`
      SELECT * FROM sponsor_activity_log
      WHERE sponsorId = ?
      ORDER BY createdAt DESC
      LIMIT 20
    `).bind(sponsor.id).all();

    // Calculate engagement rate
    const engagementRate = stats?.totalImpressions > 0
      ? ((stats?.totalClicks || 0) / (stats?.totalImpressions || 1) * 100).toFixed(2)
      : 0;

    return c.json({
      sponsor: {
        ...sponsor,
        tier: {
          name: sponsor.tierName,
          slug: sponsor.tierSlug,
          color: sponsor.tierColor,
          benefits: sponsor.benefits ? JSON.parse(sponsor.benefits as string) : [],
          features: sponsor.features ? JSON.parse(sponsor.features as string) : [],
        },
      },
      stats: {
        totalImpressions: stats?.totalImpressions || 0,
        totalClicks: stats?.totalClicks || 0,
        totalUniqueUsers: stats?.totalUniqueUsers || 0,
        engagementRate: parseFloat(engagementRate as string),
        activePlacements: stats?.activePlacements || 0,
        totalScholarships: stats?.totalScholarships || 0,
        activeScholarships: stats?.activeScholarships || 0,
        totalApplications: stats?.totalApplications || 0,
        pendingReviews: stats?.pendingReviews || 0,
        scholarsSupported: stats?.scholarsSupported || 0,
      },
      dailyAnalytics: dailyAnalytics.results.map((d: any) => ({
        ...d,
        usersByMda: d.usersByMda ? JSON.parse(d.usersByMda) : {},
        usersByRole: d.usersByRole ? JSON.parse(d.usersByRole) : {},
      })),
      scholarships: scholarships.results.map((s: any) => ({
        ...s,
        eligibilityCriteria: s.eligibilityCriteria ? JSON.parse(s.eligibilityCriteria) : null,
        requirements: s.requirements ? JSON.parse(s.requirements) : [],
      })),
      recipients: recipients.results,
      recentActivity: activity.results,
    });
  } catch (error) {
    console.error('Get sponsor dashboard error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get scholarship applications for sponsor
sponsorshipRoutes.get('/dashboard/applications', async (c) => {
  const user = getUserFromToken(c);
  const accessKey = c.req.query('key');
  const scholarshipId = c.req.query('scholarshipId');
  const VALID_APP_STATUSES = ['draft', 'submitted', 'under_review', 'shortlisted', 'interview', 'approved', 'rejected', 'withdrawn'];
  const rawStatus = c.req.query('status');
  const status = rawStatus && VALID_APP_STATUSES.includes(rawStatus) ? rawStatus : null;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    let sponsor;

    if (accessKey) {
      sponsor = await c.env.DB.prepare(`
        SELECT id FROM sponsors WHERE dashboardAccessKey = ? AND status = 'active'
      `).bind(accessKey).first();
    } else if (user) {
      sponsor = await c.env.DB.prepare(`
        SELECT id FROM sponsors WHERE userId = ? AND status = 'active'
      `).bind(user.userId).first();
    }

    if (!sponsor) {
      return c.json({ error: 'Sponsor not found or unauthorized' }, 404);
    }

    const whereParams: any[] = [sponsor.id];
    let whereClause = 'WHERE s.sponsorId = ?';
    if (scholarshipId) {
      whereClause += ' AND sa.scholarshipId = ?';
      whereParams.push(scholarshipId);
    }
    if (status) {
      whereClause += ' AND sa.status = ?';
      whereParams.push(status);
    }

    const applications = await c.env.DB.prepare(`
      SELECT
        sa.*,
        s.title as scholarshipTitle,
        u.displayName as userName,
        u.avatar as userAvatar
      FROM scholarship_applications sa
      JOIN scholarships s ON sa.scholarshipId = s.id
      JOIN users u ON sa.userId = u.id
      ${whereClause}
      ORDER BY sa.submittedAt DESC
      LIMIT ? OFFSET ?
    `).bind(...whereParams, limit, offset).all();

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM scholarship_applications sa
      JOIN scholarships s ON sa.scholarshipId = s.id
      ${whereClause}
    `).bind(...whereParams).first();

    // Get status counts
    const statusCounts = await c.env.DB.prepare(`
      SELECT sa.status, COUNT(*) as count
      FROM scholarship_applications sa
      JOIN scholarships s ON sa.scholarshipId = s.id
      WHERE s.sponsorId = ?
      GROUP BY sa.status
    `).bind(sponsor.id).all();

    return c.json({
      applications: applications.results.map((app: any) => ({
        ...app,
        educationHistory: app.educationHistory ? JSON.parse(app.educationHistory) : [],
        certifications: app.certifications ? JSON.parse(app.certifications) : [],
      })),
      pagination: {
        page,
        limit,
        total: (countResult as any)?.total || 0,
        totalPages: Math.ceil(((countResult as any)?.total || 0) / limit),
      },
      statusCounts: statusCounts.results.reduce((acc: any, item: any) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Get sponsor applications error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// ============================================================================
// ANALYTICS TRACKING
// ============================================================================

// Track analytics event (public endpoint)
sponsorshipRoutes.post('/analytics/track', zValidator('json', trackAnalyticsSchema), async (c) => {
  const data = c.req.valid('json');
  const user = getUserFromToken(c);

  try {
    await c.env.DB.prepare(`
      INSERT INTO sponsorship_analytics (
        id, sponsorId, eventType, eventSource, contentType, contentId, contentTitle,
        userId, sessionId, metadata, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      data.sponsorId,
      data.eventType,
      data.eventSource || null,
      data.contentType || null,
      data.contentId || null,
      data.contentTitle || null,
      user?.userId || null,
      c.req.header('x-session-id') || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get content sponsors (for displaying badges/banners)
sponsorshipRoutes.get('/content/:contentType/:contentId', async (c) => {
  const contentType = c.req.param('contentType');
  const contentId = c.req.param('contentId');

  try {
    const sponsoredContent = await c.env.DB.prepare(`
      SELECT
        sc.*,
        s.id as sponsorId, s.name as sponsorName, s.logo as sponsorLogo,
        s.tagline as sponsorTagline, s.website as sponsorWebsite,
        t.slug as tierSlug, t.color as tierColor
      FROM sponsored_content sc
      JOIN sponsors s ON sc.sponsorId = s.id
      JOIN sponsorship_tiers t ON s.tierId = t.id
      WHERE sc.contentType = ? AND sc.contentId = ?
        AND sc.isActive = 1 AND s.status = 'active'
        AND (sc.startDate IS NULL OR sc.startDate <= date('now'))
        AND (sc.endDate IS NULL OR sc.endDate >= date('now'))
      ORDER BY sc.displayPriority DESC
    `).bind(contentType, contentId).all();

    return c.json({
      sponsors: sponsoredContent.results.map((sc: any) => ({
        id: sc.sponsorId,
        name: sc.sponsorName,
        logo: sc.sponsorLogo,
        tagline: sc.sponsorTagline,
        website: sc.sponsorWebsite,
        tierSlug: sc.tierSlug,
        tierColor: sc.tierColor,
        placement: {
          type: sc.placementType,
          position: sc.placementPosition,
          message: sc.customMessage,
          cta: sc.customCTA,
          ctaUrl: sc.customCTAUrl,
        },
      })),
    });
  } catch (error) {
    console.error('Get content sponsors error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// Admin: Get all sponsors
sponsorshipRoutes.get('/admin/sponsors', async (c) => {
  const user = getUserFromToken(c);
  if (!user || !isAdmin(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const VALID_SPONSOR_STATUSES = ['pending', 'active', 'suspended', 'expired'];
  const rawStatus = c.req.query('status') || 'all';
  const status = rawStatus === 'all' ? 'all' : (VALID_SPONSOR_STATUSES.includes(rawStatus) ? rawStatus : 'all');
  const VALID_TIER_SLUGS = ['platinum', 'gold', 'silver', 'bronze'];
  const rawTier = c.req.query('tier');
  const tier = rawTier && VALID_TIER_SLUGS.includes(rawTier) ? rawTier : null;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    const whereParams: any[] = [];
    let whereClause = 'WHERE 1=1';
    if (status !== 'all') {
      whereClause += ' AND s.status = ?';
      whereParams.push(status);
    }
    if (tier) {
      whereClause += ' AND t.slug = ?';
      whereParams.push(tier);
    }

    const sponsors = await c.env.DB.prepare(`
      SELECT
        s.*,
        t.name as tierName,
        t.slug as tierSlug,
        t.color as tierColor,
        (SELECT COUNT(*) FROM scholarships WHERE sponsorId = s.id) as scholarshipCount,
        (SELECT COUNT(*) FROM scholarship_recipients WHERE scholarshipId IN
          (SELECT id FROM scholarships WHERE sponsorId = s.id)) as recipientCount
      FROM sponsors s
      JOIN sponsorship_tiers t ON s.tierId = t.id
      ${whereClause}
      ORDER BY
        CASE s.status WHEN 'pending' THEN 1 WHEN 'active' THEN 2 ELSE 3 END,
        t.sortOrder ASC,
        s.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(...whereParams, limit, offset).all();

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM sponsors s
      JOIN sponsorship_tiers t ON s.tierId = t.id
      ${whereClause}
    `).bind(...whereParams).first();

    // Get status counts
    const statusCounts = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count FROM sponsors GROUP BY status
    `).all();

    // Get tier counts
    const tierCounts = await c.env.DB.prepare(`
      SELECT t.slug, COUNT(*) as count
      FROM sponsors s
      JOIN sponsorship_tiers t ON s.tierId = t.id
      WHERE s.status = 'active'
      GROUP BY t.slug
    `).all();

    return c.json({
      sponsors: sponsors.results,
      pagination: {
        page,
        limit,
        total: (countResult as any)?.total || 0,
        totalPages: Math.ceil(((countResult as any)?.total || 0) / limit),
      },
      statusCounts: statusCounts.results.reduce((acc: any, item: any) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
      tierCounts: tierCounts.results.reduce((acc: any, item: any) => {
        acc[item.slug] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Get admin sponsors error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Admin: Create sponsor
sponsorshipRoutes.post('/admin/sponsors', zValidator('json', createSponsorSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user || !isAdmin(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const data = c.req.valid('json');

  try {
    const sponsorId = crypto.randomUUID();
    const slug = generateSlug(data.name);
    const accessKey = generateAccessKey();

    await c.env.DB.prepare(`
      INSERT INTO sponsors (
        id, name, slug, tierId, logo, logoDark, banner, tagline, description, website,
        contactEmail, contactPerson, contactPhone, contactTitle,
        investmentAmount, currency, startDate, endDate,
        linkedIn, twitter, facebook, industry, companySize, region, notes,
        status, dashboardAccessKey, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).bind(
      sponsorId, data.name, slug, data.tierId,
      data.logo || null, data.logoDark || null, data.banner || null,
      data.tagline || null, data.description || null, data.website || null,
      data.contactEmail || null, data.contactPerson || null,
      data.contactPhone || null, data.contactTitle || null,
      data.investmentAmount || null, data.currency || 'GHS',
      data.startDate || null, data.endDate || null,
      data.linkedIn || null, data.twitter || null, data.facebook || null,
      data.industry || null, data.companySize || null, data.region || null, data.notes || null,
      accessKey, user.userId
    ).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO sponsor_activity_log (id, sponsorId, actorId, actorType, action, details)
      VALUES (?, ?, ?, 'admin', 'status_change', 'Sponsor created')
    `).bind(crypto.randomUUID(), sponsorId, user.userId).run();

    return c.json({
      message: 'Sponsor created successfully',
      sponsorId,
      slug,
      dashboardAccessKey: accessKey,
    }, 201);
  } catch (error) {
    console.error('Create sponsor error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Admin: Get single sponsor
sponsorshipRoutes.get('/admin/sponsors/:id', async (c) => {
  const user = getUserFromToken(c);
  if (!user || !isAdmin(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const sponsorId = c.req.param('id');

  try {
    const sponsor = await c.env.DB.prepare(`
      SELECT
        s.*,
        t.name as tierName,
        t.slug as tierSlug,
        t.benefits as tierBenefits,
        t.features as tierFeatures,
        t.color as tierColor
      FROM sponsors s
      JOIN sponsorship_tiers t ON s.tierId = t.id
      WHERE s.id = ?
    `).bind(sponsorId).first();

    if (!sponsor) {
      return c.json({ error: 'Sponsor not found' }, 404);
    }

    // Get contacts
    const contacts = await c.env.DB.prepare(`
      SELECT * FROM sponsor_contacts WHERE sponsorId = ?
    `).bind(sponsorId).all();

    // Get scholarships
    const scholarships = await c.env.DB.prepare(`
      SELECT * FROM scholarships WHERE sponsorId = ?
    `).bind(sponsorId).all();

    // Get sponsored content
    const sponsoredContent = await c.env.DB.prepare(`
      SELECT * FROM sponsored_content WHERE sponsorId = ?
    `).bind(sponsorId).all();

    // Get review history
    const history = await c.env.DB.prepare(`
      SELECT
        srh.*,
        u.displayName as reviewerName
      FROM sponsor_review_history srh
      LEFT JOIN users u ON srh.reviewerId = u.id
      WHERE srh.sponsorId = ?
      ORDER BY srh.createdAt DESC
    `).bind(sponsorId).all();

    return c.json({
      sponsor: {
        ...sponsor,
        tier: {
          name: sponsor.tierName,
          slug: sponsor.tierSlug,
          color: sponsor.tierColor,
          benefits: sponsor.tierBenefits ? JSON.parse(sponsor.tierBenefits as string) : [],
          features: sponsor.tierFeatures ? JSON.parse(sponsor.tierFeatures as string) : [],
        },
      },
      contacts: contacts.results,
      scholarships: scholarships.results.map((s: any) => ({
        ...s,
        eligibilityCriteria: s.eligibilityCriteria ? JSON.parse(s.eligibilityCriteria) : null,
        requirements: s.requirements ? JSON.parse(s.requirements) : [],
      })),
      sponsoredContent: sponsoredContent.results,
      history: history.results,
    });
  } catch (error) {
    console.error('Get sponsor details error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Admin: Update sponsor
sponsorshipRoutes.patch('/admin/sponsors/:id', zValidator('json', updateSponsorSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user || !isAdmin(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const sponsorId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const updates: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    const fields = [
      'name', 'tierId', 'logo', 'logoDark', 'banner', 'tagline', 'description', 'website',
      'contactEmail', 'contactPerson', 'contactPhone', 'contactTitle',
      'investmentAmount', 'currency', 'startDate', 'endDate',
      'linkedIn', 'twitter', 'facebook', 'industry', 'companySize', 'region', 'notes'
    ];

    for (const field of fields) {
      if ((data as any)[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push((data as any)[field] || null);
      }
    }

    if (updates.length === 0) {
      return c.json({ message: 'No changes' });
    }

    updates.push("updatedAt = datetime('now')");
    values.push(sponsorId);

    await c.env.DB.prepare(`
      UPDATE sponsors SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({ message: 'Sponsor updated successfully' });
  } catch (error) {
    console.error('Update sponsor error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Admin: Update sponsor status
sponsorshipRoutes.patch('/admin/sponsors/:id/status', zValidator('json', updateSponsorStatusSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user || !isAdmin(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const sponsorId = c.req.param('id');
  const { status, notes } = c.req.valid('json');

  try {
    const sponsor = await c.env.DB.prepare(`
      SELECT status FROM sponsors WHERE id = ?
    `).bind(sponsorId).first();

    if (!sponsor) {
      return c.json({ error: 'Sponsor not found' }, 404);
    }

    let updateFields = 'status = ?, updatedAt = datetime(\'now\')';
    const updateValues: any[] = [status];

    if (status === 'active' && sponsor.status === 'pending') {
      updateFields += ', approvedBy = ?, approvedAt = datetime(\'now\')';
      updateValues.push(user.userId);
    }

    updateValues.push(sponsorId);

    await c.env.DB.prepare(`
      UPDATE sponsors SET ${updateFields} WHERE id = ?
    `).bind(...updateValues).run();

    // Log the action
    await c.env.DB.prepare(`
      INSERT INTO sponsor_review_history (id, sponsorId, reviewerId, action, notes)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      sponsorId,
      user.userId,
      status,
      notes || null
    ).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO sponsor_activity_log (id, sponsorId, actorId, actorType, action, details, previousValue, newValue)
      VALUES (?, ?, ?, 'admin', 'status_change', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      sponsorId,
      user.userId,
      notes || `Status changed to ${status}`,
      sponsor.status,
      status
    ).run();

    return c.json({ message: `Sponsor ${status}` });
  } catch (error) {
    console.error('Update sponsor status error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Admin: Create scholarship
sponsorshipRoutes.post('/admin/sponsors/:sponsorId/scholarships', zValidator('json', createScholarshipSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user || !isAdmin(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const sponsorId = c.req.param('sponsorId');
  const data = c.req.valid('json');

  try {
    // Verify sponsor exists
    const sponsor = await c.env.DB.prepare(`
      SELECT id FROM sponsors WHERE id = ?
    `).bind(sponsorId).first();

    if (!sponsor) {
      return c.json({ error: 'Sponsor not found' }, 404);
    }

    const scholarshipId = crypto.randomUUID();
    const slug = generateSlug(data.title);

    await c.env.DB.prepare(`
      INSERT INTO scholarships (
        id, sponsorId, title, slug, description, shortDescription,
        amount, currency, totalBudget, programType, targetProgram, programDuration,
        eligibilityCriteria, requirements, maxRecipients,
        applicationDeadline, selectionDate, programStartDate, programEndDate,
        coverImage, isFeatured, status, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
    `).bind(
      scholarshipId, sponsorId, data.title, slug,
      data.description || null, data.shortDescription || null,
      data.amount, data.currency || 'GHS', data.totalBudget || null,
      data.programType || null, data.targetProgram || null, data.programDuration || null,
      data.eligibilityCriteria ? JSON.stringify(data.eligibilityCriteria) : null,
      data.requirements ? JSON.stringify(data.requirements) : null,
      data.maxRecipients || 1,
      data.applicationDeadline || null, data.selectionDate || null,
      data.programStartDate || null, data.programEndDate || null,
      data.coverImage || null, data.isFeatured ? 1 : 0,
      user.userId
    ).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO sponsor_activity_log (id, sponsorId, actorId, actorType, action, details)
      VALUES (?, ?, ?, 'admin', 'scholarship_created', ?)
    `).bind(crypto.randomUUID(), sponsorId, user.userId, `Scholarship "${data.title}" created`).run();

    return c.json({
      message: 'Scholarship created successfully',
      scholarshipId,
      slug,
    }, 201);
  } catch (error) {
    console.error('Create scholarship error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Admin: Update scholarship
sponsorshipRoutes.patch('/admin/scholarships/:id', zValidator('json', updateScholarshipSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user || !isAdmin(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const scholarshipId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const updates: string[] = [];
    const values: any[] = [];

    const directFields = [
      'title', 'description', 'shortDescription', 'amount', 'currency', 'totalBudget',
      'programType', 'targetProgram', 'programDuration', 'maxRecipients',
      'applicationDeadline', 'selectionDate', 'programStartDate', 'programEndDate',
      'coverImage', 'status'
    ];

    for (const field of directFields) {
      if ((data as any)[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push((data as any)[field] || null);
      }
    }

    if (data.eligibilityCriteria !== undefined) {
      updates.push('eligibilityCriteria = ?');
      values.push(JSON.stringify(data.eligibilityCriteria));
    }

    if (data.requirements !== undefined) {
      updates.push('requirements = ?');
      values.push(JSON.stringify(data.requirements));
    }

    if (data.isFeatured !== undefined) {
      updates.push('isFeatured = ?');
      values.push(data.isFeatured ? 1 : 0);
    }

    // Handle status change to open
    if (data.status === 'open') {
      updates.push("publishedAt = datetime('now')");
    }

    if (updates.length === 0) {
      return c.json({ message: 'No changes' });
    }

    updates.push("updatedAt = datetime('now')");
    values.push(scholarshipId);

    await c.env.DB.prepare(`
      UPDATE scholarships SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({ message: 'Scholarship updated successfully' });
  } catch (error) {
    console.error('Update scholarship error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Admin: Review scholarship application
sponsorshipRoutes.patch('/admin/applications/:id/review', zValidator('json', reviewApplicationSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user || !isAdmin(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const applicationId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const application = await c.env.DB.prepare(`
      SELECT sa.*, s.sponsorId, s.title as scholarshipTitle, s.amount as scholarshipAmount
      FROM scholarship_applications sa
      JOIN scholarships s ON sa.scholarshipId = s.id
      WHERE sa.id = ?
    `).bind(applicationId).first();

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    let updateFields = `status = ?, updatedAt = datetime('now')`;
    const updateValues: any[] = [data.status];

    if (data.reviewScore !== undefined) {
      updateFields += ', reviewScore = ?';
      updateValues.push(data.reviewScore);
    }
    if (data.reviewNotes !== undefined) {
      updateFields += ', reviewNotes = ?';
      updateValues.push(data.reviewNotes);
    }

    // Status-specific updates
    if (data.status === 'under_review' || data.status === 'shortlisted') {
      updateFields += ", reviewedBy = ?, reviewedAt = datetime('now')";
      updateValues.push(user.userId);
    }

    if (data.status === 'shortlisted') {
      updateFields += ", shortlistedBy = ?, shortlistedAt = datetime('now')";
      updateValues.push(user.userId);
    }

    if (data.status === 'approved') {
      updateFields += ", awardedBy = ?, awardedAt = datetime('now'), awardedAmount = ?";
      updateValues.push(user.userId);
      updateValues.push(data.awardedAmount || application.scholarshipAmount);

      // Create recipient record
      await c.env.DB.prepare(`
        INSERT INTO scholarship_recipients (
          id, scholarshipId, applicationId, userId, awardedAmount, currency, awardDate
        ) VALUES (?, ?, ?, ?, ?, 'GHS', date('now'))
      `).bind(
        crypto.randomUUID(),
        application.scholarshipId,
        applicationId,
        application.userId,
        data.awardedAmount || application.scholarshipAmount
      ).run();

      // Update scholarship recipient count
      await c.env.DB.prepare(`
        UPDATE scholarships SET currentRecipients = currentRecipients + 1 WHERE id = ?
      `).bind(application.scholarshipId).run();
    }

    if (data.status === 'rejected') {
      updateFields += ", rejectedBy = ?, rejectedAt = datetime('now'), rejectionReason = ?";
      updateValues.push(user.userId);
      updateValues.push(data.rejectionReason || null);
    }

    updateValues.push(applicationId);

    await c.env.DB.prepare(`
      UPDATE scholarship_applications SET ${updateFields} WHERE id = ?
    `).bind(...updateValues).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO sponsor_activity_log (id, sponsorId, actorId, actorType, action, details)
      VALUES (?, ?, ?, 'admin', 'application_reviewed', ?)
    `).bind(
      crypto.randomUUID(),
      application.sponsorId,
      user.userId,
      `Application for "${application.scholarshipTitle}" ${data.status}`
    ).run();

    return c.json({ message: `Application ${data.status}` });
  } catch (error) {
    console.error('Review application error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Admin: Create sponsored content
sponsorshipRoutes.post('/admin/sponsors/:sponsorId/content', zValidator('json', createSponsoredContentSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user || !isAdmin(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const sponsorId = c.req.param('sponsorId');
  const data = c.req.valid('json');

  try {
    const contentId = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO sponsored_content (
        id, sponsorId, contentType, contentId, contentTitle,
        placementType, placementPosition, customMessage, customCTA, customCTAUrl,
        displayPriority, showOnMobile, startDate, endDate, isActive, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      contentId, sponsorId, data.contentType, data.contentId || null, data.contentTitle || null,
      data.placementType, data.placementPosition || null,
      data.customMessage || null, data.customCTA || null, data.customCTAUrl || null,
      data.displayPriority || 0, data.showOnMobile ? 1 : 0,
      data.startDate || null, data.endDate || null, user.userId
    ).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO sponsor_activity_log (id, sponsorId, actorId, actorType, action, details)
      VALUES (?, ?, ?, 'admin', 'content_added', ?)
    `).bind(crypto.randomUUID(), sponsorId, user.userId, `Sponsored content added: ${data.contentType}`).run();

    return c.json({
      message: 'Sponsored content created successfully',
      contentId,
    }, 201);
  } catch (error) {
    console.error('Create sponsored content error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Admin: Get dashboard stats
sponsorshipRoutes.get('/admin/stats', async (c) => {
  const user = getUserFromToken(c);
  if (!user || !isAdmin(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    const stats = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM sponsors) as totalSponsors,
        (SELECT COUNT(*) FROM sponsors WHERE status = 'active') as activeSponsors,
        (SELECT COUNT(*) FROM sponsors WHERE status = 'pending') as pendingSponsors,
        (SELECT COALESCE(SUM(investmentAmount), 0) FROM sponsors WHERE status = 'active') as totalInvestment,
        (SELECT COUNT(*) FROM scholarships) as totalScholarships,
        (SELECT COUNT(*) FROM scholarships WHERE status = 'open') as activeScholarships,
        (SELECT COUNT(*) FROM scholarship_applications) as totalApplications,
        (SELECT COUNT(*) FROM scholarship_applications WHERE status = 'submitted') as pendingReviews,
        (SELECT COUNT(*) FROM scholarship_recipients) as totalRecipients,
        (SELECT COALESCE(SUM(awardedAmount), 0) FROM scholarship_recipients) as totalAwarded
    `).first();

    // Get sponsors by tier
    const tierBreakdown = await c.env.DB.prepare(`
      SELECT t.slug, COUNT(s.id) as count
      FROM sponsorship_tiers t
      LEFT JOIN sponsors s ON t.id = s.tierId AND s.status = 'active'
      GROUP BY t.slug
      ORDER BY t.sortOrder
    `).all();

    // Get recent activity
    const recentActivity = await c.env.DB.prepare(`
      SELECT
        sal.*,
        s.name as sponsorName,
        u.displayName as actorName
      FROM sponsor_activity_log sal
      JOIN sponsors s ON sal.sponsorId = s.id
      LEFT JOIN users u ON sal.actorId = u.id
      ORDER BY sal.createdAt DESC
      LIMIT 10
    `).all();

    return c.json({
      stats,
      tierBreakdown: tierBreakdown.results.reduce((acc: any, item: any) => {
        acc[item.slug] = item.count;
        return acc;
      }, {}),
      recentActivity: recentActivity.results,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

export { sponsorshipRoutes };
