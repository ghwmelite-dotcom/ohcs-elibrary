import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLibraryStore } from '@/stores/libraryStore';
import { cn } from '@/utils/cn';
import {
  Folder,
  ChevronRight,
  ChevronDown,
  FileText,
  Filter,
  BookOpen,
  FileCheck,
  GraduationCap,
  BarChart3,
  FileSpreadsheet,
  Scale,
  Microscope,
  Files,
} from 'lucide-react';
import type { DocumentCategory } from '@/types';

// Map category IDs to icons
const categoryIcons: Record<DocumentCategory, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  circulars: FileText,
  policies: FileCheck,
  training: GraduationCap,
  reports: BarChart3,
  forms: FileSpreadsheet,
  legal: Scale,
  research: Microscope,
  general: Files,
};

export function CategoryFilter() {
  const { categories, selectedCategory, setSelectedCategory, documents } = useLibraryStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryCount = (categoryId: DocumentCategory | null) => {
    if (!categoryId) return documents.length;
    return documents.filter((doc) => doc.category === categoryId).length;
  };

  const totalDocuments = documents.length;
  const selectedCategoryData = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)
    : null;

  return (
    <>
      {/* Mobile: Beautiful horizontal scrollable cards */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Filter className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
              Browse Categories
            </h3>
            <p className="text-xs text-surface-500">{totalDocuments} documents available</p>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* All Documents Card */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'flex-shrink-0 w-28 p-3 rounded-xl transition-all duration-200',
              'border-2',
              !selectedCategory
                ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center mb-2',
              !selectedCategory
                ? 'bg-white/20'
                : 'bg-primary-100 dark:bg-primary-900/30'
            )}>
              <BookOpen className={cn(
                'w-5 h-5',
                !selectedCategory ? 'text-white' : 'text-primary-600 dark:text-primary-400'
              )} />
            </div>
            <p className={cn(
              'text-xs font-semibold truncate',
              !selectedCategory ? 'text-white' : 'text-surface-900 dark:text-surface-50'
            )}>
              All Docs
            </p>
            <p className={cn(
              'text-xs mt-0.5',
              !selectedCategory ? 'text-white/80' : 'text-surface-500'
            )}>
              {getCategoryCount(null)}
            </p>
          </motion.button>

          {/* Category Cards */}
          {categories.map((category) => {
            const count = getCategoryCount(category.id);
            const Icon = categoryIcons[category.id] || Folder;
            const isSelected = selectedCategory === category.id;

            return (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'flex-shrink-0 w-28 p-3 rounded-xl transition-all duration-200',
                  'border-2',
                  isSelected
                    ? 'border-transparent shadow-lg'
                    : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700'
                )}
                style={{
                  backgroundColor: isSelected ? category.color : undefined,
                  boxShadow: isSelected ? `0 10px 25px -5px ${category.color}40` : undefined,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${category.color}20`,
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isSelected ? 'white' : category.color }}
                  />
                </div>
                <p className={cn(
                  'text-xs font-semibold truncate',
                  isSelected ? 'text-white' : 'text-surface-900 dark:text-surface-50'
                )}>
                  {category.name.split(' ')[0]}
                </p>
                <p className={cn(
                  'text-xs mt-0.5',
                  isSelected ? 'text-white/80' : 'text-surface-500'
                )}>
                  {count} docs
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Enhanced card layout */}
      <div className="hidden lg:block bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-2 overflow-hidden border border-surface-200 dark:border-surface-700">
        {/* Header with gradient */}
        <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Categories</h3>
              <p className="text-xs text-primary-100">{totalDocuments} total documents</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-2">
          {/* All Documents */}
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200',
              !selectedCategory
                ? 'bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-200 dark:border-primary-800'
                : 'hover:bg-surface-50 dark:hover:bg-surface-700/50 border-2 border-transparent'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                !selectedCategory
                  ? 'bg-primary-100 dark:bg-primary-800'
                  : 'bg-surface-100 dark:bg-surface-700'
              )}>
                <BookOpen className={cn(
                  'w-5 h-5',
                  !selectedCategory
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-500'
                )} />
              </div>
              <div className="text-left">
                <span className={cn(
                  'text-sm font-semibold block',
                  !selectedCategory
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-surface-900 dark:text-surface-50'
                )}>
                  All Documents
                </span>
                <span className="text-xs text-surface-500">Browse everything</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-sm font-bold px-3 py-1 rounded-full',
                !selectedCategory
                  ? 'bg-primary-200 dark:bg-primary-700 text-primary-700 dark:text-primary-200'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
              )}>
                {getCategoryCount(null)}
              </span>
              <ChevronRight className={cn(
                'w-4 h-4 transition-colors',
                !selectedCategory ? 'text-primary-500' : 'text-surface-400'
              )} />
            </div>
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
            <span className="text-xs font-medium text-surface-400 uppercase tracking-wider">By Type</span>
            <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
          </div>

          {/* Categories */}
          <div className="space-y-1.5">
            {categories.map((category) => {
              const count = getCategoryCount(category.id);
              const Icon = categoryIcons[category.id] || Folder;
              const isSelected = selectedCategory === category.id;

              return (
                <motion.button
                  key={category.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200',
                    isSelected
                      ? 'border-2'
                      : 'hover:bg-surface-50 dark:hover:bg-surface-700/50 border-2 border-transparent'
                  )}
                  style={{
                    backgroundColor: isSelected ? `${category.color}10` : undefined,
                    borderColor: isSelected ? `${category.color}40` : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: isSelected ? `${category.color}20` : `${category.color}10`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <div className="text-left">
                      <span className={cn(
                        'text-sm font-semibold block',
                        isSelected ? 'text-surface-900 dark:text-surface-50' : 'text-surface-700 dark:text-surface-300'
                      )}>
                        {category.name}
                      </span>
                      {isSelected && (
                        <span className="text-xs" style={{ color: category.color }}>
                          {count} documents available
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: isSelected ? `${category.color}20` : undefined,
                        color: isSelected ? category.color : undefined,
                      }}
                    >
                      {count}
                    </span>
                    <ChevronRight
                      className="w-4 h-4 transition-transform"
                      style={{
                        color: isSelected ? category.color : undefined,
                        transform: isSelected ? 'translateX(2px)' : undefined,
                      }}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Tablet: Collapsible dropdown with enhanced styling */}
      <div className="hidden md:block lg:hidden">
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200',
            'bg-white dark:bg-surface-800 border-2',
            isExpanded
              ? 'border-primary-300 dark:border-primary-700 shadow-lg'
              : 'border-surface-200 dark:border-surface-700 shadow-elevation-1'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: selectedCategoryData
                  ? `${selectedCategoryData.color}15`
                  : 'rgb(var(--color-primary-100))',
              }}
            >
              {selectedCategoryData ? (
                (() => {
                  const Icon = categoryIcons[selectedCategoryData.id] || Folder;
                  return <Icon className="w-6 h-6" style={{ color: selectedCategoryData.color }} />;
                })()
              ) : (
                <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div className="text-left">
              <p className="text-base font-semibold text-surface-900 dark:text-surface-50">
                {selectedCategoryData ? selectedCategoryData.name : 'All Categories'}
              </p>
              <p className="text-sm text-surface-500">
                {getCategoryCount(selectedCategory)} documents
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-surface-400" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 bg-white dark:bg-surface-800 rounded-xl shadow-elevation-2 border border-surface-200 dark:border-surface-700 p-2">
                {/* All Documents Option */}
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setIsExpanded(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors',
                    !selectedCategory
                      ? 'bg-primary-50 dark:bg-primary-900/30'
                      : 'hover:bg-surface-50 dark:hover:bg-surface-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className={cn(
                      'w-5 h-5',
                      !selectedCategory ? 'text-primary-600' : 'text-surface-500'
                    )} />
                    <span className={cn(
                      'font-medium',
                      !selectedCategory ? 'text-primary-700 dark:text-primary-300' : ''
                    )}>
                      All Documents
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-surface-500">
                    {getCategoryCount(null)}
                  </span>
                </button>

                {/* Categories */}
                <div className="mt-1 space-y-1">
                  {categories.map((category) => {
                    const Icon = categoryIcons[category.id] || Folder;
                    const isSelected = selectedCategory === category.id;

                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setIsExpanded(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors',
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/30'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-700'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" style={{ color: category.color }} />
                          <span className={cn(
                            'font-medium',
                            isSelected ? 'text-primary-700 dark:text-primary-300' : ''
                          )}>
                            {category.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-surface-500">
                          {getCategoryCount(category.id)}
                        </span>
                      </button>
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
