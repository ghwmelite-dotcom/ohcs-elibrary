import { motion } from 'framer-motion';
import { ExternalLink, Award, Star, Medal, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TierLevel } from '@/types/sponsorship';
import { trackSponsorAnalytics } from '@/stores/sponsorshipStore';

interface SponsorCardProps {
  sponsor: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    tagline?: string;
    website?: string;
    tier: {
      name: string;
      slug: TierLevel;
      color: string;
    };
  };
  variant?: 'full' | 'medium' | 'compact' | 'logo-only';
  showActions?: boolean;
  className?: string;
  index?: number;
}

export function SponsorCard({
  sponsor,
  variant = 'medium',
  showActions = true,
  className = '',
  index = 0,
}: SponsorCardProps) {
  const tierIcons: Record<TierLevel, React.ElementType> = {
    platinum: Star,
    gold: Award,
    silver: Medal,
    bronze: Heart,
  };

  const tierStyles: Record<TierLevel, { bg: string; border: string; text: string; badge: string }> = {
    platinum: {
      bg: 'bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-800 dark:via-surface-800 dark:to-slate-900',
      border: 'border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500',
      text: 'text-slate-600 dark:text-slate-300',
      badge: 'bg-gradient-to-r from-slate-200 to-slate-100 text-slate-700 dark:from-slate-600 dark:to-slate-500 dark:text-slate-100',
    },
    gold: {
      bg: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 dark:from-yellow-900/30 dark:via-amber-900/20 dark:to-yellow-900/30',
      border: 'border-yellow-200 hover:border-yellow-300 dark:border-yellow-700 dark:hover:border-yellow-600',
      text: 'text-yellow-700 dark:text-yellow-400',
      badge: 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white',
    },
    silver: {
      bg: 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-800 dark:via-gray-800 dark:to-slate-900',
      border: 'border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500',
      text: 'text-slate-600 dark:text-slate-300',
      badge: 'bg-gradient-to-r from-slate-300 to-slate-400 text-white dark:from-slate-500 dark:to-slate-600',
    },
    bronze: {
      bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-amber-900/30',
      border: 'border-amber-200 hover:border-amber-300 dark:border-amber-700 dark:hover:border-amber-600',
      text: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    },
  };

  const style = tierStyles[sponsor.tier.slug] || tierStyles.silver;
  const TierIcon = tierIcons[sponsor.tier.slug] || Medal;

  const handleClick = (action: 'view' | 'website') => {
    trackSponsorAnalytics({
      sponsorId: sponsor.id,
      eventType: 'click',
      eventSource: 'showcase',
      metadata: { action },
    });
  };

  if (variant === 'logo-only') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.05 }}
        className={`
          flex items-center justify-center p-4
          ${style.bg} ${style.border} border rounded-xl
          transition-all duration-200 cursor-pointer
          ${className}
        `}
        onClick={() => handleClick('view')}
      >
        {sponsor.logo ? (
          <img
            src={sponsor.logo}
            alt={sponsor.name}
            className="h-10 max-w-[120px] object-contain grayscale hover:grayscale-0 transition-all"
          />
        ) : (
          <span className="text-lg font-bold text-surface-600 dark:text-surface-300">{sponsor.name}</span>
        )}
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className={`
          relative overflow-hidden rounded-xl border p-4
          ${style.bg} ${style.border}
          shadow-sm hover:shadow-md transition-all duration-300
          ${className}
        `}
      >
        <div className="flex items-center gap-3">
          {sponsor.logo ? (
            <div className="h-12 w-12 rounded-lg bg-white dark:bg-surface-700 shadow-sm p-1.5 flex items-center justify-center flex-shrink-0">
              <img src={sponsor.logo} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div
              className="h-12 w-12 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0"
              style={{ background: sponsor.tier.color }}
            >
              <TierIcon className="h-6 w-6 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-surface-900 dark:text-white truncate">{sponsor.name}</h3>
            {sponsor.tagline && (
              <p className="text-sm text-surface-600 dark:text-surface-400 truncate">{sponsor.tagline}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'full') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
        whileHover={{ y: -8 }}
        className={`
          relative overflow-hidden rounded-2xl border-2 p-8
          ${style.bg} ${style.border}
          shadow-lg hover:shadow-xl transition-all duration-300
          ${className}
        `}
      >
        {/* Tier badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${style.badge}`}>
          <span className="flex items-center gap-1.5">
            <TierIcon className="h-4 w-4" />
            {sponsor.tier.name}
          </span>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-ghana-gold/10 to-transparent rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-ghana-green/10 to-transparent rounded-full blur-xl" />

        <div className="relative">
          <div className="flex items-start gap-6">
            {sponsor.logo ? (
              <div className="h-24 w-24 rounded-xl bg-white dark:bg-surface-700 shadow-lg p-3 flex items-center justify-center flex-shrink-0">
                <img src={sponsor.logo} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div
                className="h-24 w-24 rounded-xl shadow-lg flex items-center justify-center flex-shrink-0"
                style={{ background: sponsor.tier.color }}
              >
                <TierIcon className="h-12 w-12 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-2">
              <h2 className="text-2xl font-bold text-surface-900 dark:text-white">{sponsor.name}</h2>
              {sponsor.tagline && (
                <p className="text-lg text-surface-600 dark:text-surface-300 mt-1">{sponsor.tagline}</p>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-4 mt-8">
              <Link
                to={`/sponsors/${sponsor.slug}`}
                onClick={() => handleClick('view')}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-ghana-green text-white rounded-xl font-medium hover:bg-ghana-green/90 transition-colors"
              >
                View Profile
              </Link>
              {sponsor.website && (
                <motion.a
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleClick('website')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium
                    border-2 ${style.border} ${style.text}
                    hover:bg-white/50 dark:hover:bg-white/10 transition-colors
                  `}
                >
                  <ExternalLink className="h-5 w-5" />
                  Website
                </motion.a>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Medium variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className={`
        relative overflow-hidden rounded-xl border p-6
        ${style.bg} ${style.border}
        shadow-sm hover:shadow-lg transition-all duration-300
        ${className}
      `}
    >
      {/* Tier badge */}
      <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
        <span className="flex items-center gap-1">
          <TierIcon className="h-3 w-3" />
          {sponsor.tier.name}
        </span>
      </div>

      <div className="flex flex-col items-center text-center">
        {sponsor.logo ? (
          <div className="h-16 w-16 rounded-xl bg-white dark:bg-surface-700 shadow-md p-2 flex items-center justify-center mb-4">
            <img src={sponsor.logo} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div
            className="h-16 w-16 rounded-xl shadow-md flex items-center justify-center mb-4"
            style={{ background: sponsor.tier.color }}
          >
            <TierIcon className="h-8 w-8 text-white" />
          </div>
        )}
        <h3 className="font-semibold text-lg text-surface-900 dark:text-white">{sponsor.name}</h3>
        {sponsor.tagline && (
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 line-clamp-2">{sponsor.tagline}</p>
        )}

        {showActions && (
          <div className="flex items-center gap-2 mt-4">
            <Link
              to={`/sponsors/${sponsor.slug}`}
              onClick={() => handleClick('view')}
              className="px-4 py-2 bg-ghana-green text-white text-sm rounded-lg font-medium hover:bg-ghana-green/90 transition-colors"
            >
              View
            </Link>
            {sponsor.website && (
              <a
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClick('website')}
                className={`p-2 rounded-lg border ${style.border} ${style.text} hover:bg-white/50 dark:hover:bg-white/10 transition-colors`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SponsorCard;
