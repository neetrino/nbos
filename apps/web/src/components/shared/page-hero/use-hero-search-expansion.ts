'use client';

import { usePageHeroSearchExpansion } from './page-hero-toolbar-context';

/** Wire search focus / filters / query into PageHero toolbar collapse. */
export function useHeroSearchExpansionState({
  focused,
  panelOpen,
  hasQuery,
}: {
  focused: boolean;
  panelOpen: boolean;
  hasQuery: boolean;
}): void {
  usePageHeroSearchExpansion(focused || panelOpen || hasQuery);
}
