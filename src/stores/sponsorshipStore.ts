import { create } from 'zustand';
import type {
  Sponsor,
  SponsorshipTier,
  Scholarship,
  ScholarshipApplication,
  ScholarshipRecipient,
  SponsoredContent,
  SponsorDashboardData,
  SponsorDashboardStats,
  SponsorAnalyticsSummary,
  ScholarshipApplicationFormData,
  SponsorActivityLog,
  AdminSponsorStats,
  SponsorReviewHistoryItem,
} from '@/types/sponsorship';

// API base URL
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getAuthToken = (): string | null => {
  // First try the direct localStorage key
  const directToken = localStorage.getItem('auth_token');
  if (directToken) return directToken;

  // Fallback to Zustand persisted state
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || null;
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// ============================================================================
// SPONSORSHIP TIERS STORE
// ============================================================================

interface TiersState {
  tiers: SponsorshipTier[];
  isLoading: boolean;
  error: string | null;
}

interface TiersActions {
  fetchTiers: () => Promise<void>;
}

type TiersStore = TiersState & TiersActions;

export const useTiersStore = create<TiersStore>()((set) => ({
  tiers: [],
  isLoading: false,
  error: null,

  fetchTiers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/sponsorship/tiers`);
      if (!response.ok) throw new Error('Failed to fetch tiers');
      const data = await response.json();
      set({ tiers: data.tiers, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load tiers';
      set({ error: message, isLoading: false });
    }
  },
}));

// ============================================================================
// SPONSORS SHOWCASE STORE (Public)
// ============================================================================

interface ShowcaseState {
  sponsors: Array<{
    id: string;
    name: string;
    slug: string;
    logo?: string;
    tagline?: string;
    website?: string;
    tier: {
      name: string;
      slug: string;
      color: string;
    };
  }>;
  impactStats: {
    totalSponsors: number;
    totalInvestment: number;
    scholarsSupported: number;
    activeScholarships: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface ShowcaseActions {
  fetchShowcase: () => Promise<void>;
  fetchSponsorPublicProfile: (slug: string) => Promise<any>;
}

type ShowcaseStore = ShowcaseState & ShowcaseActions;

export const useShowcaseStore = create<ShowcaseStore>()((set) => ({
  sponsors: [],
  impactStats: {
    totalSponsors: 0,
    totalInvestment: 0,
    scholarsSupported: 0,
    activeScholarships: 0,
  },
  isLoading: false,
  error: null,

  fetchShowcase: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/sponsorship/showcase`);
      if (!response.ok) throw new Error('Failed to fetch showcase');
      const data = await response.json();
      set({
        sponsors: data.sponsors,
        impactStats: data.impactStats,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load showcase';
      set({ error: message, isLoading: false });
    }
  },

  fetchSponsorPublicProfile: async (slug: string) => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/sponsors/${slug}/public`);
      if (!response.ok) throw new Error('Sponsor not found');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
}));

// ============================================================================
// SCHOLARSHIPS STORE
// ============================================================================

interface ScholarshipsState {
  scholarships: Scholarship[];
  currentScholarship: Scholarship | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface ScholarshipsActions {
  fetchScholarships: (options?: {
    status?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchScholarship: (id: string) => Promise<{ scholarship: Scholarship; existingApplication?: any }>;
  resetScholarships: () => void;
}

type ScholarshipsStore = ScholarshipsState & ScholarshipsActions;

export const useScholarshipsStore = create<ScholarshipsStore>()((set) => ({
  scholarships: [],
  currentScholarship: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  isLoading: false,
  error: null,

  fetchScholarships: async (options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (options.status) params.set('status', options.status);
      if (options.featured) params.set('featured', 'true');
      if (options.page) params.set('page', options.page.toString());
      if (options.limit) params.set('limit', options.limit.toString());

      const response = await fetch(`${API_BASE}/sponsorship/scholarships?${params}`);
      if (!response.ok) throw new Error('Failed to fetch scholarships');
      const data = await response.json();
      set({
        scholarships: data.scholarships,
        pagination: data.pagination,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load scholarships';
      set({ error: message, isLoading: false });
    }
  },

  fetchScholarship: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/sponsorship/scholarships/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Scholarship not found');
      const data = await response.json();
      set({ currentScholarship: data.scholarship, isLoading: false });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load scholarship';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  resetScholarships: () => {
    set({
      scholarships: [],
      currentScholarship: null,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      error: null,
    });
  },
}));

// ============================================================================
// SCHOLARSHIP APPLICATIONS STORE (User)
// ============================================================================

interface ApplicationsState {
  applications: ScholarshipApplication[];
  currentApplication: ScholarshipApplication | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

interface ApplicationsActions {
  submitApplication: (scholarshipId: string, data: ScholarshipApplicationFormData) => Promise<string>;
  fetchMyApplications: () => Promise<void>;
  fetchApplication: (id: string) => Promise<void>;
  resetApplications: () => void;
}

type ApplicationsStore = ApplicationsState & ApplicationsActions;

export const useApplicationsStore = create<ApplicationsStore>()((set) => ({
  applications: [],
  currentApplication: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  submitApplication: async (scholarshipId: string, data: ScholarshipApplicationFormData) => {
    set({ isSubmitting: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/sponsorship/scholarships/${scholarshipId}/apply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ scholarshipId, ...data }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      set({ isSubmitting: false });
      return result.applicationId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Application submission failed';
      set({ error: message, isSubmitting: false });
      throw error;
    }
  },

  fetchMyApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/sponsorship/my-applications`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      set({ applications: data.applications, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load applications';
      set({ error: message, isLoading: false });
    }
  },

  fetchApplication: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/sponsorship/my-applications/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Application not found');
      const data = await response.json();
      set({ currentApplication: data.application, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load application';
      set({ error: message, isLoading: false });
    }
  },

  resetApplications: () => {
    set({
      applications: [],
      currentApplication: null,
      error: null,
    });
  },
}));

