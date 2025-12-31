-- LMS Badges Migration
-- Add badges for learning activities

INSERT OR IGNORE INTO badges (id, name, description, icon, category, xpReward, rarity) VALUES
  ('badge-first-course', 'First Steps', 'Enrolled in your first course', 'BookOpen', 'learning', 100, 'common'),
  ('badge-first-completion', 'Course Graduate', 'Completed your first course', 'GraduationCap', 'learning', 200, 'common'),
  ('badge-5-courses', 'Dedicated Learner', 'Completed 5 courses', 'Award', 'learning', 500, 'rare'),
  ('badge-10-courses', 'Master Learner', 'Completed 10 courses', 'Trophy', 'learning', 1000, 'epic'),
  ('badge-first-quiz', 'Quiz Taker', 'Passed your first quiz', 'Target', 'learning', 100, 'common'),
  ('badge-perfect-quiz', 'Perfect Score', 'Achieved 100% on a quiz', 'Star', 'learning', 250, 'rare'),
  ('badge-10-quizzes', 'Quiz Master', 'Passed 10 quizzes', 'Zap', 'learning', 400, 'rare'),
  ('badge-first-assignment', 'Assignment Ace', 'Submitted your first assignment', 'FileText', 'learning', 100, 'common'),
  ('badge-10-assignments', 'Assignment Pro', 'Submitted 10 assignments', 'ClipboardCheck', 'learning', 400, 'rare'),
  ('badge-first-certificate', 'Certified', 'Earned your first certificate', 'Award', 'achievement', 300, 'rare'),
  ('badge-5-certificates', 'Certificate Collector', 'Earned 5 certificates', 'Medal', 'achievement', 750, 'epic'),
  ('badge-discussion-starter', 'Discussion Leader', 'Started 5 course discussions', 'MessageSquare', 'community', 200, 'common'),
  ('badge-high-achiever', 'High Achiever', 'Achieved A grade in 3 courses', 'Sparkles', 'achievement', 500, 'epic'),
  ('badge-fast-learner', 'Fast Learner', 'Completed a course within 7 days of enrollment', 'Rocket', 'achievement', 300, 'rare');
