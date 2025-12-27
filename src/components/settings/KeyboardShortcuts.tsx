import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard,
  Search,
  Edit2,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Command,
  CornerDownLeft
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { KeyboardShortcut } from '@/stores/settingsStore';

interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  isLoading: boolean;
  onUpdate: (action: string, shortcut: string, isEnabled: boolean) => Promise<void>;
  onReset: (action: string) => Promise<void>;
}

// Key display component
function KeyBadge({ keyName }: { keyName: string }) {
  const getIcon = () => {
    switch (keyName.toLowerCase()) {
      case 'cmd':
      case 'command':
        return <Command className="w-3 h-3" />;
      case 'enter':
      case 'return':
        return <CornerDownLeft className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const icon = getIcon();

  return (
    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded text-xs font-medium text-surface-700 dark:text-surface-300 shadow-sm">
      {icon || keyName}
    </span>
  );
}

// Parse shortcut string into keys
function parseShortcut(shortcut: string): string[] {
  return shortcut.split('+').map(k => k.trim());
}

// Shortcut recorder
function ShortcutRecorder({
  currentShortcut,
  onSave,
  onCancel
}: {
  currentShortcut: string;
  onSave: (shortcut: string) => void;
  onCancel: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (recording && inputRef.current) {
      inputRef.current.focus();
    }
  }, [recording]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();

    if (!recording) return;

    const newKeys: string[] = [];

    if (e.ctrlKey || e.metaKey) newKeys.push('Ctrl');
    if (e.shiftKey) newKeys.push('Shift');
    if (e.altKey) newKeys.push('Alt');

    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      newKeys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
    }

    if (newKeys.length > 0) {
      setKeys(newKeys);
    }

    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      setRecording(false);
    }
  };

  const handleSave = () => {
    if (keys.length > 0) {
      onSave(keys.join('+'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        onClick={() => setRecording(true)}
        className={cn(
          'flex-1 flex items-center gap-1 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
          recording
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500'
        )}
      >
        {recording ? (
          <>
            <input
              ref={inputRef}
              type="text"
              className="sr-only"
              onKeyDown={handleKeyDown}
              onBlur={() => setRecording(false)}
            />
            {keys.length > 0 ? (
              <div className="flex items-center gap-1">
                {keys.map((key, i) => (
                  <KeyBadge key={i} keyName={key} />
                ))}
              </div>
            ) : (
              <span className="text-sm text-primary-600 dark:text-primary-400 animate-pulse">
                Press keys...
              </span>
            )}
          </>
        ) : keys.length > 0 ? (
          <div className="flex items-center gap-1">
            {keys.map((key, i) => (
              <KeyBadge key={i} keyName={key} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {parseShortcut(currentShortcut).map((key, i) => (
              <KeyBadge key={i} keyName={key} />
            ))}
          </div>
        )}
      </div>
      <button
        onClick={handleSave}
        disabled={keys.length === 0}
        className="p-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 transition-colors"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={onCancel}
        className="p-2 bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 rounded-lg hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function KeyboardShortcuts({
  shortcuts,
  isLoading,
  onUpdate,
  onReset
}: KeyboardShortcutsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('general');

  // Group shortcuts by category
  const categories = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    general: 'General',
    documents: 'Documents',
    forum: 'Forum',
    chat: 'Chat'
  };

  // Filter shortcuts
  const filteredCategories = Object.entries(categories).reduce((acc, [cat, items]) => {
    const filtered = items.filter(
      s => s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.shortcut.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[cat] = filtered;
    }
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const handleSaveShortcut = async (action: string, shortcut: string) => {
    await onUpdate(action, shortcut, true);
    setEditingAction(null);
  };

  const handleToggle = async (shortcut: KeyboardShortcut) => {
    await onUpdate(shortcut.action, shortcut.shortcut, !shortcut.isEnabled);
  };

  const handleReset = async (action: string) => {
    await onReset(action);
    setEditingAction(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Keyboard Shortcuts</h3>
            <p className="text-sm text-surface-500">Customize your keyboard shortcuts</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {Object.entries(filteredCategories).map(([category, items]) => (
          <div key={category}>
            {/* Category Header */}
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
            >
              <span className="font-medium text-surface-900 dark:text-white">
                {categoryLabels[category] || category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500">{items.length} shortcuts</span>
                {expandedCategory === category ? (
                  <ChevronUp className="w-4 h-4 text-surface-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-surface-400" />
                )}
              </div>
            </button>

            {/* Shortcuts List */}
            <AnimatePresence>
              {expandedCategory === category && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 space-y-2">
                    {items.map((shortcut) => (
                      <div
                        key={shortcut.action}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg transition-colors',
                          shortcut.isEnabled
                            ? 'bg-surface-50 dark:bg-surface-700/50'
                            : 'bg-surface-100 dark:bg-surface-700/30 opacity-60'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium',
                            shortcut.isEnabled
                              ? 'text-surface-900 dark:text-white'
                              : 'text-surface-500'
                          )}>
                            {shortcut.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {editingAction === shortcut.action ? (
                            <ShortcutRecorder
                              currentShortcut={shortcut.shortcut}
                              onSave={(newShortcut) => handleSaveShortcut(shortcut.action, newShortcut)}
                              onCancel={() => setEditingAction(null)}
                            />
                          ) : (
                            <>
                              {/* Shortcut Display */}
                              <div className="flex items-center gap-1">
                                {parseShortcut(shortcut.shortcut).map((key, i) => (
                                  <KeyBadge key={i} keyName={key} />
                                ))}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingAction(shortcut.action)}
                                  className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 rounded transition-colors"
                                  title="Edit shortcut"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {shortcut.isCustom && (
                                  <button
                                    onClick={() => handleReset(shortcut.action)}
                                    className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 rounded transition-colors"
                                    title="Reset to default"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={shortcut.isEnabled}
                                    onChange={() => handleToggle(shortcut)}
                                    className="sr-only"
                                  />
                                  <div className={cn(
                                    'w-9 h-5 rounded-full transition-colors',
                                    shortcut.isEnabled
                                      ? 'bg-primary-600'
                                      : 'bg-surface-300 dark:bg-surface-600'
                                  )}>
                                    <div className={cn(
                                      'w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5',
                                      shortcut.isEnabled && 'translate-x-4'
                                    )} />
                                  </div>
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-surface-50 dark:bg-surface-700/30 border-t border-surface-200 dark:border-surface-700">
        <p className="text-xs text-surface-500 text-center">
          Press <KeyBadge keyName="Ctrl" /> + <KeyBadge keyName="/" /> anywhere to view all shortcuts
        </p>
      </div>
    </div>
  );
}
