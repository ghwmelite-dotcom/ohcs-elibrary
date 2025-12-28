import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ResearchProject,
  ResearchLiterature,
  ResearchInsight,
  ResearchBrief,
  ResearchTemplate,
  ResearchActivity,
  ResearchComment,
  ResearchTeamMember,
  ResearchFilter,
  ResearchStats,
  ResearchDashboardData,
  ResearchProjectStatus,
  ResearchPhase,
  ResearchCategory,
  ResearchMethodology,
  PaginatedResponse,
} from '@/types';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

// Helper to get auth token
const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

// Helper for authenticated fetch
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
};

// Category and methodology display names
export const RESEARCH_CATEGORIES: Record<ResearchCategory, { label: string; icon: string; color: string }> = {
  policy_impact: { label: 'Policy Impact', icon: '📋', color: 'bg-blue-500' },
  performance_audit: { label: 'Performance Audit', icon: '📊', color: 'bg-purple-500' },
  capacity_assessment: { label: 'Capacity Assessment', icon: '🎯', color: 'bg-green-500' },
  citizen_feedback: { label: 'Citizen Feedback', icon: '💬', color: 'bg-yellow-500' },
  budget_analysis: { label: 'Budget Analysis', icon: '💰', color: 'bg-emerald-500' },
  digital_transformation: { label: 'Digital Transformation', icon: '🖥️', color: 'bg-cyan-500' },
  hr_management: { label: 'HR Management', icon: '👥', color: 'bg-orange-500' },
  service_delivery: { label: 'Service Delivery', icon: '🚀', color: 'bg-indigo-500' },
  governance: { label: 'Governance', icon: '🏛️', color: 'bg-slate-500' },
  policy: { label: 'Policy Analysis', icon: '📜', color: 'bg-teal-500' },
  reform: { label: 'Reform', icon: '🔄', color: 'bg-rose-500' },
  other: { label: 'Other', icon: '📁', color: 'bg-gray-500' },
};

export const RESEARCH_METHODOLOGIES: Record<ResearchMethodology, string> = {
  qualitative: 'Qualitative Research',
  quantitative: 'Quantitative Research',
  mixed_methods: 'Mixed Methods',
  case_study: 'Case Study',
  survey: 'Survey Research',
  experimental: 'Experimental',
  policy_analysis: 'Policy Analysis',
  comparative: 'Comparative Analysis',
};

export const RESEARCH_STATUSES: Record<ResearchProjectStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-500' },
  planning: { label: 'Planning', color: 'bg-blue-500' },
  active: { label: 'Active', color: 'bg-green-500' },
  review: { label: 'In Review', color: 'bg-yellow-500' },
  completed: { label: 'Completed', color: 'bg-emerald-500' },
  archived: { label: 'Archived', color: 'bg-slate-500' },
};

export const RESEARCH_PHASES: Record<ResearchPhase, { label: string; order: number }> = {
  ideation: { label: 'Ideation', order: 1 },
  literature_review: { label: 'Literature Review', order: 2 },
  methodology: { label: 'Methodology Design', order: 3 },
  data_collection: { label: 'Data Collection', order: 4 },
  analysis: { label: 'Analysis', order: 5 },
  writing: { label: 'Writing', order: 6 },
  peer_review: { label: 'Peer Review', order: 7 },
  publication: { label: 'Publication', order: 8 },
};

interface ResearchState {
  // Projects
  projects: ResearchProject[];
  currentProject: ResearchProject | null;
  projectsLoading: boolean;
  projectsPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  // Literature
  literature: ResearchLiterature[];
  literatureLoading: boolean;

  // Insights
  insights: ResearchInsight[];
  insightsLoading: boolean;

  // Briefs
  briefs: ResearchBrief[];
  briefsLoading: boolean;

  // Templates
  templates: ResearchTemplate[];
  templatesLoading: boolean;

  // Activity
  activities: ResearchActivity[];
  activitiesLoading: boolean;

  // Comments
  comments: ResearchComment[];
  commentsLoading: boolean;

  // Dashboard
  dashboard: ResearchDashboardData | null;
  dashboardLoading: boolean;

  // Stats
  stats: ResearchStats | null;
  statsLoading: boolean;

