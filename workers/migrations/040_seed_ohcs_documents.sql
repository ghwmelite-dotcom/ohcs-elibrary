-- Seed Document Library with real Ghana Civil Service documents from ohcs.gov.gh
-- Uses INSERT OR IGNORE for idempotent re-runs

-- Ensure system user exists for authorId FK
INSERT OR IGNORE INTO users (id, email, passwordHash, displayName, firstName, lastName, role, isActive, createdAt, updatedAt)
VALUES ('system', 'system@ohcs.gov.gh', 'SYSTEM_NO_LOGIN', 'OHCS System', 'OHCS', 'System', 'admin', 1, datetime('now'), datetime('now'));

-- ============================================================================
-- COMPLIANCE & LEGAL (4 documents)
-- ============================================================================

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-001',
  '1992 Constitution of the Republic of Ghana',
  'The supreme law of Ghana, establishing the framework of government, fundamental human rights, and directive principles of state policy for all civil servants and citizens.',
  'Compliance & Legal',
  '["constitution","ghana","law","governance","legal framework"]',
  '1992-CONSTITUTION-OF-THE-REPUBLIC-OF-GHANA-1.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/1992-CONSTITUTION-OF-THE-REPUBLIC-OF-GHANA-1.pdf',
  3145728,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  487, 95, 4.8, 47, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-002',
  'Civil Service Code of Conduct',
  'Defines the ethical standards, behavioral expectations, and professional conduct requirements for all Ghana Civil Service employees.',
  'Compliance & Legal',
  '["code of conduct","ethics","standards","civil service","behavior"]',
  'Civil-Service-Code-of-Conduct.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2025/06/Civil-Service-Code-of-Conduct.pdf',
  281600,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  412, 78, 4.6, 38, 1,
  '2025-06-01T00:00:00.000Z',
  '2025-06-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-003',
  'Civil Service Sexual Harassment Policy',
  'Outlines the policy framework for preventing, reporting, and addressing sexual harassment within the Ghana Civil Service workplace.',
  'Compliance & Legal',
  '["sexual harassment","policy","workplace safety","complaints","protection"]',
  'CS-Sexual-Harassment-Policy-PDF.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/CS-Sexual-Harassment-Policy-PDF.pdf',
  646144,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  298, 56, 4.5, 29, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-004',
  'Civil Service Workplace Safety & Health Response Strategy',
  'Comprehensive strategy document for ensuring workplace safety and health standards across all civil service institutions in Ghana.',
  'Compliance & Legal',
  '["workplace safety","health","strategy","occupational health","safety standards"]',
  'CIVIL-SERVICE-WORKPLACE-SAFETY-AND-HEALTH-RESPONSE-STRATEGY-DOCUMENT.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/CIVIL-SERVICE-WORKPLACE-SAFETY-AND-HEALTH-RESPONSE-STRATEGY-DOCUMENT.pdf',
  552960,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  187, 42, 4.3, 21, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

