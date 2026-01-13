import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CareerPath,
  CareerGrade,
  SkillGapReport,
  UserPromotionStatus,
  CareerMentor,
  MentorshipRequest,
  DevelopmentPlan,
  CareerNotification,
  UserSkillAssessment,
} from '@/types/career';

// Demo Career Paths
const demoCareerPaths: CareerPath[] = [
  {
    id: 'path-admin',
    name: 'Administrative Service',
    description: 'General administrative and management roles across ministries',
    category: 'general_administration',
    track: 'administrative',
    icon: 'Briefcase',
    color: '#006B3F',
    totalYearsToTop: 25,
    isActive: true,
    grades: [
      { id: 'grade-1', code: 'AS-1', title: 'Administrative Assistant', level: 'entry', track: 'administrative', salaryBand: { min: 1800, max: 2400, currency: 'GHS' }, yearsRequired: 0, description: 'Entry-level administrative support', responsibilities: ['Document management', 'Basic correspondence', 'Office support'], order: 1 },
      { id: 'grade-2', code: 'AS-2', title: 'Senior Administrative Assistant', level: 'junior', track: 'administrative', salaryBand: { min: 2400, max: 3200, currency: 'GHS' }, yearsRequired: 3, description: 'Senior administrative support', responsibilities: ['Team coordination', 'Report preparation', 'Process management'], order: 2 },
      { id: 'grade-3', code: 'AS-3', title: 'Administrative Officer', level: 'middle', track: 'administrative', salaryBand: { min: 3200, max: 4500, currency: 'GHS' }, yearsRequired: 6, description: 'Mid-level administrative management', responsibilities: ['Policy implementation', 'Staff supervision', 'Budget management'], order: 3 },
      { id: 'grade-4', code: 'AS-4', title: 'Principal Administrative Officer', level: 'senior', track: 'administrative', salaryBand: { min: 4500, max: 6000, currency: 'GHS' }, yearsRequired: 10, description: 'Senior administrative leadership', responsibilities: ['Strategic planning', 'Department management', 'Policy development'], order: 4 },
      { id: 'grade-5', code: 'AS-5', title: 'Assistant Director', level: 'management', track: 'administrative', salaryBand: { min: 6000, max: 8000, currency: 'GHS' }, yearsRequired: 15, description: 'Management level leadership', responsibilities: ['Divisional leadership', 'Resource allocation', 'Performance management'], order: 5 },
      { id: 'grade-6', code: 'AS-6', title: 'Deputy Director', level: 'executive', track: 'administrative', salaryBand: { min: 8000, max: 12000, currency: 'GHS' }, yearsRequired: 20, description: 'Executive leadership', responsibilities: ['Departmental strategy', 'Cross-functional coordination', 'Senior stakeholder management'], order: 6 },
      { id: 'grade-7', code: 'AS-7', title: 'Director', level: 'director', track: 'administrative', salaryBand: { min: 12000, max: 18000, currency: 'GHS' }, yearsRequired: 25, description: 'Director level', responsibilities: ['Organizational leadership', 'Policy direction', 'Ministerial advisory'], order: 7 },
    ],
  },
  {
    id: 'path-hr',
    name: 'Human Resources Management',
    description: 'Personnel management and organizational development',
    category: 'human_resources',
    track: 'professional',
    icon: 'Users',
    color: '#8B5CF6',
    totalYearsToTop: 25,
    isActive: true,
    grades: [
      { id: 'hr-1', code: 'HR-1', title: 'HR Assistant', level: 'entry', track: 'professional', salaryBand: { min: 1900, max: 2500, currency: 'GHS' }, yearsRequired: 0, description: 'Entry-level HR support', responsibilities: ['Record keeping', 'Recruitment support', 'Employee queries'], order: 1 },
      { id: 'hr-2', code: 'HR-2', title: 'HR Officer', level: 'junior', track: 'professional', salaryBand: { min: 2500, max: 3500, currency: 'GHS' }, yearsRequired: 3, description: 'Junior HR management', responsibilities: ['Recruitment coordination', 'Training administration', 'Policy compliance'], order: 2 },
      { id: 'hr-3', code: 'HR-3', title: 'Senior HR Officer', level: 'middle', track: 'professional', salaryBand: { min: 3500, max: 5000, currency: 'GHS' }, yearsRequired: 6, description: 'Mid-level HR specialist', responsibilities: ['Performance management', 'Employee relations', 'Compensation analysis'], order: 3 },
      { id: 'hr-4', code: 'HR-4', title: 'Principal HR Officer', level: 'senior', track: 'professional', salaryBand: { min: 5000, max: 7000, currency: 'GHS' }, yearsRequired: 10, description: 'Senior HR leadership', responsibilities: ['HR strategy', 'Talent development', 'Organizational design'], order: 4 },
      { id: 'hr-5', code: 'HR-5', title: 'HR Manager', level: 'management', track: 'professional', salaryBand: { min: 7000, max: 10000, currency: 'GHS' }, yearsRequired: 15, description: 'HR management', responsibilities: ['Departmental HR oversight', 'Change management', 'Workforce planning'], order: 5 },
    ],
  },
  {
    id: 'path-it',
    name: 'Information Technology',
    description: 'IT systems, digital transformation and technology management',
    category: 'information_technology',
    track: 'technical',
    icon: 'Monitor',
    color: '#3B82F6',
    totalYearsToTop: 22,
    isActive: true,
    grades: [
      { id: 'it-1', code: 'IT-1', title: 'IT Support Technician', level: 'entry', track: 'technical', salaryBand: { min: 2000, max: 2800, currency: 'GHS' }, yearsRequired: 0, description: 'Entry-level IT support', responsibilities: ['Helpdesk support', 'Hardware maintenance', 'User training'], order: 1 },
      { id: 'it-2', code: 'IT-2', title: 'Systems Administrator', level: 'junior', track: 'technical', salaryBand: { min: 2800, max: 4000, currency: 'GHS' }, yearsRequired: 3, description: 'Systems management', responsibilities: ['Server administration', 'Network management', 'Security monitoring'], order: 2 },
      { id: 'it-3', code: 'IT-3', title: 'Senior Systems Analyst', level: 'middle', track: 'technical', salaryBand: { min: 4000, max: 6000, currency: 'GHS' }, yearsRequired: 6, description: 'Systems analysis and design', responsibilities: ['Solution architecture', 'Process automation', 'Vendor management'], order: 3 },
      { id: 'it-4', code: 'IT-4', title: 'IT Manager', level: 'senior', track: 'technical', salaryBand: { min: 6000, max: 9000, currency: 'GHS' }, yearsRequired: 10, description: 'IT management', responsibilities: ['Digital strategy', 'Team leadership', 'Project management'], order: 4 },
      { id: 'it-5', code: 'IT-5', title: 'Chief Technology Officer', level: 'executive', track: 'technical', salaryBand: { min: 9000, max: 15000, currency: 'GHS' }, yearsRequired: 15, description: 'Technology leadership', responsibilities: ['Digital transformation', 'IT governance', 'Innovation strategy'], order: 5 },
    ],
  },
];

