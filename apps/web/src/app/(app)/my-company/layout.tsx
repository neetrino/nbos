'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { MY_COMPANY_MODULE_NAV } from '@/features/hr/constants/my-company-module-nav';

export default function MyCompanyLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleHeroSlotProvider
      title="My Company"
      tabs={<PageHeroNavLinks items={MY_COMPANY_MODULE_NAV} ariaLabel="My Company sections" />}
      className="flex h-full min-h-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
