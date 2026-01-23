// ============================================================================
// OHCS E-Library Sponsorship Types
// Comprehensive type definitions for the sponsorship ecosystem
// ============================================================================

import type { UUID, Timestamp } from './index';

// ============================================================================
// SPONSORSHIP TIER TYPES
// ============================================================================

export type TierLevel = 'platinum' | 'gold' | 'silver' | 'bronze';

export interface SponsorshipTier {
  id: string;
  name: string;
  slug: TierLevel;
  minInvestment: number;
  maxInvestment?: number;
  benefits: string[];
  features: string[];
  color: string;
  icon: string;
  badgeIcon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// SPONSOR TYPES
// ============================================================================

export type SponsorStatus = 'pending' | 'active' | 'suspended' | 'expired';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

export interface Sponsor {
  id: string;
  userId?: string;
  name: string;
  slug: string;
  tierId: string;
  tier?: SponsorshipTier;

  // Branding
  logo?: string;
  logoDark?: string;
  banner?: string;
  tagline?: string;
  description?: string;
  website?: string;

  // Contact Information
  contactEmail?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactTitle?: string;

  // Investment Details
  investmentAmount?: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentNotes?: string;

  // Contract Period
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  autoRenew: boolean;

  // Status & Access
  status: SponsorStatus;
  dashboardAccessKey?: string;
  lastDashboardAccess?: string;

  // Social Links
  linkedIn?: string;
  twitter?: string;
  facebook?: string;

  // Metadata
  industry?: string;
  companySize?: CompanySize;
  region?: string;
  notes?: string;

  // Admin
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SponsorContact {
  id: string;
  sponsorId: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  isPrimary: boolean;
  canAccessDashboard: boolean;
  createdAt: Timestamp;
}

// ============================================================================
// SPONSORED CONTENT TYPES
// ============================================================================

export type SponsoredContentType = 'course' | 'document' | 'resource' | 'page' | 'certificate';
export type PlacementType = 'banner' | 'badge' | 'powered_by' | 'certificate_logo' | 'sidebar';
export type PlacementPosition = 'top' | 'bottom' | 'sidebar' | 'footer';

export interface SponsoredContent {
  id: string;
  sponsorId: string;
  sponsor?: Sponsor;
  contentType: SponsoredContentType;
  contentId?: string;
  contentTitle?: string;

  // Placement Configuration
  placementType: PlacementType;
  placementPosition?: PlacementPosition;
  customMessage?: string;
  customCTA?: string;
  customCTAUrl?: string;

  // Display Settings
  displayPriority: number;
  showOnMobile: boolean;

  // Scheduling
  startDate?: string;
  endDate?: string;
  isActive: boolean;

  // Statistics
  impressions: number;
  clicks: number;
  conversions: number;

  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// SCHOLARSHIP TYPES
// ============================================================================

export type ScholarshipStatus = 'draft' | 'open' | 'closed' | 'awarded' | 'completed' | 'cancelled';
export type ScholarshipProgramType = 'course' | 'certification' | 'degree' | 'training' | 'professional_development';

export interface ScholarshipEligibilityCriteria {
  minimumYearsOfService?: number;
  maximumYearsOfService?: number;
  requiredGradeLevels?: string[];
  requiredMdas?: string[];
  requiredDepartments?: string[];
  ageLimit?: number;
  additionalCriteria?: string[];
}

export interface Scholarship {
  id: string;
  sponsorId: string;
  sponsor?: Sponsor;

  // Basic Info
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;

  // Funding
  amount: number;
  currency: string;
  totalBudget?: number;
  disbursedAmount: number;

  // Program Details
  programType?: ScholarshipProgramType;
  targetProgram?: string;
  programDuration?: string;

  // Eligibility
  eligibilityCriteria?: ScholarshipEligibilityCriteria;
  minimumYearsOfService?: number;
  maximumYearsOfService?: number;
  requiredGradeLevel?: string[];
  requiredMdas?: string[];
  requiredDepartments?: string[];
  ageLimit?: number;

  // Requirements
  requirements?: string[];

  // Availability
  maxRecipients: number;
  currentRecipients: number;
  applicationDeadline?: string;
  selectionDate?: string;
  programStartDate?: string;
  programEndDate?: string;

  // Media
  coverImage?: string;
  documents?: string[];

