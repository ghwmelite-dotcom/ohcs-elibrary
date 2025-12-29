import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Users,
  Building2,
  UserCheck,
  GraduationCap,
  List,
  Lock,
  ChevronDown,
  Check,
} from 'lucide-react';
import { PostVisibility, AudienceList } from '@/types';
import { cn } from '@/utils/cn';

interface VisibilityOption {
  id: PostVisibility;
  label: string;
  description: string;
  icon: React.ElementType;
}

const visibilityOptions: VisibilityOption[] = [
  {
    id: 'public',
    label: 'Public',
    description: 'Everyone on the platform',
    icon: Globe,
  },
  {
    id: 'network',
    label: 'Network',
    description: 'Only people who follow you',
    icon: Users,
  },
  {
    id: 'mda',
    label: 'My MDA',
    description: 'Only colleagues in your MDA',
    icon: Building2,
  },
  {
    id: 'close_colleagues',
    label: 'Close Colleagues',
    description: 'Your close colleagues list',
    icon: UserCheck,
  },
  {
    id: 'mentors',
    label: 'Mentors',
    description: 'Only your mentors',
    icon: GraduationCap,
  },
  {
    id: 'private',
    label: 'Only Me',
    description: 'Save as draft, only you can see',
    icon: Lock,
  },
];

interface VisibilityPickerProps {
  value: PostVisibility;
  onChange: (visibility: PostVisibility, customListId?: string) => void;
  audienceLists?: AudienceList[];
  className?: string;
}

export function VisibilityPicker({
  value,
  onChange,
  audienceLists = [],
  className,
}: VisibilityPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption =
    visibilityOptions.find((opt) => opt.id === value) || visibilityOptions[0];
  const CurrentIcon = currentOption.icon;

  const handleSelect = (option: VisibilityOption) => {
    onChange(option.id);
    setIsOpen(false);
  };

  const handleSelectCustomList = (list: AudienceList) => {
    onChange('custom_list', list.id);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700',
          'text-surface-700 dark:text-surface-300'
        )}
      >
        <CurrentIcon className="w-4 h-4" />
        <span>{currentOption.label}</span>
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'absolute left-0 top-full mt-2 z-50 w-72',
                'bg-white dark:bg-surface-800 rounded-xl shadow-elevation-3',
                'border border-surface-200 dark:border-surface-700',
                'overflow-hidden'
              )}
            >
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Who can see this post?
                </p>

                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = value === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          isSelected
                            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                            : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-medium',
                            isSelected
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-surface-900 dark:text-surface-100'
                          )}
                        >
                          {option.label}
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Custom Lists */}
                {audienceLists.length > 0 && (
                  <>
                    <div className="my-2 border-t border-surface-200 dark:border-surface-700" />
                    <p className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Custom Lists
                    </p>
                    {audienceLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => handleSelectCustomList(list)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
                          value === 'custom_list'
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                        )}
                      >
                        <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400">
                          <List className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-surface-900 dark:text-surface-100">
                            {list.name}
                          </p>
                          <p className="text-xs text-surface-500 mt-0.5">
                            {list.memberCount} members
                          </p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
