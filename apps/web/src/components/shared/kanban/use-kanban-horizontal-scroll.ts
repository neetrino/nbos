'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import {
  KANBAN_COLUMN_X_MARGIN_TOTAL_MOBILE_PX,
  KANBAN_COLUMN_X_MARGIN_TOTAL_PX,
  KANBAN_MOBILE_PIPELINE_COLUMN_EXTRA_PX,
  KANBAN_TOUCH_DIRECTION_LOCK_PX,
  KANBAN_TOUCH_FLING_FRICTION,
  KANBAN_TOUCH_FLING_MIN_VELOCITY_PX,
  SCROLL_SPEED,
} from './kanban.types';

type UseKanbanHorizontalScrollOptions = {
  /** Desktop (and non–full-width mobile) column width in px. */
  columnWidth: number;
  /** Horizontal margin total per column (`mx-2` → 16). Desktop / non–full-width mobile. */
  columnMarginTotalPx?: number;
  /** Re-measure when column count / layout key changes. */
  layoutKey?: number | string;
  /**
   * When true on mobile, column width tracks the scrollport (page-style).
   * Pipeline boards keep fixed column width — pass false (default).
   */
  mobileFullWidthColumns?: boolean;
  /**
   * Forward mostly-horizontal wheel / trackpad gestures to this scroller when the
   * pointer sits over nested column `overflow-y` panes (CRM + Delivery).
   */
  bridgeHorizontalWheel?: boolean;
};

const HORIZONTAL_WHEEL_DOMINANCE_RATIO = 1;

type TouchScrollAxis = 'x' | 'y';

/**
 * Horizontal board scroller: edge affordances, step buttons, optional hover auto-scroll.
 * Shared by `KanbanBoard` and Delivery kanban hosts.
 */
export function useKanbanHorizontalScroll({
  columnWidth,
  columnMarginTotalPx = KANBAN_COLUMN_X_MARGIN_TOTAL_PX,
  layoutKey,
  mobileFullWidthColumns = false,
  bridgeHorizontalWheel = true,
}: UseKanbanHorizontalScrollOptions) {
  const isMobileViewport = useIsMobileViewport();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [mobileColumnWidth, setMobileColumnWidth] = useState(columnWidth);
  const autoScrollDir = useRef<'left' | 'right' | null>(null);
  const rafId = useRef(0);
  const flingRafId = useRef(0);

  const activeMarginTotalPx = isMobileViewport
    ? KANBAN_COLUMN_X_MARGIN_TOTAL_MOBILE_PX
    : columnMarginTotalPx;

  const resolvedColumnWidth =
    isMobileViewport && mobileFullWidthColumns
      ? mobileColumnWidth
      : isMobileViewport
        ? columnWidth + KANBAN_MOBILE_PIPELINE_COLUMN_EXTRA_PX
        : columnWidth;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nextLeft = el.scrollLeft > 2;
    const nextRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
    setCanScrollLeft((prev) => (prev === nextLeft ? prev : nextLeft));
    setCanScrollRight((prev) => (prev === nextRight ? prev : nextRight));
  }, []);

  const cancelFling = useCallback(() => {
    cancelAnimationFrame(flingRafId.current);
    flingRafId.current = 0;
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
      const next = Math.round(el.clientWidth - activeMarginTotalPx);
      if (next <= 0) return;
      setMobileColumnWidth((prev) => (prev === next ? prev : next));
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isMobileViewport, mobileFullWidthColumns, activeMarginTotalPx]);

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

  /**
   * Nested column `overflow-y` panes steal touch on mobile. Capture horizontal
   * intent, pan the board, then fling so the pipeline keeps moving left/right.
   */
  useEffect(() => {
    if (!isMobileViewport) return;
    const el = scrollRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let lastX = 0;
    let lastT = 0;
    let velocityPxPerMs = 0;
    let axis: TouchScrollAxis | null = null;

    const clampScrollLeft = (value: number) => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return 0;
      return Math.min(maxScroll, Math.max(0, value));
    };

    const startFling = (fingerVelocityPxPerMs: number) => {
      cancelFling();
      // Finger right → content should move right → scrollLeft decreases.
      let velocity = -fingerVelocityPxPerMs * 16;
      if (Math.abs(velocity) < KANBAN_TOUCH_FLING_MIN_VELOCITY_PX) return;

      const tick = () => {
        if (Math.abs(velocity) < KANBAN_TOUCH_FLING_MIN_VELOCITY_PX) {
          flingRafId.current = 0;
          return;
        }
        el.scrollLeft = clampScrollLeft(el.scrollLeft + velocity);
        velocity *= KANBAN_TOUCH_FLING_FRICTION;
        flingRafId.current = requestAnimationFrame(tick);
      };
      flingRafId.current = requestAnimationFrame(tick);
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      cancelFling();
      startX = touch.clientX;
      startY = touch.clientY;
      lastX = touch.clientX;
      lastT = performance.now();
      velocityPxPerMs = 0;
      startScrollLeft = el.scrollLeft;
      axis = null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const now = performance.now();
      const sampleDt = now - lastT;

      if (axis === null) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        if (absX < KANBAN_TOUCH_DIRECTION_LOCK_PX && absY < KANBAN_TOUCH_DIRECTION_LOCK_PX) {
          return;
        }
        axis = absX > absY ? 'x' : 'y';
      }

      if (axis !== 'x') return;

      if (sampleDt > 0) {
        velocityPxPerMs = (touch.clientX - lastX) / sampleDt;
      }
      lastX = touch.clientX;
      lastT = now;

      el.scrollLeft = clampScrollLeft(startScrollLeft - deltaX);
      event.preventDefault();
    };

    const onTouchEnd = () => {
      if (axis === 'x') startFling(velocityPxPerMs);
      axis = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
    return () => {
      cancelFling();
      el.removeEventListener('touchstart', onTouchStart, { capture: true });
      el.removeEventListener('touchmove', onTouchMove, { capture: true });
      el.removeEventListener('touchend', onTouchEnd, { capture: true });
      el.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
  }, [cancelFling, isMobileViewport, layoutKey]);

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
      const step = resolvedColumnWidth + activeMarginTotalPx;
      el.scrollBy({ left: side === 'left' ? -step : step, behavior: 'auto' });
    },
    [resolvedColumnWidth, activeMarginTotalPx],
  );

  useEffect(
    () => () => {
      cancelAnimationFrame(rafId.current);
      cancelAnimationFrame(flingRafId.current);
    },
    [],
  );

  return {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    isMobileViewport,
    resolvedColumnWidth,
    activeMarginTotalPx,
    startAutoScroll,
    stopAutoScroll,
    scrollByOneColumn,
  };
}

/** Hide native scrollbar; edge controls own navigation affordance. */
export const KANBAN_HORIZONTAL_SCROLL_HIDE_SCROLLBAR_CLASS =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
