'use client';

import { useSyncExternalStore } from 'react';
import {
  isRegisteredModuleKey,
  readModuleSectionHref,
  type RegisteredModuleKey,
} from '@/lib/navigation/module-last-visit';
import { subscribeModuleVisitStore } from '@/lib/navigation/module-last-visit/module-visit-store-subscribe';

/**
 * Sidebar section / header zone href: last page in that section after mount.
 */
export function useModuleSectionHref(
  moduleKey: RegisteredModuleKey,
  sectionId: string,
  fallbackHref: string,
  pathname: string,
): string {
  void pathname;
  return useSyncExternalStore(
    subscribeModuleVisitStore,
    () =>
      isRegisteredModuleKey(moduleKey) ? readModuleSectionHref(moduleKey, sectionId) : fallbackHref,
    () => fallbackHref,
  );
}
