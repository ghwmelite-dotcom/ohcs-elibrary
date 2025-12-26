import { create } from 'zustand';
import type { ForumCategory, ForumTopic, ForumPost } from '@/types';

// Mock forum categories
const mockCategories: ForumCategory[] = [
  { id: '1', name: 'General Discussion', description: 'Open discussions on various topics', slug: 'general', icon: '💬', color: '#6366F1', order: 1, topicCount: 156, postCount: 1234, isLocked: false, createdAt: new Date().toISOString() },
  { id: '2', name: 'Policy & Governance', description: 'Discussions about policies and governance', slug: 'policy', icon: '📜', color: '#006B3F', order: 2, topicCount: 89, postCount: 567, isLocked: false, createdAt: new Date().toISOString() },
  { id: '3', name: 'Training & Development', description: 'Learning and professional development', slug: 'training', icon: '🎓', color: '#FCD116', order: 3, topicCount: 124, postCount: 890, isLocked: false, createdAt: new Date().toISOString() },
  { id: '4', name: 'Technology & Innovation', description: 'Tech discussions and digital transformation', slug: 'tech', icon: '💻', color: '#3B82F6', order: 4, topicCount: 78, postCount: 456, isLocked: false, createdAt: new Date().toISOString() },
  { id: '5', name: 'HR & Administration', description: 'Human resources and admin matters', slug: 'hr', icon: '👥', color: '#EC4899', order: 5, topicCount: 112, postCount: 789, isLocked: false, createdAt: new Date().toISOString() },
  { id: '6', name: 'Regional Matters', description: 'Regional and local government discussions', slug: 'regional', icon: '🗺️', color: '#F59E0B', order: 6, topicCount: 67, postCount: 345, isLocked: false, createdAt: new Date().toISOString() },
  { id: '7', name: 'Announcements', description: 'Official announcements and updates', slug: 'announcements', icon: '📢', color: '#CE1126', order: 7, topicCount: 45, postCount: 234, isLocked: false, createdAt: new Date().toISOString() },
  { id: '8', name: 'Feedback & Suggestions', description: 'Share your ideas for improvement', slug: 'feedback', icon: '💡', color: '#10B981', order: 8, topicCount: 56, postCount: 312, isLocked: false, createdAt: new Date().toISOString() },
];

