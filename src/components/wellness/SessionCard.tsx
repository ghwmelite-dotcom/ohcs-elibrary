import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageCircle,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CounselorSession } from '@/types';

interface SessionCardProps {
  session: CounselorSession;
  onClick?: () => void;
}

const statusIcons = {
  active: Clock,
  completed: CheckCircle,
  escalated: AlertCircle,
};

const statusColors = {
  active: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  completed: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  escalated: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
};

const topicLabels: Record<string, string> = {
  work_stress: 'Work Stress',
  career: 'Career',
  relationships: 'Relationships',
  personal: 'Personal',
  financial: 'Financial',
  general: 'General',
};

const moodEmojis: Record<number, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

export function SessionCard({ session, onClick }: SessionCardProps) {
  const StatusIcon = statusIcons[session.status];
  const statusColor = statusColors[session.status];

  const timeAgo = session.lastMessageAt || session.createdAt
    ? formatDistanceToNow(new Date(session.lastMessageAt || session.createdAt), { addSuffix: true })
    : 'Recently';

  return (
    <motion.div
      onClick={onClick}
      className="group p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition-all cursor-pointer"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {/* Status badge */}
            <span className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              statusColor
            )}>
              <StatusIcon className="w-3 h-3" />
              <span className="capitalize">{session.status}</span>
            </span>

            {/* Topic badge */}
            {session.topic && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400">
                {topicLabels[session.topic] || session.topic}
              </span>
            )}

            {/* Anonymous indicator */}
            {session.isAnonymous && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                Anonymous
              </span>
            )}
          </div>

          {/* Title or first message preview */}
          <h3 className="font-medium text-surface-900 dark:text-surface-50 mb-1 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {session.title || `Session from ${timeAgo}`}
          </h3>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {session.messageCount} messages
            </span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Right side - Mood and arrow */}
        <div className="flex items-center gap-3">
          {session.mood && (
            <span className="text-2xl" title={`Starting mood: ${session.mood}/5`}>
              {moodEmojis[session.mood]}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-surface-400 dark:text-surface-500 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.div>
  );
}
