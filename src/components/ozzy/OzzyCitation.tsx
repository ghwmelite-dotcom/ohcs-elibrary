/**
 * OzzyCitation Component
 * Displays a citation card with link to source document
 */

import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import type { OzzyCitation as CitationType } from '@/types';

interface OzzyCitationProps {
  citation: CitationType;
  index: number;
}

export function OzzyCitation({ citation, index }: OzzyCitationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const relevanceColor =
    citation.relevanceScore >= 0.7
      ? 'text-green-600 dark:text-green-400'
      : citation.relevanceScore >= 0.5
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-surface-500 dark:text-surface-400';

  return (
    <div
      className={cn(
        'border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden',
        'bg-surface-50 dark:bg-surface-800/50',
        'transition-all duration-200'
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 p-3 text-left',
          'hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors'
        )}
      >
        <div className="flex-shrink-0 w-6 h-6 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
            {index + 1}
          </span>
        </div>

        <FileText className="w-4 h-4 text-surface-400 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
            {citation.documentTitle}
          </p>
          {citation.section && (
            <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
              {citation.section}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('text-xs font-medium', relevanceColor)}>
            {Math.round(citation.relevanceScore * 100)}%
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-surface-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-surface-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 pb-3 border-t border-surface-200 dark:border-surface-700">
              <p className="text-sm text-surface-600 dark:text-surface-300 py-3 italic">
                "{citation.chunkContent}"
              </p>

              <div className="flex items-center justify-between">
                {citation.pageNumber && (
                  <span className="text-xs text-surface-500 dark:text-surface-400">
                    Page {citation.pageNumber}
                  </span>
                )}

                <Link
                  to={`/library/${citation.documentId}`}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-medium',
                    'text-primary-600 dark:text-primary-400 hover:underline'
                  )}
                >
                  View Document
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CitationsListProps {
  citations: CitationType[];
}

export function CitationsList({ citations }: CitationsListProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
        Sources ({citations.length})
      </p>
      <div className="space-y-2">
        {citations.map((citation, index) => (
          <OzzyCitation key={citation.documentId + index} citation={citation} index={index} />
        ))}
      </div>
    </div>
  );
}
