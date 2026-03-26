# Research Hub Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Research Hub with 6 major feature areas: fix exports, fix DB schema bugs, wire up contributions, add file uploads, add research notifications, add FTS5 search, add advanced AI features, add collaboration improvements, and add governance features.

**Architecture:** Backend is Hono.js on Cloudflare Workers with D1 (SQLite), R2 for object storage, KV for caching, and Workers AI for inference. Frontend is React + Zustand + Tailwind + Framer Motion. Notifications system already exists (`workers/src/routes/notifications.ts`) with full schema including `actorId`, `actorName`, `actorAvatar`, `resourceId`, `resourceType`. Export UI already exists (`src/components/research/ExportPanel.tsx`) and there is an existing `POST /projects/:id/export` endpoint at line 3566 that generates inline markdown — we will **replace** it with the new version that stores to R2 and records in DB. AI calls use `prompt` style (not `messages` array). All research tables use TEXT PRIMARY KEY (no integer rowid alias), which affects FTS5 strategy — we use standalone FTS tables (no content-sync) with manual INSERT/DELETE.

**Tech Stack:** Cloudflare Workers, D1/SQLite with FTS5, R2, Workers AI (QwQ-32B), Hono.js, React, Zustand, Tailwind CSS, jsPDF (already installed), Framer Motion

---

## File Map

### New Files
- `workers/src/services/researchExport.ts` — Export generation service (PDF/markdown/HTML)
- `workers/src/services/researchAI.ts` — Advanced AI features (gap analysis, question refinement, auto-tags, cross-project insights)
- `workers/src/services/researchNotifications.ts` — Research-specific notification helper
- `workers/migrations/035_research_hub_enhancements.sql` — Schema fixes + FTS5 + file attachments + new notification templates + phase approval
- `src/components/research/FileAttachments.tsx` — File upload/management UI
- `src/components/research/AdvancedAIPanel.tsx` — Advanced AI features UI
- `src/components/research/PhaseApprovalGate.tsx` — Phase approval UI
- ~~`src/components/research/MentionInput.tsx`~~ — removed (use staffId-based @mentions inline)

### Modified Files
- `workers/src/routes/research.ts` — Add export POST endpoint, file upload endpoints, AI endpoints, FTS5 search, phase approval, @mention support, contribution tracking
- `workers/src/config/aiModels.ts` — Add research AI analysis defaults
- `src/components/research/ExportPanel.tsx` — Wire up actual export generation + download
- `src/components/research/CollaborationPanel.tsx` — Add @mentions in discussions, review assignment
- `src/components/research/KofiChat.tsx` — Link to advanced AI panel
- `src/pages/ResearchProject.tsx` — Integrate new panels (files, AI, governance)
- `src/stores/researchStore.ts` — Add state for new features
- `src/types/index.ts` — Add new type definitions
- `README.md` — Document new features

---

## Task Group 1: Fix What's Broken (Schema + Exports + Contributions)

### Task 1.1: Database Migration — Schema Fixes + New Tables

**Files:**
- Create: `workers/migrations/035_research_hub_enhancements.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- ============================================
-- RESEARCH HUB ENHANCEMENTS
-- Migration: 035_research_hub_enhancements.sql
-- ============================================

-- 1. FTS5 standalone tables (NOT content-sync, since source tables use TEXT PRIMARY KEY)
-- These must be manually kept in sync via INSERT/DELETE in application code.
CREATE VIRTUAL TABLE IF NOT EXISTS research_projects_fts USING fts5(
  id UNINDEXED, title, research_question, hypothesis, methodology
);

CREATE VIRTUAL TABLE IF NOT EXISTS research_notes_fts USING fts5(
  id UNINDEXED, project_id UNINDEXED, title, content
);

CREATE VIRTUAL TABLE IF NOT EXISTS research_literature_fts USING fts5(
  id UNINDEXED, project_id UNINDEXED, external_title, external_authors, notes
);

-- Populate FTS tables from existing data
INSERT INTO research_projects_fts(id, title, research_question, hypothesis, methodology)
  SELECT id, title, COALESCE(research_question,''), COALESCE(hypothesis,''), COALESCE(methodology,'')
  FROM research_projects;

INSERT INTO research_notes_fts(id, project_id, title, content)
  SELECT id, project_id, COALESCE(title,''), COALESCE(content,'')
  FROM research_notes;

INSERT INTO research_literature_fts(id, project_id, external_title, external_authors, notes)
  SELECT id, project_id, COALESCE(external_title,''), COALESCE(external_authors,''), COALESCE(notes,'')
  FROM research_literature;

-- 2. Research file attachments table
CREATE TABLE IF NOT EXISTS research_attachments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  uploaded_by_id TEXT NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general', 'data', 'survey', 'instrument', 'literature', 'report', 'image', 'other'
  )),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_research_attachments_project ON research_attachments(project_id);

-- 3. Research notification templates
INSERT OR IGNORE INTO notification_templates (id, type, titleTemplate, messageTemplate, icon, color, defaultPriority) VALUES
  ('tpl-research-review-request', 'research_review_request', 'Review Requested', 'You have been asked to review a research project.', 'ClipboardCheck', '#8B5CF6', 'high'),
  ('tpl-research-review-complete', 'research_review_complete', 'Review Completed', 'A reviewer has completed their review of your project.', 'CheckCircle', '#10B981', 'normal'),
  ('tpl-research-discussion-reply', 'research_discussion_reply', 'New Discussion Reply', 'Someone replied to a research discussion.', 'MessageSquare', '#3B82F6', 'normal'),
  ('tpl-research-mention', 'research_mention', 'You Were Mentioned', 'You were mentioned in a research discussion.', 'AtSign', '#8B5CF6', 'normal'),
  ('tpl-research-milestone-due', 'research_milestone_due', 'Milestone Due Soon', 'A research milestone is approaching its deadline.', 'Clock', '#F59E0B', 'high'),
  ('tpl-research-phase-approval', 'research_phase_approval', 'Phase Approval Required', 'A project phase needs your approval to proceed.', 'ShieldCheck', '#006B3F', 'high'),
  ('tpl-research-phase-approved', 'research_phase_approved', 'Phase Approved', 'Your project phase has been approved.', 'CheckCircle', '#10B981', 'normal');

-- 4. Phase approval tracking
CREATE TABLE IF NOT EXISTS research_phase_approvals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  requested_by_id TEXT NOT NULL REFERENCES users(id),
  approved_by_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  requested_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_phase_approvals_project ON research_phase_approvals(project_id);

-- 5. Ethics approval tracking
CREATE TABLE IF NOT EXISTS research_ethics_approvals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  approval_body TEXT NOT NULL,
  reference_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'expired')),
  submitted_date TEXT,
  approval_date TEXT,
  expiry_date TEXT,
  conditions TEXT,
  document_r2_key TEXT,
  created_by_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ethics_approvals_project ON research_ethics_approvals(project_id);
```

- [ ] **Step 2: Verify migration syntax**

Run: `sqlite3 :memory: < workers/migrations/035_research_hub_enhancements.sql`
Expected: No errors (FTS5 may need Cloudflare runtime — verify syntax is correct)

- [ ] **Step 3: Commit**

```bash
git add workers/migrations/035_research_hub_enhancements.sql
git commit -m "feat(research): add migration for FTS5, attachments, phase approvals, ethics tracking"
```

