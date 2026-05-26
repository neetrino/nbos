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
};

const PageHeroToolbarContext = createContext<PageHeroToolbarContextValue | null>(null);

export function PageHeroToolbarProvider({ children }: { children: ReactNode }) {
  const [searchActive, setSearchActiveState] = useState(false);

  const setSearchActive = useCallback((active: boolean) => {
    setSearchActiveState((prev) => (prev === active ? prev : active));
  }, []);

  const value = useMemo(() => ({ searchActive, setSearchActive }), [searchActive, setSearchActive]);

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

/** Keeps hero search expanded while focused, filtering, or typing. */
export function usePageHeroSearchExpansion(active: boolean): void {
  const setSearchActive = usePageHeroToolbarOptional()?.setSearchActive;

  useLayoutEffect(() => {
    setSearchActive?.(active);
  }, [active, setSearchActive]);

  useLayoutEffect(() => {
    return () => setSearchActive?.(false);
  }, [setSearchActive]);
}
