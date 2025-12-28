import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface MoodSelectorProps {
  value?: number;
  onChange: (mood: number) => void;
  disabled?: boolean;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const moods = [
  { value: 1, emoji: '😔', label: 'Very Low', color: 'bg-red-100 border-red-300 hover:bg-red-200' },
  { value: 2, emoji: '😕', label: 'Low', color: 'bg-orange-100 border-orange-300 hover:bg-orange-200' },
  { value: 3, emoji: '😐', label: 'Okay', color: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200' },
  { value: 4, emoji: '🙂', label: 'Good', color: 'bg-lime-100 border-lime-300 hover:bg-lime-200' },
  { value: 5, emoji: '😊', label: 'Great', color: 'bg-green-100 border-green-300 hover:bg-green-200' },
];

const sizeClasses = {
  sm: { button: 'w-10 h-10', emoji: 'text-lg', label: 'text-xs' },
  md: { button: 'w-14 h-14', emoji: 'text-2xl', label: 'text-sm' },
  lg: { button: 'w-18 h-18', emoji: 'text-3xl', label: 'text-base' },
};

export function MoodSelector({
  value,
  onChange,
  disabled = false,
  showLabels = true,
  size = 'md',
}: MoodSelectorProps) {
  const sizes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        {moods.map((mood, index) => (
          <motion.button
            key={mood.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mood.value)}
            className={cn(
              'rounded-full border-2 transition-all flex items-center justify-center',
              sizes.button,
              mood.color,
              value === mood.value && 'ring-2 ring-offset-2 ring-teal-500 scale-110',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            whileHover={{ scale: disabled ? 1 : 1.1 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <span className={sizes.emoji}>{mood.emoji}</span>
          </motion.button>
        ))}
      </div>

      {showLabels && value && (
        <motion.p
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('text-gray-600 font-medium', sizes.label)}
        >
          {moods.find(m => m.value === value)?.label}
        </motion.p>
      )}
    </div>
  );
}
