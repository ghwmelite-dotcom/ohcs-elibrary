import { Hono } from 'hono';
import type { Context, Next } from 'hono';

interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
  JWT_SECRET: string;
}

interface Variables {
  userId?: string;
  userRole?: string;
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// Helper to generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Optional auth middleware
async function optionalAuth(c: AppContext, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { verify } = await import('hono/jwt');
      const token = authHeader.substring(7);
      const payload = await verify(token, c.env.JWT_SECRET);

      if (payload?.sub) {
        c.set('userId', payload.sub as string);
        c.set('userRole', (payload.role as string) || 'user');
      }
    } catch {
      // Token invalid, continue as unauthenticated
    }
  }

  if (!c.get('userId')) {
    c.set('userId', 'guest');
    c.set('userRole', 'guest');
  }

  await next();
}

// Require auth middleware
async function requireAuth(c: AppContext, next: Next) {
  const userId = c.get('userId');
  if (!userId || userId === 'guest') {
    return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
  }
  await next();
}

// Check if user is project member
async function isProjectMember(db: D1Database, projectId: string, userId: string): Promise<boolean> {
  const member = await db.prepare(`
    SELECT 1 FROM research_team_members WHERE project_id = ? AND user_id = ?
    UNION
    SELECT 1 FROM research_projects WHERE id = ? AND (created_by_id = ? OR team_lead_id = ?)
  `).bind(projectId, userId, projectId, userId, userId).first();
  return !!member;
}

// Log research activity
async function logActivity(
  db: D1Database,
  projectId: string,
  userId: string,
  action: string,
  details?: string,
  metadata?: Record<string, unknown>
) {
  await db.prepare(`
    INSERT INTO research_activities (id, project_id, user_id, action, details, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    generateId(),
    projectId,
    userId,
    action,
    details || null,
    metadata ? JSON.stringify(metadata) : null
  ).run();
}

export const researchRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply optional auth to all routes
researchRoutes.use('*', optionalAuth);

// ============================================================================
// Research Projects
// ============================================================================

// GET /research/projects - List research projects
researchRoutes.get('/projects', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const isGuest = userId === 'guest';

    const url = new URL(c.req.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const myProjects = url.searchParams.get('myProjects') === 'true';
    const sortBy = url.searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Guests only see public projects
    if (isGuest) {
      whereClause += ' AND p.is_public = 1';
    } else if (myProjects) {
      whereClause += ` AND (p.created_by_id = ? OR p.team_lead_id = ? OR EXISTS (
        SELECT 1 FROM research_team_members tm WHERE tm.project_id = p.id AND tm.user_id = ?
      ))`;
      params.push(userId, userId, userId);
    } else {
      // Show public + projects user is member of
      whereClause += ` AND (p.is_public = 1 OR p.created_by_id = ? OR p.team_lead_id = ? OR EXISTS (
        SELECT 1 FROM research_team_members tm WHERE tm.project_id = p.id AND tm.user_id = ?
      ))`;
      params.push(userId, userId, userId);
    }

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    if (category) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.research_question LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Count query
    const countResult = await DB.prepare(`
      SELECT COUNT(*) as total FROM research_projects p ${whereClause}
    `).bind(...params).first<{ total: number }>();

    // Validate sort fields
    const validSortFields = ['title', 'createdAt', 'updatedAt', 'progress', 'status'];
    const sortFieldMap: Record<string, string> = {
      title: 'p.title',
      createdAt: 'p.created_at',
      updatedAt: 'p.updated_at',
      progress: 'p.progress',
      status: 'p.status'
    };
    const sortField = sortFieldMap[sortBy] || 'p.updated_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Main query
    const { results } = await DB.prepare(`
      SELECT
        p.*,
        u.displayName as createdByName,
        u.avatar as createdByAvatar,
        tl.displayName as teamLeadName,
        tl.avatar as teamLeadAvatar,
        (SELECT COUNT(*) FROM research_team_members tm WHERE tm.project_id = p.id) as team_member_count,
        (SELECT COUNT(*) FROM research_literature rl WHERE rl.project_id = p.id) as literature_count,
        (SELECT COUNT(*) FROM research_insights ri WHERE ri.project_id = p.id) as insight_count,
        (SELECT COUNT(*) FROM research_briefs rb WHERE rb.project_id = p.id) as brief_count
      FROM research_projects p
      LEFT JOIN users u ON p.created_by_id = u.id
      LEFT JOIN users tl ON p.team_lead_id = tl.id
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    const projects = results.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      researchQuestion: row.research_question,
      hypothesis: row.hypothesis,
      objectives: row.objectives ? JSON.parse(row.objectives) : [],
      methodology: row.methodology,
      category: row.category,
      status: row.status,
      phase: row.phase,
      tags: row.tags ? JSON.parse(row.tags) : [],
      progress: row.progress,
      startDate: row.start_date,
      targetEndDate: row.target_end_date,
      completedAt: row.completed_at,
      isPublic: !!row.is_public,
      mdaId: row.mda_id,
      createdById: row.created_by_id,
      createdBy: {
        id: row.created_by_id,
        displayName: row.createdByName,
        avatar: row.createdByAvatar
      },
      teamLeadId: row.team_lead_id,
      teamLead: {
        id: row.team_lead_id,
        displayName: row.teamLeadName,
        avatar: row.teamLeadAvatar
      },
      teamMemberCount: row.team_member_count,
      literatureCount: row.literature_count,
      insightCount: row.insight_count,
      briefCount: row.brief_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({
      items: projects,
      total: countResult?.total || 0,
      page,
      limit,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
      hasNext: page * limit < (countResult?.total || 0),
      hasPrevious: page > 1
    });
  } catch (error) {
    console.error('Error listing projects:', error);
    return c.json({ error: 'Failed to list projects' }, 500);
  }
});