-- ============================================================================
-- PERFORMANCE MANAGEMENT (6 documents)
-- ============================================================================

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-005',
  '2025 Civil Service Annual Performance Reporting Guidelines',
  'Guidelines and templates for completing the 2025 annual performance reports, including instructions for supervisors and employees.',
  'Performance Management',
  '["performance","reporting","guidelines","templates","2025","appraisal"]',
  '2025-CIVIL-Service-Annual-Performance-Reporting-Guidelines-and-Templates-NOV.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2025/12/2025-CIVIL-Service-Annual-Performance-Reporting-Guidelines-and-Templates-NOV.docx',
  842752,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'public',
  'published',
  'system',
  1,
  356, 89, 4.7, 42, 1,
  '2025-12-01T00:00:00.000Z',
  '2025-12-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-006',
  '2024 Civil Service Annual Performance Report',
  'The consolidated annual performance report for the Ghana Civil Service covering the 2024 fiscal year, including key achievements and challenges.',
  'Performance Management',
  '["performance report","2024","annual report","civil service","achievements"]',
  '2024-Civil-Service-Annual-Performance-Report.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2025/05/2024-Civil-Service-Annual-Performance-Report.pdf',
  7340032,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  478, 92, 4.6, 44, 1,
  '2025-05-01T00:00:00.000Z',
  '2025-05-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-007',
  '2023 Civil Service Annual Performance Report',
  'The consolidated annual performance report for the Ghana Civil Service for the 2023 fiscal year with sector-by-sector analysis.',
  'Performance Management',
  '["performance report","2023","annual report","civil service","review"]',
  '2023-Civil-Service-APR-1.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/2023-Civil-Service-APR-1.pdf',
  3145728,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  392, 73, 4.4, 35, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-008',
  '2025 Coordinating Directors Performance Agreement Template',
  'Standardized performance agreement template for Coordinating Directors to set objectives and key results for the 2025 performance cycle.',
  'Performance Management',
  '["performance agreement","coordinating directors","template","2025","objectives"]',
  '2025-Coordinating-Directors-Performance-Agreement-Template.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2025/01/2025-Coordinating-Directors-Performance-Agreement-Template.docx',
  367616,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'internal',
  'published',
  'system',
  1,
  145, 38, 4.2, 15, 1,
  '2025-01-15T00:00:00.000Z',
  '2025-01-15T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-009',
  '2025 Chief Directors Performance Agreement Template',
  'Performance agreement template for Chief Directors, outlining expected deliverables, KPIs, and assessment criteria for 2025.',
  'Performance Management',
  '["performance agreement","chief directors","template","2025","KPIs"]',
  '2025-Chief-Directors-Performance-Agreement-Template.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2025/01/2025-Chief-Directors-Performance-Agreement-Template.docx',
  516096,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'internal',
  'published',
  'system',
  1,
  132, 35, 4.1, 12, 1,
  '2025-01-15T00:00:00.000Z',
  '2025-01-15T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-010',
  '2025 Directors Performance Agreement Template',
  'Performance agreement template for Directors in the Ghana Civil Service, specifying targets and evaluation metrics for the 2025 cycle.',
  'Performance Management',
  '["performance agreement","directors","template","2025","evaluation"]',
  '2025-Directors-Performance-Agreement-Template.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2025/01/2025-Directors-Performance-Agreement-Template.docx',
  370688,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'internal',
  'published',
  'system',
  1,
  119, 31, 4.0, 10, 1,
  '2025-01-15T00:00:00.000Z',
  '2025-01-15T00:00:00.000Z'
);

-- ============================================================================
-- POLICIES & GUIDELINES (3 documents)
-- ============================================================================

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-011',
  'Policy on Onboarding & Orientation for Ghana Civil Service',
  'Official policy governing the onboarding and orientation process for newly recruited civil servants, ensuring consistent integration across MDAs.',
  'Policies & Guidelines',
  '["onboarding","orientation","policy","new employees","induction"]',
  'Policy-on-Onboarding-and-Orientation-for-Ghana-Civil-Service.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/Policy-on-Onboarding-and-Orientation-for-Ghana-Civil-Service.pdf',
  178176,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  267, 54, 4.4, 26, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-012',
  'Ghana Civil Service Training Policy & Guidelines',
  'Establishes the framework for training and capacity development across the Ghana Civil Service, including eligibility criteria and funding provisions.',
  'Policies & Guidelines',
  '["training policy","capacity development","guidelines","professional development","HRD"]',
  'Ghana-Civil-Service-Training-Policy-and-Guidelines.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/Ghana-Civil-Service-Training-Policy-and-Guidelines.pdf',
  677888,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  324, 67, 4.5, 33, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-013',
  'Civil Service Administrative Instructions',
  'Comprehensive administrative instructions governing day-to-day operations, procedures, and protocols within the Ghana Civil Service.',
  'Policies & Guidelines',
  '["administrative instructions","procedures","operations","protocols","governance"]',
  'Civil-Service-Administrative-Instructions.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/Civil-Service-Administrative-Instructions.pdf',
  1048576,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  389, 81, 4.7, 40, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

