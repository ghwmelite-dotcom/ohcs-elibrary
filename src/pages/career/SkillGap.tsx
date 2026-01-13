import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Zap,
  Star,
  BarChart3,
  ArrowRight,
  GraduationCap,
  Play,
} from 'lucide-react';
import { useCareerStore } from '@/stores/careerStore';
import type { UserSkillAssessment, SkillCategory } from '@/types/career';
import { cn } from '@/utils/cn';

// Recommended courses based on skill gaps (integrates with LMS)
const skillToCourses: Record<string, { id: string; title: string; duration: string; level: string }[]> = {
  'Strategic Planning': [
    { id: 'course-1', title: 'Strategic Planning for Public Sector', duration: '8 hours', level: 'Intermediate' },
    { id: 'course-2', title: 'Results-Based Management', duration: '6 hours', level: 'Advanced' },
  ],
  'Policy Analysis': [
    { id: 'course-3', title: 'Policy Analysis Fundamentals', duration: '10 hours', level: 'Beginner' },
    { id: 'course-4', title: 'Evidence-Based Policy Making', duration: '12 hours', level: 'Intermediate' },
  ],
  'Budget Management': [
    { id: 'course-5', title: 'Public Financial Management', duration: '15 hours', level: 'Intermediate' },
    { id: 'course-6', title: 'Budget Preparation & Execution', duration: '8 hours', level: 'Beginner' },
  ],
  'Team Leadership': [
    { id: 'course-7', title: 'Leadership Development Program', duration: '20 hours', level: 'Intermediate' },
    { id: 'course-8', title: 'Team Building & Motivation', duration: '6 hours', level: 'Beginner' },
  ],
};

// ============================================================================
// SKILL CATEGORY BADGE
// ============================================================================
const categoryConfig: Record<SkillCategory, { color: string; bg: string; label: string }> = {
  technical: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Technical' },
  soft: { color: 'text-pink-700', bg: 'bg-pink-100', label: 'Soft Skills' },
  leadership: { color: 'text-purple-700', bg: 'bg-purple-100', label: 'Leadership' },
  digital: { color: 'text-cyan-700', bg: 'bg-cyan-100', label: 'Digital' },
  language: { color: 'text-orange-700', bg: 'bg-orange-100', label: 'Language' },
  domain: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Domain' },
};

function CategoryBadge({ category }: { category: SkillCategory }) {
  const config = categoryConfig[category];
  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', config.bg, config.color)}>
      {config.label}
    </span>
  );
}

