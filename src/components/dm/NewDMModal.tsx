import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Users } from 'lucide-react';
import { useSocialStore } from '@/stores/socialStore';
import { Avatar } from '@/components/shared/Avatar';
import { OnlineIndicator } from '@/components/presence/OnlineIndicator';
import { cn } from '@/utils/cn';

interface NewDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export function NewDMModal({ isOpen, onClose, onSelectUser }: NewDMModalProps) {
  const { following, fetchFollowing, followingLoading } = useSocialStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFollowing();
    }
  }, [isOpen, fetchFollowing]);

  const filteredUsers = following.filter((user) =>
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (userId: string) => {
    onSelectUser(userId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal - Bottom sheet on mobile, centered on desktop */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md sm:mx-4 bg-white dark:bg-surface-800 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-surface-200 dark:border-surface-700 overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Mobile drag indicator */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700 shrink-0">
                <h2 className="font-semibold text-base sm:text-lg text-surface-900 dark:text-surface-100">
                  New Message
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-surface-200 dark:active:bg-surface-600 transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              {/* Search */}
              <div className="p-3 sm:p-4 border-b border-surface-200 dark:border-surface-700 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search people..."
                    autoFocus
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
                      'bg-surface-50 dark:bg-surface-900',
                      'border border-surface-200 dark:border-surface-700',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      'placeholder-surface-400 text-surface-900 dark:text-surface-100',
                      'touch-manipulation'
                    )}
                  />
                </div>
              </div>

              {/* User List - Scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {followingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <Users className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                    <p className="text-sm sm:text-base text-surface-500">
                      {searchQuery
                        ? 'No users found'
                        : 'Follow people to message them'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelect(user.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl text-left',
                          'hover:bg-surface-50 dark:hover:bg-surface-700/50',
                          'active:bg-surface-100 dark:active:bg-surface-700',
                          'transition-colors touch-manipulation'
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar
                            src={user.avatar}
                            name={user.displayName || 'User'}
                            size="md"
                          />
                          <OnlineIndicator
                            userId={user.id}
                            className="absolute -bottom-0.5 -right-0.5"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base text-surface-900 dark:text-surface-100 truncate">
                            {user.displayName}
                          </p>
                          {user.title && (
                            <p className="text-xs sm:text-sm text-surface-500 truncate">
                              {user.title}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Safe area for notched devices */}
              <div className="sm:hidden h-safe-area-inset-bottom" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
