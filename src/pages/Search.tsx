import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon,
  FileText,
  MessageSquare,
  Users,
  Newspaper,
  User,
  X,
  Clock,
  Trash2,
} from 'lucide-react';
import { useSearchStore } from '@/stores/searchStore';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

type SearchCategory = 'all' | 'documents' | 'forum' | 'groups' | 'news' | 'users';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(query);
  const [category, setCategory] = useState<SearchCategory>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    results,
    total,
    isSearching,
    suggestedQueries,
    history,
    search,
    fetchSuggestions,
    fetchRecentSearches,
    saveSearchHistory,
    clearHistory,
    removeFromHistory,
  } = useSearchStore();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Fetch recent searches on mount (if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentSearches();
    }
  }, [isAuthenticated, fetchRecentSearches]);

  // Run search when query param changes
  useEffect(() => {
    if (query) {
      search(query).then(() => {
        // Save to history after search completes
        const state = useSearchStore.getState();
        if (isAuthenticated) {
          saveSearchHistory(query, state.total);
        }
      });
    }
  }, [query]);

  // Debounced suggestions on input change
  const handleInputChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.trim().length >= 2) {
        debounceRef.current = setTimeout(() => {
          fetchSuggestions(value.trim());
          setShowSuggestions(true);
        }, 300);
      } else {
        setShowSuggestions(false);
      }
    },
    [fetchSuggestions]
  );

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setSearchParams({ q: suggestion });
  };

  const handleRecentClick = (recentQuery: string) => {
    setSearchQuery(recentQuery);
    setSearchParams({ q: recentQuery });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'topic': return MessageSquare;
      case 'post': return MessageSquare;
      case 'group': return Users;
      case 'news': return Newspaper;
      case 'user': return User;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'primary';
      case 'topic': return 'secondary';
      case 'post': return 'secondary';
      case 'group': return 'accent';
      case 'news': return 'warning';
      case 'user': return 'info';
      default: return 'default';
    }
  };

  const filteredResults = category === 'all'
    ? results
    : results.filter((r) => {
        switch (category) {
          case 'documents': return r.type === 'document';
          case 'forum': return r.type === 'topic' || r.type === 'post';
          case 'groups': return r.type === 'group';
          case 'news': return r.type === 'news';
          case 'users': return r.type === 'user';
          default: return true;
        }
      });

  const tabs = [
    { id: 'all', label: 'All Results', count: results.length },
    { id: 'documents', label: 'Documents', count: results.filter((r) => r.type === 'document').length },
    { id: 'forum', label: 'Forum', count: results.filter((r) => r.type === 'topic' || r.type === 'post').length },
    { id: 'groups', label: 'Groups', count: results.filter((r) => r.type === 'group').length },
    { id: 'news', label: 'News', count: results.filter((r) => r.type === 'news').length },
    { id: 'users', label: 'Users', count: results.filter((r) => r.type === 'user').length },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length >= 2 && suggestedQueries.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Search documents, forum topics, groups, news..."
            className={cn(
              'w-full pl-12 pr-12 py-4 bg-white dark:bg-surface-800 rounded-xl shadow-elevation-2',
              'text-lg text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
              'border border-surface-200 dark:border-surface-700',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Autocomplete suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestedQueries.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 top-full mt-2 w-full bg-white dark:bg-surface-800 rounded-xl shadow-elevation-3 border border-surface-200 dark:border-surface-700 overflow-hidden"
              >
                {suggestedQueries.map((suggestion, i) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      'w-full text-left px-4 py-3 flex items-center gap-3 text-sm',
                      'hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors',
                      'text-surface-700 dark:text-surface-300'
                    )}
                  >
                    <SearchIcon className="w-4 h-4 text-surface-400 flex-shrink-0" />
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {query && (
          <p className="mt-4 text-surface-600 dark:text-surface-400">
            {isSearching ? (
              'Searching...'
            ) : (
              <>
                Found <span className="font-semibold">{total}</span> results for{' '}
                <span className="font-semibold text-surface-900 dark:text-surface-50">"{query}"</span>
              </>
            )}
          </p>
        )}
      </div>

      {/* Results */}
      {query ? (
        <>
          {/* Category Tabs */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategory(tab.id as SearchCategory)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                    category === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn(
                      'ml-2 px-1.5 py-0.5 rounded text-xs',
                      category === tab.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-200 dark:bg-surface-700'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredResults.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="w-full h-full" />}
              title="No results found"
              description={`We couldn't find anything matching "${query}" in ${category === 'all' ? 'any category' : category}`}
              action={{
                label: 'Clear filters',
                onClick: () => setCategory('all'),
              }}
            />
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result, index) => {
                const Icon = getIcon(result.type);

                return (
                  <motion.div
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={result.url}
                      className="block bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600"
                    >
                      <div className="flex gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                          result.type === 'document' && 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
                          (result.type === 'topic' || result.type === 'post') && 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
                          result.type === 'group' && 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
                          result.type === 'news' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                          result.type === 'user' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                        )}>
                          {result.type === 'user' ? (
                            <Avatar name={result.title} size="md" />
                          ) : (
                            <Icon className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getTypeColor(result.type) as any} size="sm">
                              {result.type}
                            </Badge>
                            {result.score > 0 && (
                              <span className="text-xs text-surface-400">
                                {Math.round(result.score * 100)}% match
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">
                            {result.title}
                          </h3>
                          <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                            {result.description}
                          </p>
                          {/* Highlight snippets */}
                          {result.highlights && result.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {result.highlights.map((highlight, hi) => (
                                <span
                                  key={hi}
                                  className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                                >
                                  {highlight}
                                </span>
                              ))}
                            </div>
                          )}
                          {result.metadata && Object.keys(result.metadata).length > 0 && (
                            <div className="flex gap-4 mt-2 text-xs text-surface-500">
                              {Object.entries(result.metadata).map(([key, value]) => (
                                <span key={key} className="capitalize">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          {/* Recent Searches */}
          {isAuthenticated && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-surface-400" />
                  Recent Searches
                </h2>
                <button
                  onClick={clearHistory}
                  className="text-sm text-surface-500 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </button>
              </div>
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-white dark:bg-surface-800 rounded-xl px-4 py-3 border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all"
                  >
                    <button
                      onClick={() => handleRecentClick(item.query)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      <Clock className="w-4 h-4 text-surface-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-50 block truncate">
                          {item.query}
                        </span>
                        <span className="text-xs text-surface-400">
                          {item.resultCount} results &middot;{' '}
                          {formatDistanceToNow(new Date(item.searchedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => removeFromHistory(item.id)}
                      className="p-1 text-surface-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                      aria-label="Remove from history"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty state when no query and no history */}
          {(!isAuthenticated || history.length === 0) && (
            <EmptyState
              icon={<SearchIcon className="w-full h-full" />}
              title="Search the platform"
              description="Find documents, forum discussions, groups, news articles, and colleagues"
            />
          )}
        </div>
      )}
    </div>
  );
}
