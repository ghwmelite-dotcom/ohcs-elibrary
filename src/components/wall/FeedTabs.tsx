import { motion } from 'framer-motion';
import { Compass, Users, Building2, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';

type FeedType = 'forYou' | 'following' | 'mda' | 'trending';

interface FeedTabsProps {
  activeTab: FeedType;
  onTabChange: (tab: FeedType) => void;
  className?: string;
}

const tabs: { id: FeedType; label: string; icon: React.ElementType }[] = [
  { id: 'forYou', label: 'For You', icon: Compass },
  { id: 'following', label: 'Following', icon: Users },
  { id: 'mda', label: 'My MDA', icon: Building2 },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
];

export function FeedTabs({ activeTab, onTabChange, className }: FeedTabsProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0',
                isActive
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="feedTabBackground"
                  className="absolute inset-0 bg-white dark:bg-surface-700 rounded-lg shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
