import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, SortAsc, SortDesc, Filter, Flame, Clock, MessageSquare, ThumbsUp } from 'lucide-react';
import { ForumTopic, ForumCategory } from '@/types';
import { TopicCard } from './TopicCard';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Dropdown } from '@/components/shared/Dropdown';
import { Skeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { cn } from '@/utils/cn';

type SortOption = 'latest' | 'popular' | 'most_replies' | 'most_views';
type FilterOption = 'all' | 'unanswered' | 'solved' | 'pinned';

interface TopicListProps {
  topics: ForumTopic[];
  categories: ForumCategory[];
  isLoading?: boolean;
  showNewTopicButton?: boolean;
  onNewTopic?: () => void;
}

const ITEMS_PER_PAGE = 15;

export function TopicList({
  topics,
  categories,
  isLoading = false,
  showNewTopicButton = true,
  onNewTopic,
}: TopicListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  // Filter topics
  let filteredTopics = [...topics];

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredTopics = filteredTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.content.toLowerCase().includes(query) ||
        topic.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Status filter
  switch (filterBy) {
    case 'unanswered':
      filteredTopics = filteredTopics.filter((t) => t.postCount === 0);
      break;
    case 'solved':
      filteredTopics = filteredTopics.filter((t) => t.isAnswered);
      break;
    case 'pinned':
      filteredTopics = filteredTopics.filter((t) => t.isPinned);
      break;
  }

  // Sort topics (pinned always first)
  const pinnedTopics = filteredTopics.filter((t) => t.isPinned);
  const regularTopics = filteredTopics.filter((t) => !t.isPinned);

  regularTopics.sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return b.views - a.views;
      case 'most_replies':
        return b.postCount - a.postCount;
      case 'most_views':
        return b.views - a.views;
      default:
        return 0;
    }
  });

  filteredTopics = [...pinnedTopics, ...regularTopics];

  // Pagination
  const totalPages = Math.ceil(filteredTopics.length / ITEMS_PER_PAGE);
  const paginatedTopics = filteredTopics.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const sortOptions = [
    { label: 'Latest', value: 'latest', icon: Clock },
    { label: 'Most Popular', value: 'popular', icon: Flame },
    { label: 'Most Replies', value: 'most_replies', icon: MessageSquare },
    { label: 'Most Views', value: 'most_views', icon: ThumbsUp },
  ];

  const filterOptions = [
    { label: 'All Topics', value: 'all' },
    { label: 'Unanswered', value: 'unanswered' },
    { label: 'Solved', value: 'solved' },
    { label: 'Pinned', value: 'pinned' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Search Row */}
        <div className="w-full">
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter */}
          <Dropdown
            items={filterOptions.map((opt) => ({
              label: opt.label,
              onClick: () => {
                setFilterBy(opt.value as FilterOption);
                setCurrentPage(1);
              },
            }))}
            align="left"
          >
            <button className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{filterOptions.find((o) => o.value === filterBy)?.label}</span>
              <span className="sm:hidden">Filter</span>
            </button>
          </Dropdown>

          {/* Sort */}
          <Dropdown
            items={sortOptions.map((opt) => ({
              label: opt.label,
              icon: opt.icon,
              onClick: () => setSortBy(opt.value as SortOption),
            }))}
            align="left"
          >
            <button className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <SortDesc className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{sortOptions.find((o) => o.value === sortBy)?.label}</span>
              <span className="sm:hidden">Sort</span>
            </button>
          </Dropdown>

          {/* Spacer */}
          <div className="flex-1" />

          {/* New Topic Button */}
          {showNewTopicButton && (
            <Button
              onClick={onNewTopic}
              leftIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
              size="sm"
              className="sm:!py-2.5 sm:!px-4 sm:!text-sm"
            >
              <span className="hidden sm:inline">New Topic</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-surface-500 dark:text-surface-400">
        Showing {paginatedTopics.length} of {filteredTopics.length} topics
      </div>

      {/* Topics */}
      {paginatedTopics.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-full h-full" />}
          title="No topics found"
          description={
            searchQuery
              ? `No topics match "${searchQuery}"`
              : 'Be the first to start a discussion!'
          }
          action={
            showNewTopicButton && onNewTopic
              ? {
                  label: 'Create Topic',
                  onClick: onNewTopic,
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {paginatedTopics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              category={getCategoryById(topic.categoryId)}
              index={index}
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