---

### Task 1.2: Create Export Generation Service

**Files:**
- Create: `workers/src/services/researchExport.ts`

- [ ] **Step 1: Create the export service**

This service generates markdown content from project data and returns it. PDF generation happens client-side via jsPDF (already installed).

```typescript
// workers/src/services/researchExport.ts
/**
 * Research Export Generation Service
 * Compiles project data into structured markdown for export
 */

interface ExportOptions {
  exportType: 'markdown' | 'html' | 'pdf' | 'docx' | 'latex' | 'bibtex';
  formatStyle: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'custom';
  contentSections: string[];
  includeCitations: boolean;
  includeAppendices: boolean;
}

interface ProjectData {
  project: any;
  notes: any[];
  citations: any[];
  insights: any[];
  briefs: any[];
  literature: any[];
  milestones: any[];
}

export async function generateExportContent(
  data: ProjectData,
  options: ExportOptions
): Promise<{ content: string; title: string }> {
  const { project, notes, citations, insights, literature, milestones } = data;
  const sections: string[] = [];

  // Title page
  sections.push(`# ${project.title}\n`);
  sections.push(`**Research Question:** ${project.research_question || 'Not specified'}\n`);
  sections.push(`**Methodology:** ${project.methodology || 'Not specified'}\n`);
  sections.push(`**Category:** ${project.category}\n`);
  sections.push(`**Phase:** ${project.phase} | **Status:** ${project.status}\n`);
  sections.push('---\n');

  for (const section of options.contentSections) {
    switch (section) {
      case 'overview':
        sections.push('## Overview & Abstract\n');
        if (project.hypothesis) sections.push(`**Hypothesis:** ${project.hypothesis}\n`);
        if (project.objectives) {
          const objectives = JSON.parse(project.objectives || '[]');
          if (objectives.length > 0) {
            sections.push('**Objectives:**\n');
            objectives.forEach((obj: string) => sections.push(`- ${obj}\n`));
          }
        }
        sections.push('');
        break;

      case 'methodology':
        sections.push('## Methodology\n');
        sections.push(`${project.methodology || 'Not documented.'}\n`);
        const methodNotes = notes.filter((n: any) => n.note_type === 'methodology');
        methodNotes.forEach((n: any) => {
          sections.push(`### ${n.title}\n${n.content}\n`);
        });
        break;

      case 'findings':
        sections.push('## Findings\n');
        const findingNotes = notes.filter((n: any) => n.note_type === 'findings');
        findingNotes.forEach((n: any) => {
          sections.push(`### ${n.title}\n${n.content}\n`);
        });
        if (insights.length > 0) {
          sections.push('### Key Insights\n');
          insights.forEach((i: any) => {
            sections.push(`- **[${i.type}]** ${i.title}: ${i.content}\n`);
          });
        }
        break;

      case 'discussion':
        sections.push('## Discussion\n');
        const discussionNotes = notes.filter((n: any) => n.note_type === 'discussion');
        discussionNotes.forEach((n: any) => {
          sections.push(`### ${n.title}\n${n.content}\n`);
        });
        break;

      case 'conclusions':
        sections.push('## Conclusions\n');
        const conclusionNotes = notes.filter((n: any) => n.note_type === 'conclusion');
        conclusionNotes.forEach((n: any) => {
          sections.push(`### ${n.title}\n${n.content}\n`);
        });
        break;

      case 'insights':
        sections.push('## AI-Generated Insights\n');
        insights.forEach((i: any) => {
          sections.push(`### ${i.title}\n**Type:** ${i.type} | **Confidence:** ${(i.confidence * 100).toFixed(0)}%\n\n${i.content}\n`);
        });
        break;
    }
  }

  if (options.includeCitations && citations.length > 0) {
    sections.push('## References\n');
    citations.forEach((c: any) => {
      const formatted = formatCitation(c, options.formatStyle);
      sections.push(`- ${formatted}\n`);
    });
  }

  if (options.includeAppendices) {
    if (literature.length > 0) {
      sections.push('## Appendix A: Literature Sources\n');
      literature.forEach((l: any) => {
        sections.push(`- ${l.external_title || l.citation_key} — ${l.external_authors || 'Unknown'} (${l.external_year || 'n.d.'})\n`);
      });
    }
    if (milestones.length > 0) {
      sections.push('## Appendix B: Project Timeline\n');
      milestones.forEach((m: any) => {
        const status = m.status === 'completed' ? '[x]' : '[ ]';
        sections.push(`- ${status} **${m.title}** — Target: ${m.target_date || 'TBD'} | Status: ${m.status}\n`);
      });
    }
  }

  const content = sections.join('\n');
  return { content, title: project.title };
}

function formatCitation(citation: any, style: string): string {
  const authors = citation.authors || 'Unknown';
  const year = citation.year || 'n.d.';
  const title = citation.title || 'Untitled';
  const journal = citation.journal || '';

  switch (style) {
    case 'apa':
      return `${authors} (${year}). ${title}.${journal ? ` *${journal}*.` : ''}`;
    case 'mla':
      return `${authors}. "${title}."${journal ? ` *${journal}*,` : ''} ${year}.`;
    case 'chicago':
      return `${authors}. "${title}."${journal ? ` *${journal}*` : ''} (${year}).`;
    case 'harvard':
      return `${authors} (${year}) '${title}',${journal ? ` *${journal}*.` : ''}`;
    case 'ieee':
      return `${authors}, "${title},"${journal ? ` *${journal}*,` : ''} ${year}.`;
    default:
      return `${authors} (${year}). ${title}.`;
  }
}

