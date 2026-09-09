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
  MobileDockLayout,
  MobileDockSource,
  MobileDockTools,
} from './mobile-module-dock-types';

type DockSources = Record<MobileDockSource, MobileDockItem[]>;
type MobileDockToolsPatch = { [K in keyof MobileDockTools]?: MobileDockTools[K] };

const EMPTY_SOURCES: DockSources = { page: [], secondary: [], header: [] };
const EMPTY_TOOLS: MobileDockTools = {};
const DEFAULT_LAYOUT: MobileDockLayout = 'destinations';

type ToolFlags = {
  hasSearch: boolean;
  hasTrailing: boolean;
  hasTabsEnd: boolean;
  hasCreate: boolean;
  hasSettings: boolean;
};

const EMPTY_TOOL_FLAGS: ToolFlags = {
  hasSearch: false,
  hasTrailing: false,
  hasTabsEnd: false,
  hasCreate: false,
  hasSettings: false,
};

type WorkspaceActions = Pick<MobileDockTools, 'create' | 'settings'>;

type MobileModuleDockContextValue = {
  layout: MobileDockLayout;
  slots: MobileDockItem[];
  overflow: MobileDockItem[];
  scopeItems: MobileDockItem[];
  workspaceActions: WorkspaceActions;
  hasSearch: boolean;
  hasTrailing: boolean;
  hasTabsEnd: boolean;
  hasCreate: boolean;
  hasSettings: boolean;
  getTools: () => MobileDockTools;
  setSourceItems: (source: MobileDockSource, items: MobileDockItem[]) => void;
  setTools: (patch: MobileDockToolsPatch) => void;
  setLayout: (layout: MobileDockLayout) => void;
};

const MobileModuleDockContext = createContext<MobileModuleDockContextValue | null>(null);

function applyToolsPatch(current: MobileDockTools, patch: MobileDockToolsPatch): MobileDockTools {
  const next: MobileDockTools = { ...current };
  (Object.keys(patch) as (keyof MobileDockTools)[]).forEach((key) => {
    const value = patch[key];
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value as never;
    }
  });
  return next;
}

function toolsToFlags(tools: MobileDockTools): ToolFlags {
  return {
    hasSearch: Boolean(tools.search),
    hasTrailing: Boolean(tools.trailing),
    hasTabsEnd: Boolean(tools.tabsEnd),
    hasCreate: Boolean(tools.create),
    hasSettings: Boolean(tools.settings),
  };
}

function toolFlagsEqual(left: ToolFlags, right: ToolFlags): boolean {
  return (
    left.hasSearch === right.hasSearch &&
    left.hasTrailing === right.hasTrailing &&
    left.hasTabsEnd === right.hasTabsEnd &&
    left.hasCreate === right.hasCreate &&
    left.hasSettings === right.hasSettings
  );
}

export function MobileModuleDockProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sources, setSources] = useState<DockSources>(EMPTY_SOURCES);
  const [layout, setLayout] = useState<MobileDockLayout>(DEFAULT_LAYOUT);
  const [workspaceActions, setWorkspaceActions] = useState<WorkspaceActions>({});
  const toolsRef = useRef<MobileDockTools>(EMPTY_TOOLS);
  const [toolFlags, setToolFlags] = useState<ToolFlags>(EMPTY_TOOL_FLAGS);

  const setSourceItems = useCallback((source: MobileDockSource, items: MobileDockItem[]) => {
    setSources((prev) => {
      if (mobileDockItemsEqual(prev[source], items)) return prev;
      return { ...prev, [source]: items };
    });
  }, []);

  const setTools = useCallback((patch: MobileDockToolsPatch) => {
    toolsRef.current = applyToolsPatch(toolsRef.current, patch);
    const nextFlags = toolsToFlags(toolsRef.current);
    setToolFlags((prev) => (toolFlagsEqual(prev, nextFlags) ? prev : nextFlags));
    if ('create' in patch || 'settings' in patch) {
      setWorkspaceActions({
        create: toolsRef.current.create,
        settings: toolsRef.current.settings,
      });
    }
  }, []);

  const getTools = useCallback(() => toolsRef.current, []);

  const resolved = useMemo(() => {
    const merged = mergeMobileDockItems(sources.page, sources.secondary, sources.header);
    const items = merged.length > 0 ? merged : fallbackMobileDockItems(pathname);
    return resolveMobileDockSlots(items);
  }, [pathname, sources]);

  const value = useMemo(
    () => ({
      layout,
      slots: resolved.slots,
      overflow: resolved.overflow,
      scopeItems: sources.secondary,
      workspaceActions,
      ...toolFlags,
      getTools,
      setSourceItems,
      setTools,
      setLayout,
    }),
    [
      layout,
      resolved,
      sources.secondary,
      workspaceActions,
      toolFlags,
      getTools,
      setSourceItems,
      setTools,
    ],
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
  const {
    layout,
    slots,
    overflow,
    scopeItems,
    workspaceActions,
    hasSearch,
    hasTrailing,
    hasTabsEnd,
    hasCreate,
    hasSettings,
    getTools,
  } = useMobileModuleDock();
  return {
    layout,
    slots,
    overflow,
    scopeItems,
    workspaceActions,
    hasSearch,
    hasTrailing,
    hasTabsEnd,
    hasCreate,
    hasSettings,
    getTools,
  };
}

export function useRegisterMobileDockItems(source: MobileDockSource, items: MobileDockItem[]): void {
  const ctx = useContext(MobileModuleDockContext);
  const setSourceItems = ctx?.setSourceItems;

  useLayoutEffect(() => {
    if (!setSourceItems) return;
    setSourceItems(source, items);
    return () => setSourceItems(source, []);
  }, [setSourceItems, source, items]);
}

export function useRegisterMobileDockTools(tools: MobileDockTools): void {
  const ctx = useContext(MobileModuleDockContext);
  const setTools = ctx?.setTools;
  const { search, trailing, tabsEnd } = tools;

  useLayoutEffect(() => {
    if (!setTools) return;
    setTools({ search, trailing, tabsEnd });
    return () => setTools({ search: undefined, trailing: undefined, tabsEnd: undefined });
  }, [setTools, search, trailing, tabsEnd]);
}

export function useRegisterMobileDockLayout(layout: MobileDockLayout): void {
  const ctx = useContext(MobileModuleDockContext);
  const setLayout = ctx?.setLayout;

  useLayoutEffect(() => {
    if (!setLayout) return;
    setLayout(layout);
    return () => setLayout(DEFAULT_LAYOUT);
  }, [setLayout, layout]);
}

export function useRegisterMobileDockWorkspaceActions(actions: {
  create?: MobileDockTools['create'];
  settings?: MobileDockTools['settings'];
}): void {
  const ctx = useContext(MobileModuleDockContext);
  const setTools = ctx?.setTools;
  const { create, settings } = actions;

  useLayoutEffect(() => {
    if (!setTools) return;
    setTools({ create, settings });
    return () => setTools({ create: undefined, settings: undefined });
  }, [setTools, create, settings]);
}
