import { create } from 'zustand';
import type { SearchResult, SearchFilter, SearchResultType, SearchHistory } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

interface SearchState {
  results: SearchResult[];
  total: number;
  filter: SearchFilter;
  history: SearchHistory[];
  isSearching: boolean;
  recentQueries: string[];
  suggestedQueries: string[];
}

interface SearchActions {
  search: (query: string, types?: SearchResultType[]) => Promise<void>;
  setFilter: (filter: Partial<SearchFilter>) => void;
  clearSearch: () => void;
  fetchSuggestions: (query: string) => Promise<string[]>;
  fetchRecentSearches: () => Promise<void>;
  saveSearchHistory: (query: string, resultCount: number, selectedType?: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  removeFromHistory: (id: string) => Promise<void>;
}

type SearchStore = SearchState & SearchActions;

const defaultFilter: SearchFilter = {
  query: '',
  page: 1,
  limit: 20,
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  // Initial state
  results: [],
  total: 0,
  filter: defaultFilter,
  history: [],
  isSearching: false,
  recentQueries: [],
  suggestedQueries: [],

  // Actions
  search: async (query: string, types?: SearchResultType[]) => {
    if (!query.trim()) {
      set({ results: [], total: 0, isSearching: false });
      return;
    }

    set({ isSearching: true, filter: { ...get().filter, query, types } });

    try {
      const params = new URLSearchParams({ q: query, limit: String(get().filter.limit ?? 20) });
      if (types && types.length > 0) {
        params.set('types', types.join(','));
      }

      const data = await fetchAPI<{ results: SearchResult[]; total: number; query: string }>(
        `/search?${params.toString()}`
      );

      set({
        results: data.results,
        total: data.total,
        isSearching: false,
        recentQueries: [query, ...get().recentQueries.filter((q) => q !== query)].slice(0, 10),
      });
    } catch (error) {
      console.error('Search failed:', error);
      set({ results: [], total: 0, isSearching: false });
    }
  },

  setFilter: (filter: Partial<SearchFilter>) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  clearSearch: () => {
    set({
      results: [],
      total: 0,
      filter: defaultFilter,
      suggestedQueries: [],
    });
  },

  fetchSuggestions: async (query: string) => {
    if (query.length < 2) {
      set({ suggestedQueries: [] });
      return [];
    }

    try {
      const params = new URLSearchParams({ q: query });
      const data = await fetchAPI<{ suggestions: string[] }>(
        `/search/suggestions?${params.toString()}`
      );
      const suggestions = data.suggestions ?? [];
      set({ suggestedQueries: suggestions });
      return suggestions;
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      set({ suggestedQueries: [] });
      return [];
    }
  },

  fetchRecentSearches: async () => {
    try {
      const data = await fetchAPI<{ searches: SearchHistory[] }>('/search/recent');
      set({ history: data.searches ?? [] });
    } catch (error) {
      console.error('Failed to fetch recent searches:', error);
      set({ history: [] });
    }
  },

  saveSearchHistory: async (query: string, resultCount: number, selectedType?: string) => {
    try {
      await fetchAPI('/search/history', {
        method: 'POST',
        body: JSON.stringify({ query, resultCount, selectedType }),
      });
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  },

  clearHistory: async () => {
    try {
      await fetchAPI('/search/history', { method: 'DELETE' });
      set({ history: [] });
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },

  removeFromHistory: async (id: string) => {
    try {
      await fetchAPI(`/search/history/${id}`, { method: 'DELETE' });
      set((state) => ({
        history: state.history.filter((h) => h.id !== id),
      }));
    } catch (error) {
      console.error('Failed to remove history item:', error);
    }
  },
}));
