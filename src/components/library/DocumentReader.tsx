import { useState, useCallback, useEffect, useRef } from 'react';
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
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Loader2,
  AlertCircle,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  ExternalLink,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

interface DocumentReaderProps {
  documentId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  totalPages?: number;
  onDownload?: () => void;
  source?: 'local' | 'google_drive';
  externalUrl?: string;
}

// Helper to determine content type category
function getContentCategory(fileType: string): 'pdf' | 'document' | 'audio' | 'video' | 'image' | 'other' {
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.startsWith('audio/')) return 'audio';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('image/')) return 'image';
  if (
    fileType.includes('document') ||
    fileType.includes('word') ||
    fileType.includes('spreadsheet') ||
    fileType.includes('excel') ||
    fileType.includes('presentation') ||
    fileType.includes('powerpoint') ||
    fileType.includes('text/')
  ) {
    return 'document';
  }
  return 'other';
}

// Format time for media player
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function DocumentReader({
  documentId,
  fileUrl,
  fileName,
  fileType,
  totalPages = 1,
  onDownload,
  source = 'local',
  externalUrl,
}: DocumentReaderProps) {
  const contentCategory = getContentCategory(fileType);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Media player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  // Get the view URL for the document
  const viewUrl = `${API_BASE}/documents/${documentId}/view`;

  // Handle media playback
  const togglePlay = useCallback(() => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (mediaRef.current) {
      mediaRef.current.volume = value;
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = value;
    }
  }, []);

  const skipBack = useCallback(() => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Math.max(0, mediaRef.current.currentTime - 10);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Math.min(duration, mediaRef.current.currentTime + 10);
    }
  }, [duration]);

  // Document controls
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

  // Render audio player
  if (contentCategory === 'audio') {
    return (
      <div
        className={cn(
          'flex flex-col bg-surface-100 dark:bg-surface-900 rounded-xl overflow-hidden',
          isFullscreen ? 'fixed inset-0 z-50' : 'h-auto'
        )}
      >
        {/* Audio Player Header */}
        <div className="px-6 py-4 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <FileAudio className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">{fileName}</h3>
              <div className="flex items-center gap-2 text-sm text-surface-500">
                <span>Audio File</span>
                {source === 'google_drive' && (
                  <span className="flex items-center gap-1 text-blue-500">
                    <HardDrive className="w-3 h-3" />
                    Google Drive
                  </span>
                )}
              </div>
            </div>
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload} leftIcon={<Download className="w-4 h-4" />}>
                Download
              </Button>
            )}
          </div>
        </div>

        {/* Audio Player */}
        <div className="p-6 bg-gradient-to-br from-surface-800 to-surface-900">
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={viewUrl}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
              setIsLoading(false);
            }}
            onEnded={() => setIsPlaying(false)}
            onError={() => setLoadError('Failed to load audio file')}
            preload="metadata"
          />

          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-surface-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-surface-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={skipBack}
              className="p-2 text-surface-400 hover:text-white transition-colors"
              title="Skip back 10s"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            <button
              onClick={skipForward}
              className="p-2 text-surface-400 hover:text-white transition-colors"
              title="Skip forward 10s"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={toggleMute} className="text-surface-400 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1.5 bg-surface-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  // Render video player
  if (contentCategory === 'video') {
    return (
      <div
        className={cn(
          'flex flex-col bg-black rounded-xl overflow-hidden',
          isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video max-h-[600px]'
        )}
      >
        {/* Video */}
        <div className="relative flex-1 flex items-center justify-center bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}
          {loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900 z-10">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-white text-lg mb-2">Failed to load video</p>
              <p className="text-surface-400">{loadError}</p>
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 text-primary-400 hover:text-primary-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Google Drive
                </a>
              )}
            </div>
          )}
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={viewUrl}
            className="w-full h-full object-contain"
            onClick={togglePlay}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
              setIsLoading(false);
            }}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              setLoadError('Failed to load video');
              setIsLoading(false);
            }}
            onCanPlay={() => setIsLoading(false)}
            preload="metadata"
          />
        </div>

        {/* Video Controls */}
        <div className="bg-gradient-to-t from-black/90 to-transparent px-4 py-3">
          {/* Progress Bar */}
          <div className="mb-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-surface-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 text-white hover:text-primary-400 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button onClick={skipBack} className="p-2 text-white/70 hover:text-white transition-colors">
                <SkipBack className="w-4 h-4" />
              </button>
              <button onClick={skipForward} className="p-2 text-white/70 hover:text-white transition-colors">
                <SkipForward className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/70">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {source === 'google_drive' && (
                <span className="flex items-center gap-1 text-xs text-blue-400">
                  <HardDrive className="w-3 h-3" />
                  Drive
                </span>
              )}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-surface-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render image viewer
  if (contentCategory === 'image') {
    return (
      <div
        className={cn(
          'flex flex-col bg-surface-100 dark:bg-surface-900 rounded-xl overflow-hidden',
          isFullscreen ? 'fixed inset-0 z-50' : 'h-[600px]'
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-surface-400" />
            <span className="font-medium text-surface-900 dark:text-surface-50">{fileName}</span>
            {source === 'google_drive' && (
              <span className="flex items-center gap-1 text-xs text-blue-500 ml-2">
                <HardDrive className="w-3 h-3" />
                Google Drive
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleZoomOut} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-surface-500">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={handleRotate} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
              <RotateCw className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {onDownload && (
              <button onClick={onDownload} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Image View */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-surface-200 dark:bg-surface-800">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            </div>
          )}
          <img
            src={viewUrl}
            alt={fileName}
            onLoad={() => setIsLoading(false)}
            onError={() => setLoadError('Failed to load image')}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
            }}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    );
  }

  // Render PDF/Document viewer (iframe-based)
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

          {/* Source indicator */}
          {source === 'google_drive' && (
            <span className="flex items-center gap-1 text-xs text-blue-500 ml-2 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
              <HardDrive className="w-3 h-3" />
              Google Drive
            </span>
          )}
        </div>

        {/* Page Navigation - for PDFs */}
        {contentCategory === 'pdf' && totalPages > 1 && (
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
        )}

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
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Document View */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-surface-200 dark:bg-surface-800">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-100/80 dark:bg-surface-900/80 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
              <p className="mt-4 text-surface-600 dark:text-surface-400">Loading document...</p>
            </div>
          </div>
        )}
        {loadError && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
              Unable to load document
            </h3>
            <p className="text-surface-500 mb-4">{loadError}</p>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <ExternalLink className="w-4 h-4" />
                Open in new tab
              </a>
            )}
          </div>
        )}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'top center',
          }}
          className="bg-white shadow-elevation-3 rounded-lg w-full h-full"
        >
          <iframe
            src={viewUrl}
            title={fileName}
            className="w-full h-full rounded-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => setLoadError('Failed to load document')}
          />
        </motion.div>
      </div>
    </div>
  );
}