// ============================================================================
// SPONSOR DASHBOARD STORE
// ============================================================================

interface SponsorDashboardState {
  sponsor: Sponsor | null;
  tier: SponsorshipTier | null;
  stats: SponsorDashboardStats | null;
  analytics: SponsorAnalyticsSummary | null;
  scholarships: Scholarship[];
  recipients: ScholarshipRecipient[];
  sponsoredContent: SponsoredContent[];
  recentActivity: SponsorActivityLog[];
  applications: ScholarshipApplication[];
  applicationStatusCounts: Record<string, number>;
  isLoading: boolean;
  error: string | null;
}

interface SponsorDashboardActions {
  fetchDashboard: (accessKey?: string) => Promise<void>;
  fetchApplications: (options?: {
    scholarshipId?: string;
    status?: string;
    page?: number;
    accessKey?: string;
  }) => Promise<void>;
  resetDashboard: () => void;
}

type SponsorDashboardStore = SponsorDashboardState & SponsorDashboardActions;

export const useSponsorDashboardStore = create<SponsorDashboardStore>()((set) => ({
  sponsor: null,
  tier: null,
  stats: null,
  analytics: null,
  scholarships: [],
  recipients: [],
  sponsoredContent: [],
  recentActivity: [],
  applications: [],
  applicationStatusCounts: {},
  isLoading: false,
  error: null,

  fetchDashboard: async (accessKey?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = accessKey ? `?key=${accessKey}` : '';
      const response = await fetch(`${API_BASE}/sponsorship/dashboard${params}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      const data = await response.json();
      set({
        sponsor: data.sponsor,
        tier: data.sponsor?.tier,
        stats: data.stats,
        analytics: {
          totalImpressions: data.stats.totalImpressions,
          totalClicks: data.stats.totalClicks,
          totalUniqueUsers: data.stats.totalUniqueUsers,
          engagementRate: data.stats.engagementRate,
          certificateViews: 0,
          contentViews: 0,
          scholarshipApplications: data.stats.totalApplications,
          scholarsSupported: data.stats.scholarsSupported,
          impressionsTrend: 0,
          clicksTrend: 0,
          engagementTrend: 0,
          topMdas: [],
          usersByRole: {},
          dailyMetrics: data.dailyAnalytics || [],
        },
        scholarships: data.scholarships,
        recipients: data.recipients,
        sponsoredContent: data.sponsoredContent || [],
        recentActivity: data.recentActivity,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load dashboard';
      set({ error: message, isLoading: false });
    }
  },

  fetchApplications: async (options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.accessKey) params.set('key', options.accessKey);
      if (options.scholarshipId) params.set('scholarshipId', options.scholarshipId);
      if (options.status) params.set('status', options.status);
      if (options.page) params.set('page', options.page.toString());

      const response = await fetch(`${API_BASE}/sponsorship/dashboard/applications?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      set({
        applications: data.applications,
        applicationStatusCounts: data.statusCounts || {},
      });
    } catch (error) {
      console.error('Fetch applications error:', error);
    }
  },

  resetDashboard: () => {
    set({
      sponsor: null,
      tier: null,
      stats: null,
      analytics: null,
      scholarships: [],
      recipients: [],
      sponsoredContent: [],
      recentActivity: [],
      applications: [],
      applicationStatusCounts: {},
      error: null,
    });
  },
}));

