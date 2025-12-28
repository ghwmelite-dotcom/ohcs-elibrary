import { motion } from 'framer-motion';
import { Library } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showAIBadge?: boolean;
  isCollapsed?: boolean;
  className?: string;
}

export function AnimatedLogo({
  size = 'md',
  showText = true,
  showAIBadge = true,
  isCollapsed = false,
  className,
}: AnimatedLogoProps) {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm', badge: 'text-[8px] px-1' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base', badge: 'text-[9px] px-1.5' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-lg', badge: 'text-[10px] px-1.5' },
  };

  const currentSize = sizes[size];

  return (
    <motion.div
      className={cn('flex items-center gap-2 cursor-pointer group', className)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Logo Icon */}
      <motion.div
        className={cn('relative', currentSize.container)}
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      >
        {/* Outer glow ring - animated */}
        <motion.div
          className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500"
          style={{
            background: 'linear-gradient(135deg, #006B3F, #FCD116, #CE1126, #006B3F)',
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
          }}
        />

        {/* Pulsing glow effect */}
        <motion.div
          className="absolute -inset-0.5 rounded-xl blur-sm"
          style={{
            background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Main logo container */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
            boxShadow: '0 4px 20px rgba(0, 107, 63, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.25) 50%, transparent 80%)',
            }}
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              x: { duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' },
            }}
          />

          {/* Gold accent line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{
              background: 'linear-gradient(90deg, transparent, #FCD116, transparent)',
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Library Icon */}
        <div className="relative w-full h-full rounded-xl flex items-center justify-center">
          <motion.div
            animate={{
              rotateY: [0, 10, -10, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Library className={cn(currentSize.icon, 'text-secondary-400 drop-shadow-lg')} />
          </motion.div>
        </div>

        {/* Corner sparkle */}
        <motion.div
          className="absolute -top-0.5 -right-0.5 w-2 h-2"
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
              fill="#FCD116"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Text */}
      {showText && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="overflow-hidden min-w-0 flex-1"
        >
          <motion.div
            className="flex flex-col"
            initial={{ x: 0 }}
            whileHover={{ x: 2 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {/* Title row with AI badge */}
            <div className="flex items-center gap-1.5">
              <h1 className="font-heading font-bold text-[13px] text-primary-600 dark:text-primary-400 leading-tight whitespace-nowrap">
                OHCS E-Library
              </h1>
              {/* AI Badge */}
              {showAIBadge && (
                <motion.span
                  className="px-1 py-0.5 font-bold rounded relative overflow-hidden bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex-shrink-0"
                  style={{ fontSize: '8px' }}
                  whileHover={{ scale: 1.1 }}
                  animate={{
                    boxShadow: [
                      '0 0 0 rgba(0, 107, 63, 0)',
                      '0 0 8px rgba(0, 107, 63, 0.4)',
                      '0 0 0 rgba(0, 107, 63, 0)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  AI
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  />
                </motion.span>
              )}
            </div>
            <p className="text-[9px] text-surface-500 dark:text-surface-400 leading-tight">
              Ghana Civil Service
            </p>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
