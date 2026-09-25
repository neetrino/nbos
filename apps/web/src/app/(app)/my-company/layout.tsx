'use client';

import type { ReactNode } from 'react';
import { BadgeDollarSign, ClipboardList, Layers, ListChecks, Percent, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_RULES_MODULE, FUNCTION_CATALOG_MODULE } from '@nbos/shared';
import { ModuleHeroSlotProvider, PageHeroNavLinks } from '@/components/shared/page-hero';
import { MY_COMPANY_MODULE_NAV } from '@/features/hr/constants/my-company-module-nav';
import { usePermission } from '@/lib/permissions';

export default function MyCompanyLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('hr');
  const { can } = usePermission();
  const canOpenHr = can('VIEW', 'COMPANY');
  const canOpenCoreFunction =
    can('VIEW', FUNCTION_CATALOG_MODULE) || can('VIEW', DELIVERY_COMPENSATION_RULES_MODULE);
  const items = [
    ...(canOpenHr ? MY_COMPANY_MODULE_NAV : []).map((item) => ({
      href: item.href,
      icon: item.icon,
      exactMatch: item.exactMatch,
      label: t(item.labelKey),
    })),
    ...(canOpenHr && can('VIEW', 'FINANCE_SALARY')
      ? [
          {
            href: '/my-company/compensation',
            icon: BadgeDollarSign,
            label: t('companyNav.salaries'),
          },
        ]
      : []),
    ...(canOpenHr
      ? [
          {
            href: '/my-company/bonus-policies',
            icon: Percent,
            label: t('companyNav.bonus'),
            matchHrefs: ['/my-company/bonus-policies', '/my-company/sales-bonus-policies'],
          },
          {
            href: '/my-company/kpi',
            icon: Target,
            label: t('companyNav.kpi'),
            matchHrefs: ['/my-company/kpi', '/my-company/kpi-policies'],
          },
        ]
      : []),
    ...(can('VIEW', 'CHECKLIST_TEMPLATES')
      ? [
          {
            href: '/my-company/checklist-templates',
            icon: ListChecks,
            label: t('companyNav.checklists'),
            matchHrefs: ['/my-company/checklist-templates', '/my-company/checklist-stage-rules'],
          },
        ]
      : []),
    ...(canOpenHr
      ? [
          {
            href: '/my-company/sop',
            icon: ClipboardList,
            label: t('companyNav.sop'),
          },
        ]
      : []),
    ...(canOpenCoreFunction
      ? [
          {
            href: '/my-company/delivery-norms',
            icon: Layers,
            exactMatch: true,
            label: t('companyNav.coreFunction'),
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
