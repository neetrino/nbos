'use client';

import { useLayoutEffect, useState } from 'react';
import {
  readFinanceModuleEntryHref,
  FINANCE_ZONE_DEFAULT_HREF,
} from '@/features/finance/constants/finance-zone-storage';

/**
 * Parent Finance sidebar href: last active zone + last page in that zone.
 * Safe for SSR: default overview dashboard until client storage applies.
 */
export function useFinanceModuleEntryHref(pathname: string): string {
  const [href, setHref] = useState(FINANCE_ZONE_DEFAULT_HREF.overview);

  useLayoutEffect(() => {
    setHref(readFinanceModuleEntryHref());
  }, [pathname]);

  return href;
}
