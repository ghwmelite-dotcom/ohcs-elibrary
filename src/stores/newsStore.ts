import { create } from 'zustand';
import type { NewsSource, NewsArticle, NewsFilter } from '@/types';

// Mock news sources
const mockSources: NewsSource[] = [
  { id: '1', name: 'Ghana News Agency', url: 'https://gna.org.gh', logoUrl: 'https://gna.org.gh/logo.png', isActive: true, createdAt: new Date().toISOString() },
  { id: '2', name: 'Graphic Online', url: 'https://graphic.com.gh', logoUrl: 'https://graphic.com.gh/logo.png', isActive: true, createdAt: new Date().toISOString() },
  { id: '3', name: 'MyJoyOnline', url: 'https://myjoyonline.com', logoUrl: 'https://myjoyonline.com/logo.png', isActive: true, createdAt: new Date().toISOString() },
  { id: '4', name: 'Citinewsroom', url: 'https://citinewsroom.com', logoUrl: 'https://citinewsroom.com/logo.png', isActive: true, createdAt: new Date().toISOString() },
  { id: '5', name: 'GhanaWeb', url: 'https://ghanaweb.com', logoUrl: 'https://ghanaweb.com/logo.png', isActive: true, createdAt: new Date().toISOString() },
  { id: '6', name: 'Daily Guide', url: 'https://dailyguideafrica.com', logoUrl: 'https://dailyguideafrica.com/logo.png', isActive: true, createdAt: new Date().toISOString() },
  { id: '7', name: 'Peace FM Online', url: 'https://peacefmonline.com', logoUrl: 'https://peacefmonline.com/logo.png', isActive: true, createdAt: new Date().toISOString() },
];

