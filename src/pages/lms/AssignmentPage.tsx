/**
 * Assignment Page
 * Assignment submission interface for students
 * Supports file upload, text submission, and URL submission
 * Integrated with OHCS E-Library gamification (XP, badges)
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  FileText,
  Upload,
  Link as LinkIcon,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Paperclip,
  ExternalLink,
  Send,
  Calendar,
  Award,
  Zap,
  Star,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  Trash2,
  Eye,
  Download,
  MessageSquare,
  Info,
  Check,
} from 'lucide-react';
import { useLMSStore } from '@/stores/lmsStore';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';
import type { Assignment, AssignmentSubmission, RubricCriterion } from '@/types/lms';

// ============================================================================
// FILE ICON HELPER
// ============================================================================
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="w-5 h-5 text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <ImageIcon className="w-5 h-5 text-purple-500" />;
    case 'zip':
    case 'rar':
      return <FileArchive className="w-5 h-5 text-amber-500" />;
    default:
      return <File className="w-5 h-5 text-surface-400" />;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============================================================================
// DUE DATE BADGE
// ============================================================================
function DueDateBadge({ dueDate }: { dueDate: string }) {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const hours = Math.ceil(diff / (1000 * 60 * 60));

  const isPast = diff < 0;
  const isUrgent = !isPast && days <= 1;
  const isNear = !isPast && days <= 3;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm',
      isPast
        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        : isUrgent
        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
        : isNear
        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    )}>
      <Calendar className="w-4 h-4" />
      <span>
        {isPast ? (
          'Past due'
        ) : hours < 24 ? (
          `Due in ${hours} hour${hours !== 1 ? 's' : ''}`
        ) : (
          `Due in ${days} day${days !== 1 ? 's' : ''}`
        )}
      </span>
    </div>
  );
}

// ============================================================================
// RUBRIC DISPLAY
// ============================================================================
interface RubricDisplayProps {
  criteria: RubricCriterion[];
  scores?: Record<string, number>;
  totalScore?: number;
  maxScore?: number;
}

function RubricDisplay({ criteria, scores, totalScore, maxScore }: RubricDisplayProps) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
        <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          Grading Rubric
        </h3>
        {scores && totalScore !== undefined && maxScore && (
          <span className="text-sm font-medium text-violet-600">
            {totalScore}/{maxScore} points
          </span>
        )}
      </div>
      <div className="divide-y divide-surface-100 dark:divide-surface-700">
        {criteria.map((criterion, index) => {
          const score = scores?.[criterion.id];
          const maxCriterionScore = Math.max(...criterion.levels.map(l => l.score));

          return (
            <div key={criterion.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-100">
                    {criterion.name}
                  </p>
                  {criterion.description && (
                    <p className="text-sm text-surface-500 mt-0.5">{criterion.description}</p>
                  )}
                </div>
                <span className="text-sm text-surface-500">
                  Weight: {criterion.weight}%
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3">
                {criterion.levels.map((level, levelIndex) => (
                  <div
                    key={levelIndex}
                    className={cn(
                      'p-2 rounded-lg text-center text-sm border-2 transition-colors',
                      score === level.score
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-surface-200 dark:border-surface-700'
                    )}
                  >
                    <div className="font-semibold text-surface-900 dark:text-surface-100">
                      {level.score}
                    </div>
                    <div className="text-xs text-surface-500 truncate" title={level.label}>
                      {level.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// FILE UPLOAD ZONE
// ============================================================================
interface FileUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles: number;
  maxSize: number; // bytes
  allowedTypes?: string[];
  disabled?: boolean;
}

function FileUploadZone({
  files,
  onFilesChange,
  maxFiles,
  maxSize,
  allowedTypes,
  disabled,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !disabled) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    // Filter by allowed types if specified
    let validFiles = newFiles;
    if (allowedTypes && allowedTypes.length > 0) {
      validFiles = newFiles.filter(f => {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        return allowedTypes.some(t => t === ext || t === f.type);
      });
    }

    // Filter by size
    validFiles = validFiles.filter(f => f.size <= maxSize);

    // Limit to max files
    const remainingSlots = maxFiles - files.length;
    validFiles = validFiles.slice(0, remainingSlots);

    onFilesChange([...files, ...validFiles]);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          disabled
            ? 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 cursor-not-allowed opacity-60'
            : isDragging
            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
            : 'border-surface-300 dark:border-surface-600 hover:border-violet-400 hover:bg-surface-50 dark:hover:bg-surface-800/50'
        )}
      >
        <Upload className={cn(
          'w-10 h-10 mx-auto mb-3',
          isDragging ? 'text-violet-500' : 'text-surface-400'
        )} />
        <p className="text-surface-700 dark:text-surface-300 font-medium mb-1">
          {isDragging ? 'Drop files here' : 'Drag and drop files or click to browse'}
        </p>
        <p className="text-sm text-surface-500">
          Max {maxFiles} files, up to {formatFileSize(maxSize)} each
        </p>
        {allowedTypes && allowedTypes.length > 0 && (
          <p className="text-xs text-surface-400 mt-2">
            Allowed: {allowedTypes.join(', ')}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
          accept={allowedTypes?.join(',')}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg"
            >
              {getFileIcon(file.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
              </div>
              {!disabled && (
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUBMISSION STATUS CARD
// ============================================================================
interface SubmissionStatusProps {
  submission: AssignmentSubmission;
  assignment: Assignment;
}

function SubmissionStatus({ submission, assignment }: SubmissionStatusProps) {
  const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
    draft: { color: 'surface', icon: FileText, label: 'Draft' },
    submitted: { color: 'blue', icon: Clock, label: 'Submitted' },
    late: { color: 'amber', icon: Clock, label: 'Submitted Late' },
    graded: { color: 'emerald', icon: CheckCircle, label: 'Graded' },
    returned: { color: 'violet', icon: MessageSquare, label: 'Returned' },
  };

  const config = statusConfig[submission.status] || statusConfig.submitted;
  const Icon = config.icon;

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      {/* Header */}
      <div className={cn(
        'px-6 py-4 flex items-center gap-4',
        config.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/20',
        config.color === 'blue' && 'bg-blue-50 dark:bg-blue-900/20',
        config.color === 'amber' && 'bg-amber-50 dark:bg-amber-900/20',
        config.color === 'violet' && 'bg-violet-50 dark:bg-violet-900/20',
        config.color === 'surface' && 'bg-surface-50 dark:bg-surface-800/50'
      )}>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          config.color === 'emerald' && 'bg-emerald-500',
          config.color === 'blue' && 'bg-blue-500',
          config.color === 'amber' && 'bg-amber-500',
          config.color === 'violet' && 'bg-violet-500',
          config.color === 'surface' && 'bg-surface-400'
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">
            {config.label}
          </h3>
          <p className="text-sm text-surface-500">
            {submission.submittedAt
              ? `Submitted ${new Date(submission.submittedAt).toLocaleString()}`
              : 'Not yet submitted'}
          </p>
        </div>
      </div>

      {/* Grade (if graded) */}
      {submission.status === 'graded' && (
        <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-surface-900 dark:text-surface-100">
                {submission.score || 0}
              </div>
              <div className="text-sm text-surface-500">Points</div>
            </div>
            <div className="border-x border-surface-200 dark:border-surface-700">
              <div className="text-3xl font-bold text-surface-900 dark:text-surface-100">
                {Math.round(submission.percentage || 0)}%
              </div>
              <div className="text-sm text-surface-500">Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-violet-600">
                +{submission.xpAwarded || 0}
              </div>
              <div className="text-sm text-surface-500 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> XP
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback (if any) */}
      {submission.feedback && (
        <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700">
          <h4 className="font-medium text-surface-700 dark:text-surface-300 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Instructor Feedback
          </h4>
          <div
            className="text-surface-600 dark:text-surface-400 text-sm prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: submission.feedbackHtml || submission.feedback }}
          />
        </div>
      )}

      {/* Submitted files */}
      {submission.files && submission.files.length > 0 && (
        <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700">
          <h4 className="font-medium text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Submitted Files
          </h4>
          <div className="space-y-2">
            {submission.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg"
              >
                {getFileIcon(file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AssignmentPage() {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const {
    currentAssignment: assignment,
    isLoading,
    isSending,
    error,
    fetchAssignment,
    submitAssignment,
  } = useLMSStore();

  const [textContent, setTextContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment(assignmentId);
    }
  }, [assignmentId]);

  const handleAddUrl = () => {
    if (newUrl.trim() && !urls.includes(newUrl.trim())) {
      setUrls([...urls, newUrl.trim()]);
      setNewUrl('');
    }
  };

  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!assignmentId || !assignment) return;

    // TODO: Implement file upload to get URLs
    // For now, just submit text content and URLs
    const result = await submitAssignment(assignmentId, {
      content: textContent || undefined,
      urls: urls.length > 0 ? urls : undefined,
      // files would be uploaded and converted to URLs
    });

    if (result) {
      setSubmitSuccess(true);
      // Refetch to get updated submission
      fetchAssignment(assignmentId);
    }
  };

  // Loading state
  if (isLoading && !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-surface-500">Loading assignment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !assignment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-900 px-4">
        <AlertCircle className="w-16 h-16 text-surface-300 mb-4" />
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
          Assignment not found
        </h2>
        <p className="text-surface-500 mb-4">{error || 'Unable to load the assignment.'}</p>
        <Button onClick={() => navigate(`/courses/${courseId}/learn`)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
      </div>
    );
  }

  const hasSubmission = !!assignment.userSubmission;
  const isGraded = assignment.userSubmission?.status === 'graded';
  const canSubmit = !hasSubmission || assignment.userSubmission?.status === 'draft';

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/courses/${courseId}/learn`)}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-semibold text-surface-900 dark:text-surface-100">
                  {assignment.title}
                </h1>
                <p className="text-sm text-surface-500">Assignment</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {assignment.dueDate && <DueDateBadge dueDate={assignment.dueDate} />}
              <div className="text-right">
                <div className="text-sm text-surface-500">Max Score</div>
                <div className="font-semibold text-surface-900 dark:text-surface-100">
                  {assignment.maxScore} points
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Instructions & Submission */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructions */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
              <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-violet-500" />
                Instructions
              </h2>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: assignment.instructionsHtml || assignment.instructions || '<p>No instructions provided.</p>',
                }}
              />
            </div>

            {/* Existing Submission */}
            {hasSubmission && assignment.userSubmission && (
              <SubmissionStatus
                submission={assignment.userSubmission}
                assignment={assignment}
              />
            )}

            {/* Submit Form */}
            {canSubmit && (
              <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
                <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-500" />
                  Your Submission
                </h2>

                <div className="space-y-6">
                  {/* Text Submission */}
                  {(assignment.submissionType === 'text' || assignment.submissionType === 'mixed') && (
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Written Response
                      </label>
                      <textarea
                        value={textContent}
                        onChange={e => setTextContent(e.target.value)}
                        placeholder="Enter your response here..."
                        rows={8}
                        className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                      />
                    </div>
                  )}

                  {/* File Upload */}
                  {(assignment.submissionType === 'file' || assignment.submissionType === 'mixed') && (
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        File Upload
                      </label>
                      <FileUploadZone
                        files={files}
                        onFilesChange={setFiles}
                        maxFiles={assignment.maxFiles || 5}
                        maxSize={assignment.maxFileSize || 10 * 1024 * 1024}
                        allowedTypes={assignment.allowedFileTypes}
                      />
                    </div>
                  )}

                  {/* URL Submission */}
                  {(assignment.submissionType === 'url' || assignment.submissionType === 'mixed') && (
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Links / URLs
                      </label>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="url"
                          value={newUrl}
                          onChange={e => setNewUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                        />
                        <Button variant="outline" size="sm" onClick={handleAddUrl} disabled={!newUrl.trim()}>
                          <LinkIcon className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      {urls.length > 0 && (
                        <div className="space-y-2">
                          {urls.map((url, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-surface-50 dark:bg-surface-700/50 rounded-lg"
                            >
                              <ExternalLink className="w-4 h-4 text-surface-400 flex-shrink-0" />
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-sm text-violet-600 hover:underline truncate"
                              >
                                {url}
                              </a>
                              <button
                                onClick={() => handleRemoveUrl(index)}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-700">
                    <p className="text-sm text-surface-500">
                      {assignment.latePenalty
                        ? `Late submissions: -${assignment.latePenalty}% per day`
                        : 'No late penalty'}
                    </p>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSending || (!textContent && files.length === 0 && urls.length === 0)}
                    >
                      {isSending ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : submitSuccess ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {submitSuccess ? 'Submitted!' : 'Submit Assignment'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Rubric & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Assignment Info */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
              <h3 className="font-medium text-surface-700 dark:text-surface-300 mb-4">
                Assignment Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-surface-500">
                  <span>Max Score</span>
                  <span className="font-medium text-surface-900 dark:text-surface-100">
                    {assignment.maxScore} points
                  </span>
                </div>
                {assignment.dueDate && (
                  <div className="flex justify-between text-surface-500">
                    <span>Due Date</span>
                    <span className="font-medium text-surface-900 dark:text-surface-100">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-surface-500">
                  <span>Submission Type</span>
                  <span className="font-medium text-surface-900 dark:text-surface-100 capitalize">
                    {assignment.submissionType}
                  </span>
                </div>
                {assignment.xpReward > 0 && (
                  <div className="flex justify-between text-surface-500">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" /> XP Reward
                    </span>
                    <span className="font-medium text-amber-600">
                      +{assignment.xpReward}
                    </span>
                  </div>
                )}
                {assignment.requiresPeerReview && (
                  <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
                    <div className="flex items-center gap-2 text-violet-600">
                      <Award className="w-4 h-4" />
                      <span>Peer review required ({assignment.peerReviewCount} reviews)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rubric */}
            {assignment.rubric && (
              <RubricDisplay
                criteria={assignment.rubric.criteria}
                scores={assignment.userSubmission?.rubricScores}
                totalScore={assignment.userSubmission?.score}
                maxScore={assignment.maxScore}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
