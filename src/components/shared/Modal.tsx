import { Fragment, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: ReactNode;
  className?: string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-[95vw] max-h-[95vh]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  className,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Modal - Bottom sheet on mobile, centered on desktop */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'relative w-full bg-white dark:bg-surface-800 shadow-2xl overflow-hidden flex flex-col',
                'rounded-t-3xl sm:rounded-2xl',
                'max-h-[90vh] sm:max-h-[85vh]',
                'sm:mx-4',
                sizeStyles[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile drag indicator */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-600" />
              </div>

              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-surface-200 dark:border-surface-700 shrink-0">
                  <div className="min-w-0 flex-1">
                    {title && (
                      <h2 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-surface-50">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-surface-500 dark:text-surface-400">
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 -mr-1 sm:-mr-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-surface-200 dark:active:bg-surface-600 transition-colors touch-manipulation shrink-0"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content - Scrollable */}
              <div className="px-4 sm:px-6 py-4 flex-1 overflow-y-auto overscroll-contain">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 shrink-0">
                  {footer}
                  {/* Safe area for notched devices */}
                  <div className="h-safe-area-inset-bottom" />
                </div>
              )}
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}

// Confirmation modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmModalProps) {
  const buttonVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className="text-surface-600 dark:text-surface-400">{message}</p>
    </Modal>
  );
}
