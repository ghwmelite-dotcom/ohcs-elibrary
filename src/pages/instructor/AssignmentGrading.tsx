/**
 * Assignment Grading Page
 * Instructor interface for grading assignment submissions with rubric support
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Download,
  ExternalLink,
  MessageSquare,
  FileText,
  User,
  Clock,
  Star,
  Award,
  Save,
  AlertCircle,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Minus,
} from 'lucide-react';
import { useInstructorStore } from '@/stores/instructorStore';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';
import type { AssignmentSubmission, RubricCriterion, Rubric } from '@/types/lms';

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

// ============================================================================
// RUBRIC GRADING FORM
// ============================================================================
interface RubricGradingFormProps {
  rubric: Rubric;
  scores: Record<string, number>;
  onScoreChange: (criterionId: string, score: number) => void;
}

function RubricGradingForm({ rubric, scores, onScoreChange }: RubricGradingFormProps) {
  const totalScore = Object.values(scores).reduce((sum, s) => sum + (s || 0), 0);
  const maxScore = rubric.maxScore || rubric.criteria.reduce((sum, c) =>
    sum + Math.max(...c.levels.map(l => l.score)), 0
  );

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          Rubric Scoring
        </h3>
        <div className="text-sm">
          <span className="text-surface-500">Total: </span>
          <span className="font-bold text-violet-600">
            {totalScore}/{maxScore} points
          </span>
        </div>
      </div>

      <div className="divide-y divide-surface-100 dark:divide-surface-700">
        {rubric.criteria.map((criterion) => {
          const currentScore = scores[criterion.id];
          const maxCriterionScore = Math.max(...criterion.levels.map(l => l.score));

          return (
            <div key={criterion.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-100">
                    {criterion.name}
                  </p>
                  {criterion.description && (
                    <p className="text-sm text-surface-500 mt-0.5">
                      {criterion.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm text-surface-500">Weight: {criterion.weight}%</span>
                  <div className="text-lg font-bold text-surface-900 dark:text-surface-100">
                    {currentScore ?? '-'} / {maxCriterionScore}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {criterion.levels.map((level, idx) => (
                  <button
                    key={idx}
                    onClick={() => onScoreChange(criterion.id, level.score)}
                    className={cn(
                      'p-3 rounded-lg text-left transition-all border-2',
                      currentScore === level.score
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 ring-2 ring-violet-200'
                        : 'border-surface-200 dark:border-surface-700 hover:border-violet-300 hover:bg-surface-50 dark:hover:bg-surface-700'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                        {level.score}
                      </span>
                      {currentScore === level.score && (
                        <CheckCircle2 className="w-5 h-5 text-violet-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {level.label}
                    </p>
                    {level.description && (
                      <p className="text-xs text-surface-500 mt-1 line-clamp-2">
                        {level.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Score Summary */}
      <div className="px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border-t border-violet-100 dark:border-violet-800">
        <div className="flex items-center justify-between">
          <span className="font-medium text-violet-700 dark:text-violet-300">
            Total Rubric Score
          </span>
          <span className="text-2xl font-bold text-violet-600">
            {totalScore} / {maxScore}
          </span>
        </div>
        <div className="mt-2">
          <div className="h-2 bg-violet-200 dark:bg-violet-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(totalScore / maxScore) * 100}%` }}
              className="h-full bg-violet-500 rounded-full"
            />
          </div>
          <p className="text-sm text-violet-600 dark:text-violet-400 mt-1 text-right">
            {Math.round((totalScore / maxScore) * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUBMISSION CARD
// ============================================================================
interface SubmissionCardProps {
  submission: AssignmentSubmission & { studentName?: string; studentEmail?: string; studentAvatar?: string };
  isSelected: boolean;
  onClick: () => void;
}

function SubmissionCard({ submission, isSelected, onClick }: SubmissionCardProps) {
  const statusColors: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    graded: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    returned: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg text-left transition-all',
        isSelected
          ? 'bg-violet-50 dark:bg-violet-900/30 border-2 border-violet-500'
          : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-violet-300'
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar
          src={submission.studentAvatar}
          name={submission.studentName || 'Student'}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
            {submission.studentName || 'Unknown Student'}
          </p>
          <p className="text-xs text-surface-500 truncate">
            {submission.submittedAt
              ? new Date(submission.submittedAt).toLocaleDateString()
              : 'Not submitted'}
          </p>
        </div>
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[submission.status])}>
          {submission.status === 'graded' && submission.percentage
            ? `${Math.round(submission.percentage)}%`
            : submission.status}
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AssignmentGrading() {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Grading form state
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [overrideScore, setOverrideScore] = useState<number | null>(null);

  // Fetch assignment and submissions
  const fetchData = useCallback(async () => {
    if (!assignmentId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch assignment details (instructor endpoint includes rubric)
      const assignmentData = await authFetch(`${API_BASE}/lms/instructor/assignments/${assignmentId}`);
      setAssignment(assignmentData);

      // Fetch submissions
      const submissionsData = await authFetch(
        `${API_BASE}/lms/instructor/assignments/${assignmentId}/submissions`
      );
      setSubmissions(submissionsData.submissions || []);

      // Auto-select first pending submission
      if (submissionsData.submissions?.length > 0) {
        const pending = submissionsData.submissions.find((s: any) => s.status !== 'graded');
        if (pending) {
          handleSelectSubmission(pending);
        } else {
          handleSelectSubmission(submissionsData.submissions[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching assignment:', err);
      setError(err.message || 'Failed to load assignment');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setRubricScores(submission.rubricScores || {});
    setFeedback(submission.feedback || '');
    setOverrideScore(null);
  };

  const handleRubricScoreChange = (criterionId: string, score: number) => {
    setRubricScores(prev => ({
      ...prev,
      [criterionId]: score,
    }));
  };

  const calculateTotalScore = () => {
    if (overrideScore !== null) return overrideScore;
    return Object.values(rubricScores).reduce((sum, s) => sum + (s || 0), 0);
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission || !assignmentId) return;

    setIsSaving(true);
    try {
      const score = calculateTotalScore();

      await authFetch(`${API_BASE}/lms/submissions/${selectedSubmission.id}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          score,
          feedback,
          rubricScores: assignment?.rubric ? rubricScores : undefined,
        }),
      });

      // Update local state
      setSubmissions(prev =>
        prev.map(s =>
          s.id === selectedSubmission.id
            ? { ...s, status: 'graded', score, feedback, rubricScores, percentage: (score / assignment.maxScore) * 100 }
            : s
        )
      );

      // Move to next pending submission
      const currentIndex = submissions.findIndex(s => s.id === selectedSubmission.id);
      const nextPending = submissions.find((s, i) => i > currentIndex && s.status !== 'graded');
      if (nextPending) {
        handleSelectSubmission(nextPending);
      }
    } catch (err: any) {
      console.error('Error saving grade:', err);
      setError(err.message || 'Failed to save grade');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'pending' && s.status === 'graded') return false;
    if (filter === 'graded' && s.status !== 'graded') return false;
    if (searchQuery && !s.studentName?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const pendingCount = submissions.filter(s => s.status !== 'graded').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;

  // Loading state
  if (isLoading) {
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
        <Button onClick={() => navigate(`/instructor/courses/${courseId}/grades`)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Gradebook
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/instructor/courses/${courseId}/grades`)}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-semibold text-surface-900 dark:text-surface-100">
                  Grade: {assignment.title}
                </h1>
                <p className="text-sm text-surface-500">
                  {pendingCount} pending · {gradedCount} graded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-surface-500">
                Max Score: <span className="font-bold">{assignment.maxScore}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Submissions List */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden sticky top-24">
              {/* Filters */}
              <div className="p-3 border-b border-surface-200 dark:border-surface-700">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                  />
                </div>
                <div className="flex gap-1">
                  {(['all', 'pending', 'graded'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                        filter === f
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                          : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submissions */}
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-3 space-y-2">
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                    <p className="text-sm text-surface-500">No submissions found</p>
                  </div>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      isSelected={selectedSubmission?.id === submission.id}
                      onClick={() => handleSelectSubmission(submission)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Grading Panel */}
          <div className="flex-1 min-w-0">
            {selectedSubmission ? (
              <div className="space-y-6">
                {/* Student Info & Submission */}
                <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={selectedSubmission.studentAvatar}
                        name={selectedSubmission.studentName || 'Student'}
                        size="lg"
                      />
                      <div>
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                          {selectedSubmission.studentName || 'Unknown Student'}
                        </h2>
                        <p className="text-sm text-surface-500">
                          {selectedSubmission.studentEmail}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-surface-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Submitted {new Date(selectedSubmission.submittedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      selectedSubmission.status === 'graded'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    )}>
                      {selectedSubmission.status === 'graded' ? 'Graded' : 'Pending'}
                    </div>
                  </div>

                  {/* Submission Content */}
                  {selectedSubmission.content && (
                    <div className="mb-4">
                      <h3 className="font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Written Response
                      </h3>
                      <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg text-surface-700 dark:text-surface-300">
                        <p className="whitespace-pre-wrap">{selectedSubmission.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                    <div>
                      <h3 className="font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Submitted Files
                      </h3>
                      <div className="space-y-2">
                        {selectedSubmission.files.map((file: any, idx: number) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"
                          >
                            <FileText className="w-5 h-5 text-surface-400" />
                            <span className="flex-1 text-sm text-surface-700 dark:text-surface-300">
                              {file.name}
                            </span>
                            <Download className="w-4 h-4 text-surface-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rubric Scoring (if rubric exists) */}
                {assignment.rubric && (
                  <RubricGradingForm
                    rubric={assignment.rubric}
                    scores={rubricScores}
                    onScoreChange={handleRubricScoreChange}
                  />
                )}

                {/* Manual Score Override (if no rubric) */}
                {!assignment.rubric && (
                  <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
                      Score
                    </h3>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={overrideScore ?? ''}
                        onChange={(e) => setOverrideScore(e.target.value ? parseInt(e.target.value) : null)}
                        min={0}
                        max={assignment.maxScore}
                        placeholder="Enter score"
                        className="w-32 px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-2xl font-bold text-center"
                      />
                      <span className="text-xl text-surface-400">/ {assignment.maxScore}</span>
                    </div>
                  </div>
                )}

                {/* Feedback */}
                <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-violet-500" />
                    Feedback
                  </h3>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter feedback for the student..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <div>
                    <p className="text-sm text-surface-500">Final Score</p>
                    <p className="text-3xl font-bold text-violet-600">
                      {calculateTotalScore()} / {assignment.maxScore}
                    </p>
                    <p className="text-sm text-surface-500">
                      {Math.round((calculateTotalScore() / assignment.maxScore) * 100)}%
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveGrade}
                    disabled={isSaving || (assignment.rubric && Object.keys(rubricScores).length === 0 && overrideScore === null)}
                    size="lg"
                  >
                    {isSaving ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    Save Grade
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-12 text-center">
                <FileText className="w-16 h-16 text-surface-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  Select a Submission
                </h3>
                <p className="text-surface-500">
                  Choose a student submission from the list to start grading
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
