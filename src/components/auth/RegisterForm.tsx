import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, BadgeCheck, Building2, Briefcase, AlertCircle, Check, Loader2, ShieldAlert, ShieldCheck, XCircle, CheckCircle2 } from 'lucide-react';
import { registerSchema, type RegisterFormData, getPasswordStrength } from '@/utils/validators';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/shared/Toast';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { useRegistrationValidation } from '@/hooks/useAuthValidation';

// Turnstile site key - set in environment variables
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

// Mock MDAs for selection
const mdaOptions = [
  { value: '1', label: 'Ministry of Finance' },
  { value: '2', label: 'Ministry of Health' },
  { value: '3', label: 'Ministry of Education' },
  { value: '4', label: 'Ministry of Interior' },
  { value: '5', label: 'Ministry of Foreign Affairs' },
  { value: '6', label: 'Ministry of Trade and Industry' },
  { value: '7', label: 'Ghana Revenue Authority' },
  { value: '8', label: 'Office of the Head of Civil Service' },
  { value: '9', label: 'Public Services Commission' },
  { value: '10', label: 'Electoral Commission' },
];

export function RegisterForm() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [emailValue, setEmailValue] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      staffId: '',
      firstName: '',
      lastName: '',
      mdaId: '',
      department: '',
      title: '',
    },
  });

  const selectedMda = watch('mdaId');
  const passwordStrength = getPasswordStrength(passwordValue);

  // Real-time validation hooks
  const validation = useRegistrationValidation(
    emailValue,
    passwordValue,
    TURNSTILE_SITE_KEY
  );

  // Check if form has blocking validation issues
  const hasEmailIssue = validation.email.isAvailable === false || validation.email.isGovEmail === false;
  const hasBreachedPassword = validation.password.isBreached === true;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);

      // Check for blocking validation issues
      if (hasEmailIssue) {
        setServerError('Please use a valid, available .gov.gh email address');
        return;
      }

      if (hasBreachedPassword) {
        setServerError('This password has been exposed in data breaches. Please choose a different password.');
        return;
      }

      // Check Turnstile if configured
      if (TURNSTILE_SITE_KEY && !validation.turnstile.token) {
        setServerError('Please complete the security verification');
        return;
      }

      const result = await registerUser({
        ...data,
        turnstileToken: validation.turnstile.token || undefined,
      });

      if (result.requiresVerification) {
        toast.success(
          'Registration successful!',
          'Please check your email for a verification code.'
        );
        navigate('/verify-email');
      } else {
        // Auto-logged in, go to dashboard
        toast.success('Welcome!', 'Your account has been created.');
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setServerError(message);
      toast.error('Registration failed', message);
    }
  };

  const passwordRequirements = [
    { met: passwordValue.length >= 12, text: 'At least 12 characters' },
    { met: /[A-Z]/.test(passwordValue), text: 'One uppercase letter' },
    { met: /[a-z]/.test(passwordValue), text: 'One lowercase letter' },
    { met: /[0-9]/.test(passwordValue), text: 'One number' },
    { met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordValue), text: 'One special character' },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
          Create Account
        </h2>
        <p className="mt-2 text-surface-600 dark:text-surface-400">
          Join the OHCS E-Library platform
        </p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-error-800 dark:text-error-200">
              Registration failed
            </p>
            <p className="text-sm text-error-600 dark:text-error-300">{serverError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="John"
            leftIcon={<User className="w-5 h-5" />}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <div>
          <Input
            label="Email Address"
            type="email"
            placeholder="yourname@agency.gov.gh"
            leftIcon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            hint="Must be a .gov.gh email address"
            success={validation.email.isAvailable === true && validation.email.isGovEmail === true}
            {...register('email', {
              onChange: (e) => setEmailValue(e.target.value),
            })}
          />
          {/* Real-time email validation feedback */}
          {emailValue.length > 5 && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              {validation.email.isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
                  <span className="text-surface-500">Checking availability...</span>
                </>
              ) : validation.email.isAvailable === false ? (
                <>
                  <XCircle className="w-4 h-4 text-error-500" />
                  <span className="text-error-500">This email is already registered</span>
                </>
              ) : validation.email.isGovEmail === false ? (
                <>
                  <AlertCircle className="w-4 h-4 text-warning-500" />
                  <span className="text-warning-500">Only .gov.gh emails are allowed</span>
                </>
              ) : validation.email.isAvailable === true ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  <span className="text-success-500">Email is available</span>
                </>
              ) : null}
            </div>
          )}
        </div>

        <Input
          label="Staff ID"
          placeholder="e.g. 123456"
          leftIcon={<BadgeCheck className="w-5 h-5" />}
          error={errors.staffId?.message}
          {...register('staffId')}
        />

        <Select
          label="Ministry / Department / Agency"
          options={mdaOptions}
          value={selectedMda}
          onChange={(value) => setValue('mdaId', value)}
          placeholder="Select your MDA"
          error={errors.mdaId?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Directorate/Unit"
            placeholder="e.g. IT Directorate"
            leftIcon={<Building2 className="w-5 h-5" />}
            error={errors.department?.message}
            {...register('department')}
          />
          <Input
            label="Job Title"
            placeholder="e.g. Senior Officer"
            leftIcon={<Briefcase className="w-5 h-5" />}
            error={errors.title?.message}
            {...register('title')}
          />
        </div>

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Create a strong password"
            leftIcon={<Lock className="w-5 h-5" />}
            error={errors.password?.message}
            {...register('password', {
              onChange: (e) => setPasswordValue(e.target.value),
            })}
          />

          {/* Password strength indicator */}
          {passwordValue && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      passwordStrength.color === 'error' && 'bg-error-500 w-1/4',
                      passwordStrength.color === 'warning' && 'bg-warning-500 w-2/4',
                      passwordStrength.color === 'info' && 'bg-info-500 w-3/4',
                      passwordStrength.color === 'success' && 'bg-success-500 w-full'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    passwordStrength.color === 'error' && 'text-error-500',
                    passwordStrength.color === 'warning' && 'text-warning-500',
                    passwordStrength.color === 'info' && 'text-info-500',
                    passwordStrength.color === 'success' && 'text-success-500'
                  )}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <ul className="grid grid-cols-2 gap-1">
                {passwordRequirements.map((req, index) => (
                  <li
                    key={index}
                    className={cn(
                      'flex items-center gap-1.5 text-xs',
                      req.met
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-surface-500'
                    )}
                  >
                    <Check className={cn('w-3 h-3', !req.met && 'opacity-30')} />
                    {req.text}
                  </li>
                ))}
              </ul>

              {/* Password breach check */}
              <div className="mt-3 flex items-center gap-2">
                {validation.password.isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
                    <span className="text-xs text-surface-500">Checking password security...</span>
                  </>
                ) : validation.password.isBreached ? (
                  <div className="flex items-start gap-2 p-2 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg w-full">
                    <ShieldAlert className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-error-700 dark:text-error-300">
                        Password found in {validation.password.breachCount?.toLocaleString()} data breaches
                      </p>
                      <p className="text-xs text-error-600 dark:text-error-400">
                        Please choose a different password for your security.
                      </p>
                    </div>
                  </div>
                ) : passwordValue.length >= 12 && validation.password.isBreached === false ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-success-500" />
                    <span className="text-xs text-success-600 dark:text-success-400">
                      Password not found in known breaches
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {/* Cloudflare Turnstile CAPTCHA */}
        {TURNSTILE_SITE_KEY && (
          <div className="flex flex-col items-center gap-2">
            <div id="turnstile-container" className="flex justify-center" />
            {!validation.turnstile.isReady && (
              <div className="flex items-center gap-2 text-sm text-surface-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading security verification...</span>
              </div>
            )}
            {validation.turnstile.token && (
              <div className="flex items-center gap-2 text-sm text-success-600">
                <ShieldCheck className="w-4 h-4" />
                <span>Verification complete</span>
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting || validation.isValidating}
          disabled={hasEmailIssue || hasBreachedPassword || (TURNSTILE_SITE_KEY && !validation.turnstile.token)}
          size="lg"
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-6 text-center text-xs text-surface-500">
        By creating an account, you agree to the OHCS{' '}
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
