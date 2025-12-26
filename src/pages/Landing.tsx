import { useRef, useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Book,
  BookOpen,
  Library,
  Users,
  FileText,
  GraduationCap,
  Building2,
  Search,
  Sparkles,
  Star,
  ArrowRight,
  ChevronDown,
  X,
  Bookmark,
  ScrollText,
  Lightbulb,
  Award,
  Shield,
  Sun,
  Moon,
  Brain,
  Cpu,
  Zap,
  MessageSquare,
  Bot,
  Wand2,
  Mail,
  Lock,
  BadgeCheck,
  User,
  Briefcase,
  AlertCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useThemeStore, useEffectiveTheme } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/shared/Toast';
import {
  loginSchema,
  staffIdLoginSchema,
  registerSchema,
  getPasswordStrength,
  type LoginFormData,
  type StaffIdLoginFormData,
  type RegisterFormData,
} from '@/utils/validators';

// ============================================================================
// THEME COLORS
// ============================================================================
const themes = {
  dark: {
    bg: 'linear-gradient(180deg, #1a1510 0%, #0f0d0a 50%, #1a1510 100%)',
    text: 'text-amber-50',
    textMuted: 'text-amber-50/60',
    textFaint: 'text-amber-50/40',
    textGhost: 'text-amber-50/20',
    cardBg: 'rgba(245, 240, 230, 0.06)',
    cardBorder: 'rgba(245, 240, 230, 0.1)',
    navBg: 'rgba(26, 21, 16, 0.95)',
    glowGold: 'rgba(252, 209, 22, 0.08)',
    glowGreen: 'rgba(0, 107, 63, 0.1)',
  },
  light: {
    bg: 'linear-gradient(180deg, #faf8f5 0%, #f5f0e8 50%, #faf8f5 100%)',
    text: 'text-surface-900',
    textMuted: 'text-surface-600',
    textFaint: 'text-surface-500',
    textGhost: 'text-surface-400',
    cardBg: 'rgba(0, 107, 63, 0.04)',
    cardBorder: 'rgba(0, 107, 63, 0.15)',
    navBg: 'rgba(250, 248, 245, 0.95)',
    glowGold: 'rgba(252, 209, 22, 0.15)',
    glowGreen: 'rgba(0, 107, 63, 0.08)',
  },
};

// ============================================================================
// AI NEURAL NETWORK ANIMATION
// ============================================================================
function AINetworkAnimation({ isDark }: { isDark: boolean }) {
  const nodes = Array.from({ length: 8 }, (_, i) => ({
    x: 15 + (i % 4) * 25,
    y: 20 + Math.floor(i / 4) * 60,
    delay: i * 0.2,
  }));

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100">
      {/* Connection lines */}
      {nodes.map((node, i) =>
        nodes.slice(i + 1).map((target, j) => (
          <motion.line
            key={`${i}-${j}`}
            x1={node.x}
            y1={node.y}
            x2={target.x}
            y2={target.y}
            stroke={isDark ? '#FCD116' : '#006B3F'}
            strokeWidth="0.3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0.1, 0.4, 0.1] }}
            transition={{
              pathLength: { duration: 2, delay: node.delay },
              opacity: { duration: 3, repeat: Infinity, delay: node.delay },
            }}
          />
        ))
      )}
      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.circle
          key={i}
          cx={node.x}
          cy={node.y}
          r="2"
          fill={isDark ? '#FCD116' : '#006B3F'}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{
            scale: { duration: 2, repeat: Infinity, delay: node.delay },
          }}
        />
      ))}
    </svg>
  );
}

