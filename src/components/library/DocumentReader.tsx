import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';

interface DocumentReaderProps {
  documentId: string;
  fileUrl: string;
  fileName: string;
  totalPages?: number;
  onDownload?: () => void;
}

export function DocumentReader({
  documentId,
  fileUrl,
  fileName,
  totalPages = 10,
  onDownload,
}: DocumentReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');

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

  const handlePageInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      if (!isNaN(value) && value >= 1 && value <= totalPages) {
        setCurrentPage(value);
      }
    },
    [totalPages]
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div
      className={cn(
        'flex flex-col bg-surface-100 dark:bg-surface-900 rounded-xl overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-50' : 'h-[700px]'
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-surface-100 dark:bg-surface-700 rounded-lg">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-l-lg transition-colors disabled:opacity-50"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-medium text-surface-700 dark:text-surface-300 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-r-lg transition-colors disabled:opacity-50"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={handleRotate}
            className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* View Mode */}
          <div className="flex items-center bg-surface-100 dark:bg-surface-700 rounded-lg">
            <button
              onClick={() => setViewMode('single')}
              className={cn(
                'p-2 rounded-l-lg transition-colors',
                viewMode === 'single'
                  ? 'bg-primary-500 text-white'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
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
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
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
            className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="number"
              value={currentPage}
              onChange={handlePageInput}
              min={1}
              max={totalPages}
              className="w-12 px-2 py-1 text-center bg-white dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-surface-500">/ {totalPages}</span>
          </div>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={onDownload}
            className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
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
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'top center',
          }}
          className="bg-white shadow-elevation-3 rounded-lg"
        >
          {/* Mock PDF Page - In production, use react-pdf or similar */}
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
                <div className="w-16 h-16 bg-ghana-gradient rounded-full flex items-center justify-center">
                  <span className="text-2xl">&#9733;</span>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <h2 className="text-2xl font-bold text-surface-900 mb-6 text-center">
              {fileName}
            </h2>

            {/* Mock Content */}
            <div className="space-y-4 text-surface-700">
              <p className="leading-relaxed">
                This document contains important policy guidelines and procedures for
                Ghana's civil service. All civil servants are required to familiarize
                themselves with the contents of this document.
              </p>
              <p className="leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                commodo consequat.
              </p>
              <p className="leading-relaxed">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              <p className="leading-relaxed">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab
                illo inventore veritatis et quasi architecto beatae vitae dicta sunt
                explicabo.
              </p>
            </div>

            {/* Page Number */}
            <div className="absolute bottom-8 left-0 right-0 text-center text-sm text-surface-400">
              Page {currentPage} of {totalPages}
            </div>

            {/* Ghana Flag Stripe at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-2 flex">
              <div className="flex-1 bg-accent-500" />
              <div className="flex-1 bg-secondary-500" />
              <div className="flex-1 bg-primary-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Page Thumbnails (optional sidebar) */}
      {viewMode === 'single' && (
        <div className="flex items-center justify-center gap-1 p-2 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
          {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={cn(
                'w-8 h-10 rounded border transition-all',
                currentPage === i + 1
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
              )}
            >
              <span className="text-xs text-surface-600 dark:text-surface-400">
                {i + 1}
              </span>
            </button>
          ))}
          {totalPages > 10 && (
            <span className="text-sm text-surface-400 ml-2">...</span>
          )}
        </div>
      )}
    </div>
  );
}
