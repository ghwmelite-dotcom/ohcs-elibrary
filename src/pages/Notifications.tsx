import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { NotificationList, NotificationSettings, Notification } from '@/components/notifications';
import { cn } from '@/utils/cn';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<'all' | 'settings'>('all');

  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'message',
      title: 'New Message',
      message: 'sent you a direct message',
      actorName: 'Kwame Asante',
      link: '/messages/1',
      isRead: false,
      createdAt: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    },
    {
      id: '2',
      type: 'badge_earned',
      title: 'Achievement Unlocked',
      message: 'You earned the "Bookworm" badge for reading 10 documents!',
      isRead: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    },
    {
      id: '3',
      type: 'forum_mention',
      title: 'Forum Mention',
      message: 'mentioned you in "Best practices for document management"',
      actorName: 'Ama Serwaa',
      link: '/forum/topic/123',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: '4',
      type: 'group_invite',
      title: 'Group Invitation',
      message: 'invited you to join "Ministry of Finance Working Group"',
      actorName: 'Kofi Mensah',
      link: '/groups/456',
      isRead: true,
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    {
      id: '5',
      type: 'document',
      title: 'New Document',
      message: 'A new document "Annual Budget Report 2024" was added to the library',
      link: '/library/doc/789',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: '6',
      type: 'level_up',
      title: 'Level Up!',
      message: 'Congratulations! You reached Level 5 - Senior Contributor',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: '7',
      type: 'like',
      title: 'Post Liked',
      message: 'liked your forum post',
      actorName: 'Efua Ankrah',
      link: '/forum/topic/101',
      isRead: true,
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
    {
      id: '8',
      type: 'forum_reply',
      title: 'New Reply',
      message: 'replied to your topic "Questions about leave policy"',
      actorName: 'Yaw Boateng',
      link: '/forum/topic/102',
      isRead: true,
      createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    },
    {
      id: '9',
      type: 'announcement',
      title: 'System Announcement',
      message: 'The platform will undergo maintenance on Saturday from 2-4 AM GMT',
      isRead: true,
      createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    },
    {
      id: '10',
      type: 'xp_earned',
      title: 'XP Earned',
      message: 'You earned 50 XP for completing your daily login streak',
      isRead: true,
      createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleSaveSettings = (preferences: any) => {
    console.log('Saving notification preferences:', preferences);
    // In production, this would save to the backend
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                Notifications
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-surface-200 dark:border-surface-700">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'all'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            )}
          >
            <Bell className="w-4 h-4" />
            All Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* Content */}
        {activeTab === 'all' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <NotificationList
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDelete}
              onClearAll={handleClearAll}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <NotificationSettings onSave={handleSaveSettings} />
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
