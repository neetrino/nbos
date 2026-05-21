'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { FINANCE_PAYROLL_NAV } from '@/features/finance/finance-module-nav';

export default function BonusLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleHeroSlotProvider
      title="Finance"
      tabs={<PageHeroNavLinks items={FINANCE_PAYROLL_NAV} ariaLabel="Finance payroll sections" />}
      className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
