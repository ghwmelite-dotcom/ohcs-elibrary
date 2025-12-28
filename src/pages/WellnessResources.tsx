import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Filter,
  FileText,
  Video,
  Headphones,
  Dumbbell,
  X,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ResourceCard } from '@/components/wellness';
import { useWellnessStore } from '@/stores/wellnessStore';
import { cn } from '@/utils/cn';

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'stress', label: 'Stress Management' },
  { value: 'career', label: 'Career Growth' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'sleep', label: 'Sleep & Rest' },
];

const types = [
  { value: '', label: 'All Types', icon: BookOpen },
  { value: 'article', label: 'Articles', icon: FileText },
  { value: 'video', label: 'Videos', icon: Video },
  { value: 'audio', label: 'Audio', icon: Headphones },
  { value: 'exercise', label: 'Exercises', icon: Dumbbell },
];

export default function WellnessResources() {
  const navigate = useNavigate();
  const {
    resources,
    fetchResources,
    toggleBookmark,
    resourceFilter,
    setResourceFilter,
    isLoading,
  } = useWellnessStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setResourceFilter({ search: searchQuery });
    fetchResources({ ...resourceFilter, search: searchQuery });
  };

  const handleCategoryChange = (category: string) => {
    setResourceFilter({ category: category || undefined });
    fetchResources({ ...resourceFilter, category: category || undefined });
  };

  const handleTypeChange = (type: string) => {
    setResourceFilter({ type: type || undefined });
    fetchResources({ ...resourceFilter, type: type || undefined });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setResourceFilter({});
    fetchResources({});
  };

  const hasActiveFilters = resourceFilter.category || resourceFilter.type || resourceFilter.search;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <button
            onClick={() => navigate('/wellness')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Back to Wellness
          </button>

          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-teal-100 dark:bg-teal-900/30">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Self-Help Resources
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Explore articles, videos, and exercises to support your mental wellness journey.
          </p>
        </motion.div>

        {/* Search and filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6"
        >
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <Button type="submit" className="px-3 sm:px-4">
              <span className="hidden sm:inline">Search</span>
              <Search className="w-4 h-4 sm:hidden" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn('px-2.5 sm:px-3', showFilters && 'bg-gray-100 dark:bg-gray-700')}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </form>

          {/* Expanded filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-4"
            >
              {/* Category filter */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 block">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategoryChange(cat.value)}
                      className={cn(
                        'px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors',
                        resourceFilter.category === cat.value || (!resourceFilter.category && !cat.value)
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-200'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type filter */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 block">
                  Type
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {types.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => handleTypeChange(type.value)}
                        className={cn(
                          'px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2',
                          resourceFilter.type === type.value || (!resourceFilter.type && !type.value)
                            ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-200'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {resourceFilter.category && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 text-xs">
                    {categories.find(c => c.value === resourceFilter.category)?.label}
                    <button onClick={() => handleCategoryChange('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {resourceFilter.type && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 text-xs">
                    {types.find(t => t.value === resourceFilter.type)?.label}
                    <button onClick={() => handleTypeChange('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {resourceFilter.search && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 text-xs">
                    "{resourceFilter.search}"
                    <button onClick={() => {
                      setSearchQuery('');
                      setResourceFilter({ search: undefined });
                      fetchResources({ ...resourceFilter, search: undefined });
                    }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-teal-600 dark:text-teal-400 hover:underline ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </motion.div>

        {/* Resources grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <ResourceCard
                  resource={resource}
                  onClick={() => navigate(`/wellness/resources/${resource.id}`)}
                  onBookmark={() => toggleBookmark(resource.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No resources found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms.'
                : 'Check back soon for new wellness resources.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
