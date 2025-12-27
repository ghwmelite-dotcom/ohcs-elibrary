import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Lock,
  Eye,
  Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SecurityScore } from '@/stores/settingsStore';

interface SettingsHeroProps {
  securityScore: SecurityScore | null;
  isLoading: boolean;
  userName?: string;
  onImproveClick?: () => void;
}

// Animated counter component
function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(startValue + (value - startValue) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count}</span>;
}

// Circular progress component
function CircularProgress({
  value,
  size = 160,
  strokeWidth = 10,
  grade
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  grade: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getGradeColor = () => {
    switch (grade) {
      case 'A': return 'text-success-500';
      case 'B': return 'text-primary-500';
      case 'C': return 'text-warning-500';
      case 'D': return 'text-orange-500';
      default: return 'text-error-500';
    }
  };

  const getStrokeColor = () => {
    switch (grade) {
      case 'A': return 'stroke-success-500';
      case 'B': return 'stroke-primary-500';
      case 'C': return 'stroke-warning-500';
      case 'D': return 'stroke-orange-500';
      default: return 'stroke-error-500';
    }
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-surface-200 dark:stroke-surface-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={getStrokeColor()}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-bold', getGradeColor())}>
          <AnimatedCounter value={value} />
        </span>
        <span className="text-xs text-surface-500 font-medium uppercase tracking-wide">
          Security Score
        </span>
      </div>
    </div>
  );
}

export function SettingsHero({ securityScore, isLoading, userName, onImproveClick }: SettingsHeroProps) {
  const score = securityScore?.score || 0;
  const grade = securityScore?.grade || 'F';
  const factors = securityScore?.factors || [];

  const completedFactors = factors.filter(f => f.status === 'complete').length;
  const totalFactors = factors.length;

  const getGradeMessage = () => {
    switch (grade) {
      case 'A': return 'Excellent! Your account is well protected.';
      case 'B': return 'Good security! A few improvements possible.';
      case 'C': return 'Fair security. Consider enabling more protections.';
      case 'D': return 'Needs attention. Your account could be safer.';
      default: return 'Critical! Please secure your account immediately.';
    }
  };

  const getGradient = () => {
    switch (grade) {
      case 'A': return 'from-success-500/20 via-success-600/10 to-transparent';
      case 'B': return 'from-primary-500/20 via-primary-600/10 to-transparent';
      case 'C': return 'from-warning-500/20 via-warning-600/10 to-transparent';
      case 'D': return 'from-orange-500/20 via-orange-600/10 to-transparent';
      default: return 'from-error-500/20 via-error-600/10 to-transparent';
    }
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-2 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-2"
    >
      {/* Background gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br', getGradient())} />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-current opacity-20"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Left: Score Circle */}
          <div className="flex-shrink-0">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <CircularProgress value={score} grade={grade} />
            </motion.div>
          </div>

          {/* Middle: Info */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                {grade === 'A' ? (
                  <ShieldCheck className="w-6 h-6 text-success-500" />
                ) : grade === 'F' ? (
                  <ShieldAlert className="w-6 h-6 text-error-500" />
                ) : (
                  <Shield className="w-6 h-6 text-primary-500" />
                )}
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                  Account Security
                </h2>
              </div>

              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {getGradeMessage()}
              </p>

              <div className="flex items-center justify-center lg:justify-start gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  <span className="text-surface-700 dark:text-surface-300">
                    {completedFactors} of {totalFactors} protections active
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary-500" />
                  <span className="text-surface-700 dark:text-surface-300">
                    Grade {grade}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-2"
            >
              {score < 100 && (
                <button
                  onClick={onImproveClick}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  Improve Score
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Security Factors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {factors.slice(0, 4).map((factor, index) => (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                factor.status === 'complete'
                  ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                  : factor.status === 'warning'
                  ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                  : 'bg-surface-50 dark:bg-surface-700/50 border-surface-200 dark:border-surface-600'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                factor.status === 'complete'
                  ? 'bg-success-100 dark:bg-success-900/40'
                  : factor.status === 'warning'
                  ? 'bg-warning-100 dark:bg-warning-900/40'
                  : 'bg-surface-200 dark:bg-surface-600'
              )}>
                {factor.status === 'complete' ? (
                  <CheckCircle2 className="w-4 h-4 text-success-600 dark:text-success-400" />
                ) : factor.status === 'warning' ? (
                  <AlertCircle className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                ) : (
                  <Lock className="w-4 h-4 text-surface-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium truncate',
                  factor.status === 'complete'
                    ? 'text-success-700 dark:text-success-300'
                    : factor.status === 'warning'
                    ? 'text-warning-700 dark:text-warning-300'
                    : 'text-surface-600 dark:text-surface-400'
                )}>
                  {factor.name}
                </p>
                {factor.hint && (
                  <p className="text-xs text-surface-500 truncate">{factor.hint}</p>
                )}
              </div>
              <span className={cn(
                'text-xs font-medium',
                factor.points > 0
                  ? 'text-success-600 dark:text-success-400'
                  : factor.points < 0
                  ? 'text-error-600 dark:text-error-400'
                  : 'text-surface-400'
              )}>
                {factor.points > 0 ? '+' : ''}{factor.points}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
