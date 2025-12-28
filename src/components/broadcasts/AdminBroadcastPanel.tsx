import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Plus,
  Send,
  Clock,
  Users,
  AlertTriangle,
  AlertCircle,
  Info,
  Siren,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle,
  X,
  Calendar,
  Target,
  BarChart3,
  Radio,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useBroadcastStore, type Broadcast, type BroadcastSeverity, type BroadcastFormData } from '@/stores/broadcastStore';
import { Button } from '@/components/shared/Button';
import { Modal, ConfirmModal } from '@/components/shared/Modal';
import { useToast } from '@/components/shared/Toast';

// Severity icons and styles
const severityOptions: {
  value: BroadcastSeverity;
  label: string;
  description: string;
  icon: typeof Info;
  color: string;
  bgColor: string;
}[] = [
  {
    value: 'info',
    label: 'Information',
    description: 'General announcements and updates',
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
  },
  {
    value: 'warning',
    label: 'Warning',
    description: 'Important notices requiring attention',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
  },
  {
    value: 'critical',
    label: 'Critical',
    description: 'Urgent matters requiring immediate attention',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30',
  },
  {
    value: 'emergency',
    label: 'Emergency',
    description: 'Life-safety or system-critical emergencies',
    icon: Siren,
    color: 'text-red-600',
    bgColor: 'bg-red-600/15 hover:bg-red-600/25 border-red-600/40',
  },
];

const targetAudienceOptions = [
  { value: 'all', label: 'All Users', icon: Users },
  { value: 'staff', label: 'Staff Only', icon: Target },
  { value: 'admin', label: 'Administrators', icon: Target },
];

// Broadcast Form Modal
interface BroadcastFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editBroadcast?: Broadcast | null;
}

