import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Store, User, Mail, Phone, Building2, CreditCard, Smartphone,
  FileText, BookOpen, AlertCircle, CheckCircle2, Loader2, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';
import { useSellerStore } from '@/stores/shopStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/shared/Toast';
import type { SellerApplicationFormData, BusinessType, MobileMoneyProvider, PayoutMethod } from '@/types/shop';

// Validation schema
const applicationSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters').max(100),
  storeDescription: z.string().min(50, 'Description must be at least 50 characters').max(2000),
  businessType: z.enum(['individual', 'organization', 'mda']),
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  staffId: z.string().optional(),
  mdaId: z.string().optional(),
  department: z.string().optional(),
  governmentIdType: z.enum(['national_id', 'passport', 'voter_id', 'staff_id']).optional(),
  governmentIdNumber: z.string().optional(),
  isAuthor: z.boolean(),
  authorBio: z.string().max(1000).optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  mobileMoneyProvider: z.enum(['MTN', 'Vodafone', 'AirtelTigo']).optional(),
  mobileMoneyNumber: z.string().optional(),
  preferredPayoutMethod: z.enum(['mobile_money', 'bank_transfer']),
}).refine(
  (data) => {
    if (data.preferredPayoutMethod === 'mobile_money') {
      return data.mobileMoneyProvider && data.mobileMoneyNumber;
    }
    if (data.preferredPayoutMethod === 'bank_transfer') {
      return data.bankName && data.bankAccountNumber && data.bankAccountName;
    }
    return true;
  },
  { message: 'Please complete payment details for your selected payout method' }
);

type FormData = z.infer<typeof applicationSchema>;

const businessTypeOptions = [
  { value: 'individual', label: 'Individual Author/Seller' },
  { value: 'organization', label: 'Organization/Publisher' },
  { value: 'mda', label: 'Government MDA' },
];

const idTypeOptions = [
  { value: 'national_id', label: 'Ghana Card (National ID)' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'staff_id', label: 'Government Staff ID' },
];

const mobileMoneyOptions = [
  { value: 'MTN', label: 'MTN Mobile Money' },
  { value: 'Vodafone', label: 'Vodafone Cash' },
  { value: 'AirtelTigo', label: 'AirtelTigo Money' },
];

const bankOptions = [
  { value: 'GCB Bank', label: 'GCB Bank' },
  { value: 'Ecobank Ghana', label: 'Ecobank Ghana' },
  { value: 'Stanbic Bank', label: 'Stanbic Bank' },
  { value: 'Standard Chartered', label: 'Standard Chartered' },
  { value: 'Fidelity Bank', label: 'Fidelity Bank' },
  { value: 'Absa Bank', label: 'Absa Bank Ghana' },
  { value: 'Access Bank', label: 'Access Bank' },
  { value: 'CalBank', label: 'CalBank' },
  { value: 'Zenith Bank', label: 'Zenith Bank' },
  { value: 'UBA Ghana', label: 'UBA Ghana' },
];

const STEPS = [
  { id: 1, title: 'Store Info', icon: Store },
  { id: 2, title: 'Personal Info', icon: User },
  { id: 3, title: 'Author Details', icon: BookOpen },
  { id: 4, title: 'Payment', icon: CreditCard },
];

interface SellerApplicationFormProps {
  onSuccess?: () => void;
}

