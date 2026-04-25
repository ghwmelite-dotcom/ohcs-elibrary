import { create } from 'zustand';
import type { Group, GroupMember, GroupPost, GroupComment, GroupInvitation } from '@/types';

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
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
};

export interface GroupCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  groupCount: number;
}

export interface GroupStats {
  totalGroups: number;
  myGroups: number;
  trending: number;
  newThisWeek: number;
}

interface GroupsState {
  groups: Group[];
  currentGroup: Group | null;
  posts: GroupPost[];
  comments: GroupComment[];
  members: GroupMember[];
  invitations: GroupInvitation[];
  categories: GroupCategory[];
  stats: GroupStats;
  isLoading: boolean;
  error: string | null;
  filter: {
    type?: Group['type'];
    search?: string;
    joinedOnly?: boolean;
    categoryId?: string;
  };
}

interface Attachment {
  id?: string;
  type: 'image' | 'file' | 'gif' | 'audio';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  file?: File;
  preview?: string;
  duration?: number;
}

interface GroupsActions {
  fetchGroups: () => Promise<void>;
  fetchGroup: (id: string) => Promise<void>;
  fetchPosts: (groupId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  fetchMembers: (groupId: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createGroup: (data: { name: string; description: string; type: Group['type']; categoryId?: string; coverColor?: string; tags?: string[] }) => Promise<Group>;
  updateGroup: (groupId: string, data: Partial<Group>) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  requestJoin: (groupId: string) => Promise<void>;
  createPost: (groupId: string, content: string, attachments?: Attachment[]) => Promise<GroupPost>;
  uploadAttachment: (groupId: string, file: File) => Promise<{ url: string; name: string; size: number; type: string; mimeType: string }>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  toggleReaction: (postId: string, emoji: string) => Promise<void>;
  toggleCommentReaction: (commentId: string, emoji: string) => Promise<void>;
  createComment: (postId: string, content: string, attachments?: Attachment[]) => Promise<GroupComment>;
  likeComment: (commentId: string) => Promise<void>;
  inviteMember: (groupId: string, userId: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  updateMemberRole: (groupId: string, userId: string, role: GroupMember['role']) => Promise<void>;
  setFilter: (filter: Partial<GroupsState['filter']>) => void;
  setError: (error: string | null) => void;
}

type GroupsStore = GroupsState & GroupsActions;

export const useGroupsStore = create<GroupsStore>((set, get) => ({
  // Initial state
  groups: [],
  currentGroup: null,
  posts: [],
  comments: [],
  members: [],
  invitations: [],
  categories: [],
  stats: {
    totalGroups: 0,
    myGroups: 0,
    trending: 0,
    newThisWeek: 0,
  },
  isLoading: false,
  error: null,
  filter: {},

  // Actions
  fetchCategories: async () => {
    try {
      const response = await authFetch(`${API_BASE}/groups/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      set({ categories: data.categories || [] });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  fetchStats: async () => {
    try {
      const response = await authFetch(`${API_BASE}/groups/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      set({
        stats: {
          totalGroups: data.totalGroups || 0,
          myGroups: data.myGroups || 0,
          trending: data.trending || 0,
          newThisWeek: data.newThisWeek || 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  fetchGroups: async () => {
    set({ isLoading: true, error: null });

    try {
      const { filter } = get();
      const params = new URLSearchParams();

      if (filter.type) params.append('type', filter.type);
      if (filter.search) params.append('search', filter.search);
      if (filter.joinedOnly) params.append('joined', 'true');
      if (filter.categoryId) params.append('category', filter.categoryId);

      const response = await authFetch(`${API_BASE}/groups?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();

      // Transform API response to match frontend types
      const groups: Group[] = (data.groups || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description || '',
        slug: g.slug,
        type: g.type || 'open',
        coverImage: g.coverImage,
        coverColor: g.coverColor,
        avatar: g.avatar,
        createdById: g.createdById,
        mdaId: g.mdaId,
        memberCount: g.memberCount || 0,
        postCount: g.postCount || 0,
        isJoined: g.isJoined || false,
        isPendingApproval: g.isPendingApproval || false,
        memberRole: g.memberRole,
        tags: g.tags || [],
        isArchived: g.isArchived || false,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      }));

      set({ groups, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      set({ error: 'Failed to load groups', isLoading: false });
    }
  },

  fetchGroup: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/groups/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch group');
      }

      const data = await response.json();
      const group: Group = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        slug: data.slug,
        type: data.type || 'open',
        coverImage: data.coverImage,
        coverColor: data.coverColor,
        avatar: data.avatar,
        createdById: data.createdById,
        mdaId: data.mdaId,
        memberCount: data.memberCount || 0,
        postCount: data.postCount || 0,
        isJoined: data.isJoined || false,
        isPendingApproval: data.isPendingApproval || false,
        memberRole: data.memberRole,
        tags: data.tags || [],
        isArchived: data.isArchived || false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      set({ currentGroup: group, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch group:', error);
      set({ error: 'Failed to load group', isLoading: false });
    }
  },

  fetchPosts: async (groupId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/groups/${groupId}/posts`);

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();

      const posts: GroupPost[] = (data.posts || []).map((p: any) => ({
        id: p.id,
        groupId: p.groupId,
        authorId: p.authorId,
        authorName: p.authorName,
        authorAvatar: p.authorAvatar,
        content: p.content,
        attachments: p.attachments || [],
        likes: p.likes || 0,
        commentCount: p.commentCount || 0,
        isLiked: p.isLiked || false,
        isPinned: p.isPinned || false,
        reactions: p.reactions || [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      set({ posts, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      set({ error: 'Failed to load posts', isLoading: false, posts: [] });
    }
  },

  fetchComments: async (postId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/groups/posts/${postId}/comments`);

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();

      const comments: GroupComment[] = (data.comments || []).map((c: any) => ({
        id: c.id,
        postId: c.postId,
        authorId: c.authorId,
        authorName: c.authorName,
        authorAvatar: c.authorAvatar,
        content: c.content,
        parentId: c.parentId,
        attachments: c.attachments || [],
        reactions: c.reactions || [],
        likes: c.likes || 0,
        isLiked: c.isLiked || false,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      set({ comments });
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  },

  fetchMembers: async (groupId: string) => {
    set({ isLoading: true });

    try {
      const response = await authFetch(`${API_BASE}/groups/${groupId}/members`);

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();

      const members: GroupMember[] = (data.members || []).map((m: any) => ({
        id: m.id,
        groupId: m.groupId,
        userId: m.userId,
        displayName: m.displayName,
        avatar: m.avatar,
        role: m.role || 'member',
        status: m.status || 'active',
        joinedAt: m.joinedAt,
      }));

      set({ members, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch members:', error);
      set({ members: [], isLoading: false });
    }
  },

  createGroup: async (data) => {
    try {
      const response = await authFetch(`${API_BASE}/groups`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to create group';
        throw new Error(errorMsg);
      }

      const result = await response.json();

      const newGroup: Group = {
        id: result.id,
        name: result.name,
        description: result.description || '',
        slug: result.slug,
        type: result.type || 'open',
        createdById: result.createdById,
        coverImage: result.coverImage,
        memberCount: 1,
        postCount: 0,
        isJoined: true,
        memberRole: 'owner',
        tags: data.tags || [],
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      set((state) => ({
        groups: [newGroup, ...state.groups],
        stats: {
          ...state.stats,
          totalGroups: state.stats.totalGroups + 1,
          myGroups: state.stats.myGroups + 1,
          newThisWeek: state.stats.newThisWeek + 1,
        },
      }));

      return newGroup;
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  },

  updateGroup: async (groupId: string, data: Partial<Group>) => {
    try {
      const response = await authFetch(`${API_BASE}/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update group');
      }

      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, ...data, updatedAt: new Date().toISOString() } : g
        ),
        currentGroup:
          state.currentGroup?.id === groupId
            ? { ...state.currentGroup, ...data, updatedAt: new Date().toISOString() }
            : state.currentGroup,
      }));
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    }
  },

  deleteGroup: async (groupId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      set((state) => ({
        groups: state.groups.filter((g) => g.id !== groupId),
        currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
      }));
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  },

  joinGroup: async (groupId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/groups/${groupId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to join group');
      }

      const result = await response.json();
      const isPending = result.status === 'pending';

      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                isJoined: !isPending,
                isPendingApproval: isPending,
                memberCount: isPending ? g.memberCount : g.memberCount + 1,
                memberRole: isPending ? undefined : ('member' as const),
              }
            : g
        ),
        currentGroup:
          state.currentGroup?.id === groupId
            ? {
                ...state.currentGroup,
                isJoined: !isPending,
                isPendingApproval: isPending,
                memberCount: isPending ? state.currentGroup.memberCount : state.currentGroup.memberCount + 1,
                memberRole: isPending ? undefined : ('member' as const),
              }
            : state.currentGroup,
      }));
    } catch (error) {
      console.error('Failed to join group:', error);
      throw error;
    }
  },

  leaveGroup: async (groupId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/groups/${groupId}/leave`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to leave group');
      }

      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId
            ? { ...g, isJoined: false, memberCount: g.memberCount - 1, memberRole: undefined }
            : g
        ),
        currentGroup:
          state.currentGroup?.id === groupId
            ? { ...state.currentGroup, isJoined: false, memberCount: state.currentGroup.memberCount - 1, memberRole: undefined }
            : state.currentGroup,
      }));
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  },

  requestJoin: async (groupId: string) => {
    // Uses the same endpoint as joinGroup, but for closed groups it creates a pending request
    return get().joinGroup(groupId);
  },

  uploadAttachment: async (groupId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/groups/${groupId}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      return {
        url: result.url,
        name: result.name || file.name,
        size: result.size || file.size,
        type: result.type || 'file',
        mimeType: result.mimeType || file.type,
      };
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw error;
    }
  },

  createPost: async (groupId: string, content: string, attachments?: Attachment[]) => {
    try {
      // Upload any files first
      const uploadedAttachments: Array<{ type: string; url: string; name: string; size?: number; mimeType?: string; duration?: number }> = [];

      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.file) {
            // Upload file to R2
            const uploaded = await get().uploadAttachment(groupId, attachment.file);
            uploadedAttachments.push({
              type: attachment.type,
              url: uploaded.url,
              name: uploaded.name,
              size: uploaded.size,
              mimeType: uploaded.mimeType,
              duration: attachment.duration,
            });
          } else if (attachment.url) {
            // Already has URL (e.g., GIF from Tenor)
            uploadedAttachments.push({
              type: attachment.type,
              url: attachment.url,
              name: attachment.name,
              size: attachment.size,
              mimeType: attachment.mimeType,
              duration: attachment.duration,
            });
          }
        }
      }

      const response = await authFetch(`${API_BASE}/groups/${groupId}/posts`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          attachments: uploadedAttachments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const result = await response.json();

      const newPost: GroupPost = {
        id: result.id,
        groupId,
        authorId: result.authorId,
        authorName: result.authorName,
        authorAvatar: result.authorAvatar,
        content,
        attachments: uploadedAttachments.map(a => ({
          id: '',
          name: a.name,
          url: a.url,
          size: a.size || 0,
          type: a.type,
        })),
        likes: 0,
        commentCount: 0,
        isLiked: false,
        isPinned: false,
        reactions: [],
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      set((state) => ({
        posts: [newPost, ...state.posts],
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, postCount: g.postCount + 1 } : g
        ),
        currentGroup:
          state.currentGroup?.id === groupId
            ? { ...state.currentGroup, postCount: state.currentGroup.postCount + 1 }
            : state.currentGroup,
      }));

      return newPost;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  },

  deletePost: async (postId: string) => {
    const post = get().posts.find((p) => p.id === postId);

    try {
      const response = await authFetch(`${API_BASE}/groups/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      if (!post) return;

      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
        groups: state.groups.map((g) =>
          g.id === post.groupId ? { ...g, postCount: g.postCount - 1 } : g
        ),
      }));
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  },

  likePost: async (postId: string) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + 1, isLiked: true } : p
      ),
    }));

    try {
      const response = await authFetch(`${API_BASE}/groups/posts/${postId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        // Revert on failure
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, likes: p.likes - 1, isLiked: false } : p
          ),
        }));
        throw new Error('Failed to like post');
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  },

  unlikePost: async (postId: string) => {
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likes: p.likes - 1, isLiked: false } : p
      ),
    }));

    try {
      const response = await authFetch(`${API_BASE}/groups/posts/${postId}/like`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on failure
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, likes: p.likes + 1, isLiked: true } : p
          ),
        }));
        throw new Error('Failed to unlike post');
      }
    } catch (error) {
      console.error('Failed to unlike post:', error);
    }
  },

  toggleReaction: async (postId: string, emoji: string) => {
    // Get current user ID from auth store
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    const currentUserId = authState?.state?.user?.id || 'current-user';

    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) => {
        if (p.id !== postId) return p;

        const reactions = p.reactions || [];
        const existingReaction = reactions.find((r) => r.emoji === emoji);

        if (existingReaction?.hasReacted) {
          // Remove reaction
          return {
            ...p,
            reactions: reactions
              .map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count - 1,
                      users: r.users.filter((u) => u !== currentUserId),
                      hasReacted: false,
                    }
                  : r
              )
              .filter((r) => r.count > 0),
          };
        } else if (existingReaction) {
          // Add to existing reaction
          return {
            ...p,
            reactions: reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, users: [...r.users, currentUserId], hasReacted: true }
                : r
            ),
          };
        } else {
          // Add new reaction
          return {
            ...p,
            reactions: [...reactions, { emoji, count: 1, users: [currentUserId], hasReacted: true }],
          };
        }
      }),
    }));

    try {
      const response = await authFetch(`${API_BASE}/groups/posts/${postId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        // Revert on failure - refetch posts
        console.error('Failed to toggle reaction, reverting...');
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  },

  toggleCommentReaction: async (commentId: string, emoji: string) => {
    // Get current user ID from auth store
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    const currentUserId = authState?.state?.user?.id || 'current-user';

    // Optimistic update
    set((state) => ({
      comments: state.comments.map((c) => {
        if (c.id !== commentId) return c;

        const reactions = c.reactions || [];
        const existingReaction = reactions.find((r) => r.emoji === emoji);

        if (existingReaction?.hasReacted) {
          // Remove reaction
          return {
            ...c,
            reactions: reactions
              .map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count - 1,
                      users: r.users.filter((u) => u !== currentUserId),
                      hasReacted: false,
                    }
                  : r
              )
              .filter((r) => r.count > 0),
          };
        } else if (existingReaction) {
          // Add to existing reaction
          return {
            ...c,
            reactions: reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, users: [...r.users, currentUserId], hasReacted: true }
                : r
            ),
          };
        } else {
          // Add new reaction
          return {
            ...c,
            reactions: [...reactions, { emoji, count: 1, users: [currentUserId], hasReacted: true }],
          };
        }
      }),
    }));

    try {
      const response = await authFetch(`${API_BASE}/groups/comments/${commentId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        console.error('Failed to toggle comment reaction');
      }
    } catch (error) {
      console.error('Failed to toggle comment reaction:', error);
    }
  },

  createComment: async (postId: string, content: string, attachments?: Attachment[]) => {
    try {
      // Get groupId from the post for uploads
      const post = get().posts.find((p) => p.id === postId);
      const groupId = post?.groupId || get().currentGroup?.id;

      // Upload any files first
      const uploadedAttachments: Array<{ type: string; url: string; name: string; size?: number; mimeType?: string; duration?: number }> = [];

      if (attachments && attachments.length > 0 && groupId) {
        for (const attachment of attachments) {
          if (attachment.file) {
            const uploaded = await get().uploadAttachment(groupId, attachment.file);
            uploadedAttachments.push({
              type: attachment.type,
              url: uploaded.url,
              name: uploaded.name,
              size: uploaded.size,
              mimeType: uploaded.mimeType,
              duration: attachment.duration,
            });
          } else if (attachment.url) {
            uploadedAttachments.push({
              type: attachment.type,
              url: attachment.url,
              name: attachment.name,
              size: attachment.size,
              mimeType: attachment.mimeType,
              duration: attachment.duration,
            });
          }
        }
      }

      const response = await authFetch(`${API_BASE}/groups/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          attachments: uploadedAttachments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create comment');
      }

      const result = await response.json();

      const newComment: GroupComment = {
        id: result.id,
        postId,
        authorId: result.authorId,
        authorName: result.authorName,
        authorAvatar: result.authorAvatar,
        content,
        attachments: uploadedAttachments.map(a => ({
          id: '',
          name: a.name,
          url: a.url,
          size: a.size || 0,
          type: a.type,
        })),
        reactions: [],
        likes: 0,
        isLiked: false,
        createdAt: result.createdAt,
      };

      set((state) => ({
        comments: [...state.comments, newComment],
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        ),
      }));

      return newComment;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  },

  likeComment: async (commentId: string) => {
    // Optimistic update
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId ? { ...c, likes: c.likes + 1, isLiked: true } : c
      ),
    }));

    try {
      const response = await authFetch(`${API_BASE}/groups/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        // Revert on failure
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId ? { ...c, likes: c.likes - 1, isLiked: false } : c
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  },

  inviteMember: async (groupId: string, userId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/groups/${groupId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to invite member');
      }

      // Refresh members list
      await get().fetchMembers(groupId);
    } catch (error) {
      console.error('Failed to invite member:', error);
      throw error;
    }
  },

  removeMember: async (groupId: string, userId: string) => {
    try {
      const response = await authFetch(`${API_BASE}/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove member');
      }

      // Remove from local state
      set((state) => ({
        members: state.members.filter((m) => m.userId !== userId),
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g
        ),
        currentGroup:
          state.currentGroup?.id === groupId
            ? { ...state.currentGroup, memberCount: Math.max(0, state.currentGroup.memberCount - 1) }
            : state.currentGroup,
      }));
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  },

  updateMemberRole: async (groupId: string, userId: string, role: GroupMember['role']) => {
    try {
      const response = await authFetch(`${API_BASE}/groups/${groupId}/members/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update member role');
      }

      // Update local state
      set((state) => ({
        members: state.members.map((m) =>
          m.userId === userId && m.groupId === groupId ? { ...m, role } : m
        ),
      }));
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
