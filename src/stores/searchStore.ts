import { create } from 'zustand';
import type { SearchResult, SearchFilter, SearchResultType, SearchHistory } from '@/types';

// Mock search results
const mockSearchResults: SearchResult[] = [
  {
    type: 'document',
    id: '1',
    title: 'Civil Service Code of Conduct 2024',
    description: 'Updated guidelines on ethical behavior and professional standards for all civil servants in Ghana.',
    url: '/library/1',
    highlights: ['civil servants', 'ethical behavior', 'professional standards'],
    score: 0.95,
  },
  {
    type: 'document',
    id: '3',
    title: 'Digital Skills Training Manual',
    description: 'Comprehensive training guide for digital literacy and ICT skills development.',
    url: '/library/3',
    highlights: ['digital literacy', 'ICT skills', 'training'],
    score: 0.88,
  },
  {
    type: 'topic',
    id: '1',
    title: 'Best practices for document management',
    description: 'Discussion on effective strategies for managing documents across MDAs.',
    url: '/forum/topic/1',
    highlights: ['document management', 'best practices', 'MDAs'],
    score: 0.82,
  },
  {
    type: 'topic',
    id: '4',
    title: 'Implementing AI tools in government',
    description: 'What AI tools and technologies are being considered or implemented across MDAs?',
    url: '/forum/topic/4',
    highlights: ['AI tools', 'government', 'implementation'],
    score: 0.78,
  },
  {
    type: 'user',
    id: '2',
    title: 'Kwame Asante',
    description: 'Director at OHCS | Digital Transformation Lead',
    url: '/profile/2',
    highlights: ['Digital Transformation'],
    score: 0.75,
    metadata: { role: 'director', mda: 'OHCS' },
  },
  {
    type: 'group',
    id: '1',
    title: 'Digital Transformation Committee',
    description: 'Official committee for driving digital transformation across the Ghana Civil Service.',
    url: '/groups/1',
    highlights: ['digital transformation', 'civil service'],
    score: 0.72,
  },
  {
    type: 'news',
    id: '1',
    title: 'Government Launches Digital Ghana Agenda Phase 2',
    description: 'President announces the next phase of the Digital Ghana Agenda.',
    url: '/news/1',
    highlights: ['Digital Ghana Agenda', 'digitization'],
    score: 0.70,
  },
];

const mockSearchHistory: SearchHistory[] = [
  { id: '1', userId: '1', query: 'remote work policy', resultCount: 5, searchedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: '2', userId: '1', query: 'digital transformation', resultCount: 12, searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: '3', userId: '1', query: 'training materials', resultCount: 8, searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: '4', userId: '1', query: 'leave application', resultCount: 3, searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

interface SearchState {
  results: SearchResult[];
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
  fetchHistory: () => Promise<void>;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  getSuggestions: (query: string) => Promise<string[]>;
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
  filter: defaultFilter,
  history: [],
  isSearching: false,
  recentQueries: ['remote work', 'training', 'digital skills', 'policy'],
  suggestedQueries: [],

  // Actions
  search: async (query: string, types?: SearchResultType[]) => {
    if (!query.trim()) {
      set({ results: [], isSearching: false });
      return;
    }

    set({ isSearching: true, filter: { ...get().filter, query, types } });
    await new Promise((resolve) => setTimeout(resolve, 400));

    const queryLower = query.toLowerCase();
    let results = mockSearchResults.filter(
      (r) =>
        r.title.toLowerCase().includes(queryLower) ||
        r.description.toLowerCase().includes(queryLower) ||
        r.highlights.some((h) => h.toLowerCase().includes(queryLower))
    );

    // Filter by types if specified
    if (types && types.length > 0) {
      results = results.filter((r) => types.includes(r.type));
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Add to recent queries
    set((state) => ({
      results,
      isSearching: false,
      recentQueries: [query, ...state.recentQueries.filter((q) => q !== query)].slice(0, 10),
    }));
  },

  setFilter: (filter: Partial<SearchFilter>) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  clearSearch: () => {
    set({
      results: [],
      filter: defaultFilter,
      suggestedQueries: [],
    });
  },

  fetchHistory: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ history: mockSearchHistory });
  },

  clearHistory: () => {
    set({ history: [] });
  },

  removeFromHistory: (id: string) => {
    set((state) => ({
      history: state.history.filter((h) => h.id !== id),
    }));
  },

  getSuggestions: async (query: string) => {
    if (query.length < 2) {
      set({ suggestedQueries: [] });
      return [];
    }

    await new Promise((resolve) => setTimeout(resolve, 150));

    const suggestions = [
      'digital transformation',
      'digital skills training',
      'digital governance',
      'remote work policy',
      'performance management',
      'civil service reform',
      'training materials',
      'leave application',
    ].filter((s) => s.toLowerCase().includes(query.toLowerCase()));

    set({ suggestedQueries: suggestions });
    return suggestions;
  },
}));
