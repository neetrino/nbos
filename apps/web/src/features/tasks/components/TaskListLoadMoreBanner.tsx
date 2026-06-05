'use client';

import { Button } from '@/components/ui/button';

type TaskListLoadMoreBannerProps = {
  loadedCount: number;
  totalCount: number;
  onLoadMore: () => void;
  loading?: boolean;
};

/** Shown when the task list is truncated by pagination. */
export function TaskListLoadMoreBanner({
  loadedCount,
  totalCount,
  onLoadMore,
  loading = false,
}: TaskListLoadMoreBannerProps) {
  if (totalCount <= loadedCount) return null;

  return (
    <div className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-2.5">
      <p className="text-muted-foreground text-sm">
        Showing {loadedCount} of {totalCount} tasks
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onLoadMore} disabled={loading}>
        {loading ? 'Loading…' : 'Load more'}
      </Button>
    </div>
  );
}