// Mock topics
const mockTopics: ForumTopic[] = [
  {
    id: '1',
    title: 'Best practices for document management in the civil service',
    slug: 'document-management-best-practices',
    content: 'What are some effective strategies for managing documents across MDAs? Looking for recommendations on organizing, archiving, and retrieving documents efficiently.',
    categoryId: '1',
    category: mockCategories[0],
    authorId: '1',
    isPinned: true,
    isLocked: false,
    isAnswered: true,
    views: 1250,
    postCount: 45,
    lastPostAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    tags: ['documents', 'best-practices', 'organization'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    title: 'Understanding the new remote work policy',
    slug: 'remote-work-policy-discussion',
    content: 'Can someone explain the eligibility criteria and application process for the new remote work policy?',
    categoryId: '2',
    category: mockCategories[1],
    authorId: '2',
    isPinned: false,
    isLocked: false,
    isAnswered: false,
    views: 890,
    postCount: 23,
    lastPostAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    tags: ['remote-work', 'policy', 'HR'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    title: 'Digital skills training resources recommendation',
    slug: 'digital-skills-resources',
    content: 'Looking for recommendations on online courses and resources for improving digital literacy. What platforms have worked well for others?',
    categoryId: '3',
    category: mockCategories[2],
    authorId: '3',
    isPinned: false,
    isLocked: false,
    isAnswered: true,
    views: 567,
    postCount: 18,
    lastPostAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    tags: ['training', 'digital-skills', 'learning'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    title: 'Implementing AI tools in government operations',
    slug: 'ai-in-government',
    content: 'What AI tools and technologies are being considered or implemented across MDAs? Share your experiences and recommendations.',
    categoryId: '4',
    category: mockCategories[3],
    authorId: '1',
    isPinned: true,
    isLocked: false,
    isAnswered: false,
    views: 2100,
    postCount: 67,
    lastPostAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    tags: ['AI', 'technology', 'innovation', 'digital-transformation'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: '5',
    title: 'Leave application process clarification',
    slug: 'leave-application-process',
    content: 'Need clarification on the leave application process. Is the digital form now mandatory or can we still use paper forms?',
    categoryId: '5',
    category: mockCategories[4],
    authorId: '4',
    isPinned: false,
    isLocked: false,
    isAnswered: true,
    views: 456,
    postCount: 12,
    lastPostAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    tags: ['HR', 'leave', 'process'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

// Mock posts
const mockPosts: ForumPost[] = [
  {
    id: '1',
    topicId: '1',
    authorId: '2',
    content: 'Great question! We implemented a cloud-based document management system at MoF and it has significantly improved our efficiency. Key features include version control, metadata tagging, and advanced search.',
    likes: 15,
    dislikes: 0,
    isBestAnswer: true,
    isEdited: false,
    attachments: [],
    mentions: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: '2',
    topicId: '1',
    authorId: '3',
    content: 'I would add that having a clear naming convention is crucial. We use a format like: [MDA]-[Year]-[Category]-[Sequential Number] which helps with organization.',
    likes: 8,
    dislikes: 0,
    isBestAnswer: false,
    isEdited: false,
    attachments: [],
    mentions: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: '3',
    topicId: '1',
    authorId: '1',
    content: 'Thanks for the suggestions! @kwame.asante, could you share more about the specific system you use?',
    likes: 3,
    dislikes: 0,
    isBestAnswer: false,
    isEdited: false,
    attachments: [],
    mentions: ['kwame.asante'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
];

interface ForumState {
  categories: ForumCategory[];
  topics: ForumTopic[];
  currentTopic: ForumTopic | null;
  posts: ForumPost[];
  isLoading: boolean;
  filter: {
    categoryId?: string;
    search?: string;
    sortBy: 'latest' | 'popular' | 'unanswered';
    page: number;
    limit: number;
  };
}

interface ForumActions {
  fetchCategories: () => Promise<void>;
  fetchTopics: (categoryId?: string) => Promise<void>;
  fetchTopic: (id: string) => Promise<void>;
  fetchPosts: (topicId: string) => Promise<void>;
  createTopic: (data: { title: string; content: string; categoryId: string; tags?: string[] }) => Promise<ForumTopic>;
  createPost: (topicId: string, content: string) => Promise<ForumPost>;
  likeTopic: (topicId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  dislikePost: (postId: string) => Promise<void>;
  markBestAnswer: (postId: string) => Promise<void>;
  subscribeTopic: (topicId: string) => Promise<void>;
  unsubscribeTopic: (topicId: string) => Promise<void>;
  setFilter: (filter: Partial<ForumState['filter']>) => void;
}

type ForumStore = ForumState & ForumActions;

export const useForumStore = create<ForumStore>((set, get) => ({
  // Initial state
  categories: [],
  topics: [],
  currentTopic: null,
  posts: [],
  isLoading: false,
  filter: {
    sortBy: 'latest',
    page: 1,
    limit: 20,
  },

  // Actions
  fetchCategories: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ categories: mockCategories, isLoading: false });
  },

  fetchTopics: async (categoryId?: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 400));

    let filteredTopics = [...mockTopics];
    if (categoryId) {
      filteredTopics = filteredTopics.filter((t) => t.categoryId === categoryId);
    }

    const { filter } = get();
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredTopics = filteredTopics.filter(
        (t) =>
          t.title.toLowerCase().includes(searchLower) ||
          t.content.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (filter.sortBy) {
      case 'popular':
        filteredTopics.sort((a, b) => b.views - a.views);
        break;
      case 'unanswered':
        filteredTopics = filteredTopics.filter((t) => !t.isAnswered);
        break;
      default:
        filteredTopics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Pinned topics first
    filteredTopics.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    set({ topics: filteredTopics, isLoading: false });
  },

  fetchTopic: async (id: string) => {
    set({ isLoading: true, currentTopic: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const topic = mockTopics.find((t) => t.id === id);
    if (topic) {
      topic.views += 1;
    }

    set({ currentTopic: topic || null, isLoading: false });
  },

  fetchPosts: async (topicId: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const posts = mockPosts.filter((p) => p.topicId === topicId);
    set({ posts, isLoading: false });
  },

  createTopic: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newTopic: ForumTopic = {
      id: Date.now().toString(),
      title: data.title,
      slug: data.title.toLowerCase().replace(/\s+/g, '-'),
      content: data.content,
      categoryId: data.categoryId,
      category: mockCategories.find((c) => c.id === data.categoryId),
      authorId: '1',
      isPinned: false,
      isLocked: false,
      isAnswered: false,
      views: 0,
      postCount: 0,
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      topics: [newTopic, ...state.topics],
    }));

    return newTopic;
  },

  createPost: async (topicId: string, content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const newPost: ForumPost = {
      id: Date.now().toString(),
      topicId,
      authorId: '1',
      content,
      likes: 0,
      dislikes: 0,
      isBestAnswer: false,
      isEdited: false,
      attachments: [],
      mentions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      posts: [...state.posts, newPost],
      currentTopic: state.currentTopic
        ? { ...state.currentTopic, postCount: state.currentTopic.postCount + 1 }
        : null,
    }));

    return newPost;
  },

  likeTopic: async (_topicId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Would update topic likes in real implementation
  },

  likePost: async (postId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + 1, isLiked: true } : p
      ),
    }));
  },

  dislikePost: async (postId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, dislikes: p.dislikes + 1, isDisliked: true } : p
      ),
    }));
  },

  markBestAnswer: async (postId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      posts: state.posts.map((p) => ({
        ...p,
        isBestAnswer: p.id === postId,
      })),
      currentTopic: state.currentTopic
        ? { ...state.currentTopic, isAnswered: true }
        : null,
    }));
  },

  subscribeTopic: async (topicId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => ({
      currentTopic:
        state.currentTopic?.id === topicId
          ? { ...state.currentTopic, isSubscribed: true }
          : state.currentTopic,
    }));
  },

  unsubscribeTopic: async (topicId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => ({
      currentTopic:
        state.currentTopic?.id === topicId
          ? { ...state.currentTopic, isSubscribed: false }
          : state.currentTopic,
    }));
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },
}));
