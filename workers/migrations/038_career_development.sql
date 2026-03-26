-- ============================================================================
-- Career Development System Tables
-- Ghana Civil Service Career Management
-- ============================================================================

-- Career Paths: progression routes within the civil service
CREATE TABLE IF NOT EXISTS career_paths (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  gradeLevel TEXT,
  department TEXT,
  category TEXT,
  track TEXT,
  icon TEXT DEFAULT 'Briefcase',
  color TEXT DEFAULT '#006B3F',
  totalYearsToTop INTEGER DEFAULT 25,
  requirements TEXT DEFAULT '[]',  -- JSON array
  skills TEXT DEFAULT '[]',        -- JSON array
  isActive INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Career Path Grades: individual grade levels within a career path
CREATE TABLE IF NOT EXISTS career_path_grades (
  id TEXT PRIMARY KEY,
  pathId TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  track TEXT,
  salaryMin REAL DEFAULT 0,
  salaryMax REAL DEFAULT 0,
  salaryCurrency TEXT DEFAULT 'GHS',
  yearsRequired INTEGER DEFAULT 0,
  description TEXT,
  responsibilities TEXT DEFAULT '[]',  -- JSON array
  sortOrder INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (pathId) REFERENCES career_paths(id) ON DELETE CASCADE
);

-- Career Competencies: competency framework categories and items
CREATE TABLE IF NOT EXISTS career_competencies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  color TEXT DEFAULT 'blue',
  icon TEXT DEFAULT 'Briefcase',
  skills TEXT DEFAULT '[]',          -- JSON array
  parentId TEXT,                     -- for sub-competencies
  sortOrder INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Competency Assessments: user self-assessments
CREATE TABLE IF NOT EXISTS competency_assessments (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  competencyId TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 4),
  notes TEXT,
  assessedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (competencyId) REFERENCES career_competencies(id) ON DELETE CASCADE
);

