/**
 * Peer Review Form Page
 * Allows users to view a submission and submit their peer review
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Star,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  MessageSquare,
  User,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/shared/Spinner';

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

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  levels: {
    score: number;
    label: string;
    description: string;
  }[];
}

interface Rubric {
  id: string;
  title: string;
  description: string;
  criteria: string; // JSON string
  maxScore: number;
}

interface PeerReview {
  id: string;
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentInstructions: string;
  maxScore: number;
  courseTitle: string;
  courseId: string;
  peerReviewDueDate: string | null;
  submissionContent: string | null;
  submissionContentHtml: string | null;
  submissionFiles: string | null;
  submissionUrls: string | null;
  submissionDate: string;
  rubric: Rubric | null;
  status: string;
}

export default function PeerReviewForm() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();

  const [review, setReview] = useState<PeerReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [scores, setScores] = useState<Record<string, { score: number; feedback: string }>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [overallFeedback, setOverallFeedback] = useState('');

  useEffect(() => {
    if (reviewId) {
      fetchReview();
    }
  }, [reviewId]);

  const fetchReview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/lms/peer-reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch review');
      }

      const data = await response.json();
      setReview(data.review);

      // Initialize scores from rubric
      if (data.review.rubric) {
        const criteria = JSON.parse(data.review.rubric.criteria || '[]');
        const initialScores: Record<string, { score: number; feedback: string }> = {};
        criteria.forEach((c: RubricCriterion) => {
          initialScores[c.id] = { score: 0, feedback: '' };
        });
        setScores(initialScores);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load review');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalScore = () => {
    const total = Object.values(scores).reduce((sum, s) => sum + (s.score || 0), 0);
    setTotalScore(total);
    return total;
  };

  useEffect(() => {
    calculateTotalScore();
  }, [scores]);

  const handleSubmit = async () => {
    if (!overallFeedback.trim()) {
      setError('Please provide overall feedback');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/lms/peer-reviews/${reviewId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scores,
          totalScore,
          overallFeedback,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/peer-reviews');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
            Review Submitted!
          </h2>
          <p className="text-surface-500">
            Thank you for your feedback. Redirecting...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
            Review Not Found
          </h2>
          <button
            onClick={() => navigate('/peer-reviews')}
            className="text-primary-600 hover:text-primary-700"
          >
            Go back to Peer Reviews
          </button>
        </div>
      </div>
    );
  }

  const rubricCriteria: RubricCriterion[] = review.rubric
    ? JSON.parse(review.rubric.criteria || '[]')
    : [];
  const files = review.submissionFiles ? JSON.parse(review.submissionFiles) : [];
  const urls = review.submissionUrls ? JSON.parse(review.submissionUrls) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/peer-reviews')}
          className="flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Peer Reviews
        </button>

        <div className="flex items-start justify-between">
          <div>
            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
              {review.courseTitle}
            </span>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mt-2">
              Review: {review.assignmentTitle}
            </h1>
            <p className="text-surface-500 mt-1">
              Submitted on {formatDate(review.submissionDate)}
            </p>
          </div>

          {review.peerReviewDueDate && (
            <div className="flex items-center gap-2 text-surface-500">
              <Clock className="w-4 h-4" />
              <span>Due: {formatDate(review.peerReviewDueDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Submission Content */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center gap-2">
              <User className="w-5 h-5 text-surface-400" />
              <h2 className="font-semibold text-surface-900 dark:text-surface-100">
                Peer's Submission
              </h2>
            </div>

            <div className="p-5">
              {/* Text Content */}
              {review.submissionContentHtml ? (
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: review.submissionContentHtml }}
                />
              ) : review.submissionContent ? (
                <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                  {review.submissionContent}
                </p>
              ) : null}

              {/* Files */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
                    Attached Files:
                  </p>
                  {files.map((file: any, idx: number) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-primary-500" />
                      <span className="flex-1 text-sm text-surface-700 dark:text-surface-300">
                        {file.name}
                      </span>
                      <Download className="w-4 h-4 text-surface-400" />
                    </a>
                  ))}
                </div>
              )}

              {/* URLs */}
              {urls.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
                    Links:
                  </p>
                  {urls.map((url: string, idx: number) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-primary-500" />
                      <span className="flex-1 text-sm text-surface-700 dark:text-surface-300 truncate">
                        {url}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {!review.submissionContent && files.length === 0 && urls.length === 0 && (
                <p className="text-surface-500 italic">No content available</p>
              )}
            </div>
          </div>

          {/* Assignment Instructions */}
          {review.assignmentInstructions && (
            <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-4">
              <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Assignment Instructions
              </h3>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                {review.assignmentInstructions}
              </p>
            </div>
          )}
        </div>

        {/* Right: Review Form */}
        <div className="space-y-6">
          {/* Rubric-based scoring */}
          {rubricCriteria.length > 0 ? (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  <h2 className="font-semibold text-surface-900 dark:text-surface-100">
                    Evaluation Criteria
                  </h2>
                </div>
                <span className="text-sm text-surface-500">
                  Total: {totalScore} / {review.rubric?.maxScore || 100}
                </span>
              </div>

              <div className="p-5 space-y-6">
                {rubricCriteria.map((criterion) => (
                  <div key={criterion.id} className="space-y-3">
                    <div>
                      <h3 className="font-medium text-surface-900 dark:text-surface-100">
                        {criterion.name}
                      </h3>
                      {criterion.description && (
                        <p className="text-sm text-surface-500">{criterion.description}</p>
                      )}
                    </div>

                    {/* Score Selection */}
                    <div className="flex flex-wrap gap-2">
                      {criterion.levels.map((level) => (
                        <button
                          key={level.score}
                          onClick={() =>
                            setScores((prev) => ({
                              ...prev,
                              [criterion.id]: {
                                ...prev[criterion.id],
                                score: level.score,
                              },
                            }))
                          }
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm border transition-colors',
                            scores[criterion.id]?.score === level.score
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:border-primary-300'
                          )}
                          title={level.description}
                        >
                          {level.label} ({level.score})
                        </button>
                      ))}
                    </div>

                    {/* Criterion Feedback */}
                    <textarea
                      value={scores[criterion.id]?.feedback || ''}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [criterion.id]: {
                            ...prev[criterion.id],
                            feedback: e.target.value,
                          },
                        }))
                      }
                      placeholder={`Feedback for ${criterion.name}...`}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm resize-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Simple scoring without rubric */
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
              <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Score
              </h2>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={0}
                  max={review.maxScore || 100}
                  value={totalScore}
                  onChange={(e) => setTotalScore(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                />
                <span className="text-surface-500">/ {review.maxScore || 100}</span>
              </div>
            </div>
          )}

          {/* Overall Feedback */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
            <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-500" />
              Overall Feedback
            </h2>
            <textarea
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              placeholder="Provide constructive feedback on the overall submission. What did they do well? What could be improved?"
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 resize-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !overallFeedback.trim()}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>

          <p className="text-sm text-surface-500 text-center">
            Your review will be anonymous to the submission author
          </p>
        </div>
      </div>
    </div>
  );
}
