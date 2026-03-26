import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  BookmarkX,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Search,
  FileText,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronDown,
  X,
  Trash2,
} from 'lucide-react';
import { useLibraryStore, DOCUMENT_CATEGORIES } from '@/stores/libraryStore';
import { DocumentCard } from '@/components/library/DocumentCard';
import { DocumentViewerModal } from '@/components/library';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatters';
import type { Document } from '@/types';

type SortOption = 'bookmarked_newest' | 'bookmarked_oldest' | 'title_asc' | 'title_desc' | 'category';
type ViewMode = 'grid' | 'list';

const ITEMS_PER_PAGE = 16;

export default function Bookmarks() {
  const {
    documents,
    bookmarks,
    categories,
    fetchBookmarks,
    fetchDocuments,
    fetchCategories,
    removeBookmark,
    isLoading,
    error,
  } = useLibraryStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('bookmarked_newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    fetchBookmarks();
    fetchDocuments();
    fetchCategories();
  }, [fetchBookmarks, fetchDocuments, fetchCategories]);

  // Build a map of documentId -> bookmarked createdAt for sorting
  const bookmarkDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    bookmarks.forEach((b) => {
      map[b.documentId] = b.createdAt;
    });
    return map;
  }, [bookmarks]);

  // Collect bookmarked documents (matching stored bookmarks against fetched docs)
  const bookmarkedDocuments = useMemo(() => {
    const bookmarkedIds = new Set(bookmarks.map((b) => b.documentId));
    return documents.filter((doc) => bookmarkedIds.has(doc.id));
  }, [documents, bookmarks]);

  // Filter and sort
  const filteredDocuments = useMemo(() => {
    let filtered = [...bookmarkedDocuments];

    if (selectedCategory) {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.description?.toLowerCase().includes(q) ||
          doc.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'bookmarked_newest':
          return (
            new Date(bookmarkDateMap[b.id] || b.createdAt).getTime() -
            new Date(bookmarkDateMap[a.id] || a.createdAt).getTime()
          );
        case 'bookmarked_oldest':
          return (
            new Date(bookmarkDateMap[a.id] || a.createdAt).getTime() -
            new Date(bookmarkDateMap[b.id] || b.createdAt).getTime()
          );
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [bookmarkedDocuments, selectedCategory, searchQuery, sortBy, bookmarkDateMap]);

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleRemoveBookmark = async (documentId: string) => {
    setRemovingId(documentId);
    setConfirmRemoveId(null);
    try {
      await removeBookmark(documentId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setTimeout(() => setSelectedDocument(null), 300);
  };

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Recently Bookmarked', value: 'bookmarked_newest' },
    { label: 'Oldest Bookmarked', value: 'bookmarked_oldest' },
    { label: 'Title A–Z', value: 'title_asc' },
    { label: 'Title Z–A', value: 'title_desc' },
    { label: 'Category', value: 'category' },
  ];

  const activeCategoriesInBookmarks = useMemo(() => {
    const used = new Set(bookmarkedDocuments.map((d) => d.category));
    return DOCUMENT_CATEGORIES.filter((c) => used.has(c.id));
  }, [bookmarkedDocuments]);

  const isEmpty = !isLoading && bookmarks.length === 0;
  const noResults = !isLoading && bookmarks.length > 0 && filteredDocuments.length === 0;

  return (
    <div className="relative min-h-screen">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.03] dark:opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, rgb(var(--color-secondary-500)) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.03] dark:opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, rgb(var(--color-primary-500)) 0%, transparent 70%)',
          }}
          animate={{ scale: [1.1, 1, 1.1], x: [0, -20, 0], y: [0, -40, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="space-y-6 relative">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center shadow-xl shadow-secondary-500/25">
              <Bookmark className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-surface-900 dark:text-surface-50">
                My Bookmarks
              </h1>
              <p className="mt-0.5 text-surface-600 dark:text-surface-400">
                {bookmarks.length > 0
                  ? `${bookmarks.length} saved document${bookmarks.length !== 1 ? 's' : ''}`
                  : 'Save documents for quick access'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBookmarks()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Link to="/library">
              <Button
                size="sm"
                leftIcon={<FileText className="w-4 h-4" />}
              >
                Browse Library
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0" />
              <p className="text-error-700 dark:text-error-300">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => fetchBookmarks()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </motion.div>
        )}

        {/* Empty State */}
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-secondary-50 dark:bg-secondary-900/20 flex items-center justify-center mb-6">
                <Bookmark className="w-12 h-12 text-secondary-400" />
              </div>
              <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
                No bookmarks yet
              </h2>
              <p className="text-surface-500 dark:text-surface-400 max-w-sm mb-8">
                Browse the library to save documents. Click the bookmark icon on any document card to add it here.
              </p>
              <Link to="/library">
                <Button leftIcon={<FileText className="w-5 h-5" />}>
                  Browse the Library
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Toolbar */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm p-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search */}
                  <div className="flex-1">
                    <Input
                      placeholder="Search bookmarks..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      leftIcon={<Search className="w-5 h-5" />}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Filter Toggle */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                        showFilters || selectedCategory
                          ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20 text-secondary-600 dark:text-secondary-400'
                          : 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
                      )}
                    >
                      <Filter className="w-4 h-4" />
                      Filter
                      {selectedCategory && (
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                      )}
                      <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
                    </button>

                    {/* Sort Dropdown */}
                    <div className="relative group">
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value as SortOption);
                          setCurrentPage(1);
                        }}
                        className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-500/50"
                      >
                        {sortOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <SortAsc className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-surface-50 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          'p-2.5 transition-colors',
                          viewMode === 'grid'
                            ? 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400'
                            : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                        )}
                        aria-label="Grid view"
                      >
                        <Grid3X3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                          'p-2.5 transition-colors',
                          viewMode === 'list'
                            ? 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400'
                            : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                        )}
                        aria-label="List view"
                      >
                        <List className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter Panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-3">
                          Filter by category
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setSelectedCategory(null);
                              setCurrentPage(1);
                            }}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                              selectedCategory === null
                                ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400'
                                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                            )}
                          >
                            All Categories
                          </button>
                          {activeCategoriesInBookmarks.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                                setCurrentPage(1);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                                selectedCategory === cat.id
                                  ? 'text-white'
                                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                              )}
                              style={
                                selectedCategory === cat.id
                                  ? { backgroundColor: cat.color }
                                  : {}
                              }
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: selectedCategory === cat.id ? 'white' : cat.color }}
                              />
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Active Filters Summary */}
              {(selectedCategory || searchQuery) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <span className="text-sm text-surface-500">Active filters:</span>
                  {selectedCategory && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm text-white"
                      style={{ backgroundColor: getCategoryById(selectedCategory)?.color || '#666' }}
                    >
                      {getCategoryById(selectedCategory)?.name}
                      <button onClick={() => setSelectedCategory(null)}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
                      "{searchQuery}"
                      <button onClick={() => setSearchQuery('')}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                </motion.div>
              )}

              {/* Results Count */}
              <div className="text-sm text-surface-500 dark:text-surface-400">
                {noResults ? (
                  'No bookmarks match your filters'
                ) : (
                  <>
                    Showing {paginatedDocuments.length} of {filteredDocuments.length} bookmarked document
                    {filteredDocuments.length !== 1 ? 's' : ''}
                  </>
                )}
              </div>

              {/* Loading Skeletons */}
              {isLoading && bookmarks.length === 0 && (
                <div className={cn('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" className="h-64" />
                  ))}
                </div>
              )}

              {/* No Results */}
              {noResults && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-surface-400" />
                  </div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">No results found</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    Try adjusting your filters or search query.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                    className="mt-4 text-sm text-secondary-600 dark:text-secondary-400 hover:underline"
                  >
                    Clear all filters
                  </button>
                </motion.div>
              )}

              {/* Document Grid */}
              {!isLoading && paginatedDocuments.length > 0 && (
                <div className={cn(
                  'grid gap-6',
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                )}>
                  {paginatedDocuments.map((document) => {
                    const bookmarkDate = bookmarkDateMap[document.id];
                    return (
                      <motion.div
                        key={document.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative group"
                      >
                        <DocumentCard
                          document={document}
                          category={getCategoryById(document.category)}
                          viewMode={viewMode}
                          onView={handleViewDocument}
                        />

                        {/* Bookmark meta overlay */}
                        {bookmarkDate && viewMode === 'grid' && (
                          <div className="absolute bottom-[4.5rem] left-0 right-0 mx-4 flex items-center justify-between">
                            <span className="text-xs text-surface-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Saved {formatRelativeTime(bookmarkDate)}
                            </span>
                          </div>
                        )}

                        {/* Remove bookmark button */}
                        <div className={cn(
                          'absolute top-3 right-12 transition-all',
                          confirmRemoveId === document.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}>
                          {confirmRemoveId === document.id ? (
                            <div className="flex items-center gap-1 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 p-1">
                              <span className="text-xs text-surface-600 dark:text-surface-400 px-2">Remove?</span>
                              <button
                                onClick={() => handleRemoveBookmark(document.id)}
                                disabled={removingId === document.id}
                                className="flex items-center gap-1 px-2 py-1 bg-error-500 text-white text-xs rounded-lg hover:bg-error-600 transition-colors disabled:opacity-60"
                              >
                                {removingId === document.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmRemoveId(null)}
                                className="px-2 py-1 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 text-xs rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmRemoveId(document.id);
                              }}
                              className="p-2 rounded-xl bg-white dark:bg-surface-800 shadow-md text-secondary-500 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-all"
                              title="Remove bookmark"
                            >
                              <BookmarkX className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-surface-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={selectedDocument}
        isOpen={showViewer}
        onClose={handleCloseViewer}
        onBookmark={(id) => {
          const isBookmarked = bookmarks.some((b) => b.documentId === id);
          if (isBookmarked) setConfirmRemoveId(id);
        }}
        onDownload={(document) => {
          if (document.fileUrl) {
            const link = window.document.createElement('a');
            link.href = document.fileUrl;
            link.download = document.fileName || document.title;
            link.click();
          }
        }}
        isBookmarked={selectedDocument ? bookmarks.some((b) => b.documentId === selectedDocument.id) : false}
      />
    </div>
  );
}
