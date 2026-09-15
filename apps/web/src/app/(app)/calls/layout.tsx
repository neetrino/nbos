'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModuleHeroSlotProvider } from '@/components/shared/page-hero';

export default function CallsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('crm');
  return (
    <ModuleHeroSlotProvider
      title={t('calls.centerTitle')}
      className="flex h-full min-h-0 w-full min-w-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
