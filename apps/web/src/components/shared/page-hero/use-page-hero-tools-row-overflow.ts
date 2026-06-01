'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

/** True when flex children exceed the tools row width (horizontal overflow). */
export function usePageHeroToolsRowOverflow(
  toolsRowRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): boolean {
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    if (!enabled) {
      setOverflowing(false);
      return undefined;
    }

    const element = toolsRowRef.current;
    if (!element) {
      return undefined;
    }

    const check = () => {
      setOverflowing(element.scrollWidth > element.clientWidth + 1);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, toolsRowRef]);

  return overflowing;
}