-- Development Plans: personal development plans
CREATE TABLE IF NOT EXISTS development_plans (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  targetRole TEXT,
  goals TEXT DEFAULT '[]',           -- JSON array of goals with milestones
  targetDate TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','completed','archived')),
  progress INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Mentorship Connections: mentor-mentee relationships
CREATE TABLE IF NOT EXISTS mentorship_connections (
  id TEXT PRIMARY KEY,
  mentorId TEXT NOT NULL,
  menteeId TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','completed')),
  message TEXT,
  purpose TEXT,
  goals TEXT DEFAULT '[]',           -- JSON array
  preferredDuration TEXT,
  mentorResponse TEXT,
  respondedAt TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (mentorId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (menteeId) REFERENCES users(id) ON DELETE CASCADE
);

-- Career Mentors: users who are available as mentors
CREATE TABLE IF NOT EXISTS career_mentors (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  title TEXT,
  grade TEXT,
  ministry TEXT,
  expertise TEXT DEFAULT '[]',       -- JSON array
  yearsOfService INTEGER DEFAULT 0,
  specializations TEXT DEFAULT '[]', -- JSON array
  availableFor TEXT DEFAULT '[]',    -- JSON array
  rating REAL DEFAULT 0,
  totalMentees INTEGER DEFAULT 0,
  activeMentees INTEGER DEFAULT 0,
  isAvailable INTEGER DEFAULT 1,
  bio TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Promotion tracking: user promotion status
CREATE TABLE IF NOT EXISTS promotion_status (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  currentGradeId TEXT,
  currentGradeTitle TEXT,
  nextGradeId TEXT,
  nextGradeTitle TEXT,
  yearsInCurrentGrade REAL DEFAULT 0,
  totalServiceYears REAL DEFAULT 0,
  eligibilityDate TEXT,
  isEligible INTEGER DEFAULT 0,
  criteriaProgress TEXT DEFAULT '[]', -- JSON array
  overallProgress INTEGER DEFAULT 0,
  blockers TEXT DEFAULT '[]',         -- JSON array
  nextSteps TEXT DEFAULT '[]',        -- JSON array
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_career_path_grades_pathId ON career_path_grades(pathId);
CREATE INDEX IF NOT EXISTS idx_competency_assessments_userId ON competency_assessments(userId);
CREATE INDEX IF NOT EXISTS idx_competency_assessments_competencyId ON competency_assessments(competencyId);
CREATE INDEX IF NOT EXISTS idx_development_plans_userId ON development_plans(userId);
CREATE INDEX IF NOT EXISTS idx_mentorship_connections_mentorId ON mentorship_connections(mentorId);
CREATE INDEX IF NOT EXISTS idx_mentorship_connections_menteeId ON mentorship_connections(menteeId);
CREATE INDEX IF NOT EXISTS idx_career_mentors_userId ON career_mentors(userId);
CREATE INDEX IF NOT EXISTS idx_promotion_status_userId ON promotion_status(userId);

-- ============================================================================
-- SEED DATA: Ghana Civil Service Career Paths
-- ============================================================================

-- Administrative Service Path
INSERT OR IGNORE INTO career_paths (id, title, description, category, track, icon, color, totalYearsToTop) VALUES
  ('path-admin', 'Administrative Service', 'General administrative and management roles across ministries', 'general_administration', 'administrative', 'Briefcase', '#006B3F', 25),
  ('path-hr', 'Human Resources Management', 'Personnel management and organizational development', 'human_resources', 'professional', 'Users', '#8B5CF6', 25),
  ('path-it', 'Information Technology', 'IT systems, digital transformation and technology management', 'information_technology', 'technical', 'Monitor', '#3B82F6', 22),
  ('path-finance', 'Finance & Audit', 'Financial management, accounting and audit services', 'finance_audit', 'professional', 'DollarSign', '#F59E0B', 25),
  ('path-planning', 'Planning & Policy', 'National development planning and policy formulation', 'planning_policy', 'professional', 'Target', '#10B981', 25);

-- Administrative Service Grades
INSERT OR IGNORE INTO career_path_grades (id, pathId, code, title, level, track, salaryMin, salaryMax, salaryCurrency, yearsRequired, description, responsibilities, sortOrder) VALUES
  ('grade-1', 'path-admin', 'AS-1', 'Administrative Assistant', 'entry', 'administrative', 1800, 2400, 'GHS', 0, 'Entry-level administrative support', '["Document management","Basic correspondence","Office support"]', 1),
  ('grade-2', 'path-admin', 'AS-2', 'Senior Administrative Assistant', 'junior', 'administrative', 2400, 3200, 'GHS', 3, 'Senior administrative support', '["Team coordination","Report preparation","Process management"]', 2),
  ('grade-3', 'path-admin', 'AS-3', 'Administrative Officer', 'middle', 'administrative', 3200, 4500, 'GHS', 6, 'Mid-level administrative management', '["Policy implementation","Staff supervision","Budget management"]', 3),
  ('grade-4', 'path-admin', 'AS-4', 'Principal Administrative Officer', 'senior', 'administrative', 4500, 6000, 'GHS', 10, 'Senior administrative leadership', '["Strategic planning","Department management","Policy development"]', 4),
  ('grade-5', 'path-admin', 'AS-5', 'Assistant Director', 'management', 'administrative', 6000, 8000, 'GHS', 15, 'Management level leadership', '["Divisional leadership","Resource allocation","Performance management"]', 5),
  ('grade-6', 'path-admin', 'AS-6', 'Deputy Director', 'executive', 'administrative', 8000, 12000, 'GHS', 20, 'Executive leadership', '["Departmental strategy","Cross-functional coordination","Senior stakeholder management"]', 6),
  ('grade-7', 'path-admin', 'AS-7', 'Director', 'director', 'administrative', 12000, 18000, 'GHS', 25, 'Director level', '["Organizational leadership","Policy direction","Ministerial advisory"]', 7);

-- HR Grades
INSERT OR IGNORE INTO career_path_grades (id, pathId, code, title, level, track, salaryMin, salaryMax, salaryCurrency, yearsRequired, description, responsibilities, sortOrder) VALUES
  ('hr-1', 'path-hr', 'HR-1', 'HR Assistant', 'entry', 'professional', 1900, 2500, 'GHS', 0, 'Entry-level HR support', '["Record keeping","Recruitment support","Employee queries"]', 1),
  ('hr-2', 'path-hr', 'HR-2', 'HR Officer', 'junior', 'professional', 2500, 3500, 'GHS', 3, 'Junior HR management', '["Recruitment coordination","Training administration","Policy compliance"]', 2),
  ('hr-3', 'path-hr', 'HR-3', 'Senior HR Officer', 'middle', 'professional', 3500, 5000, 'GHS', 6, 'Mid-level HR specialist', '["Performance management","Employee relations","Compensation analysis"]', 3),
  ('hr-4', 'path-hr', 'HR-4', 'Principal HR Officer', 'senior', 'professional', 5000, 7000, 'GHS', 10, 'Senior HR leadership', '["HR strategy","Talent development","Organizational design"]', 4),
  ('hr-5', 'path-hr', 'HR-5', 'HR Manager', 'management', 'professional', 7000, 10000, 'GHS', 15, 'HR management', '["Departmental HR oversight","Change management","Workforce planning"]', 5);

-- IT Grades
INSERT OR IGNORE INTO career_path_grades (id, pathId, code, title, level, track, salaryMin, salaryMax, salaryCurrency, yearsRequired, description, responsibilities, sortOrder) VALUES
  ('it-1', 'path-it', 'IT-1', 'IT Support Technician', 'entry', 'technical', 2000, 2800, 'GHS', 0, 'Entry-level IT support', '["Helpdesk support","Hardware maintenance","User training"]', 1),
  ('it-2', 'path-it', 'IT-2', 'Systems Administrator', 'junior', 'technical', 2800, 4000, 'GHS', 3, 'Systems management', '["Server administration","Network management","Security monitoring"]', 2),
  ('it-3', 'path-it', 'IT-3', 'Senior Systems Analyst', 'middle', 'technical', 4000, 6000, 'GHS', 6, 'Systems analysis and design', '["Solution architecture","Process automation","Vendor management"]', 3),
  ('it-4', 'path-it', 'IT-4', 'IT Manager', 'senior', 'technical', 6000, 9000, 'GHS', 10, 'IT management', '["Digital strategy","Team leadership","Project management"]', 4),
  ('it-5', 'path-it', 'IT-5', 'Chief Technology Officer', 'executive', 'technical', 9000, 15000, 'GHS', 15, 'Technology leadership', '["Digital transformation","IT governance","Innovation strategy"]', 5);

-- Finance Grades
INSERT OR IGNORE INTO career_path_grades (id, pathId, code, title, level, track, salaryMin, salaryMax, salaryCurrency, yearsRequired, description, responsibilities, sortOrder) VALUES
  ('fin-1', 'path-finance', 'FIN-1', 'Accounting Assistant', 'entry', 'professional', 1900, 2600, 'GHS', 0, 'Entry-level accounting support', '["Data entry","Invoice processing","Filing"]', 1),
  ('fin-2', 'path-finance', 'FIN-2', 'Accountant', 'junior', 'professional', 2600, 3800, 'GHS', 3, 'Junior accounting', '["Financial reporting","Reconciliation","Tax compliance"]', 2),
  ('fin-3', 'path-finance', 'FIN-3', 'Senior Accountant', 'middle', 'professional', 3800, 5500, 'GHS', 6, 'Senior accounting specialist', '["Budget preparation","Audit support","Financial analysis"]', 3),
  ('fin-4', 'path-finance', 'FIN-4', 'Chief Accountant', 'senior', 'professional', 5500, 8000, 'GHS', 10, 'Chief accounting officer', '["Financial strategy","Compliance oversight","Internal controls"]', 4),
  ('fin-5', 'path-finance', 'FIN-5', 'Director of Finance', 'executive', 'professional', 8000, 14000, 'GHS', 15, 'Financial leadership', '["Fiscal policy","Revenue management","Stakeholder reporting"]', 5);

-- Planning Grades
INSERT OR IGNORE INTO career_path_grades (id, pathId, code, title, level, track, salaryMin, salaryMax, salaryCurrency, yearsRequired, description, responsibilities, sortOrder) VALUES
  ('plan-1', 'path-planning', 'PL-1', 'Planning Assistant', 'entry', 'professional', 2000, 2700, 'GHS', 0, 'Entry-level planning support', '["Data collection","Report drafting","Monitoring support"]', 1),
  ('plan-2', 'path-planning', 'PL-2', 'Planning Officer', 'junior', 'professional', 2700, 3800, 'GHS', 3, 'Junior planning officer', '["Policy research","Programme monitoring","Impact assessment"]', 2),
  ('plan-3', 'path-planning', 'PL-3', 'Senior Planning Officer', 'middle', 'professional', 3800, 5500, 'GHS', 6, 'Senior planning specialist', '["Policy formulation","Strategic plans","Stakeholder engagement"]', 3),
  ('plan-4', 'path-planning', 'PL-4', 'Chief Planning Officer', 'senior', 'professional', 5500, 8000, 'GHS', 10, 'Chief planning officer', '["National policy","Development agenda","Cross-sector coordination"]', 4),
  ('plan-5', 'path-planning', 'PL-5', 'Director of Planning', 'executive', 'professional', 8000, 14000, 'GHS', 15, 'Planning leadership', '["National development strategy","Policy direction","International cooperation"]', 5);

-- ============================================================================
-- SEED DATA: Ghana Civil Service Competency Framework (7 Core Competencies)
-- ============================================================================

-- Teamwork
INSERT OR IGNORE INTO career_competencies (id, name, description, category, level, color, icon, skills, sortOrder) VALUES
  ('comp-teamwork', 'Teamwork', 'Working collaboratively with others to achieve shared goals and organizational objectives', 'Teamwork', 0, 'blue', 'Users', '[]', 1),
  ('comp-collaboration', 'Collaboration', 'Works effectively with colleagues across departments and levels', 'Teamwork', 1, 'blue', 'Users', '["Team Building Workshop","Collaborative Leadership"]', 1),
  ('comp-support', 'Supporting Others', 'Provides assistance and support to team members to achieve collective success', 'Teamwork', 1, 'blue', 'Users', '["Peer Coaching Skills","Mentorship Program"]', 2);

-- Professionalism
INSERT OR IGNORE INTO career_competencies (id, name, description, category, level, color, icon, skills, sortOrder) VALUES
  ('comp-professionalism', 'Professionalism', 'Maintaining high standards of conduct, appearance, and work ethic in the civil service', 'Professionalism', 0, 'purple', 'Briefcase', '[]', 2),
  ('comp-conduct', 'Professional Conduct', 'Demonstrates appropriate behavior and demeanor in all professional interactions', 'Professionalism', 1, 'purple', 'Briefcase', '["Professional Ethics","Workplace Excellence"]', 1),
  ('comp-development', 'Continuous Development', 'Commits to ongoing learning and professional growth', 'Professionalism', 1, 'purple', 'Briefcase', '["Career Development Planning","Lifelong Learning Strategies"]', 2);

-- Organisation & Management
INSERT OR IGNORE INTO career_competencies (id, name, description, category, level, color, icon, skills, sortOrder) VALUES
  ('comp-organisation', 'Organisation & Management', 'Planning, organizing, and managing resources effectively to achieve objectives', 'Organisation & Management', 0, 'emerald', 'Briefcase', '[]', 3),
  ('comp-planning', 'Planning & Organizing', 'Develops and implements effective plans to achieve goals', 'Organisation & Management', 1, 'emerald', 'Briefcase', '["Strategic Planning","Project Management Fundamentals"]', 1),
  ('comp-resource', 'Resource Management', 'Manages human, financial, and material resources efficiently', 'Organisation & Management', 1, 'emerald', 'Briefcase', '["Public Financial Management","Resource Optimization"]', 2);

-- Productivity
INSERT OR IGNORE INTO career_competencies (id, name, description, category, level, color, icon, skills, sortOrder) VALUES
  ('comp-productivity', 'Maximising & Maintaining Productivity', 'Achieving optimal output while maintaining quality and efficiency in service delivery', 'Maximising & Maintaining Productivity', 0, 'orange', 'BarChart3', '[]', 4),
  ('comp-efficiency', 'Work Efficiency', 'Completes tasks effectively within required timeframes', 'Maximising & Maintaining Productivity', 1, 'orange', 'BarChart3', '["Time Management","Productivity Enhancement"]', 1),
  ('comp-quality', 'Quality Focus', 'Maintains high standards of quality in all work outputs', 'Maximising & Maintaining Productivity', 1, 'orange', 'BarChart3', '["Quality Management","Continuous Improvement"]', 2);

-- Leadership
INSERT OR IGNORE INTO career_competencies (id, name, description, category, level, color, icon, skills, sortOrder) VALUES
  ('comp-leadership', 'Leadership', 'Guiding, inspiring, and developing others to achieve organizational goals', 'Leadership', 0, 'violet', 'Star', '[]', 5),
  ('comp-vision', 'Vision & Direction', 'Provides clear direction and inspires others towards shared goals', 'Leadership', 1, 'violet', 'Star', '["Leadership Development Program","Visionary Leadership"]', 1),
  ('comp-influence', 'Influence & Motivation', 'Inspires and motivates others to perform at their best', 'Leadership', 1, 'violet', 'Star', '["Motivational Leadership","Emotional Intelligence"]', 2);

-- Integrity
INSERT OR IGNORE INTO career_competencies (id, name, description, category, level, color, icon, skills, sortOrder) VALUES
  ('comp-integrity', 'Integrity', 'Demonstrating honesty, transparency, and ethical behavior in all actions', 'Integrity', 0, 'teal', 'Shield', '[]', 6),
  ('comp-ethics', 'Ethical Conduct', 'Adheres to ethical standards and acts with honesty', 'Integrity', 1, 'teal', 'Shield', '["Ethics in Public Service","Anti-Corruption Training"]', 1),
  ('comp-accountability', 'Accountability', 'Takes responsibility for actions and decisions', 'Integrity', 1, 'teal', 'Shield', '["Accountability in Public Service","Transparent Governance"]', 2);

-- Communication
INSERT OR IGNORE INTO career_competencies (id, name, description, category, level, color, icon, skills, sortOrder) VALUES
  ('comp-communication', 'Communication', 'Exchanging information effectively through verbal, written, and non-verbal means', 'Communication', 0, 'cyan', 'MessageSquare', '[]', 7),
  ('comp-verbal', 'Verbal Communication', 'Expresses ideas clearly and effectively in speech', 'Communication', 1, 'cyan', 'MessageSquare', '["Public Speaking","Presentation Skills"]', 1),
  ('comp-written', 'Written Communication', 'Produces clear, concise, and professional written documents', 'Communication', 1, 'cyan', 'MessageSquare', '["Business Writing","Report Writing for Civil Servants"]', 2);

-- ============================================================================
-- SEED DATA: Career Mentors
-- ============================================================================

INSERT OR IGNORE INTO career_mentors (id, userId, title, grade, ministry, expertise, yearsOfService, specializations, availableFor, rating, totalMentees, activeMentees, isAvailable, bio) VALUES
  ('mentor-1', 'mentor-user-1', 'Director of Administration', 'Director', 'Ministry of Finance',
   '["Strategic Planning","Public Administration","Leadership Development","Policy Analysis"]',
   28, '["Career Development","Executive Coaching","Change Management"]',
   '["career_guidance","promotion_prep","leadership"]',
   4.9, 45, 3, 1,
   'With over 28 years in the Ghana Civil Service, I have guided numerous officers through career transitions and promotions. My approach focuses on developing well-rounded public servants who can lead with integrity.'),
  ('mentor-2', 'mentor-user-2', 'Deputy Director, Human Resources', 'Deputy Director', 'Office of Head of Civil Service',
   '["Human Resources","Talent Management","Performance Management","Training & Development"]',
   22, '["HR Best Practices","Employee Relations","Competency Frameworks"]',
   '["career_guidance","skill_development","promotion_prep"]',
   4.8, 38, 4, 1,
   'I specialize in helping civil servants understand HR systems and develop the competencies needed for career advancement. Let me help you navigate your career path effectively.'),
  ('mentor-3', 'mentor-user-3', 'Chief IT Officer', 'Chief Director', 'Ministry of Communications',
   '["Digital Transformation","IT Strategy","Project Management","Systems Architecture"]',
   20, '["E-Government","Cybersecurity","Agile Methodologies"]',
   '["skill_development","career_guidance","leadership"]',
   4.7, 25, 2, 1,
   'Leading Ghana''s digital transformation efforts has taught me the importance of continuous learning and adaptation. I help IT professionals navigate the evolving technology landscape in the public sector.');
