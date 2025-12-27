import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Eye,
  Download,
  Star,
  Clock,
  Bookmark,
  BookmarkCheck,
  MoreVertical,
  Share2,
  Lock,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { Document } from '@/types';
import { useLibraryStore } from '@/stores/libraryStore';
import { useAuthStore } from '@/stores/authStore';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { formatRelativeTime, formatFileSize } from '@/utils/formatters';

interface CategoryInfo {
  id: string;
  name: string;
  color: string;
}

interface DocumentCardProps {
  document: Document;
  category?: CategoryInfo;
  viewMode?: 'grid' | 'list';
  onView?: (document: Document) => void;
}

export function DocumentCard({ document, category, viewMode = 'grid', onView }: DocumentCardProps) {
  const { bookmarks, bookmarkDocument, removeBookmark, deleteLocalDocument, deleteDocument } = useLibraryStore();
  const { user } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const isBookmarked = bookmarks.some((b) => b.documentId === document.id);
  const isLocalDocument = document.id.startsWith('local-');
  const hasExpiredUrl = isLocalDocument && !document.fileUrl?.startsWith('blob:') && !document.fileUrl?.startsWith('data:');

  // Check if user can delete - admin roles or document owner
  const canDelete = user && (
    ['super_admin', 'admin', 'librarian'].includes(user.role || '') ||
    document.uploadedBy?.id === user.id ||
    isLocalDocument
  );

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a[href]')) return;
    if (onView) {
      e.preventDefault();
      onView(document);
    }
  };

  const handleToggleBookmark = () => {
    if (isBookmarked) {
      removeBookmark(document.id);
    } else {
      bookmarkDocument(document.id);
    }
  };

  const accessLevelColors = {
    public: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    internal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    restricted: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    confidential: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    secret: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
  };

  const handleDelete = async () => {
    const confirmMessage = isLocalDocument
      ? 'Delete this local document? This cannot be undone.'
      : `Delete "${document.title}"? This will permanently remove the document from the library.`;

    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      if (isLocalDocument) {
        deleteLocalDocument(document.id);
      } else {
        await deleteDocument(document.id);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const menuItems = [
    { label: 'Share', icon: Share2, onClick: () => {} },
    { label: 'Download', icon: Download, onClick: () => {} },
    {
      label: isBookmarked ? 'Remove Bookmark' : 'Add Bookmark',
      icon: isBookmarked ? BookmarkCheck : Bookmark,
      onClick: handleToggleBookmark,
    },
    // Add delete option for users with permission
    ...(canDelete ? [{
      label: isDeleting ? 'Deleting...' : 'Delete',
      icon: isDeleting ? Loader2 : Trash2,
      onClick: handleDelete,
      className: 'text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/30',
    }] : []),
  ];

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleClick}
        className={cn(
          "bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 hover:shadow-elevation-2 transition-shadow p-4",
          onView && "cursor-pointer"
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${category?.color || '#006B3F'}20` }}
          >
            <FileText
              className="w-6 h-6"
              style={{ color: category?.color || '#006B3F' }}
            />
          </div>

          <div className="flex-1 min-w-0">
            {onView ? (
              <span className="font-semibold text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-1 cursor-pointer">
                {document.title}
              </span>
            ) : (
              <Link
                to={`/library/${document.id}`}
                className="font-semibold text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-1"
              >
                {document.title}
              </Link>
            )}
            <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-1 mt-0.5">
              {document.description}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-surface-500">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {document.views}
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              {document.downloads}
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-secondary-500" />
              {document.averageRating.toFixed(1)}
            </div>
          </div>

          <span
            className={cn(
              'hidden lg:inline-flex text-xs px-2 py-1 rounded-full capitalize',
              accessLevelColors[document.accessLevel]
            )}
          >
            {document.accessLevel === 'secret' && <Lock className="w-3 h-3 mr-1" />}
            {document.accessLevel}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBookmark}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isBookmarked
                  ? 'text-secondary-500 bg-secondary-50 dark:bg-secondary-900/30'
                  : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
            <Dropdown items={menuItems} align="right">
              <button className="p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </Dropdown>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className={cn(
        "bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 hover:shadow-elevation-2 transition-all group",
        onView && "cursor-pointer"
      )}
    >
      {/* Thumbnail/Header */}
      <div
        className="h-32 relative flex items-center justify-center rounded-t-xl"
        style={{ backgroundColor: `${category?.color || '#006B3F'}15` }}
      >
        <FileText
          className="w-12 h-12"
          style={{ color: category?.color || '#006B3F' }}
        />

        {/* Local Document Warning */}
        {isLocalDocument && (
          <div className="absolute bottom-2 left-2 right-2 bg-warning-500/90 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Local only - Re-upload to save</span>
          </div>
        )}

        {/* Access Level Badge */}
        <span
          className={cn(
            'absolute top-3 left-3 text-xs px-2 py-1 rounded-full capitalize flex items-center gap-1',
            accessLevelColors[document.accessLevel]
          )}
        >
          {document.accessLevel === 'secret' && <Lock className="w-3 h-3" />}
          {document.accessLevel}
        </span>

        {/* Action Buttons */}
        <div className={cn(
          'absolute top-3 right-3 flex items-center gap-1',
          !isBookmarked && 'opacity-0 group-hover:opacity-100 transition-opacity'
        )}>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleBookmark(); }}
            className={cn(
              'p-2 rounded-lg transition-all bg-white dark:bg-surface-800',
              isBookmarked
                ? 'text-secondary-500'
                : 'text-surface-400 hover:text-secondary-500'
            )}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-5 h-5" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
          <Dropdown items={menuItems} align="right">
            <button
              className="p-2 rounded-lg bg-white dark:bg-surface-800 text-surface-400 hover:text-surface-600 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </Dropdown>
        </div>

        {/* Category Badge */}
        {category && (
          <div
            className="absolute bottom-3 left-3 text-xs px-2 py-1 rounded-full bg-white dark:bg-surface-800 font-medium"
            style={{ color: category.color }}
          >
            {category.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {onView ? (
          <span className="block font-semibold text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 min-h-[3rem] cursor-pointer">
            {document.title}
          </span>
        ) : (
          <Link
            to={`/library/${document.id}`}
            className="block font-semibold text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 min-h-[3rem]"
          >
            {document.title}
          </Link>
        )}

        <p className="mt-2 text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
          {document.description}
        </p>

        {/* Metadata */}
        <div className="mt-4 flex items-center justify-between text-xs text-surface-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {document.views}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-secondary-500" />
              {document.averageRating.toFixed(1)}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatRelativeTime(document.createdAt)}
          </span>
        </div>

        {/* File Info */}
        <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between text-xs text-surface-400">
          <span className="uppercase">{document.fileType}</span>
          <span>{formatFileSize(document.fileSize)}</span>
        </div>
      </div>
    </motion.div>
  );
}
