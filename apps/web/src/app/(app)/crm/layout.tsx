'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { CrmHeaderContextLayout } from '@/features/crm/components/CrmHeaderContextLayout';
import { CRM_MODULE_NAV } from '@/features/crm/crm-module-nav';

export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CrmHeaderContextLayout />
      <ModuleHeroSlotProvider
        title="CRM"
        tabs={
          <PageHeroNavLinks
            items={CRM_MODULE_NAV}
            ariaLabel="CRM sections"
            className="max-md:hidden"
          />
        }
        className="flex h-full min-h-0 w-full min-w-0 flex-col gap-5"
      >
        {children}
      </ModuleHeroSlotProvider>
    </>
  );
}
