import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquarePlus, Loader2, Inbox } from 'lucide-react';
import { useDMStore } from '@/stores/dmStore';
import { ConversationItem } from './ConversationItem';
import { NewDMModal } from './NewDMModal';
import { cn } from '@/utils/cn';

interface ConversationListProps {
  activeConversationId?: string;
  onSelectConversation?: (userId: string) => void;
  className?: string;
}

export function ConversationList({
  activeConversationId,
  onSelectConversation,
  className,
}: ConversationListProps) {
  const { conversations, isLoading, fetchConversations } = useDMStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDM, setShowNewDM] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const otherUser = c.participant1 || c.participant2;
    return otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Messages
          </h2>
          <button
            onClick={() => setShowNewDM(true)}
            className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="New message"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg text-sm',
              'bg-surface-50 dark:bg-surface-900',
              'border border-surface-200 dark:border-surface-700',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
              'placeholder-surface-400 text-surface-900 dark:text-surface-100'
            )}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && conversations.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <Inbox className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
            <p className="text-surface-500">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewDM(true)}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <motion.div layout className="space-y-1">
            {filteredConversations.map((conversation, index) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                index={index}
                onClick={() => onSelectConversation?.(conversation.participant1Id || conversation.participant2Id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* New DM Modal */}
      <NewDMModal
        isOpen={showNewDM}
        onClose={() => setShowNewDM(false)}
        onSelectUser={(userId) => {
          onSelectConversation?.(userId);
          setShowNewDM(false);
        }}
      />
    </div>
  );
}
