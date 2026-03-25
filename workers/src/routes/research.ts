import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { AI_DEFAULTS } from '../config/aiModels';
import { generateExportContent, markdownToHtml } from '../services/researchExport';
import { analyzeLiteratureGaps, refineResearchQuestion, suggestMethodology, generateAutoTags, crossProjectInsights } from '../services/researchAI';
import { sendResearchNotification, notifyTeamMembers, notifyMentionedUsers } from '../services/researchNotifications';

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

// Parse AI-generated brief content into structured sections
function parseAIBriefResponse(content: string): {
  executiveSummary?: string;
  background?: string;
  methodology?: string;
  keyFindings?: string[];
  recommendations?: string[];
  conclusion?: string;
} {
  const result: {
    executiveSummary?: string;
    background?: string;
    methodology?: string;
    keyFindings?: string[];
    recommendations?: string[];
    conclusion?: string;
  } = {};

  // Try to extract Executive Summary
  const execMatch = content.match(/(?:executive\s+summary|summary)[:\s]*\n?([\s\S]*?)(?=\n(?:background|key\s+findings|recommendations|implementation|##|\d\.)|$)/i);
  if (execMatch) {
    result.executiveSummary = execMatch[1].trim().replace(/^[-*•]\s*/gm, '').substring(0, 1000);
  }

  // Try to extract Background
  const bgMatch = content.match(/(?:background|context)[:\s]*\n?([\s\S]*?)(?=\n(?:key\s+findings|methodology|recommendations|##|\d\.)|$)/i);
  if (bgMatch) {
    result.background = bgMatch[1].trim().substring(0, 1000);
  }

  // Try to extract Key Findings as array
  const findingsMatch = content.match(/(?:key\s+findings|findings)[:\s]*\n?([\s\S]*?)(?=\n(?:recommendations|implementation|conclusion|##)|$)/i);
  if (findingsMatch) {
    const findings = findingsMatch[1]
      .split(/\n[-*•\d.]+\s*/)
      .map(f => f.trim())
      .filter(f => f.length > 10);
    result.keyFindings = findings.slice(0, 10);
  }

  // Try to extract Recommendations as array
  const recsMatch = content.match(/(?:recommendations|recommended\s+actions)[:\s]*\n?([\s\S]*?)(?=\n(?:implementation|conclusion|limitations|##)|$)/i);
  if (recsMatch) {
    const recs = recsMatch[1]
      .split(/\n[-*•\d.]+\s*/)
      .map(r => r.trim())
      .filter(r => r.length > 10);
    result.recommendations = recs.slice(0, 10);
  }

  // Try to extract Conclusion
  const concMatch = content.match(/(?:conclusion|implementation\s+considerations)[:\s]*\n?([\s\S]*?)$/i);
  if (concMatch) {
    result.conclusion = concMatch[1].trim().substring(0, 1000);
  }

  // If parsing failed, use the full content as executive summary
  if (!result.executiveSummary && !result.keyFindings) {
    result.executiveSummary = content.substring(0, 500);
  }

  return result;
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

    const response = await AI.run(AI_DEFAULTS.research.model, {
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

    const response = await AI.run(AI_DEFAULTS.research.model, {
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
          id, project_id, type, title, content, sources, confidence, is_ai_generated, created_at
        ) VALUES (?, ?, ?, ?, ?, 'ai_analysis', 0.8, 1, datetime('now'))
      `).bind(
        insightId,
        projectId,
        insight.type || 'recommendation',
        insight.title || 'Insight',
        insight.content || ''
      ).run();

      savedInsights.push({
        id: insightId,
        ...insight,
        isAiGenerated: true
      });
    }

    await logActivity(DB, projectId, userId, 'insights_generated', `Generated ${savedInsights.length} AI insights`);

    // Track contribution
    if (savedInsights.length > 0) {
      await DB.prepare(`
        INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, contribution_count, points_earned)
        VALUES (?, ?, ?, date('now'), 'insight_generated', 1, 5)
      `).bind(generateId(), projectId, userId).run();
    }

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

    const response = await AI.run(AI_DEFAULTS.research.model, {
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
      ORDER BY confidence DESC, created_at DESC LIMIT 5
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

    const response = await AI.run(AI_DEFAULTS.research.model, {
      prompt,
      max_tokens: 1000,
      temperature: 0.4,
    });

    const content = response.response?.trim() || 'Unable to generate brief';

    // Generate a title
    const briefTitle = `${briefType.charAt(0).toUpperCase() + briefType.slice(1)} Brief: ${row.title.substring(0, 50)}`;

    // Parse the AI response to extract sections
    const sections = parseAIBriefResponse(content);

    // Save brief to database (matching actual table schema)
    const briefId = generateId();
    await DB.prepare(`
      INSERT INTO research_briefs (
        id, project_id, title, executive_summary, background, methodology,
        key_findings, recommendations, conclusion, status, version,
        is_ai_generated, generated_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1, 1, ?, datetime('now'), datetime('now'))
    `).bind(
      briefId,
      projectId,
      briefTitle,
      sections.executiveSummary || content.substring(0, 500),
      sections.background || null,
      sections.methodology || row.methodology,
      JSON.stringify(sections.keyFindings || []),
      JSON.stringify(sections.recommendations || []),
      sections.conclusion || null,
      userId
    ).run();

    await logActivity(DB, projectId, userId, 'brief_generated', `Generated ${briefType} brief`);

    return c.json({
      id: briefId,
      title: briefTitle,
      briefType,
      audience,
      executiveSummary: sections.executiveSummary,
      background: sections.background,
      keyFindings: sections.keyFindings,
      recommendations: sections.recommendations,
      conclusion: sections.conclusion,
      content, // Include full content for backward compatibility
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

    const response = await AI.run(AI_DEFAULTS.research.model, {
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

    // Track contribution
    await DB.prepare(`
      INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, contribution_count, points_earned)
      VALUES (?, ?, ?, date('now'), 'note_created', 1, 5)
    `).bind(generateId(), projectId, userId).run();

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

    // Track contribution for review submission
    if (status && ['approved', 'rejected', 'in_progress', 'changes_requested'].includes(status)) {
      await DB.prepare(`
        INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, contribution_count, points_earned)
        VALUES (?, ?, ?, date('now'), 'review_submitted', 1, 10)
      `).bind(generateId(), projectId, userId).run();
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

      const response = await AI.run(AI_DEFAULTS.research.model, {
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

    // Track contribution
    await DB.prepare(`
      INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, contribution_count, points_earned)
      VALUES (?, ?, ?, date('now'), 'citation_added', 1, 3)
    `).bind(generateId(), projectId, userId).run();

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

    // Track contribution
    await DB.prepare(`
      INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, contribution_count, points_earned)
      VALUES (?, ?, ?, date('now'), 'discussion_started', 1, 3)
    `).bind(generateId(), projectId, userId).run();

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

    // Send notifications to team members and mentioned users
    try {
      const sender = await DB.prepare(`SELECT displayName FROM users WHERE id = ?`).bind(userId).first<{ displayName: string }>();
      const senderName = sender?.displayName || 'A team member';

      await notifyTeamMembers(DB, discussion.project_id, userId, {
        type: 'research_discussion_reply',
        title: 'New discussion reply',
        message: `${senderName} replied to a discussion`,
        link: `/research/projects/${discussion.project_id}?tab=discussions`,
        actorId: userId,
        actorName: senderName,
        resourceId: discussionId,
        resourceType: 'research_discussion',
      });

      await notifyMentionedUsers(DB, content, userId, senderName, discussion.project_id, 'discussion reply');
    } catch (e) {
      console.error('Error sending discussion reply notifications:', e);
    }

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

// ============================================
// PHASE 4: Advanced Analytics & Publishing
// ============================================

// GET /research/templates - Get research templates
researchRoutes.get('/templates', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const category = c.req.query('category');
    const methodology = c.req.query('methodology');
    const featured = c.req.query('featured');

    let query = `
      SELECT t.*, u.displayName as creatorName
      FROM research_templates t
      LEFT JOIN users u ON t.created_by_id = u.id
      WHERE t.is_public = 1
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND t.category = ?';
      params.push(category);
    }
    if (methodology) {
      query += ' AND t.methodology = ?';
      params.push(methodology);
    }
    if (featured === 'true') {
      query += ' AND t.is_featured = 1';
    }

    query += ' ORDER BY t.is_featured DESC, t.usage_count DESC';

    const { results } = await DB.prepare(query).bind(...params).all();

    const templates = results.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      methodology: row.methodology,
      structure: JSON.parse(row.structure || '{}'),
      defaultObjectives: JSON.parse(row.default_objectives || '[]'),
      suggestedLiterature: JSON.parse(row.suggested_literature || '[]'),
      estimatedDurationDays: row.estimated_duration_days,
      difficultyLevel: row.difficulty_level,
      usageCount: row.usage_count,
      isFeatured: !!row.is_featured,
      createdBy: row.creatorName,
      createdAt: row.created_at
    }));

    return c.json({ items: templates });
  } catch (error) {
    console.error('Error getting templates:', error);
    return c.json({ error: 'Failed to get templates' }, 500);
  }
});

// GET /research/templates/:id - Get template details
researchRoutes.get('/templates/:id', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const templateId = c.req.param('id');

    const template = await DB.prepare(`
      SELECT t.*, u.displayName as creatorName
      FROM research_templates t
      LEFT JOIN users u ON t.created_by_id = u.id
      WHERE t.id = ?
    `).bind(templateId).first<any>();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    return c.json({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      methodology: template.methodology,
      structure: JSON.parse(template.structure || '{}'),
      defaultObjectives: JSON.parse(template.default_objectives || '[]'),
      suggestedLiterature: JSON.parse(template.suggested_literature || '[]'),
      estimatedDurationDays: template.estimated_duration_days,
      difficultyLevel: template.difficulty_level,
      usageCount: template.usage_count,
      isFeatured: !!template.is_featured,
      createdBy: template.creatorName,
      createdAt: template.created_at
    });
  } catch (error) {
    console.error('Error getting template:', error);
    return c.json({ error: 'Failed to get template' }, 500);
  }
});

// POST /research/templates/:id/use - Create project from template
researchRoutes.post('/templates/:id/use', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const templateId = c.req.param('id');
    const { title, researchQuestion, description } = await c.req.json();

    const template = await DB.prepare(`
      SELECT * FROM research_templates WHERE id = ?
    `).bind(templateId).first<any>();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    const structure = JSON.parse(template.structure || '{}');
    const defaultObjectives = JSON.parse(template.default_objectives || '[]');

    // Create project
    const projectId = generateId();
    await DB.prepare(`
      INSERT INTO research_projects (
        id, title, research_question, description, category, methodology,
        objectives, status, phase, progress, is_public,
        created_by_id, team_lead_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 'planning', 0, 0, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      projectId,
      title,
      researchQuestion,
      description || template.description,
      template.category,
      template.methodology,
      JSON.stringify(defaultObjectives),
      userId,
      userId
    ).run();

    // Create default milestones from template
    if (structure.milestones && Array.isArray(structure.milestones)) {
      const baseDuration = template.estimated_duration_days || 90;
      const milestoneInterval = Math.floor(baseDuration / structure.milestones.length);

      for (let i = 0; i < structure.milestones.length; i++) {
        const milestoneId = generateId();
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + (milestoneInterval * (i + 1)));

        await DB.prepare(`
          INSERT INTO research_milestones (
            id, project_id, title, milestone_type, target_date, status, priority, created_by_id
          ) VALUES (?, ?, ?, 'custom', ?, 'pending', ?, ?)
        `).bind(
          milestoneId,
          projectId,
          structure.milestones[i],
          targetDate.toISOString().split('T')[0],
          i,
          userId
        ).run();
      }
    }

    // Increment template usage
    await DB.prepare(`
      UPDATE research_templates SET usage_count = usage_count + 1 WHERE id = ?
    `).bind(templateId).run();

    return c.json({ id: projectId, message: 'Project created from template' }, 201);
  } catch (error) {
    console.error('Error creating from template:', error);
    return c.json({ error: 'Failed to create project from template' }, 500);
  }
});

// GET /research/projects/:id/milestones - Get project milestones
researchRoutes.get('/projects/:id/milestones', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT m.*,
             u.displayName as assigneeName, u.avatar as assigneeAvatar,
             c.displayName as creatorName
      FROM research_milestones m
      LEFT JOIN users u ON m.assigned_to_id = u.id
      LEFT JOIN users c ON m.created_by_id = c.id
      WHERE m.project_id = ?
      ORDER BY m.priority ASC, m.target_date ASC
    `).bind(projectId).all();

    const milestones = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      description: row.description,
      milestoneType: row.milestone_type,
      targetDate: row.target_date,
      completedDate: row.completed_date,
      status: row.status,
      priority: row.priority,
      assignedTo: row.assigned_to_id ? {
        id: row.assigned_to_id,
        displayName: row.assigneeName,
        avatar: row.assigneeAvatar
      } : null,
      dependencies: JSON.parse(row.dependencies || '[]'),
      deliverables: JSON.parse(row.deliverables || '[]'),
      notes: row.notes,
      createdBy: row.creatorName,
      createdAt: row.created_at
    }));

    return c.json({ items: milestones });
  } catch (error) {
    console.error('Error getting milestones:', error);
    return c.json({ error: 'Failed to get milestones' }, 500);
  }
});

