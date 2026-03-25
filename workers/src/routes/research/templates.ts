import { Hono } from 'hono';
import { generateId, requireAuth } from './helpers';
import type { Env, Variables, AppContext } from './helpers';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /research/templates - Get research templates
router.get('/templates', async (c: AppContext) => {
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
router.get('/templates/:id', async (c: AppContext) => {
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
router.post('/templates/:id/use', requireAuth, async (c: AppContext) => {
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

export default router;
