import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useDMStore } from '@/stores/dmStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { ConversationList } from '@/components/dm/ConversationList';
import { DMThread } from '@/components/dm/DMThread';
import { cn } from '@/utils/cn';

export default function DirectMessages() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { fetchConversations, fetchUnreadCount, currentConversation } = useDMStore();
  const { startHeartbeatPolling, stopHeartbeatPolling } = usePresenceStore();

  const [showSidebar, setShowSidebar] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, [fetchConversations, fetchUnreadCount]);

  // Start presence heartbeat
  useEffect(() => {
    startHeartbeatPolling(30000);
    return () => stopHeartbeatPolling();
  }, [startHeartbeatPolling, stopHeartbeatPolling]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [fetchConversations, fetchUnreadCount]);

  // Hide sidebar on mobile when conversation is selected
  useEffect(() => {
    if (userId) {
      setShowSidebar(false);
    }
  }, [userId]);

  const handleSelectConversation = (selectedUserId: string) => {
    navigate(`/messages/${selectedUserId}`);
  };

  const handleBack = () => {
    navigate('/messages');
    setShowSidebar(true);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-surface-50 dark:bg-surface-900 overflow-hidden">
      {/* Conversation List Sidebar */}
      <aside
        className={cn(
          'h-full bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700',
          'flex-shrink-0 overflow-hidden transition-all duration-300',
          // On mobile/tablet: full width when no user selected, hidden when user selected
          // On desktop: always 350px width
          !userId ? 'w-full lg:w-[350px]' : 'hidden lg:block lg:w-[350px]'
        )}
      >
        <ConversationList
          activeConversationId={currentConversation?.id}
          onSelectConversation={handleSelectConversation}
        />
      </aside>

      {/* Main Chat Area */}
      <main className={cn(
        'flex-1 h-full overflow-hidden min-w-0',
        // On mobile/tablet: hidden when no user selected, full width when user selected
        // On desktop: always visible
        !userId ? 'hidden lg:flex' : 'flex'
      )}>
        {userId ? (
          <DMThread
            userId={userId}
            onBack={handleBack}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
                Your Messages
              </h2>
              <p className="text-surface-500 max-w-sm">
                Select a conversation from the sidebar or start a new one to begin messaging
              </p>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
