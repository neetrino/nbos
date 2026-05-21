'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { resolveFinanceZoneNav } from '@/features/finance/finance-module-nav';

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const zoneNav = resolveFinanceZoneNav(pathname);

  return (
    <ModuleHeroSlotProvider
      title="Finance"
      tabs={
        zoneNav ? <PageHeroNavLinks items={zoneNav} ariaLabel="Finance section navigation" /> : null
      }
      className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
