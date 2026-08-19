'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { GlobalSearchOverlay } from './GlobalSearchOverlay';
import { isGlobalSearchShortcut } from './global-search-constants';

interface GlobalSearchContextValue {
  openGlobalSearch: () => void;
  closeGlobalSearch: () => void;
}

const GlobalSearchCtx = createContext<GlobalSearchContextValue | null>(null);

export function useGlobalSearch(): GlobalSearchContextValue {
  const ctx = useContext(GlobalSearchCtx);
  if (!ctx) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return ctx;
}

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openGlobalSearch = useCallback(() => setOpen(true), []);
  const closeGlobalSearch = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isGlobalSearchShortcut(event)) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo(
    () => ({ openGlobalSearch, closeGlobalSearch }),
    [closeGlobalSearch, openGlobalSearch],
  );

  return (
    <GlobalSearchCtx.Provider value={value}>
      {children}
      <GlobalSearchOverlay open={open} onOpenChange={setOpen} />
    </GlobalSearchCtx.Provider>
  );
}
