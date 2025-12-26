import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/utils/validators';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';

export default function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmittedEmail(data.email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full mb-6">
          <CheckCircle className="w-8 h-8 text-success-600 dark:text-success-400" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
          Check Your Email
        </h2>
        <p className="mt-4 text-surface-600 dark:text-surface-400">
          We've sent a password reset link to:
        </p>
        <p className="mt-2 font-medium text-surface-900 dark:text-surface-50">
          {submittedEmail}
        </p>
        <p className="mt-6 text-sm text-surface-500">
          Didn't receive the email? Check your spam folder or{' '}
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            try again
          </button>
        </p>
        <div className="mt-8">
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

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
          Forgot Password?
        </h2>
        <p className="mt-2 text-surface-600 dark:text-surface-400">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="yourname@agency.gov.gh"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" fullWidth isLoading={isSubmitting} size="lg">
          Send Reset Link
        </Button>
      </form>

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