// ============================================================================
// READINESS GAUGE
// ============================================================================
function ReadinessGauge({ value }: { value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (value >= 80) return '#10B981';
    if (value >= 60) return '#8B5CF6';
    if (value >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6 }}
      className="relative w-48 h-48 mx-auto"
    >
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="12"
          fill="none"
        />
        <motion.circle
          cx="96"
          cy="96"
          r={radius}
          stroke={getColor()}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset } : {}}
          transition={{ delay: 0.3, duration: 1.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-4xl font-bold text-gray-900"
        >
          {value}%
        </motion.span>
        <span className="text-sm text-gray-500">Ready</span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SKILL CARD
// ============================================================================
interface SkillCardProps {
  skill: UserSkillAssessment;
  type: 'critical' | 'moderate' | 'strength';
  index: number;
}

function SkillCard({ skill, type, index }: SkillCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const getTypeConfig = () => {
    switch (type) {
      case 'critical':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          progressColor: 'bg-red-500',
        };
      case 'moderate':
        return {
          border: 'border-amber-200',
          bg: 'bg-amber-50',
          icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
          progressColor: 'bg-amber-500',
        };
      case 'strength':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
          progressColor: 'bg-green-500',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={cn('p-5 rounded-2xl border', config.border, config.bg)}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <h4 className="font-semibold text-gray-900">{skill.skillName}</h4>
            <CategoryBadge category={skill.category} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Gap</p>
          <p className={cn('text-lg font-bold', skill.gap > 0 ? 'text-red-600' : 'text-green-600')}>
            {skill.gap > 0 ? `-${skill.gap}` : 'None'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Current Level</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  'w-4 h-4 rounded-full',
                  level <= skill.currentLevel ? config.progressColor : 'bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Target Level</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  'w-4 h-4 rounded-full border-2',
                  level <= skill.targetLevel ? 'border-purple-500 bg-purple-100' : 'border-gray-200 bg-white'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{skill.progress}%</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: `${skill.progress}%` } : {}}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', config.progressColor)}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function SkillGap() {
  const { skillGapReport, loadCareerData, isLoading } = useCareerStore();

  useEffect(() => {
    loadCareerData();
  }, [loadCareerData]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Analyzing Skills...</p>
        </div>
      </div>
    );
  }

  if (!skillGapReport) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Assessment Available</h2>
          <p className="text-gray-500">Complete a skill assessment to see your gap analysis.</p>
        </div>
      </div>
    );
  }

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
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h1>
            <p className="text-gray-500">Identify areas for development to reach your target role</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Readiness Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <h3 className="font-semibold text-gray-900 text-center mb-4">Overall Readiness</h3>
          <ReadinessGauge value={skillGapReport.overallReadiness} />
          <p className="text-center text-sm text-gray-500 mt-4">
            for <span className="font-medium text-gray-900">{skillGapReport.targetRoleName}</span>
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Gap Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-gray-700">Critical Gaps</span>
              </div>
              <span className="text-lg font-bold text-red-600">{skillGapReport.criticalGaps.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span className="text-gray-700">Moderate Gaps</span>
              </div>
              <span className="text-lg font-bold text-amber-600">{skillGapReport.moderateGaps.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Strengths</span>
              </div>
              <span className="text-lg font-bold text-green-600">{skillGapReport.strengths.length}</span>
            </div>
          </div>
        </motion.div>

        {/* Time Estimate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white"
        >
          <h3 className="font-semibold mb-4">Estimated Time to Ready</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-4xl font-bold">{skillGapReport.estimatedTimeToReady}</p>
              <p className="text-white/80">months</p>
            </div>
          </div>
          <p className="text-sm text-white/80">
            Based on your current pace and learning activities
          </p>
        </motion.div>
      </div>

      {/* Critical Gaps */}
      {skillGapReport.criticalGaps.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">Critical Gaps</h2>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              Priority
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {skillGapReport.criticalGaps.map((skill, index) => (
              <SkillCard key={skill.skillId} skill={skill} type="critical" index={index} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Moderate Gaps */}
      {skillGapReport.moderateGaps.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">Areas for Improvement</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {skillGapReport.moderateGaps.map((skill, index) => (
              <SkillCard key={skill.skillId} skill={skill} type="moderate" index={index} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Strengths */}
      {skillGapReport.strengths.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-gray-900">Your Strengths</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {skillGapReport.strengths.map((skill, index) => (
              <SkillCard key={skill.skillId} skill={skill} type="strength" index={index} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Recommended Courses - LMS Integration */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recommended Courses</h2>
              <p className="text-sm text-gray-600">Based on your skill gaps</p>
            </div>
          </div>
          <Link
            to="/courses"
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1"
          >
            View All Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {skillGapReport.criticalGaps.slice(0, 2).map((skill) => {
            const courses = skillToCourses[skill.skillName] || [];
            return courses.map((course) => (
              <Link
                key={course.id}
                to="/courses"
                className="bg-white rounded-xl p-4 border border-indigo-100 hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <Play className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {course.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.duration}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                        {course.level}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 mt-2">
                      Addresses: {skill.skillName}
                    </p>
                  </div>
                </div>
              </Link>
            ));
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-indigo-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Complete these courses to close your skill gaps faster
          </p>
          <Link
            to="/my-courses"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Start Learning
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
