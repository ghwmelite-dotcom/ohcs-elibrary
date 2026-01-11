-- ============================================================================
-- OHCS E-Library Marketplace - Sample Products Seed Data
-- Migration 029: Seed sample products for the shop
-- ============================================================================

-- First, create a sample seller application and profile for the OHCS Official Store
INSERT OR IGNORE INTO seller_applications (
    id, userId, storeName, storeDescription, businessType,
    fullName, email, phone, staffId, department,
    status, approvedAt
) VALUES (
    'seller-app-ohcs-official',
    (SELECT id FROM users WHERE email = 'admin@ohcs.gov.gh' LIMIT 1),
    'OHCS Official Publications',
    'Official publications, guides, and training materials from the Office of the Head of Civil Service',
    'mda',
    'OHCS Publications Unit',
    'publications@ohcs.gov.gh',
    '+233302000001',
    'OHCS-001',
    'Publications & Documentation',
    'approved',
    datetime('now')
);

-- Create the seller profile
INSERT OR IGNORE INTO seller_profiles (
    id, userId, applicationId, storeName, storeSlug, storeDescription,
    isVerified, isGovernmentVerified, verificationBadge,
    contactEmail, contactPhone, commissionRate, status
) VALUES (
    'seller-ohcs-official',
    (SELECT id FROM users WHERE email = 'admin@ohcs.gov.gh' LIMIT 1),
    'seller-app-ohcs-official',
    'OHCS Official Publications',
    'ohcs-official',
    'Official publications, guides, and training materials from the Office of the Head of Civil Service',
    1, 1, 'verified_mda',
    'publications@ohcs.gov.gh',
    '+233302000001',
    0.05,
    'active'
);

-- ============================================================================
-- PHYSICAL BOOKS
-- ============================================================================

INSERT OR IGNORE INTO shop_products (
    id, sellerId, categoryId, title, slug, description, shortDescription,
    price, compareAtPrice, productType, stockQuantity, coverImage,
    author, publisher, publishYear, pages, format, language,
    status, moderationStatus, isFeatured, isNewArrival, publishedAt
) VALUES
(
    'prod-civil-service-handbook',
    'seller-ohcs-official',
    'cat-books-physical',
    'The Ghana Civil Service Handbook (2024 Edition)',
    'ghana-civil-service-handbook-2024',
    'The comprehensive guide to Ghana''s Civil Service. This authoritative handbook covers everything from recruitment and promotion procedures to ethics and professional conduct. Essential reading for all civil servants.',
    'Essential guide for all civil servants in Ghana',
    85.00,
    120.00,
    'physical',
    250,
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    'Office of the Head of Civil Service',
    'Ghana Publishing Corporation',
    2024,
    456,
    'Hardcover',
    'English',
    'published',
    'approved',
    1,
    1,
    datetime('now')
),
(
    'prod-public-admin-principles',
    'seller-ohcs-official',
    'cat-books-physical',
    'Principles of Public Administration in Ghana',
    'principles-public-administration-ghana',
    'An in-depth exploration of public administration principles as applied in the Ghanaian context. This book examines governance structures, policy implementation, and administrative reforms that have shaped Ghana''s public sector.',
    'Understanding governance and public sector management',
    65.00,
    80.00,
    'physical',
    180,
    'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400',
    'Prof. Kwame Asante-Mensah',
    'University of Ghana Press',
    2023,
    320,
    'Paperback',
    'English',
    'published',
    'approved',
    1,
    0,
    datetime('now')
),
(
    'prod-leadership-public-sector',
    'seller-ohcs-official',
    'cat-books-physical',
    'Leadership Excellence in the Public Sector',
    'leadership-excellence-public-sector',
    'Transform your leadership approach with proven strategies for public sector success. This book provides practical insights for directors, managers, and aspiring leaders in government ministries and agencies.',
    'Strategies for effective public sector leadership',
    55.00,
    70.00,
    'physical',
    120,
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400',
    'Dr. Ama Serwaa Bonsu',
    'GIMPA Press',
    2024,
    280,
    'Paperback',
    'English',
    'published',
    'approved',
    0,
    1,
    datetime('now')
),
(
    'prod-ethics-governance',
    'seller-ohcs-official',
    'cat-books-physical',
    'Ethics and Governance: A Ghanaian Perspective',
    'ethics-governance-ghanaian-perspective',
    'Explore the ethical foundations of good governance in Ghana. This book addresses corruption prevention, conflict of interest management, and building a culture of integrity in public institutions.',
    'Building ethical foundations in public service',
    45.00,
    55.00,
    'physical',
    200,
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
    'Justice Kofi Mensah (Rtd)',
    'Ghana Publishing Corporation',
    2023,
    245,
    'Paperback',
    'English',
    'published',
    'approved',
    0,
    0,
    datetime('now')
);

