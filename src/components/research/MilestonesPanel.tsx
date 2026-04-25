import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Milestone as MilestoneIcon,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MoreVertical,
  Edit3,
  Trash2,
  User,
  Loader2,
  ChevronDown,
  ChevronRight,
  Flag,
  Target,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import type { ResearchMilestone, MilestoneStatus, MilestoneType } from '@/types';

interface MilestonesPanelProps {
  projectId: string;
  canEdit: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.ohcselibrary.xyz';

const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { label: string; icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-surface-500 dark:text-surface-400', bgColor: 'bg-surface-100 dark:bg-surface-700' },
  in_progress: { label: 'In Progress', icon: Target, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  delayed: { label: 'Delayed', icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
};

const MILESTONE_TYPES: Record<MilestoneType, string> = {
  kickoff: 'Project Kickoff',
  literature_review: 'Literature Review',
  data_collection: 'Data Collection',
  analysis: 'Analysis',
  draft_complete: 'Draft Complete',
  peer_review: 'Peer Review',
  revision: 'Revision',
  final_submission: 'Final Submission',
  publication: 'Publication',
  presentation: 'Presentation',
  custom: 'Custom',
};

export function MilestonesPanel({ projectId, canEdit }: MilestonesPanelProps) {
  const { token } = useAuthStore();
  const [milestones, setMilestones] = useState<ResearchMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    milestoneType: 'custom' as MilestoneType,
    targetDate: '',
    deliverables: [''],
  });

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE}/api/v1/research/projects/${projectId}/milestones`);
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const handleAddMilestone = async () => {
    if (!formData.title.trim()) return;

    setSavingId('new');
    try {
      const response = await authFetch(`${API_BASE}/api/v1/research/projects/${projectId}/milestones`, {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          milestoneType: formData.milestoneType,
          targetDate: formData.targetDate || null,
          deliverables: formData.deliverables.filter(d => d.trim()),
        }),
      });

      if (response.ok) {
        await fetchMilestones();
        setShowAddForm(false);
        setFormData({ title: '', description: '', milestoneType: 'custom', targetDate: '', deliverables: [''] });
      }
    } catch (err) {
      console.error('Failed to add milestone:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateStatus = async (milestoneId: string, status: MilestoneStatus) => {
    setSavingId(milestoneId);
    try {
      const milestone = milestones.find(m => m.id === milestoneId);
      const response = await authFetch(`${API_BASE}/api/v1/research/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, title: milestone?.title }),
      });

      if (response.ok) {
        setMilestones(prev => prev.map(m =>
          m.id === milestoneId ? { ...m, status, completedDate: status === 'completed' ? new Date().toISOString() : m.completedDate } : m
        ));
      }
    } catch (err) {
      console.error('Failed to update milestone:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    setSavingId(milestoneId);
    try {
      const response = await authFetch(`${API_BASE}/api/v1/research/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMilestones(prev => prev.filter(m => m.id !== milestoneId));
      }
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    } finally {
      setSavingId(null);
    }
  };

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary-500" />
            Milestones
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {completedCount} of {milestones.length} completed ({progress}%)
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Overall Progress</span>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{progress}%</span>
        </div>
        <div className="h-3 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
          />
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">Add New Milestone</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Complete Literature Review"
                    className="w-full px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.milestoneType}
                      onChange={(e) => setFormData(prev => ({ ...prev, milestoneType: e.target.value as MilestoneType }))}
                      className="w-full px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {Object.entries(MILESTONE_TYPES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this milestone..."
                    rows={2}
                    className="w-full px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMilestone}
                    disabled={!formData.title.trim() || savingId === 'new'}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {savingId === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Milestone
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestones Timeline */}
      {milestones.length === 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center border border-surface-200 dark:border-surface-700">
          <Flag className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-2">
            No milestones yet
          </h3>
          <p className="text-surface-500 dark:text-surface-400 mb-4">
            Add milestones to track your research progress.
          </p>
          {canEdit && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Milestone
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-200 dark:bg-surface-700" />

          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const statusConfig = MILESTONE_STATUS_CONFIG[milestone.status];
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedId === milestone.id;
              const isOverdue = milestone.targetDate && new Date(milestone.targetDate) < new Date() && milestone.status !== 'completed';

              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-14"
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    'absolute left-4 w-5 h-5 rounded-full border-2 border-white dark:border-surface-900 flex items-center justify-center',
                    milestone.status === 'completed' ? 'bg-green-500' :
                    milestone.status === 'in_progress' ? 'bg-blue-500' :
                    isOverdue ? 'bg-orange-500' : 'bg-surface-300 dark:bg-surface-600'
                  )}>
                    {milestone.status === 'completed' && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>

                  <div className={cn(
                    'bg-white dark:bg-surface-800 rounded-xl border transition-colors',
                    milestone.status === 'completed' ? 'border-green-200 dark:border-green-800' :
                    isOverdue ? 'border-orange-200 dark:border-orange-800' :
                    'border-surface-200 dark:border-surface-700'
                  )}>
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : milestone.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn(
                              'font-medium',
                              milestone.status === 'completed' ? 'text-surface-500 dark:text-surface-400 line-through' : 'text-surface-900 dark:text-surface-50'
                            )}>
                              {milestone.title}
                            </h4>
                            <span className={cn(
                              'px-2 py-0.5 text-xs rounded-full',
                              statusConfig.bgColor,
                              statusConfig.color
                            )}>
                              {statusConfig.label}
                            </span>
                            {isOverdue && milestone.status !== 'completed' && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
                            <span className="flex items-center gap-1">
                              <MilestoneIcon className="w-3.5 h-3.5" />
                              {MILESTONE_TYPES[milestone.milestoneType]}
                            </span>
                            {milestone.targetDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(milestone.targetDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                            {milestone.assignedTo && (
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {milestone.assignedTo.displayName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canEdit && milestone.status !== 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(milestone.id, 'completed');
                              }}
                              disabled={savingId === milestone.id}
                              className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Mark Complete"
                            >
                              {savingId === milestone.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-surface-400 dark:text-surface-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-surface-400 dark:text-surface-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 border-t border-surface-100 dark:border-surface-700">
                            {milestone.description && (
                              <p className="text-sm text-surface-600 dark:text-surface-400 mt-3">
                                {milestone.description}
                              </p>
                            )}

                            {milestone.deliverables && milestone.deliverables.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-2">
                                  Deliverables
                                </h5>
                                <ul className="space-y-1">
                                  {milestone.deliverables.map((d, i) => (
                                    <li key={i} className="text-sm text-surface-600 dark:text-surface-400 flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-surface-400 dark:bg-surface-500 rounded-full" />
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {milestone.completedDate && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-3 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Completed on {new Date(milestone.completedDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            )}

                            {canEdit && (
                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-100 dark:border-surface-700">
                                <select
                                  value={milestone.status}
                                  onChange={(e) => handleUpdateStatus(milestone.id, e.target.value as MilestoneStatus)}
                                  disabled={savingId === milestone.id}
                                  className="flex-1 px-3 py-1.5 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50"
                                >
                                  {Object.entries(MILESTONE_STATUS_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleDelete(milestone.id)}
                                  disabled={savingId === milestone.id}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MilestonesPanel;
