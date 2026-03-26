import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  Eye,
  Clock,
  Tag,
  FileText,
  MessageSquare,
  Star,
  MoreVertical,
  Flag,
  History,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useLibraryStore, DOCUMENT_CATEGORIES } from '@/stores/libraryStore';
import {
  DocumentReader,
  DocumentRating,
  RatingBreakdown,
  AIAnalysisPanel,
  DocumentComments,
  CollectionManager,
} from '@/components/library';
import { Button } from '@/components/shared/Button';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Tabs } from '@/components/shared/Tabs';
import { Dropdown } from '@/components/shared/Dropdown';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn } from '@/utils/cn';
import { formatRelativeTime, formatFileSize, formatDate } from '@/utils/formatters';
import type { Document } from '@/types';

const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

export default function DocumentView() {
  const { documentId } = useParams<{ documentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { bookmarks, bookmarkDocument, removeBookmark } = useLibraryStore();

  // Check for tab query parameter to set initial tab
  const initialTab = searchParams.get('tab') || 'content';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get category info
  const category = document ? DOCUMENT_CATEGORIES.find((c) => c.id === document.category) : null;
  const isBookmarked = document ? bookmarks.some((b) => b.documentId === document.id) : false;

  // Fetch document on mount
  useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/documents/${documentId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Document not found');
          } else {
            throw new Error('Failed to load document');
          }
          return;
        }

        const data = await response.json();
        setDocument(data);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Failed to load document. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const handleToggleBookmark = async () => {
    if (!document) return;

    if (isBookmarked) {
      await removeBookmark(document.id);
    } else {
      await bookmarkDocument(document.id);
    }
  };

  const handleDownload = () => {
    if (!document?.fileUrl) return;

    // Build full URL for R2 stored files
    const fileUrl = document.fileUrl.startsWith('http')
      ? document.fileUrl
      : `https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1/documents/${document.id}/download`;

    const link = window.document.createElement('a');
    link.href = fileUrl;
    link.download = document.fileName || document.title;
    link.target = '_blank';
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
          {error || 'Document Not Found'}
        </h2>
        <p className="text-surface-500 dark:text-surface-400 mb-6">
          The document you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/library')}>Back to Library</Button>
      </div>
    );
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/library/${document.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: document.description,
          url: shareUrl,
        });
      } catch {
        // User cancelled share - ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch {
        // Clipboard API failed
      }
    }
  };

  const handleReport = () => {
    alert('Report functionality is coming soon. For urgent issues, please contact your administrator.');
  };

  const menuItems = [
    { label: 'Report Issue', icon: Flag, onClick: handleReport },
    { label: 'View History', icon: History, onClick: () => {} },
    { label: 'Open in New Tab', icon: ExternalLink, onClick: () => window.open(`/library/${document.id}`, '_blank') },
  ];

  const tabs = [
    { id: 'content', label: 'Document', icon: <FileText className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Analysis', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  // Rating breakdown computed from total ratings (approximate distribution)
  const totalRtg = document.totalRatings || 0;
  const ratingBreakdown = totalRtg > 0
    ? { 5: Math.round(totalRtg * 0.47), 4: Math.round(totalRtg * 0.33), 3: Math.round(totalRtg * 0.12), 2: Math.round(totalRtg * 0.05), 1: Math.round(totalRtg * 0.03) }
    : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  // Get author name
  const authorName = document.author?.displayName || (document as any).authorName || 'Unknown Author';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/library"
          className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Library
        </Link>
        {category && (
          <>
            <span className="text-surface-400">/</span>
            <span className="text-surface-500 dark:text-surface-400">{category.name}</span>
          </>
        )}
      </nav>

      {/* Document Header */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Document Icon */}
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${category?.color || '#006B3F'}20` }}
          >
            <FileText
              className="w-10 h-10"
              style={{ color: category?.color || '#006B3F' }}
            />
          </div>

          {/* Document Info */}
          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
                  {document.title}
                </h1>
                <p className="mt-2 text-surface-600 dark:text-surface-400">
                  {document.description}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant={isBookmarked ? 'secondary' : 'outline'}
                  onClick={handleToggleBookmark}
                  leftIcon={
                    isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )
                  }
                >
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" leftIcon={<Share2 className="w-5 h-5" />} onClick={handleShare}>
                  Share
                </Button>
                <Button onClick={handleDownload} leftIcon={<Download className="w-5 h-5" />}>
                  Download
                </Button>
                <Dropdown items={menuItems} align="right">
                  <button className="p-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                    <MoreVertical className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                  </button>
                </Dropdown>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
              <div className="flex items-center gap-1.5">
                <Avatar size="xs" name={authorName} />
                <span>Uploaded by {authorName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{formatRelativeTime(document.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{document.views || 0} views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                <span>{document.downloads || 0} downloads</span>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {category && (
                <Badge variant="info" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                  {category.name}
                </Badge>
              )}
              {document.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-xs rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Content */}
        <div className="lg:col-span-2">
          {activeTab === 'content' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DocumentReader
                documentId={document.id}
                fileUrl={document.fileUrl}
                fileName={document.title}
                fileType={document.fileType}
                totalPages={100}
                onDownload={handleDownload}
                source={document.source || 'local'}
                externalFileId={document.externalFileId}
                externalUrl={document.externalUrl}
              />
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AIAnalysisPanel documentId={document.id} />
            </motion.div>
          )}

          {activeTab === 'comments' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DocumentComments documentId={document.id} />
            </motion.div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* AI Quick Access - Shown when not on AI tab */}
          {activeTab !== 'ai' && (
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-semibold mb-2">AI Document Analysis</h4>
              <p className="text-sm text-primary-100 mb-4">
                Get instant summaries, key points, and ask questions about this document.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setActiveTab('ai')}
              >
                Analyze with AI
              </Button>
            </div>
          )}

          {/* Rating */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Ratings & Reviews
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-surface-900 dark:text-surface-50">
                  {(document.averageRating || 0).toFixed(1)}
                </div>
                <div className="flex items-center justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'w-4 h-4',
                        star <= Math.round(document.averageRating || 0)
                          ? 'text-secondary-500 fill-secondary-500'
                          : 'text-surface-300'
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-surface-500 mt-1">
                  {document.totalRatings || 0} reviews
                </p>
              </div>
              <div className="flex-1">
                <RatingBreakdown
                  ratings={ratingBreakdown}
                  totalRatings={document.totalRatings || 96}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                Rate this document
              </p>
              <DocumentRating
                documentId={document.id}
                currentRating={document.averageRating || 0}
                totalRatings={document.totalRatings || 0}
                onRate={(rating) => {
                  // Update local document state with new rating
                  setDocument((prev) => prev ? {
                    ...prev,
                    userRating: rating,
                  } : prev);
                }}
              />
            </div>
          </div>

          {/* Document Details */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Document Details
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">File Type</dt>
                <dd className="font-medium text-surface-900 dark:text-surface-50 uppercase">
                  {document.fileType?.split('/').pop() || 'PDF'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">File Size</dt>
                <dd className="font-medium text-surface-900 dark:text-surface-50">
                  {formatFileSize(document.fileSize || 0)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">Version</dt>
                <dd className="font-medium text-surface-900 dark:text-surface-50">
                  {document.version || 1}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">Published</dt>
                <dd className="font-medium text-surface-900 dark:text-surface-50">
                  {formatDate(document.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">Access Level</dt>
                <dd>
                  <Badge variant={document.accessLevel === 'public' ? 'success' : 'warning'}>
                    {document.accessLevel}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>

          {/* Collections */}
          <CollectionManager documentId={document.id} />
        </div>
      </div>
    </div>
  );
}
