import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  MessagesSquare,
  Users2,
  Newspaper,
  BarChart3,
  Settings,
  Shield,
  Heart,
  ChevronLeft,
  Star,
  UserCog,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/shared/Button';
import { Avatar } from '@/components/shared/Avatar';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/admin/broadcasts', label: 'Broadcasts', icon: Megaphone },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/documents', label: 'Documents', icon: FileText },
  { path: '/admin/forum', label: 'Forum', icon: MessageSquare },
  { path: '/admin/chat', label: 'Chat', icon: MessagesSquare },
  { path: '/admin/groups', label: 'Groups', icon: Users2 },
  { path: '/admin/news', label: 'News', icon: Newspaper },
  { path: '/admin/wellness', label: 'Wellness', icon: Heart },
  { path: '/admin/counselors', label: 'Counselors', icon: UserCog },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
  { path: '/admin/audit', label: 'Audit Logs', icon: Shield },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 fixed left-0 top-0 bottom-0 flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-surface-200 dark:border-surface-700">
          <div className="w-10 h-10 rounded-lg bg-ghana-gradient flex items-center justify-center">
            <Star className="w-6 h-6 text-secondary-500" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-primary-600 dark:text-primary-400 text-sm">
              Admin Panel
            </h1>
            <p className="text-[10px] text-surface-500">OHCS E-Library</p>
          </div>
        </div>

        {/* Ghana flag stripe */}
        <div className="ghana-flag-stripe" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {adminNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-50'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Back to App */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-700">
          <Button
            variant="outline"
            fullWidth
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => navigate('/dashboard')}
          >
            Back to App
          </Button>
        </div>

        {/* User */}
        {user && (
          <div className="p-4 border-t border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.avatar}
                name={user.displayName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-surface-500 truncate capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="font-heading font-semibold text-lg text-surface-900 dark:text-surface-50">
            Administration
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-surface-500">
              Managing OHCS E-Library Platform
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <ErrorBoundary>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
