import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Upload,
  BookOpen,
  Bookmark,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Sparkles,
  FileText,
  Search,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useLibraryStore } from '@/stores/libraryStore';
import { useAuthStore } from '@/stores/authStore';
import { CategoryFilter, DocumentGrid, DocumentUpload, DocumentViewerModal } from '@/components/library';
import { Button } from '@/components/shared/Button';
import { Tabs } from '@/components/shared/Tabs';
import { formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import type { Document } from '@/types';

// API base URL
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

type LibraryTab = 'all' | 'bookmarked' | 'recent' | 'trending';

export default function Library() {
  const {
    fetchDocuments,
    fetchCategories,
    fetchStats,
    fetchBookmarks,
    bookmarkDocument,
    removeBookmark: removeBookmarkAction,
    stats,
    recentlyViewed,
    bookmarks,
    isLoading,
    error,
  } = useLibraryStore();

  const { hasRole } = useAuthStore();
  const isAdmin = hasRole(['admin', 'super_admin']);
  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: '-50px' });

  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search - 300ms
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      if (query.trim()) {
        fetchDocuments({ search: query.trim() });
      } else {
        fetchDocuments();
      }
    }, 300);
  }, [fetchDocuments]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setTimeout(() => setSelectedDocument(null), 300);
  };

  const handleBookmarkDocument = async (documentId: string) => {
    const isCurrentlyBookmarked = bookmarks.some((b) => b.documentId === documentId);
    if (isCurrentlyBookmarked) {
      await removeBookmarkAction(documentId);
    } else {
      await bookmarkDocument(documentId);
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    const isLocalDocument = document.id.startsWith('local-');

    if (isLocalDocument && document.fileUrl) {
      const link = window.document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.fileName || document.title;
      link.click();
      return;
    }

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/documents/${document.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.fileName || document.title;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(`${API_BASE}/documents/${document.id}/download`, '_blank');
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchCategories();
    fetchStats();
    fetchBookmarks();
  }, [fetchDocuments, fetchCategories, fetchStats, fetchBookmarks]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as LibraryTab);
    switch (tabId) {
      case 'bookmarked':
        break;
      case 'recent':
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
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.03] dark:opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, rgb(var(--color-primary-500)) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.03] dark:opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, rgb(var(--color-secondary-500)) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/25">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-surface-900 dark:text-surface-50">
                Document Library
              </h1>
              <p className="mt-0.5 text-surface-600 dark:text-surface-400">
                Access official documents, policies, and training materials
              </p>
            </div>
          </div>
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={() => setShowUpload(true)}
                leftIcon={<Upload className="w-5 h-5" />}
                className="shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-shadow"
              >
                Upload Document
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search documents by title, description, or keywords..."
              className={cn(
                'w-full pl-12 pr-4 py-3.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl',
                'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                'shadow-sm hover:shadow-md transition-shadow text-sm'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchDocuments();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 transition-colors"
              >
                <span className="sr-only">Clear search</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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
          ref={statsRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {[
            {
              label: 'Total Documents',
              value: stats.totalDocuments,
              subtitle: stats.monthlyUploads > 0 ? `+${stats.monthlyUploads} this month` : 'Browse all documents',
              icon: FileText,
              color: 'primary',
              gradient: 'from-primary-500 to-primary-600',
            },
            {
              label: 'Your Bookmarks',
              value: bookmarks.length,
              subtitle: bookmarks.length > 0 ? `${bookmarks.length} saved` : 'Save for quick access',
              icon: Bookmark,
              color: 'secondary',
              gradient: 'from-secondary-500 to-secondary-600',
            },
            {
              label: 'Recently Viewed',
              value: recentlyViewed.length,
              subtitle: stats.lastViewedAt ? `Last: ${formatRelativeTime(stats.lastViewedAt)}` : 'Start exploring',
              icon: Clock,
              color: 'accent',
              gradient: 'from-accent-500 to-accent-600',
            },
            {
              label: 'Trending Now',
              value: stats.trendingCount,
              subtitle: 'Most popular today',
              icon: TrendingUp,
              color: 'success',
              gradient: 'from-success-500 to-success-600',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={isStatsInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{
                delay: index * 0.1,
                type: 'spring',
                stiffness: 100,
                damping: 15,
              }}
            >
              <StatCard
                label={stat.label}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
                color={stat.color as 'primary' | 'secondary' | 'accent' | 'success'}
                gradient={stat.gradient}
                isLoading={isLoading}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
          />
        </motion.div>

        {/* Category Filter - Mobile/Tablet */}
        <div className="lg:hidden">
          <CategoryFilter />
        </div>

        {/* Main Content */}
        <div className="flex gap-4 sm:gap-6">
          {/* Sidebar - Desktop Only, collapsible */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:block w-[280px] xl:w-[300px] flex-shrink-0 space-y-6"
          >
            <CategoryFilter />

            {/* AI Assistant Promo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-5 text-white shadow-xl shadow-primary-500/20"
            >
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              {/* Floating sparkles */}
              <motion.div
                className="absolute top-4 right-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5 text-white/30" />
              </motion.div>

              <div className="relative">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-lg mb-2">AI Document Analysis</h4>
                <p className="text-sm text-primary-100 mb-4 leading-relaxed">
                  Get instant summaries, key insights, and smart search powered by AI.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white/20 hover:bg-white/30 border-white/20 text-white backdrop-blur-sm"
                  onClick={() => window.location.href = '/help#ai-features'}
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>

            {/* Quick Search Tip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-4 border border-surface-200 dark:border-surface-700"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-surface-500" />
                </div>
                <div>
                  <h5 className="font-semibold text-surface-900 dark:text-surface-50 text-sm">
                    Quick Tip
                  </h5>
                  <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                    Use the search bar above to find documents by title, content, or keywords.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Document Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 min-w-0"
          >
            <DocumentGrid
              activeTab={activeTab}
              bookmarkedIds={bookmarks.map((b) => b.documentId)}
              recentlyViewedDocs={recentlyViewed}
              onViewDocument={handleViewDocument}
            />
          </motion.div>
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
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'secondary' | 'accent' | 'success';
  gradient: string;
  isLoading?: boolean;
}

function StatCard({ label, value, subtitle, icon: Icon, color, gradient, isLoading }: StatCardProps) {
  const colorClasses = {
    primary: {
      iconBg: 'bg-primary-500',
      shadow: 'shadow-primary-500/30',
      text: 'text-primary-600 dark:text-primary-400',
    },
    secondary: {
      iconBg: 'bg-secondary-500',
      shadow: 'shadow-secondary-500/30',
      text: 'text-secondary-600 dark:text-secondary-400',
    },
    accent: {
      iconBg: 'bg-accent-500',
      shadow: 'shadow-accent-500/30',
      text: 'text-accent-600 dark:text-accent-400',
    },
    success: {
      iconBg: 'bg-success-500',
      shadow: 'shadow-success-500/30',
      text: 'text-success-600 dark:text-success-400',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="relative group">
      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5 border border-surface-100 dark:border-surface-700 overflow-hidden">
        {/* Subtle gradient overlay on hover */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300',
            `bg-gradient-to-br ${gradient}`
          )}
        />

        <div className="relative flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-surface-500 dark:text-surface-400 truncate">
              {label}
            </p>
            {isLoading ? (
              <div className="h-8 w-16 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse mt-2" />
            ) : (
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-50 mt-1"
              >
                {value.toLocaleString()}
              </motion.p>
            )}
            <p className="text-xs text-surface-400 mt-1 truncate">{subtitle}</p>
          </div>
          <div
            className={cn(
              'w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0',
              colors.iconBg,
              colors.shadow
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
