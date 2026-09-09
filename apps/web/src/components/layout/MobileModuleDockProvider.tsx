'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  mergeMobileDockItems,
  mobileDockItemsEqual,
  resolveMobileDockSlots,
} from './mobile-module-dock-resolve';
import { fallbackMobileDockItems } from './mobile-module-fallback-dock';
import type {
  MobileDockItem,
  MobileDockSource,
  MobileDockTools,
} from './mobile-module-dock-types';

type DockSources = Record<MobileDockSource, MobileDockItem[]>;

const EMPTY_SOURCES: DockSources = { page: [], secondary: [], header: [] };
const EMPTY_TOOLS: MobileDockTools = {};

type MobileModuleDockContextValue = {
  slots: MobileDockItem[];
  overflow: MobileDockItem[];
  hasSearch: boolean;
  hasTrailing: boolean;
  hasTabsEnd: boolean;
  getTools: () => MobileDockTools;
  setSourceItems: (source: MobileDockSource, items: MobileDockItem[]) => void;
  setTools: (tools: MobileDockTools) => void;
};

const MobileModuleDockContext = createContext<MobileModuleDockContextValue | null>(null);

export function MobileModuleDockProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sources, setSources] = useState<DockSources>(EMPTY_SOURCES);
  const toolsRef = useRef<MobileDockTools>(EMPTY_TOOLS);
  const [toolFlags, setToolFlags] = useState({
    hasSearch: false,
    hasTrailing: false,
    hasTabsEnd: false,
  });

  const setSourceItems = useCallback((source: MobileDockSource, items: MobileDockItem[]) => {
    setSources((prev) => {
      if (mobileDockItemsEqual(prev[source], items)) return prev;
      return { ...prev, [source]: items };
    });
  }, []);

  const setTools = useCallback((next: MobileDockTools) => {
    toolsRef.current = next;
    const nextFlags = {
      hasSearch: Boolean(next.search),
      hasTrailing: Boolean(next.trailing),
      hasTabsEnd: Boolean(next.tabsEnd),
    };
    setToolFlags((prev) => {
      if (
        prev.hasSearch === nextFlags.hasSearch &&
        prev.hasTrailing === nextFlags.hasTrailing &&
        prev.hasTabsEnd === nextFlags.hasTabsEnd
      ) {
        return prev;
      }
      return nextFlags;
    });
  }, []);

  const getTools = useCallback(() => toolsRef.current, []);

  const resolved = useMemo(() => {
    const merged = mergeMobileDockItems(sources.page, sources.secondary, sources.header);
    const items = merged.length > 0 ? merged : fallbackMobileDockItems(pathname);
    return resolveMobileDockSlots(items);
  }, [pathname, sources]);

  const value = useMemo(
    () => ({
      slots: resolved.slots,
      overflow: resolved.overflow,
      ...toolFlags,
      getTools,
      setSourceItems,
      setTools,
    }),
    [resolved, toolFlags, getTools, setSourceItems, setTools],
  );

  return (
    <MobileModuleDockContext.Provider value={value}>{children}</MobileModuleDockContext.Provider>
  );
}

function useMobileModuleDock(): MobileModuleDockContextValue {
  const ctx = useContext(MobileModuleDockContext);
  if (!ctx) {
    throw new Error('Mobile module dock hooks must be used within MobileModuleDockProvider');
  }
  return ctx;
}

export function useMobileModuleDockResolved() {
  const { slots, overflow, hasSearch, hasTrailing, hasTabsEnd, getTools } = useMobileModuleDock();
  return { slots, overflow, hasSearch, hasTrailing, hasTabsEnd, getTools };
}

export function useRegisterMobileDockItems(source: MobileDockSource, items: MobileDockItem[]): void {
  const ctx = useContext(MobileModuleDockContext);
  const setSourceItems = ctx?.setSourceItems;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const itemsKey = items
    .map((item) => `${item.id}:${item.active}:${item.label}:${item.href ?? ''}`)
    .join('|');

  useLayoutEffect(() => {
    if (!setSourceItems) return;
    setSourceItems(source, itemsRef.current);
    return () => setSourceItems(source, []);
  }, [setSourceItems, source, itemsKey]);
}

export function useRegisterMobileDockTools(tools: MobileDockTools): void {
  const ctx = useContext(MobileModuleDockContext);
  const setTools = ctx?.setTools;
  const toolsRef = useRef(tools);
  toolsRef.current = tools;

  useLayoutEffect(() => {
    if (!setTools) return;
    setTools(toolsRef.current);
    return () => setTools(EMPTY_TOOLS);
  }, [setTools, tools.search, tools.trailing, tools.tabsEnd]);
}
