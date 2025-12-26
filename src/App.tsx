import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { LazyMotion } from 'framer-motion';
import { loadMotionFeatures } from '@/utils/motionFeatures';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Spinner } from '@/components/shared/Spinner';
import { Toaster } from '@/components/shared/Toast';
import { PWAInstallPrompt } from '@/components/shared/PWAInstallPrompt';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { DevTools } from '@/components/shared/DevTools';

// Lazy load pages for code splitting
// Auth pages
const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));

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

export default function App() {
  const { theme, initializeTheme } = useThemeStore();
  const { initializeAuth } = useAuthStore();

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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

  return (
    <LazyMotion features={loadMotionFeatures}>
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
            <Route path="/forum/:categoryId" element={<ForumCategory />} />
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
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* Global toast notifications */}
      <Toaster />

      {/* PWA Components */}
      <OfflineBanner />
      <PWAInstallPrompt />

      {/* Development Tools */}
      <DevTools />
    </LazyMotion>
  );
}