// GET /research/projects/:id - Get single project
researchRoutes.get('/projects/:id', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    const project = await DB.prepare(`
      SELECT
        p.*,
        u.displayName as createdByName,
        u.avatar as createdByAvatar,
        u.email as createdByEmail,
        tl.displayName as teamLeadName,
        tl.avatar as teamLeadAvatar,
        tl.email as teamLeadEmail,
        m.name as mdaName
      FROM research_projects p
      LEFT JOIN users u ON p.created_by_id = u.id
      LEFT JOIN users tl ON p.team_lead_id = tl.id
      LEFT JOIN mdas m ON p.mda_id = m.id
      WHERE p.id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check access
    const isPublic = !!(project as any).is_public;
    const isMember = await isProjectMember(DB, projectId, userId);

    if (!isPublic && !isMember && userId !== 'guest') {
      return c.json({ error: 'Access denied' }, 403);
    }

    if (!isPublic && userId === 'guest') {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Get team members
    const { results: teamMembers } = await DB.prepare(`
      SELECT
        tm.*,
        u.displayName,
        u.avatar,
        u.email,
        u.department,
        u.jobTitle as title
      FROM research_team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.project_id = ?
      ORDER BY tm.joined_at ASC
    `).bind(projectId).all();

    const row = project as any;

    return c.json({
      id: row.id,
      title: row.title,
      description: row.description,
      researchQuestion: row.research_question,
      hypothesis: row.hypothesis,
      objectives: row.objectives ? JSON.parse(row.objectives) : [],
      methodology: row.methodology,
      category: row.category,
      status: row.status,
      phase: row.phase,
      tags: row.tags ? JSON.parse(row.tags) : [],
      progress: row.progress,
      startDate: row.start_date,
      targetEndDate: row.target_end_date,
      completedAt: row.completed_at,
      isPublic: !!row.is_public,
      mdaId: row.mda_id,
      mda: row.mdaName ? { id: row.mda_id, name: row.mdaName } : null,
      createdById: row.created_by_id,
      createdBy: {
        id: row.created_by_id,
        displayName: row.createdByName,
        avatar: row.createdByAvatar,
        email: row.createdByEmail
      },
      teamLeadId: row.team_lead_id,
      teamLead: {
        id: row.team_lead_id,
        displayName: row.teamLeadName,
        avatar: row.teamLeadAvatar,
        email: row.teamLeadEmail
      },
      teamMembers: teamMembers.map((m: any) => ({
        id: m.id,
        projectId: m.project_id,
        userId: m.user_id,
        role: m.role,
        permissions: m.permissions ? JSON.parse(m.permissions) : [],
        contribution: m.contribution,
        joinedAt: m.joined_at,
        user: {
          id: m.user_id,
          displayName: m.displayName,
          avatar: m.avatar,
          email: m.email,
          department: m.department,
          title: m.title
        }
      })),
      teamMemberCount: teamMembers.length,
      isMember,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Error getting project:', error);
    return c.json({ error: 'Failed to get project' }, 500);
  }
});

// POST /research/projects - Create project
researchRoutes.post('/projects', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const body = await c.req.json();

    const {
      title,
      description,
      researchQuestion,
      hypothesis,
      objectives = [],
      methodology = 'qualitative',
      category = 'other',
      tags = [],
      startDate,
      targetEndDate,
      isPublic = false,
      mdaId,
      templateId
    } = body;

    if (!title || !researchQuestion) {
      return c.json({ error: 'Title and research question are required' }, 400);
    }

    const projectId = generateId();

    // If using a template, increment usage count
    if (templateId) {
      await DB.prepare(`
        UPDATE research_templates SET usage_count = usage_count + 1 WHERE id = ?
      `).bind(templateId).run();
    }

    await DB.prepare(`
      INSERT INTO research_projects (
        id, title, description, research_question, hypothesis, objectives,
        methodology, category, tags, status, phase, progress,
        start_date, target_end_date, is_public, mda_id,
        created_by_id, team_lead_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'ideation', 0, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      projectId,
      title,
      description || null,
      researchQuestion,
      hypothesis || null,
      JSON.stringify(objectives),
      methodology,
      category,
      JSON.stringify(tags),
      startDate || null,
      targetEndDate || null,
      isPublic ? 1 : 0,
      mdaId || null,
      userId,
      userId // Creator is initially team lead
    ).run();

    // Log activity
    await logActivity(DB, projectId, userId, 'project_created', `Created project: ${title}`);

    return c.json({
      id: projectId,
      message: 'Project created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// PUT /research/projects/:id - Update project
researchRoutes.put('/projects/:id', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');

    // Check permission
    const project = await DB.prepare(`
      SELECT * FROM research_projects WHERE id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const row = project as any;
    const isLead = row.created_by_id === userId || row.team_lead_id === userId;

    if (!isLead) {
      // Check if user is team member with edit permission
      const member = await DB.prepare(`
        SELECT permissions FROM research_team_members WHERE project_id = ? AND user_id = ?
      `).bind(projectId, userId).first<{ permissions: string }>();

      if (!member) {
        return c.json({ error: 'Access denied' }, 403);
      }

      const perms = member.permissions ? JSON.parse(member.permissions) : [];
      if (!perms.includes('edit')) {
        return c.json({ error: 'No edit permission' }, 403);
      }
    }

    const body = await c.req.json();
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields: Record<string, string> = {
      title: 'title',
      description: 'description',
      researchQuestion: 'research_question',
      hypothesis: 'hypothesis',
      objectives: 'objectives',
      methodology: 'methodology',
      category: 'category',
      status: 'status',
      phase: 'phase',
      tags: 'tags',
      progress: 'progress',
      startDate: 'start_date',
      targetEndDate: 'target_end_date',
      isPublic: 'is_public',
      mdaId: 'mda_id',
      teamLeadId: 'team_lead_id'
    };

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (body[key] !== undefined) {
        updates.push(`${dbField} = ?`);
        if (key === 'objectives' || key === 'tags') {
          values.push(JSON.stringify(body[key]));
        } else if (key === 'isPublic') {
          values.push(body[key] ? 1 : 0);
        } else {
          values.push(body[key]);
        }
      }
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = datetime("now")');
    values.push(projectId);

    await DB.prepare(`
      UPDATE research_projects SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    // Log activity
    await logActivity(DB, projectId, userId, 'project_updated', 'Updated project details');

    return c.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// DELETE /research/projects/:id - Delete project
researchRoutes.delete('/projects/:id', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');

    // Only creator can delete
    const project = await DB.prepare(`
      SELECT created_by_id FROM research_projects WHERE id = ?
    `).bind(projectId).first<{ created_by_id: string }>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.created_by_id !== userId) {
      return c.json({ error: 'Only the creator can delete this project' }, 403);
    }

    // Delete (cascade will handle related records)
    await DB.prepare('DELETE FROM research_projects WHERE id = ?').bind(projectId).run();

    return c.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

// ============================================================================
// Team Members
// ============================================================================

// POST /research/projects/:id/members - Add team member
researchRoutes.post('/projects/:id/members', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { memberId, role = 'researcher', permissions = ['view', 'edit'] } = await c.req.json();

    if (!memberId) {
      return c.json({ error: 'Member ID is required' }, 400);
    }

    // Check if requester is lead
    const project = await DB.prepare(`
      SELECT created_by_id, team_lead_id FROM research_projects WHERE id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const row = project as any;
    if (row.created_by_id !== userId && row.team_lead_id !== userId) {
      return c.json({ error: 'Only project leads can add members' }, 403);
    }

    // Check if user exists
    const user = await DB.prepare('SELECT id FROM users WHERE id = ?').bind(memberId).first();
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if already a member
    const existing = await DB.prepare(`
      SELECT id FROM research_team_members WHERE project_id = ? AND user_id = ?
    `).bind(projectId, memberId).first();

    if (existing) {
      return c.json({ error: 'User is already a team member' }, 400);
    }

    const membershipsId = generateId();

    await DB.prepare(`
      INSERT INTO research_team_members (id, project_id, user_id, role, permissions, joined_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(membershipsId, projectId, memberId, role, JSON.stringify(permissions)).run();

    await logActivity(DB, projectId, userId, 'member_added', `Added member: ${memberId}`, { memberId, role });

    return c.json({ id: membershipsId, message: 'Member added successfully' }, 201);
  } catch (error) {
    console.error('Error adding member:', error);
    return c.json({ error: 'Failed to add member' }, 500);
  }
});

// DELETE /research/projects/:id/members/:memberId - Remove team member
researchRoutes.delete('/projects/:id/members/:memberId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const memberId = c.req.param('memberId');

    // Check if requester is lead or the member themselves
    const project = await DB.prepare(`
      SELECT created_by_id, team_lead_id FROM research_projects WHERE id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const row = project as any;
    const isLead = row.created_by_id === userId || row.team_lead_id === userId;
    const isSelf = memberId === userId;

    if (!isLead && !isSelf) {
      return c.json({ error: 'Not authorized to remove this member' }, 403);
    }

    await DB.prepare(`
      DELETE FROM research_team_members WHERE project_id = ? AND user_id = ?
    `).bind(projectId, memberId).run();

    await logActivity(DB, projectId, userId, 'member_removed', `Removed member: ${memberId}`, { memberId });

    return c.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// ============================================================================
// Literature
// ============================================================================

// GET /research/projects/:id/literature - List project literature
researchRoutes.get('/projects/:id/literature', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    // Check access
    const project = await DB.prepare(`
      SELECT is_public FROM research_projects WHERE id = ?
    `).bind(projectId).first<{ is_public: number }>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (!project.is_public && userId === 'guest') {
      return c.json({ error: 'Authentication required' }, 401);
    }

    if (!project.is_public) {
      const isMember = await isProjectMember(DB, projectId, userId);
      if (!isMember) {
        return c.json({ error: 'Access denied' }, 403);
      }
    }

    const { results } = await DB.prepare(`
      SELECT
        rl.*,
        d.title as documentTitle,
        d.description as documentDescription,
        d.category as documentCategory,
        d.fileUrl,
        d.fileType,
        u.displayName as addedByName,
        u.avatar as addedByAvatar
      FROM research_literature rl
      LEFT JOIN documents d ON rl.document_id = d.id
      LEFT JOIN users u ON rl.added_by_id = u.id
      WHERE rl.project_id = ?
      ORDER BY rl.added_at DESC
    `).bind(projectId).all();

    const literature = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      documentId: row.document_id,
      document: row.document_id ? {
        id: row.document_id,
        title: row.documentTitle,
        description: row.documentDescription,
        category: row.documentCategory,
        fileUrl: row.fileUrl,
        fileType: row.fileType
      } : null,
      externalTitle: row.external_title,
      externalUrl: row.external_url,
      externalAuthors: row.external_authors,
      externalYear: row.external_year,
      externalSource: row.external_source,
      citationKey: row.citation_key,
      relevanceScore: row.relevance_score,
      notes: row.notes,
      tags: row.tags ? JSON.parse(row.tags) : [],
      addedById: row.added_by_id,
      addedBy: {
        id: row.added_by_id,
        displayName: row.addedByName,
        avatar: row.addedByAvatar
      },
      addedAt: row.added_at,
      lastAccessedAt: row.last_accessed_at
    }));

    return c.json({ items: literature, total: literature.length });
  } catch (error) {
    console.error('Error listing literature:', error);
    return c.json({ error: 'Failed to list literature' }, 500);
  }
});

// POST /research/projects/:id/literature - Add literature
researchRoutes.post('/projects/:id/literature', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');

    // Check membership
    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const body = await c.req.json();
    const {
      documentId,
      externalTitle,
      externalUrl,
      externalAuthors,
      externalYear,
      externalSource,
      citationKey,
      notes,
      tags = []
    } = body;

    if (!documentId && !externalTitle) {
      return c.json({ error: 'Document ID or external title is required' }, 400);
    }

    // Generate citation key if not provided
    const finalCitationKey = citationKey || `ref-${Date.now()}`;

    const literatureId = generateId();

    await DB.prepare(`
      INSERT INTO research_literature (
        id, project_id, document_id, external_title, external_url,
        external_authors, external_year, external_source, citation_key,
        notes, tags, added_by_id, added_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      literatureId,
      projectId,
      documentId || null,
      externalTitle || null,
      externalUrl || null,
      externalAuthors || null,
      externalYear || null,
      externalSource || null,
      finalCitationKey,
      notes || null,
      JSON.stringify(tags),
      userId
    ).run();

    await logActivity(DB, projectId, userId, 'literature_added', `Added literature: ${documentId || externalTitle}`);

    return c.json({ id: literatureId, message: 'Literature added successfully' }, 201);
  } catch (error) {
    console.error('Error adding literature:', error);
    return c.json({ error: 'Failed to add literature' }, 500);
  }
});

// DELETE /research/projects/:id/literature/:litId - Remove literature
researchRoutes.delete('/projects/:id/literature/:litId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const litId = c.req.param('litId');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await DB.prepare(`
      DELETE FROM research_literature WHERE id = ? AND project_id = ?
    `).bind(litId, projectId).run();

    await logActivity(DB, projectId, userId, 'literature_removed', `Removed literature: ${litId}`);

    return c.json({ message: 'Literature removed successfully' });
  } catch (error) {
    console.error('Error removing literature:', error);
    return c.json({ error: 'Failed to remove literature' }, 500);
  }
});

// ============================================================================
// Comments
// ============================================================================

// GET /research/projects/:id/comments - List project comments
researchRoutes.get('/projects/:id/comments', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    // Check access
    const project = await DB.prepare(`
      SELECT is_public FROM research_projects WHERE id = ?
    `).bind(projectId).first<{ is_public: number }>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (!project.is_public && userId === 'guest') {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { results } = await DB.prepare(`
      SELECT
        c.*,
        u.displayName,
        u.avatar
      FROM research_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.project_id = ? AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
    `).bind(projectId).all();

    // Get replies for each comment
    const comments = await Promise.all(results.map(async (row: any) => {
      const { results: replies } = await DB.prepare(`
        SELECT c.*, u.displayName, u.avatar
        FROM research_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.parent_id = ?
        ORDER BY c.created_at ASC
      `).bind(row.id).all();

      return {
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        user: {
          id: row.user_id,
          displayName: row.displayName,
          avatar: row.avatar
        },
        content: row.content,
        parentId: row.parent_id,
        replies: replies.map((r: any) => ({
          id: r.id,
          projectId: r.project_id,
          userId: r.user_id,
          user: {
            id: r.user_id,
            displayName: r.displayName,
            avatar: r.avatar
          },
          content: r.content,
          parentId: r.parent_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        })),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }));

    return c.json({ items: comments, total: comments.length });
  } catch (error) {
    console.error('Error listing comments:', error);
    return c.json({ error: 'Failed to list comments' }, 500);
  }
});

// POST /research/projects/:id/comments - Add comment
researchRoutes.post('/projects/:id/comments', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { content, parentId } = await c.req.json();

    if (!content?.trim()) {
      return c.json({ error: 'Content is required' }, 400);
    }

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const commentId = generateId();

    await DB.prepare(`
      INSERT INTO research_comments (id, project_id, user_id, content, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(commentId, projectId, userId, content.trim(), parentId || null).run();

    await logActivity(DB, projectId, userId, 'comment_added', 'Added a comment');

    return c.json({ id: commentId, message: 'Comment added successfully' }, 201);
  } catch (error) {
    console.error('Error adding comment:', error);
    return c.json({ error: 'Failed to add comment' }, 500);
  }
});

// ============================================================================
// Templates
// ============================================================================

// GET /research/templates - List research templates
researchRoutes.get('/templates', async (c: AppContext) => {
  try {
    const { DB } = c.env;

    const { results } = await DB.prepare(`
      SELECT * FROM research_templates
      ORDER BY is_official DESC, usage_count DESC, name ASC
    `).all();

    const templates = results.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      methodology: row.methodology,
      defaultObjectives: row.default_objectives ? JSON.parse(row.default_objectives) : [],
      suggestedPhases: row.suggested_phases ? JSON.parse(row.suggested_phases) : [],
      guidelineUrl: row.guideline_url,
      isOfficial: !!row.is_official,
      usageCount: row.usage_count,
      createdAt: row.created_at
    }));

    return c.json({ items: templates, total: templates.length });
  } catch (error) {
    console.error('Error listing templates:', error);
    return c.json({ error: 'Failed to list templates' }, 500);
  }
});

// ============================================================================
// Activity & Dashboard
// ============================================================================

// GET /research/projects/:id/activity - Get project activity
researchRoutes.get('/projects/:id/activity', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');
    const limit = parseInt(new URL(c.req.url).searchParams.get('limit') || '20');

    // Check access
    const project = await DB.prepare(`
      SELECT is_public FROM research_projects WHERE id = ?
    `).bind(projectId).first<{ is_public: number }>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (!project.is_public && userId === 'guest') {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { results } = await DB.prepare(`
      SELECT
        a.*,
        u.displayName,
        u.avatar
      FROM research_activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.project_id = ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `).bind(projectId, limit).all();

    const activities = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      userId: row.user_id,
      user: {
        id: row.user_id,
        displayName: row.displayName,
        avatar: row.avatar
      },
      action: row.action,
      details: row.details,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at
    }));

    return c.json({ items: activities });
  } catch (error) {
    console.error('Error listing activity:', error);
    return c.json({ error: 'Failed to list activity' }, 500);
  }
});

