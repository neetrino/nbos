'use client';

import { useEffect, type RefObject } from 'react';

function canFocus(element: HTMLElement): boolean {
  return !('disabled' in element && element.disabled);
}

/** Focus after the sheet paints so the phone keyboard can follow the title field. */
export function useFocusElementWhenOpen(
  open: boolean,
  elementRef: RefObject<HTMLElement | null>,
  delayMs: number,
): void {
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    const focus = () => {
      if (cancelled) return;
      const element = elementRef.current;
      if (!element || !canFocus(element)) return;
      element.focus({ preventScroll: true });
    };

    focus();
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(focus);
    });
    const timer = window.setTimeout(focus, delayMs);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [open, elementRef, delayMs]);
}