function BroadcastFormModal({ isOpen, onClose, editBroadcast }: BroadcastFormModalProps) {
  const { createBroadcast, updateBroadcast, isSubmitting } = useBroadcastStore();
  const toast = useToast();

  const [formData, setFormData] = useState<BroadcastFormData>({
    title: '',
    message: '',
    severity: 'info',
    target_audience: 'all',
    requires_acknowledgment: false,
    scheduled_at: '',
    expires_at: '',
  });

  const [isScheduled, setIsScheduled] = useState(false);
  const [hasExpiry, setHasExpiry] = useState(false);

  useEffect(() => {
    if (editBroadcast) {
      setFormData({
        title: editBroadcast.title,
        message: editBroadcast.message,
        severity: editBroadcast.severity,
        target_audience: editBroadcast.target_audience,
        requires_acknowledgment: editBroadcast.requires_acknowledgment,
        scheduled_at: editBroadcast.scheduled_at || '',
        expires_at: editBroadcast.expires_at || '',
      });
      setIsScheduled(!!editBroadcast.scheduled_at);
      setHasExpiry(!!editBroadcast.expires_at);
    } else {
      setFormData({
        title: '',
        message: '',
        severity: 'info',
        target_audience: 'all',
        requires_acknowledgment: false,
        scheduled_at: '',
        expires_at: '',
      });
      setIsScheduled(false);
      setHasExpiry(false);
    }
  }, [editBroadcast, isOpen]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Missing fields', 'Title and message are required');
      return;
    }

    const submitData = {
      ...formData,
      scheduled_at: isScheduled ? formData.scheduled_at : undefined,
      expires_at: hasExpiry ? formData.expires_at : undefined,
    };

    let success: boolean;
    if (editBroadcast) {
      success = await updateBroadcast(editBroadcast.id, submitData);
    } else {
      success = await createBroadcast(submitData);
    }

    if (success) {
      toast.success(
        editBroadcast ? 'Broadcast updated' : 'Broadcast sent',
        isScheduled ? 'Your broadcast has been scheduled' : 'Your broadcast is now live'
      );
      onClose();
    }
  };

  const selectedSeverity = severityOptions.find((s) => s.value === formData.severity);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editBroadcast ? 'Edit Broadcast' : 'Create New Broadcast'}
      size="lg"
      closeOnOverlayClick={false}
    >
      <div className="space-y-6">
        {/* Severity Selection */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            Alert Severity
          </label>
          <div className="grid grid-cols-2 gap-3">
            {severityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.severity === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: option.value })}
                  className={cn(
                    'relative p-4 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? cn(option.bgColor, 'border-current ring-2 ring-offset-2', option.color)
                      : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-surface-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', isSelected ? option.bgColor : 'bg-surface-100 dark:bg-surface-700')}>
                      <Icon className={cn('h-5 w-5', isSelected ? option.color : 'text-surface-500')} />
                    </div>
                    <div>
                      <p className={cn('font-semibold', isSelected ? option.color : 'text-surface-900 dark:text-surface-100')}>
                        {option.label}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="severity-check"
                      className={cn('absolute top-2 right-2 p-1 rounded-full', option.bgColor)}
                    >
                      <CheckCircle className={cn('h-4 w-4', option.color)} />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter broadcast title..."
            className={cn(
              'w-full px-4 py-3 rounded-xl border transition-colors',
              'bg-surface-50 dark:bg-surface-800',
              'border-surface-200 dark:border-surface-700',
              'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
              'text-surface-900 dark:text-surface-100',
              'placeholder:text-surface-400'
            )}
            maxLength={200}
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Message
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Enter your broadcast message..."
            rows={4}
            className={cn(
              'w-full px-4 py-3 rounded-xl border transition-colors resize-none',
              'bg-surface-50 dark:bg-surface-800',
              'border-surface-200 dark:border-surface-700',
              'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
              'text-surface-900 dark:text-surface-100',
              'placeholder:text-surface-400'
            )}
            maxLength={2000}
          />
          <p className="mt-1 text-xs text-surface-400 text-right">
            {formData.message.length}/2000
          </p>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Target Audience
          </label>
          <div className="flex gap-2">
            {targetAudienceOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, target_audience: option.value })}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                    formData.target_audience === option.value
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-primary-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Require Acknowledgment */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.requires_acknowledgment}
                onChange={(e) => setFormData({ ...formData, requires_acknowledgment: e.target.checked })}
                className="sr-only peer"
              />
              <div className={cn(
                'w-10 h-6 rounded-full transition-colors',
                'bg-surface-200 dark:bg-surface-700',
                'peer-checked:bg-primary-500'
              )} />
              <div className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                'peer-checked:translate-x-4'
              )} />
            </div>
            <div>
              <p className="font-medium text-surface-900 dark:text-surface-100">
                Require Acknowledgment
              </p>
              <p className="text-xs text-surface-500">
                Users must acknowledge this broadcast before dismissing
              </p>
            </div>
          </label>

          {/* Schedule */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="sr-only peer"
              />
              <div className={cn(
                'w-10 h-6 rounded-full transition-colors',
                'bg-surface-200 dark:bg-surface-700',
                'peer-checked:bg-primary-500'
              )} />
              <div className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                'peer-checked:translate-x-4'
              )} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-surface-900 dark:text-surface-100">
                Schedule for Later
              </p>
              <p className="text-xs text-surface-500">
                Set a specific date and time to publish
              </p>
            </div>
          </label>

          {isScheduled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-13"
            >
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border',
                  'bg-surface-50 dark:bg-surface-800',
                  'border-surface-200 dark:border-surface-700',
                  'text-surface-900 dark:text-surface-100'
                )}
              />
            </motion.div>
          )}

          {/* Expiry */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={hasExpiry}
                onChange={(e) => setHasExpiry(e.target.checked)}
                className="sr-only peer"
              />
              <div className={cn(
                'w-10 h-6 rounded-full transition-colors',
                'bg-surface-200 dark:bg-surface-700',
                'peer-checked:bg-primary-500'
              )} />
              <div className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                'peer-checked:translate-x-4'
              )} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-surface-900 dark:text-surface-100">
                Set Expiry
              </p>
              <p className="text-xs text-surface-500">
                Automatically deactivate after a certain time
              </p>
            </div>
          </label>

          {hasExpiry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-13"
            >
              <input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border',
                  'bg-surface-50 dark:bg-surface-800',
                  'border-surface-200 dark:border-surface-700',
                  'text-surface-900 dark:text-surface-100'
                )}
              />
            </motion.div>
          )}
        </div>

        {/* Preview */}
        {formData.title && (
          <div className="p-4 rounded-xl bg-surface-100 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700">
            <p className="text-xs text-surface-500 mb-2 flex items-center gap-1">
              <Eye className="h-3 w-3" /> Preview
            </p>
            <div className={cn(
              'p-3 rounded-lg border-l-4',
              selectedSeverity?.bgColor,
              selectedSeverity?.color.replace('text-', 'border-')
            )}>
              <p className="font-semibold text-surface-900 dark:text-surface-100">
                {formData.title}
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                {formData.message || 'Your message will appear here...'}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={formData.severity === 'emergency' ? 'danger' : 'primary'}
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {isScheduled ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Schedule Broadcast
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Now
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Main Admin Panel Component
export function AdminBroadcastPanel() {
  const {
    allBroadcasts,
    pagination,
    isLoading,
    fetchAllBroadcasts,
    deleteBroadcast,
    deactivateBroadcast,
    setSelectedBroadcast,
    selectedBroadcast,
  } = useBroadcastStore();
  const toast = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAllBroadcasts(1, statusFilter);
  }, [fetchAllBroadcasts, statusFilter]);

  const handleEdit = (broadcast: Broadcast) => {
    setSelectedBroadcast(broadcast);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteBroadcast(id);
    if (success) {
      toast.success('Broadcast deleted');
    }
    setDeleteConfirm(null);
  };

  const handleDeactivate = async (id: string) => {
    const success = await deactivateBroadcast(id);
    if (success) {
      toast.success('Broadcast deactivated');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedBroadcast(null);
  };

  const getSeverityIcon = (severity: BroadcastSeverity) => {
    const option = severityOptions.find((s) => s.value === severity);
    return option?.icon || Info;
  };

  const getSeverityColor = (severity: BroadcastSeverity) => {
    const option = severityOptions.find((s) => s.value === severity);
    return option?.color || 'text-surface-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              Emergency Broadcasts
            </h2>
            <p className="text-sm text-surface-500">
              Send alerts and announcements to all users
            </p>
          </div>
        </div>

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Broadcast
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Radio className="h-4 w-4" />
            <span className="text-xs font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {allBroadcasts.filter((b) => b.is_active).length}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Scheduled</span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {allBroadcasts.filter((b) => b.scheduled_at).length}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Critical</span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {allBroadcasts.filter((b) => b.severity === 'critical' || b.severity === 'emergency').length}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs font-medium">Total Sent</span>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {pagination.total}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-700 pb-2">
        {['all', 'active', 'scheduled', 'expired'].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              statusFilter === filter
                ? 'bg-primary-500 text-white'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Broadcasts List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-surface-500">Loading broadcasts...</p>
          </div>
        ) : allBroadcasts.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
            <p className="text-surface-500">No broadcasts found</p>
            <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
              Create First Broadcast
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {allBroadcasts.map((broadcast) => {
              const SeverityIcon = getSeverityIcon(broadcast.severity);
              const severityColor = getSeverityColor(broadcast.severity);

              return (
                <motion.div
                  key={broadcast.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    'p-4 rounded-xl border transition-all',
                    'bg-white dark:bg-surface-800',
                    broadcast.is_active
                      ? 'border-primary-200 dark:border-primary-800 shadow-sm'
                      : 'border-surface-200 dark:border-surface-700 opacity-60'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Severity Icon */}
                    <div className={cn('p-2 rounded-lg', severityOptions.find((s) => s.value === broadcast.severity)?.bgColor)}>
                      <SeverityIcon className={cn('h-5 w-5', severityColor)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                          {broadcast.title}
                        </h3>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                          severityOptions.find((s) => s.value === broadcast.severity)?.bgColor,
                          severityColor
                        )}>
                          {broadcast.severity}
                        </span>
                        {!broadcast.is_active && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-700 text-surface-500">
                            Inactive
                          </span>
                        )}
                        {broadcast.requires_acknowledgment && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            Requires Ack
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 line-clamp-2">
                        {broadcast.message}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-surface-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(broadcast.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {broadcast.target_audience}
                        </span>
                        {broadcast.acknowledgedCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {broadcast.acknowledgedCount} acknowledged
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {broadcast.is_active && (
                        <button
                          onClick={() => handleDeactivate(broadcast.id)}
                          className="p-2 rounded-lg text-surface-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          title="Deactivate"
                        >
                          <EyeOff className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(broadcast)}
                        className="p-2 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(broadcast.id)}
                        className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => fetchAllBroadcasts(page, statusFilter)}
              className={cn(
                'w-10 h-10 rounded-lg font-medium transition-colors',
                page === pagination.page
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              )}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <BroadcastFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editBroadcast={selectedBroadcast}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Broadcast"
        message="Are you sure you want to delete this broadcast? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
