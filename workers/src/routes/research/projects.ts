import { Hono } from 'hono';
import { generateId, requireAuth, isProjectMember, logActivity } from './helpers';
import type { Env, Variables, AppContext } from './helpers';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /research/projects - List research projects
router.get('/projects', async (c: AppContext) => {
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
router.get('/projects/:id', async (c: AppContext) => {
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
router.post('/projects', requireAuth, async (c: AppContext) => {
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
router.put('/projects/:id', requireAuth, async (c: AppContext) => {
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
router.delete('/projects/:id', requireAuth, async (c: AppContext) => {
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

// GET /research/projects/:id/comments - List project comments
router.get('/projects/:id/comments', async (c: AppContext) => {
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
router.post('/projects/:id/comments', requireAuth, async (c: AppContext) => {
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

// GET /research/projects/:id/activity - Get project activity
router.get('/projects/:id/activity', async (c: AppContext) => {
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
router.get('/dashboard', requireAuth, async (c: AppContext) => {
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

// GET /research/stats - Get global research statistics (admin)
router.get('/stats', async (c: AppContext) => {
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

// GET /research/projects/:id/analytics - Get project analytics
router.get('/projects/:id/analytics', async (c: AppContext) => {
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

export default router;
