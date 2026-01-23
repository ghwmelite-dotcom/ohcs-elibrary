import { motion } from 'framer-motion';
import { ExternalLink, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { trackSponsorAnalytics } from '@/stores/sponsorshipStore';

interface SponsorBannerProps {
  sponsor: {
    id: string;
    name: string;
    logo?: string;
    tagline?: string;
    website?: string;
    tierSlug: string;
    tierColor: string;
    placement?: {
      message?: string;
      cta?: string;
      ctaUrl?: string;
    };
  };
  message?: string;
  variant?: 'default' | 'compact' | 'prominent';
  position?: 'top' | 'bottom';
  className?: string;
  contentType?: string;
  contentId?: string;
}

export function SponsorBanner({
  sponsor,
  message = 'Sponsored by',
  variant = 'default',
  position = 'top',
  className = '',
  contentType,
  contentId,
}: SponsorBannerProps) {
  const tierGradients: Record<string, string> = {
    platinum: 'from-slate-100 via-white to-slate-100 border-slate-200',
    gold: 'from-yellow-50 via-amber-50 to-yellow-50 border-yellow-200',
    silver: 'from-slate-50 via-gray-50 to-slate-50 border-slate-200',
    bronze: 'from-amber-50 via-orange-50 to-amber-50 border-amber-200',
  };

  const tierAccents: Record<string, string> = {
    platinum: 'text-slate-600',
    gold: 'text-yellow-600',
    silver: 'text-slate-500',
    bronze: 'text-amber-600',
  };

  // Track impression on mount
  useEffect(() => {
    trackSponsorAnalytics({
      sponsorId: sponsor.id,
      eventType: 'impression',
      eventSource: 'banner',
      contentType,
      contentId,
    });
  }, [sponsor.id, contentType, contentId]);

  const handleClick = () => {
    trackSponsorAnalytics({
      sponsorId: sponsor.id,
      eventType: 'click',
      eventSource: 'banner',
      contentType,
      contentId,
    });
    const url = sponsor.placement?.ctaUrl || sponsor.website;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -10 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          flex items-center justify-center gap-2 py-2 px-4
          bg-gradient-to-r ${tierGradients[sponsor.tierSlug] || tierGradients.silver}
          border-b ${position === 'bottom' ? 'border-t' : ''}
          ${className}
        `}
      >
        <span className={`text-xs ${tierAccents[sponsor.tierSlug] || tierAccents.silver}`}>
          {sponsor.placement?.message || message}
        </span>
        {sponsor.logo && (
          <img src={sponsor.logo} alt={sponsor.name} className="h-4 object-contain" />
        )}
        <span className="text-sm font-medium text-text-primary">{sponsor.name}</span>
      </motion.div>
    );
  }

  if (variant === 'prominent') {
    return (
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative overflow-hidden rounded-xl p-6
          bg-gradient-to-r ${tierGradients[sponsor.tierSlug] || tierGradients.silver}
          border shadow-lg
          ${className}
        `}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br from-ghana-gold/10 to-transparent rounded-full" />
        <div className="absolute bottom-0 left-0 w-24 h-24 -ml-6 -mb-6 bg-gradient-to-tr from-ghana-green/10 to-transparent rounded-full" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            {sponsor.logo ? (
              <div className="h-16 w-16 rounded-xl bg-white shadow-md p-2 flex items-center justify-center">
                <img src={sponsor.logo} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div
                className="h-16 w-16 rounded-xl shadow-md flex items-center justify-center"
                style={{ background: sponsor.tierColor }}
              >
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <p className={`text-sm font-medium ${tierAccents[sponsor.tierSlug] || tierAccents.silver}`}>
                {sponsor.placement?.message || message}
              </p>
              <h3 className="text-xl font-bold text-text-primary">{sponsor.name}</h3>
              {(sponsor.tagline || sponsor.placement?.message) && (
                <p className="text-sm text-text-secondary mt-0.5">
                  {sponsor.tagline}
                </p>
              )}
            </div>
          </div>

          {(sponsor.website || sponsor.placement?.ctaUrl) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClick}
              className="flex items-center gap-2 px-4 py-2 bg-ghana-green text-white rounded-lg font-medium hover:bg-ghana-green/90 transition-colors"
            >
              {sponsor.placement?.cta || 'Learn More'}
              <ExternalLink className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'top' ? -10 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center justify-between py-3 px-4
        bg-gradient-to-r ${tierGradients[sponsor.tierSlug] || tierGradients.silver}
        border rounded-lg
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${tierAccents[sponsor.tierSlug] || tierAccents.silver}`}>
          {sponsor.placement?.message || message}
        </span>
        {sponsor.logo && (
          <div className="h-8 w-8 rounded-lg bg-white shadow-sm p-1 flex items-center justify-center">
            <img src={sponsor.logo} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
          </div>
        )}
        <div>
          <span className="font-semibold text-text-primary">{sponsor.name}</span>
          {sponsor.tagline && (
            <span className="text-text-secondary text-sm ml-2 hidden sm:inline">
              {sponsor.tagline}
            </span>
          )}
        </div>
      </div>

      {(sponsor.website || sponsor.placement?.ctaUrl) && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md
            bg-white/80 hover:bg-white border shadow-sm transition-colors
            ${tierAccents[sponsor.tierSlug] || tierAccents.silver}
          `}
        >
          {sponsor.placement?.cta || 'Visit'}
          <ExternalLink className="h-3.5 w-3.5" />
        </motion.button>
      )}
    </motion.div>
  );
}

export default SponsorBanner;
