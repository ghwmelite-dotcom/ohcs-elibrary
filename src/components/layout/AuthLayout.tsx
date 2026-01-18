import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Library, Users, Building2, Bot, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';

const stats = [
  { value: '20K+', label: 'Civil Servants', icon: Users },
  { value: '50+', label: 'MDAs Targeted', icon: Building2 },
  { value: '24/7', label: 'AI Assistance', icon: Bot },
  { value: '100%', label: 'Secured', icon: Shield },
];

// Animated Logo for Auth Pages - Light variant (for dark background)
function AnimatedAuthLogo({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const isLight = variant === 'light';

  return (
    <Link to="/" className="flex items-center gap-3 group">
      <motion.div
        className="relative w-12 h-12"
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      >
        {/* Outer glow ring - animated */}
        <motion.div
          className={cn(
            'absolute -inset-1 rounded-xl blur-md transition-opacity duration-500',
            isLight ? 'opacity-60 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
          style={{
            background: isLight
              ? 'linear-gradient(135deg, rgba(255,255,255,0.5), #FCD116, rgba(255,255,255,0.5))'
              : 'linear-gradient(135deg, #006B3F, #FCD116, #CE1126, #006B3F)',
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
            background: isLight
              ? 'rgba(255, 255, 255, 0.3)'
              : 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
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
          className={cn(
            'absolute inset-0 rounded-xl overflow-hidden',
            isLight ? 'bg-white/20 backdrop-blur-sm' : 'bg-ghana-gradient'
          )}
          style={{
            boxShadow: isLight
              ? '0 4px 20px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.3)'
              : '0 4px 20px rgba(0, 107, 63, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.3) 50%, transparent 80%)',
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
            <Library className={cn(
              'w-6 h-6 drop-shadow-lg',
              isLight ? 'text-secondary-400' : 'text-secondary-500'
            )} />
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
      <motion.div
        className="overflow-hidden"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="flex flex-col"
          whileHover={{ x: 2 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="flex items-center gap-1.5">
            <h1 className={cn(
              'font-heading font-bold text-xl leading-tight',
              isLight ? 'text-white' : 'text-primary-600 dark:text-primary-400'
            )}>
              OHCS E-Library
            </h1>
            {/* AI Badge */}
            <motion.span
              className={cn(
                'px-1.5 py-0.5 text-[9px] font-bold rounded relative overflow-hidden',
                isLight
                  ? 'bg-white/20 text-secondary-400'
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              )}
              whileHover={{ scale: 1.1 }}
              animate={{
                boxShadow: [
                  '0 0 0 rgba(252, 209, 22, 0)',
                  '0 0 10px rgba(252, 209, 22, 0.5)',
                  '0 0 0 rgba(252, 209, 22, 0)',
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
          </div>
          <p className={cn(
            'text-sm leading-tight',
            isLight ? 'text-white/60' : 'text-surface-500 dark:text-surface-400'
          )}>
            Ghana Civil Service
          </p>
        </motion.div>
      </motion.div>
    </Link>
  );
}

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (exactly 50%) */}
      <div className="hidden lg:flex lg:w-1/2 bg-ghana-gradient relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Kente pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(252, 209, 22, 0.5) 20px,
                rgba(252, 209, 22, 0.5) 40px
              )`,
            }}
          />

          {/* Floating circles */}
          <motion.div
            className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/5"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-32 left-10 w-48 h-48 rounded-full bg-secondary-500/10"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/5"
            animate={{
              y: [0, -20, 0],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-8 xl:p-12">
          {/* Animated Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatedAuthLogo variant="light" />
          </motion.div>

          {/* Main Content */}
          <div className="my-auto py-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h2 className="font-heading text-3xl xl:text-4xl 2xl:text-5xl font-bold text-white mb-4 xl:mb-6 leading-tight">
                Empowering Ghana's
                <br />
                <span className="text-secondary-400">Civil Service</span>
              </h2>
              <p className="text-white/75 text-base xl:text-lg max-w-md leading-relaxed">
                Access official documents, connect with colleagues, and enhance your
                professional development through our comprehensive digital platform.
              </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 xl:mt-12 grid grid-cols-2 gap-3 xl:gap-4"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="group bg-white/10 backdrop-blur-sm rounded-xl p-4 xl:p-5 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <stat.icon className="w-5 h-5 text-secondary-400" />
                    </div>
                    <div>
                      <p className="text-2xl xl:text-3xl font-bold text-white">{stat.value}</p>
                      <p className="text-white/60 text-sm">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-4"
          >
            <div className="ghana-flag-stripe flex-1 rounded-full h-1" />
            <p className="text-white/50 text-sm">
              Office of the Head of Civil Service
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form (exactly 50%) */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white dark:bg-surface-900">
        {/* Mobile header with animated logo */}
        <div className="lg:hidden p-6 flex items-center justify-center border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
          <AnimatedAuthLogo variant="dark" />
        </div>

        {/* Ghana flag stripe - mobile */}
        <div className="lg:hidden ghana-flag-stripe" />

        {/* Form Content - Main landmark for accessibility */}
        <main className="flex-1 flex items-center justify-center p-6 lg:p-8 xl:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Mobile footer */}
        <div className="lg:hidden p-6 text-center text-sm text-surface-500 border-t border-surface-200 dark:border-surface-700">
          <p>Office of the Head of Civil Service, Ghana</p>
        </div>

        {/* Desktop footer - subtle branding */}
        <div className="hidden lg:block p-6 text-center">
          <p className="text-xs text-surface-400 dark:text-surface-500">
            &copy; {new Date().getFullYear()} Office of the Head of Civil Service, Ghana. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