// ============================================================================
// ADMIN SPONSORSHIP STORE
// ============================================================================

interface AdminSponsorshipState {
  sponsors: Sponsor[];
  currentSponsor: Sponsor | null;
  scholarships: Scholarship[];
  applications: ScholarshipApplication[];
  stats: AdminSponsorStats | null;
  tierBreakdown: Record<string, number>;
  statusCounts: Record<string, number>;
  recentActivity: SponsorActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface AdminSponsorshipActions {
  fetchSponsors: (options?: {
    status?: string;
    tier?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchSponsor: (id: string) => Promise<any>;
  createSponsor: (data: any) => Promise<{ sponsorId: string; slug: string; dashboardAccessKey: string }>;
  updateSponsor: (id: string, data: any) => Promise<void>;
  deleteSponsor: (id: string) => Promise<void>;
  updateSponsorStatus: (id: string, status: string, notes?: string) => Promise<void>;
  fetchScholarships: () => Promise<void>;
  createScholarship: (data: any) => Promise<{ scholarshipId: string; slug: string }>;
  updateScholarship: (id: string, data: any) => Promise<void>;
  fetchApplications: () => Promise<void>;
  updateApplicationStatus: (id: string, status: string, notes: string, awardAmount?: number) => Promise<void>;
  reviewApplication: (id: string, data: any) => Promise<void>;
  createSponsoredContent: (sponsorId: string, data: any) => Promise<{ contentId: string }>;
  fetchStats: () => Promise<void>;
  resetAdmin: () => void;
}

type AdminSponsorshipStore = AdminSponsorshipState & AdminSponsorshipActions;

export const useAdminSponsorshipStore = create<AdminSponsorshipStore>()((set, get) => ({
  sponsors: [],
  currentSponsor: null,
  scholarships: [],
  applications: [],
  stats: null,
  tierBreakdown: {},
  statusCounts: {},
  recentActivity: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  isLoading: false,
  error: null,

  fetchSponsors: async (options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (options.status) params.set('status', options.status);
      if (options.tier) params.set('tier', options.tier);
      if (options.page) params.set('page', options.page.toString());
      if (options.limit) params.set('limit', options.limit.toString());

      const response = await fetch(`${API_BASE}/sponsorship/admin/sponsors?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch sponsors');
      const data = await response.json();
      set({
        sponsors: data.sponsors,
        pagination: data.pagination,
        statusCounts: data.statusCounts || {},
        tierBreakdown: data.tierCounts || {},
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load sponsors';
      set({ error: message, isLoading: false });
    }
  },

  fetchSponsor: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/sponsors/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Sponsor not found');
      const data = await response.json();
      set({ currentSponsor: data.sponsor, isLoading: false });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load sponsor';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createSponsor: async (data: any) => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/sponsors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create sponsor');
      await get().fetchSponsors();
      return result;
    } catch (error) {
      throw error;
    }
  },

  updateSponsor: async (id: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/sponsors/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update sponsor');
      await get().fetchSponsors();
    } catch (error) {
      throw error;
    }
  },

  deleteSponsor: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/sponsors/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete sponsor');
      await get().fetchSponsors();
    } catch (error) {
      throw error;
    }
  },

  updateSponsorStatus: async (id: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/sponsors/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      await get().fetchSponsors();
    } catch (error) {
      throw error;
    }
  },

  fetchScholarships: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/scholarships`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch scholarships');
      const data = await response.json();
      set({ scholarships: data.scholarships || [], isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load scholarships';
      set({ error: message, isLoading: false });
    }
  },

  fetchApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/applications`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      set({ applications: data.applications || [], isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load applications';
      set({ error: message, isLoading: false });
    }
  },

  updateApplicationStatus: async (id: string, status: string, notes: string, awardAmount?: number) => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/applications/${id}/review`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, reviewNotes: notes, awardAmount }),
      });
      if (!response.ok) throw new Error('Failed to update application');
    } catch (error) {
      throw error;
    }
  },

  createScholarship: async (data: any) => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/scholarships`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create scholarship');
      return result;
    } catch (error) {
      throw error;
    }
  },

  updateScholarship: async (id: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/scholarships/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update scholarship');
    } catch (error) {
      throw error;
    }
  },

  reviewApplication: async (id: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/applications/${id}/review`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to review application');
    } catch (error) {
      throw error;
    }
  },

  createSponsoredContent: async (sponsorId: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/sponsors/${sponsorId}/content`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create content');
      return result;
    } catch (error) {
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const response = await fetch(`${API_BASE}/sponsorship/admin/stats`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      set({
        stats: data.stats,
        tierBreakdown: data.tierBreakdown || {},
        recentActivity: data.recentActivity || [],
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  },

  resetAdmin: () => {
    set({
      sponsors: [],
      currentSponsor: null,
      scholarships: [],
      applications: [],
      stats: null,
      tierBreakdown: {},
      statusCounts: {},
      recentActivity: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      error: null,
    });
  },
}));

// ============================================================================
// ANALYTICS TRACKING UTILITY
// ============================================================================

export const trackSponsorAnalytics = async (data: {
  sponsorId: string;
  eventType: 'impression' | 'click' | 'view' | 'download' | 'conversion' | 'certificate_view';
  eventSource?: 'banner' | 'badge' | 'content' | 'certificate' | 'showcase';
  contentType?: string;
  contentId?: string;
  contentTitle?: string;
  metadata?: Record<string, unknown>;
}) => {
  try {
    await fetch(`${API_BASE}/sponsorship/analytics/track`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
};

// ============================================================================
// FETCH CONTENT SPONSORS UTILITY
// ============================================================================

export const fetchContentSponsors = async (
  contentType: string,
  contentId: string
): Promise<Array<{
  id: string;
  name: string;
  logo?: string;
  tagline?: string;
  website?: string;
  tierSlug: string;
  tierColor: string;
  placement: {
    type: string;
    position?: string;
    message?: string;
    cta?: string;
    ctaUrl?: string;
  };
}>> => {
  try {
    const response = await fetch(`${API_BASE}/sponsorship/content/${contentType}/${contentId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.sponsors || [];
  } catch (error) {
    console.error('Failed to fetch content sponsors:', error);
    return [];
  }
};
