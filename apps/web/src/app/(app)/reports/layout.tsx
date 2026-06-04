'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider } from '@/components/shared/page-hero';

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleHeroSlotProvider
      linkToHeaderTab
      title="Reports"
      className="flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