export function SellerApplicationForm({ onSuccess }: SellerApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuthStore();
  const { submitApplication, isLoadingApplication } = useSellerStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      storeName: '',
      storeDescription: '',
      businessType: 'individual',
      fullName: user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      email: user?.email || '',
      phone: '',
      staffId: '',
      mdaId: '',
      department: user?.department || '',
      isAuthor: true,
      authorBio: '',
      preferredPayoutMethod: 'mobile_money',
    },
  });

  const businessType = watch('businessType');
  const isAuthor = watch('isAuthor');
  const payoutMethod = watch('preferredPayoutMethod');

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['storeName', 'storeDescription', 'businessType'];
        break;
      case 2:
        fieldsToValidate = ['fullName', 'email'];
        break;
      case 3:
        fieldsToValidate = ['isAuthor'];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: FormData) => {
    try {
      await submitApplication(data as SellerApplicationFormData);
      toast.success('Application Submitted!', 'We will review your application and get back to you soon.');
      onSuccess?.();
    } catch (error) {
      toast.error('Submission Failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  currentStep >= step.id
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-surface-300 text-surface-400'
                )}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  'ml-2 text-sm font-medium hidden sm:block',
                  currentStep >= step.id ? 'text-primary-600' : 'text-surface-400'
                )}
              >
                {step.title}
              </span>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-12 sm:w-20 h-0.5 mx-2',
                    currentStep > step.id ? 'bg-primary-600' : 'bg-surface-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Store Information */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                Tell us about your store
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                This information will be displayed on your seller profile
              </p>
            </div>

            <Input
              label="Store Name"
              placeholder="e.g., Dr. Mensah's Publications"
              leftIcon={<Store className="w-5 h-5" />}
              error={errors.storeName?.message}
              {...register('storeName')}
            />

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Store Description
              </label>
              <textarea
                className={cn(
                  'w-full rounded-lg border bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50',
                  'placeholder:text-surface-400 dark:placeholder:text-surface-500',
                  'transition-all duration-200 p-3 min-h-[120px]',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  errors.storeDescription
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
                    : 'border-surface-300 dark:border-surface-600 focus:border-primary-500 focus:ring-primary-500/20'
                )}
                placeholder="Describe what you'll be selling, your expertise, and why customers should buy from you..."
                {...register('storeDescription')}
              />
              {errors.storeDescription && (
                <p className="mt-1.5 text-sm text-error-500">{errors.storeDescription.message}</p>
              )}
              <p className="mt-1 text-xs text-surface-500">Minimum 50 characters</p>
            </div>

            <Select
              label="Business Type"
              options={businessTypeOptions}
              value={businessType}
              onChange={(value) => setValue('businessType', value as BusinessType)}
              error={errors.businessType?.message}
            />
          </div>
        )}

        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                Your Information
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                We need this for verification and communication
              </p>
            </div>

            <Input
              label="Full Name"
              placeholder="Your full legal name"
              leftIcon={<User className="w-5 h-5" />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.gov.gh"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number (Optional)"
              placeholder="0XX XXX XXXX"
              leftIcon={<Phone className="w-5 h-5" />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Staff ID (Optional)"
                placeholder="Your government staff ID"
                error={errors.staffId?.message}
                {...register('staffId')}
              />
              <Input
                label="Department"
                placeholder="e.g., Finance"
                leftIcon={<Building2 className="w-5 h-5" />}
                error={errors.department?.message}
                {...register('department')}
              />
            </div>

            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
                    Identity Verification
                  </p>
                  <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                    Government employees with Staff ID get faster verification. You may be asked to provide
                    additional documents during the review process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Author Details */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                Are you an author?
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                Authors get a special verification badge on their profile
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setValue('isAuthor', true)}
                className={cn(
                  'flex-1 p-4 rounded-lg border-2 transition-all',
                  isAuthor
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                )}
              >
                <BookOpen className={cn('w-8 h-8 mx-auto mb-2', isAuthor ? 'text-primary-600' : 'text-surface-400')} />
                <p className={cn('font-medium', isAuthor ? 'text-primary-700 dark:text-primary-300' : 'text-surface-600')}>
                  Yes, I'm an author
                </p>
                <p className="text-xs text-surface-500 mt-1">
                  I have written or co-written books/publications
                </p>
              </button>

              <button
                type="button"
                onClick={() => setValue('isAuthor', false)}
                className={cn(
                  'flex-1 p-4 rounded-lg border-2 transition-all',
                  !isAuthor
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                )}
              >
                <Store className={cn('w-8 h-8 mx-auto mb-2', !isAuthor ? 'text-primary-600' : 'text-surface-400')} />
                <p className={cn('font-medium', !isAuthor ? 'text-primary-700 dark:text-primary-300' : 'text-surface-600')}>
                  No, I'm a reseller
                </p>
                <p className="text-xs text-surface-500 mt-1">
                  I'll be selling other products or materials
                </p>
              </button>
            </div>

            {isAuthor && (
              <div className="space-y-4 mt-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Author Bio
                  </label>
                  <textarea
                    className={cn(
                      'w-full rounded-lg border bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50',
                      'placeholder:text-surface-400 p-3 min-h-[100px]',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      'border-surface-300 dark:border-surface-600'
                    )}
                    placeholder="Tell us about your writing experience, expertise, and notable publications..."
                    {...register('authorBio')}
                  />
                </div>

                <div className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                  <CheckCircle2 className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>Verified authors receive a special badge on their store and products</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Payment Information */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
                Payment Setup
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                How would you like to receive your earnings?
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setValue('preferredPayoutMethod', 'mobile_money')}
                className={cn(
                  'flex-1 p-4 rounded-lg border-2 transition-all',
                  payoutMethod === 'mobile_money'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                )}
              >
                <Smartphone className={cn('w-8 h-8 mx-auto mb-2', payoutMethod === 'mobile_money' ? 'text-primary-600' : 'text-surface-400')} />
                <p className={cn('font-medium', payoutMethod === 'mobile_money' ? 'text-primary-700 dark:text-primary-300' : 'text-surface-600')}>
                  Mobile Money
                </p>
                <p className="text-xs text-surface-500 mt-1">Instant payouts</p>
              </button>

              <button
                type="button"
                onClick={() => setValue('preferredPayoutMethod', 'bank_transfer')}
                className={cn(
                  'flex-1 p-4 rounded-lg border-2 transition-all',
                  payoutMethod === 'bank_transfer'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                )}
              >
                <Building2 className={cn('w-8 h-8 mx-auto mb-2', payoutMethod === 'bank_transfer' ? 'text-primary-600' : 'text-surface-400')} />
                <p className={cn('font-medium', payoutMethod === 'bank_transfer' ? 'text-primary-700 dark:text-primary-300' : 'text-surface-600')}>
                  Bank Transfer
                </p>
                <p className="text-xs text-surface-500 mt-1">1-3 business days</p>
              </button>
            </div>

            {payoutMethod === 'mobile_money' && (
              <div className="space-y-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <Select
                  label="Mobile Money Provider"
                  options={mobileMoneyOptions}
                  value={watch('mobileMoneyProvider') || ''}
                  onChange={(value) => setValue('mobileMoneyProvider', value as MobileMoneyProvider)}
                  placeholder="Select provider"
                />
                <Input
                  label="Mobile Money Number"
                  placeholder="0XX XXX XXXX"
                  leftIcon={<Smartphone className="w-5 h-5" />}
                  {...register('mobileMoneyNumber')}
                />
              </div>
            )}

            {payoutMethod === 'bank_transfer' && (
              <div className="space-y-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <Select
                  label="Bank Name"
                  options={bankOptions}
                  value={watch('bankName') || ''}
                  onChange={(value) => setValue('bankName', value)}
                  placeholder="Select bank"
                />
                <Input
                  label="Account Number"
                  placeholder="Your bank account number"
                  {...register('bankAccountNumber')}
                />
                <Input
                  label="Account Name"
                  placeholder="Name on the account"
                  {...register('bankAccountName')}
                />
              </div>
            )}

            <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                    Review Process
                  </p>
                  <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
                    Your application will be reviewed by our team within 2-5 business days.
                    You'll receive an email notification once a decision is made.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-surface-200 dark:border-surface-700">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" isLoading={isLoadingApplication}>
              Submit Application
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
