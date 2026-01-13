import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  TrendingUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Calendar,
  Award,
  ArrowRight,
  ChevronRight,
  Briefcase,
  GraduationCap,
  FileCheck,
  Star,
  Target,
  Zap,
} from 'lucide-react';
import { useCareerStore } from '@/stores/careerStore';
import { cn } from '@/utils/cn';

// ============================================================================
// PROGRESS RING
// ============================================================================
function ProgressRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 80) return { stroke: '#10B981', bg: 'bg-green-100' };
    if (progress >= 60) return { stroke: '#8B5CF6', bg: 'bg-purple-100' };
    if (progress >= 40) return { stroke: '#F59E0B', bg: 'bg-amber-100' };
    return { stroke: '#EF4444', bg: 'bg-red-100' };
  };

  const colors = getColor();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6 }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="10"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset } : {}}
          transition={{ delay: 0.3, duration: 1.5, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-surface-900 dark:text-surface-100">{progress}%</span>
        <span className="text-xs text-surface-500 dark:text-surface-400">Complete</span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// CRITERIA ITEM
// ============================================================================
interface CriteriaItemProps {
  criteria: {
    criteriaId: string;
    criteriaName: string;
    met: boolean;
    progress: number;
    details: string;
  };
  index: number;
}

function CriteriaItem({ criteria, index }: CriteriaItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const getIcon = () => {
    if (criteria.criteriaName.toLowerCase().includes('year')) return Clock;
    if (criteria.criteriaName.toLowerCase().includes('training')) return GraduationCap;
    if (criteria.criteriaName.toLowerCase().includes('exam')) return FileCheck;
    if (criteria.criteriaName.toLowerCase().includes('performance')) return Star;
    if (criteria.criteriaName.toLowerCase().includes('competency')) return Target;
    return Award;
  };

  const Icon = getIcon();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={cn(
        'p-5 rounded-2xl border transition-all',
        criteria.met
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30'
          : 'border-surface-100 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-200 dark:hover:border-surface-600 hover:shadow-md'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            criteria.met ? 'bg-green-100 dark:bg-green-900/50' : 'bg-surface-100 dark:bg-surface-700'
          )}
        >
          <Icon className={cn('w-6 h-6', criteria.met ? 'text-green-600 dark:text-green-400' : 'text-surface-500 dark:text-surface-400')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-surface-900 dark:text-surface-100">{criteria.criteriaName}</h4>
            {criteria.met && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">{criteria.details}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width: `${criteria.progress}%` } : {}}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  criteria.met ? 'bg-green-500' : criteria.progress >= 50 ? 'bg-amber-500' : 'bg-surface-400 dark:bg-surface-500'
                )}
              />
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                criteria.met ? 'text-green-600 dark:text-green-400' : 'text-surface-600 dark:text-surface-300'
              )}
            >
              {criteria.progress}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Promotion() {
  const { promotionStatus, loadCareerData, isLoading } = useCareerStore();

  useEffect(() => {
    loadCareerData();
  }, [loadCareerData]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-300">Loading Promotion Status...</p>
        </div>
      </div>
    );
  }

  if (!promotionStatus) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">No Promotion Data</h2>
          <p className="text-surface-500 dark:text-surface-400">Your promotion status will appear here.</p>
        </div>
      </div>
    );
  }

  const metCriteria = promotionStatus.criteriaProgress.filter((c) => c.met).length;
  const totalCriteria = promotionStatus.criteriaProgress.length;

  return (
    <div className="pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Promotion Tracker</h1>
            <p className="text-surface-500 dark:text-surface-400">Track your eligibility and criteria completion</p>
          </div>
        </div>
      </motion.div>

      {/* Current to Next Grade Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center gap-8">
          {/* From Grade */}
          <div className="flex-1">
            <p className="text-white/70 text-sm mb-1">Current Grade</p>
            <h2 className="text-2xl font-bold">{promotionStatus.currentGradeTitle}</h2>
            <div className="flex items-center gap-4 mt-3 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {promotionStatus.yearsInCurrentGrade} years in grade
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {promotionStatus.totalServiceYears} years total
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowRight className="w-8 h-8" />
            </div>
          </div>

          {/* To Grade */}
          <div className="flex-1 md:text-right">
            <p className="text-white/70 text-sm mb-1">Next Grade</p>
            <h2 className="text-2xl font-bold">{promotionStatus.nextGradeTitle}</h2>
            <div className="flex items-center gap-2 mt-3 md:justify-end">
              <Calendar className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">
                Eligible: {new Date(promotionStatus.eligibilityDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-1"
        >
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-6 text-center sticky top-6">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-6">Overall Progress</h3>
            <div className="flex justify-center mb-6">
              <ProgressRing progress={promotionStatus.overallProgress} size={160} />
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                <span className="text-sm text-surface-600 dark:text-surface-300">Criteria Met</span>
                <span className="font-bold text-surface-900 dark:text-surface-100">
                  {metCriteria}/{totalCriteria}
                </span>
              </div>

              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl',
                  promotionStatus.isEligible ? 'bg-green-50 dark:bg-green-900/30' : 'bg-amber-50 dark:bg-amber-900/30'
                )}
              >
                {promotionStatus.isEligible ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    promotionStatus.isEligible ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
                  )}
                >
                  {promotionStatus.isEligible ? 'Eligible for Promotion' : 'Not Yet Eligible'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Criteria List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Criteria */}
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Promotion Criteria</h3>
            <div className="space-y-4">
              {promotionStatus.criteriaProgress.map((criteria, index) => (
                <CriteriaItem key={criteria.criteriaId} criteria={criteria} index={index} />
              ))}
            </div>
          </div>

          {/* Blockers */}
          {promotionStatus.blockers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-surface-900 dark:text-surface-100">Current Blockers</h3>
              </div>
              <ul className="space-y-2">
                {promotionStatus.blockers.map((blocker, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-200">
                    <Circle className="w-2 h-2 mt-1.5 text-red-400 fill-current flex-shrink-0" />
                    {blocker}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Next Steps */}
          {promotionStatus.nextSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-surface-900 dark:text-surface-100">Recommended Next Steps</h3>
              </div>
              <ul className="space-y-3">
                {promotionStatus.nextSteps.map((step, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-surface-700 dark:text-surface-200 p-3 bg-white dark:bg-surface-800 rounded-xl"
                  >
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
