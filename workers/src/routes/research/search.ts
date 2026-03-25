import { Hono } from 'hono';
import type { Env, Variables, AppContext } from './helpers';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /research/search - Full-text search across projects, notes, literature
router.get('/search', async (c: AppContext) => {
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

export default router;
