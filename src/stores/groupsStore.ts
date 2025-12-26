import { create } from 'zustand';
import type { Group, GroupMember, GroupPost, GroupComment, GroupInvitation } from '@/types';

// Mock groups
const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Digital Transformation Committee',
    description: 'Official committee for driving digital transformation across the Ghana Civil Service. We discuss strategies, share best practices, and coordinate initiatives.',
    slug: 'digital-transformation',
    type: 'official',
    coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
    avatar: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=150',
    createdById: '2',
    memberCount: 156,
    postCount: 89,
    isJoined: true,
    memberRole: 'member',
    tags: ['digital', 'technology', 'innovation', 'official'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Young Professionals Network',
    description: 'A community for young professionals in the civil service to network, share opportunities, and support each other career development.',
    slug: 'young-professionals',
    type: 'open',
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
    createdById: '3',
    memberCount: 342,
    postCount: 234,
    isJoined: true,
    memberRole: 'admin',
    tags: ['networking', 'career', 'youth', 'professional-development'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Public Policy Research',
    description: 'For civil servants interested in public policy research and analysis. Share papers, discuss methodologies, and collaborate on research projects.',
    slug: 'policy-research',
    type: 'closed',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    createdById: '4',
    memberCount: 89,
    postCount: 156,
    isJoined: false,
    isPendingApproval: true,
    tags: ['research', 'policy', 'analysis', 'academic'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'IT Professionals Hub',
    description: 'A private group for IT professionals working in government. Discuss technical challenges, share solutions, and stay updated on tech trends.',
    slug: 'it-professionals',
    type: 'private',
    coverImage: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800',
    createdById: '1',
    memberCount: 78,
    postCount: 112,
    isJoined: true,
    memberRole: 'owner',
    tags: ['IT', 'technology', 'programming', 'infrastructure'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Health Sector Workers',
    description: 'For civil servants working in the health sector. Share updates, discuss challenges, and collaborate on health initiatives.',
    slug: 'health-sector',
    type: 'open',
    coverImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    createdById: '5',
    memberCount: 267,
    postCount: 178,
    isJoined: false,
    tags: ['health', 'medical', 'public-health', 'ministry-of-health'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Financial Management Network',
    description: 'Connect with colleagues involved in financial management across MDAs. Discuss best practices, regulations, and professional development.',
    slug: 'financial-management',
    type: 'open',
    coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    createdById: '2',
    memberCount: 198,
    postCount: 145,
    isJoined: true,
    memberRole: 'member',
    tags: ['finance', 'accounting', 'budget', 'PFM'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock group posts
const mockPosts: GroupPost[] = [
  {
    id: 'p1',
    groupId: '1',
    authorId: '2',
    content: 'Excited to announce that we will be hosting a digital transformation workshop next month! More details coming soon. Who is interested in attending?',
    attachments: [],
    likes: 45,
    commentCount: 12,
    isLiked: true,
    isPinned: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'p2',
    groupId: '1',
    authorId: '3',
    content: 'Just completed the pilot of our new digital filing system. Early results show 40% improvement in document retrieval time. Happy to share our learnings with anyone interested.',
    attachments: [],
    likes: 32,
    commentCount: 8,
    isLiked: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'p3',
    groupId: '2',
    authorId: '4',
    content: 'Looking for mentors for our upcoming mentorship program. If you have 5+ years of experience and would like to guide young professionals, please reach out!',
    attachments: [],
    likes: 67,
    commentCount: 23,
    isLiked: true,
    isPinned: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

// Mock comments
const mockComments: GroupComment[] = [
  {
    id: 'c1',
    postId: 'p1',
    authorId: '1',
    content: 'Count me in! This sounds like a great opportunity.',
    likes: 5,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'c2',
    postId: 'p1',
    authorId: '4',
    content: 'Will this be in-person or virtual?',
    likes: 3,
    isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

interface GroupsState {
  groups: Group[];
  currentGroup: Group | null;
  posts: GroupPost[];
  comments: GroupComment[];
  members: GroupMember[];
  invitations: GroupInvitation[];
  isLoading: boolean;
  filter: {
    type?: Group['type'];
    search?: string;
    joinedOnly?: boolean;
  };
}

interface GroupsActions {
  fetchGroups: () => Promise<void>;
  fetchGroup: (id: string) => Promise<void>;
  fetchPosts: (groupId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  fetchMembers: (groupId: string) => Promise<void>;
  createGroup: (data: { name: string; description: string; type: Group['type']; tags?: string[] }) => Promise<Group>;
  updateGroup: (groupId: string, data: Partial<Group>) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  requestJoin: (groupId: string) => Promise<void>;
  createPost: (groupId: string, content: string) => Promise<GroupPost>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  createComment: (postId: string, content: string) => Promise<GroupComment>;
  likeComment: (commentId: string) => Promise<void>;
  inviteMember: (groupId: string, userId: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  updateMemberRole: (groupId: string, userId: string, role: GroupMember['role']) => Promise<void>;
  setFilter: (filter: Partial<GroupsState['filter']>) => void;
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
  isLoading: false,
  filter: {},

  // Actions
  fetchGroups: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 400));

    let filteredGroups = [...mockGroups];
    const { filter } = get();

    if (filter.type) {
      filteredGroups = filteredGroups.filter((g) => g.type === filter.type);
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredGroups = filteredGroups.filter(
        (g) =>
          g.name.toLowerCase().includes(searchLower) ||
          g.description.toLowerCase().includes(searchLower)
      );
    }
    if (filter.joinedOnly) {
      filteredGroups = filteredGroups.filter((g) => g.isJoined);
    }

    set({ groups: filteredGroups, isLoading: false });
  },

  fetchGroup: async (id: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const group = mockGroups.find((g) => g.id === id);
    set({ currentGroup: group || null, isLoading: false });
  },

  fetchPosts: async (groupId: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const posts = mockPosts.filter((p) => p.groupId === groupId);
    set({ posts, isLoading: false });
  },

  fetchComments: async (postId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const comments = mockComments.filter((c) => c.postId === postId);
    set({ comments });
  },

  fetchMembers: async (_groupId: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Would fetch actual members
    set({ members: [], isLoading: false });
  },

  createGroup: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newGroup: Group = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      type: data.type,
      createdById: '1',
      memberCount: 1,
      postCount: 0,
      isJoined: true,
      memberRole: 'owner',
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      groups: [...state.groups, newGroup],
    }));

    return newGroup;
  },

  updateGroup: async (groupId: string, data: Partial<Group>) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...data, updatedAt: new Date().toISOString() } : g
      ),
      currentGroup:
        state.currentGroup?.id === groupId
          ? { ...state.currentGroup, ...data, updatedAt: new Date().toISOString() }
          : state.currentGroup,
    }));
  },

  deleteGroup: async (groupId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
    }));
  },

  joinGroup: async (groupId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, isJoined: true, memberCount: g.memberCount + 1, memberRole: 'member' as const }
          : g
      ),
      currentGroup:
        state.currentGroup?.id === groupId
          ? { ...state.currentGroup, isJoined: true, memberCount: state.currentGroup.memberCount + 1, memberRole: 'member' as const }
          : state.currentGroup,
    }));
  },

  leaveGroup: async (groupId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

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
  },

  requestJoin: async (groupId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, isPendingApproval: true } : g
      ),
      currentGroup:
        state.currentGroup?.id === groupId
          ? { ...state.currentGroup, isPendingApproval: true }
          : state.currentGroup,
    }));
  },

  createPost: async (groupId: string, content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newPost: GroupPost = {
      id: Date.now().toString(),
      groupId,
      authorId: '1',
      content,
      attachments: [],
      likes: 0,
      commentCount: 0,
      isLiked: false,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
  },

  deletePost: async (postId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const post = get().posts.find((p) => p.id === postId);
    if (!post) return;

    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
      groups: state.groups.map((g) =>
        g.id === post.groupId ? { ...g, postCount: g.postCount - 1 } : g
      ),
    }));
  },

  likePost: async (postId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + 1, isLiked: true } : p
      ),
    }));
  },

  unlikePost: async (postId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likes: p.likes - 1, isLiked: false } : p
      ),
    }));
  },

  createComment: async (postId: string, content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const newComment: GroupComment = {
      id: Date.now().toString(),
      postId,
      authorId: '1',
      content,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      comments: [...state.comments, newComment],
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      ),
    }));

    return newComment;
  },

  likeComment: async (commentId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 50));

    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId ? { ...c, likes: c.likes + 1, isLiked: true } : c
      ),
    }));
  },

  inviteMember: async (_groupId: string, _userId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Would send invitation in real implementation
  },

  removeMember: async (_groupId: string, _userId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Would remove member in real implementation
  },

  updateMemberRole: async (_groupId: string, _userId: string, _role: GroupMember['role']) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Would update member role in real implementation
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },
}));
