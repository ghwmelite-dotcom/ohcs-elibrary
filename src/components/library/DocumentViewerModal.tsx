import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  Bookmark,
  BookmarkCheck,
  Share2,
  Star,
  Eye,
  Clock,
  Lock,
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Image as ImageIcon,
  FileWarning,
} from 'lucide-react';
import type { Document } from '@/types';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils/cn';
import { formatRelativeTime, formatFileSize } from '@/utils/formatters';

// API base URL for fetching documents
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const totalPages = 10; // Would come from actual PDF metadata

  // Get the document URL - handle local vs API documents
  const getDocumentUrl = useCallback(() => {
    if (!document) return '';

    // Check if fileUrl is a blob URL (local file) or data URL
    if (document.fileUrl?.startsWith('blob:') || document.fileUrl?.startsWith('data:')) {
      return document.fileUrl;
    }

    // Check if this is a local document (ID starts with 'local-')
    // Local documents can't be fetched from API
    if (document.id.startsWith('local-')) {
      // Local document without valid blob URL
      // This happens when the page was reloaded and the blob URL expired
      return '';
    }

    // For API documents, use the API view endpoint
    // This ensures proper authentication and file streaming from R2
    return `${API_BASE}/documents/${document.id}/view`;
  }, [document]);

  // Check if document can be viewed
  const canViewDocument = useCallback(() => {
    if (!document) return false;

    // Check if it's a local document with an expired blob URL
    if (document.id.startsWith('local-')) {
      const hasValidBlobUrl = document.fileUrl?.startsWith('blob:') || document.fileUrl?.startsWith('data:');
      return hasValidBlobUrl;
    }

    // API documents can always be viewed (assuming they exist)
    return true;
  }, [document]);

  // Determine file type for rendering
  const getFileCategory = useCallback((fileType: string) => {
    const type = fileType?.toLowerCase() || '';
    if (type === 'pdf' || type.includes('pdf')) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(type)) return 'image';
    if (['doc', 'docx'].includes(type)) return 'document';
    if (['xls', 'xlsx'].includes(type)) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(type)) return 'presentation';
    if (['txt', 'md', 'rtf'].includes(type)) return 'text';
    return 'other';
  }, []);

  // Reset state when document changes
  useEffect(() => {
    if (document) {
      setCurrentPage(1);
      setScale(1);
      setRotation(0);
      setIsLoading(true);
      setLoadError(null);
    }
  }, [document?.id]);

  // Verify document exists before loading (for API documents)
  useEffect(() => {
    if (!document || !isOpen) return;

    // Skip verification for local documents or blob URLs
    if (document.id.startsWith('local-') ||
        document.fileUrl?.startsWith('blob:') ||
        document.fileUrl?.startsWith('data:')) {
      return;
    }

    // Verify the document exists via API
    const verifyDocument = async () => {
      try {
        const response = await fetch(`${API_BASE}/documents/${document.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setLoadError(errorData.error || 'Document not found. It may have been moved or deleted.');
          setIsLoading(false);
        }
      } catch {
        // Network error - let the iframe try to load anyway
      }
    };

    verifyDocument();
  }, [document?.id, isOpen]);

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setLoadError(null);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setLoadError('Failed to load document. The file may be unavailable or in an unsupported format.');
  }, []);

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
            <div className="flex-1 overflow-hidden bg-surface-950/50 relative">
              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-900/80 z-10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary-500/30 rounded-full" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-surface-300 font-medium">Loading document...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-900/90 z-10">
                  <div className="flex flex-col items-center gap-4 text-center px-8 max-w-lg">
                    <div className="w-20 h-20 rounded-full bg-error-500/20 flex items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-error-400" />
                    </div>
                    <div>
                      <p className="text-xl text-white font-semibold mb-2">Document Unavailable</p>
                      <p className="text-surface-400 text-sm">{loadError}</p>
                    </div>
                    <p className="text-surface-500 text-xs">
                      This could happen if the document was deleted, moved, or hasn't been uploaded to the server yet.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white rounded-lg transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setIsLoading(true);
                          setLoadError(null);
                        }}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'top center',
                }}
                className="w-full h-full"
              >
                {(() => {
                  const fileCategory = getFileCategory(document.fileType);
                  const documentUrl = getDocumentUrl();

                  // Check if this is a local document that can't be viewed
                  if (!canViewDocument()) {
                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center px-8">
                          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-warning-500/20 flex items-center justify-center">
                            <AlertCircle className="w-12 h-12 text-warning-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2">
                            Document Session Expired
                          </h3>
                          <p className="text-surface-400 mb-6 max-w-md">
                            This document was uploaded locally and its viewing session has expired.
                            Please upload the document again to view it.
                          </p>
                          <p className="text-surface-500 text-sm">
                            Tip: Upload documents when connected to the server for permanent storage.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // Check if we have a valid URL
                  if (!documentUrl) {
                    setLoadError('Unable to load document. The document URL is not available.');
                    return null;
                  }

                  // PDF Viewer - use object tag for better cross-origin support
                  if (fileCategory === 'pdf') {
                    return (
                      <div className="w-full h-full flex flex-col">
                        {/* Primary: object tag which handles PDFs better cross-origin */}
                        <object
                          data={documentUrl}
                          type="application/pdf"
                          className="w-full h-full"
                          onLoad={handleIframeLoad}
                        >
                          {/* Fallback: iframe without sandbox restrictions */}
                          <iframe
                            src={documentUrl}
                            className="w-full h-full border-0"
                            title={document.title}
                            onLoad={handleIframeLoad}
                            onError={handleIframeError}
                          />
                        </object>
                      </div>
                    );
                  }

                  // Image Viewer
                  if (fileCategory === 'image') {
                    return (
                      <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
                        <img
                          src={documentUrl}
                          alt={document.title}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                          onLoad={handleIframeLoad}
                          onError={handleIframeError}
                        />
                      </div>
                    );
                  }

                  // Office Documents - use Google Docs Viewer or Office Online
                  if (['document', 'spreadsheet', 'presentation'].includes(fileCategory)) {
                    const googleDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(documentUrl)}&embedded=true`;
                    return (
                      <iframe
                        src={googleDocsUrl}
                        className="w-full h-full border-0"
                        title={document.title}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                      />
                    );
                  }

                  // Text files - display in pre tag
                  if (fileCategory === 'text') {
                    return (
                      <iframe
                        src={documentUrl}
                        className="w-full h-full border-0 bg-white"
                        title={document.title}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                      />
                    );
                  }

                  // Unsupported file type
                  return (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center px-8">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-surface-800 flex items-center justify-center">
                          <FileWarning className="w-12 h-12 text-surface-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Preview Not Available
                        </h3>
                        <p className="text-surface-400 mb-6 max-w-md">
                          This file type ({document.fileType.toUpperCase()}) cannot be previewed
                          in the browser. Please download the file to view it.
                        </p>
                        {canDownload && (
                          <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
                          >
                            <Download className="w-5 h-5" />
                            Download Document
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
