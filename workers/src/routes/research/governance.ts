import { Hono } from 'hono';
import { sendResearchNotification } from '../../services/researchNotifications';
import { generateId, requireAuth, isProjectMember, logActivity } from './helpers';
import type { Env, Variables, AppContext } from './helpers';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================================
// Phase Approval Gate
// ============================================================================

// POST /research/projects/:id/phase-approval - Request phase approval
router.post('/projects/:id/phase-approval', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { currentPhase, requestedPhase, approverId, justification } = await c.req.json();

    if (!currentPhase || !requestedPhase || !approverId) {
      return c.json({ error: 'currentPhase, requestedPhase, and approverId are required' }, 400);
    }

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const approvalId = generateId();
    await DB.prepare(`
      INSERT INTO research_phase_approvals (id, project_id, phase, requested_by_id, approved_by_id, comments, status, requested_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(approvalId, projectId, requestedPhase || currentPhase, userId, approverId || null, justification || null).run();

    await logActivity(DB, projectId, userId, 'phase_approval_requested', `Requested phase change: ${currentPhase} -> ${requestedPhase}`);

    // Notify the approver
    try {
      const requester = await DB.prepare(`SELECT displayName FROM users WHERE id = ?`).bind(userId).first<{ displayName: string }>();
      const requesterName = requester?.displayName || 'A team member';

      const project = await DB.prepare(`SELECT title FROM research_projects WHERE id = ?`).bind(projectId).first<{ title: string }>();

      await sendResearchNotification(DB, approverId, {
        type: 'research_phase_approval_request',
        title: 'Phase approval requested',
        message: `${requesterName} requests approval to move "${project?.title || 'project'}" from ${currentPhase} to ${requestedPhase}`,
        link: `/research/projects/${projectId}?tab=governance`,
        actorId: userId,
        actorName: requesterName,
        resourceId: approvalId,
        resourceType: 'research_phase_approval',
        priority: 'high',
      });
    } catch (e) {
      console.error('Error sending phase approval notification:', e);
    }

    return c.json({ id: approvalId, message: 'Phase approval requested' }, 201);
  } catch (error) {
    console.error('Error creating phase approval:', error);
    return c.json({ error: 'Failed to create phase approval' }, 500);
  }
});

// PUT /research/projects/:id/phase-approval/:approvalId - Approve or reject phase change
router.put('/projects/:id/phase-approval/:approvalId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const approvalId = c.req.param('approvalId');
    const { status, comments } = await c.req.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return c.json({ error: 'Status must be "approved" or "rejected"' }, 400);
    }

    // Verify this user is the designated approver
    const approval = await DB.prepare(`
      SELECT * FROM research_phase_approvals WHERE id = ? AND project_id = ?
    `).bind(approvalId, projectId).first<any>();

    if (!approval) {
      return c.json({ error: 'Approval request not found' }, 404);
    }

    if (approval.approved_by_id !== userId) {
      return c.json({ error: 'Only the designated approver can approve/reject' }, 403);
    }

    if (approval.status !== 'pending') {
      return c.json({ error: 'This approval has already been processed' }, 400);
    }

    // Update approval status
    await DB.prepare(`
      UPDATE research_phase_approvals
      SET status = ?, comments = ?, resolved_at = datetime('now')
      WHERE id = ?
    `).bind(status, comments || null, approvalId).run();

    // If approved, advance the project phase
    if (status === 'approved') {
      await DB.prepare(`
        UPDATE research_projects SET phase = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(approval.phase, projectId).run();

      await logActivity(DB, projectId, userId, 'phase_advanced', `Phase advanced to: ${approval.phase}`);
    } else {
      await logActivity(DB, projectId, userId, 'phase_approval_rejected', `Phase change rejected for: ${approval.phase}`);
    }

    // Notify the requester
    try {
      const approver = await DB.prepare(`SELECT displayName FROM users WHERE id = ?`).bind(userId).first<{ displayName: string }>();
      const approverName = approver?.displayName || 'An approver';

      await sendResearchNotification(DB, approval.requested_by_id, {
        type: status === 'approved' ? 'research_phase_approved' : 'research_phase_rejected',
        title: status === 'approved' ? 'Phase change approved' : 'Phase change rejected',
        message: `${approverName} ${status} the phase change to ${approval.requested_phase}${comments ? ': ' + comments : ''}`,
        link: `/research/projects/${projectId}?tab=governance`,
        actorId: userId,
        actorName: approverName,
        resourceId: approvalId,
        resourceType: 'research_phase_approval',
        priority: 'high',
      });
    } catch (e) {
      console.error('Error sending phase decision notification:', e);
    }

    return c.json({ message: `Phase approval ${status}` });
  } catch (error) {
    console.error('Error processing phase approval:', error);
    return c.json({ error: 'Failed to process phase approval' }, 500);
  }
});

