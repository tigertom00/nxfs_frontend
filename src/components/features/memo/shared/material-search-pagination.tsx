'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginatedResponse, Material } from '@/lib/api';

interface MaterialSearchPaginationProps {
  pagination: PaginatedResponse<Material>;
  onPageChange: (page: number) => void;
  className?: string;
}

export function MaterialSearchPagination({
  pagination,
  onPageChange,
  className = '',
}: MaterialSearchPaginationProps) {
  const {
    current_page,
    total_pages,
    has_previous,
    has_next,
    count,
    page_size,
  } = pagination;

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, current_page - delta);
      i <= Math.min(total_pages - 1, current_page + delta);
      i++
    ) {
      range.push(i);
    }

    if (current_page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current_page + delta < total_pages - 1) {
      rangeWithDots.push('...', total_pages);
    } else if (total_pages > 1) {
      rangeWithDots.push(total_pages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  if (total_pages <= 1) {
    return (
      <div className={`flex items-center justify-center px-4 py-2 ${className}`}>
        <div className="text-sm text-muted-foreground">
          {count} result{count !== 1 ? 's' : ''} found
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-center text-sm text-muted-foreground">
        Showing {(current_page - 1) * page_size + 1} to{' '}
        {Math.min(current_page * page_size, count)} of {count} results
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                if (has_previous) {
                  onPageChange(current_page - 1);
                }
              }}
              className={
                !has_previous ? 'pointer-events-none opacity-50' : 'cursor-pointer'
              }
            />
          </PaginationItem>

          {visiblePages.map((page, index) => (
            <PaginationItem key={index}>
              {page === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page as number);
                  }}
                  isActive={page === current_page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault();
                if (has_next) {
                  onPageChange(current_page + 1);
                }
              }}
              className={
                !has_next ? 'pointer-events-none opacity-50' : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default MaterialSearchPagination;