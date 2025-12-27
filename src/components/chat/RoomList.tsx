import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Hash,
  Lock,
  MoreVertical,
  BellOff,
  LogOut,
  Settings,
} from 'lucide-react';
import { ChatRoom } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

interface RoomListProps {
  rooms: ChatRoom[];
  currentRoomId?: string;
  onCreateRoom?: () => void;
  onRoomSelect?: () => void;
}

export function RoomList({ rooms, currentRoomId, onCreateRoom, onRoomSelect }: RoomListProps) {
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
    filteredRooms = filteredRooms.filter((room) => (room.unreadCount || 0) > 0);
  }
  // Note: 'starred' filter is placeholder - ChatRoom doesn't have isStarred property yet

  // Sort by last activity
  filteredRooms.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
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
                onSelect={onRoomSelect}
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
  onSelect?: () => void;
}

function RoomItem({ room, isActive, onSelect }: RoomItemProps) {
  const menuItems = [
    {
      label: 'Mute',
      icon: BellOff,
      onClick: () => {},
    },
    { label: 'Settings', icon: Settings, onClick: () => {} },
    { label: 'Leave Room', icon: LogOut, onClick: () => {}, className: 'text-error-600' },
  ];

  const getRoomIcon = () => {
    if (room.type === 'private') {
      return <Lock className="w-4 h-4 text-surface-500" />;
    }
    return <Hash className="w-4 h-4 text-surface-500" />;
  };

  return (
    <Link to={`/chat/${room.id}`} onClick={() => onSelect?.()}>
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
        {/* Room Icon */}
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
          </div>
          <div className="flex items-center text-sm text-surface-500 truncate">
            <span className="text-surface-400 truncate">
              {room.description || `${room.memberCount || 0} members`}
            </span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-surface-400">
            {room.lastMessageAt ? formatRelativeTime(room.lastMessageAt) : ''}
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
