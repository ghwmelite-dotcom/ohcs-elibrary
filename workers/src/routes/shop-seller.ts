import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const sellerRoutes = new Hono();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const sellerApplicationSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters').max(100),
  storeDescription: z.string().min(50, 'Description must be at least 50 characters').max(2000),
  businessType: z.enum(['individual', 'organization', 'mda']),

  // Personal Info
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  staffId: z.string().optional(),
  mdaId: z.string().optional(),
  department: z.string().optional(),

  // Verification Documents
  governmentIdType: z.enum(['national_id', 'passport', 'voter_id', 'staff_id']).optional(),
  governmentIdNumber: z.string().optional(),

  // Author Info
  isAuthor: z.boolean().default(false),
  authorBio: z.string().max(1000).optional(),
  publishedWorks: z.array(z.string()).optional(),

  // Payment Info
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  mobileMoneyProvider: z.enum(['MTN', 'Vodafone', 'AirtelTigo']).optional(),
  mobileMoneyNumber: z.string().optional(),
  preferredPayoutMethod: z.enum(['mobile_money', 'bank_transfer']).default('mobile_money'),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected', 'request_info']),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

const updateSellerProfileSchema = z.object({
  storeName: z.string().min(3).max(100).optional(),
  storeDescription: z.string().max(2000).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedIn: z.string().url().optional().or(z.literal('')),
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

// Auth middleware check
function getUserFromToken(c: any): { userId: string; role: string } | null {
  const user = c.get('user');
  if (!user) return null;
  return { userId: user.id, role: user.role };
}

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// Check if user can become a seller
sellerRoutes.get('/eligibility', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Check if user already has an application
    const existingApplication = await c.env.DB.prepare(`
      SELECT id, status, rejectionReason, createdAt
      FROM seller_applications
      WHERE userId = ?
    `).bind(user.userId).first();

    // Check if user already has a seller profile
    const existingProfile = await c.env.DB.prepare(`
      SELECT id, storeName, status
      FROM seller_profiles
      WHERE userId = ?
    `).bind(user.userId).first();

    if (existingProfile) {
      return c.json({
        eligible: false,
        reason: 'already_seller',
        profile: existingProfile,
      });
    }

    if (existingApplication) {
      return c.json({
        eligible: existingApplication.status === 'rejected',
        reason: existingApplication.status === 'rejected' ? 'can_reapply' : 'application_pending',
        application: existingApplication,
      });
    }

    return c.json({
      eligible: true,
      reason: 'can_apply',
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Submit seller application
sellerRoutes.post('/apply', zValidator('json', sellerApplicationSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const data = c.req.valid('json');

  try {
    // Check for existing application
    const existing = await c.env.DB.prepare(`
      SELECT id, status FROM seller_applications WHERE userId = ?
    `).bind(user.userId).first();

    if (existing && existing.status !== 'rejected') {
      return c.json({
        error: 'Application Exists',
        message: 'You already have a pending or approved application',
      }, 409);
    }

    const applicationId = crypto.randomUUID();

    // If reapplying, update existing; otherwise insert new
    if (existing && existing.status === 'rejected') {
      await c.env.DB.prepare(`
        UPDATE seller_applications SET
          storeName = ?,
          storeDescription = ?,
          businessType = ?,
          fullName = ?,
          email = ?,
          phone = ?,
          staffId = ?,
          mdaId = ?,
          department = ?,
          governmentIdType = ?,
          governmentIdNumber = ?,
          isAuthor = ?,
          authorBio = ?,
          publishedWorks = ?,
          bankName = ?,
          bankAccountNumber = ?,
          bankAccountName = ?,
          mobileMoneyProvider = ?,
          mobileMoneyNumber = ?,
          preferredPayoutMethod = ?,
          status = 'pending',
          rejectionReason = NULL,
          reviewNotes = NULL,
          submittedAt = datetime('now'),
          updatedAt = datetime('now')
        WHERE userId = ?
      `).bind(
        data.storeName,
        data.storeDescription,
        data.businessType,
        data.fullName,
        data.email,
        data.phone || null,
        data.staffId || null,
        data.mdaId || null,
        data.department || null,
        data.governmentIdType || null,
        data.governmentIdNumber || null,
        data.isAuthor ? 1 : 0,
        data.authorBio || null,
        data.publishedWorks ? JSON.stringify(data.publishedWorks) : null,
        data.bankName || null,
        data.bankAccountNumber || null,
        data.bankAccountName || null,
        data.mobileMoneyProvider || null,
        data.mobileMoneyNumber || null,
        data.preferredPayoutMethod,
        user.userId
      ).run();

      // Log resubmission
      await c.env.DB.prepare(`
        INSERT INTO seller_review_history (id, applicationId, reviewerId, action, notes)
        VALUES (?, ?, ?, 'resubmitted', 'Application resubmitted after rejection')
      `).bind(crypto.randomUUID(), existing.id, user.userId).run();

      return c.json({
        message: 'Application resubmitted successfully',
        applicationId: existing.id,
      }, 200);
    }

    // Insert new application
    await c.env.DB.prepare(`
      INSERT INTO seller_applications (
        id, userId, storeName, storeDescription, businessType,
        fullName, email, phone, staffId, mdaId, department,
        governmentIdType, governmentIdNumber,
        isAuthor, authorBio, publishedWorks,
        bankName, bankAccountNumber, bankAccountName,
        mobileMoneyProvider, mobileMoneyNumber, preferredPayoutMethod,
        status, submittedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(
      applicationId,
      user.userId,
      data.storeName,
      data.storeDescription,
      data.businessType,
      data.fullName,
      data.email,
      data.phone || null,
      data.staffId || null,
      data.mdaId || null,
      data.department || null,
      data.governmentIdType || null,
      data.governmentIdNumber || null,
      data.isAuthor ? 1 : 0,
      data.authorBio || null,
      data.publishedWorks ? JSON.stringify(data.publishedWorks) : null,
      data.bankName || null,
      data.bankAccountNumber || null,
      data.bankAccountName || null,
      data.mobileMoneyProvider || null,
      data.mobileMoneyNumber || null,
      data.preferredPayoutMethod
    ).run();

    // Log submission
    await c.env.DB.prepare(`
      INSERT INTO seller_review_history (id, applicationId, reviewerId, action, notes)
      VALUES (?, ?, ?, 'submitted', 'New seller application submitted')
    `).bind(crypto.randomUUID(), applicationId, user.userId).run();

    return c.json({
      message: 'Application submitted successfully',
      applicationId,
    }, 201);
  } catch (error) {
    console.error('Application submission error:', error);
    return c.json({ error: 'Server Error', message: 'Failed to submit application' }, 500);
  }
});

// Get current user's application status
sellerRoutes.get('/application', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const application = await c.env.DB.prepare(`
      SELECT
        sa.*,
        u.displayName as reviewerName
      FROM seller_applications sa
      LEFT JOIN users u ON sa.reviewedBy = u.id
      WHERE sa.userId = ?
    `).bind(user.userId).first();

    if (!application) {
      return c.json({ application: null });
    }

    // Get review history
    const history = await c.env.DB.prepare(`
      SELECT
        srh.*,
        u.displayName as reviewerName
      FROM seller_review_history srh
      LEFT JOIN users u ON srh.reviewerId = u.id
      WHERE srh.applicationId = ?
      ORDER BY srh.createdAt DESC
    `).bind(application.id).all();

    return c.json({
      application: {
        ...application,
        publishedWorks: application.publishedWorks ? JSON.parse(application.publishedWorks as string) : [],
      },
      history: history.results,
    });
  } catch (error) {
    console.error('Get application error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get current user's seller profile
sellerRoutes.get('/profile', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const profile = await c.env.DB.prepare(`
      SELECT * FROM seller_profiles WHERE userId = ?
    `).bind(user.userId).first();

    if (!profile) {
      return c.json({ profile: null });
    }

    return c.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Update seller profile
sellerRoutes.patch('/profile', zValidator('json', updateSellerProfileSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const data = c.req.valid('json');

  try {
    const profile = await c.env.DB.prepare(`
      SELECT id FROM seller_profiles WHERE userId = ?
    `).bind(user.userId).first();

    if (!profile) {
      return c.json({ error: 'Not a seller' }, 403);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.storeName) {
      updates.push('storeName = ?');
      values.push(data.storeName);
    }
    if (data.storeDescription !== undefined) {
      updates.push('storeDescription = ?');
      values.push(data.storeDescription);
    }
    if (data.contactEmail !== undefined) {
      updates.push('contactEmail = ?');
      values.push(data.contactEmail);
    }
    if (data.contactPhone !== undefined) {
      updates.push('contactPhone = ?');
      values.push(data.contactPhone);
    }
    if (data.website !== undefined) {
      updates.push('website = ?');
      values.push(data.website || null);
    }
    if (data.linkedIn !== undefined) {
      updates.push('linkedIn = ?');
      values.push(data.linkedIn || null);
    }

    if (updates.length === 0) {
      return c.json({ message: 'No changes' });
    }

    updates.push('updatedAt = datetime(\'now\')');
    values.push(profile.id);

    await c.env.DB.prepare(`
      UPDATE seller_profiles SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get seller dashboard stats
sellerRoutes.get('/dashboard', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const profile = await c.env.DB.prepare(`
      SELECT * FROM seller_profiles WHERE userId = ?
    `).bind(user.userId).first();

    if (!profile) {
      return c.json({ error: 'Not a seller' }, 403);
    }

    // Get product stats
    const productStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as totalProducts,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedProducts,
        SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) as pendingProducts,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draftProducts
      FROM shop_products
      WHERE sellerId = ?
    `).bind(profile.id).first();

    // Get order stats
    const orderStats = await c.env.DB.prepare(`
      SELECT
        COUNT(DISTINCT oi.orderId) as totalOrders,
        SUM(oi.quantity) as totalItemsSold,
        SUM(oi.sellerAmount) as totalRevenue,
        SUM(CASE WHEN oi.fulfillmentStatus = 'pending' THEN 1 ELSE 0 END) as pendingFulfillment
      FROM shop_order_items oi
      JOIN shop_orders o ON oi.orderId = o.id
      WHERE oi.sellerId = ? AND o.paymentStatus = 'paid'
    `).bind(profile.id).first();

    // Get recent orders
    const recentOrders = await c.env.DB.prepare(`
      SELECT
        o.id, o.orderNumber, o.total, o.status, o.createdAt,
        oi.title, oi.quantity, oi.sellerAmount, oi.fulfillmentStatus
      FROM shop_orders o
      JOIN shop_order_items oi ON o.id = oi.orderId
      WHERE oi.sellerId = ?
      ORDER BY o.createdAt DESC
      LIMIT 10
    `).bind(profile.id).all();

    // Get payout info
    const payoutInfo = await c.env.DB.prepare(`
      SELECT
        SUM(CASE WHEN status = 'completed' THEN netAmount ELSE 0 END) as totalPaidOut,
        SUM(CASE WHEN status = 'pending' THEN netAmount ELSE 0 END) as pendingPayout
      FROM shop_seller_payouts
      WHERE sellerId = ?
    `).bind(profile.id).first();

    return c.json({
      profile,
      stats: {
        products: productStats,
        orders: orderStats,
        payouts: payoutInfo,
      },
      recentOrders: recentOrders.results,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// ============================================================================
// ADMIN ROUTES - Seller Application Management
// ============================================================================

// Get all applications (admin only)
sellerRoutes.get('/admin/applications', async (c) => {
  const user = getUserFromToken(c);
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const status = c.req.query('status') || 'all';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    let whereClause = '';
    if (status !== 'all') {
      whereClause = `WHERE sa.status = '${status}'`;
    }

    const applications = await c.env.DB.prepare(`
      SELECT
        sa.*,
        u.displayName as applicantName,
        u.avatar as applicantAvatar,
        u.email as applicantEmail,
        reviewer.displayName as reviewerName
      FROM seller_applications sa
      JOIN users u ON sa.userId = u.id
      LEFT JOIN users reviewer ON sa.reviewedBy = reviewer.id
      ${whereClause}
      ORDER BY
        CASE sa.status
          WHEN 'pending' THEN 1
          WHEN 'under_review' THEN 2
          ELSE 3
        END,
        sa.submittedAt DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM seller_applications sa ${whereClause}
    `).first();

    // Get status counts
    const statusCounts = await c.env.DB.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM seller_applications
      GROUP BY status
    `).all();

    return c.json({
      applications: applications.results.map(app => ({
        ...app,
        publishedWorks: app.publishedWorks ? JSON.parse(app.publishedWorks as string) : [],
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
    console.error('Get applications error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get single application details (admin only)
sellerRoutes.get('/admin/applications/:id', async (c) => {
  const user = getUserFromToken(c);
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const applicationId = c.req.param('id');

  try {
    const application = await c.env.DB.prepare(`
      SELECT
        sa.*,
        u.id as applicantUserId,
        u.displayName as applicantName,
        u.avatar as applicantAvatar,
        u.email as applicantUserEmail,
        u.role as applicantRole,
        u.createdAt as applicantJoinDate,
        reviewer.displayName as reviewerName,
        approver.displayName as approverName
      FROM seller_applications sa
      JOIN users u ON sa.userId = u.id
      LEFT JOIN users reviewer ON sa.reviewedBy = reviewer.id
      LEFT JOIN users approver ON sa.approvedBy = approver.id
      WHERE sa.id = ?
    `).bind(applicationId).first();

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    // Get documents
    const documents = await c.env.DB.prepare(`
      SELECT * FROM seller_application_documents WHERE applicationId = ?
    `).bind(applicationId).all();

    // Get review history
    const history = await c.env.DB.prepare(`
      SELECT
        srh.*,
        u.displayName as reviewerName,
        u.avatar as reviewerAvatar
      FROM seller_review_history srh
      JOIN users u ON srh.reviewerId = u.id
      WHERE srh.applicationId = ?
      ORDER BY srh.createdAt DESC
    `).bind(applicationId).all();

    return c.json({
      application: {
        ...application,
        publishedWorks: application.publishedWorks ? JSON.parse(application.publishedWorks as string) : [],
      },
      documents: documents.results,
      history: history.results,
    });
  } catch (error) {
    console.error('Get application details error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Update application status (admin only)
sellerRoutes.patch('/admin/applications/:id/status', zValidator('json', updateApplicationStatusSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const applicationId = c.req.param('id');
  const { status, notes, rejectionReason } = c.req.valid('json');

  try {
    const application = await c.env.DB.prepare(`
      SELECT * FROM seller_applications WHERE id = ?
    `).bind(applicationId).first();

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    // Update application status
    if (status === 'approved') {
      // Create seller profile
      const profileId = crypto.randomUUID();
      const storeSlug = generateSlug(application.storeName as string);

      await c.env.DB.prepare(`
        INSERT INTO seller_profiles (
          id, userId, applicationId, storeName, storeSlug, storeDescription,
          contactEmail, contactPhone, isVerified, isGovernmentVerified,
          bankName, bankAccountNumber, bankAccountName,
          mobileMoneyProvider, mobileMoneyNumber, preferredPayoutMethod,
          status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
      `).bind(
        profileId,
        application.userId,
        applicationId,
        application.storeName,
        storeSlug,
        application.storeDescription,
        application.email,
        application.phone,
        1, // isVerified
        application.staffId ? 1 : 0, // isGovernmentVerified if has staffId
        application.bankName,
        application.bankAccountNumber,
        application.bankAccountName,
        application.mobileMoneyProvider,
        application.mobileMoneyNumber,
        application.preferredPayoutMethod
      ).run();

      // Update application
      await c.env.DB.prepare(`
        UPDATE seller_applications SET
          status = 'approved',
          reviewNotes = ?,
          approvedAt = datetime('now'),
          approvedBy = ?,
          reviewedAt = datetime('now'),
          reviewedBy = ?,
          updatedAt = datetime('now')
        WHERE id = ?
      `).bind(notes || null, user.userId, user.userId, applicationId).run();

      // Update user role to include seller capability
      await c.env.DB.prepare(`
        UPDATE users SET role = 'contributor' WHERE id = ? AND role = 'civil_servant'
      `).bind(application.userId).run();

    } else if (status === 'rejected') {
      await c.env.DB.prepare(`
        UPDATE seller_applications SET
          status = 'rejected',
          rejectionReason = ?,
          reviewNotes = ?,
          reviewedAt = datetime('now'),
          reviewedBy = ?,
          updatedAt = datetime('now')
        WHERE id = ?
      `).bind(rejectionReason || 'Application did not meet requirements', notes || null, user.userId, applicationId).run();

    } else {
      await c.env.DB.prepare(`
        UPDATE seller_applications SET
          status = ?,
          reviewNotes = ?,
          reviewedAt = datetime('now'),
          reviewedBy = ?,
          updatedAt = datetime('now')
        WHERE id = ?
      `).bind(status, notes || null, user.userId, applicationId).run();
    }

    // Log the action
    await c.env.DB.prepare(`
      INSERT INTO seller_review_history (id, applicationId, reviewerId, action, notes)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      applicationId,
      user.userId,
      status,
      notes || rejectionReason || null
    ).run();

    return c.json({
      message: `Application ${status}`,
      status,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Get all sellers (admin only)
sellerRoutes.get('/admin/sellers', async (c) => {
  const user = getUserFromToken(c);
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const status = c.req.query('status') || 'all';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    let whereClause = '';
    if (status !== 'all') {
      whereClause = `WHERE sp.status = '${status}'`;
    }

    const sellers = await c.env.DB.prepare(`
      SELECT
        sp.*,
        u.displayName as ownerName,
        u.email as ownerEmail,
        u.avatar as ownerAvatar
      FROM seller_profiles sp
      JOIN users u ON sp.userId = u.id
      ${whereClause}
      ORDER BY sp.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM seller_profiles sp ${whereClause}
    `).first();

    return c.json({
      sellers: sellers.results,
      pagination: {
        page,
        limit,
        total: (countResult as any)?.total || 0,
        totalPages: Math.ceil(((countResult as any)?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get sellers error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// Suspend/Activate seller (admin only)
sellerRoutes.patch('/admin/sellers/:id/status', async (c) => {
  const user = getUserFromToken(c);
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const sellerId = c.req.param('id');
  const body = await c.req.json();
  const { status, reason } = body;

  if (!['active', 'suspended', 'deactivated'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE seller_profiles SET
        status = ?,
        suspensionReason = ?,
        updatedAt = datetime('now')
      WHERE id = ?
    `).bind(status, reason || null, sellerId).run();

    return c.json({ message: `Seller ${status}` });
  } catch (error) {
    console.error('Update seller status error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

// ============================================================================
// PUBLIC STORE ROUTES
// ============================================================================

// Get public seller/store profile
sellerRoutes.get('/store/:slug', async (c) => {
  const slug = c.req.param('slug');

  try {
    const profile = await c.env.DB.prepare(`
      SELECT
        sp.id, sp.storeName, sp.storeSlug, sp.storeDescription,
        sp.storeLogo, sp.storeBanner, sp.isVerified, sp.verificationBadge,
        sp.rating, sp.reviewCount, sp.totalProducts, sp.totalSales,
        sp.contactEmail, sp.website, sp.linkedIn, sp.createdAt,
        u.displayName as ownerName, u.avatar as ownerAvatar
      FROM seller_profiles sp
      JOIN users u ON sp.userId = u.id
      WHERE sp.storeSlug = ? AND sp.status = 'active'
    `).bind(slug).first();

    if (!profile) {
      return c.json({ error: 'Store not found' }, 404);
    }

    // Get store products
    const products = await c.env.DB.prepare(`
      SELECT
        id, title, slug, shortDescription, price, compareAtPrice,
        coverImage, productType, rating, reviewCount, salesCount
      FROM shop_products
      WHERE sellerId = ? AND status = 'published'
      ORDER BY isFeatured DESC, salesCount DESC
      LIMIT 20
    `).bind(profile.id).all();

    return c.json({
      store: profile,
      products: products.results,
    });
  } catch (error) {
    console.error('Get store error:', error);
    return c.json({ error: 'Server Error' }, 500);
  }
});

export { sellerRoutes };