-- ============================================================================
-- E-BOOKS & DIGITAL PUBLICATIONS
-- ============================================================================

INSERT OR IGNORE INTO shop_products (
    id, sellerId, categoryId, title, slug, description, shortDescription,
    price, compareAtPrice, productType, digitalFileUrl, digitalFileType, downloadLimit,
    coverImage, author, publisher, publishYear, pages, format, language,
    status, moderationStatus, isFeatured, publishedAt
) VALUES
(
    'prod-digital-transformation-guide',
    'seller-ohcs-official',
    'cat-books-digital',
    'Digital Transformation in Government (E-Book)',
    'digital-transformation-government-ebook',
    'A comprehensive guide to implementing digital solutions in government agencies. Learn about e-governance, digital service delivery, cybersecurity, and building a digitally-skilled workforce.',
    'Master digital transformation for government',
    35.00,
    50.00,
    'digital',
    'https://example.com/ebooks/digital-transformation.pdf',
    'pdf',
    5,
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    'Dr. Emmanuel Osei-Kwaku',
    'OHCS Digital Publications',
    2024,
    185,
    'PDF',
    'English',
    'published',
    'approved',
    1,
    datetime('now')
),
(
    'prod-procurement-ebook',
    'seller-ohcs-official',
    'cat-books-digital',
    'Public Procurement Made Simple (E-Book)',
    'public-procurement-made-simple-ebook',
    'Demystify the Public Procurement Act and learn best practices for transparent and efficient procurement in government. Includes templates, checklists, and case studies.',
    'Your guide to government procurement',
    28.00,
    40.00,
    'digital',
    'https://example.com/ebooks/procurement-guide.pdf',
    'pdf',
    5,
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    'Public Procurement Authority',
    'PPA Publications',
    2024,
    156,
    'PDF',
    'English',
    'published',
    'approved',
    0,
    datetime('now')
),
(
    'prod-financial-management-ebook',
    'seller-ohcs-official',
    'cat-books-digital',
    'Financial Management for Public Officers (E-Book)',
    'financial-management-public-officers-ebook',
    'Master the fundamentals of public financial management. This e-book covers budgeting, expenditure control, financial reporting, and compliance with the Public Financial Management Act.',
    'Essential financial management skills',
    32.00,
    45.00,
    'digital',
    'https://example.com/ebooks/financial-management.pdf',
    'pdf',
    5,
    'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400',
    'Ministry of Finance Training Unit',
    'OHCS Digital Publications',
    2024,
    210,
    'PDF',
    'English',
    'published',
    'approved',
    0,
    datetime('now')
);

-- ============================================================================
-- GUIDES & MANUALS
-- ============================================================================

INSERT OR IGNORE INTO shop_products (
    id, sellerId, categoryId, title, slug, description, shortDescription,
    price, compareAtPrice, productType, stockQuantity, coverImage,
    author, publisher, publishYear, pages, format, language,
    status, moderationStatus, isFeatured, isNewArrival, publishedAt
) VALUES
(
    'prod-performance-management-guide',
    'seller-ohcs-official',
    'cat-guides',
    'Performance Management System Guide',
    'performance-management-system-guide',
    'Complete guide to implementing and managing performance appraisals in the civil service. Includes goal setting frameworks, evaluation criteria, and improvement planning templates.',
    'Master performance appraisal systems',
    40.00,
    55.00,
    'physical',
    150,
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    'OHCS HR Division',
    'OHCS Publications',
    2024,
    120,
    'Spiral Bound',
    'English',
    'published',
    'approved',
    1,
    1,
    datetime('now')
),
(
    'prod-records-management-manual',
    'seller-ohcs-official',
    'cat-guides',
    'Records Management Manual for MDAs',
    'records-management-manual-mdas',
    'Comprehensive manual on records management in government. Learn proper filing systems, retention schedules, and transition to electronic document management.',
    'Organize and manage official records',
    35.00,
    45.00,
    'physical',
    100,
    'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
    'Public Records and Archives Administration',
    'PRAAD Publications',
    2023,
    95,
    'Paperback',
    'English',
    'published',
    'approved',
    0,
    0,
    datetime('now')
),
(
    'prod-protocol-handbook',
    'seller-ohcs-official',
    'cat-guides',
    'Official Protocol and Ceremonial Handbook',
    'official-protocol-ceremonial-handbook',
    'The definitive guide to official protocol in Ghana. Covers state ceremonies, diplomatic protocol, official correspondence, and proper procedures for government events.',
    'Guide to official protocol and ceremonies',
    50.00,
    65.00,
    'physical',
    80,
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400',
    'Protocol Directorate',
    'Ghana Publishing Corporation',
    2024,
    180,
    'Hardcover',
    'English',
    'published',
    'approved',
    0,
    1,
    datetime('now')
);

