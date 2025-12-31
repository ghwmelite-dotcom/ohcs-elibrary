import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Palette } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useEffectiveTheme } from '@/stores/themeStore';

interface ThemeToggleHintProps {
  children: React.ReactNode;
  variant?: 'landing' | 'dashboard';
  className?: string;
}

const HINT_STORAGE_KEY = 'ohcs_theme_hint_v2';
const HINT_INTERACTION_KEY = 'ohcs_theme_toggled_v2';

export function ThemeToggleHint({
  children,
  variant = 'dashboard',
  className
}: ThemeToggleHintProps) {
  const [showHint, setShowHint] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const effectiveTheme = useEffectiveTheme();
  const isDark = effectiveTheme === 'dark';
  const initialThemeRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Always show hint after a delay - let users discover the theme toggle
    const timer = setTimeout(() => setShowHint(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Track when theme changes (user interacted) - but skip initial load
  useEffect(() => {
    // Store the initial theme on first render
    if (!isInitializedRef.current) {
      initialThemeRef.current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      // Wait a bit before starting to observe to skip initial theme setup
      const initTimer = setTimeout(() => {
        isInitializedRef.current = true;
      }, 500);
      return () => clearTimeout(initTimer);
    }
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      // Only count as interaction if we're past initialization
      if (!isInitializedRef.current) return;

      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      // Only trigger if theme actually changed from initial
      if (currentTheme !== initialThemeRef.current) {
        // Temporarily hide when user toggles, but it will show again on next page load
        setHasInteracted(true);
        setShowHint(false);
        initialThemeRef.current = currentTheme;
      }
    };

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const dismissHint = () => {
    // Just hide for this session - will show again on next visit
    setShowHint(false);
    setHasInteracted(true);
  };

  const isLanding = variant === 'landing';

  return (
    <div className={cn('relative', className)}>
      {/* Attention-grabbing pulsing ring - always visible until interacted */}
      <AnimatePresence>
        {showHint && !hasInteracted && (
          <>
            {/* Outer pulsing glow ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.15, 1],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className={cn(
                'absolute inset-0 rounded-xl pointer-events-none',
                isDark
                  ? 'bg-gradient-to-r from-amber-400/30 via-yellow-300/20 to-amber-400/30'
                  : 'bg-gradient-to-r from-primary-400/30 via-emerald-300/20 to-primary-400/30',
              )}
              style={{
                boxShadow: isDark
                  ? '0 0 20px rgba(252, 209, 22, 0.4), 0 0 40px rgba(252, 209, 22, 0.2)'
                  : '0 0 20px rgba(0, 107, 63, 0.3), 0 0 40px rgba(0, 107, 63, 0.15)',
              }}
            />

            {/* Second ring with offset timing */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1.05, 1.25, 1.05],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
              className={cn(
                'absolute inset-0 rounded-xl pointer-events-none',
                isDark
                  ? 'border-2 border-amber-400/40'
                  : 'border-2 border-primary-400/40',
              )}
            />

            {/* Orbiting sparkle particles */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.5,
                }}
              >
                <motion.div
                  className={cn(
                    'absolute w-1.5 h-1.5 rounded-full',
                    isDark ? 'bg-amber-400' : 'bg-primary-500'
                  )}
                  style={{
                    top: i === 0 ? '-4px' : i === 1 ? '50%' : 'auto',
                    bottom: i === 2 ? '-4px' : 'auto',
                    left: i === 1 ? '-4px' : '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{
                    opacity: [0.4, 1, 0.4],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* The actual toggle button */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Floating hint tooltip */}
      <AnimatePresence>
        {showHint && !hasInteracted && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
              delay: 0.3,
            }}
            className={cn(
              'absolute z-50 pointer-events-auto',
              isLanding
                ? 'top-full mt-3 right-0'
                : 'top-full mt-3 left-1/2 -translate-x-1/2'
            )}
          >
            <motion.div
              className={cn(
                'relative px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-sm',
                'border whitespace-nowrap',
                isDark
                  ? 'bg-gradient-to-br from-amber-900/90 to-amber-950/90 border-amber-500/30 text-amber-50'
                  : 'bg-gradient-to-br from-white/95 to-primary-50/95 border-primary-300/50 text-surface-800'
              )}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Tooltip arrow */}
              <div
                className={cn(
                  'absolute -top-2 w-4 h-4 rotate-45 border-l border-t',
                  isLanding ? 'right-4' : 'left-1/2 -translate-x-1/2',
                  isDark
                    ? 'bg-gradient-to-br from-amber-900/90 to-amber-900/80 border-amber-500/30'
                    : 'bg-gradient-to-br from-white/95 to-primary-50/90 border-primary-300/50'
                )}
              />

              {/* Content */}
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Palette className={cn(
                    'w-4 h-4',
                    isDark ? 'text-amber-400' : 'text-primary-600'
                  )} />
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold flex items-center gap-1">
                    Try {isDark ? 'Light' : 'Dark'} Mode
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className={cn(
                        'w-3 h-3',
                        isDark ? 'text-amber-400' : 'text-primary-500'
                      )} />
                    </motion.span>
                  </span>
                  <span className={cn(
                    'text-[10px]',
                    isDark ? 'text-amber-200/70' : 'text-surface-500'
                  )}>
                    Click to switch themes
                  </span>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissHint();
                  }}
                  className={cn(
                    'ml-2 p-1 rounded-full transition-colors',
                    isDark
                      ? 'hover:bg-amber-800/50 text-amber-400/70 hover:text-amber-300'
                      : 'hover:bg-primary-100 text-surface-400 hover:text-surface-600'
                  )}
                  aria-label="Dismiss hint"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for smaller spaces
export function ThemeToggleSpotlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isActive, setIsActive] = useState(false);
  const effectiveTheme = useEffectiveTheme();
  const isDark = effectiveTheme === 'dark';
  const initialThemeRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Always show after delay
    const timer = setTimeout(() => setIsActive(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Store initial theme
    if (!isInitializedRef.current) {
      initialThemeRef.current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const initTimer = setTimeout(() => {
        isInitializedRef.current = true;
      }, 500);
      return () => clearTimeout(initTimer);
    }
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!isInitializedRef.current) return;
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      if (currentTheme !== initialThemeRef.current) {
        // Temporarily hide when toggled
        setIsActive(false);
        initialThemeRef.current = currentTheme;
      }
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Subtle spotlight effect */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={cn(
              'absolute -inset-1 rounded-xl pointer-events-none blur-sm',
              isDark
                ? 'bg-amber-400/30'
                : 'bg-primary-400/30',
            )}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
