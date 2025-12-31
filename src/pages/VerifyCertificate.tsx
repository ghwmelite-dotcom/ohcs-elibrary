/**
 * Certificate Verification Page
 * Public page for verifying certificate authenticity
 */

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  GraduationCap,
  User,
  Hash,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';

const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

interface CertificateData {
  id: string;
  recipientName: string;
  courseTitle: string;
  completionDate: string;
  grade?: number;
  gradeLabel?: string;
  certificateNumber: string;
  issuedAt: string;
}

export default function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const [certificateId, setCertificateId] = useState(searchParams.get('id') || '');
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto-verify if ID is in URL
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setCertificateId(id);
      handleVerify(id);
    }
  }, [searchParams]);

  const handleVerify = async (id?: string) => {
    const searchId = id || certificateId.trim();
    if (!searchId) {
      setError('Please enter a certificate ID or number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(`${API_BASE}/lms/certificates/${searchId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Certificate not found');
        }
        throw new Error('Failed to verify certificate');
      }

      const data = await response.json();
      setCertificate(data);
    } catch (err: any) {
      setError(err.message || 'Failed to verify certificate');
      setCertificate(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-surface-900 dark:text-surface-50">
                Certificate Verification
              </h1>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                OHCS E-Library Learning Platform
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-8 shadow-xl mb-8"
        >
          <div className="text-center mb-6">
            <Award className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
              Verify a Certificate
            </h2>
            <p className="text-surface-600 dark:text-surface-400">
              Enter the certificate ID or certificate number to verify its authenticity
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="Enter certificate ID or number..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={isLoading}
              className="px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Verify
            </button>
          </div>
        </motion.div>

        {/* Results */}
        {searched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-xl"
          >
            {isLoading ? (
              <div className="p-12 text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-surface-600 dark:text-surface-400">
                  Verifying certificate...
                </p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-2">
                  Verification Failed
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-6">
                  {error}
                </p>
                <p className="text-sm text-surface-500">
                  If you believe this is an error, please contact the OHCS E-Library support team.
                </p>
              </div>
            ) : certificate ? (
              <div>
                {/* Success Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-1">Certificate Verified</h3>
                  <p className="text-green-100">This certificate is authentic and valid</p>
                </div>

                {/* Certificate Details */}
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          Recipient Name
                        </p>
                        <p className="font-semibold text-surface-900 dark:text-surface-50">
                          {certificate.recipientName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                      </div>
                      <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          Course Completed
                        </p>
                        <p className="font-semibold text-surface-900 dark:text-surface-50">
                          {certificate.courseTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                      </div>
                      <div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          Completion Date
                        </p>
                        <p className="font-semibold text-surface-900 dark:text-surface-50">
                          {formatDate(certificate.completionDate)}
                        </p>
                      </div>
                    </div>

                    {certificate.gradeLabel && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-surface-500 dark:text-surface-400">
                            Grade Achieved
                          </p>
                          <p className="font-semibold text-surface-900 dark:text-surface-50">
                            {certificate.gradeLabel}
                            {certificate.grade && ` (${certificate.grade}%)`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-surface-500">Certificate Number: </span>
                        <span className="font-mono font-medium text-surface-900 dark:text-surface-50">
                          {certificate.certificateNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-surface-500">Issued: </span>
                        <span className="text-surface-900 dark:text-surface-50">
                          {formatDate(certificate.issuedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Info */}
        <div className="mt-8 text-center text-sm text-surface-500 dark:text-surface-400">
          <p>
            Certificates issued by the OHCS E-Library Learning Platform can be verified here.
          </p>
          <p className="mt-2">
            For questions about certificates, please contact{' '}
            <a href="mailto:support@ohcs.gov.gh" className="text-primary-600 hover:underline">
              support@ohcs.gov.gh
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