  // Status
  status: ScholarshipStatus;
  isFeatured: boolean;

  // Timestamps
  publishedAt?: string;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// SCHOLARSHIP APPLICATION TYPES
// ============================================================================

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interview'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export interface EducationHistoryItem {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear?: number;
  grade?: string;
  isOngoing?: boolean;
}

export interface CertificationItem {
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface ProfessionalExperienceItem {
  organization: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrent?: boolean;
}

export interface ScholarshipApplication {
  id: string;
  scholarshipId: string;
  scholarship?: Scholarship;
  userId: string;

  // Personal Information
  fullName: string;
  email: string;
  phone?: string;
  staffId?: string;
  mdaId?: string;
  mdaName?: string;
  department?: string;
  currentPosition?: string;
  yearsOfService?: number;
  currentGrade?: string;
  dateOfBirth?: string;

  // Background
  educationHistory?: EducationHistoryItem[];
  certifications?: CertificationItem[];
  professionalExperience?: ProfessionalExperienceItem[];
  careerGoals?: string;

  // Essay/Statement
  statementOfPurpose: string;
  expectedImpact?: string;
  howDiscovered?: string;

  // Supervisor Information
  supervisorName?: string;
  supervisorEmail?: string;
  supervisorPhone?: string;

  // Status Tracking
  status: ApplicationStatus;
  submittedAt?: string;

  // Review Process
  reviewScore?: number;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;

  // Shortlisting
  shortlistedAt?: string;
  shortlistedBy?: string;
  interviewDate?: string;
  interviewNotes?: string;
  interviewScore?: number;

  // Award Details
  awardedAt?: string;
  awardedBy?: string;
  awardedAmount?: number;
  awardNotes?: string;

  // Rejection Details
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DocumentType = 'staff_id' | 'recommendation' | 'certificate' | 'transcript' | 'cv' | 'other';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface ScholarshipDocument {
  id: string;
  applicationId: string;
  documentType: DocumentType;
  documentName: string;
  documentUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: Timestamp;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
}

// ============================================================================
// SCHOLARSHIP RECIPIENT TYPES
// ============================================================================

export type DisbursementStatus = 'pending' | 'partial' | 'completed';
export type ProgramStatus = 'not_started' | 'in_progress' | 'completed' | 'withdrawn';

export interface ScholarshipRecipient {
  id: string;
  scholarshipId: string;
  scholarship?: Scholarship;
  applicationId: string;
  application?: ScholarshipApplication;
  userId: string;

  // Award Details
  awardedAmount: number;
  currency: string;
  awardDate: string;

  // Disbursement
  disbursementStatus: DisbursementStatus;
  totalDisbursed: number;

  // Progress Tracking
  programStatus: ProgramStatus;
  programStartDate?: string;
  programCompletionDate?: string;
  progressPercentage: number;
  progressNotes?: string;

  // Outcomes
  completionCertificate?: string;
  finalGrade?: string;
  achievements?: string[];
  testimonial?: string;

