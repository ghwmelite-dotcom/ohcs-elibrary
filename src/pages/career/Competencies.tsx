import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Target,
  BookOpen,
  Users,
  Lightbulb,
  Shield,
  MessageSquare,
  BarChart3,
  Briefcase,
  Heart,
  ArrowRight,
  Star,
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Ghana Civil Service Competency Framework (Official 7 Competencies)
const competencyFramework = [
  {
    id: 'teamwork',
    category: 'Teamwork',
    description: 'Working collaboratively with others to achieve shared goals and organizational objectives',
    color: 'blue',
    icon: Users,
    competencies: [
      {
        id: 'collaboration',
        name: 'Collaboration',
        description: 'Works effectively with colleagues across departments and levels',
        levels: [
          { level: 1, title: 'Basic', description: 'Participates in team activities when required' },
          { level: 2, title: 'Developing', description: 'Actively contributes to team goals' },
          { level: 3, title: 'Proficient', description: 'Facilitates team collaboration and resolves conflicts' },
          { level: 4, title: 'Advanced', description: 'Builds high-performing cross-functional teams' },
        ],
        userLevel: 3,
        relatedCourses: ['Team Building Workshop', 'Collaborative Leadership'],
      },
      {
        id: 'support',
        name: 'Supporting Others',
        description: 'Provides assistance and support to team members to achieve collective success',
        levels: [
          { level: 1, title: 'Basic', description: 'Helps colleagues when asked' },
          { level: 2, title: 'Developing', description: 'Proactively offers assistance' },
          { level: 3, title: 'Proficient', description: 'Mentors and develops team members' },
          { level: 4, title: 'Advanced', description: 'Creates a culture of mutual support' },
        ],
        userLevel: 2,
        relatedCourses: ['Peer Coaching Skills', 'Mentorship Program'],
      },
    ],
  },
  {
    id: 'professionalism',
    category: 'Professionalism',
    description: 'Maintaining high standards of conduct, appearance, and work ethic in the civil service',
    color: 'purple',
    icon: Briefcase,
    competencies: [
      {
        id: 'conduct',
        name: 'Professional Conduct',
        description: 'Demonstrates appropriate behavior and demeanor in all professional interactions',
        levels: [
          { level: 1, title: 'Basic', description: 'Follows workplace rules and dress code' },
          { level: 2, title: 'Developing', description: 'Consistently maintains professional standards' },
          { level: 3, title: 'Proficient', description: 'Models professional behavior for others' },
          { level: 4, title: 'Advanced', description: 'Sets and upholds professional standards organization-wide' },
        ],
        userLevel: 3,
        relatedCourses: ['Professional Ethics', 'Workplace Excellence'],
      },
      {
        id: 'development',
        name: 'Continuous Development',
        description: 'Commits to ongoing learning and professional growth',
        levels: [
          { level: 1, title: 'Basic', description: 'Completes mandatory training' },
          { level: 2, title: 'Developing', description: 'Seeks learning opportunities' },
          { level: 3, title: 'Proficient', description: 'Actively pursues professional development' },
          { level: 4, title: 'Advanced', description: 'Champions learning culture in organization' },
        ],
        userLevel: 3,
        relatedCourses: ['Career Development Planning', 'Lifelong Learning Strategies'],
      },
    ],
  },
  {
    id: 'organisation',
    category: 'Organisation & Management',
    description: 'Planning, organizing, and managing resources effectively to achieve objectives',
    color: 'emerald',
    icon: Briefcase,
    competencies: [
      {
        id: 'planning',
        name: 'Planning & Organizing',
        description: 'Develops and implements effective plans to achieve goals',
        levels: [
          { level: 1, title: 'Basic', description: 'Organizes own work tasks' },
          { level: 2, title: 'Developing', description: 'Plans team activities and resources' },
          { level: 3, title: 'Proficient', description: 'Develops departmental plans and strategies' },
          { level: 4, title: 'Advanced', description: 'Drives organizational strategic planning' },
        ],
        userLevel: 2,
        relatedCourses: ['Strategic Planning', 'Project Management Fundamentals'],
      },
      {
        id: 'resource',
        name: 'Resource Management',
        description: 'Manages human, financial, and material resources efficiently',
        levels: [
          { level: 1, title: 'Basic', description: 'Uses resources responsibly' },
          { level: 2, title: 'Developing', description: 'Manages allocated resources effectively' },
          { level: 3, title: 'Proficient', description: 'Optimizes resource allocation' },
          { level: 4, title: 'Advanced', description: 'Develops resource management strategies' },
        ],
        userLevel: 2,
        relatedCourses: ['Public Financial Management', 'Resource Optimization'],
      },
    ],
  },
  {
    id: 'productivity',
    category: 'Maximising & Maintaining Productivity',
    description: 'Achieving optimal output while maintaining quality and efficiency in service delivery',
    color: 'orange',
    icon: BarChart3,
    competencies: [
      {
        id: 'efficiency',
        name: 'Work Efficiency',
        description: 'Completes tasks effectively within required timeframes',
        levels: [
          { level: 1, title: 'Basic', description: 'Meets basic work requirements' },
          { level: 2, title: 'Developing', description: 'Consistently meets deadlines and targets' },
          { level: 3, title: 'Proficient', description: 'Exceeds productivity expectations' },
          { level: 4, title: 'Advanced', description: 'Drives productivity improvements across teams' },
        ],
        userLevel: 3,
        relatedCourses: ['Time Management', 'Productivity Enhancement'],
      },
      {
        id: 'quality',
        name: 'Quality Focus',
        description: 'Maintains high standards of quality in all work outputs',
        levels: [
          { level: 1, title: 'Basic', description: 'Produces acceptable quality work' },
          { level: 2, title: 'Developing', description: 'Consistently delivers quality outputs' },
          { level: 3, title: 'Proficient', description: 'Sets quality standards for team' },
          { level: 4, title: 'Advanced', description: 'Implements quality management systems' },
        ],
        userLevel: 3,
        relatedCourses: ['Quality Management', 'Continuous Improvement'],
      },
    ],
  },
  {
    id: 'leadership',
    category: 'Leadership',
    description: 'Guiding, inspiring, and developing others to achieve organizational goals',
    color: 'violet',
    icon: Star,
    competencies: [
      {
        id: 'vision',
        name: 'Vision & Direction',
        description: 'Provides clear direction and inspires others towards shared goals',
        levels: [
          { level: 1, title: 'Basic', description: 'Understands organizational vision' },
          { level: 2, title: 'Developing', description: 'Communicates vision to team' },
          { level: 3, title: 'Proficient', description: 'Translates vision into actionable plans' },
          { level: 4, title: 'Advanced', description: 'Shapes and drives organizational vision' },
        ],
        userLevel: 2,
        relatedCourses: ['Leadership Development Program', 'Visionary Leadership'],
      },
      {
        id: 'influence',
        name: 'Influence & Motivation',
        description: 'Inspires and motivates others to perform at their best',
        levels: [
          { level: 1, title: 'Basic', description: 'Supports team morale' },
          { level: 2, title: 'Developing', description: 'Motivates team members' },
          { level: 3, title: 'Proficient', description: 'Inspires high performance' },
          { level: 4, title: 'Advanced', description: 'Transforms organizational culture' },
        ],
        userLevel: 2,
        relatedCourses: ['Motivational Leadership', 'Emotional Intelligence'],
      },
    ],
  },
  {
    id: 'integrity',
    category: 'Integrity',
    description: 'Demonstrating honesty, transparency, and ethical behavior in all actions',
    color: 'teal',
    icon: Shield,
    competencies: [
      {
        id: 'ethics',
        name: 'Ethical Conduct',
        description: 'Adheres to ethical standards and acts with honesty',
        levels: [
          { level: 1, title: 'Basic', description: 'Follows code of conduct' },
          { level: 2, title: 'Developing', description: 'Demonstrates consistent ethical behavior' },
          { level: 3, title: 'Proficient', description: 'Promotes ethical culture in team' },
          { level: 4, title: 'Advanced', description: 'Champions integrity across organization' },
        ],
        userLevel: 4,
        relatedCourses: ['Ethics in Public Service', 'Anti-Corruption Training'],
      },
      {
        id: 'accountability',
        name: 'Accountability',
        description: 'Takes responsibility for actions and decisions',
        levels: [
          { level: 1, title: 'Basic', description: 'Accepts responsibility for own work' },
          { level: 2, title: 'Developing', description: 'Takes ownership of outcomes' },
          { level: 3, title: 'Proficient', description: 'Holds team accountable' },
          { level: 4, title: 'Advanced', description: 'Drives organizational accountability' },
        ],
        userLevel: 3,
        relatedCourses: ['Accountability in Public Service', 'Transparent Governance'],
      },
    ],
  },
  {
    id: 'communication',
    category: 'Communication',
    description: 'Exchanging information effectively through verbal, written, and non-verbal means',
    color: 'cyan',
    icon: MessageSquare,
    competencies: [
      {
        id: 'verbal',
        name: 'Verbal Communication',
        description: 'Expresses ideas clearly and effectively in speech',
        levels: [
          { level: 1, title: 'Basic', description: 'Communicates basic information clearly' },
          { level: 2, title: 'Developing', description: 'Presents ideas effectively' },
          { level: 3, title: 'Proficient', description: 'Delivers compelling presentations' },
          { level: 4, title: 'Advanced', description: 'Influences through masterful communication' },
        ],
        userLevel: 3,
        relatedCourses: ['Public Speaking', 'Presentation Skills'],
      },
      {
        id: 'written',
        name: 'Written Communication',
        description: 'Produces clear, concise, and professional written documents',
        levels: [
          { level: 1, title: 'Basic', description: 'Writes basic correspondence' },
          { level: 2, title: 'Developing', description: 'Produces professional documents' },
          { level: 3, title: 'Proficient', description: 'Drafts policy and strategic documents' },
          { level: 4, title: 'Advanced', description: 'Sets standards for official communications' },
        ],
        userLevel: 3,
        relatedCourses: ['Business Writing', 'Report Writing for Civil Servants'],
      },
    ],
  },
];

