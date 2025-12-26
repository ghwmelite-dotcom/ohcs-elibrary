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

// Mock users database for development
interface MockUserData {
  user: User;
  password: string;
}

const mockUsersDatabase: MockUserData[] = [
  {
    password: 'angels2G9@84?',
    user: {
      id: 'super-admin-001',
      email: 'admin@ohcs.gov.gh',
      staffId: 'OHCS-SA-001',
      firstName: 'System',
      lastName: 'Administrator',
      displayName: 'System Administrator',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: 'super_admin',
      status: 'active',
      mdaId: 'ohcs-001',
      mda: {
        id: 'ohcs-001',
        name: 'Office of the Head of Civil Service',
        abbreviation: 'OHCS',
        type: 'agency',
        createdAt: new Date().toISOString(),
      },
      department: 'Digital Transformation',
      title: 'Super Administrator',
      gradeLevel: 'Director I',
      bio: 'System administrator with full platform access.',
      skills: ['System Administration', 'Security', 'Platform Management'],
      interests: ['Digital Government', 'E-Governance', 'Public Sector Innovation'],
      emailVerified: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    password: 'Admin123!@#',
    user: {
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
    },
  },
  {
    password: 'Director123!',
    user: {
      id: '2',
      email: 'sarah.mensah@ohlgs.gov.gh',
      staffId: 'GCS-2024-002',
      firstName: 'Sarah',
      lastName: 'Mensah',
      displayName: 'Sarah Mensah',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'director',
      status: 'active',
      mdaId: '2',
      mda: {
        id: '2',
        name: 'Office of the Head of Local Government Service',
        abbreviation: 'OHLGS',
        type: 'agency',
        createdAt: new Date().toISOString(),
      },
      department: 'Policy & Planning',
      title: 'Director of Policy',
      gradeLevel: 'Director II',
      bio: 'Leading policy development for local government services.',
      skills: ['Policy Development', 'Strategic Planning', 'Governance'],
      interests: ['Decentralization', 'Local Government', 'Community Development'],
      emailVerified: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    password: 'User123456!',
    user: {
      id: '3',
      email: 'kwame.asante@ghs.gov.gh',
      staffId: 'GCS-2024-003',
      firstName: 'Kwame',
      lastName: 'Asante',
      displayName: 'Kwame Asante',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      role: 'user',
      status: 'active',
      mdaId: '3',
      mda: {
        id: '3',
        name: 'Ghana Health Service',
        abbreviation: 'GHS',
        type: 'agency',
        createdAt: new Date().toISOString(),
      },
      department: 'Health Information',
      title: 'Health Information Officer',
      gradeLevel: 'Principal Officer',
      bio: 'Health information specialist focused on data-driven healthcare.',
      skills: ['Health Informatics', 'Data Analysis', 'Epidemiology'],
      interests: ['Public Health', 'Digital Health', 'Health Data'],
      emailVerified: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
];

// Default mock user for backwards compatibility
const mockUser: User = mockUsersDatabase[1].user;

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

        // Find user in mock database
        const userEntry = mockUsersDatabase.find(
          (entry) =>
            entry.user.email.toLowerCase() === credentials.email.toLowerCase() &&
            entry.password === credentials.password
        );

        if (!userEntry) {
          throw new Error('Invalid email or password. Please try again.');
        }

        // Check if user is active
        if (userEntry.user.status !== 'active') {
          throw new Error('Your account is not active. Please contact an administrator.');
        }

        // Mock successful login
        const response: AuthResponse = {
          user: { ...userEntry.user, lastLoginAt: new Date().toISOString() },
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

        // Store tokens and user data
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('refresh_token', response.refreshToken);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
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
        localStorage.removeItem('auth_user');
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
        const storedUser = localStorage.getItem('auth_user');

        if (token && refreshToken && storedUser) {
          try {
            const user = JSON.parse(storedUser) as User;
            const permissions = rolePermissions[user.role] || [];
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              permissions,
            });
          } catch {
            // If parsing fails, clear storage and reset
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('auth_user');
            set({ isLoading: false });
          }
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
