import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { trackSponsorAnalytics } from '@/stores/sponsorshipStore';

interface SponsorBadgeProps {
  sponsor: {
    id: string;
    name: string;
    logo?: string;
    website?: string;
    tierSlug: string;
    tierColor: string;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'outlined';
  showLink?: boolean;
  className?: string;
  contentType?: string;
  contentId?: string;
}

export function SponsorBadge({
  sponsor,
  size = 'md',
  variant = 'default',
  showLink = true,
  className = '',
  contentType,
  contentId,
}: SponsorBadgeProps) {
  const sizes = {
    sm: { badge: 'h-6 px-2 text-xs', logo: 'h-4 w-4', gap: 'gap-1' },
    md: { badge: 'h-8 px-3 text-sm', logo: 'h-5 w-5', gap: 'gap-1.5' },
    lg: { badge: 'h-10 px-4 text-base', logo: 'h-6 w-6', gap: 'gap-2' },
  };

  const tierColors: Record<string, string> = {
    platinum: 'bg-gradient-to-r from-slate-200 to-slate-100 text-slate-800 border-slate-300',
    gold: 'bg-gradient-to-r from-yellow-400/20 to-yellow-300/20 text-yellow-800 border-yellow-400',
    silver: 'bg-gradient-to-r from-slate-300/30 to-slate-200/30 text-slate-700 border-slate-400',
    bronze: 'bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-800 border-amber-500',
  };

  const variants = {
    default: `${tierColors[sponsor.tierSlug] || tierColors.silver} border`,
    minimal: 'bg-surface-50 text-text-secondary border-0',
    outlined: `bg-transparent border-2 ${tierColors[sponsor.tierSlug] || tierColors.silver}`,
  };

  const handleClick = () => {
    trackSponsorAnalytics({
      sponsorId: sponsor.id,
      eventType: 'click',
      eventSource: 'badge',
      contentType,
      contentId,
    });
    if (sponsor.website && showLink) {
      window.open(sponsor.website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
      className={`
        inline-flex items-center ${sizes[size].gap} ${sizes[size].badge}
        ${variants[variant]} rounded-full font-medium
        ${showLink && sponsor.website ? 'cursor-pointer' : 'cursor-default'}
        transition-all duration-200
        ${className}
      `}
    >
      {sponsor.logo ? (
        <img
          src={sponsor.logo}
          alt={sponsor.name}
          className={`${sizes[size].logo} object-contain rounded-full`}
        />
      ) : (
        <div
          className={`${sizes[size].logo} rounded-full bg-gradient-to-br from-ghana-green to-ghana-green/70`}
          style={{ background: sponsor.tierColor }}
        />
      )}
      <span className="truncate max-w-[120px]">{sponsor.name}</span>
      {showLink && sponsor.website && (
        <ExternalLink className="h-3 w-3 opacity-60" />
      )}
    </motion.div>
  );
}

export default SponsorBadge;
