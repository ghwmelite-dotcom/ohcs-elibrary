import { motion } from 'framer-motion';
import type { TierLevel } from '@/types/sponsorship';

interface CertificateSponsorProps {
  sponsors: Array<{
    id: string;
    name: string;
    logo?: string;
    tierSlug: TierLevel;
  }>;
  tier?: TierLevel;
  variant?: 'footer' | 'sidebar' | 'watermark';
  className?: string;
}

export function CertificateSponsor({
  sponsors,
  tier,
  variant = 'footer',
  className = '',
}: CertificateSponsorProps) {
  // Filter sponsors by tier if specified
  const filteredSponsors = tier
    ? sponsors.filter(s => s.tierSlug === tier)
    : sponsors;

  // Sort by tier priority
  const tierOrder: Record<TierLevel, number> = {
    platinum: 1,
    gold: 2,
    silver: 3,
    bronze: 4,
  };

  const sortedSponsors = [...filteredSponsors].sort(
    (a, b) => tierOrder[a.tierSlug] - tierOrder[b.tierSlug]
  );

  if (sortedSponsors.length === 0) return null;

  if (variant === 'watermark') {
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
        {sortedSponsors.slice(0, 1).map((sponsor) => (
          <motion.div
            key={sponsor.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            className="absolute bottom-10 right-10"
          >
            {sponsor.logo ? (
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-24 w-24 object-contain grayscale"
              />
            ) : (
              <span className="text-6xl font-bold text-gray-200">{sponsor.name[0]}</span>
            )}
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Sponsored by</span>
        <div className="flex flex-col gap-3">
          {sortedSponsors.map((sponsor) => (
            <motion.div
              key={sponsor.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              {sponsor.logo ? (
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">{sponsor.name}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Footer variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center justify-center gap-6 py-4 px-6
        border-t border-gray-200 bg-gray-50/50
        ${className}
      `}
    >
      <span className="text-xs text-gray-400 uppercase tracking-wider">Sponsored by</span>
      <div className="flex items-center gap-4">
        {sortedSponsors.map((sponsor, index) => (
          <motion.div
            key={sponsor.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2"
          >
            {sponsor.logo ? (
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className={`
                  object-contain
                  ${sponsor.tierSlug === 'platinum' ? 'h-10' : ''}
                  ${sponsor.tierSlug === 'gold' ? 'h-8' : ''}
                  ${sponsor.tierSlug === 'silver' ? 'h-6' : ''}
                  ${sponsor.tierSlug === 'bronze' ? 'h-5' : ''}
                `}
              />
            ) : (
              <span
                className={`
                  font-semibold text-gray-600
                  ${sponsor.tierSlug === 'platinum' ? 'text-lg' : 'text-sm'}
                `}
              >
                {sponsor.name}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default CertificateSponsor;
