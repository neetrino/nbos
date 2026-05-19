'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { CRM_MODULE_NAV } from '@/features/crm/crm-module-nav';

export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleHeroSlotProvider
      title="CRM"
      tabs={<PageHeroNavLinks items={CRM_MODULE_NAV} ariaLabel="CRM sections" />}
      className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