// POST /research/projects/:id/milestones - Create milestone
researchRoutes.post('/projects/:id/milestones', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { title, description, milestoneType, targetDate, assignedToId, deliverables, dependencies } = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get max priority
    const maxPriority = await DB.prepare(`
      SELECT MAX(priority) as max FROM research_milestones WHERE project_id = ?
    `).bind(projectId).first<{ max: number }>();

    const milestoneId = generateId();
    await DB.prepare(`
      INSERT INTO research_milestones (
        id, project_id, title, description, milestone_type, target_date,
        status, priority, assigned_to_id, deliverables, dependencies, created_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).bind(
      milestoneId,
      projectId,
      title,
      description || null,
      milestoneType || 'custom',
      targetDate || null,
      (maxPriority?.max || 0) + 1,
      assignedToId || null,
      JSON.stringify(deliverables || []),
      JSON.stringify(dependencies || []),
      userId
    ).run();

    return c.json({ id: milestoneId, message: 'Milestone created successfully' }, 201);
  } catch (error) {
    console.error('Error creating milestone:', error);
    return c.json({ error: 'Failed to create milestone' }, 500);
  }
});

// PUT /research/projects/:id/milestones/:milestoneId - Update milestone
researchRoutes.put('/projects/:id/milestones/:milestoneId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const milestoneId = c.req.param('milestoneId');
    const updates = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
      if (updates.status === 'completed') {
        fields.push('completed_date = datetime("now")');
        // Log team activity
        await logTeamActivity(DB, projectId, userId, 'milestone_completed', 'milestone', milestoneId, updates.title);
        // Notify team members about milestone completion
        try {
          const sender = await DB.prepare(`SELECT displayName FROM users WHERE id = ?`).bind(userId).first<{ displayName: string }>();
          const senderName = sender?.displayName || 'A team member';
          await notifyTeamMembers(DB, projectId, userId, {
            type: 'research_milestone_completed',
            title: 'Milestone completed',
            message: `${senderName} completed milestone: ${updates.title || 'Untitled'}`,
            link: `/research/projects/${projectId}?tab=milestones`,
            actorId: userId,
            actorName: senderName,
            resourceId: milestoneId,
            resourceType: 'research_milestone',
          });
        } catch (e) {
          console.error('Error sending milestone notifications:', e);
        }
      }
    }
    if (updates.targetDate !== undefined) {
      fields.push('target_date = ?');
      values.push(updates.targetDate);
    }
    if (updates.assignedToId !== undefined) {
      fields.push('assigned_to_id = ?');
      values.push(updates.assignedToId);
    }
    if (updates.deliverables !== undefined) {
      fields.push('deliverables = ?');
      values.push(JSON.stringify(updates.deliverables));
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }

    fields.push('updated_at = datetime("now")');
    values.push(milestoneId);

    await DB.prepare(`
      UPDATE research_milestones SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({ message: 'Milestone updated successfully' });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return c.json({ error: 'Failed to update milestone' }, 500);
  }
});

