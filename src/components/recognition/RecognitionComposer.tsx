import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Award,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle,
  User,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/shared/Avatar';
import { Spinner } from '@/components/shared/Spinner';
import { RecognitionCategoryPicker } from './RecognitionCategoryPicker';
import { useRecognitionStore } from '@/stores/recognitionStore';
import { useAuthStore } from '@/stores/authStore';
import type { RecognitionCategory } from '@/types/recognition';
import { useDebounce } from '@/hooks/useDebounce';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

interface SearchUser {
  id: string;
  displayName: string;
  avatar?: string;
  title?: string;
  department?: string;
}

export function RecognitionComposer() {
  const {
    showComposer,
    closeComposer,
    categories,
    limits,
    isSubmitting,
    error,
    selectedReceiverId,
    selectedReceiverName,
    fetchCategories,
    fetchLimits,
    giveRecognition,
  } = useRecognitionStore();

  const { user: currentUser, token } = useAuthStore();

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<RecognitionCategory | null>(null);
  const [message, setMessage] = useState('');
  const [receiver, setReceiver] = useState<SearchUser | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load categories and limits on mount
  useEffect(() => {
    if (showComposer) {
      if (categories.length === 0) fetchCategories();
      fetchLimits();

      // If a receiver was pre-selected
      if (selectedReceiverId && selectedReceiverName) {
        setReceiver({
          id: selectedReceiverId,
          displayName: selectedReceiverName,
        });
        setShowSearch(false);
      }
    }
  }, [showComposer, categories.length, selectedReceiverId, selectedReceiverName]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `${API_BASE}/social/search?q=${encodeURIComponent(debouncedSearch)}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          // Filter out current user
          setSearchResults(
            (data.users || []).filter((u: SearchUser) => u.id !== currentUser?.id)
          );
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearch, token, currentUser?.id]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!receiver || !selectedCategory || message.length < 10) return;

    const result = await giveRecognition({
      receiverId: receiver.id,
      categoryId: selectedCategory.id,
      message,
      isPublic: true,
    });

    if (result) {
      // Reset form and close
      setSelectedCategory(null);
      setMessage('');
      setReceiver(null);
      setSearchQuery('');
      setShowSearch(true);
    }
  };

  // Reset form when closing
  const handleClose = () => {
    setSelectedCategory(null);
    setMessage('');
    setReceiver(null);
    setSearchQuery('');
    setShowSearch(true);
    closeComposer();
  };

  const canSubmit = receiver && selectedCategory && message.length >= 10 && !isSubmitting;
  const remaining = limits?.remaining ?? 10;

  if (!showComposer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full sm:max-w-lg sm:mx-4 bg-white dark:bg-surface-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Mobile drag indicator */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:p-4 border-b border-surface-200 dark:border-surface-700 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-surface-900 dark:text-white truncate">
                  Give Recognition
                </h2>
                <p className="text-[10px] sm:text-xs text-surface-500 dark:text-surface-400">
                  {remaining} recognition{remaining !== 1 ? 's' : ''} remaining
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-surface-200 dark:active:bg-surface-600 transition-colors touch-manipulation shrink-0"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto overscroll-contain">
            {/* Limit Warning */}
            {remaining === 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Monthly limit reached
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    You've used all your recognitions this month. They will reset next month.
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Step 1: Select Recipient */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Who do you want to recognize?
              </label>

              {receiver && !showSearch ? (
                <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <Avatar
                    src={receiver.avatar}
                    alt={receiver.displayName}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-surface-900 dark:text-white">
                      {receiver.displayName}
                    </p>
                    {receiver.title && (
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {receiver.title}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setReceiver(null);
                      setShowSearch(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                  >
                    <X className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a colleague..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />

                  {/* Search Results */}
                  {(searchResults.length > 0 || isSearching) && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-surface-700 rounded-lg shadow-lg border border-surface-200 dark:border-surface-600 max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 flex items-center justify-center">
                          <Spinner size="sm" />
                        </div>
                      ) : (
                        searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setReceiver(user);
                              setShowSearch(false);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-600 transition-colors"
                          >
                            <Avatar
                              src={user.avatar}
                              alt={user.displayName}
                              size="sm"
                            />
                            <div className="text-left">
                              <p className="font-medium text-surface-900 dark:text-white">
                                {user.displayName}
                              </p>
                              {user.title && (
                                <p className="text-xs text-surface-500 dark:text-surface-400">
                                  {user.title}
                                </p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Select Category */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                What are you recognizing them for?
              </label>
              <RecognitionCategoryPicker
                categories={categories}
                selectedId={selectedCategory?.id || null}
                onSelect={setSelectedCategory}
                disabled={remaining === 0}
              />
            </div>

            {/* Step 3: Write Message */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Share your appreciation
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a meaningful message about why this person deserves recognition..."
                rows={4}
                maxLength={500}
                disabled={remaining === 0}
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none disabled:opacity-50"
              />
              <div className="flex items-center justify-between mt-1">
                <p
                  className={cn(
                    'text-xs',
                    message.length < 10
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-surface-500 dark:text-surface-400'
                  )}
                >
                  {message.length < 10
                    ? `${10 - message.length} more characters needed`
                    : `${message.length}/500 characters`}
                </p>
                {selectedCategory && (
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    <span className="text-amber-600 dark:text-amber-400">
                      +{selectedCategory.xpRewardReceiver} XP
                    </span>{' '}
                    for {receiver?.displayName || 'recipient'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || remaining === 0}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all',
                canSubmit && remaining > 0
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25'
                  : 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Recognition</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
