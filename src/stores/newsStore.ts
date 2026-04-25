import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NewsSource, NewsArticle, NewsFilter, NewsCategory } from '@/types';
import { useAuthStore } from './authStore';

// API base URL - use Workers directly in production, proxy in development
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

interface NewsState {
  sources: NewsSource[];
  articles: NewsArticle[];
  currentArticle: NewsArticle | null;
  bookmarkedArticles: NewsArticle[];
  breakingNews: NewsArticle[];
  categories: NewsCategory[];
  filter: NewsFilter;
  isLoading: boolean;
  hasMore: boolean;
  total: number;
  lastFetchedAt: string | null;
  lastViewedAt: string | null;
  newArticlesCount: number;
  error: string | null;
}

interface NewsActions {
  fetchSources: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchArticles: (filter?: NewsFilter, append?: boolean) => Promise<void>;
  fetchBreakingNews: () => Promise<void>;
  fetchArticle: (id: string) => Promise<void>;
  bookmarkArticle: (articleId: string) => Promise<void>;
  removeBookmark: (articleId: string) => Promise<void>;
  fetchBookmarks: () => Promise<void>;
  setFilter: (filter: Partial<NewsFilter>) => void;
  resetFilter: () => void;
  refreshNews: () => Promise<void>;
  dismissBreakingNews: (id: string) => void;
  clearError: () => void;
  clearCurrentArticle: () => void;
  markNewsAsViewed: () => void;
  checkForNewArticles: () => Promise<void>;
}

type NewsStore = NewsState & NewsActions;

const defaultFilter: NewsFilter = {
  page: 1,
  limit: 20,
};

