import { createContext, useContext, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

// Old context-based Tabs - now use TabsProvider instead
function TabsContextProvider({
  children,
  defaultValue,
  value,
  onChange,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const activeTab = value !== undefined ? value : internalValue;

  const setActiveTab = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function TabsList({ children, className, variant = 'default' }: TabsListProps) {
  const variantStyles = {
    default: 'bg-surface-100 dark:bg-surface-800 p-1 rounded-lg',
    pills: 'gap-2',
    underline: 'border-b border-surface-200 dark:border-surface-700',
  };

  return (
    <div
      className={cn(
        'flex',
        variantStyles[variant],
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  children: ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export function TabsTrigger({
  children,
  value,
  className,
  disabled = false,
  icon,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        isActive
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white dark:bg-surface-700 rounded-md shadow-sm -z-10"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
    </button>
  );
}

interface TabsContentProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function TabsContent({ children, value, className }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      role="tabpanel"
      className={cn('mt-4', className)}
    >
      {children}
    </motion.div>
  );
}

// Simple tabs variant (used by Forum, Groups, etc.)
interface SimpleTabsProps {
  tabs: Array<{ id: string; label: string; icon?: ReactNode }>;
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: SimpleTabsProps) {
  return (
    <div className={cn(
      'flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg',
      'overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-1',
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium transition-all rounded-md flex-shrink-0',
            activeTab === tab.id
              ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
          )}
        >
          {tab.icon && <span className="flex-shrink-0 hidden sm:block">{tab.icon}</span>}
          <span className="whitespace-nowrap">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// Pill tabs variant
interface PillTabsProps {
  tabs: Array<{ value: string; label: string; count?: number }>;
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PillTabs({ tabs, activeTab, onChange, className }: PillTabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-full transition-all',
            activeTab === tab.value
              ? 'bg-primary-500 text-white'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'ml-2 px-2 py-0.5 text-xs rounded-full',
                activeTab === tab.value
                  ? 'bg-white/20'
                  : 'bg-surface-200 dark:bg-surface-700'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
