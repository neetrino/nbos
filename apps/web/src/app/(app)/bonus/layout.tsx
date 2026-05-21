'use client';

import type { ReactNode } from 'react';
import { MODULE_SHELL_HEADER_BRIDGE_OFFSET } from '@/components/shared/module-shell/module-shell-surface';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { FinanceHeaderContextLayout } from '@/features/finance/components/FinanceHeaderContextLayout';
import { FINANCE_PAYROLL_NAV } from '@/features/finance/finance-module-nav';
import { cn } from '@/lib/utils';

export default function BonusLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FinanceHeaderContextLayout />
      <div className={cn(MODULE_SHELL_HEADER_BRIDGE_OFFSET, 'flex min-h-0 flex-col')}>
        <ModuleHeroSlotProvider
          attachToHeaderBridge
          title="Finance"
          tabs={
            <PageHeroNavLinks items={FINANCE_PAYROLL_NAV} ariaLabel="Finance payroll sections" />
          }
          className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-5"
        >
          {children}
        </ModuleHeroSlotProvider>
      </div>
    </>
  );
}
