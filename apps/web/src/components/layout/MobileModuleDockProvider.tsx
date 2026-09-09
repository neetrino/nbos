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
import { mobileDockItemsEqual, resolveMobileDockSwitcher } from './mobile-module-dock-resolve';
import { fallbackMobileDockItems } from './mobile-module-fallback-dock';
import type {
  MobileDockCreateAction,
  MobileDockItem,
  MobileDockSource,
  MobileDockSwitcherGroup,
  MobileDockTools,
} from './mobile-module-dock-types';

type DockSources = Record<MobileDockSource, MobileDockItem[]>;
type MobileDockToolsPatch = { [K in keyof MobileDockTools]?: MobileDockTools[K] };

const EMPTY_SOURCES: DockSources = { page: [], secondary: [], header: [] };
const EMPTY_TOOLS: MobileDockTools = {};

type ToolFlags = {
  hasSearch: boolean;
  hasCreate: boolean;
  hasSettings: boolean;
};

const EMPTY_TOOL_FLAGS: ToolFlags = {
  hasSearch: false,
  hasCreate: false,
  hasSettings: false,
};

type MobileModuleDockContextValue = {
  switcherGroups: MobileDockSwitcherGroup[];
  switcherItem: MobileDockItem | null;
  create: MobileDockCreateAction | undefined;
  settings: ReactNode | undefined;
  hasSearch: boolean;
  hasCreate: boolean;
  hasSettings: boolean;
  getTools: () => MobileDockTools;
  setSourceItems: (source: MobileDockSource, items: MobileDockItem[]) => void;
  setTools: (patch: MobileDockToolsPatch) => void;
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
    hasCreate: Boolean(tools.create),
    hasSettings: Boolean(tools.settings),
  };
}

function toolFlagsEqual(left: ToolFlags, right: ToolFlags): boolean {
  return (
    left.hasSearch === right.hasSearch &&
    left.hasCreate === right.hasCreate &&
    left.hasSettings === right.hasSettings
  );
}

export function MobileModuleDockProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sources, setSources] = useState<DockSources>(EMPTY_SOURCES);
  const toolsRef = useRef<MobileDockTools>(EMPTY_TOOLS);
  const [toolFlags, setToolFlags] = useState<ToolFlags>(EMPTY_TOOL_FLAGS);
  const [workspaceActions, setWorkspaceActions] = useState<
    Pick<MobileDockTools, 'create' | 'settings'>
  >({});

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

  const switcher = useMemo(
    () =>
      resolveMobileDockSwitcher(
        sources.page,
        sources.header,
        sources.secondary,
        fallbackMobileDockItems(pathname),
      ),
    [pathname, sources],
  );

  const value = useMemo(
    () => ({
      switcherGroups: switcher.groups,
      switcherItem: switcher.displayItem,
      create: workspaceActions.create,
      settings: workspaceActions.settings,
      ...toolFlags,
      getTools,
      setSourceItems,
      setTools,
    }),
    [switcher, workspaceActions, toolFlags, getTools, setSourceItems, setTools],
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
    switcherGroups,
    switcherItem,
    create,
    settings,
    hasSearch,
    hasCreate,
    hasSettings,
    getTools,
  } = useMobileModuleDock();
  return {
    switcherGroups,
    switcherItem,
    create,
    settings,
    hasSearch,
    hasCreate,
    hasSettings,
    getTools,
  };
}

export function useRegisterMobileDockItems(
  source: MobileDockSource,
  items: MobileDockItem[],
): void {
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

export function useRegisterMobileDockWorkspaceActions(actions: {
  create?: MobileDockTools['create'];
  settings?: MobileDockTools['settings'];
}): void {
  const ctx = useContext(MobileModuleDockContext);
  const setTools = ctx?.setTools;
  const hasCreate = Object.prototype.hasOwnProperty.call(actions, 'create');
  const hasSettings = Object.prototype.hasOwnProperty.call(actions, 'settings');
  const { create, settings } = actions;

  useLayoutEffect(() => {
    if (!setTools) return;
    const patch: MobileDockToolsPatch = {};
    if (hasCreate) patch.create = create;
    if (hasSettings) patch.settings = settings;
    setTools(patch);
    return () => {
      const clear: MobileDockToolsPatch = {};
      if (hasCreate) clear.create = undefined;
      if (hasSettings) clear.settings = undefined;
      setTools(clear);
    };
  }, [setTools, hasCreate, hasSettings, create, settings]);
}
