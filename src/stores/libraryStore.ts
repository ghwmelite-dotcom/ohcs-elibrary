import { create } from 'zustand';
import type { Document, DocumentCategory, DocumentFilter, Collection, Bookmark, AIAnalysis } from '@/types';

// Mock documents data
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Civil Service Code of Conduct 2024',
    description: 'Updated guidelines on ethical behavior and professional standards for all civil servants in Ghana.',
    category: 'policies',
    tags: ['ethics', 'conduct', 'guidelines', 'professional standards'],
    fileUrl: '/documents/code-of-conduct-2024.pdf',
    fileName: 'code-of-conduct-2024.pdf',
    fileSize: 2456000,
    fileType: 'application/pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300',
    accessLevel: 'internal',
    status: 'published',
    authorId: '1',
    version: 3,
    downloads: 1250,
    views: 4580,
    averageRating: 4.7,
    totalRatings: 89,
    publishedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Public Sector Reform Strategy 2024-2028',
    description: 'Comprehensive strategy document outlining the government approach to modernizing the public sector over the next five years.',
    category: 'policies',
    tags: ['reform', 'strategy', 'modernization', 'governance'],
    fileUrl: '/documents/reform-strategy-2024.pdf',
    fileName: 'reform-strategy-2024.pdf',
    fileSize: 5890000,
    fileType: 'application/pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
    accessLevel: 'public',
    status: 'published',
    authorId: '2',
    version: 1,
    downloads: 3420,
    views: 8900,
    averageRating: 4.9,
    totalRatings: 156,
    publishedAt: '2024-02-20T14:00:00Z',
    createdAt: '2024-02-15T09:00:00Z',
    updatedAt: '2024-02-20T14:00:00Z',
  },
  {
    id: '3',
    title: 'Digital Skills Training Manual',
    description: 'Comprehensive training guide for digital literacy and ICT skills development for civil servants.',
    category: 'training',
    tags: ['training', 'digital', 'ICT', 'skills', 'capacity building'],
    fileUrl: '/documents/digital-skills-manual.pdf',
    fileName: 'digital-skills-manual.pdf',
    fileSize: 8750000,
    fileType: 'application/pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300',
    accessLevel: 'internal',
    status: 'published',
    authorId: '1',
    version: 2,
    downloads: 890,
    views: 2340,
    averageRating: 4.5,
    totalRatings: 67,
    publishedAt: '2024-03-01T09:00:00Z',
    createdAt: '2024-02-25T10:00:00Z',
    updatedAt: '2024-03-01T09:00:00Z',
  },
  {
    id: '4',
    title: 'Leave Application Form GCS-01',
    description: 'Standard leave application form for all Ghana Civil Service employees.',
    category: 'forms',
    tags: ['form', 'leave', 'HR', 'application'],
    fileUrl: '/documents/leave-form-gcs01.pdf',
    fileName: 'leave-form-gcs01.pdf',
    fileSize: 245000,
    fileType: 'application/pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=300',
    accessLevel: 'internal',
    status: 'published',
    authorId: '3',
    version: 5,
    downloads: 12500,
    views: 25000,
    averageRating: 4.2,
    totalRatings: 45,
    publishedAt: '2023-06-01T08:00:00Z',
    createdAt: '2023-05-15T10:00:00Z',
    updatedAt: '2024-01-05T11:00:00Z',
  },
  {
    id: '5',
    title: 'Annual Performance Report 2023',
    description: 'Comprehensive report on the performance of the Ghana Civil Service for the year 2023.',
    category: 'reports',
    tags: ['report', 'performance', 'annual', '2023'],
    fileUrl: '/documents/annual-report-2023.pdf',
    fileName: 'annual-report-2023.pdf',
    fileSize: 15600000,
    fileType: 'application/pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300',
    accessLevel: 'public',
    status: 'published',
    authorId: '2',
    version: 1,
    downloads: 5670,
    views: 12400,
    averageRating: 4.6,
    totalRatings: 123,
    publishedAt: '2024-02-28T10:00:00Z',
    createdAt: '2024-02-20T09:00:00Z',
    updatedAt: '2024-02-28T10:00:00Z',
  },
  {
    id: '6',
    title: 'Circular on Remote Work Policy',
    description: 'Guidelines for implementing remote and hybrid work arrangements in the civil service.',
    category: 'circulars',
    tags: ['circular', 'remote work', 'policy', 'hybrid'],
    fileUrl: '/documents/remote-work-circular.pdf',
    fileName: 'remote-work-circular.pdf',
    fileSize: 890000,
    fileType: 'application/pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585974738771-84483dd9f89f?w=300',
    accessLevel: 'internal',
    status: 'published',
    authorId: '1',
    version: 1,
    downloads: 2340,
    views: 6780,
    averageRating: 4.4,
    totalRatings: 78,
    publishedAt: '2024-03-10T08:00:00Z',
    createdAt: '2024-03-08T14:00:00Z',
    updatedAt: '2024-03-10T08:00:00Z',
  },
];

const mockCategories = [
  { value: 'circulars', label: 'Circulars & Directives', count: 45 },
  { value: 'policies', label: 'Policies & Guidelines', count: 78 },
  { value: 'training', label: 'Training Materials', count: 120 },
  { value: 'reports', label: 'Reports & Publications', count: 89 },
  { value: 'forms', label: 'Forms & Templates', count: 56 },
  { value: 'legal', label: 'Legal Documents', count: 34 },
  { value: 'research', label: 'Research Papers', count: 67 },
  { value: 'general', label: 'General Resources', count: 156 },
];

