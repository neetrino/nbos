'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { ReportsHeaderContextLayout } from '@/features/reports/components/ReportsHeaderContextLayout';
import { resolveReportsZoneNav } from '@/features/reports/reports-module-nav';

export default function ReportsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const zoneNav = resolveReportsZoneNav(pathname);

  return (
    <>
      <ReportsHeaderContextLayout />
      <ModuleHeroSlotProvider
        linkToHeaderTab
        title="Reports"
        tabs={
          zoneNav ? (
            <PageHeroNavLinks items={zoneNav} ariaLabel="Reports section navigation" />
          ) : null
        }
        className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-5"
      >
        {children}
      </ModuleHeroSlotProvider>
    </>
  );
}
