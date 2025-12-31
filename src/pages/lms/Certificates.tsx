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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
              My Certificates
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Your earned achievements and credentials
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <p className="text-4xl font-bold">{certificates.length}</p>
              <p className="text-accent-100">Certificates Earned</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Star className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-4xl font-bold text-surface-900 dark:text-surface-50">
                {certificates.filter((c) => c.gradeLabel?.startsWith('A')).length}
              </p>
              <p className="text-surface-600 dark:text-surface-400">A-Grade Achievements</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-4xl font-bold text-surface-900 dark:text-surface-50">
                {certificates.length > 0
                  ? Math.round(
                      certificates.reduce((acc, c) => acc + (c.grade || 0), 0) / certificates.length
                    )
                  : 0}
                %
              </p>
              <p className="text-surface-600 dark:text-surface-400">Average Grade</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search certificates by course or certificate number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Certificates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
            {certificates.length === 0 ? 'No certificates yet' : 'No certificates found'}
          </h3>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            {certificates.length === 0
              ? 'Complete courses to earn certificates'
              : 'Try adjusting your search'}
          </p>
          {certificates.length === 0 && (
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <GraduationCap className="w-5 h-5" />
              Browse Courses
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      className="group bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Certificate Preview */}
      <div className="relative h-40 bg-gradient-to-br from-accent-50 via-white to-primary-50 dark:from-accent-900/20 dark:via-surface-800 dark:to-primary-900/20 flex items-center justify-center border-b border-surface-200 dark:border-surface-700">
        <div className="text-center">
          <Award className="w-12 h-12 text-accent-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
            Certificate of Completion
          </p>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={onView}
            className="p-2 bg-white rounded-lg text-surface-900 hover:bg-surface-100 transition-colors"
            title="View Certificate"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={onDownload}
            className="p-2 bg-white rounded-lg text-surface-900 hover:bg-surface-100 transition-colors"
            title="Download PDF"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onShare}
            className="p-2 bg-white rounded-lg text-surface-900 hover:bg-surface-100 transition-colors"
            title="Share Certificate"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2 line-clamp-2">
          {certificate.courseTitle}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(certificate.completionDate)}</span>
          </div>
          {certificate.gradeLabel && (
            <div className={cn('text-lg font-bold', gradeClass)}>
              {certificate.gradeLabel}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-700">
          <span className="text-xs text-surface-400 font-mono">
            #{certificate.certificateNumber}
          </span>
          {certificate.verificationUrl && (
            <a
              href={certificate.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              <CheckCircle2 className="w-3 h-3" />
              Verify
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-3xl bg-white dark:bg-surface-800 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-surface-700/80 rounded-full text-surface-600 dark:text-surface-400 hover:bg-white dark:hover:bg-surface-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Design */}
        <div className="p-8 bg-gradient-to-br from-accent-50 via-white to-primary-50 dark:from-accent-900/20 dark:via-surface-800 dark:to-primary-900/20">
          <div className="text-center border-8 border-double border-accent-300 dark:border-accent-700 rounded-lg p-8">
            {/* Header */}
            <div className="mb-6">
              <Award className="w-16 h-16 text-accent-500 mx-auto mb-4" />
              <h2 className="text-3xl font-heading font-bold text-surface-900 dark:text-surface-50">
                Certificate of Completion
              </h2>
              <p className="text-surface-600 dark:text-surface-400 mt-2">
                OHCS E-Library Learning Management System
              </p>
            </div>

            {/* Body */}
            <div className="mb-6">
              <p className="text-surface-600 dark:text-surface-400 mb-2">
                This is to certify that
              </p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {certificate.recipientName}
              </p>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                has successfully completed
              </p>
              <p className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-4">
                {certificate.courseTitle}
              </p>
              {certificate.grade && (
                <p className="text-lg text-surface-700 dark:text-surface-300">
                  with a grade of{' '}
                  <span className="font-bold text-accent-600 dark:text-accent-400">
                    {certificate.gradeLabel} ({certificate.grade}%)
                  </span>
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-accent-200 dark:border-accent-800">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Issued on {formatDate(certificate.completionDate)}
              </p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-2 font-mono">
                Certificate ID: {certificate.certificateNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <div className="text-sm text-surface-600 dark:text-surface-400">
            {certificate.verificationUrl && (
              <a
                href={certificate.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <ExternalLink className="w-4 h-4" />
                Verify Certificate
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-4 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
