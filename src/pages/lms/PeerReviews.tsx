/**
 * Peer Reviews Page
 * Shows pending peer reviews and allows users to submit reviews
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  FileText,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Star,
  BookOpen,
  Calendar,
  ExternalLink,
  Download,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/shared/Spinner';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return localStorage.getItem('auth_token');
  }
};

interface PendingReview {
  id: string;
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentInstructions: string;
  courseTitle: string;
  courseId: string;
  peerReviewDueDate: string | null;
  submissionContent: string | null;
  submissionFiles: string | null;
  submissionDate: string;
  rubric: any | null;
  assignedAt: string;
}

export default function PeerReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/lms/peer-reviews/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending reviews');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load peer reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
            <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Peer Reviews
          </h1>
        </div>
        <p className="text-surface-600 dark:text-surface-400">
          Review your peers' submissions and provide constructive feedback
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Empty State */}
      {reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700"
        >
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
            All caught up!
          </h2>
          <p className="text-surface-500 mb-6">
            You have no pending peer reviews at the moment
          </p>
          <button
            onClick={() => navigate('/my-courses')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Go to My Courses
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
              <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                {reviews.length}
              </p>
              <p className="text-sm text-surface-500">Pending Reviews</p>
            </div>
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {reviews.filter(r => isOverdue(r.peerReviewDueDate)).length}
              </p>
              <p className="text-sm text-surface-500">Overdue</p>
            </div>
          </div>

          {/* Review Cards */}
          <AnimatePresence>
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'bg-white dark:bg-surface-800 rounded-xl border p-5 hover:shadow-lg transition-shadow cursor-pointer',
                  isOverdue(review.peerReviewDueDate)
                    ? 'border-red-300 dark:border-red-800'
                    : 'border-surface-200 dark:border-surface-700'
                )}
                onClick={() => navigate(`/peer-reviews/${review.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Course Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                        {review.courseTitle}
                      </span>
                      {isOverdue(review.peerReviewDueDate) && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                          Overdue
                        </span>
                      )}
                    </div>

                    {/* Assignment Title */}
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                      {review.assignmentTitle}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-surface-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Submitted: {formatDate(review.submissionDate)}</span>
                      </div>
                      {review.peerReviewDueDate && (
                        <div className={cn(
                          'flex items-center gap-1',
                          isOverdue(review.peerReviewDueDate) && 'text-red-500'
                        )}>
                          <Clock className="w-4 h-4" />
                          <span>Due: {formatDate(review.peerReviewDueDate)}</span>
                        </div>
                      )}
                      {review.rubric && (
                        <div className="flex items-center gap-1 text-violet-500">
                          <Star className="w-4 h-4" />
                          <span>Rubric-based</span>
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    {review.submissionContent && (
                      <p className="mt-3 text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                        {review.submissionContent.substring(0, 200)}...
                      </p>
                    )}

                    {/* Files */}
                    {review.submissionFiles && (
                      <div className="mt-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-surface-400" />
                        <span className="text-sm text-surface-500">
                          {JSON.parse(review.submissionFiles).length} file(s) attached
                        </span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-surface-400 ml-4" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
