'use client';

import { useSyncExternalStore } from 'react';
import type { SidebarModuleKey } from '@nbos/shared/constants';
import {
  isRegisteredModuleKey,
  resolvePermittedModuleEntryHref,
} from '@/lib/navigation/module-last-visit';
import { subscribeModuleVisitStore } from '@/lib/navigation/module-last-visit/module-visit-store-subscribe';
import { usePermission } from '@/lib/permissions';

/**
 * Sidebar parent module href with last-visit restore when a registry entry exists.
 * Falls back to a permitted page when the stored path is now forbidden.
 */
export function useModuleEntryHref(
  moduleKey: SidebarModuleKey,
  fallbackHref: string,
  pathname: string,
): string {
  void pathname;
  const { can, isLoading } = usePermission();
  return useSyncExternalStore(
    subscribeModuleVisitStore,
    () => {
      if (!isRegisteredModuleKey(moduleKey) || isLoading) return fallbackHref;
      return resolvePermittedModuleEntryHref(moduleKey, can);
    },
    () => fallbackHref,
  );
}
