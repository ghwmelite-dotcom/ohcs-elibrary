import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-surface-900 dark:to-surface-800 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center"
      >
        {/* Ghana Flag Stripe */}
        <div className="flex h-2 rounded-full overflow-hidden mb-8">
          <div className="w-1/3 bg-accent-500" />
          <div className="w-1/3 bg-secondary-500" />
          <div className="w-1/3 bg-primary-600" />
        </div>

        {/* Icon */}
        <div className="w-24 h-24 bg-white dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-elevation-2">
          <FileQuestion className="w-12 h-12 text-primary-600 dark:text-primary-400" />
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-bold text-primary-600 dark:text-primary-400 mb-4">
          404
        </h1>

        <h2 className="text-2xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
          Page Not Found
        </h2>

        <p className="text-surface-600 dark:text-surface-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Search Suggestion */}
        <div className="mt-8 p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm">
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
            Looking for something specific?
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search the platform..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <p className="text-sm text-surface-500 mb-3">Quick Links</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: 'Library', path: '/library' },
              { label: 'Forum', path: '/forum' },
              { label: 'Groups', path: '/groups' },
              { label: 'Help', path: '/help' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