interface LibraryState {
  documents: Document[];
  currentDocument: Document | null;
  categories: typeof mockCategories;
  filter: DocumentFilter;
  bookmarks: Bookmark[];
  collections: Collection[];
  readingProgress: Map<string, number>;
  isLoading: boolean;
  aiAnalysis: AIAnalysis | null;
  isAnalyzing: boolean;
}

interface LibraryActions {
  fetchDocuments: (filter?: DocumentFilter) => Promise<void>;
  fetchDocument: (id: string) => Promise<void>;
  setFilter: (filter: Partial<DocumentFilter>) => void;
  resetFilter: () => void;
  bookmarkDocument: (documentId: string) => Promise<void>;
  removeBookmark: (documentId: string) => Promise<void>;
  rateDocument: (documentId: string, rating: number, review?: string) => Promise<void>;
  updateReadingProgress: (documentId: string, progress: number) => void;
  analyzeDocument: (documentId: string) => Promise<void>;
  searchDocuments: (query: string) => Promise<Document[]>;
}

type LibraryStore = LibraryState & LibraryActions;

const defaultFilter: DocumentFilter = {
  page: 1,
  limit: 12,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  // Initial state
  documents: [],
  currentDocument: null,
  categories: mockCategories,
  filter: defaultFilter,
  bookmarks: [],
  collections: [],
  readingProgress: new Map(),
  isLoading: false,
  aiAnalysis: null,
  isAnalyzing: false,

  // Actions
  fetchDocuments: async (filter?: DocumentFilter) => {
    set({ isLoading: true });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const currentFilter = filter || get().filter;
    let filteredDocs = [...mockDocuments];

    // Apply filters
    if (currentFilter.category) {
      filteredDocs = filteredDocs.filter((doc) => doc.category === currentFilter.category);
    }
    if (currentFilter.search) {
      const searchLower = currentFilter.search.toLowerCase();
      filteredDocs = filteredDocs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description.toLowerCase().includes(searchLower) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }
    if (currentFilter.accessLevel) {
      filteredDocs = filteredDocs.filter((doc) => doc.accessLevel === currentFilter.accessLevel);
    }

    // Apply sorting
    if (currentFilter.sortBy) {
      filteredDocs.sort((a, b) => {
        const aValue = a[currentFilter.sortBy as keyof Document];
        const bValue = b[currentFilter.sortBy as keyof Document];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return currentFilter.sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return currentFilter.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }

    set({ documents: filteredDocs, isLoading: false });
  },

  fetchDocument: async (id: string) => {
    set({ isLoading: true, currentDocument: null });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    const document = mockDocuments.find((doc) => doc.id === id);
    if (document) {
      // Increment view count
      document.views += 1;
    }

    set({ currentDocument: document || null, isLoading: false });
  },

  setFilter: (filter: Partial<DocumentFilter>) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  resetFilter: () => {
    set({ filter: defaultFilter });
  },

  bookmarkDocument: async (documentId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      documentId,
      userId: '1',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      bookmarks: [...state.bookmarks, newBookmark],
      documents: state.documents.map((doc) =>
        doc.id === documentId ? { ...doc, isBookmarked: true } : doc
      ),
      currentDocument:
        state.currentDocument?.id === documentId
          ? { ...state.currentDocument, isBookmarked: true }
          : state.currentDocument,
    }));
  },

  removeBookmark: async (documentId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

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
  },

  rateDocument: async (documentId: string, rating: number, _review?: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              userRating: rating,
              totalRatings: doc.totalRatings + 1,
              averageRating: (doc.averageRating * doc.totalRatings + rating) / (doc.totalRatings + 1),
            }
          : doc
      ),
      currentDocument:
        state.currentDocument?.id === documentId
          ? {
              ...state.currentDocument,
              userRating: rating,
              totalRatings: state.currentDocument.totalRatings + 1,
              averageRating:
                (state.currentDocument.averageRating * state.currentDocument.totalRatings + rating) /
                (state.currentDocument.totalRatings + 1),
            }
          : state.currentDocument,
    }));
  },

  updateReadingProgress: (documentId: string, progress: number) => {
    set((state) => {
      const newProgress = new Map(state.readingProgress);
      newProgress.set(documentId, progress);
      return { readingProgress: newProgress };
    });
  },

  analyzeDocument: async (documentId: string) => {
    set({ isAnalyzing: true, aiAnalysis: null });

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const document = mockDocuments.find((doc) => doc.id === documentId);
    if (!document) {
      set({ isAnalyzing: false });
      return;
    }

    const analysis: AIAnalysis = {
      summary: `This document "${document.title}" provides comprehensive guidelines and information related to ${document.category}. It covers key aspects that are essential for civil servants to understand and implement in their daily operations.`,
      keyPoints: [
        'Establishes clear standards and expectations for civil servants',
        'Provides step-by-step procedures for implementation',
        'Includes best practices and recommendations',
        'Outlines compliance requirements and deadlines',
        'Contains appendices with supplementary materials',
      ],
      topics: document.tags.slice(0, 5),
      suggestedTags: ['governance', 'public sector', 'best practices', 'compliance'],
      relatedDocuments: mockDocuments.filter((doc) => doc.id !== documentId).slice(0, 3),
      readingTime: Math.ceil(document.fileSize / 100000) * 5,
    };

    set({ aiAnalysis: analysis, isAnalyzing: false });
  },

  searchDocuments: async (query: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const searchLower = query.toLowerCase();
    return mockDocuments.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  },
}));
