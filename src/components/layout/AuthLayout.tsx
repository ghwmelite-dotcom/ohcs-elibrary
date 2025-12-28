import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Users, Building2, Bot, Shield } from 'lucide-react';

const stats = [
  { value: '20K+', label: 'Civil Servants', icon: Users },
  { value: '50+', label: 'MDAs Targeted', icon: Building2 },
  { value: '24/7', label: 'AI Assistance', icon: Bot },
  { value: '100%', label: 'Secured', icon: Shield },
];

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
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Star className="w-7 h-7 text-secondary-400" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-white text-xl">
                  OHCS E-Library
                </h1>
                <p className="text-white/60 text-sm">Ghana Civil Service</p>
              </div>
            </Link>
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
        {/* Mobile header */}
        <div className="lg:hidden p-6 flex items-center justify-center border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-ghana-gradient flex items-center justify-center">
              <Star className="w-6 h-6 text-secondary-500" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-primary-600 dark:text-primary-400">
                OHCS E-Library
              </h1>
            </div>
          </Link>
        </div>

        {/* Ghana flag stripe - mobile */}
        <div className="lg:hidden ghana-flag-stripe" />

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-8 xl:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Outlet />
          </motion.div>
        </div>

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