interface CompetencyCardProps {
  competency: typeof competencyFramework[0]['competencies'][0];
  categoryColor: string;
  index: number;
}

function CompetencyCard({ competency, categoryColor, index }: CompetencyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  };

  const colors = colorMap[categoryColor] || colorMap.blue;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={cn('bg-white rounded-xl border transition-all duration-300', isExpanded ? colors.border : 'border-gray-100')}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'w-3 h-3 rounded-full',
                    level <= competency.userLevel ? colors.bg.replace('50', '500') : 'bg-gray-200'
                  )}
                  style={level <= competency.userLevel ? { backgroundColor: categoryColor === 'emerald' ? '#10B981' : categoryColor === 'blue' ? '#3B82F6' : categoryColor === 'purple' ? '#8B5CF6' : '#F59E0B' } : {}}
                />
              ))}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{competency.name}</h4>
              <p className="text-sm text-gray-500">Level {competency.userLevel}/4</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">{competency.description}</p>

              {/* Levels */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Proficiency Levels</p>
                {competency.levels.map((level) => (
                  <div
                    key={level.level}
                    className={cn(
                      'flex items-start gap-3 p-2 rounded-lg',
                      level.level === competency.userLevel ? colors.bg : 'bg-gray-50'
                    )}
                  >
                    {level.level <= competency.userLevel ? (
                      <CheckCircle2 className={cn('w-4 h-4 mt-0.5', colors.text)} />
                    ) : (
                      <Circle className="w-4 h-4 mt-0.5 text-gray-300" />
                    )}
                    <div>
                      <p className={cn('text-sm font-medium', level.level === competency.userLevel ? colors.text : 'text-gray-700')}>
                        Level {level.level}: {level.title}
                      </p>
                      <p className="text-xs text-gray-500">{level.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Related Courses */}
              {competency.relatedCourses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recommended Courses</p>
                  <div className="flex flex-wrap gap-2">
                    {competency.relatedCourses.map((course) => (
                      <Link
                        key={course}
                        to="/courses"
                        className={cn('px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors', colors.bg, colors.text, 'hover:opacity-80')}
                      >
                        <BookOpen className="w-3 h-3" />
                        {course}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Competencies() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Calculate overall stats
  const totalCompetencies = competencyFramework.reduce((sum, cat) => sum + cat.competencies.length, 0);
  const avgLevel = competencyFramework.reduce((sum, cat) =>
    sum + cat.competencies.reduce((s, c) => s + c.userLevel, 0), 0) / totalCompetencies;

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
            <ClipboardList className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Competency Framework</h1>
            <p className="text-gray-500">Ghana Civil Service competencies for career advancement</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-6 mb-8 text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Your Competency Profile</h2>
            <p className="text-white/80">Track your development across {totalCompetencies} competencies</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{avgLevel.toFixed(1)}</p>
              <p className="text-sm text-white/80">Avg Level</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{totalCompetencies}</p>
              <p className="text-sm text-white/80">Competencies</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{competencyFramework.length}</p>
              <p className="text-sm text-white/80">Categories</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Competency Categories */}
      <div className="space-y-6">
        {competencyFramework.map((category, catIndex) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id || activeCategory === null;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1, duration: 0.5 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', `bg-${category.color}-100`)}>
                    <Icon className={cn('w-6 h-6', `text-${category.color}-600`)} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{category.category}</h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{category.competencies.length} competencies</span>
                  {isActive ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-5 space-y-3">
                      {category.competencies.map((competency, index) => (
                        <CompetencyCard
                          key={competency.id}
                          competency={competency}
                          categoryColor={category.color}
                          index={index}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Link to Skill Gap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Want a detailed analysis?</h3>
              <p className="text-sm text-gray-600">View your skill gaps compared to your target role</p>
            </div>
          </div>
          <Link
            to="/skill-gap"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            View Skill Gap <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
