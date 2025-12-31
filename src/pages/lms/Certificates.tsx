/**
 * Certificates Page
 * Display and download earned certificates
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Download,
  ExternalLink,
  Calendar,
  GraduationCap,
  Trophy,
  Share2,
  Search,
  Eye,
  X,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { useLMSStore } from '@/stores/lmsStore';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';
import { generateCertificateFromData } from '@/utils/generateCertificatePDF';
import type { Certificate } from '@/types/lms';

const gradeColors: Record<string, string> = {
  A: 'text-green-600 dark:text-green-400',
  B: 'text-blue-600 dark:text-blue-400',
  C: 'text-yellow-600 dark:text-yellow-400',
  D: 'text-orange-600 dark:text-orange-400',
  F: 'text-red-600 dark:text-red-400',
};

export default function Certificates() {
  const { certificates, isLoading, fetchCertificates } = useLMSStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const filteredCertificates = certificates.filter(
    (cert) =>
      !searchQuery ||
      cert.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleShare = async (certificate: Certificate) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate: ${certificate.courseTitle}`,
          text: `I completed ${certificate.courseTitle} with grade ${certificate.gradeLabel}!`,
          url: certificate.verificationUrl || window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy verification URL to clipboard
      if (certificate.verificationUrl) {
        navigator.clipboard.writeText(certificate.verificationUrl);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-surface-900 dark:text-surface-50 truncate">
              My Certificates
            </h1>
            <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 truncate">
              Your earned achievements and credentials
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl p-4 sm:p-6 text-white"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-4xl font-bold">{certificates.length}</p>
              <p className="text-xs sm:text-sm text-accent-100 truncate">Certificates Earned</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 sm:w-7 sm:h-7 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-4xl font-bold text-surface-900 dark:text-surface-50">
                {certificates.filter((c) => c.gradeLabel?.startsWith('A')).length}
              </p>
              <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 truncate">A-Grade Achievements</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-4xl font-bold text-surface-900 dark:text-surface-50">
                {certificates.length > 0
                  ? Math.round(
                      certificates.reduce((acc, c) => acc + (c.grade || 0), 0) / certificates.length
                    )
                  : 0}
                %
              </p>
              <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 truncate">Average Grade</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search certificates..."
            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-surface-400 touch-manipulation"
          />
        </div>
      </div>

      {/* Certificates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <Award className="w-12 h-12 sm:w-16 sm:h-16 text-surface-300 dark:text-surface-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1.5 sm:mb-2">
            {certificates.length === 0 ? 'No certificates yet' : 'No certificates found'}
          </h3>
          <p className="text-sm sm:text-base text-surface-600 dark:text-surface-400 mb-4 sm:mb-6">
            {certificates.length === 0
              ? 'Complete courses to earn certificates'
              : 'Try adjusting your search'}
          </p>
          {certificates.length === 0 && (
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg font-medium transition-colors touch-manipulation"
            >
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
              Browse Courses
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCertificates.map((certificate, index) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              index={index}
              onView={() => setSelectedCertificate(certificate)}
              onShare={() => handleShare(certificate)}
              onDownload={() => generateCertificateFromData(certificate)}
            />
          ))}
        </div>
      )}

      {/* Certificate Preview Modal */}
      <AnimatePresence>
        {selectedCertificate && (
          <CertificatePreviewModal
            certificate={selectedCertificate}
            onClose={() => setSelectedCertificate(null)}
            onShare={() => handleShare(selectedCertificate)}
            onDownload={() => generateCertificateFromData(selectedCertificate)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CertificateCard({
  certificate,
  index,
  onView,
  onShare,
  onDownload,
}: {
  certificate: Certificate;
  index: number;
  onView: () => void;
  onShare: () => void;
  onDownload: () => void;
}) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const gradeClass = certificate.gradeLabel
    ? gradeColors[certificate.gradeLabel.charAt(0)] || 'text-surface-600'
    : 'text-surface-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden hover:shadow-lg active:shadow-md transition-all duration-300"
    >
      {/* Certificate Preview */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-br from-accent-50 via-white to-primary-50 dark:from-accent-900/20 dark:via-surface-800 dark:to-primary-900/20 flex items-center justify-center border-b border-surface-200 dark:border-surface-700">
        <div className="text-center">
          <Award className="w-10 h-10 sm:w-12 sm:h-12 text-accent-500 mx-auto mb-1.5 sm:mb-2" />
          <p className="text-xs sm:text-sm font-medium text-surface-600 dark:text-surface-400">
            Certificate of Completion
          </p>
        </div>

        {/* Hover/Touch overlay - always visible on mobile via tap */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={onView}
            className="p-2.5 sm:p-2 bg-white rounded-lg text-surface-900 hover:bg-surface-100 active:bg-surface-200 transition-colors touch-manipulation"
            title="View Certificate"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={onDownload}
            className="p-2.5 sm:p-2 bg-white rounded-lg text-surface-900 hover:bg-surface-100 active:bg-surface-200 transition-colors touch-manipulation"
            title="Download PDF"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onShare}
            className="p-2.5 sm:p-2 bg-white rounded-lg text-surface-900 hover:bg-surface-100 active:bg-surface-200 transition-colors touch-manipulation"
            title="Share Certificate"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base text-surface-900 dark:text-surface-100 mb-1.5 sm:mb-2 line-clamp-2">
          {certificate.courseTitle}
        </h3>

        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-surface-500 dark:text-surface-400">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{formatDate(certificate.completionDate)}</span>
          </div>
          {certificate.gradeLabel && (
            <div className={cn('text-base sm:text-lg font-bold', gradeClass)}>
              {certificate.gradeLabel}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-surface-100 dark:border-surface-700">
          <span className="text-[10px] sm:text-xs text-surface-400 font-mono truncate max-w-[120px] sm:max-w-none">
            #{certificate.certificateNumber}
          </span>
          {certificate.verificationUrl && (
            <a
              href={certificate.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline active:text-primary-700 touch-manipulation shrink-0"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden sm:inline">Verify</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CertificatePreviewModal({
  certificate,
  onClose,
  onShare,
  onDownload,
}: {
  certificate: Certificate;
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
}) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      />

      {/* Modal - Bottom sheet on mobile, centered on desktop */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-2xl lg:max-w-3xl sm:mx-4 bg-white dark:bg-surface-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col"
        >
          {/* Mobile drag indicator */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
          </div>

          {/* Header with close button */}
          <div className="flex items-center justify-between px-4 py-3 sm:py-4 border-b border-surface-200 dark:border-surface-700 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-surface-900 dark:text-white">
                  Certificate Preview
                </h2>
                <p className="text-[10px] sm:text-xs text-surface-500 dark:text-surface-400 font-mono">
                  #{certificate.certificateNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-surface-200 dark:active:bg-surface-600 transition-colors touch-manipulation shrink-0"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>

          {/* Certificate Design - Scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-accent-50 via-white to-primary-50 dark:from-accent-900/20 dark:via-surface-800 dark:to-primary-900/20">
              <div className="text-center border-4 sm:border-8 border-double border-accent-300 dark:border-accent-700 rounded-lg p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                  <Award className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-accent-500 mx-auto mb-2 sm:mb-4" />
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-surface-50">
                    Certificate of Completion
                  </h2>
                  <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 mt-1 sm:mt-2">
                    OHCS E-Library Learning Management System
                  </p>
                </div>

                {/* Body */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 mb-1 sm:mb-2">
                    This is to certify that
                  </p>
                  <p className="text-base sm:text-xl lg:text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1 sm:mb-2 break-words">
                    {certificate.recipientName}
                  </p>
                  <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 mb-2 sm:mb-4">
                    has successfully completed
                  </p>
                  <p className="text-sm sm:text-lg lg:text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2 sm:mb-4 break-words">
                    {certificate.courseTitle}
                  </p>
                  {certificate.grade && (
                    <p className="text-sm sm:text-base lg:text-lg text-surface-700 dark:text-surface-300">
                      with a grade of{' '}
                      <span className="font-bold text-accent-600 dark:text-accent-400">
                        {certificate.gradeLabel} ({certificate.grade}%)
                      </span>
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-4 sm:pt-6 border-t border-accent-200 dark:border-accent-800">
                  <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400">
                    Issued on {formatDate(certificate.completionDate)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-surface-400 dark:text-surface-500 mt-1 sm:mt-2 font-mono break-all">
                    Certificate ID: {certificate.certificateNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="px-4 py-3 sm:py-4 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 shrink-0">
            {/* Verification link - visible on all screens */}
            {certificate.verificationUrl && (
              <a
                href={certificate.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-3 touch-manipulation"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Verify Certificate Online</span>
              </a>
            )}

            {/* Action buttons - stacked on mobile, side by side on desktop */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={onShare}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 active:bg-surface-300 dark:active:bg-surface-600 rounded-lg transition-colors touch-manipulation sm:flex-1"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button
                onClick={onDownload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg transition-colors touch-manipulation sm:flex-1"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>

            {/* Safe area for notched devices */}
            <div className="sm:hidden h-safe-area-inset-bottom" />
          </div>
        </motion.div>
      </div>
    </>
  );
}
