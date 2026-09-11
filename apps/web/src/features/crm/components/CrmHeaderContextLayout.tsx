'use client';

import { useLayoutEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useHeaderContextLayout } from '@/components/layout/header-context';
import { CRM_HEADER_SECTION_DEFAULTS } from '@/features/crm/constants/crm-header-zones';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { useModuleSectionHref } from '@/lib/navigation/hooks/use-module-section-href';
import { writeModuleLastVisitFromPathname } from '@/lib/navigation/module-last-visit';
import { crmHeaderContent } from './crm-header-context-content';

export function CrmHeaderContextLayout() {
  const pathname = usePathname();
  const isMobileViewport = useIsMobileViewport();

  useLayoutEffect(() => {
    writeModuleLastVisitFromPathname(pathname);
  }, [pathname]);

  const dashboardHref = useModuleSectionHref(
    'crm',
    'dashboard',
    CRM_HEADER_SECTION_DEFAULTS.dashboard,
    pathname,
  );
  const leadsHref = useModuleSectionHref(
    'crm',
    'leads',
    CRM_HEADER_SECTION_DEFAULTS.leads,
    pathname,
  );
  const dealsHref = useModuleSectionHref(
    'crm',
    'deals',
    CRM_HEADER_SECTION_DEFAULTS.deals,
    pathname,
  );

  const content = useMemo(
    () =>
      isMobileViewport
        ? crmHeaderContent(pathname, {
            dashboard: dashboardHref,
            leads: leadsHref,
            deals: dealsHref,
          })
        : null,
    [dashboardHref, dealsHref, isMobileViewport, leadsHref, pathname],
  );

  useHeaderContextLayout(content);

  return null;
}
