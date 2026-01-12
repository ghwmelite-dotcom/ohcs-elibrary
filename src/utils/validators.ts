import { z } from 'zod';

// ============================================================================
// Password Breach Check (HaveIBeenPwned API)
// ============================================================================

/**
 * Checks if a password has been exposed in known data breaches using the
 * HaveIBeenPwned API with k-anonymity (only first 5 chars of SHA-1 hash sent)
 */
export async function checkPasswordBreach(password: string): Promise<{
  breached: boolean;
  count: number;
}> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Split hash: first 5 chars (prefix) and rest (suffix)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    // Query HIBP API with prefix only (k-anonymity)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Prevents response size analysis
      },
    });

    if (!response.ok) {
      // If API fails, don't block registration
      console.warn('HIBP API unavailable');
      return { breached: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split('\n');

    // Check if our suffix is in the results
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(countStr.trim(), 10) };
      }
    }

    return { breached: false, count: 0 };
  } catch (error) {
    console.error('Password breach check failed:', error);
    return { breached: false, count: 0 };
  }
}

/**
 * Debounced password breach check with caching
 */
const breachCache = new Map<string, { breached: boolean; count: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function checkPasswordBreachCached(password: string): Promise<{
  breached: boolean;
  count: number;
}> {
  // Create a hash of the password for cache key (don't store actual password)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const cacheKey = Array.from(new Uint8Array(hashBuffer)).slice(0, 8).join('');

  const cached = breachCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { breached: cached.breached, count: cached.count };
  }

  const result = await checkPasswordBreach(password);
  breachCache.set(cacheKey, { ...result, timestamp: Date.now() });

  // Clean old cache entries
  if (breachCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of breachCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        breachCache.delete(key);
      }
    }
  }

  return result;
}

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Validates that email ends with .gov.gh domain
 */
export const govGhEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .refine(
    (email) => email.toLowerCase().endsWith('.gov.gh'),
    'Email must be a .gov.gh government email address'
  );

export function isGovGhEmail(email: string): boolean {
  return email.toLowerCase().endsWith('.gov.gh');
}

// ============================================================================
// Password Validation
// ============================================================================

/**
 * Strong password requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const strongPasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  );

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  if (score <= 2) return { score, label: 'Weak', color: 'error' };
  if (score <= 4) return { score, label: 'Fair', color: 'warning' };
  if (score <= 5) return { score, label: 'Good', color: 'info' };
  return { score, label: 'Strong', color: 'success' };
}

// ============================================================================
// Staff ID Validation
// ============================================================================

export const staffIdSchema = z
  .string()
  .min(6, 'Staff ID must be at least 6 digits')
  .max(20, 'Staff ID must not exceed 20 digits')
  .regex(/^\d+$/, 'Staff ID must contain only numbers');

// ============================================================================
// OTP Validation
// ============================================================================

export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d+$/, 'OTP must contain only numbers');

// ============================================================================
// Name Validation
// ============================================================================

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// ============================================================================
// Auth Form Schemas
// ============================================================================

export const loginSchema = z.object({
  email: govGhEmailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const staffIdLoginSchema = z.object({
  staffId: staffIdSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    email: govGhEmailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    staffId: staffIdSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    mdaId: z.string().min(1, 'Please select your MDA'),
    department: z.string().optional(),
    title: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: govGhEmailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  otp: otpSchema,
});

// ============================================================================
// Profile Form Schemas
// ============================================================================

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  department: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  gradeLevel: z.string().max(50).optional(),
  skills: z.array(z.string()).max(10, 'Maximum 10 skills allowed').optional(),
  interests: z.array(z.string()).max(10, 'Maximum 10 interests allowed').optional(),
  socialLinks: z
    .object({
      linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
      twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
      website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    })
    .optional(),
});

// ============================================================================
// Document Form Schemas
// ============================================================================

export const documentUploadSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.enum([
    'circulars',
    'policies',
    'training',
    'reports',
    'forms',
    'legal',
    'research',
    'general',
  ]),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).min(1, 'Add at least one tag').max(10),
  accessLevel: z.enum(['public', 'internal', 'restricted', 'confidential', 'secret']),
  mdaId: z.string().uuid().optional(),
});

// ============================================================================
// Forum Form Schemas
// ============================================================================

export const topicSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  content: z.string().min(20, 'Content must be at least 20 characters').max(10000),
  categoryId: z.string().uuid('Please select a category'),
  tags: z.array(z.string()).max(5).optional(),
});

export const postSchema = z.object({
  content: z.string().min(5, 'Post must be at least 5 characters').max(10000),
});

// ============================================================================
// Chat Form Schemas
// ============================================================================

export const chatRoomSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50),
  description: z.string().max(500).optional(),
  type: z.enum(['public', 'private']),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
});

// ============================================================================
// Group Form Schemas
// ============================================================================

export const groupSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  type: z.enum(['open', 'closed', 'private']),
  tags: z.array(z.string()).max(5).optional(),
  rules: z.string().max(2000).optional(),
});

export const groupPostSchema = z.object({
  content: z.string().min(5, 'Post must be at least 5 characters').max(5000),
});

// ============================================================================
// Search Schema
// ============================================================================

export const searchSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').max(100),
  types: z
    .array(z.enum(['document', 'topic', 'post', 'user', 'group', 'news']))
    .optional(),
});

// ============================================================================
// Type exports
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type StaffIdLoginFormData = z.infer<typeof staffIdLoginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;
export type TopicFormData = z.infer<typeof topicSchema>;
export type PostFormData = z.infer<typeof postSchema>;
export type ChatRoomFormData = z.infer<typeof chatRoomSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type GroupFormData = z.infer<typeof groupSchema>;
export type GroupPostFormData = z.infer<typeof groupPostSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
