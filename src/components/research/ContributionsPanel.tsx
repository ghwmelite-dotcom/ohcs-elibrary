import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Users,
  Award,
  Star,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useResearchApi } from '@/hooks/useResearchApi';
import { ErrorAlert } from './ErrorAlert';
import type { ResearchContribution } from '@/types';

interface ContributionsPanelProps {
  projectId: string;
}

const TYPE_LABELS: Record<string, string> = {
  note_created: 'Notes',
  note_edited: 'Edits',
  citation_added: 'Citations',
  literature_added: 'Literature',
  discussion_started: 'Discussions',
  discussion_replied: 'Replies',
  review_submitted: 'Reviews',
  insight_generated: 'Insights',
  brief_generated: 'Briefs',
  milestone_completed: 'Milestones',
  export_generated: 'Exports',
  file_uploaded: 'Files',
};

const TYPE_COLORS: Record<string, string> = {
  note_created: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  note_edited: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  citation_added: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  literature_added: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  discussion_started: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  discussion_replied: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  review_submitted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  insight_generated: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  brief_generated: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  milestone_completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  export_generated: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  file_uploaded: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
};

const RANK_STYLES: Record<number, { bg: string; text: string; icon: string }> = {
  1: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: 'text-amber-500',
  },
  2: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-600 dark:text-slate-300',
    icon: 'text-slate-400',
  },
  3: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-400',
    icon: 'text-orange-600 dark:text-orange-500',
  },
};

function parseTypes(types: string): string[] {
  if (!types) return [];
  return types
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ContributionsPanel({ projectId }: ContributionsPanelProps) {
  const { authFetch } = useResearchApi();
  const [contributions, setContributions] = useState<ResearchContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`/projects/${projectId}/contributions`);
      if (!response.ok) throw new Error('Failed to fetch contributions');
      const data = await response.json();
      setContributions(data.items ?? []);
    } catch (err) {
      setError('Failed to load contributions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, authFetch]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
          <div className="h-5 w-48 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 animate-pulse"
          >
            <div className="w-6 h-6 bg-surface-200 dark:bg-surface-700 rounded" />
            <div className="w-10 h-10 bg-surface-200 dark:bg-surface-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-surface-200 dark:bg-surface-700 rounded" />
              <div className="h-3 w-20 bg-surface-200 dark:bg-surface-700 rounded" />
            </div>
            <div className="h-6 w-16 bg-surface-200 dark:bg-surface-700 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
        <div className="text-center">
          <button
            onClick={fetchContributions}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
          No contributions yet
        </h3>
        <p className="text-surface-500 dark:text-surface-400">
          Start collaborating!
        </p>
      </div>
    );
  }

  const displayed = showAll ? contributions : contributions.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Team Contributions
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {contributions.length} contributor{contributions.length !== 1 ? 's' : ''} ranked by points
          </p>
        </div>
        <button
          onClick={fetchContributions}
          className="p-2 text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Contributor List */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {displayed.map((contributor, index) => {
            const rank = index + 1;
            const rankStyle = RANK_STYLES[rank];
            const types = parseTypes(contributor.types);

            return (
              <motion.div
                key={contributor.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border transition-colors',
                  rankStyle
                    ? cn(rankStyle.bg, 'border-transparent')
                    : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                )}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  {rank <= 3 ? (
                    <div className="flex flex-col items-center">
                      {rank === 1 ? (
                        <Trophy className={cn('w-5 h-5', rankStyle?.icon)} />
                      ) : rank === 2 ? (
                        <Award className={cn('w-5 h-5', rankStyle?.icon)} />
                      ) : (
                        <Star className={cn('w-5 h-5', rankStyle?.icon)} />
                      )}
                      <span className={cn('text-xs font-bold mt-0.5', rankStyle?.text)}>
                        #{rank}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-surface-400">
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {contributor.avatar ? (
                    <img
                      src={contributor.avatar}
                      alt={contributor.displayName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-surface-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center ring-2 ring-white dark:ring-surface-800">
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {getInitials(contributor.displayName)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">
                      {contributor.displayName}
                    </span>
                  </div>

                  {/* Type Tags */}
                  {types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {types.map((type) => (
                        <span
                          key={type}
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                            TYPE_COLORS[type] || 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
                          )}
                        >
                          {TYPE_LABELS[type] || type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-surface-500 dark:text-surface-400">
                      Contributions
                    </span>
                    <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                      {contributor.total_contributions}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-bold',
                      rank === 1
                        ? 'bg-amber-500 text-white'
                        : rank === 2
                          ? 'bg-slate-400 text-white'
                          : rank === 3
                            ? 'bg-orange-500 text-white'
                            : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    )}
                  >
                    {contributor.total_points.toLocaleString()} pts
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More / Less */}
      {contributions.length > 10 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show All ({contributions.length}) <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default ContributionsPanel;
