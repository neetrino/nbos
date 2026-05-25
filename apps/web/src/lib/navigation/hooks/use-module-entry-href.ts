'use client';

import { useSyncExternalStore } from 'react';
import type { SidebarModuleKey } from '@nbos/shared/constants';
import { isRegisteredModuleKey, readModuleEntryHref } from '@/lib/navigation/module-last-visit';
import { subscribeModuleVisitStore } from '@/lib/navigation/module-last-visit/module-visit-store-subscribe';

/**
 * Sidebar parent module href with last-visit restore when a registry entry exists.
 */
export function useModuleEntryHref(
  moduleKey: SidebarModuleKey,
  fallbackHref: string,
  pathname: string,
): string {
  void pathname;
  return useSyncExternalStore(
    subscribeModuleVisitStore,
    () => (isRegisteredModuleKey(moduleKey) ? readModuleEntryHref(moduleKey) : fallbackHref),
    () => fallbackHref,
  );
}
