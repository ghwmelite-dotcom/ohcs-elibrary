import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FolderOpen,
  FileText,
  BookOpen,
  Filter,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useResearchApi } from '@/hooks/useResearchApi';
import { ErrorAlert } from './ErrorAlert';
import type { ResearchSearchResult } from '@/types';

interface ResearchSearchProps {
  onResultClick?: (result: ResearchSearchResult) => void;
}

type FilterType = 'all' | 'project' | 'note' | 'literature';

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'project', label: 'Projects' },
  { value: 'note', label: 'Notes' },
  { value: 'literature', label: 'Literature' },
];

const TYPE_CONFIG: Record<string, { icon: typeof FolderOpen; label: string; color: string }> = {
  project: {
    icon: FolderOpen,
    label: 'Project',
    color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  },
  note: {
    icon: FileText,
    label: 'Note',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  literature: {
    icon: BookOpen,
    label: 'Literature',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
};

export function ResearchSearch({ onResultClick }: ResearchSearchProps) {
  const { authFetch } = useResearchApi();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<ResearchSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce query
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const performSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setTotal(0);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery.trim(),
        limit: '20',
      });
      if (typeFilter !== 'all') {
        params.set('type', typeFilter);
      }

      const response = await authFetch(`/search?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, typeFilter, authFetch]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setTotal(0);
    setHasSearched(false);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Search Input */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 dark:text-surface-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across projects, notes, and literature..."
            className="w-full pl-10 pr-10 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-surface-400 dark:placeholder:text-surface-500"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1 mt-3">
          <Filter className="w-4 h-4 text-surface-400 dark:text-surface-500 mr-1" />
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                typeFilter === tab.value
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Area */}
      <div className="max-h-96 overflow-y-auto">
        {/* Error */}
        {error && (
          <div className="p-4">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Initial state */}
        {!loading && !hasSearched && !error && (
          <div className="text-center py-10 px-4">
            <Search className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Search across projects, notes, and literature
            </p>
          </div>
        )}

        {/* Empty results */}
        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="text-center py-10 px-4">
            <Search className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
              No results found
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
              Try different keywords or filters
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <div className="px-4 py-2 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {total} result{total !== 1 ? 's' : ''} found
              </p>
            </div>
            <AnimatePresence initial={false}>
              {results.map((result, index) => {
                const config = TYPE_CONFIG[result.resultType] || TYPE_CONFIG.project;
                const Icon = config.icon;

                return (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onResultClick?.(result)}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-surface-50 dark:hover:bg-surface-700/50 border-b border-surface-100 dark:border-surface-700/50 last:border-b-0 transition-colors group"
                  >
                    {/* Type Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={cn('p-2 rounded-lg', config.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate transition-colors">
                          {result.title || 'Untitled'}
                        </span>
                        <span
                          className={cn(
                            'flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full',
                            config.color
                          )}
                        >
                          {config.label}
                        </span>
                      </div>
                      {result.matchSnippet && (
                        <p
                          className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2 [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800 [&_mark]:text-surface-900 [&_mark]:dark:text-yellow-100 [&_mark]:rounded [&_mark]:px-0.5"
                          dangerouslySetInnerHTML={{ __html: result.matchSnippet }}
                        />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

export default ResearchSearch;
