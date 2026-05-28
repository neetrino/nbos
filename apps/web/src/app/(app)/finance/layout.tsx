'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { FinanceHeaderContextLayout } from '@/features/finance/components/FinanceHeaderContextLayout';
import { resolveFinanceZoneNav } from '@/features/finance/finance-module-nav';
import { isFinancePayrollRunDetailPath } from '@/features/finance/constants/finance-payroll-run-detail-path';

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const zoneNav = resolveFinanceZoneNav(pathname);
  const isPayrollRunDetail = isFinancePayrollRunDetailPath(pathname);

  return (
    <>
      <FinanceHeaderContextLayout />
      <ModuleHeroSlotProvider
        linkToHeaderTab
        title="Finance"
        tabs={
          isPayrollRunDetail || !zoneNav ? null : (
            <PageHeroNavLinks items={zoneNav} ariaLabel="Finance section navigation" />
          )
        }
        className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-5"
      >
        {children}
      </ModuleHeroSlotProvider>
    </>
  );
}
