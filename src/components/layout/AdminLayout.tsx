import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  ChevronRight,
  Star,
  UserCog,
  Megaphone,
  Network,
  FolderOpen,
  UsersRound,
  Radio,
  Cog,
  GraduationCap,
  BookOpen,
  ShoppingBag,
  Store,
  HardDrive,
  Plug,
  Building2,
  Award,
  HandHeart,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/shared/Button';
import { Avatar } from '@/components/shared/Avatar';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}

interface NavCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  items: NavItem[];
}

const adminNavCategories: NavCategory[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    color: '#006B3F',
    items: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: FolderOpen,
    color: '#3B82F6',
    items: [
      { path: '/admin/documents', label: 'Documents', icon: FileText },
      { path: '/admin/research', label: 'Research Hub', icon: Network },
      { path: '/admin/news', label: 'News', icon: Newspaper },
    ],
  },
  {
    id: 'learning',
    label: 'Learning',
    icon: GraduationCap,
    color: '#8B5CF6',
    items: [
      { path: '/admin/lms', label: 'LMS Management', icon: BookOpen },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: ShoppingBag,
    color: '#10B981',
    items: [
      { path: '/admin/seller-applications', label: 'Seller Applications', icon: Store },
    ],
  },
  {
    id: 'sponsorship',
    label: 'Sponsorship',
    icon: HandHeart,
    color: '#FCD116',
    items: [
      { path: '/admin/scholarships', label: 'Scholarships', icon: GraduationCap },
      { path: '/admin/sponsors', label: 'Manage Sponsors', icon: Building2 },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    icon: UsersRound,
    color: '#10B981',
    items: [
      { path: '/admin/forum', label: 'Forum', icon: MessageSquare },
      { path: '/admin/chat', label: 'Chat', icon: MessagesSquare },
      { path: '/admin/groups', label: 'Groups', icon: Users2 },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    color: '#F59E0B',
    items: [
      { path: '/admin/users', label: 'User Management', icon: Users },
      { path: '/admin/counselors', label: 'Counselors', icon: UserCog },
    ],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: Heart,
    color: '#EC4899',
    items: [
      { path: '/admin/wellness', label: 'Wellness Center', icon: Heart },
      { path: '/admin/wellness/reports', label: 'Wellness Reports', icon: BarChart3 },
    ],
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: Radio,
    color: '#FCD116',
    items: [
      { path: '/admin/broadcasts', label: 'Broadcasts', icon: Megaphone },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Plug,
    color: '#6366F1',
    items: [
      { path: '/admin/integrations/google-drive', label: 'Google Drive', icon: HardDrive },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: Cog,
    color: '#6B7280',
    items: [
      { path: '/admin/settings', label: 'Settings', icon: Settings },
      { path: '/admin/backup', label: 'Backup & Restore', icon: HardDrive },
      { path: '/admin/audit', label: 'Audit Logs', icon: Shield },
    ],
  },
];

function NavCategorySection({ category, isExpanded, onToggle }: {
  category: NavCategory;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const isActive = category.items.some(item =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  return (
    <div className="mb-1">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
          isActive
            ? 'bg-surface-100 dark:bg-surface-700/50'
            : 'hover:bg-surface-50 dark:hover:bg-surface-700/30'
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
            isActive ? 'shadow-sm' : 'group-hover:shadow-sm'
          )}
          style={{
            backgroundColor: `${category.color}15`,
          }}
        >
          <category.icon
            className="w-4 h-4 transition-colors"
            style={{ color: category.color }}
          />
        </div>
        <span className={cn(
          'flex-1 text-left text-sm font-medium transition-colors',
          isActive
            ? 'text-surface-900 dark:text-surface-50'
            : 'text-surface-600 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50'
        )}>
          {category.label}
        </span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={cn(
            'w-4 h-4 transition-colors',
            isActive
              ? 'text-surface-500'
              : 'text-surface-400 group-hover:text-surface-500'
          )} />
        </motion.div>
      </button>

      {/* Category Items */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 pr-2 py-1 space-y-0.5">
              {category.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-50'
                    )
                  }
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Initialize expanded categories based on current route
  const getInitialExpandedCategories = () => {
    const expanded: Record<string, boolean> = {};
    adminNavCategories.forEach(category => {
      const isActive = category.items.some(item =>
        item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
      );
      expanded[category.id] = isActive;
    });
    // Always expand overview by default
    expanded['overview'] = true;
    return expanded;
  };

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    getInitialExpandedCategories
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 fixed left-0 top-0 bottom-0 flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-surface-200 dark:border-surface-700">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-surface-900 dark:text-surface-50 text-sm">
              Admin Panel
            </h1>
            <p className="text-[10px] text-surface-500">OHCS E-Library</p>
          </div>
        </div>

        {/* Ghana flag stripe */}
        <div className="h-1 flex">
          <div className="flex-1 bg-accent-500" />
          <div className="flex-1 bg-secondary-500" />
          <div className="flex-1 bg-primary-500" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {adminNavCategories.map((category) => (
            <NavCategorySection
              key={category.id}
              category={category}
              isExpanded={expandedCategories[category.id] ?? false}
              onToggle={() => toggleCategory(category.id)}
            />
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">--</p>
              <p className="text-[10px] text-surface-500">Users</p>
            </div>
            <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-secondary-600 dark:text-secondary-400">--</p>
              <p className="text-[10px] text-surface-500">Documents</p>
            </div>
          </div>
        </div>

        {/* Back to App */}
        <div className="p-3 border-t border-surface-200 dark:border-surface-700">
          <Button
            variant="outline"
            fullWidth
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => navigate('/dashboard')}
            className="text-sm"
          >
            Back to App
          </Button>
        </div>

        {/* User */}
        {user && (
          <div className="p-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/30">
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
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                  <p className="text-xs text-surface-500 truncate capitalize">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-semibold text-lg text-surface-900 dark:text-surface-50">
              Administration
            </h2>
            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
              Admin
            </span>
          </div>
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
