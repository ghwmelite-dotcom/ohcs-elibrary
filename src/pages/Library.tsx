import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, BookOpen, Bookmark, Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useLibraryStore } from '@/stores/libraryStore';
import { CategoryFilter, DocumentGrid, DocumentUpload, DocumentViewerModal } from '@/components/library';
import { Button } from '@/components/shared/Button';
import { Tabs } from '@/components/shared/Tabs';
import { formatRelativeTime } from '@/utils/formatters';
import type { Document } from '@/types';

type LibraryTab = 'all' | 'bookmarked' | 'recent' | 'trending';

export default function Library() {
  const {
    fetchDocuments,
    fetchCategories,
    fetchStats,
    fetchBookmarks,
    stats,
    recentlyViewed,
    bookmarks,
    isLoading,
    error,
  } = useLibraryStore();

  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    // Delay clearing the document for exit animation
    setTimeout(() => setSelectedDocument(null), 300);
  };

  const handleBookmarkDocument = (documentId: string) => {
    const isCurrentlyBookmarked = bookmarks.some((b) => b.documentId === documentId);
    if (isCurrentlyBookmarked) {
      // removeBookmark would be called here
    } else {
      // bookmarkDocument would be called here
    }
  };

  const handleDownloadDocument = (document: Document) => {
    if (document.fileUrl) {
      const link = window.document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.fileName || document.title;
      link.click();
    }
  };

  useEffect(() => {
    // Fetch initial data
    fetchDocuments();
    fetchCategories();
    fetchStats();
    fetchBookmarks();
  }, [fetchDocuments, fetchCategories, fetchStats, fetchBookmarks]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as LibraryTab);
    // Update filter based on tab
    switch (tabId) {
      case 'bookmarked':
        // Filter will be applied in DocumentGrid based on bookmarks
        break;
      case 'recent':
        // Show recently viewed documents
        break;
      case 'trending':
        fetchDocuments({ sortBy: 'views', sortOrder: 'desc' });
        break;
      default:
        fetchDocuments();
    }
  };

  const handleRetry = () => {
    fetchDocuments();
    fetchCategories();
    fetchStats();
  };

  const tabs = [
    { id: 'all', label: 'All Documents', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'bookmarked', label: 'Bookmarked', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'recent', label: 'Recently Viewed', icon: <Clock className="w-4 h-4" /> },
    { id: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
            Document Library
          </h1>
          <p className="mt-1 text-surface-600 dark:text-surface-400">
            Access official documents, policies, and training materials
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          leftIcon={<Upload className="w-5 h-5" />}
        >
          Upload Document
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error-500" />
            <p className="text-error-700 dark:text-error-300">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </motion.div>
      )}

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Documents"
          value={stats.totalDocuments}
          subtitle={stats.monthlyUploads > 0 ? `+${stats.monthlyUploads} this month` : 'No uploads this month'}
          icon={BookOpen}
          color="primary"
          isLoading={isLoading}
        />
        <StatCard
          label="Your Bookmarks"
          value={bookmarks.length}
          subtitle={bookmarks.length > 0 ? `${bookmarks.length} saved` : 'No bookmarks yet'}
          icon={Bookmark}
          color="secondary"
          isLoading={isLoading}
        />
        <StatCard
          label="Recently Viewed"
          value={recentlyViewed.length}
          subtitle={stats.lastViewedAt ? `Last viewed ${formatRelativeTime(stats.lastViewedAt)}` : 'No recent activity'}
          icon={Clock}
          color="accent"
          isLoading={isLoading}
        />
        <StatCard
          label="Trending Now"
          value={stats.trendingCount}
          subtitle="Most popular today"
          icon={TrendingUp}
          color="success"
          isLoading={isLoading}
        />
      </motion.div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      {/* Category Filter - Mobile/Tablet */}
      <div className="lg:hidden">
        <CategoryFilter />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <CategoryFilter />

          {/* AI Assistant Promo */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">&#10024;</span>
            </div>
            <h4 className="font-semibold mb-2">AI Document Analysis</h4>
            <p className="text-sm text-primary-100 mb-4">
              Get instant summaries, key points, and insights from any document using
              our AI assistant.
            </p>
            <Button variant="secondary" size="sm" className="w-full">
              Learn More
            </Button>
          </div>
        </div>

        {/* Document Grid */}
        <div className="lg:col-span-3">
          <DocumentGrid
            activeTab={activeTab}
            bookmarkedIds={bookmarks.map((b) => b.documentId)}
            recentlyViewedDocs={recentlyViewed}
            onViewDocument={handleViewDocument}
          />
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUpload isOpen={showUpload} onClose={() => setShowUpload(false)} />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={selectedDocument}
        isOpen={showViewer}
        onClose={handleCloseViewer}
        onBookmark={handleBookmarkDocument}
        onDownload={handleDownloadDocument}
        isBookmarked={selectedDocument ? bookmarks.some((b) => b.documentId === selectedDocument.id) : false}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'secondary' | 'accent' | 'success';
  isLoading?: boolean;
}

function StatCard({ label, value, subtitle, icon: Icon, color, isLoading }: StatCardProps) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    secondary: 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
    accent: 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
    success: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400',
  };

  return (
    <div className="bg-surface-50 dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
          {isLoading ? (
            <div className="h-8 w-16 bg-surface-200 dark:bg-surface-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-1">
              {value.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-surface-400 mt-1">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
