import { useState } from 'react';
import { Grid3X3, List, SortAsc, SortDesc, Search } from 'lucide-react';
import { useLibraryStore } from '@/stores/libraryStore';
import { DocumentCard } from './DocumentCard';
import { Input } from '@/components/shared/Input';
import { Dropdown } from '@/components/shared/Dropdown';
import { Skeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { cn } from '@/utils/cn';

type SortOption = 'newest' | 'oldest' | 'popular' | 'rating' | 'title';
type ViewMode = 'grid' | 'list';

const ITEMS_PER_PAGE = 12;

export function DocumentGrid() {
  const { documents, categories, selectedCategory, isLoading } = useLibraryStore();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter documents
  let filteredDocuments = [...documents];

  if (selectedCategory) {
    filteredDocuments = filteredDocuments.filter(
      (doc) => doc.category === selectedCategory
    );
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredDocuments = filteredDocuments.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Sort documents
  filteredDocuments.sort((a, b) => {
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

  const getCategoryById = (categoryValue: string) => categories.find((c) => c.id === categoryValue);

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
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-64" />
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
            <button className="px-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-2">
              {sortOptions.find((o) => o.value === sortBy)?.label}
              <SortDesc className="w-4 h-4" />
            </button>
          </Dropdown>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2.5 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-5 h-5" />
            ) : (
              <SortDesc className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2.5 transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
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
                  : 'text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-surface-500 dark:text-surface-400">
        Showing {paginatedDocuments.length} of {filteredDocuments.length} documents
        {selectedCategory && (
          <span className="ml-1">
            in{' '}
            <span className="font-medium text-surface-700 dark:text-surface-300">
              {getCategoryById(selectedCategory)?.name}
            </span>
          </span>
        )}
      </div>

      {/* Document Grid/List */}
      {paginatedDocuments.length === 0 ? (
        <EmptyState
          type="documents"
          title="No documents found"
          description={
            searchQuery
              ? `No documents match "${searchQuery}"`
              : 'There are no documents in this category yet.'
          }
        />
      ) : (
        <div
          className={cn(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          )}
        >
          {paginatedDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              category={getCategoryById(document.category)}
              viewMode={viewMode}
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
