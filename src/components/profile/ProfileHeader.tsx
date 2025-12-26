import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  MapPin,
  Building2,
  Calendar,
  Mail,
  Phone,
  Link as LinkIcon,
  Edit2,
  MessageSquare,
  UserPlus,
  UserCheck,
  MoreHorizontal,
  Shield,
  Award
} from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/formatters';

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  coverImage?: string;
  email: string;
  phone?: string;
  title?: string;
  mda?: string;
  gradeLevel?: string;
  location?: string;
  bio?: string;
  website?: string;
  joinedAt: string;
  isVerified?: boolean;
  role?: string;
  level: number;
  levelName: string;
  totalXP: number;
}

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onEditProfile?: () => void;
  onMessage?: () => void;
  onFollow?: () => void;
  onEditCover?: () => void;
  onEditAvatar?: () => void;
}

export function ProfileHeader({
  profile,
  isOwnProfile = false,
  isFollowing = false,
  onEditProfile,
  onMessage,
  onFollow,
  onEditCover,
  onEditAvatar,
}: ProfileHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-32 sm:h-48 bg-gradient-to-br from-primary-500 to-secondary-500">
        {profile.coverImage ? (
          <img
            src={profile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[url('/patterns/ghana-pattern.svg')] bg-repeat opacity-10" />
        )}

        {isOwnProfile && (
          <button
            onClick={onEditCover}
            className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-12">
          {/* Avatar */}
          <div className="relative group mb-4 sm:mb-0">
            <Avatar
              src={profile.avatar}
              name={profile.name}
              size="xl"
              className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-white dark:ring-surface-800"
            />

            {isOwnProfile && (
              <button
                onClick={onEditAvatar}
                className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}

            {/* Level Badge */}
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white text-xs font-bold rounded-full shadow-lg">
              Lvl {profile.level}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:mb-4">
            {isOwnProfile ? (
              <button
                onClick={onEditProfile}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={onFollow}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors',
                    isFollowing
                      ? 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  )}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
                <button
                  onClick={onMessage}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 bg-surface-100 dark:bg-surface-700 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                  </button>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 top-full mt-2 bg-white dark:bg-surface-800 rounded-lg shadow-elevation-3 py-1 z-10 min-w-[140px]"
                    >
                      <button className="w-full px-4 py-2 text-sm text-left text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
                        Share Profile
                      </button>
                      <button className="w-full px-4 py-2 text-sm text-left text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
                        Block User
                      </button>
                      <button className="w-full px-4 py-2 text-sm text-left text-error-600 dark:text-error-400 hover:bg-surface-50 dark:hover:bg-surface-700">
                        Report
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Name & Title */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              {profile.name}
            </h1>
            {profile.isVerified && (
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          {profile.title && (
            <p className="text-surface-600 dark:text-surface-400">
              {profile.title}
            </p>
          )}
          <p className="text-sm text-secondary-600 dark:text-secondary-400 font-medium mt-1">
            {profile.levelName} • {profile.totalXP.toLocaleString()} XP
          </p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-surface-700 dark:text-surface-300">
            {profile.bio}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-surface-500">
          {profile.mda && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {profile.mda}
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {profile.location}
            </div>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-primary-600 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Website
            </a>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Joined {formatDate(profile.joinedAt)}
          </div>
        </div>

        {/* Contact Info (Only for own profile or if allowed) */}
        {isOwnProfile && (
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-surface-500">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              {profile.email}
            </div>
            {profile.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {profile.phone}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
