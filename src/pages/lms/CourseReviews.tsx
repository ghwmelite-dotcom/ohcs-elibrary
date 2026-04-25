/**
 * Course Reviews Page
 * View and submit course ratings and reviews
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  User,
  Clock,
  Loader2,
  AlertCircle,
  X,
  Check,
  GraduationCap,
  Edit2,
  Trash2,
  Flag,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

// API configuration
const API_BASE = import.meta.env.PROD
  ? 'https://api.ohcselibrary.xyz/api/v1'
  : '/api/v1';

const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return localStorage.getItem('auth_token');
  }
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }
  return response.json();
};

interface Review {
  id: string;
  courseId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  userDepartment?: string;
  rating: number;
  review?: string;
  helpfulVotes: number;
  instructorResponse?: string;
  instructorRespondedAt?: string;
  isHidden: number;
  createdAt: string;
  updatedAt: string;
}

interface ReviewsData {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  userReview?: Review | null;
}

// Animated background
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white to-primary-50/30 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800" />
      <motion.div
        className="absolute top-20 -left-32 w-96 h-96 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 -right-32 w-96 h-96 bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// Star rating input component
function StarRating({
  rating,
  onChange,
  size = 'md',
  readonly = false,
}: {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            'transition-transform',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              (hovered || rating) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'text-surface-300 dark:text-surface-600'
            )}
          />
        </button>
      ))}
    </div>
  );
}

// Rating distribution bar
function RatingBar({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-surface-600 dark:text-surface-400 w-12">
        {star} star{star > 1 ? 's' : ''}
      </span>
      <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className="h-full bg-amber-400 rounded-full"
        />
      </div>
      <span className="text-sm text-surface-500 w-8 text-right">{count}</span>
    </div>
  );
}

// Review card component
function ReviewCard({
  review,
  isOwnReview,
  onEdit,
  onDelete,
  onHelpful,
  isInstructor,
  onRespond,
  onHide,
}: {
  review: Review;
  isOwnReview: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onHelpful: () => void;
  isInstructor: boolean;
  onRespond: (response: string) => void;
  onHide: (hidden: boolean) => void;
}) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [response, setResponse] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {review.userAvatar ? (
            <img
              src={review.userAvatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-surface-900 dark:text-surface-50">
                  {review.userName || 'Anonymous'}
                </span>
                {isOwnReview && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">
                    You
                  </span>
                )}
              </div>
              {review.userDepartment && (
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {review.userDepartment}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOwnReview && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-500 hover:text-red-600 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              {isInstructor && !isOwnReview && (
                <button
                  onClick={() => onHide(!review.isHidden)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    review.isHidden
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                      : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500'
                  )}
                  title={review.isHidden ? 'Unhide' : 'Hide'}
                >
                  <Flag className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Rating and date */}
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={review.rating} readonly size="sm" />
            <span className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(review.createdAt)}
            </span>
          </div>

          {/* Review text */}
          {review.review && (
            <p className="mt-3 text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
              {review.review}
            </p>
          )}

          {/* Helpful button */}
          <div className="flex items-center gap-4 mt-4">
            {!isOwnReview && (
              <button
                onClick={onHelpful}
                className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful ({review.helpfulVotes})
              </button>
            )}
          </div>

          {/* Instructor response */}
          {review.instructorResponse && (
            <div className="mt-4 p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg border-l-4 border-primary-500">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  Instructor Response
                </span>
                {review.instructorRespondedAt && (
                  <span className="text-xs text-surface-500">
                    {formatDate(review.instructorRespondedAt)}
                  </span>
                )}
              </div>
              <p className="text-surface-700 dark:text-surface-300 text-sm whitespace-pre-wrap">
                {review.instructorResponse}
              </p>
            </div>
          )}

          {/* Response form for instructor */}
          {isInstructor && !isOwnReview && !review.instructorResponse && (
            <div className="mt-4">
              {showResponseForm ? (
                <div className="space-y-3">
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Write your response..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowResponseForm(false);
                        setResponse('');
                      }}
                      className="px-3 py-1.5 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onRespond(response);
                        setShowResponseForm(false);
                        setResponse('');
                      }}
                      disabled={!response.trim()}
                      className="px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      Submit Response
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResponseForm(true)}
                  className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <MessageSquare className="w-4 h-4" />
                  Respond to this review
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Review form modal
function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  existingReview,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; review?: string }) => void;
  existingReview?: Review | null;
  isLoading: boolean;
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [review, setReview] = useState(existingReview?.review || '');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setReview(existingReview.review || '');
    } else {
      setRating(0);
      setReview('');
    }
  }, [existingReview]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            {existingReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
              Your Rating
            </label>
            <div className="flex justify-center">
              <StarRating rating={rating} onChange={setRating} size="lg" />
            </div>
            <p className="text-center text-sm text-surface-500 mt-2">
              {rating === 0 && 'Click to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Your Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this course..."
              rows={5}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-surface-200 dark:border-surface-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ rating, review })}
            disabled={rating === 0 || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {existingReview ? 'Update Review' : 'Submit Review'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CourseReviews() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  const isInstructor = user?.role && ['admin', 'super_admin', 'director', 'instructor', 'librarian'].includes(user.role);

  const fetchData = useCallback(async () => {
    if (!courseId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch course info
      const courseData = await authFetch(`${API_BASE}/lms/courses/${courseId}`);
      setCourse(courseData);

      // Fetch reviews
      const reviewsResponse = await authFetch(
        `${API_BASE}/lms/courses/${courseId}/reviews?page=${page}&sort=${sortBy}`
      );
      setReviewsData(reviewsResponse);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, page, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitReview = async (data: { rating: number; review?: string }) => {
    if (!courseId) return;

    setIsSubmitting(true);
    try {
      await authFetch(`${API_BASE}/lms/courses/${courseId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!courseId || !confirm('Are you sure you want to delete your review?')) return;

    try {
      await authFetch(`${API_BASE}/lms/courses/${courseId}/reviews`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      await authFetch(`${API_BASE}/lms/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRespond = async (reviewId: string, response: string) => {
    try {
      await authFetch(`${API_BASE}/lms/reviews/${reviewId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleHide = async (reviewId: string, hidden: boolean) => {
    try {
      await authFetch(`${API_BASE}/lms/reviews/${reviewId}/hide`, {
        method: 'PUT',
        body: JSON.stringify({ hidden }),
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-surface-600 dark:text-surface-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <AnimatedBackground />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-2 hover:bg-white/80 dark:hover:bg-surface-800/80 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mb-1">
              <GraduationCap className="w-4 h-4" />
              <Link to={`/courses/${courseId}`} className="hover:text-primary-600">
                {course?.title || 'Course'}
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              Reviews & Ratings
            </h1>
          </div>

          {user && !reviewsData?.userReview && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-lg shadow-primary-500/20 transition-colors"
            >
              <Star className="w-5 h-5" />
              <span className="hidden sm:inline">Write a Review</span>
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </motion.div>
        )}

        {/* Rating summary */}
        {reviewsData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Average rating */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 text-center">
              <div className="text-5xl font-bold text-surface-900 dark:text-surface-50 mb-2">
                {reviewsData.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                <StarRating rating={Math.round(reviewsData.averageRating)} readonly />
              </div>
              <p className="text-surface-500 dark:text-surface-400">
                {reviewsData.totalReviews} review{reviewsData.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating distribution */}
            <div className="md:col-span-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h3 className="text-sm font-medium text-surface-900 dark:text-surface-100 mb-4">
                Rating Distribution
              </h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar
                    key={star}
                    star={star}
                    count={reviewsData.ratingDistribution[star] || 0}
                    total={reviewsData.totalReviews}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User's review banner */}
        {reviewsData?.userReview && (
          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="font-medium text-primary-700 dark:text-primary-300">
                    You rated this course {reviewsData.userReview.rating} star{reviewsData.userReview.rating !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-primary-600 dark:text-primary-400">
                    {new Date(reviewsData.userReview.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-800/30 rounded-lg transition-colors"
              >
                Edit Review
              </button>
            </div>
          </div>
        )}

        {/* Sort and filters */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            All Reviews
          </h2>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="helpful">Most Helpful</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
          </div>
        </div>

        {/* Reviews list */}
        <div className="space-y-4">
          <AnimatePresence>
            {reviewsData?.reviews.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  No reviews yet
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  Be the first to review this course!
                </p>
                {user && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Star className="w-4 h-4" />
                    Write a Review
                  </button>
                )}
              </motion.div>
            ) : (
              reviewsData?.reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isOwnReview={review.userId === user?.id}
                  onEdit={() => setIsModalOpen(true)}
                  onDelete={handleDeleteReview}
                  onHelpful={() => handleHelpful(review.id)}
                  isInstructor={!!isInstructor}
                  onRespond={(response) => handleRespond(review.id, response)}
                  onHide={(hidden) => handleHide(review.id, hidden)}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {reviewsData && reviewsData.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: reviewsData.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-10 h-10 rounded-lg font-medium transition-colors',
                  p === page
                    ? 'bg-primary-600 text-white'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ReviewModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmitReview}
            existingReview={reviewsData?.userReview}
            isLoading={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
