import { motion } from 'framer-motion';
import {
  Lightbulb,
  Users,
  Award,
  Crown,
  Target,
  BookOpen,
  GraduationCap,
  Rocket,
  Check,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { RecognitionCategory } from '@/types/recognition';

// Icon mapping for category icons
const iconMap: Record<string, React.ElementType> = {
  Lightbulb,
  Users,
  Award,
  Crown,
  Target,
  BookOpen,
  GraduationCap,
  Rocket,
};

interface RecognitionCategoryPickerProps {
  categories: RecognitionCategory[];
  selectedId: string | null;
  onSelect: (category: RecognitionCategory) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function RecognitionCategoryPicker({
  categories,
  selectedId,
  onSelect,
  disabled = false,
  compact = false,
}: RecognitionCategoryPickerProps) {
  return (
    <div
      className={cn(
        'grid gap-3',
        compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'
      )}
    >
      {categories.map((category, index) => {
        const IconComponent = iconMap[category.icon] || Award;
        const isSelected = selectedId === category.id;

        return (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => !disabled && onSelect(category)}
            disabled={disabled}
            className={cn(
              'relative p-3 rounded-xl border-2 transition-all duration-200',
              'flex flex-col items-center text-center gap-2',
              'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
              isSelected
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800',
              disabled && 'opacity-50 cursor-not-allowed',
              !disabled && !isSelected && 'hover:border-surface-300 dark:hover:border-surface-600'
            )}
            style={{
              '--category-color': category.color,
            } as React.CSSProperties}
          >
            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}

            {/* Icon */}
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isSelected ? 'text-white' : 'text-white'
              )}
              style={{ backgroundColor: category.color }}
            >
              <IconComponent className="w-5 h-5" />
            </div>

            {/* Name */}
            <span
              className={cn(
                'text-xs font-medium line-clamp-2',
                isSelected
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-surface-700 dark:text-surface-300'
              )}
            >
              {category.name}
            </span>

            {/* XP reward */}
            {!compact && (
              <span className="text-[10px] text-surface-500 dark:text-surface-400">
                +{category.xpRewardReceiver} XP
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// Compact category badge for display purposes
interface CategoryBadgeProps {
  category: {
    name: string;
    icon: string;
    color: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const IconComponent = iconMap[category.icon] || Award;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium text-white',
        sizeClasses[size]
      )}
      style={{ backgroundColor: category.color }}
    >
      <IconComponent className={iconSizes[size]} />
      {category.name}
    </span>
  );
}
