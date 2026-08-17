'use client';

import { useLayoutEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  useHeaderContextLayout,
  type HeaderContextContent,
  type HeaderNavItem,
} from '@/components/layout/header-context';
import { MARKETING_HEADER_ZONE_ACCENTS } from '@/features/marketing/constants/marketing-header-zone-accents';
import { MARKETING_HEADER_ZONES } from '@/features/marketing/constants/marketing-header-zones';
import {
  isPathInModuleSection,
  MODULE_VISIT_REGISTRY,
  readModuleSectionHref,
  writeModuleLastVisitFromPathname,
} from '@/lib/navigation/module-last-visit';

function isMarketingHeaderContextPath(pathname: string): boolean {
  const config = MODULE_VISIT_REGISTRY.marketing;
  return config.kind === 'sections' && config.resolveSection(pathname) !== null;
}

export function MarketingHeaderContextLayout() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    writeModuleLastVisitFromPathname(pathname);
  }, [pathname]);

  const content = useMemo((): HeaderContextContent | null => {
    if (!isMarketingHeaderContextPath(pathname)) {
      return null;
    }

    const items: HeaderNavItem[] = MARKETING_HEADER_ZONES.map((zone) => ({
      label: zone.label,
      href: readModuleSectionHref('marketing', zone.zone),
      isActive: (path) => isPathInModuleSection('marketing', path, zone.zone),
      accent: MARKETING_HEADER_ZONE_ACCENTS[zone.zone],
    }));

    return {
      kind: 'nav',
      ariaLabel: 'Marketing areas',
      items,
    };
  }, [pathname]);

  useHeaderContextLayout(content);

  return null;
}
