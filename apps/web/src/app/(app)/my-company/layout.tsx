'use client';

import type { ReactNode } from 'react';
import { Library, Ruler } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_RULES_MODULE, FUNCTION_CATALOG_MODULE } from '@nbos/shared';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { MY_COMPANY_MODULE_NAV } from '@/features/hr/constants/my-company-module-nav';
import { usePermission } from '@/lib/permissions';

export default function MyCompanyLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('hr');
  const { can } = usePermission();
  const canOpenHr = can('VIEW', 'COMPANY');
  const canOpenCatalog = can('VIEW', FUNCTION_CATALOG_MODULE);
  const canOpenDeliveryNorms = can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const items = [
    ...(canOpenHr ? MY_COMPANY_MODULE_NAV : []).map((item) => ({
      href: item.href,
      icon: item.icon,
      exactMatch: item.exactMatch,
      label: t(item.labelKey),
    })),
    ...(canOpenCatalog
      ? [
          {
            href: '/my-company/function-catalog',
            icon: Library,
            exactMatch: true,
            label: t('functionCatalog.title'),
          },
        ]
      : []),
    ...(canOpenDeliveryNorms
      ? [
          {
            href: '/my-company/delivery-norms',
            icon: Ruler,
            exactMatch: true,
            label: t('deliveryNorms.title'),
          },
        ]
      : []),
  ];

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
