'use client';

import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';

const TASK_LIST_LOAD_MORE_ROOT_MARGIN = '240px';

type TaskListLoadMoreBannerProps = {
  loadedCount: number;
  totalCount: number;
  onLoadMore: () => void;
  loading?: boolean;
  /** True when the API has another page. Do not derive this from filtered card counts. */
  hasMorePages?: boolean;
};

/** Compact remainder count; extra pages load when the marker enters view. */
export function TaskListLoadMoreBanner({
  loadedCount,
  totalCount,
  onLoadMore,
  loading = false,
  hasMorePages = false,
}: TaskListLoadMoreBannerProps) {
  const showCount = totalCount > loadedCount;
  if (!showCount && !hasMorePages && !loading) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      {showCount ? (
        <p className="text-muted-foreground text-xs tabular-nums">
          {loadedCount} of {totalCount}
        </p>
      ) : null}
      {loading ? <p className="text-muted-foreground text-xs">Loading…</p> : null}
      {hasMorePages ? (
        <InfiniteScrollSentinel
          onReach={onLoadMore}
          disabled={loading}
          rootMargin={TASK_LIST_LOAD_MORE_ROOT_MARGIN}
        />
      ) : null}
    </div>
  );
}
