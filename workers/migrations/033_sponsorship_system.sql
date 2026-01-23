-- ============================================================================
-- OHCS E-Library Sponsorship System Migration
-- Comprehensive sponsorship ecosystem with sponsors, tiers, scholarships,
-- sponsored content, and analytics tracking.
-- ============================================================================

-- ============================================================================
-- SPONSORSHIP TIERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsorship_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    minInvestment REAL NOT NULL,
    maxInvestment REAL,
    benefits TEXT, -- JSON array of benefits
    features TEXT, -- JSON array of features (logo placement, etc.)
    color TEXT,
    icon TEXT,
    badgeIcon TEXT,
    sortOrder INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

-- Insert default sponsorship tiers (Ghana-focused with GHS currency)
INSERT INTO sponsorship_tiers (id, name, slug, minInvestment, maxInvestment, benefits, features, color, icon, badgeIcon, sortOrder, isActive) VALUES
    ('tier-platinum', 'Platinum', 'platinum', 7500000, NULL,
     '["Premium logo placement on all certificates", "Dedicated sponsor dashboard with real-time analytics", "Named scholarship program", "Full sponsorship of selected courses", "VIP recognition at all OHCS events", "Quarterly impact reports", "Direct engagement with scholars", "Custom branded content opportunities"]',
     '["certificate_logo_large", "dashboard_full_access", "scholarship_naming", "course_sponsorship", "event_vip", "quarterly_reports", "scholar_engagement", "branded_content"]',
     'linear-gradient(135deg, #E5E7EB, #F9FAFB)', 'crown', 'star', 1, 1),
    ('tier-gold', 'Gold', 'gold', 3750000, 7499999,
     '["Logo on certificates", "Sponsor dashboard access", "Scholarship contribution program", "Course sponsorship options", "Recognition at major events", "Monthly impact summaries", "Scholar progress updates"]',
     '["certificate_logo_medium", "dashboard_standard", "scholarship_contribution", "course_sponsorship", "event_recognition", "monthly_reports", "scholar_updates"]',
     'linear-gradient(135deg, #FCD116, #F59E0B)', 'medal', 'award', 2, 1),
    ('tier-silver', 'Silver', 'silver', 1500000, 3749999,
     '["Logo on digital certificates", "Basic dashboard access", "Scholarship fund contribution", "Resource sponsorship", "Event acknowledgment", "Quarterly summaries"]',
     '["certificate_logo_small", "dashboard_basic", "scholarship_fund", "resource_sponsorship", "event_acknowledgment", "quarterly_summaries"]',
     'linear-gradient(135deg, #9CA3AF, #D1D5DB)', 'shield', 'bookmark', 3, 1),
    ('tier-bronze', 'Bronze', 'bronze', 750000, 1499999,
     '["Recognition on sponsors page", "Annual impact report", "Event acknowledgment", "Community supporter badge"]',
     '["sponsors_page", "annual_report", "event_mention", "supporter_badge"]',
     'linear-gradient(135deg, #D97706, #F59E0B)', 'heart', 'heart', 4, 1);

-- ============================================================================
-- SPONSORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsors (
    id TEXT PRIMARY KEY,
    userId TEXT, -- Optional link to user account for login
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tierId TEXT NOT NULL,

    -- Branding
    logo TEXT,
    logoDark TEXT, -- For dark mode
    banner TEXT,
    tagline TEXT,
    description TEXT,
    website TEXT,

    -- Contact Information
    contactEmail TEXT,
    contactPerson TEXT,
    contactPhone TEXT,
    contactTitle TEXT,

    -- Investment Details
    investmentAmount REAL,
    currency TEXT DEFAULT 'GHS',
    paymentStatus TEXT DEFAULT 'pending', -- pending, partial, paid
    paymentNotes TEXT,

    -- Contract Period
    startDate TEXT,
    endDate TEXT,
    renewalDate TEXT,
    autoRenew INTEGER DEFAULT 0,

    -- Status & Access
    status TEXT DEFAULT 'pending', -- pending, active, suspended, expired
    dashboardAccessKey TEXT UNIQUE, -- Unique key for dashboard access
    lastDashboardAccess TEXT,

    -- Social Links
    linkedIn TEXT,
    twitter TEXT,
    facebook TEXT,

    -- Metadata
    industry TEXT,
    companySize TEXT, -- startup, small, medium, large, enterprise
    region TEXT,
    notes TEXT,

    -- Admin
    approvedBy TEXT,
    approvedAt TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (tierId) REFERENCES sponsorship_tiers(id),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (approvedBy) REFERENCES users(id),
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Indexes for sponsors
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON sponsors(tierId);
CREATE INDEX IF NOT EXISTS idx_sponsors_status ON sponsors(status);
CREATE INDEX IF NOT EXISTS idx_sponsors_slug ON sponsors(slug);
CREATE INDEX IF NOT EXISTS idx_sponsors_user ON sponsors(userId);

-- ============================================================================
-- SPONSOR CONTACTS (Multiple contacts per sponsor)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsor_contacts (
    id TEXT PRIMARY KEY,
    sponsorId TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    title TEXT,
    isPrimary INTEGER DEFAULT 0,
    canAccessDashboard INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sponsorId) REFERENCES sponsors(id) ON DELETE CASCADE
);

