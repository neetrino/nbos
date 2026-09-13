'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModuleHeroSlotProvider } from '@/components/shared/page-hero';
import { MarketingHeaderContextLayout } from '@/features/marketing/components/MarketingHeaderContextLayout';

/** Bottom breathing room so page content is not flush with the shell edge. */
const MARKETING_PAGE_CONTENT_BOTTOM_GAP = 'pb-8';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('marketing');

  return (
    <>
      <MarketingHeaderContextLayout />
      <ModuleHeroSlotProvider
        linkToHeaderTab
        title={t('title')}
        className="flex h-full min-h-0 flex-col gap-5"
      >
        <div className={MARKETING_PAGE_CONTENT_BOTTOM_GAP}>{children}</div>
      </ModuleHeroSlotProvider>
    </>
  );
}