// GET /research/dashboard - Get user's research dashboard data
researchRoutes.get('/dashboard', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;

    // My projects stats
    const myStats = await DB.prepare(`
      SELECT
        COUNT(CASE WHEN status IN ('planning', 'active') THEN 1 END) as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(*) as total
      FROM research_projects
      WHERE created_by_id = ? OR team_lead_id = ? OR EXISTS (
        SELECT 1 FROM research_team_members WHERE project_id = research_projects.id AND user_id = ?
      )
    `).bind(userId, userId, userId).first();

    // Recent projects
    const { results: recentProjects } = await DB.prepare(`
      SELECT
        p.*,
        u.displayName as teamLeadName,
        u.avatar as teamLeadAvatar
      FROM research_projects p
      LEFT JOIN users u ON p.team_lead_id = u.id
      WHERE p.created_by_id = ? OR p.team_lead_id = ? OR EXISTS (
        SELECT 1 FROM research_team_members tm WHERE tm.project_id = p.id AND tm.user_id = ?
      )
      ORDER BY p.updated_at DESC
      LIMIT 5
    `).bind(userId, userId, userId).all();

    // Recent activity across user's projects
    const { results: recentActivity } = await DB.prepare(`
      SELECT
        a.*,
        u.displayName,
        u.avatar,
        p.title as projectTitle
      FROM research_activities a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN research_projects p ON a.project_id = p.id
      WHERE a.project_id IN (
        SELECT id FROM research_projects
        WHERE created_by_id = ? OR team_lead_id = ? OR EXISTS (
          SELECT 1 FROM research_team_members WHERE project_id = research_projects.id AND user_id = ?
        )
      )
      ORDER BY a.created_at DESC
      LIMIT 10
    `).bind(userId, userId, userId).all();

    // Trending topics (based on tags)
    const { results: trending } = await DB.prepare(`
      SELECT tags FROM research_projects
      WHERE status IN ('planning', 'active')
      AND created_at > datetime('now', '-30 days')
    `).all();

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    trending.forEach((row: any) => {
      const tags = row.tags ? JSON.parse(row.tags) : [];
      tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const trendingTopics = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    return c.json({
      stats: {
        myActiveProjects: (myStats as any)?.active || 0,
        myCompletedProjects: (myStats as any)?.completed || 0,
        totalProjects: (myStats as any)?.total || 0
      },
      myProjects: recentProjects.map((row: any) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        phase: row.phase,
        progress: row.progress,
        category: row.category,
        teamLead: {
          id: row.team_lead_id,
          displayName: row.teamLeadName,
          avatar: row.teamLeadAvatar
        },
        updatedAt: row.updated_at
      })),
      recentActivity: recentActivity.map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        projectTitle: row.projectTitle,
        action: row.action,
        details: row.details,
        user: {
          id: row.user_id,
          displayName: row.displayName,
          avatar: row.avatar
        },
        createdAt: row.created_at
      })),
      trendingTopics
    });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    return c.json({ error: 'Failed to get dashboard data' }, 500);
  }
});

// ============================================================================
// AI Features - Kofi Research Assistant
// ============================================================================

// System prompt for Kofi
const KOFI_SYSTEM_PROMPT = `You are Kofi, an AI Research Assistant for Ghana's Office of the Head of Civil Service (OHCS). You help civil servants conduct high-quality research on public policy, governance, and service delivery.

Your personality:
- Knowledgeable about Ghanaian public administration and governance
- Professional yet approachable
- Focused on evidence-based research
- Aware of civil service context and constraints

You can help with:
- Research methodology guidance
- Literature review strategies
- Data analysis approaches
- Policy brief writing
- Citation and referencing
- Research ethics
- Statistical analysis advice

Always provide actionable, practical advice tailored to the civil service context. When uncertain, recommend consulting subject matter experts or official OHCS guidelines.`;

// POST /research/kofi/chat - Chat with Kofi AI Research Assistant
researchRoutes.post('/kofi/chat', requireAuth, async (c: AppContext) => {
  try {
    const { AI } = c.env;
    const userId = c.get('userId')!;
    const { message, projectContext, conversationHistory = [] } = await c.req.json();

    if (!message?.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Build conversation context
    let contextPrompt = KOFI_SYSTEM_PROMPT;

    if (projectContext) {
      contextPrompt += `\n\nCurrent Research Project Context:
Title: ${projectContext.title}
Research Question: ${projectContext.researchQuestion}
Methodology: ${projectContext.methodology}
Category: ${projectContext.category}
Phase: ${projectContext.phase}
${projectContext.objectives?.length ? `Objectives:\n${projectContext.objectives.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}` : ''}`;
    }

    // Build conversation with history
    let conversationPrompt = contextPrompt + '\n\n';

    // Add recent conversation history (last 5 exchanges)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach((msg: { role: string; content: string }) => {
      if (msg.role === 'user') {
        conversationPrompt += `User: ${msg.content}\n`;
      } else {
        conversationPrompt += `Kofi: ${msg.content}\n`;
      }
    });

    conversationPrompt += `User: ${message}\n\nKofi:`;

    const response = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: conversationPrompt,
      max_tokens: 600,
      temperature: 0.7,
    });

    const reply = response.response?.trim() || 'I apologize, I encountered an issue. Please try rephrasing your question.';

    return c.json({
      reply,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in Kofi chat:', error);
    return c.json({ error: 'Failed to process chat message' }, 500);
  }
});

