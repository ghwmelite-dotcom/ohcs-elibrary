import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay() {
  const {
    isActive,
    currentStepIndex,
    steps,
    nextStep,
    prevStep,
    skipTour,
    endTour,
  } = useOnboardingStore();

  const [spotlightPos, setSpotlightPos] = useState<SpotlightPosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Calculate spotlight and tooltip positions
  const updatePositions = useCallback(() => {
    if (!currentStep) return;

    const target = document.querySelector(currentStep.target);
    if (!target) {
      // If target not found, show tooltip in center
      setSpotlightPos(null);
      setTooltipPos({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 200,
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = currentStep.spotlightPadding || 8;

    // Set spotlight position
    setSpotlightPos({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position
    const tooltipWidth = 340;
    const tooltipHeight = 200; // Estimate
    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case 'top':
        top = rect.top - tooltipHeight - 20;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - 20;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + 20;
        break;
    }

    // Keep tooltip within viewport
    const viewportPadding = 16;
    if (left < viewportPadding) left = viewportPadding;
    if (left + tooltipWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - tooltipWidth - viewportPadding;
    }
    if (top < viewportPadding) top = viewportPadding;
    if (top + tooltipHeight > window.innerHeight - viewportPadding) {
      top = window.innerHeight - tooltipHeight - viewportPadding;
    }

    setTooltipPos({ top, left });
  }, [currentStep]);

  // Update positions on step change and window resize
  useEffect(() => {
    if (!isActive) return;

    updatePositions();

    // Also update after a short delay for elements that may need to render
    const timer = setTimeout(updatePositions, 100);

    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [isActive, currentStepIndex, updatePositions]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipTour();
          break;
        case 'ArrowRight':
        case 'Enter':
          nextStep();
          break;
        case 'ArrowLeft':
          if (!isFirstStep) prevStep();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isFirstStep, nextStep, prevStep, skipTour]);

  if (!isActive || !currentStep) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" aria-live="polite">
      {/* Overlay with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightPos && (
              <motion.rect
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                x={spotlightPos.left}
                y={spotlightPos.top}
                width={spotlightPos.width}
                height={spotlightPos.height}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {/* Spotlight border glow */}
      {spotlightPos && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute pointer-events-none"
          style={{
            top: spotlightPos.top - 2,
            left: spotlightPos.left - 2,
            width: spotlightPos.width + 4,
            height: spotlightPos.height + 4,
            zIndex: 2,
          }}
        >
          <div className="absolute inset-0 rounded-lg border-2 border-primary-500 dark:border-primary-400" />
          <div className="absolute inset-0 rounded-lg shadow-[0_0_20px_rgba(0,107,63,0.5)] dark:shadow-[0_0_20px_rgba(0,255,127,0.3)]" />
        </motion.div>
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          ref={tooltipRef}
          key={currentStep.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute w-[340px] pointer-events-auto"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 10,
          }}
        >
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700">
              <h3 className="font-semibold text-white text-lg">
                {currentStep.title}
              </h3>
              <button
                onClick={endTour}
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded transition-colors"
                aria-label="Close tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 py-4">
              <p className="text-surface-600 dark:text-surface-300 text-sm leading-relaxed">
                {currentStep.content}
              </p>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-surface-50 dark:bg-surface-700/50 border-t border-surface-200 dark:border-surface-600">
              <div className="flex items-center justify-between">
                {/* Progress indicator */}
                <div className="flex items-center gap-1.5">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        index === currentStepIndex
                          ? 'bg-primary-500'
                          : index < currentStepIndex
                          ? 'bg-primary-300 dark:bg-primary-600'
                          : 'bg-surface-300 dark:bg-surface-600'
                      )}
                    />
                  ))}
                  <span className="ml-2 text-xs text-surface-500">
                    {currentStepIndex + 1} / {steps.length}
                  </span>
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <button
                      onClick={prevStep}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {currentStep.prevLabel || 'Back'}
                    </button>
                  )}
                  {!isLastStep && (
                    <button
                      onClick={skipTour}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      Skip
                    </button>
                  )}
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                  >
                    {currentStep.nextLabel || (isLastStep ? 'Finish' : 'Next')}
                    {!isLastStep && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="px-4 py-2 bg-surface-100 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
              <p className="text-[10px] text-surface-400 text-center">
                Use <kbd className="px-1 py-0.5 bg-surface-200 dark:bg-surface-600 rounded text-[9px]">←</kbd> <kbd className="px-1 py-0.5 bg-surface-200 dark:bg-surface-600 rounded text-[9px]">→</kbd> to navigate • <kbd className="px-1 py-0.5 bg-surface-200 dark:bg-surface-600 rounded text-[9px]">Esc</kbd> to skip
              </p>
            </div>
          </div>

          {/* Arrow pointer */}
          <div
            className={cn(
              'absolute w-4 h-4 bg-white dark:bg-surface-800 rotate-45 border-surface-200 dark:border-surface-700',
              currentStep.position === 'top' && 'bottom-[-8px] left-1/2 -translate-x-1/2 border-b border-r',
              currentStep.position === 'bottom' && 'top-[-8px] left-1/2 -translate-x-1/2 border-t border-l',
              currentStep.position === 'left' && 'right-[-8px] top-1/2 -translate-y-1/2 border-t border-r',
              currentStep.position === 'right' && 'left-[-8px] top-1/2 -translate-y-1/2 border-b border-l'
            )}
          />
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
