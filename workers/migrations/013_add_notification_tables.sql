-- ============================================
-- NOTIFICATION SYSTEM TEMPLATES
-- Migration: 013_add_notification_tables.sql
-- Note: Tables already exist, this just seeds templates
-- ============================================

-- Insert default notification templates (ignore if they exist)
INSERT OR IGNORE INTO notification_templates (id, type, titleTemplate, messageTemplate, icon, color, defaultPriority) VALUES
  ('tpl-welcome', 'welcome', 'Welcome to OHCS E-Library!', 'Start exploring Ghana''s premier civil service knowledge platform. Check out the library, join discussions, and earn XP!', 'Sparkles', '#006B3F', 'high'),
  ('tpl-doc-new', 'document', 'New Document Available', 'A new document has been published.', 'FileText', '#3B82F6', 'normal'),
  ('tpl-doc-approved', 'document_approved', 'Your Document Was Approved', 'Your document has been approved and is now live.', 'CheckCircle', '#10B981', 'normal'),
  ('tpl-doc-rejected', 'document_rejected', 'Document Needs Revision', 'Your document needs some changes before it can be published.', 'XCircle', '#EF4444', 'high'),
  ('tpl-forum-reply', 'forum_reply', 'New Reply to Your Topic', 'Someone replied to your forum topic.', 'MessageSquare', '#8B5CF6', 'normal'),
  ('tpl-forum-mention', 'forum_mention', 'You Were Mentioned', 'Someone mentioned you in a forum post.', 'AtSign', '#8B5CF6', 'normal'),
  ('tpl-group-invite', 'group_invite', 'Group Invitation', 'You''ve been invited to join a group.', 'UserPlus', '#F59E0B', 'high'),
  ('tpl-group-post', 'group_post', 'New Group Post', 'There''s new activity in your group.', 'Users', '#F59E0B', 'normal'),
  ('tpl-badge-earned', 'badge_earned', 'New Badge Unlocked!', 'Congratulations! You''ve earned a new badge.', 'Award', '#FCD116', 'normal'),
  ('tpl-level-up', 'level_up', 'Level Up!', 'You''ve reached a new level! Keep up the great work.', 'TrendingUp', '#FCD116', 'normal'),
  ('tpl-xp-earned', 'xp_earned', 'XP Earned!', 'You earned XP for your activity.', 'Zap', '#10B981', 'low'),
  ('tpl-message', 'message', 'New Message', 'You have a new message.', 'MessageSquare', '#006B3F', 'normal'),
  ('tpl-security', 'security', 'Security Alert', 'There''s a security-related update for your account.', 'Shield', '#EF4444', 'urgent'),
  ('tpl-announcement', 'announcement', 'Announcement', 'There''s a new system announcement.', 'AlertCircle', '#F59E0B', 'high'),
  ('tpl-streak', 'streak', 'Streak Achievement!', 'Amazing! You''ve maintained your login streak!', 'Flame', '#F97316', 'normal'),
  ('tpl-challenge', 'challenge_complete', 'Challenge Completed!', 'You''ve completed a challenge!', 'Target', '#10B981', 'normal'),
  ('tpl-like', 'like', 'Someone Liked Your Post', 'Your post received a like.', 'Heart', '#EC4899', 'low'),
  ('tpl-follow', 'follow', 'New Follower', 'Someone started following you.', 'UserPlus', '#006B3F', 'low');
