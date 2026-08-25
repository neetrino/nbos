'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import { cn } from '@/lib/utils';

export type SlidingPillIndicatorRect = {
  left: number;
  width: number;
};

export type SlidingSidebarIndicatorRect = {
  top: number;
  height: number;
};

/** Shared easing/duration for pill toggles (PageHero tabs, view mode, segmented filters). */
export const SLIDING_PILL_TRANSITION_CLASS =
  'transition-[left,width] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

/** Vertical slide for sidebar module rows (active highlight moves up/down between items). */
export const SLIDING_SIDEBAR_TRANSITION_CLASS =
  'transition-[top,height] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

export function SlidingPillBackdrop({
  indicator,
  ready,
  className,
}: {
  indicator: SlidingPillIndicatorRect | null;
  ready: boolean;
  className?: string;
}) {
  if (!indicator) return null;

  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute top-1 bottom-1 rounded-full',
        ready && SLIDING_PILL_TRANSITION_CLASS,
        className,
      )}
      style={{ left: indicator.left, width: indicator.width }}
    />
  );
}

export function useSlidingPillIndicator(
  containerRef: RefObject<HTMLElement | null>,
  getActiveElement: () => HTMLElement | null | undefined,
  activeKey: string,
  scrollIntoView = true,
): { indicator: SlidingPillIndicatorRect | null; ready: boolean } {
  const [indicator, setIndicator] = useState<SlidingPillIndicatorRect | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const activeEl = getActiveElement();

    const updateIndicator = () => {
      const currentContainer = containerRef.current;
      const currentActiveEl = getActiveElement();
      if (!currentContainer || !currentActiveEl) {
        setIndicator(null);
        return;
      }

      const containerRect = currentContainer.getBoundingClientRect();
      const activeRect = currentActiveEl.getBoundingClientRect();
      setIndicator({
        left: activeRect.left - containerRect.left + currentContainer.scrollLeft,
        width: activeRect.width,
      });
    };

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      if (!container || !activeEl) {
        setIndicator(null);
        setReady(false);
        return;
      }

      updateIndicator();
      setReady(true);
      if (scrollIntoView) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    });

    if (!container || !activeEl) {
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(container);
    observer.observe(activeEl);
    window.addEventListener('resize', updateIndicator);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeKey, containerRef, getActiveElement, scrollIntoView]);

  return { indicator, ready };
}

export function SlidingSidebarBackdrop({
  indicator,
  ready,
  className,
}: {
  indicator: SlidingSidebarIndicatorRect | null;
  ready: boolean;
  className?: string;
}) {
  if (!indicator) return null;

  return (
    <span
      aria-hidden
      className={cn(
        'bg-sidebar-accent pointer-events-none absolute inset-x-0 rounded-md',
        ready && SLIDING_SIDEBAR_TRANSITION_CLASS,
        className,
      )}
      style={{ top: indicator.top, height: indicator.height }}
    />
  );
}

export function useSlidingSidebarIndicator(
  containerRef: RefObject<HTMLElement | null>,
  getActiveElement: () => HTMLElement | null | undefined,
  activeKey: string,
  scrollIntoView = true,
): { indicator: SlidingSidebarIndicatorRect | null; ready: boolean } {
  const [indicator, setIndicator] = useState<SlidingSidebarIndicatorRect | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const activeEl = getActiveElement();

    const updateIndicator = () => {
      const currentContainer = containerRef.current;
      const currentActiveEl = getActiveElement();
      if (!currentContainer || !currentActiveEl) {
        setIndicator(null);
        return;
      }

      const containerRect = currentContainer.getBoundingClientRect();
      const activeRect = currentActiveEl.getBoundingClientRect();
      setIndicator({
        top: activeRect.top - containerRect.top + currentContainer.scrollTop,
        height: activeRect.height,
      });
    };

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      if (!container || !activeEl) {
        setIndicator(null);
        setReady(false);
        return;
      }

      updateIndicator();
      setReady(true);
      if (scrollIntoView) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    });

    if (!container || !activeEl) {
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(container);
    observer.observe(activeEl);
    window.addEventListener('resize', updateIndicator);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeKey, containerRef, getActiveElement, scrollIntoView]);

  return { indicator, ready };
}
