/**
 * Course Catalog Page
 * Browse and search available courses
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  GraduationCap,
  Clock,
  Users,
  Star,
  BookOpen,
  ChevronRight,
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
} from 'lucide-react';
import { useLMSStore } from '@/stores/lmsStore';
import { Spinner } from '@/components/shared/Spinner';
import { cn } from '@/utils/cn';
import type { CourseLevel } from '@/types/lms';

const levelColors: Record<CourseLevel, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function CourseCatalog() {
  const {
    courses,
    categories,
    totalCourses,
    currentPage,
    totalPages,
    filters,
    isLoading,
    fetchCourses,
    fetchCategories,
    setFilters,
    clearFilters,
  } = useLMSStore();

  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchQuery, page: 1 });
    fetchCourses({ search: searchQuery, page: 1 });
  };

  const handleCategoryChange = (category: string) => {
    setFilters({ category, page: 1 });
    fetchCourses({ category, page: 1 });
  };

  const handleLevelChange = (level: CourseLevel | '') => {
    setFilters({ level: level || undefined, page: 1 });
    fetchCourses({ level: level || undefined, page: 1 });
  };

  const handleSortChange = (sortBy: string) => {
    setFilters({ sortBy: sortBy as any, page: 1 });
    fetchCourses({ sortBy: sortBy as any, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
    fetchCourses({ page });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    clearFilters();
    fetchCourses({ page: 1, limit: 12 });
  };

  const hasActiveFilters = filters.search || filters.category || filters.level;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
              Course Catalog
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Explore {totalCourses} courses to enhance your skills
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Filter toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors',
                showFilters
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary-500" />
              )}
            </button>

            <div className="flex items-center border border-surface-200 dark:border-surface-600 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2.5 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                    : 'text-surface-400 hover:text-surface-600'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2.5 transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                    : 'text-surface-400 hover:text-surface-600'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category filter */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level filter */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Level
                </label>
                <select
                  value={filters.level || ''}
                  onChange={(e) => handleLevelChange(e.target.value as CourseLevel | '')}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-4 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
            No courses found
          </h3>
          <p className="text-surface-600 dark:text-surface-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            )}
          >
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className={cn(
                  'group bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden hover:shadow-lg transition-all duration-300',
                  viewMode === 'list' && 'flex'
                )}
              >
                {/* Thumbnail */}
                <div
                  className={cn(
                    'relative overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30',
                    viewMode === 'grid' ? 'h-40' : 'w-48 h-32 flex-shrink-0'
                  )}
                >
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap className="w-12 h-12 text-primary-400" />
                    </div>
                  )}
                  {course.isEnrolled && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                      Enrolled
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={cn('p-4 flex-1', viewMode === 'list' && 'flex flex-col')}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded', levelColors[course.level])}>
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </span>
                    <span className="text-xs text-surface-500 dark:text-surface-400">
                      {course.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {course.title}
                  </h3>

                  {course.shortDescription && (
                    <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mb-3">
                      {course.shortDescription}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400 mt-auto">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{Math.round(course.estimatedDuration / 60)}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.enrollmentCount}</span>
                    </div>
                    {course.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{course.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {course.instructor && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                      {course.instructor.avatar ? (
                        <img
                          src={course.instructor.avatar}
                          alt={course.instructor.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-600">
                            {course.instructor.name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-surface-600 dark:text-surface-400">
                        {course.instructor.name}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-surface-600 dark:text-surface-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
