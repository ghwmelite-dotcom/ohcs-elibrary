import { forwardRef, type InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: InputSize;
  showClearButton?: boolean;
  onClear?: () => void;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-4 text-base',
};

const iconSizeStyles: Record<InputSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-5 w-5',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      success,
      leftIcon,
      rightIcon,
      size = 'md',
      showClearButton,
      onClear,
      disabled,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const hasValue = value !== undefined && value !== '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            disabled={disabled}
            className={cn(
              'w-full rounded-lg border bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50',
              'placeholder:text-surface-400 dark:placeholder:text-surface-500',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:bg-surface-100 dark:disabled:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-60',
              sizeStyles[size],
              leftIcon && 'pl-10',
              (rightIcon || isPassword || showClearButton) && 'pr-10',
              error
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
                : success
                  ? 'border-success-500 focus:border-success-500 focus:ring-success-500/20'
                  : 'border-surface-300 dark:border-surface-600 focus:border-primary-500 focus:ring-primary-500/20',
              className
            )}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {showClearButton && hasValue && !disabled && (
              <button
                type="button"
                onClick={onClear}
                className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 p-0.5 rounded"
              >
                <X className={iconSizeStyles[size]} />
              </button>
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 p-0.5 rounded"
              >
                {showPassword ? (
                  <EyeOff className={iconSizeStyles[size]} />
                ) : (
                  <Eye className={iconSizeStyles[size]} />
                )}
              </button>
            )}
            {!isPassword && rightIcon && (
              <span className="text-surface-400">{rightIcon}</span>
            )}
            {error && !isPassword && (
              <AlertCircle className={cn(iconSizeStyles[size], 'text-error-500')} />
            )}
            {success && !error && !isPassword && (
              <Check className={cn(iconSizeStyles[size], 'text-success-500')} />
            )}
          </div>
        </div>
        {(error || hint) && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-error-500' : 'text-surface-500 dark:text-surface-400'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input variant
interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onClear, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="h-4 w-4" />}
        showClearButton
        onClear={onClear}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSearch) {
            onSearch((e.target as HTMLInputElement).value);
          }
        }}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
