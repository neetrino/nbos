'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type PageHeroToolbarContextValue = {
  searchActive: boolean;
  setSearchActive: (active: boolean) => void;
  filterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
};

const PageHeroToolbarContext = createContext<PageHeroToolbarContextValue | null>(null);

export function PageHeroToolbarProvider({ children }: { children: ReactNode }) {
  const [searchActive, setSearchActiveState] = useState(false);
  const [filterPanelOpen, setFilterPanelOpenState] = useState(false);

  const setSearchActive = useCallback((active: boolean) => {
    setSearchActiveState((prev) => (prev === active ? prev : active));
  }, []);

  const setFilterPanelOpen = useCallback((open: boolean) => {
    setFilterPanelOpenState((prev) => (prev === open ? prev : open));
  }, []);

  const value = useMemo(
    () => ({ searchActive, setSearchActive, filterPanelOpen, setFilterPanelOpen }),
    [searchActive, setSearchActive, filterPanelOpen, setFilterPanelOpen],
  );

  return (
    <PageHeroToolbarContext.Provider value={value}>{children}</PageHeroToolbarContext.Provider>
  );
}

export function usePageHeroToolbarOptional(): PageHeroToolbarContextValue | null {
  return useContext(PageHeroToolbarContext);
}

export function usePageHeroToolbar(): PageHeroToolbarContextValue {
  const ctx = usePageHeroToolbarOptional();
  if (!ctx) {
    throw new Error('usePageHeroToolbar must be used within PageHero');
  }
  return ctx;
}

function usePageHeroSearchExpansion(active: boolean): void {
  const setSearchActive = usePageHeroToolbarOptional()?.setSearchActive;

  useLayoutEffect(() => {
    setSearchActive?.(active);
  }, [active, setSearchActive]);

  useLayoutEffect(() => {
    return () => setSearchActive?.(false);
  }, [setSearchActive]);
}

function usePageHeroFilterPanelOverflow(open: boolean): void {
  const setFilterPanelOpen = usePageHeroToolbarOptional()?.setFilterPanelOpen;

  useLayoutEffect(() => {
    setFilterPanelOpen?.(open);
  }, [open, setFilterPanelOpen]);

  useLayoutEffect(() => {
    return () => setFilterPanelOpen?.(false);
  }, [setFilterPanelOpen]);
}

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
  usePageHeroFilterPanelOverflow(panelOpen);
}
