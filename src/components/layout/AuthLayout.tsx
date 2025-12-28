import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-ghana-gradient relative overflow-hidden">
        {/* Kente pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(252, 209, 22, 0.3) 20px,
                rgba(252, 209, 22, 0.3) 40px
              )`,
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Star className="w-8 h-8 text-secondary-500" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-white text-xl">
                OHCS E-Library
              </h1>
              <p className="text-white/70 text-sm">Ghana Civil Service</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="my-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-heading text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                Empowering Ghana's
                <br />
                <span className="text-secondary-400">Civil Service</span>
              </h2>
              <p className="text-white/80 text-lg max-w-md leading-relaxed">
                Access official documents, connect with colleagues, and enhance your
                professional development through our comprehensive digital platform.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12 grid grid-cols-2 gap-6"
            >
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-3xl font-bold text-white">20K+</p>
                <p className="text-white/70">Civil Servants</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-3xl font-bold text-white">50+</p>
                <p className="text-white/70">MDAs Targeted</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-white/70">AI Assistance</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-3xl font-bold text-white">100%</p>
                <p className="text-white/70">Secured</p>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4">
            <div className="ghana-flag-stripe flex-1 rounded-full" />
            <p className="text-white/60 text-sm">
              Office of the Head of Civil Service
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden p-6 flex items-center justify-center border-b border-surface-200 dark:border-surface-700">
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

        {/* Ghana flag stripe */}
        <div className="lg:hidden ghana-flag-stripe" />

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-surface-900">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Outlet />
          </motion.div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden p-6 text-center text-sm text-surface-500 border-t border-surface-200 dark:border-surface-700">
          <p>Office of the Head of Civil Service, Ghana</p>
        </div>
      </div>
    </div>
  );
}
