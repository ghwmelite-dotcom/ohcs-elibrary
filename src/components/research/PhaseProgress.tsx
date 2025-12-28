import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ResearchPhase } from '@/types';
import { RESEARCH_PHASES } from '@/stores/researchStore';

interface PhaseProgressProps {
  currentPhase: ResearchPhase;
  progress: number;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const phaseOrder: ResearchPhase[] = [
  'ideation',
  'literature_review',
  'methodology',
  'data_collection',
  'analysis',
  'writing',
  'peer_review',
  'publication',
];

export function PhaseProgress({
  currentPhase,
  progress,
  variant = 'horizontal',
  size = 'md',
  className,
}: PhaseProgressProps) {
  const currentIndex = phaseOrder.indexOf(currentPhase);

  const sizeClasses = {
    sm: {
      circle: 'w-6 h-6',
      icon: 'w-3 h-3',
      text: 'text-xs',
      line: 'h-0.5',
      gap: 'gap-1',
    },
    md: {
      circle: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-sm',
      line: 'h-1',
      gap: 'gap-2',
    },
    lg: {
      circle: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-base',
      line: 'h-1.5',
      gap: 'gap-3',
    },
  };

  const sizes = sizeClasses[size];

  if (variant === 'vertical') {
    return (
      <div className={cn('space-y-0', className)}>
        {phaseOrder.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const phaseInfo = RESEARCH_PHASES[phase];

          return (
            <div key={phase} className="flex items-start gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    sizes.circle,
                    'rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                    isCompleted && 'bg-green-500 text-white',
                    isCurrent && 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900',
                    isUpcoming && 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className={sizes.icon} />
                  ) : (
                    <span className={cn(sizes.text, 'font-medium')}>{index + 1}</span>
                  )}
                </motion.div>

                {/* Connecting Line */}
                {index < phaseOrder.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 h-8 mt-1',
                      index < currentIndex
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <div className={cn('pt-1', sizes.gap)}>
                <span
                  className={cn(
                    sizes.text,
                    'font-medium block',
                    isCompleted && 'text-green-600 dark:text-green-400',
                    isCurrent && 'text-primary-600 dark:text-primary-400',
                    isUpcoming && 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {phaseInfo.label}
                </span>
                {isCurrent && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Current phase
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className={cn('w-full', className)}>
      {/* Progress Line */}
      <div className="relative">
        <div className={cn('absolute top-4 left-0 right-0', sizes.line, 'bg-gray-200 dark:bg-gray-700 rounded-full')} />
        <div
          className={cn('absolute top-4 left-0', sizes.line, 'bg-primary-500 rounded-full transition-all duration-500')}
          style={{ width: `${(currentIndex / (phaseOrder.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {phaseOrder.map((phase, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isUpcoming = index > currentIndex;
            const phaseInfo = RESEARCH_PHASES[phase];

            return (
              <div key={phase} className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    sizes.circle,
                    'rounded-full flex items-center justify-center z-10 transition-all',
                    isCompleted && 'bg-green-500 text-white',
                    isCurrent && 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900',
                    isUpcoming && 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className={sizes.icon} />
                  ) : (
                    <Circle className={cn(sizes.icon, isCurrent ? 'fill-current' : '')} />
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    'mt-2 text-center max-w-[60px] leading-tight',
                    sizes.text,
                    isCompleted && 'text-green-600 dark:text-green-400',
                    isCurrent && 'text-primary-600 dark:text-primary-400 font-medium',
                    isUpcoming && 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {phaseInfo.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Percentage */}
      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Overall Progress</span>
        <span className="font-semibold text-primary-600 dark:text-primary-400">{progress}%</span>
      </div>
      <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
        />
      </div>
    </div>
  );
}

export default PhaseProgress;