// DELETE /research/projects/:id/milestones/:milestoneId - Delete milestone
researchRoutes.delete('/projects/:id/milestones/:milestoneId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const milestoneId = c.req.param('milestoneId');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await DB.prepare(`DELETE FROM research_milestones WHERE id = ? AND project_id = ?`)
      .bind(milestoneId, projectId).run();

    return c.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return c.json({ error: 'Failed to delete milestone' }, 500);
  }
});

// GET /research/projects/:id/analytics - Get project analytics
researchRoutes.get('/projects/:id/analytics', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    // Get project details
    const project = await DB.prepare(`
      SELECT * FROM research_projects WHERE id = ?
    `).bind(projectId).first<any>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get various counts
    const [notes, citations, discussions, reviews, literature, insights, briefs, milestones, activities] = await Promise.all([
      DB.prepare(`SELECT COUNT(*) as count FROM research_notes WHERE project_id = ?`).bind(projectId).first<{ count: number }>(),
      DB.prepare(`SELECT COUNT(*) as count FROM research_citations WHERE project_id = ?`).bind(projectId).first<{ count: number }>(),
      DB.prepare(`SELECT COUNT(*) as count FROM research_discussions WHERE project_id = ?`).bind(projectId).first<{ count: number }>(),
      DB.prepare(`SELECT COUNT(*) as count FROM research_reviews WHERE project_id = ?`).bind(projectId).first<{ count: number }>(),
      DB.prepare(`SELECT COUNT(*) as count FROM research_literature WHERE project_id = ?`).bind(projectId).first<{ count: number }>(),
      DB.prepare(`SELECT COUNT(*) as count FROM research_insights WHERE project_id = ?`).bind(projectId).first<{ count: number }>(),
      DB.prepare(`SELECT COUNT(*) as count FROM research_briefs WHERE project_id = ?`).bind(projectId).first<{ count: number }>(),
      DB.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM research_milestones WHERE project_id = ?`).bind(projectId).first<{ total: number; completed: number }>(),
      DB.prepare(`SELECT COUNT(*) as count FROM research_team_activities WHERE project_id = ? AND created_at >= datetime('now', '-7 days')`).bind(projectId).first<{ count: number }>()
    ]);

    // Get contribution breakdown by user
    const { results: contributors } = await DB.prepare(`
      SELECT ta.user_id, u.displayName, u.avatar, COUNT(*) as contributions
      FROM research_team_activities ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.project_id = ?
      GROUP BY ta.user_id
      ORDER BY contributions DESC
      LIMIT 10
    `).bind(projectId).all();

    // Get activity over time (last 30 days)
    const { results: activityTimeline } = await DB.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM research_team_activities
      WHERE project_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).bind(projectId).all();

    // Calculate days since creation
    const createdDate = new Date(project.created_at);
    const daysActive = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate milestone progress
    const milestoneProgress = milestones?.total ? Math.round((milestones.completed / milestones.total) * 100) : 0;

    return c.json({
      projectId,
      metrics: {
        notes: notes?.count || 0,
        citations: citations?.count || 0,
        discussions: discussions?.count || 0,
        reviews: reviews?.count || 0,
        literature: literature?.count || 0,
        insights: insights?.count || 0,
        briefs: briefs?.count || 0,
        milestones: {
          total: milestones?.total || 0,
          completed: milestones?.completed || 0,
          progress: milestoneProgress
        },
        recentActivity: activities?.count || 0,
        daysActive,
        completionPercentage: project.progress || 0
      },
      contributors: contributors.map((c: any) => ({
        userId: c.user_id,
        displayName: c.displayName,
        avatar: c.avatar,
        contributions: c.contributions
      })),
      activityTimeline: activityTimeline.map((a: any) => ({
        date: a.date,
        count: a.count
      }))
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return c.json({ error: 'Failed to get analytics' }, 500);
  }
});

// POST /research/projects/:id/exports - Generate export, store in R2
researchRoutes.post('/projects/:id/exports', requireAuth, async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { exportType, formatStyle, title, contentSections, includeCitations, includeAppendices } = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get project details
    const project = await DB.prepare(`
      SELECT p.*, u.displayName as teamLeadName
      FROM research_projects p
      LEFT JOIN users u ON p.team_lead_id = u.id
      WHERE p.id = ?
    `).bind(projectId).first<any>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Gather all project data
    const { results: notes } = await DB.prepare(`
      SELECT * FROM research_notes WHERE project_id = ? ORDER BY note_type, created_at
    `).bind(projectId).all();

    const { results: citations } = await DB.prepare(`
      SELECT * FROM research_citations WHERE project_id = ? ORDER BY citation_key
    `).bind(projectId).all();

    const { results: insights } = await DB.prepare(`
      SELECT * FROM research_insights WHERE project_id = ? ORDER BY priority DESC
    `).bind(projectId).all();

    const { results: briefs } = await DB.prepare(`
      SELECT * FROM research_briefs WHERE project_id = ? ORDER BY created_at DESC
    `).bind(projectId).all();

    const { results: literature } = await DB.prepare(`
      SELECT * FROM research_literature WHERE project_id = ? ORDER BY created_at
    `).bind(projectId).all();

    const { results: milestones } = await DB.prepare(`
      SELECT * FROM research_milestones WHERE project_id = ? ORDER BY target_date
    `).bind(projectId).all();

    const projectData = { project, notes, citations, insights, briefs, literature, milestones };
    const options = {
      exportType: exportType || 'markdown',
      formatStyle: formatStyle || 'apa',
      contentSections: contentSections || ['overview', 'methodology', 'findings', 'conclusions'],
      includeCitations: !!includeCitations,
      includeAppendices: !!includeAppendices,
    };

    // Generate content
    const markdownContent = generateExportContent(projectData, options);
    let finalContent: string;
    let contentType: string;
    let ext: string;

    if (options.exportType === 'html') {
      finalContent = markdownToHtml(markdownContent);
      contentType = 'text/html';
      ext = 'html';
    } else {
      finalContent = markdownContent;
      contentType = 'text/markdown';
      ext = 'md';
    }

    const exportId = generateId();
    const r2Key = `research-exports/${projectId}/${exportId}.${ext}`;
    const fileSize = new TextEncoder().encode(finalContent).length;

    // Store in R2
    await DOCUMENTS.put(r2Key, finalContent, {
      httpMetadata: { contentType },
      customMetadata: { projectId, exportId, generatedBy: userId },
    });

    // Save export record
    await DB.prepare(`
      INSERT INTO research_exports (
        id, project_id, export_type, format_style, title, content_sections,
        include_citations, include_appendices, file_url, file_size, status, generated_by_id, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, datetime('now'))
    `).bind(
      exportId,
      projectId,
      options.exportType,
      options.formatStyle,
      title || project.title,
      JSON.stringify(options.contentSections),
      options.includeCitations ? 1 : 0,
      options.includeAppendices ? 1 : 0,
      r2Key,
      fileSize,
      userId
    ).run();

    // Record contribution
    await DB.prepare(`
      INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, contribution_count, points_earned)
      VALUES (?, ?, ?, date('now'), 'export_generated', 1, 3)
    `).bind(generateId(), projectId, userId).run();

    await logActivity(DB, projectId, userId, 'export_generated', `Generated ${options.exportType} export`);

    return c.json({
      id: exportId,
      r2Key,
      fileSize,
      format: options.exportType,
      message: 'Export generated and stored successfully'
    }, 201);
  } catch (error) {
    console.error('Error generating export:', error);
    return c.json({ error: 'Failed to generate export' }, 500);
  }
});

// GET /research/projects/:id/exports/:exportId/download - Download export file from R2
researchRoutes.get('/projects/:id/exports/:exportId/download', optionalAuth, async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');
    const exportId = c.req.param('exportId');

    // Check project access
    const project = await DB.prepare(`SELECT id, visibility FROM research_projects WHERE id = ?`).bind(projectId).first<any>();
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    if (project.visibility !== 'public') {
      if (userId === 'guest') return c.json({ error: 'Authentication required' }, 401);
      const isMember = await isProjectMember(DB, projectId, userId);
      if (!isMember) return c.json({ error: 'Access denied' }, 403);
    }

    // Get export record
    const exportRecord = await DB.prepare(`
      SELECT * FROM research_exports WHERE id = ? AND project_id = ?
    `).bind(exportId, projectId).first<any>();

    if (!exportRecord || !exportRecord.file_url) {
      return c.json({ error: 'Export not found' }, 404);
    }

    const object = await DOCUMENTS.get(exportRecord.file_url);
    if (!object) {
      return c.json({ error: 'Export file not found in storage' }, 404);
    }

    const headers = new Headers();
    const ext = exportRecord.export_type === 'html' ? 'html' : 'md';
    const fileName = `${(exportRecord.title || 'export').replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    if (exportRecord.file_size) headers.set('Content-Length', String(exportRecord.file_size));

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error downloading export:', error);
    return c.json({ error: 'Failed to download export' }, 500);
  }
});