export function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}
```

- [ ] **Step 2: Commit**

```bash
git add workers/src/services/researchExport.ts
git commit -m "feat(research): add export content generation service"
```

---

### Task 1.3: Add Export POST Endpoint + File Upload Endpoints

**Files:**
- Modify: `workers/src/routes/research.ts` (insert before line 3727, the GET exports endpoint)

- [ ] **Step 1: Add import at top of research.ts**

Add after the existing `AI_DEFAULTS` import:
```typescript
import { generateExportContent, markdownToHtml } from '../services/researchExport';
```

- [ ] **Step 2: REPLACE existing POST export endpoint** (delete the existing `POST /projects/:id/export` at line ~3566-3725 and replace with this new version that stores to R2 and records in DB)

```typescript
// POST /research/projects/:id/exports - Generate a new export
researchRoutes.post('/projects/:id/exports', requireAuth, async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { exportType = 'markdown', formatStyle = 'apa', contentSections = ['overview', 'findings', 'conclusions'], includeCitations = true, includeAppendices = false } = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) return c.json({ error: 'Access denied' }, 403);

    // Gather all project data
    const project = await DB.prepare('SELECT * FROM research_projects WHERE id = ?').bind(projectId).first();
    if (!project) return c.json({ error: 'Project not found' }, 404);

    const [notesResult, citationsResult, insightsResult, literatureResult, milestonesResult] = await Promise.all([
      DB.prepare('SELECT * FROM research_notes WHERE project_id = ? ORDER BY is_pinned DESC, created_at DESC').bind(projectId).all(),
      DB.prepare('SELECT * FROM research_citations WHERE project_id = ? ORDER BY created_at').bind(projectId).all(),
      DB.prepare('SELECT * FROM research_insights WHERE project_id = ? ORDER BY confidence DESC').bind(projectId).all(),
      DB.prepare('SELECT * FROM research_literature WHERE project_id = ? ORDER BY created_at').bind(projectId).all(),
      DB.prepare('SELECT * FROM research_milestones WHERE project_id = ? ORDER BY target_date').bind(projectId).all(),
    ]);

    const { content, title } = await generateExportContent(
      {
        project,
        notes: notesResult.results || [],
        citations: citationsResult.results || [],
        insights: insightsResult.results || [],
        briefs: [],
        literature: literatureResult.results || [],
        milestones: milestonesResult.results || [],
      },
      { exportType, formatStyle, contentSections, includeCitations, includeAppendices }
    );

    let finalContent = content;
    let fileSize = new TextEncoder().encode(content).length;

    if (exportType === 'html') {
      finalContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6}h1,h2,h3{color:#1a1a1a}hr{border:none;border-top:1px solid #ddd;margin:2rem 0}ul{padding-left:1.5rem}</style></head><body>${markdownToHtml(content)}</body></html>`;
      fileSize = new TextEncoder().encode(finalContent).length;
    }

    // Store in R2
    const r2Key = `research-exports/${projectId}/${generateId()}.${exportType === 'html' ? 'html' : 'md'}`;
    await DOCUMENTS.put(r2Key, finalContent, {
      customMetadata: { projectId, exportType, formatStyle, generatedBy: userId },
    });

    // Save export record
    const exportId = generateId();
    await DB.prepare(`
      INSERT INTO research_exports (id, project_id, export_type, format_style, title, content_sections, include_citations, include_appendices, file_url, file_size, status, generated_by_id, generated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, datetime('now'), datetime('now'))
    `).bind(exportId, projectId, exportType, formatStyle, `${title} (${exportType.toUpperCase()})`, JSON.stringify(contentSections), includeCitations ? 1 : 0, includeAppendices ? 1 : 0, r2Key, fileSize, userId).run();

    await logActivity(DB, projectId, userId, 'export_generated', `Generated ${exportType} export`);

    // Record contribution
    await DB.prepare(`
      INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, points_earned, created_at)
      VALUES (?, ?, ?, date('now'), 'brief_generated', 5, datetime('now'))
    `).bind(generateId(), projectId, userId).run();

    return c.json({
      id: exportId,
      content: finalContent,
      exportType,
      formatStyle,
      fileSize,
      status: 'completed',
      message: 'Export generated successfully'
    });
  } catch (error) {
    console.error('Error generating export:', error);
    return c.json({ error: 'Failed to generate export' }, 500);
  }
});

// GET /research/projects/:id/exports/:exportId/download - Download export file
researchRoutes.get('/projects/:id/exports/:exportId/download', async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');
    const exportId = c.req.param('exportId');

    // Check project access
    const project = await DB.prepare('SELECT is_public, created_by_id FROM research_projects WHERE id = ?').bind(projectId).first<any>();
    if (!project) return c.json({ error: 'Project not found' }, 404);
    if (!project.is_public && userId === 'guest') {
      const isMember = await isProjectMember(DB, projectId, userId);
      if (!isMember) return c.json({ error: 'Access denied' }, 403);
    }

    const exportRecord = await DB.prepare('SELECT * FROM research_exports WHERE id = ? AND project_id = ?').bind(exportId, projectId).first<any>();
    if (!exportRecord) return c.json({ error: 'Export not found' }, 404);

    const file = await DOCUMENTS.get(exportRecord.file_url);
    if (!file) return c.json({ error: 'File not found' }, 404);

    const contentType = exportRecord.export_type === 'html' ? 'text/html' : 'text/markdown';
    const ext = exportRecord.export_type === 'html' ? 'html' : 'md';

    return new Response(file.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${exportRecord.title}.${ext}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading export:', error);
    return c.json({ error: 'Failed to download export' }, 500);
  }
});
```

- [ ] **Step 3: Add file upload endpoints** (insert in the same area)

```typescript
// POST /research/projects/:id/attachments - Upload file attachment
researchRoutes.post('/projects/:id/attachments', requireAuth, async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) return c.json({ error: 'Access denied' }, 403);

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string || '';
    const category = formData.get('category') as string || 'general';

    if (!file) return c.json({ error: 'No file provided' }, 400);

    // 50MB limit
    if (file.size > 50 * 1024 * 1024) {
      return c.json({ error: 'File too large (max 50MB)' }, 400);
    }

    const r2Key = `research-files/${projectId}/${generateId()}-${file.name}`;
    await DOCUMENTS.put(r2Key, file.stream(), {
      customMetadata: { projectId, uploadedBy: userId, originalName: file.name },
    });

    const attachmentId = generateId();
    await DB.prepare(`
      INSERT INTO research_attachments (id, project_id, uploaded_by_id, file_name, file_type, file_size, r2_key, description, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(attachmentId, projectId, userId, file.name, file.type, file.size, r2Key, description, category).run();

    await logActivity(DB, projectId, userId, 'file_uploaded', `Uploaded: ${file.name}`);

    // Record contribution
    await DB.prepare(`
      INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, points_earned, created_at)
      VALUES (?, ?, ?, date('now'), 'literature_added', 3, datetime('now'))
    `).bind(generateId(), projectId, userId).run();

    return c.json({ id: attachmentId, fileName: file.name, fileSize: file.size, category, message: 'File uploaded' }, 201);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// GET /research/projects/:id/attachments - List attachments
researchRoutes.get('/projects/:id/attachments', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT a.*, u.displayName as uploadedByName, u.avatar as uploadedByAvatar
      FROM research_attachments a
      LEFT JOIN users u ON a.uploaded_by_id = u.id
      WHERE a.project_id = ?
      ORDER BY a.created_at DESC
    `).bind(projectId).all();

    return c.json({
      items: results.map((r: any) => ({
        id: r.id,
        fileName: r.file_name,
        fileType: r.file_type,
        fileSize: r.file_size,
        description: r.description,
        category: r.category,
        uploadedBy: { name: r.uploadedByName, avatar: r.uploadedByAvatar },
        createdAt: r.created_at,
      }))
    });
  } catch (error) {
    console.error('Error listing attachments:', error);
    return c.json({ error: 'Failed to list attachments' }, 500);
  }
});

