import { motion } from 'framer-motion';
import {
  Briefcase,
  Heart,
  Users,
  DollarSign,
  TrendingUp,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CounselorTopic } from '@/types';

interface TopicSelectorProps {
  value?: CounselorTopic;
  onChange: (topic: CounselorTopic) => void;
  disabled?: boolean;
}

const topics: Array<{
  id: CounselorTopic;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    id: 'work_stress',
    label: 'Work Stress',
    description: 'Deadlines, workload, workplace issues',
    icon: Briefcase,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'career',
    label: 'Career Growth',
    description: 'Promotions, skill development, goals',
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'relationships',
    label: 'Relationships',
    description: 'Colleagues, family, social connections',
    icon: Users,
    color: 'from-pink-500 to-pink-600',
  },
  {
    id: 'personal',
    label: 'Personal Life',
    description: 'Health, emotions, life balance',
    icon: Heart,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'financial',
    label: 'Financial',
    description: 'Money worries, budgeting, planning',
    icon: DollarSign,
    color: 'from-amber-500 to-amber-600',
  },
  {
    id: 'general',
    label: 'Just Talk',
    description: 'General chat, anything on your mind',
    icon: MessageCircle,
    color: 'from-teal-500 to-teal-600',
  },
];

export function TopicSelector({ value, onChange, disabled = false }: TopicSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {topics.map((topic, index) => {
        const Icon = topic.icon;
        const isSelected = value === topic.id;

        return (
          <motion.button
            key={topic.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(topic.id)}
            className={cn(
              'relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-left transition-all',
              'bg-white dark:bg-gray-800 hover:shadow-md active:shadow-md',
              isSelected
                ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20'
                : 'border-gray-200 dark:border-gray-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
          >
            <div className={cn(
              'w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2 sm:mb-3',
              topic.color
            )}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>

            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-0.5 sm:mb-1">
              {topic.label}
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {topic.description}
            </p>

            {isSelected && (
              <motion.div
                layoutId="topic-selected"
                className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-teal-500 flex items-center justify-center"
                initial={false}
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
