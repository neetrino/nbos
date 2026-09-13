'use client';

import { useCallback, useLayoutEffect, useRef, type Ref } from 'react';

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  ref.current = value;
}

/**
 * Keeps a textarea height in sync with wrapped content (Bitrix-style growing fields).
 */
export function useAutoGrowTextarea(
  value: string,
  minHeightPx: number,
  forwardedRef?: Ref<HTMLTextAreaElement>,
) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      ref.current = node;
      assignRef(forwardedRef, node);
    },
    [forwardedRef],
  );

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

  return { ref: setRefs, syncHeight };
}
