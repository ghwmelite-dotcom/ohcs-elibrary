import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Hash,
  Users,
  Settings,
  Info,
  Search,
  Phone,
  Video,
  Pin,
  MoreVertical,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import {
  RoomList,
  OnlineUsers,
  MessageList,
  MessageInput,
} from '@/components/chat';
import { Avatar, AvatarGroup } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/shared/Input';
import { cn } from '@/utils/cn';

export default function Chat() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    rooms,
    messages,
    currentRoom,
    fetchRooms,
    fetchMessages,
    setCurrentRoom,
    sendMessage,
    isLoading,
  } = useChatStore();

  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (roomId) {
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        setCurrentRoom(room);
        fetchMessages(roomId);
      }
    } else if (rooms.length > 0) {
      navigate(`/chat/${rooms[0].id}`, { replace: true });
    }
  }, [roomId, rooms, setCurrentRoom, fetchMessages, navigate]);

  const handleSendMessage = (content: string, attachments?: File[]) => {
    if (!currentRoom) return;
    sendMessage(currentRoom.id, content);
    setReplyTo(null);
  };

  // Mock online users
  const onlineUsers = [
    { id: '1', name: 'Kwame Asante', status: 'online' },
    { id: '2', name: 'Ama Serwaa', status: 'online' },
    { id: '3', name: 'Kofi Mensah', status: 'away' },
    { id: '4', name: 'Akua Owusu', status: 'online' },
    { id: '5', name: 'Yaw Boateng', status: 'away' },
  ];

  const roomMenuItems = [
    { label: 'Room Settings', icon: Settings, onClick: () => {} },
    { label: 'Pinned Messages', icon: Pin, onClick: () => {} },
    { label: 'Room Info', icon: Info, onClick: () => setShowRoomInfo(true) },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden bg-white dark:bg-surface-800 shadow-elevation-2">
      {/* Room List Sidebar */}
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-3">
                {currentRoom.avatar ? (
                  <Avatar src={currentRoom.avatar} name={currentRoom.name} size="md" />
                ) : (
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Hash className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                    {currentRoom.name}
                  </h2>
                  <p className="text-sm text-surface-500">
                    {currentRoom.memberCount} members
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Search className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowRoomInfo(true)}>
                  <Users className="w-5 h-5" />
                </Button>
                <Dropdown items={roomMenuItems} align="right">
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
                typingUsers={currentRoom.typingUsers?.map((name) => ({ id: name, name }))}
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
              placeholder={`Message #${currentRoom.name}`}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-surface-500">
            <div className="text-center">
              <Hash className="w-16 h-16 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                Select a chat room
              </h3>
              <p className="mt-1">Choose a room from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Online Users Sidebar */}
      <div className="w-64 flex-shrink-0 hidden xl:block border-l border-surface-200 dark:border-surface-700 p-4 overflow-y-auto">
        <OnlineUsers users={onlineUsers} />
      </div>

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
              {currentRoom.avatar ? (
                <Avatar src={currentRoom.avatar} name={currentRoom.name} size="xl" />
              ) : (
                <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <Hash className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                  {currentRoom.name}
                </h3>
                <p className="text-surface-500">{currentRoom.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
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
              <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {onlineUsers.filter((u) => u.status === 'online').length}
                </p>
                <p className="text-sm text-surface-500">Online</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-3">
                Members
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {onlineUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50"
                  >
                    <Avatar
                      name={user.name}
                      size="sm"
                      showStatus
                      status={user.status as 'online' | 'away' | 'offline'}
                    />
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      {user.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
          <Input label="Room Name" placeholder="Enter room name" />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Description
            </label>
            <textarea
              placeholder="What's this room about?"
              className={cn(
                'w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'resize-none h-24'
              )}
            />
          </div>
          <div>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded border-surface-300" />
              <span className="text-sm text-surface-700 dark:text-surface-300">
                Make this room private
              </span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateRoom(false)}>
              Cancel
            </Button>
            <Button>Create Room</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
