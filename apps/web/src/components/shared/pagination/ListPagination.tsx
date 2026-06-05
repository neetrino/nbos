'use client';

import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGE_HERO_PILL_GROUP } from '@/components/shared/page-hero/page-hero-constants';
import { PAGE_HERO_VIEW_BUTTON } from '@/components/shared/page-hero/page-hero-layout';
import { buildListPageSequence } from './build-list-page-sequence';

export interface ListPaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListPaginationProps {
  meta: ListPaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

const PAGE_NUMBER_BUTTON = cn(
  PAGE_HERO_VIEW_BUTTON,
  'min-w-8 px-1 text-xs font-semibold tabular-nums',
);

export function ListPagination({ meta, onPageChange, className }: ListPaginationProps) {
  const { total, page, pageSize, totalPages } = meta;
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageSequence = buildListPageSequence(page, totalPages);

  return (
    <nav
      className={cn('relative flex min-h-10 items-center pt-6 pb-1', className)}
      aria-label="Pagination"
    >
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {start}–{end} of {total}
      </span>

      {totalPages > 1 ? (
        <div
          className={cn(PAGE_HERO_PILL_GROUP, 'absolute left-1/2 -translate-x-1/2 gap-0.5')}
          role="group"
          aria-label="Page numbers"
        >
          <PaginationNavButton
            ariaLabel="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </PaginationNavButton>

          {pageSequence.map((entry, index) =>
            entry === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="text-muted-foreground flex size-8 items-center justify-center text-xs tabular-nums select-none"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                aria-label={`Page ${entry}`}
                aria-current={entry === page ? 'page' : undefined}
                onClick={() => onPageChange(entry)}
                className={cn(
                  PAGE_NUMBER_BUTTON,
                  entry === page
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {entry}
              </button>
            ),
          )}

          <PaginationNavButton
            ariaLabel="Next page"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </PaginationNavButton>
        </div>
      ) : null}
    </nav>
  );
}

function PaginationNavButton({
  ariaLabel,
  disabled,
  onClick,
  children,
}: {
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        PAGE_HERO_VIEW_BUTTON,
        'text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      {children}
    </button>
  );
}
