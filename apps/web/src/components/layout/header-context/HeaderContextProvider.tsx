'use client';

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { HeaderContextContent } from './header-context-types';

type HeaderContextStore = {
  setLayoutContent: (content: HeaderContextContent | null) => void;
  setPageContent: (content: HeaderContextContent | null) => void;
  registerModuleTitle: (id: string, title: string | null) => void;
  unregisterModuleTitle: (id: string) => void;
};

const HeaderContext = createContext<HeaderContextStore | null>(null);

export interface HeaderContextProviderProps {
  children: ReactNode;
}

function resolveModuleTitle(registry: Map<string, string | null>): string | null {
  let last: string | null = null;
  for (const title of registry.values()) {
    if (title != null) last = title;
  }
  return last;
}

export function HeaderContextProvider({ children }: HeaderContextProviderProps) {
  const [layoutContent, setLayoutContent] = useState<HeaderContextContent | null>(null);
  const [pageContent, setPageContent] = useState<HeaderContextContent | null>(null);
  const [moduleTitle, setModuleTitleState] = useState<string | null>(null);
  const moduleTitleRegistryRef = useRef(new Map<string, string | null>());

  const setLayoutContentStable = useCallback((content: HeaderContextContent | null) => {
    setLayoutContent(content);
  }, []);

  const setPageContentStable = useCallback((content: HeaderContextContent | null) => {
    setPageContent(content);
  }, []);

  const registerModuleTitle = useCallback((id: string, title: string | null) => {
    moduleTitleRegistryRef.current.set(id, title);
    setModuleTitleState(resolveModuleTitle(moduleTitleRegistryRef.current));
  }, []);

  const unregisterModuleTitle = useCallback((id: string) => {
    if (!moduleTitleRegistryRef.current.has(id)) return;
    moduleTitleRegistryRef.current.delete(id);
    setModuleTitleState(resolveModuleTitle(moduleTitleRegistryRef.current));
  }, []);

  const store = useMemo(
    () => ({
      setLayoutContent: setLayoutContentStable,
      setPageContent: setPageContentStable,
      registerModuleTitle,
      unregisterModuleTitle,
    }),
    [setLayoutContentStable, setPageContentStable, registerModuleTitle, unregisterModuleTitle],
  );

  const resolved = pageContent ?? layoutContent;

  const resolvedValue = useMemo(() => resolved, [resolved]);
  const moduleTitleValue = useMemo(() => moduleTitle, [moduleTitle]);

  return (
    <HeaderContext.Provider value={store}>
      <HeaderContextResolvedContext.Provider value={resolvedValue}>
        <HeaderModuleTitleContext.Provider value={moduleTitleValue}>
          {children}
        </HeaderModuleTitleContext.Provider>
      </HeaderContextResolvedContext.Provider>
    </HeaderContext.Provider>
  );
}

const HeaderContextResolvedContext = createContext<HeaderContextContent | null>(null);
const HeaderModuleTitleContext = createContext<string | null>(null);

/** When true, nested PageHero must not overwrite the module header title. */
export const HeaderModuleTitleLockedContext = createContext(false);

export function useHeaderContextResolved(): HeaderContextContent | null {
  return useContext(HeaderContextResolvedContext);
}

export function useHeaderModuleTitleResolved(): string | null {
  return useContext(HeaderModuleTitleContext);
}

function useHeaderContextStore(): HeaderContextStore {
  const ctx = useContext(HeaderContext);
  if (!ctx) {
    throw new Error('Header context hooks must be used within HeaderContextProvider');
  }
  return ctx;
}

/**
 * Show the module / page name in the app header (left of zone nav).
 * Used by PageHero and ModuleHeroSlotProvider.
 *
 * Titles stack by registration order: unregistering a nested PageHero restores
 * the parent module title instead of clearing the header.
 *
 * @param enabled When false, does not read or clear the module title (nested PageHero on entity pages).
 */
export function useHeaderModuleTitle(title: string | null, enabled = true): void {
  const { registerModuleTitle, unregisterModuleTitle } = useHeaderContextStore();
  const id = useId();

  useLayoutEffect(() => {
    if (!enabled) {
      unregisterModuleTitle(id);
      return;
    }
    registerModuleTitle(id, title);
    return () => unregisterModuleTitle(id);
  }, [registerModuleTitle, unregisterModuleTitle, title, enabled, id]);
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
