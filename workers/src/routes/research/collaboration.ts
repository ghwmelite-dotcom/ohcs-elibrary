import { Hono } from 'hono';
import { generateId, requireAuth, isProjectMember, logActivity, logTeamActivity } from './helpers';
import { notifyTeamMembers, notifyMentionedUsers } from '../../services/researchNotifications';
import type { Env, Variables, AppContext } from './helpers';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================================
// Team Members
// ============================================================================

// POST /research/projects/:id/members - Add team member
router.post('/projects/:id/members', requireAuth, async (c: AppContext) => {
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
router.delete('/projects/:id/members/:memberId', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/literature', async (c: AppContext) => {
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
router.post('/projects/:id/literature', requireAuth, async (c: AppContext) => {
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
router.delete('/projects/:id/literature/:litId', requireAuth, async (c: AppContext) => {
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
// Literature Annotations
// ============================================================================

// GET /research/literature/:id/annotations - Get annotations for literature
router.get('/literature/:id/annotations', async (c: AppContext) => {
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
router.post('/literature/:id/annotations', requireAuth, async (c: AppContext) => {
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
router.delete('/literature/:id/annotations/:annotationId', requireAuth, async (c: AppContext) => {
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
// Research Notes (Collaborative Documents)
// ============================================================================

// GET /research/projects/:id/notes - Get project notes
router.get('/projects/:id/notes', async (c: AppContext) => {
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
router.post('/projects/:id/notes', requireAuth, async (c: AppContext) => {
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
router.put('/projects/:id/notes/:noteId', requireAuth, async (c: AppContext) => {
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
router.delete('/projects/:id/notes/:noteId', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/notes/:noteId/versions', requireAuth, async (c: AppContext) => {
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
// Peer Review Workflow
// ============================================================================

// GET /research/projects/:id/reviews - Get project reviews
router.get('/projects/:id/reviews', async (c: AppContext) => {
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
router.post('/projects/:id/reviews', requireAuth, async (c: AppContext) => {
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
router.put('/projects/:id/reviews/:reviewId', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/reviews/:reviewId/comments', async (c: AppContext) => {
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
router.post('/projects/:id/reviews/:reviewId/comments', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/citations', async (c: AppContext) => {
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
router.post('/projects/:id/citations', requireAuth, async (c: AppContext) => {
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

      const response = await AI.run('@cf/meta/llama-3-8b-instruct', {
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
router.delete('/projects/:id/citations/:citationId', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/citations/export', async (c: AppContext) => {
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
router.get('/projects/:id/discussions', async (c: AppContext) => {
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
router.post('/projects/:id/discussions', requireAuth, async (c: AppContext) => {
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
router.get('/discussions/:id/replies', async (c: AppContext) => {
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
router.post('/discussions/:id/replies', requireAuth, async (c: AppContext) => {
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
router.put('/discussions/:id', requireAuth, async (c: AppContext) => {
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
router.post('/discussions/:id/replies/:replyId/reactions', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/team-activity', async (c: AppContext) => {
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

export default router;