// POST /research/projects/:id/generate-insights - Generate AI insights for project
researchRoutes.post('/projects/:id/generate-insights', requireAuth, async (c: AppContext) => {
  try {
    const { DB, AI } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');

    // Check membership
    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get project details
    const project = await DB.prepare(`
      SELECT * FROM research_projects WHERE id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const row = project as any;

    // Get literature for context
    const { results: literature } = await DB.prepare(`
      SELECT external_title, external_authors, notes FROM research_literature
      WHERE project_id = ? LIMIT 10
    `).bind(projectId).all();

    const litContext = literature.map((l: any) =>
      `- ${l.external_title || 'Untitled'} by ${l.external_authors || 'Unknown'}: ${l.notes || 'No notes'}`
    ).join('\n');

    const prompt = `You are a research analysis AI for Ghana's civil service. Analyze this research project and generate 3-5 actionable insights.

Research Project:
Title: ${row.title}
Research Question: ${row.research_question}
Hypothesis: ${row.hypothesis || 'Not specified'}
Methodology: ${row.methodology}
Category: ${row.category}
Current Phase: ${row.phase}
Objectives: ${row.objectives ? JSON.parse(row.objectives).join('; ') : 'Not specified'}

Literature/Sources:
${litContext || 'No literature added yet'}

Generate insights in this exact JSON format:
[
  {"type": "methodology", "title": "short title", "content": "detailed insight", "priority": "high/medium/low"},
  {"type": "finding", "title": "short title", "content": "detailed insight", "priority": "high/medium/low"},
  {"type": "recommendation", "title": "short title", "content": "detailed insight", "priority": "high/medium/low"}
]

Types can be: methodology, finding, gap, recommendation, risk, opportunity
Priorities: high, medium, low

JSON Output:`;

    const response = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 800,
      temperature: 0.4,
    });

    let insights = [];
    try {
      // Try to parse JSON from response
      const responseText = response.response || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse insights JSON:', e);
      // Create a single insight from the response
      insights = [{
        type: 'recommendation',
        title: 'AI Analysis',
        content: response.response || 'Unable to generate insights',
        priority: 'medium'
      }];
    }

    // Save insights to database
    const savedInsights = [];
    for (const insight of insights) {
      const insightId = generateId();
      await DB.prepare(`
        INSERT INTO research_insights (
          id, project_id, type, title, content, source, confidence, priority, is_ai_generated, created_at
        ) VALUES (?, ?, ?, ?, ?, 'ai_analysis', 0.8, ?, 1, datetime('now'))
      `).bind(
        insightId,
        projectId,
        insight.type || 'recommendation',
        insight.title || 'Insight',
        insight.content || '',
        insight.priority || 'medium'
      ).run();

      savedInsights.push({
        id: insightId,
        ...insight,
        isAiGenerated: true
      });
    }

    await logActivity(DB, projectId, userId, 'insights_generated', `Generated ${savedInsights.length} AI insights`);

    return c.json({
      insights: savedInsights,
      message: `Generated ${savedInsights.length} insights`
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return c.json({ error: 'Failed to generate insights' }, 500);
  }
});

// GET /research/projects/:id/insights - Get project insights
researchRoutes.get('/projects/:id/insights', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    // Check access
    const project = await DB.prepare(`
      SELECT is_public FROM research_projects WHERE id = ?
    `).bind(projectId).first<{ is_public: number }>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (!project.is_public && userId === 'guest') {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { results } = await DB.prepare(`
      SELECT * FROM research_insights
      WHERE project_id = ?
      ORDER BY created_at DESC
    `).bind(projectId).all();

    const insights = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      type: row.type,
      title: row.title,
      content: row.content,
      source: row.source,
      confidence: row.confidence,
      priority: row.priority,
      isAiGenerated: !!row.is_ai_generated,
      isVerified: !!row.is_verified,
      verifiedById: row.verified_by_id,
      createdAt: row.created_at
    }));

    return c.json({ items: insights, total: insights.length });
  } catch (error) {
    console.error('Error getting insights:', error);
    return c.json({ error: 'Failed to get insights' }, 500);
  }
});

// DELETE /research/projects/:id/insights/:insightId - Delete insight
researchRoutes.delete('/projects/:id/insights/:insightId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const insightId = c.req.param('insightId');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await DB.prepare(`
      DELETE FROM research_insights WHERE id = ? AND project_id = ?
    `).bind(insightId, projectId).run();

    return c.json({ message: 'Insight deleted successfully' });
  } catch (error) {
    console.error('Error deleting insight:', error);
    return c.json({ error: 'Failed to delete insight' }, 500);
  }
});

// POST /research/literature/:id/summarize - Summarize literature
researchRoutes.post('/literature/:id/summarize', requireAuth, async (c: AppContext) => {
  try {
    const { DB, AI } = c.env;
    const userId = c.get('userId')!;
    const litId = c.req.param('id');

    // Get literature details
    const lit = await DB.prepare(`
      SELECT rl.*, p.id as project_id
      FROM research_literature rl
      JOIN research_projects p ON rl.project_id = p.id
      WHERE rl.id = ?
    `).bind(litId).first();

    if (!lit) {
      return c.json({ error: 'Literature not found' }, 404);
    }

    const row = lit as any;

    // Check membership
    const isMember = await isProjectMember(DB, row.project_id, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const title = row.external_title || 'Unknown Title';
    const authors = row.external_authors || 'Unknown Authors';
    const notes = row.notes || '';

    const prompt = `Summarize this research source for a civil service researcher:

Title: ${title}
Authors: ${authors}
Year: ${row.external_year || 'Unknown'}
Source: ${row.external_source || 'Unknown'}
Notes: ${notes}

Provide:
1. A 2-3 sentence summary
2. Key relevance to public policy/governance
3. Potential citation contexts

Summary:`;

    const response = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 400,
      temperature: 0.3,
    });

    const summary = response.response?.trim() || 'Unable to generate summary';

    // Update literature with summary in notes
    const updatedNotes = notes
      ? `${notes}\n\n--- AI Summary ---\n${summary}`
      : `--- AI Summary ---\n${summary}`;

    await DB.prepare(`
      UPDATE research_literature SET notes = ? WHERE id = ?
    `).bind(updatedNotes, litId).run();

    await logActivity(DB, row.project_id, userId, 'literature_summarized', `Generated summary for: ${title}`);

    return c.json({ summary, message: 'Summary generated and saved' });
  } catch (error) {
    console.error('Error summarizing literature:', error);
    return c.json({ error: 'Failed to summarize literature' }, 500);
  }
});

// POST /research/projects/:id/briefs - Generate policy brief
researchRoutes.post('/projects/:id/briefs', requireAuth, async (c: AppContext) => {
  try {
    const { DB, AI } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { briefType = 'policy', audience = 'policymakers' } = await c.req.json();

    // Check membership
    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get project details
    const project = await DB.prepare(`
      SELECT * FROM research_projects WHERE id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const row = project as any;

    // Get insights for context
    const { results: insights } = await DB.prepare(`
      SELECT type, title, content FROM research_insights
      WHERE project_id = ? AND (is_verified = 1 OR is_ai_generated = 1)
      ORDER BY priority DESC LIMIT 5
    `).bind(projectId).all();

    const insightsContext = insights.map((i: any) =>
      `[${i.type}] ${i.title}: ${i.content}`
    ).join('\n');

    const prompt = `Generate a ${briefType} brief for ${audience} based on this research:

Research Project:
Title: ${row.title}
Research Question: ${row.research_question}
Hypothesis: ${row.hypothesis || 'Not specified'}
Methodology: ${row.methodology}
Category: ${row.category}
Objectives: ${row.objectives ? JSON.parse(row.objectives).join('; ') : 'Not specified'}

Key Insights:
${insightsContext || 'No insights generated yet'}

Generate a structured ${briefType} brief with:
1. Executive Summary (2-3 sentences)
2. Background (brief context)
3. Key Findings (bullet points)
4. Recommendations (actionable items)
5. Implementation Considerations

Format as clean markdown.

Brief:`;

    const response = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 1000,
      temperature: 0.4,
    });

    const content = response.response?.trim() || 'Unable to generate brief';

    // Generate a title
    const briefTitle = `${briefType.charAt(0).toUpperCase() + briefType.slice(1)} Brief: ${row.title.substring(0, 50)}`;

    // Save brief to database
    const briefId = generateId();
    await DB.prepare(`
      INSERT INTO research_briefs (
        id, project_id, title, brief_type, audience, content, status, created_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, datetime('now'), datetime('now'))
    `).bind(briefId, projectId, briefTitle, briefType, audience, content, userId).run();

    await logActivity(DB, projectId, userId, 'brief_generated', `Generated ${briefType} brief`);

    return c.json({
      id: briefId,
      title: briefTitle,
      briefType,
      audience,
      content,
      status: 'draft',
      message: 'Policy brief generated successfully'
    });
  } catch (error) {
    console.error('Error generating brief:', error);
    return c.json({ error: 'Failed to generate brief' }, 500);
  }
});

