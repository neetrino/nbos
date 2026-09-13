'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { ReportsHeaderContextLayout } from '@/features/reports/components/ReportsHeaderContextLayout';
import { resolveReportsZoneNav } from '@/features/reports/reports-module-nav';
import { usePermission } from '@/lib/permissions';

export default function ReportsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { can } = usePermission();
  const zoneNav = resolveReportsZoneNav(pathname, can);

  return (
    <>
      <ReportsHeaderContextLayout />
      <ModuleHeroSlotProvider
        linkToHeaderTab
        title="Reports"
        tabs={
          zoneNav ? (
            <PageHeroNavLinks
              items={zoneNav}
              ariaLabel="Reports section navigation"
              fullWidthOnMobile
            />
          ) : null
        }
        className="flex h-full min-h-0 flex-col gap-5 max-md:gap-3"
      >
        {children}
      </ModuleHeroSlotProvider>
    </>
  );
}
