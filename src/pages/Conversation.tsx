import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

export default function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { directMessages, fetchDirectMessages, sendDirectMessage } = useChatStore();

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock conversation partner
  const partner = {
    id: conversationId || '1',
    name: 'Kwame Asante',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    title: 'Director of IT',
    mda: 'Ministry of Communications',
    status: 'online' as const,
    lastSeen: new Date(),
  };

  // Mock messages
  const messages = [
    {
      id: '1',
      senderId: conversationId,
      content: 'Good morning! Have you reviewed the new policy document?',
      timestamp: new Date(Date.now() - 3600000 * 2),
      read: true,
    },
    {
      id: '2',
      senderId: user?.id || 'current',
      content: 'Yes, I went through it yesterday. The section on data protection looks comprehensive.',
      timestamp: new Date(Date.now() - 3600000 * 1.5),
      read: true,
    },
    {
      id: '3',
      senderId: conversationId,
      content: 'Great! Can you share your feedback in the forum discussion?',
      timestamp: new Date(Date.now() - 3600000),
      read: true,
    },
    {
      id: '4',
      senderId: user?.id || 'current',
      content: "I'll post my comments this afternoon. Also, should we schedule a call to discuss the implementation timeline?",
      timestamp: new Date(Date.now() - 1800000),
      read: true,
    },
    {
      id: '5',
      senderId: conversationId,
      content: 'That would be helpful. How about tomorrow at 10 AM?',
      timestamp: new Date(Date.now() - 600000),
      read: false,
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    // In real implementation: sendDirectMessage(conversationId, newMessage);
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const menuItems = [
    { label: 'View Profile', onClick: () => navigate(`/profile/${conversationId}`) },
    { label: 'Search Messages', onClick: () => {} },
    { label: 'Clear Chat', onClick: () => {}, danger: true },
    { label: 'Block User', onClick: () => {}, danger: true },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-surface-800 rounded-xl overflow-hidden shadow-elevation-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/messages')}
            className="lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Link to={`/profile/${partner.id}`} className="flex items-center gap-3">
            <Avatar
              src={partner.avatar}
              name={partner.name}
              size="md"
              showStatus
              status={partner.status}
            />
            <div>
              <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                {partner.name}
              </h2>
              <p className="text-sm text-surface-500">
                {partner.status === 'online' ? 'Active now' : `Active ${formatDistanceToNow(partner.lastSeen, { addSuffix: true })}`}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-5 h-5" />
          </Button>
          <Dropdown items={menuItems} align="right">
            <button className="p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </Dropdown>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.senderId === user?.id || message.senderId === 'current';
          const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId);

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}
            >
              {!isOwn && (
                <div className="w-8">
                  {showAvatar && (
                    <Avatar src={partner.avatar} name={partner.name} size="sm" />
                  )}
                </div>
              )}
              <div
                className={cn(
                  'max-w-[70%] px-4 py-2 rounded-2xl',
                  isOwn
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-surface-50 rounded-bl-sm'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className={cn(
                  'flex items-center gap-1 mt-1',
                  isOwn ? 'justify-end' : 'justify-start'
                )}>
                  <span className={cn(
                    'text-xs',
                    isOwn ? 'text-primary-200' : 'text-surface-400'
                  )}>
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </span>
                  {isOwn && (
                    message.read ? (
                      <CheckCheck className="w-3.5 h-3.5 text-primary-200" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-primary-200" />
                    )
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2">
            <Avatar src={partner.avatar} name={partner.name} size="sm" />
            <div className="bg-surface-100 dark:bg-surface-700 px-4 py-2 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <ImageIcon className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className={cn(
                'w-full px-4 py-2.5 bg-surface-100 dark:bg-surface-700 rounded-full',
                'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'resize-none'
              )}
            />
          </div>
          <Button variant="ghost" size="sm">
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="rounded-full w-10 h-10 p-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
