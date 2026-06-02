'use client';

import { useEffect, useRef } from 'react';

export interface InfiniteScrollSentinelProps {
  onReach: () => void;
  disabled?: boolean;
  /** Scroll container to observe within; defaults to the viewport. */
  root?: HTMLElement | null;
  rootMargin?: string;
}

/**
 * Invisible marker that triggers `onReach` when scrolled into view.
 */
export function InfiniteScrollSentinel({
  onReach,
  disabled,
  root,
  rootMargin = '200px',
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onReachRef = useRef(onReach);

  useEffect(() => {
    onReachRef.current = onReach;
  }, [onReach]);

  useEffect(() => {
    if (disabled) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onReachRef.current();
      },
      { root: root ?? null, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, root, rootMargin]);

  return <div ref={ref} aria-hidden className="h-px w-full shrink-0" />;
}
