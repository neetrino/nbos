'use client';

import { useLayoutEffect, useState } from 'react';
import type { SidebarModuleKey } from '@nbos/shared/constants';
import { isRegisteredModuleKey, readModuleEntryHref } from '@/lib/navigation/module-last-visit';

/**
 * Sidebar parent module href with last-visit restore when a registry entry exists.
 */
export function useModuleEntryHref(
  moduleKey: SidebarModuleKey,
  fallbackHref: string,
  pathname: string,
): string {
  const [href, setHref] = useState(fallbackHref);

  useLayoutEffect(() => {
    if (!isRegisteredModuleKey(moduleKey)) {
      setHref(fallbackHref);
      return;
    }
    setHref(readModuleEntryHref(moduleKey));
  }, [moduleKey, fallbackHref, pathname]);

  return href;
}
