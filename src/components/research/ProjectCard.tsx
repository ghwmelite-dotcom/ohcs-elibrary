import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  BookOpen,
  Lightbulb,
  FileText,
  ChevronRight,
  Clock,
  Target,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ResearchProject } from '@/types';
import {
  RESEARCH_CATEGORIES,
  RESEARCH_STATUSES,
  RESEARCH_PHASES,
} from '@/stores/researchStore';

interface ProjectCardProps {
  project: ResearchProject;
  variant?: 'default' | 'compact';
  className?: string;
}

export function ProjectCard({ project, variant = 'default', className }: ProjectCardProps) {
  const category = RESEARCH_CATEGORIES[project.category];
  const status = RESEARCH_STATUSES[project.status];
  const phase = RESEARCH_PHASES[project.phase];

  const formatDate = (date?: string) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (variant === 'compact') {
    return (
      <Link to={`/research-hub/projects/${project.id}`}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={cn(
            'flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
            'hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all',
            className
          )}
        >
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg', category.color)}>
            {category.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {project.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {phase.label} • {project.progress}% complete
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-1 text-xs font-medium text-white rounded-full', status.color)}>
              {status.label}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/research-hub/projects/${project.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
          'hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg transition-all',
          'overflow-hidden group',
          className
        )}
      >
        {/* Header with category color */}
        <div className={cn('h-2', category.color)} />

        <div className="p-5">
          {/* Category & Status */}
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <span>{category.icon}</span>
              {category.label}
            </span>
            <span className={cn('px-2.5 py-1 text-xs font-medium text-white rounded-full', status.color)}>
              {status.label}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
            {project.description || project.researchQuestion}
          </p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {phase.label}
              </span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {project.teamMemberCount || 1}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {project.literatureCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Lightbulb className="w-4 h-4" />
              {project.insightCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {project.briefCount || 0}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            {/* Team Lead */}
            <div className="flex items-center gap-2">
              {project.teamLead?.avatar ? (
                <img
                  src={project.teamLead.avatar}
                  alt={project.teamLead.displayName}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    {project.teamLead?.displayName?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {project.teamLead?.displayName || 'Unknown'}
              </span>
            </div>

            {/* Date */}
            {project.targetEndDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                {formatDate(project.targetEndDate)}
              </span>
            )}
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default ProjectCard;
