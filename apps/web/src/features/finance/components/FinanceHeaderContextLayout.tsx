'use client';

import { useLayoutEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  useHeaderContextLayout,
  type HeaderContextContent,
  type HeaderNavItem,
} from '@/components/layout/header-context';
import { FINANCE_HEADER_ZONE_ACCENTS } from '@/features/finance/constants/finance-header-zone-accents';
import { FINANCE_HEADER_ZONES } from '@/features/finance/constants/finance-header-zones';
import {
  isFinanceHeaderContextPath,
  isFinanceSectionPath,
  readFinanceSectionHref,
  writeModuleLastVisitFromPathname,
} from '@/lib/navigation/module-last-visit';
import { usePermission } from '@/lib/permissions';

export function FinanceHeaderContextLayout() {
  const pathname = usePathname();
  const { can } = usePermission();

  useLayoutEffect(() => {
    writeModuleLastVisitFromPathname(pathname);
  }, [pathname]);

  const content = useMemo((): HeaderContextContent | null => {
    if (!isFinanceHeaderContextPath(pathname)) {
      return null;
    }

    const items: HeaderNavItem[] = FINANCE_HEADER_ZONES.filter(
      (zone) => !zone.permission || can(zone.permission.action, zone.permission.module),
    ).map((zone) => ({
      label: zone.label,
      href: readFinanceSectionHref(zone.zone),
      isActive: (path) => isFinanceSectionPath(path, zone.zone),
      accent: FINANCE_HEADER_ZONE_ACCENTS[zone.zone],
    }));

    if (items.length === 0) {
      return null;
    }

    return {
      kind: 'nav',
      ariaLabel: 'Finance areas',
      items,
    };
  }, [pathname, can]);

  useHeaderContextLayout(content);

  return null;
}
