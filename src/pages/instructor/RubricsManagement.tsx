/**
 * Rubrics Management Page
 * Create and manage grading rubrics for assignments
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Loader2,
  AlertCircle,
  X,
  Check,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Star,
  FileText,
  Layers,
} from 'lucide-react';
import { useInstructorStore } from '@/stores/instructorStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import type { Rubric, RubricCriterion, RubricLevel } from '@/types/lms';

// Animated background component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white to-amber-50/30 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800" />
      <motion.div
        className="absolute top-20 -left-32 w-96 h-96 bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 -right-32 w-96 h-96 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// Rubric card component
function RubricCard({
  rubric,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  rubric: Rubric;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const criteria = Array.isArray(rubric.criteria) ? rubric.criteria : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl border overflow-hidden transition-all duration-200',
        rubric.isTemplate
          ? 'border-amber-300 dark:border-amber-600 shadow-amber-100 dark:shadow-amber-900/20'
          : 'border-surface-200 dark:border-surface-700'
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              rubric.isTemplate
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-primary-100 dark:bg-primary-900/30'
            )}>
              <ClipboardList className={cn(
                'w-5 h-5',
                rubric.isTemplate
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-primary-600 dark:text-primary-400'
              )} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  {rubric.title}
                </h3>
                {rubric.isTemplate && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                    Template
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-surface-500 dark:text-surface-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  {criteria.length} criteria
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" />
                  {rubric.maxScore} points
                </span>
                <span>{formatDate(rubric.createdAt)}</span>
              </div>
              {rubric.description && (
                <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                  {rubric.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onDuplicate}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 rounded-lg transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-500 hover:text-red-600 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expand/collapse criteria preview */}
        {criteria.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide criteria
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show criteria
              </>
            )}
          </button>
        )}

        {/* Criteria preview */}
        <AnimatePresence>
          {isExpanded && criteria.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {criteria.map((criterion, index) => (
                  <div
                    key={criterion.id || index}
                    className="p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-surface-900 dark:text-surface-100">
                        {criterion.name}
                      </span>
                      <span className="text-sm text-surface-500">
                        Weight: {criterion.weight}%
                      </span>
                    </div>
                    {criterion.description && (
                      <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
                        {criterion.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {criterion.levels?.map((level, levelIndex) => (
                        <span
                          key={levelIndex}
                          className="px-2 py-1 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded"
                        >
                          {level.label}: {level.score}pts
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Criterion editor component
function CriterionEditor({
  criterion,
  index,
  onChange,
  onRemove,
}: {
  criterion: RubricCriterion;
  index: number;
  onChange: (criterion: RubricCriterion) => void;
  onRemove: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateLevel = (levelIndex: number, updates: Partial<RubricLevel>) => {
    const newLevels = [...(criterion.levels || [])];
    newLevels[levelIndex] = { ...newLevels[levelIndex], ...updates };
    onChange({ ...criterion, levels: newLevels });
  };

  const addLevel = () => {
    const levels = criterion.levels || [];
    const newLevel: RubricLevel = {
      score: levels.length > 0 ? Math.max(...levels.map(l => l.score)) + 1 : 1,
      label: `Level ${levels.length + 1}`,
      description: '',
    };
    onChange({ ...criterion, levels: [...levels, newLevel] });
  };

  const removeLevel = (levelIndex: number) => {
    const newLevels = criterion.levels?.filter((_, i) => i !== levelIndex) || [];
    onChange({ ...criterion, levels: newLevels });
  };

  return (
    <div className="bg-surface-50 dark:bg-surface-700/50 rounded-xl border border-surface-200 dark:border-surface-600 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 flex-shrink-0 text-surface-400 cursor-move">
            <GripVertical className="w-5 h-5" />
            <span className="text-sm font-medium">#{index + 1}</span>
          </div>

          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={criterion.name}
                  onChange={(e) => onChange({ ...criterion, name: e.target.value })}
                  placeholder="Criterion name"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <div className="relative">
                  <input
                    type="number"
                    value={criterion.weight}
                    onChange={(e) => onChange({ ...criterion, weight: parseInt(e.target.value) || 0 })}
                    placeholder="Weight"
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 pr-8 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500">%</span>
                </div>
              </div>
            </div>

            <textarea
              value={criterion.description || ''}
              onChange={(e) => onChange({ ...criterion, description: e.target.value })}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          <button
            onClick={onRemove}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-400 hover:text-red-600 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Levels */}
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Scoring Levels ({criterion.levels?.length || 0})
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {criterion.levels?.map((level, levelIndex) => (
                    <div
                      key={levelIndex}
                      className="flex items-start gap-2 p-2 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-600"
                    >
                      <input
                        type="number"
                        value={level.score}
                        onChange={(e) => updateLevel(levelIndex, { score: parseInt(e.target.value) || 0 })}
                        className="w-16 px-2 py-1.5 text-sm rounded border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-center"
                        min={0}
                      />
                      <input
                        type="text"
                        value={level.label}
                        onChange={(e) => updateLevel(levelIndex, { label: e.target.value })}
                        placeholder="Level label (e.g., Excellent)"
                        className="flex-1 px-2 py-1.5 text-sm rounded border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700"
                      />
                      <input
                        type="text"
                        value={level.description || ''}
                        onChange={(e) => updateLevel(levelIndex, { description: e.target.value })}
                        placeholder="Description"
                        className="flex-1 px-2 py-1.5 text-sm rounded border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700"
                      />
                      <button
                        onClick={() => removeLevel(levelIndex)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-400 hover:text-red-600 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addLevel}
                    className="w-full py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-dashed border-primary-300 dark:border-primary-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Level
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Create/Edit rubric modal
function RubricModal({
  isOpen,
  onClose,
  onSubmit,
  rubric,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; criteria: RubricCriterion[]; isTemplate: boolean }) => void;
  rubric?: Rubric | null;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState(rubric?.title || '');
  const [description, setDescription] = useState(rubric?.description || '');
  const [isTemplate, setIsTemplate] = useState(rubric?.isTemplate || false);
  const [criteria, setCriteria] = useState<RubricCriterion[]>(
    rubric?.criteria || []
  );

  useEffect(() => {
    if (rubric) {
      setTitle(rubric.title);
      setDescription(rubric.description || '');
      setIsTemplate(rubric.isTemplate);
      setCriteria(Array.isArray(rubric.criteria) ? rubric.criteria : []);
    } else {
      setTitle('');
      setDescription('');
      setIsTemplate(false);
      setCriteria([]);
    }
  }, [rubric]);

  const addCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: `temp_${Date.now()}`,
      name: '',
      description: '',
      weight: 100 - criteria.reduce((sum, c) => sum + c.weight, 0),
      levels: [
        { score: 4, label: 'Excellent', description: '' },
        { score: 3, label: 'Good', description: '' },
        { score: 2, label: 'Satisfactory', description: '' },
        { score: 1, label: 'Needs Improvement', description: '' },
        { score: 0, label: 'Unsatisfactory', description: '' },
      ],
    };
    setCriteria([...criteria, newCriterion]);
  };

  const updateCriterion = (index: number, updated: RubricCriterion) => {
    const newCriteria = [...criteria];
    newCriteria[index] = updated;
    setCriteria(newCriteria);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const maxScore = criteria.reduce((sum, c) => {
    const maxLevel = Math.max(...(c.levels?.map(l => l.score) || [0]));
    return sum + (maxLevel * c.weight / 100);
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            {rubric ? 'Edit Rubric' : 'Create Rubric'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Basic info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Rubric title..."
                className="w-full px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this rubric is for..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  isTemplate ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
                )}
                onClick={() => setIsTemplate(!isTemplate)}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    isTemplate ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </div>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Save as reusable template
              </span>
            </label>
          </div>

          {/* Criteria */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                Grading Criteria
              </h4>
              <div className="flex items-center gap-3 text-sm text-surface-500">
                <span className={cn(totalWeight !== 100 && 'text-amber-600')}>
                  Total weight: {totalWeight}%
                </span>
                <span>Max score: {maxScore.toFixed(1)}</span>
              </div>
            </div>

            {totalWeight !== 100 && (
              <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Criteria weights should sum to 100%
              </div>
            )}

            <div className="space-y-3">
              {criteria.map((criterion, index) => (
                <CriterionEditor
                  key={criterion.id || index}
                  criterion={criterion}
                  index={index}
                  onChange={(updated) => updateCriterion(index, updated)}
                  onRemove={() => removeCriterion(index)}
                />
              ))}

              <button
                onClick={addCriterion}
                className="w-full py-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-dashed border-primary-300 dark:border-primary-700 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Criterion
              </button>
            </div>
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
            onClick={() => onSubmit({ title, description, criteria, isTemplate })}
            disabled={!title.trim() || criteria.length === 0 || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {rubric ? 'Update' : 'Create'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function RubricsManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    rubrics,
    isLoading,
    isSaving,
    error,
    fetchRubrics,
    createRubric,
    updateRubric,
    deleteRubric,
    duplicateRubric,
    clearError,
  } = useInstructorStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);
  const [filter, setFilter] = useState<'all' | 'templates' | 'custom'>('all');

  useEffect(() => {
    fetchRubrics();
  }, [fetchRubrics]);

  const handleCreate = () => {
    setEditingRubric(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rubric: Rubric) => {
    setEditingRubric(rubric);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: { title: string; description?: string; criteria: RubricCriterion[]; isTemplate: boolean }) => {
    let success = false;

    if (editingRubric) {
      success = await updateRubric(editingRubric.id, data);
    } else {
      const rubric = await createRubric(data);
      success = !!rubric;
    }

    if (success) {
      setIsModalOpen(false);
      setEditingRubric(null);
    }
  };

  const handleDelete = async (rubric: Rubric) => {
    if (!confirm(`Are you sure you want to delete "${rubric.title}"? This cannot be undone.`)) return;
    await deleteRubric(rubric.id);
  };

  const handleDuplicate = async (rubric: Rubric) => {
    await duplicateRubric(rubric.id, `${rubric.title} (Copy)`);
  };

  const filteredRubrics = rubrics.filter(r => {
    if (filter === 'templates') return r.isTemplate;
    if (filter === 'custom') return !r.isTemplate;
    return true;
  });

  const isInstructor = user?.role && ['admin', 'super_admin', 'director', 'instructor', 'librarian'].includes(user.role);

  if (!isInstructor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
            Access Denied
          </h2>
          <p className="text-surface-600 dark:text-surface-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && rubrics.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-surface-600 dark:text-surface-400">Loading rubrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <AnimatedBackground />

      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/80 dark:hover:bg-surface-800/80 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              Rubrics Management
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Create and manage grading rubrics for your assignments
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-lg shadow-primary-500/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Rubric</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'templates', 'custom'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                filter === f
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              {f === 'all' && 'All Rubrics'}
              {f === 'templates' && 'Templates'}
              {f === 'custom' && 'Custom'}
            </button>
          ))}
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
            <button onClick={clearError} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </motion.div>
        )}

        {/* Rubrics list */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredRubrics.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-8 h-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  {filter === 'all' ? 'No rubrics yet' : `No ${filter} found`}
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  {filter === 'all'
                    ? 'Create your first rubric to streamline grading.'
                    : 'Try a different filter or create a new rubric.'}
                </p>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Rubric
                </button>
              </motion.div>
            ) : (
              filteredRubrics.map((rubric) => (
                <RubricCard
                  key={rubric.id}
                  rubric={rubric}
                  onEdit={() => handleEdit(rubric)}
                  onDelete={() => handleDelete(rubric)}
                  onDuplicate={() => handleDuplicate(rubric)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <RubricModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingRubric(null);
            }}
            onSubmit={handleSubmit}
            rubric={editingRubric}
            isLoading={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
