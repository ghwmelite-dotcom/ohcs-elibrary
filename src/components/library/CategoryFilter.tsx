import { useState } from 'react';
import { useLibraryStore } from '@/stores/libraryStore';
import { cn } from '@/utils/cn';
import { Folder, ChevronRight, ChevronDown, FileText, Filter } from 'lucide-react';
import type { DocumentCategory } from '@/types';

export function CategoryFilter() {
  const { categories, selectedCategory, setSelectedCategory, documents } = useLibraryStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryCount = (categoryId: DocumentCategory | null) => {
    if (!categoryId) return documents.length;
    return documents.filter((doc) => doc.category === categoryId).length;
  };

  const selectedCategoryData = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)
    : null;

  return (
    <>
      {/* Mobile: Horizontal scrollable chips */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-surface-500" />
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
            Categories
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              !selectedCategory
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            )}
          >
            All ({getCategoryCount(null)})
          </button>
          {categories.map((category) => {
            const count = getCategoryCount(category.id);
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5',
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name.split(' ')[0]}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Card layout with expandable list */}
      <div className="hidden lg:block bg-surface-50 dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            Categories
          </h3>
        </div>

        <nav className="p-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
              'hover:bg-surface-100 dark:hover:bg-surface-700',
              !selectedCategory &&
                'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            )}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">All Documents</span>
            </div>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                !selectedCategory
                  ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                  : 'bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-300'
              )}
            >
              {getCategoryCount(null)}
            </span>
          </button>

          <div className="mt-2 space-y-1">
            {categories.map((category) => {
              const docCount = getCategoryCount(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
                    'hover:bg-surface-100 dark:hover:bg-surface-700',
                    selectedCategory === category.id &&
                      'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Folder className="w-3.5 h-3.5" style={{ color: category.color }} />
                    </div>
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        selectedCategory === category.id
                          ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                          : 'bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-300'
                      )}
                    >
                      {docCount}
                    </span>
                    <ChevronRight className="w-4 h-4 text-surface-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Tablet: Collapsible dropdown */}
      <div className="hidden md:block lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-xl shadow-elevation-1"
        >
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-surface-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                {selectedCategoryData ? selectedCategoryData.name : 'All Categories'}
              </p>
              <p className="text-xs text-surface-500">
                {getCategoryCount(selectedCategory)} documents
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-surface-400 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>

        {isExpanded && (
          <div className="mt-2 bg-surface-50 dark:bg-surface-800 rounded-xl shadow-elevation-1 p-2 space-y-1">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setIsExpanded(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm',
                !selectedCategory
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              <span>All Documents</span>
              <span className="text-xs opacity-70">{getCategoryCount(null)}</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setIsExpanded(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm',
                  selectedCategory === category.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-700'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
                <span className="text-xs opacity-70">{getCategoryCount(category.id)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