-- ============================================================================
-- TRAINING & DEVELOPMENT (4 documents)
-- ============================================================================

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-014',
  '2025 End-Year Training Report Template',
  'Template for MDAs to compile and submit their end-of-year training activities report for the 2025 fiscal year.',
  'Training & Development',
  '["training report","template","end-year","2025","MDA reporting"]',
  '2025-End-Year-Training-Report-Template.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2025/10/2025-End-Year-Training-Report-Template.docx',
  37888,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'internal',
  'published',
  'system',
  1,
  98, 27, 4.0, 8, 1,
  '2025-10-01T00:00:00.000Z',
  '2025-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-015',
  '2025 Mid-Year Training Report Template',
  'Template for MDAs to document and submit mid-year training progress reports for the 2025 training cycle.',
  'Training & Development',
  '["training report","template","mid-year","2025","progress report"]',
  '2025-Mid-Year-Training-Report-Template.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2025/06/2025-Mid-Year-Training-Report-Template.docx',
  24576,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'internal',
  'published',
  'system',
  1,
  87, 22, 3.9, 7, 1,
  '2025-06-01T00:00:00.000Z',
  '2025-06-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-016',
  '2025 OHCS Right to Information Manual',
  'Manual providing guidance on implementing the Right to Information Act within OHCS, including request processing procedures and compliance requirements.',
  'Training & Development',
  '["right to information","RTI","manual","2025","compliance","transparency"]',
  '2025-OHCS-Right-to-Information-Manual.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2025/03/2025-OHCS-Right-to-Information-Manual.docx',
  310272,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'public',
  'published',
  'system',
  1,
  203, 48, 4.3, 19, 1,
  '2025-03-01T00:00:00.000Z',
  '2025-03-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-017',
  '2024 OHCS Information Manual',
  'Reference manual detailing OHCS organizational structure, functions, and information management procedures for the 2024 period.',
  'Training & Development',
  '["information manual","OHCS","2024","organizational structure","reference"]',
  '2024-OHCS-Information-Manual.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/2024-OHCS-Information-Manual.docx',
  281600,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'public',
  'published',
  'system',
  1,
  176, 39, 4.1, 16, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

-- ============================================================================
-- INDUCTION MATERIALS (4 documents)
-- ============================================================================

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-018',
  '2022 Induction Training - Code of Conduct',
  'Presentation slides from the 2022 induction training covering the Civil Service Code of Conduct, ethics, and professional standards.',
  'Induction Materials',
  '["induction","code of conduct","training","2022","presentation","ethics"]',
  '2022-Induction-Training-Code-of-Conduct.pptx',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/2022-Induction-Training-Code-of-Conduct.pptx',
  3145728,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'public',
  'published',
  'system',
  1,
  234, 51, 4.2, 23, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-019',
  'Induction 2020 - The Ghana Civil Service',
  'Overview presentation from the 2020 induction programme introducing the structure, mandate, and operations of the Ghana Civil Service.',
  'Induction Materials',
  '["induction","2020","civil service overview","structure","mandate"]',
  'Induction-2020-The-Ghana-Civil-Service.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/Induction-2020-The-Ghana-Civil-Service.pdf',
  1048576,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  312, 63, 4.5, 31, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-020',
  'Induction 2020 - Performance Management System Appraisal',
  'Training material from the 2020 induction programme on the civil service performance management and appraisal system.',
  'Induction Materials',
  '["induction","2020","performance management","appraisal","PMS"]',
  'Induction-2020-Performance-Management-System-Appraisal.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/Induction-2020-Performance-Management-System-Appraisal.pdf',
  980070,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  256, 47, 4.3, 22, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-021',
  'Induction 2018 - Civil Service Code of Conduct',
  'Induction training material from 2018 covering the principles and provisions of the Civil Service Code of Conduct.',
  'Induction Materials',
  '["induction","2018","code of conduct","training","principles"]',
  'Induction-2018-Civil-Service-Code-of-Conduct.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/Induction-2018-Civil-Service-Code-of-Conduct.pdf',
  631808,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  189, 34, 4.0, 17, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

-- ============================================================================
-- RECRUITMENT & EXAMINATION (3 documents)
-- ============================================================================

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-022',
  '2023 Civil Service Online Examination Guidelines',
  'Comprehensive guidelines for candidates sitting the civil service online entrance examination, including registration steps and exam format.',
  'Recruitment & Examination',
  '["examination","guidelines","2023","online exam","recruitment","candidates"]',
  '2023-Civil-Service-Online-Examination-Guidelines.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/2023-Civil-Service-Online-Examination-Guidelines.pdf',
  432128,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  456, 87, 4.6, 41, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-023',
  '2021 Guidelines for Recruitment Examination to NIA',
  'Specific guidelines for the National Identification Authority recruitment examination conducted through the civil service examination system.',
  'Recruitment & Examination',
  '["recruitment","NIA","examination","2021","guidelines","national identification"]',
  '2021-Guidelines-for-Recruitment-Examination-to-NIA.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/2021-Guidelines-for-Recruitment-Examination-to-NIA.docx',
  62464,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'public',
  'published',
  'system',
  1,
  167, 29, 3.9, 14, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-024',
  'Civil Service Graduate Entrance Exam Results 2021',
  'Published results of the 2021 Civil Service Graduate Entrance Examination for successful candidates.',
  'Recruitment & Examination',
  '["exam results","2021","graduate entrance","recruitment","results"]',
  'Civil-Service-Graduate-Entrance-Exam-Results-2021.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/Civil-Service-Graduate-Entrance-Exam-Results-2021.pdf',
  1048576,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  498, 76, 4.1, 36, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

