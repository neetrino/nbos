'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider } from '@/components/shared/page-hero';
import { MarketingHeaderContextLayout } from '@/features/marketing/components/MarketingHeaderContextLayout';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingHeaderContextLayout />
      <ModuleHeroSlotProvider
        linkToHeaderTab
        title="Marketing"
        className="flex h-full min-h-0 flex-col gap-5"
      >
        {children}
      </ModuleHeroSlotProvider>
    </>
  );
}
