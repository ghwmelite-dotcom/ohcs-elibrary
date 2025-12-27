import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, AlertCircle, BadgeCheck, Shield, ArrowLeft } from 'lucide-react';
import {
  loginSchema,
  staffIdLoginSchema,
  type LoginFormData,
  type StaffIdLoginFormData
} from '@/utils/validators';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/shared/Toast';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { cn } from '@/utils/cn';

type LoginMode = 'email' | 'staffId';

export function LoginForm() {
  const navigate = useNavigate();
  const { login, verify2FA, cancel2FA, twoFA } = useAuthStore();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [twoFACode, setTwoFACode] = useState(['', '', '', '', '', '']);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email login form
  const emailForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Staff ID login form
  const staffIdForm = useForm<StaffIdLoginFormData>({
    resolver: zodResolver(staffIdLoginSchema),
    defaultValues: {
      staffId: '',
      password: '',
      rememberMe: false,
    },
  });

  const currentForm = loginMode === 'email' ? emailForm : staffIdForm;
  const { formState: { errors, isSubmitting } } = currentForm;

  // Focus first 2FA input when 2FA is required
  useEffect(() => {
    if (twoFA.requires2FA && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [twoFA.requires2FA]);

  const onEmailSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      const result = await login(data);
      if (result.requires2FA) {
        // 2FA is required, the store will update and show 2FA input
        return;
      }
      toast.success('Welcome back!', 'You have successfully signed in.');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      setServerError(message);
      toast.error('Sign in failed', message);
    }
  };

  const onStaffIdSubmit = async (data: StaffIdLoginFormData) => {
    try {
      setServerError(null);
      // Convert staffId login to email login format for the store
      // In a real app, this would be a separate API endpoint
      const result = await login({
        email: `staff-${data.staffId}@internal.gov.gh`,
        password: data.password,
        rememberMe: data.rememberMe
      });
      if (result.requires2FA) {
        return;
      }
      toast.success('Welcome back!', 'You have successfully signed in.');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      setServerError(message);
      toast.error('Sign in failed', message);
    }
  };

  const handle2FACodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...twoFACode];
    newCode[index] = value.slice(-1); // Only take the last digit
    setTwoFACode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handle2FASubmit(newCode.join(''));
    }
  };

  const handle2FAKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !twoFACode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handle2FASubmit = async (code?: string) => {
    const verificationCode = code || twoFACode.join('');
    if (verificationCode.length !== 6) {
      setServerError('Please enter all 6 digits');
      return;
    }

    try {
      setIsVerifying2FA(true);
      setServerError(null);
      await verify2FA(verificationCode);
      toast.success('Welcome back!', 'You have successfully signed in.');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : '2FA verification failed';
      setServerError(message);
      toast.error('Verification failed', message);
      setTwoFACode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleCancel2FA = () => {
    cancel2FA();
    setTwoFACode(['', '', '', '', '', '']);
    setServerError(null);
  };

  const handleModeChange = (mode: LoginMode) => {
    setLoginMode(mode);
    setServerError(null);
    emailForm.reset();
    staffIdForm.reset();
  };

  // Show 2FA verification screen
  if (twoFA.requires2FA) {
    return (
      <div>
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Enter the 6-digit code from your authenticator app
          </p>
          {twoFA.email && (
            <p className="mt-1 text-sm text-surface-500">
              Signing in as {twoFA.email}
            </p>
          )}
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-error-800 dark:text-error-200">
                Verification failed
              </p>
              <p className="text-sm text-error-600 dark:text-error-300">{serverError}</p>
            </div>
          </div>
        )}

        {/* 6-digit code input */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={twoFACode[index]}
              onChange={(e) => handle2FACodeChange(index, e.target.value)}
              onKeyDown={(e) => handle2FAKeyDown(index, e)}
              disabled={isVerifying2FA}
              className={cn(
                'w-12 h-14 text-center text-2xl font-mono font-bold rounded-lg border-2 transition-all duration-200',
                'bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-50',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                twoFACode[index]
                  ? 'border-primary-500'
                  : 'border-surface-300 dark:border-surface-600',
                isVerifying2FA && 'opacity-50 cursor-not-allowed'
              )}
            />
          ))}
        </div>

        <Button
          type="button"
          fullWidth
          isLoading={isVerifying2FA}
          size="lg"
          onClick={() => handle2FASubmit()}
          disabled={twoFACode.join('').length !== 6}
        >
          Verify
        </Button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleCancel2FA}
            className="inline-flex items-center gap-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-surface-500">
          Lost access to your authenticator?{' '}
          <Link to="/forgot-password" className="text-primary-600 hover:underline">
            Use a backup code
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
          Welcome Back
        </h2>
        <p className="mt-2 text-surface-600 dark:text-surface-400">
          Sign in to your OHCS E-Library account
        </p>
      </div>

      {/* Login Mode Tabs */}
      <div className="flex mb-6 bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
        <button
          type="button"
          onClick={() => handleModeChange('email')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
            loginMode === 'email'
              ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
          )}
        >
          <Mail className="w-4 h-4" />
          Email
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('staffId')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
            loginMode === 'staffId'
              ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
          )}
        >
          <BadgeCheck className="w-4 h-4" />
          Staff ID
        </button>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-error-800 dark:text-error-200">
              Sign in failed
            </p>
            <p className="text-sm text-error-600 dark:text-error-300">{serverError}</p>
          </div>
        </div>
      )}

      {/* Email Login Form */}
      {loginMode === 'email' && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="yourname@agency.gov.gh"
            leftIcon={<Mail className="w-5 h-5" />}
            error={emailForm.formState.errors.email?.message}
            {...emailForm.register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            leftIcon={<Lock className="w-5 h-5" />}
            error={emailForm.formState.errors.password?.message}
            {...emailForm.register('password')}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                {...emailForm.register('rememberMe')}
              />
              <span className="text-sm text-surface-600 dark:text-surface-400">
                Remember me
              </span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth isLoading={emailForm.formState.isSubmitting} size="lg">
            Sign In
          </Button>
        </form>
      )}

      {/* Staff ID Login Form */}
      {loginMode === 'staffId' && (
        <form onSubmit={staffIdForm.handleSubmit(onStaffIdSubmit)} className="space-y-5">
          <Input
            label="Staff ID"
            type="text"
            placeholder="e.g. 123456"
            leftIcon={<BadgeCheck className="w-5 h-5" />}
            error={staffIdForm.formState.errors.staffId?.message}
            {...staffIdForm.register('staffId')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            leftIcon={<Lock className="w-5 h-5" />}
            error={staffIdForm.formState.errors.password?.message}
            {...staffIdForm.register('password')}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                {...staffIdForm.register('rememberMe')}
              />
              <span className="text-sm text-surface-600 dark:text-surface-400">
                Remember me
              </span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth isLoading={staffIdForm.formState.isSubmitting} size="lg">
            Sign In
          </Button>
        </form>
      )}

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-200 dark:border-surface-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-surface-900 text-surface-500">
              New to OHCS E-Library?
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Create an account
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-surface-500">
        By signing in, you agree to the OHCS{' '}
        <a href="#" className="text-primary-600 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-primary-600 hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
