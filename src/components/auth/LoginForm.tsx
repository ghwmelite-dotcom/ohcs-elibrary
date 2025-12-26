import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, AlertCircle, BadgeCheck } from 'lucide-react';
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
  const { login } = useAuthStore();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>('email');

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

  const onEmailSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      await login(data);
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
      await login({
        email: `staff-${data.staffId}@internal.gov.gh`,
        password: data.password,
        rememberMe: data.rememberMe
      });
      toast.success('Welcome back!', 'You have successfully signed in.');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      setServerError(message);
      toast.error('Sign in failed', message);
    }
  };

  const handleModeChange = (mode: LoginMode) => {
    setLoginMode(mode);
    setServerError(null);
    emailForm.reset();
    staffIdForm.reset();
  };

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
