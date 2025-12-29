import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Zap, FileText, Users } from 'lucide-react';
import {
  ProfileHeader,
  ProfileStats,
  ActivityFeed,
  BadgeDisplay,
  ProfileEdit,
} from '@/components/profile';
import { LevelProgress } from '@/components/gamification';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'badges' | 'documents'>('activity');

  // Determine if viewing own profile
  const isOwnProfile = !userId || userId === user?.id;

  // Mock profile data
  const profile = {
    id: userId || user?.id || '1',
    name: isOwnProfile ? user?.name || 'Kwame Asante' : 'Ama Serwaa',
    email: isOwnProfile ? user?.email || 'kwame.asante@ohcs.gov.gh' : 'ama.serwaa@psc.gov.gh',
    avatar: '',
    coverImage: '',
    title: 'Senior Administrative Officer',
    mda: isOwnProfile ? 'Office of the Head of Civil Service' : 'Public Services Commission',
    gradeLevel: 'Principal',
    location: 'Accra, Ghana',
    phone: '+233 XX XXX XXXX',
    bio: 'Passionate about public service and digital transformation. Working to modernize government operations and improve service delivery to citizens.',
    website: '',
    joinedAt: '2023-01-15',
    isVerified: true,
    role: 'civil_servant',
    level: 6,
    levelName: 'Expert',
    totalXP: 10200,
  };

  const stats = {
    documents: 24,
    forumPosts: 45,
    forumReplies: 128,
    groups: 8,
    badges: 12,
    followers: 156,
    following: 89,
    views: 1240,
    upvotes: 342,
    streak: 12,
  };

  const mockActivities = [
    {
      id: '1',
      type: 'document_upload' as const,
      title: 'Annual Budget Guidelines 2024',
      description: 'Uploaded to the Finance category',
      link: '/library/doc/1',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      type: 'forum_post' as const,
      title: 'Best practices for document management',
      link: '/forum/topic/1',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      type: 'badge_earned' as const,
      title: 'Fire Starter Badge',
      description: '7-day login streak achieved',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '4',
      type: 'group_join' as const,
      title: 'Digital Transformation Working Group',
      link: '/groups/1',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: '5',
      type: 'level_up' as const,
      title: 'Reached Level 6 - Expert',
      createdAt: new Date(Date.now() - 432000000).toISOString(),
    },
  ];

  const mockBadges = [
    { id: '1', name: 'First Steps', description: 'Complete your profile', icon: '👋', rarity: 'common' as const, earnedAt: '2023-01-15', category: 'onboarding' },
    { id: '2', name: 'Bookworm', description: 'Read 10 documents', icon: '📚', rarity: 'uncommon' as const, earnedAt: '2023-02-01', category: 'library' },
    { id: '3', name: 'Contributor', description: 'Upload 5 documents', icon: '📤', rarity: 'rare' as const, earnedAt: '2023-03-01', category: 'library' },
    { id: '4', name: 'Helpful', description: 'Get 10 upvotes', icon: '👍', rarity: 'uncommon' as const, earnedAt: '2023-03-15', category: 'forum' },
    { id: '5', name: 'Socialite', description: 'Join 5 groups', icon: '👥', rarity: 'common' as const, earnedAt: '2023-04-01', category: 'social' },
    { id: '6', name: 'Fire Starter', description: '7-day streak', icon: '🔥', rarity: 'uncommon' as const, earnedAt: '2024-01-01', category: 'engagement' },
    { id: '7', name: 'Scholar', description: 'Read 50 documents', icon: '🎓', rarity: 'rare' as const, category: 'library', progress: 68 },
    { id: '8', name: 'Legend', description: 'Reach level 10', icon: '🏆', rarity: 'legendary' as const, category: 'progression', progress: 60 },
  ];

  const handleSaveProfile = async (data: any) => {
    console.log('Saving profile:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsEditing(false);
  };

  if (isEditing && isOwnProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-6">
          Edit Profile
        </h1>
        <ProfileEdit
          initialData={profile}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={false}
        onEditProfile={() => setIsEditing(true)}
        onMessage={() => console.log('Message')}
        onFollow={() => console.log('Follow')}
      />

      {/* Stats */}
      <div className="mt-6">
        <ProfileStats stats={stats} layout="horizontal" />
      </div>

      {/* Level Progress */}
      <div className="mt-6">
        <LevelProgress
          level={profile.level}
          levelName={profile.levelName}
          currentXP={2200}
          requiredXP={3000}
          totalXP={profile.totalXP}
          showDetails
        />
      </div>

      {/* Tabs */}
      <div className="mt-6 sm:mt-8 border-b border-surface-200 dark:border-surface-700 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 sm:gap-2">
          {[
            { id: 'activity', label: 'Activity', icon: Zap },
            { id: 'badges', label: 'Badges', icon: Award },
            { id: 'documents', label: 'Documents', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
              )}
            >
              <tab.icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="md:col-span-2">
          {activeTab === 'activity' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ActivityFeed activities={mockActivities} />
            </motion.div>
          )}

          {activeTab === 'badges' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <BadgeDisplay badges={mockBadges} showLocked />
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6"
            >
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Uploaded Documents
              </h3>
              <div className="text-center py-8 text-surface-500">
                <FileText className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                <p>Document list coming soon</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <ProfileStats stats={stats} layout="grid" />

          {/* Groups */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary-500" />
              Groups ({stats.groups})
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {['Digital Transformation', 'Finance Policy', 'HR Network'].map((group) => (
                <div
                  key={group}
                  className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-surface-50 dark:hover:bg-surface-700/50 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {group.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
                    {group}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