// POST /research/projects/:id/attachments - Upload file attachment
researchRoutes.post('/projects/:id/attachments', requireAuth, async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | null;
    const category = (formData.get('category') as string) || 'general';

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // 50MB limit
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return c.json({ error: 'File too large. Maximum size is 50MB.' }, 400);
    }

    const validCategories = ['general', 'data', 'survey', 'instrument', 'literature', 'report', 'image', 'other'];
    if (!validCategories.includes(category)) {
      return c.json({ error: 'Invalid category' }, 400);
    }

    const attachmentId = generateId();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `research-files/${projectId}/${attachmentId}-${safeFileName}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await DOCUMENTS.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: { projectId, uploadedBy: userId, originalName: file.name },
    });

    // Save record
    await DB.prepare(`
      INSERT INTO research_attachments (id, project_id, uploaded_by_id, file_name, file_type, file_size, r2_key, description, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      attachmentId, projectId, userId, file.name, file.type || 'application/octet-stream',
      file.size, r2Key, description || null, category
    ).run();

    // Record contribution
    await DB.prepare(`
      INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, contribution_count, points_earned)
      VALUES (?, ?, ?, date('now'), 'file_uploaded', 1, 2)
    `).bind(generateId(), projectId, userId).run();

    await logActivity(DB, projectId, userId, 'file_uploaded', `Uploaded file: ${file.name}`);

    return c.json({
      id: attachmentId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      category,
      message: 'File uploaded successfully'
    }, 201);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return c.json({ error: 'Failed to upload attachment' }, 500);
  }
});

