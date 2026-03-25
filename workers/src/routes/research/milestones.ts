import { Hono } from 'hono';
import { notifyTeamMembers } from '../../services/researchNotifications';
import { generateId, requireAuth, isProjectMember, logTeamActivity } from './helpers';
import type { Env, Variables, AppContext } from './helpers';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /research/projects/:id/milestones - Get project milestones
router.get('/projects/:id/milestones', async (c: AppContext) => {
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
router.post('/projects/:id/milestones', requireAuth, async (c: AppContext) => {
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
router.put('/projects/:id/milestones/:milestoneId', requireAuth, async (c: AppContext) => {
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
router.delete('/projects/:id/milestones/:milestoneId', requireAuth, async (c: AppContext) => {
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

// ============================================================================
// Tags
// ============================================================================

// GET /research/tags - Get popular research tags
router.get('/tags', async (c: AppContext) => {
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
router.post('/projects/:id/tags', requireAuth, async (c: AppContext) => {
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
router.delete('/projects/:id/tags/:tagId', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/tags', async (c: AppContext) => {
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

export default router;
