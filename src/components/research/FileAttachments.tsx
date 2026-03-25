import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  File,
  FileText,
  FileImage,
  Trash2,
  Download,
  Filter,
  Paperclip,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import type { ResearchAttachment } from '@/types';

interface FileAttachmentsProps {
  projectId: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://ohcs-elibrary-api.ghwmelite.workers.dev';

const CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300' },
  { value: 'data', label: 'Data', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  { value: 'survey', label: 'Survey', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  { value: 'instrument', label: 'Instrument', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  { value: 'literature', label: 'Literature', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  { value: 'report', label: 'Report', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' },
  { value: 'image', label: 'Image', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' },
  { value: 'other', label: 'Other', color: 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400' },
] as const;

type CategoryValue = typeof CATEGORIES[number]['value'];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return FileText;
  return File;
}

function getCategoryConfig(category: string) {
  return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
}

export function FileAttachments({ projectId }: FileAttachmentsProps) {
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<ResearchAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>('general');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  }, [token]);

  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(
        `${API_BASE}/api/v1/research/projects/${projectId}/attachments`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        setAttachments(data.items || data.attachments || []);
      }
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, authFetch]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', selectedCategory);

        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        await fetch(
          `${API_BASE}/api/v1/research/projects/${projectId}/attachments`,
          { method: 'POST', headers, body: formData }
        );
      }
      await fetchAttachments();
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = (attachmentId: string, fileName: string) => {
    const url = `${API_BASE}/api/v1/research/projects/${projectId}/attachments/${attachmentId}/download`;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    // Add auth token as query param for direct download
    if (token) {
      a.href = `${url}?token=${encodeURIComponent(token)}`;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      const response = await authFetch(
        `${API_BASE}/api/v1/research/projects/${projectId}/attachments/${attachmentId}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      }
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const filteredAttachments = filterCategory === 'all'
    ? attachments
    : attachments.filter(a => a.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-white flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-primary-500" />
          File Attachments
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Upload and manage research documents and files
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'bg-white dark:bg-surface-800 rounded-xl border-2 border-dashed transition-all p-8',
          dragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-surface-300 dark:border-surface-600 hover:border-surface-400 dark:hover:border-surface-500'
        )}
      >
        <div className="text-center">
          <Upload className={cn(
            'w-10 h-10 mx-auto mb-3 transition-colors',
            dragOver ? 'text-primary-500' : 'text-surface-400 dark:text-surface-500'
          )} />
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            {dragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">
            Maximum file size: 50MB
          </p>

          {/* Category Selection */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="text-xs text-surface-500 dark:text-surface-400">Category:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-full border transition-colors',
                  selectedCategory === cat.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Select Files
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-600 dark:text-surface-400">
          {filteredAttachments.length} file{filteredAttachments.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors',
            showFilters
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
          )}
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full border transition-colors',
                  filterCategory === 'all'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400'
                )}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-full border transition-colors',
                    filterCategory === cat.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : filteredAttachments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <Paperclip className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-surface-500 dark:text-surface-400 text-sm">
            {attachments.length === 0 ? 'No files uploaded yet' : 'No files match the selected filter'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700 overflow-hidden">
          <AnimatePresence initial={false}>
            {filteredAttachments.map((attachment) => {
              const Icon = getFileIcon(attachment.fileType);
              const catConfig = getCategoryConfig(attachment.category);

              return (
                <motion.div
                  key={attachment.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-4 p-4"
                >
                  {/* File Icon */}
                  <div className="p-2.5 bg-surface-100 dark:bg-surface-700 rounded-lg shrink-0">
                    <Icon className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                      {attachment.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-surface-500 dark:text-surface-400">
                        {formatFileSize(attachment.fileSize)}
                      </span>
                      <span className="text-surface-300 dark:text-surface-600">|</span>
                      <span className="text-xs text-surface-500 dark:text-surface-400">
                        {attachment.uploadedBy?.name || 'Unknown'}
                      </span>
                      <span className="text-surface-300 dark:text-surface-600">|</span>
                      <span className="text-xs text-surface-500 dark:text-surface-400">
                        {new Date(attachment.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <span className={cn('px-2 py-0.5 text-xs rounded-full shrink-0', catConfig.color)}>
                    {catConfig.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDownload(attachment.id, attachment.fileName)}
                      className="p-2 text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      disabled={deletingId === attachment.id}
                      className="p-2 text-surface-400 dark:text-surface-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === attachment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default FileAttachments;
