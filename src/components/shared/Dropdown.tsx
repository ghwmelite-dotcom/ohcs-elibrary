import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DropdownMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger?: ReactNode;
  children: ReactNode;
  items?: DropdownMenuItem[];
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export function Dropdown({ trigger, children, items, align = 'left', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignmentStyles = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  // If items prop is provided, render them; otherwise render children as menu content
  // If trigger prop is provided, use it; otherwise use children as trigger
  const triggerElement = trigger || children;
  const menuContent = items ? (
    items.map((item, index) => (
      <button
        key={index}
        onClick={() => {
          item.onClick?.();
          setIsOpen(false);
        }}
        disabled={item.disabled}
        className={cn(
          'flex items-center gap-2 w-full px-4 py-2 text-sm text-left transition-colors',
          item.danger
            ? 'text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20'
            : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700',
          item.disabled && 'opacity-50 cursor-not-allowed',
          item.className
        )}
      >
        {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
        <span className="flex-1">{item.label}</span>
      </button>
    ))
  ) : (
    trigger ? children : null
  );

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <div onClick={() => setIsOpen(!isOpen)}>{triggerElement}</div>
      <AnimatePresence>
        {isOpen && menuContent && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 min-w-[200px] bg-white dark:bg-surface-800 rounded-lg shadow-elevation-4 border border-surface-200 dark:border-surface-700 py-1 overflow-hidden',
              alignmentStyles[align]
            )}
          >
            {menuContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  selected?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  icon,
  disabled = false,
  danger = false,
  selected = false,
  className,
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 w-full px-4 py-2 text-sm text-left transition-colors',
        danger
          ? 'text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20'
          : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700',
        disabled && 'opacity-50 cursor-not-allowed',
        selected && 'bg-primary-50 dark:bg-primary-900/20',
        className
      )}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
      <span className="flex-1">{children}</span>
      {selected && <Check className="w-4 h-4 text-primary-500" />}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-surface-200 dark:border-surface-700" />;
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
      {children}
    </div>
  );
}

// Select dropdown component
interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  label,
  error,
  disabled = false,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          {label}
        </label>
      )}
      <div ref={selectRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border text-left transition-all',
            'bg-white dark:bg-surface-800',
            error
              ? 'border-error-500 focus:ring-error-500/20'
              : 'border-surface-300 dark:border-surface-600 focus:border-primary-500 focus:ring-primary-500/20',
            'focus:outline-none focus:ring-2',
            disabled && 'opacity-50 cursor-not-allowed bg-surface-100 dark:bg-surface-700'
          )}
        >
          <span
            className={cn(
              'flex items-center gap-2 truncate',
              !selectedOption && 'text-surface-400 dark:text-surface-500'
            )}
          >
            {selectedOption?.icon}
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 flex-shrink-0 text-surface-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-surface-800 rounded-lg shadow-elevation-4 border border-surface-200 dark:border-surface-700 py-1 max-h-60 overflow-auto"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 w-full px-4 py-2 text-sm text-left transition-colors',
                    option.value === value
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {option.icon}
                  <span className="flex-1">{option.label}</span>
                  {option.value === value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="mt-1.5 text-sm text-error-500">{error}</p>}
    </div>
  );
}