  // Impact Metrics
  promotionReceived: boolean;
  salaryIncrease?: number;
  newSkillsAcquired?: string[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// SPONSORSHIP ANALYTICS TYPES
// ============================================================================

export type AnalyticsEventType = 'impression' | 'click' | 'view' | 'download' | 'conversion' | 'certificate_view';
export type EventSource = 'banner' | 'badge' | 'content' | 'certificate' | 'showcase';

export interface SponsorshipAnalyticsEvent {
  id: string;
  sponsorId: string;
  eventType: AnalyticsEventType;
  eventSource?: EventSource;
  contentType?: string;
  contentId?: string;
  contentTitle?: string;
  userId?: string;
  mdaId?: string;
  userRole?: string;
  sessionId?: string;
  referrer?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface SponsorshipAnalyticsDaily {
  id: string;
  sponsorId: string;
  date: string;

  // Impression Metrics
  totalImpressions: number;
  bannerImpressions: number;
  badgeImpressions: number;
  certificateImpressions: number;

  // Engagement Metrics
  totalClicks: number;
  uniqueUsers: number;

  // Content Metrics
  contentViews: number;
  documentDownloads: number;
  certificateViews: number;

  // User Demographics
  usersByMda?: Record<string, number>;
  usersByRole?: Record<string, number>;

  // Scholarship Metrics
  scholarshipViews: number;
  scholarshipApplications: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SponsorAnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalUniqueUsers: number;
  engagementRate: number;
  certificateViews: number;
  contentViews: number;
  scholarshipApplications: number;
  scholarsSupported: number;

  // Trends
  impressionsTrend: number; // percentage change
  clicksTrend: number;
  engagementTrend: number;

  // Demographics
  topMdas: Array<{ name: string; count: number }>;
  usersByRole: Record<string, number>;

  // Time series
  dailyMetrics: SponsorshipAnalyticsDaily[];
}

// ============================================================================
// SPONSOR DASHBOARD TYPES
// ============================================================================

export interface SponsorDashboardStats {
  // Overview
  totalReach: number;
  reachTrend: number;
  engagementRate: number;
  engagementTrend: number;
  scholarsSupported: number;
  scholarsTrend: number;
  contentPerformance: number;
  contentTrend: number;

  // Investment Impact
  investmentAmount: number;
  impactScore: number;
  certificatesGenerated: number;
  coursesSponsored: number;

  // Scholarship Stats
  activeScholarships: number;
  totalApplications: number;
  pendingReviews: number;
  awardedScholarships: number;

  // Content Stats
  activePlacements: number;
  totalImpressions: number;
  totalClicks: number;
}

export interface SponsorDashboardData {
  sponsor: Sponsor;
  tier: SponsorshipTier;
  stats: SponsorDashboardStats;
  analytics: SponsorAnalyticsSummary;
  scholarships: Scholarship[];
  recipients: ScholarshipRecipient[];
  sponsoredContent: SponsoredContent[];
  recentActivity: SponsorActivityLog[];
}

// ============================================================================
// ACTIVITY LOG TYPES
// ============================================================================

export type SponsorActivityAction =
  | 'status_change'
  | 'content_added'
  | 'content_removed'
  | 'scholarship_created'
  | 'scholarship_updated'
  | 'application_received'
  | 'application_reviewed'
  | 'scholarship_awarded'
  | 'dashboard_access'
  | 'payment_received';

export interface SponsorActivityLog {
  id: string;
  sponsorId: string;
  actorId?: string;
  actorType?: 'admin' | 'sponsor_user' | 'system';
  action: SponsorActivityAction;
  details?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Timestamp;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface SponsorApplicationFormData {
  // Organization Info
  organizationName: string;
  website?: string;
  industry?: string;
  companySize?: CompanySize;
  description?: string;

  // Contact Info
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  contactTitle?: string;

  // Sponsorship Details
  tierId: string;
  investmentAmount: number;
  sponsorshipPeriod: string; // e.g., "1 year", "2 years"
  motivationStatement?: string;
  preferredActivities?: string[]; // scholarships, content_sponsorship, etc.
}

export interface ScholarshipApplicationFormData {
  // Personal Information
  fullName: string;
  email: string;
  phone?: string;
  staffId?: string;
  mdaId?: string;
  department?: string;
  currentPosition?: string;
  yearsOfService?: number;
  currentGrade?: string;
  dateOfBirth?: string;

  // Background
  educationHistory: EducationHistoryItem[];
  certifications?: CertificationItem[];
  professionalExperience?: ProfessionalExperienceItem[];
  careerGoals?: string;

  // Essay/Statement
  statementOfPurpose: string;
  expectedImpact?: string;
  howDiscovered?: string;

  // Supervisor Information
  supervisorName?: string;
  supervisorEmail?: string;
  supervisorPhone?: string;
}

export interface SponsoredContentFormData {
  contentType: SponsoredContentType;
  contentId?: string;
  placementType: PlacementType;
  placementPosition?: PlacementPosition;
  customMessage?: string;
  customCTA?: string;
  customCTAUrl?: string;
  displayPriority?: number;
  showOnMobile?: boolean;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminSponsorStats {
  totalSponsors: number;
  activeSponsors: number;
  pendingApplications: number;
  totalInvestment: number;

  sponsorsByTier: Record<TierLevel, number>;
  totalScholarships: number;
  activeScholarships: number;
  totalRecipients: number;
  pendingScholarshipReviews: number;

  monthlyRevenue: number;
  revenueGrowth: number;
}

export interface SponsorReviewHistoryItem {
  id: string;
  sponsorId: string;
  reviewerId: string;
  reviewerName?: string;
  action: string;
  notes?: string;
  createdAt: Timestamp;
}
