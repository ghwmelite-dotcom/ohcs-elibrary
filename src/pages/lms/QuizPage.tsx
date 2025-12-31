/**
 * Quiz Page
 * Interactive quiz-taking interface for students
 * Supports multiple choice, true/false, and short answer questions
 * Integrated with OHCS E-Library gamification system (XP, badges)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trophy,
  Star,
  Zap,
  Target,
  Award,
  RotateCcw,
  Home,
  BookOpen,
  Flag,
  Circle,
  Check,
  X,
  HelpCircle,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useLMSStore } from '@/stores/lmsStore';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';
import confetti from 'canvas-confetti';
import type { Quiz, QuizQuestion, QuizAttempt, QuestionType } from '@/types/lms';

// ============================================================================
// TIMER COMPONENT
// ============================================================================
interface QuizTimerProps {
  timeLimit: number; // in minutes
  onTimeUp: () => void;
  isPaused?: boolean;
}

function QuizTimer({ timeLimit, onTimeUp, isPaused }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60); // Convert to seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (timeLeft <= 0) {
        onTimeUp();
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, isPaused, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft < 60;
  const isCritical = timeLeft < 30;

  return (
    <motion.div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-semibold',
        isCritical
          ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
          : isLow
          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
          : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300'
      )}
      animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
    >
      <Timer className="w-5 h-5" />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </motion.div>
  );
}

// ============================================================================
// QUESTION NAVIGATION
// ============================================================================
interface QuestionNavProps {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, any>;
  flagged: Set<string>;
  onNavigate: (index: number) => void;
}

function QuestionNav({ questions, currentIndex, answers, flagged, onNavigate }: QuestionNavProps) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
      <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
        Question Navigator
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, index) => {
          const isAnswered = answers[q.id] !== undefined;
          const isFlagged = flagged.has(q.id);
          const isCurrent = index === currentIndex;

          return (
            <motion.button
              key={q.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate(index)}
              className={cn(
                'relative w-10 h-10 rounded-lg font-medium text-sm transition-colors',
                isCurrent
                  ? 'bg-violet-600 text-white'
                  : isAnswered
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
              )}
            >
              {index + 1}
              {isFlagged && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full" />
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-surface-500">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" /> Answered
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-violet-500" /> Current
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" /> Flagged
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MULTIPLE CHOICE QUESTION
// ============================================================================
interface MultipleChoiceProps {
  question: QuizQuestion;
  selectedAnswer: string | string[] | undefined;
  onAnswer: (answer: string | string[]) => void;
  showResult?: boolean;
  correctAnswer?: string | string[];
}

function MultipleChoice({ question, selectedAnswer, onAnswer, showResult, correctAnswer }: MultipleChoiceProps) {
  const isMultiSelect = question.questionType === 'multiple_select';
  const selected = isMultiSelect
    ? (selectedAnswer as string[] || [])
    : (selectedAnswer as string | undefined);

  const handleSelect = (optionId: string) => {
    if (showResult) return;

    if (isMultiSelect) {
      const currentSelection = selected as string[];
      if (currentSelection.includes(optionId)) {
        onAnswer(currentSelection.filter(id => id !== optionId));
      } else {
        onAnswer([...currentSelection, optionId]);
      }
    } else {
      onAnswer(optionId);
    }
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option, index) => {
        const isSelected = isMultiSelect
          ? (selected as string[]).includes(option.id || String(index))
          : selected === (option.id || String(index));

        const isCorrect = showResult && (
          isMultiSelect
            ? (correctAnswer as string[] || []).includes(option.id || String(index))
            : correctAnswer === (option.id || String(index))
        );
        const isWrong = showResult && isSelected && !isCorrect;

        return (
          <motion.button
            key={option.id || index}
            whileHover={!showResult ? { scale: 1.01 } : {}}
            whileTap={!showResult ? { scale: 0.99 } : {}}
            onClick={() => handleSelect(option.id || String(index))}
            disabled={showResult}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
              showResult
                ? isCorrect
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : isWrong
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-surface-200 dark:border-surface-700 opacity-60'
                : isSelected
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700/50'
            )}
          >
            {/* Selection indicator */}
            <div className={cn(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              showResult
                ? isCorrect
                  ? 'border-emerald-500 bg-emerald-500'
                  : isWrong
                  ? 'border-red-500 bg-red-500'
                  : 'border-surface-300 dark:border-surface-600'
                : isSelected
                ? 'border-violet-500 bg-violet-500'
                : 'border-surface-300 dark:border-surface-600'
            )}>
              {showResult ? (
                isCorrect ? (
                  <Check className="w-4 h-4 text-white" />
                ) : isWrong ? (
                  <X className="w-4 h-4 text-white" />
                ) : null
              ) : isSelected ? (
                isMultiSelect ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Circle className="w-3 h-3 text-white fill-white" />
                )
              ) : null}
            </div>

            {/* Option text */}
            <span className={cn(
              'flex-1 text-surface-700 dark:text-surface-300',
              showResult && isCorrect && 'font-medium text-emerald-700 dark:text-emerald-300',
              showResult && isWrong && 'font-medium text-red-700 dark:text-red-300'
            )}>
              {option.text}
            </span>

            {/* Letter label */}
            <span className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold',
              'bg-surface-100 dark:bg-surface-700 text-surface-500'
            )}>
              {String.fromCharCode(65 + index)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================================
// TRUE/FALSE QUESTION
// ============================================================================
interface TrueFalseProps {
  question: QuizQuestion;
  selectedAnswer: string | undefined;
  onAnswer: (answer: string) => void;
  showResult?: boolean;
  correctAnswer?: string;
}

function TrueFalse({ question, selectedAnswer, onAnswer, showResult, correctAnswer }: TrueFalseProps) {
  const options = [
    { value: 'true', label: 'True', icon: CheckCircle, color: 'emerald' },
    { value: 'false', label: 'False', icon: XCircle, color: 'red' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map(option => {
        const isSelected = selectedAnswer === option.value;
        const isCorrect = showResult && correctAnswer === option.value;
        const isWrong = showResult && isSelected && !isCorrect;
        const Icon = option.icon;

        return (
          <motion.button
            key={option.value}
            whileHover={!showResult ? { scale: 1.02 } : {}}
            whileTap={!showResult ? { scale: 0.98 } : {}}
            onClick={() => !showResult && onAnswer(option.value)}
            disabled={showResult}
            className={cn(
              'flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all',
              showResult
                ? isCorrect
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : isWrong
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-surface-200 dark:border-surface-700 opacity-60'
                : isSelected
                ? option.color === 'emerald'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700/50'
            )}
          >
            <Icon className={cn(
              'w-12 h-12',
              option.color === 'emerald' ? 'text-emerald-500' : 'text-red-500'
            )} />
            <span className="text-lg font-semibold text-surface-700 dark:text-surface-300">
              {option.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================================
// SHORT ANSWER QUESTION
// ============================================================================
interface ShortAnswerProps {
  question: QuizQuestion;
  selectedAnswer: string | undefined;
  onAnswer: (answer: string) => void;
  showResult?: boolean;
  correctAnswer?: string;
  isCorrect?: boolean;
}

function ShortAnswer({ question, selectedAnswer, onAnswer, showResult, correctAnswer, isCorrect }: ShortAnswerProps) {
  return (
    <div className="space-y-4">
      <textarea
        value={selectedAnswer || ''}
        onChange={e => onAnswer(e.target.value)}
        disabled={showResult}
        placeholder="Type your answer here..."
        className={cn(
          'w-full px-4 py-3 rounded-xl border-2 resize-none h-32 text-surface-700 dark:text-surface-300',
          'focus:ring-2 focus:ring-violet-500 focus:border-transparent',
          showResult
            ? isCorrect
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800'
        )}
      />
      {showResult && correctAnswer && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
            Correct Answer:
          </p>
          <p className="text-emerald-800 dark:text-emerald-200">{correctAnswer}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// QUIZ RESULTS
// ============================================================================
interface QuizResultsProps {
  quiz: Quiz;
  attempt: QuizAttempt;
  questions: QuizQuestion[];
  onRetry: () => void;
  onBackToCourse: () => void;
}

function QuizResults({ quiz, attempt, questions, onRetry, onBackToCourse }: QuizResultsProps) {
  const passed = attempt.passed;
  const percentage = attempt.percentage || 0;

  useEffect(() => {
    if (passed) {
      // Celebration confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8B5CF6', '#10B981', '#F59E0B'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8B5CF6', '#10B981', '#F59E0B'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [passed]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      {/* Result Card */}
      <div className={cn(
        'rounded-2xl p-8 text-center mb-8',
        passed
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
          : 'bg-gradient-to-br from-amber-500 to-orange-600'
      )}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center"
        >
          {passed ? (
            <Trophy className="w-12 h-12 text-white" />
          ) : (
            <Target className="w-12 h-12 text-white" />
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-2"
        >
          {passed ? 'Congratulations!' : 'Keep Learning!'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/80 text-lg"
        >
          {passed
            ? 'You passed the quiz!'
            : `You need ${quiz.passingScore}% to pass. Try again!`}
        </motion.p>
      </div>

      {/* Score Details */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 mb-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-surface-900 dark:text-surface-100 mb-1">
              {Math.round(percentage)}%
            </div>
            <div className="text-sm text-surface-500">Your Score</div>
          </div>
          <div className="text-center border-x border-surface-200 dark:border-surface-700">
            <div className="text-4xl font-bold text-surface-900 dark:text-surface-100 mb-1">
              {attempt.score || 0}/{attempt.maxScore || questions.length}
            </div>
            <div className="text-sm text-surface-500">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-violet-600 mb-1">
              +{attempt.xpAwarded || 0}
            </div>
            <div className="text-sm text-surface-500 flex items-center justify-center gap-1">
              <Zap className="w-4 h-4 text-amber-500" /> XP Earned
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div className="text-sm text-surface-500">Time Spent</div>
            <div className="font-semibold text-surface-900 dark:text-surface-100">
              {Math.floor((attempt.timeSpent || 0) / 60)} min {(attempt.timeSpent || 0) % 60} sec
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-sm text-surface-500">Attempt</div>
            <div className="font-semibold text-surface-900 dark:text-surface-100">
              #{attempt.attemptNumber} of {quiz.maxAttempts}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" onClick={onBackToCourse}>
          <BookOpen className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
        {!passed && attempt.attemptNumber < quiz.maxAttempts && (
          <Button onClick={onRetry}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function QuizPage() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();
  const {
    currentQuiz: quiz,
    currentQuizAttempt: attempt,
    isLoading,
    error,
    startQuiz,
    submitQuiz,
  } = useLMSStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // Fetch quiz on mount
  useEffect(() => {
    if (quizId) {
      startQuiz(quizId);
    }
  }, [quizId]);

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback((answer: any) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  }, [currentQuestion]);

  const handleFlag = () => {
    if (!currentQuestion) return;
    setFlagged(prev => {
      const newFlagged = new Set(prev);
      if (newFlagged.has(currentQuestion.id)) {
        newFlagged.delete(currentQuestion.id);
      } else {
        newFlagged.add(currentQuestion.id);
      }
      return newFlagged;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNavigate = (index: number) => {
    setCurrentIndex(index);
  };

  const handleSubmit = async () => {
    if (!quiz || !quizId) return;

    const unanswered = questions.filter(q => answers[q.id] === undefined).length;
    if (unanswered > 0) {
      const confirm = window.confirm(
        `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Are you sure you want to submit?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const result = await submitQuiz(quizId, answers, timeSpent);
      if (result) {
        setQuizResults(result);
        setShowResults(true);
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    handleSubmit();
  };

  const handleRetry = async () => {
    if (quizId) {
      setShowResults(false);
      setAnswers({});
      setFlagged(new Set());
      setCurrentIndex(0);
      setQuizResults(null);
      await startQuiz(quizId);
    }
  };

  const handleBackToCourse = () => {
    navigate(`/courses/${courseId}/learn`);
  };

  // Loading state
  if (isLoading && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-surface-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-900 px-4">
        <AlertCircle className="w-16 h-16 text-surface-300 mb-4" />
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
          Quiz not found
        </h2>
        <p className="text-surface-500 mb-4">{error || 'Unable to load the quiz.'}</p>
        <Button onClick={() => navigate(`/courses/${courseId}/learn`)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
      </div>
    );
  }

  // Results view
  if (showResults && quizResults && attempt) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-8 px-4">
        <QuizResults
          quiz={quiz}
          attempt={quizResults.attempt || attempt}
          questions={questions}
          onRetry={handleRetry}
          onBackToCourse={handleBackToCourse}
        />
      </div>
    );
  }

  // Quiz view
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  {quiz.title}
                </h1>
                <p className="text-sm text-surface-500">
                  Question {currentIndex + 1} of {questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {quiz.timeLimit && (
                <QuizTimer
                  timeLimit={quiz.timeLimit}
                  onTimeUp={handleTimeUp}
                />
              )}
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
                Submit Quiz
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-surface-100 dark:bg-surface-700 -mx-4 sm:-mx-6 lg:-mx-8">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 lg:p-8"
                >
                  {/* Question header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-bold flex items-center justify-center">
                        {currentIndex + 1}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 capitalize">
                        {currentQuestion.questionType.replace('_', ' ')}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                      </span>
                    </div>
                    <button
                      onClick={handleFlag}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        flagged.has(currentQuestion.id)
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                          : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400'
                      )}
                      title={flagged.has(currentQuestion.id) ? 'Unflag question' : 'Flag for review'}
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Question text */}
                  <div
                    className="text-lg text-surface-900 dark:text-surface-100 mb-8"
                    dangerouslySetInnerHTML={{
                      __html: currentQuestion.questionHtml || currentQuestion.question,
                    }}
                  />

                  {/* Answer options */}
                  {(currentQuestion.questionType === 'multiple_choice' ||
                    currentQuestion.questionType === 'multiple_select') && (
                    <MultipleChoice
                      question={currentQuestion}
                      selectedAnswer={answers[currentQuestion.id]}
                      onAnswer={handleAnswer}
                    />
                  )}

                  {currentQuestion.questionType === 'true_false' && (
                    <TrueFalse
                      question={currentQuestion}
                      selectedAnswer={answers[currentQuestion.id]}
                      onAnswer={handleAnswer}
                    />
                  )}

                  {currentQuestion.questionType === 'short_answer' && (
                    <ShortAnswer
                      question={currentQuestion}
                      selectedAnswer={answers[currentQuestion.id]}
                      onAnswer={handleAnswer}
                    />
                  )}

                  {/* Hints */}
                  {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                        <HelpCircle className="w-4 h-4" />
                        <span className="font-medium text-sm">Hint</span>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {currentQuestion.hints[0]}
                      </p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    {currentIndex < questions.length - 1 ? (
                      <Button onClick={handleNext}>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Spinner size="sm" className="mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Submit Quiz
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Question Navigator */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <QuestionNav
                questions={questions}
                currentIndex={currentIndex}
                answers={answers}
                flagged={flagged}
                onNavigate={handleNavigate}
              />

              {/* Quiz Info */}
              <div className="mt-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                <h4 className="font-medium text-surface-700 dark:text-surface-300 mb-3">
                  Quiz Info
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-surface-500">
                    <span>Passing Score</span>
                    <span className="font-medium">{quiz.passingScore}%</span>
                  </div>
                  <div className="flex justify-between text-surface-500">
                    <span>Questions</span>
                    <span className="font-medium">{questions.length}</span>
                  </div>
                  <div className="flex justify-between text-surface-500">
                    <span>Answered</span>
                    <span className="font-medium text-emerald-600">
                      {Object.keys(answers).length}/{questions.length}
                    </span>
                  </div>
                  {quiz.xpReward > 0 && (
                    <div className="flex justify-between text-surface-500">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" /> XP Reward
                      </span>
                      <span className="font-medium text-amber-600">+{quiz.xpReward}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