  // Filter
  filter: ResearchFilter;

  // UI State
  isLoading: boolean;
  error: string | null;
}

interface ResearchActions {
  // Projects
  fetchProjects: (filter?: ResearchFilter) => Promise<void>;
  fetchMyProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<ResearchProject | null>;
  createProject: (data: CreateProjectData) => Promise<ResearchProject>;
  updateProject: (id: string, data: Partial<ResearchProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: ResearchProject | null) => void;

  // Team Members
  addTeamMember: (projectId: string, memberId: string, role?: string) => Promise<void>;
  removeTeamMember: (projectId: string, memberId: string) => Promise<void>;

  // Literature
  fetchLiterature: (projectId: string) => Promise<void>;
  addLiterature: (projectId: string, data: AddLiteratureData) => Promise<void>;
  removeLiterature: (projectId: string, literatureId: string) => Promise<void>;
  summarizeLiterature: (literatureId: string) => Promise<string>;

  // AI Insights
  fetchInsights: (projectId: string) => Promise<void>;
  generateInsights: (projectId: string) => Promise<ResearchInsight[]>;
  deleteInsight: (projectId: string, insightId: string) => Promise<void>;

  // AI Briefs
  fetchBriefs: (projectId: string) => Promise<void>;
  generateBrief: (projectId: string, briefType?: string, audience?: string) => Promise<ResearchBrief>;
  updateBrief: (projectId: string, briefId: string, data: Partial<ResearchBrief>) => Promise<void>;
  deleteBrief: (projectId: string, briefId: string) => Promise<void>;

  // AI Analysis
  analyzeText: (text: string, analysisType?: string) => Promise<string>;

  // Comments
  fetchComments: (projectId: string) => Promise<void>;
  addComment: (projectId: string, content: string, parentId?: string) => Promise<void>;

  // Activity
  fetchActivity: (projectId: string) => Promise<void>;

  // Templates
  fetchTemplates: () => Promise<void>;

  // Dashboard
  fetchDashboard: () => Promise<void>;

  // Stats
  fetchStats: () => Promise<void>;

