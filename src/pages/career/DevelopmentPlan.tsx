import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Map,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Play,
  Pause,
  Award,
  Zap,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useCareerStore } from '@/stores/careerStore';
import type { DevelopmentGoal, GoalStatus } from '@/types/career';
import { cn } from '@/utils/cn';

// ============================================================================
// STATUS BADGE
// ============================================================================
const statusConfig: Record<GoalStatus, { color: string; bg: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  not_started: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Not Started', icon: Circle },
  in_progress: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'In Progress', icon: Play },
  completed: { color: 'text-green-600', bg: 'bg-green-100', label: 'Completed', icon: CheckCircle2 },
  on_hold: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'On Hold', icon: Pause },
};

function StatusBadge({ status }: { status: GoalStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.bg, config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ============================================================================
// PRIORITY BADGE
// ============================================================================
const priorityConfig = {
  high: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  low: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
};

// ============================================================================
// GOAL CARD
// ============================================================================
interface GoalCardProps {
  goal: DevelopmentGoal;
  onUpdateProgress: (goalId: string, progress: number) => void;
  index: number;
}

function GoalCard({ goal, onUpdateProgress, index }: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(goal.status === 'in_progress');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const totalMilestones = goal.milestones.length;

  const getCategoryIcon = () => {
    switch (goal.category) {
      case 'skill':
        return Target;
      case 'competency':
        return GraduationCap;
      case 'qualification':
        return Award;
      case 'experience':
        return Briefcase;
      case 'personal':
        return Star;
    }
  };

  const CategoryIcon = getCategoryIcon();
  const priority = priorityConfig[goal.priority];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={cn(
        'bg-white rounded-2xl border overflow-hidden transition-all duration-300',
        goal.status === 'completed' ? 'border-green-200' : 'border-gray-100 hover:shadow-lg'
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 text-left"
      >
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', priority.bg)}>
            <CategoryIcon className={cn('w-6 h-6', priority.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>
              {goal.priority === 'high' && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                  Priority
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 line-clamp-1">{goal.description}</p>

            <div className="flex items-center gap-4 mt-3">
              <StatusBadge status={goal.status} />
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Due: {new Date(goal.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-2xl font-bold text-gray-900">{goal.progress}%</span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: `${goal.progress}%` } : {}}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              goal.status === 'completed' ? 'bg-green-500' : 'bg-purple-500'
            )}
          />
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-100"
          >
            <div className="p-5 space-y-5">
              {/* Milestones */}
              {goal.milestones.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Milestones ({completedMilestones}/{totalMilestones})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {goal.milestones.map((milestone, i) => (
                      <div
                        key={milestone.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl transition-colors',
                          milestone.completed ? 'bg-green-50' : 'bg-gray-50'
                        )}
                      >
                        {milestone.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                        <span
                          className={cn(
                            'text-sm',
                            milestone.completed ? 'text-green-700 line-through' : 'text-gray-700'
                          )}
                        >
                          {milestone.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Skills */}
              {goal.linkedSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Linked Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {goal.linkedSkills.map((skillId) => (
                      <span
                        key={skillId}
                        className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-lg"
                      >
                        {skillId.replace('skill-', 'Skill ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {goal.status !== 'completed' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => onUpdateProgress(goal.id, Math.min(100, goal.progress + 10))}
                    className="flex-1 py-2.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors"
                  >
                    +10% Progress
                  </button>
                  {goal.progress >= 90 && (
                    <button
                      onClick={() => onUpdateProgress(goal.id, 100)}
                      className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function DevelopmentPlan() {
  const { currentPlan, loadCareerData, updateGoalProgress, isLoading } = useCareerStore();

  useEffect(() => {
    loadCareerData();
  }, [loadCareerData]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Development Plan...</p>
        </div>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Development Plan</h2>
          <p className="text-gray-500 mb-6">Create a personalized development plan to track your goals.</p>
          <button className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors shadow-lg">
            Create Plan
          </button>
        </div>
      </div>
    );
  }

  const completedGoals = currentPlan.goals.filter((g) => g.status === 'completed').length;
  const inProgressGoals = currentPlan.goals.filter((g) => g.status === 'in_progress').length;
  const totalGoals = currentPlan.goals.length;

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
          <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
            <Map className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Development Plan</h1>
            <p className="text-gray-500">Track your personal growth objectives</p>
          </div>
        </div>
      </motion.div>

      {/* Plan Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full backdrop-blur-sm">
                {currentPlan.status === 'active' ? 'Active Plan' : currentPlan.status}
              </span>
              <h2 className="text-2xl font-bold mt-3">{currentPlan.title}</h2>
              <p className="text-white/80 mt-1">{currentPlan.description}</p>
              {currentPlan.targetRole && (
                <div className="flex items-center gap-2 mt-3">
                  <Target className="w-4 h-4" />
                  <span>Target: {currentPlan.targetRole}</span>
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <div className="w-32 h-32 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,0.2)" strokeWidth="10" fill="none" />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="white"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 339.29 }}
                    animate={{ strokeDashoffset: 339.29 - (339.29 * currentPlan.overallProgress) / 100 }}
                    transition={{ delay: 0.3, duration: 1.5, ease: 'easeOut' }}
                    style={{ strokeDasharray: 339.29 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{currentPlan.overallProgress}%</span>
                  <span className="text-sm text-white/80">Complete</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white/70 text-sm">Total Goals</p>
              <p className="text-2xl font-bold">{totalGoals}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white/70 text-sm">In Progress</p>
              <p className="text-2xl font-bold">{inProgressGoals}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white/70 text-sm">Completed</p>
              <p className="text-2xl font-bold">{completedGoals}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Goals List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Development Goals</h2>
        </div>

        <div className="space-y-4">
          {currentPlan.goals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdateProgress={updateGoalProgress}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Tips for Success</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-blue-500" />
                Focus on high-priority goals first to maximize your promotion readiness
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-blue-500" />
                Update your progress regularly to stay motivated and track achievements
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-blue-500" />
                Connect with a mentor to get guidance on achieving your goals faster
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
