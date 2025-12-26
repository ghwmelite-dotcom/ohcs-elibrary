import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Permission, AuthState, LoginCredentials, RegisterData, AuthResponse } from '@/types';

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  initializeAuth: () => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string[]) => boolean;
}

type AuthStore = AuthState & AuthActions;

// Mock user for development
const mockUser: User = {
  id: '1',
  email: 'john.doe@mof.gov.gh',
  staffId: 'GCS-2024-001',
  firstName: 'John',
  lastName: 'Doe',
  displayName: 'John Doe',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  role: 'admin',
  status: 'active',
  mdaId: '1',
  mda: {
    id: '1',
    name: 'Ministry of Finance',
    abbreviation: 'MoF',
    type: 'ministry',
    createdAt: new Date().toISOString(),
  },
  department: 'Information Technology',
  title: 'Senior Software Engineer',
  gradeLevel: 'Deputy Director II',
  bio: 'Passionate about digital transformation in the public sector.',
  skills: ['TypeScript', 'React', 'Cloud Architecture'],
  interests: ['Digital Government', 'AI/ML', 'Public Policy'],
  socialLinks: {
    linkedin: 'https://linkedin.com/in/johndoe',
    twitter: 'https://twitter.com/johndoe',
  },
  emailVerified: true,
  lastLoginAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock permissions based on role
const rolePermissions: Record<string, Permission[]> = {
  super_admin: [
    { id: '1', name: 'manage_users', description: 'Manage all users', resource: 'users', action: 'manage' },
    { id: '2', name: 'manage_documents', description: 'Manage all documents', resource: 'documents', action: 'manage' },
    { id: '3', name: 'manage_forum', description: 'Manage forum', resource: 'forum', action: 'manage' },
    { id: '4', name: 'manage_system', description: 'Manage system settings', resource: 'system', action: 'manage' },
  ],
  admin: [
    { id: '1', name: 'manage_users', description: 'Manage users', resource: 'users', action: 'manage' },
    { id: '2', name: 'manage_documents', description: 'Manage documents', resource: 'documents', action: 'manage' },
    { id: '3', name: 'manage_forum', description: 'Manage forum', resource: 'forum', action: 'manage' },
  ],
  director: [
    { id: '1', name: 'read_users', description: 'View users', resource: 'users', action: 'read' },
    { id: '2', name: 'manage_documents', description: 'Manage documents', resource: 'documents', action: 'manage' },
    { id: '3', name: 'moderate_forum', description: 'Moderate forum', resource: 'forum', action: 'update' },
  ],
  librarian: [
    { id: '1', name: 'manage_documents', description: 'Manage documents', resource: 'documents', action: 'manage' },
    { id: '2', name: 'read_users', description: 'View users', resource: 'users', action: 'read' },
  ],
  moderator: [
    { id: '1', name: 'moderate_forum', description: 'Moderate forum', resource: 'forum', action: 'update' },
    { id: '2', name: 'moderate_chat', description: 'Moderate chat', resource: 'chat', action: 'update' },
  ],
  contributor: [
    { id: '1', name: 'create_documents', description: 'Upload documents', resource: 'documents', action: 'create' },
    { id: '2', name: 'create_forum_posts', description: 'Create forum posts', resource: 'forum', action: 'create' },
  ],
  user: [
    { id: '1', name: 'read_documents', description: 'Read documents', resource: 'documents', action: 'read' },
    { id: '2', name: 'create_forum_posts', description: 'Create forum posts', resource: 'forum', action: 'create' },
  ],
  guest: [
    { id: '1', name: 'read_public_documents', description: 'Read public documents', resource: 'documents', action: 'read' },
  ],
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      permissions: [],

      // Actions
      login: async (credentials: LoginCredentials) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Validate .gov.gh email
        if (!credentials.email.toLowerCase().endsWith('.gov.gh')) {
          throw new Error('Please use your official .gov.gh email address');
        }

        // Mock successful login
        const response: AuthResponse = {
          user: mockUser,
          token: 'mock_jwt_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        const permissions = rolePermissions[response.user.role] || [];

        set({
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          permissions,
        });

        // Store tokens
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('refresh_token', response.refreshToken);
      },

      register: async (data: RegisterData) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Validate .gov.gh email
        if (!data.email.toLowerCase().endsWith('.gov.gh')) {
          throw new Error('Registration is only available for .gov.gh email addresses');
        }

        // Mock successful registration
        const newUser: User = {
          id: Date.now().toString(),
          email: data.email,
          staffId: data.staffId,
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: `${data.firstName} ${data.lastName}`,
          role: 'user',
          status: 'pending',
          mdaId: data.mdaId,
          department: data.department,
          title: data.title,
          skills: [],
          interests: [],
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // In real implementation, user would receive email verification
        // For now, just return success
        console.log('Registration successful:', newUser);
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: [],
        });
      },

      refreshTokens: async () => {
        const currentRefreshToken = get().refreshToken;
        if (!currentRefreshToken) {
          get().logout();
          return;
        }

        try {
          // Simulate token refresh
          await new Promise((resolve) => setTimeout(resolve, 500));

          const newToken = 'mock_jwt_token_' + Date.now();
          const newRefreshToken = 'mock_refresh_token_' + Date.now();

          set({
            token: newToken,
            refreshToken: newRefreshToken,
          });

          localStorage.setItem('auth_token', newToken);
          localStorage.setItem('refresh_token', newRefreshToken);
        } catch (error) {
          get().logout();
        }
      },

      initializeAuth: () => {
        const token = localStorage.getItem('auth_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (token && refreshToken) {
          // In real implementation, validate token with backend
          // For now, use mock user
          const permissions = rolePermissions[mockUser.role] || [];
          set({
            user: mockUser,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            permissions,
          });
        } else {
          set({ isLoading: false });
        }
      },

      setUser: (user: User) => {
        const permissions = rolePermissions[user.role] || [];
        set({ user, permissions });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
          set({ user: updatedUser });
        }
      },

      hasPermission: (permission: string) => {
        const { permissions } = get();
        return permissions.some((p) => p.name === permission);
      },

      hasRole: (roles: string[]) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },
    }),
    {
      name: 'ohcs-auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
