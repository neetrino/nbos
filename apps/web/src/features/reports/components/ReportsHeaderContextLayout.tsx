'use client';

import { useLayoutEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  useHeaderContextLayout,
  type HeaderContextContent,
  type HeaderNavItem,
} from '@/components/layout/header-context';
import { REPORTS_HEADER_ZONE_ACCENTS } from '@/features/reports/constants/reports-header-zone-accents';
import { REPORTS_HEADER_ZONES } from '@/features/reports/constants/reports-header-zones';
import {
  isReportsHeaderContextPath,
  isReportsSectionPath,
  readReportsSectionHref,
  writeModuleLastVisitFromPathname,
} from '@/lib/navigation/module-last-visit/reports-module-last-visit';

export function ReportsHeaderContextLayout() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    writeModuleLastVisitFromPathname(pathname);
  }, [pathname]);

  const content = useMemo((): HeaderContextContent | null => {
    if (!isReportsHeaderContextPath(pathname)) {
      return null;
    }

    const items: HeaderNavItem[] = REPORTS_HEADER_ZONES.map((zone) => ({
      label: zone.label,
      href: readReportsSectionHref(zone.zone),
      isActive: (path) => isReportsSectionPath(path, zone.zone),
      accent: REPORTS_HEADER_ZONE_ACCENTS[zone.zone],
    }));

    return {
      kind: 'nav',
      ariaLabel: 'Reports areas',
      items,
    };
  }, [pathname]);

  useHeaderContextLayout(content);

  return null;
}
