/**
 * Quiz Builder
 * Comprehensive quiz editing interface for instructors
 * Create, edit, and manage quiz questions with multiple question types
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ChevronLeft,
  Save,
  Eye,
  Settings,
  Plus,
  GripVertical,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Target,
  Clock,
  Award,
  X,
  Check,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Circle,
  ToggleLeft,
  ToggleRight,
  Copy,
  Lightbulb,
  FileText,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';

// Types
interface QuizQuestion {
  id: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'multiple_select';
  question: string;
  questionHtml?: string;
  options: string[];
  correctAnswer: string | string[] | boolean;
  explanation?: string;
  hints?: string[];
  points: number;
  sortOrder: number;
  mediaUrl?: string;
  mediaType?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  quizType: string;
  passingScore: number;
  timeLimit?: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  questionCount: number;
  totalPoints: number;
}

const questionTypeConfig = {
  multiple_choice: {
    label: 'Multiple Choice',
    description: 'Single correct answer from options',
    icon: Circle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  multiple_select: {
    label: 'Multiple Select',
    description: 'Multiple correct answers',
    icon: CheckCircle2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  true_false: {
    label: 'True/False',
    description: 'Binary choice question',
    icon: ToggleRight,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  short_answer: {
    label: 'Short Answer',
    description: 'Text-based response',
    icon: FileText,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
};

// Question Card Component
function QuestionCard({
  question,
  index,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  question: QuizQuestion;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const config = questionTypeConfig[question.questionType] || questionTypeConfig.multiple_choice;
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4 p-4">
        <div className="cursor-grab text-surface-400 hover:text-surface-600 mt-1">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bgColor)}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-surface-500">Q{index + 1}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', config.bgColor, config.color)}>
              {config.label}
            </span>
            <span className="text-xs text-surface-500">{question.points} pts</span>
          </div>
          <p className="text-surface-900 dark:text-surface-100 font-medium line-clamp-2">
            {question.question}
          </p>
          {question.options && question.options.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {question.options.slice(0, 4).map((opt, i) => (
                <span
                  key={i}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    (Array.isArray(question.correctAnswer)
                      ? question.correctAnswer.includes(opt)
                      : question.correctAnswer === opt)
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                  )}
                >
                  {opt.length > 20 ? opt.substring(0, 20) + '...' : opt}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicate}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-500 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Question Editor Modal
function QuestionEditor({
  isOpen,
  onClose,
  onSave,
  question,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<QuizQuestion>) => void;
  question?: QuizQuestion | null;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<QuizQuestion>>({
    questionType: 'multiple_choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 1,
  });

  useEffect(() => {
    if (question) {
      setFormData({
        questionType: question.questionType,
        question: question.question,
        options: question.options?.length > 0 ? question.options : ['', '', '', ''],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        points: question.points,
      });
    } else {
      setFormData({
        questionType: 'multiple_choice',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        points: 1,
      });
    }
  }, [question, isOpen]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), ''],
    }));
  };

  const removeOption = (index: number) => {
    const newOptions = (formData.options || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = () => {
    if (!formData.question?.trim()) return;
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              {question ? 'Edit Question' : 'Add Question'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                Question Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(questionTypeConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        questionType: key as QuizQuestion['questionType'],
                        correctAnswer: key === 'true_false' ? true : key === 'multiple_select' ? [] : '',
                        options: key === 'true_false' ? ['True', 'False'] : prev.options,
                      }))}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                        formData.questionType === key
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-surface-200 dark:border-surface-600 hover:border-surface-300'
                      )}
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
                        <Icon className={cn('w-4 h-4', config.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 dark:text-surface-100 text-sm">
                          {config.label}
                        </p>
                        <p className="text-xs text-surface-500">{config.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                Question *
              </label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question..."
                rows={3}
                className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-surface-50 placeholder-surface-400"
              />
            </div>

            {/* Options (for multiple choice/select) */}
            {(formData.questionType === 'multiple_choice' || formData.questionType === 'multiple_select') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-200">
                    Answer Options
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Option
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.options || []).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.questionType === 'multiple_select') {
                            const current = (formData.correctAnswer as string[]) || [];
                            const newAnswer = current.includes(option)
                              ? current.filter(a => a !== option)
                              : [...current, option];
                            setFormData(prev => ({ ...prev, correctAnswer: newAnswer }));
                          } else {
                            setFormData(prev => ({ ...prev, correctAnswer: option }));
                          }
                        }}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          (Array.isArray(formData.correctAnswer)
                            ? formData.correctAnswer.includes(option)
                            : formData.correctAnswer === option)
                            ? 'border-success-500 bg-success-500 text-white'
                            : 'border-surface-300 dark:border-surface-600 hover:border-success-400'
                        )}
                      >
                        {(Array.isArray(formData.correctAnswer)
                          ? formData.correctAnswer.includes(option)
                          : formData.correctAnswer === option) && (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-4 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-surface-50"
                      />
                      {(formData.options || []).length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-2 text-surface-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-surface-500 mt-2">
                  Click the circle to mark the correct answer(s)
                </p>
              </div>
            )}

            {/* True/False */}
            {formData.questionType === 'true_false' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                  Correct Answer
                </label>
                <div className="flex gap-3">
                  {[true, false].map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, correctAnswer: value }))}
                      className={cn(
                        'flex-1 py-3 rounded-xl border-2 font-medium transition-all',
                        formData.correctAnswer === value
                          ? 'border-success-500 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300'
                          : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-surface-300'
                      )}
                    >
                      {value ? 'True' : 'False'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Short Answer */}
            {formData.questionType === 'short_answer' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                  Accepted Answer(s)
                </label>
                <input
                  type="text"
                  value={formData.correctAnswer as string}
                  onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                  placeholder="Enter the correct answer"
                  className="w-full px-4 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-surface-50"
                />
                <p className="text-xs text-surface-500 mt-1">
                  Separate multiple accepted answers with a comma
                </p>
              </div>
            )}

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                Points
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                className="w-24 px-4 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-surface-50"
              />
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
                Explanation (shown after answering)
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explain why this is the correct answer..."
                rows={2}
                className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-surface-50 placeholder-surface-400"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.question?.trim() || isLoading}
              leftIcon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            >
              {question ? 'Update Question' : 'Add Question'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Quiz Settings Modal
function QuizSettingsModal({
  isOpen,
  onClose,
  onSave,
  quiz,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Quiz>) => void;
  quiz: Quiz;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Quiz>>({});

  useEffect(() => {
    setFormData({
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      maxAttempts: quiz.maxAttempts,
      shuffleQuestions: quiz.shuffleQuestions,
    });
  }, [quiz, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              Quiz Settings
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                Quiz Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.passingScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.timeLimit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || undefined }))}
                  placeholder="No limit"
                  className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                Max Attempts
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={formData.maxAttempts}
                onChange={(e) => setFormData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                className="w-32 px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
              <div>
                <p className="font-medium text-surface-900 dark:text-surface-100">Shuffle Questions</p>
                <p className="text-sm text-surface-500">Randomize question order for each attempt</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, shuffleQuestions: !prev.shuffleQuestions }))}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  formData.shuffleQuestions ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
                )}
              >
                <span className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  formData.shuffleQuestions ? 'translate-x-7' : 'translate-x-1'
                )} />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => onSave(formData)}
              disabled={isLoading}
              leftIcon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            >
              Save Settings
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Main Component
export default function QuizBuilder() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.ohcselibrary.xyz';

  const fetchQuiz = useCallback(async () => {
    if (!quizId || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/lms/quizzes/${quizId}/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch quiz');

      const data = await response.json();
      setQuiz(data.quiz);
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  }, [quizId, token, API_URL]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleAddQuestion = async (data: Partial<QuizQuestion>) => {
    if (!quizId || !token) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/lms/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to add question');

      await fetchQuiz();
      setShowQuestionEditor(false);
      setEditingQuestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateQuestion = async (data: Partial<QuizQuestion>) => {
    if (!editingQuestion || !token) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/lms/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update question');

      await fetchQuiz();
      setShowQuestionEditor(false);
      setEditingQuestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!token || !confirm('Delete this question?')) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/lms/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete question');
      await fetchQuiz();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  const handleDuplicateQuestion = async (question: QuizQuestion) => {
    await handleAddQuestion({
      ...question,
      question: `${question.question} (Copy)`,
    });
  };

  const handleReorder = async (newOrder: QuizQuestion[]) => {
    setQuestions(newOrder);

    try {
      await fetch(`${API_URL}/api/v1/lms/quizzes/${quizId}/questions/reorder`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionIds: newOrder.map(q => q.id) }),
      });
    } catch (err) {
      console.error('Failed to reorder:', err);
    }
  };

  const handleUpdateSettings = async (data: Partial<Quiz>) => {
    if (!quizId || !token) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/lms/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      await fetchQuiz();
      setShowSettings(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-error-500" />
        <p className="text-error-600 dark:text-error-400">{error || 'Quiz not found'}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <header className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
                  {quiz.title}
                </h1>
                <div className="flex items-center gap-3 text-sm text-surface-500">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" /> {questions.length} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" /> {quiz.totalPoints} points
                  </span>
                  {quiz.timeLimit && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {quiz.timeLimit} min
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                leftIcon={<Settings className="w-4 h-4" />}
                onClick={() => setShowSettings(true)}
              >
                Settings
              </Button>
              <Button
                leftIcon={<Eye className="w-4 h-4" />}
                onClick={() => navigate(`/courses/${quiz.id}/quiz/${quizId}`)}
              >
                Preview
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{questions.length}</p>
                <p className="text-sm text-surface-500">Questions</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{quiz.totalPoints}</p>
                <p className="text-sm text-surface-500">Total Points</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{quiz.passingScore}%</p>
                <p className="text-sm text-surface-500">Pass Score</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {quiz.timeLimit || '∞'}
                </p>
                <p className="text-sm text-surface-500">{quiz.timeLimit ? 'Minutes' : 'No Limit'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            Questions
          </h2>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingQuestion(null);
              setShowQuestionEditor(true);
            }}
          >
            Add Question
          </Button>
        </div>

        {questions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-surface-800 rounded-2xl border border-dashed border-surface-300 dark:border-surface-600 p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
              No Questions Yet
            </h3>
            <p className="text-surface-500 mb-6 max-w-md mx-auto">
              Start building your quiz by adding questions. You can create multiple choice, true/false, and short answer questions.
            </p>
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingQuestion(null);
                setShowQuestionEditor(true);
              }}
            >
              Add First Question
            </Button>
          </motion.div>
        ) : (
          <Reorder.Group
            axis="y"
            values={questions}
            onReorder={handleReorder}
            className="space-y-3"
          >
            <AnimatePresence>
              {questions.map((question, index) => (
                <Reorder.Item key={question.id} value={question}>
                  <QuestionCard
                    question={question}
                    index={index}
                    onEdit={() => {
                      setEditingQuestion(question);
                      setShowQuestionEditor(true);
                    }}
                    onDelete={() => handleDeleteQuestion(question.id)}
                    onDuplicate={() => handleDuplicateQuestion(question)}
                  />
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </main>

      {/* Modals */}
      <QuestionEditor
        isOpen={showQuestionEditor}
        onClose={() => {
          setShowQuestionEditor(false);
          setEditingQuestion(null);
        }}
        onSave={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
        question={editingQuestion}
        isLoading={isSaving}
      />

      {quiz && (
        <QuizSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleUpdateSettings}
          quiz={quiz}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
