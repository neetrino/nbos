'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { MODULE_SHELL_HEADER_BRIDGE_OFFSET } from '@/components/shared/module-shell/module-shell-surface';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { FinanceHeaderContextLayout } from '@/features/finance/components/FinanceHeaderContextLayout';
import { resolveFinanceZoneNav } from '@/features/finance/finance-module-nav';
import { cn } from '@/lib/utils';

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const zoneNav = resolveFinanceZoneNav(pathname);

  return (
    <>
      <FinanceHeaderContextLayout />
      <div className={cn(MODULE_SHELL_HEADER_BRIDGE_OFFSET, 'flex min-h-0 flex-col')}>
        <ModuleHeroSlotProvider
          attachToHeaderBridge
          title="Finance"
          tabs={
            zoneNav ? (
              <PageHeroNavLinks items={zoneNav} ariaLabel="Finance section navigation" />
            ) : null
          }
          className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-5"
        >
          {children}
        </ModuleHeroSlotProvider>
      </div>
    </>
  );
}