// Mock news articles
const mockArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Government Launches Digital Ghana Agenda Phase 2',
    summary: 'President announces the next phase of the Digital Ghana Agenda, focusing on public sector digitization and e-governance initiatives across all MDAs.',
    url: 'https://gna.org.gh/article/digital-ghana-phase-2',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    sourceId: '1',
    source: mockSources[0],
    category: 'Technology',
    tags: ['digital transformation', 'e-governance', 'technology'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    relevanceScore: 98,
    isBreaking: true,
    fetchedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'New Public Service Training Initiative for Civil Servants',
    summary: 'OHCS announces comprehensive training program for civil servants focusing on digital skills, leadership, and public administration excellence.',
    url: 'https://graphic.com.gh/article/training-initiative',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
    sourceId: '2',
    source: mockSources[1],
    category: 'Education',
    tags: ['training', 'capacity building', 'civil service'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    relevanceScore: 95,
    isBreaking: false,
    fetchedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Budget 2024: Focus on Public Sector Reform',
    summary: 'Finance Minister presents 2024 budget with significant allocations for public sector reforms, digitization, and civil service restructuring.',
    url: 'https://myjoyonline.com/article/budget-2024',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    sourceId: '3',
    source: mockSources[2],
    category: 'Economy',
    tags: ['budget', 'public sector', 'reform', 'finance'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    relevanceScore: 92,
    isBreaking: false,
    fetchedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Civil Service Performance Awards Ceremony Announced',
    summary: 'Annual Civil Service Performance Awards to recognize outstanding civil servants across all MDAs. Nominations now open.',
    url: 'https://citinewsroom.com/article/performance-awards',
    imageUrl: 'https://images.unsplash.com/photo-1569098644016-e87b1c1b8fbd?w=800',
    sourceId: '4',
    source: mockSources[3],
    category: 'Recognition',
    tags: ['awards', 'performance', 'civil service', 'recognition'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    relevanceScore: 85,
    isBreaking: false,
    fetchedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Health Ministry Implements New Policy on Remote Work',
    summary: 'Ministry of Health becomes first MDA to fully implement hybrid work policy, allowing eligible staff to work remotely three days per week.',
    url: 'https://ghanaweb.com/article/health-remote-work',
    imageUrl: 'https://images.unsplash.com/photo-1585974738771-84483dd9f89f?w=800',
    sourceId: '5',
    source: mockSources[4],
    category: 'Policy',
    tags: ['remote work', 'health ministry', 'policy', 'hybrid work'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    relevanceScore: 88,
    isBreaking: false,
    fetchedAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Ghana Signs Agreement on Regional e-Government Cooperation',
    summary: 'Ghana leads ECOWAS initiative on shared e-government platforms and regional digital cooperation framework.',
    url: 'https://dailyguideafrica.com/article/ecowas-e-government',
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
    sourceId: '6',
    source: mockSources[5],
    category: 'International',
    tags: ['ECOWAS', 'e-government', 'regional cooperation', 'digital'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    relevanceScore: 82,
    isBreaking: false,
    fetchedAt: new Date().toISOString(),
  },
  {
    id: '7',
    title: 'New Pension Scheme Benefits for Civil Servants',
    summary: 'SSNIT announces enhanced pension benefits for civil servants, including improved retirement packages and healthcare coverage.',
    url: 'https://peacefmonline.com/article/pension-benefits',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
    sourceId: '7',
    source: mockSources[6],
    category: 'Benefits',
    tags: ['pension', 'SSNIT', 'benefits', 'retirement'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    relevanceScore: 90,
    isBreaking: false,
    fetchedAt: new Date().toISOString(),
  },
  {
    id: '8',
    title: 'Anti-Corruption Training Mandatory for All Civil Servants',
    summary: 'Office of the Special Prosecutor announces mandatory anti-corruption awareness training for all civil servants starting next month.',
    url: 'https://gna.org.gh/article/anti-corruption-training',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
    sourceId: '1',
    source: mockSources[0],
    category: 'Governance',
    tags: ['anti-corruption', 'training', 'governance', 'ethics'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    relevanceScore: 94,
    isBreaking: false,
    fetchedAt: new Date().toISOString(),
  },
];

interface NewsState {
  sources: NewsSource[];
  articles: NewsArticle[];
  currentArticle: NewsArticle | null;
  bookmarkedArticles: NewsArticle[];
  breakingNews: NewsArticle | null;
  categories: string[];
  filter: NewsFilter;
  isLoading: boolean;
  lastFetchedAt: string | null;
}

interface NewsActions {
  fetchSources: () => Promise<void>;
  fetchArticles: (filter?: NewsFilter) => Promise<void>;
  fetchArticle: (id: string) => Promise<void>;
  bookmarkArticle: (articleId: string) => Promise<void>;
  removeBookmark: (articleId: string) => Promise<void>;
  fetchBookmarks: () => Promise<void>;
  setFilter: (filter: Partial<NewsFilter>) => void;
  resetFilter: () => void;
  refreshNews: () => Promise<void>;
  dismissBreakingNews: () => void;
}

type NewsStore = NewsState & NewsActions;

const defaultFilter: NewsFilter = {
  page: 1,
  limit: 20,
};

export const useNewsStore = create<NewsStore>((set, get) => ({
  // Initial state
  sources: [],
  articles: [],
  currentArticle: null,
  bookmarkedArticles: [],
  breakingNews: null,
  categories: ['Technology', 'Policy', 'Economy', 'Education', 'Governance', 'Benefits', 'International', 'Recognition'],
  filter: defaultFilter,
  isLoading: false,
  lastFetchedAt: null,

  // Actions
  fetchSources: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ sources: mockSources });
  },

  fetchArticles: async (filter?: NewsFilter) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const currentFilter = filter || get().filter;
    let filteredArticles = [...mockArticles];

    // Apply filters
    if (currentFilter.sourceId) {
      filteredArticles = filteredArticles.filter((a) => a.sourceId === currentFilter.sourceId);
    }
    if (currentFilter.category) {
      filteredArticles = filteredArticles.filter((a) => a.category === currentFilter.category);
    }
    if (currentFilter.search) {
      const searchLower = currentFilter.search.toLowerCase();
      filteredArticles = filteredArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.summary.toLowerCase().includes(searchLower) ||
          a.tags.some((t) => t.toLowerCase().includes(searchLower))
      );
    }
    if (currentFilter.isBreaking) {
      filteredArticles = filteredArticles.filter((a) => a.isBreaking);
    }

    // Sort by published date (newest first)
    filteredArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Check for breaking news
    const breaking = filteredArticles.find((a) => a.isBreaking);

    set({
      articles: filteredArticles,
      breakingNews: breaking || null,
      isLoading: false,
      lastFetchedAt: new Date().toISOString(),
    });
  },

  fetchArticle: async (id: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const article = mockArticles.find((a) => a.id === id);
    set({ currentArticle: article || null, isLoading: false });
  },

  bookmarkArticle: async (articleId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const article = mockArticles.find((a) => a.id === articleId);
    if (!article) return;

    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === articleId ? { ...a, isBookmarked: true } : a
      ),
      bookmarkedArticles: [...state.bookmarkedArticles, { ...article, isBookmarked: true }],
      currentArticle:
        state.currentArticle?.id === articleId
          ? { ...state.currentArticle, isBookmarked: true }
          : state.currentArticle,
    }));
  },

  removeBookmark: async (articleId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === articleId ? { ...a, isBookmarked: false } : a
      ),
      bookmarkedArticles: state.bookmarkedArticles.filter((a) => a.id !== articleId),
      currentArticle:
        state.currentArticle?.id === articleId
          ? { ...state.currentArticle, isBookmarked: false }
          : state.currentArticle,
    }));
  },

  fetchBookmarks: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Would fetch bookmarks from API
    set({ isLoading: false });
  },

  setFilter: (filter: Partial<NewsFilter>) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  resetFilter: () => {
    set({ filter: defaultFilter });
  },

  refreshNews: async () => {
    await get().fetchArticles();
  },

  dismissBreakingNews: () => {
    set({ breakingNews: null });
  },
}));
