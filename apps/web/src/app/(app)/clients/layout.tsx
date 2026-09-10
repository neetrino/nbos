'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { CLIENTS_MODULE_NAV } from '@/features/clients/clients-module-nav';

/** Bottom breathing room so list/pagination is not flush with the shell edge. */
const CLIENTS_PAGE_CONTENT_BOTTOM_GAP = 'pb-8';

export default function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleHeroSlotProvider
      title="Clients"
      tabs={
        <PageHeroNavLinks
          items={CLIENTS_MODULE_NAV}
          ariaLabel="Clients sections"
          fullWidthOnMobile
        />
      }
      className="flex h-full min-h-0 flex-col gap-5 max-md:gap-3"
    >
      <div className={CLIENTS_PAGE_CONTENT_BOTTOM_GAP}>{children}</div>
    </ModuleHeroSlotProvider>
  );
}
