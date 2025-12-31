/**
 * KwameWidget Component
 * Floating action button with mini-chat for quick AI assistance
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { KwameAvatar } from './KwameAvatar';
import { KwameMiniChat } from './KwameMiniChat';
import { cn } from '@/utils/cn';

export function KwameWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show widget on the Kwame page itself
  const isOnKwamePage = location.pathname === '/kwame';

  // Keyboard shortcut: Ctrl+K or Cmd+K to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        // Don't interfere with browser's address bar shortcut
        if (e.shiftKey) return;

        e.preventDefault();

        if (isOnKwamePage) {
          // If on Kwame page, focus the input
          const input = document.querySelector('textarea[placeholder*="Kwame"]') as HTMLTextAreaElement;
          input?.focus();
        } else {
          setIsOpen((prev) => !prev);
        }
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isOnKwamePage]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleMaximize = useCallback(() => {
    setIsOpen(false);
    navigate('/kwame');
  }, [navigate]);

  // Hide on Kwame page
  if (isOnKwamePage) return null;

  return (
    <>
      {/* Backdrop when mini-chat is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* Widget container */}
      <div data-tour="kwame" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        {/* Mini chat */}
        <AnimatePresence>
          {isOpen && (
            <KwameMiniChat onClose={handleClose} onMaximize={handleMaximize} />
          )}
        </AnimatePresence>

        {/* FAB button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'relative group',
            'w-14 h-14 rounded-full',
            'bg-gradient-to-br from-primary-500 via-primary-600 to-yellow-600',
            'shadow-lg shadow-primary-500/30',
            'hover:shadow-xl hover:shadow-primary-500/40',
            'transition-shadow duration-300',
            'flex items-center justify-center',
            'focus:outline-none focus:ring-4 focus:ring-primary-500/30'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {/* Wisdom sparkle effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(234, 179, 8, 0)',
                '0 0 0 8px rgba(234, 179, 8, 0.2)',
                '0 0 0 0 rgba(234, 179, 8, 0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Icon */}
          {isOpen ? (
            <motion.span
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              className="text-white text-xl"
            >
              &times;
            </motion.span>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              <Sparkles className="w-6 h-6 text-white" />
              {/* Animated sparkle */}
              <motion.span
                className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          )}

          {/* New message indicator */}
          {hasNewMessage && !isOpen && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"
            >
              <span className="text-[10px] text-white font-bold">!</span>
            </motion.span>
          )}
        </motion.button>

        {/* Tooltip on hover */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={cn(
                'absolute right-16 bottom-2',
                'px-3 py-1.5 rounded-lg',
                'bg-surface-900 dark:bg-surface-700 text-white text-sm',
                'whitespace-nowrap',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'pointer-events-none'
              )}
            >
              Ask Kwame
              <span className="ml-2 text-xs text-surface-400">
                Ctrl+K
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
