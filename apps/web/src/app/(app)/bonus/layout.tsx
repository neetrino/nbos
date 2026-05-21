'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { FinanceHeaderContextLayout } from '@/features/finance/components/FinanceHeaderContextLayout';
import { FINANCE_PAYROLL_NAV } from '@/features/finance/finance-module-nav';

export default function BonusLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FinanceHeaderContextLayout />
      <ModuleHeroSlotProvider
        linkToHeaderTab
        title="Finance"
        tabs={<PageHeroNavLinks items={FINANCE_PAYROLL_NAV} ariaLabel="Finance payroll sections" />}
        className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-5"
      >
        {children}
      </ModuleHeroSlotProvider>
    </>
  );
}
