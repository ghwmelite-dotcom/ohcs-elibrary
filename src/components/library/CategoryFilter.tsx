import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLibraryStore } from '@/stores/libraryStore';
import { cn } from '@/utils/cn';
import {
  Folder,
  ChevronRight,
  ChevronDown,
  FileText,
  BookOpen,
  Shield,
  GraduationCap,
  Newspaper,
  BarChart3,
  FileCheck,
  Users,
  Microscope,
  Target,
  FileSpreadsheet,
  Award,
  Sparkles,
  Filter,
  X,
} from 'lucide-react';
import type { DocumentCategory } from '@/types';

// Map category IDs to icons - matches new folder-based categories
const categoryIcons: Record<DocumentCategory, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  administrative: FileText,
  compliance: Shield,
  induction: GraduationCap,
  newsletters: Newspaper,
  performance: BarChart3,
  policies: FileCheck,
  recruitment: Users,
  research: Microscope,
  strategic: Target,
  templates: FileSpreadsheet,
  training: Award,
};

export function CategoryFilter() {
  const { categories, selectedCategory, setSelectedCategory, stats } = useLibraryStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const getCategoryCount = (categoryId: DocumentCategory | null) => {
    if (!categoryId) return stats.totalDocuments;
    const category = categories.find((c) => c.id === categoryId);
    return category?.count || 0;
  };

  const totalDocuments = stats.totalDocuments;
  const selectedCategoryData = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)
    : null;

  return (
    <>
      {/* Mobile: Horizontal scrollable cards */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-surface-50">
                Browse Categories
              </h3>
              <p className="text-xs text-surface-500">{totalDocuments} documents available</p>
            </div>
          </div>
          {selectedCategory && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedCategory(null)}
              className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
            >
              <X className="w-4 h-4 text-surface-500" />
            </motion.button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* All Documents Card */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'flex-shrink-0 w-[120px] p-4 rounded-2xl transition-all duration-300',
              'border-2 relative overflow-hidden',
              !selectedCategory
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-400 text-white shadow-xl shadow-primary-500/30'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg'
            )}
          >
            {!selectedCategory && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            )}
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center mb-3 relative',
              !selectedCategory
                ? 'bg-white/20 backdrop-blur-sm'
                : 'bg-primary-100 dark:bg-primary-900/30'
            )}>
              <BookOpen className={cn(
                'w-6 h-6',
                !selectedCategory ? 'text-white' : 'text-primary-600 dark:text-primary-400'
              )} />
            </div>
            <p className={cn(
              'text-sm font-bold',
              !selectedCategory ? 'text-white' : 'text-surface-900 dark:text-surface-50'
            )}>
              All Docs
            </p>
            <p className={cn(
              'text-xs mt-1 font-medium',
              !selectedCategory ? 'text-white/80' : 'text-surface-500'
            )}>
              {getCategoryCount(null)} items
            </p>
          </motion.button>

          {/* Category Cards */}
          {categories.map((category, index) => {
            const count = getCategoryCount(category.id);
            const Icon = categoryIcons[category.id] || Folder;
            const isSelected = selectedCategory === category.id;

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'flex-shrink-0 w-[120px] p-4 rounded-2xl transition-all duration-300',
                  'border-2 relative overflow-hidden',
                  isSelected
                    ? 'border-transparent shadow-xl'
                    : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:shadow-lg'
                )}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${category.color}, ${category.color}dd)`
                    : undefined,
                  boxShadow: isSelected ? `0 20px 40px -10px ${category.color}50` : undefined,
                }}
              >
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                )}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 relative"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${category.color}15`,
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: isSelected ? 'white' : category.color }}
                  />
                </div>
                <p className={cn(
                  'text-sm font-bold truncate',
                  isSelected ? 'text-white' : 'text-surface-900 dark:text-surface-50'
                )}>
                  {category.name.split(' ')[0]}
                </p>
                <p className={cn(
                  'text-xs mt-1 font-medium',
                  isSelected ? 'text-white/80' : 'text-surface-500'
                )}>
                  {count} items
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Collapsible card with beautiful animations */}
      <div className="hidden lg:block min-w-[280px]">
        <motion.div
          initial={false}
          className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden border border-surface-200/50 dark:border-surface-700/50"
        >
          {/* Header - Always visible, clickable to collapse */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 dark:from-primary-600 dark:via-primary-700 dark:to-primary-800 relative overflow-hidden group"
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>

            {/* Shimmer effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
            />

            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-lg">Categories</h3>
                  <p className="text-sm text-primary-100">{totalDocuments} total documents</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </motion.div>
            </div>

            {/* Selected category indicator when collapsed */}
            <AnimatePresence>
              {!isExpanded && selectedCategoryData && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 flex items-center gap-2"
                >
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCategoryData.color }} />
                    Filtered: {selectedCategoryData.name}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Expandable content */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <nav className="p-4 space-y-2">
                  {/* All Documents */}
                  <motion.button
                    whileHover={{ x: 6, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200',
                      !selectedCategory
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/40 dark:to-primary-900/20 border-2 border-primary-200 dark:border-primary-800 shadow-sm'
                        : 'hover:bg-surface-50 dark:hover:bg-surface-700/50 border-2 border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
                        !selectedCategory
                          ? 'bg-primary-500 shadow-lg shadow-primary-500/30'
                          : 'bg-surface-100 dark:bg-surface-700'
                      )}>
                        <BookOpen className={cn(
                          'w-5 h-5',
                          !selectedCategory
                            ? 'text-white'
                            : 'text-surface-500'
                        )} />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <span className={cn(
                          'text-sm font-bold block',
                          !selectedCategory
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-surface-900 dark:text-surface-50'
                        )}>
                          All Documents
                        </span>
                        <span className="text-xs text-surface-500">Browse everything</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn(
                        'text-sm font-bold px-2.5 py-1 rounded-full transition-all tabular-nums',
                        !selectedCategory
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                      )}>
                        {getCategoryCount(null)}
                      </span>
                    </div>
                  </motion.button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-surface-200 dark:via-surface-700 to-transparent" />
                    <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      By Type
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-surface-200 dark:via-surface-700 to-transparent" />
                  </div>

                  {/* Categories */}
                  <div className="space-y-1.5">
                    {categories.map((category, index) => {
                      const count = getCategoryCount(category.id);
                      const Icon = categoryIcons[category.id] || Folder;
                      const isSelected = selectedCategory === category.id;

                      return (
                        <motion.button
                          key={category.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ x: 6, transition: { duration: 0.2 } }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedCategory(category.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group',
                            isSelected
                              ? 'border-2 shadow-md'
                              : 'hover:bg-surface-50 dark:hover:bg-surface-700/50 border-2 border-transparent'
                          )}
                          style={{
                            backgroundColor: isSelected ? `${category.color}10` : undefined,
                            borderColor: isSelected ? `${category.color}50` : undefined,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
                                isSelected ? 'shadow-lg' : 'group-hover:scale-105'
                              )}
                              style={{
                                backgroundColor: isSelected ? category.color : `${category.color}15`,
                                boxShadow: isSelected ? `0 8px 20px -4px ${category.color}40` : undefined,
                              }}
                            >
                              <Icon
                                className="w-5 h-5 transition-colors"
                                style={{ color: isSelected ? 'white' : category.color }}
                              />
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <span className={cn(
                                'text-sm font-semibold block transition-colors leading-tight',
                                isSelected ? '' : 'text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-surface-50'
                              )}
                              style={{ color: isSelected ? category.color : undefined }}
                              >
                                {category.name}
                              </span>
                              {isSelected && (
                                <motion.span
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-xs text-surface-500"
                                >
                                  {count} documents
                                </motion.span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={cn(
                                'text-sm font-bold px-2.5 py-1 rounded-full transition-all tabular-nums',
                                !isSelected && 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                              )}
                              style={{
                                backgroundColor: isSelected ? `${category.color}20` : undefined,
                                color: isSelected ? category.color : undefined,
                              }}
                            >
                              {count}
                            </span>
                            <ChevronRight
                              className={cn(
                                'w-4 h-4 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0',
                                isSelected && 'opacity-100'
                              )}
                              style={{ color: isSelected ? category.color : undefined }}
                            />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Tablet: Collapsible dropdown with enhanced styling */}
      <div className="hidden md:block lg:hidden">
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300',
            'bg-white dark:bg-surface-800 border-2',
            isMobileExpanded
              ? 'border-primary-300 dark:border-primary-700 shadow-xl'
              : 'border-surface-200 dark:border-surface-700 shadow-lg'
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: selectedCategoryData
                  ? `linear-gradient(135deg, ${selectedCategoryData.color}, ${selectedCategoryData.color}cc)`
                  : 'linear-gradient(135deg, rgb(var(--color-primary-500)), rgb(var(--color-primary-600)))',
              }}
            >
              {selectedCategoryData ? (
                (() => {
                  const Icon = categoryIcons[selectedCategoryData.id] || Folder;
                  return <Icon className="w-7 h-7 text-white" />;
                })()
              ) : (
                <BookOpen className="w-7 h-7 text-white" />
              )}
            </div>
            <div className="text-left">
              <p className="text-base font-bold text-surface-900 dark:text-surface-50">
                {selectedCategoryData ? selectedCategoryData.name : 'All Categories'}
              </p>
              <p className="text-sm text-surface-500">
                {getCategoryCount(selectedCategory)} documents available
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isMobileExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center"
          >
            <ChevronDown className="w-5 h-5 text-surface-500" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isMobileExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 p-3">
                {/* All Documents Option */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedCategory(null);
                    setIsMobileExpanded(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-all',
                    !selectedCategory
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-900/20 shadow-sm'
                      : 'hover:bg-surface-50 dark:hover:bg-surface-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      !selectedCategory ? 'bg-primary-500' : 'bg-surface-100 dark:bg-surface-700'
                    )}>
                      <BookOpen className={cn(
                        'w-5 h-5',
                        !selectedCategory ? 'text-white' : 'text-surface-500'
                      )} />
                    </div>
                    <span className={cn(
                      'font-semibold',
                      !selectedCategory ? 'text-primary-700 dark:text-primary-300' : 'text-surface-700 dark:text-surface-300'
                    )}>
                      All Documents
                    </span>
                  </div>
                  <span className={cn(
                    'text-sm font-bold px-3 py-1 rounded-full',
                    !selectedCategory ? 'bg-primary-500 text-white' : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                  )}>
                    {getCategoryCount(null)}
                  </span>
                </motion.button>

                {/* Categories */}
                <div className="mt-2 space-y-1">
                  {categories.map((category, index) => {
                    const Icon = categoryIcons[category.id] || Folder;
                    const isSelected = selectedCategory === category.id;

                    return (
                      <motion.button
                        key={category.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setIsMobileExpanded(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all',
                          isSelected
                            ? 'shadow-sm'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-700'
                        )}
                        style={{
                          backgroundColor: isSelected ? `${category.color}10` : undefined,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: isSelected ? category.color : `${category.color}15` }}
                          >
                            <Icon
                              className="w-5 h-5"
                              style={{ color: isSelected ? 'white' : category.color }}
                            />
                          </div>
                          <span className={cn(
                            'font-semibold',
                            isSelected ? '' : 'text-surface-700 dark:text-surface-300'
                          )}
                          style={{ color: isSelected ? category.color : undefined }}
                          >
                            {category.name}
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: isSelected ? `${category.color}20` : undefined,
                            color: isSelected ? category.color : undefined,
                          }}
                        >
                          {getCategoryCount(category.id)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
