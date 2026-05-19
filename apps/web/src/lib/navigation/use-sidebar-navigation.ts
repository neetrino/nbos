'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SidebarModuleKey } from '@nbos/shared/constants';
import { navigationApi } from '@/lib/api/navigation';
import type { DashboardPersonalLink } from '@/lib/api/dashboard';
import { resolveSidebarModuleOrder } from './apply-sidebar-preferences';

interface SidebarNavigationState {
  sidebarModuleOrder: string[];
  hiddenSidebarModules: string[];
  personalLinks: DashboardPersonalLink[];
  isLoading: boolean;
  isSaving: boolean;
}

export function useSidebarNavigation() {
  const [state, setState] = useState<SidebarNavigationState>({
    sidebarModuleOrder: [],
    hiddenSidebarModules: [],
    personalLinks: [],
    isLoading: true,
    isSaving: false,
  });

  const load = useCallback(async () => {
    try {
      const shell = await navigationApi.getShell();
      setState((current) => ({
        ...current,
        sidebarModuleOrder: shell.sidebarModuleOrder,
        hiddenSidebarModules: shell.hiddenSidebarModules,
        personalLinks: shell.personalLinks,
        isLoading: false,
      }));
    } catch {
      setState((current) => ({ ...current, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persistNavigation = useCallback(async (order: string[], hidden: string[]) => {
    setState((current) => ({ ...current, isSaving: true }));
    try {
      const shell = await navigationApi.updatePreferences({
        sidebarModuleOrder: order,
        hiddenSidebarModules: hidden,
      });
      setState((current) => ({
        ...current,
        sidebarModuleOrder: shell.sidebarModuleOrder,
        hiddenSidebarModules: shell.hiddenSidebarModules,
        personalLinks: shell.personalLinks,
        isSaving: false,
      }));
    } catch {
      setState((current) => ({ ...current, isSaving: false }));
    }
  }, []);

  const moveModule = useCallback(
    (visibleKeys: SidebarModuleKey[], key: SidebarModuleKey, direction: 'up' | 'down') => {
      setState((current) => {
        const order = resolveSidebarModuleOrder(current.sidebarModuleOrder, visibleKeys);
        const index = order.indexOf(key);
        if (index < 0) return current;
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= order.length) return current;
        const next = [...order];
        const [item] = next.splice(index, 1);
        if (!item) return current;
        next.splice(target, 0, item);
        void persistNavigation(next, current.hiddenSidebarModules);
        return { ...current, sidebarModuleOrder: next };
      });
    },
    [persistNavigation],
  );

  const hideModule = useCallback(
    (key: SidebarModuleKey) => {
      setState((current) => {
        if (current.hiddenSidebarModules.includes(key)) return current;
        const hidden = [...current.hiddenSidebarModules, key];
        void persistNavigation(current.sidebarModuleOrder, hidden);
        return { ...current, hiddenSidebarModules: hidden };
      });
    },
    [persistNavigation],
  );

  const restoreModule = useCallback(
    (key: SidebarModuleKey) => {
      setState((current) => {
        const hidden = current.hiddenSidebarModules.filter((moduleKey) => moduleKey !== key);
        void persistNavigation(current.sidebarModuleOrder, hidden);
        return { ...current, hiddenSidebarModules: hidden };
      });
    },
    [persistNavigation],
  );

  const createPersonalLink = useCallback(async (label: string, url: string) => {
    const link = await navigationApi.createPersonalLink({
      label,
      url,
      placement: ['SIDEBAR', 'DASHBOARD_PINNED_ACTIONS'],
    });
    setState((current) => ({
      ...current,
      personalLinks: [...current.personalLinks, link],
    }));
  }, []);

  const deletePersonalLink = useCallback(async (id: string) => {
    await navigationApi.deletePersonalLink(id);
    setState((current) => ({
      ...current,
      personalLinks: current.personalLinks.filter((link) => link.id !== id),
    }));
  }, []);

  const sidebarLinks = state.personalLinks.filter((link) => link.placement.includes('SIDEBAR'));

  return {
    ...state,
    sidebarLinks,
    moveModule,
    hideModule,
    restoreModule,
    createPersonalLink,
    deletePersonalLink,
    reload: load,
  };
}