// GET /research/projects/:id/briefs - Get project briefs
researchRoutes.get('/projects/:id/briefs', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    // Check access
    const project = await DB.prepare(`
      SELECT is_public FROM research_projects WHERE id = ?
    `).bind(projectId).first<{ is_public: number }>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (!project.is_public && userId === 'guest') {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { results } = await DB.prepare(`
      SELECT b.*, u.displayName as createdByName, u.avatar as createdByAvatar
      FROM research_briefs b
      LEFT JOIN users u ON b.created_by_id = u.id
      WHERE b.project_id = ?
      ORDER BY b.created_at DESC
    `).bind(projectId).all();

    const briefs = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      briefType: row.brief_type,
      audience: row.audience,
      content: row.content,
      status: row.status,
      publishedAt: row.published_at,
      createdById: row.created_by_id,
      createdBy: {
        id: row.created_by_id,
        displayName: row.createdByName,
        avatar: row.createdByAvatar
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({ items: briefs, total: briefs.length });
  } catch (error) {
    console.error('Error getting briefs:', error);
    return c.json({ error: 'Failed to get briefs' }, 500);
  }
});

// PUT /research/projects/:id/briefs/:briefId - Update brief
researchRoutes.put('/projects/:id/briefs/:briefId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const briefId = c.req.param('briefId');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const { title, content, status } = await c.req.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content) {
      updates.push('content = ?');
      values.push(content);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
      if (status === 'published') {
        updates.push('published_at = datetime("now")');
      }
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = datetime("now")');
    values.push(briefId, projectId);

    await DB.prepare(`
      UPDATE research_briefs SET ${updates.join(', ')} WHERE id = ? AND project_id = ?
    `).bind(...values).run();

    return c.json({ message: 'Brief updated successfully' });
  } catch (error) {
    console.error('Error updating brief:', error);
    return c.json({ error: 'Failed to update brief' }, 500);
  }
});

