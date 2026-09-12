'use client';

import { useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { getSupportModuleNav } from '@/features/support/support-module-nav';
import type { SupportTranslator } from '@/features/support/support-message-keys';

export default function SupportLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('support') as SupportTranslator;

  const navItems = useMemo(() => getSupportModuleNav(t), [t]);

  return (
    <ModuleHeroSlotProvider
      title={t('title')}
      tabs={
        <PageHeroNavLinks items={navItems} ariaLabel={t('nav.ariaLabel')} fullWidthOnMobile />
      }
      className="flex h-full min-h-0 flex-col gap-5 max-md:gap-3"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