// Demo Mentors
const demoMentors: CareerMentor[] = [
  {
    id: 'mentor-1',
    userId: 'user-m1',
    name: 'Dr. Kwame Asante',
    title: 'Director of Administration',
    grade: 'Director',
    ministry: 'Ministry of Finance',
    expertise: ['Strategic Planning', 'Public Administration', 'Leadership Development', 'Policy Analysis'],
    yearsOfService: 28,
    specializations: ['Career Development', 'Executive Coaching', 'Change Management'],
    availableFor: ['career_guidance', 'promotion_prep', 'leadership'],
    rating: 4.9,
    totalMentees: 45,
    activeMentees: 3,
    isAvailable: true,
    bio: 'With over 28 years in the Ghana Civil Service, I have guided numerous officers through career transitions and promotions. My approach focuses on developing well-rounded public servants who can lead with integrity.',
  },
  {
    id: 'mentor-2',
    userId: 'user-m2',
    name: 'Mrs. Abena Osei-Mensah',
    title: 'Deputy Director, Human Resources',
    grade: 'Deputy Director',
    ministry: 'Office of Head of Civil Service',
    expertise: ['Human Resources', 'Talent Management', 'Performance Management', 'Training & Development'],
    yearsOfService: 22,
    specializations: ['HR Best Practices', 'Employee Relations', 'Competency Frameworks'],
    availableFor: ['career_guidance', 'skill_development', 'promotion_prep'],
    rating: 4.8,
    totalMentees: 38,
    activeMentees: 4,
    isAvailable: true,
    bio: 'I specialize in helping civil servants understand HR systems and develop the competencies needed for career advancement. Let me help you navigate your career path effectively.',
  },
  {
    id: 'mentor-3',
    userId: 'user-m3',
    name: 'Mr. Kofi Dartey',
    title: 'Chief IT Officer',
    grade: 'Chief Director',
    ministry: 'Ministry of Communications',
    expertise: ['Digital Transformation', 'IT Strategy', 'Project Management', 'Systems Architecture'],
    yearsOfService: 20,
    specializations: ['E-Government', 'Cybersecurity', 'Agile Methodologies'],
    availableFor: ['skill_development', 'career_guidance', 'leadership'],
    rating: 4.7,
    totalMentees: 25,
    activeMentees: 2,
    isAvailable: true,
    bio: 'Leading Ghana\'s digital transformation efforts has taught me the importance of continuous learning and adaptation. I help IT professionals navigate the evolving technology landscape in the public sector.',
  },
];

