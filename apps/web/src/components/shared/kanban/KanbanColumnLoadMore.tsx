'use client';

import { useEffect, useRef } from 'react';
import { KANBAN_COLUMN_LOAD_MORE_ROOT_MARGIN } from '@/features/shared/kanban/kanban-column-page';

interface KanbanColumnLoadMoreProps {
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

function findOverflowYParent(node: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = node.parentElement;
  while (el) {
    const overflowY = window.getComputedStyle(el).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return el;
    el = el.parentElement;
  }
  return null;
}

/** Column-scroll load-more sentinel (nearest overflow-y parent as root). */
export function KanbanColumnLoadMore({
  hasMore,
  loadingMore,
  onLoadMore,
}: KanbanColumnLoadMoreProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const canLoadMore = Boolean(onLoadMore) && Boolean(hasMore) && !loadingMore;

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!canLoadMore) return;
    const node = anchorRef.current;
    if (!node) return;

    const root = findOverflowYParent(node);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current?.();
        }
      },
      { root, rootMargin: KANBAN_COLUMN_LOAD_MORE_ROOT_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore]);

  if (!onLoadMore || (!hasMore && !loadingMore)) return null;

  return (
    <div ref={anchorRef} className="flex flex-col items-center gap-2 py-2">
      {loadingMore ? (
        <p className="text-muted-foreground text-[11px] tabular-nums">Loading…</p>
      ) : null}
    </div>
  );
}
