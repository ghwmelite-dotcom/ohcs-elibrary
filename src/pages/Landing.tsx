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
  Network,
  BarChart3,
  Target,
  FileDown,
  Newspaper,
  Heart,
  MessagesSquare,
  UsersRound,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle2,
  Layout,
  Layers,
  ShieldCheck,
  Fingerprint,
  Eye,
  Bell,
  Compass,
  Activity,
  SearchCheck,
  KeyRound,
  Server,
  Play,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useThemeStore, useEffectiveTheme } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/shared/Toast';
import { ThemeToggleHint } from '@/components/shared/ThemeToggleHint';
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
    // Elegant darker cream background with subtle warmth
    bg: 'linear-gradient(180deg, #e8e4dc 0%, #d9d3c7 35%, #e5e0d6 65%, #ebe7df 100%)',
    // Crisp, bold text colors for maximum readability
    text: 'text-slate-900',
    textMuted: 'text-slate-700',
    textFaint: 'text-slate-600',
    textGhost: 'text-slate-500',
    // Frosted glass card effect with better visibility
    cardBg: 'rgba(255, 255, 255, 0.75)',
    cardBorder: 'rgba(0, 107, 63, 0.25)',
    // Semi-transparent nav with blur
    navBg: 'rgba(232, 228, 220, 0.92)',
    // Richer accent glows
    glowGold: 'rgba(252, 209, 22, 0.25)',
    glowGreen: 'rgba(0, 107, 63, 0.15)',
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
        className="relative p-8 rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${theme.cardBg} 0%, transparent 100%)`
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)',
          border: `1px solid ${isDark ? theme.cardBorder : 'rgba(0, 107, 63, 0.15)'}`,
          boxShadow: isDark
            ? 'none'
            : '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        }}
      >
        {/* Subtle inner glow for light mode */}
        {!isDark && (
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 107, 63, 0.03) 0%, rgba(252, 209, 22, 0.03) 100%)',
            }}
          />
        )}

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
                background: isDark ? 'rgba(252, 209, 22, 0.15)' : 'rgba(0, 107, 63, 0.12)',
                border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.3)' : 'rgba(0, 107, 63, 0.25)'}`,
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 107, 63, 0.1)',
              }}
            >
              <Sparkles className={cn('w-4 h-4', isDark ? 'text-secondary-400' : 'text-primary-600')} />
            </div>
          </motion.div>
        )}

        {/* Icon */}
        <div className="relative w-14 h-14 mb-5">
          <div
            className="absolute inset-0 rounded-xl transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #006B3F, #FCD116)',
              opacity: isDark ? 0.2 : 0.15,
            }}
          />
          <div
            className="relative w-full h-full rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{
              border: isDark ? '1px solid rgba(0, 107, 63, 0.2)' : '1px solid rgba(0, 107, 63, 0.2)',
              background: isDark ? 'transparent' : 'rgba(255, 255, 255, 0.6)',
              boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 107, 63, 0.08)',
            }}
          >
            <feature.icon className={cn('w-7 h-7', isDark ? 'text-secondary-400' : 'text-primary-700')} />
          </div>
        </div>

        {/* Content */}
        <h3 className={cn(
          'text-lg font-bold mb-2 transition-colors font-heading',
          isDark ? 'text-amber-50/90 group-hover:text-secondary-300' : 'text-slate-800 group-hover:text-primary-700'
        )}>
          {feature.title}
        </h3>
        <p className={cn('text-sm leading-relaxed', isDark ? 'text-amber-50/50' : 'text-slate-600')}>
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// AUTH MODAL - Enhanced with sleek effects
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
          {/* Backdrop with animated gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl"
          >
            {/* Ambient glow effects */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px]"
                style={{ background: isDark ? 'rgba(0, 107, 63, 0.15)' : 'rgba(0, 107, 63, 0.1)' }}
              />
              <div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px]"
                style={{ background: isDark ? 'rgba(252, 209, 22, 0.1)' : 'rgba(252, 209, 22, 0.08)' }}
              />
            </motion.div>
          </motion.div>

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                  'relative w-full rounded-2xl',
                  mode === 'register' ? 'max-w-lg' : 'max-w-md',
                  isDark ? 'dark' : ''
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Animated border glow */}
                <motion.div
                  className="absolute -inset-[1px] rounded-2xl overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, #FCD116, #006B3F, #CE1126, #FCD116)'
                        : 'linear-gradient(135deg, #006B3F, #FCD116, #006B3F, #CE1126)',
                      backgroundSize: '400% 400%',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>

                {/* Modal content container */}
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: isDark
                      ? 'linear-gradient(145deg, #1f1a15 0%, #171310 100%)'
                      : 'linear-gradient(145deg, #ffffff 0%, #faf8f5 100%)',
                    boxShadow: isDark
                      ? '0 0 80px rgba(252, 209, 22, 0.1), 0 25px 50px rgba(0, 0, 0, 0.5)'
                      : '0 0 80px rgba(0, 107, 63, 0.1), 0 25px 50px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {/* Floating particles inside modal */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{
                          background: isDark ? 'rgba(252, 209, 22, 0.4)' : 'rgba(0, 107, 63, 0.3)',
                          left: `${15 + i * 15}%`,
                          top: `${20 + (i % 3) * 30}%`,
                        }}
                        animate={{
                          y: [0, -20, 0],
                          opacity: [0.2, 0.6, 0.2],
                          scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                          duration: 3 + i * 0.5,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>

                  {/* Ghana flag stripe with shimmer */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden flex">
                    <motion.div
                      className="flex-1 bg-accent-500 relative overflow-hidden"
                      whileHover={{ scaleY: 1.5 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                    </motion.div>
                    <motion.div
                      className="flex-1 bg-secondary-500 relative overflow-hidden"
                      whileHover={{ scaleY: 1.5 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.3 }}
                      />
                    </motion.div>
                    <motion.div
                      className="flex-1 bg-primary-500 relative overflow-hidden"
                      whileHover={{ scaleY: 1.5 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.6 }}
                      />
                    </motion.div>
                  </div>

                  {/* Close button - Enhanced */}
                  <motion.button
                    onClick={onClose}
                    aria-label="Close modal"
                    className={cn(
                      'absolute top-4 right-4 z-10 p-2.5 rounded-xl overflow-hidden group/close',
                      isDark ? 'text-amber-50/50' : 'text-surface-400'
                    )}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover/close:opacity-100 transition-opacity"
                      style={{
                        background: isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.05)',
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover/close:opacity-100"
                      style={{
                        boxShadow: isDark
                          ? '0 0 15px rgba(252, 209, 22, 0.3)'
                          : '0 0 15px rgba(0, 107, 63, 0.2)',
                      }}
                    />
                    <X className="w-5 h-5 relative" />
                  </motion.button>

                  {/* Modal Header - Enhanced */}
                  <div className="pt-10 pb-4 px-6 sm:px-8 text-center relative">
                    {/* Animated logo */}
                    <motion.div
                      className="flex justify-center mb-5"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                    >
                      <div className="relative group/logo">
                        {/* Outer glow ring */}
                        <motion.div
                          className="absolute -inset-2 rounded-2xl opacity-60"
                          style={{
                            background: 'linear-gradient(135deg, #006B3F, #FCD116, #006B3F)',
                            filter: 'blur(10px)',
                          }}
                          animate={{
                            rotate: [0, 360],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
                            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                          }}
                        />
                        {/* Logo container */}
                        <motion.div
                          className="relative w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
                            boxShadow: '0 8px 30px rgba(0, 107, 63, 0.4)',
                          }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          {/* Shimmer effect */}
                          <motion.div
                            className="absolute inset-0"
                            style={{
                              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                            }}
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                          />
                          <motion.div
                            animate={{ rotateY: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <Library className="w-8 h-8 text-secondary-400 drop-shadow-lg" />
                          </motion.div>
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Title with gradient animation */}
                    <motion.h2
                      className={cn(
                        'text-2xl font-heading font-bold',
                        isDark ? 'text-amber-50' : 'text-surface-900'
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={mode}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </motion.span>
                      </AnimatePresence>
                    </motion.h2>
                    <motion.p
                      className={cn(
                        'mt-2 text-sm',
                        isDark ? 'text-amber-50/60' : 'text-surface-500'
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={mode}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {mode === 'login'
                            ? 'Sign in to your OHCS E-Library account'
                            : 'Join the AI-powered knowledge platform'}
                        </motion.span>
                      </AnimatePresence>
                    </motion.p>
                  </div>

                  {/* Form Content */}
                  <div className="px-6 sm:px-8 pb-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={mode}
                        initial={{ opacity: 0, x: mode === 'login' ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: mode === 'login' ? 30 : -30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      >
                        {mode === 'login' ? (
                          <LoginFormContent isDark={isDark} onClose={onClose} />
                        ) : (
                          <RegisterFormContent isDark={isDark} onClose={onClose} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Footer - Enhanced switch mode */}
                  <motion.div
                    className={cn(
                      'px-6 sm:px-8 py-5 text-center relative overflow-hidden',
                      isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'
                    )}
                    style={{
                      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    }}
                  >
                    <p className={cn('text-sm', isDark ? 'text-amber-50/50' : 'text-surface-500')}>
                      {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                      <motion.button
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className={cn(
                          'font-semibold relative group/switch',
                          isDark
                            ? 'text-secondary-400'
                            : 'text-primary-600'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10">
                          {mode === 'login' ? 'Create one' : 'Sign in'}
                        </span>
                        {/* Animated underline */}
                        <motion.div
                          className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full origin-left"
                          style={{
                            background: isDark
                              ? 'linear-gradient(90deg, #FCD116, #f0c000)'
                              : 'linear-gradient(90deg, #006B3F, #008a50)',
                          }}
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        {/* Glow effect */}
                        <motion.div
                          className="absolute inset-0 -inset-x-2 rounded opacity-0 group-hover/switch:opacity-100 blur-lg transition-opacity"
                          style={{
                            background: isDark
                              ? 'rgba(252, 209, 22, 0.2)'
                              : 'rgba(0, 107, 63, 0.15)',
                          }}
                        />
                      </motion.button>
                    </p>
                  </motion.div>
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
  const { login, loginDemo } = useAuthStore();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'email' | 'staffId'>('email');

  const handleDemoLogin = async () => {
    try {
      await loginDemo();
      toast.success('Welcome!', 'Signed in with demo account (24hr access).');
      onClose();
      navigate('/dashboard');
    } catch (error) {
      toast.error('Demo Login Failed', 'Unable to start demo session. Please try again.');
    }
  };

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
      {/* Login Mode Tabs - Enhanced with sliding indicator */}
      <div
        className="relative flex p-1 rounded-xl"
        style={{
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        }}
      >
        {/* Sliding background indicator */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg"
          style={{
            width: 'calc(50% - 4px)',
            background: isDark
              ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.15), rgba(252, 209, 22, 0.08))'
              : 'linear-gradient(135deg, rgba(0, 107, 63, 0.1), rgba(0, 107, 63, 0.05))',
            boxShadow: isDark
              ? '0 2px 10px rgba(252, 209, 22, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 2px 10px rgba(0, 107, 63, 0.08), 0 1px 2px rgba(0,0,0,0.05)',
          }}
          animate={{
            x: loginMode === 'email' ? 4 : 'calc(100% + 4px)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
        {(['email', 'staffId'] as const).map((m) => (
          <motion.button
            key={m}
            type="button"
            onClick={() => {
              setLoginMode(m);
              setServerError(null);
            }}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors z-10',
              loginMode === m
                ? isDark
                  ? 'text-secondary-400'
                  : 'text-primary-600'
                : isDark
                  ? 'text-amber-50/50 hover:text-amber-50/70'
                  : 'text-surface-500 hover:text-surface-600'
            )}
            whileHover={{ scale: loginMode === m ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{
                scale: loginMode === m ? [1, 1.2, 1] : 1,
                rotate: loginMode === m ? [0, 5, -5, 0] : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {m === 'email' ? <Mail className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
            </motion.div>
            {m === 'email' ? 'Email' : 'Staff ID'}
          </motion.button>
        ))}
      </div>

      {/* Error Display - Enhanced with animation */}
      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative p-3 rounded-lg flex items-start gap-2.5 overflow-hidden"
            style={{
              background: isDark ? 'rgba(206, 17, 38, 0.15)' : 'rgba(206, 17, 38, 0.08)',
              border: '1px solid rgba(206, 17, 38, 0.3)',
            }}
          >
            {/* Animated pulse effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: 'radial-gradient(circle at 0% 50%, rgba(206, 17, 38, 0.2), transparent 50%)' }}
            />
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <AlertCircle className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5" />
            </motion.div>
            <p className="text-sm text-error-500 relative z-10">{serverError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Form */}
      {loginMode === 'email' && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          {/* Email Input - Enhanced with glow effect */}
          <div>
            <label className={labelStyles}>Email Address</label>
            <motion.div
              className="relative group"
              whileFocus={{ scale: 1 }}
            >
              {/* Input glow effect */}
              <motion.div
                className="absolute -inset-0.5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.3), rgba(252, 209, 22, 0.1))'
                    : 'linear-gradient(135deg, rgba(0, 107, 63, 0.2), rgba(0, 107, 63, 0.1))',
                  filter: 'blur(4px)',
                }}
              />
              <div className="relative">
                <motion.div
                  className={iconStyles}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Mail className="w-5 h-5" />
                </motion.div>
                <input
                  type="email"
                  placeholder="yourname@agency.gov.gh"
                  className={cn(inputStyles, 'relative z-10')}
                  {...emailForm.register('email')}
                />
              </div>
            </motion.div>
            {emailForm.formState.errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-xs text-error-500"
              >
                {emailForm.formState.errors.email.message}
              </motion.p>
            )}
          </div>

          {/* Password Input - Enhanced with glow effect */}
          <div>
            <label className={labelStyles}>Password</label>
            <motion.div className="relative group">
              {/* Input glow effect */}
              <motion.div
                className="absolute -inset-0.5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.3), rgba(252, 209, 22, 0.1))'
                    : 'linear-gradient(135deg, rgba(0, 107, 63, 0.2), rgba(0, 107, 63, 0.1))',
                  filter: 'blur(4px)',
                }}
              />
              <div className="relative">
                <motion.div
                  className={iconStyles}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Lock className="w-5 h-5" />
                </motion.div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className={cn(inputStyles, 'relative z-10')}
                  {...emailForm.register('password')}
                />
              </div>
            </motion.div>
            {emailForm.formState.errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-xs text-error-500"
              >
                {emailForm.formState.errors.password.message}
              </motion.p>
            )}
          </div>

          {/* Remember me and Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <input
                  type="checkbox"
                  className={cn(
                    'w-4 h-4 rounded border-2 appearance-none cursor-pointer transition-all',
                    isDark
                      ? 'border-amber-50/30 bg-white/5 checked:bg-secondary-500 checked:border-secondary-500'
                      : 'border-surface-300 bg-white checked:bg-primary-600 checked:border-primary-600'
                  )}
                  {...emailForm.register('rememberMe')}
                />
                <Check className={cn(
                  'absolute inset-0 w-4 h-4 text-white pointer-events-none opacity-0 scale-50 transition-all',
                  'peer-checked:opacity-100 peer-checked:scale-100'
                )} />
              </motion.div>
              <span className={cn('text-sm', isDark ? 'text-amber-50/60' : 'text-surface-600')}>
                Remember me
              </span>
            </label>
            {/* Forgot password - Enhanced */}
            <motion.button
              type="button"
              className={cn(
                'relative text-sm font-medium group',
                isDark ? 'text-secondary-400' : 'text-primary-600'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">Forgot password?</span>
              {/* Underline animation */}
              <motion.div
                className="absolute -bottom-0.5 left-0 right-0 h-0.5 origin-left"
                style={{
                  background: isDark
                    ? 'linear-gradient(90deg, #FCD116, rgba(252, 209, 22, 0.3))'
                    : 'linear-gradient(90deg, #006B3F, rgba(0, 107, 63, 0.3))',
                }}
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
            </motion.button>
          </div>

          {/* Submit Button - Enhanced with shine and glow */}
          <motion.button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            className="relative w-full h-12 rounded-xl font-semibold text-white overflow-hidden disabled:opacity-50 group"
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            style={{
              background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
            }}
          >
            {/* Animated border glow */}
            <motion.div
              className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(135deg, #006B3F, #FCD116, #006B3F)',
                backgroundSize: '200% 200%',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            {/* Inner button */}
            <div
              className="absolute inset-0.5 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)' }}
            />
            {/* Shine sweep effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
            />
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
              style={{
                boxShadow: '0 0 30px rgba(0, 107, 63, 0.5), 0 0 60px rgba(0, 107, 63, 0.3)',
              }}
              transition={{ duration: 0.3 }}
            />
            {/* Button text with icon */}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {emailForm.formState.isSubmitting ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </>
              )}
            </span>
          </motion.button>
        </form>
      )}

      {/* Staff ID Form - Enhanced */}
      {loginMode === 'staffId' && (
        <form onSubmit={staffIdForm.handleSubmit(onStaffIdSubmit)} className="space-y-4">
          {/* Staff ID Input - Enhanced with glow effect */}
          <div>
            <label className={labelStyles}>Staff ID</label>
            <motion.div className="relative group">
              {/* Input glow effect */}
              <motion.div
                className="absolute -inset-0.5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.3), rgba(252, 209, 22, 0.1))'
                    : 'linear-gradient(135deg, rgba(0, 107, 63, 0.2), rgba(0, 107, 63, 0.1))',
                  filter: 'blur(4px)',
                }}
              />
              <div className="relative">
                <motion.div
                  className={iconStyles}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <BadgeCheck className="w-5 h-5" />
                </motion.div>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  className={cn(inputStyles, 'relative z-10')}
                  {...staffIdForm.register('staffId')}
                />
              </div>
            </motion.div>
            {staffIdForm.formState.errors.staffId && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-xs text-error-500"
              >
                {staffIdForm.formState.errors.staffId.message}
              </motion.p>
            )}
          </div>

          {/* Password Input - Enhanced with glow effect */}
          <div>
            <label className={labelStyles}>Password</label>
            <motion.div className="relative group">
              {/* Input glow effect */}
              <motion.div
                className="absolute -inset-0.5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.3), rgba(252, 209, 22, 0.1))'
                    : 'linear-gradient(135deg, rgba(0, 107, 63, 0.2), rgba(0, 107, 63, 0.1))',
                  filter: 'blur(4px)',
                }}
              />
              <div className="relative">
                <motion.div
                  className={iconStyles}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Lock className="w-5 h-5" />
                </motion.div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className={cn(inputStyles, 'relative z-10')}
                  {...staffIdForm.register('password')}
                />
              </div>
            </motion.div>
            {staffIdForm.formState.errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-xs text-error-500"
              >
                {staffIdForm.formState.errors.password.message}
              </motion.p>
            )}
          </div>

          {/* Remember me and Forgot password - Enhanced */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <input
                  type="checkbox"
                  className={cn(
                    'w-4 h-4 rounded border-2 appearance-none cursor-pointer transition-all',
                    isDark
                      ? 'border-amber-50/30 bg-white/5 checked:bg-secondary-500 checked:border-secondary-500'
                      : 'border-surface-300 bg-white checked:bg-primary-600 checked:border-primary-600'
                  )}
                  {...staffIdForm.register('rememberMe')}
                />
                <Check className={cn(
                  'absolute inset-0 w-4 h-4 text-white pointer-events-none opacity-0 scale-50 transition-all',
                  'peer-checked:opacity-100 peer-checked:scale-100'
                )} />
              </motion.div>
              <span className={cn('text-sm', isDark ? 'text-amber-50/60' : 'text-surface-600')}>
                Remember me
              </span>
            </label>
            {/* Forgot password - Enhanced */}
            <motion.button
              type="button"
              className={cn(
                'relative text-sm font-medium group',
                isDark ? 'text-secondary-400' : 'text-primary-600'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">Forgot password?</span>
              {/* Underline animation */}
              <motion.div
                className="absolute -bottom-0.5 left-0 right-0 h-0.5 origin-left"
                style={{
                  background: isDark
                    ? 'linear-gradient(90deg, #FCD116, rgba(252, 209, 22, 0.3))'
                    : 'linear-gradient(90deg, #006B3F, rgba(0, 107, 63, 0.3))',
                }}
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
            </motion.button>
          </div>

          {/* Submit Button - Enhanced with shine and glow */}
          <motion.button
            type="submit"
            disabled={staffIdForm.formState.isSubmitting}
            className="relative w-full h-12 rounded-xl font-semibold text-white overflow-hidden disabled:opacity-50 group"
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            style={{
              background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
            }}
          >
            {/* Animated border glow */}
            <motion.div
              className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(135deg, #006B3F, #FCD116, #006B3F)',
                backgroundSize: '200% 200%',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            {/* Inner button */}
            <div
              className="absolute inset-0.5 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)' }}
            />
            {/* Shine sweep effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
            />
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
              style={{
                boxShadow: '0 0 30px rgba(0, 107, 63, 0.5), 0 0 60px rgba(0, 107, 63, 0.3)',
              }}
              transition={{ duration: 0.3 }}
            />
            {/* Button text with icon */}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {staffIdForm.formState.isSubmitting ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </>
              )}
            </span>
          </motion.button>
        </form>
      )}

      {/* Demo Login Divider */}
      <div className="relative my-5">
        <div
          className="absolute inset-0 flex items-center"
          aria-hidden="true"
        >
          <div
            className="w-full border-t"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }}
          />
        </div>
        <div className="relative flex justify-center">
          <span
            className={cn(
              'px-3 text-xs font-medium',
              isDark ? 'bg-[#171310] text-amber-50/40' : 'bg-[#faf8f5] text-surface-400'
            )}
          >
            Or try the demo
          </span>
        </div>
      </div>

      {/* Demo Login Button */}
      <motion.button
        type="button"
        onClick={handleDemoLogin}
        className={cn(
          'relative w-full h-11 rounded-xl font-medium overflow-hidden group',
          isDark
            ? 'bg-white/5 border border-white/10 text-amber-50/80 hover:text-amber-50'
            : 'bg-surface-100 border border-surface-200 text-surface-600 hover:text-surface-900'
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.1), transparent)'
              : 'linear-gradient(135deg, rgba(0, 107, 63, 0.08), transparent)',
          }}
        />
        <span className="relative z-10 flex items-center justify-center gap-2">
          <Play className="w-4 h-4" />
          Demo Login
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-md',
            isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-primary-100 text-primary-600'
          )}>
            24hr
          </span>
        </span>
      </motion.button>
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

  // Enhanced input wrapper with glow effect
  const EnhancedInput = ({ icon: Icon, children, className = '' }: { icon?: typeof Mail; children: React.ReactNode; className?: string }) => (
    <motion.div className={cn('relative group', className)}>
      {/* Input glow effect */}
      <motion.div
        className="absolute -inset-0.5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.3), rgba(252, 209, 22, 0.1))'
            : 'linear-gradient(135deg, rgba(0, 107, 63, 0.2), rgba(0, 107, 63, 0.1))',
          filter: 'blur(4px)',
        }}
      />
      <div className="relative">
        {Icon && (
          <motion.div
            className={iconStyles}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        )}
        {children}
      </div>
    </motion.div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error Display - Enhanced with animation */}
      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative p-3 rounded-lg flex items-start gap-2.5 overflow-hidden"
            style={{
              background: isDark ? 'rgba(206, 17, 38, 0.15)' : 'rgba(206, 17, 38, 0.08)',
              border: '1px solid rgba(206, 17, 38, 0.3)',
            }}
          >
            {/* Animated pulse effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: 'radial-gradient(circle at 0% 50%, rgba(206, 17, 38, 0.2), transparent 50%)' }}
            />
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <AlertCircle className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5" />
            </motion.div>
            <p className="text-sm text-error-500 relative z-10">{serverError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name Row - Enhanced */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelStyles}>First Name</label>
          <EnhancedInput icon={User}>
            <input placeholder="John" className={cn(inputWithIconStyles, 'relative z-10')} {...register('firstName')} />
          </EnhancedInput>
          {errors.firstName && (
            <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs text-error-500">
              {errors.firstName.message}
            </motion.p>
          )}
        </div>
        <div>
          <label className={labelStyles}>Last Name</label>
          <EnhancedInput>
            <input placeholder="Doe" className={cn(inputStyles, 'relative z-10')} {...register('lastName')} />
          </EnhancedInput>
          {errors.lastName && (
            <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs text-error-500">
              {errors.lastName.message}
            </motion.p>
          )}
        </div>
      </div>

      {/* Email - Enhanced */}
      <div>
        <label className={labelStyles}>Email Address</label>
        <EnhancedInput icon={Mail}>
          <input type="email" placeholder="yourname@agency.gov.gh" className={cn(inputWithIconStyles, 'relative z-10')} {...register('email')} />
        </EnhancedInput>
        <p className={cn('mt-1 text-xs', isDark ? 'text-amber-50/40' : 'text-surface-400')}>Must be a .gov.gh email</p>
        {errors.email && (
          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs text-error-500">
            {errors.email.message}
          </motion.p>
        )}
      </div>

      {/* Staff ID - Enhanced */}
      <div>
        <label className={labelStyles}>Staff ID</label>
        <EnhancedInput icon={BadgeCheck}>
          <input placeholder="e.g. 123456" className={cn(inputWithIconStyles, 'relative z-10')} {...register('staffId')} />
        </EnhancedInput>
        {errors.staffId && (
          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs text-error-500">
            {errors.staffId.message}
          </motion.p>
        )}
      </div>

      {/* MDA Select - Enhanced */}
      <div className="relative">
        <label className={labelStyles}>Ministry / Department / Agency</label>
        <motion.div className="relative group">
          {/* Select glow effect */}
          <motion.div
            className="absolute -inset-0.5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.3), rgba(252, 209, 22, 0.1))'
                : 'linear-gradient(135deg, rgba(0, 107, 63, 0.2), rgba(0, 107, 63, 0.1))',
              filter: 'blur(4px)',
            }}
          />
          <motion.button
            type="button"
            onClick={() => setMdaOpen(!mdaOpen)}
            className={cn(
              inputStyles,
              'relative z-10 flex items-center justify-between text-left',
              !selectedMda && (isDark ? 'text-amber-50/30' : 'text-surface-400')
            )}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
          >
            <span className="truncate">
              {selectedMda ? mdaOptions.find(o => o.value === selectedMda)?.label : 'Select your MDA'}
            </span>
            <motion.div
              animate={{ rotate: mdaOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </motion.div>
          </motion.button>
        </motion.div>
        <AnimatePresence>
          {mdaOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute z-20 w-full mt-1 rounded-lg shadow-xl max-h-48 overflow-auto"
              style={{
                background: isDark ? '#1f1a15' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              {mdaOptions.map((option, index) => (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setValue('mdaId', option.value);
                    setMdaOpen(false);
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
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
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {errors.mdaId && (
          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs text-error-500">
            {errors.mdaId.message}
          </motion.p>
        )}
      </div>

      {/* Department & Title Row - Enhanced */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelStyles}>Directorate/Unit</label>
          <EnhancedInput icon={Building2}>
            <input placeholder="e.g. IT Directorate" className={cn(inputWithIconStyles, 'relative z-10')} {...register('department')} />
          </EnhancedInput>
        </div>
        <div>
          <label className={labelStyles}>Job Title</label>
          <EnhancedInput icon={Briefcase}>
            <input placeholder="e.g. Senior Officer" className={cn(inputWithIconStyles, 'relative z-10')} {...register('title')} />
          </EnhancedInput>
        </div>
      </div>

      {/* Password - Enhanced */}
      <div>
        <label className={labelStyles}>Password</label>
        <EnhancedInput icon={Lock}>
          <input
            type="password"
            placeholder="Create a strong password"
            className={cn(inputWithIconStyles, 'relative z-10')}
            {...register('password', { onChange: (e) => setPasswordValue(e.target.value) })}
          />
        </EnhancedInput>
        {errors.password && (
          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs text-error-500">
            {errors.password.message}
          </motion.p>
        )}

        {/* Password strength - Enhanced with animations */}
        <AnimatePresence>
          {passwordValue && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('flex-1 h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-surface-200')}>
                  <motion.div
                    className={cn(
                      'h-full',
                      passwordStrength.color === 'error' && 'bg-error-500',
                      passwordStrength.color === 'warning' && 'bg-warning-500',
                      passwordStrength.color === 'info' && 'bg-info-500',
                      passwordStrength.color === 'success' && 'bg-success-500'
                    )}
                    initial={{ width: 0 }}
                    animate={{
                      width: passwordStrength.color === 'error' ? '25%' :
                             passwordStrength.color === 'warning' ? '50%' :
                             passwordStrength.color === 'info' ? '75%' : '100%'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                </div>
                <motion.span
                  key={passwordStrength.label}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'text-xs font-medium',
                    passwordStrength.color === 'error' && 'text-error-500',
                    passwordStrength.color === 'warning' && 'text-warning-500',
                    passwordStrength.color === 'info' && 'text-info-500',
                    passwordStrength.color === 'success' && 'text-success-500'
                  )}
                >
                  {passwordStrength.label}
                </motion.span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {passwordRequirements.map((req, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      'flex items-center gap-1 text-xs transition-colors',
                      req.met ? 'text-success-500' : isDark ? 'text-amber-50/30' : 'text-surface-400'
                    )}
                  >
                    <motion.div
                      animate={{ scale: req.met ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Check className={cn('w-3 h-3', !req.met && 'opacity-40')} />
                    </motion.div>
                    {req.text}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Password - Enhanced */}
      <div>
        <label className={labelStyles}>Confirm Password</label>
        <EnhancedInput icon={Lock}>
          <input type="password" placeholder="Confirm your password" className={cn(inputWithIconStyles, 'relative z-10')} {...register('confirmPassword')} />
        </EnhancedInput>
        {errors.confirmPassword && (
          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs text-error-500">
            {errors.confirmPassword.message}
          </motion.p>
        )}
      </div>

      {/* Submit Button - Enhanced with shine and glow */}
      <motion.button
        type="submit"
        disabled={isSubmitting}
        className="relative w-full h-12 rounded-xl font-semibold text-white overflow-hidden disabled:opacity-50 group"
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.99 }}
        style={{
          background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
        }}
      >
        {/* Animated border glow */}
        <motion.div
          className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, #006B3F, #FCD116, #006B3F)',
            backgroundSize: '200% 200%',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Inner button */}
        <div
          className="absolute inset-0.5 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)' }}
        />
        {/* Shine sweep effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
        />
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
          style={{
            boxShadow: '0 0 30px rgba(0, 107, 63, 0.5), 0 0 60px rgba(0, 107, 63, 0.3)',
          }}
          transition={{ duration: 0.3 }}
        />
        {/* Button text with icon */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isSubmitting ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </>
          )}
        </span>
      </motion.button>

      {/* Terms - Enhanced with animated links */}
      <p className={cn('text-xs text-center', isDark ? 'text-amber-50/40' : 'text-surface-400')}>
        By creating an account, you agree to the OHCS{' '}
        <motion.a
          href="#"
          className={cn('relative inline-block', isDark ? 'text-secondary-400' : 'text-primary-600')}
          whileHover={{ scale: 1.05 }}
        >
          Terms
          <motion.span
            className="absolute -bottom-0.5 left-0 right-0 h-px"
            style={{ background: isDark ? '#FCD116' : '#006B3F' }}
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
        </motion.a>
        {' '}and{' '}
        <motion.a
          href="#"
          className={cn('relative inline-block', isDark ? 'text-secondary-400' : 'text-primary-600')}
          whileHover={{ scale: 1.05 }}
        >
          Privacy Policy
          <motion.span
            className="absolute -bottom-0.5 left-0 right-0 h-px"
            style={{ background: isDark ? '#FCD116' : '#006B3F' }}
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
        </motion.a>
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

// Research Hub Features
const researchFeatures = [
  {
    icon: Network,
    title: 'Research Projects',
    description: 'Create and manage comprehensive research projects with structured phases and milestones.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Bot,
    title: 'Kofi AI Assistant',
    description: 'Your intelligent research partner that helps analyze data, generate insights, and draft policy briefs.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track progress, team contributions, and project metrics with beautiful visualizations.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Layout,
    title: 'Research Templates',
    description: 'Start quickly with 12+ pre-built templates for policy analysis, case studies, and evaluations.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: Target,
    title: 'Milestone Tracking',
    description: 'Set deadlines, track deliverables, and visualize your research timeline at a glance.',
    color: 'from-rose-500 to-red-600',
  },
  {
    icon: FileDown,
    title: 'Export & Publish',
    description: 'Generate professional reports in Markdown, PDF, or DOCX with automatic citations.',
    color: 'from-cyan-500 to-blue-600',
  },
];

// Platform Features (Community, Wellness, News)
const platformFeatures = [
  {
    icon: MessagesSquare,
    title: 'Community Forums',
    description: 'Engage in discussions, share knowledge, and learn from colleagues across MDAs.',
    stats: '500+ Discussions',
  },
  {
    icon: UsersRound,
    title: 'Collaborative Groups',
    description: 'Join or create groups based on departments, interests, or special projects.',
    stats: '50+ Active Groups',
  },
  {
    icon: Heart,
    title: 'Wellness Hub',
    description: 'Access mental health resources, stress management tools, and counseling support.',
    stats: '24/7 Support',
  },
  {
    icon: Newspaper,
    title: 'News Aggregation',
    description: 'Stay updated with curated news from Ghana and international governance sources.',
    stats: 'Live Updates',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    description: 'Earn XP, badges, and climb leaderboards as you engage with the platform.',
    stats: 'Level Up!',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Connect with colleagues instantly through secure messaging and group chats.',
    stats: 'Instant Messaging',
  },
];

// Enterprise & Security Features (New!)
const enterpriseFeatures = [
  {
    icon: SearchCheck,
    title: 'Global Smart Search',
    description: 'Find anything across documents, forums, courses, and users with our AI-powered unified search that understands context.',
    gradient: 'from-blue-500 to-cyan-500',
    badge: 'AI-Powered',
  },
  {
    icon: Fingerprint,
    title: 'Two-Factor Authentication',
    description: 'Secure your account with TOTP-based 2FA. Generate codes via authenticator apps for an extra layer of protection.',
    gradient: 'from-emerald-500 to-green-600',
    badge: 'Security',
  },
  {
    icon: Eye,
    title: 'Comprehensive Audit Logs',
    description: 'Track every action on the platform with detailed audit trails. Filter by user, action type, and date for full accountability.',
    gradient: 'from-violet-500 to-purple-600',
    badge: 'Compliance',
  },
  {
    icon: Activity,
    title: 'Real-time Analytics',
    description: 'Beautiful dashboards showing user growth, engagement metrics, content distribution, and MDA leaderboards at a glance.',
    gradient: 'from-orange-500 to-red-500',
    badge: 'Insights',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Stay informed with customizable email digests, real-time alerts, and push notifications tailored to your preferences.',
    gradient: 'from-pink-500 to-rose-500',
    badge: 'Personalized',
  },
  {
    icon: Compass,
    title: 'Guided Onboarding Tour',
    description: 'New users are welcomed with an interactive step-by-step tour highlighting key features and helping them get started quickly.',
    gradient: 'from-amber-500 to-yellow-500',
    badge: 'User-Friendly',
  },
];

const stats = [
  { value: 20000, label: 'Civil Servants', suffix: '+', icon: Users },
  { value: 50, label: 'MDAs Targeted', suffix: '+', icon: Building2 },
  { value: 24, label: 'AI Assistance', suffix: '/7', icon: Bot },
  { value: 100, label: 'Secured & Encrypted', suffix: '%', icon: Shield },
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
          {/* Logo - Enhanced with shimmer and glow */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="relative w-12 h-12"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(135deg, #006B3F, #FCD116, #006B3F)',
                }}
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                }}
              />
              {/* Main logo container */}
              <div
                className="absolute inset-0 rounded-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
                  boxShadow: isDark
                    ? '0 4px 20px rgba(0, 107, 63, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 4px 20px rgba(0, 107, 63, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  style={{
                    background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 50%, transparent 80%)',
                  }}
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    x: { duration: 1.5, repeat: Infinity, repeatDelay: 2 },
                  }}
                />
              </div>
              <div className="relative w-full h-full rounded-xl flex items-center justify-center">
                <motion.div
                  animate={{
                    rotateY: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Library className="w-6 h-6 text-secondary-400 drop-shadow-lg" />
                </motion.div>
              </div>
            </motion.div>
            <div className="overflow-hidden">
              <motion.div
                className="flex items-center gap-2"
                initial={{ x: 0 }}
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h1 className={cn(
                  'font-heading font-bold text-lg transition-all duration-300',
                  isDark ? 'text-amber-50 group-hover:text-white' : 'text-surface-900'
                )}>
                  OHCS E-Library
                </h1>
                <motion.span
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded relative overflow-hidden"
                  style={{
                    background: isDark ? 'rgba(252, 209, 22, 0.2)' : 'rgba(0, 107, 63, 0.1)',
                    color: isDark ? '#FCD116' : '#006B3F',
                  }}
                  whileHover={{ scale: 1.1 }}
                  animate={{
                    boxShadow: [
                      '0 0 0 rgba(252, 209, 22, 0)',
                      '0 0 10px rgba(252, 209, 22, 0.3)',
                      '0 0 0 rgba(252, 209, 22, 0)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  AI
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                </motion.span>
              </motion.div>
              {/* Animated Ghana flag stripe */}
              <div className="flex h-0.5 rounded-full overflow-hidden mt-1">
                <motion.div
                  className="w-1/3 bg-accent-500"
                  whileHover={{ scaleX: 1.2 }}
                  transition={{ type: 'spring' }}
                />
                <motion.div
                  className="w-1/3 bg-secondary-500"
                  whileHover={{ scaleX: 1.2 }}
                  transition={{ type: 'spring', delay: 0.05 }}
                />
                <motion.div
                  className="w-1/3 bg-primary-500"
                  whileHover={{ scaleX: 1.2 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Theme toggle - Enhanced with rotation and glow + Discovery Hint */}
            <ThemeToggleHint variant="landing">
              <motion.button
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={cn(
                  'relative p-2.5 rounded-xl overflow-hidden group/theme',
                  isDark ? 'text-amber-50' : 'text-surface-700'
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {/* Background glow */}
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover/theme:opacity-100 transition-opacity duration-300"
                  style={{
                    background: isDark
                      ? 'radial-gradient(circle, rgba(252, 209, 22, 0.2) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(0, 107, 63, 0.15) 0%, transparent 70%)',
                  }}
                />
                {/* Rotating ring on hover */}
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover/theme:opacity-100"
                  style={{
                    border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.3)' : 'rgba(0, 107, 63, 0.3)'}`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                {/* Icon with morph animation */}
                <motion.div
                  className="relative"
                  initial={false}
                  animate={{
                    rotate: isDark ? 0 : 180,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    rotate: { duration: 0.5 },
                    scale: { duration: 0.3 },
                  }}
                >
                  {isDark ? (
                    <Sun className="w-5 h-5 drop-shadow-[0_0_8px_rgba(252,209,22,0.5)]" />
                  ) : (
                    <Moon className="w-5 h-5 drop-shadow-[0_0_8px_rgba(0,107,63,0.5)]" />
                  )}
                </motion.div>
                {/* Sparkle particles on hover */}
                <motion.div
                  className="absolute top-0 right-0 w-2 h-2 rounded-full opacity-0 group-hover/theme:opacity-100"
                  style={{ background: isDark ? '#FCD116' : '#006B3F' }}
                  animate={{
                    scale: [0, 1, 0],
                    y: [0, -10],
                    x: [0, 5],
                  }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.5 }}
                />
              </motion.button>
            </ThemeToggleHint>

            {/* Sign In - Enhanced with magnetic effect and underline */}
            <motion.button
              onClick={openLogin}
              className={cn(
                'relative text-sm font-medium px-4 py-2.5 rounded-lg overflow-hidden group/signin',
                isDark ? 'text-amber-50/80' : 'text-surface-600'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {/* Subtle background on hover */}
              <motion.div
                className="absolute inset-0 rounded-lg opacity-0 group-hover/signin:opacity-100 transition-opacity duration-300"
                style={{
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
                }}
              />
              {/* Text with color transition */}
              <motion.span
                className={cn(
                  'relative transition-colors duration-300',
                  isDark
                    ? 'group-hover/signin:text-white'
                    : 'group-hover/signin:text-surface-900'
                )}
              >
                Sign In
              </motion.span>
              {/* Animated underline */}
              <motion.div
                className="absolute bottom-1.5 left-4 right-4 h-[2px] rounded-full origin-left"
                style={{
                  background: isDark
                    ? 'linear-gradient(90deg, #FCD116, #f0c000)'
                    : 'linear-gradient(90deg, #006B3F, #008a50)',
                }}
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-lg opacity-0 group-hover/signin:opacity-100 blur-xl transition-opacity duration-500"
                style={{
                  background: isDark
                    ? 'rgba(252, 209, 22, 0.1)'
                    : 'rgba(0, 107, 63, 0.1)',
                }}
              />
            </motion.button>

            {/* Get Started - Enhanced with shine sweep, border glow, and particles */}
            <motion.button
              onClick={openRegister}
              className="relative px-6 py-2.5 rounded-xl font-medium text-sm overflow-hidden group/cta"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {/* Animated border glow */}
              <motion.div
                className="absolute -inset-[1px] rounded-xl opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(135deg, #FCD116, #006B3F, #FCD116, #006B3F)',
                  backgroundSize: '300% 300%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              {/* Main background */}
              <div
                className="absolute inset-[1px] rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #006B3F 0%, #004d2d 100%)',
                }}
              />
              {/* Hover gradient overlay */}
              <motion.div
                className="absolute inset-[1px] rounded-xl opacity-0 group-hover/cta:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, #008a50 0%, #006B3F 100%)',
                }}
              />
              {/* Shine sweep effect */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover/cta:opacity-100"
                style={{
                  background: 'linear-gradient(105deg, transparent 0%, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%, transparent 100%)',
                }}
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
              {/* Inner glow */}
              <div
                className="absolute inset-[1px] rounded-xl opacity-0 group-hover/cta:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)',
                }}
              />
              {/* Button content */}
              <span className="relative text-white flex items-center gap-2 drop-shadow-sm">
                <span>Get Started</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </span>
              {/* Floating particles on hover */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-secondary-400 opacity-0 group-hover/cta:opacity-100"
                  style={{
                    left: `${30 + i * 20}%`,
                    bottom: '20%',
                  }}
                  animate={{
                    y: [0, -20, -30],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeOut',
                  }}
                />
              ))}
              {/* Outer glow */}
              <motion.div
                className="absolute -inset-2 rounded-2xl opacity-0 group-hover/cta:opacity-100 blur-xl transition-opacity duration-500 -z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(0, 107, 63, 0.4) 0%, transparent 70%)',
                }}
              />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20">
        <div
          className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 text-center"
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

          {/* Main heading - renders immediately for LCP detection */}
          <h1
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
          </h1>

          {/* Open book visualization */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="my-12"
          >
            <OpenBookHero isDark={isDark} />
          </motion.div>

          {/* Subtitle - renders immediately for LCP */}
          <p
            className={cn('text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed', theme.textMuted)}
          >
            <span className="text-primary-500 font-medium">Search intelligently</span>,{' '}
            <span className={cn('font-medium', isDark ? 'text-secondary-400' : 'text-secondary-600')}>get AI summaries</span>, and{' '}
            <span className="text-accent-500 font-medium">find answers instantly</span>{' '}
            — all in one secure platform.
          </p>

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
                'px-8 py-4 rounded-xl font-semibold text-base transition-all',
                isDark ? 'text-amber-50/80 hover:text-amber-50' : 'text-slate-700 hover:text-slate-900'
              )}
              style={{
                border: `1px solid ${isDark ? 'rgba(245, 240, 230, 0.2)' : 'rgba(0, 107, 63, 0.2)'}`,
                background: isDark ? 'rgba(245, 240, 230, 0.03)' : 'rgba(255, 255, 255, 0.7)',
                boxShadow: isDark ? 'none' : '0 2px 12px rgba(0, 0, 0, 0.06)',
              }}
            >
              Sign In to Continue
            </motion.button>
          </motion.div>

          {/* Trust indicator & Scroll prompt */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 sm:mt-20 flex flex-col items-center gap-6"
          >
            <p
              className={cn('text-sm flex items-center justify-center gap-2', isDark ? theme.textGhost : 'text-slate-500')}
            >
              <Shield className="w-4 h-4" />
              Exclusively for .gov.gh email holders
            </p>

            {/* Scroll indicator */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn('flex flex-col items-center gap-2', isDark ? theme.textGhost : 'text-slate-400')}
            >
              <span className="text-xs uppercase tracking-widest">Discover AI Features</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
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
                className="text-center p-6 rounded-2xl"
                style={{
                  background: isDark
                    ? 'transparent'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)',
                  boxShadow: isDark
                    ? 'none'
                    : '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)',
                  border: isDark ? 'none' : '1px solid rgba(0, 107, 63, 0.1)',
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(252, 209, 22, 0.15) 0%, rgba(252, 209, 22, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(0, 107, 63, 0.15) 0%, rgba(0, 107, 63, 0.08) 100%)',
                    border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.2)' : 'rgba(0, 107, 63, 0.2)'}`,
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 107, 63, 0.08)',
                  }}
                >
                  <stat.icon className={cn('w-6 h-6', isDark ? 'text-secondary-400' : 'text-primary-700')} />
                </motion.div>
                <p className={cn('text-3xl sm:text-4xl font-bold mb-1', isDark ? 'text-amber-50' : 'text-slate-900')}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className={cn('text-sm font-medium', isDark ? theme.textFaint : 'text-slate-600')}>{stat.label}</p>
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

      {/* Research Hub Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-[100px]"
            style={{ background: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-[120px]"
            style={{ background: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)' }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              <Network className={cn('w-4 h-4', isDark ? 'text-indigo-400' : 'text-indigo-600')} />
              <span className={cn('text-sm font-semibold', isDark ? 'text-indigo-300' : 'text-indigo-700')}>
                New: Research Hub
              </span>
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>

            <h2 className={cn('font-heading text-3xl lg:text-5xl font-bold mb-5', isDark ? 'text-amber-50' : 'text-surface-900')}>
              Your Complete{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Research Workspace
              </span>
            </h2>
            <p className={cn('text-lg', theme.textMuted)}>
              Conduct policy research with AI-powered tools, collaborate with teams, track milestones, and publish professional reports — all in one place.
            </p>
          </motion.div>

          {/* Research Features Bento Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {researchFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative"
              >
                <div
                  className="relative p-6 rounded-2xl h-full overflow-hidden"
                  style={{
                    background: isDark
                      ? 'linear-gradient(145deg, rgba(30, 27, 40, 0.8) 0%, rgba(20, 18, 30, 0.9) 100%)'
                      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(252, 250, 255, 0.9) 100%)',
                    border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
                    boxShadow: isDark
                      ? '0 4px 30px rgba(0, 0, 0, 0.3)'
                      : '0 8px 32px rgba(99, 102, 241, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'} 0%, transparent 50%)`,
                    }}
                  />

                  {/* Icon */}
                  <div className={cn('w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br', feature.color)}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className={cn(
                    'text-lg font-bold mb-2 transition-colors',
                    isDark ? 'text-amber-50 group-hover:text-indigo-300' : 'text-slate-800 group-hover:text-indigo-700'
                  )}>
                    {feature.title}
                  </h3>
                  <p className={cn('text-sm leading-relaxed', isDark ? 'text-amber-50/60' : 'text-slate-600')}>
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Research Hub CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.button
              onClick={openRegister}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                boxShadow: '0 4px 25px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Network className="w-5 h-5" />
              Start Your Research Project
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Enterprise & Security Section - NEW! */}
      <section className="relative py-24 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Geometric grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="enterprise-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke={isDark ? '#fff' : '#000'} strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#enterprise-grid)" />
          </svg>

          {/* Floating orbs */}
          <motion.div
            className="absolute top-1/4 left-[10%] w-80 h-80 rounded-full blur-[100px]"
            style={{ background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 12, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-[10%] w-96 h-96 rounded-full blur-[120px]"
            style={{ background: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)' }}
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -30, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
                border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              <ShieldCheck className={cn('w-4 h-4', isDark ? 'text-blue-400' : 'text-blue-600')} />
              <span className={cn('text-sm font-semibold', isDark ? 'text-blue-300' : 'text-blue-700')}>
                Enterprise Ready
              </span>
              <motion.div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                  color: isDark ? '#6ee7b7' : '#047857',
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                New
              </motion.div>
            </motion.div>

            <h2 className={cn('font-heading text-3xl lg:text-5xl font-bold mb-5', isDark ? 'text-amber-50' : 'text-surface-900')}>
              Built for{' '}
              <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                Enterprise Scale
              </span>
            </h2>
            <p className={cn('text-lg', theme.textMuted)}>
              Security, compliance, and powerful tools designed for Ghana's largest institutions.
              Every feature built with government-grade standards in mind.
            </p>
          </motion.div>

          {/* Enterprise Features Grid - 3x2 Bento-style */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {enterpriseFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                <div
                  className="relative p-6 rounded-2xl h-full overflow-hidden"
                  style={{
                    background: isDark
                      ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)'
                      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
                    border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)'}`,
                    boxShadow: isDark
                      ? '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      : '0 8px 32px rgba(59, 130, 246, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'} 0%, transparent 60%)`,
                    }}
                  />

                  {/* Top row: Icon + Badge */}
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    {/* Icon with gradient background */}
                    <motion.div
                      className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg', feature.gradient)}
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </motion.div>

                    {/* Badge */}
                    <span
                      className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%)'
                          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
                        color: isDark ? '#93c5fd' : '#1d4ed8',
                        border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
                      }}
                    >
                      {feature.badge}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className={cn(
                    'text-lg font-bold mb-2 transition-colors relative z-10',
                    isDark ? 'text-amber-50 group-hover:text-blue-300' : 'text-slate-800 group-hover:text-blue-700'
                  )}>
                    {feature.title}
                  </h3>
                  <p className={cn('text-sm leading-relaxed relative z-10', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    {feature.description}
                  </p>

                  {/* Bottom accent line */}
                  <motion.div
                    className={cn('absolute bottom-0 left-0 h-1 rounded-b-2xl bg-gradient-to-r', feature.gradient)}
                    initial={{ width: '0%' }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-8 mt-12"
          >
            {[
              { icon: ShieldCheck, value: '256-bit', label: 'AES Encryption' },
              { icon: Server, value: '99.9%', label: 'Uptime SLA' },
              { icon: KeyRound, value: 'SOC 2', label: 'Compliant Ready' },
              { icon: Eye, value: 'Full', label: 'Audit Trail' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                  }}
                >
                  <stat.icon className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
                </div>
                <div>
                  <div className={cn('text-lg font-bold', isDark ? 'text-amber-50' : 'text-slate-900')}>
                    {stat.value}
                  </div>
                  <div className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Platform Features Section */}
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
                background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
              }}
            >
              <Layers className={cn('w-3.5 h-3.5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
              <span className={cn('text-xs font-medium', isDark ? 'text-emerald-300' : 'text-emerald-700')}>
                Complete Platform
              </span>
            </div>
            <h2 className={cn('font-heading text-3xl lg:text-4xl font-bold mb-4', isDark ? 'text-amber-50' : 'text-surface-900')}>
              Everything You Need,{' '}
              <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>One Platform</span>
            </h2>
            <p className={theme.textMuted}>
              Beyond documents — connect, collaborate, and grow with your colleagues across the civil service.
            </p>
          </motion.div>

          {/* Platform Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {platformFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div
                  className="relative p-6 rounded-2xl h-full transition-all duration-300"
                  style={{
                    background: isDark
                      ? `linear-gradient(135deg, ${theme.cardBg} 0%, transparent 100%)`
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                    border: `1px solid ${isDark ? theme.cardBorder : 'rgba(16, 185, 129, 0.15)'}`,
                    boxShadow: isDark
                      ? 'none'
                      : '0 6px 24px rgba(16, 185, 129, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                        border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
                        boxShadow: isDark ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      <feature.icon className={cn('w-6 h-6', isDark ? 'text-emerald-400' : 'text-emerald-700')} />
                    </div>
                    <span
                      className="px-2.5 py-1 text-xs font-bold rounded-full"
                      style={{
                        background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                        color: isDark ? '#6ee7b7' : '#047857',
                        boxShadow: isDark ? 'none' : '0 1px 3px rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      {feature.stats}
                    </span>
                  </div>

                  <h3 className={cn(
                    'text-lg font-bold mb-2 transition-colors',
                    isDark ? 'text-amber-50 group-hover:text-emerald-300' : 'text-slate-800 group-hover:text-emerald-700'
                  )}>
                    {feature.title}
                  </h3>
                  <p className={cn('text-sm leading-relaxed', isDark ? 'text-amber-50/50' : 'text-slate-600')}>
                    {feature.description}
                  </p>
                </div>
              </motion.div>
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
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 253, 244, 0.8) 100%)',
              border: `1px solid ${isDark ? 'rgba(0, 107, 63, 0.3)' : 'rgba(0, 107, 63, 0.2)'}`,
              boxShadow: isDark ? 'none' : '0 8px 40px rgba(0, 107, 63, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04)',
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

              <h2 className={cn('font-heading text-3xl lg:text-4xl font-bold mb-4', isDark ? 'text-amber-50' : 'text-slate-900')}>
                Ready to Experience AI-Powered Research?
              </h2>

              <p className={cn('text-lg max-w-xl mx-auto mb-8', isDark ? theme.textMuted : 'text-slate-600')}>
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
          <div className="flex flex-col gap-8">
            {/* Main Footer Row */}
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

              {/* Legal Links */}
              <div className="flex items-center gap-6">
                <a
                  href="/privacy"
                  className={cn(
                    'group flex items-center gap-2 text-sm transition-all duration-300',
                    isDark ? 'text-amber-50/50 hover:text-amber-50' : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: isDark ? 'rgba(252, 209, 22, 0.1)' : 'rgba(0, 107, 63, 0.08)',
                      border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.15)' : 'rgba(0, 107, 63, 0.12)'}`,
                    }}
                  >
                    <Shield className={cn('w-3.5 h-3.5', isDark ? 'text-secondary-400' : 'text-primary-600')} />
                  </div>
                  <span className="font-medium">Privacy Policy</span>
                </a>
                <div
                  className="w-px h-5 hidden sm:block"
                  style={{ background: isDark ? 'rgba(245, 240, 230, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                />
                <a
                  href="/terms"
                  className={cn(
                    'group flex items-center gap-2 text-sm transition-all duration-300',
                    isDark ? 'text-amber-50/50 hover:text-amber-50' : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: isDark ? 'rgba(252, 209, 22, 0.1)' : 'rgba(0, 107, 63, 0.08)',
                      border: `1px solid ${isDark ? 'rgba(252, 209, 22, 0.15)' : 'rgba(0, 107, 63, 0.12)'}`,
                    }}
                  >
                    <ScrollText className={cn('w-3.5 h-3.5', isDark ? 'text-secondary-400' : 'text-primary-600')} />
                  </div>
                  <span className="font-medium">Terms of Service</span>
                </a>
              </div>

              <div className="flex h-1 w-24 rounded-full overflow-hidden">
                <div className="w-1/3 bg-accent-500" />
                <div className="w-1/3 bg-secondary-500" />
                <div className="w-1/3 bg-primary-500" />
              </div>
            </div>

            {/* Copyright Row */}
            <div
              className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center"
              style={{ borderTop: `1px solid ${isDark ? 'rgba(245, 240, 230, 0.03)' : 'rgba(0, 0, 0, 0.03)'}` }}
            >
              <p className={cn('text-xs', theme.textGhost)}>
                © {new Date().getFullYear()} Office of the Head of Civil Service, Ghana. All rights reserved.
              </p>
            </div>
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
