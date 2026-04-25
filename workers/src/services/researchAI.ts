/**
 * Advanced AI Service for Research Lab
 *
 * Provides literature gap analysis, question refinement, methodology suggestions,
 * auto-tagging, and cross-project insight discovery.
 */

import { AI_DEFAULTS, AI_MODELS } from '../config/aiModels';
import { stripModelReasoning } from './aiResponseSanitizer';

interface Env {
  DB: D1Database;
  AI: any;
}

interface LiteratureGapsResult {
  gaps: string[];
  recommendations: string[];
}

interface RefineQuestionResult {
  critique: string;
  suggestions: string[];
}

interface MethodologySuggestion {
  recommended: string;
  alternatives: { method: string; reason: string }[];
}

interface CrossProjectInsight {
  relatedProjectId: string;
  relatedTitle: string;
  connection: string;
}

/**
 * Analyze literature gaps for a research project.
 * Examines existing literature items and identifies areas not yet covered.
 */
export async function analyzeLiteratureGaps(
  env: Env,
  projectId: string
): Promise<LiteratureGapsResult> {
  const project = await env.DB.prepare(
    `SELECT title, description, research_question, category FROM research_projects WHERE id = ?`
  ).bind(projectId).first<{ title: string; description: string; research_question: string; category: string }>();

  if (!project) throw new Error('Project not found');

  const { results: literature } = await env.DB.prepare(
    `SELECT external_title, authors, abstract, source_type FROM research_literature WHERE project_id = ? LIMIT 50`
  ).bind(projectId).all();

  const litSummary = literature.map((l: any) =>
    `- "${l.external_title}" by ${l.authors || 'Unknown'} (${l.source_type || 'article'}): ${(l.abstract || '').substring(0, 200)}`
  ).join('\n');

  const prompt = `You are a research methodology expert. Analyze the following research project and its literature review to identify gaps.

Project: "${project.title}"
Description: ${project.description || 'N/A'}
Research Question: ${project.research_question || 'N/A'}
Category: ${project.category || 'N/A'}

Current Literature (${literature.length} items):
${litSummary || 'No literature items added yet.'}

Identify:
1. GAPS: What areas of the research question are not covered by the current literature? List 3-5 specific gaps.
2. RECOMMENDATIONS: What types of sources or specific topics should the researcher look for? List 3-5 actionable recommendations.

Respond in JSON format:
{"gaps": ["gap1", "gap2", ...], "recommendations": ["rec1", "rec2", ...]}`;

  const response = await env.AI.run(AI_DEFAULTS.researchAnalysis.model, {
    prompt,
    max_tokens: AI_DEFAULTS.researchAnalysis.max_tokens,
    temperature: AI_DEFAULTS.researchAnalysis.temperature,
  });

  const text = stripModelReasoning(response.response || '').trim() || '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback: parse manually
  }

  return {
    gaps: ['Unable to parse AI response. Please try again.'],
    recommendations: [text.substring(0, 500)],
  };
}

/**
 * Refine a research question using AI critique and suggestions.
 */
export async function refineResearchQuestion(
  env: Env,
  question: string,
  category?: string,
  methodology?: string
): Promise<RefineQuestionResult> {
  const prompt = `You are a research methodology expert. Evaluate and help refine the following research question.

Research Question: "${question}"
${category ? `Category: ${category}` : ''}
${methodology ? `Proposed Methodology: ${methodology}` : ''}

Provide:
1. CRITIQUE: A brief assessment of the question's clarity, specificity, feasibility, and researchability (2-3 sentences).
2. SUGGESTIONS: 3-5 improved versions of the question that are more specific, measurable, or better scoped.

Respond in JSON format:
{"critique": "...", "suggestions": ["suggestion1", "suggestion2", ...]}`;

  const response = await env.AI.run(AI_DEFAULTS.researchAnalysis.model, {
    prompt,
    max_tokens: AI_DEFAULTS.researchAnalysis.max_tokens,
    temperature: AI_DEFAULTS.researchAnalysis.temperature,
  });

  const text = stripModelReasoning(response.response || '').trim() || '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback
  }

  return {
    critique: text.substring(0, 300) || 'Unable to parse AI response.',
    suggestions: [],
  };
}

/**
 * Suggest appropriate research methodology based on the question and category.
 */
