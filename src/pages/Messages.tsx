import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Phone,
  Video,
  Info,
  MoreVertical,
  Trash2,
  BellOff,
  Archive,
  User,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { DMList, NewMessageModal, MessageList, MessageInput } from '@/components/chat';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';

export default function Messages() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const {
    conversations,
    messages,
    fetchConversations,
    fetchDirectMessages,
    sendDirectMessage,
    isLoading,
  } = useChatStore();

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);

  const currentConversation = conversations.find((c) => c.id === conversationId);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationId) {
      fetchDirectMessages(conversationId);
    }
  }, [conversationId, fetchDirectMessages]);

  const handleSendMessage = (content: string) => {
    if (!conversationId) return;
    sendDirectMessage(conversationId, content);
    setReplyTo(null);
  };

  const handleSelectUser = (userId: string) => {
    // In a real app, this would create or find a conversation with this user
    navigate(`/messages/${userId}`);
    setShowNewMessage(false);
  };

  // Mock users for new message modal
  const availableUsers = [
    { id: '1', name: 'Kwame Asante', title: 'Principal Admin Officer' },
    { id: '2', name: 'Ama Serwaa', title: 'HR Manager' },
    { id: '3', name: 'Kofi Mensah', title: 'IT Specialist' },
    { id: '4', name: 'Akua Owusu', title: 'Policy Analyst' },
    { id: '5', name: 'Yaw Boateng', title: 'Finance Officer' },
  ];

  const menuItems = [
    { label: 'View Profile', icon: User, onClick: () => {} },
    { label: 'Mute Notifications', icon: BellOff, onClick: () => {} },
    { label: 'Archive', icon: Archive, onClick: () => {} },
    { label: 'Delete Conversation', icon: Trash2, onClick: () => {}, className: 'text-error-600' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden bg-white dark:bg-surface-800 shadow-elevation-2">
      {/* Conversation List Sidebar */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <DMList
          conversations={conversations}
          currentConversationId={conversationId}
          onNewMessage={() => setShowNewMessage(true)}
        />
      </div>

      {/* Main Message Area */}
      <div className="flex-1 flex flex-col min-w-0 border-l border-surface-200 dark:border-surface-700">
        {currentConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-3">
                <Avatar
                  src={currentConversation.participant.avatar}
                  name={currentConversation.participant.name}
                  size="md"
                  showStatus
                  status={currentConversation.participant.status as 'online' | 'away' | 'offline'}
                />
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                    {currentConversation.participant.name}
                  </h2>
                  <p className="text-sm text-surface-500">
                    {currentConversation.participant.status === 'online' ? (
                      <span className="text-success-500">Online</span>
                    ) : (
                      `Last seen ${currentConversation.participant.lastSeen || 'recently'}`
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Info className="w-5 h-5" />
                </Button>
                <Dropdown items={menuItems} align="right">
                  <button className="p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </Dropdown>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageList
                messages={messages}
                currentUserId="current-user"
                typingUsers={
                  currentConversation.isTyping
                    ? [{ id: currentConversation.participant.id, name: currentConversation.participant.name }]
                    : []
                }
                isLoading={isLoading}
                onReply={(message) => setReplyTo(message)}
                onEdit={(messageId, content) => console.log('Edit:', messageId, content)}
                onDelete={(messageId) => console.log('Delete:', messageId)}
                onReact={(messageId, emoji) => console.log('React:', messageId, emoji)}
              />
            </div>

            {/* Message Input */}
            <MessageInput
              onSend={handleSendMessage}
              onTyping={() => {}}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              placeholder={`Message ${currentConversation.participant.name}`}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-surface-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                Your Messages
              </h3>
              <p className="mt-1 mb-4">
                Send private messages to colleagues
              </p>
              <Button onClick={() => setShowNewMessage(true)}>
                Start a Conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Sidebar - shown on larger screens */}
      {currentConversation && (
        <div className="w-72 flex-shrink-0 hidden xl:block border-l border-surface-200 dark:border-surface-700 p-6 overflow-y-auto">
          <div className="text-center mb-6">
            <Avatar
              src={currentConversation.participant.avatar}
              name={currentConversation.participant.name}
              size="xl"
              className="mx-auto mb-4"
            />
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              {currentConversation.participant.name}
            </h3>
            <p className="text-sm text-surface-500">
              {currentConversation.participant.title || 'Civil Servant'}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              {currentConversation.participant.mda || 'OHCS'}
            </p>
          </div>

          <div className="space-y-4">
            <Button variant="outline" fullWidth leftIcon={<User className="w-4 h-4" />}>
              View Profile
            </Button>

            <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
              <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                Shared Media
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {/* Placeholder for shared media */}
                <div className="aspect-square bg-surface-100 dark:bg-surface-700 rounded-lg" />
                <div className="aspect-square bg-surface-100 dark:bg-surface-700 rounded-lg" />
                <div className="aspect-square bg-surface-100 dark:bg-surface-700 rounded-lg" />
              </div>
            </div>

            <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
              <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                Shared Files
              </h4>
              <p className="text-sm text-surface-500">No shared files</p>
            </div>
          </div>
        </div>
      )}

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        users={availableUsers}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}
