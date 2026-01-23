import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { trackSponsorAnalytics } from '@/stores/sponsorshipStore';

interface PoweredByProps {
  sponsor: {
    id: string;
    name: string;
    logo?: string;
    website?: string;
    tierSlug: string;
  };
  label?: string;
  className?: string;
  contentType?: string;
  contentId?: string;
}

export function PoweredBy({
  sponsor,
  label = 'Powered by',
  className = '',
  contentType,
  contentId,
}: PoweredByProps) {
  // Track impression on mount
  useEffect(() => {
    trackSponsorAnalytics({
      sponsorId: sponsor.id,
      eventType: 'impression',
      eventSource: 'content',
      contentType,
      contentId,
    });
  }, [sponsor.id, contentType, contentId]);

  const handleClick = () => {
    if (sponsor.website) {
      trackSponsorAnalytics({
        sponsorId: sponsor.id,
        eventType: 'click',
        eventSource: 'content',
        contentType,
        contentId,
      });
      window.open(sponsor.website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        inline-flex items-center gap-2 text-text-tertiary text-sm
        ${sponsor.website ? 'cursor-pointer hover:text-text-secondary' : ''}
        transition-colors
        ${className}
      `}
      onClick={handleClick}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>{label}</span>
      {sponsor.logo ? (
        <img
          src={sponsor.logo}
          alt={sponsor.name}
          className="h-4 object-contain opacity-80 hover:opacity-100 transition-opacity"
        />
      ) : (
        <span className="font-medium text-text-secondary">{sponsor.name}</span>
      )}
    </motion.div>
  );
}

export default PoweredBy;