-- ============================================================================
-- TRAINING MATERIALS
-- ============================================================================

INSERT OR IGNORE INTO shop_products (
    id, sellerId, categoryId, title, slug, description, shortDescription,
    price, compareAtPrice, productType, stockQuantity, coverImage,
    author, publisher, publishYear, pages, format, language,
    status, moderationStatus, isFeatured, publishedAt
) VALUES
(
    'prod-induction-training-kit',
    'seller-ohcs-official',
    'cat-training',
    'New Employee Induction Training Kit',
    'new-employee-induction-training-kit',
    'Complete training kit for inducting new civil servants. Includes workbook, facilitator guide, presentation slides, and assessment materials. Perfect for HR departments and training officers.',
    'Complete kit for new employee induction',
    95.00,
    120.00,
    'physical',
    60,
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400',
    'OHCS Training Division',
    'OHCS Publications',
    2024,
    250,
    'Box Set',
    'English',
    'published',
    'approved',
    1,
    datetime('now')
),
(
    'prod-customer-service-training',
    'seller-ohcs-official',
    'cat-training',
    'Customer Service Excellence Training Pack',
    'customer-service-excellence-training',
    'Transform your front-desk operations with this comprehensive customer service training package. Includes video tutorials, role-play scenarios, and evaluation forms.',
    'Improve public service delivery',
    75.00,
    95.00,
    'physical',
    45,
    'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=400',
    'Public Services Commission',
    'PSC Publications',
    2024,
    180,
    'Training Pack',
    'English',
    'published',
    'approved',
    0,
    datetime('now')
),
(
    'prod-project-management-course',
    'seller-ohcs-official',
    'cat-training',
    'Project Management for Government Officials',
    'project-management-government-officials',
    'Learn to plan, execute, and monitor government projects effectively. This course material covers project lifecycle, stakeholder management, risk assessment, and reporting.',
    'Master project management skills',
    60.00,
    80.00,
    'physical',
    70,
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
    'GIMPA School of Public Service',
    'GIMPA Press',
    2023,
    220,
    'Course Book',
    'English',
    'published',
    'approved',
    0,
    datetime('now')
);

-- ============================================================================
-- TEMPLATES & FORMS
-- ============================================================================

INSERT OR IGNORE INTO shop_products (
    id, sellerId, categoryId, title, slug, description, shortDescription,
    price, compareAtPrice, productType, digitalFileUrl, digitalFileType, downloadLimit,
    coverImage, author, publisher, publishYear, format, language,
    status, moderationStatus, publishedAt
) VALUES
(
    'prod-hr-templates-bundle',
    'seller-ohcs-official',
    'cat-templates',
    'HR Templates Bundle (Digital)',
    'hr-templates-bundle-digital',
    'Complete collection of HR templates for government agencies. Includes job descriptions, interview scorecards, leave applications, disciplinary forms, and performance appraisal templates.',
    '50+ essential HR templates',
    25.00,
    40.00,
    'digital',
    'https://example.com/templates/hr-bundle.zip',
    'zip',
    10,
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400',
    'OHCS HR Division',
    'OHCS Digital Publications',
    2024,
    'Word/Excel Templates',
    'English',
    'published',
    'approved',
    datetime('now')
),
(
    'prod-meeting-templates',
    'seller-ohcs-official',
    'cat-templates',
    'Meeting & Committee Templates Pack',
    'meeting-committee-templates-pack',
    'Professional templates for running effective meetings. Includes agenda templates, minutes formats, action tracking sheets, and committee report templates.',
    'Run better meetings',
    15.00,
    25.00,
    'digital',
    'https://example.com/templates/meeting-pack.zip',
    'zip',
    10,
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400',
    'OHCS Administration',
    'OHCS Digital Publications',
    2024,
    'Word Templates',
    'English',
    'published',
    'approved',
    datetime('now')
);

