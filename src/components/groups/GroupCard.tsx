import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Lock,
  Globe,
  Shield,
  Star,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { Group } from '@/types';
import { Avatar, AvatarGroup } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface GroupCardProps {
  group: Group;
  index?: number;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
}

export function GroupCard({ group, index = 0, onJoin, onLeave }: GroupCardProps) {
  const getTypeIcon = () => {
    switch (group.type) {
      case 'private':
        return <Lock className="w-4 h-4" />;
      case 'official':
        return <Shield className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (group.type) {
      case 'private':
        return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300';
      case 'official':
        return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300';
      case 'closed':
        return 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-400';
      default:
        return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden hover:shadow-elevation-2 transition-shadow"
    >
      {/* Cover Image */}
      <div
        className="h-24 relative"
        style={{
          backgroundColor: group.coverColor || '#006B3F',
          backgroundImage: group.coverImage ? `url(${group.coverImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Type Badge */}
        <span
          className={cn(
            'absolute top-3 right-3 text-xs px-2 py-1 rounded-full flex items-center gap-1 capitalize',
            getTypeColor()
          )}
        >
          {getTypeIcon()}
          {group.type}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 -mt-8 relative">
        {/* Group Avatar */}
        <div className="mb-3">
          {group.avatar ? (
            <Avatar
              src={group.avatar}
              name={group.name}
              size="xl"
              className="ring-4 ring-white dark:ring-surface-800"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary-500 flex items-center justify-center ring-4 ring-white dark:ring-surface-800">
              <span className="text-2xl text-white font-bold">
                {group.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Group Name & Description */}
        <Link
          to={`/groups/${group.id}`}
          className="block font-semibold text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {group.name}
        </Link>
        <p className="mt-1 text-sm text-surface-500 line-clamp-2">
          {group.description}
        </p>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-surface-500">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {group.memberCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {group.postCount}
          </span>
        </div>

        {/* Members Preview */}
        <div className="mt-4 flex items-center justify-between">
          <AvatarGroup
            avatars={group.members?.slice(0, 5).map((m) => ({
              src: m.avatar,
              name: m.name,
            })) || []}
            max={5}
            size="sm"
          />

          {group.isMember ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLeave?.(group.id)}
            >
              Joined
            </Button>
          ) : group.type === 'closed' ? (
            <Button size="sm" onClick={() => onJoin?.(group.id)}>
              Request
            </Button>
          ) : (
            <Button size="sm" onClick={() => onJoin?.(group.id)}>
              Join
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface GroupCardCompactProps {
  group: Group;
  onJoin?: (groupId: string) => void;
}

export function GroupCardCompact({ group, onJoin }: GroupCardCompactProps) {
  return (
    <div className="flex items-center gap-4 p-3 bg-white dark:bg-surface-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {group.avatar ? (
        <Avatar src={group.avatar} name={group.name} size="md" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
          <span className="text-lg text-white font-bold">
            {group.name.charAt(0)}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <Link
          to={`/groups/${group.id}`}
          className="font-medium text-surface-900 dark:text-surface-50 hover:text-primary-600 truncate block"
        >
          {group.name}
        </Link>
        <p className="text-xs text-surface-500">
          {group.memberCount} members
        </p>
      </div>

      {!group.isMember && (
        <Button variant="ghost" size="sm" onClick={() => onJoin?.(group.id)}>
          Join
        </Button>
      )}
    </div>
  );
}
