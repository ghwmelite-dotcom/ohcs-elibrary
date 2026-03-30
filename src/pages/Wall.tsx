import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  ChevronRight,
  Flame,
  Hash,
  BookOpen,
  MessageSquare,
  Network,
  Mail,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useSocialStore } from '@/stores/socialStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { WallFeed } from '@/components/wall/WallFeed';
import { SuggestedUsers } from '@/components/social/SuggestedUsers';
import { TelegramBanner } from '@/components/notifications';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

// ─── Profile Card (LinkedIn-style) ──────────────────────────────────────────

function ProfileCard() {
  const { user } = useAuthStore();
  const { following, followers, connections } = useSocialStore();

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Cover banner */}
      <div className="h-16 bg-gradient-to-r from-primary-600 to-emerald-600" />

      {/* Avatar + Name */}
      <div className="px-4 pb-4 -mt-8">
        <Link to="/profile" className="block w-fit">
          <Avatar
            src={user?.avatar}
            name={user?.displayName || 'User'}
            size="lg"
            className="ring-3 ring-white dark:ring-surface-800"
          />
        </Link>

        <Link
          to="/profile"
          className="block mt-2 font-semibold text-surface-900 dark:text-surface-100 hover:underline text-sm leading-tight"
        >
          {user?.displayName || 'User'}
        </Link>
        <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
          {user?.title || user?.role || 'Civil Servant'}
          {user?.mda && ` at ${user.mda}`}
        </p>
      </div>

      {/* Stats row */}
      <div className="border-t border-surface-100 dark:border-surface-700">
        <Link
          to="/network?tab=connections"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
        >
          <span className="text-xs text-surface-500">Connections</span>
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
            {connections.length}
          </span>
        </Link>
        <Link
          to="/network?tab=followers"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors border-t border-surface-100 dark:border-surface-700"
        >
          <span className="text-xs text-surface-500">Followers</span>
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
            {followers.length}
          </span>
        </Link>
        <Link
          to="/network?tab=following"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors border-t border-surface-100 dark:border-surface-700"
        >
          <span className="text-xs text-surface-500">Following</span>
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
            {following.length}
          </span>
        </Link>
      </div>
    </div>
  );
}

// ─── Quick Links ─────────────────────────────────────────────────────────────

function QuickLinks() {
  const links = [
    { to: '/library', icon: BookOpen, label: 'Library' },
    { to: '/forum', icon: MessageSquare, label: 'Forum' },
    { to: '/dm', icon: Mail, label: 'Messages' },
    { to: '/network', icon: Network, label: 'Network' },
  ];

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {links.map((link, i) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors text-sm text-surface-700 dark:text-surface-300',
              i > 0 && 'border-t border-surface-100 dark:border-surface-700'
            )}
          >
            <Icon className="w-4 h-4 text-surface-400" />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Trending Topics ─────────────────────────────────────────────────────────

function TrendingTopics() {
  const topics = [
    { tag: 'CivilServiceReform', posts: 124, hot: true },
    { tag: 'DigitalGhana', posts: 98, hot: true },
    { tag: 'PublicPolicy', posts: 76, hot: false },
    { tag: 'GoodGovernance', posts: 54, hot: false },
    { tag: 'TrainingWeek2026', posts: 41, hot: false },
  ];

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-surface-400" />
          Trending in OHCS
        </h3>
      </div>
      <div>
        {topics.map((topic, i) => (
          <Link
            key={topic.tag}
            to={`/search?q=${topic.tag}`}
            className={cn(
              'flex items-start gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors group',
              i > 0 && 'border-t border-surface-100 dark:border-surface-700'
            )}
          >
            <span className={cn(
              'w-5 h-5 flex items-center justify-center rounded text-xs font-bold flex-shrink-0 mt-0.5',
              i < 2
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
            )}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3 text-surface-400 flex-shrink-0" />
                <span className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {topic.tag}
                </span>
                {topic.hot && <Flame className="w-3 h-3 text-orange-500 flex-shrink-0" />}
              </div>
              <p className="text-xs text-surface-400 mt-0.5">{topic.posts} posts</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── People You May Know ─────────────────────────────────────────────────────

function PeopleYouMayKnow() {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-surface-400" />
          People you may know
        </h3>
      </div>
      <div className="p-3">
        <SuggestedUsers
          limit={4}
          compact
          showHeader={false}
          showRefresh={false}
        />
      </div>
      <Link
        to="/network"
        className="flex items-center justify-center gap-1 px-4 py-2.5 border-t border-surface-100 dark:border-surface-700 text-sm font-medium text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
      >
        View all
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function SidebarFooter() {
  return (
    <div className="px-3 py-4 text-xs text-surface-400">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <Link to="/help" className="hover:text-surface-600 dark:hover:text-surface-300 hover:underline transition-colors">Help</Link>
        <Link to="/settings" className="hover:text-surface-600 dark:hover:text-surface-300 hover:underline transition-colors">Settings</Link>
        <Link to="/privacy" className="hover:text-surface-600 dark:hover:text-surface-300 hover:underline transition-colors">Privacy</Link>
        <Link to="/terms" className="hover:text-surface-600 dark:hover:text-surface-300 hover:underline transition-colors">Terms</Link>
      </div>
      <p className="mt-2 flex items-center gap-1">
        <Star className="w-3 h-3" />
        OHCS E-Library &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Wall() {
  const { user } = useAuthStore();
  const { fetchFollowing, fetchFollowers, fetchConnections, fetchPendingRequests } = useSocialStore();
  const { startHeartbeatPolling, stopHeartbeatPolling } = usePresenceStore();

  useEffect(() => {
    fetchFollowing();
    fetchFollowers();
    fetchConnections();
    fetchPendingRequests();
  }, [fetchFollowing, fetchFollowers, fetchConnections, fetchPendingRequests]);

  useEffect(() => {
    startHeartbeatPolling(30000);
    return () => stopHeartbeatPolling();
  }, [startHeartbeatPolling, stopHeartbeatPolling]);

  return (
    <div className="min-h-screen bg-surface-100/60 dark:bg-surface-900">
      <div className="max-w-[1128px] mx-auto px-4 py-4 sm:py-6">

        {/* Telegram Banner */}
        <TelegramBanner />

        {/* 3-Column LinkedIn Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[225px_1fr_300px] gap-5">

          {/* ── Left Sidebar ── */}
          <aside className="hidden lg:block space-y-2">
            <div className="sticky top-20 space-y-2">
              <ProfileCard />
              <QuickLinks />
            </div>
          </aside>

          {/* ── Center Feed ── */}
          <main className="min-w-0">
            {/* Mobile profile bar */}
            <div className="lg:hidden mb-3">
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700"
              >
                <Avatar
                  src={user?.avatar}
                  name={user?.displayName || 'User'}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-surface-900 dark:text-surface-100 truncate">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-surface-500 truncate">
                    View your profile
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-400" />
              </Link>
            </div>

            <WallFeed showComposer />
          </main>

          {/* ── Right Sidebar ── */}
          <aside className="hidden lg:block space-y-2">
            <div className="sticky top-20 space-y-2">
              <PeopleYouMayKnow />
              <TrendingTopics />
              <SidebarFooter />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
