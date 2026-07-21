'use client';

import { useSyncExternalStore } from 'react';

/**
 * Matches Tailwind `md` (768px). Below this, board/card chrome is used
 * without list view or filter panels.
 */
export const MOBILE_VIEWPORT_MAX_WIDTH_PX = 767;

const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_VIEWPORT_MAX_WIDTH_PX}px)`;

function subscribeMobileViewport(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

function getMobileViewportSnapshot(): boolean {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

/** SSR + hydration snapshot — must match server HTML (desktop shell). */
function getMobileViewportServerSnapshot(): boolean {
  return false;
}

/**
 * True when the viewport is at most {@link MOBILE_VIEWPORT_MAX_WIDTH_PX} wide.
 * Uses {@link useSyncExternalStore} so SSR/hydration always see `false`, then
 * the client updates after hydrate — no hydration mismatch on mobile.
 */
export function useIsMobileViewport(): boolean {
  return useSyncExternalStore(
    subscribeMobileViewport,
    getMobileViewportSnapshot,
    getMobileViewportServerSnapshot,
  );
}