const getAuthHeaders = (): HeadersInit => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useNewsStore = create<NewsStore>()(
  persist(
    (set, get) => ({
  // Initial state
  sources: [],
  articles: [],
  currentArticle: null,
  bookmarkedArticles: [],
  breakingNews: [],
  categories: [],
  filter: defaultFilter,
  isLoading: false,
  hasMore: true,
  total: 0,
  lastFetchedAt: null,
  lastViewedAt: null,
  newArticlesCount: 0,
  error: null,

  // Actions
  fetchSources: async () => {
    try {
      const response = await fetch(`${API_BASE}/news/sources`);
      if (!response.ok) throw new Error('Failed to fetch sources');
      const data = await response.json();
      set({ sources: data.sources || [] });
    } catch (error) {
      console.error('Error fetching sources:', error);
      set({ error: 'Failed to load news sources' });
    }
  },

  fetchCategories: async () => {
    try {
      const response = await fetch(`${API_BASE}/news/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      set({ categories: data.categories || [] });
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ error: 'Failed to load categories' });
    }
  },

  fetchArticles: async (filter?: NewsFilter, append = false) => {
    set({ isLoading: true, error: null });

    try {
      const currentFilter = filter || get().filter;
      const params = new URLSearchParams();

      if (currentFilter.category && currentFilter.category !== 'all') {
        params.append('category', currentFilter.category);
      }
      if (currentFilter.sourceId) {
        params.append('source', currentFilter.sourceId);
      }
      if (currentFilter.search) {
        params.append('search', currentFilter.search);
      }
      if (currentFilter.isBreaking) {
        params.append('isBreaking', 'true');
      }

      const limit = currentFilter.limit || 20;
      const offset = append ? get().articles.length : 0;
      params.append('limit', String(limit));
      params.append('offset', String(offset));

      const response = await fetch(`${API_BASE}/news?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch articles');

      const data = await response.json();
      const articles = data.articles || [];

      // Get bookmarked article IDs for marking
      const bookmarkedIds = new Set(get().bookmarkedArticles.map(a => a.id));
      const articlesWithBookmarks = articles.map((article: NewsArticle) => ({
        ...article,
        isBookmarked: bookmarkedIds.has(article.id)
      }));

      // Count new articles since last viewed
      const lastViewedAt = get().lastViewedAt;
      let newCount = 0;
      if (lastViewedAt && !append) {
        const lastViewedDate = new Date(lastViewedAt);
        newCount = articlesWithBookmarks.filter((article: NewsArticle) => {
          const articleDate = new Date(article.publishedAt);
          return articleDate > lastViewedDate;
        }).length;
      }

      set({
        articles: append ? [...get().articles, ...articlesWithBookmarks] : articlesWithBookmarks,
        total: data.total || articles.length,
        hasMore: data.hasMore || false,
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
        newArticlesCount: append ? get().newArticlesCount : newCount,
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      set({
        isLoading: false,
        error: 'Failed to load news articles'
      });
    }
  },

  fetchBreakingNews: async () => {
    try {
      const response = await fetch(`${API_BASE}/news/breaking`);
      if (!response.ok) throw new Error('Failed to fetch breaking news');
      const data = await response.json();
      set({ breakingNews: data.articles || [] });
    } catch (error) {
      console.error('Error fetching breaking news:', error);
    }
  },

  fetchArticle: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/news/${id}`);
      if (!response.ok) throw new Error('Failed to fetch article');

      const article = await response.json();

      // Check bookmark status if logged in
      const token = useAuthStore.getState().token;
      if (token) {
        try {
          const bookmarkResponse = await fetch(
            `${API_BASE}/news/${id}/bookmark/status`,
            { headers: getAuthHeaders() }
          );
          if (bookmarkResponse.ok) {
            const { bookmarked } = await bookmarkResponse.json();
            article.isBookmarked = bookmarked;
          }
        } catch {
          // Ignore bookmark status errors
        }
      }

      set({ currentArticle: article, isLoading: false });
    } catch (error) {
      console.error('Error fetching article:', error);
      set({
        currentArticle: null,
        isLoading: false,
        error: 'Failed to load article'
      });
    }
  },

  bookmarkArticle: async (articleId: string) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: 'Please login to bookmark articles' });
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/news/${articleId}/bookmark`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to bookmark article');

      // Update local state
      const article = get().articles.find(a => a.id === articleId) || get().currentArticle;
      if (article) {
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
      }
    } catch (error) {
      console.error('Error bookmarking article:', error);
      set({ error: 'Failed to bookmark article' });
    }
  },

  removeBookmark: async (articleId: string) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/news/${articleId}/bookmark`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) throw new Error('Failed to remove bookmark');

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
    } catch (error) {
      console.error('Error removing bookmark:', error);
      set({ error: 'Failed to remove bookmark' });
    }
  },

  fetchBookmarks: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ isLoading: true });

    try {
      const response = await fetch(
        `${API_BASE}/news/bookmarks/list`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Failed to fetch bookmarks');

      const data = await response.json();
      const bookmarks = (data.articles || []).map((a: NewsArticle) => ({
        ...a,
        isBookmarked: true
      }));

      set({ bookmarkedArticles: bookmarks, isLoading: false });
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      set({ isLoading: false, error: 'Failed to load bookmarks' });
    }
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
    const { fetchArticles, fetchBreakingNews, filter } = get();
    await Promise.all([
      fetchArticles({ ...filter, page: 1 }, false),
      fetchBreakingNews(),
    ]);
  },

  dismissBreakingNews: (id: string) => {
    set((state) => ({
      breakingNews: state.breakingNews.filter(n => n.id !== id)
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentArticle: () => {
    set({ currentArticle: null, error: null });
  },

  markNewsAsViewed: () => {
    set({
      lastViewedAt: new Date().toISOString(),
      newArticlesCount: 0,
    });
  },

  checkForNewArticles: async () => {
    try {
      const response = await fetch(`${API_BASE}/news?limit=5&offset=0`);
      if (!response.ok) return;

      const data = await response.json();
      const articles = data.articles || [];

      const lastViewedAt = get().lastViewedAt;
      if (!lastViewedAt) {
        // First time - set lastViewedAt but don't show badge
        set({ lastViewedAt: new Date().toISOString() });
        return;
      }

      const lastViewedDate = new Date(lastViewedAt);
      const newCount = articles.filter((article: NewsArticle) => {
        const articleDate = new Date(article.publishedAt);
        return articleDate > lastViewedDate;
      }).length;

      set({ newArticlesCount: newCount });
    } catch (error) {
      console.error('Error checking for new articles:', error);
    }
  },
}),
    {
      name: 'ohcs-news-storage',
      partialize: (state) => ({
        lastViewedAt: state.lastViewedAt,
      }),
    }
  )
);
