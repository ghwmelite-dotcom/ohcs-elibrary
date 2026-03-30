import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, RefreshCw, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { pendingVerification, verifyEmail, resendVerification, clearPendingVerification, isAuthenticated } = useAuthStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = pendingVerification.email || '';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed');
    } else if (!pendingVerification.email) {
      navigate('/');
    }
  }, [isAuthenticated, pendingVerification.email, navigate]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (value && index === 5 && newOtp.every((d) => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code?: string) => {
    const verificationCode = code || otp.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (!email) return;

    setIsVerifying(true);
    setError('');

    try {
      await verifyEmail(email, verificationCode);
      setIsSuccess(true);
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/feed');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;

    setIsResending(true);
    try {
      await resendVerification(email);
      setResendCooldown(60);
      setError('');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      // Ignore errors for security
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    clearPendingVerification();
    navigate('/');
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-green-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white text-center relative">
            <button
              onClick={handleBack}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring' }}
                  >
                    <CheckCircle2 className="w-8 h-8" />
                  </motion.div>
                ) : (
                  <motion.div key="mail">
                    <Mail className="w-8 h-8" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <h1 className="text-xl font-bold">
              {isSuccess ? 'Email Verified!' : 'Verify Your Email'}
            </h1>
            <p className="text-sm text-white/80 mt-1">
              {isSuccess ? 'Welcome to OHCS E-Library' : 'Enter the 6-digit code we sent you'}
            </p>
          </div>

          {/* Ghana flag stripe */}
          <div className="h-1 bg-gradient-to-r from-[#CE1126] via-[#FCD116] to-[#006B3F]" />

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success-content"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                    className="relative inline-block"
                  >
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="w-6 h-6 text-yellow-500" />
                    </motion.div>
                  </motion.div>

                  <h2 className="text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">
                    You're All Set!
                  </h2>
                  <p className="text-surface-600 dark:text-surface-400 mb-4">
                    Your email has been verified. Redirecting to your dashboard...
                  </p>

                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Redirecting...</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="verify-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Email display */}
                  <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4 mb-6 text-center">
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      We sent a code to
                    </p>
                    <p className="font-medium text-surface-800 dark:text-surface-100">
                      {email}
                    </p>
                  </div>

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-700 dark:text-red-400"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </motion.div>
                  )}

                  {/* OTP input */}
                  <div className="flex justify-center gap-2 mb-6">
                    {otp.map((digit, index) => (
                      <motion.input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={isVerifying}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all
                          ${digit ? 'border-green-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700'}
                          focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none
                          disabled:opacity-50 disabled:cursor-not-allowed
                          text-surface-900 dark:text-surface-100
                        `}
                      />
                    ))}
                  </div>

                  {/* Verify button */}
                  <button
                    onClick={() => handleVerify()}
                    disabled={isVerifying || otp.some((d) => d === '')}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Verify Email
                      </>
                    )}
                  </button>

                  {/* Resend code */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || isResending}
                      className={`inline-flex items-center gap-2 text-sm font-medium transition-colors
                        ${resendCooldown > 0 ? 'text-surface-400 dark:text-surface-500 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}
                      `}
                    >
                      <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>

                  {/* Tips */}
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Don't see the email?</strong> Check your spam/junk folder. Government email servers may filter external messages.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
          © {new Date().getFullYear()} OHCS E-Library. Office of the Head of Civil Service, Ghana.
        </p>
      </motion.div>
    </div>
  );
}
