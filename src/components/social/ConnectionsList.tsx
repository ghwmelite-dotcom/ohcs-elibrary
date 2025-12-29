import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Loader2, Search, Clock, Check, X } from 'lucide-react';
import { useSocialStore } from '@/stores/socialStore';
import { UserConnection } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';

type TabType = 'connections' | 'pending' | 'sent';

interface ConnectionsListProps {
  title?: string;
  showTabs?: boolean;
  showSearch?: boolean;
  className?: string;
}

export function ConnectionsList({
  title = 'Connections',
  showTabs = true,
  showSearch = true,
  className,
}: ConnectionsListProps) {
  const {
    connections,
    pendingRequests,
    sentRequests,
    connectionsLoading,
    fetchConnections,
    fetchPendingRequests,
    fetchSentRequests,
    respondToRequest,
    removeConnection,
  } = useSocialStore();

  const [activeTab, setActiveTab] = useState<TabType>('connections');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();
    fetchSentRequests();
  }, [fetchConnections, fetchPendingRequests, fetchSentRequests]);

  const handleRespond = async (userId: string, accept: boolean) => {
    setProcessingId(userId);
    await respondToRequest(userId, accept);
    setProcessingId(null);
  };

  const handleRemove = async (userId: string) => {
    if (window.confirm('Remove this connection?')) {
      setProcessingId(userId);
      await removeConnection(userId);
      setProcessingId(null);
    }
  };

  const getDisplayList = (): UserConnection[] => {
    let list: UserConnection[] = [];
    switch (activeTab) {
      case 'connections':
        list = connections;
        break;
      case 'pending':
        list = pendingRequests;
        break;
      case 'sent':
        list = sentRequests;
        break;
    }

    if (searchQuery) {
      list = list.filter((c) =>
        c.user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list;
  };

  const displayList = getDisplayList();
  const isLoading = connectionsLoading && displayList.length === 0;

  const tabs = [
    { id: 'connections' as TabType, label: 'Connections', count: connections.length },
    { id: 'pending' as TabType, label: 'Pending', count: pendingRequests.length },
    { id: 'sent' as TabType, label: 'Sent', count: sentRequests.length },
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary-600" />
          {title}
        </h3>
      </div>

      {showTabs && (
        <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeTab === tab.id
                  ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {showSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search connections..."
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg',
              'bg-surface-50 dark:bg-surface-900',
              'border border-surface-200 dark:border-surface-700',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
              'placeholder-surface-400 text-surface-900 dark:text-surface-100',
              'text-sm'
            )}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-8">
          <Link2 className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
          <p className="text-surface-500">
            {searchQuery
              ? 'No connections found'
              : activeTab === 'pending'
              ? 'No pending requests'
              : activeTab === 'sent'
              ? 'No sent requests'
              : 'No connections yet'}
          </p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          {displayList.map((connection, index) => (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1',
                'border border-surface-200 dark:border-surface-700 p-4'
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={connection.user?.avatar}
                  name={connection.user?.displayName || 'User'}
                  size="md"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                    {connection.user?.displayName || 'User'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-surface-500">
                    <span className="capitalize">{connection.connectionType}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(connection.requestedAt || connection.createdAt || '')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'pending' && (
                    <>
                      <button
                        onClick={() => handleRespond(connection.userId, true)}
                        disabled={processingId === connection.userId}
                        className={cn(
                          'p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors',
                          processingId === connection.userId && 'opacity-50'
                        )}
                      >
                        {processingId === connection.userId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRespond(connection.userId, false)}
                        disabled={processingId === connection.userId}
                        className="p-2 rounded-lg bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-error-100 hover:text-error-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {activeTab === 'connections' && (
                    <button
                      onClick={() => handleRemove(connection.connectedUserId || connection.userId)}
                      disabled={processingId === connection.userId}
                      className="px-3 py-1.5 text-sm text-surface-600 dark:text-surface-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}

                  {activeTab === 'sent' && (
                    <span className="px-3 py-1.5 text-xs bg-surface-100 dark:bg-surface-700 text-surface-500 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