export async function suggestMethodology(
  env: Env,
  question: string,
  category?: string
): Promise<MethodologySuggestion> {
  const prompt = `You are a research methodology expert. Recommend the most appropriate research methodology for the following:

Research Question: "${question}"
${category ? `Category/Field: ${category}` : ''}

Provide:
1. RECOMMENDED: The single best methodology with a brief explanation of why it fits.
2. ALTERNATIVES: 2-3 alternative methodologies, each with a reason why it could also work.

Respond in JSON format:
{"recommended": "Method name: explanation", "alternatives": [{"method": "name", "reason": "why"}, ...]}`;

  const response = await env.AI.run(AI_DEFAULTS.researchAnalysis.model, {
    prompt,
    max_tokens: AI_DEFAULTS.researchAnalysis.max_tokens,
    temperature: AI_DEFAULTS.researchAnalysis.temperature,
  });

  const text = stripModelReasoning(response.response || '').trim() || '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback
  }

  return {
    recommended: text.substring(0, 300) || 'Unable to parse AI response.',
    alternatives: [],
  };
}

/**
 * Generate auto-tags for a project using the LIGHT model for efficiency.
 */
export async function generateAutoTags(
  env: Env,
  projectId: string
): Promise<string[]> {
  const project = await env.DB.prepare(
    `SELECT title, description, research_question, category, methodology FROM research_projects WHERE id = ?`
  ).bind(projectId).first<{ title: string; description: string; research_question: string; category: string; methodology: string }>();

  if (!project) throw new Error('Project not found');

  const prompt = `Extract 5-10 relevant research tags/keywords from this project. Return ONLY a JSON array of lowercase strings.

Title: "${project.title}"
Description: ${(project.description || '').substring(0, 500)}
Research Question: ${project.research_question || 'N/A'}
Category: ${project.category || 'N/A'}
Methodology: ${project.methodology || 'N/A'}

Example response: ["public health", "qualitative research", "ghana", "maternal care"]`;

  const response = await env.AI.run(AI_MODELS.LIGHT, {
    prompt,
    max_tokens: 200,
    temperature: 0.2,
  });

  const text = stripModelReasoning(response.response || '').trim() || '';
  try {
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      const tags = JSON.parse(arrMatch[0]);
      if (Array.isArray(tags)) {
        return tags.filter((t: unknown) => typeof t === 'string').slice(0, 10);
      }
    }
  } catch {
    // Fallback
  }

  return [];
}

/**
 * Find cross-project insights by comparing a project with other public projects.
 */
export async function crossProjectInsights(
  env: Env,
  projectId: string
): Promise<CrossProjectInsight[]> {
  const project = await env.DB.prepare(
    `SELECT title, description, research_question, category, methodology FROM research_projects WHERE id = ?`
  ).bind(projectId).first<{ title: string; description: string; research_question: string; category: string; methodology: string }>();

  if (!project) throw new Error('Project not found');

  const { results: otherProjects } = await env.DB.prepare(
    `SELECT id, title, description, research_question, category FROM research_projects WHERE id != ? AND is_public = 1 LIMIT 20`
  ).bind(projectId).all();

  if (otherProjects.length === 0) {
    return [];
  }

  const projectsList = otherProjects.map((p: any) =>
    `[ID:${p.id}] "${p.title}" - ${(p.description || '').substring(0, 150)} (Category: ${p.category || 'N/A'})`
  ).join('\n');

  const prompt = `You are a research advisor. Find connections between the target project and other projects.

Target Project: "${project.title}"
Description: ${(project.description || '').substring(0, 300)}
Research Question: ${project.research_question || 'N/A'}
Category: ${project.category || 'N/A'}

Other Public Projects:
${projectsList}

Identify up to 5 projects that have meaningful connections (shared topics, complementary methods, overlapping populations, etc.).

Respond in JSON format:
[{"relatedProjectId": "ID", "relatedTitle": "title", "connection": "brief description of connection"}]`;

  const response = await env.AI.run(AI_DEFAULTS.researchAnalysis.model, {
    prompt,
    max_tokens: AI_DEFAULTS.researchAnalysis.max_tokens,
    temperature: AI_DEFAULTS.researchAnalysis.temperature,
  });

  const text = stripModelReasoning(response.response || '').trim() || '';
  try {
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      const insights = JSON.parse(arrMatch[0]);
      if (Array.isArray(insights)) {
        // Validate that referenced project IDs actually exist
        const validIds = new Set(otherProjects.map((p: any) => p.id));
        return insights
          .filter((i: any) => i.relatedProjectId && validIds.has(i.relatedProjectId))
          .slice(0, 5);
      }
    }
  } catch {
    // Fallback
  }

  return [];
}
