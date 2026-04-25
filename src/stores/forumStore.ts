import { create } from 'zustand';
import type { ForumCategory, ForumTopic, ForumPost } from '@/types';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://api.ohcselibrary.xyz/api/v1'
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
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
};

interface ForumState {
  categories: ForumCategory[];
  topics: ForumTopic[];
  currentTopic: (ForumTopic & { posts?: ForumPost[] }) | null;
  posts: ForumPost[];
  isLoading: boolean;
  error: string | null;
  totalTopics: number;
  totalPages: number;
  currentPage: number;
  stats: {
    totalTopics: number;
    totalPosts: number;
    activeMembers: number;
    todayTopics: number;
  };
  filter: {
    categoryId?: string;
    search?: string;
    sortBy: 'latest' | 'popular' | 'replies' | 'unanswered';
    filterType: 'all' | 'unanswered' | 'solved' | 'pinned';
    page: number;
    limit: number;
  };
}

interface ForumActions {
  fetchCategories: () => Promise<void>;
  fetchTopics: (categoryId?: string) => Promise<void>;
  fetchTopic: (id: string) => Promise<void>;
  fetchPosts: (topicId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  createTopic: (data: { title: string; content: string; categoryId: string; tags?: string[] }) => Promise<ForumTopic | null>;
  createPost: (topicId: string, content: string, parentId?: string) => Promise<ForumPost | null>;
  votePost: (postId: string, voteType: 'up' | 'down') => Promise<void>;
  markBestAnswer: (postId: string) => Promise<void>;
  editPost: (postId: string, content: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  subscribeTopic: (topicId: string) => Promise<void>;
  setFilter: (filter: Partial<ForumState['filter']>) => void;
  setError: (error: string | null) => void;
}

type ForumStore = ForumState & ForumActions;

export const useForumStore = create<ForumStore>((set, get) => ({
  // Initial state
  categories: [],
  topics: [],
  currentTopic: null,
  posts: [],
  isLoading: false,
  error: null,
  totalTopics: 0,
  totalPages: 1,
  currentPage: 1,
  stats: {
    totalTopics: 0,
    totalPosts: 0,
    activeMembers: 0,
    todayTopics: 0,
  },
  filter: {
    sortBy: 'latest',
    filterType: 'all',
    page: 1,
    limit: 15,
  },

  // Actions
  fetchCategories: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/forum/categories`);

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const categories = await response.json();
      set({ categories, isLoading: false });
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        isLoading: false,
        categories: [],
      });
    }
  },

  fetchTopics: async (categoryId?: string) => {
    const { filter } = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();

      if (categoryId) params.append('categoryId', categoryId);
      if (filter.search) params.append('search', filter.search);
      if (filter.sortBy) params.append('sortBy', filter.sortBy);
      if (filter.filterType !== 'all') params.append('filter', filter.filterType);
      params.append('page', filter.page.toString());
      params.append('limit', filter.limit.toString());

      const response = await authFetch(`${API_BASE}/forum/topics?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }

      const data = await response.json();

      set({
        topics: data.topics || [],
        totalTopics: data.totalCount || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching topics:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch topics',
        isLoading: false,
        topics: [],
      });
    }
  },

  fetchTopic: async (id: string) => {
    set({ isLoading: true, error: null, currentTopic: null });

    try {
      const response = await authFetch(`${API_BASE}/forum/topics/${id}`);

      if (!response.ok) {
        throw new Error('Topic not found');
      }

      const topic = await response.json();
      set({
        currentTopic: topic,
        posts: topic.posts || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching topic:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch topic',
        isLoading: false,
        currentTopic: null,
      });
    }
  },

  fetchPosts: async (topicId: string) => {
    // Posts are fetched with the topic
    const { currentTopic } = get();
    if (currentTopic?.id !== topicId) {
      await get().fetchTopic(topicId);
    }
  },

  fetchStats: async () => {
    try {
      const response = await fetch(`${API_BASE}/forum/stats`);

      if (!response.ok) {
        return;
      }

      const stats = await response.json();
      set({ stats });
    } catch (error) {
      console.error('Error fetching forum stats:', error);
    }
  },

  createTopic: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/forum/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create topic');
      }

      const topic = await response.json();

      // Add to topics list
      set((state) => ({
        topics: [topic, ...state.topics],
        isLoading: false,
      }));

      return topic;
    } catch (error) {
      console.error('Error creating topic:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create topic',
        isLoading: false,
      });
      return null;
    }
  },

  createPost: async (topicId: string, content: string, parentId?: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/forum/topics/${topicId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create post');
      }

      const post = await response.json();

      // Add to posts list
      set((state) => ({
        posts: [...state.posts, post],
        currentTopic: state.currentTopic
          ? {
              ...state.currentTopic,
              postCount: (state.currentTopic.postCount || 0) + 1,
            }
          : null,
        isLoading: false,
      }));

      return post;
    } catch (error) {
      console.error('Error creating post:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create post',
        isLoading: false,
      });
      return null;
    }
  },

  votePost: async (postId: string, voteType: 'up' | 'down') => {
    try {
      const response = await authFetch(`${API_BASE}/forum/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      const result = await response.json();

      // Update post in state
      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id !== postId) return p;

          const prevVote = (p as any).userVote;
          let likes = p.likes;
          let dislikes = p.dislikes;

          // Adjust counts based on vote change
          if (result.voteType === null) {
            // Vote removed
            if (prevVote === 'up') likes--;
            else if (prevVote === 'down') dislikes--;
          } else if (prevVote === null) {
            // New vote
            if (result.voteType === 'up') likes++;
            else dislikes++;
          } else if (prevVote !== result.voteType) {
            // Vote changed
            if (result.voteType === 'up') {
              likes++;
              dislikes--;
            } else {
              likes--;
              dislikes++;
            }
          }

          return {
            ...p,
            likes,
            dislikes,
            userVote: result.voteType,
          };
        }),
      }));
    } catch (error) {
      console.error('Error voting:', error);
    }
  },

  markBestAnswer: async (postId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/forum/posts/${postId}/best-answer`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to mark best answer');
      }

      // Update posts in state
      set((state) => ({
        posts: state.posts.map((p) => ({
          ...p,
          isBestAnswer: p.id === postId,
        })),
        currentTopic: state.currentTopic
          ? { ...state.currentTopic, isAnswered: true }
          : null,
      }));
    } catch (error) {
      console.error('Error marking best answer:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to mark best answer' });
    }
  },

  editPost: async (postId: string, content: string) => {
    try {
      const response = await authFetch(`${API_BASE}/forum/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to edit post');
      }

      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, content, isEdited: true } : p
        ),
      }));
    } catch (error) {
      console.error('Error editing post:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to edit post' });
    }
  },

  deletePost: async (postId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/forum/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete post');
      }

      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
        currentTopic: state.currentTopic
          ? {
              ...state.currentTopic,
              postCount: Math.max(0, (state.currentTopic.postCount || 0) - 1),
            }
          : null,
      }));
    } catch (error) {
      console.error('Error deleting post:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete post' });
    }
  },

  subscribeTopic: async (topicId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/forum/topics/${topicId}/subscribe`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const result = await response.json();

      set((state) => ({
        currentTopic:
          state.currentTopic?.id === topicId
            ? { ...state.currentTopic, isSubscribed: result.subscribed }
            : state.currentTopic,
      }));
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  setError: (error) => {
    set({ error });
  },
}));
