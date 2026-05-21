'use client';

import { useLayoutEffect, useState } from 'react';
import {
  isRegisteredModuleKey,
  readModuleSectionHref,
  type RegisteredModuleKey,
} from '@/lib/navigation/module-last-visit';

/**
 * Sidebar section / header zone href: last page in that section after mount.
 */
export function useModuleSectionHref(
  moduleKey: RegisteredModuleKey,
  sectionId: string,
  fallbackHref: string,
  pathname: string,
): string {
  const [href, setHref] = useState(fallbackHref);

  useLayoutEffect(() => {
    if (!isRegisteredModuleKey(moduleKey)) {
      setHref(fallbackHref);
      return;
    }
    setHref(readModuleSectionHref(moduleKey, sectionId));
  }, [moduleKey, sectionId, fallbackHref, pathname]);

  return href;
}
