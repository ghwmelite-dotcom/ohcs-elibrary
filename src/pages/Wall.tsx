import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Users,
  ChevronDown,
  LayoutGrid,
  Flame,
  Hash,
  BookOpen,
  MessageSquare,
  Network,
  Zap,
  ChevronRight,
  ArrowUpRight,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useSocialStore } from '@/stores/socialStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { WallFeed } from '@/components/wall/WallFeed';
import { SuggestedUsers } from '@/components/social/SuggestedUsers';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils/cn';

// Animated background with floating elements
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Primary gradient orb */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 107, 63, 0.15) 0%, transparent 70%)',
          top: '-10%',
          left: '-15%',
          filter: 'blur(40px)',
        }}
        animate={{
          y: [0, 40, 0],
          x: [0, 20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Secondary gradient orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(252, 209, 22, 0.1) 0%, transparent 70%)',
          bottom: '5%',
          right: '-10%',
          filter: 'blur(40px)',
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, -15, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 107, 63, 0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 107, 63, 0.8) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// Beautiful Collapsible Widget Component
interface CollapsibleWidgetProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  delay?: number;
  gradient: string;
  iconBg: string;
  previewContent?: React.ReactNode;
}

function CollapsibleWidget({
  title,
  icon,
  children,
  defaultExpanded = true,
  badge,
  delay = 0,
  gradient,
  iconBg,
  previewContent,
}: CollapsibleWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const iconControls = useAnimation();

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    iconControls.start({
      rotate: !isExpanded ? 0 : -90,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 100, damping: 15 }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-white/80 dark:bg-surface-800/80',
        'backdrop-blur-xl',
        'border border-white/50 dark:border-surface-700/50',
        'shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
        'transition-all duration-300',
        'hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)]',
        'group/widget'
      )}
    >
      {/* Animated gradient border on top */}
      <div className={cn('h-1 relative overflow-hidden', gradient)}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />
      </div>

      {/* Header */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3.5 text-left',
          'transition-all duration-300',
          'hover:bg-surface-50/50 dark:hover:bg-surface-700/30',
          'group'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Animated icon container */}
          <motion.div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center',
              'transition-all duration-300',
              iconBg,
              isExpanded && 'shadow-lg'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{
                scale: isExpanded ? 1 : 0.9,
                opacity: isExpanded ? 1 : 0.7
              }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          </motion.div>

          <div className="flex items-center gap-2">
            <h3 className={cn(
              'font-semibold text-sm transition-colors duration-200',
              isExpanded
                ? 'text-surface-900 dark:text-surface-100'
                : 'text-surface-600 dark:text-surface-400'
            )}>
              {title}
            </h3>
            {badge}
          </div>
        </div>

        {/* Expand/collapse indicator */}
        <div className="flex items-center gap-2">
          {!isExpanded && previewContent && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-xs text-surface-400"
            >
              {previewContent}
            </motion.div>
          )}
          <motion.div
            animate={iconControls}
            initial={{ rotate: isExpanded ? 0 : -90 }}
            className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center',
              'bg-surface-100/80 dark:bg-surface-700/50',
              'group-hover:bg-surface-200/80 dark:group-hover:bg-surface-600/50',
              'transition-colors duration-200'
            )}
          >
            <ChevronDown className={cn(
              'w-4 h-4 transition-colors duration-200',
              isExpanded
                ? 'text-surface-600 dark:text-surface-300'
                : 'text-surface-400 dark:text-surface-500'
            )} />
          </motion.div>
        </div>
      </button>

      {/* Content with beautiful animation */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: {
                height: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2, delay: 0.1 }
              }
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.15 }
              }
            }}
          >
            <div className="px-4 pb-4">
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Profile Card with glassmorphism
function ProfileCard() {
  const { user } = useAuthStore();
  const { following, followers, connections } = useSocialStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-white/80 dark:bg-surface-800/80',
        'backdrop-blur-xl',
        'border border-white/50 dark:border-surface-700/50',
        'shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
      )}
    >
      {/* Cover with animated gradient */}
      <div className="h-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-emerald-500" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />
        <div className="absolute inset-0 bg-[url('/patterns/ghana-pattern.svg')] opacity-10" />

        {/* Decorative elements */}
        <motion.div
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-8 right-10 w-4 h-4 rounded-full bg-white/10"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      {/* Profile section */}
      <div className="px-4 pb-4">
        <div className="flex items-end gap-3 -mt-10">
          <Link to="/profile" className="relative group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Avatar
                src={user?.avatar}
                name={user?.displayName || 'User'}
                size="xl"
                className="ring-4 ring-white dark:ring-surface-800 shadow-xl"
              />
            </motion.div>
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-surface-800 rounded-full shadow-lg" />
            <motion.div
              className="absolute inset-0 rounded-full ring-2 ring-primary-400 opacity-0 group-hover:opacity-100"
              initial={false}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </Link>
          <div className="flex-1 min-w-0 pb-1">
            <Link
              to="/profile"
              className="font-bold text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 truncate block transition-colors"
            >
              {user?.displayName || 'User'}
            </Link>
            <p className="text-xs text-surface-500 truncate flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500" />
              {user?.title || user?.role || 'Civil Servant'}
            </p>
          </div>
        </div>

        {/* Stats with hover effects */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          {[
            { to: '/network?tab=following', count: following.length, label: 'Following' },
            { to: '/network?tab=followers', count: followers.length, label: 'Followers' },
            { to: '/network?tab=connections', count: connections.length, label: 'Connections' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Link
                to={stat.to}
                className={cn(
                  'block text-center p-2.5 rounded-xl',
                  'bg-surface-50/50 dark:bg-surface-700/30',
                  'hover:bg-primary-50 dark:hover:bg-primary-900/20',
                  'border border-transparent hover:border-primary-200 dark:hover:border-primary-800',
                  'transition-all duration-200 group'
                )}
              >
                <p className="text-xl font-bold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {stat.count}
                </p>
                <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">
                  {stat.label}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Quick Links with beautiful cards
function QuickLinksContent() {
  const links = [
    {
      to: '/library',
      icon: BookOpen,
      label: 'Library',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      hoverBg: 'hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30',
      borderColor: 'hover:border-amber-300 dark:hover:border-amber-700'
    },
    {
      to: '/forum',
      icon: MessageSquare,
      label: 'Forum',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      hoverBg: 'hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30',
      borderColor: 'hover:border-blue-300 dark:hover:border-blue-700'
    },
    {
      to: '/dm',
      icon: Zap,
      label: 'Messages',
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20',
      hoverBg: 'hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/30 dark:hover:to-purple-900/30',
      borderColor: 'hover:border-violet-300 dark:hover:border-violet-700'
    },
    {
      to: '/network',
      icon: Network,
      label: 'Network',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      hoverBg: 'hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30',
      borderColor: 'hover:border-emerald-300 dark:hover:border-emerald-700'
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 pt-2">
      {links.map((link, index) => {
        const Icon = link.icon;
        return (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={link.to}
              className={cn(
                'flex items-center gap-2.5 p-3 rounded-xl',
                'border border-transparent',
                'transition-all duration-200',
                link.bg,
                link.hoverBg,
                link.borderColor,
                'group'
              )}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Icon className={cn('w-5 h-5', link.color)} />
              </motion.div>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-surface-100 transition-colors">
                {link.label}
              </span>
              <ArrowUpRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-surface-400" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// Trending Topics with beautiful ranking
function TrendingTopicsContent() {
  const trendingTopics = [
    { tag: 'CivilServiceReform', posts: 124, trending: true },
    { tag: 'DigitalGhana', posts: 98, trending: true },
    { tag: 'PublicPolicy', posts: 76, trending: false },
    { tag: 'GoodGovernance', posts: 54, trending: false },
    { tag: 'ProfessionalDevelopment', posts: 43, trending: false },
  ];

  return (
    <div className="space-y-1.5 pt-2">
      {trendingTopics.map((topic, index) => (
        <motion.div
          key={topic.tag}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link
            to={`/search?q=${topic.tag}`}
            className={cn(
              'flex items-center justify-between p-2.5 rounded-xl',
              'hover:bg-surface-50 dark:hover:bg-surface-700/50',
              'transition-all duration-200 group'
            )}
          >
            <div className="flex items-center gap-3">
              {/* Rank badge */}
              <motion.span
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold',
                  index < 2
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                )}
                whileHover={{ scale: 1.1 }}
              >
                {index + 1}
              </motion.span>

              {/* Topic info */}
              <div>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-surface-400 group-hover:text-primary-500 transition-colors" />
                  <span className="text-sm font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {topic.tag}
                  </span>
                  {topic.trending && (
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                    </motion.span>
                  )}
                </div>
                <p className="text-[10px] text-surface-400 mt-0.5">
                  {topic.posts} posts
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-surface-300 group-hover:text-surface-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// Suggested Users Section
function SuggestedUsersSection() {
  return (
    <CollapsibleWidget
      title="People You May Know"
      icon={<Users className="w-4 h-4 text-white" />}
      badge={
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <Badge variant="primary" size="sm" className="shadow-sm">
            New
          </Badge>
        </motion.span>
      }
      delay={0.15}
      gradient="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"
      iconBg="bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30"
      previewContent="5 suggestions"
    >
      <div className="pt-1">
        <SuggestedUsers limit={4} compact showHeader={false} />
      </div>
    </CollapsibleWidget>
  );
}

export default function Wall() {
  const { user } = useAuthStore();
  const { fetchFollowing, fetchFollowers, fetchConnections, fetchPendingRequests } = useSocialStore();
  const { startHeartbeatPolling, stopHeartbeatPolling } = usePresenceStore();

  // Load social data on mount
  useEffect(() => {
    fetchFollowing();
    fetchFollowers();
    fetchConnections();
    fetchPendingRequests();
  }, [fetchFollowing, fetchFollowers, fetchConnections, fetchPendingRequests]);

  // Start presence heartbeat
  useEffect(() => {
    startHeartbeatPolling(30000);
    return () => stopHeartbeatPolling();
  }, [startHeartbeatPolling, stopHeartbeatPolling]);

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-surface-100">
              Welcome back, {user?.firstName || user?.displayName?.split(' ')[0] || 'there'}!
            </h1>
            <motion.span
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              className="text-2xl lg:text-3xl"
            >
              👋
            </motion.span>
          </div>
          <p className="text-surface-500 mt-1">
            Here's what's happening in your network today
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0 space-y-4 order-2 lg:order-1">
            <ProfileCard />

            <CollapsibleWidget
              title="Quick Access"
              icon={<LayoutGrid className="w-4 h-4 text-white" />}
              delay={0.1}
              gradient="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"
              iconBg="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30"
              previewContent="4 shortcuts"
            >
              <QuickLinksContent />
            </CollapsibleWidget>
          </aside>

          {/* Main Feed */}
          <main className="flex-1 min-w-0 order-1 lg:order-2">
            <WallFeed showComposer />
          </main>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0 space-y-4 order-3">
            <SuggestedUsersSection />

            <CollapsibleWidget
              title="Trending Topics"
              icon={<TrendingUp className="w-4 h-4 text-white" />}
              badge={
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                </motion.span>
              }
              delay={0.2}
              gradient="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
              iconBg="bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30"
              previewContent="5 trending"
            >
              <TrendingTopicsContent />
            </CollapsibleWidget>
          </aside>
        </div>
      </div>
    </div>
  );
}
