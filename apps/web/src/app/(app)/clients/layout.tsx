'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { CLIENTS_MODULE_NAV } from '@/features/clients/clients-module-nav';

export default function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleHeroSlotProvider
      title="Clients"
      tabs={<PageHeroNavLinks items={CLIENTS_MODULE_NAV} ariaLabel="Clients sections" />}
      className="flex h-full min-h-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