// GET /research/projects/:id/phase-approvals - List approval history
router.get('/projects/:id/phase-approvals', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    const project = await DB.prepare(`
      SELECT is_public, created_by_id FROM research_projects WHERE id = ?
    `).bind(projectId).first<{ is_public: number; created_by_id: string }>();

    if (!project) return c.json({ error: 'Project not found' }, 404);

    if (!project.is_public && userId !== 'guest') {
      const isMember = await isProjectMember(DB, projectId, userId);
      if (!isMember) return c.json({ error: 'Access denied' }, 403);
    } else if (!project.is_public && userId === 'guest') {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { results } = await DB.prepare(`
      SELECT pa.*,
        req.displayName as requesterName,
        app.displayName as approverName
      FROM research_phase_approvals pa
      LEFT JOIN users req ON pa.requested_by_id = req.id
      LEFT JOIN users app ON pa.approver_id = app.id
      WHERE pa.project_id = ?
      ORDER BY pa.created_at DESC
    `).bind(projectId).all();

    const approvals = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      requestedById: row.requested_by_id,
      requesterName: row.requesterName,
      approverId: row.approver_id,
      approverName: row.approverName,
      currentPhase: row.current_phase,
      requestedPhase: row.requested_phase,
      justification: row.justification,
      status: row.status,
      comments: row.comments,
      decidedAt: row.decided_at,
      createdAt: row.created_at,
    }));

    return c.json({ items: approvals });
  } catch (error) {
    console.error('Error getting phase approvals:', error);
    return c.json({ error: 'Failed to get phase approvals' }, 500);
  }
});

// ============================================================================
// Ethics Approval
// ============================================================================