-- ============================================================================
-- ADMINISTRATIVE INSTRUMENTS (3 documents)
-- ============================================================================

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-025',
  '2025 Civil Service Awards Nomination Criteria',
  'Criteria and eligibility requirements for nominating outstanding civil servants for the annual Civil Service Awards programme.',
  'Administrative Instruments',
  '["awards","nomination","criteria","2025","recognition","civil service awards"]',
  '2025-Civil-Service-Awards-Nomination-Criteria.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2025/03/2025-Civil-Service-Awards-Nomination-Criteria.pdf',
  128000,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  213, 43, 4.4, 20, 1,
  '2025-03-01T00:00:00.000Z',
  '2025-03-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-026',
  '2025 Civil Service Awards Nomination Form',
  'Official nomination form for submitting candidates for the 2025 Civil Service Awards in various categories of excellence.',
  'Administrative Instruments',
  '["awards","nomination form","2025","form","submission"]',
  '2025-Civil-Service-Awards-Nomination-Form.pdf',
  'https://ohcs.gov.gh/wp-content/uploads/2025/03/2025-Civil-Service-Awards-Nomination-Form.pdf',
  106496,
  'application/pdf',
  'public',
  'published',
  'system',
  1,
  178, 52, 4.2, 18, 1,
  '2025-03-01T00:00:00.000Z',
  '2025-03-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-027',
  '2025 Heads of Departments Performance Agreement Template',
  'Performance agreement template for Heads of Departments outlining deliverables, milestones, and evaluation criteria for 2025.',
  'Administrative Instruments',
  '["performance agreement","heads of departments","template","2025","deliverables"]',
  '2025-Heads-of-Departments-Performance-Agreement-Template.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2025/01/2025-Heads-of-Departments-Performance-Agreement-Template.docx',
  449536,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'internal',
  'published',
  'system',
  1,
  108, 26, 4.0, 9, 1,
  '2025-01-15T00:00:00.000Z',
  '2025-01-15T00:00:00.000Z'
);

-- ============================================================================
-- TEMPLATES & FORMS (3 documents)
-- ============================================================================

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-028',
  'CSEAP Post-Service Evaluation Form',
  'Evaluation form for the Civil Service Employee Assistance Programme (CSEAP) to assess post-service support effectiveness and outcomes.',
  'Templates & Forms',
  '["CSEAP","evaluation","form","post-service","employee assistance"]',
  'CSEAP-Post-Service-Evaluation-Form.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/CSEAP-Post-Service-Evaluation-Form.docx',
  471040,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'internal',
  'published',
  'system',
  1,
  74, 19, 3.8, 6, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-029',
  'CSEAP Referral Form',
  'Referral form for managers and colleagues to refer civil servants to the Employee Assistance Programme for counselling and support services.',
  'Templates & Forms',
  '["CSEAP","referral","form","counselling","employee support","welfare"]',
  'CSEAP-Referral-Form.docx',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/CSEAP-Referral-Form.docx',
  193536,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'internal',
  'published',
  'system',
  1,
  63, 15, 3.7, 5, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO documents (
  id, title, description, category, tags,
  fileName, fileUrl, fileSize, fileType,
  accessLevel, status, authorId, isDownloadable,
  views, downloads, averageRating, totalRatings, version,
  createdAt, updatedAt
) VALUES (
  'doc-seed-030',
  'CSEAP Call-out Flyer',
  'Informational flyer promoting the Civil Service Employee Assistance Programme, including contact details and available support services.',
  'Templates & Forms',
  '["CSEAP","flyer","awareness","employee assistance","mental health","support"]',
  'CSEAP-Call-out-Flyer.jpeg',
  'https://ohcs.gov.gh/wp-content/uploads/2024/10/CSEAP-Call-out-Flyer.jpeg',
  96256,
  'image/jpeg',
  'public',
  'published',
  'system',
  1,
  156, 12, 3.5, 8, 1,
  '2024-10-01T00:00:00.000Z',
  '2024-10-01T00:00:00.000Z'
);

-- Update document category counts
UPDATE document_categories SET documentCount = (
  SELECT COUNT(*) FROM documents WHERE category = document_categories.name
) WHERE EXISTS (
  SELECT 1 FROM documents WHERE category = document_categories.name
);
