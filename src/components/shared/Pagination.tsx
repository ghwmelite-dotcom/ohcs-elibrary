import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  className?: string;
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | 'ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
  const totalBlocks = totalNumbers + 2; // + 2 ellipsis

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
    return [...leftRange, 'ellipsis', totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => totalPages - (3 + siblingCount * 2) + i + 1
    );
    return [1, 'ellipsis', ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  className,
}: PaginationProps) {
  const pages = getPageNumbers(currentPage, totalPages, siblingCount);

  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn('flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      {/* Previous button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
      </Button>

      {/* Page numbers */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1 text-surface-400"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const isCurrentPage = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors',
                isCurrentPage
                  ? 'bg-primary-500 text-white'
                  : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
              aria-current={isCurrentPage ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Mobile page indicator */}
      <span className="sm:hidden text-sm text-surface-600 dark:text-surface-400 px-2">
        Page {currentPage} of {totalPages}
      </span>

      {/* Next button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

// Simple pagination with just prev/next
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: SimplePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        leftIcon={<ChevronLeft className="h-4 w-4" />}
      >
        Previous
      </Button>
      <span className="text-sm text-surface-600 dark:text-surface-400">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        rightIcon={<ChevronRight className="h-4 w-4" />}
      >
        Next
      </Button>
    </div>
  );
}
