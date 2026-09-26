'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import {
  isMyCompanyNavVisible,
  MY_COMPANY_NAV,
} from '@/features/hr/constants/my-company-module-nav';
import { usePermission } from '@/lib/permissions';

export default function MyCompanyLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('hr');
  const { can } = usePermission();
  const items = MY_COMPANY_NAV.filter((item) => isMyCompanyNavVisible(item.gate, can)).map(
    (item) => ({
      href: item.href,
      icon: item.icon,
      exactMatch: item.exactMatch,
      matchHrefs: item.matchHrefs,
      label: t(item.labelKey),
    }),
  );

  return (
    <ModuleHeroSlotProvider
      title={t('companyNav.title')}
      tabs={<PageHeroNavLinks items={items} ariaLabel={t('companyNav.aria')} />}
      className="flex h-full min-h-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
