'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Keeps a textarea height in sync with wrapped content (Bitrix-style growing fields).
 */
export function useAutoGrowTextarea(value: string, minHeightPx: number) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const syncHeight = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = '0px';
    const nextHeight = Math.max(minHeightPx, element.scrollHeight);
    element.style.height = `${nextHeight}px`;
  }, [minHeightPx]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    syncHeight();

    const parent = element.parentElement;
    if (!parent || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      syncHeight();
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, [value, syncHeight]);

  return { ref, syncHeight };
}