// GET /research/projects/:id/attachments/:attachmentId/download - Download attachment
researchRoutes.get('/projects/:id/attachments/:attachmentId/download', async (c: AppContext) => {
  try {
    const { DB, DOCUMENTS } = c.env;
    const userId = c.get('userId') || 'guest';
    const projectId = c.req.param('id');
    const attachmentId = c.req.param('attachmentId');

    // Check project access
    const project = await DB.prepare('SELECT is_public FROM research_projects WHERE id = ?').bind(projectId).first<any>();
    if (!project) return c.json({ error: 'Project not found' }, 404);
    if (!project.is_public && userId === 'guest') {
      const isMember = await isProjectMember(DB, projectId, userId);
      if (!isMember) return c.json({ error: 'Access denied' }, 403);
    }

    const attachment = await DB.prepare('SELECT * FROM research_attachments WHERE id = ? AND project_id = ?').bind(attachmentId, projectId).first<any>();
    if (!attachment) return c.json({ error: 'Attachment not found' }, 404);

    const file = await DOCUMENTS.get(attachment.r2_key);
    if (!file) return c.json({ error: 'File not found in storage' }, 404);

    return new Response(file.body, {
      headers: {
        'Content-Type': attachment.file_type,
        'Content-Disposition': `attachment; filename="${attachment.file_name}"`,
      },
    });
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
    if (!isMember) return c.json({ error: 'Access denied' }, 403);

    const attachment = await DB.prepare('SELECT * FROM research_attachments WHERE id = ? AND project_id = ?').bind(attachmentId, projectId).first<any>();
    if (!attachment) return c.json({ error: 'Attachment not found' }, 404);

    await DOCUMENTS.delete(attachment.r2_key);
    await DB.prepare('DELETE FROM research_attachments WHERE id = ?').bind(attachmentId).run();
    await logActivity(DB, projectId, userId, 'file_deleted', `Deleted: ${attachment.file_name}`);

    return c.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return c.json({ error: 'Failed to delete attachment' }, 500);
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add workers/src/services/researchExport.ts workers/src/routes/research.ts
git commit -m "feat(research): add export generation, file upload/download endpoints with R2 storage"
```

---

### Task 1.4: Wire Up Contribution Tracking

**Files:**
- Modify: `workers/src/routes/research.ts`

- [ ] **Step 1: Add contribution recording to existing endpoints**

Find each of these existing endpoints and add a contribution INSERT after the main operation:

1. **After note creation** (search for `'note_created'` in logActivity calls):
```typescript
await DB.prepare(`INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, points_earned, created_at) VALUES (?, ?, ?, date('now'), 'note_created', 5, datetime('now'))`).bind(generateId(), projectId, userId).run();
```

2. **After citation added** (search for `'citation_added'`):
```typescript
await DB.prepare(`INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, points_earned, created_at) VALUES (?, ?, ?, date('now'), 'citation_added', 3, datetime('now'))`).bind(generateId(), projectId, userId).run();
```

3. **After discussion started** (search for `'discussion_created'`):
```typescript
await DB.prepare(`INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, points_earned, created_at) VALUES (?, ?, ?, date('now'), 'discussion_started', 3, datetime('now'))`).bind(generateId(), projectId, userId).run();
```

4. **After review submitted** (search for `'review_submitted'`):
```typescript
await DB.prepare(`INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, points_earned, created_at) VALUES (?, ?, ?, date('now'), 'review_submitted', 10, datetime('now'))`).bind(generateId(), projectId, userId).run();
```

5. **After insight generated** (search for `'insight'` in logActivity):
```typescript
await DB.prepare(`INSERT INTO research_contributions (id, project_id, user_id, contribution_date, contribution_type, points_earned, created_at) VALUES (?, ?, ?, date('now'), 'insight_generated', 5, datetime('now'))`).bind(generateId(), projectId, userId).run();
```

- [ ] **Step 2: Add GET contributions endpoint**

```typescript
// GET /research/projects/:id/contributions - Get contribution stats
researchRoutes.get('/projects/:id/contributions', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT c.user_id, u.displayName, u.avatar,
        COUNT(*) as total_contributions,
        SUM(c.points_earned) as total_points,
        GROUP_CONCAT(DISTINCT c.contribution_type) as types
      FROM research_contributions c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.project_id = ?
      GROUP BY c.user_id
      ORDER BY total_points DESC
    `).bind(projectId).all();

    return c.json({ items: results });
  } catch (error) {
    console.error('Error getting contributions:', error);
    return c.json({ error: 'Failed to get contributions' }, 500);
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add workers/src/routes/research.ts
git commit -m "feat(research): wire up contribution tracking across all research actions"
```

---

## Task Group 2: FTS5 Search

### Task 2.1: Add Full-Text Search Endpoint

**Files:**
- Modify: `workers/src/routes/research.ts`

- [ ] **Step 1: Add FTS5 search endpoint**

```typescript
// GET /research/search - Full-text search across projects, notes, literature
researchRoutes.get('/search', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId') || 'guest';
    const q = c.req.query('q')?.trim();
    const searchType = c.req.query('type') || 'all'; // all, projects, notes, literature
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

    if (!q || q.length < 2) {
      return c.json({ error: 'Search query must be at least 2 characters' }, 400);
    }

    // Strip quotes to prevent FTS5 syntax injection
    const ftsQuery = q.split(/\s+/).map(term => `"${term.replace(/"/g, '')}"*`).join(' ');
    const results: any[] = [];

    if (searchType === 'all' || searchType === 'projects') {
      try {
        const { results: projects } = await DB.prepare(`
          SELECT p.id, p.title, p.research_question, p.category, p.status, p.phase,
            snippet(research_projects_fts, 1, '<mark>', '</mark>', '...', 32) as match_snippet,
            rank
          FROM research_projects_fts
          JOIN research_projects p ON p.id = research_projects_fts.id
          WHERE research_projects_fts MATCH ?
            AND (p.is_public = 1 OR p.created_by_id = ?)
          ORDER BY rank
          LIMIT ?
        `).bind(ftsQuery, userId, limit).all();

        projects.forEach((p: any) => results.push({ ...p, resultType: 'project' }));
      } catch (e) {
        // FTS table may not exist yet — fall back to LIKE
        const { results: projects } = await DB.prepare(`
          SELECT id, title, research_question, category, status, phase
          FROM research_projects
          WHERE (is_public = 1 OR created_by_id = ?)
            AND (title LIKE ? OR research_question LIKE ?)
          LIMIT ?
        `).bind(userId, `%${q}%`, `%${q}%`, limit).all();

        projects.forEach((p: any) => results.push({ ...p, resultType: 'project' }));
      }
    }

    if (searchType === 'all' || searchType === 'notes') {
      try {
        const { results: notes } = await DB.prepare(`
          SELECT n.id, n.project_id, n.title, n.note_type,
            snippet(research_notes_fts, 2, '<mark>', '</mark>', '...', 32) as match_snippet,
            rank
          FROM research_notes_fts
          JOIN research_notes n ON n.id = research_notes_fts.id
          JOIN research_projects p ON n.project_id = p.id
          WHERE research_notes_fts MATCH ?
            AND (p.is_public = 1 OR p.created_by_id = ?)
          ORDER BY rank
          LIMIT ?
        `).bind(ftsQuery, userId, limit).all();

        notes.forEach((n: any) => results.push({ ...n, resultType: 'note' }));
      } catch (e) {
        // Fallback
        const { results: notes } = await DB.prepare(`
          SELECT n.id, n.project_id, n.title, n.note_type
          FROM research_notes n
          JOIN research_projects p ON n.project_id = p.id
          WHERE (p.is_public = 1 OR p.created_by_id = ?)
            AND (n.title LIKE ? OR n.content LIKE ?) LIMIT ?
        `).bind(userId, `%${q}%`, `%${q}%`, limit).all();

        notes.forEach((n: any) => results.push({ ...n, resultType: 'note' }));
      }
    }

    if (searchType === 'all' || searchType === 'literature') {
      try {
        const { results: lit } = await DB.prepare(`
          SELECT l.id, l.project_id, l.external_title, l.external_authors, l.external_year,
            snippet(research_literature_fts, 2, '<mark>', '</mark>', '...', 32) as match_snippet,
            rank
          FROM research_literature_fts
          JOIN research_literature l ON l.id = research_literature_fts.id
          JOIN research_projects p ON l.project_id = p.id
          WHERE research_literature_fts MATCH ?
            AND (p.is_public = 1 OR p.created_by_id = ?)
          ORDER BY rank
          LIMIT ?
        `).bind(ftsQuery, userId, limit).all();

        lit.forEach((l: any) => results.push({ ...l, resultType: 'literature' }));
      } catch (e) {
        // Fallback
        const { results: lit } = await DB.prepare(`
          SELECT l.id, l.project_id, l.external_title, l.external_authors, l.external_year
          FROM research_literature l
          JOIN research_projects p ON l.project_id = p.id
          WHERE (p.is_public = 1 OR p.created_by_id = ?)
            AND (l.external_title LIKE ? OR l.notes LIKE ?) LIMIT ?
        `).bind(userId, `%${q}%`, `%${q}%`, limit).all();

        lit.forEach((l: any) => results.push({ ...l, resultType: 'literature' }));
      }
    }

    return c.json({ items: results, query: q, total: results.length });
  } catch (error) {
    console.error('Error in research search:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add workers/src/routes/research.ts
git commit -m "feat(research): add FTS5 full-text search with LIKE fallback"
```

---

## Task Group 3: Advanced AI Features

### Task 3.1: Create Advanced AI Service

**Files:**
- Create: `workers/src/services/researchAI.ts`
- Modify: `workers/src/config/aiModels.ts`

- [ ] **Step 1: Add AI config for analysis tasks**

Add to `AI_DEFAULTS` in `workers/src/config/aiModels.ts`:

```typescript
  /** Research advanced AI analysis */
  researchAnalysis: {
    model: AI_MODELS.HEAVY,
    max_tokens: 1200,
    temperature: 0.4,
  },
```

- [ ] **Step 2: Create the advanced AI service**

```typescript
// workers/src/services/researchAI.ts
/**
 * Advanced Research AI Service
 * Literature gap analysis, question refinement, auto-tags, cross-project insights
 */

import { AI_DEFAULTS, AI_MODELS } from '../config/aiModels';

interface Env {
  DB: D1Database;
  AI: any;
}

export async function analyzeLiteratureGaps(
  env: Env,
  projectId: string
): Promise<{ gaps: string[]; recommendations: string[] }> {
  const { results: literature } = await env.DB.prepare(`
    SELECT external_title, external_authors, notes, external_year
    FROM research_literature WHERE project_id = ? LIMIT 20
  `).bind(projectId).all();

  const project = await env.DB.prepare(
    'SELECT title, research_question, methodology, category FROM research_projects WHERE id = ?'
  ).bind(projectId).first<any>();

  if (!project || literature.length === 0) {
    return { gaps: ['Add literature sources to enable gap analysis'], recommendations: [] };
  }

  const litSummary = literature.map((l: any) =>
    `- "${l.external_title}" by ${l.external_authors || 'Unknown'} (${l.external_year || 'n.d.'})${l.notes ? `: ${l.notes.slice(0, 200)}` : ''}`
  ).join('\n');

  const prompt = `You are a research methodology expert for Ghana's civil service. Analyze the literature coverage for this research project and identify gaps.

PROJECT: ${project.title}
RESEARCH QUESTION: ${project.research_question}
METHODOLOGY: ${project.methodology}
CATEGORY: ${project.category}

CURRENT LITERATURE (${literature.length} sources):
${litSummary}

Identify:
1. GAPS: What important perspectives, methodologies, or topic areas are missing from the literature review?
2. RECOMMENDATIONS: What specific types of sources should the researcher seek?

Respond in JSON:
{"gaps": ["gap1", "gap2", ...], "recommendations": ["rec1", "rec2", ...]}

JSON:`;

  const response = await env.AI.run(AI_DEFAULTS.researchAnalysis.model, {
    prompt,
    max_tokens: AI_DEFAULTS.researchAnalysis.max_tokens,
    temperature: AI_DEFAULTS.researchAnalysis.temperature,
  });

  try {
    const text = response?.response || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return { gaps: ['Unable to parse AI response'], recommendations: [] };
}

export async function refineResearchQuestion(
  env: Env,
  question: string,
  category: string,
  methodology: string
): Promise<{ critique: string; suggestions: string[] }> {
  const prompt = `You are a senior research advisor for Ghana's civil service. Evaluate this research question and suggest improvements.

RESEARCH QUESTION: "${question}"
CATEGORY: ${category}
METHODOLOGY: ${methodology}

Evaluate for: specificity, measurability, feasibility within a civil service context, and relevance to Ghana public administration.

Respond in JSON:
{"critique": "2-3 sentence evaluation", "suggestions": ["improved question 1", "improved question 2", "improved question 3"]}

JSON:`;

  const response = await env.AI.run(AI_DEFAULTS.researchAnalysis.model, {
    prompt,
    max_tokens: 800,
    temperature: 0.5,
  });

  try {
    const text = response?.response || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return { critique: 'Unable to analyze question', suggestions: [] };
}

export async function suggestMethodology(
  env: Env,
  question: string,
  category: string
): Promise<{ recommended: string; alternatives: Array<{ method: string; reason: string }> }> {
  const prompt = `You are a research methodology expert for public administration in Ghana. Recommend the best methodology for this research.

RESEARCH QUESTION: "${question}"
CATEGORY: ${category}

Respond in JSON:
{"recommended": "best methodology with explanation", "alternatives": [{"method": "name", "reason": "why it could work"}, ...]}

JSON:`;

  const response = await env.AI.run(AI_DEFAULTS.researchAnalysis.model, {
    prompt,
    max_tokens: 800,
    temperature: 0.4,
  });

  try {
    const text = response?.response || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return { recommended: 'Unable to suggest', alternatives: [] };
}

export async function generateAutoTags(
  env: Env,
  projectId: string
): Promise<string[]> {
  const project = await env.DB.prepare(
    'SELECT title, research_question, hypothesis, methodology, category FROM research_projects WHERE id = ?'
  ).bind(projectId).first<any>();

  if (!project) return [];

  const prompt = `Extract 5-8 topic tags for this research project. Return only lowercase tags, comma-separated.

TITLE: ${project.title}
QUESTION: ${project.research_question}
HYPOTHESIS: ${project.hypothesis || 'N/A'}
METHODOLOGY: ${project.methodology}
CATEGORY: ${project.category}

Tags:`;

  const response = await env.AI.run(AI_MODELS.LIGHT, {
    prompt,
    max_tokens: 100,
    temperature: 0.2,
  });

  const text = response?.response?.trim() || '';
  return text.split(',').map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 1 && t.length < 40);
}

export async function crossProjectInsights(
  env: Env,
  projectId: string
): Promise<Array<{ relatedProjectId: string; relatedTitle: string; connection: string }>> {
  const project = await env.DB.prepare(
    'SELECT id, title, research_question, category, methodology FROM research_projects WHERE id = ?'
  ).bind(projectId).first<any>();

  if (!project) return [];

  const { results: otherProjects } = await env.DB.prepare(`
    SELECT id, title, research_question, category, methodology
    FROM research_projects
    WHERE id != ? AND status != 'archived' AND is_public = 1
    LIMIT 20
  `).bind(projectId).all();

  if (otherProjects.length === 0) return [];

  const projectList = otherProjects.map((p: any) =>
    `ID:${p.id} | "${p.title}" | Q: ${p.research_question} | Cat: ${p.category} | Method: ${p.methodology}`
  ).join('\n');

  const prompt = `Find connections between this research project and other projects on the platform.

THIS PROJECT: "${project.title}"
QUESTION: ${project.research_question}
CATEGORY: ${project.category}

OTHER PROJECTS:
${projectList}

Identify up to 3 projects with meaningful connections (shared methodology, complementary findings, overlapping topics).

Respond in JSON array:
[{"relatedProjectId": "ID", "relatedTitle": "title", "connection": "brief explanation of connection"}]

JSON:`;

  const response = await env.AI.run(AI_DEFAULTS.researchAnalysis.model, {
    prompt,
    max_tokens: 600,
    temperature: 0.3,
  });

  try {
    const text = response?.response || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return [];
}
```

- [ ] **Step 3: Add API endpoints for advanced AI features**

Add to `workers/src/routes/research.ts`:

```typescript
import { analyzeLiteratureGaps, refineResearchQuestion, suggestMethodology, generateAutoTags, crossProjectInsights } from '../services/researchAI';

// POST /research/projects/:id/ai/literature-gaps
researchRoutes.post('/projects/:id/ai/literature-gaps', requireAuth, async (c: AppContext) => {
  try {
    const projectId = c.req.param('id');
    const result = await analyzeLiteratureGaps(c.env as any, projectId);
    return c.json(result);
  } catch (error) {
    console.error('Error analyzing gaps:', error);
    return c.json({ error: 'Failed to analyze literature gaps' }, 500);
  }
});

// POST /research/projects/:id/ai/refine-question
researchRoutes.post('/projects/:id/ai/refine-question', requireAuth, async (c: AppContext) => {
  try {
    const { question, category, methodology } = await c.req.json();
    const result = await refineResearchQuestion(c.env as any, question, category, methodology);
    return c.json(result);
  } catch (error) {
    console.error('Error refining question:', error);
    return c.json({ error: 'Failed to refine question' }, 500);
  }
});

// POST /research/projects/:id/ai/suggest-methodology
researchRoutes.post('/projects/:id/ai/suggest-methodology', requireAuth, async (c: AppContext) => {
  try {
    const { question, category } = await c.req.json();
    const result = await suggestMethodology(c.env as any, question, category);
    return c.json(result);
  } catch (error) {
    console.error('Error suggesting methodology:', error);
    return c.json({ error: 'Failed to suggest methodology' }, 500);
  }
});

// POST /research/projects/:id/ai/auto-tags
researchRoutes.post('/projects/:id/ai/auto-tags', requireAuth, async (c: AppContext) => {
  try {
    const projectId = c.req.param('id');
    const tags = await generateAutoTags(c.env as any, projectId);
    return c.json({ tags });
  } catch (error) {
    console.error('Error generating tags:', error);
    return c.json({ error: 'Failed to generate tags' }, 500);
  }
});

// GET /research/projects/:id/ai/cross-insights
researchRoutes.get('/projects/:id/ai/cross-insights', requireAuth, async (c: AppContext) => {
  try {
    const projectId = c.req.param('id');
    const connections = await crossProjectInsights(c.env as any, projectId);
    return c.json({ connections });
  } catch (error) {
    console.error('Error finding connections:', error);
    return c.json({ error: 'Failed to find cross-project insights' }, 500);
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add workers/src/services/researchAI.ts workers/src/config/aiModels.ts workers/src/routes/research.ts
git commit -m "feat(research): add advanced AI features — gap analysis, question refinement, methodology suggestions, auto-tags, cross-project insights"
```

---

## Task Group 4: Research Notifications

### Task 4.1: Create Notification Helper + Wire to Research Actions

**Files:**
- Create: `workers/src/services/researchNotifications.ts`
- Modify: `workers/src/routes/research.ts`

- [ ] **Step 1: Create notification helper**

```typescript
// workers/src/services/researchNotifications.ts
/**
 * Research Notification Service
 * Sends notifications for research events using existing notification system
 */

export async function sendResearchNotification(
  db: D1Database,
  params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    priority?: string;
    actorId?: string;
    actorName?: string;
    resourceId?: string;
    resourceType?: string;
  }
): Promise<void> {
  try {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.prepare(`
      INSERT INTO notifications (id, userId, type, title, message, link, actorId, actorName, resourceId, resourceType, priority, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id, params.userId, params.type, params.title, params.message,
      params.link || null, params.actorId || null, params.actorName || null,
      params.resourceId || null, params.resourceType || 'research',
      params.priority || 'normal'
    ).run();
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

export async function notifyTeamMembers(
  db: D1Database,
  projectId: string,
  excludeUserId: string,
  params: { type: string; title: string; message: string; link?: string; priority?: string }
): Promise<void> {
  try {
    const { results: members } = await db.prepare(
      'SELECT user_id FROM research_team_members WHERE project_id = ? AND user_id != ?'
    ).bind(projectId, excludeUserId).all();

    for (const member of members) {
      await sendResearchNotification(db, { ...params, userId: member.user_id as string });
    }
  } catch (error) {
    console.error('Failed to notify team:', error);
  }
}

export async function notifyMentionedUsers(
  db: D1Database,
  content: string,
  senderId: string,
  senderName: string,
  projectId: string,
  contextType: string
): Promise<void> {
  // Match @staffId pattern (staffId is a single alphanumeric token)
  const mentions = content.match(/@([A-Za-z0-9_-]+)/g);
  if (!mentions) return;

  const staffIds = [...new Set(mentions.map(m => m.slice(1)))];
  for (const staffId of staffIds) {
    const user = await db.prepare(
      'SELECT id, displayName FROM users WHERE staffId = ?'
    ).bind(staffId).first<{ id: string; displayName: string }>();

    if (user && user.id !== senderId) {
      await sendResearchNotification(db, {
        userId: user.id,
        type: 'research_mention',
        title: 'You were mentioned in a research discussion',
        message: `${senderName} mentioned you in a ${contextType} discussion`,
        link: `/research/projects/${projectId}`,
        priority: 'normal',
        actorId: senderId,
        actorName: senderName,
        resourceId: projectId,
        resourceType: 'research',
      });
    }
  }
}
```

- [ ] **Step 2: Wire notifications into key research actions**

Add import to research.ts:
```typescript
import { sendResearchNotification, notifyTeamMembers, notifyMentionedUsers } from '../services/researchNotifications';
```

Add notification calls after these existing actions:

1. **After review request** (find review submission endpoint):
```typescript
await sendResearchNotification(DB, {
  userId: assignedReviewerId,
  type: 'research_review_request',
  title: 'Review Requested',
  message: `You have been asked to review "${project.title}"`,
  link: `/research/projects/${projectId}`,
  priority: 'high',
});
```

2. **After discussion reply** (find reply creation):
```typescript
await notifyTeamMembers(DB, projectId, userId, {
  type: 'research_discussion_reply',
  title: 'New Discussion Reply',
  message: `New reply in discussion: "${discussion.title}"`,
  link: `/research/projects/${projectId}`,
});
await notifyMentionedUsers(DB, content, userId, projectId, 'discussion');
```

3. **After milestone completion** (find milestone status update):
```typescript
await notifyTeamMembers(DB, projectId, userId, {
  type: 'research_milestone_due',
  title: 'Milestone Completed',
  message: `Milestone "${milestone.title}" has been completed`,
  link: `/research/projects/${projectId}`,
});
```

- [ ] **Step 3: Commit**

```bash
git add workers/src/services/researchNotifications.ts workers/src/routes/research.ts
git commit -m "feat(research): add research notification system with @mentions and team alerts"
```

---

## Task Group 5: Collaboration Improvements

### Task 5.1: Phase Approval Gate + Review Assignment

**Files:**
- Modify: `workers/src/routes/research.ts`

- [ ] **Step 1: Add phase approval endpoints**

```typescript
// POST /research/projects/:id/phase-approval - Request phase approval
researchRoutes.post('/projects/:id/phase-approval', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { phase, approverId } = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) return c.json({ error: 'Access denied' }, 403);

    const approvalId = generateId();
    await DB.prepare(`
      INSERT INTO research_phase_approvals (id, project_id, phase, requested_by_id, status, requested_at)
      VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(approvalId, projectId, phase, userId).run();

    // Notify approver
    if (approverId) {
      const project = await DB.prepare('SELECT title FROM research_projects WHERE id = ?').bind(projectId).first<any>();
      await sendResearchNotification(DB, {
        userId: approverId,
        type: 'research_phase_approval',
        title: 'Phase Approval Required',
        message: `Approval needed to advance "${project?.title}" to ${phase} phase`,
        link: `/research/projects/${projectId}`,
        priority: 'high',
      });
    }

    await logActivity(DB, projectId, userId, 'phase_approval_requested', `Requested approval for ${phase} phase`);
    return c.json({ id: approvalId, message: 'Approval requested' }, 201);
  } catch (error) {
    console.error('Error requesting approval:', error);
    return c.json({ error: 'Failed to request approval' }, 500);
  }
});

// PUT /research/projects/:id/phase-approval/:approvalId - Approve/reject phase
researchRoutes.put('/projects/:id/phase-approval/:approvalId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const approvalId = c.req.param('approvalId');
    const { status, comments } = await c.req.json();

    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ error: 'Status must be approved or rejected' }, 400);
    }

    await DB.prepare(`
      UPDATE research_phase_approvals SET status = ?, approved_by_id = ?, comments = ?, resolved_at = datetime('now')
      WHERE id = ? AND project_id = ?
    `).bind(status, userId, comments || null, approvalId, projectId).run();

    // If approved, advance the project phase
    if (status === 'approved') {
      const approval = await DB.prepare('SELECT phase, requested_by_id FROM research_phase_approvals WHERE id = ?').bind(approvalId).first<any>();
      if (approval) {
        await DB.prepare('UPDATE research_projects SET phase = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(approval.phase, projectId).run();
        await sendResearchNotification(DB, {
          userId: approval.requested_by_id,
          type: 'research_phase_approved',
          title: 'Phase Approved',
          message: `Your project has been approved to advance to ${approval.phase} phase`,
          link: `/research/projects/${projectId}`,
        });
      }
    }

    await logActivity(DB, projectId, userId, `phase_${status}`, `${status} phase transition`);
    return c.json({ message: `Phase ${status}` });
  } catch (error) {
    console.error('Error resolving approval:', error);
    return c.json({ error: 'Failed to resolve approval' }, 500);
  }
});

// GET /research/projects/:id/phase-approvals - Get approval history
researchRoutes.get('/projects/:id/phase-approvals', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT pa.*,
        req.displayName as requestedByName, req.avatar as requestedByAvatar,
        app.displayName as approvedByName, app.avatar as approvedByAvatar
      FROM research_phase_approvals pa
      LEFT JOIN users req ON pa.requested_by_id = req.id
      LEFT JOIN users app ON pa.approved_by_id = app.id
      WHERE pa.project_id = ?
      ORDER BY pa.requested_at DESC
    `).bind(projectId).all();

    return c.json({ items: results });
  } catch (error) {
    console.error('Error getting approvals:', error);
    return c.json({ error: 'Failed to get approvals' }, 500);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add workers/src/routes/research.ts
git commit -m "feat(research): add phase approval gates with notification workflow"
```

---

## Task Group 6: Governance Features

### Task 6.1: Ethics Approval Tracking + Audit Export

**Files:**
- Modify: `workers/src/routes/research.ts`

- [ ] **Step 1: Add ethics approval endpoints**

```typescript
// POST /research/projects/:id/ethics - Create ethics approval record
researchRoutes.post('/projects/:id/ethics', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const { approvalBody, referenceNumber, status, submittedDate, conditions } = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) return c.json({ error: 'Access denied' }, 403);

    const ethicsId = generateId();
    await DB.prepare(`
      INSERT INTO research_ethics_approvals (id, project_id, approval_body, reference_number, status, submitted_date, conditions, created_by_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(ethicsId, projectId, approvalBody, referenceNumber || null, status || 'pending', submittedDate || null, conditions || null, userId).run();

    await logActivity(DB, projectId, userId, 'ethics_submitted', `Ethics approval submitted to ${approvalBody}`);
    return c.json({ id: ethicsId, message: 'Ethics approval record created' }, 201);
  } catch (error) {
    console.error('Error creating ethics approval:', error);
    return c.json({ error: 'Failed to create ethics approval' }, 500);
  }
});

// GET /research/projects/:id/ethics - Get ethics approvals
researchRoutes.get('/projects/:id/ethics', async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT ea.*, u.displayName as createdByName
      FROM research_ethics_approvals ea
      LEFT JOIN users u ON ea.created_by_id = u.id
      WHERE ea.project_id = ?
      ORDER BY ea.created_at DESC
    `).bind(projectId).all();

    return c.json({ items: results });
  } catch (error) {
    console.error('Error getting ethics approvals:', error);
    return c.json({ error: 'Failed to get ethics approvals' }, 500);
  }
});

// PUT /research/projects/:id/ethics/:ethicsId - Update ethics approval
researchRoutes.put('/projects/:id/ethics/:ethicsId', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId')!;
    const projectId = c.req.param('id');
    const ethicsId = c.req.param('ethicsId');
    const updates = await c.req.json();

    const isMember = await isProjectMember(DB, projectId, userId);
    if (!isMember) return c.json({ error: 'Access denied' }, 403);

    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['status', 'reference_number', 'approval_date', 'expiry_date', 'conditions', 'submitted_date'];

    for (const key of allowed) {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (updates[camelKey] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[camelKey]);
      }
    }

    if (fields.length === 0) return c.json({ error: 'No valid fields to update' }, 400);

    fields.push('updated_at = datetime(\'now\')');
    values.push(ethicsId, projectId);

    await DB.prepare(`UPDATE research_ethics_approvals SET ${fields.join(', ')} WHERE id = ? AND project_id = ?`).bind(...values).run();

    await logActivity(DB, projectId, userId, 'ethics_updated', `Updated ethics approval status`);
    return c.json({ message: 'Ethics approval updated' });
  } catch (error) {
    console.error('Error updating ethics approval:', error);
    return c.json({ error: 'Failed to update ethics approval' }, 500);
  }
});

// GET /research/projects/:id/audit-trail/export - Export audit trail as CSV
researchRoutes.get('/projects/:id/audit-trail/export', requireAuth, async (c: AppContext) => {
  try {
    const { DB } = c.env;
    const projectId = c.req.param('id');

    const { results } = await DB.prepare(`
      SELECT a.action, a.details, a.created_at, u.displayName as userName, u.staffId
      FROM research_activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.project_id = ?
      ORDER BY a.created_at ASC
    `).bind(projectId).all();

    const csv = [
      'Timestamp,User,Staff ID,Action,Details',
      ...results.map((r: any) =>
        `"${r.created_at}","${r.userName || 'Unknown'}","${r.staffId || ''}","${r.action}","${(r.details || '').replace(/"/g, '""')}"`
      )
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-trail-${projectId}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit trail:', error);
    return c.json({ error: 'Failed to export audit trail' }, 500);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add workers/src/routes/research.ts
git commit -m "feat(research): add ethics approval tracking and audit trail CSV export"
```

---

## Task Group 7: Frontend Components

### Task 7.1: File Attachments Component

**Files:**
- Create: `src/components/research/FileAttachments.tsx`

- [ ] **Step 1: Create the component**

Build a file upload/list/download/delete component using the existing patterns from ExportPanel.tsx:
- Drag-and-drop upload area
- File list with type icons, size, uploader info
- Download and delete actions
- Category filter (general, data, survey, instrument, literature, report, image, other)
- Uses authFetch pattern from ExportPanel.tsx
- Framer Motion animations matching existing components
- Lucide icons (Upload, File, Trash2, Download, Filter)

- [ ] **Step 2: Commit**

```bash
git add src/components/research/FileAttachments.tsx
git commit -m "feat(research): add file attachments component with drag-and-drop upload"
```

### Task 7.2: Advanced AI Panel Component

**Files:**
- Create: `src/components/research/AdvancedAIPanel.tsx`

- [ ] **Step 1: Create the component**

Tabbed panel with 5 AI features:
- Literature Gap Analysis (POST `/ai/literature-gaps`)
- Research Question Refinement (POST `/ai/refine-question`)
- Methodology Suggestions (POST `/ai/suggest-methodology`)
- Auto-Tag Generation (POST `/ai/auto-tags`)
- Cross-Project Insights (GET `/ai/cross-insights`)

Each tab shows a "Run Analysis" button, loading state, and results display.
Uses existing patterns: authFetch, Framer Motion, Lucide icons (Brain, Lightbulb, Tags, Network, Search).

- [ ] **Step 2: Commit**

```bash
git add src/components/research/AdvancedAIPanel.tsx
git commit -m "feat(research): add advanced AI panel with 5 analysis features"
```

### Task 7.3: Phase Approval Gate Component

**Files:**
- Create: `src/components/research/PhaseApprovalGate.tsx`

- [ ] **Step 1: Create the component**

Shows current phase, approval status, request/approve/reject buttons:
- Visual phase progress bar (reuse PhaseProgress.tsx patterns)
- "Request Approval" button that opens a modal to select approver
- Approval history list
- For approvers: approve/reject with comments
- Ethics approval section (list, add, update)
- Audit trail export button

- [ ] **Step 2: Commit**

```bash
git add src/components/research/PhaseApprovalGate.tsx
git commit -m "feat(research): add phase approval gate and ethics tracking UI"
```

### Task 7.4: Integrate New Components into Project Page

**Files:**
- Modify: `src/pages/ResearchProject.tsx`
- Modify: `src/components/research/index.ts`

- [ ] **Step 1: Export new components from barrel file**

Add to `src/components/research/index.ts`:
```typescript
export { FileAttachments } from './FileAttachments';
export { AdvancedAIPanel } from './AdvancedAIPanel';
export { PhaseApprovalGate } from './PhaseApprovalGate';
```

- [ ] **Step 2: Add tabs/sections to ResearchProject.tsx**

Add new tab options to the existing tab system in the project detail page:
- "Files" tab → renders `<FileAttachments projectId={id} />`
- "AI Analysis" tab → renders `<AdvancedAIPanel projectId={id} project={project} />`
- "Governance" tab → renders `<PhaseApprovalGate projectId={id} project={project} />`

Follow the existing tab pattern already used for Analytics, Collaboration, Milestones, Export panels.

- [ ] **Step 3: Commit**

```bash
git add src/components/research/index.ts src/pages/ResearchProject.tsx
git commit -m "feat(research): integrate file attachments, AI analysis, and governance tabs into project page"
```

### Task 7.5: Update ExportPanel to Use New POST Endpoint

**Files:**
- Modify: `src/components/research/ExportPanel.tsx`

- [ ] **Step 1: Wire the generate button to POST endpoint**

The ExportPanel already has the UI. Update the `handleGenerate` function to:
1. POST to `/research/projects/${projectId}/exports` with selected options
2. On success, receive the content back
3. For markdown/HTML: offer copy-to-clipboard and download
4. For PDF: use jsPDF (already installed) to render the markdown content client-side
5. Refresh the exports list after generation

- [ ] **Step 2: Add download button for existing exports**

Wire the download action to GET `/research/projects/${projectId}/exports/${exportId}/download`.

- [ ] **Step 3: Commit**

```bash
git add src/components/research/ExportPanel.tsx
git commit -m "feat(research): wire export panel to backend generation endpoint with PDF support"
```

---

## Task Group 8: Final Integration

### Task 8.1: Update Types + Store

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/stores/researchStore.ts`

- [ ] **Step 1: Add new types**

```typescript
export interface ResearchAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  description?: string;
  category: 'general' | 'data' | 'survey' | 'instrument' | 'literature' | 'report' | 'image' | 'other';
  uploadedBy: { name: string; avatar?: string };
  createdAt: string;
}

export interface ResearchPhaseApproval {
  id: string;
  projectId: string;
  phase: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedByName?: string;
  approvedByName?: string;
  comments?: string;
  requestedAt: string;
  resolvedAt?: string;
}

export interface ResearchEthicsApproval {
  id: string;
  projectId: string;
  approvalBody: string;
  referenceNumber?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';
  submittedDate?: string;
  approvalDate?: string;
  expiryDate?: string;
  conditions?: string;
  createdByName?: string;
  createdAt: string;
}

export interface ResearchContribution {
  user_id: string;
  displayName: string;
  avatar?: string;
  total_contributions: number;
  total_points: number;
  types: string;
}

export interface ResearchSearchResult {
  id: string;
  resultType: 'project' | 'note' | 'literature';
  title?: string;
  match_snippet?: string;
  [key: string]: any;
}
```

- [ ] **Step 2: Add store actions for new features**

Add to researchStore.ts:
- `searchResearch(query, type)` — calls GET `/research/search`
- `uploadAttachment(projectId, file, description, category)` — calls POST `/attachments`
- `fetchAttachments(projectId)` — calls GET `/attachments`

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/stores/researchStore.ts
git commit -m "feat(research): add types and store actions for new research features"
```

### Task 8.2: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add documentation for new features**

Add a "Research Hub Enhancements" section documenting:
- Full-text search (FTS5)
- File attachments via R2
- Export generation (markdown, HTML, PDF client-side)
- Advanced AI features (5 new capabilities)
- Research notifications
- Phase approval workflow
- Ethics tracking
- Audit trail export

- [ ] **Step 2: Final commit**

```bash
git add README.md
git commit -m "docs: document research hub enhancements"
```
