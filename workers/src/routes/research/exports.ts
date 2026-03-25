import { Hono } from 'hono';
import { generateExportContent, markdownToHtml } from '../../services/researchExport';
import { generateId, requireAuth, optionalAuth, isProjectMember, logActivity } from './helpers';
import type { Env, Variables, AppContext } from './helpers';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// POST /research/projects/:id/exports - Generate export, store in R2
router.post('/projects/:id/exports', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/exports/:exportId/download', optionalAuth, async (c: AppContext) => {
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

// GET /research/projects/:id/exports - Get project exports
router.get('/projects/:id/exports', optionalAuth, async (c: AppContext) => {
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

// POST /research/projects/:id/attachments - Upload file attachment
router.post('/projects/:id/attachments', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/attachments', optionalAuth, async (c: AppContext) => {
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
router.get('/projects/:id/attachments/:attachmentId/download', optionalAuth, async (c: AppContext) => {
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
router.delete('/projects/:id/attachments/:attachmentId', requireAuth, async (c: AppContext) => {
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

export default router;
