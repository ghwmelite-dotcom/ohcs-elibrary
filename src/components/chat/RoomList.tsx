import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Hash,
  Lock,
  Users,
  Star,
  MoreVertical,
  Bell,
  BellOff,
  LogOut,
  Settings,
} from 'lucide-react';
import { ChatRoom } from '@/types';
import { Avatar, AvatarGroup } from '@/components/shared/Avatar';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import { InlineTypingIndicator } from './TypingIndicator';

interface RoomListProps {
  rooms: ChatRoom[];
  currentRoomId?: string;
  onCreateRoom?: () => void;
}

export function RoomList({ rooms, currentRoomId, onCreateRoom }: RoomListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');

  // Filter rooms
  let filteredRooms = rooms;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredRooms = filteredRooms.filter((room) =>
      room.name.toLowerCase().includes(query)
    );
  }

  if (filter === 'unread') {
    filteredRooms = filteredRooms.filter((room) => room.unreadCount > 0);
  } else if (filter === 'starred') {
    filteredRooms = filteredRooms.filter((room) => room.isStarred);
  }

  // Sort: starred first, then by last activity
  filteredRooms.sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            Chat Rooms
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateRoom}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New
          </Button>
        </div>

        <Input
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
        />

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-3">
          {(['all', 'unread', 'starred'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize',
                filter === f
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="p-6 text-center text-surface-500">
            <p>No rooms found</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={room.id === currentRoomId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RoomItemProps {
  room: ChatRoom;
  isActive: boolean;
}

function RoomItem({ room, isActive }: RoomItemProps) {
  const menuItems = [
    {
      label: room.isMuted ? 'Unmute' : 'Mute',
      icon: room.isMuted ? Bell : BellOff,
      onClick: () => {},
    },
    { label: 'Settings', icon: Settings, onClick: () => {} },
    { label: 'Leave Room', icon: LogOut, onClick: () => {}, className: 'text-error-600' },
  ];

  const getRoomIcon = () => {
    if (room.isPrivate) {
      return <Lock className="w-4 h-4 text-surface-500" />;
    }
    return <Hash className="w-4 h-4 text-surface-500" />;
  };

  return (
    <Link to={`/chat/${room.id}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'group flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors cursor-pointer',
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/20'
            : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
        )}
      >
        {/* Room Avatar/Icon */}
        {room.avatar ? (
          <Avatar src={room.avatar} name={room.name} size="md" />
        ) : (
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isActive
                ? 'bg-primary-100 dark:bg-primary-800'
                : 'bg-surface-100 dark:bg-surface-700'
            )}
          >
            {getRoomIcon()}
          </div>
        )}

        {/* Room Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium truncate',
                isActive
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-surface-900 dark:text-surface-50'
              )}
            >
              {room.name}
            </span>
            {room.isStarred && (
              <Star className="w-3.5 h-3.5 text-secondary-500 fill-secondary-500" />
            )}
            {room.isMuted && (
              <BellOff className="w-3.5 h-3.5 text-surface-400" />
            )}
          </div>
          <div className="flex items-center text-sm text-surface-500 truncate">
            {room.typingUsers && room.typingUsers.length > 0 ? (
              <span className="flex items-center text-primary-600 dark:text-primary-400">
                {room.typingUsers[0]} is typing
                <InlineTypingIndicator />
              </span>
            ) : room.lastMessage ? (
              <span className="truncate">
                <span className="font-medium">{room.lastMessage.sender}: </span>
                {room.lastMessage.content}
              </span>
            ) : (
              <span className="text-surface-400">No messages yet</span>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-surface-400">
            {formatRelativeTime(room.lastActivity)}
          </span>
          {room.unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </span>
          )}
        </div>

        {/* Menu */}
        <Dropdown items={menuItems} align="right">
          <button
            onClick={(e) => e.preventDefault()}
            className="p-1 opacity-0 group-hover:opacity-100 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </Dropdown>
      </motion.div>
    </Link>
  );
}

interface OnlineUsersProps {
  users: { id: string; name: string; avatar?: string; status: string }[];
}

export function OnlineUsers({ users }: OnlineUsersProps) {
  const onlineUsers = users.filter((u) => u.status === 'online');
  const awayUsers = users.filter((u) => u.status === 'away');

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">
          Online
        </h3>
        <span className="text-sm text-surface-500">
          {onlineUsers.length} users
        </span>
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="space-y-2 mb-4">
          {onlineUsers.map((user) => (
            <Link
              key={user.id}
              to={`/messages/${user.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
            >
              <Avatar
                src={user.avatar}
                name={user.name}
                size="sm"
                showStatus
                status="online"
              />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
                {user.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Away Users */}
      {awayUsers.length > 0 && (
        <>
          <p className="text-xs text-surface-400 mb-2">Away</p>
          <div className="space-y-2">
            {awayUsers.map((user) => (
              <Link
                key={user.id}
                to={`/messages/${user.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              >
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  size="sm"
                  showStatus
                  status="away"
                />
                <span className="text-sm font-medium text-surface-500 truncate">
                  {user.name}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
