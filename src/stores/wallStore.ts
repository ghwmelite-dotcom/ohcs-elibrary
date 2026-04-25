import { create } from 'zustand';
import type {
  WallPost,
  WallComment,
  AudienceList,
  PostVisibility,
  WallPostType,
} from '../types';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return localStorage.getItem('auth_token');
  }
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

type FeedType = 'forYou' | 'following' | 'mda' | 'trending';

interface PostOptions {
  visibility?: PostVisibility;
  customListId?: string;
  attachments?: string[];
  mentionedUserIds?: string[];
  postType?: WallPostType;
  sharedDocumentId?: string;
}

interface WallState {
  // Posts
  posts: WallPost[];
  currentPost: WallPost | null;
  comments: Record<string, WallComment[]>;
  bookmarks: WallPost[];
  userPosts: Record<string, WallPost[]>;

  // Audience Lists
  audienceLists: AudienceList[];

  // Feed settings
  feedType: FeedType;
  isLoading: boolean;
  isLoadingMore: boolean;
  isPostingComment: boolean;
  error: string | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
    total: number;
  };
}

interface WallActions {
  // Feed
  fetchFeed: (type?: FeedType, refresh?: boolean) => Promise<void>;
  loadMorePosts: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  setFeedType: (type: FeedType) => void;

  // Posts
  fetchPost: (postId: string) => Promise<WallPost | null>;
  createPost: (content: string, options?: PostOptions) => Promise<WallPost | null>;
  editPost: (postId: string, content: string) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  pinPost: (postId: string) => Promise<boolean>;
  unpinPost: (postId: string) => Promise<boolean>;

  // Engagement
  likePost: (postId: string) => Promise<boolean>;
  unlikePost: (postId: string) => Promise<boolean>;
  addReaction: (postId: string, emoji: string) => Promise<boolean>;
  removeReaction: (postId: string, emoji: string) => Promise<boolean>;
  sharePost: (postId: string, comment?: string, visibility?: PostVisibility) => Promise<boolean>;
  bookmarkPost: (postId: string) => Promise<boolean>;
  unbookmarkPost: (postId: string) => Promise<boolean>;

  // Comments
  fetchComments: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string, parentId?: string) => Promise<boolean>;
  editComment: (commentId: string, content: string) => Promise<boolean>;
  deleteComment: (commentId: string, postId: string) => Promise<boolean>;
  likeComment: (commentId: string, postId: string) => Promise<boolean>;
  unlikeComment: (commentId: string, postId: string) => Promise<boolean>;

  // User posts
  fetchUserPosts: (userId: string, page?: number) => Promise<void>;
  fetchBookmarks: (page?: number) => Promise<void>;

  // Audience Lists
  fetchAudienceLists: () => Promise<void>;
  createAudienceList: (name: string, listType?: string) => Promise<AudienceList | null>;
  updateAudienceList: (listId: string, name: string) => Promise<boolean>;
  deleteAudienceList: (listId: string) => Promise<boolean>;
  fetchAudienceListMembers: (listId: string) => Promise<any[]>;
  addToAudienceList: (listId: string, userId: string) => Promise<boolean>;
  removeFromAudienceList: (listId: string, userId: string) => Promise<boolean>;

  // Helpers
  setError: (error: string | null) => void;
  setCurrentPost: (post: WallPost | null) => void;
  updatePostInFeed: (post: WallPost) => void;
  reset: () => void;
}

const initialState: WallState = {
  posts: [],
  currentPost: null,
  comments: {},
  bookmarks: [],
  userPosts: {},
  audienceLists: [],
  feedType: 'forYou',
  isLoading: false,
  isLoadingMore: false,
  isPostingComment: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    hasMore: true,
    total: 0,
  },
};

