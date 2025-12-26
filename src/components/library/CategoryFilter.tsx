import { useLibraryStore } from '@/stores/libraryStore';
import { cn } from '@/utils/cn';
import { Folder, ChevronRight, FileText } from 'lucide-react';

export function CategoryFilter() {
  const { categories, selectedCategory, setSelectedCategory, documents } = useLibraryStore();

  const getCategoryCount = (categoryId: string | null) => {
    if (!categoryId) return documents.length;
    return documents.filter((doc) => doc.categoryId === categoryId).length;
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
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
          {categories.map((category) => (
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
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    selectedCategory === category.id
                      ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                      : 'bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-300'
                  )}
                >
                  {getCategoryCount(category.id)}
                </span>
                <ChevronRight className="w-4 h-4 text-surface-400" />
              </div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
