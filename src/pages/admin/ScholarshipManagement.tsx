import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Building2,
  Calendar,
  Award,
  Users,
  FileText,
  Download,
  Mail,
  Star,
  X,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';
import { useAdminSponsorshipStore } from '@/stores/sponsorshipStore';
import type { ApplicationStatus } from '@/types/sponsorship';

const statusConfig: Record<ApplicationStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileText },
  submitted: { label: 'Submitted', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock },
  under_review: { label: 'Under Review', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Eye },
  shortlisted: { label: 'Shortlisted', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Star },
  approved: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

function ApplicationReviewModal({
  application,
  onClose,
  onUpdateStatus,
}: {
  application: any;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ApplicationStatus, notes: string, awardAmount?: number) => void;
}) {
  const [newStatus, setNewStatus] = useState<ApplicationStatus>(application.status);
  const [notes, setNotes] = useState(application.reviewNotes || '');
  const [awardAmount, setAwardAmount] = useState(application.awardAmount || application.amount || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onUpdateStatus(
      application.id,
      newStatus,
      notes,
      newStatus === 'approved' ? awardAmount : undefined
    );
    setIsSubmitting(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-surface-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Review Application</h2>
            <p className="text-sm text-text-secondary mt-1">{application.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Applicant Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-tertiary">Full Name</label>
              <p className="font-medium">{application.fullName}</p>
            </div>
            <div>
              <label className="text-xs text-text-tertiary">Staff ID</label>
              <p className="font-medium">{application.staffId || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs text-text-tertiary">Department</label>
              <p className="font-medium">{application.department || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs text-text-tertiary">Years of Service</label>
              <p className="font-medium">{application.yearsOfService || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs text-text-tertiary">Current Grade</label>
              <p className="font-medium">{application.currentGrade || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs text-text-tertiary">Email</label>
              <p className="font-medium">{application.email || 'N/A'}</p>
            </div>
          </div>

          {/* Education History */}
          {application.educationHistory && (
            <div>
              <label className="text-xs text-text-tertiary mb-2 block">Education History</label>
              <div className="space-y-2">
                {JSON.parse(application.educationHistory).map((edu: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-50">
                    <p className="font-medium">{edu.degree} in {edu.field}</p>
                    <p className="text-sm text-text-secondary">{edu.institution} ({edu.year})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {application.certifications && (
            <div>
              <label className="text-xs text-text-tertiary mb-2 block">Certifications</label>
              <div className="space-y-2">
                {JSON.parse(application.certifications).map((cert: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-50">
                    <p className="font-medium">{cert.name}</p>
                    <p className="text-sm text-text-secondary">{cert.issuer} ({cert.year})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statement of Purpose */}
          <div>
            <label className="text-xs text-text-tertiary mb-2 block">Statement of Purpose</label>
            <div className="p-4 rounded-lg bg-surface-50">
              <p className="text-text-secondary whitespace-pre-wrap">{application.statementOfPurpose}</p>
            </div>
          </div>

          {/* Expected Impact */}
          {application.expectedImpact && (
            <div>
              <label className="text-xs text-text-tertiary mb-2 block">Expected Impact</label>
              <div className="p-4 rounded-lg bg-surface-50">
                <p className="text-text-secondary whitespace-pre-wrap">{application.expectedImpact}</p>
              </div>
            </div>
          )}

          {/* Career Goals */}
          {application.careerGoals && (
            <div>
              <label className="text-xs text-text-tertiary mb-2 block">Career Goals</label>
              <div className="p-4 rounded-lg bg-surface-50">
                <p className="text-text-secondary whitespace-pre-wrap">{application.careerGoals}</p>
              </div>
            </div>
          )}

          {/* Review Section */}
          <div className="border-t border-surface-200 pt-6">
            <h3 className="font-semibold text-text-primary mb-4">Review Decision</h3>

            {/* Status Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Update Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['under_review', 'shortlisted', 'approved', 'rejected'] as ApplicationStatus[]).map((status) => {
                  const config = statusConfig[status];
                  const StatusIcon = config.icon;
                  return (
                    <button
                      key={status}
                      onClick={() => setNewStatus(status)}
                      className={`
                        p-3 rounded-xl border-2 transition-all flex items-center gap-2
                        ${newStatus === status
                          ? `${config.bgColor} border-current ${config.color}`
                          : 'border-surface-200 hover:border-surface-300'
                        }
                      `}
                    >
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Award Amount (if approved) */}
            {newStatus === 'approved' && (
              <div className="mb-4">
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  Award Amount (GHS)
                </label>
                <input
                  type="number"
                  value={awardAmount}
                  onChange={(e) => setAwardAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
            )}

            {/* Review Notes */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Review Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add notes about your decision..."
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-surface-200 font-medium hover:bg-surface-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-ghana-green text-white font-medium hover:bg-ghana-green/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Decision
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScholarshipForm({
  scholarship,
  onClose,
  onSave,
}: {
  scholarship?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: scholarship?.title || '',
    description: scholarship?.description || '',
    shortDescription: scholarship?.shortDescription || '',
    sponsorId: scholarship?.sponsorId || '',
    amount: scholarship?.amount || 0,
    currency: scholarship?.currency || 'GHS',
    programType: scholarship?.programType || 'course',
    maxRecipients: scholarship?.maxRecipients || 1,
    applicationDeadline: scholarship?.applicationDeadline?.split('T')[0] || '',
    status: scholarship?.status || 'draft',
    eligibilityCriteria: scholarship?.eligibilityCriteria || '',
    requirements: scholarship?.requirements || '',
    isFeatured: scholarship?.isFeatured || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">
            {scholarship ? 'Edit Scholarship' : 'Create Scholarship'}
          </h2>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Short Description</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Full Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                >
                  <option value="GHS">GHS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Program Type</label>
                <select
                  value={formData.programType}
                  onChange={(e) => setFormData({ ...formData, programType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                >
                  <option value="course">Course</option>
                  <option value="certification">Certification</option>
                  <option value="degree">Degree Program</option>
                  <option value="training">Training</option>
                  <option value="professional_development">Professional Development</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Max Recipients</label>
                <input
                  type="number"
                  value={formData.maxRecipients}
                  onChange={(e) => setFormData({ ...formData, maxRecipients: Number(e.target.value) })}
                  min={1}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Application Deadline</label>
                <input
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Eligibility Criteria (JSON)
              </label>
              <textarea
                value={formData.eligibilityCriteria}
                onChange={(e) => setFormData({ ...formData, eligibilityCriteria: e.target.value })}
                rows={3}
                placeholder='{"minYearsOfService": 2, "mdaTypes": ["all"]}'
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green resize-none font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Requirements (JSON Array)
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={3}
                placeholder='["Valid staff ID", "Supervisor recommendation letter"]'
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green resize-none font-mono text-sm"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="h-5 w-5 rounded border-surface-300 text-ghana-green focus:ring-ghana-green"
              />
              <span className="text-sm font-medium text-text-secondary">Featured Scholarship</span>
            </label>
          </div>

          <div className="p-6 border-t border-surface-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-surface-200 font-medium hover:bg-surface-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-ghana-green text-white font-medium hover:bg-ghana-green/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {scholarship ? 'Update' : 'Create'} Scholarship
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function ScholarshipManagement() {
  const {
    scholarships,
    applications,
    isLoading,
    fetchScholarships,
    fetchApplications,
    updateApplicationStatus,
    createScholarship,
    updateScholarship,
  } = useAdminSponsorshipStore();

  const [activeTab, setActiveTab] = useState<'scholarships' | 'applications'>('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showScholarshipForm, setShowScholarshipForm] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<any>(null);
  const [expandedScholarship, setExpandedScholarship] = useState<string | null>(null);

  useEffect(() => {
    fetchScholarships();
    fetchApplications();
  }, [fetchScholarships, fetchApplications]);

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      searchQuery === '' ||
      app.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.staffId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const applicationStats = {
    total: applications.length,
    submitted: applications.filter((a) => a.status === 'submitted').length,
    underReview: applications.filter((a) => a.status === 'under_review').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const handleUpdateStatus = async (
    id: string,
    status: ApplicationStatus,
    notes: string,
    awardAmount?: number
  ) => {
    await updateApplicationStatus(id, status, notes, awardAmount);
    fetchApplications();
  };

  const handleSaveScholarship = async (data: any) => {
    if (editingScholarship) {
      await updateScholarship(editingScholarship.id, data);
    } else {
      await createScholarship(data);
    }
    fetchScholarships();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-ghana-green" />
              Scholarship Management
            </h1>
            <p className="text-text-secondary mt-1">
              Manage scholarships and review applications
            </p>
          </div>
          <button
            onClick={() => {
              setEditingScholarship(null);
              setShowScholarshipForm(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-ghana-green text-white rounded-xl font-medium hover:bg-ghana-green/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Scholarship
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total', value: applicationStats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Submitted', value: applicationStats.submitted, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Reviewing', value: applicationStats.underReview, icon: Eye, color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: 'Shortlisted', value: applicationStats.shortlisted, icon: Star, color: 'text-purple-600', bg: 'bg-purple-100' },
            { label: 'Approved', value: applicationStats.approved, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
            { label: 'Rejected', value: applicationStats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-surface-200"
            >
              <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'applications', label: 'Applications', icon: FileText },
            { id: 'scholarships', label: 'Scholarships', icon: GraduationCap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors
                ${activeTab === tab.id
                  ? 'bg-ghana-green text-white'
                  : 'bg-white text-text-secondary hover:bg-surface-50 border border-surface-200'
                }
              `}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-surface-200 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or staff ID..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-ghana-green"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Applications Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-ghana-green" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary">No applications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Applicant</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Scholarship</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Submitted</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200">
                    {filteredApplications.map((application) => {
                      const status = statusConfig[application.status as ApplicationStatus] || statusConfig.submitted;
                      const StatusIcon = status.icon;
                      return (
                        <tr key={application.id} className="hover:bg-surface-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-text-primary">{application.fullName}</p>
                              <p className="text-sm text-text-secondary">{application.staffId || 'No Staff ID'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-text-primary">{application.scholarshipTitle || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-text-secondary">
                            {application.createdAt
                              ? new Date(application.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedApplication(application)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-ghana-green/10 text-ghana-green rounded-lg font-medium hover:bg-ghana-green/20 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Scholarships Tab */}
        {activeTab === 'scholarships' && (
          <div className="space-y-4">
            {scholarships.map((scholarship, index) => (
              <motion.div
                key={scholarship.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl border border-surface-200 overflow-hidden"
              >
                <div
                  className="p-6 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedScholarship(
                    expandedScholarship === scholarship.id ? null : scholarship.id
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-ghana-green/10 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-ghana-green" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{scholarship.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {scholarship.currency} {scholarship.amount?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {scholarship.currentRecipients || 0}/{scholarship.maxRecipients} slots
                        </span>
                        <span className={`
                          px-2 py-0.5 rounded-full text-xs font-medium
                          ${scholarship.status === 'open' ? 'bg-green-100 text-green-600' : ''}
                          ${scholarship.status === 'draft' ? 'bg-gray-100 text-gray-600' : ''}
                          ${scholarship.status === 'closed' ? 'bg-red-100 text-red-600' : ''}
                        `}>
                          {scholarship.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingScholarship(scholarship);
                        setShowScholarshipForm(true);
                      }}
                      className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors"
                    >
                      <Edit className="h-5 w-5 text-text-secondary" />
                    </button>
                    <ChevronDown
                      className={`h-5 w-5 text-text-tertiary transition-transform ${
                        expandedScholarship === scholarship.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedScholarship === scholarship.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-surface-200 overflow-hidden"
                    >
                      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <label className="text-xs text-text-tertiary">Program Type</label>
                          <p className="font-medium capitalize">{scholarship.programType?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <label className="text-xs text-text-tertiary">Deadline</label>
                          <p className="font-medium">
                            {scholarship.applicationDeadline
                              ? new Date(scholarship.applicationDeadline).toLocaleDateString()
                              : 'No deadline'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-text-tertiary">Applications</label>
                          <p className="font-medium">
                            {applications.filter((a) => a.scholarshipId === scholarship.id).length}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-text-tertiary">Featured</label>
                          <p className="font-medium">{scholarship.isFeatured ? 'Yes' : 'No'}</p>
                        </div>
                        {scholarship.description && (
                          <div className="col-span-full">
                            <label className="text-xs text-text-tertiary">Description</label>
                            <p className="text-text-secondary mt-1">{scholarship.description}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {scholarships.length === 0 && !isLoading && (
              <div className="text-center py-20 bg-white rounded-2xl border border-surface-200">
                <GraduationCap className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary">No scholarships created yet</p>
                <button
                  onClick={() => {
                    setEditingScholarship(null);
                    setShowScholarshipForm(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-ghana-green text-white rounded-xl font-medium hover:bg-ghana-green/90 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Create First Scholarship
                </button>
              </div>
            )}
          </div>
        )}

        {/* Application Review Modal */}
        <AnimatePresence>
          {selectedApplication && (
            <ApplicationReviewModal
              application={selectedApplication}
              onClose={() => setSelectedApplication(null)}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
        </AnimatePresence>

        {/* Scholarship Form Modal */}
        <AnimatePresence>
          {showScholarshipForm && (
            <ScholarshipForm
              scholarship={editingScholarship}
              onClose={() => {
                setShowScholarshipForm(false);
                setEditingScholarship(null);
              }}
              onSave={handleSaveScholarship}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