// GET /research/projects/:id/attachments - List attachments
researchRoutes.get('/projects/:id/attachments', optionalAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    // Check project access
    const project = await DB.prepare(`SELECT id, visibility FROM research_projects WHERE id = ?`).bind(projectId).first<any>();
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    if (project.visibility !== 'public') {
      if (userId === 'guest') return c.json({ error: 'Authentication required' }, 401);
      const isMember = await isProjectMember(DB, projectId, userId);
      if (!isMember) return c.json({ error: 'Access denied' }, 403);
    }

    const { results } = await DB.prepare(`
      SELECT a.*, u.displayName as uploaderName, u.avatar as uploaderAvatar
      FROM research_attachments a
      LEFT JOIN users u ON a.uploaded_by_id = u.id
      WHERE a.project_id = ?
      ORDER BY a.created_at DESC
    `).bind(projectId).all();

    const attachments = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: row.file_size,
      description: row.description,
      category: row.category,
      uploadedBy: {
        id: row.uploaded_by_id,
        displayName: row.uploaderName,
        avatar: row.uploaderAvatar,
      },
      createdAt: row.created_at,
    }));

    return c.json({ items: attachments });
  } catch (error) {
    console.error('Error listing attachments:', error);
    return c.json({ error: 'Failed to list attachments' }, 500);
  }
});

