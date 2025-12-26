import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Link as LinkIcon,
  FileText,
  Save,
  X,
  Camera,
  Loader2
} from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  title: z.string().optional(),
  mda: z.string().optional(),
  gradeLevel: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditProps {
  initialData: {
    name: string;
    email: string;
    avatar?: string;
    title?: string;
    mda?: string;
    gradeLevel?: string;
    location?: string;
    phone?: string;
    bio?: string;
    website?: string;
  };
  onSave: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
  onAvatarChange?: (file: File) => Promise<void>;
}

export function ProfileEdit({
  initialData,
  onSave,
  onCancel,
  onAvatarChange,
}: ProfileEditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(initialData.avatar);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      title: initialData.title || '',
      mda: initialData.mda || '',
      gradeLevel: initialData.gradeLevel || '',
      location: initialData.location || '',
      phone: initialData.phone || '',
      bio: initialData.bio || '',
      website: initialData.website || '',
    },
  });

  const bio = watch('bio');
  const bioLength = bio?.length || 0;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    if (onAvatarChange) {
      await onAvatarChange(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mdaOptions = [
    'Office of the Head of Civil Service',
    'Public Services Commission',
    'Ministry of Finance',
    'Ministry of Health',
    'Ministry of Education',
    'Ministry of Foreign Affairs',
    'Ministry of Justice',
    'Ministry of Communications',
    'Ministry of Trade',
    'Ministry of Local Government',
    'Other',
  ];

  const gradeLevelOptions = [
    'Chief Director',
    'Director',
    'Deputy Director',
    'Assistant Director',
    'Principal',
    'Senior',
    'Officer',
    'Assistant',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
          Profile Photo
        </h3>

        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar
              src={avatarPreview}
              name={initialData.name}
              size="xl"
              className="w-24 h-24"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="sr-only"
              />
            </label>
          </div>

          <div>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Upload a new photo. Recommended size: 200x200px.
            </p>
            <p className="text-xs text-surface-500 mt-1">
              JPG, PNG or GIF. Max 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                {...register('name')}
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-700 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.name
                    ? 'border-error-500'
                    : 'border-surface-200 dark:border-surface-600'
                )}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-error-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="email"
                value={initialData.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-lg text-surface-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Job Title
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Senior Administrative Officer"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="tel"
                {...register('phone')}
                placeholder="+233 XX XXX XXXX"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* MDA */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Ministry/Department/Agency
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <select
                {...register('mda')}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">Select MDA</option>
                {mdaOptions.map((mda) => (
                  <option key={mda} value={mda}>
                    {mda}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grade Level */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Grade Level
            </label>
            <select
              {...register('gradeLevel')}
              className="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              <option value="">Select Grade</option>
              {gradeLevelOptions.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                {...register('location')}
                placeholder="e.g. Accra, Ghana"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Website
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="url"
                {...register('website')}
                placeholder="https://..."
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-700 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.website
                    ? 'border-error-500'
                    : 'border-surface-200 dark:border-surface-600'
                )}
              />
            </div>
            {errors.website && (
              <p className="text-sm text-error-500 mt-1">{errors.website.message}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Bio
          </label>
          <textarea
            {...register('bio')}
            rows={4}
            placeholder="Tell us about yourself..."
            className={cn(
              'w-full px-4 py-3 bg-white dark:bg-surface-700 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none',
              errors.bio
                ? 'border-error-500'
                : 'border-surface-200 dark:border-surface-600'
            )}
          />
          <div className="flex justify-between mt-1">
            {errors.bio ? (
              <p className="text-sm text-error-500">{errors.bio.message}</p>
            ) : (
              <span />
            )}
            <span className={cn(
              'text-xs',
              bioLength > 450 ? 'text-warning-500' : 'text-surface-400'
            )}>
              {bioLength}/500
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>
    </form>
  );
}
