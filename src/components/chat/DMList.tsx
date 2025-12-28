import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Edit, MoreVertical, Pin, Archive, Trash2, BellOff } from 'lucide-react';
import { DirectMessage } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import { InlineTypingIndicator } from './TypingIndicator';

interface DMListProps {
  conversations: DirectMessage[];
  currentConversationId?: string;
  onNewMessage?: () => void;
}

export function DMList({
  conversations,
  currentConversationId,
  onNewMessage,
}: DMListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations
  let filteredConversations = conversations;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredConversations = filteredConversations.filter((conv) =>
      conv.participant?.name?.toLowerCase().includes(query)
    );
  }

  // Sort by last message time
  filteredConversations.sort(
    (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            Messages
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewMessage}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            New
          </Button>
        </div>

        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
        />
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-surface-500">
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: DirectMessage;
  isActive: boolean;
}

function ConversationItem({ conversation, isActive }: ConversationItemProps) {
  const participant = conversation.participant;
  const lastMessage = conversation.lastMessage;
  const unreadCount = conversation.unreadCount ?? 0;
  const isPinned = conversation.isPinned ?? false;
  const isTyping = conversation.isTyping ?? false;

  const menuItems = [
    { label: isPinned ? 'Unpin' : 'Pin', icon: Pin, onClick: () => {} },
    { label: 'Mute', icon: BellOff, onClick: () => {} },
    { label: 'Archive', icon: Archive, onClick: () => {} },
    { label: 'Delete', icon: Trash2, onClick: () => {}, className: 'text-error-600' },
  ];

  return (
    <Link to={`/messages/${conversation.id}`}>
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
        {/* Avatar */}
        <Avatar
          src={participant?.avatar}
          name={participant?.name ?? 'Unknown'}
          size="md"
          showStatus
          status={(participant?.status as 'online' | 'away' | 'offline') ?? 'offline'}
        />

        {/* Content */}
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
              {participant?.name ?? 'Unknown'}
            </span>
            {isPinned && <Pin className="w-3 h-3 text-surface-400" />}
          </div>
          <div className="text-sm text-surface-500 truncate">
            {isTyping ? (
              <span className="flex items-center text-primary-600 dark:text-primary-400">
                typing
                <InlineTypingIndicator />
              </span>
            ) : lastMessage ? (
              <span className={cn(unreadCount > 0 && 'font-medium text-surface-700 dark:text-surface-300')}>
                {lastMessage}
              </span>
            ) : (
              'Start a conversation'
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-end gap-1">
          {conversation.lastMessageAt && (
            <span className="text-xs text-surface-400">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          )}
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
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

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: { id: string; name: string; avatar?: string; title?: string }[];
  onSelectUser: (userId: string) => void;
}

export function NewMessageModal({
  isOpen,
  onClose,
  users,
  onSelectUser,
}: NewMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-surface-800 rounded-xl shadow-xl"
      >
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            New Message
          </h3>
        </div>

        <div className="p-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto px-2 pb-4">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelectUser(user.id);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
            >
              <Avatar src={user.avatar} name={user.name} size="md" />
              <div className="text-left">
                <p className="font-medium text-surface-900 dark:text-surface-50">
                  {user.name}
                </p>
                {user.title && (
                  <p className="text-sm text-surface-500">{user.title}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-surface-200 dark:border-surface-700">
          <Button variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