// GET /research/projects/:id/attachments/:attachmentId/download - Download attachment from R2
researchRoutes.get('/projects/:id/attachments/:attachmentId/download', optionalAuth, async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');
    const attachmentId = c.req.param('attachmentId');

    // Check project access
    const project = await DB.prepare(`SELECT id, visibility FROM research_projects WHERE id = ?`).bind(projectId).first<any>();
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    if (project.visibility !== 'public') {
      if (userId === 'guest') return c.json({ error: 'Authentication required' }, 401);
      const isMember = await isProjectMember(DB, projectId, userId);
      if (!isMember) return c.json({ error: 'Access denied' }, 403);
    }

    const attachment = await DB.prepare(`
      SELECT * FROM research_attachments WHERE id = ? AND project_id = ?
    `).bind(attachmentId, projectId).first<any>();

    if (!attachment) {
      return c.json({ error: 'Attachment not found' }, 404);
    }

    const object = await DOCUMENTS.get(attachment.r2_key);
    if (!object) {
      return c.json({ error: 'File not found in storage' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || attachment.file_type || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
    if (attachment.file_size) headers.set('Content-Length', String(attachment.file_size));

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return c.json({ error: 'Failed to download attachment' }, 500);
  }
});

// DELETE /research/projects/:id/attachments/:attachmentId - Delete attachment
researchRoutes.delete('/projects/:id/attachments/:attachmentId', requireAuth, async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const attachmentId = c.req.param('attachmentId');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const attachment = await DB.prepare(`
      SELECT * FROM research_attachments WHERE id = ? AND project_id = ?
    `).bind(attachmentId, projectId).first<any>();

    if (!attachment) {
      return c.json({ error: 'Attachment not found' }, 404);
    }

    // Delete from R2
    await DOCUMENTS.delete(attachment.r2_key);

    // Delete from DB
    await DB.prepare(`DELETE FROM research_attachments WHERE id = ?`).bind(attachmentId).run();

    await logActivity(DB, projectId, userId, 'file_deleted', `Deleted file: ${attachment.file_name}`);

    return c.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return c.json({ error: 'Failed to delete attachment' }, 500);
  }
});

// GET /research/projects/:id/contributions - Get contribution summary per user
researchRoutes.get('/projects/:id/contributions', optionalAuth, async (c: AppContext) => {
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

// GET /research/projects/:id/exports - Get project exports
researchRoutes.get('/projects/:id/exports', optionalAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');

    // Check project access
    const project = await DB.prepare('SELECT visibility, created_by_id FROM research_projects WHERE id = ?').bind(projectId).first<any>();
    if (!project) return c.json({ error: 'Project not found' }, 404);
    if (project.visibility !== 'public' && userId !== 'guest') {
      const isMember = await isProjectMember(DB, projectId, userId);
      if (!isMember) return c.json({ error: 'Access denied' }, 403);
    } else if (project.visibility !== 'public' && userId === 'guest') {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { results } = await DB.prepare(`
      SELECT e.*, u.displayName as generatedByName
      FROM research_exports e
      LEFT JOIN users u ON e.generated_by_id = u.id
      WHERE e.project_id = ?
      ORDER BY e.created_at DESC
    `).bind(projectId).all();

    const exports = results.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      exportType: row.export_type,
      formatStyle: row.format_style,
      title: row.title,
      contentSections: JSON.parse(row.content_sections || '[]'),
      includeCitations: !!row.include_citations,
      includeAppendices: !!row.include_appendices,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      status: row.status,
      generatedBy: row.generatedByName,
      generatedAt: row.generated_at,
      createdAt: row.created_at
    }));

    return c.json({ items: exports });
  } catch (error) {
    console.error('Error getting exports:', error);
    return c.json({ error: 'Failed to get exports' }, 500);
  }
});

// GET /research/tags - Get popular research tags
researchRoutes.get('/tags', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const limit = parseInt(c.req.query('limit') || '50');

    const { results } = await DB.prepare(`
      SELECT * FROM research_tags ORDER BY usage_count DESC LIMIT ?
    `).bind(limit).all();

    const tags = results.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      color: row.color,
      usageCount: row.usage_count
    }));

    return c.json({ items: tags });
  } catch (error) {
    console.error('Error getting tags:', error);
    return c.json({ error: 'Failed to get tags' }, 500);
  }
});

// POST /research/projects/:id/tags - Add tag to project
researchRoutes.post('/projects/:id/tags', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { tagName, tagId } = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    let finalTagId = tagId;

    // Create tag if it doesn't exist
    if (!tagId && tagName) {
      const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const existingTag = await DB.prepare(`
        SELECT id FROM research_tags WHERE slug = ?
      `).bind(slug).first<{ id: string }>();

      if (existingTag) {
        finalTagId = existingTag.id;
      } else {
        finalTagId = generateId();
        await DB.prepare(`
          INSERT INTO research_tags (id, name, slug) VALUES (?, ?, ?)
        `).bind(finalTagId, tagName, slug).run();
      }
    }

    // Add tag to project
    try {
      await DB.prepare(`
        INSERT INTO research_project_tags (project_id, tag_id) VALUES (?, ?)
      `).bind(projectId, finalTagId).run();

      // Increment usage count
      await DB.prepare(`
        UPDATE research_tags SET usage_count = usage_count + 1 WHERE id = ?
      `).bind(finalTagId).run();
    } catch (e) {
      // Already exists, ignore
    }

    return c.json({ tagId: finalTagId, message: 'Tag added successfully' }, 201);
  } catch (error) {
    console.error('Error adding tag:', error);
    return c.json({ error: 'Failed to add tag' }, 500);
  }
});

// DELETE /research/projects/:id/tags/:tagId - Remove tag from project
researchRoutes.delete('/projects/:id/tags/:tagId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const tagId = c.req.param('tagId');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await DB.prepare(`
      DELETE FROM research_project_tags WHERE project_id = ? AND tag_id = ?
    `).bind(projectId, tagId).run();

    // Decrement usage count
    await DB.prepare(`
      UPDATE research_tags SET usage_count = MAX(0, usage_count - 1) WHERE id = ?
    `).bind(tagId).run();

    return c.json({ message: 'Tag removed successfully' });
  } catch (error) {
    console.error('Error removing tag:', error);
    return c.json({ error: 'Failed to remove tag' }, 500);
  }
});

// GET /research/projects/:id/tags - Get project tags
researchRoutes.get('/projects/:id/tags', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT t.*
      FROM research_tags t
      JOIN research_project_tags pt ON t.id = pt.tag_id
      WHERE pt.project_id = ?
      ORDER BY t.name
    `).bind(projectId).all();

    const tags = results.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      color: row.color
    }));

    return c.json({ items: tags });
  } catch (error) {
    console.error('Error getting project tags:', error);
    return c.json({ error: 'Failed to get project tags' }, 500);
  }
});

