'use client';

import { useLayoutEffect, useState } from 'react';
import {
  FINANCE_ZONE_DEFAULT_HREF,
  readFinanceZoneHref,
  type FinanceSidebarZoneId,
} from '@/features/finance/constants/finance-zone-storage';

/**
 * Sidebar zone href safe for SSR hydration: defaults on server/first paint,
 * then applies last-visited path from localStorage after mount.
 */
export function useFinanceZoneHref(zone: FinanceSidebarZoneId, pathname: string): string {
  const [href, setHref] = useState(FINANCE_ZONE_DEFAULT_HREF[zone]);

  useLayoutEffect(() => {
    setHref(readFinanceZoneHref(zone));
  }, [zone, pathname]);

  return href;
}
