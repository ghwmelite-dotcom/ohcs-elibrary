import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Route,
  Briefcase,
  Users,
  Monitor,
  ChevronRight,
  Clock,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { useCareerStore } from '@/stores/careerStore';
import type { CareerPath, CareerGrade } from '@/types/career';
import { cn } from '@/utils/cn';

// ============================================================================
// ICON MAP
// ============================================================================
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Users,
  Monitor,
};

// ============================================================================
// CAREER PATH CARD
// ============================================================================
interface PathCardProps {
  path: CareerPath;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

function PathCard({ path, isSelected, onClick, index }: PathCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const Icon = iconMap[path.icon] || Briefcase;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left p-6 rounded-2xl border-2 transition-all duration-300',
          isSelected
            ? 'border-purple-500 bg-purple-50 shadow-lg'
            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${path.color}15` }}
          >
            <Icon className="w-7 h-7" style={{ color: path.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">{path.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{path.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {path.grades.length} Grades
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {path.totalYearsToTop} Years
              </span>
            </div>
          </div>
          <ChevronRight
            className={cn(
              'w-5 h-5 transition-transform',
              isSelected ? 'text-purple-500 rotate-90' : 'text-gray-400'
            )}
          />
        </div>
      </button>
    </motion.div>
  );
}

// ============================================================================
// GRADE TIMELINE
// ============================================================================
interface GradeTimelineProps {
  grades: CareerGrade[];
  pathColor: string;
}

function GradeTimeline({ grades, pathColor }: GradeTimelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  // Current user position (demo)
  const currentGradeIndex = 2;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {grades.map((grade, index) => {
          const isPast = index < currentGradeIndex;
          const isCurrent = index === currentGradeIndex;
          const isFuture = index > currentGradeIndex;

          return (
            <motion.div
              key={grade.id}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative flex gap-4"
            >
              {/* Timeline node */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center border-2',
                    isCurrent
                      ? 'border-purple-500 bg-purple-100'
                      : isPast
                      ? 'border-green-500 bg-green-100'
                      : 'border-gray-200 bg-white'
                  )}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                  ) : isCurrent ? (
                    <Star className="w-7 h-7 text-purple-600" />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                  )}
                </div>
              </div>

              {/* Grade content */}
              <div
                className={cn(
                  'flex-1 p-5 rounded-2xl border transition-all',
                  isCurrent
                    ? 'border-purple-200 bg-purple-50 shadow-md'
                    : isPast
                    ? 'border-green-100 bg-green-50/50'
                    : 'border-gray-100 bg-white'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: `${pathColor}20`,
                          color: pathColor,
                        }}
                      >
                        {grade.code}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">
                          You are here
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{grade.title}</h4>
                    <p className="text-sm text-gray-500">{grade.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-500">Years Required</p>
                    <p className="text-lg font-bold text-gray-900">{grade.yearsRequired}+</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      GHS {grade.salaryBand.min.toLocaleString()} - {grade.salaryBand.max.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="capitalize">{grade.level.replace('_', ' ')} Level</span>
                  </div>
                </div>

                {/* Responsibilities */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Key Responsibilities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {grade.responsibilities.map((resp, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
                      >
                        {resp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function CareerPaths() {
  const { careerPaths, loadCareerData, selectedCareerPath, setSelectedCareerPath, isLoading } = useCareerStore();
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);

  useEffect(() => {
    loadCareerData();
  }, [loadCareerData]);

  useEffect(() => {
    if (selectedCareerPath) {
      const path = careerPaths.find((p) => p.id === selectedCareerPath);
      if (path) setSelectedPath(path);
    } else if (careerPaths.length > 0 && !selectedPath) {
      setSelectedPath(careerPaths[0]);
    }
  }, [careerPaths, selectedCareerPath]);

  const handleSelectPath = (path: CareerPath) => {
    setSelectedPath(path);
    setSelectedCareerPath(path.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Career Paths...</p>
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
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <Route className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Career Paths</h1>
            <p className="text-gray-500">Explore progression routes in the Ghana Civil Service</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Path Selection */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Select a Path</h2>
          {careerPaths.map((path, index) => (
            <PathCard
              key={path.id}
              path={path}
              isSelected={selectedPath?.id === path.id}
              onClick={() => handleSelectPath(path)}
              index={index}
            />
          ))}
        </div>

        {/* Grade Timeline */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedPath && (
              <motion.div
                key={selectedPath.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedPath.name}</h2>
                      <p className="text-gray-500">{selectedPath.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Journey</p>
                      <p className="text-2xl font-bold" style={{ color: selectedPath.color }}>
                        {selectedPath.totalYearsToTop} Years
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-4">Grade Progression</h3>
                <GradeTimeline grades={selectedPath.grades} pathColor={selectedPath.color} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