// ============================================================================
// FLOATING BOOK COMPONENT
// ============================================================================
function FloatingBook({
  delay = 0,
  duration = 20,
  style,
  size = 'md',
  color = 'primary',
  isDark = true,
}: {
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'gold';
  isDark?: boolean;
}) {
  const sizes = {
    sm: { width: 30, height: 40, spine: 6 },
    md: { width: 45, height: 60, spine: 8 },
    lg: { width: 60, height: 80, spine: 10 },
  };

  const colors = {
    primary: { cover: '#006B3F', spine: '#004d2d', pages: '#f5f0e6' },
    secondary: { cover: '#1a365d', spine: '#0f2340', pages: '#f5f0e6' },
    accent: { cover: '#CE1126', spine: '#a00d1e', pages: '#f5f0e6' },
    gold: { cover: '#b8860b', spine: '#8b6508', pages: '#f5f0e6' },
  };

  const s = sizes[size];
  const c = colors[color];

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={style}
      initial={{ opacity: 0, y: 50 }}
      animate={{
        opacity: isDark ? [0.4, 0.7, 0.4] : [0.3, 0.5, 0.3],
        y: [0, -30, 0],
        rotateY: [0, 10, -10, 0],
        rotateZ: [-5, 5, -5],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      <div className="relative" style={{ width: s.width, height: s.height, perspective: '200px' }}>
        <div
          className="absolute left-0 top-0 h-full rounded-l-sm"
          style={{
            width: s.spine,
            background: `linear-gradient(90deg, ${c.spine}, ${c.cover})`,
            transform: 'rotateY(-30deg)',
            transformOrigin: 'right',
          }}
        />
        <div
          className="absolute h-full rounded-r-sm shadow-lg"
          style={{
            left: s.spine - 2,
            width: s.width - s.spine,
            background: c.cover,
            boxShadow: '2px 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="absolute top-2 left-2 right-2 h-[1px]"
            style={{ background: 'rgba(252, 209, 22, 0.5)' }}
          />
          <div
            className="absolute bottom-2 left-2 right-2 h-[1px]"
            style={{ background: 'rgba(252, 209, 22, 0.5)' }}
          />
        </div>
        <div
          className="absolute right-0 h-[90%] top-[5%] rounded-r-sm"
          style={{
            width: 4,
            background: `repeating-linear-gradient(0deg, ${c.pages} 0px, ${c.pages} 1px, #e5e0d6 1px, #e5e0d6 2px)`,
          }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// AI-POWERED OPEN BOOK HERO
// ============================================================================
function OpenBookHero({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      className="relative w-[400px] h-[280px] mx-auto"
      initial={{ opacity: 0, scale: 0.8, rotateX: 30 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ duration: 1.2, delay: 0.3, type: 'spring' }}
      style={{ perspective: '1000px' }}
    >
      {/* AI glow effect underneath */}
      <motion.div
        className="absolute inset-0 blur-3xl"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          background: `radial-gradient(ellipse at center, ${isDark ? 'rgba(252, 209, 22, 0.4)' : 'rgba(0, 107, 63, 0.3)'} 0%, transparent 70%)`,
        }}
      />

      {/* AI brain icon floating above */}
      <motion.div
        className="absolute -top-8 left-1/2 -translate-x-1/2 z-10"
        animate={{
          y: [0, -8, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.3), rgba(252, 209, 22, 0.1))'
              : 'linear-gradient(135deg, rgba(0, 107, 63, 0.2), rgba(0, 107, 63, 0.1))',
            boxShadow: isDark
              ? '0 0 30px rgba(252, 209, 22, 0.4)'
              : '0 0 30px rgba(0, 107, 63, 0.3)',
            border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.3)' : 'rgba(0, 107, 63, 0.3)'}`,
          }}
        >
          <Brain className={cn('w-7 h-7', isDark ? 'text-secondary-400' : 'text-primary-600')} />
        </div>
      </motion.div>

      {/* Book shadow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[350px] h-[20px] rounded-full blur-xl"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />

      {/* Left page */}
      <motion.div
        className="absolute left-[10%] top-[10%] w-[42%] h-[80%] origin-right"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: -15 }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{
          background: isDark
            ? 'linear-gradient(90deg, #e8e0d0 0%, #f5f0e6 50%, #ebe5d8 100%)'
            : 'linear-gradient(90deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)',
          borderRadius: '4px 0 0 4px',
          boxShadow: '-5px 5px 20px rgba(0,0,0,0.2)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute inset-4 flex flex-col gap-2">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="h-[2px] rounded-full"
              style={{
                background: 'rgba(0,0,0,0.08)',
                width: `${60 + Math.random() * 35}%`,
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8 + i * 0.05 }}
            />
          ))}
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <Cpu className="w-10 h-10 text-primary-600" />
        </div>
      </motion.div>

      {/* Right page with AI sparkles */}
      <motion.div
        className="absolute right-[10%] top-[10%] w-[42%] h-[80%] origin-left"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 15 }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{
          background: isDark
            ? 'linear-gradient(270deg, #e8e0d0 0%, #f5f0e6 50%, #ebe5d8 100%)'
            : 'linear-gradient(270deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)',
          borderRadius: '0 4px 4px 0',
          boxShadow: '5px 5px 20px rgba(0,0,0,0.2)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute inset-4 flex flex-col gap-2">
          <motion.div
            className="h-4 w-3/4 rounded"
            style={{ background: isDark ? 'rgba(0, 107, 63, 0.2)' : 'rgba(0, 107, 63, 0.15)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          />
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="h-[2px] rounded-full"
              style={{
                background: 'rgba(0,0,0,0.08)',
                width: `${70 + Math.random() * 25}%`,
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1 + i * 0.05 }}
            />
          ))}
        </div>
        {/* AI sparkle */}
        <motion.div
          className="absolute top-3 right-3"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ rotate: { duration: 4, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}
        >
          <Sparkles className="w-5 h-5 text-secondary-500" />
        </motion.div>
        {/* Bookmark */}
        <motion.div
          className="absolute -top-2 right-8 w-4 h-20 rounded-b"
          style={{ background: 'linear-gradient(180deg, #CE1126, #a00d1e)' }}
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          transition={{ delay: 1.2, type: 'spring' }}
        />
      </motion.div>

      {/* Center spine glow */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-[8%] w-[4px] h-[84%]"
        animate={{
          boxShadow: isDark
            ? ['0 0 10px rgba(252, 209, 22, 0.3)', '0 0 25px rgba(252, 209, 22, 0.6)', '0 0 10px rgba(252, 209, 22, 0.3)']
            : ['0 0 10px rgba(0, 107, 63, 0.2)', '0 0 20px rgba(0, 107, 63, 0.4)', '0 0 10px rgba(0, 107, 63, 0.2)'],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          background: isDark
            ? 'linear-gradient(180deg, rgba(252, 209, 22, 0.6), rgba(252, 209, 22, 0.2))'
            : 'linear-gradient(180deg, rgba(0, 107, 63, 0.4), rgba(0, 107, 63, 0.15))',
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// ANIMATED COUNTER
// ============================================================================
function AnimatedCounter({ value, suffix = '', duration = 2 }: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const step = Math.max(1, Math.ceil(end / 60));
      const timer = setInterval(() => {
        start += step;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(start);
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return <span ref={ref}>{displayValue.toLocaleString()}{suffix}</span>;
}

// ============================================================================
// FEATURE CARD
// ============================================================================
function FeatureCard({ feature, index, isDark }: { feature: typeof features[0]; index: number; isDark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const theme = isDark ? themes.dark : themes.light;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative"
    >
      <div
        className="relative p-8 rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${theme.cardBg} 0%, transparent 100%)`,
          border: `1px solid ${theme.cardBorder}`,
        }}
      >
        {/* AI indicator for AI features */}
        {feature.isAI && (
          <motion.div
            className="absolute top-3 right-3"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: isDark ? 'rgba(252, 209, 22, 0.15)' : 'rgba(0, 107, 63, 0.1)',
                border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.3)' : 'rgba(0, 107, 63, 0.2)'}`,
              }}
            >
              <Sparkles className={cn('w-4 h-4', isDark ? 'text-secondary-400' : 'text-primary-600')} />
            </div>
          </motion.div>
        )}

        {/* Icon */}
        <div className="relative w-14 h-14 mb-5">
          <div
            className="absolute inset-0 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #006B3F, #FCD116)' }}
          />
          <div className="relative w-full h-full rounded-xl flex items-center justify-center border border-primary-500/20">
            <feature.icon className={cn('w-7 h-7', isDark ? 'text-secondary-400' : 'text-primary-600')} />
          </div>
        </div>

        {/* Content */}
        <h3 className={cn(
          'text-lg font-bold mb-2 transition-colors font-heading',
          isDark ? 'text-amber-50/90 group-hover:text-secondary-300' : 'text-surface-900 group-hover:text-primary-600'
        )}>
          {feature.title}
        </h3>
        <p className={cn('text-sm leading-relaxed', isDark ? 'text-amber-50/50' : 'text-surface-600')}>
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// AUTH MODAL
// ============================================================================
function AuthModal({
  isOpen,
  onClose,
  mode,
  setMode,
  isDark,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  setMode: (mode: 'login' | 'register') => void;
  isDark: boolean;
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container - Centers the modal and handles scrolling */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className={cn(
                  'relative w-full rounded-2xl shadow-2xl',
                  mode === 'register' ? 'max-w-lg' : 'max-w-md',
                  isDark ? 'dark' : ''
                )}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: isDark
                    ? 'linear-gradient(145deg, #1f1a15 0%, #171310 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #faf8f5 100%)',
                  border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.12)' : 'rgba(0, 107, 63, 0.15)'}`,
                  boxShadow: isDark
                    ? '0 0 100px rgba(252, 209, 22, 0.08), 0 30px 60px rgba(0, 0, 0, 0.6)'
                    : '0 0 100px rgba(0, 107, 63, 0.08), 0 30px 60px rgba(0, 0, 0, 0.12)',
                }}
              >
                {/* Ghana flag stripe at top */}
                <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl overflow-hidden flex">
                  <div className="flex-1 bg-accent-500" />
                  <div className="flex-1 bg-secondary-500" />
                  <div className="flex-1 bg-primary-500" />
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className={cn(
                    'absolute top-4 right-4 z-10 p-2 rounded-full transition-all duration-200',
                    isDark
                      ? 'text-amber-50/50 hover:text-amber-50 hover:bg-white/10'
                      : 'text-surface-400 hover:text-surface-700 hover:bg-black/5'
                  )}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Modal Header */}
                <div className="pt-8 pb-4 px-6 sm:px-8 text-center">
                  {/* Logo */}
                  <div className="flex justify-center mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
                        boxShadow: '0 4px 20px rgba(0, 107, 63, 0.3)',
                      }}
                    >
                      <Library className="w-7 h-7 text-secondary-400" />
                    </div>
                  </div>

                  <h2 className={cn(
                    'text-2xl font-heading font-bold',
                    isDark ? 'text-amber-50' : 'text-surface-900'
                  )}>
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className={cn(
                    'mt-1.5 text-sm',
                    isDark ? 'text-amber-50/60' : 'text-surface-500'
                  )}>
                    {mode === 'login'
                      ? 'Sign in to your OHCS E-Library account'
                      : 'Join the AI-powered knowledge platform'}
                  </p>
                </div>

                {/* Form Content */}
                <div className="px-6 sm:px-8 pb-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {mode === 'login' ? (
                        <LoginFormContent isDark={isDark} onClose={onClose} />
                      ) : (
                        <RegisterFormContent isDark={isDark} onClose={onClose} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer - Switch mode */}
                <div
                  className={cn(
                    'px-6 sm:px-8 py-4 text-center rounded-b-2xl',
                    isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'
                  )}
                  style={{
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  }}
                >
                  <p className={cn('text-sm', isDark ? 'text-amber-50/50' : 'text-surface-500')}>
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      className={cn(
                        'font-semibold transition-colors',
                        isDark
                          ? 'text-secondary-400 hover:text-secondary-300'
                          : 'text-primary-600 hover:text-primary-700'
                      )}
                    >
                      {mode === 'login' ? 'Create one' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// LOGIN FORM CONTENT (for modal)
// ============================================================================
function LoginFormContent({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'email' | 'staffId'>('email');

  const emailForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const staffIdForm = useForm<StaffIdLoginFormData>({
    resolver: zodResolver(staffIdLoginSchema),
    defaultValues: { staffId: '', password: '', rememberMe: false },
  });

  const onEmailSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      await login(data);
      toast.success('Welcome back!', 'You have successfully signed in.');
      onClose();
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      setServerError(message);
    }
  };

  const onStaffIdSubmit = async (data: StaffIdLoginFormData) => {
    try {
      setServerError(null);
      await login({
        email: `staff-${data.staffId}@internal.gov.gh`,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      toast.success('Welcome back!', 'You have successfully signed in.');
      onClose();
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      setServerError(message);
    }
  };

  const inputStyles = cn(
    'w-full h-11 px-4 pl-11 rounded-lg border text-sm transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    isDark
      ? 'bg-white/5 border-white/10 text-amber-50 placeholder:text-amber-50/30 focus:border-secondary-500/50 focus:ring-secondary-500/20'
      : 'bg-white border-surface-200 text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-primary-500/20'
  );

  const labelStyles = cn(
    'block text-sm font-medium mb-1.5',
    isDark ? 'text-amber-50/80' : 'text-surface-700'
  );

  const iconStyles = cn(
    'absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5',
    isDark ? 'text-amber-50/40' : 'text-surface-400'
  );

  return (
    <div className="space-y-5">
      {/* Login Mode Tabs */}
      <div
        className="flex p-1 rounded-lg"
        style={{
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        }}
      >
        {(['email', 'staffId'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setLoginMode(m);
              setServerError(null);
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all',
              loginMode === m
                ? isDark
                  ? 'bg-white/10 text-secondary-400 shadow-sm'
                  : 'bg-white text-primary-600 shadow-sm'
                : isDark
                  ? 'text-amber-50/50 hover:text-amber-50/80'
                  : 'text-surface-500 hover:text-surface-700'
            )}
          >
            {m === 'email' ? <Mail className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
            {m === 'email' ? 'Email' : 'Staff ID'}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {serverError && (
        <div
          className="p-3 rounded-lg flex items-start gap-2.5"
          style={{
            background: isDark ? 'rgba(206, 17, 38, 0.15)' : 'rgba(206, 17, 38, 0.08)',
            border: '1px solid rgba(206, 17, 38, 0.3)',
          }}
        >
          <AlertCircle className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error-500">{serverError}</p>
        </div>
      )}

      {/* Email Form */}
      {loginMode === 'email' && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <div>
            <label className={labelStyles}>Email Address</label>
            <div className="relative">
              <Mail className={iconStyles} />
              <input
                type="email"
                placeholder="yourname@agency.gov.gh"
                className={inputStyles}
                {...emailForm.register('email')}
              />
            </div>
            {emailForm.formState.errors.email && (
              <p className="mt-1 text-xs text-error-500">{emailForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className={labelStyles}>Password</label>
            <div className="relative">
              <Lock className={iconStyles} />
              <input
                type="password"
                placeholder="Enter your password"
                className={inputStyles}
                {...emailForm.register('password')}
              />
            </div>
            {emailForm.formState.errors.password && (
              <p className="mt-1 text-xs text-error-500">{emailForm.formState.errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-surface-300 text-primary-600"
                {...emailForm.register('rememberMe')}
              />
              <span className={cn('text-sm', isDark ? 'text-amber-50/60' : 'text-surface-600')}>
                Remember me
              </span>
            </label>
            <button
              type="button"
              className={cn(
                'text-sm font-medium',
                isDark ? 'text-secondary-400 hover:text-secondary-300' : 'text-primary-600 hover:text-primary-700'
              )}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            className="w-full h-11 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
              boxShadow: '0 4px 15px rgba(0, 107, 63, 0.3)',
            }}
          >
            {emailForm.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      )}

      {/* Staff ID Form */}
      {loginMode === 'staffId' && (
        <form onSubmit={staffIdForm.handleSubmit(onStaffIdSubmit)} className="space-y-4">
          <div>
            <label className={labelStyles}>Staff ID</label>
            <div className="relative">
              <BadgeCheck className={iconStyles} />
              <input
                type="text"
                placeholder="e.g. 123456"
                className={inputStyles}
                {...staffIdForm.register('staffId')}
              />
            </div>
            {staffIdForm.formState.errors.staffId && (
              <p className="mt-1 text-xs text-error-500">{staffIdForm.formState.errors.staffId.message}</p>
            )}
          </div>

          <div>
            <label className={labelStyles}>Password</label>
            <div className="relative">
              <Lock className={iconStyles} />
              <input
                type="password"
                placeholder="Enter your password"
                className={inputStyles}
                {...staffIdForm.register('password')}
              />
            </div>
            {staffIdForm.formState.errors.password && (
              <p className="mt-1 text-xs text-error-500">{staffIdForm.formState.errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-surface-300 text-primary-600"
                {...staffIdForm.register('rememberMe')}
              />
              <span className={cn('text-sm', isDark ? 'text-amber-50/60' : 'text-surface-600')}>
                Remember me
              </span>
            </label>
            <button
              type="button"
              className={cn(
                'text-sm font-medium',
                isDark ? 'text-secondary-400 hover:text-secondary-300' : 'text-primary-600 hover:text-primary-700'
              )}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={staffIdForm.formState.isSubmitting}
            className="w-full h-11 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
              boxShadow: '0 4px 15px rgba(0, 107, 63, 0.3)',
            }}
          >
            {staffIdForm.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      )}
    </div>
  );
}

// ============================================================================
// REGISTER FORM CONTENT (for modal)
// ============================================================================
const mdaOptions = [
  { value: '1', label: 'Ministry of Finance' },
  { value: '2', label: 'Ministry of Health' },
  { value: '3', label: 'Ministry of Education' },
  { value: '4', label: 'Ministry of Interior' },
  { value: '5', label: 'Ministry of Foreign Affairs' },
  { value: '6', label: 'Ministry of Trade and Industry' },
  { value: '7', label: 'Ghana Revenue Authority' },
  { value: '8', label: 'Office of the Head of Civil Service' },
  { value: '9', label: 'Public Services Commission' },
  { value: '10', label: 'Electoral Commission' },
];

function RegisterFormContent({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [mdaOpen, setMdaOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '', password: '', confirmPassword: '', staffId: '',
      firstName: '', lastName: '', mdaId: '', department: '', title: '',
    },
  });

  const selectedMda = watch('mdaId');
  const passwordStrength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      await registerUser(data);
      toast.success('Registration successful!', 'Please check your email to verify your account.');
      onClose();
      navigate('/verify-email', { state: { email: data.email } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setServerError(message);
    }
  };

  const inputStyles = cn(
    'w-full h-11 px-4 rounded-lg border text-sm transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    isDark
      ? 'bg-white/5 border-white/10 text-amber-50 placeholder:text-amber-50/30 focus:border-secondary-500/50 focus:ring-secondary-500/20'
      : 'bg-white border-surface-200 text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-primary-500/20'
  );

  const inputWithIconStyles = cn(inputStyles, 'pl-11');

  const labelStyles = cn(
    'block text-sm font-medium mb-1.5',
    isDark ? 'text-amber-50/80' : 'text-surface-700'
  );

  const iconStyles = cn(
    'absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5',
    isDark ? 'text-amber-50/40' : 'text-surface-400'
  );

  const passwordRequirements = [
    { met: passwordValue.length >= 12, text: '12+ chars' },
    { met: /[A-Z]/.test(passwordValue), text: 'Uppercase' },
    { met: /[a-z]/.test(passwordValue), text: 'Lowercase' },
    { met: /[0-9]/.test(passwordValue), text: 'Number' },
    { met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordValue), text: 'Special' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error Display */}
      {serverError && (
        <div
          className="p-3 rounded-lg flex items-start gap-2.5"
          style={{
            background: isDark ? 'rgba(206, 17, 38, 0.15)' : 'rgba(206, 17, 38, 0.08)',
            border: '1px solid rgba(206, 17, 38, 0.3)',
          }}
        >
          <AlertCircle className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error-500">{serverError}</p>
        </div>
      )}

      {/* Name Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelStyles}>First Name</label>
          <div className="relative">
            <User className={iconStyles} />
            <input placeholder="John" className={inputWithIconStyles} {...register('firstName')} />
          </div>
          {errors.firstName && <p className="mt-1 text-xs text-error-500">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className={labelStyles}>Last Name</label>
          <input placeholder="Doe" className={inputStyles} {...register('lastName')} />
          {errors.lastName && <p className="mt-1 text-xs text-error-500">{errors.lastName.message}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className={labelStyles}>Email Address</label>
        <div className="relative">
          <Mail className={iconStyles} />
          <input type="email" placeholder="yourname@agency.gov.gh" className={inputWithIconStyles} {...register('email')} />
        </div>
        <p className={cn('mt-1 text-xs', isDark ? 'text-amber-50/40' : 'text-surface-400')}>Must be a .gov.gh email</p>
        {errors.email && <p className="mt-1 text-xs text-error-500">{errors.email.message}</p>}
      </div>

      {/* Staff ID */}
      <div>
        <label className={labelStyles}>Staff ID</label>
        <div className="relative">
          <BadgeCheck className={iconStyles} />
          <input placeholder="e.g. 123456" className={inputWithIconStyles} {...register('staffId')} />
        </div>
        {errors.staffId && <p className="mt-1 text-xs text-error-500">{errors.staffId.message}</p>}
      </div>

      {/* MDA Select */}
      <div className="relative">
        <label className={labelStyles}>Ministry / Department / Agency</label>
        <button
          type="button"
          onClick={() => setMdaOpen(!mdaOpen)}
          className={cn(
            inputStyles,
            'flex items-center justify-between text-left',
            !selectedMda && (isDark ? 'text-amber-50/30' : 'text-surface-400')
          )}
        >
          <span className="truncate">
            {selectedMda ? mdaOptions.find(o => o.value === selectedMda)?.label : 'Select your MDA'}
          </span>
          <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform', mdaOpen && 'rotate-180')} />
        </button>
        {mdaOpen && (
          <div
            className="absolute z-20 w-full mt-1 rounded-lg shadow-xl max-h-48 overflow-auto"
            style={{
              background: isDark ? '#1f1a15' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            {mdaOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setValue('mdaId', option.value);
                  setMdaOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-sm text-left transition-colors',
                  selectedMda === option.value
                    ? isDark
                      ? 'bg-secondary-500/20 text-secondary-300'
                      : 'bg-primary-50 text-primary-700'
                    : isDark
                      ? 'text-amber-50/80 hover:bg-white/5'
                      : 'text-surface-700 hover:bg-surface-50'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        {errors.mdaId && <p className="mt-1 text-xs text-error-500">{errors.mdaId.message}</p>}
      </div>

      {/* Department & Title Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelStyles}>Directorate/Unit</label>
          <div className="relative">
            <Building2 className={iconStyles} />
            <input placeholder="e.g. IT Directorate" className={inputWithIconStyles} {...register('department')} />
          </div>
        </div>
        <div>
          <label className={labelStyles}>Job Title</label>
          <div className="relative">
            <Briefcase className={iconStyles} />
            <input placeholder="e.g. Senior Officer" className={inputWithIconStyles} {...register('title')} />
          </div>
        </div>
      </div>

      {/* Password */}
      <div>
        <label className={labelStyles}>Password</label>
        <div className="relative">
          <Lock className={iconStyles} />
          <input
            type="password"
            placeholder="Create a strong password"
            className={inputWithIconStyles}
            {...register('password', { onChange: (e) => setPasswordValue(e.target.value) })}
          />
        </div>
        {errors.password && <p className="mt-1 text-xs text-error-500">{errors.password.message}</p>}

        {/* Password strength */}
        {passwordValue && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('flex-1 h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-surface-200')}>
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    passwordStrength.color === 'error' && 'bg-error-500 w-1/4',
                    passwordStrength.color === 'warning' && 'bg-warning-500 w-2/4',
                    passwordStrength.color === 'info' && 'bg-info-500 w-3/4',
                    passwordStrength.color === 'success' && 'bg-success-500 w-full'
                  )}
                />
              </div>
              <span className={cn(
                'text-xs font-medium',
                passwordStrength.color === 'error' && 'text-error-500',
                passwordStrength.color === 'warning' && 'text-warning-500',
                passwordStrength.color === 'info' && 'text-info-500',
                passwordStrength.color === 'success' && 'text-success-500'
              )}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {passwordRequirements.map((req, i) => (
                <span
                  key={i}
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    req.met ? 'text-success-500' : isDark ? 'text-amber-50/30' : 'text-surface-400'
                  )}
                >
                  <Check className={cn('w-3 h-3', !req.met && 'opacity-40')} />
                  {req.text}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className={labelStyles}>Confirm Password</label>
        <div className="relative">
          <Lock className={iconStyles} />
          <input type="password" placeholder="Confirm your password" className={inputWithIconStyles} {...register('confirmPassword')} />
        </div>
        {errors.confirmPassword && <p className="mt-1 text-xs text-error-500">{errors.confirmPassword.message}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
          boxShadow: '0 4px 15px rgba(0, 107, 63, 0.3)',
        }}
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </button>

      {/* Terms */}
      <p className={cn('text-xs text-center', isDark ? 'text-amber-50/40' : 'text-surface-400')}>
        By creating an account, you agree to the OHCS{' '}
        <a href="#" className={isDark ? 'text-secondary-400' : 'text-primary-600'}>Terms</a>
        {' '}and{' '}
        <a href="#" className={isDark ? 'text-secondary-400' : 'text-primary-600'}>Privacy Policy</a>
      </p>
    </form>
  );
}

// ============================================================================
// DATA
// ============================================================================
const features = [
  {
    icon: Brain,
    title: 'AI-Powered Search',
    description: 'Find any document instantly with our intelligent AI that understands context, synonyms, and natural language queries.',
    isAI: true,
  },
  {
    icon: Wand2,
    title: 'Smart Summarization',
    description: 'Get instant AI-generated summaries of lengthy policy documents, reports, and circulars. Save hours of reading.',
    isAI: true,
  },
  {
    icon: Bot,
    title: 'AI Research Assistant',
    description: 'Ask questions in plain English and get accurate answers sourced from official documents with citations.',
    isAI: true,
  },
  {
    icon: BookOpen,
    title: 'Digital Document Library',
    description: 'Access thousands of policy documents, circulars, training materials, and institutional knowledge.',
    isAI: false,
  },
  {
    icon: GraduationCap,
    title: 'Personalized Learning',
    description: 'AI-curated training recommendations based on your role, interests, and career development goals.',
    isAI: true,
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption with role-based access control protecting sensitive government resources.',
    isAI: false,
  },
];

const stats = [
  { value: 20000, label: 'Civil Servants', suffix: '+', icon: Users },
  { value: 2500, label: 'Documents', suffix: '+', icon: FileText },
  { value: 150, label: 'Training Resources', suffix: '+', icon: GraduationCap },
  { value: 45, label: 'MDAs Connected', suffix: '', icon: Building2 },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Landing() {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login',
  });

  const { toggleTheme, initializeTheme } = useThemeStore();
  const effectiveTheme = useEffectiveTheme();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? themes.dark : themes.light;

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
  const parallaxY = useSpring(heroY, { stiffness: 100, damping: 30 });

  const openLogin = () => setAuthModal({ isOpen: true, mode: 'login' });
  const openRegister = () => setAuthModal({ isOpen: true, mode: 'register' });
  const closeAuth = () => setAuthModal({ ...authModal, isOpen: false });

  return (
    <div
      className={cn('min-h-screen overflow-x-hidden transition-colors duration-500', theme.text)}
      style={{ background: theme.bg }}
    >
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Ambient glows */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
          style={{ background: `radial-gradient(ellipse at center, ${theme.glowGold} 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px]"
          style={{ background: `radial-gradient(ellipse at center, ${theme.glowGreen} 0%, transparent 70%)` }}
        />

        {/* Floating books */}
        <FloatingBook delay={0} duration={15} style={{ top: '20%', left: '5%' }} size="md" color="primary" isDark={isDark} />
        <FloatingBook delay={2} duration={18} style={{ top: '30%', right: '8%' }} size="lg" color="secondary" isDark={isDark} />
        <FloatingBook delay={4} duration={20} style={{ top: '60%', left: '10%' }} size="sm" color="accent" isDark={isDark} />
        <FloatingBook delay={1} duration={16} style={{ top: '70%', right: '15%' }} size="md" color="gold" isDark={isDark} />
        <FloatingBook delay={3} duration={22} style={{ top: '45%', left: '3%' }} size="lg" color="primary" isDark={isDark} />
        <FloatingBook delay={5} duration={17} style={{ top: '25%', right: '3%' }} size="sm" color="secondary" isDark={isDark} />

        {/* AI Network animation in background */}
        <div className="absolute top-[15%] right-[5%] w-[300px] h-[200px]">
          <AINetworkAnimation isDark={isDark} />
        </div>
        <div className="absolute bottom-[20%] left-[8%] w-[250px] h-[180px] rotate-45">
          <AINetworkAnimation isDark={isDark} />
        </div>
      </div>

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div
          className="absolute inset-0 backdrop-blur-xl"
          style={{
            background: theme.navBg,
            borderBottom: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.1)' : 'rgba(0, 107, 63, 0.1)'}`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <motion.div
              className="relative w-11 h-11"
              whileHover={{ rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
                  boxShadow: '0 4px 15px rgba(0, 107, 63, 0.3)',
                }}
              />
              <div className="relative w-full h-full rounded-lg flex items-center justify-center">
                <Library className="w-6 h-6 text-secondary-400" />
              </div>
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={cn('font-heading font-bold text-lg', isDark ? 'text-amber-50' : 'text-surface-900')}>
                  OHCS E-Library
                </h1>
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded"
                  style={{
                    background: isDark ? 'rgba(252, 209, 22, 0.2)' : 'rgba(0, 107, 63, 0.1)',
                    color: isDark ? '#FCD116' : '#006B3F',
                  }}
                >
                  AI
                </span>
              </div>
              <div className="flex h-0.5 rounded-full overflow-hidden">
                <div className="w-1/3 bg-accent-500" />
                <div className="w-1/3 bg-secondary-500" />
                <div className="w-1/3 bg-primary-500" />
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className={cn(
                'p-2.5 rounded-lg transition-colors',
                isDark ? 'bg-white/5 hover:bg-white/10 text-amber-50' : 'bg-black/5 hover:bg-black/10 text-surface-700'
              )}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            <motion.button
              onClick={openLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'text-sm font-medium transition-colors px-4 py-2',
                isDark ? 'text-amber-50/70 hover:text-amber-50' : 'text-surface-600 hover:text-surface-900'
              )}
            >
              Sign In
            </motion.button>
            <motion.button
              onClick={openRegister}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative px-5 py-2.5 rounded-lg font-medium text-sm overflow-hidden group"
            >
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)' }}
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #007a47 0%, #005c35 100%)' }}
              />
              <span className="relative text-white flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </span>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20">
        <motion.div
          className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 text-center"
          style={{ opacity: heroOpacity, y: parallaxY }}
        >
          {/* AI Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.15) 0%, rgba(252, 209, 22, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(0, 107, 63, 0.1) 0%, rgba(0, 107, 63, 0.05) 100%)',
              border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.25)' : 'rgba(0, 107, 63, 0.2)'}`,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className={cn('w-4 h-4', isDark ? 'text-secondary-400' : 'text-primary-600')} />
            </motion.div>
            <span className={cn('text-sm font-medium', isDark ? 'text-secondary-300' : 'text-primary-700')}>
              Powered by Artificial Intelligence
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight"
          >
            <span className={isDark ? 'text-amber-50' : 'text-surface-900'}>The </span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(135deg, #FCD116 0%, #b8860b 50%, #FCD116 100%)'
                  : 'linear-gradient(135deg, #006B3F 0%, #004d2d 50%, #006B3F 100%)',
              }}
            >
              AI-Powered
            </span>
            <span className={isDark ? 'text-amber-50' : 'text-surface-900'}> Library</span>
            <br />
            <span className={isDark ? 'text-amber-50' : 'text-surface-900'}>for Ghana's Civil Service</span>
          </motion.h1>

          {/* Open book visualization */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="my-12"
          >
            <OpenBookHero isDark={isDark} />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={cn('text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed', theme.textMuted)}
          >
            <span className="text-primary-500 font-medium">Search intelligently</span>,{' '}
            <span className={cn('font-medium', isDark ? 'text-secondary-400' : 'text-secondary-600')}>get AI summaries</span>, and{' '}
            <span className="text-accent-500 font-medium">find answers instantly</span>{' '}
            — all in one secure platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <motion.button
              onClick={openRegister}
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(0, 107, 63, 0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 rounded-xl font-semibold text-base overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
                boxShadow: '0 4px 20px rgba(0, 107, 63, 0.3)',
              }}
            >
              <span className="flex items-center gap-2 text-white">
                <Brain className="w-5 h-5" />
                Start Exploring with AI
              </span>
            </motion.button>

            <motion.button
              onClick={openLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'px-8 py-4 rounded-xl font-semibold text-base transition-colors',
                isDark ? 'text-amber-50/80 hover:text-amber-50' : 'text-surface-700 hover:text-surface-900'
              )}
              style={{
                border: `1px solid ${isDark ? 'rgba(245, 240, 230, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(245, 240, 230, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              }}
            >
              Sign In to Continue
            </motion.button>
          </motion.div>

          {/* Trust indicator */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className={cn('mt-8 text-sm flex items-center justify-center gap-2', theme.textGhost)}
          >
            <Shield className="w-4 h-4" />
            Exclusively for .gov.gh email holders
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn('flex flex-col items-center gap-2', theme.textGhost)}
          >
            <span className="text-xs uppercase tracking-widest">Discover AI Features</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, transparent 0%, ${theme.glowGreen} 50%, transparent 100%)` }}
        />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.15) 0%, rgba(252, 209, 22, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(0, 107, 63, 0.1) 0%, rgba(0, 107, 63, 0.05) 100%)',
                    border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.2)' : 'rgba(0, 107, 63, 0.15)'}`,
                  }}
                >
                  <stat.icon className={cn('w-6 h-6', isDark ? 'text-secondary-400' : 'text-primary-600')} />
                </motion.div>
                <p className={cn('text-3xl sm:text-4xl font-bold mb-1', isDark ? 'text-amber-50' : 'text-surface-900')}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className={cn('text-sm font-medium', theme.textFaint)}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{
                background: isDark ? 'rgba(252, 209, 22, 0.1)' : 'rgba(0, 107, 63, 0.1)',
                border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.2)' : 'rgba(0, 107, 63, 0.2)'}`,
              }}
            >
              <Brain className={cn('w-3.5 h-3.5', isDark ? 'text-secondary-400' : 'text-primary-600')} />
              <span className={cn('text-xs font-medium', isDark ? 'text-secondary-300' : 'text-primary-700')}>
                AI-Powered Features
              </span>
            </div>
            <h2 className={cn('font-heading text-3xl lg:text-4xl font-bold mb-4', isDark ? 'text-amber-50' : 'text-surface-900')}>
              Intelligence Meets{' '}
              <span className={isDark ? 'text-secondary-400' : 'text-primary-600'}>Knowledge</span>
            </h2>
            <p className={theme.textMuted}>
              Our AI doesn't just search — it understands, summarizes, and helps you find answers faster than ever.
            </p>
          </motion.div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} isDark={isDark} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl p-10 lg:p-16 text-center overflow-hidden"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(0, 107, 63, 0.15) 0%, rgba(0, 77, 45, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(0, 107, 63, 0.08) 0%, rgba(0, 77, 45, 0.05) 100%)',
              border: `1px solid ${isDark ? 'rgba(0, 107, 63, 0.3)' : 'rgba(0, 107, 63, 0.2)'}`,
            }}
          >
            {/* Decorative icons */}
            <Brain className={cn('absolute top-6 left-6 w-8 h-8', isDark ? 'text-primary-500/20' : 'text-primary-500/15')} />
            <Sparkles className={cn('absolute bottom-6 right-6 w-8 h-8', isDark ? 'text-secondary-500/20' : 'text-secondary-500/15')} />
            <Bot className={cn('absolute top-6 right-6 w-6 h-6', isDark ? 'text-secondary-500/20' : 'text-secondary-500/15')} />

            {/* Glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, ${isDark ? 'rgba(252, 209, 22, 0.1)' : 'rgba(0, 107, 63, 0.08)'} 0%, transparent 70%)`,
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div
                className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.2) 0%, rgba(252, 209, 22, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(0, 107, 63, 0.15) 0%, rgba(0, 107, 63, 0.08) 100%)',
                  border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.3)' : 'rgba(0, 107, 63, 0.25)'}`,
                  boxShadow: isDark ? '0 0 30px rgba(252, 209, 22, 0.2)' : '0 0 30px rgba(0, 107, 63, 0.15)',
                }}
              >
                <Zap className={cn('w-8 h-8', isDark ? 'text-secondary-400' : 'text-primary-600')} />
              </div>

              <h2 className={cn('font-heading text-3xl lg:text-4xl font-bold mb-4', isDark ? 'text-amber-50' : 'text-surface-900')}>
                Ready to Experience AI-Powered Research?
              </h2>

              <p className={cn('text-lg max-w-xl mx-auto mb-8', theme.textMuted)}>
                Join thousands of civil servants using AI to find documents, get summaries, and work smarter.
              </p>

              <motion.button
                onClick={openRegister}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-xl font-bold text-lg"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #FCD116 0%, #b8860b 100%)'
                    : 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
                  color: isDark ? '#1a1510' : '#ffffff',
                  boxShadow: isDark ? '0 4px 25px rgba(252, 209, 22, 0.3)' : '0 4px 25px rgba(0, 107, 63, 0.3)',
                }}
              >
                Create Your Account
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative py-12"
        style={{ borderTop: `1px solid ${isDark ? 'rgba(245, 240, 230, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #006B3F, #004d2d)' }}
              >
                <Library className="w-5 h-5 text-secondary-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className={cn('font-heading font-bold text-sm', isDark ? 'text-amber-50' : 'text-surface-900')}>
                    OHCS E-Library
                  </p>
                  <span
                    className="px-1 py-0.5 text-[9px] font-bold rounded"
                    style={{
                      background: isDark ? 'rgba(252, 209, 22, 0.2)' : 'rgba(0, 107, 63, 0.1)',
                      color: isDark ? '#FCD116' : '#006B3F',
                    }}
                  >
                    AI
                  </span>
                </div>
                <p className={cn('text-xs', theme.textGhost)}>Office of the Head of Civil Service, Ghana</p>
              </div>
            </div>

            <div className="flex h-1 w-24 rounded-full overflow-hidden">
              <div className="w-1/3 bg-accent-500" />
              <div className="w-1/3 bg-secondary-500" />
              <div className="w-1/3 bg-primary-500" />
            </div>

            <p className={cn('text-xs', theme.textGhost)}>
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={closeAuth}
        mode={authModal.mode}
        setMode={(mode) => setAuthModal({ ...authModal, mode })}
        isDark={isDark}
      />
    </div>
  );
}
