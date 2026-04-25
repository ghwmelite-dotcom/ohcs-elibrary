import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';
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

// API base URL - use Workers directly in production, proxy in development
const API_BASE = import.meta.env.PROD
  ? 'https://api.ohcselibrary.xyz/api/v1'
  : '/api/v1';

const getAuthHeaders = (): HeadersInit => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  competencyFramework: any[];
  myAssessments: any[];

  // UI State
  isLoading: boolean;
  selectedCareerPath: string | null;
  unreadNotifications: number;

  // Actions
  loadCareerData: () => Promise<void>;
  fetchCareerPaths: () => Promise<void>;
  fetchCompetencies: () => Promise<void>;
  fetchMyAssessments: () => Promise<void>;
  fetchDevelopmentPlans: () => Promise<void>;
  fetchMentors: () => Promise<void>;
  fetchMentorshipConnections: () => Promise<void>;
  fetchSkillGap: () => Promise<void>;
  fetchPromotionStatus: () => Promise<void>;
  setSelectedCareerPath: (pathId: string | null) => void;
  submitMentorshipRequest: (request: Omit<MentorshipRequest, 'id' | 'createdAt' | 'status'>) => void;
  submitSelfAssessment: (competencyId: string, rating: number, notes?: string) => Promise<void>;
  createPlan: (data: { title: string; goals?: any[]; targetDate?: string; description?: string; targetRole?: string }) => Promise<void>;
  updatePlan: (planId: string, data: any) => Promise<void>;
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
      competencyFramework: [],
      myAssessments: [],
      isLoading: false,
      selectedCareerPath: null,
      unreadNotifications: 0,

      loadCareerData: async () => {
        set({ isLoading: true });
        try {
          await Promise.all([
            get().fetchCareerPaths(),
            get().fetchMentors(),
            get().fetchSkillGap(),
            get().fetchPromotionStatus(),
            get().fetchDevelopmentPlans(),
            get().fetchMentorshipConnections(),
          ]);
        } catch (error) {
          console.error('Error loading career data:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchCareerPaths: async () => {
        try {
          const res = await fetch(`${API_BASE}/career/paths`);
          if (res.ok) {
            const data = await res.json() as any;
            const paths: CareerPath[] = (data.paths || []).map((p: any) => ({
              id: p.id,
              name: p.title,
              description: p.description,
              category: p.category,
              track: p.track,
              icon: p.icon || 'Briefcase',
              color: p.color || '#006B3F',
              totalYearsToTop: p.totalYearsToTop || 25,
              isActive: !!p.isActive,
              grades: (p.grades || []).map((g: any): CareerGrade => ({
                id: g.id,
                code: g.code,
                title: g.title,
                level: g.level,
                track: g.track,
                salaryBand: g.salaryBand || { min: 0, max: 0, currency: 'GHS' },
                yearsRequired: g.yearsRequired,
                description: g.description,
                responsibilities: g.responsibilities || [],
                order: g.order,
              })),
            }));
            set({ careerPaths: paths });
          }
        } catch (error) {
          console.error('Error fetching career paths:', error);
        }
      },

      fetchCompetencies: async () => {
        try {
          const res = await fetch(`${API_BASE}/career/competencies`);
          if (res.ok) {
            const data = await res.json() as any;
            set({ competencyFramework: data.framework || [] });
          }
        } catch (error) {
          console.error('Error fetching competencies:', error);
        }
      },

      fetchMyAssessments: async () => {
        try {
          const res = await fetch(`${API_BASE}/career/competencies/my-assessment`, {
            headers: getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json() as any;
            set({ myAssessments: data.assessments || [] });
          }
        } catch (error) {
          console.error('Error fetching assessments:', error);
        }
      },

      fetchDevelopmentPlans: async () => {
        try {
          const res = await fetch(`${API_BASE}/career/plans`, {
            headers: getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json() as any;
            const plans = data.plans || [];
            // Set the first active plan as currentPlan
            const activePlan = plans.find((p: any) => p.status === 'active') || plans[0] || null;
            if (activePlan) {
              set({
                currentPlan: {
                  id: activePlan.id,
                  userId: activePlan.userId,
                  title: activePlan.title,
                  description: activePlan.description || '',
                  targetRole: activePlan.targetRole,
                  status: activePlan.status,
                  goals: activePlan.goals || [],
                  overallProgress: activePlan.progress || 0,
                  createdAt: activePlan.created_at,
                  updatedAt: activePlan.updated_at,
                },
              });
            }
          }
        } catch (error) {
          console.error('Error fetching development plans:', error);
        }
      },

      fetchMentors: async () => {
        try {
          const res = await fetch(`${API_BASE}/career/mentors`);
          if (res.ok) {
            const data = await res.json() as any;
            set({ mentors: data.mentors || [] });
          }
        } catch (error) {
          console.error('Error fetching mentors:', error);
        }
      },

      fetchMentorshipConnections: async () => {
        try {
          const res = await fetch(`${API_BASE}/career/mentorship/my`, {
            headers: getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json() as any;
            const connections = (data.connections || []).map((conn: any): MentorshipRequest => ({
              id: conn.id,
              menteeId: conn.menteeId,
              mentorId: conn.mentorId,
              mentorName: conn.mentorName,
              purpose: conn.purpose || '',
              goals: conn.goals || [],
              preferredDuration: conn.preferredDuration || '',
              status: conn.status,
              createdAt: conn.createdAt,
              respondedAt: conn.respondedAt,
              message: conn.message,
              mentorResponse: conn.mentorResponse,
            }));
            set({ mentorshipRequests: connections });
          }
        } catch (error) {
          console.error('Error fetching mentorship connections:', error);
        }
      },

      fetchSkillGap: async () => {
        try {
          const res = await fetch(`${API_BASE}/career/skill-gap`, {
            headers: getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json() as any;
            set({ skillGapReport: data });
          }
        } catch (error) {
          console.error('Error fetching skill gap:', error);
        }
      },

      fetchPromotionStatus: async () => {
        try {
          const res = await fetch(`${API_BASE}/career/promotion`, {
            headers: getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json() as any;
            set({ promotionStatus: data });
          }
        } catch (error) {
          console.error('Error fetching promotion status:', error);
        }
      },

      setSelectedCareerPath: (pathId) => {
        set({ selectedCareerPath: pathId });
      },

      submitMentorshipRequest: async (request) => {
        try {
          const res = await fetch(`${API_BASE}/career/mentors/request`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              mentorId: request.mentorId,
              message: request.message,
              purpose: request.purpose,
              goals: request.goals,
              preferredDuration: request.preferredDuration,
            }),
          });

          if (res.ok) {
            const data = await res.json() as any;
            const newRequest: MentorshipRequest = {
              ...request,
              id: data.id || `req-${Date.now()}`,
              createdAt: new Date().toISOString(),
              status: 'pending',
            };

            set((state) => ({
              mentorshipRequests: [...state.mentorshipRequests, newRequest],
            }));

            get().addNotification({
              type: 'system',
              title: 'Mentorship Request Sent',
              message: `Your request to ${request.mentorName} has been submitted.`,
              actionUrl: '/career/mentorship',
              actionLabel: 'View Status',
            });
          } else {
            const err = await res.json() as any;
            console.error('Mentorship request failed:', err.error);
          }
        } catch (error) {
          console.error('Error submitting mentorship request:', error);
          // Fallback: add locally for offline experience
          const newRequest: MentorshipRequest = {
            ...request,
            id: `req-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'pending',
          };
          set((state) => ({
            mentorshipRequests: [...state.mentorshipRequests, newRequest],
          }));
        }
      },

      submitSelfAssessment: async (competencyId: string, rating: number, notes?: string) => {
        try {
          const res = await fetch(`${API_BASE}/career/competencies/self-assess`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({ competencyId, rating, notes }),
          });

          if (res.ok) {
            // Refresh assessments
            await get().fetchMyAssessments();
          }
        } catch (error) {
          console.error('Error submitting assessment:', error);
        }
      },

      createPlan: async (data) => {
        try {
          const res = await fetch(`${API_BASE}/career/plans`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
          });

          if (res.ok) {
            await get().fetchDevelopmentPlans();
          }
        } catch (error) {
          console.error('Error creating plan:', error);
        }
      },

      updatePlan: async (planId, data) => {
        try {
          const res = await fetch(`${API_BASE}/career/plans/${planId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
          });

          if (res.ok) {
            await get().fetchDevelopmentPlans();
          }
        } catch (error) {
          console.error('Error updating plan:', error);
        }
      },

      updateGoalProgress: (goalId, progress) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        const updatedGoals = currentPlan.goals.map((g) =>
          g.id === goalId ? { ...g, progress, status: progress >= 100 ? 'completed' as const : g.status } : g
        );

        const overallProgress = Math.round(
          updatedGoals.reduce((sum, g) => sum + g.progress, 0) / updatedGoals.length
        );

        set({
          currentPlan: {
            ...currentPlan,
            goals: updatedGoals,
            overallProgress,
          },
        });

        // Persist to backend
        get().updatePlan(currentPlan.id, {
          goals: updatedGoals,
          progress: overallProgress,
        });
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
