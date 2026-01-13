import { useState, useMemo } from 'react';
import { Grid3X3, List, SortAsc, SortDesc, Search, FileText, Bookmark, Clock, TrendingUp } from 'lucide-react';
import { useLibraryStore } from '@/stores/libraryStore';
import { DocumentCard } from './DocumentCard';
import { Input } from '@/components/shared/Input';
import { Dropdown } from '@/components/shared/Dropdown';
import { Skeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { cn } from '@/utils/cn';
import type { Document } from '@/types';

type SortOption = 'newest' | 'oldest' | 'popular' | 'rating' | 'title';
type ViewMode = 'grid' | 'list';
type LibraryTab = 'all' | 'bookmarked' | 'recent' | 'trending';

const ITEMS_PER_PAGE = 16;

interface DocumentGridProps {
  activeTab?: LibraryTab;
  bookmarkedIds?: string[];
  recentlyViewedDocs?: Document[];
  onViewDocument?: (document: Document) => void;
}

export function DocumentGrid({
  activeTab = 'all',
  bookmarkedIds = [],
  recentlyViewedDocs = [],
  onViewDocument,
}: DocumentGridProps) {
  const { documents, categories, selectedCategory, isLoading, error } = useLibraryStore();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Get documents based on active tab
  const getDocumentsForTab = useMemo(() => {
    switch (activeTab) {
      case 'bookmarked':
        return documents.filter((doc) => bookmarkedIds.includes(doc.id));
      case 'recent':
        return recentlyViewedDocs;
      case 'trending':
        return [...documents].sort((a, b) => b.views - a.views);
      default:
        return documents;
    }
  }, [activeTab, documents, bookmarkedIds, recentlyViewedDocs]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    let filtered = [...getDocumentsForTab];

    if (selectedCategory && activeTab === 'all') {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.description.toLowerCase().includes(query) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'newest':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'oldest':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'popular':
          comparison = b.views - a.views;
          break;
        case 'rating':
          comparison = b.averageRating - a.averageRating;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return filtered;
  }, [getDocumentsForTab, selectedCategory, searchQuery, sortBy, sortOrder, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Alphabetical', value: 'title' },
  ];

  const getCategoryById = (categoryValue: string) =>
    categories.find((c) => c.id === categoryValue);

  const getEmptyStateContent = () => {
    switch (activeTab) {
      case 'bookmarked':
        return {
          icon: <Bookmark className="w-full h-full" />,
          title: 'No bookmarks yet',
          description: 'Save documents for quick access by clicking the bookmark icon.',
        };
      case 'recent':
        return {
          icon: <Clock className="w-full h-full" />,
          title: 'No recently viewed documents',
          description: 'Documents you view will appear here for easy access.',
        };
      case 'trending':
        return {
          icon: <TrendingUp className="w-full h-full" />,
          title: 'No trending documents',
          description: 'Popular documents will appear here once the library has content.',
        };
      default:
        if (searchQuery) {
          return {
            icon: <Search className="w-full h-full" />,
            title: 'No results found',
            description: `No documents match "${searchQuery}". Try different keywords.`,
          };
        }
        return {
          icon: <FileText className="w-full h-full" />,
          title: 'No documents available',
          description: 'Documents will appear here once they are uploaded to the library.',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div
          className={cn(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1'
          )}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>

        <div className="flex items-center gap-2">
          <Dropdown
            items={sortOptions.map((opt) => ({
              label: opt.label,
              onClick: () => setSortBy(opt.value as SortOption),
            }))}
            align="right"
          >
            <button className="px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex items-center gap-2">
              {sortOptions.find((o) => o.value === sortBy)?.label}
              <SortDesc className="w-4 h-4" />
            </button>
          </Dropdown>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-5 h-5" />
            ) : (
              <SortDesc className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center bg-surface-50 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2.5 transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-surface-500 dark:text-surface-400">
        {filteredDocuments.length === 0 ? (
          'No documents to display'
        ) : (
          <>
            Showing {paginatedDocuments.length} of {filteredDocuments.length} documents
            {selectedCategory && activeTab === 'all' && (
              <span className="ml-1">
                in{' '}
                <span className="font-medium text-surface-700 dark:text-surface-300">
                  {getCategoryById(selectedCategory)?.name}
                </span>
              </span>
            )}
          </>
        )}
      </div>

      {/* Document Grid/List */}
      {paginatedDocuments.length === 0 ? (
        <EmptyState {...getEmptyStateContent()} />
      ) : (
        <div
          className={cn(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1'
          )}
        >
          {paginatedDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              category={getCategoryById(document.category)}
              viewMode={viewMode}
              onView={onViewDocument}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
