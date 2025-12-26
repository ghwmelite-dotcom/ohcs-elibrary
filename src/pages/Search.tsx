import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search as SearchIcon,
  FileText,
  MessageSquare,
  Users,
  Newspaper,
  User,
  X,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { useSearchStore } from '@/stores/searchStore';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Badge } from '@/components/shared/Badge';
import { Tabs } from '@/components/shared/Tabs';
import { Avatar } from '@/components/shared/Avatar';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

type SearchCategory = 'all' | 'documents' | 'forum' | 'groups' | 'news' | 'users';

interface SearchResult {
  id: string;
  type: 'document' | 'topic' | 'group' | 'article' | 'user';
  title: string;
  description: string;
  url: string;
  metadata?: Record<string, string>;
  timestamp?: Date;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(query);
  const [category, setCategory] = useState<SearchCategory>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'document',
      title: 'Ghana Civil Service Code of Conduct',
      description: 'Official code of conduct for all Ghana civil servants including ethical guidelines and professional standards...',
      url: '/library/1',
      metadata: { category: 'Policy', format: 'PDF', downloads: '1,234' },
      timestamp: new Date(Date.now() - 86400000 * 7),
    },
    {
      id: '2',
      type: 'topic',
      title: 'Discussion: Implementing Digital Services in MDAs',
      description: 'How can we accelerate the digital transformation across all government departments and agencies...',
      url: '/forum/topic/1',
      metadata: { replies: '24', views: '456' },
      timestamp: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: '3',
      type: 'group',
      title: 'IT Officers Network',
      description: 'A community of IT professionals working across various government ministries, departments and agencies...',
      url: '/groups/1',
      metadata: { members: '156', posts: '89' },
    },
    {
      id: '4',
      type: 'article',
      title: 'Government Announces New E-Services Platform',
      description: 'The Ministry of Communications has unveiled plans for a comprehensive digital platform to deliver government services...',
      url: '/news/1',
      metadata: { source: 'Ghana News Agency' },
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: '5',
      type: 'user',
      title: 'Kwame Asante',
      description: 'Director of IT, Ministry of Communications',
      url: '/profile/1',
      metadata: { department: 'IT', mda: 'MoC' },
    },
  ];

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      // Simulate search
      setTimeout(() => {
        setResults(mockResults.filter(r =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.description.toLowerCase().includes(query.toLowerCase())
        ));
        setIsLoading(false);
      }, 500);
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'topic': return MessageSquare;
      case 'group': return Users;
      case 'article': return Newspaper;
      case 'user': return User;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'primary';
      case 'topic': return 'secondary';
      case 'group': return 'accent';
      case 'article': return 'warning';
      case 'user': return 'info';
      default: return 'default';
    }
  };

  const tabs = [
    { id: 'all', label: 'All Results', count: results.length },
    { id: 'documents', label: 'Documents', count: results.filter(r => r.type === 'document').length },
    { id: 'forum', label: 'Forum', count: results.filter(r => r.type === 'topic').length },
    { id: 'groups', label: 'Groups', count: results.filter(r => r.type === 'group').length },
    { id: 'news', label: 'News', count: results.filter(r => r.type === 'article').length },
    { id: 'users', label: 'Users', count: results.filter(r => r.type === 'user').length },
  ];

  const filteredResults = category === 'all'
    ? results
    : results.filter(r => {
        switch (category) {
          case 'documents': return r.type === 'document';
          case 'forum': return r.type === 'topic';
          case 'groups': return r.type === 'group';
          case 'news': return r.type === 'article';
          case 'users': return r.type === 'user';
          default: return true;
        }
      });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </form>

        {query && (
          <p className="mt-4 text-surface-600 dark:text-surface-400">
            {isLoading ? (
              'Searching...'
            ) : (
              <>
                Found <span className="font-semibold">{results.length}</span> results for{' '}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredResults.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
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
                    key={result.id}
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
                          result.type === 'topic' && 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
                          result.type === 'group' && 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
                          result.type === 'article' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
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
                            {result.timestamp && (
                              <span className="text-xs text-surface-400">
                                {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">
                            {result.title}
                          </h3>
                          <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                            {result.description}
                          </p>
                          {result.metadata && (
                            <div className="flex gap-4 mt-2 text-xs text-surface-500">
                              {Object.entries(result.metadata).map(([key, value]) => (
                                <span key={key} className="capitalize">
                                  {key}: {value}
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
        <EmptyState
          icon={SearchIcon}
          title="Search the platform"
          description="Find documents, forum discussions, groups, news articles, and colleagues"
        />
      )}
    </div>
  );
}
