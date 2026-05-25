'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { MARKETING_MODULE_NAV } from '@/features/marketing/marketing-module-nav';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleHeroSlotProvider
      title="Marketing"
      tabs={<PageHeroNavLinks items={MARKETING_MODULE_NAV} ariaLabel="Marketing sections" />}
      className="flex h-full min-h-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