// DELETE /research/projects/:id/briefs/:briefId - Delete brief
researchRoutes.delete('/projects/:id/briefs/:briefId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const briefId = c.req.param('briefId');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await DB.prepare(`
      DELETE FROM research_briefs WHERE id = ? AND project_id = ?
    `).bind(briefId, projectId).run();

    return c.json({ message: 'Brief deleted successfully' });
  } catch (error) {
    console.error('Error deleting brief:', error);
    return c.json({ error: 'Failed to delete brief' }, 500);
  }
});

// POST /research/analyze-text - General text analysis (for methodology suggestions, etc.)
researchRoutes.post('/analyze-text', requireAuth, async (c: AppContext) => {
  try {
    const { AI } = c.env;
    const { text, analysisType = 'general' } = await c.req.json();

    if (!text?.trim()) {
      return c.json({ error: 'Text is required' }, 400);
    }

    let prompt = '';

    switch (analysisType) {
      case 'methodology':
        prompt = `As a research methodology expert, analyze this research description and suggest appropriate methodologies:

"${text}"

Provide:
1. Recommended methodology (qualitative/quantitative/mixed)
2. Specific methods to consider
3. Data collection approaches
4. Potential limitations

Analysis:`;
        break;

      case 'research_question':
        prompt = `As a research design expert, evaluate this research question:

"${text}"

Provide:
1. Clarity score (1-10)
2. Specificity assessment
3. Suggestions for improvement
4. Related sub-questions to explore

Evaluation:`;
        break;

      case 'literature_gap':
        prompt = `As a research strategist, analyze this research topic/question and identify potential literature gaps:

"${text}"

Identify:
1. Under-researched areas
2. Emerging perspectives
3. Cross-disciplinary opportunities
4. Ghana/Africa-specific gaps

Analysis:`;
        break;

      default:
        prompt = `Analyze this research-related text and provide helpful insights:

"${text}"

Insights:`;
    }

    const response = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 500,
      temperature: 0.4,
    });

    return c.json({
      analysis: response.response?.trim() || 'Unable to analyze text',
      analysisType
    });
  } catch (error) {
    console.error('Error analyzing text:', error);
    return c.json({ error: 'Failed to analyze text' }, 500);
  }
});

// GET /research/stats - Get global research statistics (admin)
researchRoutes.get('/stats', async (c: AppContext) => {
  try {
    const { DB } = c.env;

    const projectStats = await DB.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('planning', 'active') THEN 1 END) as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM research_projects
    `).first();

    const literatureCount = await DB.prepare(`
      SELECT COUNT(*) as total FROM research_literature
    `).first<{ total: number }>();

    const insightCount = await DB.prepare(`
      SELECT COUNT(*) as total FROM research_insights
    `).first<{ total: number }>();

    const briefCount = await DB.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published
      FROM research_briefs
    `).first();

    const researcherCount = await DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as total FROM (
        SELECT created_by_id as user_id FROM research_projects
        UNION
        SELECT user_id FROM research_team_members
      )
    `).first<{ total: number }>();

    return c.json({
      projects: {
        total: (projectStats as any)?.total || 0,
        active: (projectStats as any)?.active || 0,
        completed: (projectStats as any)?.completed || 0
      },
      literature: {
        total: literatureCount?.total || 0
      },
      insights: {
        total: insightCount?.total || 0
      },
      briefs: {
        total: (briefCount as any)?.total || 0,
        published: (briefCount as any)?.published || 0
      },
      engagement: {
        totalResearchers: researcherCount?.total || 0
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

// ============================================================================
// Phase 3: Collaboration Features
// ============================================================================

// Helper to log team activity
async function logTeamActivity(
  db: D1Database,
  projectId: string,
  userId: string,
  activityType: string,
  targetType?: string,
  targetId?: string,
  details?: string
) {
  await db.prepare(`
    INSERT INTO research_team_activities (id, project_id, user_id, activity_type, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(generateId(), projectId, userId, activityType, targetType || null, targetId || null, details || null).run();
}

// ============================================================================
// Research Notes (Collaborative Documents)
// ============================================================================

// GET /research/projects/:id/notes - Get project notes
researchRoutes.get('/projects/:id/notes', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    const project = await DB.prepare(`
      SELECT is_public FROM research_projects WHERE id = ?
    `).bind(projectId).first<{ is_public: number }>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (!project.is_public && userId === 'guest') {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { results } = await DB.prepare(`
      SELECT n.*,
        u.displayName as createdByName, u.avatar as createdByAvatar,
        e.displayName as lastEditedByName
      FROM research_notes n
      LEFT JOIN users u ON n.created_by_id = u.id
      LEFT JOIN users e ON n.last_edited_by_id = e.id
      WHERE n.project_id = ?
      ORDER BY n.is_pinned DESC, n.updated_at DESC
    `).bind(projectId).all();

    const notes = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      content: row.content,
      noteType: row.note_type,
      isPinned: !!row.is_pinned,
      version: row.version,
      createdBy: {
        id: row.created_by_id,
        displayName: row.createdByName,
        avatar: row.createdByAvatar
      },
      lastEditedBy: row.last_edited_by_id ? {
        id: row.last_edited_by_id,
        displayName: row.lastEditedByName
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({ items: notes, total: notes.length });
  } catch (error) {
    console.error('Error getting notes:', error);
    return c.json({ error: 'Failed to get notes' }, 500);
  }
});

// POST /research/projects/:id/notes - Create note
researchRoutes.post('/projects/:id/notes', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { title, content, noteType = 'general' } = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    if (!title?.trim()) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const noteId = generateId();
    await DB.prepare(`
      INSERT INTO research_notes (id, project_id, title, content, note_type, created_by_id, last_edited_by_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(noteId, projectId, title.trim(), content || '', noteType, userId, userId).run();

    await logTeamActivity(DB, projectId, userId, 'note_created', 'note', noteId, `Created note: ${title}`);

    return c.json({ id: noteId, message: 'Note created successfully' }, 201);
  } catch (error) {
    console.error('Error creating note:', error);
    return c.json({ error: 'Failed to create note' }, 500);
  }
});

// PUT /research/projects/:id/notes/:noteId - Update note
researchRoutes.put('/projects/:id/notes/:noteId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const noteId = c.req.param('noteId');
    const { title, content, noteType, isPinned } = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get current note for versioning
    const currentNote = await DB.prepare(`
      SELECT content, version FROM research_notes WHERE id = ? AND project_id = ?
    `).bind(noteId, projectId).first<{ content: string; version: number }>();

    if (!currentNote) {
      return c.json({ error: 'Note not found' }, 404);
    }

    // Save version history if content changed
    if (content !== undefined && content !== currentNote.content) {
      await DB.prepare(`
        INSERT INTO research_note_versions (id, note_id, content, version, edited_by_id, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(generateId(), noteId, currentNote.content, currentNote.version, userId).run();
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
      updates.push('version = version + 1');
    }
    if (noteType !== undefined) {
      updates.push('note_type = ?');
      values.push(noteType);
    }
    if (isPinned !== undefined) {
      updates.push('is_pinned = ?');
      values.push(isPinned ? 1 : 0);
    }

    updates.push('last_edited_by_id = ?');
    values.push(userId);
    updates.push('updated_at = datetime("now")');

    values.push(noteId, projectId);

    await DB.prepare(`
      UPDATE research_notes SET ${updates.join(', ')} WHERE id = ? AND project_id = ?
    `).bind(...values).run();

    await logTeamActivity(DB, projectId, userId, 'note_updated', 'note', noteId);

    return c.json({ message: 'Note updated successfully' });
  } catch (error) {
    console.error('Error updating note:', error);
    return c.json({ error: 'Failed to update note' }, 500);
  }
});

// DELETE /research/projects/:id/notes/:noteId - Delete note
researchRoutes.delete('/projects/:id/notes/:noteId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const noteId = c.req.param('noteId');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await DB.prepare(`
      DELETE FROM research_notes WHERE id = ? AND project_id = ?
    `).bind(noteId, projectId).run();

    await logTeamActivity(DB, projectId, userId, 'note_deleted', 'note', noteId);

    return c.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return c.json({ error: 'Failed to delete note' }, 500);
  }
});

// GET /research/projects/:id/notes/:noteId/versions - Get note version history
researchRoutes.get('/projects/:id/notes/:noteId/versions', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const noteId = c.req.param('noteId');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const { results } = await DB.prepare(`
      SELECT v.*, u.displayName as editedByName, u.avatar as editedByAvatar
      FROM research_note_versions v
      LEFT JOIN users u ON v.edited_by_id = u.id
      WHERE v.note_id = ?
      ORDER BY v.version DESC
    `).bind(noteId).all();

    const versions = results.map((row: any) => ({
      id: row.id,
      noteId: row.note_id,
      content: row.content,
      version: row.version,
      editedBy: {
        id: row.edited_by_id,
        displayName: row.editedByName,
        avatar: row.editedByAvatar
      },
      changeSummary: row.change_summary,
      createdAt: row.created_at
    }));

    return c.json({ items: versions, total: versions.length });
  } catch (error) {
    console.error('Error getting note versions:', error);
    return c.json({ error: 'Failed to get note versions' }, 500);
  }
});

// ============================================================================
// Literature Annotations
// ============================================================================

// GET /research/literature/:id/annotations - Get annotations for literature
researchRoutes.get('/literature/:id/annotations', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const literatureId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT a.*, u.displayName as userName, u.avatar as userAvatar
      FROM research_annotations a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.literature_id = ? AND (a.is_private = 0 OR a.user_id = ?)
      ORDER BY a.page_number, a.created_at
    `).bind(literatureId, userId).all();

    const annotations = results.map((row: any) => ({
      id: row.id,
      literatureId: row.literature_id,
      annotationType: row.annotation_type,
      content: row.content,
      quote: row.quote,
      color: row.color,
      pageNumber: row.page_number,
      positionData: row.position_data ? JSON.parse(row.position_data) : null,
      isPrivate: !!row.is_private,
      user: {
        id: row.user_id,
        displayName: row.userName,
        avatar: row.userAvatar
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({ items: annotations, total: annotations.length });
  } catch (error) {
    console.error('Error getting annotations:', error);
    return c.json({ error: 'Failed to get annotations' }, 500);
  }
});

// POST /research/literature/:id/annotations - Add annotation
researchRoutes.post('/literature/:id/annotations', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const literatureId = c.req.param('id');
    const { annotationType, content, quote, color, pageNumber, positionData, isPrivate } = await c.req.json();

    if (!content?.trim()) {
      return c.json({ error: 'Content is required' }, 400);
    }

    // Get project ID from literature
    const lit = await DB.prepare(`
      SELECT project_id FROM research_literature WHERE id = ?
    `).bind(literatureId).first<{ project_id: string }>();

    if (!lit) {
      return c.json({ error: 'Literature not found' }, 404);
    }

    const isMember = await isProjectMember(DB, lit.project_id, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const annotationId = generateId();
    await DB.prepare(`
      INSERT INTO research_annotations (
        id, literature_id, user_id, annotation_type, content, quote, color, page_number, position_data, is_private, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      annotationId,
      literatureId,
      userId,
      annotationType || 'highlight',
      content.trim(),
      quote || null,
      color || '#FFEB3B',
      pageNumber || null,
      positionData ? JSON.stringify(positionData) : null,
      isPrivate ? 1 : 0
    ).run();

    await logTeamActivity(DB, lit.project_id, userId, 'annotation_added', 'annotation', annotationId);

    return c.json({ id: annotationId, message: 'Annotation added successfully' }, 201);
  } catch (error) {
    console.error('Error adding annotation:', error);
    return c.json({ error: 'Failed to add annotation' }, 500);
  }
});

// DELETE /research/literature/:id/annotations/:annotationId - Delete annotation
researchRoutes.delete('/literature/:id/annotations/:annotationId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const annotationId = c.req.param('annotationId');

    // Only owner can delete
    const annotation = await DB.prepare(`
      SELECT user_id FROM research_annotations WHERE id = ?
    `).bind(annotationId).first<{ user_id: string }>();

    if (!annotation) {
      return c.json({ error: 'Annotation not found' }, 404);
    }

    if (annotation.user_id !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await DB.prepare(`
      DELETE FROM research_annotations WHERE id = ?
    `).bind(annotationId).run();

    return c.json({ message: 'Annotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    return c.json({ error: 'Failed to delete annotation' }, 500);
  }
});

// ============================================================================
// Peer Review Workflow
// ============================================================================

// GET /research/projects/:id/reviews - Get project reviews
researchRoutes.get('/projects/:id/reviews', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT r.*,
        rv.displayName as reviewerName, rv.avatar as reviewerAvatar,
        req.displayName as requestedByName
      FROM research_reviews r
      LEFT JOIN users rv ON r.reviewer_id = rv.id
      LEFT JOIN users req ON r.requested_by_id = req.id
      WHERE r.project_id = ?
      ORDER BY r.created_at DESC
    `).bind(projectId).all();

    const reviews = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      reviewer: row.is_anonymous && userId !== row.reviewer_id ? {
        id: 'anonymous',
        displayName: 'Anonymous Reviewer'
      } : {
        id: row.reviewer_id,
        displayName: row.reviewerName,
        avatar: row.reviewerAvatar
      },
      requestedBy: {
        id: row.requested_by_id,
        displayName: row.requestedByName
      },
      status: row.status,
      reviewType: row.review_type,
      deadline: row.deadline,
      overallRating: row.overall_rating,
      summary: row.summary,
      strengths: row.strengths,
      weaknesses: row.weaknesses,
      recommendations: row.recommendations,
      isAnonymous: !!row.is_anonymous,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({ items: reviews, total: reviews.length });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return c.json({ error: 'Failed to get reviews' }, 500);
  }
});

// POST /research/projects/:id/reviews - Request a review
researchRoutes.post('/projects/:id/reviews', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { reviewerId, reviewType = 'full', deadline, isAnonymous } = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    if (!reviewerId) {
      return c.json({ error: 'Reviewer ID is required' }, 400);
    }

    // Check if reviewer exists
    const reviewer = await DB.prepare(`
      SELECT id FROM users WHERE id = ?
    `).bind(reviewerId).first();

    if (!reviewer) {
      return c.json({ error: 'Reviewer not found' }, 404);
    }

    const reviewId = generateId();
    await DB.prepare(`
      INSERT INTO research_reviews (
        id, project_id, reviewer_id, requested_by_id, status, review_type, deadline, is_anonymous, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(reviewId, projectId, reviewerId, userId, reviewType, deadline || null, isAnonymous ? 1 : 0).run();

    await logTeamActivity(DB, projectId, userId, 'review_requested', 'review', reviewId, `Requested ${reviewType} review`);

    return c.json({ id: reviewId, message: 'Review requested successfully' }, 201);
  } catch (error) {
    console.error('Error requesting review:', error);
    return c.json({ error: 'Failed to request review' }, 500);
  }
});

// PUT /research/projects/:id/reviews/:reviewId - Submit/update review
researchRoutes.put('/projects/:id/reviews/:reviewId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const reviewId = c.req.param('reviewId');
    const { status, overallRating, summary, strengths, weaknesses, recommendations } = await c.req.json();

    // Only reviewer can update
    const review = await DB.prepare(`
      SELECT reviewer_id, status FROM research_reviews WHERE id = ? AND project_id = ?
    `).bind(reviewId, projectId).first<{ reviewer_id: string; status: string }>();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    if (review.reviewer_id !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      if (['approved', 'rejected', 'changes_requested'].includes(status)) {
        updates.push('submitted_at = datetime("now")');
      }
    }
    if (overallRating !== undefined) {
      updates.push('overall_rating = ?');
      values.push(overallRating);
    }
    if (summary !== undefined) {
      updates.push('summary = ?');
      values.push(summary);
    }
    if (strengths !== undefined) {
      updates.push('strengths = ?');
      values.push(strengths);
    }
    if (weaknesses !== undefined) {
      updates.push('weaknesses = ?');
      values.push(weaknesses);
    }
    if (recommendations !== undefined) {
      updates.push('recommendations = ?');
      values.push(recommendations);
    }

    updates.push('updated_at = datetime("now")');
    values.push(reviewId, projectId);

    await DB.prepare(`
      UPDATE research_reviews SET ${updates.join(', ')} WHERE id = ? AND project_id = ?
    `).bind(...values).run();

    if (status === 'approved') {
      await logTeamActivity(DB, projectId, userId, 'review_approved', 'review', reviewId);
    } else if (status === 'rejected') {
      await logTeamActivity(DB, projectId, userId, 'review_rejected', 'review', reviewId);
    } else if (['in_progress', 'changes_requested'].includes(status)) {
      await logTeamActivity(DB, projectId, userId, 'review_submitted', 'review', reviewId);
    }

    return c.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    return c.json({ error: 'Failed to update review' }, 500);
  }
});

// GET /research/projects/:id/reviews/:reviewId/comments - Get review comments
researchRoutes.get('/projects/:id/reviews/:reviewId/comments', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const reviewId = c.req.param('reviewId');

    const { results } = await DB.prepare(`
      SELECT rc.*, u.displayName as resolvedByName
      FROM research_review_comments rc
      LEFT JOIN users u ON rc.resolved_by_id = u.id
      WHERE rc.review_id = ?
      ORDER BY rc.created_at
    `).bind(reviewId).all();

    const comments = results.map((row: any) => ({
      id: row.id,
      reviewId: row.review_id,
      section: row.section,
      lineReference: row.line_reference,
      commentType: row.comment_type,
      content: row.content,
      isResolved: !!row.is_resolved,
      resolvedBy: row.resolved_by_id ? {
        id: row.resolved_by_id,
        displayName: row.resolvedByName
      } : null,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at
    }));

    return c.json({ items: comments, total: comments.length });
  } catch (error) {
    console.error('Error getting review comments:', error);
    return c.json({ error: 'Failed to get review comments' }, 500);
  }
});

// POST /research/projects/:id/reviews/:reviewId/comments - Add review comment
researchRoutes.post('/projects/:id/reviews/:reviewId/comments', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const reviewId = c.req.param('reviewId');
    const { section, lineReference, commentType = 'suggestion', content } = await c.req.json();

    // Only reviewer can add comments
    const review = await DB.prepare(`
      SELECT reviewer_id FROM research_reviews WHERE id = ?
    `).bind(reviewId).first<{ reviewer_id: string }>();

    if (!review || review.reviewer_id !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    if (!content?.trim()) {
      return c.json({ error: 'Content is required' }, 400);
    }

    const commentId = generateId();
    await DB.prepare(`
      INSERT INTO research_review_comments (id, review_id, section, line_reference, comment_type, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(commentId, reviewId, section || null, lineReference || null, commentType, content.trim()).run();

    return c.json({ id: commentId, message: 'Comment added successfully' }, 201);
  } catch (error) {
    console.error('Error adding review comment:', error);
    return c.json({ error: 'Failed to add review comment' }, 500);
  }
});

// ============================================================================
// Citation Management
// ============================================================================

// GET /research/projects/:id/citations - Get project citations
researchRoutes.get('/projects/:id/citations', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');
    const format = c.req.query('format');

    const { results } = await DB.prepare(`
      SELECT c.*, u.displayName as createdByName
      FROM research_citations c
      LEFT JOIN users u ON c.created_by_id = u.id
      WHERE c.project_id = ?
      ORDER BY c.citation_key
    `).bind(projectId).all();

    const citations = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      literatureId: row.literature_id,
      citationKey: row.citation_key,
      citationType: row.citation_type,
      title: row.title,
      authors: row.authors,
      year: row.year,
      journal: row.journal,
      volume: row.volume,
      issue: row.issue,
      pages: row.pages,
      publisher: row.publisher,
      doi: row.doi,
      url: row.url,
      abstract: row.abstract,
      keywords: row.keywords,
      notes: row.notes,
      formatted: format ? row[`${format}_format`] : {
        apa: row.apa_format,
        mla: row.mla_format,
        chicago: row.chicago_format,
        harvard: row.harvard_format
      },
      createdBy: {
        id: row.created_by_id,
        displayName: row.createdByName
      },
      createdAt: row.created_at
    }));

    return c.json({ items: citations, total: citations.length });
  } catch (error) {
    console.error('Error getting citations:', error);
    return c.json({ error: 'Failed to get citations' }, 500);
  }
});