// Demo Skill Gap Report
const demoSkillGapReport: SkillGapReport = {
  id: 'gap-report-1',
  userId: 'current-user',
  targetRoleId: 'grade-4',
  targetRoleName: 'Principal Administrative Officer',
  generatedAt: new Date().toISOString(),
  overallReadiness: 68,
  criticalGaps: [
    { skillId: 'skill-1', skillName: 'Strategic Planning', category: 'leadership', currentLevel: 2, targetLevel: 4, gap: 2, lastAssessed: new Date().toISOString(), progress: 35 },
    { skillId: 'skill-2', skillName: 'Policy Analysis', category: 'domain', currentLevel: 2, targetLevel: 4, gap: 2, lastAssessed: new Date().toISOString(), progress: 40 },
  ],
  moderateGaps: [
    { skillId: 'skill-3', skillName: 'Budget Management', category: 'technical', currentLevel: 3, targetLevel: 4, gap: 1, lastAssessed: new Date().toISOString(), progress: 65 },
    { skillId: 'skill-4', skillName: 'Team Leadership', category: 'leadership', currentLevel: 3, targetLevel: 4, gap: 1, lastAssessed: new Date().toISOString(), progress: 70 },
  ],
  strengths: [
    { skillId: 'skill-5', skillName: 'Communication', category: 'soft', currentLevel: 4, targetLevel: 4, gap: 0, lastAssessed: new Date().toISOString(), progress: 100 },
    { skillId: 'skill-6', skillName: 'MS Office Suite', category: 'digital', currentLevel: 4, targetLevel: 4, gap: 0, lastAssessed: new Date().toISOString(), progress: 100 },
  ],
  estimatedTimeToReady: 18,
};

// Demo Promotion Status
const demoPromotionStatus: UserPromotionStatus = {
  userId: 'current-user',
  currentGradeId: 'grade-3',
  currentGradeTitle: 'Administrative Officer',
  nextGradeId: 'grade-4',
  nextGradeTitle: 'Principal Administrative Officer',
  yearsInCurrentGrade: 3.5,
  totalServiceYears: 9.5,
  eligibilityDate: '2025-06-01',
  isEligible: false,
  criteriaProgress: [
    { criteriaId: 'c1', criteriaName: 'Minimum Years in Grade', met: true, progress: 100, details: '3.5 years (Required: 3 years)' },
    { criteriaId: 'c2', criteriaName: 'Performance Rating', met: true, progress: 100, details: 'Average rating: 4.2/5 (Required: 3.5/5)' },
    { criteriaId: 'c3', criteriaName: 'Training Hours', met: false, progress: 75, details: '45/60 hours completed' },
    { criteriaId: 'c4', criteriaName: 'Competency Assessment', met: false, progress: 68, details: '68% of required competencies met' },
    { criteriaId: 'c5', criteriaName: 'Promotion Examination', met: false, progress: 0, details: 'Not yet taken' },
  ],
  overallProgress: 68,
  blockers: ['Complete remaining 15 training hours', 'Pass promotion examination'],
  nextSteps: ['Register for promotion exam scheduled for March 2025', 'Complete Leadership Development course', 'Submit competency portfolio by February 2025'],
};

// Demo Development Plan
const demoDevelopmentPlan: DevelopmentPlan = {
  id: 'plan-1',
  userId: 'current-user',
  title: 'Path to Principal Administrative Officer',
  description: 'Comprehensive development plan focusing on leadership skills and policy expertise',
  targetRole: 'Principal Administrative Officer',
  status: 'active',
  overallProgress: 45,
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  goals: [
    {
      id: 'goal-1',
      title: 'Complete Leadership Development Program',
      description: 'Attend the OHCS Leadership Excellence program',
      category: 'competency',
      priority: 'high',
      status: 'in_progress',
      targetDate: '2025-03-31',
      progress: 60,
      linkedSkills: ['skill-1', 'skill-4'],
      milestones: [
        { id: 'm1', title: 'Module 1: Foundations', completed: true },
        { id: 'm2', title: 'Module 2: Strategic Thinking', completed: true },
        { id: 'm3', title: 'Module 3: Change Management', completed: false },
        { id: 'm4', title: 'Final Assessment', completed: false },
      ],
    },
    {
      id: 'goal-2',
      title: 'Master Policy Analysis Framework',
      description: 'Develop expertise in policy analysis and impact assessment',
      category: 'skill',
      priority: 'high',
      status: 'in_progress',
      targetDate: '2025-04-30',
      progress: 40,
      linkedSkills: ['skill-2'],
      milestones: [
        { id: 'm5', title: 'Complete Policy Analysis Course', completed: true },
        { id: 'm6', title: 'Shadow Senior Policy Team', completed: false },
        { id: 'm7', title: 'Lead Policy Review Project', completed: false },
      ],
    },
    {
      id: 'goal-3',
      title: 'Pass Promotion Examination',
      description: 'Prepare for and pass the Principal Officer promotion exam',
      category: 'qualification',
      priority: 'high',
      status: 'not_started',
      targetDate: '2025-03-15',
      progress: 0,
      linkedSkills: [],
      milestones: [
        { id: 'm8', title: 'Register for Exam', completed: false },
        { id: 'm9', title: 'Complete Study Plan', completed: false },
        { id: 'm10', title: 'Take Mock Exams', completed: false },
        { id: 'm11', title: 'Pass Final Exam', completed: false },
      ],
    },
  ],
};

