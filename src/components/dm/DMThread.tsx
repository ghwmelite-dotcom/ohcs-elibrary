import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical, Phone, Video, Loader2 } from 'lucide-react';
import { useDMStore } from '@/stores/dmStore';
import { useAuthStore } from '@/stores/authStore';
import { EnhancedDirectMessage } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { OnlineIndicator } from '@/components/presence/OnlineIndicator';
import { LastSeen } from '@/components/presence/LastSeen';
import { TypingIndicator } from '@/components/presence/TypingIndicator';
import { DMMessage } from './DMMessage';
import { DMInput } from './DMInput';
import { cn } from '@/utils/cn';
import { useToast } from '@/components/shared/Toast';

interface DMThreadProps {
  userId: string;
  onBack?: () => void;
  className?: string;
}

export function DMThread({ userId, onBack, className }: DMThreadProps) {
  const { user } = useAuthStore();
  const toast = useToast();
  const {
    currentConversation,
    messages,
    typingUsers,
    isLoadingMessages,
    getOrCreateConversation,
    fetchMessages,
    markAsRead,
    fetchTypingUsers,
  } = useDMStore();

  const [replyTo, setReplyTo] = useState<EnhancedDirectMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get or create conversation
  useEffect(() => {
    if (userId) {
      getOrCreateConversation(userId);
    }
  }, [userId, getOrCreateConversation]);

  // Fetch messages when conversation is set
  useEffect(() => {
    if (currentConversation?.id) {
      fetchMessages(currentConversation.id);
      markAsRead(currentConversation.id);
    }
  }, [currentConversation?.id, fetchMessages, markAsRead]);

  // Poll for typing indicators
  useEffect(() => {
    if (!currentConversation?.id) return;

    const interval = setInterval(() => {
      fetchTypingUsers(currentConversation.id);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentConversation?.id, fetchTypingUsers]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages[currentConversation?.id || '']]);

  // Get other participant
  const otherUser =
    currentConversation?.participant1Id === user?.id
      ? currentConversation?.participant2
      : currentConversation?.participant1;

  const conversationMessages = currentConversation
    ? messages[currentConversation.id] || []
    : [];

  const conversationTypingUsers = currentConversation
    ? typingUsers[currentConversation.id] || []
    : [];

  // Check if messages should be grouped
  const shouldGroupMessages = (
    current: EnhancedDirectMessage,
    previous: EnhancedDirectMessage | null
  ) => {
    if (!previous) return false;
    if (current.senderId !== previous.senderId) return false;

    const currentTime = new Date(current.createdAt).getTime();
    const previousTime = new Date(previous.createdAt).getTime();
    const diffMinutes = (currentTime - previousTime) / (1000 * 60);

    return diffMinutes < 2;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-surface-200 dark:border-surface-700">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {otherUser ? (
          <>
            <div className="relative">
              <Link to={`/profile/${otherUser.id}`}>
                <Avatar
                  src={otherUser.avatar}
                  name={otherUser.displayName || 'User'}
                  size="md"
                />
              </Link>
              <OnlineIndicator
                userId={otherUser.id}
                className="absolute -bottom-0.5 -right-0.5"
              />
            </div>

            <div className="flex-1 min-w-0">
              <Link
                to={`/profile/${otherUser.id}`}
                className="font-semibold text-surface-900 dark:text-surface-100 hover:text-primary-600"
              >
                {otherUser.displayName}
              </Link>
              <LastSeen userId={otherUser.id} />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => toast.info('Voice and video calls coming soon')}
                className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                title="Voice call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => toast.info('Voice and video calls coming soon')}
                className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                title="Video call"
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-200 dark:bg-surface-700 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
              <div className="h-3 w-20 bg-surface-200 dark:bg-surface-700 rounded mt-1 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {isLoadingMessages && conversationMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : conversationMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Avatar
              src={otherUser?.avatar}
              name={otherUser?.displayName || 'User'}
              size="xl"
              className="mb-4"
            />
            <h3 className="font-semibold text-lg text-surface-900 dark:text-surface-100">
              {otherUser?.displayName}
            </h3>
            <p className="text-surface-500 mt-1">
              Start your conversation with {otherUser?.displayName}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {conversationMessages.map((message, index) => {
              const previous = index > 0 ? conversationMessages[index - 1] : null;
              const isGrouped = shouldGroupMessages(message, previous);

              return (
                <DMMessage
                  key={message.id}
                  message={message}
                  conversationId={currentConversation?.id || ''}
                  showAvatar={!isGrouped}
                  isGrouped={isGrouped}
                  onReply={() => setReplyTo(message)}
                />
              );
            })}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        {conversationTypingUsers.length > 0 && (
          <TypingIndicator users={conversationTypingUsers} className="ml-10" />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {currentConversation && (
        <DMInput
          conversationId={currentConversation.id}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      )}
    </div>
  );
}
