import type { Context, Next } from 'hono';

export interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
  JWT_SECRET: string;
}

export interface Variables {
  userId?: string;
  userRole?: string;
}

export type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// Helper to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Optional auth middleware
export async function optionalAuth(c: AppContext, next: Next) {
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
export async function requireAuth(c: AppContext, next: Next) {
  const userId = c.get('userId');
  if (!userId || userId === 'guest') {
    return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
  }
  await next();
}

// Check if user is project member
export async function isProjectMember(db: D1Database, projectId: string, userId: string): Promise<boolean> {
  const member = await db.prepare(`
    SELECT 1 FROM research_team_members WHERE project_id = ? AND user_id = ?
    UNION
    SELECT 1 FROM research_projects WHERE id = ? AND (created_by_id = ? OR team_lead_id = ?)
  `).bind(projectId, userId, projectId, userId, userId).first();
  return !!member;
}

// Log research activity
export async function logActivity(
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

// Helper to log team activity
export async function logTeamActivity(
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

// Parse AI-generated brief content into structured sections
export function parseAIBriefResponse(content: string): {
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
