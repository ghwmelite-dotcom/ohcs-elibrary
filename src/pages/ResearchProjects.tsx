import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import {
  useResearchStore,
  RESEARCH_CATEGORIES,
  RESEARCH_STATUSES,
  RESEARCH_METHODOLOGIES,
} from '@/stores/researchStore';
import { ProjectCard, CreateProjectModal, ResearchSearch } from '@/components/research';
import { cn } from '@/utils/cn';
import type { ResearchCategory, ResearchProjectStatus, ResearchMethodology, ResearchSearchResult } from '@/types';

export default function ResearchProjects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    projects,
    projectsLoading,
    projectsPagination,
    fetchProjects,
    filter,
    setFilter,
    clearFilter,
  } = useResearchStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Initialize filter from URL params
  useEffect(() => {
    const status = searchParams.get('status') as ResearchProjectStatus | null;
    const category = searchParams.get('category') as ResearchCategory | null;
    const search = searchParams.get('search');
    const myProjects = searchParams.get('myProjects') === 'true';

    if (status || category || search || myProjects) {
      setFilter({
        status: status || undefined,
        category: category || undefined,
        search: search || undefined,
      });
    }

    if (myProjects) {
      // Use the dedicated myProjects endpoint
      useResearchStore.getState().fetchMyProjects();
    } else {
      fetchProjects();
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
    setFilter({ search: searchQuery || undefined });
    fetchProjects();
  };

  const handleFilterChange = (key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
    setFilter({ [key]: value });
    fetchProjects();
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
    clearFilter();
    fetchProjects();
  };

  const handleProjectCreated = (projectId: string) => {
    navigate(`/research-hub/projects/${projectId}`);
  };

  const handlePageChange = (page: number) => {
    setFilter({ page });
    fetchProjects();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchResultClick = (result: ResearchSearchResult) => {
    switch (result.resultType) {
      case 'project':
        navigate(`/research/projects/${result.id}`);
        break;
      case 'note':
        navigate(`/research/projects/${result.projectId}?tab=notes`);
        break;
      case 'literature':
        navigate(`/research/projects/${result.projectId}?tab=literature`);
        break;
    }
  };

  const activeFiltersCount = [
    filter.status,
    filter.category,
    filter.search,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-xl">
                <Network className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                  Research Projects
                </h1>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {projectsPagination.total} project{projectsPagination.total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 dark:text-surface-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects by title, question, or description..."
                  className="w-full pl-10 pr-4 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Quick Filters */}
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filter.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="appearance-none pl-4 pr-8 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">All Status</option>
                  {Object.entries(RESEARCH_STATUSES).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500 pointer-events-none" />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={filter.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="appearance-none pl-4 pr-8 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">All Categories</option>
                  {Object.entries(RESEARCH_CATEGORIES).map(([key, { label, icon }]) => (
                    <option key={key} value={key}>
                      {icon} {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500 pointer-events-none" />
              </div>

              {/* View Toggle */}
              <div className="hidden sm:flex items-center bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-surface-600 shadow-sm'
                      : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-surface-600 shadow-sm'
                      : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Research Hub Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ResearchSearch onResultClick={handleSearchResultClick} />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projectsLoading ? (
          <div
            className={cn(
              'grid gap-6',
              viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'bg-white dark:bg-surface-800 rounded-xl animate-pulse',
                  viewMode === 'grid' ? 'h-72' : 'h-24'
                )}
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Network className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
              No projects found
            </h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6 max-w-md mx-auto">
              {activeFiltersCount > 0
                ? 'Try adjusting your filters or search query.'
                : 'Get started by creating your first research project.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'grid gap-6',
                  viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                )}
              >
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProjectCard
                      project={project}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {projectsPagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(projectsPagination.page - 1)}
                  disabled={projectsPagination.page === 1}
                  className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(projectsPagination.totalPages, 5))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'w-10 h-10 rounded-lg font-medium transition-colors',
                          page === projectsPagination.page
                            ? 'bg-primary-600 text-white'
                            : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {projectsPagination.totalPages > 5 && (
                    <>
                      <span className="text-surface-400 dark:text-surface-500 px-2">...</span>
                      <button
                        onClick={() => handlePageChange(projectsPagination.totalPages)}
                        className={cn(
                          'w-10 h-10 rounded-lg font-medium transition-colors',
                          projectsPagination.page === projectsPagination.totalPages
                            ? 'bg-primary-600 text-white'
                            : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
                        )}
                      >
                        {projectsPagination.totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(projectsPagination.page + 1)}
                  disabled={projectsPagination.page === projectsPagination.totalPages}
                  className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
