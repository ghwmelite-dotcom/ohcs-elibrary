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
const VerifyCertificate = lazy(() => import('@/pages/VerifyCertificate'));

// Main pages
const Wall = lazy(() => import('@/pages/Wall'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Library = lazy(() => import('@/pages/Library'));
const DirectMessages = lazy(() => import('@/pages/DirectMessages'));
const Network = lazy(() => import('@/pages/Network'));
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
const Recognition = lazy(() => import('@/pages/Recognition'));
const Search = lazy(() => import('@/pages/Search'));
const Help = lazy(() => import('@/pages/Help'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Wellness pages
const Wellness = lazy(() => import('@/pages/Wellness'));
const WellnessChat = lazy(() => import('@/pages/WellnessChat'));
const WellnessResources = lazy(() => import('@/pages/WellnessResources'));
const WellnessResource = lazy(() => import('@/pages/WellnessResource'));

// AI Knowledge Assistant
const Kwame = lazy(() => import('@/pages/Kwame'));

// Learning Management System (LMS) pages
const CourseCatalog = lazy(() => import('@/pages/lms/CourseCatalog'));
const CourseDetail = lazy(() => import('@/pages/lms/CourseDetail'));
const CourseLearn = lazy(() => import('@/pages/lms/CourseLearn'));
const MyCourses = lazy(() => import('@/pages/lms/MyCourses'));
const Certificates = lazy(() => import('@/pages/lms/Certificates'));
const QuizPage = lazy(() => import('@/pages/lms/QuizPage'));
const AssignmentPage = lazy(() => import('@/pages/lms/AssignmentPage'));
const CourseDiscussions = lazy(() => import('@/pages/lms/CourseDiscussions'));
const CourseAnnouncements = lazy(() => import('@/pages/lms/CourseAnnouncements'));
const PeerReviews = lazy(() => import('@/pages/lms/PeerReviews'));
const PeerReviewForm = lazy(() => import('@/pages/lms/PeerReviewForm'));
const CourseReviews = lazy(() => import('@/pages/lms/CourseReviews'));

// Instructor pages
const InstructorDashboard = lazy(() => import('@/pages/instructor/InstructorDashboard'));
const CourseBuilder = lazy(() => import('@/pages/instructor/CourseBuilder'));
const CourseGradebook = lazy(() => import('@/pages/instructor/CourseGradebook'));
const CourseStudents = lazy(() => import('@/pages/instructor/CourseStudents'));
const CourseAnalytics = lazy(() => import('@/pages/instructor/CourseAnalytics'));
const QuizBuilder = lazy(() => import('@/pages/instructor/QuizBuilder'));
const AssignmentGrading = lazy(() => import('@/pages/instructor/AssignmentGrading'));
const RubricsManagement = lazy(() => import('@/pages/instructor/RubricsManagement'));

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
const AdminLMS = lazy(() => import('@/pages/admin/AdminLMS'));

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
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}

// Instructor route wrapper
function InstructorRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow instructors, admins, and directors to access instructor features
  const instructorRoles = ['instructor', 'admin', 'director', 'super_admin'];
  if (!user || !instructorRoles.includes(user.role)) {
    return <Navigate to="/feed" replace />;
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
    return <Navigate to="/feed" replace />;
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
          <Route path="/verify" element={<VerifyCertificate />} />

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
            {/* Social Wall - New Home */}
            <Route path="/feed" element={<Wall />} />
            <Route path="/wall" element={<Navigate to="/feed" replace />} />

            {/* Dashboard (Analytics) */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Network */}
            <Route path="/network" element={<Network />} />

            {/* Direct Messages (New DM System) */}
            <Route path="/dm" element={<DirectMessages />} />
            <Route path="/dm/:userId" element={<DirectMessages />} />

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

            {/* AI Knowledge Assistant */}
            <Route path="/kwame" element={<Kwame />} />

            {/* Learning Management System (LMS) routes */}
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/:courseId/learn" element={<CourseLearn />} />
            <Route path="/courses/:courseId/learn/:lessonId" element={<CourseLearn />} />
            <Route path="/courses/:courseId/quiz/:quizId" element={<QuizPage />} />
            <Route path="/courses/:courseId/assignment/:assignmentId" element={<AssignmentPage />} />
            <Route path="/courses/:courseId/discussions" element={<CourseDiscussions />} />
            <Route path="/courses/:courseId/announcements" element={<CourseAnnouncements />} />
            <Route path="/courses/:courseId/reviews" element={<CourseReviews />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/peer-reviews" element={<PeerReviews />} />
            <Route path="/peer-reviews/:reviewId" element={<PeerReviewForm />} />

            {/* Research Hub routes */}
            <Route path="/research-hub" element={<ResearchLab />} />
            <Route path="/research-hub/projects" element={<ResearchProjects />} />
            <Route path="/research-hub/projects/:id" element={<ResearchProject />} />

            {/* Instructor routes */}
            <Route
              path="/instructor"
              element={
                <InstructorRoute>
                  <InstructorDashboard />
                </InstructorRoute>
              }
            />
            <Route
              path="/instructor/courses/:courseId/edit"
              element={
                <InstructorRoute>
                  <CourseBuilder />
                </InstructorRoute>
              }
            />
            <Route
              path="/instructor/courses/:courseId/students"
              element={
                <InstructorRoute>
                  <CourseStudents />
                </InstructorRoute>
              }
            />
            <Route
              path="/instructor/courses/:courseId/grades"
              element={
                <InstructorRoute>
                  <CourseGradebook />
                </InstructorRoute>
              }
            />
            <Route
              path="/instructor/courses/:courseId/analytics"
              element={
                <InstructorRoute>
                  <CourseAnalytics />
                </InstructorRoute>
              }
            />
            <Route
              path="/instructor/courses/:courseId/quiz/:quizId"
              element={
                <InstructorRoute>
                  <QuizBuilder />
                </InstructorRoute>
              }
            />
            <Route
              path="/instructor/courses/:courseId/assignment/:assignmentId/grade"
              element={
                <InstructorRoute>
                  <AssignmentGrading />
                </InstructorRoute>
              }
            />
            <Route
              path="/instructor/rubrics"
              element={
                <InstructorRoute>
                  <RubricsManagement />
                </InstructorRoute>
              }
            />

            {/* Profile routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />

            {/* Other routes */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/recognition" element={<Recognition />} />
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
            <Route path="/admin/lms" element={<AdminLMS />} />
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