// POST /research/projects/:id/citations - Add citation
researchRoutes.post('/projects/:id/citations', requireAuth, async (c: AppContext) => {
  try {
    const { DB, AI } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const body = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const {
      literatureId, citationKey, citationType = 'article',
      title, authors, year, journal, volume, issue, pages,
      publisher, doi, url, abstract, keywords, notes
    } = body;

    if (!title?.trim() || !citationKey?.trim()) {
      return c.json({ error: 'Title and citation key are required' }, 400);
    }

    // Generate formatted citations using AI
    let apaFormat = '', mlaFormat = '', chicagoFormat = '', harvardFormat = '';

    try {
      const citationData = `Title: ${title}
Authors: ${authors || 'Unknown'}
Year: ${year || 'n.d.'}
Journal: ${journal || ''}
Volume: ${volume || ''}
Issue: ${issue || ''}
Pages: ${pages || ''}
Publisher: ${publisher || ''}
DOI: ${doi || ''}
URL: ${url || ''}`;

      const response = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
        prompt: `Generate citation formats for this source. Return ONLY the formatted citations, one per line, labeled:

${citationData}

Format as:
APA: [citation]
MLA: [citation]
Chicago: [citation]
Harvard: [citation]`,
        max_tokens: 400,
        temperature: 0.2,
      });

      const formats = response.response || '';
      const apaMatch = formats.match(/APA:\s*(.+?)(?=\n|MLA:|$)/i);
      const mlaMatch = formats.match(/MLA:\s*(.+?)(?=\n|Chicago:|$)/i);
      const chicagoMatch = formats.match(/Chicago:\s*(.+?)(?=\n|Harvard:|$)/i);
      const harvardMatch = formats.match(/Harvard:\s*(.+?)$/i);

      apaFormat = apaMatch?.[1]?.trim() || '';
      mlaFormat = mlaMatch?.[1]?.trim() || '';
      chicagoFormat = chicagoMatch?.[1]?.trim() || '';
      harvardFormat = harvardMatch?.[1]?.trim() || '';
    } catch (e) {
      console.error('Error generating citation formats:', e);
    }

    const citationId = generateId();
    await DB.prepare(`
      INSERT INTO research_citations (
        id, project_id, literature_id, citation_key, citation_type,
        title, authors, year, journal, volume, issue, pages,
        publisher, doi, url, abstract, keywords, notes,
        apa_format, mla_format, chicago_format, harvard_format,
        created_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      citationId, projectId, literatureId || null, citationKey.trim(), citationType,
      title.trim(), authors || null, year || null, journal || null, volume || null, issue || null, pages || null,
      publisher || null, doi || null, url || null, abstract || null, keywords || null, notes || null,
      apaFormat, mlaFormat, chicagoFormat, harvardFormat,
      userId
    ).run();

    await logTeamActivity(DB, projectId, userId, 'citation_added', 'citation', citationId, `Added citation: ${citationKey}`);

    return c.json({ id: citationId, message: 'Citation added successfully' }, 201);
  } catch (error) {
    console.error('Error adding citation:', error);
    return c.json({ error: 'Failed to add citation' }, 500);
  }
});

// DELETE /research/projects/:id/citations/:citationId - Delete citation
researchRoutes.delete('/projects/:id/citations/:citationId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const citationId = c.req.param('citationId');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await DB.prepare(`
      DELETE FROM research_citations WHERE id = ? AND project_id = ?
    `).bind(citationId, projectId).run();

    return c.json({ message: 'Citation deleted successfully' });
  } catch (error) {
    console.error('Error deleting citation:', error);
    return c.json({ error: 'Failed to delete citation' }, 500);
  }
});

// GET /research/projects/:id/citations/export - Export citations
researchRoutes.get('/projects/:id/citations/export', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');
    const format = c.req.query('format') || 'bibtex';

    const { results } = await DB.prepare(`
      SELECT * FROM research_citations WHERE project_id = ? ORDER BY citation_key
    `).bind(projectId).all();

    if (format === 'bibtex') {
      const bibtex = results.map((row: any) => {
        const type = row.citation_type === 'book' ? 'book' : row.citation_type === 'conference' ? 'inproceedings' : 'article';
        let entry = `@${type}{${row.citation_key},\n`;
        entry += `  title = {${row.title}},\n`;
        if (row.authors) entry += `  author = {${row.authors}},\n`;
        if (row.year) entry += `  year = {${row.year}},\n`;
        if (row.journal) entry += `  journal = {${row.journal}},\n`;
        if (row.volume) entry += `  volume = {${row.volume}},\n`;
        if (row.pages) entry += `  pages = {${row.pages}},\n`;
        if (row.publisher) entry += `  publisher = {${row.publisher}},\n`;
        if (row.doi) entry += `  doi = {${row.doi}},\n`;
        if (row.url) entry += `  url = {${row.url}},\n`;
        entry += `}`;
        return entry;
      }).join('\n\n');

      return new Response(bibtex, {
        headers: {
          'Content-Type': 'application/x-bibtex',
          'Content-Disposition': `attachment; filename="citations.bib"`
        }
      });
    } else if (['apa', 'mla', 'chicago', 'harvard'].includes(format)) {
      const formatField = `${format}_format`;
      const citations = results.map((row: any) => row[formatField] || row.title).join('\n\n');

      return new Response(citations, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="citations-${format}.txt"`
        }
      });
    }

    return c.json({ error: 'Invalid format' }, 400);
  } catch (error) {
    console.error('Error exporting citations:', error);
    return c.json({ error: 'Failed to export citations' }, 500);
  }
});

