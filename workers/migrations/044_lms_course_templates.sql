-- Migration 044: LMS Course Templates
-- Provides a template library for instructors to quickly scaffold new courses

CREATE TABLE IF NOT EXISTS lms_course_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'beginner',
  estimatedDuration INTEGER NOT NULL DEFAULT 60,
  moduleStructure TEXT NOT NULL,
  objectives TEXT,
  prerequisites TEXT,
  tags TEXT,
  isOfficial INTEGER DEFAULT 0,
  usageCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lms_course_templates_category ON lms_course_templates(category);
CREATE INDEX IF NOT EXISTS idx_lms_course_templates_level ON lms_course_templates(level);

-- Seed 8 official templates

INSERT INTO lms_course_templates (id, name, description, category, level, estimatedDuration, moduleStructure, objectives, prerequisites, tags, isOfficial) VALUES
(
  'tmpl-ethics-compliance',
  'Ethics & Compliance Training',
  'A comprehensive course template covering public sector ethics, anti-corruption measures, and regulatory compliance. Ideal for onboarding or annual refresher training.',
  'compliance',
  'beginner',
  135,
  '[{"title":"Module 1: Foundations of Public Sector Ethics","lessons":[{"title":"Welcome & Course Overview","type":"text","duration":10},{"title":"The Public Service Code of Conduct","type":"text","duration":20},{"title":"Core Ethical Principles","type":"text","duration":20},{"title":"Module 1 Quiz","type":"quiz","duration":10}]},{"title":"Module 2: Anti-Corruption & Accountability","lessons":[{"title":"Understanding Corruption in the Public Sector","type":"text","duration":20},{"title":"Whistleblower Protections & Reporting Channels","type":"text","duration":15},{"title":"Case Studies: Real-World Scenarios","type":"text","duration":15},{"title":"Module 2 Quiz","type":"quiz","duration":10}]},{"title":"Module 3: Compliance in Practice","lessons":[{"title":"Gifts, Conflicts of Interest & Disclosure","type":"text","duration":15},{"title":"Record Keeping & Audit Readiness","type":"text","duration":15},{"title":"Final Assessment","type":"quiz","duration":15}]}]',
  '["Understand the ethical obligations of public servants","Identify and report corrupt practices","Apply compliance frameworks in daily work","Navigate conflicts of interest appropriately"]',
  'None — suitable for all staff levels',
  '["ethics","compliance","governance","anti-corruption","public service"]',
  1
),
(
  'tmpl-it-skills',
  'IT Skills Development',
  'Build essential digital literacy and IT competencies for government employees. Covers productivity tools, cybersecurity basics, data management, and emerging technologies.',
  'it',
  'beginner',
  240,
  '[{"title":"Module 1: Digital Literacy Foundations","lessons":[{"title":"Welcome & Digital Skills Assessment","type":"text","duration":10},{"title":"Navigating Government IT Systems","type":"text","duration":20},{"title":"Email, Calendar & Communication Tools","type":"text","duration":20},{"title":"Module 1 Quiz","type":"quiz","duration":10}]},{"title":"Module 2: Productivity & Collaboration","lessons":[{"title":"Document Creation & Formatting","type":"text","duration":20},{"title":"Spreadsheets for Data Analysis","type":"text","duration":25},{"title":"Presentation Skills & Tools","type":"text","duration":20},{"title":"Module 2 Quiz","type":"quiz","duration":10}]},{"title":"Module 3: Cybersecurity Awareness","lessons":[{"title":"Password Security & Authentication","type":"text","duration":15},{"title":"Recognising Phishing & Social Engineering","type":"text","duration":20},{"title":"Data Protection & Privacy","type":"text","duration":20},{"title":"Module 3 Quiz","type":"quiz","duration":10}]},{"title":"Module 4: Emerging Technologies","lessons":[{"title":"Cloud Computing Basics","type":"text","duration":15},{"title":"Introduction to Data Analytics","type":"text","duration":20},{"title":"AI & Automation in Government","type":"text","duration":15},{"title":"Final Assessment","type":"quiz","duration":15}]}]',
  '["Navigate core government IT systems confidently","Use productivity tools effectively","Recognise and respond to cybersecurity threats","Understand emerging technologies relevant to public service"]',
  'Basic computer access and internet connectivity',
  '["IT","digital literacy","cybersecurity","productivity","technology"]',
  1
),
(
  'tmpl-management-leadership',
  'Management & Leadership',
  'Develop management competencies and leadership skills for mid-level and senior public servants. Covers strategic thinking, team management, decision-making, and change leadership.',
  'leadership',
  'intermediate',
  300,
  '[{"title":"Module 1: Leadership Foundations","lessons":[{"title":"Welcome & Self-Assessment","type":"text","duration":15},{"title":"Leadership vs Management","type":"text","duration":20},{"title":"Leadership Styles in the Public Sector","type":"text","duration":25},{"title":"Module 1 Quiz","type":"quiz","duration":10}]},{"title":"Module 2: People Management","lessons":[{"title":"Building & Motivating Teams","type":"text","duration":25},{"title":"Performance Management & Feedback","type":"text","duration":20},{"title":"Managing Conflict & Difficult Conversations","type":"text","duration":25},{"title":"Module 2 Quiz","type":"quiz","duration":10}]},{"title":"Module 3: Strategic Thinking & Decision Making","lessons":[{"title":"Strategic Planning in Government","type":"text","duration":25},{"title":"Evidence-Based Decision Making","type":"text","duration":20},{"title":"Risk Assessment & Mitigation","type":"text","duration":20},{"title":"Module 3 Quiz","type":"quiz","duration":10}]},{"title":"Module 4: Change Leadership","lessons":[{"title":"Leading Organisational Change","type":"text","duration":25},{"title":"Stakeholder Engagement & Communication","type":"text","duration":20},{"title":"Building a Culture of Innovation","type":"text","duration":20},{"title":"Final Assessment","type":"quiz","duration":15}]}]',
  '["Apply effective leadership styles to different situations","Manage team performance and resolve conflicts","Make evidence-based strategic decisions","Lead organisational change initiatives"]',
  'At least 2 years of supervisory experience recommended',
  '["leadership","management","strategy","teams","change management"]',
  1
),
(
  'tmpl-policy-development',
  'Policy Development Workshop',
  'A structured template for teaching the policy development lifecycle. Covers policy analysis, drafting, stakeholder consultation, implementation, and evaluation.',
  'general',
  'intermediate',
  180,
  '[{"title":"Module 1: Policy Analysis & Research","lessons":[{"title":"Welcome & Policy Development Overview","type":"text","duration":10},{"title":"Identifying Policy Problems","type":"text","duration":25},{"title":"Research Methods & Evidence Gathering","type":"text","duration":25},{"title":"Stakeholder Mapping & Analysis","type":"text","duration":20},{"title":"Module 1 Quiz","type":"quiz","duration":10}]},{"title":"Module 2: Policy Drafting & Consultation","lessons":[{"title":"Structuring a Policy Document","type":"text","duration":20},{"title":"Writing Clear Policy Language","type":"text","duration":20},{"title":"Consultation Processes & Public Engagement","type":"text","duration":20},{"title":"Module 2 Quiz","type":"quiz","duration":10}]},{"title":"Module 3: Implementation & Evaluation","lessons":[{"title":"Implementation Planning & Timelines","type":"text","duration":20},{"title":"Monitoring & Evaluation Frameworks","type":"text","duration":20},{"title":"Policy Review & Iteration","type":"text","duration":15},{"title":"Final Assessment","type":"quiz","duration":15}]}]',
  '["Conduct thorough policy analysis and research","Draft clear and effective policy documents","Manage stakeholder consultation processes","Design implementation and evaluation plans"]',
  'Familiarity with government structures and processes',
  '["policy","governance","drafting","consultation","evaluation"]',
  1
),
(
  'tmpl-customer-service',
  'Customer Service Excellence',
  'Train frontline staff to deliver outstanding public service. Covers communication skills, complaint handling, service standards, and citizen engagement.',
  'communication',
  'beginner',
  150,
  '[{"title":"Module 1: Service Delivery Fundamentals","lessons":[{"title":"Welcome & The Citizen-First Approach","type":"text","duration":10},{"title":"Understanding Citizen Needs & Expectations","type":"text","duration":20},{"title":"Government Service Standards","type":"text","duration":20},{"title":"Module 1 Quiz","type":"quiz","duration":10}]},{"title":"Module 2: Communication & Interpersonal Skills","lessons":[{"title":"Active Listening & Empathy","type":"text","duration":20},{"title":"Professional Written Communication","type":"text","duration":20},{"title":"Telephone & Counter Service Etiquette","type":"text","duration":15},{"title":"Module 2 Quiz","type":"quiz","duration":10}]},{"title":"Module 3: Handling Complaints & Difficult Situations","lessons":[{"title":"Complaint Resolution Framework","type":"text","duration":20},{"title":"De-escalation Techniques","type":"text","duration":20},{"title":"Continuous Improvement & Feedback Loops","type":"text","duration":15},{"title":"Final Assessment","type":"quiz","duration":15}]}]',
  '["Deliver citizen-centred public services","Communicate effectively in person and in writing","Handle complaints professionally and empathetically","Apply continuous improvement to service delivery"]',
  'None — suitable for all frontline staff',
  '["customer service","communication","complaints","service delivery","citizens"]',
  1
),
(
  'tmpl-financial-management',
  'Financial Management',
  'Essential financial management training for public sector officers. Covers budgeting, procurement, financial reporting, and audit compliance.',
  'general',
  'intermediate',
  195,
  '[{"title":"Module 1: Public Financial Management Basics","lessons":[{"title":"Welcome & Course Roadmap","type":"text","duration":10},{"title":"The Public Financial Management Framework","type":"text","duration":25},{"title":"Budget Cycle & Planning Process","type":"text","duration":25},{"title":"Module 1 Quiz","type":"quiz","duration":10}]},{"title":"Module 2: Procurement & Expenditure","lessons":[{"title":"Public Procurement Regulations","type":"text","duration":25},{"title":"Contract Management & Monitoring","type":"text","duration":20},{"title":"Expenditure Control & Authorisation","type":"text","duration":20},{"title":"Module 2 Quiz","type":"quiz","duration":10}]},{"title":"Module 3: Reporting & Accountability","lessons":[{"title":"Financial Reporting Standards","type":"text","duration":20},{"title":"Audit Preparation & Compliance","type":"text","duration":20},{"title":"Anti-Fraud Measures & Internal Controls","type":"text","duration":20},{"title":"Final Assessment","type":"quiz","duration":15}]}]',
  '["Understand the public financial management framework","Navigate procurement regulations and processes","Prepare accurate financial reports","Maintain audit readiness and internal controls"]',
  'Basic understanding of government budgeting helpful',
  '["finance","budgeting","procurement","audit","accountability"]',
  1
),
(
  'tmpl-project-management',
  'Project Management',
  'A practical project management course template tailored for government projects. Covers planning, execution, stakeholder management, risk mitigation, and project closure.',
  'general',
  'intermediate',
  270,
  '[{"title":"Module 1: Project Initiation & Planning","lessons":[{"title":"Welcome & What is Project Management?","type":"text","duration":10},{"title":"Defining Project Scope & Objectives","type":"text","duration":20},{"title":"Work Breakdown Structure & Scheduling","type":"text","duration":25},{"title":"Resource Planning & Budgeting","type":"text","duration":20},{"title":"Module 1 Quiz","type":"quiz","duration":10}]},{"title":"Module 2: Stakeholder & Risk Management","lessons":[{"title":"Identifying & Engaging Stakeholders","type":"text","duration":20},{"title":"Risk Identification & Assessment","type":"text","duration":25},{"title":"Developing Risk Mitigation Plans","type":"text","duration":20},{"title":"Module 2 Quiz","type":"quiz","duration":10}]},{"title":"Module 3: Execution & Monitoring","lessons":[{"title":"Leading Project Teams","type":"text","duration":20},{"title":"Tracking Progress & Managing Changes","type":"text","duration":20},{"title":"Quality Assurance & Reporting","type":"text","duration":20},{"title":"Module 3 Quiz","type":"quiz","duration":10}]},{"title":"Module 4: Closure & Lessons Learned","lessons":[{"title":"Project Handover & Documentation","type":"text","duration":15},{"title":"Post-Implementation Review","type":"text","duration":15},{"title":"Capturing & Sharing Lessons Learned","type":"text","duration":15},{"title":"Final Assessment","type":"quiz","duration":15}]}]',
  '["Plan and scope government projects effectively","Manage stakeholders and mitigate risks","Monitor project progress and manage changes","Conduct project closure and capture lessons learned"]',
  'None — suitable for anyone involved in project work',
  '["project management","planning","risk","stakeholders","execution"]',
  1
),
(
  'tmpl-health-safety',
  'Health & Safety Awareness',
  'Workplace health and safety essentials for government offices and facilities. Covers hazard identification, emergency procedures, ergonomics, and mental health awareness.',
  'general',
  'beginner',
  90,
  '[{"title":"Module 1: Workplace Hazards & Prevention","lessons":[{"title":"Welcome & Why Health & Safety Matters","type":"text","duration":10},{"title":"Identifying Workplace Hazards","type":"text","duration":20},{"title":"Fire Safety & Emergency Procedures","type":"text","duration":15},{"title":"First Aid Awareness","type":"text","duration":15},{"title":"Module 1 Quiz","type":"quiz","duration":10}]},{"title":"Module 2: Wellbeing & Ergonomics","lessons":[{"title":"Ergonomics for Office Workers","type":"text","duration":15},{"title":"Mental Health & Stress Management","type":"text","duration":15},{"title":"Reporting Incidents & Near Misses","type":"text","duration":10},{"title":"Final Assessment","type":"quiz","duration":10}]}]',
  '["Identify common workplace hazards","Follow emergency and evacuation procedures","Set up an ergonomic workstation","Recognise signs of stress and support mental wellbeing"]',
  'None — mandatory for all staff',
  '["health","safety","workplace","ergonomics","wellbeing"]',
  1
);
