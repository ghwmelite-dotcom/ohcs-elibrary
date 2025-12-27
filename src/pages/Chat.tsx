import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  Users,
  Settings,
  Info,
  Search,
  Pin,
  MoreVertical,
  MessageSquare,
  Phone,
  Video,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useCallStore, CallType } from '@/stores/callStore';
import {
  RoomList,
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
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/shared/Input';
import { cn } from '@/utils/cn';

export default function Chat() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    rooms,
    messages,
    currentRoom,
    roomMembers,
    fetchRooms,
    fetchMessages,
    fetchRoomMembers,
    setCurrentRoom,
    sendMessage,
    createRoom,
    isLoading,
  } = useChatStore();

  const {
    activeCall,
    startCall,
    endCall,
  } = useCallStore();

  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showPreCallSetup, setShowPreCallSetup] = useState(false);
  const [pendingCallType, setPendingCallType] = useState<CallType>('audio');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileMembers, setShowMobileMembers] = useState(false);

  // Open pre-call setup modal
  const handleOpenPreCallSetup = (type: CallType) => {
    if (!currentRoom) return;
    setPendingCallType(type);
    setShowPreCallSetup(true);
  };

  // Actually start the call after pre-call setup
  const handleConfirmStartCall = async () => {
    if (!currentRoom) return;
    setShowPreCallSetup(false);

    try {
      // Create participants from room members (excluding current user)
      const participants = roomMembers
        .filter((member) => member.id !== user?.id)
        .map((member) => ({
          id: member.id,
          displayName: member.displayName || member.name || 'Unknown',
          avatar: member.avatar,
          isMuted: false,
          isVideoOff: pendingCallType === 'audio',
          isSpeaking: false,
        }));

      // If no other participants, add room name as the call target
      if (participants.length === 0) {
        participants.push({
          id: 'room-call',
          displayName: currentRoom.name,
          avatar: undefined,
          isMuted: false,
          isVideoOff: pendingCallType === 'audio',
          isSpeaking: false,
        });
      }

      await startCall({
        type: pendingCallType,
        roomId: currentRoom.id,
        roomName: currentRoom.name,
        participants,
      });

      setShowCallModal(true);

      // When call connects, show full video call view for video calls
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
      // The error is already handled in the call store and shown in the UI
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

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (roomId) {
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        setCurrentRoom(room);
        fetchMessages(roomId);
        fetchRoomMembers(roomId);
      }
    } else if (rooms.length > 0) {
      navigate(`/chat/${rooms[0].id}`, { replace: true });
    }
  }, [roomId, rooms, setCurrentRoom, fetchMessages, fetchRoomMembers, navigate]);

  const handleSendMessage = (content: string, _attachments?: File[]) => {
    if (!currentRoom) return;
    sendMessage(currentRoom.id, content);
    setReplyTo(null);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    const room = await createRoom({
      name: newRoomName.trim(),
      description: newRoomDescription.trim() || undefined,
      type: newRoomPrivate ? 'private' : 'public',
    });

    if (room) {
      setShowCreateRoom(false);
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomPrivate(false);
      navigate(`/chat/${room.id}`);
    }
  };

  const roomMenuItems = [
    { label: 'Room Settings', icon: Settings, onClick: () => {} },
    { label: 'Pinned Messages', icon: Pin, onClick: () => {} },
    { label: 'Room Info', icon: Info, onClick: () => setShowRoomInfo(true) },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden bg-white dark:bg-surface-800 shadow-elevation-2 relative">
      {/* Mobile Room List Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-surface-800 z-50 lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
                <h2 className="font-semibold text-surface-900 dark:text-surface-50">Chat Rooms</h2>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
              <RoomList
                rooms={rooms}
                currentRoomId={currentRoom?.id}
                onCreateRoom={() => {
                  setShowCreateRoom(true);
                  setShowMobileSidebar(false);
                }}
                onRoomSelect={() => setShowMobileSidebar(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Members Overlay */}
      <AnimatePresence>
        {showMobileMembers && currentRoom && roomMembers.length > 0 && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMembers(false)}
              className="fixed inset-0 bg-black/50 z-40 xl:hidden"
            />
            {/* Members Panel */}
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-surface-800 z-50 xl:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Members ({roomMembers.length})
                </h3>
                <button
                  onClick={() => setShowMobileMembers(false)}
                  className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto h-[calc(100%-65px)]">
                <div className="space-y-2">
                  {roomMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50"
                    >
                      <Avatar name={member.displayName} src={member.avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
                          {member.displayName}
                        </p>
                        {member.role !== 'member' && (
                          <p className="text-xs text-surface-500 capitalize">{member.role}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Room List Sidebar - Desktop */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <RoomList
          rooms={rooms}
          currentRoomId={currentRoom?.id}
          onCreateRoom={() => setShowCreateRoom(true)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-b border-surface-200 dark:border-surface-700 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden p-1.5 sm:p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors flex-shrink-0"
                >
                  <Menu className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                </button>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-surface-900 dark:text-surface-50 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                    {currentRoom.name}
                  </h2>
                  <p className="text-xs text-surface-500 hidden sm:block">
                    {currentRoom.memberCount} members
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" className="p-1.5 sm:p-2 hidden sm:flex">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenPreCallSetup('audio')}
                  title="Start voice call"
                  className="hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 p-1.5 sm:p-2"
                >
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenPreCallSetup('video')}
                  title="Start video call"
                  className="hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-1.5 sm:p-2"
                >
                  <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // On mobile, open mobile members panel; on desktop, show room info modal
                    if (window.innerWidth < 1280) {
                      setShowMobileMembers(true);
                    } else {
                      setShowRoomInfo(true);
                    }
                  }}
                  className="p-1.5 sm:p-2"
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Dropdown items={roomMenuItems} align="right">
                  <button className="p-1.5 sm:p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </Dropdown>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageList
                messages={messages}
                currentUserId={user?.id || ''}
                typingUsers={[]}
                isLoading={isLoading}
                onReply={(message) => setReplyTo(message)}
                onEdit={(messageId, content) => useChatStore.getState().editMessage(messageId, content)}
                onDelete={(messageId) => useChatStore.getState().deleteMessage(messageId)}
                onReact={(messageId, emoji) => useChatStore.getState().addReaction(messageId, emoji)}
              />
            </div>

            {/* Message Input */}
            <MessageInput
              onSend={handleSendMessage}
              onTyping={() => {}}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              placeholder={`Message #${currentRoom.name}`}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-surface-500">
            <div className="text-center">
              {rooms.length === 0 ? (
                <>
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    No chat rooms yet
                  </h3>
                  <p className="mt-1 mb-4">Create a room to start chatting with colleagues</p>
                  <Button onClick={() => setShowCreateRoom(true)}>
                    Create Room
                  </Button>
                </>
              ) : (
                <>
                  <Hash className="w-16 h-16 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    Select a chat room
                  </h3>
                  <p className="mt-1">Choose a room from the sidebar to start chatting</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Members Sidebar - Only show if room has members */}
      {currentRoom && roomMembers.length > 0 && (
        <div className="w-64 flex-shrink-0 hidden xl:block border-l border-surface-200 dark:border-surface-700 p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members ({roomMembers.length})
            </h3>
          </div>
          <div className="space-y-2">
            {roomMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50"
              >
                <Avatar name={member.displayName} src={member.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
                    {member.displayName}
                  </p>
                  {member.role !== 'member' && (
                    <p className="text-xs text-surface-500 capitalize">{member.role}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Info Modal */}
      <Modal
        isOpen={showRoomInfo}
        onClose={() => setShowRoomInfo(false)}
        title="Room Information"
        size="md"
      >
        {currentRoom && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Hash className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                  {currentRoom.name}
                </h3>
                <p className="text-surface-500">{currentRoom.description || 'No description'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {currentRoom.memberCount}
                </p>
                <p className="text-sm text-surface-500">Members</p>
              </div>
              <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {messages.length}
                </p>
                <p className="text-sm text-surface-500">Messages</p>
              </div>
            </div>

            {roomMembers.length > 0 && (
              <div>
                <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-3">
                  Members ({roomMembers.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {roomMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50"
                    >
                      <Avatar name={member.displayName} src={member.avatar} size="sm" />
                      <div className="flex-1">
                        <span className="text-sm text-surface-700 dark:text-surface-300">
                          {member.displayName}
                        </span>
                        {member.role !== 'member' && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full capitalize">
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        title="Create Chat Room"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Room Name"
            placeholder="Enter room name"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Description
            </label>
            <textarea
              placeholder="What's this room about?"
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              className={cn(
                'w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'resize-none h-24'
              )}
            />
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newRoomPrivate}
                onChange={(e) => setNewRoomPrivate(e.target.checked)}
                className="w-4 h-4 rounded border-surface-300"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">
                Make this room private
              </span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateRoom(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRoom} disabled={!newRoomName.trim()}>
              Create Room
            </Button>
          </div>
        </div>
      </Modal>

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
        roomName={currentRoom?.name || 'Call'}
        participantName={roomMembers.find((m) => m.id !== user?.id)?.displayName}
        participantAvatar={roomMembers.find((m) => m.id !== user?.id)?.avatar}
      />
    </div>
  );
}
