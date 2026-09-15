'use client';

import { usePathname } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { FinanceHeaderContextLayout } from '@/features/finance/components/FinanceHeaderContextLayout';
import {
  resolveFinanceZoneNav,
  permittedFinanceZoneNav,
} from '@/features/finance/finance-module-nav';
import { resolveFinanceSectionId } from '@/lib/navigation/module-last-visit';
import { usePermission } from '@/lib/permissions';

const FINANCE_PAY_NOW_HREF = '/finance/expenses';

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tExpenses = useTranslations('expenses');
  const { can } = usePermission();
  const zoneNav = resolveFinanceZoneNav(pathname);
  const financeZone = resolveFinanceSectionId(pathname);
  const localizedZoneNav = useMemo(
    () =>
      permittedFinanceZoneNav(
        zoneNav?.map((item) => {
          const path = item.href.split('?')[0] ?? item.href;
          if (path !== FINANCE_PAY_NOW_HREF) return item;
          return { ...item, label: tExpenses('nav.payNow') };
        }) ?? null,
        can,
      ),
    [can, tExpenses, zoneNav],
  );

  return (
    <>
      <FinanceHeaderContextLayout />
      <ModuleHeroSlotProvider
        linkToHeaderTab
        title="Finance"
        tabs={
          localizedZoneNav ? (
            <PageHeroNavLinks
              items={localizedZoneNav}
              ariaLabel="Finance section navigation"
              fullWidthOnMobile={financeZone === 'payroll'}
            />
          ) : null
        }
        className="flex h-full min-h-0 min-w-0 flex-col gap-5"
      >
        {children}
      </ModuleHeroSlotProvider>
    </>
  );
}
