import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Settings,
  Trash2,
  CheckCheck,
  Filter,
  Loader2,
  RefreshCw,
  Archive,
  Inbox,
  AlertCircle,
  ChevronDown,
  Megaphone
} from 'lucide-react';
import {
  NotificationCenter,
  NotificationTimeline,
  NotificationActivityChart,
  NotificationSettings,
  PushNotificationManager,
  NewsletterSubscription,
} from '@/components/notifications';
import { BroadcastsSection } from '@/components/broadcasts';
import { useNotificationStore } from '@/stores/notificationStore';
import { useBroadcastStore } from '@/stores/broadcastStore';
import { cn } from '@/utils/cn';

type TabType = 'inbox' | 'broadcasts' | 'archived' | 'settings' | 'push';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [showFilters, setShowFilters] = useState(false);

  const {
    notifications,
    summary,
    preferences,
    isLoading,
    isSummaryLoading,
    filter,
    typeFilter,
    page,
    totalPages,
    fetchNotifications,
    fetchSummary,
    fetchPreferences,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    clearAll,
    setFilter,
    setTypeFilter,
    subscribeToPush,
    unsubscribeFromPush,
    checkPushSupport
  } = useNotificationStore();

  // Load data on mount
  useEffect(() => {
    fetchNotifications();
    fetchSummary();
    fetchPreferences();
    checkPushSupport();
  }, []);

  // Refresh when tab changes
  useEffect(() => {
    if (activeTab === 'inbox') {
      setFilter('all');
    } else if (activeTab === 'archived') {
      setFilter('archived');
    }
  }, [activeTab]);

  const unreadCount = summary?.unreadTotal || 0;

  const handleLoadMore = () => {
    if (page < totalPages && !isLoading) {
      fetchNotifications(page + 1, true);
    }
  };

  const handleRefresh = () => {
    fetchNotifications(1);
    fetchSummary();
  };

  const notificationTypes = [
    { id: null, label: 'All Types' },
    { id: 'message', label: 'Messages' },
    { id: 'document', label: 'Documents' },
    { id: 'forum_reply', label: 'Forum' },
    { id: 'group_invite', label: 'Groups' },
    { id: 'badge_earned', label: 'Achievements' },
    { id: 'announcement', label: 'Announcements' },
    { id: 'security', label: 'Security' }
  ];

  // Get active broadcasts count
  const { activeBroadcasts } = useBroadcastStore();
  const activeBroadcastsCount = activeBroadcasts.length;

  const tabs = [
    { id: 'inbox' as TabType, label: 'Inbox', icon: Inbox, count: unreadCount },
    { id: 'broadcasts' as TabType, label: 'Broadcasts', icon: Megaphone, count: activeBroadcastsCount, highlight: activeBroadcastsCount > 0 },
    { id: 'archived' as TabType, label: 'Archived', icon: Archive },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
    { id: 'push' as TabType, label: 'Push', icon: Bell }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <NotificationCenter summary={summary} isLoading={isSummaryLoading} />
      </motion.div>

      {/* Activity Chart */}
      {summary?.recentActivity && summary.recentActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <NotificationActivityChart data={summary.recentActivity} />
        </motion.div>
      )}

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Notification sections"
        className="flex flex-wrap gap-2 mb-6 border-b border-surface-200 dark:border-surface-700 pb-4"
        onKeyDown={(e) => {
          const tabIds = tabs.map((t) => t.id);
          const currentIndex = tabIds.indexOf(activeTab);
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const next = tabIds[(currentIndex + 1) % tabIds.length];
            setActiveTab(next);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = tabIds[(currentIndex - 1 + tabIds.length) % tabIds.length];
            setActiveTab(prev);
          } else if (e.key === 'Home') {
            e.preventDefault();
            setActiveTab(tabIds[0]);
          } else if (e.key === 'End') {
            e.preventDefault();
            setActiveTab(tabIds[tabIds.length - 1]);
          }
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
              activeTab === tab.id
                ? tab.id === 'broadcasts' && tab.highlight
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : tab.id === 'broadcasts' && tab.highlight
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
            )}
          >
            <tab.icon className={cn('w-4 h-4', tab.id === 'broadcasts' && tab.highlight && activeTab !== tab.id && 'animate-pulse')} />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full',
                tab.id === 'broadcasts'
                  ? activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500 text-white'
                  : 'bg-primary-600 text-white'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'inbox' || activeTab === 'archived' ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Toolbar */}
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                      showFilters
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700'
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters</span>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
                  </button>

                  {/* Unread/All Toggle */}
                  {activeTab === 'inbox' && (
                    <div className="flex items-center bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
                      <button
                        onClick={() => setFilter('all')}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                          filter === 'all'
                            ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-white shadow-sm'
                            : 'text-surface-600 dark:text-surface-400'
                        )}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilter('unread')}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                          filter === 'unread'
                            ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-white shadow-sm'
                            : 'text-surface-600 dark:text-surface-400'
                        )}
                      >
                        Unread
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Refresh */}
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={cn('w-4 h-4 text-surface-500', isLoading && 'animate-spin')} />
                  </button>

                  {/* Mark All Read */}
                  {unreadCount > 0 && activeTab === 'inbox' && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark all read
                    </button>
                  )}

                  {/* Clear All */}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => clearAll(activeTab === 'archived')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Options */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-surface-200 dark:border-surface-700">
                      <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-2">
                        Filter by type
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {notificationTypes.map((type) => (
                          <button
                            key={type.id || 'all'}
                            onClick={() => setTypeFilter(type.id)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                              typeFilter === type.id
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                            )}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification List */}
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              {isLoading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
              ) : (
                <>
                  <NotificationTimeline
                    notifications={notifications}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onArchive={archiveNotification}
                  />

                  {/* Load More */}
                  {page < totalPages && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          'Load More'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'settings' ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick subscription widget */}
            <NewsletterSubscription compact={false} />

            <NotificationSettings
              initialPreferences={preferences ? {
                email: preferences.emailEnabled,
                push: preferences.pushEnabled,
                inApp: preferences.inAppEnabled,
                sound: preferences.soundEnabled,
                quietHours: {
                  enabled: preferences.quietHoursEnabled,
                  start: preferences.quietHoursStart,
                  end: preferences.quietHoursEnd
                },
                categories: preferences.categoryPreferences
              } : undefined}
              onSave={async (prefs) => {
                await updatePreferences({
                  emailEnabled: prefs.email,
                  pushEnabled: prefs.push,
                  inAppEnabled: prefs.inApp,
                  soundEnabled: prefs.sound,
                  quietHoursEnabled: prefs.quietHours.enabled,
                  quietHoursStart: prefs.quietHours.start,
                  quietHoursEnd: prefs.quietHours.end,
                  categoryPreferences: prefs.categories
                });
              }}
            />
          </motion.div>
        ) : activeTab === 'broadcasts' ? (
          <motion.div
            key="broadcasts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <BroadcastsSection />
          </motion.div>
        ) : activeTab === 'push' ? (
          <motion.div
            key="push"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PushNotificationManager
              isEnabled={preferences?.pushEnabled || false}
              onSubscribe={subscribeToPush}
              onUnsubscribe={unsubscribeFromPush}
            />

            {/* Additional Push Info */}
            <div className="mt-6 bg-surface-50 dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="font-medium text-surface-900 dark:text-white mb-1">
                    About Push Notifications
                  </h4>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                    Push notifications let you receive updates even when you're not actively using the platform.
                    They work on both desktop and mobile browsers.
                  </p>
                  <ul className="text-sm text-surface-500 space-y-1">
                    <li>• Notifications respect your quiet hours settings</li>
                    <li>• You can control which types of notifications you receive</li>
                    <li>• You can unsubscribe at any time</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
