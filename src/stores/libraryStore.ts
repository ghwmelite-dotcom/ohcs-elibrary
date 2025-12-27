import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Document, DocumentCategory, DocumentFilter, Collection, Bookmark, AIAnalysis } from '@/types';

// Category interface for UI components
export interface CategoryItem {
  id: DocumentCategory;
  name: string;
  color: string;
  count: number;
}

// Static category definitions (these are constants, not demo data)
export const DOCUMENT_CATEGORIES: CategoryItem[] = [
  { id: 'circulars', name: 'Circulars & Directives', color: '#006B3F', count: 0 },
  { id: 'policies', name: 'Policies & Guidelines', color: '#FCD116', count: 0 },
  { id: 'training', name: 'Training Materials', color: '#3B82F6', count: 0 },
  { id: 'reports', name: 'Reports & Publications', color: '#CE1126', count: 0 },
  { id: 'forms', name: 'Forms & Templates', color: '#8B5CF6', count: 0 },
  { id: 'legal', name: 'Legal Documents', color: '#10B981', count: 0 },
  { id: 'research', name: 'Research Papers', color: '#F59E0B', count: 0 },
  { id: 'general', name: 'General Resources', color: '#6B7280', count: 0 },
];

// Library statistics interface
export interface LibraryStats {
  totalDocuments: number;
  userBookmarks: number;
  recentlyViewed: number;
  trendingCount: number;
  monthlyUploads: number;
  lastViewedAt: string | null;
}

interface LibraryState {
  // Data
  documents: Document[];
  currentDocument: Document | null;
  categories: CategoryItem[];
  selectedCategory: DocumentCategory | null;
  filter: DocumentFilter;
  bookmarks: Bookmark[];
  collections: Collection[];
  recentlyViewed: Document[];

  // Stats
  stats: LibraryStats;

  // Reading progress (persisted locally)
  readingProgress: Record<string, number>;

  // UI State
  isLoading: boolean;
  error: string | null;