// ============================================================================
// FTS5 Full-Text Search
// ============================================================================

// GET /research/search - Full-text search across projects, notes, literature
researchRoutes.get('/search', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const q = (c.req.query('q') || '').trim();
    const type = c.req.query('type') || 'all';
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

    if (q.length < 2) {
      return c.json({ error: 'Search query must be at least 2 characters' }, 400);
    }

    // Sanitize for FTS5: strip double-quotes, wrap each term in quotes with wildcard
    const ftsQuery = q.split(/\s+/).map(term => '"' + term.replace(/"/g, '') + '"*').join(' ');

    const results: { projects: any[]; notes: any[]; literature: any[] } = {
      projects: [],
      notes: [],
      literature: [],
    };

    // Search projects
    if (type === 'all' || type === 'projects') {
      try {
        const { results: projectResults } = await DB.prepare(`
          SELECT p.id, p.title, p.description, p.status, p.category, p.is_public, p.created_by_id,
            snippet(research_projects_fts, 1, '<mark>', '</mark>', '...', 40) as matchSnippet
          FROM research_projects_fts
          JOIN research_projects p ON p.id = research_projects_fts.id
          WHERE research_projects_fts MATCH ?
            AND (p.is_public = 1 OR p.created_by_id = ? OR p.team_lead_id = ? OR EXISTS (
              SELECT 1 FROM research_team_members tm WHERE tm.project_id = p.id AND tm.user_id = ?
            ))
          LIMIT ?
        `).bind(ftsQuery, userId, userId, userId, limit).all();

        results.projects = projectResults.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          category: row.category,
          isPublic: !!row.is_public,
          matchSnippet: row.matchSnippet,
          type: 'project',
        }));
      } catch (ftsError) {
        // FTS table may not exist; fall back to LIKE
        console.warn('FTS5 project search failed, falling back to LIKE:', ftsError);
        const likeQuery = `%${q}%`;
        const { results: projectResults } = await DB.prepare(`
          SELECT id, title, description, status, category, is_public, created_by_id
          FROM research_projects
          WHERE (title LIKE ? OR description LIKE ?)
            AND (is_public = 1 OR created_by_id = ? OR team_lead_id = ? OR EXISTS (
              SELECT 1 FROM research_team_members tm WHERE tm.project_id = research_projects.id AND tm.user_id = ?
            ))
          LIMIT ?
        `).bind(likeQuery, likeQuery, userId, userId, userId, limit).all();

        results.projects = projectResults.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          category: row.category,
          isPublic: !!row.is_public,
          matchSnippet: null,
          type: 'project',
        }));
      }
    }

    // Search notes
    if (type === 'all' || type === 'notes') {
      try {
        const { results: noteResults } = await DB.prepare(`
          SELECT n.id, n.project_id, n.title, n.note_type, n.created_at,
            snippet(research_notes_fts, 2, '<mark>', '</mark>', '...', 40) as matchSnippet
          FROM research_notes_fts
          JOIN research_notes n ON n.id = research_notes_fts.id
          JOIN research_projects p ON n.project_id = p.id
          WHERE research_notes_fts MATCH ?
            AND (p.is_public = 1 OR p.created_by_id = ? OR p.team_lead_id = ? OR EXISTS (
              SELECT 1 FROM research_team_members tm WHERE tm.project_id = p.id AND tm.user_id = ?
            ))
          LIMIT ?
        `).bind(ftsQuery, userId, userId, userId, limit).all();

        results.notes = noteResults.map((row: any) => ({
          id: row.id,
          projectId: row.project_id,
          title: row.title,
          noteType: row.note_type,
          createdAt: row.created_at,
          matchSnippet: row.matchSnippet,
          type: 'note',
        }));
      } catch (ftsError) {
        console.warn('FTS5 notes search failed, falling back to LIKE:', ftsError);
        const likeQuery = `%${q}%`;
        const { results: noteResults } = await DB.prepare(`
          SELECT n.id, n.project_id, n.title, n.note_type, n.created_at
          FROM research_notes n
          JOIN research_projects p ON n.project_id = p.id
          WHERE (n.title LIKE ? OR n.content LIKE ?)
            AND (p.is_public = 1 OR p.created_by_id = ? OR p.team_lead_id = ? OR EXISTS (
              SELECT 1 FROM research_team_members tm WHERE tm.project_id = p.id AND tm.user_id = ?
            ))
          LIMIT ?
        `).bind(likeQuery, likeQuery, userId, userId, userId, limit).all();

        results.notes = noteResults.map((row: any) => ({
          id: row.id,
          projectId: row.project_id,
          title: row.title,
          noteType: row.note_type,
          createdAt: row.created_at,
          matchSnippet: null,
          type: 'note',
        }));
      }
    }

    // Search literature
    if (type === 'all' || type === 'literature') {
      try {
        const { results: litResults } = await DB.prepare(`
          SELECT l.id, l.project_id, l.external_title, l.authors, l.source_type, l.publication_year,
            snippet(research_literature_fts, 2, '<mark>', '</mark>', '...', 40) as matchSnippet
          FROM research_literature_fts
          JOIN research_literature l ON l.id = research_literature_fts.id
          JOIN research_projects p ON l.project_id = p.id
          WHERE research_literature_fts MATCH ?
            AND (p.is_public = 1 OR p.created_by_id = ? OR p.team_lead_id = ? OR EXISTS (
              SELECT 1 FROM research_team_members tm WHERE tm.project_id = p.id AND tm.user_id = ?
            ))
          LIMIT ?
        `).bind(ftsQuery, userId, userId, userId, limit).all();

        results.literature = litResults.map((row: any) => ({
          id: row.id,
          projectId: row.project_id,
          externalTitle: row.external_title,
          authors: row.authors,
          sourceType: row.source_type,
          publicationYear: row.publication_year,
          matchSnippet: row.matchSnippet,
          type: 'literature',
        }));
      } catch (ftsError) {
        console.warn('FTS5 literature search failed, falling back to LIKE:', ftsError);
        const likeQuery = `%${q}%`;
        const { results: litResults } = await DB.prepare(`
          SELECT l.id, l.project_id, l.external_title, l.authors, l.source_type, l.publication_year
          FROM research_literature l
          JOIN research_projects p ON l.project_id = p.id
          WHERE (l.external_title LIKE ? OR l.authors LIKE ? OR l.abstract LIKE ?)
            AND (p.is_public = 1 OR p.created_by_id = ? OR p.team_lead_id = ? OR EXISTS (
              SELECT 1 FROM research_team_members tm WHERE tm.project_id = p.id AND tm.user_id = ?
            ))
          LIMIT ?
        `).bind(likeQuery, likeQuery, likeQuery, userId, userId, userId, limit).all();

        results.literature = litResults.map((row: any) => ({
          id: row.id,
          projectId: row.project_id,
          externalTitle: row.external_title,
          authors: row.authors,
          sourceType: row.source_type,
          publicationYear: row.publication_year,
          matchSnippet: null,
          type: 'literature',
        }));
      }
    }

    const totalResults = results.projects.length + results.notes.length + results.literature.length;

    return c.json({
      query: q,
      totalResults,
      ...results,
    });
  } catch (error) {
    console.error('Error in search:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
});

