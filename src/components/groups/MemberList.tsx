import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MoreVertical,
  Crown,
  Shield,
  UserMinus,
  UserCog,
  Ban,
  MessageSquare,
} from 'lucide-react';
import { GroupMember } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface MemberListProps {
  members: GroupMember[];
  isAdmin?: boolean;
  currentUserId?: string;
  onRemoveMember?: (memberId: string) => void;
  onPromoteMember?: (memberId: string, role: string) => void;
  onBanMember?: (memberId: string) => void;
  onMessage?: (memberId: string) => void;
}

export function MemberList({
  members,
  isAdmin = false,
  currentUserId,
  onRemoveMember,
  onPromoteMember,
  onBanMember,
  onMessage,
}: MemberListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  // Filter members
  let filteredMembers = members;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredMembers = filteredMembers.filter((member) => {
      const name = member.displayName || member.name || '';
      return name.toLowerCase().includes(query);
    });
  }

  if (roleFilter) {
    filteredMembers = filteredMembers.filter(
      (member) => member.role === roleFilter
    );
  }

  // Group by role
  const owners = filteredMembers.filter((m) => m.role === 'owner');
  const admins = filteredMembers.filter((m) => m.role === 'admin');
  const moderators = filteredMembers.filter((m) => m.role === 'moderator');
  const regularMembers = filteredMembers.filter((m) => m.role === 'member');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-secondary-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-primary-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-accent-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300';
      case 'admin':
        return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300';
      case 'moderator':
        return 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300';
      default:
        return '';
    }
  };

  const renderMemberSection = (
    title: string,
    sectionMembers: GroupMember[],
    icon?: React.ReactNode
  ) => {
    if (sectionMembers.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-surface-500">
          {icon}
          {title} ({sectionMembers.length})
        </div>
        {sectionMembers.map((member) => (
          <MemberItem
            key={member.id}
            member={member}
            isAdmin={isAdmin}
            isCurrentUser={member.id === currentUserId}
            roleIcon={getRoleIcon(member.role)}
            roleBadgeClass={getRoleBadge(member.role)}
            onRemove={() => onRemoveMember?.(member.id)}
            onPromote={(role) => onPromoteMember?.(member.id, role)}
            onBan={() => onBanMember?.(member.id)}
            onMessage={() => onMessage?.(member.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Input
        placeholder="Search members..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
      />

      {/* Role Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setRoleFilter(null)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full transition-colors',
            !roleFilter
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
          )}
        >
          All ({members.length})
        </button>
        <button
          onClick={() => setRoleFilter('admin')}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1',
            roleFilter === 'admin'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
          )}
        >
          <Shield className="w-3 h-3" />
          Admins
        </button>
        <button
          onClick={() => setRoleFilter('moderator')}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full transition-colors',
            roleFilter === 'moderator'
              ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300'
              : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
          )}
        >
          Moderators
        </button>
      </div>

      {/* Member Sections */}
      <div className="space-y-6">
        {renderMemberSection('Owner', owners, <Crown className="w-4 h-4 text-secondary-500" />)}
        {renderMemberSection('Administrators', admins, <Shield className="w-4 h-4 text-primary-500" />)}
        {renderMemberSection('Moderators', moderators, <Shield className="w-4 h-4 text-accent-500" />)}
        {renderMemberSection('Members', regularMembers)}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-8 text-surface-500">
          No members found
        </div>
      )}
    </div>
  );
}

interface MemberItemProps {
  member: GroupMember;
  isAdmin: boolean;
  isCurrentUser: boolean;
  roleIcon?: React.ReactNode;
  roleBadgeClass?: string;
  onRemove: () => void;
  onPromote: (role: string) => void;
  onBan: () => void;
  onMessage: () => void;
}

function MemberItem({
  member,
  isAdmin,
  isCurrentUser,
  roleIcon,
  roleBadgeClass,
  onRemove,
  onPromote,
  onBan,
  onMessage,
}: MemberItemProps) {
  const menuItems = [
    { label: 'Message', icon: MessageSquare, onClick: onMessage },
    ...(isAdmin && !isCurrentUser
      ? [
          {
            label: member.role === 'member' ? 'Promote to Moderator' : 'Demote to Member',
            icon: UserCog,
            onClick: () => onPromote(member.role === 'member' ? 'moderator' : 'member'),
          },
          { label: 'Remove from Group', icon: UserMinus, onClick: onRemove },
          { label: 'Ban User', icon: Ban, onClick: onBan, className: 'text-error-600' },
        ]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 group"
    >
      <Avatar
        src={member.avatar}
        name={member.displayName || member.name}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to={`/profile/${member.id}`}
            className="font-medium text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400 truncate"
          >
            {member.displayName || member.name || 'Member'}
          </Link>
          {roleIcon}
          {roleBadgeClass && (
            <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', roleBadgeClass)}>
              {member.role}
            </span>
          )}
          {isCurrentUser && (
            <span className="text-xs text-surface-400">(You)</span>
          )}
        </div>
        <p className="text-sm text-surface-500 truncate">
          {member.title || 'Member'}
        </p>
      </div>

      <div className="text-xs text-surface-400">
        {member.joinedAt ? `Joined ${formatRelativeTime(member.joinedAt)}` : 'Member'}
      </div>

      <Dropdown items={menuItems} align="right">
        <button className="p-1.5 opacity-0 group-hover:opacity-100 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-all">
          <MoreVertical className="w-4 h-4" />
        </button>
      </Dropdown>
    </motion.div>
  );
}