interface CareerState {
  // Data
  careerPaths: CareerPath[];
  mentors: CareerMentor[];
  skillGapReport: SkillGapReport | null;
  promotionStatus: UserPromotionStatus | null;
  currentPlan: DevelopmentPlan | null;
  mentorshipRequests: MentorshipRequest[];
  notifications: CareerNotification[];

  // UI State
  isLoading: boolean;
  selectedCareerPath: string | null;
  unreadNotifications: number;

  // Actions
  loadCareerData: () => Promise<void>;
  setSelectedCareerPath: (pathId: string | null) => void;
  submitMentorshipRequest: (request: Omit<MentorshipRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;
  addNotification: (notification: Omit<CareerNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
}

export const useCareerStore = create<CareerState>()(
  persist(
    (set, get) => ({
      careerPaths: [],
      mentors: [],
      skillGapReport: null,
      promotionStatus: null,
      currentPlan: null,
      mentorshipRequests: [],
      notifications: [],
      isLoading: false,
      selectedCareerPath: null,
      unreadNotifications: 0,

      loadCareerData: async () => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({
          careerPaths: demoCareerPaths,
          mentors: demoMentors,
          skillGapReport: demoSkillGapReport,
          promotionStatus: demoPromotionStatus,
          currentPlan: demoDevelopmentPlan,
          isLoading: false,
        });
      },

      setSelectedCareerPath: (pathId) => {
        set({ selectedCareerPath: pathId });
      },

      submitMentorshipRequest: (request) => {
        const newRequest: MentorshipRequest = {
          ...request,
          id: `req-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'pending',
        };

        set((state) => ({
          mentorshipRequests: [...state.mentorshipRequests, newRequest],
        }));

        // Add notification
        get().addNotification({
          type: 'system',
          title: 'Mentorship Request Sent',
          message: `Your request to ${request.mentorName} has been submitted.`,
          actionUrl: '/career/mentorship',
          actionLabel: 'View Status',
        });

        // Simulate mentor response
        setTimeout(() => {
          const isAccepted = Math.random() > 0.2;
          set((state) => ({
            mentorshipRequests: state.mentorshipRequests.map((r) =>
              r.id === newRequest.id
                ? {
                    ...r,
                    status: isAccepted ? 'accepted' : 'rejected',
                    respondedAt: new Date().toISOString(),
                    mentorResponse: isAccepted
                      ? "I'd be happy to mentor you! Let's schedule our first session."
                      : "I'm currently at capacity. Please try other mentors.",
                  }
                : r
            ),
          }));

          get().addNotification({
            type: isAccepted ? 'mentorship_accepted' : 'mentorship_rejected',
            title: isAccepted ? 'Mentorship Request Accepted!' : 'Mentorship Update',
            message: isAccepted
              ? `${request.mentorName} accepted your request!`
              : `${request.mentorName} is unavailable at this time.`,
            actionUrl: '/career/mentorship',
            actionLabel: 'View Details',
          });
        }, 5000 + Math.random() * 10000);
      },

      updateGoalProgress: (goalId, progress) => {
        set((state) => ({
          currentPlan: state.currentPlan
            ? {
                ...state.currentPlan,
                goals: state.currentPlan.goals.map((g) =>
                  g.id === goalId ? { ...g, progress } : g
                ),
              }
            : null,
        }));
      },

      addNotification: (notification) => {
        const newNotification: CareerNotification = {
          ...notification,
          id: `notif-${Date.now()}`,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadNotifications: state.unreadNotifications + 1,
        }));
      },

      markNotificationRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadNotifications: Math.max(0, state.unreadNotifications - 1),
        }));
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadNotifications: 0,
        }));
      },
    }),
    {
      name: 'career-store',
      partialize: (state) => ({
        mentorshipRequests: state.mentorshipRequests,
        notifications: state.notifications.slice(0, 50),
      }),
    }
  )
);