-- ============================================================================
-- SPONSORED CONTENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsored_content (
    id TEXT PRIMARY KEY,
    sponsorId TEXT NOT NULL,
    contentType TEXT NOT NULL, -- course, document, resource, page, certificate
    contentId TEXT, -- ID of the sponsored item (can be null for page-level)
    contentTitle TEXT, -- Cached title for quick reference

    -- Placement Configuration
    placementType TEXT NOT NULL, -- banner, badge, powered_by, certificate_logo, sidebar
    placementPosition TEXT, -- top, bottom, sidebar, footer
    customMessage TEXT,
    customCTA TEXT, -- Custom call-to-action text
    customCTAUrl TEXT,

    -- Display Settings
    displayPriority INTEGER DEFAULT 0,
    showOnMobile INTEGER DEFAULT 1,

    -- Scheduling
    startDate TEXT,
    endDate TEXT,
    isActive INTEGER DEFAULT 1,

    -- Statistics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,

    -- Metadata
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (sponsorId) REFERENCES sponsors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sponsored_content_sponsor ON sponsored_content(sponsorId);
CREATE INDEX IF NOT EXISTS idx_sponsored_content_type ON sponsored_content(contentType);
CREATE INDEX IF NOT EXISTS idx_sponsored_content_active ON sponsored_content(isActive);

-- ============================================================================
-- SCHOLARSHIPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scholarships (
    id TEXT PRIMARY KEY,
    sponsorId TEXT NOT NULL,

    -- Basic Info
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    shortDescription TEXT,

    -- Funding
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'GHS',
    totalBudget REAL, -- Total allocated budget
    disbursedAmount REAL DEFAULT 0,

    -- Program Details
    programType TEXT, -- course, certification, degree, training, professional_development
    targetProgram TEXT, -- Specific program/course name if applicable
    programDuration TEXT, -- e.g., "3 months", "1 year"

    -- Eligibility
    eligibilityCriteria TEXT, -- JSON object with criteria
    minimumYearsOfService INTEGER,
    maximumYearsOfService INTEGER,
    requiredGradeLevel TEXT, -- JSON array of eligible grade levels
    requiredMdas TEXT, -- JSON array of eligible MDAs (null = all)
    requiredDepartments TEXT, -- JSON array
    ageLimit INTEGER,

    -- Requirements
    requirements TEXT, -- JSON array of required documents/items

    -- Availability
    maxRecipients INTEGER DEFAULT 1,
    currentRecipients INTEGER DEFAULT 0,
    applicationDeadline TEXT,
    selectionDate TEXT,
    programStartDate TEXT,
    programEndDate TEXT,

    -- Media
    coverImage TEXT,
    documents TEXT, -- JSON array of informational documents

    -- Status
    status TEXT DEFAULT 'draft', -- draft, open, closed, awarded, completed, cancelled
    isFeatured INTEGER DEFAULT 0,

    -- Timestamps
    publishedAt TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (sponsorId) REFERENCES sponsors(id),
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_scholarships_sponsor ON scholarships(sponsorId);
CREATE INDEX IF NOT EXISTS idx_scholarships_status ON scholarships(status);
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON scholarships(applicationDeadline);

-- ============================================================================
-- SCHOLARSHIP APPLICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scholarship_applications (
    id TEXT PRIMARY KEY,
    scholarshipId TEXT NOT NULL,
    userId TEXT NOT NULL,

    -- Personal Information
    fullName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    staffId TEXT,
    mdaId TEXT,
    mdaName TEXT,
    department TEXT,
    currentPosition TEXT,
    yearsOfService INTEGER,
    currentGrade TEXT,
    dateOfBirth TEXT,

    -- Background
    educationHistory TEXT, -- JSON array
    certifications TEXT, -- JSON array
    professionalExperience TEXT, -- JSON array
    careerGoals TEXT,

    -- Essay/Statement
    statementOfPurpose TEXT NOT NULL,
    expectedImpact TEXT,
    howDiscovered TEXT, -- How they learned about the scholarship

    -- Additional Fields
    supervisorName TEXT,
    supervisorEmail TEXT,
    supervisorPhone TEXT,

    -- Status Tracking
    status TEXT DEFAULT 'draft', -- draft, submitted, under_review, shortlisted, interview, approved, rejected, withdrawn
    submittedAt TEXT,

    -- Review Process
    reviewScore INTEGER, -- 0-100
    reviewNotes TEXT,
    reviewedBy TEXT,
    reviewedAt TEXT,

    -- Shortlisting
    shortlistedAt TEXT,
    shortlistedBy TEXT,
    interviewDate TEXT,
    interviewNotes TEXT,
    interviewScore INTEGER,

    -- Award Details
    awardedAt TEXT,
    awardedBy TEXT,
    awardedAmount REAL,
    awardNotes TEXT,

    -- Rejection Details
    rejectedAt TEXT,
    rejectedBy TEXT,
    rejectionReason TEXT,

    -- Timestamps
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    UNIQUE(scholarshipId, userId),
    FOREIGN KEY (scholarshipId) REFERENCES scholarships(id),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (mdaId) REFERENCES mdas(id),
    FOREIGN KEY (reviewedBy) REFERENCES users(id),
    FOREIGN KEY (awardedBy) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_scholarship_applications_scholarship ON scholarship_applications(scholarshipId);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_user ON scholarship_applications(userId);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_status ON scholarship_applications(status);

-- ============================================================================
-- SCHOLARSHIP APPLICATION DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scholarship_documents (
    id TEXT PRIMARY KEY,
    applicationId TEXT NOT NULL,
    documentType TEXT NOT NULL, -- staff_id, recommendation, certificate, transcript, cv, other
    documentName TEXT NOT NULL,
    documentUrl TEXT NOT NULL,
    fileSize INTEGER,
    mimeType TEXT,
    uploadedAt TEXT DEFAULT (datetime('now')),
    verifiedAt TEXT,
    verifiedBy TEXT,
    verificationStatus TEXT DEFAULT 'pending', -- pending, verified, rejected
    verificationNotes TEXT,
    FOREIGN KEY (applicationId) REFERENCES scholarship_applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scholarship_docs_application ON scholarship_documents(applicationId);

-- ============================================================================
-- SCHOLARSHIP RECIPIENTS (Awarded scholarships tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS scholarship_recipients (
    id TEXT PRIMARY KEY,
    scholarshipId TEXT NOT NULL,
    applicationId TEXT NOT NULL,
    userId TEXT NOT NULL,

    -- Award Details
    awardedAmount REAL NOT NULL,
    currency TEXT DEFAULT 'GHS',
    awardDate TEXT NOT NULL,

    -- Disbursement
    disbursementStatus TEXT DEFAULT 'pending', -- pending, partial, completed
    totalDisbursed REAL DEFAULT 0,

    -- Progress Tracking
    programStatus TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, withdrawn
    programStartDate TEXT,
    programCompletionDate TEXT,
    progressPercentage INTEGER DEFAULT 0,
    progressNotes TEXT,

    -- Outcomes
    completionCertificate TEXT, -- URL to completion certificate
    finalGrade TEXT,
    achievements TEXT, -- JSON array
    testimonial TEXT, -- Scholar's testimonial

    -- Impact Metrics
    promotionReceived INTEGER DEFAULT 0,
    salaryIncrease REAL,
    newSkillsAcquired TEXT, -- JSON array

    -- Timestamps
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (scholarshipId) REFERENCES scholarships(id),
    FOREIGN KEY (applicationId) REFERENCES scholarship_applications(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- ============================================================================
-- SPONSORSHIP ANALYTICS EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsorship_analytics (
    id TEXT PRIMARY KEY,
    sponsorId TEXT NOT NULL,

    -- Event Details
    eventType TEXT NOT NULL, -- impression, click, view, download, conversion, certificate_view
    eventSource TEXT, -- banner, badge, content, certificate, showcase

    -- Context
    contentType TEXT, -- course, document, certificate, page
    contentId TEXT,
    contentTitle TEXT,

    -- User Context (anonymized for privacy)
    userId TEXT,
    mdaId TEXT,
    userRole TEXT,

    -- Session Info
    sessionId TEXT,
    referrer TEXT,
    userAgent TEXT,

    -- Metadata
    metadata TEXT, -- JSON for additional data

    createdAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (sponsorId) REFERENCES sponsors(id)
);

CREATE INDEX IF NOT EXISTS idx_sponsorship_analytics_sponsor ON sponsorship_analytics(sponsorId);
CREATE INDEX IF NOT EXISTS idx_sponsorship_analytics_type ON sponsorship_analytics(eventType);
CREATE INDEX IF NOT EXISTS idx_sponsorship_analytics_date ON sponsorship_analytics(createdAt);

-- ============================================================================
-- SPONSORSHIP ANALYTICS DAILY AGGREGATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsorship_analytics_daily (
    id TEXT PRIMARY KEY,
    sponsorId TEXT NOT NULL,
    date TEXT NOT NULL,

    -- Impression Metrics
    totalImpressions INTEGER DEFAULT 0,
    bannerImpressions INTEGER DEFAULT 0,
    badgeImpressions INTEGER DEFAULT 0,
    certificateImpressions INTEGER DEFAULT 0,

    -- Engagement Metrics
    totalClicks INTEGER DEFAULT 0,
    uniqueUsers INTEGER DEFAULT 0,

    -- Content Metrics
    contentViews INTEGER DEFAULT 0,
    documentDownloads INTEGER DEFAULT 0,
    certificateViews INTEGER DEFAULT 0,

    -- User Demographics
    usersByMda TEXT, -- JSON object {mdaId: count}
    usersByRole TEXT, -- JSON object {role: count}

    -- Scholarship Metrics
    scholarshipViews INTEGER DEFAULT 0,
    scholarshipApplications INTEGER DEFAULT 0,

    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    UNIQUE(sponsorId, date),
    FOREIGN KEY (sponsorId) REFERENCES sponsors(id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_sponsor_date ON sponsorship_analytics_daily(sponsorId, date);

-- ============================================================================
-- SPONSOR ACTIVITY LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsor_activity_log (
    id TEXT PRIMARY KEY,
    sponsorId TEXT NOT NULL,
    actorId TEXT, -- User who performed the action
    actorType TEXT, -- admin, sponsor_user, system

    action TEXT NOT NULL, -- status_change, content_added, scholarship_created, etc.
    details TEXT,
    previousValue TEXT,
    newValue TEXT,

    ipAddress TEXT,
    userAgent TEXT,

    createdAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (sponsorId) REFERENCES sponsors(id),
    FOREIGN KEY (actorId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sponsor_activity_sponsor ON sponsor_activity_log(sponsorId);
CREATE INDEX IF NOT EXISTS idx_sponsor_activity_date ON sponsor_activity_log(createdAt);

-- ============================================================================
-- SPONSOR PAYMENTS & INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsor_payments (
    id TEXT PRIMARY KEY,
    sponsorId TEXT NOT NULL,

    -- Payment Details
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'GHS',
    paymentType TEXT, -- initial, renewal, additional
    paymentMethod TEXT, -- bank_transfer, mobile_money, check

    -- Reference
    invoiceNumber TEXT,
    referenceNumber TEXT,

    -- Status
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, refunded
    paidAt TEXT,

    -- Period
    periodStart TEXT,
    periodEnd TEXT,

    -- Notes
    notes TEXT,
    receiptUrl TEXT,

    -- Admin
    processedBy TEXT,
    processedAt TEXT,

    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (sponsorId) REFERENCES sponsors(id),
    FOREIGN KEY (processedBy) REFERENCES users(id)
);

-- ============================================================================
-- SPONSOR REVIEW HISTORY (For application workflow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsor_review_history (
    id TEXT PRIMARY KEY,
    sponsorId TEXT NOT NULL,
    reviewerId TEXT NOT NULL,
    action TEXT NOT NULL, -- submitted, under_review, approved, rejected, suspended, reactivated
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sponsorId) REFERENCES sponsors(id),
    FOREIGN KEY (reviewerId) REFERENCES users(id)
);

-- ============================================================================
-- CERTIFICATE SPONSOR ASSIGNMENTS
-- (Links sponsors to certificates for logo display)
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificate_sponsors (
    id TEXT PRIMARY KEY,
    certificateId TEXT NOT NULL,
    sponsorId TEXT NOT NULL,
    logoPosition TEXT DEFAULT 'footer', -- footer, header, watermark
    logoSize TEXT DEFAULT 'medium', -- small, medium, large
    displayOrder INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sponsorId) REFERENCES sponsors(id)
);

CREATE INDEX IF NOT EXISTS idx_certificate_sponsors_cert ON certificate_sponsors(certificateId);
CREATE INDEX IF NOT EXISTS idx_certificate_sponsors_sponsor ON certificate_sponsors(sponsorId);
