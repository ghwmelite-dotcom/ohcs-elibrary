import { Hono } from 'hono';
import { AI_DEFAULTS } from '../../config/aiModels';
import { analyzeLiteratureGaps, refineResearchQuestion, suggestMethodology, generateAutoTags, crossProjectInsights } from '../../services/researchAI';
import { generateId, requireAuth, isProjectMember, logActivity, parseAIBriefResponse } from './helpers';
import type { Env, Variables, AppContext } from './helpers';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

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
router.post('/kofi/chat', requireAuth, async (c: AppContext) => {
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
router.post('/projects/:id/generate-insights', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/insights', async (c: AppContext) => {
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
router.delete('/projects/:id/insights/:insightId', requireAuth, async (c: AppContext) => {
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
router.post('/literature/:id/summarize', requireAuth, async (c: AppContext) => {
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
router.post('/projects/:id/briefs', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/briefs', async (c: AppContext) => {
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
router.put('/projects/:id/briefs/:briefId', requireAuth, async (c: AppContext) => {
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
router.delete('/projects/:id/briefs/:briefId', requireAuth, async (c: AppContext) => {
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
router.post('/analyze-text', requireAuth, async (c: AppContext) => {
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

// ============================================================================
// Advanced AI Endpoints
// ============================================================================

// POST /research/projects/:id/ai/literature-gaps - Analyze literature gaps
router.post('/projects/:id/ai/literature-gaps', requireAuth, async (c: AppContext) => {
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
router.post('/projects/:id/ai/refine-question', requireAuth, async (c: AppContext) => {
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
router.post('/projects/:id/ai/suggest-methodology', requireAuth, async (c: AppContext) => {
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
router.post('/projects/:id/ai/auto-tags', requireAuth, async (c: AppContext) => {
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
router.get('/projects/:id/ai/cross-insights', requireAuth, async (c: AppContext) => {
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

export default router;
