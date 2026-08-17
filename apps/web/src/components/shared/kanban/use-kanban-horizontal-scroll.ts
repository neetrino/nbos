'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { KANBAN_COLUMN_X_MARGIN_TOTAL_PX, SCROLL_SPEED } from './kanban.types';

type UseKanbanHorizontalScrollOptions = {
  /** Desktop (and non–full-width mobile) column width in px. */
  columnWidth: number;
  /** Horizontal margin total per column (`mx-2` → 16). */
  columnMarginTotalPx?: number;
  /** Re-measure when column count / layout key changes. */
  layoutKey?: number | string;
  /**
   * When true on mobile, column width tracks the scrollport (CRM Deals).
   * Delivery keeps fixed column width — pass false.
   */
  mobileFullWidthColumns?: boolean;
  /**
   * Forward mostly-horizontal wheel / trackpad gestures to this scroller when the
   * pointer sits over nested column `overflow-y` panes (CRM + Delivery).
   */
  bridgeHorizontalWheel?: boolean;
};

const HORIZONTAL_WHEEL_DOMINANCE_RATIO = 1;

/**
 * Horizontal board scroller: edge affordances, step buttons, optional hover auto-scroll.
 * Shared by `KanbanBoard` and Delivery kanban hosts.
 */
export function useKanbanHorizontalScroll({
  columnWidth,
  columnMarginTotalPx = KANBAN_COLUMN_X_MARGIN_TOTAL_PX,
  layoutKey,
  mobileFullWidthColumns = true,
  bridgeHorizontalWheel = true,
}: UseKanbanHorizontalScrollOptions) {
  const isMobileViewport = useIsMobileViewport();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [mobileColumnWidth, setMobileColumnWidth] = useState(columnWidth);
  const autoScrollDir = useRef<'left' | 'right' | null>(null);
  const rafId = useRef(0);

  const resolvedColumnWidth =
    isMobileViewport && mobileFullWidthColumns ? mobileColumnWidth : columnWidth;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nextLeft = el.scrollLeft > 2;
    const nextRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
    setCanScrollLeft((prev) => (prev === nextLeft ? prev : nextLeft));
    setCanScrollRight((prev) => (prev === nextRight ? prev : nextRight));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, layoutKey]);

  useEffect(() => {
    if (!isMobileViewport || !mobileFullWidthColumns) return;
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      const next = Math.round(el.clientWidth - columnMarginTotalPx);
      if (next <= 0) return;
      setMobileColumnWidth((prev) => (prev === next ? prev : next));
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isMobileViewport, mobileFullWidthColumns, columnMarginTotalPx]);

  useEffect(() => {
    if (!bridgeHorizontalWheel) return;
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;

      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      const useShiftAsHorizontal = event.shiftKey && absY > 0 && absX === 0;
      const horizontalIntent =
        useShiftAsHorizontal || absX > absY * HORIZONTAL_WHEEL_DOMINANCE_RATIO;
      if (!horizontalIntent) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const delta = useShiftAsHorizontal ? event.deltaY : event.deltaX;
      const next = Math.min(maxScroll, Math.max(0, el.scrollLeft + delta));
      if (next === el.scrollLeft) return;

      el.scrollLeft = next;
      event.preventDefault();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [bridgeHorizontalWheel, layoutKey]);

  const startAutoScroll = useCallback((dir: 'left' | 'right') => {
    autoScrollDir.current = dir;
    const tick = () => {
      const el = scrollRef.current;
      if (!el || !autoScrollDir.current) return;
      el.scrollLeft += autoScrollDir.current === 'left' ? -SCROLL_SPEED : SCROLL_SPEED;
      rafId.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(tick);
  }, []);

  const stopAutoScroll = useCallback(() => {
    autoScrollDir.current = null;
    cancelAnimationFrame(rafId.current);
  }, []);

  const scrollByOneColumn = useCallback(
    (side: 'left' | 'right') => {
      const el = scrollRef.current;
      if (!el) return;
      const step = resolvedColumnWidth + columnMarginTotalPx;
      el.scrollBy({ left: side === 'left' ? -step : step, behavior: 'auto' });
    },
    [resolvedColumnWidth, columnMarginTotalPx],
  );

  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  return {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    isMobileViewport,
    resolvedColumnWidth,
    startAutoScroll,
    stopAutoScroll,
    scrollByOneColumn,
  };
}

/** Hide native scrollbar; edge controls own navigation affordance. */
export const KANBAN_HORIZONTAL_SCROLL_HIDE_SCROLLBAR_CLASS =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