// POST /research/projects/:id/ethics - Create ethics approval record
router.post('/projects/:id/ethics', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { boardName, approvalBody, status, referenceNumber, approvalDate, expiryDate, conditions, submittedDate } = await c.req.json();

    if (!boardName && !approvalBody) {
      return c.json({ error: 'approvalBody is required' }, 400);
    }

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const ethicsId = generateId();
    await DB.prepare(`
      INSERT INTO research_ethics_approvals (id, project_id, approval_body, status, reference_number, approval_date, expiry_date, conditions, submitted_date, created_by_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      ethicsId,
      projectId,
      boardName || approvalBody,
      status || 'pending',
      referenceNumber || null,
      approvalDate || null,
      expiryDate || null,
      conditions || null,
      submittedDate || null,
      userId
    ).run();

    await logActivity(DB, projectId, userId, 'ethics_submitted', `Ethics submission to ${boardName}`);

    return c.json({ id: ethicsId, message: 'Ethics approval record created' }, 201);
  } catch (error) {
    console.error('Error creating ethics record:', error);
    return c.json({ error: 'Failed to create ethics record' }, 500);
  }
});

// GET /research/projects/:id/ethics - List ethics approvals
router.get('/projects/:id/ethics', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    const project = await DB.prepare(`
      SELECT is_public, created_by_id FROM research_projects WHERE id = ?
    `).bind(projectId).first<{ is_public: number; created_by_id: string }>();

    if (!project) return c.json({ error: 'Project not found' }, 404);

    if (!project.is_public && userId !== 'guest') {
      const isMember = await isProjectMember(DB, projectId, userId);
      if (!isMember) return c.json({ error: 'Access denied' }, 403);
    } else if (!project.is_public && userId === 'guest') {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { results } = await DB.prepare(`
      SELECT ea.*, u.displayName as submittedByName
      FROM research_ethics_approvals ea
      LEFT JOIN users u ON ea.created_by_id = u.id
      WHERE ea.project_id = ?
      ORDER BY ea.created_at DESC
    `).bind(projectId).all();

    const items = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      boardName: row.approval_body,
      approvalBody: row.approval_body,
      status: row.status,
      referenceNumber: row.reference_number,
      approvalDate: row.approval_date,
      expiryDate: row.expiry_date,
      conditions: row.conditions,
      submittedDate: row.submitted_date,
      submittedBy: row.submittedByName,
      submittedById: row.created_by_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return c.json({ items });
  } catch (error) {
    console.error('Error getting ethics approvals:', error);
    return c.json({ error: 'Failed to get ethics approvals' }, 500);
  }
});

// PUT /research/projects/:id/ethics/:ethicsId - Update ethics approval status
router.put('/projects/:id/ethics/:ethicsId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const ethicsId = c.req.param('ethicsId');
    const updates = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Allowed fields only
    const allowedFields: Record<string, string> = {
      status: 'status',
      referenceNumber: 'reference_number',
      approvalDate: 'approval_date',
      expiryDate: 'expiry_date',
      conditions: 'conditions',
      submittedDate: 'submitted_date',
    };

    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, column] of Object.entries(allowedFields)) {
      if (updates[key] !== undefined) {
        fields.push(`${column} = ?`);
        values.push(updates[key]);
      }
    }

    if (fields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    fields.push('updated_at = datetime("now")');
    values.push(ethicsId, projectId);

    await DB.prepare(`
      UPDATE research_ethics_approvals SET ${fields.join(', ')} WHERE id = ? AND project_id = ?
    `).bind(...values).run();

    await logActivity(DB, projectId, userId, 'ethics_updated', `Updated ethics approval: ${ethicsId}`);

    return c.json({ message: 'Ethics approval updated' });
  } catch (error) {
    console.error('Error updating ethics record:', error);
    return c.json({ error: 'Failed to update ethics record' }, 500);
  }
});

// ============================================================================
// Audit Trail Export
// ============================================================================

// GET /research/projects/:id/audit-trail/export - Export activity log as CSV
router.get('/projects/:id/audit-trail/export', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const { results } = await DB.prepare(`
      SELECT a.created_at, u.displayName, u.staffId, a.action, a.details
      FROM research_activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.project_id = ?
      ORDER BY a.created_at DESC
    `).bind(projectId).all();

    // Build CSV
    const csvRows = ['Timestamp,User,Staff ID,Action,Details'];
    for (const row of results) {
      const r = row as any;
      const escapeCsv = (val: string | null) => {
        if (!val) return '';
        // Escape double quotes and wrap in quotes if contains comma, newline, or quote
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      };
      csvRows.push([
        escapeCsv(r.created_at),
        escapeCsv(r.displayName),
        escapeCsv(r.staffId),
        escapeCsv(r.action),
        escapeCsv(r.details),
      ].join(','));
    }

    const csv = csvRows.join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-trail-${projectId}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit trail:', error);
    return c.json({ error: 'Failed to export audit trail' }, 500);
  }
});

// GET /research/projects/:id/contributions - Get contribution summary per user
router.get('/projects/:id/contributions', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    // Aggregate contributions per user
    const { results } = await DB.prepare(`
      SELECT
        rc.user_id,
        u.displayName,
        u.avatar,
        COUNT(*) as total_contributions,
        SUM(rc.points_earned) as total_points,
        GROUP_CONCAT(DISTINCT rc.contribution_type) as contribution_types,
        MAX(rc.created_at) as last_contribution_at
      FROM research_contributions rc
      LEFT JOIN users u ON rc.user_id = u.id
      WHERE rc.project_id = ?
      GROUP BY rc.user_id
      ORDER BY total_points DESC
    `).bind(projectId).all();

    // Also get per-type breakdown
    const { results: breakdown } = await DB.prepare(`
      SELECT
        rc.user_id,
        rc.contribution_type,
        COUNT(*) as count,
        SUM(rc.points_earned) as points
      FROM research_contributions rc
      WHERE rc.project_id = ?
      GROUP BY rc.user_id, rc.contribution_type
    `).bind(projectId).all();

    const breakdownMap: Record<string, any[]> = {};
    breakdown.forEach((row: any) => {
      if (!breakdownMap[row.user_id]) breakdownMap[row.user_id] = [];
      breakdownMap[row.user_id].push({
        type: row.contribution_type,
        count: row.count,
        points: row.points,
      });
    });

    const contributors = results.map((row: any) => ({
      userId: row.user_id,
      displayName: row.displayName,
      avatar: row.avatar,
      totalContributions: row.total_contributions,
      totalPoints: row.total_points,
      contributionTypes: (row.contribution_types || '').split(',').filter(Boolean),
      lastContributionAt: row.last_contribution_at,
      breakdown: breakdownMap[row.user_id] || [],
    }));

    return c.json({ items: contributors });
  } catch (error) {
    console.error('Error getting contributions:', error);
    return c.json({ error: 'Failed to get contributions' }, 500);
  }
});

export default router;
