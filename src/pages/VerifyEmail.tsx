import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { useToast } from '@/components/shared/Toast';
import { cn } from '@/utils/cn';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const email = location.state?.email || 'your email';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Invalid code', 'Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock: accept any code for demo
      toast.success('Email verified!', 'Your account is now active.');
      navigate('/login');
    } catch (error) {
      toast.error('Verification failed', 'The code is invalid or expired.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Code sent!', 'A new verification code has been sent to your email.');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error('Failed to resend', 'Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-full mb-6">
          <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
          Verify Your Email
        </h2>
        <p className="mt-2 text-surface-600 dark:text-surface-400">
          We've sent a 6-digit code to
        </p>
        <p className="font-medium text-surface-900 dark:text-surface-50">{email}</p>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-4 text-center">
          Enter verification code
        </label>
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={cn(
                'w-12 h-14 text-center text-xl font-bold rounded-lg border-2 bg-white dark:bg-surface-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                'transition-all duration-200',
                digit
                  ? 'border-primary-500 text-surface-900 dark:text-surface-50'
                  : 'border-surface-300 dark:border-surface-600 text-surface-400'
              )}
            />
          ))}
        </div>
      </div>

      <Button
        onClick={handleVerify}
        fullWidth
        isLoading={isVerifying}
        size="lg"
        disabled={otp.some((d) => !d)}
      >
        Verify Email
      </Button>

      <div className="mt-6 text-center">
        <p className="text-sm text-surface-600 dark:text-surface-400">
          Didn't receive the code?{' '}
          {resendCooldown > 0 ? (
            <span className="text-surface-500">
              Resend in {resendCooldown}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              {isResending ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : null}
              Resend code
            </button>
          )}
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
