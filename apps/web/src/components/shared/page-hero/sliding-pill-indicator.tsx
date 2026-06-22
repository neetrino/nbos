'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import { cn } from '@/lib/utils';

export type SlidingPillIndicatorRect = {
  left: number;
  width: number;
};

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
        ready && 'transition-[left,width] duration-300 ease-out',
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
    if (!container || !activeEl) {
      setIndicator(null);
      return;
    }

    const updateIndicator = () => {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setIndicator({
        left: activeRect.left - containerRect.left + container.scrollLeft,
        width: activeRect.width,
      });
    };

    updateIndicator();
    setReady(true);
    if (scrollIntoView) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(container);
    observer.observe(activeEl);
    window.addEventListener('resize', updateIndicator);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeKey, containerRef, getActiveElement, scrollIntoView]);

  return { indicator, ready };
}
