import { useEffect } from 'react';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, FileSearch,
  Store, Calendar, User, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { useSellerStore } from '@/stores/shopStore';
import type { ApplicationStatus as StatusType } from '@/types/shop';

const statusConfig: Record<StatusType, {
  icon: typeof Clock;
  color: string;
  bgColor: string;
  title: string;
  description: string;
}> = {
  pending: {
    icon: Clock,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100 dark:bg-warning-900/30',
    title: 'Application Pending',
    description: 'Your application has been submitted and is awaiting review.',
  },
  under_review: {
    icon: FileSearch,
    color: 'text-info-600',
    bgColor: 'bg-info-100 dark:bg-info-900/30',
    title: 'Under Review',
    description: 'Our team is currently reviewing your application.',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-success-600',
    bgColor: 'bg-success-100 dark:bg-success-900/30',
    title: 'Application Approved!',
    description: 'Congratulations! Your seller account is now active.',
  },
  rejected: {
    icon: XCircle,
    color: 'text-error-600',
    bgColor: 'bg-error-100 dark:bg-error-900/30',
    title: 'Application Not Approved',
    description: 'Unfortunately, your application was not approved at this time.',
  },
  request_info: {
    icon: AlertCircle,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100 dark:bg-warning-900/30',
    title: 'Additional Information Required',
    description: 'Please provide the requested information to continue.',
  },
};

interface ApplicationStatusProps {
  onReapply?: () => void;
  onGoToDashboard?: () => void;
}

export function ApplicationStatus({ onReapply, onGoToDashboard }: ApplicationStatusProps) {
  const { application, applicationHistory, fetchApplication, isLoadingApplication } = useSellerStore();

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  if (isLoadingApplication) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const config = statusConfig[application.status];
  const StatusIcon = config.icon;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Status Card */}
      <div className={cn('rounded-xl p-6', config.bgColor)}>
        <div className="flex items-start gap-4">
          <div className={cn('p-3 rounded-full', config.bgColor)}>
            <StatusIcon className={cn('w-8 h-8', config.color)} />
          </div>
          <div className="flex-1">
            <h3 className={cn('text-xl font-semibold', config.color)}>
              {config.title}
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              {config.description}
            </p>

            {application.status === 'rejected' && application.rejectionReason && (
              <div className="mt-4 p-3 bg-white dark:bg-surface-800 rounded-lg">
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Reason:
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                  {application.rejectionReason}
                </p>
              </div>
            )}

            {application.status === 'approved' && (
              <Button className="mt-4" onClick={onGoToDashboard}>
                <Store className="w-4 h-4 mr-2" />
                Go to Seller Dashboard
              </Button>
            )}

            {application.status === 'rejected' && (
              <Button className="mt-4" variant="outline" onClick={onReapply}>
                Submit New Application
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Application Details */}
      <div className="mt-6 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h4 className="font-semibold text-surface-900 dark:text-surface-50">
            Application Details
          </h4>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-surface-400" />
            <div>
              <p className="text-sm text-surface-500">Store Name</p>
              <p className="font-medium text-surface-900 dark:text-surface-50">
                {application.storeName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-surface-400" />
            <div>
              <p className="text-sm text-surface-500">Applicant</p>
              <p className="font-medium text-surface-900 dark:text-surface-50">
                {application.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-surface-400" />
            <div>
              <p className="text-sm text-surface-500">Submitted</p>
              <p className="font-medium text-surface-900 dark:text-surface-50">
                {new Date(application.submittedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {application.reviewedAt && (
            <div className="flex items-center gap-3">
              <FileSearch className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-sm text-surface-500">Last Reviewed</p>
                <p className="font-medium text-surface-900 dark:text-surface-50">
                  {new Date(application.reviewedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {application.reviewerName && ` by ${application.reviewerName}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review History */}
      {applicationHistory.length > 0 && (
        <div className="mt-6 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h4 className="font-semibold text-surface-900 dark:text-surface-50">
              Review History
            </h4>
          </div>

          <div className="p-4">
            <div className="space-y-4">
              {applicationHistory.map((item, index) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      item.action === 'approved' ? 'bg-success-100 text-success-600' :
                      item.action === 'rejected' ? 'bg-error-100 text-error-600' :
                      'bg-surface-100 text-surface-600'
                    )}>
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    {index < applicationHistory.length - 1 && (
                      <div className="absolute top-8 left-4 w-0.5 h-full -translate-x-1/2 bg-surface-200 dark:bg-surface-700" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-surface-900 dark:text-surface-50 capitalize">
                        {item.action.replace('_', ' ')}
                      </span>
                      {item.reviewerName && (
                        <span className="text-sm text-surface-500">
                          by {item.reviewerName}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                        {item.notes}
                      </p>
                    )}
                    <p className="text-xs text-surface-400 mt-1">
                      {new Date(item.createdAt).toLocaleString('en-GB')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
