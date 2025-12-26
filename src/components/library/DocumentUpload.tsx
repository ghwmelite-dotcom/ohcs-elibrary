import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { useLibraryStore } from '@/stores/libraryStore';
import { cn } from '@/utils/cn';
import { formatFileSize } from '@/utils/formatters';
import type { DocumentCategory } from '@/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
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
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      accessLevel: 'internal',
    },
  });

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

  const onSubmit = async (data: UploadFormData) => {
    const validFiles = files.filter((f) => f.status === 'pending');
    if (validFiles.length === 0) return;

    // Upload all files with animation
    await Promise.all(
      files.map(async (f, i) => {
        if (f.status !== 'pending') return;

        // Simulate upload progress animation
        await simulateUpload(f, i);

        // Create file URL for local storage (using object URL for now)
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

            <Input
              label="Tags"
              placeholder="Enter tags separated by commas"
              helperText="E.g., policy, HR, training, 2024"
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
