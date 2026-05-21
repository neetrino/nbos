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
import type { HeaderContextContent } from './header-context-types';

type HeaderContextStore = {
  setLayoutContent: (content: HeaderContextContent | null) => void;
  setPageContent: (content: HeaderContextContent | null) => void;
};

const HeaderContext = createContext<HeaderContextStore | null>(null);

export interface HeaderContextProviderProps {
  children: ReactNode;
}

export function HeaderContextProvider({ children }: HeaderContextProviderProps) {
  const [layoutContent, setLayoutContent] = useState<HeaderContextContent | null>(null);
  const [pageContent, setPageContent] = useState<HeaderContextContent | null>(null);

  const setLayoutContentStable = useCallback((content: HeaderContextContent | null) => {
    setLayoutContent(content);
  }, []);

  const setPageContentStable = useCallback((content: HeaderContextContent | null) => {
    setPageContent(content);
  }, []);

  const store = useMemo(
    () => ({
      setLayoutContent: setLayoutContentStable,
      setPageContent: setPageContentStable,
    }),
    [setLayoutContentStable, setPageContentStable],
  );

  const resolved = pageContent ?? layoutContent;

  const resolvedValue = useMemo(() => resolved, [resolved]);

  return (
    <HeaderContext.Provider value={store}>
      <HeaderContextResolvedContext.Provider value={resolvedValue}>
        {children}
      </HeaderContextResolvedContext.Provider>
    </HeaderContext.Provider>
  );
}

const HeaderContextResolvedContext = createContext<HeaderContextContent | null>(null);

export function useHeaderContextResolved(): HeaderContextContent | null {
  return useContext(HeaderContextResolvedContext);
}

function useHeaderContextStore(): HeaderContextStore {
  const ctx = useContext(HeaderContext);
  if (!ctx) {
    throw new Error('Header context hooks must be used within HeaderContextProvider');
  }
  return ctx;
}

/**
 * Register module-level default for the top bar (e.g. Finance zone tabs from layout).
 * Memoize `content` in the caller when it includes React nodes.
 */
export function useHeaderContextLayout(content: HeaderContextContent | null): void {
  const { setLayoutContent } = useHeaderContextStore();

  useLayoutEffect(() => {
    setLayoutContent(content);
    return () => setLayoutContent(null);
  }, [setLayoutContent, content]);
}

/**
 * Override layout default for the current page (actions, custom nav, etc.).
 * Memoize `content` in the caller when it includes React nodes.
 */
export function useHeaderContext(content: HeaderContextContent | null): void {
  const { setPageContent } = useHeaderContextStore();

  useLayoutEffect(() => {
    setPageContent(content);
    return () => setPageContent(null);
  }, [setPageContent, content]);
}
