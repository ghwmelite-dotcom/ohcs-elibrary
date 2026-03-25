/**
 * Research Notification Helpers
 *
 * Utilities for sending notifications to research team members,
 * mentioned users, and specific individuals.
 */

interface NotificationParams {
  type: string;
  title: string;
  message: string;
  link?: string;
  actorId: string;
  actorName: string;
  resourceId?: string;
  resourceType?: string;
  priority?: string;
}

/**
 * Send a notification to a single user.
 */
export async function sendResearchNotification(
  db: D1Database,
  userId: string,
  params: NotificationParams
): Promise<void> {
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO notifications (id, userId, type, title, message, link, actorId, actorName, resourceId, resourceType, priority, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    id,
    userId,
    params.type,
    params.title,
    params.message,
    params.link || null,
    params.actorId,
    params.actorName,
    params.resourceId || null,
    params.resourceType || null,
    params.priority || 'normal'
  ).run();
}

/**
 * Send a notification to all team members of a project, excluding a specific user.
 */
export async function notifyTeamMembers(
  db: D1Database,
  projectId: string,
  excludeUserId: string,
  params: NotificationParams
): Promise<void> {
  // Get all team members + project creator + team lead
  const { results: members } = await db.prepare(`
    SELECT DISTINCT user_id FROM (
      SELECT user_id FROM research_team_members WHERE project_id = ?
      UNION
      SELECT created_by_id AS user_id FROM research_projects WHERE id = ?
      UNION
      SELECT team_lead_id AS user_id FROM research_projects WHERE id = ? AND team_lead_id IS NOT NULL
    )
    WHERE user_id != ? AND user_id IS NOT NULL
  `).bind(projectId, projectId, projectId, excludeUserId).all();

  for (const member of members) {
    try {
      await sendResearchNotification(db, (member as any).user_id, params);
    } catch (e) {
      console.error(`Failed to notify user ${(member as any).user_id}:`, e);
    }
  }
}

/**
 * Detect @staffId mentions in content and send notifications to mentioned users.
 * Matches the pattern @staffId (NOT display names).
 */
export async function notifyMentionedUsers(
  db: D1Database,
  content: string,
  senderId: string,
  senderName: string,
  projectId: string,
  contextType: string
): Promise<void> {
  const mentionRegex = /@([A-Za-z0-9_-]+)/g;
  const staffIds = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(content)) !== null) {
    staffIds.add(match[1]);
  }

  if (staffIds.size === 0) return;

  // Look up users by staffId
  for (const staffId of staffIds) {
    try {
      const user = await db.prepare(
        `SELECT id, displayName FROM users WHERE staffId = ?`
      ).bind(staffId).first<{ id: string; displayName: string }>();

      if (user && user.id !== senderId) {
        await sendResearchNotification(db, user.id, {
          type: 'research_mention',
          title: 'You were mentioned',
          message: `${senderName} mentioned you in a ${contextType}`,
          link: `/research/projects/${projectId}`,
          actorId: senderId,
          actorName: senderName,
          resourceId: projectId,
          resourceType: 'research_project',
          priority: 'normal',
        });
      }
    } catch (e) {
      console.error(`Failed to notify mentioned user @${staffId}:`, e);
    }
  }
}
