'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { writeModuleLastVisitFromPathname } from '@/lib/navigation/module-last-visit';

/** Persists Project Hub last-visit on every /projects route, including detail. */
export function ProjectsHubVisitLayout() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    writeModuleLastVisitFromPathname(pathname);
  }, [pathname]);

  return null;
}
