'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { CrmHeaderContextLayout } from '@/features/crm/components/CrmHeaderContextLayout';
import { CRM_MODULE_NAV, CRM_MODULE_NAV_LABEL_KEYS } from '@/features/crm/crm-module-nav';

export default function CrmLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('crm');
  const navItems = CRM_MODULE_NAV.map((item) => ({
    ...item,
    label: t(CRM_MODULE_NAV_LABEL_KEYS[item.href as keyof typeof CRM_MODULE_NAV_LABEL_KEYS]),
  }));

  return (
    <>
      <CrmHeaderContextLayout />
      <ModuleHeroSlotProvider
        title={t('nav.moduleTitle')}
        tabs={
          <PageHeroNavLinks
            items={navItems}
            ariaLabel={t('nav.sectionsAria')}
            className="max-md:hidden"
          />
        }
        className="flex h-full min-h-0 w-full min-w-0 flex-col gap-5"
      >
        {children}
      </ModuleHeroSlotProvider>
    </>
  );
}
