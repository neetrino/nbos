'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { SUPPORT_MODULE_NAV } from '@/features/support/support-module-nav';

export default function SupportLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleHeroSlotProvider
      title="Support"
      tabs={<PageHeroNavLinks items={SUPPORT_MODULE_NAV} ariaLabel="Support sections" />}
      className="flex h-full min-h-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
