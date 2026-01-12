import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Library,
  FileText,
  Scale,
  UserCheck,
  ShieldAlert,
  Ban,
  AlertTriangle,
  BookOpen,
  ShoppingBag,
  MessageSquare,
  Copyright,
  Gavel,
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useEffectiveTheme } from '@/stores/themeStore';

// Theme colors matching Landing page
const themes = {
  dark: {
    bg: 'linear-gradient(180deg, #1a1510 0%, #0f0d0a 50%, #1a1510 100%)',
    text: 'text-amber-50',
    textMuted: 'text-amber-50/60',
    textGhost: 'text-amber-50/20',
    cardBg: 'rgba(245, 240, 230, 0.06)',
    cardBorder: 'rgba(245, 240, 230, 0.1)',
  },
  light: {
    bg: 'linear-gradient(180deg, #e8e4dc 0%, #d9d3c7 35%, #e5e0d6 65%, #ebe7df 100%)',
    text: 'text-slate-900',
    textMuted: 'text-slate-700',
    textGhost: 'text-slate-400',
    cardBg: 'rgba(255, 255, 255, 0.8)',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
  },
};

interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
  isDark: boolean;
}

function Section({ icon: Icon, title, children, delay = 0, isDark }: SectionProps) {
  const theme = isDark ? themes.dark : themes.light;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="mb-8"
    >
      <div
        className="rounded-2xl p-6 lg:p-8"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.2), rgba(252, 209, 22, 0.1))'
                : 'linear-gradient(135deg, rgba(0, 107, 63, 0.15), rgba(0, 107, 63, 0.08))',
            }}
          >
            <Icon className={cn('w-5 h-5', isDark ? 'text-secondary-400' : 'text-primary-600')} />
          </div>
          <h2 className={cn('text-xl font-heading font-bold', isDark ? 'text-amber-50' : 'text-slate-900')}>
            {title}
          </h2>
        </div>
        <div className={cn('prose prose-sm max-w-none', isDark ? 'prose-invert' : '')}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function TermsOfService() {
  const effectiveTheme = useEffectiveTheme();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? themes.dark : themes.light;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ background: theme.bg }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: isDark ? 'rgba(26, 21, 16, 0.95)' : 'rgba(232, 228, 220, 0.95)',
          borderBottom: `1px solid ${theme.cardBorder}`,
        }}
      >
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #006B3F, #004d2d)' }}
              >
                <Library className="w-5 h-5 text-secondary-400" />
              </div>
              <span className={cn('font-heading font-bold', isDark ? 'text-amber-50' : 'text-slate-900')}>
                OHCS E-Library
              </span>
            </Link>
            <Link
              to="/"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                isDark
                  ? 'text-amber-50/60 hover:text-amber-50 hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${isDark ? 'rgba(252, 209, 22, 0.15)' : 'rgba(0, 107, 63, 0.1)'} 0%, transparent 50%)`,
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: isDark ? 'rgba(252, 209, 22, 0.1)' : 'rgba(0, 107, 63, 0.1)',
              border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.2)' : 'rgba(0, 107, 63, 0.2)'}`,
            }}
          >
            <Scale className={cn('w-4 h-4', isDark ? 'text-secondary-400' : 'text-primary-600')} />
            <span className={cn('text-sm font-medium', isDark ? 'text-secondary-400' : 'text-primary-600')}>
              Legal Agreement
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn('text-4xl lg:text-5xl font-heading font-bold mb-6', isDark ? 'text-amber-50' : 'text-slate-900')}
          >
            Terms of Service
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn('text-lg max-w-2xl mx-auto', theme.textMuted)}
          >
            Please read these terms carefully before using the OHCS E-Library platform.
            By accessing our services, you agree to be bound by these terms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn('flex items-center justify-center gap-2 mt-6 text-sm', theme.textGhost)}
          >
            <Clock className="w-4 h-4" />
            <span>Last updated: January 2026</span>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">

          <Section icon={FileText} title="Acceptance of Terms" delay={0.1} isDark={isDark}>
            <p className={theme.textMuted}>
              By accessing or using the OHCS E-Library platform ("Platform"), you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these
              Terms, you must not use the Platform.
            </p>
            <p className={cn('mt-4', theme.textMuted)}>
              The Platform is provided by the Office of the Head of Civil Service, Ghana ("OHCS", "we", "us", or "our")
              for the benefit of Ghana's civil servants and authorized personnel.
            </p>
          </Section>

          <Section icon={UserCheck} title="User Eligibility & Accounts" delay={0.2} isDark={isDark}>
            <p className={theme.textMuted}>
              To use the Platform, you must:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li>Be a current or former employee of Ghana's Civil Service, or be otherwise authorized by OHCS</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Immediately notify us of any unauthorized account access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            <p className={cn('mt-4', theme.textMuted)}>
              We reserve the right to suspend or terminate accounts that violate these Terms or for any other reason
              at our discretion.
            </p>
          </Section>

          <Section icon={CheckCircle} title="Acceptable Use" delay={0.3} isDark={isDark}>
            <p className={theme.textMuted}>
              You agree to use the Platform only for lawful purposes and in accordance with these Terms.
              Acceptable uses include:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li>Accessing educational materials and documents for professional development</li>
              <li>Participating in courses and learning activities</li>
              <li>Engaging in constructive discussions in forums and chat</li>
              <li>Purchasing educational materials through the marketplace</li>
              <li>Using AI-powered tools to analyze and understand documents</li>
              <li>Collaborating with colleagues on research and projects</li>
            </ul>
          </Section>

          <Section icon={XCircle} title="Prohibited Conduct" delay={0.4} isDark={isDark}>
            <p className={theme.textMuted}>
              You must NOT:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li><strong>Share credentials:</strong> Share your login credentials with unauthorized persons</li>
              <li><strong>Distribute content:</strong> Redistribute, sell, or publicly share restricted documents or materials</li>
              <li><strong>Harass others:</strong> Engage in harassment, bullying, or discriminatory behavior</li>
              <li><strong>Post harmful content:</strong> Upload malware, viruses, or harmful code</li>
              <li><strong>Impersonate:</strong> Impersonate other users or OHCS personnel</li>
              <li><strong>Bypass security:</strong> Attempt to circumvent security measures or access restrictions</li>
              <li><strong>Scrape data:</strong> Use automated tools to scrape or extract data</li>
              <li><strong>Commercial exploitation:</strong> Use the Platform for unauthorized commercial purposes</li>
              <li><strong>Violate laws:</strong> Engage in any activity that violates applicable laws of Ghana</li>
            </ul>
          </Section>

          <Section icon={BookOpen} title="Content & Documents" delay={0.5} isDark={isDark}>
            <p className={theme.textMuted}>
              The Platform provides access to various types of content:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li><strong>Official Documents:</strong> Government policies, circulars, and directives for official use only</li>
              <li><strong>Educational Materials:</strong> Training resources, courses, and learning content</li>
              <li><strong>Research Papers:</strong> Academic and research documents contributed by users</li>
              <li><strong>User-Generated Content:</strong> Forum posts, comments, and discussions</li>
            </ul>
            <p className={cn('mt-4', theme.textMuted)}>
              Access levels are determined by your role and permissions. You must respect these access restrictions
              and use content only for its intended purpose.
            </p>
          </Section>

          <Section icon={ShoppingBag} title="Marketplace Terms" delay={0.6} isDark={isDark}>
            <p className={theme.textMuted}>
              The Platform includes a marketplace for educational materials. When using the marketplace:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li>All transactions are processed securely through our payment partner (Paystack)</li>
              <li>Prices are displayed in Ghana Cedis (GHS)</li>
              <li>Digital products are non-refundable once accessed or downloaded</li>
              <li>Sellers must provide accurate product descriptions and deliver as promised</li>
              <li>OHCS reserves the right to remove products that violate our guidelines</li>
              <li>A service fee may apply to marketplace transactions</li>
            </ul>
          </Section>

          <Section icon={MessageSquare} title="Community Guidelines" delay={0.7} isDark={isDark}>
            <p className={theme.textMuted}>
              When participating in forums, chat, and community features:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li>Be respectful and professional in all interactions</li>
              <li>Stay on topic and contribute constructively</li>
              <li>Do not share confidential or classified information</li>
              <li>Report inappropriate content or behavior to moderators</li>
              <li>Accept moderation decisions made by OHCS administrators</li>
            </ul>
            <p className={cn('mt-4', theme.textMuted)}>
              We reserve the right to remove content and suspend users who violate these guidelines.
            </p>
          </Section>

          <Section icon={Copyright} title="Intellectual Property" delay={0.8} isDark={isDark}>
            <p className={theme.textMuted}>
              All content on the Platform is protected by intellectual property laws:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li><strong>OHCS Content:</strong> Platform design, logos, and official documents are owned by OHCS and the Government of Ghana</li>
              <li><strong>User Content:</strong> You retain ownership of content you create but grant OHCS a license to host and display it</li>
              <li><strong>Third-Party Content:</strong> Some materials may be subject to third-party copyrights and licenses</li>
            </ul>
            <p className={cn('mt-4', theme.textMuted)}>
              You may not reproduce, distribute, or create derivative works without proper authorization.
            </p>
          </Section>

          <Section icon={ShieldAlert} title="Disclaimer of Warranties" delay={0.9} isDark={isDark}>
            <p className={theme.textMuted}>
              The Platform is provided "as is" and "as available" without warranties of any kind, either express
              or implied. We do not guarantee:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li>Uninterrupted or error-free service</li>
              <li>Accuracy or completeness of all content</li>
              <li>Security of data transmission over the internet</li>
              <li>Compatibility with all devices or browsers</li>
            </ul>
            <p className={cn('mt-4', theme.textMuted)}>
              While we strive to provide accurate information, AI-generated summaries and analyses should be
              verified against original sources for critical decisions.
            </p>
          </Section>

          <Section icon={AlertTriangle} title="Limitation of Liability" delay={1.0} isDark={isDark}>
            <p className={theme.textMuted}>
              To the fullest extent permitted by law, OHCS and its affiliates shall not be liable for:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li>Indirect, incidental, special, or consequential damages</li>
              <li>Loss of data, revenue, or profits</li>
              <li>Service interruptions or security breaches beyond our control</li>
              <li>Actions of third-party users or service providers</li>
              <li>Reliance on information provided through the Platform</li>
            </ul>
          </Section>

          <Section icon={Gavel} title="Governing Law" delay={1.1} isDark={isDark}>
            <p className={theme.textMuted}>
              These Terms are governed by the laws of the Republic of Ghana. Any disputes arising from
              the use of the Platform shall be subject to the exclusive jurisdiction of the courts of Ghana.
            </p>
            <p className={cn('mt-4', theme.textMuted)}>
              If any provision of these Terms is found to be unenforceable, the remaining provisions
              shall continue in full force and effect.
            </p>
          </Section>

          <Section icon={Ban} title="Termination" delay={1.2} isDark={isDark}>
            <p className={theme.textMuted}>
              We may suspend or terminate your access to the Platform:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li>For violation of these Terms</li>
              <li>Upon termination of your employment with the Civil Service</li>
              <li>For extended periods of inactivity</li>
              <li>At our discretion for any other reason</li>
            </ul>
            <p className={cn('mt-4', theme.textMuted)}>
              Upon termination, your right to use the Platform ceases immediately. Provisions that by
              their nature should survive termination shall remain in effect.
            </p>
          </Section>

          <Section icon={HelpCircle} title="Contact & Support" delay={1.3} isDark={isDark}>
            <p className={theme.textMuted}>
              For questions about these Terms or Platform support:
            </p>
            <div className={cn('mt-4 space-y-2', theme.textMuted)}>
              <p><strong>Office of the Head of Civil Service</strong></p>
              <p>Email: support@ohcs.gov.gh</p>
              <p>Legal: legal@ohcs.gov.gh</p>
              <p>Address: State House, Accra, Ghana</p>
            </div>
          </Section>

        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8"
        style={{ borderTop: `1px solid ${theme.cardBorder}` }}
      >
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #006B3F, #004d2d)' }}
              >
                <Library className="w-4 h-4 text-secondary-400" />
              </div>
              <span className={cn('font-heading font-bold text-sm', isDark ? 'text-amber-50' : 'text-slate-900')}>
                OHCS E-Library
              </span>
            </div>

            <div className="flex items-center gap-6">
              <Link
                to="/privacy"
                className={cn(
                  'text-sm transition-colors',
                  isDark ? 'text-amber-50/60 hover:text-amber-50' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Privacy Policy
              </Link>
              <Link
                to="/"
                className={cn(
                  'text-sm transition-colors',
                  isDark ? 'text-amber-50/60 hover:text-amber-50' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Home
              </Link>
            </div>

            <div className="flex h-1 w-16 rounded-full overflow-hidden">
              <div className="w-1/3 bg-accent-500" />
              <div className="w-1/3 bg-secondary-500" />
              <div className="w-1/3 bg-primary-500" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
