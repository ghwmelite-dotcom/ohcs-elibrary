import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  MessageSquare,
  Users,
  Eye,
  X,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

type UserRole = 'super_admin' | 'admin' | 'director' | 'librarian' | 'moderator' | 'contributor' | 'user' | 'guest';

const roles: { role: UserRole; label: string; icon: typeof Shield; description: string; color: string }[] = [
  { role: 'super_admin', label: 'Super Admin', icon: ShieldAlert, description: 'Full system access', color: '#CE1126' },
  { role: 'admin', label: 'Admin', icon: ShieldCheck, description: 'Manage users, docs, forum', color: '#006B3F' },
  { role: 'director', label: 'Director', icon: Shield, description: 'View users, manage docs', color: '#FCD116' },
  { role: 'librarian', label: 'Librarian', icon: BookOpen, description: 'Manage documents', color: '#3B82F6' },
  { role: 'moderator', label: 'Moderator', icon: MessageSquare, description: 'Moderate forum & chat', color: '#8B5CF6' },
  { role: 'contributor', label: 'Contributor', icon: Users, description: 'Upload docs, post in forum', color: '#10B981' },
  { role: 'user', label: 'User', icon: User, description: 'Read docs, post in forum', color: '#6B7280' },
  { role: 'guest', label: 'Guest', icon: Eye, description: 'Read public docs only', color: '#9CA3AF' },
];

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const { user, setUser } = useAuthStore();

  const currentRole = user?.role || 'user';

  const handleRoleChange = (newRole: UserRole) => {
    if (user) {
      setUser({
        ...user,
        role: newRole,
      });
    }
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setIsMinimized(false);
        }}
        className="fixed bottom-4 right-4 z-50 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          {/* Glow effect */}
          <motion.div
            className="absolute -inset-1 rounded-full opacity-75"
            style={{
              background: 'linear-gradient(135deg, #006B3F, #FCD116, #CE1126)',
              filter: 'blur(8px)',
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Button */}
          <div className="relative w-12 h-12 rounded-full bg-surface-900 dark:bg-surface-100 flex items-center justify-center shadow-lg">
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Settings className="w-5 h-5 text-white dark:text-surface-900" />
            </motion.div>
          </div>
          {/* Badge showing current role */}
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md"
            style={{ backgroundColor: roles.find(r => r.role === currentRole)?.color || '#6B7280' }}
          >
            {currentRole.charAt(0).toUpperCase()}
          </div>
        </div>
      </motion.button>

      {/* DevTools Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-20 right-4 z-50 w-80"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              {/* Animated border */}
              <motion.div
                className="absolute -inset-0.5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #006B3F, #FCD116, #CE1126, #006B3F)',
                  backgroundSize: '300% 300%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* Panel content */}
              <div className="relative bg-white dark:bg-surface-900 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="relative px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                  {/* Decorative gradient */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      background: 'linear-gradient(135deg, #006B3F 0%, #FCD116 50%, #CE1126 100%)',
                    }}
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-secondary-500" />
                      <span className="font-semibold text-surface-900 dark:text-surface-50">
                        Dev Tools
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-secondary-500/20 text-secondary-600 dark:text-secondary-400 rounded">
                        DEV
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <motion.button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <motion.div
                          animate={{ rotate: isMinimized ? 180 : 0 }}
                        >
                          <ChevronUp className="w-4 h-4 text-surface-500" />
                        </motion.div>
                      </motion.button>
                      <motion.button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4 text-surface-500" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <AnimatePresence>
                  {!isMinimized && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-4 space-y-3">
                        {/* Current User Info */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                          <img
                            src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50'}
                            alt="User"
                            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-surface-700 shadow"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-surface-900 dark:text-surface-50 truncate">
                              {user?.displayName || 'Test User'}
                            </p>
                            <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                          </div>
                        </div>

                        {/* Role Selector */}
                        <div>
                          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                            Switch Role
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {roles.map((roleOption, index) => {
                              const Icon = roleOption.icon;
                              const isActive = currentRole === roleOption.role;
                              return (
                                <motion.button
                                  key={roleOption.role}
                                  onClick={() => handleRoleChange(roleOption.role)}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  className={cn(
                                    'relative flex items-center gap-2 p-2.5 rounded-xl text-left transition-all',
                                    isActive
                                      ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 shadow-lg'
                                      : 'bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300'
                                  )}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  {/* Active indicator */}
                                  {isActive && (
                                    <motion.div
                                      layoutId="activeRole"
                                      className="absolute inset-0 rounded-xl"
                                      style={{
                                        background: `linear-gradient(135deg, ${roleOption.color}20, ${roleOption.color}40)`,
                                        border: `2px solid ${roleOption.color}`,
                                      }}
                                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                  )}
                                  <div
                                    className="relative z-10 w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{
                                      backgroundColor: isActive ? roleOption.color : `${roleOption.color}20`,
                                    }}
                                  >
                                    <Icon
                                      className="w-4 h-4"
                                      style={{ color: isActive ? 'white' : roleOption.color }}
                                    />
                                  </div>
                                  <div className="relative z-10 flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate">{roleOption.label}</p>
                                    <p className={cn(
                                      'text-[10px] truncate',
                                      isActive ? 'opacity-80' : 'text-surface-500'
                                    )}>
                                      {roleOption.description}
                                    </p>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Admin Access Indicator */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800">
                          <span className="text-xs text-surface-500">Admin Panel Access</span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                              ['super_admin', 'admin', 'director'].includes(currentRole)
                                ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                                : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
                            )}
                          >
                            {['super_admin', 'admin', 'director'].includes(currentRole) ? 'GRANTED' : 'DENIED'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Minimized view */}
                {isMinimized && (
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-surface-600 dark:text-surface-400">
                      Current Role:
                    </span>
                    <span
                      className="px-2 py-1 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: roles.find(r => r.role === currentRole)?.color }}
                    >
                      {roles.find(r => r.role === currentRole)?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