export const useWallStore = create<WallState & WallActions>((set, get) => ({
  ...initialState,

  // ============================================================================
  // Feed
  // ============================================================================

  fetchFeed: async (type?: FeedType, refresh = false) => {
    const feedType = type || get().feedType;
    set({ isLoading: true, error: null, feedType });

    try {
      const page = refresh ? 1 : get().pagination.page;
      const params = new URLSearchParams({
        type: feedType,
        page: String(page),
        limit: String(get().pagination.limit),
      });

      const response = await authFetch(`${API_BASE}/wall/feed?${params}`);
      if (!response.ok) throw new Error('Failed to fetch feed');

      const data = await response.json();
      set({
        posts: refresh ? data.posts : [...get().posts, ...data.posts],
        isLoading: false,
        pagination: {
          ...get().pagination,
          page,
          hasMore: data.posts.length === get().pagination.limit,
          total: data.total || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching feed:', error);
      set({ error: 'Failed to fetch feed', isLoading: false });
    }
  },

  loadMorePosts: async () => {
    if (get().isLoadingMore || !get().pagination.hasMore) return;

    set({ isLoadingMore: true });
    const nextPage = get().pagination.page + 1;

    try {
      const params = new URLSearchParams({
        type: get().feedType,
        page: String(nextPage),
        limit: String(get().pagination.limit),
      });

      const response = await authFetch(`${API_BASE}/wall/feed?${params}`);
      if (!response.ok) throw new Error('Failed to load more posts');

      const data = await response.json();
      set((state) => ({
        posts: [...state.posts, ...data.posts],
        isLoadingMore: false,
        pagination: {
          ...state.pagination,
          page: nextPage,
          hasMore: data.posts.length === state.pagination.limit,
        },
      }));
    } catch (error) {
      console.error('Error loading more posts:', error);
      set({ isLoadingMore: false });
    }
  },

  refreshFeed: async () => {
    await get().fetchFeed(get().feedType, true);
  },

  setFeedType: (type: FeedType) => {
    set({ feedType: type, posts: [], pagination: { ...initialState.pagination } });
    get().fetchFeed(type, true);
  },

  // ============================================================================
  // Posts
  // ============================================================================

  fetchPost: async (postId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch post');
      }

      const data = await response.json();
      set({ currentPost: data.post });
      return data.post;
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  },

  createPost: async (content: string, options: PostOptions = {}) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/posts`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          visibility: options.visibility || 'public',
          customListId: options.customListId,
          attachments: options.attachments,
          mentionedUserIds: options.mentionedUserIds,
          postType: options.postType || 'status',
          sharedDocumentId: options.sharedDocumentId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create post');
      }

      const data = await response.json();

      // Add to top of feed
      set((state) => ({
        posts: [data.post, ...state.posts],
      }));

      return data.post;
    } catch (error) {
      console.error('Error creating post:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create post' });
      return null;
    }
  },

  editPost: async (postId: string, content: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to edit post');
      }

      // Update post in state
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, content, isEdited: true } : p
        ),
        currentPost:
          state.currentPost?.id === postId
            ? { ...state.currentPost, content, isEdited: true }
            : state.currentPost,
      }));

      return true;
    } catch (error) {
      console.error('Error editing post:', error);
      return false;
    }
  },

  deletePost: async (postId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete post');
      }

      // Remove from state
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
        currentPost: state.currentPost?.id === postId ? null : state.currentPost,
      }));

      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  },

  pinPost: async (postId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/pin`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to pin post');

      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? { ...p, isPinned: true } : p)),
      }));

      return true;
    } catch (error) {
      console.error('Error pinning post:', error);
      return false;
    }
  },

  unpinPost: async (postId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/pin`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to unpin post');

      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? { ...p, isPinned: false } : p)),
      }));

      return true;
    } catch (error) {
      console.error('Error unpinning post:', error);
      return false;
    }
  },

  // ============================================================================
  // Engagement
  // ============================================================================

  likePost: async (postId: string) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likesCount: p.likesCount + 1, isLiked: true } : p
      ),
    }));

    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        // Revert on failure
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, likesCount: p.likesCount - 1, isLiked: false } : p
          ),
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likesCount: p.likesCount - 1, isLiked: false } : p
        ),
      }));
      return false;
    }
  },

  unlikePost: async (postId: string) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likesCount: Math.max(0, p.likesCount - 1), isLiked: false } : p
      ),
    }));

    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/like`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on failure
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, likesCount: p.likesCount + 1, isLiked: true } : p
          ),
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error unliking post:', error);
      // Revert
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likesCount: p.likesCount + 1, isLiked: true } : p
        ),
      }));
      return false;
    }
  },

  addReaction: async (postId: string, emoji: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/reaction`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) throw new Error('Failed to add reaction');

      // Update reactions in post
      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id !== postId) return p;
          const reactions = { ...p.reactions };
          reactions[emoji] = (reactions[emoji] || 0) + 1;
          return { ...p, reactions };
        }),
      }));

      return true;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return false;
    }
  },

  removeReaction: async (postId: string, emoji: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/reaction/${emoji}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove reaction');

      // Update reactions in post
      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id !== postId) return p;
          const reactions = { ...p.reactions };
          reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1);
          if (reactions[emoji] === 0) delete reactions[emoji];
          return { ...p, reactions };
        }),
      }));

      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return false;
    }
  },

  sharePost: async (postId: string, comment?: string, visibility: PostVisibility = 'public') => {
    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/share`, {
        method: 'POST',
        body: JSON.stringify({ comment, visibility }),
      });

      if (!response.ok) throw new Error('Failed to share post');

      const data = await response.json();

      // Add shared post to feed
      set((state) => ({
        posts: [data.post, ...state.posts],
      }));

      // Increment share count on original
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, sharesCount: p.sharesCount + 1 } : p
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error sharing post:', error);
      return false;
    }
  },

  bookmarkPost: async (postId: string) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? { ...p, isBookmarked: true } : p)),
    }));

    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/bookmark`, {
        method: 'POST',
      });

      if (!response.ok) {
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isBookmarked: false } : p)),
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error bookmarking post:', error);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? { ...p, isBookmarked: false } : p)),
      }));
      return false;
    }
  },

  unbookmarkPost: async (postId: string) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? { ...p, isBookmarked: false } : p)),
      bookmarks: state.bookmarks.filter((p) => p.id !== postId),
    }));

    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/bookmark`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isBookmarked: true } : p)),
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? { ...p, isBookmarked: true } : p)),
      }));
      return false;
    }
  },

  // ============================================================================
  // Comments
  // ============================================================================

  fetchComments: async (postId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');

      const data = await response.json();
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: data.comments || [],
        },
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  },

  addComment: async (postId: string, content: string, parentId?: string) => {
    set({ isPostingComment: true });

    try {
      const response = await authFetch(`${API_BASE}/wall/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parentId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add comment');
      }

      const data = await response.json();

      // Add comment to state
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: [...(state.comments[postId] || []), data.comment],
        },
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
        ),
        isPostingComment: false,
      }));

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      set({ isPostingComment: false });
      return false;
    }
  },

  editComment: async (commentId: string, content: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to edit comment');

      // Update comment in all post comments
      set((state) => {
        const newComments = { ...state.comments };
        for (const postId in newComments) {
          newComments[postId] = newComments[postId].map((c) =>
            c.id === commentId ? { ...c, content, isEdited: true } : c
          );
        }
        return { comments: newComments };
      });

      return true;
    } catch (error) {
      console.error('Error editing comment:', error);
      return false;
    }
  },

  deleteComment: async (commentId: string, postId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      // Remove from state
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: (state.comments[postId] || []).filter((c) => c.id !== commentId),
        },
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  },

  likeComment: async (commentId: string, postId: string) => {
    // Optimistic update
    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: (state.comments[postId] || []).map((c) =>
          c.id === commentId ? { ...c, likesCount: c.likesCount + 1, isLiked: true } : c
        ),
      },
    }));

    try {
      const response = await authFetch(`${API_BASE}/wall/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        // Revert
        set((state) => ({
          comments: {
            ...state.comments,
            [postId]: (state.comments[postId] || []).map((c) =>
              c.id === commentId ? { ...c, likesCount: c.likesCount - 1, isLiked: false } : c
            ),
          },
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error liking comment:', error);
      return false;
    }
  },

  unlikeComment: async (commentId: string, postId: string) => {
    // Optimistic update
    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: (state.comments[postId] || []).map((c) =>
          c.id === commentId
            ? { ...c, likesCount: Math.max(0, c.likesCount - 1), isLiked: false }
            : c
        ),
      },
    }));

    try {
      const response = await authFetch(`${API_BASE}/wall/comments/${commentId}/like`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert
        set((state) => ({
          comments: {
            ...state.comments,
            [postId]: (state.comments[postId] || []).map((c) =>
              c.id === commentId ? { ...c, likesCount: c.likesCount + 1, isLiked: true } : c
            ),
          },
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error unliking comment:', error);
      return false;
    }
  },

  // ============================================================================
  // User Posts & Bookmarks
  // ============================================================================

  fetchUserPosts: async (userId: string, page = 1) => {
    try {
      const response = await authFetch(
        `${API_BASE}/wall/users/${userId}/posts?page=${page}&limit=20`
      );
      if (!response.ok) throw new Error('Failed to fetch user posts');

      const data = await response.json();
      set((state) => ({
        userPosts: {
          ...state.userPosts,
          [userId]: page === 1 ? data.posts : [...(state.userPosts[userId] || []), ...data.posts],
        },
      }));
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  },

  fetchBookmarks: async (page = 1) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/bookmarks?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch bookmarks');

      const data = await response.json();
      set((state) => ({
        bookmarks: page === 1 ? data.posts : [...state.bookmarks, ...data.posts],
      }));
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  },

  // ============================================================================
  // Audience Lists
  // ============================================================================

  fetchAudienceLists: async () => {
    try {
      const response = await authFetch(`${API_BASE}/wall/audience-lists`);
      if (!response.ok) throw new Error('Failed to fetch audience lists');

      const data = await response.json();
      set({ audienceLists: data.lists || [] });
    } catch (error) {
      console.error('Error fetching audience lists:', error);
    }
  },

  createAudienceList: async (name: string, listType = 'custom') => {
    try {
      const response = await authFetch(`${API_BASE}/wall/audience-lists`, {
        method: 'POST',
        body: JSON.stringify({ name, listType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create list');
      }

      const data = await response.json();
      set((state) => ({
        audienceLists: [...state.audienceLists, data.list],
      }));

      return data.list;
    } catch (error) {
      console.error('Error creating audience list:', error);
      return null;
    }
  },

  updateAudienceList: async (listId: string, name: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/audience-lists/${listId}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Failed to update list');

      set((state) => ({
        audienceLists: state.audienceLists.map((l) => (l.id === listId ? { ...l, name } : l)),
      }));

      return true;
    } catch (error) {
      console.error('Error updating audience list:', error);
      return false;
    }
  },

  deleteAudienceList: async (listId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/audience-lists/${listId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete list');

      set((state) => ({
        audienceLists: state.audienceLists.filter((l) => l.id !== listId),
      }));

      return true;
    } catch (error) {
      console.error('Error deleting audience list:', error);
      return false;
    }
  },

  fetchAudienceListMembers: async (listId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/audience-lists/${listId}/members`);
      if (!response.ok) throw new Error('Failed to fetch members');

      const data = await response.json();
      return data.members || [];
    } catch (error) {
      console.error('Error fetching audience list members:', error);
      return [];
    }
  },

  addToAudienceList: async (listId: string, userId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/wall/audience-lists/${listId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to add member');

      // Update member count
      set((state) => ({
        audienceLists: state.audienceLists.map((l) =>
          l.id === listId ? { ...l, memberCount: l.memberCount + 1 } : l
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error adding to audience list:', error);
      return false;
    }
  },

  removeFromAudienceList: async (listId: string, userId: string) => {
    try {
      const response = await authFetch(
        `${API_BASE}/wall/audience-lists/${listId}/members/${userId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove member');

      // Update member count
      set((state) => ({
        audienceLists: state.audienceLists.map((l) =>
          l.id === listId ? { ...l, memberCount: Math.max(0, l.memberCount - 1) } : l
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error removing from audience list:', error);
      return false;
    }
  },

  // ============================================================================
  // Helpers
  // ============================================================================

  setError: (error: string | null) => set({ error }),

  setCurrentPost: (post: WallPost | null) => set({ currentPost: post }),

  updatePostInFeed: (post: WallPost) => {
    set((state) => ({
      posts: state.posts.map((p) => (p.id === post.id ? post : p)),
      currentPost: state.currentPost?.id === post.id ? post : state.currentPost,
    }));
  },

  reset: () => set(initialState),
}));
