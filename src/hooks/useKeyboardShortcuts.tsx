import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

interface ShortcutAction {
  action: string;
  handler: () => void;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { shortcuts, fetchShortcuts } = useSettingsStore();
  const { toggleTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const lastKeyRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Define action handlers
  const getActionHandlers = useCallback((): Record<string, () => void> => ({
    // Navigation
    go_home: () => navigate('/dashboard'),
    go_library: () => navigate('/library'),
    go_forum: () => navigate('/forum'),
    go_chat: () => navigate('/chat'),
    go_groups: () => navigate('/groups'),
    go_settings: () => navigate('/settings'),
    go_notifications: () => navigate('/notifications'),

    // General
    search: () => {
      // Find and focus the search input or open search modal
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      } else {
        // Trigger global search modal
        window.dispatchEvent(new CustomEvent('ohcs:open-search'));
      }
    },
    toggle_theme: () => toggleTheme(),
    toggle_sidebar: () => {
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    },
    show_shortcuts: () => {
      navigate('/settings?section=shortcuts');
    },
    escape: () => {
      // Close any open modal or dropdown
      window.dispatchEvent(new CustomEvent('close-modal'));
      // Blur active element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },

    // Documents
    new_document: () => {
      window.dispatchEvent(new CustomEvent('upload-document'));
    },
    download_document: () => {
      window.dispatchEvent(new CustomEvent('download-document'));
    },
    zoom_in: () => {
      window.dispatchEvent(new CustomEvent('zoom-document', { detail: { direction: 'in' } }));
    },
    zoom_out: () => {
      window.dispatchEvent(new CustomEvent('zoom-document', { detail: { direction: 'out' } }));
    },
    zoom_reset: () => {
      window.dispatchEvent(new CustomEvent('zoom-document', { detail: { direction: 'reset' } }));
    },

    // Forum
    new_post: () => {
      window.dispatchEvent(new CustomEvent('new-forum-post'));
    },
    reply: () => {
      window.dispatchEvent(new CustomEvent('reply-to-post'));
    },
    upvote: () => {
      window.dispatchEvent(new CustomEvent('upvote-post'));
    },
    bookmark: () => {
      window.dispatchEvent(new CustomEvent('bookmark-post'));
    },

    // Chat
    focus_message: () => {
      const messageInput = document.querySelector('[data-message-input]') as HTMLInputElement;
      if (messageInput) {
        messageInput.focus();
      }
    },
    emoji_picker: () => {
      window.dispatchEvent(new CustomEvent('toggle-emoji-picker'));
    },
  }), [navigate, toggleTheme]);

  // Parse shortcut string to match format
  const parseShortcut = useCallback((shortcut: string): { modifiers: string[], key: string } => {
    const parts = shortcut.split('+').map(p => p.trim().toLowerCase());
    const modifiers: string[] = [];
    let key = '';

    for (const part of parts) {
      if (['ctrl', 'control', 'cmd', 'command', 'meta'].includes(part)) {
        modifiers.push('ctrl');
      } else if (['shift'].includes(part)) {
        modifiers.push('shift');
      } else if (['alt', 'option'].includes(part)) {
        modifiers.push('alt');
      } else {
        key = part;
      }
    }

    return { modifiers, key };
  }, []);

  // Check if event matches shortcut
  const matchesShortcut = useCallback((e: KeyboardEvent, shortcut: string): boolean => {
    const { modifiers, key } = parseShortcut(shortcut);

    // Check modifiers
    const ctrlMatch = modifiers.includes('ctrl') === (e.ctrlKey || e.metaKey);
    const shiftMatch = modifiers.includes('shift') === e.shiftKey;
    const altMatch = modifiers.includes('alt') === e.altKey;

    // Check key
    const pressedKey = e.key.toLowerCase();
    const keyMatch = pressedKey === key ||
                     e.code.toLowerCase().replace('key', '') === key ||
                     e.code.toLowerCase().replace('digit', '') === key;

    return ctrlMatch && shiftMatch && altMatch && keyMatch;
  }, [parseShortcut]);

  // Check for two-key sequence (like G H for go_home)
  const checkSequence = useCallback((e: KeyboardEvent, shortcut: string): boolean => {
    const parts = shortcut.split(' ');
    if (parts.length !== 2) return false;

    const now = Date.now();
    const timeDiff = now - lastKeyTimeRef.current;
    const pressedKey = e.key.toUpperCase();

    // Check if this is the second key in a sequence
    if (timeDiff < 1000 && lastKeyRef.current === parts[0].toUpperCase() && pressedKey === parts[1].toUpperCase()) {
      lastKeyRef.current = '';
      lastKeyTimeRef.current = 0;
      return true;
    }

    // Check if this could be the first key in a sequence
    if (pressedKey === parts[0].toUpperCase()) {
      lastKeyRef.current = pressedKey;
      lastKeyTimeRef.current = now;
    }

    return false;
  }, []);

  // Main keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
                         target.isContentEditable;

    // Allow escape in input fields
    if (isInputField && e.key !== 'Escape') {
      return;
    }

    // Get enabled shortcuts
    const enabledShortcuts = shortcuts.filter(s => s.isEnabled);
    const actionHandlers = getActionHandlers();

    for (const shortcut of enabledShortcuts) {
      // Check for sequence shortcuts (like "G H")
      if (shortcut.shortcut.includes(' ')) {
        if (checkSequence(e, shortcut.shortcut)) {
          const handler = actionHandlers[shortcut.action];
          if (handler) {
            e.preventDefault();
            handler();
            return;
          }
        }
      } else {
        // Check for combo shortcuts (like "Ctrl+K")
        if (matchesShortcut(e, shortcut.shortcut)) {
          const handler = actionHandlers[shortcut.action];
          if (handler) {
            e.preventDefault();
            handler();
            return;
          }
        }
      }
    }
  }, [shortcuts, getActionHandlers, matchesShortcut, checkSequence]);

  // Fetch shortcuts on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && shortcuts.length === 0) {
      fetchShortcuts();
    }
  }, [isAuthenticated, shortcuts.length, fetchShortcuts]);

  // Add global keyboard listener
  useEffect(() => {
    if (!isAuthenticated) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, handleKeyDown]);

  return null;
}

// Component version for use in JSX
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  return <>{children}</>;
}
