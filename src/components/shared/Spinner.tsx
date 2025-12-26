import { cn } from '@/utils/cn';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  color?: 'primary' | 'secondary' | 'white' | 'current';
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colorStyles: Record<NonNullable<SpinnerProps['color']>, string> = {
  primary: 'text-primary-500',
  secondary: 'text-secondary-500',
  white: 'text-white',
  current: 'text-current',
};

export function Spinner({ size = 'md', className, color = 'primary' }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin', sizeStyles[size], colorStyles[color], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Full page loading spinner
interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm">
      <div className="text-center">
        <Spinner size="xl" />
        <p className="mt-4 text-surface-600 dark:text-surface-400 font-medium">{message}</p>
      </div>
    </div>
  );
}

// Inline loading indicator
interface InlineLoaderProps {
  text?: string;
  size?: SpinnerSize;
}

export function InlineLoader({ text = 'Loading...', size = 'sm' }: InlineLoaderProps) {
  return (
    <div className="flex items-center gap-2 text-surface-500">
      <Spinner size={size} color="current" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
