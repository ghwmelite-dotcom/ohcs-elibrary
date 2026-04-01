/**
 * Global Search Component
 * A beautiful Command+K style search modal accessible from anywhere
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  FileText,
  MessageSquare,
  User,
  Users,
  Calendar,
  GraduationCap,
  Newspaper,
  ArrowRight,
  Clock,
  TrendingUp,
  Loader2,
  Command,
  Hash,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

// Helper to make authenticated fetch requests
async function fetchAPI<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('auth-token');
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

interface SearchResult {
  id: string;
  type: 'document' | 'topic' | 'user' | 'group' | 'event' | 'course' | 'news';
  title: string;
  description: string;
  url: string;
  metadata: Record<string, any>;
  score: number;
  highlights: string[];
  createdAt: string;
}

interface SearchResponse {
  query: string;
  total: number;
  counts: Record<string, number>;
  results: SearchResult[];
}

const typeConfig = {
  document: { icon: FileText, label: 'Document', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/30' },
  topic: { icon: MessageSquare, label: 'Discussion', color: 'text-secondary-600 dark:text-secondary-400', bg: 'bg-secondary-50 dark:bg-secondary-900/30' },
  user: { icon: User, label: 'Person', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  group: { icon: Users, label: 'Group', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  event: { icon: Calendar, label: 'Event', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  course: { icon: GraduationCap, label: 'Course', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  news: { icon: Newspaper, label: 'News', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30' },
};

const quickLinks = [
  { label: 'Documents', path: '/library', icon: FileText, shortcut: 'G L' },
  { label: 'Forum', path: '/forum', icon: MessageSquare, shortcut: 'G F' },
  { label: 'Courses', path: '/courses', icon: GraduationCap, shortcut: 'G C' },
  { label: 'Calendar', path: '/calendar', icon: Calendar, shortcut: 'G E' },
  { label: 'Groups', path: '/groups', icon: Users, shortcut: 'G G' },
  { label: 'News', path: '/news', icon: Newspaper, shortcut: 'G N' },
];

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Open modal listener
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('ohcs:open-search', handleOpen);
    return () => window.removeEventListener('ohcs:open-search', handleOpen);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadRecentSearches();
    } else {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch {
      // Ignore errors
    }
  };

  // Save search to recent
  const saveToRecent = (searchQuery: string) => {
    try {
      const current = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [searchQuery, ...current.filter((q: string) => q !== searchQuery)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      setRecentSearches(updated.slice(0, 5));
    } catch {
      // Ignore errors
    }
  };

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchAPI<SearchResponse>(`/search?q=${encodeURIComponent(searchQuery)}&limit=15`);
      setResults(response.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetchAPI<{ suggestions: string[] }>(`/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      setSuggestions(response.suggestions || []);
    } catch {
      // Ignore errors
    }
  }, []);

  // Handle query change with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
        fetchSuggestions(query);
      }, 300);
    } else {
      setResults([]);
      setSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch, fetchSuggestions]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const itemCount = results.length > 0 ? results.length : quickLinks.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % itemCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + itemCount) % itemCount);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        handleSelect(results[activeIndex]);
      } else if (!query && quickLinks[activeIndex]) {
        navigate(quickLinks[activeIndex].path);
        setIsOpen(false);
      }
    }
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    saveToRecent(query);
    navigate(result.url);
    setIsOpen(false);
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeItem = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-[101]"
          >
            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden border border-surface-200 dark:border-surface-700">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                <Search className="w-5 h-5 text-surface-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search documents, people, discussions..."
                  className="flex-1 bg-transparent text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none text-lg"
                  autoComplete="off"
                  spellCheck={false}
                />
                {isLoading && (
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                )}
                {query && !isLoading && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-surface-400 bg-surface-100 dark:bg-surface-700 rounded">
                  <span>ESC</span>
                </kbd>
              </div>

              {/* Results Area */}
              <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
                {/* Search Results */}
                {results.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Results
                    </div>
                    {results.map((result, index) => {
                      const config = typeConfig[result.type];
                      const Icon = config.icon;

                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          data-index={index}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                            activeIndex === index
                              ? 'bg-primary-50 dark:bg-primary-900/30'
                              : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                          )}
                        >
                          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
                            {result.type === 'user' && result.metadata?.avatar ? (
                              <img src={result.metadata.avatar} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <Icon className={cn('w-5 h-5', config.color)} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-surface-900 dark:text-surface-50 truncate">
                                {result.title}
                              </span>
                              <span className={cn('text-xs px-1.5 py-0.5 rounded', config.bg, config.color)}>
                                {config.label}
                              </span>
                            </div>
                            <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
                              {result.description}
                            </p>
                          </div>
                          {activeIndex === index && (
                            <ArrowRight className="w-4 h-4 text-primary-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No Results */}
                {query.length >= 2 && !isLoading && results.length === 0 && (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-surface-600 dark:text-surface-400 font-medium">
                      No results found for "{query}"
                    </p>
                    <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">
                      Try different keywords or browse categories below
                    </p>
                  </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && query && (
                  <div className="p-2 border-t border-surface-100 dark:border-surface-700">
                    <div className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Suggestions
                    </div>
                    <div className="flex flex-wrap gap-2 px-3">
                      {suggestions.slice(0, 6).map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setQuery(suggestion)}
                          className="px-3 py-1.5 text-sm bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-lg text-surface-600 dark:text-surface-300 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Searches */}
                {!query && recentSearches.length > 0 && (
                  <div className="p-2 border-t border-surface-100 dark:border-surface-700">
                    <div className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Recent Searches
                    </div>
                    <div className="flex flex-wrap gap-2 px-3">
                      {recentSearches.map((recent, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(recent)}
                          className="px-3 py-1.5 text-sm bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-lg text-surface-600 dark:text-surface-300 transition-colors flex items-center gap-2"
                        >
                          <Clock className="w-3 h-3 text-surface-400" />
                          {recent}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Links (when no query) */}
                {!query && (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5" />
                      Quick Links
                    </div>
                    {quickLinks.map((link, index) => (
                      <button
                        key={link.path}
                        data-index={index}
                        onClick={() => {
                          navigate(link.path);
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                          activeIndex === index
                            ? 'bg-primary-50 dark:bg-primary-900/30'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                          <link.icon className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                        </div>
                        <span className="flex-1 font-medium text-surface-900 dark:text-surface-50">
                          {link.label}
                        </span>
                        <kbd className="hidden sm:block px-2 py-1 text-xs text-surface-400 bg-surface-100 dark:bg-surface-700 rounded">
                          {link.shortcut}
                        </kbd>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
                <div className="flex items-center justify-between text-xs text-surface-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-200 dark:bg-surface-700 rounded">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-surface-200 dark:bg-surface-700 rounded">↓</kbd>
                      <span className="ml-1">to navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-surface-200 dark:bg-surface-700 rounded">↵</kbd>
                      <span className="ml-1">to select</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Command className="w-3 h-3" />
                    <span>K to open anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default GlobalSearch;