// ============================================================================
// Discussion Threads
// ============================================================================

// GET /research/projects/:id/discussions - Get project discussions
researchRoutes.get('/projects/:id/discussions', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');
    const contextType = c.req.query('contextType');
    const contextId = c.req.query('contextId');

    let query = `
      SELECT d.*,
        u.displayName as createdByName, u.avatar as createdByAvatar,
        lr.displayName as lastReplyByName
      FROM research_discussions d
      LEFT JOIN users u ON d.created_by_id = u.id
      LEFT JOIN users lr ON d.last_reply_by_id = lr.id
      WHERE d.project_id = ?
    `;
    const params: any[] = [projectId];

    if (contextType) {
      query += ' AND d.context_type = ?';
      params.push(contextType);
    }
    if (contextId) {
      query += ' AND d.context_id = ?';
      params.push(contextId);
    }

    query += ' ORDER BY d.is_pinned DESC, d.last_reply_at DESC NULLS LAST, d.created_at DESC';

    const { results } = await DB.prepare(query).bind(...params).all();

    const discussions = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      contextType: row.context_type,
      contextId: row.context_id,
      status: row.status,
      isPinned: !!row.is_pinned,
      replyCount: row.reply_count,
      lastReplyAt: row.last_reply_at,
      lastReplyBy: row.last_reply_by_id ? {
        id: row.last_reply_by_id,
        displayName: row.lastReplyByName
      } : null,
      createdBy: {
        id: row.created_by_id,
        displayName: row.createdByName,
        avatar: row.createdByAvatar
      },
      createdAt: row.created_at
    }));

    return c.json({ items: discussions, total: discussions.length });
  } catch (error) {
    console.error('Error getting discussions:', error);
    return c.json({ error: 'Failed to get discussions' }, 500);
  }
});

// POST /research/projects/:id/discussions - Start discussion
researchRoutes.post('/projects/:id/discussions', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { title, contextType = 'general', contextId, initialMessage } = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    if (!title?.trim()) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const discussionId = generateId();
    await DB.prepare(`
      INSERT INTO research_discussions (
        id, project_id, title, context_type, context_id, created_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(discussionId, projectId, title.trim(), contextType, contextId || null, userId).run();

    // Add initial message as first reply if provided
    if (initialMessage?.trim()) {
      const replyId = generateId();
      await DB.prepare(`
        INSERT INTO research_discussion_replies (id, discussion_id, content, created_by_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(replyId, discussionId, initialMessage.trim(), userId).run();

      await DB.prepare(`
        UPDATE research_discussions SET reply_count = 1, last_reply_at = datetime('now'), last_reply_by_id = ?
        WHERE id = ?
      `).bind(userId, discussionId).run();
    }

    await logTeamActivity(DB, projectId, userId, 'discussion_started', 'discussion', discussionId, title);

    return c.json({ id: discussionId, message: 'Discussion started successfully' }, 201);
  } catch (error) {
    console.error('Error starting discussion:', error);
    return c.json({ error: 'Failed to start discussion' }, 500);
  }
});

// GET /research/discussions/:id/replies - Get discussion replies
researchRoutes.get('/discussions/:id/replies', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const discussionId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT r.*, u.displayName as createdByName, u.avatar as createdByAvatar
      FROM research_discussion_replies r
      LEFT JOIN users u ON r.created_by_id = u.id
      WHERE r.discussion_id = ?
      ORDER BY r.created_at ASC
    `).bind(discussionId).all();

    const replies = results.map((row: any) => ({
      id: row.id,
      discussionId: row.discussion_id,
      parentReplyId: row.parent_reply_id,
      content: row.content,
      isSolution: !!row.is_solution,
      reactionCount: row.reaction_count,
      createdBy: {
        id: row.created_by_id,
        displayName: row.createdByName,
        avatar: row.createdByAvatar
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return c.json({ items: replies, total: replies.length });
  } catch (error) {
    console.error('Error getting replies:', error);
    return c.json({ error: 'Failed to get replies' }, 500);
  }
});

// POST /research/discussions/:id/replies - Add reply
researchRoutes.post('/discussions/:id/replies', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const discussionId = c.req.param('id');
    const { content, parentReplyId } = await c.req.json();

    if (!content?.trim()) {
      return c.json({ error: 'Content is required' }, 400);
    }

    // Get project ID from discussion
    const discussion = await DB.prepare(`
      SELECT project_id FROM research_discussions WHERE id = ?
    `).bind(discussionId).first<{ project_id: string }>();

    if (!discussion) {
      return c.json({ error: 'Discussion not found' }, 404);
    }

    const isMember = await isProjectMember(DB, discussion.project_id, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const replyId = generateId();
    await DB.prepare(`
      INSERT INTO research_discussion_replies (id, discussion_id, parent_reply_id, content, created_by_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(replyId, discussionId, parentReplyId || null, content.trim(), userId).run();

    // Update discussion stats
    await DB.prepare(`
      UPDATE research_discussions
      SET reply_count = reply_count + 1, last_reply_at = datetime('now'), last_reply_by_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(userId, discussionId).run();

    await logTeamActivity(DB, discussion.project_id, userId, 'discussion_replied', 'discussion', discussionId);

    return c.json({ id: replyId, message: 'Reply added successfully' }, 201);
  } catch (error) {
    console.error('Error adding reply:', error);
    return c.json({ error: 'Failed to add reply' }, 500);
  }
});

// PUT /research/discussions/:id - Update discussion (resolve, pin, etc.)
researchRoutes.put('/discussions/:id', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const discussionId = c.req.param('id');
    const { status, isPinned, title } = await c.req.json();

    const discussion = await DB.prepare(`
      SELECT project_id FROM research_discussions WHERE id = ?
    `).bind(discussionId).first<{ project_id: string }>();

    if (!discussion) {
      return c.json({ error: 'Discussion not found' }, 404);
    }

    const isMember = await isProjectMember(DB, discussion.project_id, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (isPinned !== undefined) {
      updates.push('is_pinned = ?');
      values.push(isPinned ? 1 : 0);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    updates.push('updated_at = datetime("now")');
    values.push(discussionId);

    await DB.prepare(`
      UPDATE research_discussions SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    if (status === 'resolved') {
      await logTeamActivity(DB, discussion.project_id, userId, 'discussion_resolved', 'discussion', discussionId);
    }

    return c.json({ message: 'Discussion updated successfully' });
  } catch (error) {
    console.error('Error updating discussion:', error);
    return c.json({ error: 'Failed to update discussion' }, 500);
  }
});

// POST /research/discussions/:id/replies/:replyId/reactions - Add reaction
researchRoutes.post('/discussions/:id/replies/:replyId/reactions', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const replyId = c.req.param('replyId');
    const { reaction } = await c.req.json();

    if (!['thumbsup', 'thumbsdown', 'heart', 'celebrate', 'thinking', 'eyes'].includes(reaction)) {
      return c.json({ error: 'Invalid reaction' }, 400);
    }

    // Check if already reacted
    const existing = await DB.prepare(`
      SELECT id FROM research_discussion_reactions WHERE reply_id = ? AND user_id = ? AND reaction = ?
    `).bind(replyId, userId, reaction).first();

    if (existing) {
      // Remove reaction
      await DB.prepare(`
        DELETE FROM research_discussion_reactions WHERE reply_id = ? AND user_id = ? AND reaction = ?
      `).bind(replyId, userId, reaction).run();

      await DB.prepare(`
        UPDATE research_discussion_replies SET reaction_count = reaction_count - 1 WHERE id = ?
      `).bind(replyId).run();

      return c.json({ message: 'Reaction removed' });
    }

    // Add reaction
    const reactionId = generateId();
    await DB.prepare(`
      INSERT INTO research_discussion_reactions (id, reply_id, user_id, reaction, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(reactionId, replyId, userId, reaction).run();

    await DB.prepare(`
      UPDATE research_discussion_replies SET reaction_count = reaction_count + 1 WHERE id = ?
    `).bind(replyId).run();

    return c.json({ id: reactionId, message: 'Reaction added' }, 201);
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return c.json({ error: 'Failed to toggle reaction' }, 500);
  }
});

// GET /research/projects/:id/team-activity - Get team activity feed
researchRoutes.get('/projects/:id/team-activity', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    const { results } = await DB.prepare(`
      SELECT ta.*, u.displayName as userName, u.avatar as userAvatar
      FROM research_team_activities ta
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE ta.project_id = ?
      ORDER BY ta.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(projectId, limit, offset).all();

    const activities = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      user: {
        id: row.user_id,
        displayName: row.userName,
        avatar: row.userAvatar
      },
      activityType: row.activity_type,
      targetType: row.target_type,
      targetId: row.target_id,
      details: row.details,
      isRead: !!row.is_read,
      createdAt: row.created_at
    }));

    return c.json({ items: activities, total: activities.length });
  } catch (error) {
    console.error('Error getting team activity:', error);
    return c.json({ error: 'Failed to get team activity' }, 500);
  }
});
