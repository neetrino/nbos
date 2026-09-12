'use client';

import { useEffect, useRef } from 'react';

const LOAD_MORE_ROOT_MARGIN = '80px';

export interface NotificationInboxLoadMoreSentinelProps {
  enabled: boolean;
  loading: boolean;
  onVisible: () => void;
}

/** Fires `onVisible` when the list end enters the scrollport. */
export function NotificationInboxLoadMoreSentinel({
  enabled,
  loading,
  onVisible,
}: NotificationInboxLoadMoreSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || loading) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onVisible();
      },
      { rootMargin: LOAD_MORE_ROOT_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, loading, onVisible]);

  return <div ref={ref} className="h-4" aria-hidden />;
}
