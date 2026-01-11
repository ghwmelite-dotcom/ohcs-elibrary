import { useState, useEffect } from 'react';
import {
  Store, Clock, CheckCircle2, XCircle, FileSearch, Eye,
  Filter, Search, ChevronLeft, ChevronRight, User, Mail,
  Building2, Phone, Calendar, AlertCircle, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { cn } from '@/utils/cn';
import { useAdminSellerStore } from '@/stores/shopStore';
import { useToast } from '@/components/shared/Toast';
import type { SellerApplication, ApplicationStatus } from '@/types/shop';

const statusConfig: Record<ApplicationStatus, {
  label: string;
  icon: typeof Clock;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100 dark:bg-warning-900/30',
  },
  under_review: {
    label: 'Under Review',
    icon: FileSearch,
    color: 'text-info-600',
    bgColor: 'bg-info-100 dark:bg-info-900/30',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-success-600',
    bgColor: 'bg-success-100 dark:bg-success-900/30',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-error-600',
    bgColor: 'bg-error-100 dark:bg-error-900/30',
  },
  request_info: {
    label: 'Info Requested',
    icon: AlertCircle,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100 dark:bg-warning-900/30',
  },
};

const statusFilters = [
  { value: 'all', label: 'All Applications' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminSellerApplications() {
  const toast = useToast();
  const {
    applications,
    selectedApplication,
    applicationHistory,
    statusCounts,
    pagination,
    isLoading,
    fetchApplications,
    fetchApplicationDetails,
    updateApplicationStatus,
  } = useAdminSellerStore();

  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications(statusFilter);
  }, [statusFilter, fetchApplications]);

  const handleViewDetails = async (id: string) => {
    await fetchApplicationDetails(id);
    setShowDetail(true);
  };

  const handleStatusUpdate = async (status: ApplicationStatus) => {
    if (!selectedApplication) return;

    setProcessingAction(status);
    try {
      await updateApplicationStatus(
        selectedApplication.id,
        status,
        actionNotes,
        status === 'rejected' ? rejectionReason : undefined
      );
      toast.success('Status Updated', `Application has been ${status}`);
      setShowDetail(false);
      setActionNotes('');
      setRejectionReason('');
    } catch (error) {
      toast.error('Update Failed', error instanceof Error ? error.message : 'Please try again');
    } finally {
      setProcessingAction(null);
    }
  };

  const filteredApplications = applications.filter(app =>
    app.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Seller Applications
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Review and manage seller applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {statusFilters.slice(1).map(filter => {
            const config = statusConfig[filter.value as ApplicationStatus];
            const count = statusCounts[filter.value] || 0;
            const StatusIcon = config?.icon || Clock;

            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  statusFilter === filter.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', config?.bgColor || 'bg-surface-100')}>
                    <StatusIcon className={cn('w-5 h-5', config?.color || 'text-surface-500')} />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                      {count}
                    </p>
                    <p className="text-xs text-surface-500">{filter.label}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by store name, applicant, or email..."
                leftIcon={<Search className="w-5 h-5" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {statusFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    statusFilter === filter.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 mx-auto text-surface-300 mb-4" />
              <p className="text-surface-500">No applications found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-50 dark:bg-surface-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Store Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                    {filteredApplications.map((app) => {
                      const config = statusConfig[app.status];
                      const StatusIcon = config.icon;

                      return (
                        <tr key={app.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary-600" />
                              </div>
                              <div>
                                <p className="font-medium text-surface-900 dark:text-surface-50">
                                  {app.fullName}
                                </p>
                                <p className="text-sm text-surface-500">{app.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-surface-900 dark:text-surface-50">
                              {app.storeName}
                            </p>
                            {app.isAuthor && (
                              <span className="inline-flex items-center gap-1 text-xs text-primary-600 mt-1">
                                <ShieldCheck className="w-3 h-3" />
                                Author
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize text-surface-600 dark:text-surface-400">
                              {app.businessType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                              config.bgColor, config.color
                            )}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-surface-500">
                            {new Date(app.submittedAt).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(app.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-surface-200 dark:border-surface-700">
                  <p className="text-sm text-surface-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchApplications(statusFilter, pagination.page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchApplications(statusFilter, pagination.page + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail Modal */}
        {showDetail && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-surface-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">
                      Application Review
                    </h2>
                    <p className="text-surface-500 mt-1">{selectedApplication.storeName}</p>
                  </div>
                  <button
                    onClick={() => setShowDetail(false)}
                    className="text-surface-400 hover:text-surface-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Applicant Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary-600" />
                      Applicant Information
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-surface-400" />
                        <div>
                          <p className="text-xs text-surface-500">Full Name</p>
                          <p className="text-surface-900 dark:text-surface-50">{selectedApplication.fullName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-surface-400" />
                        <div>
                          <p className="text-xs text-surface-500">Email</p>
                          <p className="text-surface-900 dark:text-surface-50">{selectedApplication.email}</p>
                        </div>
                      </div>
                      {selectedApplication.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-surface-400" />
                          <div>
                            <p className="text-xs text-surface-500">Phone</p>
                            <p className="text-surface-900 dark:text-surface-50">{selectedApplication.phone}</p>
                          </div>
                        </div>
                      )}
                      {selectedApplication.staffId && (
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-success-500" />
                          <div>
                            <p className="text-xs text-surface-500">Staff ID (Verified)</p>
                            <p className="text-surface-900 dark:text-surface-50">{selectedApplication.staffId}</p>
                          </div>
                        </div>
                      )}
                      {selectedApplication.department && (
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-surface-400" />
                          <div>
                            <p className="text-xs text-surface-500">Department</p>
                            <p className="text-surface-900 dark:text-surface-50">{selectedApplication.department}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                      <Store className="w-5 h-5 text-primary-600" />
                      Store Information
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-surface-500">Store Name</p>
                        <p className="text-surface-900 dark:text-surface-50">{selectedApplication.storeName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-500">Business Type</p>
                        <p className="text-surface-900 dark:text-surface-50 capitalize">{selectedApplication.businessType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-500">Is Author</p>
                        <p className="text-surface-900 dark:text-surface-50">
                          {selectedApplication.isAuthor ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Store Description */}
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
                    Store Description
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 bg-surface-50 dark:bg-surface-900 p-4 rounded-lg">
                    {selectedApplication.storeDescription}
                  </p>
                </div>

                {/* Author Bio */}
                {selectedApplication.isAuthor && selectedApplication.authorBio && (
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
                      Author Bio
                    </h3>
                    <p className="text-surface-600 dark:text-surface-400 bg-surface-50 dark:bg-surface-900 p-4 rounded-lg">
                      {selectedApplication.authorBio}
                    </p>
                  </div>
                )}

                {/* Review History */}
                {applicationHistory.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-3">
                      Review History
                    </h3>
                    <div className="space-y-2">
                      {applicationHistory.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-900 rounded-lg">
                          <Calendar className="w-4 h-4 text-surface-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-surface-900 dark:text-surface-50 capitalize">
                                {item.action.replace('_', ' ')}
                              </span>
                              {item.reviewerName && (
                                <span className="text-sm text-surface-500">by {item.reviewerName}</span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{item.notes}</p>
                            )}
                            <p className="text-xs text-surface-400 mt-1">
                              {new Date(item.createdAt).toLocaleString('en-GB')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedApplication.status !== 'approved' && (
                  <div className="border-t border-surface-200 dark:border-surface-700 pt-6">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                      Take Action
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                          Review Notes (Optional)
                        </label>
                        <textarea
                          className="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 p-3 text-surface-900 dark:text-surface-50"
                          rows={3}
                          placeholder="Add notes for this review..."
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {selectedApplication.status === 'pending' && (
                          <Button
                            onClick={() => handleStatusUpdate('under_review')}
                            isLoading={processingAction === 'under_review'}
                            className="bg-info-600 hover:bg-info-700"
                          >
                            <FileSearch className="w-4 h-4 mr-2" />
                            Start Review
                          </Button>
                        )}

                        <Button
                          onClick={() => handleStatusUpdate('approved')}
                          isLoading={processingAction === 'approved'}
                          className="bg-success-600 hover:bg-success-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) {
                              setRejectionReason(reason);
                              handleStatusUpdate('rejected');
                            }
                          }}
                          isLoading={processingAction === 'rejected'}
                          className="border-error-500 text-error-600 hover:bg-error-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
