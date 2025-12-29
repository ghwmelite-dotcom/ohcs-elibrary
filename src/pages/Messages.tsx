import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Video,
  Info,
  MoreVertical,
  Trash2,
  BellOff,
  Archive,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useCallStore, CallType } from '@/stores/callStore';
import {
  DMList,
  NewMessageModal,
  MessageList,
  MessageInput,
  CallModal,
  IncomingCallNotification,
  VideoCallView,
  PreCallSetup,
} from '@/components/chat';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import type { DirectMessage } from '@/types';

export default function Messages() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    conversations,
    messages,
    fetchConversations,
    fetchDirectMessages,
    sendDirectMessage,
    isLoading,
  } = useChatStore();

  const {
    activeCall,
    startCall,
    endCall,
  } = useCallStore();

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showPreCallSetup, setShowPreCallSetup] = useState(false);
  const [pendingCallType, setPendingCallType] = useState<CallType>('audio');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const currentConversation = conversations.find((c) => c.id === conversationId);

  // Get the first participant (for DMs, there's typically one other participant)
  const currentParticipant = currentConversation?.participants?.[0];

  // Open pre-call setup modal for private calls
  const handleOpenPreCallSetup = (type: CallType) => {
    if (!currentParticipant) return;
    setPendingCallType(type);
    setShowPreCallSetup(true);
  };

  // Start the call after pre-call setup
  const handleConfirmStartCall = async () => {
    if (!currentParticipant || !currentConversation) return;
    setShowPreCallSetup(false);

    try {
      const participant = {
        id: currentParticipant.id,
        displayName: currentParticipant.name || 'Unknown',
        avatar: currentParticipant.avatar,
        isMuted: false,
        isVideoOff: pendingCallType === 'audio',
        isSpeaking: false,
      };

      await startCall({
        type: pendingCallType,
        roomId: currentConversation.id,
        roomName: currentParticipant.name || 'Private Call',
        participants: [participant],
      });

      setShowCallModal(true);

      // For video calls, transition to full video view when connected
      if (pendingCallType === 'video') {
        setTimeout(() => {
          if (useCallStore.getState().activeCall?.status === 'connected') {
            setShowCallModal(false);
            setShowVideoCall(true);
          }
        }, 2500);
      }
    } catch (error: any) {
      console.error('Failed to start call:', error);
    }
  };

  // Watch for call status changes
  useEffect(() => {
    if (activeCall?.status === 'connected' && activeCall.type === 'video' && showCallModal) {
      setShowCallModal(false);
      setShowVideoCall(true);
    }
    if (activeCall?.status === 'ended' || !activeCall) {
      setShowCallModal(false);
      setShowVideoCall(false);
    }
  }, [activeCall?.status, activeCall?.type, showCallModal]);

  // Transform conversations to DirectMessage format for DMList component
  const dmConversations: DirectMessage[] = useMemo(() => {
    return conversations.map((conv) => ({
      id: conv.id,
      conversationId: conv.id,
      senderId: conv.participants?.[0]?.id ?? '',
      receiverId: '',
      content: conv.lastMessage?.content ?? '',
      type: 'text' as const,
      attachments: [],
      isRead: conv.unreadCount === 0,
      createdAt: conv.updatedAt,
      participant: conv.participants?.[0],
      lastMessage: conv.lastMessage?.content,
      lastMessageAt: conv.updatedAt,
      unreadCount: conv.unreadCount,
      isPinned: false,
      isTyping: false,
    }));
  }, [conversations]);

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
          conversations={dmConversations}
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
                  src={currentParticipant?.avatar}
                  name={currentParticipant?.name ?? 'Unknown'}
                  size="md"
                  showStatus
                  status={(currentParticipant?.status as 'online' | 'away' | 'offline') ?? 'offline'}
                />
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                    {currentParticipant?.name ?? 'Unknown'}
                  </h2>
                  <p className="text-sm text-surface-500">
                    {currentParticipant?.status === 'active' ? (
                      <span className="text-success-500">Active</span>
                    ) : (
                      `Last seen ${currentParticipant?.lastLoginAt || 'recently'}`
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenPreCallSetup('audio')}
                  title="Start voice call"
                  className="hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20"
                >
                  <Phone className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenPreCallSetup('video')}
                  title="Start video call"
                  className="hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="hidden sm:flex">
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
                typingUsers={[]}
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
              placeholder={`Message ${currentParticipant?.name ?? 'User'}`}
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
              src={currentParticipant?.avatar}
              name={currentParticipant?.name ?? 'Unknown'}
              size="xl"
              className="mx-auto mb-4"
            />
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              {currentParticipant?.name ?? 'Unknown'}
            </h3>
            <p className="text-sm text-surface-500">
              {currentParticipant?.title || 'Civil Servant'}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              {currentParticipant?.mda?.name || 'OHCS'}
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

      {/* Call Modal - for calling/ringing state */}
      <CallModal
        isOpen={showCallModal}
        onClose={() => {
          endCall();
          setShowCallModal(false);
        }}
      />

      {/* Incoming Call Notification */}
      <AnimatePresence>
        <IncomingCallNotification />
      </AnimatePresence>

      {/* Full Video Call View */}
      <AnimatePresence>
        {showVideoCall && activeCall && (
          <VideoCallView
            onClose={() => {
              endCall();
              setShowVideoCall(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Pre-Call Setup Modal */}
      <PreCallSetup
        isOpen={showPreCallSetup}
        onClose={() => setShowPreCallSetup(false)}
        onStartCall={handleConfirmStartCall}
        callType={pendingCallType}
        roomName={currentParticipant?.name || 'Private Call'}
        participantName={currentParticipant?.name}
        participantAvatar={currentParticipant?.avatar}
      />
    </div>
  );
}