// ============================================================================
// Advanced AI Endpoints
// ============================================================================

// POST /research/projects/:id/ai/literature-gaps - Analyze literature gaps
researchRoutes.post('/projects/:id/ai/literature-gaps', requireAuth, async (c: AppContext) => {
  try {
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { DB } = c.env;

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const result = await analyzeLiteratureGaps(c.env, projectId);

    await logActivity(DB, projectId, userId, 'ai_literature_gaps', 'Analyzed literature gaps via AI');

    return c.json(result);
  } catch (error) {
    console.error('Error analyzing literature gaps:', error);
    return c.json({ error: 'Failed to analyze literature gaps' }, 500);
  }
});

// POST /research/projects/:id/ai/refine-question - Refine research question
researchRoutes.post('/projects/:id/ai/refine-question', requireAuth, async (c: AppContext) => {
  try {
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { DB } = c.env;
    const { question, category, methodology } = await c.req.json();

    if (!question?.trim()) {
      return c.json({ error: 'Question is required' }, 400);
    }

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const result = await refineResearchQuestion(c.env, question, category, methodology);

    await logActivity(DB, projectId, userId, 'ai_refine_question', 'Refined research question via AI');

    return c.json(result);
  } catch (error) {
    console.error('Error refining question:', error);
    return c.json({ error: 'Failed to refine question' }, 500);
  }
});

// POST /research/projects/:id/ai/suggest-methodology - Suggest methodology
researchRoutes.post('/projects/:id/ai/suggest-methodology', requireAuth, async (c: AppContext) => {
  try {
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { DB } = c.env;
    const { question, category } = await c.req.json();

    if (!question?.trim()) {
      return c.json({ error: 'Question is required' }, 400);
    }

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const result = await suggestMethodology(c.env, question, category);

    await logActivity(DB, projectId, userId, 'ai_suggest_methodology', 'AI methodology suggestion');

    return c.json(result);
  } catch (error) {
    console.error('Error suggesting methodology:', error);
    return c.json({ error: 'Failed to suggest methodology' }, 500);
  }
});

// POST /research/projects/:id/ai/auto-tags - Generate auto-tags
researchRoutes.post('/projects/:id/ai/auto-tags', requireAuth, async (c: AppContext) => {
  try {
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { DB } = c.env;

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const tags = await generateAutoTags(c.env, projectId);

    await logActivity(DB, projectId, userId, 'ai_auto_tags', `Generated ${tags.length} auto-tags`);

    return c.json({ tags });
  } catch (error) {
    console.error('Error generating auto-tags:', error);
    return c.json({ error: 'Failed to generate auto-tags' }, 500);
  }
});

// GET /research/projects/:id/ai/cross-insights - Cross-project insights
researchRoutes.get('/projects/:id/ai/cross-insights', requireAuth, async (c: AppContext) => {
  try {
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { DB } = c.env;

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const insights = await crossProjectInsights(c.env, projectId);

    await logActivity(DB, projectId, userId, 'ai_cross_insights', `Found ${insights.length} cross-project insights`);

    return c.json({ insights });
  } catch (error) {
    console.error('Error finding cross-project insights:', error);
    return c.json({ error: 'Failed to find cross-project insights' }, 500);
  }
});

// ============================================================================
// Phase Approval Gate
// ============================================================================

// POST /research/projects/:id/phase-approval - Request phase approval
researchRoutes.post('/projects/:id/phase-approval', requireAuth, async (c: AppContext) => {
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
researchRoutes.put('/projects/:id/phase-approval/:approvalId', requireAuth, async (c: AppContext) => {
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
researchRoutes.get('/projects/:id/phase-approvals', async (c: AppContext) => {
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
researchRoutes.post('/projects/:id/ethics', requireAuth, async (c: AppContext) => {
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
researchRoutes.get('/projects/:id/ethics', async (c: AppContext) => {
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
researchRoutes.put('/projects/:id/ethics/:ethicsId', requireAuth, async (c: AppContext) => {
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
researchRoutes.get('/projects/:id/audit-trail/export', requireAuth, async (c: AppContext) => {
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
