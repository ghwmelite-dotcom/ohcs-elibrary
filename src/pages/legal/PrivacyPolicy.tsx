import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Library,
  Shield,
  Lock,
  Eye,
  Database,
  Users,
  Globe,
  Bell,
  Mail,
  ChevronLeft,
  FileText,
  Server,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Clock,
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

export function PrivacyPolicy() {
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
            <Shield className={cn('w-4 h-4', isDark ? 'text-secondary-400' : 'text-primary-600')} />
            <span className={cn('text-sm font-medium', isDark ? 'text-secondary-400' : 'text-primary-600')}>
              Your Privacy Matters
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn('text-4xl lg:text-5xl font-heading font-bold mb-6', isDark ? 'text-amber-50' : 'text-slate-900')}
          >
            Privacy Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn('text-lg max-w-2xl mx-auto', theme.textMuted)}
          >
            We are committed to protecting your privacy and ensuring the security of your personal information
            on the OHCS E-Library platform.
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

          <Section icon={Eye} title="Information We Collect" delay={0.1} isDark={isDark}>
            <p className={theme.textMuted}>
              We collect information to provide you with a personalized and efficient experience on the OHCS E-Library platform:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li><strong>Account Information:</strong> Name, email address, staff ID, department, and role when you register.</li>
              <li><strong>Usage Data:</strong> Documents accessed, search queries, reading history, and platform interactions.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers for security purposes.</li>
              <li><strong>Communication Data:</strong> Messages sent through forums, chat, and support channels.</li>
              <li><strong>Payment Information:</strong> Transaction details for marketplace purchases (processed securely via Paystack).</li>
            </ul>
          </Section>

          <Section icon={Database} title="How We Use Your Information" delay={0.2} isDark={isDark}>
            <p className={theme.textMuted}>
              Your information helps us deliver and improve our services:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li>Providing access to documents, courses, and learning materials</li>
              <li>Personalizing your experience with AI-powered recommendations</li>
              <li>Processing transactions and managing your account</li>
              <li>Sending important notifications about platform updates</li>
              <li>Analyzing usage patterns to improve our services</li>
              <li>Ensuring platform security and preventing fraud</li>
              <li>Complying with legal obligations and government policies</li>
            </ul>
          </Section>

          <Section icon={Lock} title="Data Security" delay={0.3} isDark={isDark}>
            <p className={theme.textMuted}>
              We implement robust security measures to protect your data:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li><strong>Encryption:</strong> All data is encrypted in transit using TLS/SSL and at rest using industry-standard encryption.</li>
              <li><strong>Access Controls:</strong> Role-based access ensures only authorized personnel can access sensitive data.</li>
              <li><strong>Regular Audits:</strong> We conduct security audits and vulnerability assessments.</li>
              <li><strong>Secure Infrastructure:</strong> Our platform is hosted on Cloudflare's secure global network.</li>
              <li><strong>Authentication:</strong> Secure JWT-based authentication protects your account.</li>
            </ul>
          </Section>

          <Section icon={Users} title="Information Sharing" delay={0.4} isDark={isDark}>
            <p className={theme.textMuted}>
              We do not sell your personal information. We may share data only in these circumstances:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li><strong>Service Providers:</strong> Trusted partners who assist in operating our platform (payment processors, email services).</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety.</li>
              <li><strong>Government Agencies:</strong> As required by Ghana's data protection laws and civil service regulations.</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information.</li>
            </ul>
          </Section>

          <Section icon={UserCheck} title="Your Rights" delay={0.5} isDark={isDark}>
            <p className={theme.textMuted}>
              You have the following rights regarding your personal data:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li><strong>Access:</strong> Request a copy of your personal data we hold.</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information.</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements).</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format.</li>
              <li><strong>Objection:</strong> Object to certain processing of your data.</li>
              <li><strong>Withdrawal:</strong> Withdraw consent for optional data processing.</li>
            </ul>
          </Section>

          <Section icon={Globe} title="Cookies and Tracking" delay={0.6} isDark={isDark}>
            <p className={theme.textMuted}>
              We use cookies and similar technologies to enhance your experience:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li><strong>Essential Cookies:</strong> Required for platform functionality and security.</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform.</li>
              <li><strong>Local Storage:</strong> Stores theme preferences and session data locally.</li>
            </ul>
            <p className={cn('mt-4', theme.textMuted)}>
              You can manage cookie preferences through your browser settings.
            </p>
          </Section>

          <Section icon={Server} title="Data Retention" delay={0.7} isDark={isDark}>
            <p className={theme.textMuted}>
              We retain your data for as long as necessary to provide our services:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li>Account data is retained while your account is active.</li>
              <li>Usage logs are retained for up to 2 years for analysis and security.</li>
              <li>Transaction records are kept for 7 years per financial regulations.</li>
              <li>Deleted account data is purged within 90 days, except where legally required.</li>
            </ul>
          </Section>

          <Section icon={Bell} title="Updates to This Policy" delay={0.8} isDark={isDark}>
            <p className={theme.textMuted}>
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements.
              We will notify you of significant changes through:
            </p>
            <ul className={cn('mt-4 space-y-2', theme.textMuted)}>
              <li>Email notifications to your registered address</li>
              <li>Prominent notices on the platform</li>
              <li>Updates to the "Last updated" date at the top of this policy</li>
            </ul>
          </Section>

          <Section icon={Mail} title="Contact Us" delay={0.9} isDark={isDark}>
            <p className={theme.textMuted}>
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <div className={cn('mt-4 space-y-2', theme.textMuted)}>
              <p><strong>Office of the Head of Civil Service</strong></p>
              <p>Email: privacy@ohcs.gov.gh</p>
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
                to="/terms"
                className={cn(
                  'text-sm transition-colors',
                  isDark ? 'text-amber-50/60 hover:text-amber-50' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Terms of Service
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
