import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Calendar,
  Users,
  Award,
  Clock,
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  BookOpen,
  Target,
  ExternalLink,
} from 'lucide-react';
import { useScholarshipsStore } from '@/stores/sponsorshipStore';
import { useAuthStore } from '@/stores/authStore';

export default function ScholarshipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { currentScholarship, isLoading, error, fetchScholarship } = useScholarshipsStore();
  const [existingApplication, setExistingApplication] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchScholarship(id).then((data) => {
        if (data?.existingApplication) {
          setExistingApplication(data.existingApplication);
        }
      }).catch(console.error);
    }
  }, [id, fetchScholarship]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ghana-green mx-auto mb-4" />
          <p className="text-text-secondary">Loading scholarship details...</p>
        </div>
      </div>
    );
  }

  if (error || !currentScholarship) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Scholarship Not Found</h2>
          <p className="text-text-secondary mb-4">
            {error || 'The scholarship you are looking for does not exist or has been removed.'}
          </p>
          <Link
            to="/scholarships"
            className="inline-flex items-center gap-2 px-4 py-2 bg-ghana-green text-white rounded-lg font-medium hover:bg-ghana-green/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Scholarships
          </Link>
        </div>
      </div>
    );
  }

  const scholarship = currentScholarship;
  const daysLeft = scholarship.applicationDeadline
    ? Math.ceil((new Date(scholarship.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isFull = scholarship.currentRecipients >= scholarship.maxRecipients;
  const canApply = !isExpired && !isFull && scholarship.status === 'open';

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/scholarships/${id}/apply` } });
      return;
    }
    navigate(`/scholarships/${id}/apply`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            to="/scholarships"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Scholarships
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            {scholarship.coverImage ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden h-64 bg-surface-100"
              >
                <img
                  src={scholarship.coverImage}
                  alt={scholarship.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl h-48 bg-gradient-to-br from-ghana-green/10 via-surface-100 to-ghana-gold/10 flex items-center justify-center"
              >
                <GraduationCap className="h-20 w-20 text-ghana-green/30" />
              </motion.div>
            )}

            {/* Title and Sponsor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Sponsor Info */}
              {scholarship.sponsor && (
                <div className="flex items-center gap-3 mb-4">
                  {scholarship.sponsor.logo ? (
                    <img
                      src={scholarship.sponsor.logo}
                      alt={scholarship.sponsor.name}
                      className="h-10 w-10 object-contain rounded-lg border border-surface-200 p-1"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-ghana-green/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-ghana-green" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-text-tertiary">Sponsored by</p>
                    <p className="font-medium text-text-primary">{scholarship.sponsor.name}</p>
                  </div>
                </div>
              )}

              <h1 className="text-3xl font-bold text-text-primary mb-3">{scholarship.title}</h1>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {scholarship.isFeatured && (
                  <span className="px-3 py-1 bg-ghana-gold/10 text-amber-700 text-sm font-medium rounded-full">
                    Featured
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  scholarship.status === 'open' ? 'bg-green-100 text-green-700' :
                  scholarship.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {scholarship.status}
                </span>
                {isUrgent && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {daysLeft} days left
                  </span>
                )}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-surface-200 p-6"
            >
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-ghana-green" />
                About This Scholarship
              </h2>
              <div className="prose prose-sm max-w-none text-text-secondary">
                {scholarship.description || scholarship.shortDescription || 'No description available.'}
              </div>
            </motion.div>

            {/* Eligibility Criteria */}
            {scholarship.eligibilityCriteria && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-surface-200 p-6"
              >
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-ghana-green" />
                  Eligibility Criteria
                </h2>
                <ul className="space-y-3">
                  {scholarship.eligibilityCriteria.minimumYearsOfService && (
                    <li className="flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                      <span className="text-text-secondary">
                        Minimum {scholarship.eligibilityCriteria.minimumYearsOfService} years of service
                      </span>
                    </li>
                  )}
                  {scholarship.eligibilityCriteria.maximumYearsOfService && (
                    <li className="flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                      <span className="text-text-secondary">
                        Maximum {scholarship.eligibilityCriteria.maximumYearsOfService} years of service
                      </span>
                    </li>
                  )}
                  {scholarship.eligibilityCriteria.requiredGradeLevels && (
                    <li className="flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                      <span className="text-text-secondary">
                        Grade levels: {scholarship.eligibilityCriteria.requiredGradeLevels.join(', ')}
                      </span>
                    </li>
                  )}
                  {scholarship.eligibilityCriteria.additionalCriteria?.map((criteria, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                      <span className="text-text-secondary">{criteria}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Requirements */}
            {scholarship.requirements && scholarship.requirements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-surface-200 p-6"
              >
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-ghana-green" />
                  Application Requirements
                </h2>
                <ul className="space-y-3">
                  {scholarship.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-text-secondary">{req}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-surface-200 p-6 sticky top-20"
            >
              {/* Amount */}
              <div className="text-center mb-6">
                <p className="text-sm text-text-tertiary mb-1">Scholarship Amount</p>
                <p className="text-4xl font-bold text-ghana-green">
                  {scholarship.currency} {scholarship.amount.toLocaleString()}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <Users className="h-5 w-5 text-text-tertiary mx-auto mb-1" />
                  <p className="text-lg font-semibold text-text-primary">
                    {scholarship.currentRecipients}/{scholarship.maxRecipients}
                  </p>
                  <p className="text-xs text-text-tertiary">Recipients</p>
                </div>
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <Calendar className="h-5 w-5 text-text-tertiary mx-auto mb-1" />
                  <p className="text-lg font-semibold text-text-primary">
                    {daysLeft !== null ? (isExpired ? 'Closed' : `${daysLeft}d`) : 'Open'}
                  </p>
                  <p className="text-xs text-text-tertiary">Time Left</p>
                </div>
              </div>

              {/* Application Status */}
              {existingApplication && (
                <div className={`mb-4 p-4 rounded-xl ${
                  existingApplication.status === 'approved' ? 'bg-green-50 border border-green-200' :
                  existingApplication.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {existingApplication.status === 'approved' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : existingApplication.status === 'rejected' ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600" />
                    )}
                    <span className="font-medium text-text-primary">
                      Application {existingApplication.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Submitted on {new Date(existingApplication.submittedAt).toLocaleDateString()}
                  </p>
                  <Link
                    to={`/scholarships/my-applications/${existingApplication.id}`}
                    className="mt-2 inline-flex items-center gap-1 text-sm text-ghana-green font-medium hover:underline"
                  >
                    View Application <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Apply Button */}
              {!existingApplication && (
                <button
                  onClick={handleApply}
                  disabled={!canApply}
                  className={`
                    w-full py-4 rounded-xl font-semibold text-lg transition-all
                    ${canApply
                      ? 'bg-ghana-green text-white hover:bg-ghana-green/90 shadow-lg hover:shadow-xl'
                      : 'bg-surface-200 text-text-tertiary cursor-not-allowed'
                    }
                  `}
                >
                  {isExpired ? 'Application Closed' :
                   isFull ? 'No Slots Available' :
                   !isAuthenticated ? 'Login to Apply' :
                   'Apply Now'
                  }
                </button>
              )}

              {/* Deadline Warning */}
              {canApply && isUrgent && (
                <p className="mt-4 text-center text-sm text-amber-600 flex items-center justify-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Application deadline approaching!
                </p>
              )}
            </motion.div>

            {/* Program Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-surface-200 p-6"
            >
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-ghana-green" />
                Program Details
              </h3>
              <div className="space-y-4">
                {scholarship.programType && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Program Type</p>
                    <p className="font-medium text-text-primary capitalize">
                      {scholarship.programType.replace('_', ' ')}
                    </p>
                  </div>
                )}
                {scholarship.targetProgram && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Target Program</p>
                    <p className="font-medium text-text-primary">{scholarship.targetProgram}</p>
                  </div>
                )}
                {scholarship.programDuration && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Duration</p>
                    <p className="font-medium text-text-primary">{scholarship.programDuration}</p>
                  </div>
                )}
                {scholarship.applicationDeadline && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Application Deadline</p>
                    <p className="font-medium text-text-primary">
                      {new Date(scholarship.applicationDeadline).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                {scholarship.programStartDate && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Program Start Date</p>
                    <p className="font-medium text-text-primary">
                      {new Date(scholarship.programStartDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
