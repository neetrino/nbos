'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import { PAGE_HERO_COMPACT_MAX_WIDTH_PX } from './page-hero-layout';

/** True when the hero card is narrower than the compact toolbar threshold. */
export function usePageHeroCompactToolbar(sectionRef: RefObject<HTMLElement | null>): boolean {
  const [isCompact, setIsCompact] = useState(false);

  useLayoutEffect(() => {
    const element = sectionRef.current;
    if (!element) {
      return undefined;
    }

    const update = () => {
      setIsCompact(element.getBoundingClientRect().width < PAGE_HERO_COMPACT_MAX_WIDTH_PX);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [sectionRef]);

  return isCompact;
}
