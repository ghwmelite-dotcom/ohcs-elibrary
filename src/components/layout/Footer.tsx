import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
      {/* Ghana flag stripe */}
      <div className="ghana-flag-stripe" />

      <div className="container-section py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-ghana-gradient flex items-center justify-center">
                <Star className="w-6 h-6 text-secondary-500" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-primary-600 dark:text-primary-400">
                  OHCS E-Library
                </h3>
                <p className="text-xs text-surface-500">Ghana Civil Service</p>
              </div>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
              The official digital platform for Ghana's civil servants. Access documents,
              connect with colleagues, and enhance your professional development.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/library"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Document Library
                </Link>
              </li>
              <li>
                <Link
                  to="/forum"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Forum
                </Link>
              </li>
              <li>
                <Link
                  to="/news"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  News
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/help"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <a
                  href="https://ohcs.gov.gh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  OHCS Website
                </a>
              </li>
              <li>
                <a
                  href="https://ghana.gov.gh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Ghana.gov
                </a>
              </li>
              <li>
                <Link
                  to="/settings"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
              <li>Office of the Head of Civil Service</li>
              <li>P.O. Box MB 41, Accra</li>
              <li>Ghana, West Africa</li>
              <li className="pt-2">
                <a
                  href="mailto:info@ohcs.gov.gh"
                  className="hover:text-primary-600 dark:hover:text-primary-400"
                >
                  info@ohcs.gov.gh
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-500">
            {currentYear} Office of the Head of Civil Service. All rights reserved.
          </p>
          <p className="text-sm text-surface-500 flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-accent-500" /> for Ghana
          </p>
        </div>
      </div>
    </footer>
  );
}
