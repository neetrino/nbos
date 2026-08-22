'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { AI_ADMIN_NAV } from '@/features/ai-admin/constants';

export default function AiAgentsLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleHeroSlotProvider
      title="AI & Agents"
      tabs={<PageHeroNavLinks items={AI_ADMIN_NAV} ariaLabel="AI & Agents sections" />}
      className="flex h-full min-h-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