  // Filter
  setFilter: (filter: Partial<ResearchFilter>) => void;
  clearFilter: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

interface CreateProjectData {
  title: string;
  description?: string;
  researchQuestion: string;
  hypothesis?: string;
  objectives?: string[];
  methodology?: ResearchMethodology;
  category?: ResearchCategory;
  tags?: string[];
  startDate?: string;
  targetEndDate?: string;
  isPublic?: boolean;
  mdaId?: string;
  templateId?: string;
}

interface AddLiteratureData {
  documentId?: string;
  externalTitle?: string;
  externalUrl?: string;
  externalAuthors?: string;
  externalYear?: number;
  externalSource?: string;
  citationKey?: string;
  notes?: string;
  tags?: string[];
}

type ResearchStore = ResearchState & ResearchActions;

export const useResearchStore = create<ResearchStore>()(
  persist(
    (set, get) => ({
      // Initial State
      projects: [],
      currentProject: null,
      projectsLoading: false,
      projectsPagination: {
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      },

      literature: [],
      literatureLoading: false,

      insights: [],
      insightsLoading: false,

      briefs: [],
      briefsLoading: false,

      templates: [],
      templatesLoading: false,

      activities: [],
      activitiesLoading: false,

      comments: [],
      commentsLoading: false,

      dashboard: null,
      dashboardLoading: false,

      stats: null,
      statsLoading: false,

      filter: {},

      isLoading: false,
      error: null,

      // Actions

      fetchProjects: async (filter?: ResearchFilter) => {
        set({ projectsLoading: true, error: null });
        try {
          const currentFilter = filter || get().filter;
          const params = new URLSearchParams();

          if (currentFilter.status) params.append('status', currentFilter.status);
          if (currentFilter.category) params.append('category', currentFilter.category);
          if (currentFilter.search) params.append('search', currentFilter.search);
          if (currentFilter.sortBy) params.append('sortBy', currentFilter.sortBy);
          if (currentFilter.sortOrder) params.append('sortOrder', currentFilter.sortOrder);
          if (currentFilter.page) params.append('page', String(currentFilter.page));
          if (currentFilter.limit) params.append('limit', String(currentFilter.limit));

          const response = await authFetch(`${API_BASE}/research/projects?${params}`);
          if (!response.ok) throw new Error('Failed to fetch projects');

          const data: PaginatedResponse<ResearchProject> = await response.json();

          set({
            projects: data.items,
            projectsPagination: {
              total: data.total,
              page: data.page,
              limit: data.limit,
              totalPages: data.totalPages,
            },
            projectsLoading: false,
          });
        } catch (error) {
          console.error('Failed to fetch projects:', error);
          set({ error: 'Failed to load research projects', projectsLoading: false });
        }
      },

      fetchMyProjects: async () => {
        set({ projectsLoading: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/research/projects?myProjects=true`);
          if (!response.ok) throw new Error('Failed to fetch projects');

          const data: PaginatedResponse<ResearchProject> = await response.json();

          set({
            projects: data.items,
            projectsPagination: {
              total: data.total,
              page: data.page,
              limit: data.limit,
              totalPages: data.totalPages,
            },
            projectsLoading: false,
          });
        } catch (error) {
          console.error('Failed to fetch my projects:', error);
          set({ error: 'Failed to load your projects', projectsLoading: false });
        }
      },

      fetchProject: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${id}`);
          if (!response.ok) {
            if (response.status === 404) {
              set({ error: 'Project not found', isLoading: false });
              return null;
            }
            throw new Error('Failed to fetch project');
          }

          const project: ResearchProject = await response.json();
          set({ currentProject: project, isLoading: false });
          return project;
        } catch (error) {
          console.error('Failed to fetch project:', error);
          set({ error: 'Failed to load project', isLoading: false });
          return null;
        }
      },

      createProject: async (data: CreateProjectData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/research/projects`, {
            method: 'POST',
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create project');
          }

          const result = await response.json();

          // Refresh projects list
          await get().fetchProjects();

          set({ isLoading: false });

          // Fetch and return the created project
          const project = await get().fetchProject(result.id);
          return project as ResearchProject;
        } catch (error: any) {
          console.error('Failed to create project:', error);
          set({ error: error.message || 'Failed to create project', isLoading: false });
          throw error;
        }
      },

      updateProject: async (id: string, data: Partial<ResearchProject>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });

          if (!response.ok) throw new Error('Failed to update project');

          // Refresh current project
          await get().fetchProject(id);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to update project:', error);
          set({ error: 'Failed to update project', isLoading: false });
          throw error;
        }
      },

      deleteProject: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) throw new Error('Failed to delete project');

          // Remove from local state
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to delete project:', error);
          set({ error: 'Failed to delete project', isLoading: false });
          throw error;
        }
      },

      setCurrentProject: (project: ResearchProject | null) => {
        set({ currentProject: project });
      },

      // Team Members
      addTeamMember: async (projectId: string, memberId: string, role = 'researcher') => {
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${projectId}/members`, {
            method: 'POST',
            body: JSON.stringify({ memberId, role }),
          });

          if (!response.ok) throw new Error('Failed to add team member');

          // Refresh project to get updated team
          await get().fetchProject(projectId);
        } catch (error) {
          console.error('Failed to add team member:', error);
          throw error;
        }
      },

      removeTeamMember: async (projectId: string, memberId: string) => {
        try {
          const response = await authFetch(
            `${API_BASE}/research/projects/${projectId}/members/${memberId}`,
            { method: 'DELETE' }
          );

          if (!response.ok) throw new Error('Failed to remove team member');

          // Refresh project to get updated team
          await get().fetchProject(projectId);
        } catch (error) {
          console.error('Failed to remove team member:', error);
          throw error;
        }
      },

      // Literature
      fetchLiterature: async (projectId: string) => {
        set({ literatureLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${projectId}/literature`);
          if (!response.ok) throw new Error('Failed to fetch literature');

          const data = await response.json();
          set({ literature: data.items || [], literatureLoading: false });
        } catch (error) {
          console.error('Failed to fetch literature:', error);
          set({ literatureLoading: false });
        }
      },

      addLiterature: async (projectId: string, data: AddLiteratureData) => {
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${projectId}/literature`, {
            method: 'POST',
            body: JSON.stringify(data),
          });

          if (!response.ok) throw new Error('Failed to add literature');

          // Refresh literature list
          await get().fetchLiterature(projectId);
        } catch (error) {
          console.error('Failed to add literature:', error);
          throw error;
        }
      },

      removeLiterature: async (projectId: string, literatureId: string) => {
        try {
          const response = await authFetch(
            `${API_BASE}/research/projects/${projectId}/literature/${literatureId}`,
            { method: 'DELETE' }
          );

          if (!response.ok) throw new Error('Failed to remove literature');

          // Update local state
          set((state) => ({
            literature: state.literature.filter((l) => l.id !== literatureId),
          }));
        } catch (error) {
          console.error('Failed to remove literature:', error);
          throw error;
        }
      },

      summarizeLiterature: async (literatureId: string) => {
        try {
          const response = await authFetch(
            `${API_BASE}/research/literature/${literatureId}/summarize`,
            { method: 'POST' }
          );

          if (!response.ok) throw new Error('Failed to summarize literature');

          const data = await response.json();
          return data.summary;
        } catch (error) {
          console.error('Failed to summarize literature:', error);
          throw error;
        }
      },

      // AI Insights
      fetchInsights: async (projectId: string) => {
        set({ insightsLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${projectId}/insights`);
          if (!response.ok) throw new Error('Failed to fetch insights');

          const data = await response.json();
          set({ insights: data.items || [], insightsLoading: false });
        } catch (error) {
          console.error('Failed to fetch insights:', error);
          set({ insightsLoading: false });
        }
      },

      generateInsights: async (projectId: string) => {
        set({ insightsLoading: true });
        try {
          const response = await authFetch(
            `${API_BASE}/research/projects/${projectId}/generate-insights`,
            { method: 'POST' }
          );

          if (!response.ok) throw new Error('Failed to generate insights');

          const data = await response.json();

          // Refresh insights list
          await get().fetchInsights(projectId);

          return data.insights;
        } catch (error) {
          console.error('Failed to generate insights:', error);
          set({ insightsLoading: false });
          throw error;
        }
      },

      deleteInsight: async (projectId: string, insightId: string) => {
        try {
          const response = await authFetch(
            `${API_BASE}/research/projects/${projectId}/insights/${insightId}`,
            { method: 'DELETE' }
          );

          if (!response.ok) throw new Error('Failed to delete insight');

          // Update local state
          set((state) => ({
            insights: state.insights.filter((i) => i.id !== insightId),
          }));
        } catch (error) {
          console.error('Failed to delete insight:', error);
          throw error;
        }
      },

      // AI Briefs
      fetchBriefs: async (projectId: string) => {
        set({ briefsLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${projectId}/briefs`);
          if (!response.ok) throw new Error('Failed to fetch briefs');

          const data = await response.json();
          set({ briefs: data.items || [], briefsLoading: false });
        } catch (error) {
          console.error('Failed to fetch briefs:', error);
          set({ briefsLoading: false });
        }
      },

      generateBrief: async (projectId: string, briefType = 'policy', audience = 'policymakers') => {
        set({ briefsLoading: true });
        try {
          const response = await authFetch(
            `${API_BASE}/research/projects/${projectId}/briefs`,
            {
              method: 'POST',
              body: JSON.stringify({ briefType, audience }),
            }
          );

          if (!response.ok) throw new Error('Failed to generate brief');

          const data = await response.json();

          // Refresh briefs list
          await get().fetchBriefs(projectId);

          return data as ResearchBrief;
        } catch (error) {
          console.error('Failed to generate brief:', error);
          set({ briefsLoading: false });
          throw error;
        }
      },

      updateBrief: async (projectId: string, briefId: string, data: Partial<ResearchBrief>) => {
        try {
          const response = await authFetch(
            `${API_BASE}/research/projects/${projectId}/briefs/${briefId}`,
            {
              method: 'PUT',
              body: JSON.stringify(data),
            }
          );

          if (!response.ok) throw new Error('Failed to update brief');

          // Refresh briefs list
          await get().fetchBriefs(projectId);
        } catch (error) {
          console.error('Failed to update brief:', error);
          throw error;
        }
      },

      deleteBrief: async (projectId: string, briefId: string) => {
        try {
          const response = await authFetch(
            `${API_BASE}/research/projects/${projectId}/briefs/${briefId}`,
            { method: 'DELETE' }
          );

          if (!response.ok) throw new Error('Failed to delete brief');

          // Update local state
          set((state) => ({
            briefs: state.briefs.filter((b) => b.id !== briefId),
          }));
        } catch (error) {
          console.error('Failed to delete brief:', error);
          throw error;
        }
      },

      // AI Analysis
      analyzeText: async (text: string, analysisType = 'general') => {
        try {
          const response = await authFetch(`${API_BASE}/research/analyze-text`, {
            method: 'POST',
            body: JSON.stringify({ text, analysisType }),
          });

          if (!response.ok) throw new Error('Failed to analyze text');

          const data = await response.json();
          return data.analysis;
        } catch (error) {
          console.error('Failed to analyze text:', error);
          throw error;
        }
      },

      // Comments
      fetchComments: async (projectId: string) => {
        set({ commentsLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${projectId}/comments`);
          if (!response.ok) throw new Error('Failed to fetch comments');

          const data = await response.json();
          set({ comments: data.items || [], commentsLoading: false });
        } catch (error) {
          console.error('Failed to fetch comments:', error);
          set({ commentsLoading: false });
        }
      },

      addComment: async (projectId: string, content: string, parentId?: string) => {
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${projectId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content, parentId }),
          });

          if (!response.ok) throw new Error('Failed to add comment');

          // Refresh comments
          await get().fetchComments(projectId);
        } catch (error) {
          console.error('Failed to add comment:', error);
          throw error;
        }
      },

      // Activity
      fetchActivity: async (projectId: string) => {
        set({ activitiesLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/research/projects/${projectId}/activity`);
          if (!response.ok) throw new Error('Failed to fetch activity');

          const data = await response.json();
          set({ activities: data.items || [], activitiesLoading: false });
        } catch (error) {
          console.error('Failed to fetch activity:', error);
          set({ activitiesLoading: false });
        }
      },

      // Templates
      fetchTemplates: async () => {
        set({ templatesLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/research/templates`);
          if (!response.ok) throw new Error('Failed to fetch templates');

          const data = await response.json();
          set({ templates: data.items || [], templatesLoading: false });
        } catch (error) {
          console.error('Failed to fetch templates:', error);
          set({ templatesLoading: false });
        }
      },

      // Dashboard
      fetchDashboard: async () => {
        set({ dashboardLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/research/dashboard`);
          if (!response.ok) throw new Error('Failed to fetch dashboard');

          const data = await response.json();
          set({ dashboard: data, dashboardLoading: false });
        } catch (error) {
          console.error('Failed to fetch dashboard:', error);
          set({ dashboardLoading: false });
        }
      },

      // Stats
      fetchStats: async () => {
        set({ statsLoading: true });
        try {
          const response = await authFetch(`${API_BASE}/research/stats`);
          if (!response.ok) throw new Error('Failed to fetch stats');

          const data = await response.json();
          set({ stats: data, statsLoading: false });
        } catch (error) {
          console.error('Failed to fetch stats:', error);
          set({ statsLoading: false });
        }
      },

      // Filter
      setFilter: (filter: Partial<ResearchFilter>) => {
        set((state) => ({
          filter: { ...state.filter, ...filter },
        }));
      },

      clearFilter: () => {
        set({ filter: {} });
      },

      // Error handling
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'ohcs-research-storage',
      partialize: (state) => ({
        filter: state.filter,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useMyProjects = () => {
  const { projects, projectsLoading, fetchMyProjects } = useResearchStore();
  return { projects, isLoading: projectsLoading, fetchMyProjects };
};

export const useCurrentProject = () => {
  const { currentProject, isLoading, fetchProject } = useResearchStore();
  return { project: currentProject, isLoading, fetchProject };
};

export const useResearchTemplates = () => {
  const { templates, templatesLoading, fetchTemplates } = useResearchStore();
  return { templates, isLoading: templatesLoading, fetchTemplates };
};

export const useResearchDashboard = () => {
  const { dashboard, dashboardLoading, fetchDashboard } = useResearchStore();
  return { dashboard, isLoading: dashboardLoading, fetchDashboard };
};