-- ============================================================================
-- RESEARCH PAPERS
-- ============================================================================

INSERT OR IGNORE INTO shop_products (
    id, sellerId, categoryId, title, slug, description, shortDescription,
    price, compareAtPrice, productType, digitalFileUrl, digitalFileType, downloadLimit,
    coverImage, author, publisher, publishYear, pages, format, language,
    status, moderationStatus, publishedAt
) VALUES
(
    'prod-civil-service-reforms-study',
    'seller-ohcs-official',
    'cat-research',
    'Civil Service Reforms in Ghana: A 20-Year Review',
    'civil-service-reforms-ghana-review',
    'Comprehensive academic study examining civil service reforms in Ghana from 2004-2024. Analyzes policy changes, institutional restructuring, and their impact on service delivery.',
    'Academic analysis of civil service reforms',
    20.00,
    30.00,
    'digital',
    'https://example.com/research/civil-service-reforms.pdf',
    'pdf',
    3,
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
    'Prof. Nana Akua Agyemang',
    'University of Ghana',
    2024,
    85,
    'PDF',
    'English',
    'published',
    'approved',
    datetime('now')
),
(
    'prod-decentralization-study',
    'seller-ohcs-official',
    'cat-research',
    'Decentralization and Local Governance in Ghana',
    'decentralization-local-governance-ghana',
    'Research paper exploring the evolution of Ghana''s decentralization policy and its effects on local government administration and community development.',
    'Study on local governance effectiveness',
    18.00,
    25.00,
    'digital',
    'https://example.com/research/decentralization.pdf',
    'pdf',
    3,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'Dr. Kwabena Frimpong',
    'GIMPA Research',
    2023,
    72,
    'PDF',
    'English',
    'published',
    'approved',
    datetime('now')
);

-- ============================================================================
-- AUDIOBOOKS
-- ============================================================================

INSERT OR IGNORE INTO shop_products (
    id, sellerId, categoryId, title, slug, description, shortDescription,
    price, compareAtPrice, productType, digitalFileUrl, digitalFileType, downloadLimit,
    coverImage, author, publisher, publishYear, format, language,
    status, moderationStatus, isFeatured, publishedAt
) VALUES
(
    'prod-leadership-audiobook',
    'seller-ohcs-official',
    'cat-audiobooks',
    'Leadership in Public Service (Audiobook)',
    'leadership-public-service-audiobook',
    'Listen to expert insights on public sector leadership. This audiobook is narrated by experienced civil service leaders and covers practical leadership strategies, team motivation, and navigating bureaucratic challenges.',
    'Leadership lessons you can listen to',
    30.00,
    45.00,
    'digital',
    'https://example.com/audiobooks/leadership.mp3',
    'mp3',
    3,
    'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
    'Dr. Ama Serwaa Bonsu',
    'OHCS Audio Publications',
    2024,
    'MP3 (6 hours)',
    'English',
    'published',
    'approved',
    1,
    datetime('now')
),
(
    'prod-communication-audiobook',
    'seller-ohcs-official',
    'cat-audiobooks',
    'Effective Communication for Civil Servants (Audiobook)',
    'effective-communication-civil-servants-audiobook',
    'Master the art of professional communication in government. This audiobook covers written correspondence, public speaking, media relations, and interpersonal communication skills.',
    'Improve your communication skills',
    25.00,
    35.00,
    'digital',
    'https://example.com/audiobooks/communication.mp3',
    'mp3',
    3,
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400',
    'Prof. Kofi Antwi-Boasiako',
    'OHCS Audio Publications',
    2024,
    'MP3 (4.5 hours)',
    'English',
    'published',
    'approved',
    0,
    datetime('now')
);

-- ============================================================================
-- Update category counts
-- ============================================================================

UPDATE shop_categories SET productCount = (
    SELECT COUNT(*) FROM shop_products
    WHERE categoryId = shop_categories.id AND status = 'published'
);

-- Update seller stats
UPDATE seller_profiles SET
    totalProducts = (SELECT COUNT(*) FROM shop_products WHERE sellerId = seller_profiles.id AND status = 'published')
WHERE id = 'seller-ohcs-official';
