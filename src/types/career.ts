// Career Development Portal Types
// Ghana Civil Service Career Management System

export type GradeLevel = 'entry' | 'junior' | 'middle' | 'senior' | 'management' | 'executive' | 'director' | 'chief';

export type CareerTrack = 'administrative' | 'technical' | 'professional' | 'executive';

export type ServiceCategory =
  | 'general_administration'
  | 'finance_audit'
  | 'health_services'
  | 'education'
  | 'engineering'
  | 'legal_services'
  | 'information_technology'
  | 'human_resources'
  | 'planning_policy'
  | 'public_relations';

export interface CareerGrade {
  id: string;
  code: string;
  title: string;
  level: GradeLevel;
  track: CareerTrack;
  salaryBand: { min: number; max: number; currency: string };
  yearsRequired: number;
  description: string;
  responsibilities: string[];
  order: number;
}

export interface CareerPath {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  track: CareerTrack;
  icon: string;
  color: string;
  grades: CareerGrade[];
  totalYearsToTop: number;
  isActive: boolean;
}

export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;

export type SkillCategory = 'technical' | 'soft' | 'leadership' | 'digital' | 'language' | 'domain';

export interface UserSkillAssessment {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  gap: number;
  lastAssessed: string;
  progress: number;
}

export interface SkillGapReport {
  id: string;
  userId: string;
  targetRoleId: string;
  targetRoleName: string;
  generatedAt: string;
  overallReadiness: number;
  criticalGaps: UserSkillAssessment[];
  moderateGaps: UserSkillAssessment[];
  strengths: UserSkillAssessment[];
  estimatedTimeToReady: number;
}

export interface PromotionCriteria {
  id: string;
  type: 'experience' | 'qualification' | 'performance' | 'competency' | 'training' | 'examination';
  name: string;
  description: string;
  weight: number;
  isMandatory: boolean;
}

export interface UserPromotionStatus {
  userId: string;
  currentGradeId: string;
  currentGradeTitle: string;
  nextGradeId: string;
  nextGradeTitle: string;
  yearsInCurrentGrade: number;
  totalServiceYears: number;
  eligibilityDate: string;
  isEligible: boolean;
  criteriaProgress: {
    criteriaId: string;
    criteriaName: string;
    met: boolean;
    progress: number;
    details: string;
  }[];
  overallProgress: number;
  blockers: string[];
  nextSteps: string[];
}

export interface CareerMentor {
  id: string;
  userId: string;
  name: string;
  title: string;
  grade: string;
  ministry: string;
  expertise: string[];
  yearsOfService: number;
  specializations: string[];
  availableFor: ('career_guidance' | 'skill_development' | 'promotion_prep' | 'leadership')[];
  rating: number;
  totalMentees: number;
  activeMentees: number;
  isAvailable: boolean;
  bio: string;
  avatar?: string;
}

export interface MentorshipRequest {
  id: string;
  menteeId: string;
  mentorId: string;
  mentorName?: string;
  purpose: string;
  goals: string[];
  preferredDuration: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  respondedAt?: string;
  message?: string;
  mentorResponse?: string;
}

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold';

export interface DevelopmentGoal {
  id: string;
  title: string;
  description: string;
  category: 'skill' | 'competency' | 'qualification' | 'experience' | 'personal';
  priority: 'high' | 'medium' | 'low';
  status: GoalStatus;
  targetDate: string;
  progress: number;
  linkedSkills: string[];
  milestones: { id: string; title: string; completed: boolean }[];
}

export interface DevelopmentPlan {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetRole?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  goals: DevelopmentGoal[];
  overallProgress: number;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'mentorship_accepted'
  | 'mentorship_rejected'
  | 'mentorship_message'
  | 'mentorship_session'
  | 'promotion_eligible'
  | 'training_reminder'
  | 'goal_deadline'
  | 'achievement'
  | 'system';

export interface CareerNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    mentorId?: string;
    mentorName?: string;
    requestId?: string;
    [key: string]: unknown;
  };
}
