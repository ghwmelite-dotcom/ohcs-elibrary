import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Permission, AuthState, LoginCredentials, RegisterData } from '@/types';

// API base URL - use Workers directly in production, proxy in development
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

interface TwoFAState {
  requires2FA: boolean;
  tempToken: string | null;
  email: string | null;
}

interface PendingVerification {
  email: string | null;
  userId: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<{ requires2FA: boolean }>;
  verify2FA: (code: string) => Promise<void>;
  cancel2FA: () => void;
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean; email?: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ resetCode: string; email: string; emailSent: boolean }>;
  resetPassword: (email: string, code: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  initializeAuth: () => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string[]) => boolean;
  clearPendingVerification: () => void;
}

interface AuthStoreState extends AuthState {
  twoFA: TwoFAState;
  pendingVerification: PendingVerification;
}

type AuthStore = AuthStoreState & AuthActions;

// Mock permissions based on role (used until we implement permission API)
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
  counselor: [
    { id: '1', name: 'view_wellness_dashboard', description: 'View wellness dashboard', resource: 'wellness', action: 'read' },
    { id: '2', name: 'view_patient_sessions', description: 'View patient counseling sessions', resource: 'sessions', action: 'read' },
    { id: '3', name: 'generate_reports', description: 'Generate wellness reports', resource: 'reports', action: 'create' },
    { id: '4', name: 'handle_escalations', description: 'Handle escalation requests', resource: 'escalations', action: 'manage' },
    { id: '5', name: 'view_mood_analytics', description: 'View mood analytics', resource: 'analytics', action: 'read' },
    { id: '6', name: 'manage_resources', description: 'Manage wellness resources', resource: 'resources', action: 'manage' },
  ],
  contributor: [
    { id: '1', name: 'create_documents', description: 'Upload documents', resource: 'documents', action: 'create' },
    { id: '2', name: 'create_forum_posts', description: 'Create forum posts', resource: 'forum', action: 'create' },
  ],
  civil_servant: [
    { id: '1', name: 'read_documents', description: 'Read documents', resource: 'documents', action: 'read' },
    { id: '2', name: 'create_forum_posts', description: 'Create forum posts', resource: 'forum', action: 'create' },
    { id: '3', name: 'upload_documents', description: 'Upload documents', resource: 'documents', action: 'create' },
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
      twoFA: {
        requires2FA: false,
        tempToken: null,
        email: null,
      },
      pendingVerification: {
        email: null,
        userId: null,
      },

      // Actions
      login: async (credentials: LoginCredentials) => {
        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email.toLowerCase(),
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || data.error || 'Login failed');
          }

          // Check if 2FA is required
          if (data.requires2FA && data.tempToken) {
            set({
              twoFA: {
                requires2FA: true,
                tempToken: data.tempToken,
                email: credentials.email.toLowerCase(),
              },
            });
            return { requires2FA: true };
          }

          const user: User = {
            id: data.user.id,
            email: data.user.email,
            staffId: data.user.staffId || '',
            firstName: data.user.firstName || data.user.name?.split(' ')[0] || '',
            lastName: data.user.lastName || data.user.name?.split(' ').slice(1).join(' ') || '',
            displayName: data.user.displayName || data.user.name,
            avatar: data.user.avatar,
            role: data.user.role || 'civil_servant',
            status: 'active',
            mdaId: data.user.mdaId || '',
            department: data.user.department,
            title: data.user.title,
            skills: data.user.skills || [],
            interests: data.user.interests || [],
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const permissions = rolePermissions[user.role] || rolePermissions.user;

          set({
            user,
            token: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            permissions,
            twoFA: {
              requires2FA: false,
              tempToken: null,
              email: null,
            },
          });

          // Store in localStorage for persistence
          localStorage.setItem('auth_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
          localStorage.setItem('auth_user', JSON.stringify(user));

          // Create a session record for security tracking
          try {
            await fetch(`${API_BASE}/settings/sessions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.accessToken}`,
              },
              body: JSON.stringify({
                location: 'Unknown', // Could be obtained from geo API if needed
              }),
            });
          } catch (sessionError) {
            // Don't fail login if session creation fails
            console.warn('Failed to create session record:', sessionError);
          }

          return { requires2FA: false };
        } catch (error) {
          throw error;
        }
      },

      verify2FA: async (code: string) => {
        const { twoFA } = get();
        if (!twoFA.tempToken) {
          throw new Error('No pending 2FA verification');
        }

        try {
          const response = await fetch(`${API_BASE}/auth/login/verify-2fa`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${twoFA.tempToken}`,
            },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || data.error || '2FA verification failed');
          }

          const user: User = {
            id: data.user.id,
            email: data.user.email,
            staffId: data.user.staffId || '',
            firstName: data.user.firstName || data.user.name?.split(' ')[0] || '',
            lastName: data.user.lastName || data.user.name?.split(' ').slice(1).join(' ') || '',
            displayName: data.user.displayName || data.user.name,
            avatar: data.user.avatar,
            role: data.user.role || 'civil_servant',
            status: 'active',
            mdaId: data.user.mdaId || '',
            department: data.user.department,
            title: data.user.title,
            skills: data.user.skills || [],
            interests: data.user.interests || [],
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const permissions = rolePermissions[user.role] || rolePermissions.user;

          set({
            user,
            token: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            permissions,
            twoFA: {
              requires2FA: false,
              tempToken: null,
              email: null,
            },
          });

          // Store in localStorage for persistence
          localStorage.setItem('auth_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
          localStorage.setItem('auth_user', JSON.stringify(user));
        } catch (error) {
          throw error;
        }
      },

      cancel2FA: () => {
        set({
          twoFA: {
            requires2FA: false,
            tempToken: null,
            email: null,
          },
        });
      },

      register: async (data: RegisterData & { turnstileToken?: string }) => {
        try {
          const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email.toLowerCase(),
              password: data.password,
              staffId: data.staffId,
              mdaId: data.mdaId,
              department: data.department,
              title: data.title,
              turnstileToken: data.turnstileToken,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Registration failed');
          }

          // If verification is required
          if (result.requiresVerification) {
            set({
              pendingVerification: {
                email: result.email || data.email.toLowerCase(),
                userId: result.userId || null,
              },
            });
            return { requiresVerification: true, email: result.email || data.email.toLowerCase() };
          }

          // If auto-login is enabled (returns tokens)
          if (result.accessToken && result.user) {
            const user: User = {
              id: result.user.id,
              email: result.user.email,
              staffId: result.user.staffId || '',
              firstName: result.user.firstName || data.firstName,
              lastName: result.user.lastName || data.lastName,
              displayName: result.user.displayName || `${data.firstName} ${data.lastName}`,
              role: result.user.role || 'civil_servant',
              status: 'active',
              mdaId: result.user.mdaId || data.mdaId || '',
              skills: result.user.skills || [],
              interests: result.user.interests || [],
              emailVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const permissions = rolePermissions[user.role] || rolePermissions.user;

            set({
              user,
              token: result.accessToken,
              refreshToken: result.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              permissions,
              pendingVerification: { email: null, userId: null },
            });

            localStorage.setItem('auth_token', result.accessToken);
            localStorage.setItem('refresh_token', result.refreshToken);
            localStorage.setItem('auth_user', JSON.stringify(user));
          }

          return { requiresVerification: false };
        } catch (error) {
          throw error;
        }
      },

      verifyEmail: async (email: string, code: string) => {
        try {
          const response = await fetch(`${API_BASE}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.toLowerCase(), code }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Verification failed');
          }

          // Auto-login after verification
          if (result.accessToken && result.user) {
            const user: User = {
              id: result.user.id,
              email: result.user.email,
              staffId: result.user.staffId || '',
              firstName: result.user.firstName || '',
              lastName: result.user.lastName || '',
              displayName: result.user.displayName || '',
              role: result.user.role || 'civil_servant',
              status: 'active',
              mdaId: result.user.mdaId || '',
              skills: result.user.skills || [],
              interests: result.user.interests || [],
              emailVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const permissions = rolePermissions[user.role] || rolePermissions.user;

            set({
              user,
              token: result.accessToken,
              refreshToken: result.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              permissions,
              pendingVerification: { email: null, userId: null },
            });

            localStorage.setItem('auth_token', result.accessToken);
            localStorage.setItem('refresh_token', result.refreshToken);
            localStorage.setItem('auth_user', JSON.stringify(user));
          }
        } catch (error) {
          throw error;
        }
      },

      resendVerification: async (email: string) => {
        try {
          const response = await fetch(`${API_BASE}/auth/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.toLowerCase() }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to resend verification');
          }
        } catch (error) {
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        try {
          const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.toLowerCase() }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to send reset email');
          }

          // Return the reset code for on-screen display
          return {
            resetCode: result.resetCode,
            email: result.email,
            emailSent: result.emailSent,
          };
        } catch (error) {
          throw error;
        }
      },

      resetPassword: async (email: string, code: string, password: string) => {
        try {
          const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.toLowerCase(),
              code,
              password,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Password reset failed');
          }
        } catch (error) {
          throw error;
        }
      },

      clearPendingVerification: () => {
        set({ pendingVerification: { email: null, userId: null } });
      },

      logout: async () => {
        const token = get().token;

        // Call logout API if we have a token
        if (token) {
          try {
            await fetch(`${API_BASE}/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          } catch (e) {
            // Ignore logout API errors
          }
        }

        // Clear local state
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
          const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentRefreshToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();

          set({ token: data.accessToken });
          localStorage.setItem('auth_token', data.accessToken);
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
            const permissions = rolePermissions[user.role] || rolePermissions.user;

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
        const permissions = rolePermissions[user.role] || rolePermissions.user;
        set({ user, permissions });
        localStorage.setItem('auth_user', JSON.stringify(user));
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
          set({ user: updatedUser });
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
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
