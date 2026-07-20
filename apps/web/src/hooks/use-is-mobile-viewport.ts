'use client';

import { useEffect, useState } from 'react';

/**
 * Matches Tailwind `md` (768px). Below this, board/card chrome is used
 * without list view or filter panels.
 */
export const MOBILE_VIEWPORT_MAX_WIDTH_PX = 767;

const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_VIEWPORT_MAX_WIDTH_PX}px)`;

function readIsMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

/** True when the viewport is at most {@link MOBILE_VIEWPORT_MAX_WIDTH_PX} wide. */
export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(readIsMobileViewport);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const sync = () => setIsMobile(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  return isMobile;
}