  // AI Analysis
  aiAnalysis: AIAnalysis | null;
  isAnalyzing: boolean;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface LibraryActions {
  // Document operations
  fetchDocuments: (filter?: DocumentFilter) => Promise<void>;
  fetchDocument: (id: string) => Promise<Document | null>;
  uploadDocument: (data: FormData) => Promise<Document | null>;
  updateDocument: (id: string, data: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  // Category operations
  fetchCategories: () => Promise<void>;
  setSelectedCategory: (categoryId: DocumentCategory | null) => void;

  // Filter operations
  setFilter: (filter: Partial<DocumentFilter>) => void;
  resetFilter: () => void;

  // Bookmark operations
  fetchBookmarks: () => Promise<void>;
  bookmarkDocument: (documentId: string) => Promise<void>;
  removeBookmark: (documentId: string) => Promise<void>;
  isBookmarked: (documentId: string) => boolean;

  // Rating operations
  rateDocument: (documentId: string, rating: number, review?: string) => Promise<void>;

  // Reading progress (local)
  updateReadingProgress: (documentId: string, progress: number) => void;
  getReadingProgress: (documentId: string) => number;

  // Recently viewed
  addToRecentlyViewed: (document: Document) => void;
  fetchRecentlyViewed: () => Promise<void>;

  // AI Analysis
  analyzeDocument: (documentId: string) => Promise<void>;
  clearAnalysis: () => void;

  // Search
  searchDocuments: (query: string) => Promise<Document[]>;

  // Local document management (when API not available)
  addLocalDocument: (data: {
    title: string;
    description: string;
    category: DocumentCategory;
    accessLevel: Document['accessLevel'];
    tags?: string[];
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl?: string;
  }) => Document;
  deleteLocalDocument: (id: string) => void;
  getLocalDocuments: () => Document[];

  // Stats
  fetchStats: () => Promise<void>;

  // Utilities
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearDocuments: () => void;
}

type LibraryStore = LibraryState & LibraryActions;

const defaultFilter: DocumentFilter = {
  page: 1,
  limit: 12,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const defaultStats: LibraryStats = {
  totalDocuments: 0,
  userBookmarks: 0,
  recentlyViewed: 0,
  trendingCount: 0,
  monthlyUploads: 0,
  lastViewedAt: null,
};

// API base URL - uses versioned API endpoint
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

// Local storage key for documents (used when API is not available)
const LOCAL_DOCUMENTS_KEY = 'ohcs-library-documents';

// Helper to get local documents
const getLocalDocuments = (): Document[] => {
  try {
    const stored = localStorage.getItem(LOCAL_DOCUMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save local documents
const saveLocalDocuments = (documents: Document[]) => {
  try {
    localStorage.setItem(LOCAL_DOCUMENTS_KEY, JSON.stringify(documents));
  } catch {
    console.error('Failed to save documents to local storage');
  }
};

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      documents: [],
      currentDocument: null,
      categories: DOCUMENT_CATEGORIES,
      selectedCategory: null,
      filter: defaultFilter,
      bookmarks: [],
      collections: [],
      recentlyViewed: [],
      stats: defaultStats,
      readingProgress: {},
      isLoading: false,
      error: null,
      aiAnalysis: null,
      isAnalyzing: false,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // Document operations
      fetchDocuments: async (filter?: DocumentFilter) => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          const currentFilter = { ...state.filter, ...filter };

          // Build query params
          const params = new URLSearchParams();
          if (currentFilter.category) params.append('category', currentFilter.category);
          if (currentFilter.accessLevel) params.append('accessLevel', currentFilter.accessLevel);
          if (currentFilter.search) params.append('search', currentFilter.search);
          if (currentFilter.sortBy) params.append('sortBy', currentFilter.sortBy);
          if (currentFilter.sortOrder) params.append('sortOrder', currentFilter.sortOrder);
          if (currentFilter.page) params.append('page', currentFilter.page.toString());
          if (currentFilter.limit) params.append('limit', currentFilter.limit.toString());
          if (currentFilter.tags?.length) params.append('tags', currentFilter.tags.join(','));

          const response = await fetch(`${API_BASE}/documents?${params}`);

          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            // API not available yet, use local documents
            const localDocs = getLocalDocuments();
            const currentFilter = { ...get().filter, ...filter };

            // Filter local documents by category if specified
            let filteredDocs = localDocs;
            if (currentFilter.category) {
              filteredDocs = localDocs.filter((doc) => doc.category === currentFilter.category);
            }

            // Sort documents
            if (currentFilter.sortBy) {
              filteredDocs.sort((a, b) => {
                const aVal = a[currentFilter.sortBy as keyof Document] as string | number;
                const bVal = b[currentFilter.sortBy as keyof Document] as string | number;
                if (currentFilter.sortOrder === 'desc') {
                  return aVal > bVal ? -1 : 1;
                }
                return aVal < bVal ? -1 : 1;
              });
            }

            set({
              documents: filteredDocs,
              totalCount: filteredDocs.length,
              totalPages: Math.ceil(filteredDocs.length / (currentFilter.limit || 12)),
              isLoading: false,
              error: null,
            });
            return;
          }

          if (!response.ok) {
            throw new Error('Failed to fetch documents');
          }

          const data = await response.json();

          // Merge API documents with local documents
          const localDocs = getLocalDocuments();
          const apiDocs = data.documents || [];

          // Filter local docs by category if needed (currentFilter already defined above)
          let filteredLocalDocs = localDocs;
          if (currentFilter.category) {
            filteredLocalDocs = localDocs.filter((doc) => doc.category === currentFilter.category);
          }

          // Combine: API docs first, then local docs
          const allDocs = [...apiDocs, ...filteredLocalDocs];
          const totalCount = (data.totalCount || 0) + filteredLocalDocs.length;

          set({
            documents: allDocs,
            totalCount: totalCount,
            totalPages: Math.ceil(totalCount / (currentFilter.limit || 12)),
            currentPage: data.currentPage || 1,
            isLoading: false,
          });
        } catch (error) {
          // If API fails, use local documents
          const localDocs = getLocalDocuments();
          const currentFilter = { ...get().filter, ...filter };

          let filteredDocs = localDocs;
          if (currentFilter.category) {
            filteredDocs = localDocs.filter((doc) => doc.category === currentFilter.category);
          }

          set({
            documents: filteredDocs,
            totalCount: filteredDocs.length,
            totalPages: Math.ceil(filteredDocs.length / (currentFilter.limit || 12)),
            isLoading: false,
            error: null,
          });
        }
      },

      fetchDocument: async (id: string) => {
        set({ isLoading: true, error: null, currentDocument: null });

        try {
          const response = await fetch(`${API_BASE}/documents/${id}`);

          if (!response.ok) {
            throw new Error('Document not found');
          }

          const document = await response.json();

          // Add to recently viewed
          get().addToRecentlyViewed(document);

          set({ currentDocument: document, isLoading: false });
          return document;
        } catch (error) {
          set({
            currentDocument: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load document',
          });
          return null;
        }
      },

      uploadDocument: async (formData: FormData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/documents`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload document');
          }

          const document = await response.json();

          // Refresh documents list
          await get().fetchDocuments();
          await get().fetchStats();

          set({ isLoading: false });
          return document;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to upload document',
          });
          return null;
        }
      },

      updateDocument: async (id: string, data: Partial<Document>) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/documents/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error('Failed to update document');
          }

          const updated = await response.json();

          set((state) => ({
            documents: state.documents.map((doc) =>
              doc.id === id ? { ...doc, ...updated } : doc
            ),
            currentDocument: state.currentDocument?.id === id
              ? { ...state.currentDocument, ...updated }
              : state.currentDocument,
            isLoading: false,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update document',
          });
        }
      },

      deleteDocument: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          // Get auth token from authStore
          const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          const token = authState?.state?.token;

          const response = await fetch(`${API_BASE}/documents/${id}`, {
            method: 'DELETE',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to delete document');
          }

          set((state) => ({
            documents: state.documents.filter((doc) => doc.id !== id),
            currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
            isLoading: false,
          }));

          await get().fetchStats();
          await get().fetchCategories();
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to delete document',
          });
          throw error; // Re-throw so the component can handle it
        }
      },

      // Category operations
      fetchCategories: async () => {
        // Get local document counts first
        const localDocs = getLocalDocuments();
        const localCounts: Record<string, number> = {};
        localDocs.forEach((doc) => {
          localCounts[doc.category] = (localCounts[doc.category] || 0) + 1;
        });

        try {
          const response = await fetch(`${API_BASE}/documents/categories`);

          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            // Use local counts only
            const categoriesWithCounts = DOCUMENT_CATEGORIES.map((cat) => ({
              ...cat,
              count: localCounts[cat.id] || 0,
            }));
            set({ categories: categoriesWithCounts });
            return;
          }

          if (!response.ok) {
            const categoriesWithCounts = DOCUMENT_CATEGORIES.map((cat) => ({
              ...cat,
              count: localCounts[cat.id] || 0,
            }));
            set({ categories: categoriesWithCounts });
            return;
          }

          const data = await response.json();

          // Merge API counts + local counts with static category definitions
          const categoriesWithCounts = DOCUMENT_CATEGORIES.map((cat) => ({
            ...cat,
            count: (data.find((d: { id: string; count: number }) => d.id === cat.id)?.count || 0) + (localCounts[cat.id] || 0),
          }));

          set({ categories: categoriesWithCounts });
        } catch {
          // Fallback to local counts
          const categoriesWithCounts = DOCUMENT_CATEGORIES.map((cat) => ({
            ...cat,
            count: localCounts[cat.id] || 0,
          }));
          set({ categories: categoriesWithCounts });
        }
      },

      setSelectedCategory: (categoryId: DocumentCategory | null) => {
        set({ selectedCategory: categoryId });
        // Trigger refetch with new category
        get().fetchDocuments({ category: categoryId || undefined, page: 1 });
      },

      // Filter operations
      setFilter: (filter: Partial<DocumentFilter>) => {
        set((state) => ({
          filter: { ...state.filter, ...filter },
        }));
      },

      resetFilter: () => {
        set({ filter: defaultFilter, selectedCategory: null });
      },

      // Bookmark operations
      fetchBookmarks: async () => {
        try {
          const response = await fetch(`${API_BASE}/bookmarks`);

          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            set({ bookmarks: [] });
            return;
          }

          if (!response.ok) {
            set({ bookmarks: [] });
            return;
          }

          const bookmarks = await response.json();
          set({ bookmarks });
        } catch {
          set({ bookmarks: [] });
        }
      },

      bookmarkDocument: async (documentId: string) => {
        try {
          const response = await fetch(`${API_BASE}/bookmarks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId }),
          });

          if (!response.ok) {
            throw new Error('Failed to bookmark document');
          }

          const bookmark = await response.json();

          set((state) => ({
            bookmarks: [...state.bookmarks, bookmark],
            documents: state.documents.map((doc) =>
              doc.id === documentId ? { ...doc, isBookmarked: true } : doc
            ),
            currentDocument:
              state.currentDocument?.id === documentId
                ? { ...state.currentDocument, isBookmarked: true }
                : state.currentDocument,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to bookmark' });
        }
      },

      removeBookmark: async (documentId: string) => {
        try {
          const response = await fetch(`${API_BASE}/bookmarks/${documentId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to remove bookmark');
          }

          set((state) => ({
            bookmarks: state.bookmarks.filter((b) => b.documentId !== documentId),
            documents: state.documents.map((doc) =>
              doc.id === documentId ? { ...doc, isBookmarked: false } : doc
            ),
            currentDocument:
              state.currentDocument?.id === documentId
                ? { ...state.currentDocument, isBookmarked: false }
                : state.currentDocument,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to remove bookmark' });
        }
      },

      isBookmarked: (documentId: string) => {
        return get().bookmarks.some((b) => b.documentId === documentId);
      },

      // Rating operations
      rateDocument: async (documentId: string, rating: number, review?: string) => {
        try {
          const response = await fetch(`${API_BASE}/documents/${documentId}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, review }),
          });

          if (!response.ok) {
            throw new Error('Failed to rate document');
          }

          const data = await response.json();

          set((state) => ({
            documents: state.documents.map((doc) =>
              doc.id === documentId
                ? {
                    ...doc,
                    userRating: rating,
                    averageRating: data.averageRating,
                    totalRatings: data.totalRatings,
                  }
                : doc
            ),
            currentDocument:
              state.currentDocument?.id === documentId
                ? {
                    ...state.currentDocument,
                    userRating: rating,
                    averageRating: data.averageRating,
                    totalRatings: data.totalRatings,
                  }
                : state.currentDocument,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to rate document' });
        }
      },

      // Reading progress (stored locally)
      updateReadingProgress: (documentId: string, progress: number) => {
        set((state) => ({
          readingProgress: {
            ...state.readingProgress,
            [documentId]: Math.min(100, Math.max(0, progress)),
          },
        }));
      },

      getReadingProgress: (documentId: string) => {
        return get().readingProgress[documentId] || 0;
      },

      // Recently viewed
      addToRecentlyViewed: (document: Document) => {
        set((state) => {
          const filtered = state.recentlyViewed.filter((d) => d.id !== document.id);
          return {
            recentlyViewed: [document, ...filtered].slice(0, 20), // Keep last 20
            stats: {
              ...state.stats,
              recentlyViewed: Math.min(state.stats.recentlyViewed + 1, 20),
              lastViewedAt: new Date().toISOString(),
            },
          };
        });
      },

      fetchRecentlyViewed: async () => {
        try {
          const response = await fetch(`${API_BASE}/documents/recently-viewed`);

          if (!response.ok) {
            return; // Keep locally cached recently viewed
          }

          const documents = await response.json();
          set({ recentlyViewed: documents });
        } catch {
          // Keep locally cached recently viewed
        }
      },

      // AI Analysis
      analyzeDocument: async (documentId: string) => {
        set({ isAnalyzing: true, aiAnalysis: null });

        try {
          const response = await fetch(`${API_BASE}/documents/${documentId}/analyze`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to analyze document');
          }

          const analysis = await response.json();
          set({ aiAnalysis: analysis, isAnalyzing: false });
        } catch (error) {
          set({
            isAnalyzing: false,
            error: error instanceof Error ? error.message : 'Failed to analyze document',
          });
        }
      },

      clearAnalysis: () => {
        set({ aiAnalysis: null });
      },

      // Search
      searchDocuments: async (query: string) => {
        if (!query.trim()) {
          return [];
        }

        try {
          const response = await fetch(
            `${API_BASE}/documents/search?q=${encodeURIComponent(query)}`
          );

          if (!response.ok) {
            throw new Error('Search failed');
          }

          return await response.json();
        } catch {
          // Search local documents as fallback
          const localDocs = getLocalDocuments();
          const lowerQuery = query.toLowerCase();
          return localDocs.filter(
            (doc) =>
              doc.title.toLowerCase().includes(lowerQuery) ||
              doc.description.toLowerCase().includes(lowerQuery) ||
              doc.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
          );
        }
      },

      // Local document management
      addLocalDocument: (data) => {
        const newDoc: Document = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: data.title,
          description: data.description,
          category: data.category,
          accessLevel: data.accessLevel,
          tags: data.tags || [],
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          fileUrl: data.fileUrl || '',
          thumbnailUrl: '',
          version: 1,
          downloads: 0,
          views: 0,
          averageRating: 0,
          totalRatings: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uploadedBy: {
            id: 'local-user',
            name: 'Current User',
            avatar: '',
          },
          mda: {
            id: 'local-mda',
            name: 'OHCS',
            acronym: 'OHCS',
          },
        };

        // Get existing local docs and add new one
        const localDocs = getLocalDocuments();
        localDocs.unshift(newDoc);
        saveLocalDocuments(localDocs);

        // Update state with new document
        set((state) => ({
          documents: [newDoc, ...state.documents],
          stats: {
            ...state.stats,
            totalDocuments: state.stats.totalDocuments + 1,
            monthlyUploads: state.stats.monthlyUploads + 1,
          },
        }));

        // Update category counts
        get().fetchCategories();

        return newDoc;
      },

      deleteLocalDocument: (id: string) => {
        const localDocs = getLocalDocuments().filter((doc) => doc.id !== id);
        saveLocalDocuments(localDocs);

        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
          stats: {
            ...state.stats,
            totalDocuments: Math.max(0, state.stats.totalDocuments - 1),
          },
        }));
      },

      getLocalDocuments: () => getLocalDocuments(),

      // Stats
      fetchStats: async () => {
        // Get local document counts
        const localDocs = getLocalDocuments();
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyLocalUploads = localDocs.filter(
          (doc) => new Date(doc.createdAt) >= monthStart
        ).length;

        try {
          const response = await fetch(`${API_BASE}/documents/stats`);

          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            // Use local stats only
            set({
              stats: {
                totalDocuments: localDocs.length,
                userBookmarks: get().bookmarks.length,
                recentlyViewed: get().recentlyViewed.length,
                trendingCount: 0,
                monthlyUploads: monthlyLocalUploads,
                lastViewedAt: get().stats.lastViewedAt,
              },
            });
            return;
          }

          if (!response.ok) {
            set({
              stats: {
                totalDocuments: localDocs.length,
                userBookmarks: get().bookmarks.length,
                recentlyViewed: get().recentlyViewed.length,
                trendingCount: 0,
                monthlyUploads: monthlyLocalUploads,
                lastViewedAt: get().stats.lastViewedAt,
              },
            });
            return;
          }

          const apiStats = await response.json();
          // Merge API stats with local counts
          set({
            stats: {
              ...apiStats,
              totalDocuments: apiStats.totalDocuments + localDocs.length,
              monthlyUploads: apiStats.monthlyUploads + monthlyLocalUploads,
            },
          });
        } catch {
          // Use local stats if API fails
          set({
            stats: {
              totalDocuments: localDocs.length,
              userBookmarks: get().bookmarks.length,
              recentlyViewed: get().recentlyViewed.length,
              trendingCount: 0,
              monthlyUploads: monthlyLocalUploads,
              lastViewedAt: get().stats.lastViewedAt,
            },
          });
        }
      },

      // Utilities
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearDocuments: () => set({ documents: [], currentDocument: null }),
    }),
    {
      name: 'ohcs-library-storage',
      partialize: (state) => ({
        // Only persist these fields locally
        readingProgress: state.readingProgress,
        recentlyViewed: state.recentlyViewed.slice(0, 10), // Keep last 10
      }),
    }
  )
);
