import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  useEffect(() => {
    if (onDismiss) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm"
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
      <p className="flex-1 text-red-700 dark:text-red-300">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shrink-0"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

export default ErrorAlert;
