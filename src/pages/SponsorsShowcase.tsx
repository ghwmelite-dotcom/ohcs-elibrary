import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Star,
  Award,
  Medal,
  Heart,
  Users,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Building2,
  Mail,
} from 'lucide-react';
import { useShowcaseStore, useTiersStore } from '@/stores/sponsorshipStore';
import { SponsorCard } from '@/components/sponsors';
import type { TierLevel } from '@/types/sponsorship';

// Ghana Black Star SVG component
function BlackStar({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <polygon
        points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40"
        fill="currentColor"
      />
    </svg>
  );
}

// Animated counter component
function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 2,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <span>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

export default function SponsorsShowcase() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  const { sponsors, impactStats, isLoading, fetchShowcase } = useShowcaseStore();
  const { tiers, fetchTiers } = useTiersStore();

  useEffect(() => {
    fetchShowcase();
    fetchTiers();
  }, [fetchShowcase, fetchTiers]);

  // Group sponsors by tier
  const sponsorsByTier = sponsors.reduce((acc, sponsor) => {
    const tier = sponsor.tier.slug as TierLevel;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(sponsor);
    return acc;
  }, {} as Record<TierLevel, typeof sponsors>);

  const tierOrder: TierLevel[] = ['platinum', 'gold', 'silver', 'bronze'];

  const tierConfig: Record<TierLevel, { icon: React.ElementType; title: string; columns: string }> = {
    platinum: { icon: Star, title: 'Platinum Partners', columns: 'grid-cols-1' },
    gold: { icon: Award, title: 'Gold Partners', columns: 'grid-cols-1 md:grid-cols-2' },
    silver: { icon: Medal, title: 'Silver Partners', columns: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' },
    bronze: { icon: Heart, title: 'Bronze Partners', columns: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' },
  };

  const impactMetrics = [
    {
      icon: Building2,
      value: impactStats.totalSponsors,
      label: 'Partner Organizations',
      color: 'text-ghana-green',
      bgColor: 'bg-ghana-green/10',
    },
    {
      icon: GraduationCap,
      value: impactStats.scholarsSupported,
      label: 'Scholars Supported',
      color: 'text-ghana-gold',
      bgColor: 'bg-ghana-gold/10',
    },
    {
      icon: TrendingUp,
      value: impactStats.totalInvestment,
      prefix: 'GHS ',
      label: 'Total Investment',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Award,
      value: impactStats.activeScholarships,
      label: 'Active Scholarships',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Hero Section */}
      <motion.section
        style={{ y, opacity }}
        className="relative overflow-hidden py-24 px-4"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-ghana-green/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-ghana-gold/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ghana-red/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="mb-8"
          >
            <BlackStar className="h-16 w-16 text-ghana-gold mx-auto animate-pulse" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-ghana-green via-ghana-gold to-ghana-red bg-clip-text text-transparent">
              Our Partners in Progress
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-text-secondary max-w-3xl mx-auto mb-12"
          >
            Together with our valued sponsors, we are transforming Ghana's civil service through
            education, technology, and innovation. Their support enables us to empower public
            servants across the nation.
          </motion.p>

          {/* Impact Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {impactMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-surface-200"
              >
                <div className={`w-12 h-12 rounded-xl ${metric.bgColor} flex items-center justify-center mx-auto mb-3`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className={`text-3xl font-bold ${metric.color} mb-1`}>
                  <AnimatedCounter
                    value={metric.value}
                    prefix={metric.prefix}
                    duration={2.5}
                  />
                </div>
                <div className="text-sm text-text-secondary">{metric.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Sponsors by Tier */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ghana-green" />
            </div>
          ) : (
            tierOrder.map((tier) => {
              const tierSponsors = sponsorsByTier[tier];
              if (!tierSponsors || tierSponsors.length === 0) return null;

              const config = tierConfig[tier];
              const TierIcon = config.icon;

              return (
                <motion.div
                  key={tier}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="mb-16"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center
                      ${tier === 'platinum' ? 'bg-gradient-to-br from-slate-200 to-slate-100' : ''}
                      ${tier === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-amber-400' : ''}
                      ${tier === 'silver' ? 'bg-gradient-to-br from-slate-300 to-slate-400' : ''}
                      ${tier === 'bronze' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : ''}
                    `}>
                      <TierIcon className={`h-5 w-5 ${tier === 'gold' || tier === 'bronze' || tier === 'silver' ? 'text-white' : 'text-slate-600'}`} />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary">{config.title}</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-surface-200 to-transparent" />
                  </div>

                  <div className={`grid ${config.columns} gap-6`}>
                    {tierSponsors.map((sponsor, index) => (
                      <SponsorCard
                        key={sponsor.id}
                        sponsor={sponsor}
                        variant={tier === 'platinum' ? 'full' : tier === 'gold' ? 'medium' : tier === 'silver' ? 'compact' : 'logo-only'}
                        index={index}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })
          )}

          {!isLoading && sponsors.length === 0 && (
            <div className="text-center py-20">
              <Sparkles className="h-16 w-16 text-surface-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-secondary mb-2">
                Be Our First Partner
              </h3>
              <p className="text-text-tertiary">
                Join us in transforming Ghana's public service sector.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Sponsorship Tiers Info */}
      <section className="py-16 px-4 bg-gradient-to-b from-surface-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Sponsorship Tiers
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Choose a partnership level that aligns with your organization's goals and make
              a lasting impact on Ghana's public service sector.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, index) => {
              const TierIcon = tierConfig[tier.slug as TierLevel]?.icon || Medal;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative bg-white rounded-2xl border border-surface-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: tier.color }}
                  >
                    <TierIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">{tier.name}</h3>
                  <p className="text-2xl font-bold text-ghana-green mb-4">
                    GHS {(tier.minInvestment / 1000000).toFixed(1)}M+
                  </p>
                  <ul className="space-y-2">
                    {tier.benefits.slice(0, 4).map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="text-ghana-green mt-0.5">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-ghana-green via-ghana-green to-green-800 rounded-3xl p-12 text-center text-white relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-ghana-gold/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -ml-24 -mb-24" />

          <div className="relative">
            <BlackStar className="h-12 w-12 text-ghana-gold mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Become a Partner
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Join our growing community of sponsors and help shape the future of Ghana's
              civil service. Your investment makes a real difference.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/sponsorship"
                className="flex items-center gap-2 px-8 py-4 bg-white text-ghana-green rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                Learn More
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="mailto:sponsorship@ohcs.gov.gh"
                className="flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                <Mail className="h-5 w-5" />
                Contact Us
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
