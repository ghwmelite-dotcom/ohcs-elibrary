import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Share2,
  Star,
  Eye,
  Clock,
  Lock,
  ExternalLink,
} from 'lucide-react';
import type { Document } from '@/types';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils/cn';
import { formatRelativeTime, formatFileSize } from '@/utils/formatters';

interface DocumentViewerModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmark?: (documentId: string) => void;
  onDownload?: (document: Document) => void;
  isBookmarked?: boolean;
}

export function DocumentViewerModal({
  document,
  isOpen,
  onClose,
  onBookmark,
  onDownload,
  isBookmarked = false,
}: DocumentViewerModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
  const totalPages = 10; // Mock - would come from actual PDF

  // Reset state when document changes
  useEffect(() => {
    if (document) {
      setCurrentPage(1);
      setScale(1);
      setRotation(0);
    }
  }, [document?.id]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          toggleFullscreen();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isFullscreen, onClose]);

  // Handle arrow keys for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const toggleFullscreen = useCallback(() => {
    if (!window.document.fullscreenElement) {
      window.document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      window.document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (document && onDownload) {
      onDownload(document);
    }
  }, [document, onDownload]);

  const canDownload = document?.isDownloadable !== false;

  if (!document) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative flex flex-col bg-surface-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden',
              isFullscreen
                ? 'fixed inset-4'
                : 'w-[95vw] h-[92vh] max-w-7xl'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-900/50 to-surface-900/50 border-b border-white/10">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Document Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary-400" />
                </div>

                {/* Title & Meta */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-white truncate">
                    {document.title}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-surface-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {document.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-secondary-400" />
                      {document.averageRating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRelativeTime(document.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Access Level Badge */}
                <Badge
                  variant={document.accessLevel === 'public' ? 'success' : 'warning'}
                  className="flex-shrink-0"
                >
                  {document.accessLevel === 'secret' && <Lock className="w-3 h-3 mr-1" />}
                  {document.accessLevel}
                </Badge>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="ml-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-800/80 border-b border-white/5">
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center bg-surface-700/50 rounded-lg border border-white/5">
                  <button
                    onClick={handleZoomOut}
                    disabled={scale <= 0.5}
                    className="p-2 text-surface-300 hover:text-white hover:bg-white/10 rounded-l-lg transition-colors disabled:opacity-50"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-medium text-surface-300 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    disabled={scale >= 3}
                    className="p-2 text-surface-300 hover:text-white hover:bg-white/10 rounded-r-lg transition-colors disabled:opacity-50"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Rotate */}
                <button
                  onClick={handleRotate}
                  className="p-2 text-surface-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10" />

                {/* View Mode */}
                <div className="flex items-center bg-surface-700/50 rounded-lg border border-white/5">
                  <button
                    onClick={() => setViewMode('single')}
                    className={cn(
                      'p-2 rounded-l-lg transition-colors',
                      viewMode === 'single'
                        ? 'bg-primary-500 text-white'
                        : 'text-surface-300 hover:text-white hover:bg-white/10'
                    )}
                    title="Single Page"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('continuous')}
                    className={cn(
                      'p-2 rounded-r-lg transition-colors',
                      viewMode === 'continuous'
                        ? 'bg-primary-500 text-white'
                        : 'text-surface-300 hover:text-white hover:bg-white/10'
                    )}
                    title="Continuous Scroll"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="p-2 text-surface-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    value={currentPage}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= totalPages) {
                        setCurrentPage(value);
                      }
                    }}
                    min={1}
                    max={totalPages}
                    className="w-12 px-2 py-1.5 text-center bg-surface-700 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-surface-400">of {totalPages}</span>
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="p-2 text-surface-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onBookmark?.(document.id)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    isBookmarked
                      ? 'bg-secondary-500/20 text-secondary-400'
                      : 'text-surface-300 hover:text-white hover:bg-white/10'
                  )}
                  title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>

                <button
                  className="p-2 text-surface-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {canDownload ? (
                  <button
                    onClick={handleDownload}
                    className="p-2 text-surface-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="p-2 text-surface-500 rounded-lg cursor-not-allowed"
                    title="Download disabled by administrator"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => window.open(`/library/${document.id}`, '_blank')}
                  className="p-2 text-surface-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Open in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-surface-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Document View */}
            <div className="flex-1 overflow-auto p-6 flex justify-center items-start bg-surface-950/50">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'top center',
                }}
                className="bg-white shadow-2xl rounded-lg"
              >
                {/* PDF Page Content - Mock for now */}
                <div className="w-[612px] h-[792px] p-12 relative">
                  {/* Page Header */}
                  <div className="mb-8 pb-4 border-b-2 border-primary-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-xl font-bold text-primary-600">
                          Office of the Head of Civil Service
                        </h1>
                        <p className="text-sm text-surface-500">Republic of Ghana</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-accent-500 via-secondary-500 to-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-2xl text-black">&#9733;</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Title */}
                  <h2 className="text-2xl font-bold text-surface-900 mb-6 text-center">
                    {document.title}
                  </h2>

                  {/* Content */}
                  <div className="space-y-4 text-surface-700 leading-relaxed">
                    <p>{document.description}</p>
                    <p>
                      This document contains important policy guidelines and procedures for
                      Ghana's civil service. All civil servants are required to familiarize
                      themselves with the contents of this document.
                    </p>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                      commodo consequat.
                    </p>
                    <p>
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                      dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                      proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                  </div>

                  {/* Page Number */}
                  <div className="absolute bottom-8 left-0 right-0 text-center text-sm text-surface-400">
                    Page {currentPage} of {totalPages}
                  </div>

                  {/* Ghana Flag Stripe */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 flex rounded-b-lg overflow-hidden">
                    <div className="flex-1 bg-accent-500" />
                    <div className="flex-1 bg-secondary-500" />
                    <div className="flex-1 bg-primary-500" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Page Thumbnails */}
            {viewMode === 'single' && (
              <div className="flex items-center justify-center gap-1.5 p-3 bg-surface-800/80 border-t border-white/5">
                {Array.from({ length: Math.min(totalPages, 12) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      'w-10 h-12 rounded-lg border-2 transition-all flex items-center justify-center',
                      currentPage === i + 1
                        ? 'border-primary-500 bg-primary-500/20 shadow-lg shadow-primary-500/20'
                        : 'border-white/10 bg-surface-700/50 hover:border-primary-400/50'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium',
                      currentPage === i + 1 ? 'text-primary-400' : 'text-surface-400'
                    )}>
                      {i + 1}
                    </span>
                  </button>
                ))}
                {totalPages > 12 && (
                  <span className="text-sm text-surface-500 ml-2">+{totalPages - 12} more</span>
                )}
              </div>
            )}

            {/* Footer with document info */}
            <div className="flex items-center justify-between px-6 py-3 bg-surface-900/80 border-t border-white/5 text-sm">
              <div className="flex items-center gap-4 text-surface-400">
                <span className="uppercase font-medium text-surface-300">{document.fileType}</span>
                <span>{formatFileSize(document.fileSize)}</span>
                <span>Version {document.version}</span>
              </div>
              <div className="flex items-center gap-4 text-surface-400">
                {!canDownload && (
                  <span className="flex items-center gap-1 text-warning-400">
                    <Lock className="w-3.5 h-3.5" />
                    Download restricted
                  </span>
                )}
                <span>{document.downloads} downloads</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
