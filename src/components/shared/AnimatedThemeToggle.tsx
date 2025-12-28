import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useThemeStore, useEffectiveTheme } from '@/stores/themeStore';

interface AnimatedThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'pill' | 'minimal';
  className?: string;
}

export function AnimatedThemeToggle({
  size = 'md',
  showLabel = false,
  variant = 'default',
  className,
}: AnimatedThemeToggleProps) {
  const { toggleTheme } = useThemeStore();
  const effectiveTheme = useEffectiveTheme();
  const isDark = effectiveTheme === 'dark';

  const sizes = {
    sm: { icon: 'w-4 h-4', button: 'p-1.5', text: 'text-xs' },
    md: { icon: 'w-5 h-5', button: 'p-2', text: 'text-sm' },
    lg: { icon: 'w-6 h-6', button: 'p-2.5', text: 'text-base' },
  };

  const s = sizes[size];

  if (variant === 'pill') {
    return (
      <motion.button
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={cn(
          'relative flex items-center gap-2 rounded-full overflow-hidden transition-all duration-300',
          isDark
            ? 'bg-gradient-to-r from-amber-900/40 to-amber-800/30 border border-amber-500/20'
            : 'bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200',
          s.button,
          'px-3',
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Sliding background indicator */}
        <motion.div
          className={cn(
            'absolute inset-y-1 w-8 rounded-full',
            isDark ? 'bg-amber-500/30' : 'bg-primary-500/20'
          )}
          animate={{ x: isDark ? 0 : 28 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />

        {/* Moon icon */}
        <motion.div
          className="relative z-10"
          animate={{
            scale: isDark ? 1 : 0.8,
            opacity: isDark ? 1 : 0.5,
          }}
        >
          <Moon className={cn(
            s.icon,
            isDark ? 'text-amber-400' : 'text-surface-400'
          )} />
        </motion.div>

        {/* Sun icon */}
        <motion.div
          className="relative z-10"
          animate={{
            scale: !isDark ? 1 : 0.8,
            opacity: !isDark ? 1 : 0.5,
          }}
        >
          <Sun className={cn(
            s.icon,
            !isDark ? 'text-primary-600' : 'text-amber-600/50'
          )} />
        </motion.div>

        {showLabel && (
          <span className={cn(
            s.text,
            'font-medium ml-1',
            isDark ? 'text-amber-200' : 'text-primary-700'
          )}>
            {isDark ? 'Dark' : 'Light'}
          </span>
        )}
      </motion.button>
    );
  }

  if (variant === 'minimal') {
    return (
      <motion.button
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={cn(
          'relative rounded-lg transition-colors',
          isDark
            ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            : 'text-surface-600 hover:text-primary-600 hover:bg-primary-50',
          s.button,
          className
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9, rotate: 15 }}
      >
        <motion.div
          animate={{ rotate: isDark ? 0 : 180 }}
          transition={{ duration: 0.4 }}
        >
          {isDark ? <Sun className={s.icon} /> : <Moon className={s.icon} />}
        </motion.div>
      </motion.button>
    );
  }

  // Default variant - matches landing page's beautiful toggle
  return (
    <motion.button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative rounded-xl overflow-hidden group/theme',
        isDark ? 'text-amber-50' : 'text-surface-700',
        s.button,
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9, rotate: 15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Background glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover/theme:opacity-100 transition-opacity duration-300"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(252, 209, 22, 0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0, 107, 63, 0.2) 0%, transparent 70%)',
        }}
      />

      {/* Rotating ring on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover/theme:opacity-100"
        style={{
          border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.4)' : 'rgba(0, 107, 63, 0.4)'}`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Icon with morph animation */}
      <motion.div
        className="relative"
        initial={false}
        animate={{
          rotate: isDark ? 0 : 180,
          scale: [1, 1.2, 1],
        }}
        transition={{
          rotate: { duration: 0.5 },
          scale: { duration: 0.3 },
        }}
      >
        {isDark ? (
          <Sun className={cn(s.icon, 'drop-shadow-[0_0_8px_rgba(252,209,22,0.6)]')} />
        ) : (
          <Moon className={cn(s.icon, 'drop-shadow-[0_0_8px_rgba(0,107,63,0.5)]')} />
        )}
      </motion.div>

      {/* Sparkle particles on hover */}
      <motion.div
        className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full opacity-0 group-hover/theme:opacity-100"
        style={{ background: isDark ? '#FCD116' : '#006B3F' }}
        animate={{
          scale: [0, 1, 0],
          y: [0, -8],
          x: [0, 4],
        }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-1 h-1 rounded-full opacity-0 group-hover/theme:opacity-100"
        style={{ background: isDark ? '#FCD116' : '#006B3F' }}
        animate={{
          scale: [0, 1, 0],
          y: [0, 6],
          x: [0, -3],
        }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.7 }}
      />

      {showLabel && (
        <motion.span
          className={cn(
            'ml-2 font-medium',
            s.text,
            isDark ? 'text-amber-200' : 'text-surface-700'
          )}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {isDark ? 'Dark' : 'Light'}
        </motion.span>
      )}
    </motion.button>
  );
}

// Compact switch-style toggle for settings
export function ThemeSwitch({ className }: { className?: string }) {
  const { toggleTheme } = useThemeStore();
  const effectiveTheme = useEffectiveTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative w-14 h-8 rounded-full p-1 transition-colors duration-300',
        isDark
          ? 'bg-gradient-to-r from-amber-900/60 to-amber-800/40 border border-amber-500/30'
          : 'bg-gradient-to-r from-primary-100 to-primary-200 border border-primary-300',
        className
      )}
    >
      {/* Track background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <Moon className={cn(
          'w-3.5 h-3.5 transition-opacity',
          isDark ? 'text-amber-400/60' : 'text-surface-400/40'
        )} />
        <Sun className={cn(
          'w-3.5 h-3.5 transition-opacity',
          !isDark ? 'text-primary-500/60' : 'text-amber-600/30'
        )} />
      </div>

      {/* Sliding knob */}
      <motion.div
        className={cn(
          'relative w-6 h-6 rounded-full shadow-lg flex items-center justify-center',
          isDark
            ? 'bg-gradient-to-br from-amber-400 to-amber-500'
            : 'bg-gradient-to-br from-primary-500 to-primary-600'
        )}
        animate={{ x: isDark ? 0 : 22 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <motion.div
          animate={{ rotate: isDark ? 0 : 360 }}
          transition={{ duration: 0.5 }}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-amber-900" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-white" />
          )}
        </motion.div>
      </motion.div>
    </motion.button>
  );
}
