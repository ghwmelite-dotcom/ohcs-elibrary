import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  FileCheck,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Plus,
  ChevronDown,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import type { ResearchPhaseApproval, ResearchEthicsApproval } from '@/types';

interface PhaseApprovalGateProps {
  projectId: string;
  project: any;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://ohcs-elibrary-api.ghwmelite.workers.dev';

type GovernanceSection = 'phase-approval' | 'ethics' | 'audit';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', label: 'Approved' },
  rejected: { icon: XCircle, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', label: 'Rejected' },
  submitted: { icon: Send, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', label: 'Submitted' },
  expired: { icon: AlertTriangle, color: 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400', label: 'Expired' },
};

export function PhaseApprovalGate({ projectId, project }: PhaseApprovalGateProps) {
  const { token, user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<GovernanceSection>('phase-approval');

  // Phase Approval State
  const [approvals, setApprovals] = useState<ResearchPhaseApproval[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedApproverId, setSelectedApproverId] = useState('');
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseComments, setResponseComments] = useState('');

  // Ethics State
  const [ethics, setEthics] = useState<ResearchEthicsApproval[]>([]);
  const [ethicsLoading, setEthicsLoading] = useState(true);
  const [showEthicsForm, setShowEthicsForm] = useState(false);
  const [ethicsForm, setEthicsForm] = useState({
    approvalBody: '',
    referenceNumber: '',
    status: 'pending' as ResearchEthicsApproval['status'],
    submittedDate: '',
    conditions: '',
  });
  const [savingEthics, setSavingEthics] = useState(false);

  // Audit State
  const [exportingAudit, setExportingAudit] = useState(false);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  }, [token]);

  // Fetch Phase Approvals
  const fetchApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    try {
      const response = await authFetch(
        `${API_BASE}/api/v1/research/projects/${projectId}/phase-approvals`
      );
      if (response.ok) {
        const data = await response.json();
        setApprovals(data.items || data.approvals || []);
      }
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setApprovalsLoading(false);
    }
  }, [projectId, authFetch]);

  // Fetch Ethics
  const fetchEthics = useCallback(async () => {
    setEthicsLoading(true);
    try {
      const response = await authFetch(
        `${API_BASE}/api/v1/research/projects/${projectId}/ethics`
      );
      if (response.ok) {
        const data = await response.json();
        setEthics(data.items || data.ethics || []);
      }
    } catch (err) {
      console.error('Failed to fetch ethics:', err);
    } finally {
      setEthicsLoading(false);
    }
  }, [projectId, authFetch]);

  useEffect(() => {
    if (activeSection === 'phase-approval') {
      fetchApprovals();
    } else if (activeSection === 'ethics') {
      fetchEthics();
    }
  }, [activeSection, fetchApprovals, fetchEthics]);

  // Request Phase Approval
  const handleRequestApproval = async () => {
    if (!selectedApproverId) return;
    setRequestingApproval(true);
    try {
      const response = await authFetch(
        `${API_BASE}/api/v1/research/projects/${projectId}/phase-approval`,
        {
          method: 'POST',
          body: JSON.stringify({
            phase: project?.phase,
            approverId: selectedApproverId,
          }),
        }
      );
      if (response.ok) {
        setShowRequestModal(false);
        setSelectedApproverId('');
        await fetchApprovals();
      }
    } catch (err) {
      console.error('Failed to request approval:', err);
    } finally {
      setRequestingApproval(false);
    }
  };

  // Respond to Approval
  const handleRespondApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    setRespondingId(approvalId);
    try {
      const response = await authFetch(
        `${API_BASE}/api/v1/research/projects/${projectId}/phase-approval/${approvalId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status, comments: responseComments }),
        }
      );
      if (response.ok) {
        setResponseComments('');
        await fetchApprovals();
      }
    } catch (err) {
      console.error('Failed to respond to approval:', err);
    } finally {
      setRespondingId(null);
    }
  };

  // Add Ethics Approval
  const handleAddEthics = async () => {
    if (!ethicsForm.approvalBody) return;
    setSavingEthics(true);
    try {
      const response = await authFetch(
        `${API_BASE}/api/v1/research/projects/${projectId}/ethics`,
        {
          method: 'POST',
          body: JSON.stringify(ethicsForm),
        }
      );
      if (response.ok) {
        setShowEthicsForm(false);
        setEthicsForm({
          approvalBody: '',
          referenceNumber: '',
          status: 'pending',
          submittedDate: '',
          conditions: '',
        });
        await fetchEthics();
      }
    } catch (err) {
      console.error('Failed to add ethics approval:', err);
    } finally {
      setSavingEthics(false);
    }
  };

  // Export Audit Trail
  const handleExportAudit = async () => {
    setExportingAudit(true);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE}/api/v1/research/projects/${projectId}/audit-trail/export`,
        { headers }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-trail-${projectId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export audit trail:', err);
    } finally {
      setExportingAudit(false);
    }
  };

  const teamMembers = project?.teamMembers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary-500" />
          Governance & Approvals
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Phase approvals, ethics tracking, and audit trail
        </p>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2">
        {[
          { id: 'phase-approval' as GovernanceSection, label: 'Phase Approval', icon: FileCheck },
          { id: 'ethics' as GovernanceSection, label: 'Ethics Tracking', icon: ShieldCheck },
          { id: 'audit' as GovernanceSection, label: 'Audit Trail', icon: Download },
        ].map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeSection === section.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                  : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Phase Approval Section */}
        {activeSection === 'phase-approval' && (
          <motion.div
            key="phase-approval"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Current Phase */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                    Current Phase
                  </p>
                  <p className="text-lg font-semibold text-surface-900 dark:text-white mt-1 capitalize">
                    {project?.phase?.replace(/_/g, ' ') || 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  <Send className="w-4 h-4" />
                  Request Approval
                </button>
              </div>
            </div>

            {/* Request Approval Modal */}
            <AnimatePresence>
              {showRequestModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowRequestModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
                      <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                        Request Phase Approval
                      </h3>
                      <button
                        onClick={() => setShowRequestModal(false)}
                        className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                          Phase
                        </label>
                        <p className="text-sm text-surface-900 dark:text-white capitalize bg-surface-50 dark:bg-surface-900 px-3 py-2 rounded-lg">
                          {project?.phase?.replace(/_/g, ' ') || 'Current Phase'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                          Select Approver
                        </label>
                        <select
                          value={selectedApproverId}
                          onChange={(e) => setSelectedApproverId(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Choose a team member...</option>
                          {teamMembers.map((member: any) => (
                            <option key={member.userId || member.id} value={member.userId || member.id}>
                              {member.user?.displayName || member.user?.name || member.displayName || 'Team Member'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-surface-200 dark:border-surface-700">
                      <button
                        onClick={() => setShowRequestModal(false)}
                        className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRequestApproval}
                        disabled={!selectedApproverId || requestingApproval}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        {requestingApproval ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Request
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Approvals List */}
            {approvalsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : approvals.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                <FileCheck className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                <p className="text-surface-500 dark:text-surface-400 text-sm">
                  No phase approvals yet
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700 overflow-hidden">
                {approvals.map((approval) => {
                  const statusConfig = STATUS_CONFIG[approval.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={approval.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn('p-2 rounded-lg', statusConfig.color.split(' ')[0])}>
                            <StatusIcon className={cn('w-4 h-4', statusConfig.color.split(' ').slice(-2).join(' '))} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-surface-900 dark:text-white capitalize">
                              {approval.phase?.replace(/_/g, ' ')} Phase
                            </p>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                              Requested by {approval.requestedByName || 'Unknown'} on{' '}
                              {new Date(approval.requestedAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                            {approval.comments && (
                              <p className="text-xs text-surface-600 dark:text-surface-400 mt-1 italic">
                                "{approval.comments}"
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full shrink-0', statusConfig.color)}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Approve/Reject controls for pending approvals */}
                      {approval.status === 'pending' && (
                        <div className="mt-3 ml-11 space-y-2">
                          <textarea
                            value={respondingId === approval.id ? responseComments : ''}
                            onChange={(e) => {
                              setRespondingId(approval.id);
                              setResponseComments(e.target.value);
                            }}
                            placeholder="Add comments (optional)..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRespondApproval(approval.id, 'approved')}
                              disabled={respondingId === approval.id && requestingApproval}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRespondApproval(approval.id, 'rejected')}
                              disabled={respondingId === approval.id && requestingApproval}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Ethics Tracking Section */}
        {activeSection === 'ethics' && (
          <motion.div
            key="ethics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Add Ethics Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowEthicsForm(!showEthicsForm)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Ethics Approval
                <ChevronDown className={cn('w-4 h-4 transition-transform', showEthicsForm && 'rotate-180')} />
              </button>
            </div>

            {/* Ethics Form */}
            <AnimatePresence>
              {showEthicsForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                          Approval Body *
                        </label>
                        <input
                          type="text"
                          value={ethicsForm.approvalBody}
                          onChange={(e) => setEthicsForm(prev => ({ ...prev, approvalBody: e.target.value }))}
                          placeholder="e.g., IRB, Ethics Committee"
                          className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg text-sm text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                          Reference Number
                        </label>
                        <input
                          type="text"
                          value={ethicsForm.referenceNumber}
                          onChange={(e) => setEthicsForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                          placeholder="e.g., IRB-2026-001"
                          className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg text-sm text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                          Status
                        </label>
                        <select
                          value={ethicsForm.status}
                          onChange={(e) => setEthicsForm(prev => ({ ...prev, status: e.target.value as ResearchEthicsApproval['status'] }))}
                          className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                          Submitted Date
                        </label>
                        <input
                          type="date"
                          value={ethicsForm.submittedDate}
                          onChange={(e) => setEthicsForm(prev => ({ ...prev, submittedDate: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Conditions / Notes
                      </label>
                      <textarea
                        value={ethicsForm.conditions}
                        onChange={(e) => setEthicsForm(prev => ({ ...prev, conditions: e.target.value }))}
                        placeholder="Any conditions or notes..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg text-sm text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowEthicsForm(false)}
                        className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddEthics}
                        disabled={!ethicsForm.approvalBody || savingEthics}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        {savingEthics ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add Record
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ethics List */}
            {ethicsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : ethics.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                <ShieldCheck className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                <p className="text-surface-500 dark:text-surface-400 text-sm">
                  No ethics approvals recorded yet
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700 overflow-hidden">
                {ethics.map((record) => {
                  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={record.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn('p-2 rounded-lg', statusConfig.color.split(' ')[0])}>
                            <StatusIcon className={cn('w-4 h-4', statusConfig.color.split(' ').slice(-2).join(' '))} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-surface-900 dark:text-white">
                              {record.approvalBody}
                            </p>
                            {record.referenceNumber && (
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                Ref: {record.referenceNumber}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-surface-500 dark:text-surface-400">
                              {record.submittedDate && (
                                <span>Submitted: {new Date(record.submittedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              )}
                              {record.approvalDate && (
                                <>
                                  <span>|</span>
                                  <span>Approved: {new Date(record.approvalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </>
                              )}
                              {record.expiryDate && (
                                <>
                                  <span>|</span>
                                  <span className={cn(
                                    new Date(record.expiryDate) < new Date() ? 'text-red-500 dark:text-red-400' : ''
                                  )}>
                                    Expires: {new Date(record.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </>
                              )}
                            </div>
                            {record.conditions && (
                              <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">
                                {record.conditions}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full shrink-0', statusConfig.color)}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Audit Trail Section */}
        {activeSection === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-8 text-center">
              <Download className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                Export Audit Trail
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 max-w-md mx-auto">
                Download a comprehensive CSV export of all project activities, changes, and approvals for compliance and reporting.
              </p>
              <button
                onClick={handleExportAudit}
                disabled={exportingAudit}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
              >
                {exportingAudit ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download CSV
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PhaseApprovalGate;
