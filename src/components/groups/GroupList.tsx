import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Users,
  Globe,
  Lock,
  Shield,
} from 'lucide-react';
import { Group } from '@/types';
import { GroupCard, GroupCardCompact } from './GroupCard';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { Dropdown } from '@/components/shared/Dropdown';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { cn } from '@/utils/cn';

type ViewMode = 'grid' | 'list';
type FilterOption = 'all' | 'open' | 'closed' | 'private' | 'official' | 'joined';
type SortOption = 'popular' | 'newest' | 'alphabetical' | 'active';

interface GroupListProps {
  groups: Group[];
  isLoading?: boolean;
  onCreateGroup?: () => void;
  onJoinGroup?: (groupId: string) => void;
  onLeaveGroup?: (groupId: string) => void;
}

const ITEMS_PER_PAGE = 12;

export function GroupList({
  groups,
  isLoading = false,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
}: GroupListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter groups
  let filteredGroups = [...groups];

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredGroups = filteredGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        group.description.toLowerCase().includes(query)
    );
  }

  switch (filterBy) {
    case 'open':
      filteredGroups = filteredGroups.filter((g) => g.type === 'open');
      break;
    case 'closed':
      filteredGroups = filteredGroups.filter((g) => g.type === 'closed');
      break;
    case 'private':
      filteredGroups = filteredGroups.filter((g) => g.type === 'private');
      break;
    case 'official':
      filteredGroups = filteredGroups.filter((g) => g.type === 'official');
      break;
    case 'joined':
      filteredGroups = filteredGroups.filter((g) => g.isJoined);
      break;
  }

  // Sort groups
  switch (sortBy) {
    case 'popular':
      filteredGroups.sort((a, b) => b.memberCount - a.memberCount);
      break;
    case 'newest':
      filteredGroups.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case 'alphabetical':
      filteredGroups.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'active':
      filteredGroups.sort((a, b) => b.postCount - a.postCount);
      break;
  }

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filterOptions = [
    { label: 'All Groups', value: 'all', icon: Users },
    { label: 'Open', value: 'open', icon: Globe },
    { label: 'Closed', value: 'closed', icon: Users },
    { label: 'Private', value: 'private', icon: Lock },
    { label: 'Official', value: 'official', icon: Shield },
    { label: 'My Groups', value: 'joined', icon: Users },
  ];

  const sortOptions = [
    { label: 'Most Popular', value: 'popular' },
    { label: 'Newest', value: 'newest' },
    { label: 'Alphabetical', value: 'alphabetical' },
    { label: 'Most Active', value: 'active' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Search Row */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>

          {/* Create Group Button - Icon only on mobile */}
          <Button
            onClick={onCreateGroup}
            leftIcon={<Plus className="w-5 h-5" />}
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">Create Group</span>
          </Button>
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
          {/* Filter Dropdown */}
          <Dropdown
            items={filterOptions.map((opt) => ({
              label: opt.label,
              icon: opt.icon,
              onClick: () => {
                setFilterBy(opt.value as FilterOption);
                setCurrentPage(1);
              },
            }))}
            align="left"
          >
            <button className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0">
              <Filter className="w-4 h-4" />
              <span className="hidden xs:inline">{filterOptions.find((o) => o.value === filterBy)?.label}</span>
              <span className="xs:hidden">Filter</span>
            </button>
          </Dropdown>

          {/* Sort Dropdown */}
          <Dropdown
            items={sortOptions.map((opt) => ({
              label: opt.label,
              onClick: () => setSortBy(opt.value as SortOption),
            }))}
            align="left"
          >
            <button className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0">
              <span className="hidden xs:inline">{sortOptions.find((o) => o.value === sortBy)?.label}</span>
              <span className="xs:hidden">Sort</span>
            </button>
          </Dropdown>

          {/* Spacer */}
          <div className="flex-1" />

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 sm:p-2.5 transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
              )}
            >
              <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 sm:p-2.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
              )}
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-xs sm:text-sm text-surface-500">
        Showing {paginatedGroups.length} of {filteredGroups.length} groups
      </div>

      {/* Groups Grid/List */}
      {paginatedGroups.length === 0 ? (
        <EmptyState
          type="groups"
          title="No groups found"
          description={
            searchQuery
              ? `No groups match "${searchQuery}"`
              : 'Create a group to connect with colleagues!'
          }
          action={
            onCreateGroup
              ? {
                  label: 'Create Group',
                  onClick: onCreateGroup,
                }
              : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {paginatedGroups.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              index={index}
              onJoin={onJoinGroup}
              onLeave={onLeaveGroup}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {paginatedGroups.map((group) => (
            <GroupCardCompact
              key={group.id}
              group={group}
              onJoin={onJoinGroup}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
