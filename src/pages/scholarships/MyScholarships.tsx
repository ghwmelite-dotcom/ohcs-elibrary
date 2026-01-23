import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Award,
  Calendar,
  Building2,
  Eye,
  Loader2,
  LogIn,
} from 'lucide-react';
import { useApplicationsStore } from '@/stores/sponsorshipStore';
import { useAuthStore } from '@/stores/authStore';
import type { ApplicationStatus } from '@/types/sponsorship';

const statusConfig: Record<ApplicationStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: FileText,
  },
  submitted: {
    label: 'Submitted',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Clock,
  },
  under_review: {
    label: 'Under Review',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: Eye,
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: AlertCircle,
  },
  approved: {
    label: 'Approved',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Not Selected',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
};

function ApplicationCard({ application, index }: { application: any; index: number }) {
  const status = statusConfig[application.status as ApplicationStatus] || statusConfig.submitted;
  const StatusIcon = status.icon;

  const submittedDate = application.createdAt
    ? new Date(application.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-surface-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </div>
          {application.awardedAt && (
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <Award className="h-4 w-4" />
              Awarded
            </div>
          )}
        </div>

        {/* Scholarship Info */}
        <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
          {application.scholarshipTitle || 'Scholarship'}
        </h3>

        {application.sponsorName && (
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-4">
            <Building2 className="h-4 w-4" />
            <span>{application.sponsorName}</span>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-ghana-green/10 flex items-center justify-center">
              <Award className="h-4 w-4 text-ghana-green" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Amount</p>
              <p className="text-sm font-semibold text-text-primary">
                {application.currency || 'GHS'} {(application.amount || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">Submitted</p>
              <p className="text-sm font-semibold text-text-primary">
                {submittedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Review Notes (if any) */}
        {application.reviewNotes && application.status !== 'submitted' && (
          <div className="p-3 rounded-lg bg-surface-50 mb-4">
            <p className="text-xs text-text-tertiary mb-1">Review Notes</p>
            <p className="text-sm text-text-secondary">{application.reviewNotes}</p>
          </div>
        )}

        {/* Award Details */}
        {application.status === 'approved' && application.awardAmount && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 mb-4">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <Award className="h-5 w-5" />
              <span>Award: GHS {application.awardAmount.toLocaleString()}</span>
            </div>
            {application.awardedAt && (
              <p className="text-sm text-green-600 mt-1">
                Awarded on {new Date(application.awardedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        )}

        {/* View Details Link */}
        <Link
          to={`/scholarships/${application.scholarshipSlug || application.scholarshipId}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-surface-100 text-text-secondary font-medium hover:bg-surface-200 transition-colors"
        >
          View Scholarship
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Timeline Footer */}
      {application.status !== 'draft' && (
        <div className="px-6 py-3 bg-surface-50 border-t border-surface-200">
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <span>Submitted {submittedDate}</span>
            {application.reviewedAt && (
              <>
                <span className="w-1 h-1 rounded-full bg-surface-300" />
                <span>Reviewed {new Date(application.reviewedAt).toLocaleDateString()}</span>
              </>
            )}
            {application.awardedAt && (
              <>
                <span className="w-1 h-1 rounded-full bg-surface-300" />
                <span>Awarded {new Date(application.awardedAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function MyScholarships() {
  const { isAuthenticated } = useAuthStore();
  const { applications, isLoading, error, fetchMyApplications } = useApplicationsStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyApplications();
    }
  }, [fetchMyApplications, isAuthenticated]);

  // Group applications by status
  const activeApplications = applications.filter(
    (app) => ['submitted', 'under_review', 'shortlisted'].includes(app.status)
  );
  const awardedApplications = applications.filter((app) => app.status === 'approved');
  const pastApplications = applications.filter((app) => app.status === 'rejected');
  const draftApplications = applications.filter((app) => app.status === 'draft');

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-surface-200 p-8">
            <div className="h-16 w-16 rounded-full bg-ghana-green/10 flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-8 w-8 text-ghana-green" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">Sign In Required</h1>
            <p className="text-text-secondary mb-6">
              Please sign in to view your scholarship applications and track their status.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/auth/login"
                className="w-full py-3 px-4 bg-ghana-green text-white rounded-xl font-medium hover:bg-ghana-green/90 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/scholarships"
                className="w-full py-3 px-4 bg-surface-100 text-text-primary rounded-xl font-medium hover:bg-surface-200 transition-colors"
              >
                Browse Scholarships
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Header */}
      <section className="relative overflow-hidden py-16 px-4 bg-gradient-to-br from-ghana-green via-green-700 to-green-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 border-4 border-white rounded-full" />
          <div className="absolute bottom-10 left-10 w-60 h-60 border-4 border-white rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-ghana-gold" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">My Scholarships</h1>
              </div>
              <p className="text-white/80 max-w-xl">
                Track your scholarship applications and view your awards. Stay updated on your
                application status and award details.
              </p>
            </div>

            <Link
              to="/scholarships"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ghana-gold text-white rounded-xl font-medium hover:bg-ghana-gold/90 transition-colors self-start"
            >
              Browse Scholarships
              <ChevronRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Total', value: applications.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
              { label: 'Active', value: activeApplications.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
              { label: 'Awarded', value: awardedApplications.length, icon: Award, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
              { label: 'Drafts', value: draftApplications.length, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${stat.bg} ${stat.border} border rounded-xl p-3 md:p-4 text-center shadow-sm`}
              >
                <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color} mx-auto mb-1`} />
                <p className="text-xl md:text-3xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-[10px] md:text-xs text-text-secondary font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-ghana-green mx-auto mb-4" />
              <p className="text-text-secondary">Loading your applications...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Unable to Load</h3>
            <p className="text-text-secondary">{error}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-10 w-10 text-text-tertiary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No Applications Yet</h3>
            <p className="text-text-secondary mb-6">
              You haven't applied for any scholarships yet. Browse available scholarships and start your application.
            </p>
            <Link
              to="/scholarships"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ghana-green text-white rounded-xl font-medium hover:bg-ghana-green/90 transition-colors"
            >
              Browse Scholarships
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Active Applications */}
            {activeApplications.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">Active Applications</h2>
                  <span className="text-sm text-text-tertiary">({activeApplications.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeApplications.map((application, index) => (
                    <ApplicationCard key={application.id} application={application} index={index} />
                  ))}
                </div>
              </section>
            )}

            {/* Awarded Scholarships */}
            {awardedApplications.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Award className="h-4 w-4 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">Awarded Scholarships</h2>
                  <span className="text-sm text-text-tertiary">({awardedApplications.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {awardedApplications.map((application, index) => (
                    <ApplicationCard key={application.id} application={application} index={index} />
                  ))}
                </div>
              </section>
            )}

            {/* Draft Applications */}
            {draftApplications.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-gray-600" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">Draft Applications</h2>
                  <span className="text-sm text-text-tertiary">({draftApplications.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {draftApplications.map((application, index) => (
                    <ApplicationCard key={application.id} application={application} index={index} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Applications */}
            {pastApplications.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-surface-100 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">Past Applications</h2>
                  <span className="text-sm text-text-tertiary">({pastApplications.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastApplications.map((application, index) => (
                    <ApplicationCard key={application.id} application={application} index={index} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
