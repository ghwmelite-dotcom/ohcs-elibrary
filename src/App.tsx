import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { LazyMotion } from 'framer-motion';
import { loadMotionFeatures } from '@/utils/motionFeatures';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Spinner } from '@/components/shared/Spinner';
import { Toaster } from '@/components/shared/Toast';
import { PWAInstallPrompt } from '@/components/shared/PWAInstallPrompt';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { DevTools } from '@/components/shared/DevTools';
import { KeyboardShortcutsProvider } from '@/hooks/useKeyboardShortcuts';
import { BroadcastAlertContainer } from '@/components/broadcasts';

// Lazy load pages for code splitting
// Auth pages
const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

// Main pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Library = lazy(() => import('@/pages/Library'));
const DocumentView = lazy(() => import('@/pages/DocumentView'));
const Forum = lazy(() => import('@/pages/Forum'));
const ForumCategory = lazy(() => import('@/pages/ForumCategory'));
const ForumTopic = lazy(() => import('@/pages/ForumTopic'));
const Chat = lazy(() => import('@/pages/Chat'));
const ChatRoom = lazy(() => import('@/pages/ChatRoom'));
const Messages = lazy(() => import('@/pages/Messages'));
const Conversation = lazy(() => import('@/pages/Conversation'));
const Groups = lazy(() => import('@/pages/Groups'));
const GroupDetail = lazy(() => import('@/pages/GroupDetail'));
const News = lazy(() => import('@/pages/News'));
const Article = lazy(() => import('@/pages/Article'));
const Profile = lazy(() => import('@/pages/Profile'));
const ProfileEdit = lazy(() => import('@/pages/ProfileEdit'));
const Settings = lazy(() => import('@/pages/Settings'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Search = lazy(() => import('@/pages/Search'));
const Help = lazy(() => import('@/pages/Help'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Wellness pages
const Wellness = lazy(() => import('@/pages/Wellness'));
const WellnessChat = lazy(() => import('@/pages/WellnessChat'));
const WellnessResources = lazy(() => import('@/pages/WellnessResources'));
const WellnessResource = lazy(() => import('@/pages/WellnessResource'));

// Research Hub pages
const ResearchLab = lazy(() => import('@/pages/ResearchLab'));
const ResearchProjects = lazy(() => import('@/pages/ResearchProjects'));
const ResearchProject = lazy(() => import('@/pages/ResearchProject'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminDocuments = lazy(() => import('@/pages/admin/AdminDocuments'));
const AdminForum = lazy(() => import('@/pages/admin/AdminForum'));
const AdminChat = lazy(() => import('@/pages/admin/AdminChat'));
const AdminGroups = lazy(() => import('@/pages/admin/AdminGroups'));
const AdminNews = lazy(() => import('@/pages/admin/AdminNews'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminAudit = lazy(() => import('@/pages/admin/AdminAudit'));
const AdminWellness = lazy(() => import('@/pages/admin/AdminWellness'));
const AdminCounselors = lazy(() => import('@/pages/admin/AdminCounselors'));
const CounselorReports = lazy(() => import('@/pages/admin/CounselorReports'));
const AdminBroadcasts = lazy(() => import('@/pages/admin/AdminBroadcasts'));
const AdminResearch = lazy(() => import('@/pages/admin/AdminResearch'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-surface-600 dark:text-surface-400">Loading...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const adminRoles = ['admin', 'director', 'super_admin'];
  if (!user || !adminRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Guest only route wrapper (redirects authenticated users)
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Font size mapping
const fontSizeMap: Record<string, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px',
};

export default function App() {
  const { theme, initializeTheme } = useThemeStore();
  const { initializeAuth, isAuthenticated } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Fetch settings when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated, fetchSettings]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Apply settings to document when they change
  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Apply font size
    if (settings.fontSize) {
      root.style.fontSize = fontSizeMap[settings.fontSize] || '16px';
    }

    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply compact mode
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, [settings]);

  return (
    <LazyMotion features={loadMotionFeatures}>
      <KeyboardShortcutsProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />

          {/* Auth routes (guest only) */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <ForgotPassword />
                </GuestRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Library routes */}
            <Route path="/library" element={<Library />} />
            <Route path="/library/:documentId" element={<DocumentView />} />

            {/* Forum routes */}
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/category/:categoryId" element={<ForumCategory />} />
            <Route path="/forum/topic/:topicId" element={<ForumTopic />} />

            {/* Chat routes */}
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:roomId" element={<ChatRoom />} />

            {/* Messages routes */}
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Conversation />} />

            {/* Groups routes */}
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />

            {/* News routes */}
            <Route path="/news" element={<News />} />
            <Route path="/news/:articleId" element={<Article />} />

            {/* Wellness routes */}
            <Route path="/wellness" element={<Wellness />} />
            <Route path="/wellness/chat" element={<WellnessChat />} />
            <Route path="/wellness/chat/:sessionId" element={<WellnessChat />} />
            <Route path="/wellness/resources" element={<WellnessResources />} />
            <Route path="/wellness/resources/:id" element={<WellnessResource />} />

            {/* Research Hub routes */}
            <Route path="/research-hub" element={<ResearchLab />} />
            <Route path="/research-hub/projects" element={<ResearchProjects />} />
            <Route path="/research-hub/projects/:id" element={<ResearchProject />} />

            {/* Profile routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />

            {/* Other routes */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/help" element={<Help />} />
          </Route>

          {/* Admin routes */}
          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/admin/forum" element={<AdminForum />} />
            <Route path="/admin/chat" element={<AdminChat />} />
            <Route path="/admin/groups" element={<AdminGroups />} />
            <Route path="/admin/news" element={<AdminNews />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/audit" element={<AdminAudit />} />
            <Route path="/admin/wellness" element={<AdminWellness />} />
            <Route path="/admin/wellness/reports" element={<CounselorReports />} />
            <Route path="/admin/counselors" element={<AdminCounselors />} />
            <Route path="/admin/broadcasts" element={<AdminBroadcasts />} />
            <Route path="/admin/research" element={<AdminResearch />} />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>

        {/* Global toast notifications */}
        <Toaster />

        {/* Emergency Broadcast Alerts */}
        <BroadcastAlertContainer />

        {/* PWA Components */}
        <OfflineBanner />
        <PWAInstallPrompt />

        {/* Development Tools */}
        <DevTools />
      </KeyboardShortcutsProvider>
    </LazyMotion>
  );
}
