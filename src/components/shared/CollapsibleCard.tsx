import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CollapsibleCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  badge?: ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  className?: string;
  delay?: number;
}

export function CollapsibleCard({
  title,
  icon,
  children,
  defaultExpanded = true,
  badge,
  headerClassName,
  contentClassName,
  className,
  delay = 0,
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 border border-surface-200 dark:border-surface-700 overflow-hidden',
        className
      )}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          'hover:bg-surface-50 dark:hover:bg-surface-700/50',
          isExpanded && 'border-b border-surface-100 dark:border-surface-700',
          headerClassName
        )}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-primary-600 dark:text-primary-400">
              {icon}
            </span>
          )}
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">
            {title}
          </h3>
          {badge}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="text-surface-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Content - Collapsible */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={cn('p-4', contentClassName)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Variant without header button - just a card that can be collapsed programmatically
interface SimpleCollapsibleProps {
  isExpanded: boolean;
  children: ReactNode;
  className?: string;
}

export function SimpleCollapsible({ isExpanded, children, className }: SimpleCollapsibleProps) {
  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
