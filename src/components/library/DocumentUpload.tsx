import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Lock,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { useLibraryStore } from '@/stores/libraryStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { formatFileSize } from '@/utils/formatters';
import type { DocumentCategory } from '@/types';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const uploadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  accessLevel: z.enum(['public', 'internal', 'restricted', 'confidential', 'secret']),
  tags: z.string().optional(),
  isDownloadable: z.boolean().default(true),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentUpload({ isOpen, onClose }: DocumentUploadProps) {
  const { categories, addLocalDocument } = useLibraryStore();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      accessLevel: 'internal',
      isDownloadable: true,
    },
  });

  const isDownloadable = watch('isDownloadable');

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PDF, Word, Excel, or PowerPoint files.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit.`;
    }
    return null;
  };

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: FileUpload[] = [];
    Array.from(fileList).forEach((file) => {
      const error = validateFile(file);
      newFiles.push({
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      });
    });
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const simulateUpload = async (fileUpload: FileUpload, index: number) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, progress, status: 'uploading' } : f
        )
      );
    }
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: 'success' } : f))
    );
  };

  const uploadToCloud = async (
    file: File,
    data: UploadFormData,
    index: number,
    onProgress: (progress: number) => void
  ): Promise<boolean> => {
    try {
      // Get auth token
      const token = useAuthStore.getState().token;
      if (!token) {
        console.warn('No auth token - upload will require authentication');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', data.title + (files.filter(f => f.status === 'pending').length > 1 ? ` (${index + 1})` : ''));
      formData.append('description', data.description);
      formData.append('category', data.categoryId);
      formData.append('accessLevel', data.accessLevel);
      formData.append('isDownloadable', String(data.isDownloadable));
      if (data.tags) {
        formData.append('tags', data.tags);
      }

      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true);
          } else {
            console.error('Upload failed with status:', xhr.status, xhr.responseText);
            resolve(false);
          }
        });

        xhr.addEventListener('error', () => resolve(false));
        xhr.addEventListener('timeout', () => resolve(false));

        xhr.open('POST', `${API_BASE}/documents`);
        xhr.timeout = 600000; // 10 minute timeout for large files

        // Add auth header if token exists
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    const validFiles = files.filter((f) => f.status === 'pending');
    if (validFiles.length === 0) return;

    // Upload all files
    await Promise.all(
      files.map(async (f, i) => {
        if (f.status !== 'pending') return;

        // Update status to uploading
        setFiles((prev) =>
          prev.map((file, idx) =>
            idx === i ? { ...file, status: 'uploading' as const, progress: 0 } : file
          )
        );

        // Try cloud upload first
        const cloudSuccess = await uploadToCloud(f.file, data, i, (progress) => {
          setFiles((prev) =>
            prev.map((file, idx) =>
              idx === i ? { ...file, progress } : file
            )
          );
        });

        if (cloudSuccess) {
          // Cloud upload succeeded
          setFiles((prev) =>
            prev.map((file, idx) =>
              idx === i ? { ...file, status: 'success' as const, progress: 100 } : file
            )
          );
        } else {
          // Cloud upload failed, fall back to local storage
          // Simulate remaining progress for visual feedback
          await simulateUpload(f, i);

          // Create file URL for local storage (using object URL)
          const fileUrl = URL.createObjectURL(f.file);

          // Add document to local storage
          addLocalDocument({
            title: data.title + (validFiles.length > 1 ? ` (${i + 1})` : ''),
            description: data.description,
            category: data.categoryId as DocumentCategory,
            accessLevel: data.accessLevel,
            tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
            fileName: f.file.name,
            fileSize: f.file.size,
            fileType: f.file.type,
            fileUrl: fileUrl,
          });
        }
      })
    );

    // Close modal and reset
    setTimeout(() => {
      reset();
      setFiles([]);
      onClose();
    }, 1000);
  };

  const handleClose = () => {
    reset();
    setFiles([]);
    onClose();
  };

  const validFilesCount = files.filter((f) => f.status !== 'error').length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Document" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 dark:hover:border-primary-500'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES.join(',')}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <Upload
            className={cn(
              'w-12 h-12 mx-auto mb-4',
              isDragging
                ? 'text-primary-500'
                : 'text-surface-400 dark:text-surface-500'
            )}
          />
          <p className="text-surface-700 dark:text-surface-300 font-medium">
            {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-sm text-surface-500 mt-2">
            PDF, Word, Excel, PowerPoint up to {formatFileSize(MAX_FILE_SIZE)}
          </p>
        </div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {files.map((fileUpload, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    fileUpload.status === 'error'
                      ? 'bg-error-50 dark:bg-error-900/20'
                      : 'bg-surface-100 dark:bg-surface-700'
                  )}
                >
                  <FileText
                    className={cn(
                      'w-8 h-8 flex-shrink-0',
                      fileUpload.status === 'error'
                        ? 'text-error-500'
                        : 'text-primary-500'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                      {fileUpload.file.name}
                    </p>
                    <p
                      className={cn(
                        'text-xs',
                        fileUpload.status === 'error'
                          ? 'text-error-600 dark:text-error-400'
                          : 'text-surface-500'
                      )}
                    >
                      {fileUpload.error || formatFileSize(fileUpload.file.size)}
                    </p>
                    {fileUpload.status === 'uploading' && (
                      <div className="mt-2 h-1.5 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${fileUpload.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {fileUpload.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-success-500" />
                    )}
                    {fileUpload.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-error-500" />
                    )}
                    {fileUpload.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    )}
                    {fileUpload.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-surface-400 hover:text-error-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Details */}
        {validFilesCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-700"
          >
            <Input
              label="Document Title"
              placeholder="Enter document title"
              error={errors.title?.message}
              {...register('title')}
            />

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Describe the document content and purpose..."
                className={cn(
                  'w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                  'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  'resize-none min-h-[100px]',
                  errors.description && 'border-error-500 focus:ring-error-500'
                )}
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Category
                </label>
                <select
                  className={cn(
                    'w-full px-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                    'text-surface-900 dark:text-surface-50',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    errors.categoryId && 'border-error-500'
                  )}
                  {...register('categoryId')}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-error-600">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Access Level
                </label>
                <select
                  className={cn(
                    'w-full px-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                    'text-surface-900 dark:text-surface-50',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                  )}
                  {...register('accessLevel')}
                >
                  <option value="public">Public</option>
                  <option value="internal">Internal</option>
                  <option value="restricted">Restricted</option>
                  <option value="confidential">Confidential</option>
                  <option value="secret">Secret</option>
                </select>
              </div>
            </div>

            {/* Download Permission Toggle */}
            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl border border-surface-200 dark:border-surface-600">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isDownloadable
                    ? 'bg-success-100 dark:bg-success-900/30'
                    : 'bg-surface-200 dark:bg-surface-600'
                )}>
                  {isDownloadable ? (
                    <Download className="w-5 h-5 text-success-600 dark:text-success-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-surface-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-50">
                    Allow Downloads
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {isDownloadable
                      ? 'Users can download this document'
                      : 'Users can only view, not download'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...register('isDownloadable')}
                />
                <div className={cn(
                  'w-11 h-6 rounded-full peer transition-colors duration-200',
                  'bg-surface-300 dark:bg-surface-600',
                  'peer-checked:bg-success-500 dark:peer-checked:bg-success-600',
                  'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
                  'after:bg-white after:rounded-full after:h-5 after:w-5',
                  'after:transition-transform after:duration-200',
                  'peer-checked:after:translate-x-5'
                )} />
              </label>
            </div>

            <Input
              label="Tags"
              placeholder="Enter tags separated by commas"
              hint="E.g., policy, HR, training, 2024"
              {...register('tags')}
            />
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={validFilesCount === 0}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Upload {validFilesCount > 0 && `(${validFilesCount})`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
